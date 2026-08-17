# Mixture of Experts write-up: design

Date: 2026-08-17
Slug: `data/blog/mixture-of-experts.mdx`

## Goal

A short, comprehensive MoE write-up in a format that differs from the rest of the site.
Every other post on the site uses numbered `##` sections with a table of contents. This
one is a chain of sixteen questions, each the natural follow-up to the previous answer.

Target length: about 2,300 words. That is roughly 40 percent of the vLLM post, so it
still reads short, while covering enough ground to be useful to someone who has to
train, serve, or pay for one of these models.

## Voice constraints

- Plain language. Short sentences. Explain before naming.
- No em dashes and no en dashes. The existing posts contain zero of both.
- No "it is not X, it is Y" constructions, no filler adjectives, no summary-speak.
- Each answer ends somewhere that makes the next question feel inevitable.

## Structure

The idea:

1. Why does a 671B model only cost 37B to run?
2. So which parts of the model got cheaper? (only the FFN, attention and KV cache did not)
3. What is the router, exactly? (snippet + `MoERouterSim`)
4. Do the experts specialize by topic? (no, and what Mistral found in their own model)

Training:

5. What stops every token from picking the same expert? (collapse, aux loss, bias trick)
6. Is MoE training less stable than dense? (router z-loss, dropped tokens folded in here)
7. How sparse should a model be? (model roster table, granularity, the trend)
8. Can you turn a dense model into an MoE? (upcycling)
9. Why is fine-tuning one harder? (overfitting, ST-MoE parameter-subset finding)

Serving:

10. Does the sparsity make serving cheaper? (per token yes, per batch much less)
11. Then why is the expert layer the slow part? (arithmetic intensity, kernel occupancy)
12. How do people actually serve these? (EP, all-to-all, interconnect, LMSYS numbers)
13. What does uneven expert load cost? (stragglers, EPLB gains, what to monitor)
14. Does quantization work differently here? (expert weights tolerate low bits)
15. Can I run one on my own machine? (`--n-cpu-moe`, batch 1 is the sparsity best case)
16. So should you use one? (decision table)

Then four things to remember, then sources.

## Assets

- Figure 1: dense FFN next to an MoE layer (mermaid, TD, subgraphs).
- Figure 2: the routing collapse feedback loop (mermaid, TD).
- Figure 3: expert parallelism and the two all-to-all hops (mermaid, TD).
- Table 1: model roster with total, active, sparsity percent.
- Table 2: what MoE changes and what it leaves alone.
- Table 3: when to reach for one and when not to.
- Snippet 1: the router forward pass, about 12 lines of PyTorch.
- Snippet 2: the auxiliary-loss-free bias update, about 4 lines.
- `components/writeups/MoERouterSim.tsx`.

## The component

`MoERouterSim` steps a token stream through an 8 expert layer. Per token it shows the
gate scores, lights the top 2, and updates three counters:

- experts used by this token (2 of 8)
- experts used by the batch so far (climbs toward 8 of 8)
- tokens landed on each expert

A balancing toggle switches between raw scores, where two experts swallow the traffic,
and a bias-corrected version modelled on the DeepSeek-V3 update. The batch counter is
the point: it makes question 10 visible, because per-token sparsity does not survive
batching.

House rules from the existing sims: `'use client'`, no new dependencies, `useIsDark`
and `palette` from `writeups/quantum/shared`, deterministic first render (the score
table is a pure function of the token index, computed at module scope), interval
cleared on unmount.

## Facts and sources

Verified against primary sources rather than secondary blogs.

| Claim | Source |
| --- | --- |
| DeepSeek-V3: 671B total, 37B active, 256 routed + 1 shared, aux-loss-free balancing, 14.8T tokens, 2.788M H800 GPU hours | DeepSeek-V3 model card and paper |
| DeepSeek-V4-Pro: 1.6T total, 49B active, FP4 experts with FP8 elsewhere, expert count not published | DeepSeek-V4-Pro model card |
| Kimi K2: 1T total, 32B active, 384 experts, 8 selected, 1 shared, MLA | Kimi-K2-Instruct model card |
| Qwen3-235B-A22B: 235B total, 22B active, 128 experts, 8 active, 94 layers | Qwen3 model card |
| Llama 4 Maverick: 400B total, 17B active, 128 experts | Llama 4 Maverick model card |
| gpt-oss-120b: 117B total, 5.1B active, MXFP4 MoE weights, one 80GB GPU | gpt-oss-120b model card |
| Mixtral 8x7B: 46.7B total, 12.9B active, limited domain specialization, syntactic and positional routing patterns | Mixtral of Experts, arXiv 2401.04088 |
| Fine-grained segmentation and shared expert isolation | DeepSeekMoE, arXiv 2401.06066 |
| Router z-loss, fine-tuning parameter subsets, sparse models overfit more | ST-MoE, arXiv 2202.08906 |
| Expert layers stay memory bound at large batch because intensity scales with batch times sparsity | MegaScale-Infer, arXiv 2504.02263 |
| Per-expert batches under 200 tokens out of an 821 token batch; kernels want 256 to 512 | MoE-Inference-Bench, arXiv 2508.17467 |
| 96 H100 run: 3.3x prefill and 5.2x decode over TP16, EPLB worth 1.49x and 2.54x | LMSYS large-scale EP blog, 2025-05-05 |
| Expert weights tolerate 2 and 3 bit better than dense FFN | MoQE, arXiv 2310.02410 |
| Sparsely gated MoE layer, noisy top-k | Shazeer et al., arXiv 1701.06538 |
| `--n-cpu-moe` keeps expert tensors in system RAM | llama.cpp docs and offload guides |

Corrections made during review, recorded so they do not creep back in:

- 671B at FP8 does not fit on 8 H100s. 671 GB of weights against 640 GB of VRAM, before
  any KV cache. The correct framing is 8 H200s or two H100 nodes.
- Mixtral 8x7B is 27.6 percent active, not 25.
- DeepSeek-V3 routes 8 of 256, so an average expert sees one thirty-second of a batch.
- Capacity factor and dropped tokens are largely a training-era and TPU-era concern.
  Two sentences inside the stability answer, not a question of their own.

## Checklist

- Register `MoERouterSim` in `components/MDXComponents.tsx`.
- Extend the topic lists in `worker/src/prompts.ts` (coverage list, scope examples,
  SEARCH_TOOL description), no dashes in those strings.
- Post-merge: deploy worker, run ingest, commit generated mirrors from `npm run build`.
