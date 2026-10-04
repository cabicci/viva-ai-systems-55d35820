# Technical education curriculum blueprint

> Current checkpoint: 80 content-reviewed lessons in four locales (320 packages), 644 PDFs. All content authoring is complete. Video production and actual pronunciation listening remain separate gates; earlier stop instructions below are historical.

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

### Delivery evidence

Implementation commit: f4c4051b5556dc4c981c2100b66c0fea21064fb3. Private preview source: 76dcd96c2d7ae02500cc7228009859d35a675e40. Deployment appgdep_6ac19e28d1988191b32bede202bdfd82 succeeded at the existing owner-private URL; root redirects to the journey. No Masaarat main-site deployment occurred. Actions run37165099121 started: technical collection succeeded, adult plan/build skipped, first Egyptian assembly production in progress. New narration is not yet accepted by a listener. The deterministic PDF exporter is included in scripts/technical-education/build-pdfs.tsx.

### Explanation illustration correction — 2026-10-04

The previous first-module explanations reused one generic SVG three times per lesson; the cut-list reading view also reused front/exploded assets for different steps. Those repeated figures did not communicate the paragraph-specific idea and the earlier browser check missed that semantic defect.

The correction gives each of the 12 first-module sections its own diagram key and geometry, plus six dedicated cabinet explanation figures. All four locale packages preserve the same concept mapping and use localized captions. Reading, full-size SVG links and workbook PDFs consume the same figure. Existing drawing downloads remain PDFs; workbook downloads retain type-plus-title filenames. No reference-book mention is added.

Acceptance: 23 scoped tests passed, including actual SVG-content uniqueness across all 18 concepts and four locales; application TypeScript, scoped lint and production build passed. Browser checks covered 40 lesson/locale/viewport combinations at 390/1440 px: unique figures per explanation, matching full-size assets, no horizontal overflow or page errors. All 44 PDFs passed content/footer separation (20 illustrated workbooks regenerated, 24 unchanged PDFs reused). All 76 workbook pages were rendered; representative Arabic/English pages and diagram sheets were visually reviewed. Narration/video production was not changed or restarted by this reading/PDF correction. Main integration remains pending.

Delivery: correction commit 8ef640f8ddbce072a9cfb8eb628f5b41d9d9d407 on the temporary branch. Private preview source 77ca53c67882df89141d84cf4280846f7a0635c9; deployment appgdep_6ac1e621fa688191a887dd8b8edd97b2 succeeded at the existing owner-private URL on 2026-10-04T05:38:15Z. The preview contains the corrected reading figures and PDF workbooks; no Masaarat main-site deployment occurred.

### Platform language selector and video typography — 2026-10-04

Removed the extra locale-link row from TechnicalJourney. The existing header LanguageSelector remains the single language control, including on lesson pages and unavailable lesson entries. The existing locale navigation preserves the lesson search parameter and uses the platform's normal default-locale URL behavior.

Both technical Remotion compositions now use the shared `cairo` theme for Arabic headings and explanation text. English retains its previous font. The shared theme source is included in Arabic render fingerprints; narration source/cache keys are unchanged. Seven English assembly scene frames were compared before/after and were pixel-identical, so its accepted Bunny GUID can retain a compatible render revision instead of regenerating accepted English narration. The existing production matrix prioritizes M01-L01 for review and still contains the same 20 lesson/locale cells. No change to the original adult build job.

Baseline verified: Actions run37165099121 completed all 20 technical jobs successfully. Runtime source contains five authored lesson IDs in four locales and 20 Bunny video mappings; the remaining 75 lessons are catalogue entries only. Voice naturalness still requires listener acceptance. This correction does not make the 80-lesson journey complete.

Local acceptance: 18 scoped UI/content/diagram/navigation tests, application TypeScript/lint/build, two Remotion geometry tests and the audio-mux regression passed. All 81 Arabic scene frames across the five lessons were rendered with the same Cairo v31 font bytes requested by the existing shared theme; Egyptian/MSA/Gulf contact sheets and representative full-size frames were reviewed. The existing font source is reused without a new font service or dependency. New rendered video delivery and updated private preview remain pending.

