/**
 * Build the chatbot knowledge base and push it to the Cloudflare Worker's
 * /ingest endpoint (which embeds + upserts into Vectorize).
 *
 * Curated corpus (NOT the whole site):
 *   - Bio            : data/authors/default.mdx
 *   - About sections : data/aboutData.js (experience, education, skills,
 *                      publications, certifications, conferences)
 *   - Project cards  : data/projectsData.ts
 *   - Project details: <article> text of out/projects/<slug>/index.html
 *                      (requires a fresh `npm run build`)
 *   - Write-ups      : summary card (title, date, tags, summary, link) PLUS the
 *                      full body, chunked, so the bot can answer deep questions
 *                      from the actual content, not just link out.
 *
 * By default the Worker's /purge endpoint is called first so stale chunks
 * never linger. Pass --no-purge to skip that (upsert-only).
 *
 * Usage (from repo root):
 *   CHAT_API_URL=https://<worker>.workers.dev \
 *   INGEST_SECRET=<secret> \
 *   npm run ingest [-- --no-purge]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import aboutData from '../data/aboutData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SITE_URL = 'https://ashimsharma10.github.io'

const CHAT_API_URL = (process.env.CHAT_API_URL || '').replace(/\/$/, '')
const INGEST_SECRET = process.env.INGEST_SECRET || ''
if (!CHAT_API_URL || !INGEST_SECRET) {
  console.error('Missing env. Set CHAT_API_URL and INGEST_SECRET.')
  process.exit(1)
}

// ~2000 chars ≈ 500 tokens, which fills bge-base's 512-token window without
// wasting most of a chunk to truncation, and keeps the total chunk count under
// the Workers AI free-tier embedding rate limit (~300/window) so a full ingest
// completes in one pass.
const CHUNK_SIZE = 2000 // chars
const CHUNK_OVERLAP = 250

/** Split text into overlapping chunks on paragraph/sentence boundaries. */
function chunk(text) {
  const clean = text.replace(/\r/g, '').trim()
  if (clean.length <= CHUNK_SIZE) return [clean]
  const paras = clean.split(/\n{2,}/)
  const chunks = []
  let buf = ''
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > CHUNK_SIZE && buf) {
      chunks.push(buf.trim())
      buf = buf.slice(Math.max(0, buf.length - CHUNK_OVERLAP)) + '\n\n' + p
    } else {
      buf = buf ? buf + '\n\n' + p : p
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks
}

/** Strip MDX noise (imports/JSX-ish lines) that add no semantic value. */
function stripMdx(body) {
  return body
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Markdown body -> clean prose for embedding. Drops the anchor-link table of
 * contents and fenced code blocks (both are noise that dilutes semantic search;
 * the surrounding prose carries the meaning), flattens links/emphasis/tables to
 * their text, and keeps heading text. Used to ingest full write-up bodies.
 */
function mdToText(md) {
  return stripMdx(md)
    .replace(/^\s*\d+\.\s*\[[^\]]+\]\(#[^)]*\)\s*$/gm, '') // TOC anchor entries
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/^#{1,6}\s+/gm, '') // heading markers (keep text)
    .replace(/^\s*>\s?/gm, '') // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '') // bullet markers
    .replace(/\*\*|__|~~|\*|_/g, '') // emphasis
    .replace(/<[^>]+>/g, ' ') // stray HTML/JSX tags
    .replace(/\|/g, ' ') // table pipes
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  larr: '←',
  rarr: '→',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  mdash: '—',
  ndash: '–',
  hellip: '…',
}

/** Dependency-free HTML → text: drop script/style, keep block breaks, decode entities. */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|li|h[1-6]|div|section|figure|figcaption)>/gi, '\n\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Extract the readable text of the first <article> in a built HTML page.
 * Fails loudly when the page hasn't been built (or is older than its source)
 * so the knowledge base can never silently miss content.
 */
function articleText(htmlPath, sourcePath) {
  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing built page: ${htmlPath}\nRun \`EXPORT=1 npm run build\` first.`)
    process.exit(1)
  }
  if (sourcePath && fs.existsSync(sourcePath)) {
    const htmlM = fs.statSync(htmlPath).mtimeMs
    const srcM = fs.statSync(sourcePath).mtimeMs
    if (htmlM < srcM) {
      console.error(
        `Stale built page: ${htmlPath} is older than ${sourcePath}.\nRun \`EXPORT=1 npm run build\` first.`
      )
      process.exit(1)
    }
  }
  const html = fs.readFileSync(htmlPath, 'utf8')
  const m = html.match(/<article[\s>][\s\S]*?<\/article>/i)
  if (!m) {
    console.error(`No <article> found in ${htmlPath} — cannot extract project details.`)
    process.exit(1)
  }
  const text = stripHtml(m[0])
  // Drop pure-navigation lines that survive extraction.
  return text
    .split('\n')
    .filter((line) => !/^(←\s*)?Back( to Projects)?$/i.test(line.trim()))
    .filter((line) => line.trim() !== 'View on GitHub')
    .join('\n')
    .trim()
}

