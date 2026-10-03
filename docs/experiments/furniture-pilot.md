# Furniture lesson pilot — temporary branch

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
- Ready mapped videos are reused on retry. Use the existing `force_script=true` input to rebuild an already-ready pilot after a narration/animation revision. Outputs are not committed as MP4s; GitHub artifacts are temporary evidence and Bunny is the playback destination. Platform lookup and iframe conventions are reused. No new workflow, storage vendor, secrets or generative script call is introduced. Upload metadata must confirm the requested collection before accepting the new pilot mapping.
- No main merge or deployment is requested. The pilot stays outside the six canonical adult paths, with no catalogue/entitlement/database changes, Stripe TEST retained and Kids stopped.

## Completed Higgsfield sample (comparison only)

One reference image was generated with GPT Image2.5 (2.75credits), then one silent5-second Kling3.0 Pro video (8.75credits). Repeated identical animation requests were deduplicated. Video job `b24738d5-89b1-4f99-b0f5-a00eabfc450f` completed; local ffprobe reports5.041667s,1912×1080, video stream only. Five sampled frames retained the cabinet, one shelf and two openings during hand movement. This is limited sampled-frame review, not certification of dimensions or manufacturing competence. The silent comparison sample is kept in the generation history; the lesson player uses Bunny only. No further Higgsfield generations are planned following the owner's cost decision.

## Validation / acceptance

Before this revision:22 focused tests, TypeScript, scoped lint and production build passed; four-locale desktop/mobile route and seven-page workbook checks were completed on the initial source. Those historical checks do not imply the revised media is production-approved.

Current revision: cabinet construction tests check six panels, final bounding dimensions, no intersecting panel volumes, equal273mm openings and the294mm overlay-back position. Local30-second Arabic/English animation previews are rendered and inspected. Focused UI tests verify pending delivery, the existing Bunny iframe with autoplay disabled, and download fallback to the two authored languages. Workbooks are regenerated for the two retained languages.

GitHub generation, voice quality, Bunny playback and saved mappings must be confirmed from actual run results. Until then, narration/hosted delivery remain pending. The grounded generative assistant and human portfolio assessment remain unimplemented; this is not a completed full educational track.

Local revised checks:24 lesson tests and2 animation construction tests passed; application and Remotion TypeScript checks, scoped lint, Python syntax checks, collection reuse/create/duplicate-name tests and the production build passed. The local build required a4GB Node heap after the default2GB heap exhausted; no source workaround was introduced. Both retained workbooks have7 pages; changed content/video pages and both animation previews were visually reviewed.
