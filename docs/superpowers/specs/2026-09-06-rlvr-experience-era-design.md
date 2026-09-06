# RLVR, Continual Learning, and Long-Horizon Reasoning Write-up — Design

Date: 2026-09-06
Slug: `rlvr-and-the-experience-era`
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
- `openrlhf-split`: scheduler above (unnamed: Ashim asked for no Ray mentions); rollout engines (vLLM) and actor engines
  (DeepSpeed ZeRO-3) side by side; token-in-token-out arrow between them (Visual 3)

Four mermaid flowcharts, added at Ashim's request after the first draft, for sections with
no sketch: RLHF versus RLVR reward paths (intro), the advantage-collapse decision (all-same
versus mixed rewards, with the fixes), the noisy-verifier phase transition on Youden's index,
and ORM versus PRM versus uPRM. TD layouts and light classDef colors, per house rules.

## Ashim's mid-course instructions (2026-09-06)

- No mention of Ray anywhere in the write-up. The OpenRLHF section keeps vLLM and DeepSpeed
  and calls the placement layer "a scheduler".
- Add mermaid diagrams from the draft's content. The draft's own three mermaid blocks are the
  ones drawn as sketches; the mermaids added are for other sections.

## Second-round revisions (2026-09-06, after Ashim's review)

- Title shortened to "RLVR and the Experience Era of LLMs"; slug shortened to match.
- Sketches redrawn with clean shapes instead of the rough "pencil" look: the renderer
  gained a per-sketch `{"type":"settings","style":"clean"}` mode (straight rectangles,
  diamonds, ellipses, filled arrowheads, sans font). The KV cache sketches are untouched.
- Every paragraph shortened; each section opens with a sentence that links back to the
  previous one; every display equation is followed by an "In plain terms" reading.
- A "What We Learned" bullet section added after the conclusion.

## Third-round revisions (2026-09-06)

- Sketch text uses Excalidraw's default handwritten font again; shapes stay clean.
- The advantage-collapse mermaid became a sketch (`advantage-collapse.json`), at Ashim's
  request. Three mermaid flowcharts remain (RLHF vs RLVR, noisy verifier, ORM vs PRM).
- Another simplification pass: average sentence length about 12 words, plain words, every
  fact kept.

## Interactive components

None. Ashim chose text, formulas, tables, and sketches only.

## Fact check

Quantitative claims in the draft are checked against the papers before publishing.
Anything unconfirmed is attributed ("the authors report") rather than asserted.
Corrections found are listed below.

- Advantage Collapse (arXiv 2605.21125): the paper reports 28% to 45% of batches collapsed
  and AVSPO cutting that to 11% to 18% (a 58% to 63% relative reduction). The post gives the
  ranges rather than "up to".
- HiLL is "Hint Learning for Reinforcement Learning" (arXiv 2604.00698). The draft's
  "Learning from Unreachable Rewards: Hint-Conditioned..." is a different, recommender paper.
- SpecBench (arXiv 2605.21384): the paper's term is "reward hacking gap"; the compiler
  anecdote scored 97% on visible tests and 0% held out.
- Noisy verifiers are two papers: the asymmetric channel, backward and forward corrections,
  and the appeals mechanism are arXiv 2510.00915; the Youden's index phase transition is
  "Rate or Fate? RLVεR" (arXiv 2601.04411). The post attributes each.
- The Pass@1-up, Pass@K-down finding is Yue et al. (arXiv 2504.13837). arXiv 2506.14245
  argues the opposite and contributes CoT-Pass@K. The post presents them as claim and reply.
- FIPO (arXiv 2603.19835): 58.0% is a peak on AIME 2024 Pass@1, from 50.0%, converging
  near 56.0%.
- Latent-GRPO (arXiv 2604.27998): the claim is 3 to 4 times shorter reasoning chains, not
  3 to 4 times faster, and accuracy exceeds explicit GRPO on hard benchmarks. The named
  problems are the absence of an intrinsic latent manifold, exploration-optimization
  misalignment, and latent mixture non-closure. "Off-manifold exploration" is descriptive,
  not a named mode.
- OpenRLHF: the 1.22x to 1.68x speedups are against verl v0.4.0 (paper v6, arXiv
  2405.11143). The "80% of training time" figure is the README's; the paper says over 90%.
- Shopify: "up to 2,000 requests per minute", not "thousands". The $27M to $1M and 96%
  figures are the post's own estimates. Frontier models critique and an arbiter writes a
  repair instruction; the agent replays to produce the corrected trajectory. The flywheel
  sketch label was changed to match.
- HomeFlow's full title ends "with Verifiable Simulation" (arXiv 2606.01230).

## Frontmatter

```
title: 'RLVR and the Experience Era of LLMs'
tags: ['rlvr', 'reinforcement-learning', 'grpo', 'llm', 'continual-learning', 'reasoning']
```

## Implementation checklist

1. Fact-check the numbers; record corrections above.
2. Draw the three sketches (Excalidraw MCP for preview, JSON on disk), run the renderer.
3. Write `data/blog/rlvr-and-the-experience-era.mdx`.
4. Extend the chatbot topic lists in `worker/src/prompts.ts` (coverage list, scope
   examples, SEARCH_TOOL description). No dashes in those strings.
5. `npm run build`; commit the generated mirrors (`public/write-up/<slug>/index.md`,
   `public/llms.txt`, `public/llms-full.txt`, `app/tag-data.json`).
6. Preview in the browser pane; commit locally. No push until Ashim confirms.
7. Post-merge: deploy the worker and run `npm run ingest`.
