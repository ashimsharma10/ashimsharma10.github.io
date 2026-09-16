---
title: 'The Continual Learning Loop'
date: '2026-09-15'
tags: ['continual-learning', 'agents', 'llm', 'lora', 'reinforcement-learning', 'claude']
draft: false
summary: 'A long-running agent has to keep learning without forgetting what made it useful. This write-up covers catastrophic forgetting and how it is measured, the four families of fixes, memory in token space, continual RLVR, the production data flywheel, its guardrails, the multi-LoRA serving shape, and how to run the same loop with Claude.'
---

&nbsp;

## The Transition to Lifelong Learning in AI Agents

A chatbot lived for one session. An agent now runs for months, and a model that stops learning at its last training step goes stale as the APIs, the codebase and the user's habits change.

Both of the old answers fail. Fine-tune once, and the knowledge freezes on that day. Retrain from scratch every few months, and every cycle costs offline compute, a curated mix of old and new data, and downtime, for every user you serve. Any update to the weights can also erase what the model already knew.

The continual learning loop sits between them. It updates the agent in small steps as feedback arrives, so every interaction becomes a training signal. The hard part is the balance. The agent has to stay plastic enough to learn the new thing and stable enough to keep the old ones.

<Sketch name="cl-loop" alt="The continual learning loop as seven stages: a deployed agent serves traffic, traces and feedback are collected, filtered and labelled, a reflection step explains each failure and writes a corrected attempt, the update changes adapter weights or memory files, a regression gate on a golden set decides, and the new version is promoted and redeployed; a note says a failed gate keeps the old version" />

*Visual 1: The loop. Stages 1 to 7 repeat. The rest of this post follows it around once: what breaks at each stage, and how teams keep it stable.*

## The Architecture of Catastrophic Forgetting

Stage 5 is where things break. Train a network on task A, then take gradient steps on task B, and the weights move toward B alone. Knowledge in a transformer is spread across billions of shared parameters, so even a small update disturbs what A depended on. Performance on A drops, often sharply.

The damage sits in two places. Early attention heads lose focus, and their attention spreads over tokens that do not matter. Deeper MLP blocks and expert routers get overwritten, and with them the reasoning paths a task relied on.

<Sketch name="forgetting-map" alt="A transformer stack from input embeddings to output head with the new task's gradients arriving from the top; the mid-to-deep MLP and router layers are marked with representation collapse, the early attention layers with entropic dispersion, and a note explains spurious forgetting and that freezing the early layers helps" />

*Visual 2: Two failure regions, and a caveat: not every drop is lost knowledge.*

That caveat is spurious forgetting. The first steps on a new task disturb the model's habit of activating the right functions before they erase any knowledge. Freezing the bottom layers keeps that habit. In the paper that named the effect, it lifted accuracy on old tasks from 11% to 44%.

To fight forgetting you have to measure it. Record $R_{i,j}$, the score on task $j$ after training through task $i$, and read three numbers off that matrix.

$$
\mathrm{BWT} = \frac{1}{T-1}\sum_{i=1}^{T-1}\left(R_{T,i} - R_{i,i}\right)
$$

In plain terms: for each earlier task, compare its score at the end of the sequence with its score right after it was learned. A negative average is forgetting.

| Metric | What it measures | What you want |
| --- | --- | --- |
| Backward transfer (BWT) | How learning new tasks changed the scores on old ones | Zero or positive; negative is forgetting |
| Forward transfer (FWT) | How much old tasks help a new task before it is trained on | High; it is zero-shot generalization |
| Average accuracy (ACC) | Mean score across all tasks at the end | The headline number |

## Mitigation Families: From Parameter Regularization to Replay Buffers

Every fix for forgetting belongs to one of four families.

**Regularization** makes it expensive to move the weights that mattered before. Elastic Weight Consolidation (EWC) is the original. It scores each weight's importance for task A with the Fisher information, then charges for moving the important ones.

$$
\mathcal{L}(\theta) = \mathcal{L}_B(\theta) + \sum_i \frac{\lambda}{2}\, F_i \left(\theta_i - \theta^{*}_{A,i}\right)^2
$$

In plain terms: train on task B as usual, but pay a penalty for moving any weight that mattered for task A, and pay the most for the weights that mattered most. $F_i$ is the diagonal of the Fisher information, estimated from squared gradients on task A's data.

The diagonal is an approximation, so it sometimes protects the wrong weights. "EWC Done Right" repairs the estimate. L2-SP is simpler and pulls every weight back toward the pretrained starting point.

