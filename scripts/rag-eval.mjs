#!/usr/bin/env node
/**
 * RAG retrieval-recall + answer-grounding eval, with a regression gate.
 *
 * Retrieval recall (always): runs a fixed golden set (rag-eval.golden.json)
 * against the Worker's /retrieve endpoint — the same hybrid pipeline /chat uses
 * (vector + keyword -> RRF fuse -> Haiku rerank), retrieval only, no generation.
 * For each question it checks whether an expected source was retrieved:
 *
 *   recall@candidate  — expected source made the post-fusion candidate set
 *   recall@context    — expected source survived rerank (what /chat grounds on)
 *
 * The gap localizes whether retrieval or rerank is the weak link. The run exits
 * non-zero if recall@context < THRESHOLD, so it can gate a re-ingest or deploy
 * (e.g. catches the buried-projects regression the moment full write-up bodies
 * start crowding out projects/publications).
 *
 * Answer grounding (opt-in, GROUNDING=1): additionally calls /chat and checks
 * that the *generated answer* contains the expected content (golden `expectText`).
 * This costs generation tokens, so it's off by default. It measures end-to-end
 * answer quality, not just retrieval.
 *
 * Results are reported (best-effort) to the Worker's /eval/report so the latest
 * run shows on the /ops RAG tab.
 *
 * Usage (from repo root):
 *   CHAT_API_URL=https://<worker>.workers.dev INGEST_SECRET=<secret> npm run eval
 *   GROUNDING=1 CHAT_API_URL=... INGEST_SECRET=... npm run eval   # + answer grounding
 *
 * Env options:
 *   THRESHOLD=0.9   minimum recall@context to pass (default 0.9)
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CHAT_API_URL = (process.env.CHAT_API_URL || '').replace(/\/$/, '')
const INGEST_SECRET = process.env.INGEST_SECRET || ''
const THRESHOLD = Number(process.env.THRESHOLD || '0.9')
const DO_GROUNDING = !!process.env.GROUNDING

if (!CHAT_API_URL || !INGEST_SECRET) {
  console.error('Missing env. Set CHAT_API_URL and INGEST_SECRET.')
  process.exit(2)
}

const here = dirname(fileURLToPath(import.meta.url))
const golden = JSON.parse(await readFile(join(here, 'rag-eval.golden.json'), 'utf8'))

const norm = (s) => (s || '').toLowerCase()
const hit = (sources, expectAny) =>
  sources.some((s) => {
    const hay = `${norm(s.title)} ${norm(s.url)} ${norm(s.type)}`
    return expectAny.some((e) => hay.includes(e.toLowerCase()))
  })

/** Call /chat and collect the streamed answer text + cited sources from the SSE. */
async function chat(question) {
  const res = await fetch(`${CHAT_API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
  })
  if (!res.ok) throw new Error(`/chat ${res.status}`)
  const raw = await res.text() // buffers the full SSE stream
  let answer = ''
  let sources = []
  for (const line of raw.split('\n')) {
    const s = line.trim()
    if (!s.startsWith('data:')) continue
    try {
      const evt = JSON.parse(s.slice(5).trim())
      if (evt.text) answer += evt.text
      if (evt.sources) sources = evt.sources
    } catch {
      /* keepalive / non-JSON line */
    }
  }
  return { answer, sources }
}

// --- Retrieval recall (always) ---
let candOk = 0
let ctxOk = 0
const rows = []
for (const c of golden) {
  const res = await fetch(`${CHAT_API_URL}/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
    body: JSON.stringify({ query: c.question }),
  })
  if (!res.ok) {
    console.error(`Request failed (${res.status}) for: ${c.question}`)
    process.exit(2)
  }
  const data = await res.json()
  const inCand = hit(data.candidates || [], c.expectAny)
  const inCtx = hit(data.reranked || [], c.expectAny)
  if (inCand) candOk++
  if (inCtx) ctxOk++
  rows.push({ q: c.question, cand: inCand, ctx: inCtx, top: data.reranked?.[0]?.title || '—' })
}

const n = golden.length
const pct = (x, d = n) => `${((x / d) * 100).toFixed(0)}%`

console.log('\nRAG retrieval-recall eval')
console.log('='.repeat(74))
for (const r of rows) {
  // ✓ retrieved & kept · ~ retrieved but dropped by rerank · ✗ missed entirely
  const mark = r.ctx ? '✓' : r.cand ? '~' : '✗'
  console.log(`${mark}  ${r.q}`)
  if (!r.ctx) console.log(`      top result was: ${r.top}`)
}
console.log('='.repeat(74))
console.log(`recall@candidate (post-fusion): ${candOk}/${n}  ${pct(candOk)}`)
console.log(`recall@context   (post-rerank): ${ctxOk}/${n}  ${pct(ctxOk)}`)

// --- Answer grounding (opt-in) ---
let groundOk = 0
let groundTotal = 0
if (DO_GROUNDING) {
  console.log('\nAnswer grounding (GROUNDING=1, hits /chat)')
  console.log('='.repeat(74))
  for (const c of golden) {
    if (!Array.isArray(c.expectText) || c.expectText.length === 0) continue
    groundTotal++
    let ok = false
    try {
      const { answer } = await chat(c.question)
      const hay = norm(answer)
      ok = c.expectText.some((e) => hay.includes(e.toLowerCase()))
    } catch (e) {
      console.error(`  /chat failed for "${c.question}": ${e.message}`)
    }
    if (ok) groundOk++
    console.log(`${ok ? '✓' : '✗'}  ${c.question}`)
  }
  console.log('='.repeat(74))
  console.log(
    `answer grounding: ${groundOk}/${groundTotal}  ${groundTotal ? pct(groundOk, groundTotal) : 'n/a'}`
  )
}

const passed = ctxOk / n >= THRESHOLD
console.log(
  `\ngate: recall@context >= ${(THRESHOLD * 100).toFixed(0)}%  ->  ${passed ? 'PASS' : 'FAIL'}\n`
)

// --- Report to /ops (best-effort; never fails the eval) ---
try {
  await fetch(`${CHAT_API_URL}/eval/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
    body: JSON.stringify({
      total: n,
      candOk,
      ctxOk,
      groundOk: DO_GROUNDING ? groundOk : null,
      groundTotal: DO_GROUNDING ? groundTotal : null,
      threshold: THRESHOLD,
      passed,
    }),
  })
} catch {
  /* reporting is optional — the dashboard just won't show this run */
}

if (!passed) {
  console.error('Regression gate FAILED: retrieval is missing must-answer sources.')
  process.exit(1)
}
