# Incremental per-video Bunny finalization contract

## Official Bunny documentation evidence

- Create Video: https://docs.bunny.net/api-reference/stream/manage-videos/create-video
- Upload Video: https://docs.bunny.net/api-reference/stream/manage-videos/upload-video
- Get Video: https://docs.bunny.net/api-reference/stream/manage-videos/get-video
- List Videos: https://docs.bunny.net/api-reference/stream/manage-videos/list-videos
- HTTP overview: https://docs.bunny.net/stream/http-api

Auth: `AccessKey` header (Stream library key).

## Repository Bunny evidence

- `.github/scripts/upload_bunny_locale.py` — POST create + PUT MP4, composite key title `{lessonId} [{locale}]`
- `.github/scripts/verify_bunny_ready.py` — GET by GUID, status codes 0–8
- Captions: GitHub artifact only (Bunny caption-track upload deferred)

## Result branch ownership

```
video-results--video-full-300-localized-v1--<logical-key>
```

One cell → one flat branch name. Never push to `main`. Non-force only.

## Receipt path

```
remotion/video-pipeline/results/video-full-300-localized-v1/<logical-key>/finalization-receipt.json
```

## Receipt schema (`schemaVersion: video-finalization-receipt-v1`)

Required fields only:

`schemaVersion`, `batchId`, `logicalKey`, `lessonId`, `locale`, `sourceSha`,
`workflowRunId`, `artifactId`, `artifactDigest`, `videoChecksum`,
`captionsChecksum`, `bunnyGuid`, `bunnyUploadStatus`, `validationStatus`,
`finalizedAt`

Identity tuple: `batchId + logicalKey + sourceSha + videoChecksum`

## Recovery

1. Matching receipt → skipped-success (no Gemini/TTS/render/Bunny/commit)
2. No receipt + List Videos search by title + top-level `originalHash` == videoChecksum (single match) → commit-only recovery of GUID
3. Multiple GUID matches → ambiguous, reconciliation report, fail closed
4. No match → create + upload MP4 once, bounded GET readiness (max 300s), then receipt commit/push
5. Never delete/replace Bunny videos for a matching finalized tuple

Post-upload readiness (new GUID only): GET-only polling of the same GUID with
deterministic capped backoff; missing/null/empty `originalHash` is pending;
valid mismatch/malformed/non-string hash fails immediately; receipt only after
exact top-level hash proof.
