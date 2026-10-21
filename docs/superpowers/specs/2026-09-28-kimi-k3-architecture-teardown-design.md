# Kimi K3 Architecture Teardown Write-up — Design

**Date:** 2026-09-28
**Slug:** `kimi-k3-architecture-teardown`
**Status:** reviewed on localhost over six rounds; built and committed

## Goal

A short teardown of Moonshot AI's Kimi K3 (arXiv:2607.24653, July 2026) for issue #132, carried by seven house-style sketches and six tables rather than prose. It covers what the issue asked for: scale and serving cost, Stable LatentMoE against DeepSeekMoE, Quantile Balancing against DeepSeek-V3's bias terms, the KDA plus Gated MLA hybrid for a 1M-token context, Attention Residuals, training stability, and the long-horizon demos treated as demos, not benchmarks.

## How the brief is used

Ashim supplied a research brief. The write-up keeps its section order and its headings lightly shortened, simplifies its sentences, and corrects facts quietly (see Fact check). The "primary source verification" section folds into the opening paragraphs and a K2 vs K3 table.

Standing house rules applied: short title; all H2; paragraphs under about 100 words; no dashes and no AI slop words; each section opens by connecting to the previous one; an "In plain terms:" paragraph after every display equation; a long `alt` and a `*Visual N:*` caption for every sketch; "What We Learned" bullets; a Sources section. Sketches use the clean style with the handwritten font and stay under 720px wide. No mermaid, no code, no interactive demo.

## Approaches considered

1. Redraw every figure as a house sketch and link the originals. Chosen. Consistent with the last three posts and works in dark mode.
2. Sketches plus the two permissively licensed originals (Kimi Linear's hybrid diagram, MIT; Mooncake's PD diagram, Apache-2.0). Rejected: two raster images that ignore the theme.
3. Embed the report's own figures unmodified with a CC BY-NC-ND credit and draw only two sketches. Rejected: mixed look, and crops or restyles are not allowed under ND.

Length options were about 600, 1,000 and 1,400 prose words. Ashim chose about 1,000 words over seven sections. He chose no interactive demo.

## Title and length

Title: "Kimi K3 Architecture Teardown". About 1,000 words of body prose (1,029 after the final trim on 2026-10-18) plus six tables, four short equations with plain-terms lines, and seven sketches.

## Structure

1. Scale: Total vs Active Parameters and Serving Economics. Opening paragraphs, K2 vs K3 table, sketch `k3-scale`, dense-vs-sparse serving table, Mooncake and pricing paragraph.
2. Stable LatentMoE vs DeepSeekMoE. Latent path, the normalized aggregation equation, sketch `latent-moe`, comparison table. Links the MoE post for shared and fine-grained experts.
3. Load Balancing: Quantile Balancing vs Bias Terms. Routing collapse, aux loss, DeepSeek-V3 bias, the three-step quantile rule, sketch `quantile-balancing`, strategy table.
4. Hybrid Attention for 1M Tokens: KDA and Gated MLA. Layer pattern, sketch `kda-mla-stack`, KDA update equation, bounded decay, sketch `kda-state-update`, NoPE, KDA vs MLA table.
5. Attention Residuals: Depth-wise Attention Instead of Sums. Standard sum vs softmax-weighted sum, Block AttnRes, what the paper claims, sketch `attnres`.
6. Training Stability at 3T Scale. Per-Head Muon with weight clipping, SiTU-GLU softcap equation, QAT, scaling-efficiency claim, sketch `stability-stack`.
7. Post-Training: Long-Horizon Demos, Not Benchmarks. Recipe sentence, demo table, closing sentence.
8. What We Learned. Seven bullets.
9. Sources and further reading.

## Diagrams

Seven sketches in `scripts/sketches/`, rendered by `node scripts/render-sketches.mjs` into `components/writeups/sketches.generated.ts`:

| Name | Redraws | Shows |
| --- | --- | --- |
| `k3-architecture` | K3 report Fig 2 | the whole architecture: stack with AttnRes, LatentMoE inset, KDA inset |
| `latent-moe` | K3 report Fig 2 inset | the latent path, RMSNorm after the expert sum, shared experts at full width |
| `quantile-balancing` | K3 report Fig 5 | 8 tokens, 4 experts, top-1, loads 4/3/1/0 to 2/2/2/2 |
| `kda-mla-stack` | Kimi Linear Fig 3, K3 Fig 2 | the 3:1 block repeated 23 times plus a final MLA layer |
| `kda-state-update` | K3 Section 2.1.1 | decay, erase, write on a fixed-size state |
| `attnres` | Attention Residuals Fig 1 | standard residual, Full AttnRes, Block AttnRes |
| `stability-stack` | K3 Sections 2.3 to 2.5 and 4.1.4 | five bounds and what each one holds in range |

## Interactive components

None.

## Fact check

Primary sources read: the K3 report (arXiv:2607.24653 v2), the Kimi blog post (2026-07-16), the Hugging Face model card and config, the MoonshotAI GitHub repos (Kimi-K3, minitriton), the Kimi pricing page, and the K2, Kimi Linear, Attention Residuals, LatentMoE, Mooncake and DeepSeek-V3 papers.