**Replay** mixes old experience into the new training. That can be summaries of past runs in the context window, the most surprising outcomes replayed first, or a rehearsal schedule that follows a forgetting curve. When old data cannot be kept at all, self-distillation lets the model teach itself: the copy that sees a demonstration in context teaches the copy that does not.

**Parameter isolation** gives each task its own low-rank adapter (LoRA) and never touches the base model. O-LoRA keeps each new adapter orthogonal to the earlier ones, so a new task cannot overwrite an old direction. L-MoE treats the adapters as experts and lets a small gate mix them per token.

<Sketch name="olora-subspace" alt="A purple band marks the subspace learned by earlier tasks; a green arrow rises straight up from it, labelled as the new task's LoRA update kept orthogonal to the old subspace; a red arrow leaves at an angle, labelled as a plain fine-tuning update that lands partly inside the old subspace and overwrites it" />

*Visual 3: O-LoRA. The green update cannot disturb the purple subspace. The red one can.*

**Hypernetworks** skip training altogether. Text-to-LoRA and Doc-to-LoRA read a task description or a document and write the adapter in a single forward pass.

| Family | How it works | What it costs | Weakness |
| --- | --- | --- | --- |
| Regularization (EWC, L2-SP) | Penalize moving the weights that mattered before | One pass to estimate importance; no stored data | Can protect the wrong weights |
| Replay (CER, SuRe, FOREVER, self-distillation) | Rehearse old experience while learning the new task | Storage and extra tokens per update | Grows with the task list; can break data retention rules |
| Parameter isolation (O-LoRA, L-MoE) | One adapter per task, kept orthogonal to the others | A small adapter per task; base untouched | Adapters pile up; the gate must pick the right ones |
| Hypernetworks (Text-to-LoRA, Doc-to-LoRA) | A second network writes the adapter from a description or document | No gradient step at adaptation time | Only as good as what the hypernetwork saw in training |

## Contextual Memory and Token-Space Learning

Not everything belongs in the weights. A user's current preference or the state of an open incident changes daily, and baking it into parameters is slow and hard to undo. Letta and Mem0 keep that kind of knowledge in a memory the agent manages itself, with tools to read, write, update and summarize its own notes.

Text memory is readable, works with any model, and cannot interfere with the weights. Forgetting is deleting a line.

<Sketch name="two-lanes" alt="Four stacked layers where an agent's knowledge can live: the context window, which lasts one session; the fast lane of memory files, skills and prompts, changed by a text edit and undone with a diff; the slow lane of LoRA adapters, changed by a gradient update and gated by a regression eval; and the frozen base model weights shared by everyone" />

*Visual 4: Two lanes. The fast lane is text, the slow lane is gradients, and the base model stays frozen.*

| | Retrieval-augmented generation | Token-space memory (Letta, Mem0) |
| --- | --- | --- |
| Time | Each query stands alone | Tracks order and how facts changed over months |
| State | Nothing accumulates between sessions | Context accumulates, consolidates and gets refined |
| User model | Blind to who is asking | A profile per user, updated as preferences change |
| Adaptation | Cannot learn from what worked last time | Reflects on which strategies worked and which failed |

## Reinforcement Learning with Verifiable Rewards (RLVR)

In the slow lane the training signal has changed too. The model is rewarded when a verifier says yes: a unit test passes, a script runs, a proof checks. That is Reinforcement Learning with Verifiable Rewards (RLVR), covered in the [RLVR write-up](/write-up/rlvr-and-the-experience-era). Continual RLVR runs it one task at a time instead of retraining on everything. Two things make that safe: online RL forgets less than fine-tuning, and a few old prompts replayed in each batch keep the old tasks alive.

<Sketch name="continual-rlvr" alt="One continual RLVR step as a vertical flow: a batch of new task prompts plus a few replayed old prompts, several sampled answers per prompt from the current policy, a verifier such as a unit test or sandbox run, group-relative advantages, a policy update with GRPO or DAPO, and an arrow back to the batch when the next task arrives" />

*Visual 5: One continual RLVR step, from the batch to the policy update.*

