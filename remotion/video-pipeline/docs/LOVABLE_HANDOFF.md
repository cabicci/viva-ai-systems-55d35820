# Agent 3 — Video Production Pipeline: Lovable Handoff

Copy-ready instructions for Lovable to create and trigger the GitHub Actions video production workflows.

---

## Prerequisites

- Repository: `cabicci/viva-ai-systems-55d35820`
- Feature branch: `feat/video-production-pipeline` (contains pipeline + workflow contract)
- Baseline SHA: `3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2`
- Results branch: `video-results` (isolated; never merge to `main` without explicit approval)
- GitHub secrets required for **paid bulk execution only**:
  - `GEMINI_API_KEY` (+ optional `GEMINI_API_KEY_1` … `_3` for rotation)
  - Do **not** configure Bunny/Production secrets for this pipeline phase

---

## Step 1 — Merge workflow contract to a trigger branch

Ensure `.github/workflows/video-production-batch.yml` from `feat/video-production-pipeline` is present on the branch Lovable will dispatch from (typically `feat/video-production-pipeline` or a dedicated `video-production` branch). **Do not merge to `main`.**

---

## Step 2 — Create the `video-results` branch (one-time)

```bash
git checkout feat/video-production-pipeline
git checkout -B video-results
git push -u origin video-results
```

All per-video commits land here only.

---

## Step 3 — Build the 300-video manifest (local or CI)

```bash
bun remotion/video-pipeline/scripts/build-manifest.mjs
```

Expected output:

- `remotion/video-pipeline/manifest/video-manifest.json`
- `totalVideos: 300`
- `localeTotals: { "ar-MSA": 100, "ar-Gulf": 100, "en": 100 }`

Commit manifest + status registry to the feature branch before first dispatch.

---

## Step 4 — Trigger mock validation run (recommended first)

In GitHub → Actions → **Video Production Batch** → Run workflow:

| Input | Value |
|-------|-------|
| `locale` | `all` |
| `lesson_ids` | `manifest` |
| `retry_failed_only` | `false` |
| `mock_mode` | **`true`** |
| `baseline_sha` | `3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2` |

This runs 300 independent matrix jobs with mock TTS/render — no paid API calls.

---

## Step 5 — Trigger paid bulk execution (when approved)

Same workflow, set:

| Input | Value |
|-------|-------|
| `mock_mode` | **`false`** |
| All other inputs | unchanged |

Each matrix job:

1. Extracts locale-specific script from `src/lib/locale-lessons/{locale}/lessons/{lessonId}.json`
2. Applies locale voice profile (`config/voice-profiles.json`)
3. Produces logs + validation + video artifacts
4. Enqueues to serialized commit queue → one commit per video on `video-results`

---

## Step 6 — Retry only failed videos

After a partial run:

| Input | Value |
|-------|-------|
| `retry_failed_only` | **`true`** |
| `lesson_ids` | `manifest` (or comma-separated subset) |
| `mock_mode` | as needed |

Successful videos are skipped; only `failed` registry entries rerun.

---

## Step 7 — Partial locale or lesson dispatch

| Scenario | `locale` | `lesson_ids` |
|----------|----------|--------------|
| Single locale smoke | `ar-MSA` | `intro-m1-l1-what-is-ai,intro-m1-l2-first-prompt` |
| Full locale batch | `en` | `manifest` |
| Explicit IDs | `all` | comma-separated list |

---

## Architecture guarantees

- **300 videos** = 100 ar-MSA + 100 ar-Gulf + 100 en (Scientific Review corrections already in frozen packages; no extra videos)
- **One matrix job per (locale, lessonId)** with `fail-fast: false`
- **Per-job artifacts**: logs, validation.json, status.json, video.mp4, captions.vtt, audio.mp3
- **Serialized commit queue**: one commit per completed video; no overwrite of prior successes
- **No cross-locale reuse**: scripts, voices, captions are locale-scoped
- **No main merge, no Production publish, no Bunny upload** in this phase

---

## Local validation commands (developer)

```bash
cd E:\Masaarat\Worktrees\viva-video-production
bun remotion/video-pipeline/scripts/validate-local.mjs
bun test remotion/video-pipeline/__tests__/pipeline.test.ts
```

---

## Escalation

Stop and request approval before:

- Merging `video-results` → `main`
- Setting `mock_mode: false` for full 300-video paid run
- Modifying shared CI outside `video-production-batch.yml`
- Any Production/Bunny/Supabase integration