Header acceptance: 16 actual language changes passed across the journey lesson and reused pilot at 390/1440 px. Each view contains one existing header selector; the selected lesson remains open, the content and document direction change, and no duplicate language links or horizontal overflow remain. Browser checks waited for the header's own React change handler before selecting a language. The existing platform locale-navigation hook is unchanged. Remotion TypeScript also passed after making shared type-only imports relative; those imports do not change learner SVG/PDF output.

First revised media delivered: run37186728823, Egyptian M01-L01 job111390141615 succeeded. All five narration segments were restored from the existing voice cache (zero new TTS segments). New Bunny GUID 5a7ddb0e-7154-4fae-9a36-6b5ceced090f reached playable status4, length106 seconds, resolutions through1080p. This is the first Cairo video delivery; subsequent cells remain in progress. Naturalness has not been newly accepted by a listener.


### Egyptian qaf listening requirement — 2026-10-04

User requires qaf pronunciation to be decided per word and context, including words that retain qaf. Scoped inspection found the legacy compact TTS prompt still says qaf=hamza, while the allow-list preprocessor also transforms selected words. The existing voice review pack now contains all qaf tokens in the five Egyptian narration scripts and a mandatory context/listening gate. This is a recorded acceptance requirement, not a completed audio fix. Existing Cairo renders reuse earlier audio; pronunciation correction and word-level listener decisions remain pending. No global TTS prompt, accepted audio, other locale voice or main-site behavior was changed.


Private preview delivery: source89ba7808fd2273012147a23daea226369219c0b3, deployment appgdep_6ac20681821881918debe0509c4a2ac4 succeeded at 2026-10-04T07:56:00Z. The owner-private preview contains the single platform header selector and the new Cairo Egyptian M01-L01 video GUID5a7ddb0e-7154-4fae-9a36-6b5ceced090f. Main integration remains unchanged. Actions run37186728823 has completed Egyptian M01-L01 through L03; L04 is in progress. Later media mappings are not included in this compiled preview. Egyptian pronunciation remains pending word/context and actual-listening acceptance.


Source recovered — 2026-10-04: resolved-reference prepare_materialize placed the exact source at /workspace/scratch/61b6becf6b09/technical-source-recovery/Metwood_Furniture_Design(1).pdf. Verified 183250232 bytes, 408 pages and SHA25663ae6c7b933fe33cacddbb32210390d43926da632b72d9cbeb5643f10bc6a136; applied Library identity/xattrs. The earlier HTTP502 materialization blocker is superseded. The second agent has resumed actual remaining-75 authoring in its isolated branch/worktree, starting M02–M06. Existing curriculum mapping is reused without restarting planning. No new lesson-completion count, audio acceptance or publication is claimed until reviewed batch evidence arrives.


### Reviewed M02 integration and scoped Egyptian voice production — 2026-10-04

Integrated agent batch 4effbd66: four M02 lessons, 16 contextual locale packages, 12 distinct concept geometries, 32 PDF downloads and 16 narration text packages. Agent acceptance: 64 PDF pages visually reviewed, 32 browser cases, all 44 previous PDFs unchanged. Coordinator reviewed Arabic/English contact sheets, and confirmed all 48 existing localized first-module SVGs remain byte-identical after the additional-diagram dispatcher. Current authored content: 9 of 80; new media does not count as complete until generated and checked.

Technical Egyptian TTS now uses an explicit context-based pronunciation policy and preserves authored text and dimensions. The old blanket qaf-to-hamza prompt/preprocessor is bypassed only for technical Egyptian calls; existing adult and other-locale profiles remain unchanged. Exact provider-payload comparison passed for 81 non-Egyptian segments; guarded compatibility preserves 15 existing audio/render identities only for the reviewed unchanged inputs. Egyptian segment cache identity includes its exact speech, focus, voice, model and policy, so compatible unaffected segments can be reused safely on retries. Actual new-audio naturalness remains pending listening; a prompt regression test is not speech acceptance.

