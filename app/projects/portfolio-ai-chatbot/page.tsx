import { Metadata } from 'next'
import Image from '@/components/Image'
import ImageLightbox from '@/components/ImageLightbox'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'

export const metadata: Metadata = {
  title: 'Agentic RAG Chatbot',
  description:
    'A production agentic-RAG chatbot running on this portfolio: Claude tool-use search decisions, hybrid retrieval (Vectorize + D1 FTS5 fused with RRF, Haiku-reranked), SSE streaming from a Cloudflare Worker, and full LLM observability via D1 traces, a live /ops dashboard, and Langfuse.',
}

export default function PortfolioAiChatbotPage() {
  return (
    <SectionContainer>
      <ImageLightbox />
      <article>
        <div className="pt-4 pb-2">
          <Link
            href="/projects"
            className="text-sm text-[#047857] hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
          >
            &larr; Back
          </Link>
        </div>
        <div className="space-y-1 border-b border-gray-200 pb-5 text-center dark:border-gray-700">
          <h1 className="text-2xl leading-8 font-bold tracking-tight text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-12 dark:text-gray-100">
            Agentic RAG Chatbot
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Agentic RAG &middot; Cloudflare Edge &middot; LLM Observability
          </p>
          <div className="pt-3">
            <Link
              href="https://github.com/ashimsharma10/ashimsharma10.github.io/tree/main/worker"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-[#047857] hover:text-[#047857] dark:border-gray-600 dark:text-gray-300 dark:hover:border-[#34D399] dark:hover:text-[#34D399]"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none pt-4 pb-8">
          <div className="not-prose mb-8 rounded-lg border border-[#047857]/30 bg-[#d1fae5]/40 p-5 dark:border-[#34D399]/30 dark:bg-[#064e3b]/20">
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              <strong>This is not a demo. It is running on this site right now.</strong> Open the
              chat bubble on any page and ask about my work. Live metrics are on the{' '}
              <Link
                href="/ops"
                className="text-[#047857] underline hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
              >
                /ops dashboard
              </Link>
              , and the source lives in the{' '}
              <Link
                href="https://github.com/ashimsharma10/ashimsharma10.github.io/tree/main/worker"
                className="text-[#047857] underline hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
              >
                worker/ folder
              </Link>{' '}
              of this site&apos;s repository.
            </p>
          </div>

          <h2>What it is</h2>
          <p>
            A production RAG chatbot that answers questions about me, grounded in this site&apos;s
            content: bio, experience, projects, publications, and the full text of every write-up.
            It is <em>agentic</em>: Claude holds a <code>search_knowledge_base</code> tool and
            decides per question whether to search or answer directly, then streams the answer token
            by token. The whole backend is one Cloudflare Worker at the edge, and the project covers
            the full lifecycle of an LLM system: retrieval design, evaluation, cost and latency
            tracking, and deployment.
          </p>

          <h2>Architecture</h2>
          <div className="not-prose mt-2 mb-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700">
              <Image
                alt="Pipeline: question goes to Claude, which decides via tool use whether to search; on search, Vectorize (semantic) and D1 FTS5 (keyword) run in parallel, are fused with Reciprocal Rank Fusion, reranked by Haiku to the top 6 chunks, and fed back for a grounded answer streamed as SSE"
                src="/static/images/portfolio-ai-chatbot/pipeline.svg"
                width={960}
                height={590}
                className="mx-auto"
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              One Worker, four Cloudflare primitives (Workers, Workers AI, Vectorize, D1) and the
              Anthropic API. The dashed path is the no-search branch.
            </p>
          </div>

          <h2>How a request flows</h2>
          <p>
            Each <code>/chat</code> request goes to Claude with a persona prompt and the search
            tool. Greetings and core facts are answered directly; anything deeper triggers a search,
            and the Worker feeds the results back and streams the grounded answer as Server-Sent
            Events. Retrieved text is wrapped as untrusted data so nothing inside a document can
            inject instructions, inputs are capped, CORS is locked to this origin, and the API key
            never leaves the Worker.
          </p>

          <h2>Hybrid retrieval</h2>
          <p>
            Two searches run in parallel: <strong>semantic</strong> (the query embedded with{' '}
            <code>bge-base-en-v1.5</code> and matched by similarity in Vectorize) and{' '}
            <strong>keyword</strong> (BM25 via SQLite FTS5 in D1), which catches exact names that
            embeddings blur. The rankings are fused with Reciprocal Rank Fusion into 12 candidates,
            and a cheap Claude Haiku pass reranks them down to the 6 chunks the answer is grounded
            on. A slot is always reserved for the best project, about, and bio chunk so identity
            facts are never crowded out.
          </p>

          <h2>Design decisions</h2>
          <p>
            The small, critical facts (projects, publication, roles, contact) are pinned straight
            into the system prompt; retrieval is reserved for the ~350 chunks of write-up and
            project content that do not fit. That split came from a real failure: when full write-up
            bodies were first ingested, they crowded the projects and publication chunks out of the
            results entirely. A golden-question eval now guards that seam, failing below 90%
            retrieval recall and reporting every run to the /ops RAG tab.
          </p>
          <p>
            The corpus itself is curated from the site: bio, project pages (parsed from the built
            HTML), and every write-up, split into overlapping chunks. <code>npm run ingest</code>{' '}
            purges both stores, then re-embeds and upserts everything so the semantic and keyword
            indexes stay in lockstep.
          </p>

          <h2>Cheatsheet</h2>
          <p>The whole system at a glance:</p>
          <div className="not-prose overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left dark:border-gray-600">
                  <th className="py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                    Stage
                  </th>
                  <th className="py-2 pr-4 font-semibold text-gray-900 dark:text-gray-100">
                    Tech / model
                  </th>
                  <th className="py-2 font-semibold text-gray-900 dark:text-gray-100">Runs on</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {[
                  ['Embeddings', 'bge-base-en-v1.5 (768-dim)', 'Workers AI'],
                  ['Semantic search', 'Cosine similarity, top 12', 'Cloudflare Vectorize'],
                  ['Keyword search', 'SQLite FTS5 (BM25)', 'Cloudflare D1'],
                  ['Fusion', 'Reciprocal Rank Fusion (k = 60)', 'Worker'],
                  ['Rerank', 'Claude Haiku 4.5 → top 6 chunks', 'Anthropic API'],
                  [
                    'Search decision + generation',
                    'Claude Haiku 4.5 with tool use',
                    'Anthropic API',
                  ],
                  ['Streaming', 'Server-Sent Events', 'Worker → browser'],
                  ['Tracing', 'Per-request traces; Langfuse spans', 'D1 + Langfuse'],
                  ['Eval gate', 'Golden-set recall ≥ 0.9', 'npm run eval → /ops'],
                  ['Chat widget', 'React, on every page', 'GitHub Pages'],
                ].map(([stage, tech, runs]) => (
                  <tr key={stage} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 pr-4 font-medium">{stage}</td>
                    <td className="py-2 pr-4">{tech}</td>
                    <td className="py-2">{runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Deployment</h2>
          <p>
            The site is a Next.js static export on GitHub Pages; the backend deploys with one{' '}
            <code>wrangler deploy</code>. Secrets live in the Worker, CORS is pinned to the
            production origin, and there is no server to patch and no idle cost.
          </p>
          <figure className="not-prose my-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Image
                alt="Cloudflare dashboard metrics for the ashim-chatbot Worker: invocations, zero errors, 1.33 ms CPU time, and the active deployment serving 100% of traffic, with subrequests going to api.anthropic.com and us.cloud.langfuse.com"
                src="/static/images/portfolio-ai-chatbot/cloudflare.png"
                width={1523}
                height={829}
                className="w-full"
              />
            </div>
            <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              The deployed Worker in Cloudflare: zero errors, ~1.3 ms median CPU time, and outbound
              calls only to the Anthropic API and Langfuse.
            </figcaption>
          </figure>

          <h2>Observability</h2>
          <p>
            Every request is traced to D1: tokens, cost per pipeline stage, latency, retrieval
            quality, and the sources each answer cited. That feeds the live{' '}
            <Link href="/ops">/ops dashboard</Link>, including the latest eval run with its
            PASS/FAIL badge.
          </p>
          <figure className="not-prose mx-auto my-6 max-w-2xl">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Image
                alt="The /ops RAG tab: average vector hits 12.0, keyword hits 8.7, fused 12.0, chunks used 5.0, overlap 3.3, similarity 0.657, and a most-cited sources list led by write-ups, the About page, and project pages"
                src="/static/images/portfolio-ai-chatbot/ops-rag.png"
                width={944}
                height={686}
                className="w-full"
              />
            </div>
            <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Live retrieval health on /ops: hit counts, fusion, similarity, and which sources
              answers actually cite.
            </figcaption>
          </figure>

          <h2>Langfuse tracing</h2>
          <p>
            /ops shows the aggregate picture; Langfuse shows what happened inside one request:
            decision, rerank, and generation spans with per-span tokens, cost, and latency, plus
            retrieval stats attached to the trace. Events are posted straight to the Langfuse API
            and flushed with <code>ctx.waitUntil()</code>, so tracing adds zero latency for the
            visitor and no-ops entirely if the keys are unset.
          </p>
          <figure className="not-prose my-6">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Image
                alt="Langfuse tracing view: a chat trace with decision, rerank, generation, and retrieval children, per-span token counts and costs, and retrieval metadata (avgScore, overlap, used, fused)"
                src="/static/images/portfolio-ai-chatbot/langfuse.png"
                width={1771}
                height={774}
                className="w-full"
              />
            </div>
            <figcaption className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              A real request in Langfuse: decision, rerank, and generation spans with per-span
              tokens and cost.
            </figcaption>
          </figure>

          <h2>Tech Stack</h2>
          <div className="not-prose flex flex-wrap gap-2">
            {[
              'Cloudflare Workers',
              'Workers AI',
              'Vectorize',
              'D1 + FTS5',
              'Claude Haiku 4.5',
              'Anthropic tool use',
              'Reciprocal Rank Fusion',
              'Server-Sent Events',
              'Langfuse',
              'TypeScript',
              'Next.js',
              'GitHub Pages',
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#d1fae5] px-3 py-1 text-sm font-medium text-[#065f46] dark:bg-[#064e3b]/30 dark:text-[#6ee7b7]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <footer className="pt-4 pb-8">
          <Link
            href="/projects"
            className="text-[#047857] hover:text-[#065f46] dark:text-[#34D399] dark:hover:text-[#6ee7b7]"
          >
            &larr; Back to Projects
          </Link>
        </footer>
      </article>
    </SectionContainer>
  )
}
