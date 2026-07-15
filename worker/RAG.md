# RAG design notes — decisions, failure analysis, and evaluation

This documents *why* the chatbot's retrieval is built the way it is. The pipeline
itself is in [`src/index.ts`](src/index.ts); the editable copy is in
[`src/prompts.ts`](src/prompts.ts); the eval is
[`scripts/rag-eval.mjs`](../scripts/rag-eval.mjs).

## Right-sizing: why RAG at all?

The bio/about/project facts alone are small — on the order of **~13k tokens** —
and for *that* slice, retrieval isn't strictly required: context-stuffing would
be simpler and immune to retrieval misses. The identity-core facts are therefore
**pinned** into the system prompt (see below) so they never depend on retrieval.

RAG earns its place on the part that *doesn't* fit: the **full write-up bodies**.
The ingester now chunks the complete text of every write-up (not just summaries),
which takes the corpus to **~350 chunks** — a real technical knowledge base
(Docker, Linux, GPU/hardware, RAG, MLOps, PyTorch, …) the bot can answer *from*
instead of only linking to. At that size, hybrid search + rerank is warranted,
not decorative.

So the architecture is deliberately split:

- **Pinned in-context:** identity core (projects, publication, roles, contact) —
  highest-priority, tiny, must never be missed.
- **Retrieved:** write-up bodies + project detail pages — large, long-tail, where
  retrieval genuinely beats stuffing.

This is the honest right-sizing: stuff what's small and critical, retrieve what's
large and deep. The eval below gates the seam between them.

## Failure analysis: projects and publications got buried

**Symptom.** After a past experiment that ingested *all write-up bodies*, the bot
stopped surfacing Ashim's projects and publications — the highest-priority facts.

**Root cause.** Retrieval was flat and type-blind: it pulled the global top-K by
similarity. Three things compounded:

- **Dilution.** 11 long write-ups became dozens–hundreds of chunks; projects were
  a handful and publications a *single* chunk. The top-12 filled with write-up
  chunks; the lone publications chunk never made the cut.
- **Semantic bleed.** "What has Ashim built?" embeds closer to a write-up
  paragraph *about* ML than to a terse "Project:" card. Embeddings can't tell
  "content Ashim wrote about X" from "thing Ashim built doing X."
- **Rerank can't rescue what retrieval dropped.** The reranker only reorders the
  candidate set; if projects never entered it, they're already gone.
- **The prompt made it worse.** The old rule said *"ground every answer in the
  search results,"* so even though the persona mentioned projects, the bot
  deferred to the (wrong) retrieved chunks.

**Fix — two layers of defense:**

1. **Pinned identity core.** Projects, publication, roles, and contact live
   directly in the system prompt (`IDENTITY_CORE` in `prompts.ts`), with the
   grounding rule relaxed so those facts are answered directly while *depth*
   still requires retrieval. Core facts can't fall out of a window they were
   never subject to.
2. **Type-aware retrieval.** `guaranteeTypes()` in `index.ts` reserves a
   candidate slot for the best chunk of each priority type (`project`, `about`,
   `bio`) so identity chunks always reach the reranker even when write-up chunks
   dominate the raw similarity ranking. Because the reranker is query-aware, it
   still drops those chunks when they're irrelevant — so this lifts recall
   *without* forcing off-topic identity chunks into unrelated answers.

This was done *after* full bodies pushed the corpus to ~350 chunks (writeup ≈
25× project), i.e. once the eval could actually demonstrate the dilution — not
speculatively.

## Evaluation: retrieval-recall gate

`npm run eval` runs a fixed golden set
([`scripts/rag-eval.golden.json`](../scripts/rag-eval.golden.json)) against the
Worker's `/retrieve` endpoint (hybrid retrieval, no generation — cheap and
deterministic) and reports:

- **recall@candidate** — expected source made the post-fusion candidate set.
- **recall@context** — expected source survived rerank (what `/chat` grounds on).

The gap localizes the weak link (retrieval vs. rerank). The run exits non-zero if
`recall@context` drops below `THRESHOLD` (default 0.9), so it can gate a
re-ingest or deploy. Its main job: **catch the buried-projects regression
automatically** the moment full write-up bodies start crowding out identity
sources — the failure that was previously found by hand.

With `GROUNDING=1`, a second pass calls `/chat` and checks that the *generated
answer* actually contains the expected content (golden `expectText`) — end-to-end
answer quality, not just retrieval. It costs generation tokens, so it's opt-in.

```bash
# retrieval recall only (cheap, default)
CHAT_API_URL=https://<worker>.workers.dev INGEST_SECRET=<secret> npm run eval
# + answer grounding
GROUNDING=1 CHAT_API_URL=... INGEST_SECRET=... npm run eval
```

Each run is reported to the Worker (`/eval/report` -> D1 `eval_runs`) and the
**latest run shows on the `/ops` RAG tab** with a PASS/FAIL gate badge — the
eval is visible on the dashboard, not just in a terminal.

## Observability

Every `/chat` request is traced to D1 and surfaced on the on-site `/ops`
dashboard (tokens, cost per component, latency, retrieval-quality metrics, and
the latest eval gate), with optional Langfuse tracing. See [`README.md`](README.md).