const items = []

// --- Bio ---
{
  const raw = fs.readFileSync(path.join(ROOT, 'data/authors/default.mdx'), 'utf8')
  const { data, content } = matter(raw)
  const text =
    `Ashim Sharma — ${data.occupation || ''}. Email: ${data.email || ''}. ` +
    `LinkedIn: ${data.linkedin || ''}. GitHub: ${data.github || ''}.\n\n${stripMdx(content)}`
  items.push({
    id: 'about-bio',
    text,
    metadata: { title: 'About Ashim', url: `${SITE_URL}/about/`, type: 'bio' },
  })
}

// --- About sections (shared with layouts/AuthorLayout.tsx) ---
{
  const { experience, education, skillGroups, publications, certifications, conferences } =
    aboutData
  const aboutUrl = (hash) => `${SITE_URL}/about/#${hash}`

  experience.forEach((job, i) => {
    const bullets = job.bullets.map((b) => `- ${stripHtml(b)}`).join('\n')
    items.push({
      id: `about-experience-${i}`,
      text:
        `Work experience: ${job.role} at ${job.company} (${job.period}, ${job.location}).\n` +
        bullets,
      metadata: {
        title: `Experience: ${job.role} at ${job.company}`,
        url: aboutUrl('experience'),
        type: 'about',
      },
    })
  })

  items.push({
    id: 'about-education',
    text:
      `Education:\n` +
      education
        .map(
          (e) =>
            `- ${e.degree}, ${e.school} (${e.period}, ${e.location})${e.note ? ` — ${e.note}` : ''}`
        )
        .join('\n'),
    metadata: { title: 'Education', url: aboutUrl('education'), type: 'about' },
  })

  items.push({
    id: 'about-skills',
    text:
      `Skills and technologies Ashim works with:\n` +
      skillGroups.map((g) => `- ${g.label}: ${g.value}`).join('\n'),
    metadata: { title: 'Skills', url: aboutUrl('skills'), type: 'about' },
  })

  items.push({
    id: 'about-publications',
    text:
      `Publications (peer-reviewed research papers Ashim has published):\n` +
      publications
        .map((p) => {
          const citation = p.citationParts.map((part) => part.text).join('')
          return `- ${citation} ${p.venue}${p.url ? ` Paper: ${p.url}` : ''}`
        })
        .join('\n'),
    metadata: { title: 'Publications', url: aboutUrl('publications'), type: 'about' },
  })

  items.push({
    id: 'about-certifications',
    text:
      `Certifications Ashim holds:\n` +
      certifications
        .map((c) => `- ${c.title} — ${c.issuer}${c.url ? ` (verify: ${c.url})` : ''}`)
        .join('\n'),
    metadata: { title: 'Certifications', url: aboutUrl('certifications'), type: 'about' },
  })

  items.push({
    id: 'about-conferences',
    text:
      `Conferences Ashim has attended or is attending:\n` +
      conferences.map((c) => `- ${c.name} — ${c.detail}`).join('\n'),
    metadata: { title: 'Conferences', url: aboutUrl('conferences'), type: 'about' },
  })
}

// --- Projects: cards from projectsData.ts + detail pages from built HTML ---
{
  const src = fs.readFileSync(path.join(ROOT, 'data/projectsData.ts'), 'utf8')
  // Match each { ... } object literal in the array and pull known fields.
  const objects = src.match(/\{[^}]*?title:[\s\S]*?\}/g) || []
  const projects = objects
    .map((obj) => ({
      title: (obj.match(/title:\s*'([^']*)'/) || [])[1],
      description: (obj.match(/description:\s*\n?\s*'([^']*)'/) || [])[1],
      href: (obj.match(/href:\s*'([^']*)'/) || [])[1],
    }))
    .filter((p) => p.title)

  // The regex parse is inherently fragile (e.g. an unescaped quote breaks a
  // field) — fail loudly rather than silently shipping a partial corpus.
  if (projects.length < 3 || projects.some((p) => !p.description || !p.href)) {
    console.error(
      `projectsData.ts parse failed: got ${projects.length} projects, ` +
        `some missing description/href. Fix the parser or the data file.`
    )
    process.exit(1)
  }

  for (const p of projects) {
    const slug = p.href
      .split('/')
      .filter(Boolean)
      .pop()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
    const url = p.href.startsWith('http') ? p.href : `${SITE_URL}${p.href}`
    items.push({
      id: `project-${slug}`,
      text: `Project: ${p.title}. ${p.description} Link: ${url}`,
      metadata: { title: `Project: ${p.title}`, url, type: 'project' },
    })

    // Detail pages exist only for internal project routes.
    if (!p.href.startsWith('/projects/')) continue
    const pageSlug = p.href.split('/').filter(Boolean).pop()
    const detailText = articleText(
      path.join(ROOT, 'out/projects', pageSlug, 'index.html'),
      path.join(ROOT, 'app/projects', pageSlug, 'page.tsx')
    )
    chunk(detailText).forEach((part, i) => {
      items.push({
        id: `project-detail-${slug}-${i}`,
        text: `From the "${p.title}" project page:\n${part}`,
        metadata: {
          title: `Project: ${p.title}`,
          url: `${url}/`.replace(/\/+$/, '/'),
          type: 'project',
        },
      })
    })
  }
}