The existing workflow now selects only content-reviewed, missing/revised media and verifies readiness before reuse. Its matrix is bounded to 200 cells and reports the remainder explicitly for subsequent production checkpoints. Up to two technical cells run together, and per-cell mapping commits retry against the latest temporary branch. Original adult build job is unchanged. Reviewed media manifest includes the nine lessons; no outline-only entry is approved for production.

Coordinator acceptance so far: six voice-policy tests, six scheduling tests, nine authoring-integrity regression tests, audio-mux gate, 17 shared diagram/content tests, application TypeScript and scoped lint passed. Previous Cairo Actions run37186728823 completed successfully for all 20 original cells. New production and updated preview are pending until their returned receipts are recorded. No main integration, pricing, account progress or database changes.

Coordinator integration build passed (Node heap increased for the existing large application build). Remotion TypeScript passed. Forty actual M02 Egyptian/English scene frames rendered with the existing shared fonts; all 24 concept frames were visually reviewed, with no missing concepts, clipping or word wrapping defects. New narration is not yet accepted.


### Specific Egyptian piece pronunciation correction — 2026-10-04

User listening reported that قطعة still retained qaf. Context instructions alone were insufficient. Added an explicit audio-only pronunciation allow-list for singular/dual piece forms and their reviewed prefixes: قطعة → إِطعة. Authored lesson spelling, on-screen text and captions remain correct Arabic. Ambiguous قطع, other qaf words, other registers and legacy adult calls are untouched. Eight policy regression checks passed, including the actual provider request, diacritics/prefixes, unchanged dimensions and per-segment cache identity: segments without these words retain their existing v1 cache names. First-module affected narration: M01-L01 one of five segments; L02–L04 zero. M02 affected segments: L01 zero, L02 two, L03 two, L04 one. Actual output/listening remains pending; no new pronunciation acceptance is claimed from tests.

Private preview now contains nine authored-content lessons, source0f1edee6d086703e1d22ed311da061d31e5ad58b; deployment appgdep_6ac21a624ce081918085b64ac5145661 succeeded at 2026-10-04T09:20:48Z. Integrated M02 header selection passed eight actual locale switches at 390/1440px. Existing run37191746985 planned exactly21 media cells: five revised Egyptian and16 M02 outputs; all15 unchanged non-Egyptian originals were reused. This preview predates the specific piece correction. Main integration remains pending.


### Reviewed M03 integration — 2026-10-04

Integrated remaining-authoring batch4a35a188: four materials/finishes/selection lessons in four contextual registers, 12 distinct concept diagrams and32 additional PDFs. Agent acceptance:64 rendered PDF pages visually reviewed,32 browser cases, scoped tests/type/lint and production build (4GB Node heap) passed. Existing accepted PDFs reused. Coordinator read the Egyptian authored explanations/examples/quizzes/FAQ and reviewed Arabic/English contact sheets. Current authored content:13 of80; M04 authoring continues in the isolated agent worktree. Pending new media/listening is tracked separately. No main integration.

Coordinator M03 gates passed:12 scoped content/diagram tests,9 authoring-integrity regression tests, application TypeScript/lint/build. Forty actual Remotion scene frames rendered; all24 concept frames visually reviewed in Egyptian/English with correct shared fonts and no clipping. Specific piece correction delivered separately: run37192233302, job111406718073, Bunny231483c4-394c-4e5f-874f-5b8468c1b8dc, status4,109s. TTS reused4 cached segments and generated exactly1 affected segment. Downloaded artifact11299319307 SHA2563bb41eb90d12a1e3224836e18ae4a2369c8f7fdd08d975a7d40ffcf5e0c476f4 and checked render duration109.233s/mean volume−16.5dB. Direct audio-input/listening is unsupported in this session; pronunciation remains pending actual listening, not falsely accepted.


### Reviewed M04 integration — 2026-10-04

