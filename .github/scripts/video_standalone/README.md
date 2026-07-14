# video_standalone

Standalone, isolated 300-cell localized video production package.

**Read-only reuse (never edited):**
- `remotion/scripts/build-lesson.py` (invoked as subprocess)
- `.github/scripts/video_finalize/bunny_client.py`
- `.github/scripts/video_finalize/git_result_branch.py`
- `.github/scripts/video_finalize/receipt.py`
- `.github/scripts/video_finalize/collector.py`
- `.github/scripts/video_finalize/constants.py`

**Modules:**
- `plan.py`                    — 300-cell plan; canary pinned to `analyst-m3-l2-ai-summarization__en`; matrix_a=149, matrix_b=150.
- `locale_gate.py`             — per-locale narration acceptance rules (en / ar-MSA / ar-Gulf / ar-EG-always-reject).
- `narration_orchestrator.py`  — 2-attempt Gemini gate BEFORE TTS/render/Bunny/git.
- `artifact.py`                — MP4 + captions VTT validation and sha256.
- `artifact_bundle.py`         — six-file durable bundle (video.mp4, audio.mp3, captions.vtt, status.json, validation.json, pipeline.log) with deterministic name `standalone-cell__<sha[:12]>__<locale>__<lesson_id>`.
- `bunny_ops.py`               — former-pilot collision-safe reconciliation. Fail-closed on multi-match, malformed, missing, null, empty, or meta-only originalHash. Zero exact-hash matches with valid nonmatching hashes → one new distinct video; older videos preserved (never deleted).
- `run_cell.py`                — end-to-end per-cell runner.
- `collect.py`                 — always-run collector; delegates to `video_finalize.collector`.

**Isolated per-cell result branch:** `video-results/video-full-300-localized-v1/{logicalKey}`.

**Recovery tiers (per cell, on retry):**
1. Matching on-disk receipt (identity tuple match) → skipped-success (no Gemini, no TTS, no render, no Bunny, no git).
2. Valid durable six-file bundle at `--bundle-in-dir` → restore into pipeline paths and skip Gemini/TTS/render.
3. Bunny list-by-title + single exact-hash match → GUID reused (no re-upload).
4. Otherwise → gate narration (≤2 Gemini attempts) → full generate → six-file validate → upload → verify → receipt commit+push.

The always-run collector aggregates per-cell receipts across the fetched result branches;
GitHub-native "Re-run failed jobs" is honoured because each cell's success is durably
persisted on its own branch and never overwritten by sibling cells.
