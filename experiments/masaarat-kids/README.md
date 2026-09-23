# Masaarat Kids — isolated first-lesson pilot
One lesson: **Turn your idea into a clear prompt**, level 1 (ages 10–12).
Reserved curriculum bands: 10–12, 12–14, 14–16. Shared boundary ages are placement decisions.
## Content and identity
Four authored locale packages: Egyptian Arabic, Modern Standard Arabic, neutral Gulf Arabic, and English.
Each contains 12 scenes, 3 objectives, 5 explained quiz questions, a practical mission with self-review rubric, and 4 source-linked hints.
Objectives and assessment criteria match; narration and wording are localized naturally.
The official logo and Cairo font come from the repository, with checksums in evidence/brand-provenance.json. Colours derive from the existing Remotion theme. The mascot is an original animated SVG.
## Review page
After building, open dist/index.html on Dell. The prototype runs locally with no accounts, analytics, or persistence of learner input.
The prompt builder combines the learner's text locally; it does not send it to an AI provider. Model-output examples are explicitly authored teaching illustrations.
The helper retrieves curated answers within the current lesson, level and locale. A 48-chunk source corpus is included. Generative RAG is not connected.
The media manifest distinguishes silent visual previews from narrated videos. A narration notice remains visible until that locale has an imported narrated video.
## Produce and reproduce
Install: bun install --frozen-lockfile
Prepare/check: bun run assets; bun run check; bun test; bun x tsc --noEmit
Build review page: bun run build
Check the browser and media: bun scripts/browser-qa.ts; bun scripts/media-qa.ts
Optional visual previews: bun run render --preview --stills
Narration uses Gemini TTS, model gemini-2.5-flash-preview-tts, voice Charon, with explicit locale instructions.
The isolated kids-pilot-production.yml workflow runs only on the pilot branch when production-request.json changes. The existing repository secret is injected only into the narration step.
It produces four locale artifacts with WAV segments, narrated MP4, 12 scene stills, scene-aligned WebVTT, and technical evidence. It does not upload to a public video host.
Unchanged local audio is reused by hash; temporary HTTP errors have bounded retries. Provider refusals stop generation.
Rendering checks narration text hashes. Verification checks WAV format, audible signal, exact scene duration, video/audio codecs, dimensions, and file hashes.
## Receive artifacts on Dell
Download the exact successful run with gh run download into a dedicated folder outside the worktree.
Run python scripts/import-artifacts.py ARTIFACT_DIRECTORY --run-id RUN_ID --source-sha COMMIT_SHA.
Then rebuild and run browser/media checks. Import checks all four locale artifacts before replacing preview entries.
## Acceptance and limits
Technical generation does not certify pronunciation or spoken accuracy. Listening review by speakers of each locale remains necessary.
WebVTT is aligned to scene boundaries using source scripts, not forced word-level alignment.
The owner can review content, mascot and motion in this isolated prototype. Child-education review and provider/privacy setup are separate gates before child-facing generative use.
The adult production workflow, main branch, platform routes, video registry, database and billing are unchanged.

## Verified delivery ? 23 September 2026
All four narrated videos have been imported into the local review page. Eight desktop/mobile browser checks and four playback checks passed.
Arabic outputs: run 35867880239, source f065101dfc4298095b1034a8b7c7993aace13bcf. English output: run 35871971135, source 1dcc0c08231e5e8d185542c7a32e6030f7aa085f.
English recovery reused ten completed segments after correcting transcript framing and a transient provider timeout.
The import receipt records both production sources. Listening review is still pending; generative RAG remains disconnected.

## Revision 2 ? owner feedback
The original four-minute videos and video-still lesson gallery were rejected for length and presentation. Revision 2 uses short localized challenge scripts, animated visual examples, and four independent 1900x1000 explanatory graphics following the Masaarat contextual-card method. The page presents three key steps; extra explanation is expandable and source links open it. New narration and rendering run in GitHub Actions; R1 audio reviews do not apply to this revision.

Revision 2 delivered on Dell: production run 35881755433, source 7b82e2646864c51ff6a10ba38182b359e954c8d3. Egyptian 103 seconds, MSA 120 seconds, Gulf 113 seconds, English 103 seconds. All four imported media files passed playback checks; all eight locale/viewport page checks passed. The complete offline package is E:/Masaarat/Pilot-Review/Masaarat-Kids-R2/index.html; GitHub package run 35882316117. Native-speaker listening and owner acceptance remain pending. R1 audio-review files are historical and do not certify revision 2.