Integrated batch60e4b021:three additional lessons/12 contextual packages/9 concept diagrams/24 PDFs/12 narration text packages. Coordinator reviewed Egyptian explanations, example calculations and assessment decisions:600×720×400 mm linked views,400−1−1=398 mm and400−1=399 mm training edge assumptions,2×100+4×15+40=300 and revised6×15 totals330 with delta30. Dimensions/prices are explicitly training assumptions; no source disclosure to learners. Agent gates:19 tests,9 integrity regressions,TypeScript/build,24 browser visits,48 PDF pages visually reviewed and all44 old PDFs unchanged. Existing M04-L02 reused. Cumulative authored content16 of80;64 remain. New media and actual speech listening remain separate unfinished gates. No main integration.

M04 coordinator visual gate found reversed numeric/math expressions in RTL SVG text (400−1−1=398 and4×15=60). M04 has been removed from local production approval pending a definition-only LRI/PDI correction and regenerated dependent SVG/PDF assets. This illustrates why passing structural tests alone is insufficient. Renderer remains unchanged to preserve earlier render/cache identities. Coordinator-reviewed content remains13; M04 candidates do not count as approved until recheck.

M04 defect closed with agent fix5dd5886b:seven numeric/formula strings isolated by LRI/PDI; unchanged renderer; nine Arabic SVGs and six workbooks regenerated. Coordinator inspected actual corrected edge calculation,revision and cost SVG raster outputs:400−1−1=398,4×15=60,6×15=90,+30 now read in the intended direction. Ten integrity regression tests passed,including status11+64=75. M04 reinstated in production approval after the visual recheck; approved authored-content count16 of80. Actual speech listening remains pending separately.


### User-requested safe pause — 2026-10-04 12:52 Africa/Cairo

Stopped new authoring, QA, video dispatch and preview publication at the user's request. Coordinator checkpoint is on checkpoint/technical-education-pause-20261004; the authoring agent is saving unapproved M05 work separately on experiment/technical-remaining-75-20261004. Resume from these saved branches, not from an older chat or main.

State:16 content-reviewed lesson IDs (original5 plus M02/M03/M04 new11),64 remaining outside that content-review count. This is NOT16 fully complete lessons: media delivery, actual pronunciation listening and final preview gates remain separate. M05 has4 draft lessons/16 packages/12 diagrams/32 PDFs, excluded from approved counts and production approval pending final visual/browser acceptance.

The corrected M04 production build and30 actual Remotion frame renders finished successfully before this pause. Corrected SVG numeric expressions were visually checked; final visual inspection of corrected Remotion frames and checking numeric expressions in raw TechnicalJourney/Remotion detail text remain the next verification steps. No speculative renderer changes were made.

Egyptian piece correction is implemented and delivered at Bunny231483c4-394c-4e5f-874f-5b8468c1b8dc (status4,109s). Four audio segments reused; only the affected segment regenerated. Actual pronunciation remains UNVERIFIED by listening: current audio-input capability is unsupported. Do not claim the reported word was audibly accepted.

Private preview remains the prior9-lesson build (source0f1edee6d086703e1d22ed311da061d31e5ad58b; deployment appgdep_6ac21a624ce081918085b64ac5145661). It predates the new piece video and M03/M04. No new deployment was made at this pause. Previously submitted Actions runs37191746985/37192233302/37192762844 can still finish; no new runs are dispatched. The available connector has no cancellation capability; do not state those jobs were canceled. Preserve any subsequent bot media receipts on the experiment branch.

Resume order:inspect latest experiment/media-bot state and the author-agent pause receipt; verify remaining M04 frames/math display; reconcile checkpoint without overwriting new Bunny mappings; complete M05 QA; then update the private preview and continue M06 onward. Retain per-word Egyptian pronunciation handling,existing shared fonts/language selector,PDF-only downloads,hidden source and accepted-asset reuse. Main-site integration,packages/account progress and billing remain for the integration room.


### Resume to exactly20 content lessons — M04 closure

