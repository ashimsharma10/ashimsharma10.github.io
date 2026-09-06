---
title: 'The Architecture of Memory: KV Cache Dynamics, Optimization, and the Future of LLM Inference'
date: '2026-09-05'
tags: ['kv-cache', 'llm', 'inference', 'attention', 'gpu']
draft: false
summary: 'Modern LLM inference is memory-bound, and the KV cache is the reason. This report walks through why the cache exists, how large it gets, the attention changes that shrink it (GQA, DeepSeek MLA), how engines like vLLM and SGLang manage it, how quantization and eviction compress it, and how disaggregated serving moves it between machines.'
---

&nbsp;

The rise of Large Language Models has changed what computing infrastructure is for. As models grow in both parameter count and context length, the main bottleneck of AI has moved away from raw compute. Modern transformer inference is no longer compute-bound. It is memory-bound.

At the center of that shift is the **Key-Value (KV) cache**, a piece of memory the model needs in order to generate text one token at a time efficiently. Without the KV cache, the cost of inference grows with the square of the sequence length. With it, the cost grows linearly, but in exchange the model needs an unbounded, constantly growing amount of memory.

This report is an architectural analysis of the KV cache ecosystem. It covers the math that makes caching necessary, architectural changes like DeepSeek's Multi-Head Latent Attention (MLA), the memory management inside inference engines like vLLM and SGLang, aggressive compression through extreme quantization and token eviction, and the future of distributed serving through prefill-decode disaggregation.

## The Dual-Phase Anatomy of LLM Inference

To understand why the KV cache is necessary, and why it is such a burden, you have to separate the two phases of LLM inference: the **prefill** phase and the **decode** phase. Both run forward passes through the same transformer. But they stress the hardware in opposite ways.

### The Prefill Phase: Compute-Bound Parallelism

When a prompt arrives, the model starts the prefill phase. It tokenizes the whole input and processes it in a single parallel forward pass. Because every token is available up front, self-attention can compute the interactions between all tokens at once. This phase is made of large, dense matrix multiplications, which is exactly the workload GPUs are built for. Thousands of streaming multiprocessors run the same operation over large blocks of data at the same time, and the GPU's compute pipelines stay full.

During this pass, the model computes the Key (K) and Value (V) vectors for every token in the prompt, at every layer. Instead of throwing these away, the system stores them in the GPU's High Bandwidth Memory (HBM). That stored set is the KV cache. Prefill latency matters for the user, and it is usually measured as Time-To-First-Token (TTFT), but the phase is compute-bound: add more compute and it gets faster.

### The Decode Phase: The Memory Bandwidth Wall

After prefill, the model moves into the decode phase and produces the response strictly one token at a time. In a naive implementation with no cache, producing the $i$-th token means recomputing the Query, Key, and Value projections for all $i-1$ tokens before it. Producing $N$ tokens that way means reprocessing $\frac{N(N+1)}{2}$ token positions, which is $O(N^2)$ work.

The KV cache removes that redundancy. The Key and Value vectors for any earlier position depend only on that position's hidden state and the fixed model weights, so later tokens cannot change them. By keeping them in memory, the model only needs to compute the Query, Key, and Value for the single new token. The new Query attends over the cached history, and the new Key and Value are appended to it. The repeated work drops from $O(N)$ positions per step to exactly one, and generation becomes $O(N)$ overall.

<Sketch name="prefill-decode" />

This efficiency comes with a physical memory tax. At every decode step, the entire KV cache has to be loaded from off-chip HBM into the GPU's on-chip SRAM to compute the attention scores. That makes decode an extreme memory-bandwidth-bound operation. The GPU's compute cores sit idle while the cache streams across the memory bus, and that puts a hard ceiling on throughput.

### The Mathematics of Cache Expansion

The size of the KV cache is deterministic. It grows linearly with batch size, context length, number of layers, and hidden dimension. For a standard transformer with Multi-Head Attention (MHA), the memory per token across all layers is:

$$
M_{\text{KV}} = 2 \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times p_{\text{bytes}}
$$

The factor of 2 covers the separate Key and Value matrices, and $p_{\text{bytes}}$ is the width of the number format (2 bytes for FP16 or BF16).

