---
title: 'The Architecture of Memory: KV Cache Dynamics, Optimization, and the Future of LLM Inference'
date: '2026-09-05'
tags: ['kv-cache', 'llm', 'inference', 'attention', 'gpu']
draft: false
summary: 'The model weights are a fixed number. The thing that actually fills the GPU, and decides how many people you can serve, is a growing store of everything the model has already read. This is what that store is, why it gets so big, and the main ways people shrink it, share it, move it, and throw parts of it away.'
---

&nbsp;

A 70 billion parameter model takes 141 GB of memory for its weights. That number never changes. You know it before you buy a single GPU.

Then you start serving the model, and the GPU fills up with something else. It grows with every word anyone types. It has to be read from top to bottom before each new word comes out. And the model card never mentions it.

That thing is the **KV cache**. Once you understand it, most of what modern inference systems do stops looking like a pile of tricks and starts looking like one long fight with a memory bus.

## Why the cache exists

Every word that goes into a transformer gets turned into three small vectors.

- A **query**: the question this word asks about everything before it.
- A **key**: how this word describes itself to future questions.
- A **value**: what this word hands over when a question matches it.

To pick the next word, the newest query is compared against every key from the past. The matches decide how much of each value to blend in.

Now notice which of the three ever change. The key and value for word number 12 depend only on word 12 and the model's weights. Nothing later can change them. Once computed, they are final. The query is different: it is used once, at the moment it is made, and never again.

So the model keeps the keys and values and throws the queries away. That saved pile is the cache.

Without it, producing each new word would mean recomputing the keys and values of every earlier word. Writing a 1,000-word answer would redo the work for word 1 a thousand times. With the cache, each new word computes one key and one value, adds them to the pile, and reads the rest.

| | Kept in the cache? | Why |
| --- | --- | --- |
| Keys | yes | read again at every future step |
| Values | yes | same |
| Queries | no | used once and done |

The cache is not an optimization someone added later. It is what makes generation not get slower with every word. The price is that it grows, one key and one value per word per layer, and it has to sit somewhere the GPU can reach quickly.

## Reading a prompt and writing an answer are different jobs

The cache is built in one phase and consumed in another.

When your prompt arrives, all of its words are available at once, so the model processes them together in one big pass. This is **prefill**. It is one large multiplication, which is exactly what GPUs are good at, and it is where the cache gets written. You feel it as the pause before the first word appears.

Then the model produces the answer one word at a time. This is **decode**. Each step does very little math, for one word. But it has to read the whole cache to do it. Every key and value, every layer, all the way back to the start.

<Sketch name="prefill-decode" />

| | Prefill | Decode |
| --- | --- | --- |
| Words per pass | thousands | one |
| What it mostly does | math | reading memory |
| What makes it slow | not enough compute | not enough memory speed |
| Cache | written | read, in full, every step |

Here is the number that makes this real. A top GPU can move about 3 terabytes per second between its memory and its compute. If one conversation's cache is 43 GB, which is a 70B model at its full 128K context, just reading it takes about 13 milliseconds. That is the floor for one word, before any math happens. Around 80 words per second at best, with the compute sitting idle most of that time.

And here is the part that surprises people. The usual fix for a memory bottleneck is batching: read the weights once, use them for many users. That works for weights, because everyone shares them. It does not work for the cache, because every user has their own. Put 16 users with long conversations in one batch and you read 16 caches per step. Batching stops helping once the caches outweigh the weights.

## How big it gets

The size follows a simple rule. For every word, every layer stores one key and one value, and each of those is a vector of some length. Multiply those together, multiply by the number of layers, and by how many bytes each number takes, and you have the cache per word. Multiply by the context length for the cache per conversation.

| Model | Cache per word | Cache for one full 128K conversation |
| --- | --- | --- |
| Llama 2 7B | 512 KB | 68.7 GB, though it only supports 4K, where it is 2.1 GB |
| Llama 3 8B | 128 KB | 17.2 GB |
| Llama 3 70B | 320 KB | 42.9 GB |
| DeepSeek V3 | 69 KB | 9.2 GB |

