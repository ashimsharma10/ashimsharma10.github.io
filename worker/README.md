# Ashim Chatbot Worker

Cloudflare Worker that powers the RAG chatbot on the site. It embeds questions
with Workers AI, retrieves knowledge from Vectorize, and streams a Claude answer
back to the browser as Server-Sent Events. The Anthropic API key lives only here.

## One-time setup

```bash
cd worker
npm install

# 1) Create the vector index (768 dims to match bge-base-en-v1.5)
npx wrangler vectorize create ashim-knowledge --dimensions=768 --metric=cosine

# 2) Set secrets
npx wrangler secret put ANTHROPIC_API_KEY   # your Anthropic API key
npx wrangler secret put INGEST_SECRET       # any long random string

# 3) Deploy
npx wrangler deploy
```

After deploy, note the Worker URL (e.g. `https://ashim-chatbot.<subdomain>.workers.dev`).

## Configure the site

Set these where the site is built:

- `NEXT_PUBLIC_CHAT_API_URL` = the Worker URL (used by `components/ChatWidget.tsx`)

For production also tighten CORS by setting `ALLOWED_ORIGIN` in `wrangler.toml`
to `https://ashimsharma10.github.io` and redeploying.

## Ingest the knowledge base

From the repo root (not this folder):

```bash
CHAT_API_URL="https://ashim-chatbot.<subdomain>.workers.dev" \
INGEST_SECRET="<same value you set above>" \
npm run ingest
```

Verify:

```bash
npx wrangler vectorize info ashim-knowledge
```

## Local development

```bash
cd worker
# put secrets in worker/.dev.vars (gitignored):
#   ANTHROPIC_API_KEY=...
#   INGEST_SECRET=...
npx wrangler dev
```

Note: `wrangler dev` uses the *remote* Vectorize + Workers AI bindings by
default, so ingestion done against the deployed index is visible locally too.

## Models

- Embeddings: `@cf/baai/bge-base-en-v1.5` (Workers AI, 768-dim)
- Reranking: `claude-haiku-4-5-20251001` — over-fetches 12 candidates from Vectorize,
  then Haiku picks the 6 most relevant to feed the answer. Override via `RERANK_MODEL`,
  or disable with `ENABLE_RERANK = "false"` in `wrangler.toml` (falls back to pure
  semantic order; also falls back automatically if the rerank call fails).
- Generation: `claude-haiku-4-5-20251001` (override via `CHAT_MODEL` in `wrangler.toml`;
  swap to `claude-sonnet-5` for higher quality)

## Observability

Each `/chat` request logs a JSON line (question, candidate/used counts, retrieval
latency). Watch it live with `npx wrangler tail`.
