# M06–M07 authored checkpoint — 2026-10-04

Scope: exactly eight lessons, M06-L01–M06-L04 and M07-L01–M07-L04, curriculum positions 21–28. The parent coordinates the larger stop-at-40 request. This checkout does not claim the other twelve new lessons or publish any site.

## Completed deliverables

- 32 contextual lesson packages across Egyptian, MSA, Gulf and English; each has three taught concepts, a worked decision, an objective question, practice criteria and a section-linked FAQ.
- 24 original concept-specific vector definitions and 96 localized SVG exports. The shared renderer is unchanged; only additive owned keys were added.
- 64 PDFs (32 workbooks with three pages each; 32 one-page worksheets), 128 pages total. All pages were rendered and visually reviewed. The 164 earlier PDF files retain identical SHA-256 hashes.
- 32 contextual video-text records. Every `spoken_text` is free of display direction controls. Audio/video generation and listening approval are not claimed.

## Source and technical review

The existing recovered 408-page source was reused; its identity was already verified. Eighteen distinct mapped pages were rendered and visually examined as conceptual anchors. The exact source identity and per-lesson page selections are in `evidence-m06-m07/source-and-content-review.json`. No book pages, branding, source notes or machine/fixing specifications were inserted into learner material.

Manufacturing plans separate operation outputs from machine training. Finish acceptance uses an actual documented sample. Installation keeps fixing/system approval and service coordination explicit. Defect closure requires reinspection evidence. Wardrobe examples distinguish independent and shared carcasses, clear width from part cut size, sliding access from frontage, and arithmetic remainders from circulation approval. Dimensions are declared teaching assumptions.

The parent reviewed M06 and M07 text and requested natural Egyptian wording adjustments. These were applied, including removal of formal inflections in spoken Egyptian, `ادّي الملاحظة`, `كرر نفس فحص القبول`, `مش عرض رف جاهز`, and `ما بيطلعش لقدام`. This is text review, not listening acceptance. Correct pronunciation remains an independent pending gate for **each of the four versions**. There is no blanket qaf substitution.

## Verified evidence

- Offline integrity: pass, zero errors. This branch contains 28 authored lesson IDs and 52 remaining; it is not the integrated 40-lesson branch.
- UI: 64 lesson/locale/width visits at 390 and 1440 pixels on local port 4187. Each has three distinct diagrams, valid zoom SVGs, one header locale selector, two real PDF downloads, no horizontal overflow or page errors, and honest pending-video text.
- Post-edit UI: 24 further visits for M07-L02–L04 after diagram/text corrections.
- SVG bounds: all 96 exports checked. Visual review corrected a dimension label crossing a line, a label on a divider, and a divider conflicting with the wide drawer. Final diagram contact sheets are retained.
- PDF: all 128 pages rendered; all final contact sheets reviewed, arithmetic pages additionally inspected at full size. No text spans outside page bounds; no visible clipping or overlap.
- Existing scoped component/library tests: 16 passed. Validator regression tests: 10 passed. TypeScript `--noEmit`: pass.

Reports and final contact sheets are retained under `evidence-m06-m07/`. Temporary full-page renders and UI screenshots are under `/tmp/technical-21-28/`; checked-in PDFs are the source for reproducing page renders. No main-site, payment, entitlement, media pipeline, global progress manifest or production review manifest was changed here.

## Integration contract

Integrate owned lesson/script/asset paths and add only the M06/M07 keys to `new-diagrams.json` and `pdf-revisions.json`. Existing entries in both maps were verified identical to the base commit. The parent owns global progress, final build, Remotion frame review, production dispatch and owner-private preview publication.