Sit with the 70B row. One conversation at full length needs 43 GB, on a model whose weights already need 141 GB. Two 80 GB GPUs give you 160 GB. Take out the 10 percent the engine keeps for itself, subtract the weights, and you have 3 GB left for the cache. That is why nobody serves a 70B model on two cards. On four, you can hold about 13 users at a 32K context, or three at the full length.

Try it. Change the model and watch which column decides the answer:

<KVCacheBudget />

Two things jump out. DeepSeek V3 is about 80 times bigger than Llama 3 8B, yet its cache is smaller. And almost every part of the rule is fixed when the model is trained. You inherit it. The only part you can change at serving time is how many bytes each number takes.

## Shrinking the cache inside the model

Since most of the size is decided at training time, the biggest wins came from changing how attention is built.

**Fewer key and value heads.** Attention runs several "heads" in parallel, each with its own keys and values. The first idea was to let heads share. If all the heads share one set of keys and values, the cache shrinks by the number of heads, but quality drops because every head sees the same summary of the past. Grouping is the compromise that won: heads are split into a few groups and each group shares one set. Llama 3 70B has 64 heads in 8 groups, so the cache is 8 times smaller than it would be, at almost no cost in quality. This is called **grouped-query attention**, and nearly every model since 2023 uses it.

**A compressed summary instead of full keys and values.** DeepSeek went further. Instead of storing fewer copies of the full keys and values, it stores one small compressed vector per word, and expands it back out when a head needs it. This is **multi-head latent attention**. In DeepSeek V3 the compressed vector has 576 numbers. The full keys and values it stands in for would have 32,768. Both bars below are drawn to the same scale.

<MLACompression />

That is 57 times smaller, and it is the whole reason the DeepSeek row in the table above is the smallest.

Two problems had to be solved to make it fast.

The first is that expanding the compressed vector back into full keys, for every past word, at every step, would cost more compute than it saved in memory. The fix is algebra. The expansion is a fixed matrix, and the query projection is a fixed matrix, so you can multiply the two together once, when the model loads, and use the combined matrix on the query instead. The compressed vectors are then compared directly, and the full keys never get built. DeepSeek calls this **weight absorption**.

The second is position. Models tell words apart by position by rotating each key a little, and the rotation is different for every position. That per-position rotation cannot be folded into the fixed matrix. So DeepSeek split the key in two: a compressed part that carries meaning and skips the rotation, and a small separate part, 64 numbers, that carries position and gets rotated. The 64 is shared across all heads so it stays small. That is where the 512 + 64 in the figure comes from.

## Storing it without wasting space

Once the model decides how big each entry is, the serving engine decides where to put them.

Early engines reserved one long block of memory per conversation, sized for the longest answer it could possibly produce. Most conversations were short, so most of each block sat empty. Across a server, more than half of the cache memory was reserved and unused.

vLLM fixed this the way operating systems fixed the same problem decades ago. Cut the cache into small fixed-size pages, hand them out as needed from a shared pool, and keep a table saying which pages belong to which conversation. A conversation's pages can be scattered anywhere; the table keeps them in order. Waste drops to almost nothing.

Pages also make sharing easy. If two conversations start with the same system prompt, they can point at the same pages. But the engine still has to notice that they share a prefix. SGLang's answer is to keep the whole cache in a **tree**. Each branch is a run of words. A new request walks down the tree as far as its words match, reuses everything on that path, and only computes the part that is new.

<Sketch name="radix-tree" />

This matters most for agents. A fleet of agents that all start from one long system prompt computes it once. An agent that tries three approaches to a problem branches three ways from the point where they differ, sharing everything before it. When memory runs out, the engine drops the least recently used leaves, never a branch that still has children.

The rule to remember: put the parts of a prompt that change, like a timestamp, at the end, not the start. The match is exact and left to right, so one changed word near the front makes everything after it cold.

## Storing each number with fewer bits

Everything above changes how many numbers you store. You can also store each number smaller.