## Independent image revision and curriculum proposal
Owner liked the R2 lesson and requested a completely different illustration. Page artwork now uses a reading-corner naming exercise, separate artwork and layout, and no video characters. Video scripts, assets and timings are unchanged. The page illustration has its own pageIllustration field, separate from the video illustration data.
The curriculum folder contains a proposed 36-lesson map (12 per age band) and a complete four-locale editorial draft for lesson 2. These are not integrated lesson routes or produced lesson-2 media. The owner authorized completing level-1 text first in four locales.


## Level 1 editorial content - 23 September 2026
All 12 lessons for ages 10-12 now have four localized editorial packages (48 total). The offline review contains 356 narration scenes and 152 explained quiz items, activities, missions, hints and independent illustration briefs. Lessons 2-12 media have not been produced. Levels 2 and 3 remain curriculum outlines.

Build the read-only review: `python scripts/build-editorial-review.py`. Open `editorial-review/index.html`. Verify navigation and responsive rendering: `node scripts/check-editorial-review.mjs`. This does not change platform routes or publish lessons.

Source drafts: GitHub Actions run 35923832252, commit 2c6332801271e8cdf48afe2afc023444471e52d1. The generation run ended with editorial-review findings, not successful automated approval. Codex assessed those findings against the actual text and applied source, quiz, privacy, self-contained activity and consistency corrections. Original reports are retained; per-lesson editorial-resolution.json and manifests record source/final hashes. Forty new locale packages passed structural validation. Native-speaker and child-education approval remains pending. No new media was generated in this content phase.

Dell review copy: E:/Masaarat/Pilot-Review/Masaarat-Kids-Level1-Content/index.html. Owner review of the text precedes media production; the accepted lesson-1 pilot remains separate.


## Learner presentation correction - 2026-09-23

The content-review screen now uses the platform IntroSection and QuizBlock components directly, the platform styles.css tokens/utilities, and the 48rem lesson column/header rhythm from the live learn route. One lesson is displayed at a time; production scripts, image briefs, teacher notes and bulk-print controls are excluded from the learner interface. All 48 content packages remain unchanged.

Build with `python scripts/build-editorial-review.py`; optional `MASAARAT_REVIEW_DEPS` points to an existing checkout with installed root dependencies. The Dell uses the existing main checkout dependency installation without changing it. `editorial-review/index.html` includes local lesson-1 videos; `portable.html` embeds the independent illustrations and states that video playback is available in the Dell copy. Later lesson media remains unproduced.

Offline-only build adapters supply locale state and unauthenticated quiz behavior; no attempts, learner data or analytics are sent to production. No production components or routes were modified. Sources and editorial Markdown exports retain all preparation content. `node scripts/check-editorial-review.mjs` covers all 48 packages and 152 quiz items. Human visual approval is pending.


### Navigation correction - no lesson selector

Removed the lesson dropdown entirely. The entry page follows the platform dashboard ModuleRow card grid and Start lesson action. Reader navigation uses the shared platform Button component (glass/violet), previous/next links, a next-lesson continuity card and Back to dashboard. Hash routes support browser Back and direct lesson reload. Locale selection preserves the open lesson.

Scoped verification: `node scripts/check-review-navigation.mjs` passed 96 lesson/locale/viewport cases plus browser history, deep links, module expansion, boundary links and overflow checks. Evidence: `evidence/review-navigation-qa.json`. Lesson content, media and production routes are unchanged. The existing full content QA script was adapted to the new navigation, but its full quiz/media suite was not rerun for this navigation-only change.


## Lesson 2 independent illustrations - 2026-09-23

Four localized 1900x1000 museum-visit decision maps now accompany lesson 2. They use the official logo, Cairo and Masaarat palette. Their museum artwork and three-choice instructional map are separate from the lesson-2 science-exhibition video storyboard. Source: `scripts/illustrate-lesson-02.ts`; hashes: `evidence/lesson-02-illustrations.json`. Lesson-2 video remains unproduced; the learner page says so.