| Brief claim | Finding | Used in the post |
| --- | --- | --- |
| 2.8T total, 104B active, ~3.7% | Table 1: 2.78T and 104.2B; the report states sparsity as 896/16 = 56 | 2.78T, 104.2B, about 3.7% |
| 896 experts, top-16, 2 shared, latent dim 3584 | verified (Section 2.3, config.json) | as stated |
| routing decisions made in the latent space | router scores use the full-width token, sigmoid(W_r x); only dispatch and the experts run in the latent | rephrased |
| RMSNorm after expert aggregation | verified, "Normalized LatentMoE" | as stated |
| 93 layers, 69 KDA + 24 Gated MLA, 3:1 | verified: 23 blocks of 3 KDA + 1 MLA, plus one final MLA | as stated |
| NoPE in MLA layers | verified | as stated |
| 1M context | 1,048,576; 8K to 64K in pre-training, 256K to 1M in cooldown | as stated |
| Quantile Balancing on raw scores, no step size | histogram is over margins (score minus the token's top-(k+1) cutoff); "no step size" is implied by Eq. 14 | margins; "replaces the fixed-step update" |
| Block AttnRes, ~8 blocks of 12 | verified; 9 blocks counting the embedding block | as stated |
| Per-Head Muon, MuonClip lineage | Per-Head Muon plus K2's weight-clipping mechanism; "MuonClip" does not appear in the K3 report | Per-Head Muon plus weight clipping |
| SiTU-GLU softcap | verified; beta 4 on the gate, 25 on the up branch | as stated |
| KDA decay bound g_min = -5 | verified | as stated |
| MXFP4 weights, MXFP8 activations, QAT from SFT through RL | only expert weights are MXFP4; attention, projections, shared experts and routers stay in higher precision | corrected |
| ~1.4 TB of weights | Hugging Face shows 1.56 TB over 96 shards | 1.56 TB |
| minimum 64 accelerators, 8 nodes of 8 H100/B200 | the blog recommends 64 or more; no primary source gives the node layout | "recommends 64 or more"; layout dropped |
| Transfer Engine 190 GB/s on 8x400 Gbps RoCE | Mooncake's generic README benchmark, not a K3 figure | dropped; blog's ">90% cache hit rate on coding workloads" used instead |
| pricing $3.00 / $0.30 per million | verified; output is $15.00 | as stated |
| pre-training token count | not disclosed anywhere | not stated |
| MiniTriton built autonomously | Python tile frontend, MLIR layer, PTX codegen; a character-level GPT on one L20; built "with engineering direction and review by the maintainer" | corrected |
| kernel 283.6 to 114.4 ms, 15 hours, 2.48x | latencies verified on Hopper within a 24-hour budget; 2.48x and 15 h are derived | latencies only |
| 48-hour chip, 1.46M cells, 0.277 MB SRAM, 100 MHz, 4 mm² | verified; SRAM is 0.277 MiB; 4 mm² is an area budget; RTL simulation only | corrected |
| K2 1T / 32B, MuonClip, 15.5T tokens | verified (arXiv:2507.20534) | as stated |

## Implementation checklist

- [x] Design doc
- [x] Seven sketch JSONs rendered, each viewBox width at or under 720
- [x] `data/blog/kimi-k3-architecture-teardown.mdx` (about 1,060 words of section prose)
- [x] `worker/src/prompts.ts` topic lists (no dashes in those strings)
- [x] Background fact-check of the draft against the report (see the second-round notes)
- [x] Localhost review by Ashim (four rounds, see below)
- [x] `npm run build`, commit generated mirrors (`public/write-up/<slug>/index.md`, `public/llms.txt`, `app/tag-data.json`)
- [x] Push only after explicit confirmation; PR with a Test plan listing worker deploy, ingest and an optional golden eval case

## Second-round revisions (2026-09-28, after Ashim's first localhost review)

Ashim asked for four things: redo the diagrams through the Excalidraw tool with a human-like font, proofread the article, remove AI slop and make the flow natural, and lead with what is unique in K3 and what changed architecturally rather than with numbers.

- Every sketch was redrawn as a before-and-after contrast in the handwritten font (`{"type":"settings","style":"clean"}`, no `font` key): `k3-changes` replaces `k3-scale`, `attention-stack` replaces `kda-mla-stack`, `latent-moe` and `stability-stack` became two-column comparisons, `kda-state-update` gained the cache-versus-state line. The figures were also drawn into the chat with the Excalidraw tool for review.
- The prose was rewritten so each section opens with the design K3 replaces, then what K3 does instead, then why. Numbers moved into the tables where they were not already there.
- Ashim then asked for an architecture diagram showing the layers, the attention layers and the activation. It was drawn in the chat with the Excalidraw tool and added to the post as `k3-block`, the new Visual 1 (one block of the stack on the left, the inside of a LatentMoE feed-forward on the right, the AttnRes path as a green arrow). `k3-changes` moved to the end of the first section as Visual 2. Eight sketches in all.

### Fact-check corrections applied in this round

A read-only agent checked the draft against the report, blog, config, pricing page, the Attention Residuals paper and DeepSeek-V3. Applied:

- Per-Head Muon: the report says per-head orthogonalization equalizes the update scale across heads so large-gradient heads stop dominating. The draft's "KDA and MLA heads adapt at their own rates" was wrong and is gone.
- "Without a loss spike" is not claimed anywhere; now "Moonshot credits stable training at this scale to stacking them".
- The RMSNorm is one of three stabilizers named by the report (with SiTU-GLU and Quantile Balancing); the post now says so instead of crediting the norm alone.
- The demos were not "unattended" (MiniTriton had a maintainer's direction and review) and the kernel task is scored against other models; "fused two-phase kernel" and "on Hopper" were not in the report and were removed. The chip is a prototype for a nano model, the 4 mm² is an analytical budget, and only the decode throughput is RTL-simulated.
- 64 or more accelerators is recommended for the communication domain, not because of file size. KDA states share the paged pool with the MLA KV cache; the prefix cache resumes prefill from a 512-token checkpoint rather than skipping prefill.
- The KDA erase is partial (scaled by beta). Chunked linear attention's overflow is in the reciprocal cumulative decay; Kimi Linear computed diagonal tiles position by position.
- Block AttnRes stores 9 block summaries (embedding plus 8 blocks), the last block partial. The "80 equal terms" framing was replaced with the paper's own (the sum grows with depth, so deep layers need ever larger outputs). AttnRes measurements come from Kimi Linear models, not K3.
- SiTU bounds each activation channel at 100; it is not a bound on expert outputs. The 2.5x is credited to architecture plus refined data and training recipes.
- "Exact recall" became "unrestricted, content-based lookup"; the MLA cache is one compressed latent per token; DeepSeek-V3's bias update leaves some experts undertrained rather than "dead"; Quantile Balancing is "a single update per step". The expert-layer equation now shows the whole layer (shared experts plus up-projected normalized routed sum).

## Third-round revisions (2026-09-28, after Ashim's second review)

Ashim rejected the "one block of the Kimi K3 stack" figure, asked for a diagram from the Kimi architecture paper instead, and said the article is not about comparing K2 with K3.

- Visual 1 is now Figure 2 of the K3 technical report. The arXiv HTML's inline SVG was tried first but its labels are HTML inside `foreignObject` nodes with unparsed TeX and duplicated math text, so the figure is instead rendered from page 3 of the report PDF with `pdftoppm` at 240 dpi and cropped to the figure's own bounds, saved at `public/static/images/kimi-k3/k3-architecture-fig2.png` (1450 x 1345). It is embedded with a raw `<img>` inside a white rounded box so it stays readable in dark mode, is zoomable through the existing ImageLightbox, and is credited in the caption as CC BY-NC-ND 4.0. The `k3-block` sketch and its JSON were deleted.
- The K2-versus-K3 framing is gone: `k3-changes` (usual design vs K3) and `attention-stack` (K2 vs K3) were deleted; `latent-moe` and `stability-stack` went back to K3-only layouts; `kda-mla-stack` returned as the 3:1 figure. The K2 vs K3 spec table became a "Kimi K3 at a glance" table. K2 is now mentioned only as the source of the weight-clipping mechanism and as the baseline for the 2.5x scaling-efficiency claim.
- Seven visuals: the report's figure, then six sketches (latent-moe, quantile-balancing, kda-mla-stack, kda-state-update, attnres, stability-stack).

## Fourth-round revisions (2026-10-15)

Ashim found the PDF crop of Figure 2 cut off at the right edge and asked for the same diagram drawn in Excalidraw style, then for a simpler version with every line connected.

- Visual 1 is now the sketch `k3-architecture`, generated by a small Python script (kept in the session scratchpad, not the repo) that computes every arrow from box edges so nothing floats. It keeps the report's three-panel layout: the stack on the right with the Attention Residual lines in red, the Stable LatentMoE inset top left, the KDA inset bottom left. Simplifications: one attention node at each block boundary instead of one per layer (which is what Block AttnRes does), the four KDA input columns reduced to q/k, v, alpha/beta and gate, and no per-layer residual loops.
- `scripts/render-sketches.mjs` gained `strokeStyle: "dashed"` support (clean mode uses `stroke-dasharray`, rough mode uses rough.js `strokeLineDash`) for the inset boxes and the router's dashed link.
- The PDF crop and `public/static/images/kimi-k3/` are gone. Seven visuals, all sketches.

## Fifth-round revisions (2026-10-20)

Ashim found the 1,000-word version still too text heavy and too much about counts, and asked for a high-level piece about what is novel in K3 with other models as the comparison.

- Body cut to about 750 words. The two spec tables and all four equations are gone. One table now carries the comparison: each changed part against what DeepSeek-V3, Qwen3, Llama 4, gpt-oss and K2 do.
- Every section opens with what the field does and then what K3 does instead. Comparison facts used: MLA everywhere (DeepSeek-V3, K2); GQA (Qwen3, gpt-oss); auxiliary balancing loss (Qwen3); stepped bias (DeepSeek-V3, K2); AdamW (DeepSeek-V3); FP8 training (DeepSeek-V3); MXFP4 after training (gpt-oss); some layers without positional encoding (Llama 4). Llama 4's balancing method is not stated in its announcement, so it is not cited for that row.
- Seven sketches unchanged. Demo table kept, with the numbers reduced to what the comparison needs.
- Ashim then asked for black ink in the Excalidraw figure. The renderer gained a settings key `ink` (for example `"ink": "#111111"`) that replaces `currentColor` for strokes, labels and notes, and draws a white rounded card behind the figure so a fixed ink reads in dark mode too. Only `k3-architecture` uses it; the other six sketches keep the theme-following ink.
