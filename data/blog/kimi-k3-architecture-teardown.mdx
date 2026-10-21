---
title: 'Kimi K3 Architecture Teardown'
date: '2026-09-28'
tags: ['kimi-k3', 'moe', 'attention', 'architecture', 'llm', 'training', 'inference']
draft: false
summary: "What is new in Moonshot AI's Kimi K3, part by part, and how each part differs from DeepSeek-V3, Qwen3, Llama 4 and gpt-oss: hybrid KDA and MLA attention for a million-token context, a latent expert layer, quantile load balancing, attention across depth, a soft-capped activation, a per-head optimizer, and training in the serving number format."
---

&nbsp;

## Scale: Total vs Active Parameters and Serving Economics

Kimi K3 is Moonshot AI's open-weight frontier model, released in July 2026. It is a sparse Mixture of Experts in the same family as DeepSeek-V3, Qwen3 and Kimi K2, and about three times the size of its predecessor. Size is the least interesting part. Almost every component of the stack has been replaced, and the report ties each replacement to a problem that appears when you train at this scale.

This post is about those replacements: what each one is, what the other open models do instead, and why Moonshot changed it. If MoE routing is new to you, start with the [Mixture of Experts write-up](/write-up/mixture-of-experts).

<Sketch name="k3-architecture" alt="Redrawn from Figure 2 of the Kimi K3 technical report. Right: the stack, read bottom to top. An image goes through MoonViT-V2 and an MLP into the embedding; the embedding feeds block n minus 2, then block n minus 1, then an attention node marked alpha with a learned query w; that node feeds a dashed block containing KDA, Stable LatentMoE, Gated MLA and Stable LatentMoE in a chain, with brackets marking the KDA pair as repeated three times and the MLA pair once; the block's output passes a second alpha node to the output. Red lines run from the embedding and the two earlier blocks into both alpha nodes, labelled AttnRes, attention over earlier blocks. Top left, the Stable LatentMoE inset: the input splits to two shared experts, a router, and a down-projection into 16 of 896 routed experts, whose sum goes through a norm and an up-projection before joining the shared experts at a plus. Bottom left, the KDA inset: the input fans into four columns, q and k through Linear, Conv, SiLU and L2 norm, v through Linear, Conv and SiLU, alpha and beta through Linear and a sigmoid, and a gate through Linear and a sigmoid; the first three feed the KDA box, then a norm, then a multiply with the gate, then an output Linear" />

*Visual 1: The architecture, redrawn from Figure 2 of the Kimi K3 technical report. Right: the stack, with Attention Residuals in red reading across blocks. Top left: one Stable LatentMoE layer. Bottom left: one KDA layer.*

| Part | Kimi K3 | The common choice |
| --- | --- | --- |
| Attention | 3 KDA layers to 1 Gated MLA, no positional encoding in MLA | MLA everywhere (DeepSeek-V3, K2); grouped-query attention (Qwen3, gpt-oss) |
| Expert layer | experts run in a latent space, RMSNorm on their sum | full-width fine-grained experts, sum added as is (DeepSeek-V3, Qwen3, K2) |
| Load balancing | bias set from a score quantile | bias nudged by a fixed step (DeepSeek-V3, K2); auxiliary loss (Qwen3) |
| Residual path | attention over earlier blocks | a running sum of every layer (all of them) |
| Activation | SiTU-GLU, soft-capped | SwiGLU, unbounded (all of them) |
| Optimizer | Per-Head Muon with weight clipping | AdamW (DeepSeek-V3); MuonClip (K2) |
| Numerics | MXFP4 experts and MXFP8 activations in the training loop | FP8 training (DeepSeek-V3); MXFP4 applied after training (gpt-oss) |

Sparsity itself is not new. Like DeepSeek-V3, K3 runs a small fraction of its weights per token, so the serving cost is memory and network traffic rather than arithmetic. What is new on the serving side is the cache. KDA keeps a fixed-size state instead of a growing KV cache, and Mooncake's prefix cache checkpoints that state, so a repeated prompt resumes prefill from the hit point. That is why a cached input token costs a tenth of a fresh one.

## Stable LatentMoE vs DeepSeekMoE

DeepSeekMoE set the expert layout every open MoE now uses: many thin experts a token can combine, plus a shared expert every token passes through. K3 keeps that layout and changes two things. The routed experts run in a latent space at half the model width, which halves their cost and is what pays for 896 of them per layer. And their weighted sum passes through an RMSNorm before it rejoins the shared branch, so the routed branch always arrives at one fixed scale.

In DeepSeek-V3 and Qwen3 that sum is added as is, and its size swings with which experts fired. The report names runaway activations as the failure the norm prevents.

