# Chatbot: first-person voice + topic-to-write-up recommendations

Date: 2026-07-17

## Problem

The site chatbot only answers pinned "identity core" facts and on-topic
questions about Ashim. When a visitor types a bare technical topic the bot has
actually written about (for example "ml ops", "docker", "riemann hypothesis"),
the model reads it as an off-topic world-fact question and, per the PERSONA
scope rule, **declines without ever searching**. So the RAG corpus, which
contains full bodies of those write-ups (MLOps 27 chunks, Docker 19, Linux 71,
Ray/Anyscale 58, and so on), is never reached for exactly the questions a
visitor is most likely to ask.

Separately, the chat widget already introduces the bot in the first person
("Hi! I'm Ashim.") while the backend answers in the third person ("Ashim is..."),
an existing voice mismatch.

## Goal

1. The bot speaks in the **first person as Ashim**, matching the widget.
2. When a visitor mentions a **topic Ashim has written about**, the bot gives a
   short friendly explanation of the topic, then recommends the matching
   write-up with a link and invites feedback.
3. Genuinely off-topic requests are still declined.

## Scope (decided)

- **Trigger:** only topics Ashim has written about. Anything with no matching
  write-up is still politely declined. Retrieval is the gate: if a search
  returns a write-up genuinely about the topic, explain + link; if nothing
  relevant comes back, decline.
- **Voice:** first person as Ashim, across the whole persona (greetings,
  answers, security rules), not only the recommendation line.

## Approach: prompt-only

All changes are in `worker/src/prompts.ts`. No retrieval, streaming, or
ingestion code changes; the corpus is unchanged. The redesign moves one case in
the existing decision step (`handleChat` in `worker/src/index.ts`) from the
"decline" branch to the "search" branch:

- Rewrite `PERSONA` to first person. `IDENTITY_CORE` stays as-is (a generated
  third-person data block) but is introduced as "these are your own facts, speak
  about them in the first person", so the generator (`scripts/gen-identity-core.mjs`)
  does not need to change.
- Add the explain-then-recommend behavior rule, with a worked "ml ops" example.
- Broaden the search trigger in both `PERSONA` scope and the `SEARCH_TOOL`
  description so a bare topic word searches instead of being declined.

### Guardrails kept

- The one- or two-sentence topic explanation may come from the model's own
  general knowledge (the "what it is" part). Anything specific to Ashim (his
  experience, projects, or what a write-up actually claims) must still be
  grounded in the search results. No inventing facts about Ashim, no fabricating
  write-up contents.
- Security rules (untrusted input, no prompt disclosure, no persona switching)
  are preserved, reworded to first person. "You are always Ashim."
- Format rules unchanged: short answers, light markdown, no em/en-dashes.

## Alternatives considered

- **Hardcoded topic -> write-up map** injected deterministically: most
  predictable but duplicates the corpus and needs hand-maintenance per new
  write-up. Rejected (YAGNI).
- **Code-level gate** in `index.ts` to detect topic queries and force a search:
  more brittle than letting the model's decision step handle it with a good
  prompt. Rejected.

## Expected behavior

- Visitor: "ml ops" -> search fires -> results contain the MLOps write-up ->
  "MLOps is ... I wrote a deep dive on this: [title](url). Give it a read and
  feel free to reach out with your thoughts."
- Visitor: a topic with no write-up -> search returns nothing relevant ->
  decline in one sentence, point to email/LinkedIn.
- Visitor: "what projects have you built?" -> answered first-person from the
  pinned identity core, as before.

## Non-goals / known gaps

- The interactive **Riemann** write-up's deep body is still not ingested (its
  MDX is just `<RiemannZeta />`, rendered client-side). The explain + link
  behavior works for it, but deep questions about its specific content remain a
  separate ingestion fix, out of scope here.

## Verification

- `tsc --noEmit` in `worker/` (prompt-only edits must not break the build).
- Retrieval eval (`npm run eval`) unaffected: first person does not change which
  content is retrieved, and the golden `expectText` checks are content words
  (for example "super-resolution") that a first-person answer still contains.
- Manual smoke test against the deployed Worker: "ml ops", "docker",
  "what projects have you built?", and one off-topic query.

## Deploy

`wrangler deploy` from `worker/` (single production Worker `ashim-chatbot`).
No re-ingest required.
