# Evaluation Engineering write-up: Design

**Date:** 2026-08-13
**Deliverable:** `data/blog/evaluation-engineering.mdx` (URL `/write-up/evaluation-engineering`)

## Goal

The build-it handbook for the two halves of shipping an LLM system responsibly: evaluation engineering (golden datasets, LLM-as-a-judge, groundedness, hallucination detection, regression testing) and production instrumentation (trace context, latency profiling, prompt injection defense, PII masking, schema validation).

## Decisions (brainstormed with Ashim)

- **Angle: build-it handbook.** The site already covers this territory twice, but neither tells you what to construct:
  - `ai-engineers-swiss-knife.mdx` sections 4, 6, 7, 8 are interview Q&A, a 30-second headline plus a short snippet per question.
  - `data-science-fundamentals.mdx` sections 8 and 9 are measurement theory, the classical-to-LLM translation table and the judge bias table.

  This post is the machinery: case schema, grader ladder, calibration protocol, CI gate, span attributes, guardrail chain. It cross-links at both overlap points rather than restating them.

- **Light code.** 12 short Python snippets plus one rubric prompt, only where code is the clearest explanation. Figures and tables carry everything else. (Different from the DS Fundamentals no-code decision because the topic names Pydantic and OTel attributes; showing them is shorter than describing them.)
- **Analogies: lab plus factory floor.** One spine, introduced in section 1 and reused without re-explanation. Golden set = reference weight in a sealed case. Judge = an instrument that drifts. CI gate = go/no-go gauge. Traces = sensor floor and flight recorder. Schema = a jig that will not accept a mis-shaped part. Injection = a forged work order on the conveyor. PII masking = redacting before the permanent record.
- **One post, both halves.** They are one loop: you cannot build a golden set without traces to mine, and you cannot prove a guardrail works without evals.

## Structure

824 lines, 14 numbered sections, 10 mermaid figures, 16 tables, 14 code blocks.

Part I, the measurement lab: (1) evals as a measurement system, (2) the golden dataset, (3) the grader ladder, (4) evaluating multi-step agents, (5) judge calibration, (6) groundedness and hallucination detection, (7) regression testing and the CI gate, (8) online signals.

Part II, the factory floor: (9) trace context, (10) latency profiling, (11) schema validation with Pydantic, (12) prompt injection defense, (13) PII masking, (14) putting it together, plus Takeaways and Sources.

Sections 4 and 8 were added in review as genuine coverage gaps: a build-it handbook for agent systems that never says how to score a trajectory, and one that never says what to watch when there is no reference answer, is incomplete.

Original contributions rather than restatement:

- **The noise-floor table** (section 7): binomial CI half-width at a 90% pass rate for n = 50 to 1000, and the smallest regression each set size can honestly detect. Computed, labeled as computed. Pairs with the day-90 problem, that an absolute floor of 0.85 stays green while you regress from 0.97 to 0.88.
- **Grade the world, not the transcript** (section 4): the only must-pass check is the side effect, since "I have issued your refund" passes every text grader. Reference trajectories are named as a trap, and injected tool failures as the highest-value agent case.
- **Thumbs are a triage queue, not a metric** (section 8), plus a drift table mapping symptom to suspect to the exact field to check.
- **The retrieval-versus-generation branch** (section 6): a low groundedness score is a symptom, and "in the corpus but never retrieved" needs a different fix from "made it up."
- **Percentiles are not additive** (section 10): budget in p50, measure end-to-end p95, use per-stage p95 only to find the tail owner.
- **Two PII chokepoints** (section 13): teams mask before the model and forget the trace store, which section 9 just turned into a searchable PII sink.
- **The capability boundary, not the classifier** (section 12): design so a fully successful injection still cannot do damage.

## Research basis

Web study run 2026-08-13. Primary sources verified directly, and every external link checked for a 200:

- OTel GenAI semconv attribute registry fetched directly; all `gen_ai.*` names in the section 7 table verified, and the Development stability status confirmed.
- arXiv 2602.02219 fetched; title and the "small number of random permutations" finding confirmed.
- Vectara hallucination leaderboard fetched. **A secondary blog claimed 1 to 2.5 percent for frontier models; the leaderboard itself shows the best at 1.8 percent and the top ten spanning 1.8 to 4.5 percent.** The write-up uses the primary numbers.
- MT-Bench (arXiv 2306.05685) for judge/human agreement above 80 percent.
- OWASP LLM01 for prompt injection ranking.

## Cross-cutting rules

- No em/en dashes (verified by grep).
- Numbers are commitments: every figure carries a source or a stated assumption. The cost-per-1000-cases column states its token and human-minute assumptions; the CI table is labeled as computed.
- Cross-link, do not duplicate: judge biases to DS Fundamentals section 9, tool sandboxing to Swiss Knife section 7.

## Site integration

- Two mermaid syntax errors were caught only in the browser (`components/MermaidChart.tsx` swallows render errors and leaves an empty box). Both were the same cause: unescaped double quotes inside an unquoted node label. A scan over every node label in the file now confirms none remain.
- `worker/src/prompts.ts`: all three hardcoded topic lists extended. The existing "evals, guardrails" phrasing pointed at Swiss Knife, so these are disambiguation edits naming this post's specific topics.
- `scripts/rag-eval.golden.json`: added a retrieval case for LLM evals and hallucination detection.
- Generated by `npm run build` and committed: `public/write-up/evaluation-engineering/index.md`, `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json` (new tag: `observability`).
- Post-merge: `npx wrangler deploy` in `worker/`, then `npm run ingest`, then `npm run eval`.

## Verification

- `npm run build` succeeds, prettier clean.
- Dev preview: post renders, TOC anchors resolve, all 9 mermaid figures render (errors are swallowed silently and leave an empty box), code highlights.
- Dark mode: `components/MermaidChart.tsx` strips `classDef`/`style` lines, so every figure was authored to read correctly with all color lines removed.
- Mirror files committed.