| Model | Layers | KV heads | Head dim | Context | Precision | Total KV cache per request |
| --- | --- | --- | --- | --- | --- | --- |
| Llama-2-7B (MHA) | 32 | 32 | 128 | 4,096 | FP16 | ~2.1 GB |
| Llama-3-70B (GQA) | 80 | 8 | 128 | 128,000 | BF16 | ~42.0 GB |
| DeepSeek-V3 (MLA) | 61 | 1 (effective) | 576 | 128,000 | BF16 | ~9.0 GB |

Look at the Llama-3-70B row. Caching a single 128,000-token sequence takes over 40 GB of HBM for the KV cache alone. That is more than half of an 80 GB NVIDIA H100, before you count the model's 140 GB of weights. Because throughput scales with batch size, and batch size is limited by whatever memory is left over, managing this cache decides whether serving an LLM is economically viable.

<KVCacheBudget />

## Architectural Interventions in Attention Mechanisms

To fight this growth, model architects have changed the structure of self-attention itself, compressing the KV state before inference ever happens.

### From MQA to GQA: Reducing Head Dimensionality

The early fixes targeted the $n_{\text{kv\_heads}}$ term. In **Multi-Query Attention (MQA)**, all query heads share a single Key and Value projection. That shrinks the KV cache by a factor equal to the number of heads, so 32 times on a 32-head model. But forcing every head to attend to the same representation limits the model. Heads lose the ability to specialize in different syntactic or semantic roles, and reasoning quality drops noticeably.

**Grouped-Query Attention (GQA)** is the compromise. Query heads are split into groups, and each group shares one KV projection. Llama-3-70B uses 64 query heads in 8 groups, so 8 KV heads: an 8× reduction in cache size compared with MHA, while keeping enough head-specific capacity to hold task performance. GQA is now everywhere, but as contexts push past 100K tokens, even GQA caches overwhelm the hardware.

### DeepSeek's Multi-Head Latent Attention (MLA)

The most aggressive change in current open-weight models is **Multi-Head Latent Attention (MLA)**, used in DeepSeek-V2 and V3. MLA does not reduce the number of KV heads. It attacks the dimensionality of the cache directly by projecting attention state into a compressed, low-rank latent representation.

In a standard architecture, the full Keys and Values are cached. In MLA, the input is compressed by a down-projection matrix $W_{DKV} \in \mathbb{R}^{d_c \times d}$ into a single latent matrix $C_{KV} \in \mathbb{R}^{d_c \times n}$, where $d_c$ is a narrow latent dimension. Only this compressed $C_{KV}$ is stored in HBM. At inference time, two up-projection matrices ($W_{UK}$ and $W_{UV}$) expand the latent vector back into full Keys and Values. For DeepSeek-V3 this gives a 57× compression ratio: per token, per layer, the footprint drops from 65,536 bytes (for an MHA equivalent) to 1,152 bytes.

<MLACompression />

### The Weight Absorption Trick

A naive MLA implementation would have to load the compressed $C_{KV}$ cache and run the up-projections over the entire history at every decode step. That would destroy the compute savings and inflate latency. DeepSeek avoids it with the **weight absorption** trick, an algebraic rearrangement that never decompresses the cache at all.

Normally the attention score is $QK^T$. Under MLA, substituting the projections gives:

$$
QK^T = (X W_q)(W_{uk}^T W_{dkv}^T X^T)
$$

Matrix multiplication is associative, so the fixed matrices can be absorbed into one:

$$
W_{\text{absorbed}} = W_q W_{uk}^T
$$

Because $W_q$ and $W_{uk}$ are static model weights, their product is computed once, offline, when the engine starts. During inference the query is projected with this pre-computed matrix, and the dot product runs directly against the compressed $C_{KV}$ cache. The model computes attention scores natively in the smaller latent space, which cuts both memory bandwidth and FLOPs.

### Decoupled Rotary Positional Encoding (RoPE)

The hard part of implementing MLA is **Rotary Positional Encoding (RoPE)**. Standard RoPE applies a position-dependent rotation to the Keys and Queries. Because the rotation matrix is specific to each position, it does not commute with a fixed up-projection matrix: $R_{pos}(W_{uk}^T A) \neq W_{uk}^T R_{pos}(A)$. If RoPE were applied the normal way, weight absorption would break, and the model would have to rebuild full keys for every token just to apply position information.