User authorized the next checkpoint at20 content-reviewed lessons, then stop. M04 Arabic prose, examples and quiz explanations now isolate arithmetic with LRI/PDI, preserving logical operands in HTML and video detail text. Eight affected workbooks were regenerated and all24 pages visually inspected; original PDFs remain reused. Sixty Remotion frames rendered across four locales; corrected arithmetic and representative frames visually checked. Browser acceptance passed24 lesson/register/viewport visits. Ten authoring tests and15 scoped Vitest tests passed, plus the new prose-order regression. M05 review and final integration follow before the20 count is accepted. Latest completed media run37192762844 succeeded; its bot mappings were merged without overwriting them. Pronunciation remains pending actual listening.

### Exactly20 content-reviewed lessons integrated

M05 acceptance bbdbf4ad integrated after32 browser cases,48 SVG boundary checks,64 rendered PDF pages and four-register semantic review. Cumulative20 lessons/80 localized content packages with164 PDFs. M05 has12 concept-specific diagrams, lowered bottom labels, corrected drawer dimension geometry and directional isolation for Arabic equations. All earlier accepted PDF and SVG hashes in the authoring checkpoint remain unchanged.

User requested stop at20: M06 and later lessons are not started. The reviewed production manifest now contains exactly20 IDs; only missing/revised media within those IDs may be produced.52 prior Bunny mappings cover13 lessons;28 cells for M04/M05 remain without media. Actual listening is pending, including the piece-word correction already delivered. Private preview publication/build receipt follows. No main merge/deployment, database, account progress, entitlement or billing changes.

### Published20-lesson stop receipt

Integrated16 scoped Vitest and10 authoring-integrity tests passed; clean production build passed with existing guards. Runtime inventory confirms20 lessons/80 locale packages/164 PDFs; no M06 packages. Private Site source f6dd431b414627312fb793d9333de3ea3001c819 deployed successfully as appgdep_6ac2331cfab881919b10069e62cd30e4 at2026-10-04T11:06:30.991661Z. Owner-only audience unchanged. GitHub source d907939b792f6bccb35cdd57a258de5c507cf671 has tree cb8f615b9727925830231d24c72f103350d97f13, identical to compiled local37504bd7.

Authoring stopped exactly at20 per user.52 video mappings/13 lessons are in this deployment, including Egyptian piece correction231483c4-394c-4e5f-874f-5b8468c1b8dc. Actions37197540381 started for missing/revised cells within20 reviewed IDs only; completion and subsequent mapping updates are unverified at handoff.28 M04/M05 cells were missing at build time. Actual listener acceptance remains pending. Resume by checking this run and bot mappings; do not restart authoring or begin M06 without authorization.

### Integrated second20-lesson batch; stop at40

[roadmap:furniture-pilot-temporary-branch] Owner requested20 more after the20 checkpoint. Integrated M06/M07 (616b186d), M08/M09 (35a7f10f), M10 and firsttwo M11 lessons (2ecf46b8):20 new lessons/80 localized content packages/60 concept diagrams/240 SVGs/160 PDFs. Cumulative40 content-reviewed lessons/160 locale packages/324 PDFs;40 remain. M11-L03 and later are untouched. The original164 PDFs remain byte-identical.

Authoring gates:160 browser lesson/locale/viewport cases at390/1440,240 SVG label-boundary checks,320 PDF pages visually reviewed, contextual four-register facts and assessment alignment. Coordinator read all20 Egyptian packages, compared selected MSA/Gulf/English concepts, corrected formal Egyptian phrasings and reviewed400 rendered Remotion frames through all240 concept frames plus representative intro/case frames. The unsupported amber paint defect was corrected in definitions only; a rendered-paint regression now rejects invalid SVG colors. Renderer, TTS pipeline and earlier accepted media identities are unchanged.

Correct pronunciation is mandatory independently in Egyptian, MSA, Gulf and English. All listening decisions remain pending; text/volume/render/production evidence is not listener approval. The reviewed media manifest is bounded to40 IDs. Main-site integration,account progress,entitlements,database and billing remain unchanged. Final integrated gates/build/GitHub/private-preview receipts follow.


