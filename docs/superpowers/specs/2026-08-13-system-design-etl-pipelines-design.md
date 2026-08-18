# System Design: ETL Pipelines write-up: Design

**Date:** 2026-08-13
**Deliverable:** `data/blog/system-design-etl-pipelines.mdx` (URL `/write-up/system-design-etl-pipelines`)

## Goal

Turn Ashim's supplied outline (section 2, components A through D: ingestion and live migration, bronze to silver cleaning and quality, silver to gold star schema, and the ML pipeline) into a full production system design write-up, with Excalidraw-style diagrams.

## Decisions (brainstormed with Ashim)

- **Scope: full system design.** Ashim chose the widest option over "just the outline, deepened". The supplied A through D becomes sections 4 through 11; requirements and SLOs go in front of it, and security, governance, observability, failure modes, DR, cost, CI/CD and cutover go behind it. 17 sections.
- **Framing: generic reference architecture.** Ashim chose this over a named case study and over two side-by-side scale profiles. Consequence: sizing is parametric rather than anchored. The one worked number (4 TB over 1 Gbps at 60% efficiency is about 15 hours single-stream) is presented as a formula applied to an example, not as a fixed scenario.
- **Tech choices: commit, with an ADR table.** Ashim chose this over presenting all options neutrally. Every layer gets one recommendation plus a stated condition under which the alternative wins.
- **No code (revision 2).** The first draft carried four snippets at the points where the design decision was the code. Ashim asked for none. Each was converted to the table that the snippet was illustrating, which in two cases is clearer than the SQL was.
- **Not everything is a flowchart (revision 2).** The first draft was 13 figures, all flowcharts. Ashim asked for fewer and for variety. Now 8 figures in 3 forms.
- **Scenario stated up front, one high-level block above the fold (revision 3).** Ashim asked for the scenario to be formulated and for a single high-level system block at the top. The detailed section 2 flowchart was replaced by that block, so the figure count stayed at 8.
- **Half the prose cut (revision 3).** Ashim said it was too text heavy. Prose went from roughly 3,100 words to 2,400 while keeping every figure and every substantive claim; the cut came out of elaboration, not content.
- **Fewer tables, more readable forms (revision 3).** Ashim objected to information being laid out tabularly by default. Applied rule: **two-column "X and why" tables become prose or a ranked list; three-or-more-column comparisons stay tables.** 30 tables became 21.
- **Icons (revision 3).** Ashim asked for icons, naming Azure and OLTP.

## The spine

One idea holds it together: **the boxes are easy, the seams are hard.** Backfill meeting change capture, the quality gate meeting the throughput target, dimension load meeting fact load, training meeting serving. Every section is placed to make a seam visible rather than to describe a product. Restated explicitly in the closing section as: bronze exists so you can re-run, idempotency exists so you can retry, SCD2 exists so you can ask what was true at the time.

## Visual approach: mermaid handDrawn

Ashim asked for "excalidraw type" visuals. Mermaid 11.15 supports `look: handDrawn` via per-diagram frontmatter config, which renders through rough.js and produces exactly that sketchy, hachure-filled look.

Verified in throwaway pages served from `public/`, before writing prose and again before revision 2:

| Diagram type | handDrawn? |
| --- | --- |
| flowchart | yes |
| stateDiagram-v2 | yes |
| erDiagram | yes, on the entity boxes |
| classDiagram | yes |
| sequenceDiagram | **no**, renders in the normal look |
| block-beta | **no** |
| timeline | **no** |

Other findings that shaped the fences:

- The diagram's own frontmatter overrides the site's `mermaid.initialize` theme. So the fences set only `look` and `handDrawnSeed`, never `theme`, or dark mode would render light diagrams on a dark page.
- `handDrawnSeed` is set per figure so the sketch is deterministic across re-renders instead of jittering.
- `direction LR` inside a subgraph is **ignored** when the subgraph has edges to anything outside it. A first attempt at a banded layers-and-lanes block diagram came out 902 x 1297 with every band stacked vertically. Replaced with a plain layered spine.

## Icons

`components/mermaid-icons.ts` is a hand-authored iconify pack (prefix `sd`) with ten 24x24 glyphs: database, cloud, stream, layers, filter, star, chart, model, cog, shield. `components/MermaidChart.tsx` registers it once, behind a module-level flag, before the first render.

Why hand-authored rather than `@iconify-json/logos` or similar: the packs ship megabytes of JSON to render nine glyphs, and the site's CSP (`script-src 'self'`) blocks fetching a pack from a CDN at render time. The `fa:` prefix mermaid also supports was tested and does not work here, because FontAwesome is not loaded on the site.

Icons are used **only in the top-level block diagram**, where each node is a single concept. Icon nodes render the label outside the box, which suits an architecture overview and would hurt the detailed flowcharts, where the text has to be inside the shape. Glyph paths use `fill="currentColor"`, verified to inherit correctly in both themes.

**Open question for Ashim:** the icons are generic (a cylinder for OLTP, a cog for orchestration), not vendor logos. Real Microsoft Azure and Databricks marks would mean vendoring trademarked artwork into the repo, which is his call, not mine. If he wants them, the route is `@iconify-json/logos` behind a dynamic import.

## Figure inventory (8 figures, 3 forms, 29 tables)