DeepSeek solves this with **Decoupled RoPE**. Queries and Keys are split into two parts: a content part and a positional part. The content part goes through MLA compression and weight absorption. The positional part ($d_{rope} = 64$) stays uncompressed and is shared across all heads. The KV cache therefore stores $d_c + d_{rope}$ per token per layer, which keeps exact positional information while preserving both the memory compression and the weight absorption path.

## The Operating Systems of Inference: Memory Management

Whatever the attention architecture, the inference engine still has to allocate and manage GPU memory. Early engines reserved a contiguous block for each request, sized for the longest sequence it might ever reach. Because generation length is unpredictable, this caused heavy internal and external fragmentation, and regularly stranded up to 60 percent of GPU memory in empty, unusable buffers.

### PagedAttention: Virtual Memory for LLMs

vLLM changed inference memory management with **PagedAttention**. Borrowing directly from virtual memory in operating systems, PagedAttention splits the KV cache into fixed-size physical pages, or blocks, of 16 tokens each. Blocks are allocated on demand from a shared pool and mapped to a logically contiguous token sequence through a page table.

Because pages are only allocated when needed, and do not have to sit next to each other in memory, waste from over-allocation drops to near zero. That flexibility is what lets engines run **continuous batching** aggressively, packing far more concurrent requests onto one GPU and raising effective throughput by 2× to 4×.

### RadixAttention: Prefix Caching and Tree Structures

PagedAttention is excellent for isolated request-response loops. It does less well on multi-turn or agentic workloads where contexts overlap heavily. When many agents share a large, static system prompt, or when a code-generation model explores several branched solutions, a flat page table recomputes and duplicates the shared KV cache for every independent sequence.

SGLang addresses this with **RadixAttention**. Instead of a flat mapping of pages, it organizes the whole KV cache as a compressed trie, a radix tree. Every node holds a run of tokens. When a new request arrives, the router walks the tree to find the longest exact prefix match.

<Sketch name="radix-tree" />

If a swarm of agents shares a 5,000-token system prompt, the radix tree computes and stores it exactly once, at the root. When an agent forks into several reasoning paths, the system creates new branch nodes at the exact point of divergence, sharing all earlier memory with no copying. When memory runs out, a topology-aware Least Recently Used (LRU) collector evicts unreferenced leaf nodes while protecting shared parent nodes.

| Inference engine | Memory architecture | Best workload | Trade-offs |
| --- | --- | --- | --- |
| vLLM | PagedAttention | High-concurrency chat, standard serving | Mature paging and scheduling; prefix reuse is hash-based rather than a tree, which suits shared system prompts more than deep forking |
| SGLang | RadixAttention (prefix tree) | Agentic swarms, code forking, multi-turn | The radix router runs in Python and can become CPU-bound at very high request rates, adding latency |
| TensorRT-LLM | NVIDIA optimized paged cache | Maximum static performance | Peak throughput after compilation, but needs ahead-of-time compilation per model and GPU, and is less flexible when workloads change |

## Algorithmic Compression: Pushing the Boundaries

Even with ideal memory allocation, ultra-long-context models produce more state than the hardware can hold. To go further, researchers apply lossy compression at run time: quantization and selective eviction.

### The 2-Bit Quantization Barrier and KIVI

Quantization lowers the numerical precision of the cache. Converting model weights to 8-bit or 4-bit is routine, but quantizing the KV cache as it streams in during generation introduces errors that compound from one token to the next.

Uniform 4-bit quantization generally holds perplexity. Dropping to 2 bits, done the standard way, causes catastrophic failure. And the failure is not always visible where people look. Research on alignment collapse shows that low-bit KV quantization can silently destroy safety behavior: Mistral-7B lost 15.2 percent of its safety refusals while perplexity rose by only 1.03×, because the features that safety training relies on live in a small, fragile part of the representation that aggressive rounding wipes out.

The **KIVI** framework (Tuning-Free Asymmetric 2-bit Quantization) found the root cause by studying how outliers are distributed in Keys and Values, which turn out to be different.

**Keys have large, fixed outlier channels.** A few specific channels in the Key matrix carry very large values, for every token. Grouping numbers across the token dimension lets those channels dominate and erases the rest of the signal. KIVI quantizes the Key cache **per channel**, grouping along the channel dimension, so each outlier channel's error stays isolated in that channel.

**Values act as token mixers.** The Value cache has no obvious outlier channels, but it is used to compute the attention output as a weighted sum across tokens. Quantizing Values **per token** keeps one token's quantization error from corrupting its neighbors during that sum.

