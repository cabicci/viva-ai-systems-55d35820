# video_standalone

Standalone, isolated 300-cell localized video production package.

**Read-only reuse (never edited):**
- `remotion/scripts/build-lesson.py` (invoked as subprocess)
- `.github/scripts/video_finalize/bunny_client.py`
- `.github/scripts/video_finalize/git_result_branch.py`
- `.github/scripts/video_finalize/receipt.py`
- `.github/scripts/video_finalize/collector.py`
- `.github/scripts/video_finalize/constants.py`

**Not used, not imported:**
- `.github/workflows/video-production-batch.yml`
- `.github/workflows/video-production-final-v2.yml`
- `.github/scripts/video_v2/**` (does not exist in this branch — irrelevant)
- Cursor-owned files
- runtime mappings (`src/lib/bunny-videos.ts`, `remotion/src/lessonsRegistry.ts`)
- ar-EG assets (locale is forbidden; folder must contain zero JSON packages)

**Modules:**
- `plan.py`         — discover + validate 300 cells; canary=1, matrix_a=149, matrix_b=150.
- `artifact.py`     — validate MP4 + captions VTT, compute sha256.
- `bunny_ops.py`    — finalize one cell on Bunny (create+upload OR reuse-by-originalHash).
- `run_cell.py`     — end-to-end per-cell runner (build → validate → Bunny → receipt → commit+push).
- `collect.py`      — always-run collector; delegates to video_finalize.collector.

**Isolated per-cell result branch:**
`video-results/video-full-300-localized-v1/{logicalKey}` — one branch per cell,
one receipt per branch. Never pushes to `main`.

**Recovery tiers (per cell, on retry):**
1. Local receipt file with matching identity tuple → skipped-success (no build, no Bunny call, no commit).
2. Bunny list-by-title + exact top-level `originalHash` match → GUID reused, receipt written, commit-only recovery.
3. Otherwise → full generate + upload path.

The always-run collector aggregates per-cell receipts across the fetched result branches;
GitHub-native "Re-run failed jobs" is honoured because each cell's success is durably
persisted on its own branch and never overwritten by sibling cells.