Weights are easy to shrink this way. They never change, so you can study them and pick the best rounding before anyone shows up. The cache is harder. It is produced live, one word at a time, and every rounding error feeds into the next word's output, which feeds into the next cache entry. Errors compound.

Halving each number, from 16 bits to 8, is close to free and every serious engine does it. Going to 4 bits mostly works. Going to 2 bits, done the obvious way, breaks the model.

The KIVI paper found out why, and the reason is that keys and values fail differently.

Keys have a few specific positions that are always huge, for every word. If you round groups of numbers together across words, those huge positions dominate every group and flatten everything else to zero. So round keys **one position at a time, across all words**, and the huge positions stay in their own lane.

Values have no such positions. But values get added up, weighted by attention, across all past words. If you round them position by position, one word's error leaks into the whole sum. So round values **one word at a time**, and each word's error stays with that word.

| | Keys | Values |
| --- | --- | --- |
| The problem | a few positions are always huge | they get summed across words |
| Round them | per position, across words | per word, across positions |

With that split, a 2-bit cache holds up, memory drops by about 2.6 times, and you can fit several times more users on the same card.

One warning that matters more than the numbers. A recent study found that shrinking the cache can quietly break a model's safety training long before its normal quality scores move. In one case the model kept its usual accuracy but stopped refusing harmful requests 15 percent of the time. The usual quality metric, perplexity, does not see this. If you go below 8 bits, test the things you actually care about, not the number that is easy to measure.

## Forgetting on purpose

Rounding keeps every word and stores it smaller. Eviction keeps fewer words. It is a bigger lever and a more dangerous one, because once a word is gone the model can never look at it again.

The case for it is that attention is very unevenly spread. At any step, most of the attention lands on a small fraction of past words. The rest barely matter. Studies regularly find that most of the cache can be dropped without much visible damage.

The best-known method, called **H2O**, keeps a running score of how much attention each word has received. When memory is tight, it drops the words with the lowest scores and keeps the "heavy hitters" that the model keeps coming back to. One more rule every method follows: the first few words of a conversation get a strange amount of attention no matter what they say. They act as a place for the model to park attention when nothing is relevant. Drop them and generation falls apart, so they are always kept.

Try the policies on a plain sentence, then switch the input to JSON:

<KVEvictionSim />

Here is the problem. On ordinary text, attention roughly tracks importance. On structured text like JSON, code, or tables, it does not. Braces, quotes, colons and field names soak up attention the same way the first word does, not because they carry the answer but because the model needs them to parse the structure. A 2026 study measured this: on structured inputs, punctuation and field names received around 30 times the attention of the actual values. H2O sees that attention and keeps them. At a tight memory budget, accuracy on a simple lookup task fell from 88 percent to zero. The braces survived. The answers did not.

This is exactly the kind of input agents and retrieval pipelines feed a model all day, and it is missing from most benchmarks. The fix is small once you know: discount structural tokens before ranking, so they cannot crowd out content. The "role-aware" option in the demo does this. The bigger lesson is about testing. A model that has forgotten the values in your JSON will still produce fluent, well-formed JSON. Only a test that checks the actual values will catch it.

## Reading the cache fewer times

Everything so far made the cache smaller. You can also read it less often.

A normal decode step reads the whole cache to produce one word. **Speculative decoding** produces several words per read. A small, cheap helper guesses the next few words. The real model then checks all of the guesses in a single pass, which reads its cache once. It keeps the guesses it agrees with and discards the rest. The output is exactly what the big model would have written on its own; it just arrives sooner. If three of five guesses are right, you got three words for the cost of one cache read.

The helpers have gotten better. Newer ones look at the big model's internal state rather than just its output, so they guess well, and the latest ones make all their guesses in one pass instead of one at a time. Reported speedups over the previous best are about 1.7 times for a single user.

That "single user" is the honest part. Speculation uses spare compute to save memory reads. With one user, the GPU has plenty of spare compute. As more users share the GPU, there is less to spare and every wrong guess is wasted work. At high load the gain fades toward zero. It is a feature for making a chat feel fast, not for serving more people.

## Reading the cache faster

There is also the question of whether the GPU can read the cache at full speed at all. For a long time it could not.