With 2-bit per-channel Keys and 2-bit per-token Values, KIVI achieves a 2.6× reduction in peak memory with near-zero accuracy loss, which allows up to 4× larger batches and higher throughput.

Beyond asymmetric quantization, **XQuant** shows that quantizing the layer input $X$, before it is projected into Q, K, and V, saves even more. $X$ is one tensor instead of two, and it tolerates low precision better; the Keys and Values are recomputed from it on the fly. Its cross-layer variant, which quantizes the small differences in $X$ between adjacent layers, reaches 12.5× memory compression relative to FP16 with negligible perplexity loss. Alongside this, adaptive frameworks use cheap per-token features such as entropy and attention variance to assign a different precision to each token, from FP16 down to 2-bit, keeping high precision only for high-entropy tokens.

### Token Eviction, Sparsity, and Structural Bias

Quantization shrinks how each token is stored. Eviction removes tokens entirely. Attention matrices at inference time are typically more than 95 percent sparse: most historical tokens contribute almost nothing to the next token. Unstructured sparsity methods have pruned up to 70 percent of the cache without any fine-tuning.

Frameworks like **H2O (Heavy-Hitter Oracle)** and Scissorhands use this power-law distribution and treat eviction as a dynamic submodular optimization problem. H2O keeps a running total of the attention each token has received. Tokens that keep receiving high attention, the heavy hitters, are kept permanently, and the long tail is evicted. This compresses the cache to as little as 20 percent of its dense size with little perplexity loss. Other methods, such as **SnapKV**, try to preserve local structure by keeping clustered chunks of information rather than isolated tokens.

But frequency-based eviction depends on statistical patterns that break on specialized workloads. Recent diagnostic work found a serious flaw in H2O on schema-dense inputs like JSON parsing or code execution, called **structural routing bias**. Structural tokens such as delimiters, whitespace, brackets, and JSON keys act as attention sinks, and accumulate up to 30× the attention mass of the actual content. H2O reads that attention as relevance. So it stubbornly keeps the structural noise and throws away the data, which leads to exact-match failures in reasoning: on one lookup task, accuracy at a 5 percent budget fell from 88 percent to zero.

Better eviction strategies fix this by combining **proxy-token** statistics, which gather importance signals from the question tokens at the end of a prompt, with **randomized stratified eviction**, which keeps a diversified sample from every part of the history so no region is wiped out entirely.

## Speculative Decoding: Amortizing the Memory Fetch

Even with every hardware and algorithmic optimization, loading a 40 GB KV cache to produce a single token is wasteful. **Speculative decoding** changes the generation loop itself: instead of producing one token per forward pass, it drafts several candidates and verifies them all at once.

The mechanism has two stages.

**Drafting.** A small, cheap model, or a draft head attached to the main model, quickly proposes a sequence of $K$ candidate tokens. Its parameter and KV footprint are tiny, so drafting is nearly free.

**Verification.** The large target model processes all $K$ drafted tokens in one parallel forward pass. Crucially, it reads its full KV cache from HBM exactly once to evaluate the entire drafted sequence.

Strict rejection sampling accepts only the drafted tokens that match the target model's own probability distribution, which mathematically guarantees the output is identical to normal autoregressive decoding. If 3 out of 5 drafts are accepted, the system produced 3 tokens for the memory-bandwidth cost of 1.

### Feature-Level and Parallel Speculation

Traditional speculative decoding needs a separate draft model, which is hard to keep aligned and adds deployment friction. **EAGLE** (Extrapolation Algorithm for Greater Language-Model Efficiency) moves speculation to the feature level. It feeds the target model's own final-layer hidden states into a lightweight draft head, so the drafter "sees" the target's internal representation. **EAGLE-3** goes further and fuses features from across all transformer layers, which pushes acceptance rates higher, especially on deterministic tasks like coding.

Drafting itself, though, is autoregressive: $K$ draft tokens need $K$ sequential passes through the draft head, and that becomes a new bottleneck as $K$ grows. **P-EAGLE** removes this ceiling by training the drafter to predict all $K$ tokens in a single parallel pass. This skips the autoregressive draft loop entirely and delivers up to a 1.69× speedup over EAGLE-3 on modern GPUs, with the gain largest for a single user and shrinking as concurrency rises.

