# RLVR, Continual Learning, and Long-Horizon Reasoning Write-up — Design

Date: 2026-09-06
Slug: `rlvr-continual-learning-and-long-horizon-reasoning`
Status: approved by Ashim in chat (option 1: follow the draft section for section;
hand-drawn sketches; no interactive demos; a standalone post).

## Goal

A standalone deep dive on Reinforcement Learning with Verifiable Rewards (RLVR): the
objective, GRPO and its KL variants, advantage collapse and its fixes, reward hacking and
noisy verifiers, outcome versus process reward models, the production continual-learning
flywheel, long chain-of-thought and latent reasoning, and the OpenRLHF training stack.

Source material: a draft written by Ashim, used in full. His instruction: use all the
topics, headings, descriptions, and sentences from the draft; adding or removing a little
is fine; strip any AI residue and every dash.

## Relationship to other posts

`self-improving-agents.mdx` mentions RLVR as one rung of its ladder and has one table row
on process reward models. This post is separate and self-contained; it does not depend on
that one and does not restructure around it.

## Structure

The draft's headings verbatim, in the draft's order. The first line of the draft is the
title; the second line is the opening `##`.

1. The Transition to the Experience Era of Artificial Intelligence
2. Formalizing Reinforcement Learning with Verifiable Rewards (RLVR)
   - Objective Grounding and Formal Verification (MDP framing, the objective)
   - Generalization Nuances and Spurious Rewards
   - Extending RLVR to Open-Ended and Partially Verifiable Tasks (RLSVR, SpyRL, RLR3)
3. Group Relative Policy Optimization (GRPO) Mechanics
   - The Elimination of the Value Network
   - The Clipped Surrogate Objective
   - Mathematical Formulations of the KL Penalty (Table 1)
4. The Pathology of Advantage Collapse
   - Algorithmic Interventions for Zero-Variance Lock-In (AVSPO, ISPO, HiLL, CIGPO, GDPO; Table 2)
5. Reward Hacking, Verifier Exploitation, and Noise
   - The Mechanics of Verifier Exploitation (SpecBench, inductive reasoning shortcuts)
   - Modeling Stochastic Reward Channels (Youden's index, forward/backward corrections)
   - Legibility Drift and Tandem Reinforcement Learning
6. Reward Granularity: Outcome vs. Process Reward Models
   - Outcome Reward Models (ORM)
   - Process Reward Models (PRM)
   - Implicit and Unsupervised PRMs (uPRM) (Table 3)
7. The Continual Learning Loop and Data Flywheels
   - Architecture of the Self-Healing Pipeline (Shopify)
   - Mitigating Catastrophic Forgetting
   - Model-Harness Co-Evolution (HomeFlow, RLVE)
8. Latent Reasoning, Self-Correction, and Long Chain-of-Thought
   - The Incentive Mechanics of RLVR (Pass@1 vs Pass@K, CoT-Pass@K)
   - Adversarial Self-Play and Latent Reasoning (GASP, Latent-GRPO)
9. Architectural Scaling and Distributed Training via OpenRLHF
   - Decoupling Generation from Optimization
   - Hybrid Engine Scheduling and Performance Tuning
10. Conclusion
11. Sources and further reading

Sentences are the draft's, lightly simplified. Formulas render with KaTeX. No table of
contents, no Question blocks, no code blocks.

## Cleanup rules

- No em-dashes or en-dashes anywhere. Commas, periods, or parentheses instead.
- Drop the "Opens in a new window" residue, the trailing citation whitespace, and the
  "Code snippet" labels.
- Tone down inflated words (profound, insidious, unimaginably, absolute necessity,
  aggressively, relentless) to plain ones.
- Retype the garbled math (subscripts split across lines) cleanly.

## Diagrams

Three hand-drawn figures replacing the draft's three mermaid blocks, in the same pipeline
as the KV cache post: element JSON in `scripts/sketches/*.json`, rendered by
`scripts/render-sketches.mjs` into `components/writeups/sketches.generated.ts`, embedded
with `<Sketch name="..." />`. Designed with the Excalidraw MCP so Ashim sees them in chat.

- `rlvr-loop`: query -> policy -> G rollouts -> verifier -> binary rewards -> group
  advantages -> policy update -> back to policy (Visual 1)
- `data-flywheel`: deployed model -> production failures -> frontier critique -> corrected
  trajectories -> replay buffer -> GRPO update -> deployed model (Visual 2)
- `openrlhf-split`: Ray scheduler above; rollout engines (vLLM) and actor engines
  (DeepSpeed ZeRO-3) side by side; token-in-token-out arrow between them (Visual 3)

## Interactive components

None. Ashim chose text, formulas, tables, and sketches only.

## Fact check

Quantitative claims in the draft are checked against the papers before publishing.
Anything unconfirmed is attributed ("the authors report") rather than asserted.
Corrections found are listed below.

(filled in during implementation)

## Frontmatter

```
title: 'The Convergence of Reinforcement Learning with Verifiable Rewards, Continual Learning, and Long-Horizon Reasoning in Large Language Models'
tags: ['rlvr', 'reinforcement-learning', 'grpo', 'llm', 'continual-learning', 'reasoning']
```

## Implementation checklist

1. Fact-check the numbers; record corrections above.
2. Draw the three sketches (Excalidraw MCP for preview, JSON on disk), run the renderer.
3. Write `data/blog/rlvr-continual-learning-and-long-horizon-reasoning.mdx`.
4. Extend the chatbot topic lists in `worker/src/prompts.ts` (coverage list, scope
   examples, SEARCH_TOOL description). No dashes in those strings.
5. `npm run build`; commit the generated mirrors (`public/write-up/<slug>/index.md`,
   `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json`).
6. Preview in the browser pane; commit locally. No push until Ashim confirms.
7. Post-merge: deploy the worker and run `npm run ingest`.
