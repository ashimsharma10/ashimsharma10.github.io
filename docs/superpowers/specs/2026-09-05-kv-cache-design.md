# KV Cache Write-up — Design

Date: 2026-09-05
Slug: `architecture-of-memory-kv-cache`
Status: implemented. Revised mid-way at Ashim's request: his title verbatim, not the
numbered-sections-with-Question house format, about half the length, plain language,
few named systems or parameters, and hand-drawn Excalidraw figures rather than mermaid.

## Goal

A deep companion to `vllm-how-a-token-gets-served.mdx`. That post asked how a serving
engine works and touched the cache in passing. This one asks what the cache *is*, why it
decides the hardware bill, and what the field has done about it — from the attention math
up through kernels, quantization, eviction, and multi-machine transfer.

Source material: a research brief supplied by Ashim, used heavily, with arithmetic
recomputed and contested figures attributed rather than asserted.

## Positioning against the vLLM post

| Topic | vLLM post | This post |
| --- | --- | --- |
| Cache sizing formula | one section | recomputed, with an interactive budget explorer |
| MHA/GQA/MLA | one table row | four sections, including weight absorption and decoupled RoPE |
| PagedAttention | full section | one-paragraph recap, then the block-size tension it skipped |
| Prefix sharing | one paragraph | RadixAttention, protected-parent LRU, agentic forking |
| KV quantization | one table row | KIVI's asymmetry, alignment collapse, XQuant |
| Eviction | absent | two sections, including the schema-dense failure mode |
| Spec decoding | full section | recap, then EAGLE-3, P-EAGLE, tree masks |
| Decode kernel | absent | Flash-Decoding, FlashInfer, BitDecoding |
| Offload / PD split | one section | tiering, LMCache, Mooncake, DualPath |

## Structure

Plain `##` headings, no table of contents, no closing Question blocks. Short paragraphs,
simple sentences. Order follows the research brief: why the cache exists, prefill vs
decode, size, shrinking it in the model (GQA, MLA, absorption, split positional key),
storing it (paging, prefix tree), fewer bits (KIVI, alignment warning), eviction (H2O,
sinks, the JSON failure), fewer reads (speculation), faster reads (Flash-Decoding),
off-GPU tiers and split machines, a short "what to remember", further reading.

## Diagrams

Three hand-drawn figures, designed with the Excalidraw MCP (`create_view`) so Ashim sees
them in chat, with the same element JSON kept in `scripts/sketches/*.json` as the source
of truth. `scripts/render-sketches.mjs` renders that JSON with rough.js (the engine
Excalidraw uses; already a mermaid dependency) into `components/writeups/sketches.generated.ts`,
and `<Sketch name="..." />` inlines the SVG. Strokes are `currentColor` and fills are
semi-transparent tints, so one SVG works in both themes.

- `prefill-decode`: prompt -> prefill writes the cache -> decode reads all of it each step
- `radix-tree`: shared system prompt stored once, conversations and branches hang off it
- `memory-tiers`: GPU -> CPU -> SSD -> network, idle moves down, returning moves up

To change a figure: edit the JSON, re-run the script, commit both.

## Interactive components

Three new files in `components/writeups/`, registered in `components/MDXComponents.tsx`.
House rules: `'use client'`, zero dependencies, `useIsDark()` from `./quantum/shared`,
deterministic first render, Strict-Mode-safe cleanup.

- `KVCacheBudget.tsx` — pick an attention layout (MHA / GQA / MLA), context length, batch
  size and dtype; a stacked bar shows weights vs cache vs free against an 80 GB card, and
  the concurrent-user count falls out. Carries sections 3-5.
- `MLACompression.tsx` — a static diagram, `MoELayerDiagram`-shaped: full per-token K and V
  beside the latent `c_KV` plus the shared RoPE tail, with live byte counts. Carries
  section 5.
- `KVEvictionSim.tsx` — a token strip with attention mass. Toggle recent-window vs H2O vs
  a schema-dense JSON prompt, and watch H2O keep the delimiters and drop the values.
  Carries sections 10-11.

## Corrections to the source brief

- DeepSeek-V3's 1,152 bytes and the 57x ratio are **per layer**. Across 61 layers that is
  70,272 B per token, so 128K context (131,072 tokens) is **9.2 GB**, not 11.8 GB.
  Verified against Raschka's KV cache gallery and the DeepSeek-V3 config
  (`kv_lora_rank` 512, `qk_rope_head_dim` 64).
- Units are decimal GB throughout (1 GB = 1e9 B), matching how HBM capacity and parameter
  counts are quoted. On that basis the brief's Llama-3-70B figure of ~42 GB was correct
  (42.9 GB at 131,072 tokens); the post uses 42.9.
- MQA's saving is an `n_heads`-fold cut (32x on a 32-head model), not "75-90%".
- Drop the claim that vLLM "bypasses the Python GIL via C++ extensions" — unsupported.
- XQuant's 12.5x is **XQuant-CL**, which quantizes cross-layer *differences* in X, not
  plain 2-bit X. Plain XQuant is the smaller win.
- The structural-role-bias result is stronger than the brief states: exact-match accuracy
  collapses 88% -> 0% at a 5% budget, KEY tokens over-retained 1.8-1.9x vs VALUE tokens,
  attention-sink roles carrying ~30x mean per-token mass (arXiv 2607.13205).
- P-EAGLE's 1.69x is at concurrency 1 on B200/GPT-OSS-20B and decays to ~1.25x at
  concurrency 64. The decay is the interesting half.

## Frontmatter

```
title: 'The Architecture of Memory: KV Cache Dynamics, Optimization, and the Future of LLM Inference'
tags: ['kv-cache', 'llm', 'inference', 'attention', 'gpu']
```

## Post-merge checklist

- Extend the chatbot topic lists in `worker/src/prompts.ts` (coverage list, scope
  examples, SEARCH_TOOL description). No em/en-dashes in those strings.
- `npm run build`, then commit the generated mirrors: `public/write-up/<slug>/index.md`,
  `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json`.
- Deploy the worker and run `npm run ingest`.