| Section | Figure | Form | Why this form |
| --- | --- | --- | --- |
| 2 | end to end architecture | flowchart | it is a flow |
| 4 | partitioned extract control loop | flowchart | claim, work, mark, retry is a loop |
| 5 | backfill meeting CDC | **stateDiagram-v2** | it is literally a state machine with a re-seed transition |
| 7 | the quality gate | flowchart | branching with three failure exits is the point |
| 9 | the star schema | **erDiagram** | a star schema is an ER model; a flowchart would have been the wrong tool |
| 10 | the orchestration DAG | flowchart | it is a DAG |
| 11 | feature store, offline and online | flowchart | fan out from one definition, fan in at the endpoint |
| 16 | migration phases | **stateDiagram-v2** | phases with a reconciliation guard and a self-loop |

Cut in revision 2: the warehouse decision tree (section 3, folded into a situation/choice table), the bronze write path (section 6, folded into a four-knob table), the network path (section 12, the table was already complete), the Unity Catalog versus Purview split (section 13, same), and the idempotency merge (section 8, replaced by a merge-semantics table).

## Corrections made to the supplied outline

| Outline said | Corrected to |
| --- | --- |
| "Azure Synapse Analytics (Dedicated SQL Pool) or Azure Fabric Lakehouse/Warehouse" | Both are supported and Synapse has no announced end of life, but net-new Microsoft investment is Fabric only. Stated as a decision with a situation table, not a hedge. |
| CDC via "Debezium, Azure Data Factory CDC, or Qlik/Attunity" | Those remain valid for Oracle, DB2 and mainframe, but Fabric Mirroring for SQL Server is GA and is the cheapest correct answer for SQL Server. Added the version trap: SQL Server 2016 to 2022 mirrors via CDC, SQL Server 2025 uses a change feed and refuses to mirror a database with CDC enabled. |
| "Great Expectations or dbt-expectations directly into the Spark job" | Kept, but ranked. Lakeflow pipeline expectations are the Databricks-native path and since late 2025 the rules can live in Unity Catalog as versioned auditable objects. dbt tests run after the load, so they are detection rather than prevention. |
| "Dead-Letter Queue (DLQ): rows routed to a `_corrupted_records` path" | Kept, but given a record schema, an owner, and an alerting rule (alert on rate of change, not absolute count), because a path alone becomes a landfill. |
| Quality checks as one undifferentiated set | Split into four classes with different failure semantics: schema (halt the batch), domain (quarantine the row), referential (inferred member), statistical (hold and alert). The statistical class is the one that catches a source silently sending 40 percent of normal volume, where every individual row passes. |

## Corrections found in my own draft during the recheck pass

- **SCD2 in one upsert.** The draft asserted that a single `MERGE` cannot both close and open a version, so SCD2 must be two statements. That is wrong: the standard technique feeds the changed key in twice via `UNION ALL`, once with its natural key and once with `NULL`, so the `NULL` copy lands in `NOT MATCHED`. Rewritten, and after the no-code revision it survives as the "copy / join key it carries / branch it lands in" table, which states the mechanism more directly than the SQL did.
- **`UPDATE SET *` with a ranking column.** The dedupe subquery projected `rn`, which would break the star forms against the target schema. Fixed, then removed with the rest of the code.
- **Retry classes miscounted.** Section 10 said "two failure classes" above a four-row table.

## Cross-cutting rules

- No em-dashes or en-dashes; verified the file is clean ASCII end to end.
- No fenced code at all.
- Mermaid must survive dark mode, where `MermaidChart.tsx` strips every `classDef` and `style` line. Meaning is carried by label text and node shape; color only reinforces. The state and ER diagrams carry no `classDef`, so they are unaffected.
- Cross-link, do not duplicate: the MLOps post carries experiment tracking and registries, the evals post carries observability for LLM systems.

## Site integration

1. `data/blog/system-design-etl-pipelines.mdx` (new).
2. `worker/src/prompts.ts`: all three hardcoded topic lists extended (coverage bullet, scope trigger phrases, `SEARCH_TOOL.description`). New trigger phrases include "data engineering", "Azure", "Databricks", "Fabric", "lakehouse", "medallion architecture", "Delta Lake", "CDC", "data quality", "star schema", "SCD2", "feature store".
3. Regenerated and committed together: `public/write-up/system-design-etl-pipelines/index.md`, `public/llms.txt`, `app/tag-data.json` (new tags `azure`, `data-engineering`, `system-design`, `lakehouse`).
4. Post-merge: deploy the worker, then `npm run ingest`, then `npm run eval`.

## Verification

- `npm run build` succeeds. Note for future sessions: running `next dev` against the same `.next` directory during a build makes it fail on an unrelated page with a webpack-runtime error or a `/_document` PageNotFoundError. Stop the dev server and clear `.next` first. This happened twice and is not a content problem.
- All 8 figures rendered and inspected in the browser, in light and dark, via a contact sheet that scales every diagram into one grid.
- Figures reworked after inspection: the quality gate rendered 915px wide and sprawled because the failure branches were declared before the pass branches; reordering so the happy path is declared first brought it to 606px with a straight central spine. The orchestration figure rendered 815px wide with a large empty region and tiny text; folding retry and page into one `error?` decision node brought it to 598px at full size. The initial-load control-table figure had a tangled double "success" edge and was given an explicit `result` node. The ER diagram first rendered 1131px (52 percent scale in a 588px column); shortening the attribute comments and dropping the product dimension's attribute list brought it to 967px. The CDC state diagram had a self-loop whose label floated far from its node, and a `Resnapshot` state that added a long back edge; both were folded into one labelled transition back to `Snapshotting`.
- Confirmed the hydration error visible in the dev console is pre-existing site behavior: it appears identically on `/write-up/vllm-how-a-token-gets-served`.
