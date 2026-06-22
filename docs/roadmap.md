# Locale Fragment Pilot — Accepted Artifact Log

## Accepted: 2026-06-22

| Field | Value |
|-------|-------|
| Artifact name | `locale-fragment-pilot-combined-clean.zip` |
| ar-Gulf lessons | 10 |
| en lessons | 10 |
| Missing artifacts | 0 |
| Duplicate artifacts | 0 |
| Banned hits | 0 |
| Status | ✅ Accepted as pilot artifact only |
| Imported into runtime | No |
| Used in production | No |
| Next phase started | No |

## Notes

- Clean bundle assembled from existing GitHub Actions artifacts only (runs `27921287280` and `27922072659`).
- No regeneration, no OpenAI calls, no workflow triggers, no publish, no runtime import.
- Final JSON files were read back from disk and validated after writing.
- This entry is documentation-only; the artifact remains a pilot deliverable and is not wired into the live learner experience.

---

# Full Localization Bundle — Accepted Artifact Log

## Accepted: 2026-06-22

| Field | Value |
|-------|-------|
| Artifact scope | Full localization bundle |
| ar-Gulf lessons | 100 |
| en lessons | 100 |
| Total lessons | 200 |
| Missing artifacts | 0 |
| Fallback/source packages used | 0 |
| Locale mismatches | 0 |
| Banned hits | 0 |
| Markdown imbalance | 0 |
| Empty learner-facing fields | 0 |
| Generic titles | 0 |
| Quiz integrity | OK |
| Leaks (Bunny / OpenAI / Remotion / video IDs) | 0 |
| Lessons with issues | 0 |
| Status | ✅ Accepted as artifact only |
| Imported into runtime | No |
| Used in production | No |
| Publish | No |
| Runtime / UI / Supabase / Bunny / Remotion / RAG / assistant / mission / video changes | No |

## Source runs

- `27923489720`
- `27925209666`
- `27925212668`
- `27925425741`

## Collection method

- Built from 200 successful per-lesson GitHub Actions artifacts directly.
- Newest successful artifact wins on duplicate locale + lesson pairs.
- Failed artifacts were ignored.
- No fallback or source packages were used.

## Notes

- Final JSON was written to disk, re-read, and validated.
- Markdown imbalance was fixed deterministically without OpenAI / generation.
- No OpenAI calls, generation, workflow dispatch, rerun, publish, runtime import, UI changes, or dev-server use during final clean bundle acceptance.
- This entry is documentation-only; the artifact is not imported into the runtime or used in production.
