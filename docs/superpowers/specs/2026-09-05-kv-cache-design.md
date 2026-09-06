# KV Cache Write-up — Design

Date: 2026-09-05
Slug: `kv-cache-what-fills-a-gpu`
Status: approved, ready to implement

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

Numbered sections with a table of contents, each closing with a bolded **Question:** in
the vLLM post's house style.

1. What the Cache Actually Holds
2. Two Machines Sharing One GPU
3. The Size Formula, and the Bill
4. Cutting Heads: MQA and GQA
5. Multi-head Latent Attention
6. Weight Absorption, and Why RoPE Breaks It
7. Where the Blocks Physically Live
8. Sharing a Prefix: Radix Trees
9. Quantizing a Moving Cache
10. Throwing Tokens Away
11. Why Eviction Fails on JSON
12. Amortizing the Read
13. The Decode Kernel
14. Off the GPU
15. Between Machines
16. Which Lever, Given Your Symptom
17. Sources and further reading

## Diagrams

Mermaid with `look: handDrawn` set per-diagram via the diagram's own frontmatter config
block. This is mermaid 11's built-in Excalidraw-style rough rendering — no new dependency,
no change to `MermaidChart.tsx`, and existing posts' diagrams are untouched.

Keep each diagram simple: a handful of nodes, one idea per figure. Prefer TD/BT layouts
(LR chains get scaled tiny by `useMaxWidth`). `classDef` colours are safe — the component
strips them in dark mode.

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
  70,272 B per token, so 128K context is **~9.0 GB**, not 11.8 GB. Verified against
  Raschka's KV cache gallery and the DeepSeek-V3 config (`kv_lora_rank` 512,
  `qk_rope_head_dim` 64).
- Llama-3-70B at 128K is **40.0 GB**, not 42.
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
title: 'The KV Cache: What Actually Fills a GPU'
tags: ['kv-cache', 'llm', 'inference', 'attention', 'gpu']
```

## Post-merge checklist

- Extend the chatbot topic lists in `worker/src/prompts.ts` (coverage list, scope
  examples, SEARCH_TOOL description). No em/en-dashes in those strings.
- `npm run build`, then commit the generated mirrors: `public/write-up/<slug>/index.md`,
  `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json`.
- Deploy the worker and run `npm run ingest`.
