# Furniture lesson pilot — temporary branch

Latest owner direction, 2026-10-04 (Cairo): the accepted pilot methodology becomes the basis of a complete book-derived technical learning journey, with repeated methods merged, improved Egyptian pronunciation, and four context-adapted versions (`ar-EG`, `ar-MSA`, `ar-Gulf`, `en`). The [curriculum blueprint](technical-education/README.md) records this revised production target. Existing delivered lesson/video/PDF assets below are still Egyptian and English; no four-locale delivery or improved audio is claimed yet. Earlier two-locale scope notes remain historical delivery evidence.

Branch: `experiment/furniture-pilot-20261003`. Route: `/experiments/furniture-pilot?locale=ar-EG` or `locale=en`. Lesson ID: `furniture-m1-cut-list`. Scope revised by the owner on 2026-10-04 (Cairo): Egyptian colloquial Arabic and English only; use the existing platform video pipeline and Bunny rather than producing further Higgsfield shots.

This is an original planning exercise inspired by the owner-supplied Metwood PDF (planning p3, furniture details p25, materials p97). It does not copy or validate the reference's dimensions.

## Construction

Open front, W600 × H600 × D300 mm. Full-height sides, top/bottom/middle shelf between them, 6 mm overlay back included in overall depth. Nominal body thickness18 mm. Sides600 ×294 ×18; top/bottom/shelf564 ×294 ×18; back600 ×600 ×6. Six pieces, two equal clear openings273 mm. No approved joints, machining allowances, hardware, fixing or loading specification.