| Failure | What happens | Fix |
| --- | --- | --- |
| Reward hacking | The policy passes the checker without doing the task | Stricter verifiers; drop prompts where every sample passes or fails (DAPO) |
| Entropy collapse | One rewarded shortcut makes the policy deterministic | A looser upper clip so rare tokens can grow (DAPO's Clip-Higher) |
| No verifier | Nothing programmatic to check against | The model's own certainty as the reward (Intuitor) |

## The Production Agent Loop and Data Flywheels

Whatever the update rule, the rest of Visual 1 stays the same. NVIDIA's flywheel paper writes it as four verbs: monitor, analyze, plan, execute.

Monitor: collect traces, tool calls and outcomes. Analyze: filter them, because most telemetry is noise. Heuristics, a judge model and implicit signals such as a merged commit or a thumbs down do the sorting. Plan: turn each failure into a lesson. In the Reflexion pattern the agent, or a stronger model, writes down why the attempt failed and produces a corrected one. Execute: update the adapter or take an RLVR step, run the gate, redeploy.

The gains compound. An agent's hundredth code review is better than its first, because the loop has absorbed the codebase's style and edge cases.

| Team | What runs in the loop | Result |
| --- | --- | --- |
| Cursor Tab | Online RL on accept and reject signals; a new checkpoint every 1.5 to 2 hours | 21% fewer suggestions, 28% higher accept rate |
| Meta, Llama 4 | Alternate training with using the model to keep only medium-to-hard prompts | Continuous online RL as a core post-training step |
| Stripe | A transformer over payment sequences, each transaction embedded like a word | Card-testing detection on large users from 59% to 97% |

## Guardrails, Eval Suites, and Distribution Shift Detection

A loop that updates itself can also poison itself: bad data, drift away from its alignment, or slow forgetting that no single update shows. So every candidate runs against a golden set of core tasks. If any of them drops, the update is blocked and rolled back.

The loop also needs to know when an update is due. Watch the traffic.

$$
\mathrm{PSI} = \sum_{b} \left(A_b - E_b\right)\ln\frac{A_b}{E_b}
$$

In plain terms: bucket a feature, compare today's share of each bucket ($A_b$) with the baseline's share ($E_b$), and add up the mismatch. Below 0.1 is stable. Above 0.25 the traffic has moved and the model needs a refresh.

| Signal | What it is | What it triggers |
| --- | --- | --- |
| Population Stability Index | Bucketed mismatch between baseline and live traffic | An alert above 0.25 and a refresh of the model or adapter |
| Maximum Mean Discrepancy | Kernel distance between two distributions | Catches drift in embeddings before the outputs look wrong |
| Perplexity | How surprised the model is by incoming text | A spike means out-of-distribution traffic and a candidate for the next update |

## Infrastructure Shape: Multi-LoRA Serving and State Management

Gated updates produce hundreds of adapters, one per user or team, and each one must be served. One base model stays resident on the GPU and adapters are swapped in per request. PagedAttention keeps the KV cache in small blocks, like virtual memory pages, so unused reservations stop locking the GPU. A new adapter runs as a shadow on live traffic first and goes live only if it beats the current one without regressing.

| Component | Memory (Llama 3 8B, FP16) | Job |
| --- | --- | --- |
| Base model | About 16 GB, resident in VRAM | The shared reasoning and language |
| Active adapters on the GPU | About 0.5 GB for 8 adapters at rank 16 | Hot-swapped additions in the forward pass |
| Adapter cache in CPU RAM | About 6 GB for 90 or more adapters | Swapping one in takes tens of milliseconds |
| KV cache and buffers | About 6 GB, depends on batch size | Managed by PagedAttention in fixed-size blocks |

## How to Implement It in Claude

You cannot update Claude's weights, and you do not need to. The loop runs in the fast lane of Visual 4: the same seven stages, but stage 5 writes text, and that text is what Claude reads at the start of the next session.

In Claude Code, `CLAUDE.md` holds instructions you write, auto-memory holds notes Claude writes for itself, and Skills package a procedure it loads on demand. Hooks run a command at every tool call and at the end of a turn, which is where the loop collects its telemetry. In the Messages API, the memory tool gives Claude a `/memories` directory that your code stores. Managed Agents mount a memory store and version every edit. The [self-improving agents write-up](/write-up/self-improving-agents) covers the governance around such a loop.

| Loop stage | In Claude |
| --- | --- |
| 1. Deploy | Claude Code, the Agent SDK, or a Messages API agent with the memory tool attached |
| 2. Collect | Hooks fire on every tool call and at the end of a turn; session transcripts; outcome logs |
| 3. Filter and label | Claude as a judge over the transcript; tests passed or failed; thumbs up or down |
| 4. Reflect | A reflection prompt: what went wrong and what to do differently, in one or two sentences |
| 5. Update | Write memory: the memory tool's `/memories` files, Claude Code's `CLAUDE.md` and auto-memory, a Skill for a repeatable procedure, a Managed Agents memory store |
| 6. Gate | Rerun a frozen eval set with the new memory; keep it only if nothing old got worse |
| 7. Promote or roll back | Memory is text in git; rollback is `git revert`, or a memory version in a memory store |

<Sketch name="cl-claude" alt="The same seven-stage loop with the Claude pieces named: Claude runs the task in Claude Code or the API, hooks and transcripts record what happened, Claude judges plus thumbs up or down, a reflection prompt explains the failure, memory is written to CLAUDE.md, memory tool files or a skill, a regression eval on a frozen set gates it, and the memory is committed; a failed gate is a git revert" />

*Visual 6: The same loop with the Claude pieces at each stage. Only stage 5 differs from Visual 1.*

The skeleton in Python is short.

```python
from anthropic import Anthropic
from anthropic.lib.tools import BetaAbstractMemoryTool

client = Anthropic()
memory = FileMemory("./memories")   # your BetaAbstractMemoryTool subclass over a directory

def serve(task):                    # stage 1: Claude works with its memory attached
    runner = client.beta.messages.tool_runner(
        model="claude-opus-5", max_tokens=16000, tools=[memory],
        messages=[{"role": "user", "content": task}],
    )
    return runner.until_done()

def learn(trace, passed):           # stages 3 to 5: a failed trace becomes one memory line
    if passed:
        return
    serve(f"This attempt failed:\n{trace}\n"
          "Write one lesson to /memories/lessons.md so the next attempt avoids it.")

def promote(frozen_eval):           # stages 6 and 7: the gate, then commit or revert
    if score(frozen_eval, "./memories") < score(frozen_eval, "./memories@HEAD"):
        git("checkout", "--", "./memories")   # rollback is a diff, not a checkpoint restore
    else:
        git("commit", "-am", "learned from production")
```

The tool type is `memory_20250818` and needs no beta header. `FileMemory`, `score` and `git` are yours: a directory-backed memory class, the frozen eval runner, and a shell-out. The judge in stage 3 can be a second Claude call with the transcript and a rubric.

## What We Learned

- **The loop is the product.** Deploy, collect, filter, reflect, update, gate, redeploy.
- **Forgetting has a map.** Early attention loses focus, deep layers get overwritten, and the first drop is lost alignment, so freeze the bottom.
- **Measure it.** Backward transfer is the number to watch. Negative means forgetting.
- **Four families of fixes.** Regularize, replay, isolate, or generate the adapter.
- **Two lanes.** Text memory for what changes daily, adapters for what should stick.
- **Continual RLVR forgets less,** and a few replayed prompts keep old tasks alive.
- **Gate every update** with a golden set, PSI on the traffic, and a shadow rollout.
- **In Claude, stage 5 writes text.** Hooks collect, Claude judges, memory files hold the lesson, git rolls it back.

## Sources and further reading

- Forgetting and its metrics: [Gradient Episodic Memory](https://arxiv.org/abs/1706.08840) (BWT, FWT, ACC), [Spurious Forgetting](https://arxiv.org/abs/2501.13453)
- Regularization: [EWC](https://arxiv.org/abs/1612.00796), [EWC Done Right](https://arxiv.org/abs/2603.18596), [L2-SP](https://arxiv.org/abs/1802.01483)
- Replay: [Contextual Experience Replay](https://arxiv.org/abs/2506.06698), [SuRe](https://arxiv.org/abs/2511.22367), [FOREVER](https://arxiv.org/abs/2601.03938), [Self-Distillation Enables Continual Learning](https://arxiv.org/abs/2601.19897)
- Isolation and hypernetworks: [O-LoRA](https://arxiv.org/abs/2310.14152), [L-MoE](https://arxiv.org/abs/2510.17898), [Text-to-LoRA](https://arxiv.org/abs/2506.06105), [Doc-to-LoRA](https://arxiv.org/abs/2602.15902)
- Token space: [Letta on continual learning in token space](https://www.letta.com/blog/continual-learning/), [Mem0](https://arxiv.org/abs/2504.19413)
- Continual RLVR: [Continual Reasoning Gym](https://arxiv.org/abs/2608.18574), [RL's Razor](https://arxiv.org/abs/2509.04259), [DAPO](https://arxiv.org/abs/2503.14476), [Intuitor](https://arxiv.org/abs/2505.19590), [Reflexion](https://arxiv.org/abs/2303.11366)
- Production loops: [Adaptive Data Flywheel](https://arxiv.org/abs/2510.27051), [Cursor Tab online RL](https://cursor.com/blog/tab-rl), [Llama 4](https://ai.meta.com/blog/llama-4-multimodal-intelligence/), [Stripe's payments model](https://x.com/thegautam/status/1920198569308664169)
- Serving: [PagedAttention](https://arxiv.org/abs/2309.06180)
- Claude: [the memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [Claude Code memory](https://code.claude.com/docs/en/memory), [hooks](https://code.claude.com/docs/en/hooks), [Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
