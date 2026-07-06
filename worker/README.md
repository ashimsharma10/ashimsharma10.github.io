# Ashim Chatbot Worker

Cloudflare Worker that powers the agentic-RAG chatbot on the site.

For each question, Claude first decides (via **tool use**) whether it needs to
search. If so, the Worker runs **hybrid retrieval** — Vectorize (semantic) +
D1 FTS5 (BM25 keyword), fused with Reciprocal Rank Fusion — **Haiku-reranks** the
candidates, feeds them back as a tool result, and streams Claude's grounded
answer as Server-Sent Events. Every request is **traced to D1** (tokens, cost,
latency) for the `/ops` dashboard. The Anthropic API key lives only here.

## One-time setup

```bash
cd worker
npm install

# 1) Vector index (768 dims to match bge-base-en-v1.5)
npx wrangler vectorize create ashim-knowledge --dimensions=768 --metric=cosine

# 2) D1 database (keyword search + traces). Copy the printed database_id into
#    wrangler.toml (database_id = "..."), then apply the schema:
npx wrangler d1 create ashim-chatbot
npx wrangler d1 execute ashim-chatbot --file=./schema.sql --remote

# 3) Secrets
npx wrangler secret put ANTHROPIC_API_KEY   # your Anthropic API key
npx wrangler secret put INGEST_SECRET       # any long random string
npx wrangler secret put OPS_TOKEN           # gates the /ops dashboard

# 4) Deploy
npx wrangler deploy
```

After deploy, note the Worker URL (e.g. `https://ashim-chatbot.<subdomain>.workers.dev`).

## Configure the site

Set where the site is built (GitHub Actions repo variable + local `.env.local`):

- `NEXT_PUBLIC_CHAT_API_URL` = the Worker URL (used by the chat widget and `/ops`)

For production, tighten CORS by setting `ALLOWED_ORIGIN` in `wrangler.toml` to
`https://ashimsharma10.github.io` and redeploying.

## Ingest the knowledge base

From the repo root (not this folder). This upserts into **both** Vectorize and D1:

```bash
CHAT_API_URL="https://ashim-chatbot.<subdomain>.workers.dev" \
INGEST_SECRET="<same value you set above>" \
npm run ingest
```

Verify:

```bash
npx wrangler vectorize info ashim-knowledge
npx wrangler d1 execute ashim-chatbot --remote --command "SELECT COUNT(*) FROM chunks;"
```

## Observability — the /ops dashboard

Visit `https://<your-site>/ops`, enter the `OPS_TOKEN` value, and you'll see:

- **Overview**: total messages, tokens, estimated cost, avg latency, search rate.
- **Traces**: recent requests with per-request latency, tokens, and cost.

Data comes from the D1 `traces` table (written on every `/chat`). Live logs are
also available with `npx wrangler tail`. Cost is estimated from the `PRICING`
table in `src/index.ts` — update it to match current Anthropic pricing.

## Local development

```bash
cd worker
# put secrets in worker/.dev.vars (gitignored):
#   ANTHROPIC_API_KEY=...
#   INGEST_SECRET=...
#   OPS_TOKEN=...
npx wrangler dev
```

`wrangler dev` uses the *remote* Vectorize + Workers AI + D1 bindings by default,
so data ingested against the deployed resources is visible locally too.

## Models

- Embeddings: `@cf/baai/bge-base-en-v1.5` (Workers AI, 768-dim)
- Reranking / generation: `claude-haiku-4-5-20251001` (override via `RERANK_MODEL`
  / `CHAT_MODEL`; swap to `claude-sonnet-5` for higher quality). Disable reranking
  with `ENABLE_RERANK = "false"`.
