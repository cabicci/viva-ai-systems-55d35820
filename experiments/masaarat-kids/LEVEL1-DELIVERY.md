# Masaarat Kids · Level 1 delivery
Ages 10–12; twelve lessons; four authored locales: Egyptian Arabic, Modern Standard Arabic, Gulf Arabic, and English. This is an isolated pilot on `feature/masaarat-kids-pilot`, not a change to adult Masaarat production.
## Learner experience
The offline review uses the platform's IntroSection, QuizBlock, styles, lesson cards, previous/next links, and back-to-dashboard navigation. Its header places a KIDS wordmark in the platform's blue-teal gradient beside the Masaarat logo. It presents one lesson at a time without a lesson selector.
Every lesson has goals, written explanation, an independent 1900×1000 teaching image, explained quiz, practice, a mission, self-review rubric, and source-linked hints. The page artwork is separate from its video scenes.
Lessons 2–12 use seven short animated scenes per locale, the Masaarat logo, Cairo, the original mascot, narrated speech, and scene-aligned WebVTT. Lesson 1 keeps its accepted shorter narrated videos and independent reading-corner image.
## Build and inspect on Dell
From `experiments/masaarat-kids`:
1. `bun install --frozen-lockfile`
2. Set `MASAARAT_REVIEW_DEPS` to the existing adult checkout with installed dependencies.
3. `python scripts/build-editorial-review.py`
4. `bun scripts/check-editorial-review.mjs`
5. Open `editorial-review/index.html` locally. `portable.html` has the same text and images but points to the Dell copy for videos.
The review has no learner accounts, submissions, analytics, or live AI calls. All prompt-builder input stays in the browser.
## Media production
`.github/workflows/kids-level1-production.yml` is restricted to the pilot branch and a request file, and runs 44 isolated locale/lesson jobs. It never publishes media or changes main.
The existing Gemini secret is used in the narration step. The job verifies text hashes, WAV signal, H.264/AAC encoding, dimensions, captions, and duration. Long trailing silence from TTS is removed before final rendering; any such repair is recorded.
Download artifacts for one exact run outside the worktree, then import with `python scripts/import-level1.py ARTIFACT_DIRECTORY --run-id RUN_ID --source-sha COMMIT_SHA`. Import checks all 44 cells before updating the media manifest.
If a job has an anomalous trailing-silence failure, recover its original audio with `scripts/trim-level1-audio.py`, rerender and run `scripts/verify-level1.py`. `scripts/overlay-level1-recovery.py` adds the verified local result to that job's artifact before the complete import.
## Completed pilot review
The 44 new videos came from GitHub Actions run `35934649679`, pinned to source commit `53c8955eaffd38977d463c23d7f4daca1c14c98d`. Forty-three jobs passed directly; lesson 2, ar-MSA used the original generated audio after a documented trailing-silence trim and a successful local render/verification. `evidence/level1-production-import.json` records the exact import.
The assembled offline review is at `E:\Masaarat\Pilot-Review\Masaarat-Kids-Level1-Content\index.html` on the Dell, with 48 videos and 48 WebVTT files. `evidence/editorial-viewer-qa.json` records the complete browser pass across 48 locale/lesson combinations and 152 quiz questions.
## Review and release boundary
Technical media checks and browser checks do not certify dialect naturalness or word-for-word spoken accuracy. Native-speaker listening and owner approval are still required before child-facing release.
The current pilot does not modify production routes, the platform video registry, database, billing, or the main branch. Age bands 12–14 and 14–16 remain curriculum outlines.
## Evidence
- `evidence/editorial-viewer-qa.json`: learner-page navigation, quiz, responsive layout, images, video metadata.
- `evidence/level1-illustrations.json`: independent image hashes.
- `evidence/narrated-lesson-XX-locale.json`: per-video technical checks.
- `evidence/trim-lesson-XX-locale.json`: any TTS silence repair.
- `evidence/level1-production-import.json`: complete imported run, source commit, and recovery list.
