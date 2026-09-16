# The Continual Learning Loop Write-up — Design

Date: 2026-09-15
Slug: `continual-learning-loop`
Status: draft prepared for Ashim's review (autonomous session; no push).

## Goal

A very short write-up on the continual learning loop for LLM agents: why one-shot fine-tuning
and periodic retrains stop working for long-running agents, what catastrophic forgetting is and
how it is measured, the four mitigation families, token-space memory as the complement to
weight updates, continual RLVR, the production data flywheel, the guardrails around it, the
multi-LoRA serving shape, and, added at Ashim's request, how to implement the loop with Claude.

Source material: a research brief supplied by Ashim in chat. His instructions: "short, very
short", "use this" research, "add how to implement it in Claude", "plan first, do research and
then make draft".

## How the brief is used

The brief's top-level section headings, verbatim, in the brief's order. Its subsections are
merged into their parents so the post stays short. The brief's sentences are compressed to
roughly a quarter of their length; every named method and number is kept unless the fact check
corrects it. The brief's "Conclusion" becomes the house "What We Learned" list. One section is
added before it: "How to Implement It in Claude".

Standing house rules (from the RLVR and world models rounds): a short title; clean-shape
sketches; paragraphs under about 100 words; an "In plain terms" line after every display
equation; no dashes and no stock AI words; each section opens with a sentence that links to the
previous one; a "What We Learned" list at the end. Infra tooling names stay out except in the
section the brief devotes to infrastructure and in the Claude section, which is about tooling.

## Approaches considered

1. **Brief-following, compressed (chosen).** Keep the brief's nine headings and order, cut each
   to one or two short paragraphs plus one figure or table. Matches how the KV cache, RLVR and
   world models posts were accepted; the "very short" ask is met by compression, not
   restructuring.
2. **Loop-first restructure.** Open with the seven-stage loop and hang every brief topic off a
   stage. Reads well but reorders the brief, and two restructured drafts were rejected on the
   KV cache post. Not chosen.
3. **Two-post split.** One conceptual post on forgetting and mitigation, one practical post on
   the loop in Claude. Cleaner, but Ashim asked for one short piece. Not chosen.

## Title and length

Title: "The Continual Learning Loop". Target: about 1,300 to 1,500 words of prose and bullets,
roughly half the world models post, carried by 5 sketches, 1 mermaid flowchart, 8 tables and 3
display equations.

## Structure

1. The Transition to Lifelong Learning in AI Agents
   - Why session-scoped chatbots became multi-month agents; the plasticity versus stability
     tension; frozen one-shot training versus periodic retrains versus the incremental loop.
   - Visual 1 (`cl-loop`): the loop as a ring of seven stages: deploy, collect telemetry, filter
     and label, reflect and synthesize, update (weights or memory), regression gate, redeploy.
2. The Architecture of Catastrophic Forgetting
   - Gradient descent on a new task overwrites entangled weights. Early attention heads blur
     (entropic dispersion); mid-to-deep MLPs and MoE routers collapse. Spurious forgetting: early
     drops come from lost task alignment, not lost knowledge, so freezing lower layers helps.
   - Visual 2 (`forgetting-map`): a transformer stack with the two failure regions and the
     "freeze the bottom" note.
   - The BWT equation with an "In plain terms" line; a table of BWT, FWT and ACC.
3. Mitigation Families: From Parameter Regularization to Replay Buffers
   - Regularization (EWC with the diagonal Fisher, L2-SP, function vector guided training);
     replay (contextual experience replay, surprise-driven replay, forgetting-curve schedules,
     self-distillation as privacy-safe generative replay); parameter isolation (O-LoRA, circuit
     projection, L-MoE); hypernetworks (Text-to-LoRA, Doc-to-LoRA).
   - The EWC penalty equation with an "In plain terms" line.
   - A four-row table: family, how it works, what it costs, weakness.
   - Visual 3 (`olora-subspace`): the new task's update forced into the orthogonal complement
     of the old task's subspace.
4. Contextual Memory and Token-Space Learning
   - Not all knowledge belongs in weights. Agent-managed memory (Letta, Mem0) as the stable
     complement; forgetting in token space is deleting a line.
   - Visual 4 (`two-lanes`): where knowledge can live: frozen base weights, adapters (slow lane,
     gradient updates, gated), memory files (fast lane, text edits, revertible), the context
     window (one session).
   - The RAG versus memory system table (four rows from the brief).
5. Reinforcement Learning with Verifiable Rewards (RLVR)
   - Continual RLVR instead of retraining on the whole task mixture; RL forgets less than SFT
     because tasks share reasoning; prompt replay regenerated on-policy. Links to the RLVR post.
   - Mermaid flowchart: new task prompts plus replayed old prompts, on-policy rollouts,
     verifier, policy update, back to the mixture.
   - A table of the two failure modes and their fixes: reward hacking and entropy collapse
     (DAPO's Clip-Higher and dynamic sampling, entropy in the reward, self-certainty when there
     is no verifier).
6. The Production Agent Loop and Data Flywheels
   - The MAPE loop mapped onto Visual 1: telemetry, filtering with heuristics and a judge,
     Reflexion-style diagnosis and corrected trajectories, the update, the gate.
   - A case-study table: Cursor Tab, Llama 4, Stripe, with the numbers the fact check confirms.
