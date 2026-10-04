# Technical education curriculum blueprint

Owner instruction, 2026-10-04 (Africa/Cairo): convert the entire supplied furniture book into a complete learning journey, deduplicate repeated methods, improve Egyptian narration, and produce context-adapted Egyptian, MSA, Gulf and English versions. This replaces the earlier two-locale production target; existing delivered pilot assets remain Egyptian/English until actually revised.

## Reviewed source and completed planning

- Library source: `libfile_e700ff35ecc48191a7c4f0425700a7f8`, `Metwood_Furniture_Design(1).pdf`, 408 PDF pages, SHA-256 `63ae6c7b933fe33cacddbb32210390d43926da632b72d9cbeb5643f10bc6a136`.
- All pages reviewed through visual contact sheets; the source contents page and selected technical pages inspected at full resolution. Heading OCR is an aid only. No blanket validation of dimensions, code requirements or manufacturing instructions is claimed.
- `curriculum-map.json`: 7 sections, 21 modules, 80 proposed unique lessons and 320 planned localized packages. Every lesson has an observable outcome, assessment evidence, source page anchors and a planned status. Prerequisites form a forward learning sequence. Every PDF page has a disposition; every one of the 404 learning-reference pages is anchored to at least one lesson. Pages1,2,68,408 are cover/index/divider/contact rather than separate lessons.
- Source page numbers refer to 1-indexed PDF pages, not the repeated printed poster/module numbers. Page references are internal authoring evidence; sources do not return to learner-facing lesson footers.
- The count is an editorial blueprint, not a fixed production quota. Split or combine a lesson if detailed authoring reveals a distinct skill or needless repetition.
- Existing `furniture-m1-cut-list` is reused at `M04-L02`; no duplicate pilot is created.
- `voice-review-pack.json`: three concept-linked calibration segments in each locale, pronunciation focus notes, shared cabinet facts, and audio acceptance criteria. Text is authored; no new narration was generated or accepted in this planning revision.

## Reuse and production boundaries

Teach shared planning, dimensions, materials, drawings/cut lists, joints/hardware, manufacturing/installation/inspection once in M01-M06. Retain other book models as examples, exercises, comparison cases or PDF variants. Separate applications where construction, motion, use context or required technical verification actually changes.

Reuse Masaarat's approved lesson methodology, existing pinned Remotion project, existing GitHub Actions workflow, existing locale profiles and Bunny technical-education collection. Keep Egyptian pronunciation changes scoped to this project and keyed in the voice cache. The existing furniture CLI/composition/content still support only their currently authored Egyptian/English delivery; four-locale authoring, assets, rendering and UI checks are future implementation work.

Keep canonical facts, units, part IDs, assessment answers and construction scope consistent across all four versions. Adapt vocabulary, phrasing and instructional rhythm; do not perform literal sentence translation or reuse Egyptian phonetic conversion for other locales. Display text, spoken text and captions remain separate linked fields.

Remotion demonstrates modeled geometry or a reviewed process; it does not certify fabrication competence. Machine-operation teaching and hands-on assessment need separate suitable instruction. Regulatory-looking source diagrams, including pages146 and249, require official applicable-source verification before normative teaching. Hotel/restaurant overview pages are brief; M19 needs supplemental authoring rather than invented claims of complete source detail. Cost worksheets use supplied values with source/date; source example prices are not current quotes.

The present experiment's FAQ is fixed and math grading limited. Grounded generative assistance and human project assessment remain unimplemented. Technical package eligibility is not decided or changed. This adult technical curriculum does not modify Masaarat Kids. Main merging, platform production deployment and central registers remain central integration work.

## Validation of this planning revision

Validated unique lesson IDs, valid page anchors, forward prerequisite references, exhaustive 1-408 page disposition coverage, and direct lesson anchors for all404 learning-reference pages. Calibration concept IDs and fact keys match across four locales; original cabinet arithmetic remains internally consistent. The 32-page Arabic review PDF was rendered and checked for content/footer overlap and visual layout. No runtime code, media, database, entitlement, payment or production change was made; unchanged UI/media tests were not repeated.

The user-facing review PDF is saved separately as `Masaarat_Technical_Education_Curriculum_Blueprint_2026-10-04.pdf`. Its source bookkeeping belongs to this internal plan, not to downloadable learner lesson footers.

## Implementation batch 1 — 2026-10-04

Authorized execution is underway on the same temporary branch. The learner catalogue contains all 7 sections, 21 modules and 80 lesson IDs, with original source-free labels in all four locales. Ready content and planned catalogue entries are distinguished: only M01-L01 through M01-L04 and the reused M04-L02 are authored in this batch. An outline entry is not a produced lesson.

The first module contains 16 independently authored locale packages: explanation, worked case, objective quiz, practice fields, self-review criteria and fixed lesson Q&A. Technical diagrams accompany each explanation and open at full size. Device-local preview progress and locale-specific practice text survive reloads, but are separate from the existing account lesson_progress system reserved for main integration. Changing an accepted quiz or arithmetic answer invalidates the corresponding preview state. Practice self-review is not human project approval.

M04-L02 now has Egyptian, MSA, Gulf and English copy and assets, without fallback to Egyptian for the other Arabic registers. Its underlying cabinet arithmetic and original Remotion geometry are reused. The Egyptian narration script uses revised number wording and scoped pronunciation hints; audio naturalness remains pending until a listener checks new output.

44 PDF downloads: two PDFs per first-module localized lesson (32), plus workbook/cut-list/drawings for the four pilot registers (12). Download names combine the localized file type and lesson title. Export uses the same authored content, checks every page for content/footer overlap and preserves metric expressions with bidi isolation. No book title, page reference, source footer or book download enters learner data or assets.

The existing lesson-video.yml workflow now produces the reviewed first-module lessons and the reused pilot: 5 lesson IDs × 4 locales. It reuses pinned Remotion, Gemini profiles, Bunny uploader, collection and ready-status gate. Audio cache keys depend on the actual spoken text/focus/profile; a separate render fingerprint identifies an already playable matching video. The technical jobs retain previous Bunny videos. The original adult build job is preserved unchanged. All 20 outputs require successful rendering and Bunny readiness; committing this batch schedules production, not completion or speech acceptance.

Main-site merging/publication, technical package eligibility/pricing, account progress integration, grounded generative assistance and human project assessment remain separate integration tasks after content readiness. The remaining 75 lessons are not yet authored.

### Current local acceptance

22 scoped tests passed; application TypeScript, scoped ESLint, production build, original two Remotion geometry tests and audio-mux regression passed. The original adult video build job matches its pre-change configuration. Browser checks passed all four locales at 390/1440 px across the journey, four authored lessons and reused pilot: no page errors/overflow, contextual diagrams and PDF-only downloads with actual descriptive browser filenames. A reload restored saved practice. Non-experiment account/payment/API routes and POST requests return 404 in the private preview wrapper.

Every PDF page passed content/footer separation; all 76 workbook pages were rendered and visually checked in contact sheets. The technical Remotion explainer rendered successfully and its Arabic frame was reviewed. Unchanged PDF inputs now reuse verified output hashes; a second export reused all 44 PDFs. Existing accepted English assembly speech/visual fields are unchanged and its compatible render revision is seeded for ready-status reuse, rather than producing a duplicate video. Production of the new 19 cells and pronunciation listening remain unverified until Actions returns evidence.
