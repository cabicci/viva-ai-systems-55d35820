---
name: lesson-video-recovery
description: How to recover lesson MP4s when the build workflow's commit/push step fails — always check GitHub Actions artifacts first before re-running the workflow.
type: preference
---
# Lesson Video Build Recovery Rule

When the `Lesson Video Build` workflow (`.github/workflows/lesson-video.yml`) shows a job as green/success but the commit is missing from `origin/main`, OR when a job fails at the commit/push step:

**ALWAYS check artifacts FIRST. NEVER re-run the workflow before checking.**

## Why
The workflow uploads `public/lessons/intro/<id>.mp4` and `remotion/src/lessons-generated/<id>.gen.ts` as a GitHub Actions artifact (`lesson-<id>-mp4`) BEFORE the commit step runs. Artifacts persist for 90 days. Re-running wastes 5–10 min per lesson × N lessons of Gemini API calls when the built files already exist.

## Diagnostic flow (in this order)
1. List recent runs:
   ```
   curl -sS -H "Authorization: Bearer $GH_PAT" -H "Accept: application/vnd.github+json" \
     "https://api.github.com/repos/cabicci/ai-ecosystem-hub-72/actions/workflows/lesson-video.yml/runs?per_page=20" \
     | jq '.workflow_runs[] | {id, run_number, status, conclusion, created_at}'
   ```
2. For each suspect run, check individual job status (NOT just overall run conclusion):
   ```
   curl ... /actions/runs/<RUN_ID>/jobs?per_page=50 | jq '.jobs[] | {name, status, conclusion}'
   ```
3. List MP4 artifacts available:
   ```
   curl ... /actions/runs/<RUN_ID>/artifacts?per_page=100 \
     | jq -r '.artifacts[] | select(.name | endswith("-mp4")) | "\(.name)\t\(.id)\t\(.expired)"'
   ```
4. Download each available artifact:
   ```
   curl -sSL -H "Authorization: Bearer $GH_PAT" \
     "https://api.github.com/repos/cabicci/ai-ecosystem-hub-72/actions/artifacts/<ARTIFACT_ID>/zip" \
     -o "<id>.zip"
   unzip "<id>.zip" -d "<id>/"
   ```
   Artifact contains `public/lessons/intro/<id>.mp4` + `remotion/src/lessons-generated/<id>.gen.ts`.
5. Copy both files into the project, then idempotently update `remotion/src/lessonsRegistry.ts` (same logic as `update_registry()` in `remotion/scripts/build-lesson.py`).

## What NOT to do
- Do NOT trust `git log` alone — successful job + missing commit means the commit/push step failed silently. The build artifact is still there.
- Do NOT trigger a fresh workflow run before confirming no artifact exists.
- Do NOT use the run-level `conclusion` field — check per-job conclusion.

## Diagnosis lesson learned (May 2026)
Run #7 had 5 jobs marked `success` in GitHub UI, but the `Commit & push` step had a race condition with `git pull --rebase` after `git add` (refused due to dirty index), then a false-success on `Everything up-to-date` after a rebase conflict in `lessonsRegistry.ts`. The workflow was fixed to `git reset --hard origin/<branch>` and re-apply artifacts in the retry loop. But the 5 built MP4s could have been recovered from artifacts on the first turn instead of re-running the whole workflow.