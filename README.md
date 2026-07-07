# ashimsharma10.github.io

Personal portfolio and write-ups, with an AI assistant that answers questions about me using RAG over this site's content.

Built with Next.js, Tailwind CSS, and Contentlayer. Live at [ashimsharma10.github.io](https://ashimsharma10.github.io)

## Stack

- **Site**: Next.js (static export) + Tailwind + Contentlayer (MDX blog)
- **Chatbot backend**: Cloudflare Worker ([worker/](worker/))
- **Deploy**: GitHub Pages (site) + `wrangler deploy` (Worker)

## Chatbot infrastructure

Agentic hybrid RAG, fully on Cloudflare.

```mermaid
flowchart TD
    Q[question] --> D{Claude decides:<br/>search or answer directly}
    D -->|search| V[Vectorize<br/>semantic]
    D -->|search| K[D1 FTS5<br/>keyword]
    V --> F[RRF fuse → Haiku rerank<br/>top 6 chunks]
    K --> F
    F --> A[grounded answer<br/>streamed]
    D -->|no search| A
```

| Layer | Tech |
|---|---|
| Embeddings | `bge-base-en-v1.5` (768-dim, Workers AI) |
| Vector DB | Cloudflare Vectorize (cosine) |
| Keyword search | D1 (SQLite) + FTS5/BM25 |
| Generation / rerank | Claude Haiku / Sonnet |
| Tracing | D1 + optional Langfuse |

Knowledge base = bio, projects, and blog posts, chunked and embedded via `npm run ingest`. Setup in [worker/README.md](worker/README.md), live metrics at `/ops`.

## Development

```bash
npm install
npm run dev
```

See [worker/README.md](worker/README.md) to run the chatbot backend locally.
