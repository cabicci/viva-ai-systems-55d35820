# Remaining 75 lessons: isolated execution record

[roadmap:furniture-pilot-temporary-branch]

Owner instruction: continue the remaining 75 technical lessons with the approved four-register methodology. This branch is isolated from the five existing lesson packages, media, selector, typography, parent documentation and main integration.

## Verified starting state

- Parent commit: `a908cb5698dfa00d7552658413f23fe93ff0f2c0`.
- Branch: `experiment/technical-remaining-75-20261004`.
- `curriculum-map.json` and runtime `catalog.json` contain the same 80 unique lesson IDs, seven sections and 21 modules.
- Five lessons were authored before this branch: M01-L01 through M01-L04 and reused M04-L02. The latter remains the existing furniture pilot, not a new JSON lesson.
- New authored lessons in this branch: **0**. New localized packages: **0**. Remaining unauthored lessons: **75**.

`authoring-status.json` records the decision `blocked_reference_unavailable`, 20 remaining module batches, 75 lessons and 300 expected four-register packages. Expected counts are production scope, not completed packages.

## Source blocker

The exact source was resolved in Library: `libfile_e700ff35ecc48191a7c4f0425700a7f8`, `Metwood_Furniture_Design(1).pdf`, 183250232 bytes, 408 pages. Two materialization attempts through the current bundled Library download helper returned:

> library download request failed: download failed with HTTP status 502

The helper did not expose separate preparation/byte-transfer results, so the failing internal stage is unverified. No source PDF was materialized. No download URL, credentials or source content was copied into this repository.

Library text read succeeds but mostly returns branding footers. A page-scoped image read (pages5-8) returns image pointers rather than inspectable local bytes. That is insufficient for technical authoring and does not count as a visual review. The prior topic mapping is retained as internal planning evidence; it is not substituted for detailed source review.

Detailed authoring is blocked until the reference can be inspected. No invented furniture specifications, regulatory dimensions, machine instructions, manufacturer claims or lesson-completion claims were added.

## Work completed while blocked

`validate-authoring.py` now audits actual package files against the existing curriculum and runtime catalogue. It checks package/locale identity, explanation sections, distinct illustration keys, assessment options/answer bounds, linked FAQ targets, practice fields, source leakage, aligned concepts/answers/numeral facts, actual SVG geometry duplication and PDF asset presence. It accepts contextual repetition of a numeric fact rather than treating a repeated sentence as a changed fact.

The report is structural evidence only. It does not certify engineering, diagram semantics, language naturalness, PDF layout, voice pronunciation, listener approval or deployment. `--require-complete` fails if any catalogue lesson is still unauthored. It currently rejects a claim of full completion with 75 missing lessons.

The existing lazy JSON registry already loads future authored packages by filename, and its readiness predicate derives availability from actual files. The existing video view derives playback from Bunny mappings and presents pending copy when absent. No alternate lesson registry, fake ready flag, new language control or source-visible learner field is needed or added.

## Resumption sequence

Use the existing module order and prerequisite relationships as reviewable batches. Start M02-M06 (19 remaining shared-foundation lessons), then application modules M07-M20, and finally M21 after a selected application has been completed. Keep repeated construction methods inside examples instead of creating duplicate lessons.

For each batch, inspect the mapped source pages at sufficient resolution, record internal facts and unresolved details, author Egyptian/MSA/Gulf/English packages with aligned concept and answer IDs, produce paragraph-specific diagrams, export PDFs through the existing builder, inspect layout and four-locale runtime behavior, and prepare contextual spoken scripts. M19 requires supplemental original authoring; regulatory-looking and dangerous-operation material requires suitable primary evidence before normative claims.

Do not generate narration/video or alter workflow, Bunny mappings or accepted existing packages. Egyptian qaf and listener acceptance remain owned by the coordinating task.

## Validation and delivery

- Nine Python integrity-gate tests passed, including realistic corrupt locale, reused diagram, source footer, invalid answer, absent FAQ target, fact drift and false-completion cases.
- Baseline structural audit passed: five authored IDs, zero newly authored IDs, 75 missing IDs.
- Complete-journey gate intentionally fails with `completion denied: 75 lessons remain unauthored`.
- Existing application, PDF exports and media were not changed; UI/build/media/layout checks were not rerun and no such new acceptance is claimed.
- No merge, publication, database, payment, entitlement or production action occurred.

