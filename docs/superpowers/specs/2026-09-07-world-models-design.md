# World Models Write-up — Design

Date: 2026-09-07
Slug: `world-models`
Issue: #119 (World Models)
Status: draft prepared for Ashim's review (autonomous session; no push).

## Goal

A short, easy-to-read write-up on world models: what they are, why agents want one,
the V+M+C architecture, the Dreamer and MuZero lineages, TD-MPC for continuous control,
foundation world models (Genie, Cosmos) and action conditioning, failure modes, LeCun's
JEPA, and the Physical AI angle from issue #119 (simulators for VLA policies, sim to real,
the link to post-training RL).

Source material: a research brief supplied by Ashim in chat. His instructions: prepare a
draft, not text heavy like the other write-ups, short and easy to understand.

## How the brief is used

The brief's section headings, verbatim, in the brief's order. The brief's sentences,
compressed to roughly a third of their length. Every named system and number in the brief
is kept unless the fact check corrects it. One section is added at the end for the
issue's Physical AI and post-training RL bullets, which the brief does not cover.

Per the standing house rules (see the RLVR design doc): short title, clean-shape
sketches, paragraphs under about 100 words, an "In plain terms" line after every display
equation, no dashes, each section opening with a sentence that links to the previous one,
and a "What We Learned" bullet list at the end.

## Structure

1. The Cognitive and Computational Imperative for World Models (MDP definition; Visual 1)
2. The Foundational V+M+C Architecture (Visual 2; the parameter table)
3. Learning in the Dream and Adversarial Exploitation (mermaid: the training pipeline)
4. The Dreamer Lineage and Continuous Latent Dynamics
   - The Recurrent State-Space Model (RSSM) (Visual 3)
   - Robustness across Domains: Symlog and KL Balancing (symlog equation; Minecraft table)
5. Value Equivalence and the MuZero Paradigm (Visual 4)
6. Implicit World Models and TD-MPC for Continuous Control (mermaid: the MPPI loop)
   - Mitigating Policy Mismatch and Scaling the Architecture (the paradigm table)
7. Generative Video, Foundation World Models, and Action Conditioning
   - Genie: Unsupervised Latent Action Discovery (Visual 5)
   - Architectural Mechanisms of Action Conditioning (the conditioning table)
8. Failure Modes: Hallucination and Horizon Drift (Visual 6; the mitigation table)
9. Yann LeCun's Vision and the JEPA Paradigm (the six-module table; Visual 7; the loss)
10. World Models as Simulators for Physical AI (added; mermaid: the loop from video to
    robot and back; links to the RLVR write-up)
11. What We Learned
12. Sources and further reading

## Diagrams

Seven clean-style sketches in `scripts/sketches/`, rendered by
`scripts/render-sketches.mjs` into `components/writeups/sketches.generated.ts`:

- `wm-imagined-rollout`: acting in the real environment versus acting in the model
- `vmc-pipeline`: frame -> V -> z -> M -> h -> C -> action -> environment, with the loop
- `rssm`: the deterministic h chain, the prior and posterior z, the KL between them
- `muzero`: h, g, f along a chain of hidden states, with the "no decoder" note
- `genie`: training (tokenizer, latent action model, dynamics) beside playing
- `horizon-drift`: five steps of compounding error and the three ways to limit it
- `vjepa`: context encoder, target encoder, predictor, and the L1 distance

Three mermaid flowcharts: the dream-training pipeline with the exploit branch, the MPPI
planning loop, and the Physical AI data loop. TD layouts, light classDef colors.

## Interactive components

None.

## Fact check

A background agent checked the brief's numbers against the papers. Everything else in the
brief was confirmed. Corrections applied:

- DreamerV3 Minecraft: "29M steps, 17 GPU-days" is the January 2023 preprint. The Nature
  2025 version says every agent finds a diamond within 100M steps using one GPU for 9 days.
  The post gives both, attributed.
- Genie: the raw collection was 55M clips (244k hours), filtered to 6.8M clips, about 30k
  hours. The brief's "6.8 million videos filtered down to 30,000 hours" conflated the two.
- TD-M(PC)² is arXiv 2502.03550 (Lin et al.), not only an OpenReview entry.
- V-JEPA 2-AC plans with the cross-entropy method on under 62 hours of Droid data and ran
  zero-shot on Franka arms; the post now says so instead of a generic MPC description.
- VL-JEPA is arXiv 2512.10942 (December 2025).

## Implementation checklist

1. Draw the seven sketches; run the renderer.
2. Write `data/blog/world-models.mdx`.
3. Extend the chatbot topic lists in `worker/src/prompts.ts` (no dashes in those strings).
4. `npm run build`; commit the generated mirrors.
5. Preview in the browser pane; commit locally. No push until Ashim confirms.
6. Post-merge: deploy the worker and run `npm run ingest`.

## Second-round revisions (2026-09-12, after Ashim asked for a senior-researcher proofread)

Gaps found in the first draft and fixed:

- No history before 2018. Added Schmidhuber's 1990 neural world model and Sutton's Dyna, plus
  a timeline flowchart from 1990 to 2025 in the opening section.
- LeCun's voice was thin. Added his four core positions in his own terms (pixel generation
  is "doomed to fail", SSL is the cake and RL the cherry, a cat knows more physics than an
  LLM, objective-driven AI), his (1-e)^n compounding-error argument as an xychart in the
  failure-modes section, and a new sketch of his six-module blueprint (`lecun-modules`)
  replacing the six-module table.
- Newer foundation world models were missing. Added Genie 2 and Genie 3, Wayve's GAIA, 1X's
  humanoid world model, Sora's "world simulator" claim, and V-JEPA 2's scale (1B encoder,
  1M hours of video).
- Physical AI section now says why learned world models beat physics engines (the
  sim-to-real gap).
- Every paragraph tightened; the text is about a quarter shorter than the first draft
  while covering more.

Figures now: 8 sketches, 4 mermaid blocks (timeline, dream pipeline, MPPI loop, Physical AI
loop) plus 1 xychart, 6 tables.

## Third-round revisions (2026-09-12)

Ashim asked for simpler, shorter, human-sounding text with no dashes or stock AI words, and
one realistic analogy with a visual.

- Added the flight simulator analogy as a sketch (`flight-simulator`): real flight versus
  the simulator, then six matched pairs (pilot = policy, simulator = world model, hours in
  the sim = training in the dream, a sim bug the pilot exploits = a model gap, the sim's
  weather drifting = horizon drift, the check ride = sim-to-real transfer). The analogy is
  picked up again in the exploitation, horizon drift, and Physical AI sections.
- Plainer wording throughout (bugs, not gaps; guesses too high, not overestimates), shorter
  bullets, and the Forrester paragraph and a few restatements cut. Scanned for dashes and
  stock words; none left.

Figures now: 9 sketches, 4 mermaid flowcharts, 1 xychart, 5 tables.
