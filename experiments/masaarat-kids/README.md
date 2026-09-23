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