## Final private publication receipt — 40 lessons — 2026-10-04

Content stopped at M11-L02 (40 lessons / 160 localized packages / 324 PDFs); M11-L03 requires a new continuation request.
Owner-private preview published successfully: https://masaarat-furniture-lesson-preview.khalillotfy.chatgpt.site
Site source: `0be59e63df8e4fbaec937dec97e41d3a393e3dba`; deployment: `appgdep_6ac23f3bd21c81918f13655ee60cccdc`.
Compiled content tree: `411c72047ac742543786dc3cb4ad582e52d7f923`, durable content commit: `cef9a4591ec9bddd444dd7a3e4f787c4cc936926`. Experiment integration: `44c4343a595d8757497ecadc17c8f6f8d2b06e4f`; preserves later media bot updates.
Preview has 68 video mappings for 17 lessons at build time. Video run 37200455123 is pending behind in-progress run 37197540381; do not claim production completion. Actual pronunciation acceptance remains pending independently for ar-EG, ar-MSA, ar-Gulf, and en.
Root gates passed: 17 Vitest, 10 Python integrity tests, TypeScript, scoped ESLint, production build. No main-platform release.


## Final40 integrated — 80 content lessons — 2026-10-04

[roadmap:furniture-pilot-temporary-branch] Owner authorized all remaining40. M11-L03 through M21-L03 now add160 contextual packages,120 concept diagrams,480 SVGs,320 PDFs/640 visually reviewed pages and160 video-text scripts. Total80 content lessons/320 locale packages/644 PDFs. All324 preceding PDFs remain byte-identical. Global register and media production approval contain all80 IDs.

Coordinator reviewed all40 Egyptian manuscripts, selected MSA/Gulf/English comparisons, all480 concept frames from800 rendered Remotion stills, and representative intro/case frames. Corrections cover Arabic numeric spacing/isolation, quiz alignment, assembly-depth wording and complete manual references. M17-L01 was rerendered in allfour locales after its first-sentence correction. Scoped evidence records320 browser viewport cases plus targeted retests,480 SVG bounds and640 PDF pages. No actual listening acceptance is claimed in any of ar-EG/ar-MSA/ar-Gulf/en.

Final integrated tests/build, durable GitHub and private-preview receipts follow. Keep generated preview assets in dist/client (the earlier plain-HTML cause is fixed). Renderer/TTS runtime, main platform, billing, entitlements and account integration are unchanged.


## Private publication receipt — 80 content lessons — 2026-10-04

Published successfully at https://masaarat-furniture-lesson-preview.khalillotfy.chatgpt.site . Site source36e0a4a6fe5d71e35fbf55496728649fe95ba0d2; deployment appgdep_6ac24b01ae7481919a8ce25281b9313f; succeeded2026-10-04T12:48:31Z. Owner-private audience retained. Compiled repository snapshot cba238e2b39bd272569a2619704e68f8278a5a0c/tree062149eef4c7727decc91c98fd3e70c468f58487.

Published content:80 lessons,320 localized packages,644 PDFs,80 video mappings covering20 lessons. This is a media snapshot; later bot updates are preserved in the experiment branch. Main-site integration remains out of scope. Correct pronunciation is independently pending actual listening in Egyptian,MSA,Gulf andEnglish.

Integrated gates passed:80-lesson structural completion,17 Vitest checks,10 Python integrity tests,TypeScript,scoped component/runtime ESLint,clean-commit production build. The wider directory lint also reports two pre-existing formatting warnings-as-errors in unchanged M04 test lines; no functional issue was found and the file was not reformatted. Preview asset regression verifies SSR and all12 referenced CSS/JS/brand assets; generated files are under dist/client. All324 earlier PDFs retain their SHA-256 hashes.

Preserve the existing media workflow and accepted voice caches; the planner handles at most200 missing/revised locale cells per run and reports any deferred remainder. Production success is not pronunciation listening acceptance.