## Reference recovery and resumed authoring

The coordinator recovered the exact reference via authenticated workspace placement and applied Library identity metadata. SHA-256 and 408 pages match the previously documented source. Status is now `in_progress`; the earlier 502 records remain historical evidence. Selected source pages have been visually reviewed, and M02-L01/L02 four-register manuscripts are drafted. Drafts do not yet count as complete lessons: illustration assets, PDF/layout and runtime gates remain. No new audio/video has been generated.

## M02 authored and verified

Four new lessons (M02-L01 through L04) now have 16 contextual locale packages, 12 distinct concept geometries, 32 PDF downloads and 16 linked video-text scripts. They cover actual-user reach testing, opening/use conflicts, same-scale proportional comparison and functional layouts. Generic source dimension tables are not presented as universally applicable requirements.

New workbooks use measured block pagination; practice starts on a separate page. All 32 new PDFs passed content/footer separation. All64 PDF pages were rendered and their four-register contact sheets reviewed; old44 PDF SHA-256 hashes remain unchanged. The two original door/collision figures were corrected so their hinge arcs and highlighted overlap match the depicted geometry before final export.

Nineteen scoped UI/content/diagram tests, nine authoring-integrity tests, application TypeScript and scoped ESLint passed. Browser checks passed32 lesson/register/viewport visits at390/1440px: three distinct illustrations per lesson, matching full-size SVG assets, valid PDF-only links with type-plus-title download names, one platform language selector, no page errors/overflow and pending video instead of invented playback. No new speech/video was generated; written narration needs the coordinating qaf and listener gate.

Verified cumulative content count is9 lessons including the five preceding lessons. This branch contributes4;71 of its original75 remain unauthored. Production build and GitHub durability receipts follow after the batch commit. No main deployment or integration is implied.

M02 delivery receipt: production build passed; GitHub commit `4effbd66dae5a4bb698ad91b811a2b6a8c2aa172` on the isolated remaining-75 branch has tree `965c07d3ee3837f137b12bee25e8af7736b8677c`, matching all126 local files exactly. Native HTTPS push lacked credentials, so immutable blobs/tree/commit and a non-force branch update were used. Parent branch, main, publication and audio/video production remain untouched.

## M03 authored and verified

Four additional lessons distinguish actual timber/sheet products, finish and edge build-ups, upholstery/mixed-material interfaces and evidence-based material alternatives. All four registers retain the same decisions and assessment answers while adapting spoken wording. Source review is recorded internally; manufacturer performance, support values and prices are not invented.

The batch has16 contextual packages,12 concept-specific diagrams,32 PDF downloads and16 linked video-text scripts. All64 exported PDF pages were rendered and contact sheets visually reviewed. Browser acceptance passed32 lesson/register/viewport cases; representative Egyptian mobile and English desktop readings were inspected. Nineteen scoped Vitest checks, nine Python integrity tests and application TypeScript passed. All44 preceding PDF hashes remain byte-identical. No audio or video was produced.

Cumulative verified new authoring is8 lessons/32 locale packages, making13 existing-plus-new content lessons of80. The original75 scope has67 remaining. The earlier502 materialization failure is historical and resolved. Clean-commit build and durable GitHub receipt follow.

M03 delivery receipt: build passed with4096MB Node heap after the default2GB limit was reached. Commit `4a35a18882ea8acb40f49a1045434461ff8c2b48` is durable on the isolated branch; tree `0a8bf18edb081afc3efac02d896b400fdba05d58` exactly matches119 files.

## M04 authored and verified

Three remaining M04 lessons now provide12 contextual packages,9 distinct concept diagrams,24 PDFs/48 rendered pages and12 video-text scripts. The reused M04-L02 pilot is unchanged. Concrete exercises link three600×720×400mm views and resolve a450mm conflict, calculate398/399mm cores under explicit1mm edge assumptions, and update training costs300→330 with a30 difference. These are declared exercises, not universal product dimensions or market prices.

All48 PDF pages were visually inspected; proportion and section-direction figures were corrected and their final Egyptian/English pages reviewed. Browser acceptance passed24 locale/viewport cases and representative reading views were inspected. Nineteen scoped Vitest tests, TypeScript and nine Python integrity tests passed. All44 accepted original PDF hashes remain unchanged. Verified cumulative contribution is11 lessons/44 locale packages, or16 content lessons including the preceding five;64 remaining lessons are unauthored. No speech or video was generated.