<Sketch name="latent-moe" alt="A vertical chain for one Stable LatentMoE layer: the token at width 7168, a down-projection to a latent of width 3584, 16 of 896 routed experts running on the latent with SiTU-GLU inside, a weighted sum of their outputs, an RMSNorm highlighted in yellow, an up-projection back to width 7168, the addition of the two shared experts at full width, and the output. Side notes say the router scores the full-width token with a sigmoid plus the balancing bias and keeps the top 16, that experts are cheaper at half the width, that the norm gives the routed branch one fixed scale before it meets the shared experts, and that the shared experts see every token and never go through the latent" />

*Visual 2: One Stable LatentMoE layer. The routed branch runs in the latent and gets one fixed scale. The shared experts never leave full width.*

## Load Balancing: Quantile Balancing vs Bias Terms

Every MoE has to stop a few experts from winning all the traffic. Qwen3 uses an auxiliary loss, which fights the language modeling loss. DeepSeek-V3 and K2 use a bias per expert, nudged by a fixed step each batch, which leaves a step size to tune. K3 sets the bias directly: it keeps a histogram of each expert's routing margins and reads off the quantile that gives the expert exactly its target share. No loss term, no step size, and the load is set in one update rather than chased.

<Sketch name="quantile-balancing" alt="The report's toy example with eight tokens, four experts and top-1 routing. A before row shows expert loads of four, three, one and zero, with the overloaded expert in red. A yellow step box reads: for each expert, take the histogram of routing margins and set its bias at the quantile where exactly two of eight tokens cross. An after row shows every expert with two tokens. A note says DeepSeek-V3 nudges each bias by a fixed step per batch while K3 reads the bias straight off the score distribution" />

*Visual 3: The report's toy example. Loads of 4, 3, 1, 0 become 2, 2, 2, 2 in one update.*

## Hybrid Attention for 1M Tokens: KDA and Gated MLA

The attention is where K3 departs furthest from the field. DeepSeek-V3 and K2 use MLA in every layer, Qwen3 and gpt-oss use grouped-query attention, and all of them keep a KV cache that grows with the context. K3 uses Kimi Delta Attention, a linear attention with a fixed-size state per head, in three layers out of four, and Gated MLA in the fourth. The state does the long spans cheaply. The MLA layers do exact lookup across the whole context.

<Sketch name="kda-mla-stack" alt="A column of four layer boxes, three labelled KDA plus Stable LatentMoE and one labelled Gated MLA with NoPE plus Stable LatentMoE, with a note that the block of four repeats 23 times and then layer 93 is one more Gated MLA. Side notes: KDA has 69 layers and a fixed-size state per head so memory does not grow with length; Gated MLA has 24 layers with a compressed latent KV cache and global lookup over the context; MLA uses no position encoding and position comes from the KDA decay; the context is 1,048,576 tokens" />

*Visual 4: The 3:1 pattern, and what each kind of layer keeps in memory.*

KDA's state is rewritten once per token: decay every channel a little, erase part of what was stored under the current key, write the new value. Two details are K3's own. The decay is floored so a 16-token tile stays in BF16 range and runs on Tensor Cores, which earlier linear attention could not do. And the MLA layers use no positional encoding at all, a move Llama 4 also made in some layers. Position comes from the KDA decay around them, so nothing is stretched past its training length, which is where long contexts usually fray.

<Sketch name="kda-state-update" alt="A note at the top says standard attention appends to a cache that grows while KDA rewrites one fixed state. Below it, a vertical chain of four state boxes: the state from the last token, the state shrunk a little in every channel after step one decay, the state minus what it held for this key after step two erase, and the new state for this token after step three write. Side notes say the decay is per channel and bounded by K3 so long spans stay stable, that the erase removes a beta-scaled share of the old value stored under this key, that the write adds the new key-value pair scaled by a learned beta, and that the state is the same size after a million tokens as after ten" />

*Visual 5: One KDA step. The state is the same size after a million tokens as after ten.*

## Attention Residuals: Depth-wise Attention Instead of Sums

Every Transformer since the original, DeepSeek and Qwen included, adds each layer's output to a running sum. The sum keeps growing with depth, so deep layers have to shout to be heard. Moonshot's Attention Residuals paper calls this PreNorm dilution, and K3 ships the paper's alternative: each block learns a query, scores the earlier blocks against it, and takes a weighted mix, so a deep layer can read the embedding directly. The Block variant, 8 blocks of 12 layers, keeps the cost at nine stored summaries instead of 93.

<Sketch name="attnres" alt="Three rows. Row one, standard residual: five layer outputs v0 to v4 feed the next layer's input through a sum with all weights one, with a note that deep layers add little to a sum that already holds everything. Row two, Full AttnRes: the same five outputs feed the next layer through softmax weights, with a note that each layer picks which earlier outputs to read and every output is kept. Row three, Block AttnRes, what K3 uses: three block boxes feed the next block's input through attention, with a note that there are 8 blocks of 12 layers, plain sums inside a block and attention across blocks" />