// --- Write-ups: summary card + full body (chunked) for deep Q&A ---
{
  const blogDir = path.join(ROOT, 'data/blog')
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'))
  const writeups = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf8')
    const { data, content } = matter(raw)
    if (data.draft === true) continue
    const slug = file.replace(/\.mdx$/, '')
    const url = `${SITE_URL}/write-up/${slug}/`
    const title = data.title || slug
    const date = data.date ? new Date(data.date).toISOString().slice(0, 10) : ''
    const tags = Array.isArray(data.tags) ? data.tags.join(', ') : ''
    const summary = data.summary || ''
    writeups.push({ slug, url, title, date, tags, summary })

    // Summary card — the high-level overview + link (answers "what is X about").
    items.push({
      id: `writeup-${slug}`,
      text:
        `Write-up: "${title}"${date ? ` (published ${date})` : ''}.` +
        `${tags ? ` Topics: ${tags}.` : ''}\n${summary}\nFull write-up: ${url}`,
      metadata: { title, url, type: 'writeup' },
    })

    // Full body, chunked — lets the bot answer deep questions from the actual
    // content instead of only linking out. Client-rendered posts (e.g. the
    // interactive Riemann piece) have little prose in source and simply yield
    // no body chunks, which is fine.
    const body = mdToText(content)
    chunk(body).forEach((part, i) => {
      items.push({
        id: `writeup-${slug}-body-${i}`,
        text: `From the write-up "${title}":\n${part}`,
        metadata: { title, url, type: 'writeup' },
      })
    })
  }

  items.push({
    id: 'writing-overview',
    text:
      `Ashim has published ${writeups.length} technical write-ups on his site:\n` +
      writeups.map((w) => `- "${w.title}" (${w.url}) — ${w.summary}`).join('\n'),
    metadata: {
      title: "Ashim's write-ups",
      url: `${SITE_URL}/write-up/`,
      type: 'writeup',
    },
  })
}

// --- Sanity checks + summary before touching the remote KB ---
const counts = {}
for (const it of items) counts[it.metadata.type] = (counts[it.metadata.type] || 0) + 1
console.log(`Prepared ${items.length} chunks:`, counts)
if (items.length < 25) {
  console.error(`Only ${items.length} chunks built — expected >= 25. Aborting before purge.`)
  process.exit(1)
}

// DRY_RUN=1 prints the full corpus and exits without touching the remote KB.
if (process.env.DRY_RUN) {
  for (const it of items) {
    console.log(`\n=== ${it.id} (${it.metadata.type}) → ${it.metadata.url}\n${it.text}`)
  }
  process.exit(0)
}

// --- Purge stale chunks (default), then upload ---
if (!process.argv.includes('--no-purge')) {
  const res = await fetch(`${CHAT_API_URL}/purge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${INGEST_SECRET}` },
  })
  if (!res.ok) {
    console.error(`Purge failed: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  const out = await res.json()
  console.log(`Purged ${out.purged} stale chunks.`)
} else {
  console.log('Skipping purge (--no-purge).')
}

console.log(`Uploading to ${CHAT_API_URL}/ingest ...`)

// Upload in batches. Each /ingest call embeds its batch via Workers AI, which
// throttles (5xx) under sustained bursty load. Single embeds are fine, so the
// cure is to keep batches small, PACE them so the sustained rate stays under the
// limit, and retry with long backoff to ride out any throttling window.
const BATCH = 10
const MAX_RETRIES = 5
const PACE_MS = 1500 // gap between batches — keeps us under the Workers AI burst limit
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const totalBatches = Math.ceil(items.length / BATCH)
let uploaded = 0
for (let i = 0; i < items.length; i += BATCH) {
  const batch = items.slice(i, i + BATCH)
  const n = i / BATCH + 1
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${CHAT_API_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${INGEST_SECRET}` },
      body: JSON.stringify(batch),
    })
    if (res.ok) {
      const out = await res.json()
      uploaded += out.upserted || batch.length
      console.log(`  batch ${n}/${totalBatches}: upserted ${out.upserted}`)
      break
    }
    const body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ')
    if (attempt > MAX_RETRIES) {
      console.error(`Batch ${n} failed after ${MAX_RETRIES} retries: ${res.status} ${body}`)
      process.exit(1)
    }
    const wait = Math.min(30000, 3000 * 2 ** (attempt - 1)) // 3s,6s,12s,24s,30s
    console.warn(`  batch ${n} got ${res.status}; retry ${attempt}/${MAX_RETRIES} in ${wait}ms`)
    await sleep(wait)
  }
  await sleep(PACE_MS)
}

console.log(`Done. Upserted ${uploaded} vectors into the knowledge base.`)
