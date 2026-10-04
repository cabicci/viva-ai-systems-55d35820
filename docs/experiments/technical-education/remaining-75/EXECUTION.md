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