M04 delivery receipt: production build passed with4096MB heap. Commit `60e4b021f23d24752c3a78ca9a9e2ecc4bc37dae`, tree `04b051392991349e819e34ff63821ec940a7e5b3`, durably contains91 matching changed files on the isolated branch.

## M04 Arabic arithmetic remediation

Coordinator review found that right-to-left SVG text reversed arithmetic operands and the signed change. Seven numerical labels in the three M04 arithmetic geometries now use Unicode LRI/PDI. The shared renderer is unchanged. Nine Arabic-register SVG assets and six affected workbooks were regenerated; worksheet, English and all44 original accepted PDF hashes remain unchanged. All9 actual SVG renderings were visually reviewed with correct400−1−1=398,4×15=60,6×15=90 and+30 order. A dedicated regression checks isolates and operand equality;11 scoped Vitest tests,10 Python tests and TypeScript pass.

Status counts are recomputed from verified batches:11 new +64 remaining =75;44 verified locale packages. A new invariant verifies batch sums, four-register totals and the75-lesson scope. M05 content drafts are not included in this completion count or remediation commit.

M04 arithmetic remediation receipt: commit `5dd5886b4989eee2c254fdec6bcbb70da14037e5`, tree `bf9581bc7ea02a79b74152cf1b7cc8c8f78c4252`, durably matches22 remediation files. M05 four-register content is now drafted and remains outside verified counts pending diagrams/PDF/runtime acceptance.

## User-requested safe stop

Execution is paused. M05 is a separate unapproved checkpoint with four draft lessons/16 packages and generated reading assets; it is not included in11 verified lessons/44 packages or64 remaining. See `M05-CHECKPOINT.md` for exact completed runs, final visual gaps and replay evidence. No M06 manuscript, publication, reviewed-media update or audio/video production occurred.


## M05 resumed and accepted through the owner-requested 20-lesson boundary

The owner authorized completion through20 content-reviewed lessons and then a stop. M05-L01 through M05-L04 now pass final content/reading-asset review in Egyptian Arabic, MSA, Gulf Arabic and English. The batch contains16 contextual packages,12 distinct concept geometries/48 locale SVGs,32 PDFs/64 rendered pages and16 written video scripts. Narration and video are not produced or accepted by this authoring branch. No M06 package was started.

The final review corrected joined numeric text, isolated Arabic arithmetic (including addition and parentheses), and adjusted Egyptian/Gulf wording. Spoken script strings omit directional control characters while display text retains them. Bottom labels were moved clear of SVG limits and separated from neighbouring labels. The drawer opening guide was changed from a line through the box label to a horizontal opening-width guide; closed and extended box dimensions remain identical. No previous lesson content, geometry or accepted PDF was changed.

All64 final PDF pages were rendered and reviewed in eight contact sheets, with the critical L03 calculation page and final SVGs inspected at readable scale. The complete48-export SVG text-bounds gate passes. Browser acceptance passes32 lesson/register/viewport visits at390/1440px: correct distinct figures, valid PDF downloads, one platform locale selector, no overflow/page errors and honest video-pending copy. Twenty scoped Vitest checks, ten Python integrity tests and TypeScript pass. The structural gate reports20 available content IDs and60 missing IDs; it does not claim80 complete lessons.

The original44 accepted PDF hashes and all preceding diagram definitions are unchanged; all132 pre-M05 PDF bytes remain unchanged. Source identity remains408 pages and the recorded SHA-256. The initial dirty-tree build was stopped by the existing roadmap guard; the clean-commit build result follows. Evidence is preserved in `m05-acceptance-evidence/`.

Verified authoring contribution is15 lessons/60 locale packages; with the initial five the content count is20 of80. Remaining scope is60 lessons. Stop here until the owner authorizes continuation.

M05 clean-commit build receipt: passed with `PATH=/tmp/technical-tools/node_modules/.bin:$PATH NODE_OPTIONS=--max-old-space-size=4096 /tmp/technical-tools/node_modules/.bin/bun run build`. Existing roadmap and contextual-visuals gates passed, followed by client/server production bundling. No bypass was used. The final receipt changes documentation only. Local acceptance is ready for coordinator integration; this branch did not push or publish.