Practice task W800/H700/D350: internal width764, body depth344, opening323. Automated grading covers arithmetic only. Human portfolio review and machine training remain separate ([HSE](https://www.hse.gov.uk/woodworking/training.htm)).

## Implemented lesson

Existing shell, palette and typography; goals, prerequisites, six explanation sections, three dimensioned drawings per language, panel calculator, four-question quiz, arithmetic practice, review rubric and cost worksheet. Seven-page PDF and JSON cut list per language. Fixed FAQ explicitly distinguished from the unimplemented generative assistant. Reading, knowledge and arithmetic progress are separate and reset on reload.

Only Egyptian Arabic and English are authored. Other Arabic platform preferences resolve to the Egyptian version for this experiment, including its downloads. No additional Gulf or MSA assets are maintained. Rebuild original assets with `bun scripts/furniture-pilot/generate-assets.ts`.

## Video: reuse the established pipeline

- Existing pinned Remotion dependencies (`4.0.466`) are reused; no duplicate project or package installation configuration.
- The new composition is `remotion/src/furniture/index.tsx`. It shows six mathematically dimensioned panels moving from an exploded layout to their final positions. Geometry imports the same lesson model used by the calculator. The composition demonstrates panel positions, not a fastening procedure.
- `script.json` holds the Egyptian colloquial and English narration/display text. `build-furniture-pilot.py` reuses `remotion/scripts/lib/gemini_tts.py`: the existing Egyptian profile (`locale=None`) and English profile (`locale=en`), voice Charon. Measured audio durations drive each animation stage; existing WebVTT generation supplies timed caption files and transcripts. No Higgsfield voice picker is needed for this pipeline.
- The existing `.github/workflows/lesson-video.yml` has a bounded furniture job on this temporary branch only. It renders two language cells, finds or creates one Bunny collection named `مسارات التعليم الفني` (serialized, exact-name lookup), uses the existing `upload_bunny_locale.py` with an optional collection ID, requires status4 plus a positive duration through `verify_bunny_ready.py`, and saves only the pilot composite mappings through `merge_bunny_entry.py`. Existing lesson jobs still use their original manual dispatch behavior. Furniture uses `lesson_ids=furniture-m1-cut-list` on manual dispatch and renders automatically when its source changes on the temporary branch.
- Ready mapped videos are reused on manual retry; furniture-source pushes rebuild the video while cached voice takes are retained. Use the existing `force_script=true` input to rebuild an already-ready pilot after a narration/animation revision. Outputs are not committed as MP4s; GitHub artifacts are temporary evidence and Bunny is the playback destination. Platform lookup and iframe conventions are reused. No new workflow, storage vendor, secrets or generative script call is introduced. Upload metadata must confirm the requested collection before accepting the new pilot mapping.
- No main merge or deployment is requested. The pilot stays outside the six canonical adult paths, with no catalogue/entitlement/database changes, Stripe TEST retained and Kids stopped.

## Completed Higgsfield sample (comparison only)

One reference image was generated with GPT Image2.5 (2.75credits), then one silent5-second Kling3.0 Pro video (8.75credits). Repeated identical animation requests were deduplicated. Video job `b24738d5-89b1-4f99-b0f5-a00eabfc450f` completed; local ffprobe reports5.041667s,1912×1080, video stream only. Five sampled frames retained the cabinet, one shelf and two openings during hand movement. This is limited sampled-frame review, not certification of dimensions or manufacturing competence. The silent comparison sample is kept in the generation history; the lesson player uses Bunny only. No further Higgsfield generations are planned following the owner's cost decision.

## Validation / acceptance

Before this revision:22 focused tests, TypeScript, scoped lint and production build passed; four-locale desktop/mobile route and seven-page workbook checks were completed on the initial source. Those historical checks do not imply the revised media is production-approved.

Current revision: cabinet construction tests check six panels, final bounding dimensions, no intersecting panel volumes, equal273mm openings and the294mm overlay-back position. Local30-second Arabic/English animation previews are rendered and inspected. Focused UI tests verify pending delivery, the existing Bunny iframe with autoplay disabled, and download fallback to the two authored languages. Workbooks are regenerated for the two retained languages.

Final narrated delivery evidence is recorded below. Linguistic and practical teaching acceptance still needs owner review; no independent word-by-word speech audit or fabrication approval is claimed. The grounded generative assistant and human portfolio assessment remain unimplemented; this is not a completed full educational track.

Local revised checks:24 lesson tests and2 animation construction tests passed; application and Remotion TypeScript checks, scoped lint, Python syntax checks, collection reuse/create/duplicate-name tests and the production build passed. The local build required a4GB Node heap after the default2GB heap exhausted; no source workaround was introduced. Both retained workbooks have7 pages; changed content/video pages and both animation previews were visually reviewed.

First Actions run `37155069222` created/resolved collection `4972720c-4dd7-48e6-b341-34e3b4875b26` and reached Bunny status4 for the Egyptian candidate. Local inspection found its output audio was silent (mean−91dB): the mux had selected Remotion’s own silent track. This candidate is not accepted as narrated delivery. The corrected mux explicitly maps video input0 and narration input1, with a−60dB mean-level upload gate and a synthetic regression test. Narration is cached by locale/script/TTS profile so animation revisions reuse the voice takes. Source pushes rebuild the pilot; manual retries can still reuse a ready mapping. The corrected delivery evidence below supersedes this failed audio candidate. All prior Bunny mapping values are verified unchanged; the existing helper sorted their entry order when inserting the pilot key.

## Completed narrated pilot — 2026-10-04 (Cairo)

Corrective Actions run [37155581488](https://github.com/cabicci/viva-ai-systems-55d35820/actions/runs/37155581488) succeeded for both languages. Both uploads confirmed collection `4972720c-4dd7-48e6-b341-34e3b4875b26`, reached Bunny status4 with positive duration, and saved only the pilot mappings on the temporary branch. Downloaded final MP4 artifacts are1920×1080 with narration: Egyptian63.4s, mean−16.3dB, peak−0.7dB; English71.766667s, mean−19.2dB, peak−1.3dB. Sampled frames of both final outputs were reviewed. Voice caches saved for both languages, so animation revisions can reuse those takes. Earlier silent pilot candidates were replaced through the existing uploader. All404 pre-existing mapping values are unchanged.

- [Egyptian video](https://iframe.mediadelivery.net/embed/670679/633273af-b0ff-4a55-9d4e-3fdeea581247?autoplay=false&preload=true)
- [English video](https://iframe.mediadelivery.net/embed/670679/2c9e2846-cf35-4817-88aa-ca7edbe503b5?autoplay=false&preload=true)

Both retained workbooks link to their Bunny videos. Actual desktop/mobile route checks for both languages returned200 with correct RTL/LTR, noindex, no document overflow or page errors; each revised lesson uses the existing Bunny iframe. Fusha and Gulf remain proposed extensions, not generated. No main merge or production deployment. The generative assistant and human assessment remain open.


## Private live lesson preview — 2026-10-04 (Cairo)

Owner requested the whole lesson as displayed on Masaarat, rather than separate video/PDF links. An isolated private preview reuses the compiled platform route, Navbar, styles, FurniturePilotLesson component and both accepted Bunny mappings from commit `31cc4861c2fbd95e02245f808f41cb787691c2bf`. No lesson UI was rewritten.

- [Egyptian lesson](https://masaarat-furniture-lesson-preview.khalillotfy.chatgpt.site/experiments/furniture-pilot?locale=ar-EG)
- [English lesson](https://masaarat-furniture-lesson-preview.khalillotfy.chatgpt.site/experiments/furniture-pilot?locale=en)

Private preview publication succeeded: Site `appgprj_6ac17ca726108191a946e5eda8d27a90`, deployment `appgdep_6ac17d4f65808191bb2e486f27ee0b73`, preview source `c5fdda72650bfffafd1f06ca3f17b9d9020b4d93`. This is separate review hosting; no main merge, Masaarat production deployment, production configuration or central-register update occurred. Only the experimental lesson and public assets are served; account/payment/API/server-function endpoints return404.

The exact preview Worker was checked locally with Playwright in both locales at1440px and390px: HTTP200, correct RTL/LTR, no horizontal overflow or page errors, correct Bunny iframe with autoplay disabled, interactive calculator table and both workbook downloads. Native deployment reported succeeded; this is not a production-platform acceptance claim.


## Owner presentation refinements — 2026-10-04 (Cairo)

Removed the source section from the learner-facing lesson footer and workbook. Internal reference history above remains unchanged. Lesson files now offers three PDF downloads per authored language: the7-page workbook,1-page cut list and3-page drawing set. JSON/SVG files remain technical/inline drawing assets, not Lesson files downloads. Six contextual thumbnails reuse the existing front, side and exploded drawings beside their respective explanation sections; each opens the drawing at full size. On smaller screens the diagram follows the explanation to retain readability. Existing Bunny videos are reused without regeneration.

Validation:8 existing lesson UI tests, application TypeScript, scoped ESLint and the production build passed. All six PDF files were inspected:7-page workbook,1-page cut list and3-page drawing set per locale; source reference removed. The updated preview Worker passed both locales at1440px/390px with six explanatory images, three valid PDF downloads, no source footer, no overflow/page errors and unchanged Bunny embeds. Desktop/mobile drawing placement and changed PDF pages were visually reviewed. Private preview deployment `appgdep_6ac180b8e00c8191b45a947015ef97ed` succeeded at the same URL, from preview source `279a904c44bd860c4514ba5cec23f64eaee84ba7` built from experimental implementation `d3e756233484d24c0faaabf3a1176c7fac0a6b01`.


## Descriptive PDF filenames — 2026-10-04 (Cairo)

Owner requested downloaded filenames to contain the file type and lesson name. All three Lesson files downloads and the Practice workbook link use localized descriptive download names, ending in.pdf. Characters unsuitable for Windows filenames are replaced with separators. Existing asset paths, PDF contents and Bunny videos are reused.


## Temporary technical-education wordmark — 2026-10-04 (Cairo)

Owner requested a technical-education logo matching KIDS and temporarily placed next to it. TechnicalBrand reuses the official Masaarat lockup and KIDS typography, stroke and four letter colors for TECH, with an Egyptian/English education caption. The experimental route opts into its adjacent desktop/mobile link through Navbar.showTechnicalPreview; other Navbar callers retain the existing default. The link opens this experimental lesson.

Acceptance:12 lesson/navigation tests, TypeScript, scoped ESLint and the production build passed. The older Navbar fixture was updated to supply the actual locale and expect the existing locale-preserving Kids link; a focused regression test verifies that the TECH link is absent by default and follows KIDS in opted-in desktop/mobile navigation. The exact compiled private preview was checked in both authored locales at1440px,1180px and390px: adjacent brand placement, no header overflow, actual browser PDF suggested filenames including type/title, and the same descriptive workbook name from Practice. Header/mobile-menu screenshots were visually reviewed. Private deployment `appgdep_6ac1837ca5788191915fb725876ee0ab` succeeded at the existing URL, from preview source `bb3e840713f13a5ed2c9b2a8194d8e5eb9720d94` compiled from implementation `a54c00610fb289e0fa571991e6a9e5913174f050`. Videos and PDF contents were not regenerated for these two refinements.

## Book-wide curriculum planning and four-version target — 2026-10-04 (Cairo)

The owner authorized starting the complete learning-journey design after confirming deduplication and context-preserving localization. Reviewed the latest supplied 408-page PDF and mapped all pages in `technical-education/curriculum-map.json`: 7 sections,21 modules,80 proposed unique lessons and320 planned localized packages. Each lesson has an objective, assessment evidence and exact page anchors; every learning-reference page belongs to at least one lesson. Shared methods are taught once; useful variations remain exercises, cases or PDF assets. The current pilot is reused at M04-L02. The blueprint does not validate all source dimensions or code diagrams, and brief commercial overviews require additional authored detail.

Authored a12-segment, four-locale voice calibration pack with consistent cabinet facts and Egyptian pronunciation focus hints. This is text-only preparation, not improved or accepted audio. The planning report contains all module/lesson specifications, source coverage, deduplication, language policy, voice checks and production batches. Data consistency and 32-page PDF layout were checked. No runtime, media, catalogue, permissions, payments, main merge, Masaarat production publication or central-register change occurred in this planning slice.

## Technical journey execution — 2026-10-04

The owner authorized execution with main-site package/progress integration following accepted content. The new private experiment route /experiments/technical-education browses the 7/21/80 catalogue. First delivery contains M01-L01..L04 in four context-adapted registers; M04-L02 reuses this original cut-list lesson in all four registers. Source-free learner copy, contextual diagrams, 44 PDFs and device-local preview progress are implemented. See technical-education/README.md for exact scope and remaining 75 lessons. The shared TECH opt-in link now opens the journey; ordinary Navbar callers are unchanged. First-batch video generation expands the existing pipeline to 20 cells; revised Egyptian spoken text is preparation for improvement, not a claim of accepted audible pronunciation. Main billing, permissions and account storage are unchanged.