*Visual 6: Three residual designs. K3 uses the third.*

## Training Stability at 3T Scale

Most of the remaining changes bound something the standard recipe leaves unbounded. The optimizer is Per-Head Muon: Muon's orthogonalized updates, split per attention head so no head's gradients dominate, with K2's weight clipping to keep attention logits in range. DeepSeek-V3 trains with AdamW. The activation is SiTU-GLU, a tanh soft-cap on both branches of the feed-forward block, where everyone else uses unbounded SwiGLU.

The number format is part of training too. K3 is fine-tuned and reinforced with MXFP4 expert weights and MXFP8 activations in the loop, where DeepSeek-V3 trains in FP8 and gpt-oss quantizes to MXFP4 after the fact. The model that ships is the model that was trained.

<Sketch name="stability-stack" alt="Five horizontal bars with notes. Optimizer: Per-Head Muon plus weight clipping, every head gets an update of similar scale and attention logits are kept in range. Activations: SiTU-GLU softcap, gate bounded at 4 and up branch at 25. Expert sum: RMSNorm before the up-projection, one scale for the routed branch. Routing: Quantile Balancing, every expert keeps its target share. Post-training: quantization-aware training with MXFP4 experts and MXFP8 activations, trained through SFT and RL so serving matches training" />

*Visual 7: Five bounds, from the optimizer down to the serving format.*

## Post-Training: Long-Horizon Demos, Not Benchmarks

Post-training follows the now-common recipe: supervised fine-tuning, reinforcement learning, and distillation back into one model. The report's distinctive move is to show results as three long projects rather than only scores.

| Demo | What K3 built | What the report says |
| --- | --- | --- |
| MiniTriton | a Triton-like compiler: Python tile frontend, MLIR layer, PTX code generation | trains a small GPT end to end; built with a maintainer's direction and review |
| Kernel optimization | a faster kernel for its own Attention Residuals | latency cut by more than half within a 24-hour budget; the one task scored against other models |
| Chip design | an inference-chip prototype for a nano model, through open EDA tools | a single 48-hour autonomous run; timing closed in RTL simulation |

Only the kernel task is scored against other models, so read the compiler and the chip as demonstrations.

## What We Learned

- **K3 is a redesign, not a scale-up.** Seven parts changed, each tied to a failure at this size.
- **Attention is the big departure.** A fixed-size state in three layers of four, exact lookup in the fourth, no positional encoding.
- **Experts moved into a latent space and got a norm.** DeepSeek's layout, made cheaper and steadier.
- **Balance is set, not chased.** The bias comes off a quantile, with no loss term and no step size.
- **Everything else got a bound.** Attention over depth, a per-head optimizer, a capped activation, and training in the serving format.

## Sources and further reading

- Kimi K3: [Kimi K3: Open Frontier Intelligence (arXiv:2607.24653)](https://arxiv.org/abs/2607.24653), [release blog](https://www.kimi.ai/blog/kimi-k3), [Hugging Face model card](https://huggingface.co/moonshotai/Kimi-K3), [GitHub](https://github.com/MoonshotAI/Kimi-K3)
- Expert layer and balancing: [LatentMoE (arXiv:2601.18089)](https://arxiv.org/abs/2601.18089), [DeepSeek-V3 (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437), [Auxiliary-loss-free load balancing (arXiv:2408.15664)](https://arxiv.org/abs/2408.15664)
- Attention: [Kimi Linear (arXiv:2510.26692)](https://arxiv.org/abs/2510.26692), [Attention Residuals (arXiv:2603.15031)](https://arxiv.org/abs/2603.15031)
- Lineage and serving: [Kimi K2 (arXiv:2507.20534)](https://arxiv.org/abs/2507.20534), [Mooncake (arXiv:2407.00079)](https://arxiv.org/abs/2407.00079)
- The models compared: [Qwen3 technical report (arXiv:2505.09388)](https://arxiv.org/abs/2505.09388), [Llama 4 announcement](https://ai.meta.com/blog/llama-4-multimodal-intelligence/), [gpt-oss model card (arXiv:2508.10925)](https://arxiv.org/abs/2508.10925)
- Demos: [MiniTriton](https://github.com/MoonshotAI/minitriton)
- Further reading: [Sebastian Raschka's K3 architecture notes](https://sebastianraschka.com/blog/2026/kimi-k3-architecture-notes.html), [nor's walkthrough of Quantile Balancing](https://nor-blog.pages.dev/posts/2026-09-02-quantile-balancing/)