The fast attention kernel used in training splits work across the batch and across attention heads. That is fine when there are thousands of queries. In decode there is one query per conversation. A single long conversation ends up using a handful of the GPU's cores while the rest sit idle, and a 64K-word cache gets walked by a few workers.

**Flash-Decoding** splits along a third axis: the cache itself. Chop the cache into chunks, give each chunk to a different set of cores, let them each compute a partial answer, then combine the partials at the end. The combination is exact. The effect is that a longer cache just means more chunks in flight on cores that were idle anyway, and the time per word stops growing with context length. Every serious engine now does some version of this.

A related trick closes the loop with the rounding section. A 2-bit cache should read four times faster than a 16-bit one, but standard kernels unpack it on the slow part of the GPU and give most of the gain back. Newer kernels feed the packed numbers straight to the fast tensor cores. That is what makes the smaller cache actually faster, not just smaller.

## When one GPU is not enough

At some point the cache does not fit, no matter how small each entry gets. Then the question is where to put the parts you are not using right now.

GPU memory is fast and small. The CPU's memory next to it is slower and much larger. Local SSDs are slower again and enormous. And storage across the network is slowest and unlimited. Modern systems treat these as tiers. Active conversations stay on the GPU. When a user goes quiet, their cache moves down. When they come back hours later, it moves back up, ideally before their request arrives.

<Sketch name="memory-tiers" />

Is fetching an old cache actually cheaper than just recomputing it? Almost always, per byte. Recomputing a 70B model's cache produces a few gigabytes of it per second per GPU. Every tier above can deliver bytes faster than that. The catch is latency: a short prompt is recomputed in a few milliseconds, faster than a round trip to disk begins. So the rule is: recompute short and cold, fetch long and warm.

The last step is to split the two jobs from the start of this post across different machines. Prefill goes to one pool of GPUs built for compute. Decode goes to another built for memory. The cache is shipped between them over a fast network link that bypasses the CPU, layer by layer as prefill produces it, so decode can start before the whole thing has arrived. Each pool gets sized for its own bottleneck, and a long prompt arriving can no longer stall everyone else's answer. The systems behind Kimi and others work this way, and the new problems are exactly what you would expect: the network carries a cache-sized transfer per request, and the router has to know which machine already holds which prefix.

## What to remember

The cache exists because keys and values never change and queries are used once.

Its size is decided when the model is trained. You inherit it. The one architectural change that moved the number by 57 times was storing a compressed summary instead of full keys and values.

Below 8 bits, keys and values need different rounding, and the usual quality score will not tell you when you have gone too far.

Any method that treats attention as importance will keep the braces and throw away the answers. Test on the inputs you actually serve.

And when it no longer fits, the whole system, from the kernel to the network, is organized around one question: how do we avoid reading this thing more than we have to?

## Further reading

- [DeepSeek-V2](https://arxiv.org/abs/2405.04434), the paper that introduced multi-head latent attention, including weight absorption and the split positional key
- [PagedAttention](https://arxiv.org/abs/2309.06180), the vLLM paper, and [SGLang](https://arxiv.org/abs/2312.07104), which introduced the prefix tree
- [KIVI](https://arxiv.org/abs/2402.02750) on 2-bit caches, and [Alignment Collapse Under KV Cache Quantization](https://arxiv.org/abs/2606.09864) on what perplexity misses
- [H2O](https://arxiv.org/abs/2306.14048) on heavy-hitter eviction, and [Adaptive Filtering of the KV Cache](https://arxiv.org/abs/2607.13205) on why it fails on JSON
- [Flash-Decoding](https://crfm.stanford.edu/2023/10/12/flashdecoding.html) from Stanford, and [P-EAGLE](https://vllm.ai/blog/2026-03-13-p-eagle) on parallel speculative decoding
- [Mooncake](https://arxiv.org/abs/2407.00079) and [DualPath](https://arxiv.org/abs/2602.21548) on serving across machines
- My [vLLM write-up](/write-up/vllm-how-a-token-gets-served), which covers the serving engine around all of this
