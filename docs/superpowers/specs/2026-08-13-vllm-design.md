# vLLM write-up: Design

**Date:** 2026-08-13
**Deliverable:** `data/blog/vllm-how-a-token-gets-served.mdx` (URL `/write-up/vllm-how-a-token-gets-served`)

## Goal

Explain LLM inference serving through vLLM, from the memory arithmetic up to the 2026 cluster stack, in a voice deliberately unlike the rest of the blog. Ashim supplied a draft outline (PagedAttention, continuous batching, multi-LoRA, speculative decoding, plus a 2026 industry-concepts list) and asked for deeper research and a more human register.

## Decisions (brainstormed with Ashim)

- **Style: narrative essay, first person, anchored by figures.** Ashim explicitly asked for "a different style than the rest of the writeups, humanly, natural flow." That sits against the standing house rule that write-ups must not be text-heavy. Resolution: prose carries the argument, figures and tables carry the facts. Every section ships at least one table or diagram, so a scanner still gets the content. No fenced code blocks, inline code spans for flag names only.
- **Length and scope: ~4,000 prose words**, vLLM internals plus the surrounding 2026 landscape (disaggregation, cache-aware routing, SGLang and TensorRT-LLM).
- **Interview prep woven, not quarantined.** Sections 2 through 12 close with a `**What they actually ask:**` line. One aggregate skills table near the end. Ashim chose "woven throughout" over a single closing block.

### Revision, 2026-08-14: plain-language rewrite

Ashim asked for the same treatment the evaluation-engineering post got in c224a57: natural flow, concepts explained from scratch, simple language, "instead of just laying out information, make it understandable to reader." Three decisions changed:

- **Essay mode replaced with a numbered table of contents and plain-language headings.** "The batch is a lie" became "Taking Requests as They Arrive," and so on for all 18 sections. The TOC now reads as a path through the post.
- **Interview lead-ins reformatted.** `**What they actually ask:**` one-liners became `**Question:**` followed by a full answer paragraph, at Ashim's request. This is the bulk of the length increase.
- **A concrete analogy per hard concept, then the mechanism.** OS paging for the `v` in vLLM, filing folders for the KV cache, an airport shuttle for static batching, a truck driving to the store for bandwidth-bound decode.

Prose grew from ~4,000 to ~5,400 words, roughly 1,100 of which are the detailed answers. Every figure, table, number, source and both interactive components are byte-identical to the original.
- **Correct the draft and cite.** Ashim chose "yes, correct and cite" over keeping his framing. Five claims from the supplied draft are corrected in a table in section 1 rather than silently fixed, because the corrections are themselves the interesting content.

## The spine

One idea holds the essay together: **serving is a memory problem, not a compute problem, and prefill and decode are two different machines sharing one GPU.** Paging answers the first. Continuous batching, chunked prefill, speculative decoding and disaggregation are all negotiations over the second. Every section is placed to make that visible instead of listing features, and the closing paragraph names it explicitly as the durable takeaway.

## Structure

As of the 2026-08-14 rewrite, structure follows `evaluation-engineering.mdx`: `&nbsp;` after frontmatter, a cold open, then a numbered table of contents and 18 numbered H2 sections. 3 mermaid figures, 2 interactive components, 18 tables, 13 `**Question:**` blocks, ~5,400 prose words.

Cold open (no heading), then: what vLLM actually is; the words you need first; why your GPU fills up; paging the cache; taking requests as they arrive; reading and writing are different jobs; splitting a model across GPUs; reusing work you already did; guessing ahead; using smaller numbers; one model, many customers; forcing valid JSON; agents are a different workload; the four numbers you get judged on; splitting prefill and decode across machines; what actually breaks; what the job asks for; where to start; sources.

Each section opens by picking up where the previous one left off, so the post reads as one argument rather than a list of features.

## Corrections made to the supplied draft

| Draft said | Corrected to |
| --- | --- |
| "vLLM (often standing for virtual Large Language Model)" | neither the SOSP paper nor the launch post expands the acronym; the `v` is virtual memory, "virtual LLM" is a backronym |
| "wasting 60-80% of VRAM" | 60 to 80 percent of KV cache memory, not total VRAM |
| "boosts throughput by 2x-4x" | 2x to 4x against FasterTransformer and Orca; up to 24x against HF Transformers, up to 3.5x against TGI |
| "GPU utilization near ~80%+" | replaced with goodput, throughput that meets a stated TTFT and TPOT SLO |
| "prefix caching reduces latency 30-50%" | a function of prefix share; stated as a workload table instead of a number |