### Tree Attention Verification

To raise acceptance rates without inflating compute, advanced implementations do not draft a single chain of tokens. They draft a **tree** of possibilities. In tree speculation, as in SpecInfer, the draft model explores several divergent branches at the same time.

Verifying a whole tree requires the FlashAttention kernel to support topology-aware masking, and the attention computation has to be split. The prefix attention, the query against the historical KV cache, is dense and needs no mask. The suffix attention, the query against the other drafted tokens in the tree, uses causal tree masks so that independent speculative branches do not attend to one another. vLLM and SGLang are both integrating this logic, which lets large token trees be evaluated in a single kernel call and raises tokens per second significantly.

## Kernel Optimizations and Hardware Horizons

Turning an algorithm into delivered throughput is a systems-engineering problem. Standard attention kernels do not saturate modern hardware during decode.

### Flash-Decoding and FlashInfer

FlashAttention (v1, v2, v3) made transformer training fast by tiling memory accesses to keep as much work as possible in SRAM and avoid slow HBM reads and writes. But FlashAttention parallelizes across batch size and query heads. In decode, the batch is small and the query length is exactly 1. For a single long-context prompt, FlashAttention leaves the GPU mostly idle, using less than 1 percent of the streaming multiprocessors.

**Flash-Decoding** adds a new dimension to parallelize over: the length of the KV cache itself. It splits the cache into smaller chunks and spreads them across all available GPU cores. Each core computes a partial attention result for its chunk. To combine the partials correctly and without numerical instability, Flash-Decoding uses a log-sum-exp reduction across the splits. The result is that decode time stays nearly constant as context grows from 512 to 64,000 tokens, with up to an 8× end-to-end speedup over standard FlashAttention on long-context generation.

**FlashInfer** provides a Just-In-Time (JIT) compiler that adapts these attention kernels on the fly. It maps paged KV cache layouts, like vLLM's, directly onto block-sparse matrix multiplications, keeping global memory loads coalesced and the Tensor Cores fed. With **FlashAttention-4** on NVIDIA Blackwell, the Tensor Memory Accelerator (TMA) speeds up large regular memory transfers, but developers have to balance larger page sizes, which raise memory throughput, against the internal fragmentation they cause, especially in short speculative decoding sequences.

### Leveraging Tensor Cores and Asynchronous Prefetching

Systems also try to hide HBM latency entirely. An L2-cache-oriented **asynchronous prefetching** method uses idle memory bandwidth during compute-heavy cycles to pull upcoming KV blocks into the GPU's L2 cache ahead of time. That hides the HBM access behind compute and prevents warp stalls. Hardware research goes further and proposes high-density CMOS+X M3D embedded memories with hundreds of megabytes of on-chip capacity dedicated to KV cache prefetching.

In parallel, systems like **BitDecoding** unlock the GPU's Tensor Cores, normally reserved for dense FP16 matrix multiplication, for low-bit KV decoding. A specialized packing kernel decompresses 2-bit or 4-bit KV caches inside the Tensor Core pipeline itself. BitDecoding reaches up to a 7.5× speedup on an RTX 4090 and 8.9× on an H100 compared with FP16 Flash-Decoding.

## Distributed Inference and the Disaggregated Future

As models and contexts keep growing, single-node inference is becoming a relic. The industry is moving to **Prefill-Decode (PD) Disaggregated** serving, which separates the two inference phases onto different hardware.

### PD-Disaggregation: Splitwise, Mooncake, and DualPath

In a standard monolithic deployment, prefill and decode run on the same GPU. Prefill is compute-heavy and decode is memory-heavy, so interleaving them causes severe interference. PD-Disaggregation sends incoming prompts to a dedicated pool of **Prefill Engines**, which run the dense compute work at full utilization. Once the prompt is processed, the resulting KV cache is sent over the network to a separate pool of **Decode Engines**, which are optimized for memory capacity and latency-sensitive token generation.

Splitwise, DistServe, and Mooncake pioneered this design. **Mooncake**, built as a KV-cache-centric system, uses a high-performance Transfer Engine. It streams the KV cache from the prefill engine to the decode engine layer by layer, using RDMA (Remote Direct Memory Access) over a RoCE compute network. Because of that pipelining, the decode engine can start generating tokens before the entire cache has arrived, which hides the network transfer entirely.