7. Guardrails, Eval Suites, and Distribution Shift Detection
   - Every candidate passes a golden regression set or is rolled back.
   - The PSI equation with an "In plain terms" line; a three-row table for PSI, MMD and
     perplexity monitoring.
8. Infrastructure Shape: Multi-LoRA Serving and State Management
   - One base model resident, adapters hot-swapped, PagedAttention for the KV cache, LRU tiers
     across GPU, CPU and disk, shadow rollouts before promotion.
   - The memory footprint table (Llama 3 8B example) from the brief.
9. How to Implement It in Claude (added)
   - The point: Claude's weights are not yours to update, so the loop runs in the fast lane of
     Visual 4. Same seven stages, but the update step writes text instead of gradients.
   - A table mapping each stage to a Claude feature: hooks and transcripts for telemetry,
     Claude as the judge for filtering, a reflection prompt for synthesis, memory for the update
     (the Messages API memory tool, Claude Code CLAUDE.md and auto-memory, Skills for reusable
     procedures, Managed Agents memory stores), an eval set as the regression gate, git or
     memory versions for rollback.
   - Visual 5 (`cl-claude`): the same ring as Visual 1 with the Claude pieces named at each
     stage.
   - One short Python snippet (under 25 lines) with the memory tool declaration and a promote
     step gated on a regression eval. Model string `claude-opus-5`, tool type `memory_20250818`,
     per the claude-api skill.
10. What We Learned
11. Sources and further reading

## Diagrams

Five clean-style sketches in `scripts/sketches/`, rendered by `scripts/render-sketches.mjs`
into `components/writeups/sketches.generated.ts`: `cl-loop`, `forgetting-map`,
`olora-subspace`, `two-lanes`, `cl-claude`. One mermaid flowchart (continual RLVR), TD layout,
light classDef colors, single root so useMaxWidth does not shrink it.

## Interactive components

None.

## Fact check

A background agent checked the brief's numbers, paper names and method names against the
papers and blog posts. Confirmed as written: the GEM metrics, EWC and its diagonal Fisher,
"EWC Done Right" with Logits Reversal (CVPR 2026), L2-SP (Li, Grandvalet and Davoine, ICML
2018), O-LoRA, Spurious Forgetting (ICLR 2025; freezing the bottom layers lifted sequential
fine-tuning accuracy from 11% to 44%), L-MoE (Oct 2025), Text-to-LoRA (ICML 2025) and
Doc-to-LoRA (Feb 2026, Perceiver-based), Letta's token-space post, Mem0 (Apr 2025), the
Continual Reasoning Gym and Continual Prompt Replay (Aug 2026), DAPO, Intuitor, Reflexion,
PSI and its thresholds, PagedAttention, SuRe, CER, FOREVER, Stripe's 59% to 97%, Llama 4's
online RL wording, and NVIDIA's Adaptive Data Flywheel (MAPE) paper.

Corrections applied to the draft:

- Cursor Tab: the post says 21% fewer suggestions and a 28% higher accept rate, with a new
  checkpoint every 1.5 to 2 hours. Not "a 28% increase in acceptance".
- "Low-Rank Circuit Projection (LRCP)" and the "94.2% of ancestral capabilities" figure come
  from a single-author, unreviewed preprint (arXiv 2601.18699) with an inconsistent timeline.
  Dropped. The mechanistic picture (early attention dispersion, deep MLP and router collapse)
  is kept as a description, without that citation.
- "Policy Entropy as a Reward (PEA)" does not exist; PEA is Prototype Entropy Alignment
  (AAAI 2026), a different idea. The entropy fix is described through DAPO's Clip-Higher and a
  plain entropy bonus instead.
- O-LoRA enforces orthogonality with a loss term against the earlier tasks' LoRA subspaces,
  not a hard projection. The sketch and text say "kept orthogonal", not "projected".
- The claim that RL forgets less than supervised fine-tuning is not from the Continual
  Reasoning Gym paper; it is attributed to "RL's Razor" (Shenfeld et al., 2025) instead. The
  Gym paper supplies the shared-reasoning and prompt-replay points.
- vLLM's prefix cache does not share KV blocks across adapters (the block hash includes the
  LoRA id). The "base-aligned block hashing" sentence is dropped.
- Titles fixed: SDFT is "Self-Distillation Enables Continual Learning" (Jan 2026), which uses
  the model conditioned on a demonstration as the teacher of the same model without it; the
  function vector method is "Unlocking the Power of Function Vectors..." (ICLR 2025). Mem0's
  user, session and agent scopes come from its product docs, not the paper. CER is training
  free and in-context.
- Anthropic side: the memory tool is `memory_20250818`, name `memory`, client-side, and no
  longer needs a beta header (the `context-management-2025-06-27` beta is only for context
  editing). Claude Code auto-memory lives under the project's memory directory with a
  `MEMORY.md` index; Skills are `SKILL.md` folders; hooks fire on lifecycle events.

## Implementation checklist

1. Draw the five sketches; run the renderer.
2. Write `data/blog/continual-learning-loop.mdx`.
3. Extend the chatbot topic lists in `worker/src/prompts.ts` (no dashes in those strings).
4. Stop any preview, `npm run build`, commit the generated mirrors (`public/write-up/...`,
   `public/llms*.txt`, `app/tag-data.json`).
5. Preview in the browser pane; commit locally. No push until Ashim confirms.
6. Post-merge: deploy the worker and run `npm run ingest`.