## Research basis

Primary: the SOSP 2023 PagedAttention paper, the June 2023 vLLM launch post, "Inside vLLM: Anatomy of a High-Throughput LLM Inference System" (2025), current vLLM optimization docs, the Q3 2026 roadmap issue. Technique specifics: the July 2026 EAGLE-3 post (acceptance length 2.77, flat 1K to 32K, 3.0x to 3.4x at batch 1), llm-compressor FP8 and NVFP4 docs, S-LoRA and Punica, XGrammar-2 (May 2026). Landscape: vLLM Router, llm-d, Mooncake, NIXL, third-party 2026 SGLang comparisons. Hiring signal read from live NVIDIA, Together AI and Red Hat postings.

Vendor-reported and third-party numbers are labeled as such in the text (llm-d routing gains, the SGLang throughput comparison, MLA per-token figures, the p99 latency rules of thumb). Every KV-math figure is derived in the post rather than quoted.

## Cross-cutting rules

- No em-dashes or en-dashes, verified by grep.
- Numbers are commitments: every figure carries a source or a stated derivation, and anything not traceable is hedged in the sentence rather than softened.
- Cross-link, do not duplicate: the hardware post carries memory bandwidth, the PyTorch post carries tensor parallelism, the evals post carries latency profiling.
- Mermaid must survive dark mode, where `MermaidChart.tsx` strips every `classDef` and `style` line. Meaning is carried by label text and node shape; color only reinforces.

## Site integration

1. `data/blog/vllm-how-a-token-gets-served.mdx` (new).
2. `worker/src/prompts.ts`: all three hardcoded topic lists extended (coverage bullet, scope trigger phrases, `SEARCH_TOOL.description`).
3. `scripts/rag-eval.golden.json`: retrieval case added for vLLM and PagedAttention.
4. Regenerated and committed: `public/write-up/vllm-how-a-token-gets-served/index.md`, `public/llms.txt`, `app/tag-data.json` (new tags `vllm`, `inference`, `kv-cache`).
5. Post-merge: deploy the worker, then `npm run ingest`, then `npm run eval`.

## Verification

- A grep for em-dash (U+2014) and en-dash (U+2013) on the post returns nothing. The post is clean ASCII end to end: no dashes, no smart quotes, no zero-width characters.
- `npm run build` succeeds; mirror and `tag-data.json` diffs appear.
- All 5 mermaid figures rendered and inspected visually in light and dark, plus a dark-mode simulation with `classDef` lines stripped, because `MermaidChart.tsx` swallows render errors into a silently blank box.
- Two figures were caught and reworked this way. The static-versus-continuous-batching figure went through three forms: side-by-side flowchart subgraphs (2547px viewBox scaled to 76px, unreadable), then a mermaid gantt, then, at Ashim's request for animation, the interactive `<BatchingSim />` component. A `block-beta` memory-strip candidate for the KV pool rendered 2412px wide and was replaced with a plain table.

## Interactive components

Two, both registered in `components/MDXComponents.tsx`, both following the house rules for demo components (`'use client'`, zero deps, shared `DemoFrame`/`palette`/`useIsDark` helpers, deterministic first render, interval cleanup in the effect), and both verified by driving the animation in the browser in both themes.

- `components/writeups/BatchingSim.tsx` replaces the static-vs-continuous batching figure. Play/Reset over 100 engine steps: three GPU slots per scheduler, red "idle, memory held" bars grow on the static side after short requests finish, live token counters end at 120 vs 300 (the 2.5x payoff is computed, not asserted).
- `components/writeups/PagedKVSim.tsx` replaces the PagedAttention mapping table. An 18-block physical pool fills as two requests stream in: prefill lands three scattered blocks at once, decode grabs a block only when the previous one fills, request B cache-hits the shared system prompt (blocks flip to green "shared x2" in both tables), and a live counter ends at 108 tokens wasted the contiguous way vs 12 paged. The caption states the toy scale explicitly so the 60-80 percent / under-4 percent real numbers stay honest.
