# Isolated course production pilot

This package is a separate Vite preview and a bounded media engine. It is not imported by the Masaarat application, does not alter global locales and has no production database connection. The owner authorized one new soil-sampling pilot in Egyptian Arabic, English, Italian and German on `work/soil-course-pipeline-20261013`; the remainder of the curriculum waits for review.

## Run and review

From this directory, using the repository's existing dependencies:

```sh
bun x vite --host 127.0.0.1 --port 5183 --strictPort
python pipeline.py validate
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
bun x vite build
```

Open `http://127.0.0.1:5183/?lang=ar-EG`; change `lang` to `en`, `it` or `de`. The selector changes this course only. Learner progress and trainer notes stay in browser storage, separately per locale. Exporting a practice record downloads JSON. The prototype's lesson guide performs transparent local retrieval; it is not the existing authenticated OpenAI course assistant, and no API key is embedded in the preview.

## Source → learning → media → review

1. Keep original documents read-only and private. Record their exact identities and page references. The English source controls subject coverage; reconcile material conflicts against primary scientific sources before authoring.
2. Define the learner, competence and observable evidence. For this pilot: collect and document a representative composite sample under a trainer. The numerical sampling brief is explicitly simulated and is not a universal agronomic prescription.
3. Author one semantic sequence with stable scene IDs. Each locale contains the display text, narration, verbatim caption text, practice instructions, feedback, glossary and trainer checklist. Localize the entire learning experience rather than only the narration.
4. Validate the package and align assessment with the objectives. Keep private assessment answers out of any future assistant corpus. The four practice questions in this prototype intentionally reveal feedback after answering; they are not a secure examination bank.
5. Inspect diagrams and the mobile/desktop journey. Run `node review-scenes.mjs` after preparing the two shared local assets as done by `produce`. It renders all 32 representative scene frames for inspection.
6. For an owner-authorized scope, use `python pipeline.py request --batch-id <unique-batch-id>` to bind the manifest, locale content, renderer, font, logo and lockfile. `produce --locale …` rejects stale snapshots before provider calls. The workflow is additionally fixed to this branch and the four cells of this pilot.
7. Preflight the configured Gemini model. Generate each spoken scene separately, cache its WAV by actual narration/locale/style/model/voice and validate format. Retry transient failures at most three times. Do not rewrite source text to evade a provider refusal or silently switch model or accent.
8. Fit scenes to measured WAV durations, render with the pinned Remotion version, then mux using FFmpeg. Verify H.264/AAC, 1920×1080 and output duration. Generate VTT and exact narration transcript. Captions are scene-aligned with proportional sentence timing, not word-level forced alignment.
9. Preserve partial audio even if rendering fails. Download Actions artifacts to durable storage; Actions artifacts and caches expire and are not the permanent archive. Local `output/` is independent of Git and should be backed up before cleanup.
10. Materialize received media with `python pipeline.py preview`, then review actual playback, captions, each language, scientific accuracy and trainer usability. Owner review, native-language review and listening acceptance are independent of technical success.

## Reuse for a different course

The engine accepts `--package /absolute/path/to/package`. A package contains `course/manifest.json`, one `course/<locale>.json` per configured locale, and a matching `pilot-request.json`. Use a new course ID, lesson ID and batch ID. The engine derives locales, scene IDs and component counts from the package; Egyptian/English/Italian/German voice styles are currently implemented. A different language needs an explicit reviewed style, not fallback to another locale. The current GitHub workflow and frontend are intentionally the soil pilot; author a separately scoped request/workflow and matching preview for another course.

For technical learning, provide procedure, equipment, safety conditions, troubleshooting, authentic practical evidence and trainer observation. For academic learning, define concepts, prerequisites, worked reasoning, problems/cases and suitable evidence; practical machinery checklists are not imposed on academic lessons. Both modes use the same manifest, localization, audio cache, media and provenance mechanics. The `Diagram` component currently supports the eight soil visual types; new content requires fit-for-purpose visuals, not renamed soil diagrams.

## Hashes and independent status

| Identity | What invalidates it |
| --- | --- |
| Original source SHA-256 | Changed source bytes |
| Locale content hash | Any authored locale content change |
| Audio scene key | Spoken words, locale/accent instruction, provider model, voice or PCM format |
| Render hash | Scene/display content, media settings, renderer, shared assets or lockfile |
| Request snapshot | Manifest, locale packages or engine/assets differ from the authorized request |

A visual change reuses identical audio. A failed upload must not regenerate audio; upload is a future adapter, not implemented by this pilot. Receipts keep generated, listening-reviewed, owner-accepted, uploaded, mapped and published states separate. Changing a receipt flag is not evidence of acceptance.

## Existing platform boundary

No Bunny uploads, production mappings, database writes, indexing, merges or deployments occur here. Future integration must use the existing Masaarat/Lovable project and existing authenticated course-assistant access rules. Any new assistant adapter must scope retrieval by this course and selected locale and exclude private answer keys. Existing course IDs, videos and audio remain unchanged.

The current Actions request generates only the pilot; editing a README does not trigger it. Re-running a changed source requires a new matching snapshot. Never update a snapshot mechanically to expand scope without the owner's corresponding instruction.
