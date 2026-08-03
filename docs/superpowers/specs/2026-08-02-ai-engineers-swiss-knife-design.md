# Design: "The AI Engineer's Swiss Knife: Agentic Systems in Production"

Date: 2026-08-02
Status: approved (brainstormed in-session)

## Goal

One comprehensive Q&A reference for engineers building and operating LLM/agentic systems in production. It doubles as senior-level interview preparation: every question is phrased the way an interviewer would ask it, and every answer is a rehearsable model answer. Title deliberately avoids "interview prep" framing; the content carries it.

## Format

- File: `data/blog/ai-engineers-swiss-knife.mdx`
- Pure MDX: code blocks, tables, mermaid diagrams. No interactive components.
- ~40 questions across 9 sections, ~1600-2000 lines. Code-first, prose as connective tissue.

Per-question structure:

1. **Q** — as an interviewer would phrase it
2. **Headline answer** — the 30-second first response (2-4 sentences, bolded takeaway)
3. **Deep dive** — code/tables/mermaid carry the weight
4. **Follow-up traps** — 1-3 follow-ups that separate senior from mid-level

Cross-cutting rule: answers commit to concrete numbers/thresholds (latency, cost, accuracy) with stated assumptions. No "it depends" hedging; illustrative numbers state their assumptions.

## Sections (production lifecycle order)

| #   | Section                      | ~Qs | Coverage                                                                                                                                |
| --- | ---------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Agent system design          | 5   | Design-an-agent, single vs multi-agent, partial failure mid-trajectory, memory/persistence, human-in-the-loop                           |
| 2   | Prompt & context engineering | 4   | Context-window budgeting, few-shot vs fine-tune framework, prompt versioning/testing                                                    |
| 3   | RAG & retrieval quality      | 4   | Retrieval vs generation metrics, chunking trade-offs, RAG vs long context                                                               |
| 4   | Evals: offline               | 6   | Eval suite from zero, LLM-as-judge biases + corrections, trajectory vs final-answer eval, golden vs synthetic sets, CI regression gates |
| 5   | Measuring quality online     | 4   | Offline-passes-but-users-complain debugging, online proxy metrics, A/B testing LLM changes                                              |
| 6   | Guardrails                   | 4   | Layered architecture (input/output/tool), fail-open vs fail-closed, latency budgets                                                     |
| 7   | Security & prompt injection  | 4   | Indirect injection concrete attack, why guardrails alone are insufficient, tool-call sandboxing/permissioning                           |
| 8   | Observability & tracing      | 4   | Per-step logging schema, tracing nondeterministic failures, drift detection                                                             |
| 9   | Token & cost engineering     | 5   | 10x cost-cut walkthrough, model routing/cascades, prompt caching mechanics, KV-cache vs prompt cache, streaming/batching                |

## Site integration

- Frontmatter tags drawn from existing vocabulary plus new `evals`/`guardrails`: `['llm', 'agents', 'evals', 'guardrails', 'guide']`
- Extend `worker/src/prompts.ts` topic lists (coverage, scope examples, SEARCH_TOOL description); no em/en-dashes in those strings
- `npm run build` regenerates tracked mirrors: `public/write-up/ai-engineers-swiss-knife/index.md`, `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json` — commit together
- PR per house convention: short summary + "## Test plan" checklist with unchecked post-merge items (worker deploy + ingest); no AI attribution
- Optional: add a case to `scripts/rag-eval.golden.json`

## Verification

- `npm run build` succeeds, prettier clean
- Dev preview: post renders, TOC anchors resolve, mermaid renders, code highlights
- Mirror files committed