Moving these caches does congest the network, though. **DualPath** identified a specific bottleneck: in multi-turn conversations, the storage NICs on the prefill engines saturate while loading historical caches, and the network interfaces on the decode engines sit idle. DualPath adds a second, storage-to-decode path. The historical KV cache is loaded directly into the decode engines and forwarded back to the prefill engines over RDMA, which speeds up cache loading substantially for agentic workloads.

### Multi-Tier Storage, Offloading, and Pipeline Parallelism

Even with dedicated decode engines, GPU HBM is finite. Standard pipeline parallelism also wastes it: during decode, only one batch's KV cache is active on a GPU at any moment, and the rest of the memory is occupied by inactive batches. **PipeMax** combines pipeline parallelism with KV cache offloading, evicting the inactive caches to extend the GPU's effective memory.

**LMCache** and similar orchestration layers formalize a multi-tier memory hierarchy. When GPU memory fills, idle KV blocks are evicted to CPU DRAM. When DRAM fills, blocks cascade further down to local NVMe SSDs or distributed remote storage. When a user returns to a long session hours later, LMCache restores the cache asynchronously, using predictive LRU policies, and avoids a full-prompt recomputation.

<Sketch name="memory-tiers" />

Over high-bandwidth PCIe 5.0 links, this GPU-to-CPU-to-SSD pipeline lets a single server handle an order of magnitude more concurrent users than its HBM alone would allow.

## Synthesis and Strategic Outlook

The trajectory of LLM inference is, and will remain, dictated by how the KV cache is managed. As the industry moves toward multi-million-token contexts, persistent personalized agents, and large autonomous swarms, the physics of moving data between memory and compute will stay the defining engineering bottleneck.

The best deployments will not rely on one optimization. They will stack co-designed solutions. DeepSeek's MLA shows that the most powerful optimizations happen at the architectural level, compressing the latent space before training and relying on weight absorption at run time. That foundation has to be paired with low-level systems work, like SGLang's RadixAttention for zero-copy state sharing and Flash-Decoding's sequence-parallel kernels, to maximize memory reuse. On top of that, aggressive run-time interventions such as 2-bit asymmetric quantization, tree-based speculative decoding with P-EAGLE, and RDMA-backed prefill-decode disaggregation are moving quickly from research into production standards.

The KV cache has outgrown its original purpose. It is no longer a temporary buffer of intermediate matrix products. It has become a distributed, multi-tiered, carefully managed database that holds the explicit "memory" of an AI system. Learning to orchestrate it across algorithms, runtimes, and silicon is the prerequisite for the next generation of scalable AI infrastructure.

## Sources and further reading

- [DeepSeek-V2](https://arxiv.org/abs/2405.04434): MLA, weight absorption, and decoupled RoPE
- [GQA](https://arxiv.org/abs/2305.13245) and [Sebastian Raschka's KV cache calculations](https://sebastianraschka.com/llm-architecture-gallery/kv-cache-calculations/)
- [PagedAttention (vLLM)](https://arxiv.org/abs/2309.06180) and [SGLang / RadixAttention](https://arxiv.org/abs/2312.07104)
- [KIVI](https://arxiv.org/abs/2402.02750), [XQuant](https://arxiv.org/abs/2508.10395), and [Alignment Collapse Under KV Cache Quantization](https://arxiv.org/abs/2606.09864)
- [H2O](https://arxiv.org/abs/2306.14048), [SnapKV](https://arxiv.org/abs/2404.14469), and [Adaptive Filtering of the KV Cache](https://arxiv.org/abs/2607.13205) on structural-role bias
- [EAGLE-3](https://arxiv.org/abs/2503.01840), [P-EAGLE](https://arxiv.org/abs/2602.01469), and the [vLLM P-EAGLE post](https://vllm.ai/blog/2026-03-13-p-eagle)
- [Flash-Decoding](https://crfm.stanford.edu/2023/10/12/flashdecoding.html), [FlashInfer](https://arxiv.org/abs/2501.01005), [FlashAttention-4 for inference](https://modal.com/blog/flashattention-4-inference), and [BitDecoding](https://arxiv.org/abs/2503.18773)
- [Mooncake](https://arxiv.org/abs/2407.00079), [DistServe](https://arxiv.org/abs/2401.09670), [DualPath](https://arxiv.org/abs/2602.21548), and [LMCache](https://docs.lmcache.ai/)
