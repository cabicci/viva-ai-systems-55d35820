# Video Production Pipeline Runbook (Agent 3)

## Scope

Deterministic 300-video pipeline (100 ar-MSA + 100 ar-Gulf + 100 en) from frozen locale lesson packages at baseline SHA `3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2`.

## Directory layout

```
remotion/video-pipeline/
├── config/voice-profiles.json   # Per-locale TTS voice mapping
├── manifest/video-manifest.json # 300-cell deterministic manifest
├── lib/                         # Core pipeline modules
├── scripts/                     # CLI entrypoints
├── status/registry.json         # Per-cell output status
├── output/                      # Local/mock artifacts (gitignored)
├── queue/                       # Serialized commit queue state
├── results/                     # Committed video outputs (video-results branch)
└── docs/                        # Handoff + runbook
```

## Commands

| Command | Purpose |
|---------|---------|
| `bun remotion/video-pipeline/scripts/build-manifest.mjs` | Build 300-video manifest |
| `bun remotion/video-pipeline/scripts/extract-scripts.mjs` | Extract + validate scripts |
| `bun remotion/video-pipeline/scripts/build-voice-map.mjs` | Verify voice mapping |
| `bun remotion/video-pipeline/scripts/run-mock-batch.mjs --sample` | Mock produce sample cells |
| `bun remotion/video-pipeline/scripts/run-mock-batch.mjs --retry-failed-only` | Retry failed only |
| `bun remotion/video-pipeline/scripts/process-commit-queue.mjs` | Process commit queue |
| `bun remotion/video-pipeline/scripts/validate-local.mjs` | Full local validation harness |

## Safety checks

- Wrong locale voice → blocked by `preventWrongLocaleVoice`
- Wrong lesson script → `validateScript` + package locale guard
- Duplicate outputs → checksum dedup in `preventDuplicateOutput`
- Missing audio/captions → `validateMediaArtifacts`
- Zero-duration/corrupt → size + WEBVTT checks
- Overwritten videos → `preventOverwrittenVideo`
- Failed outputs committed → `preventCommittingFailed`

## Branches

- Implementation: `feat/video-production-pipeline`
- Committed videos: `video-results` only
- Never push/merge to `main` without explicit approval
