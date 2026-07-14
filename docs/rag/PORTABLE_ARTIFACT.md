# RAG Portable Vector Artifact

## Schema (`rag-portable-artifact-v1`)

Portable export directory:

| File | Purpose |
|------|---------|
| `artifact-manifest.json` | Authoritative manifest with counts, checksums, isolation results |
| `package-manifest.json` | 300-package manifest |
| `chunk-manifest.json` | 2,692-chunk manifest |
| `vectors-shard-NNN.ndjson.gz` | Gzip-compressed NDJSON vector records (deterministic `chunkId` order) |

### Vector record fields

`chunkId`, `lessonId`, `locale`, `trackId`, `moduleId`, `packagePath`, `sourceSha`, `packageChecksum`, `chunkChecksum`, `contentVersion`, section metadata, `productionRoute`, `model`, `vectorDimensions`, `embedding`.

### Checksums

- Per-file SHA-256 recorded in `artifact-manifest.json.files`
- `payloadChecksum` = stable hash over non-manifest file checksums
- Verification rejects incomplete, mismatched, or duplicate payloads

## Mock export (no paid calls)

```bash
bun run rag:export-portable-mock
bun run rag:import-portable-batch artifacts/rag/portable-mock
```

## Future paid regeneration (USD 1 ceiling)

1. Dispatch `RAG Paid Portable Embedding (Branch Only)` on `work/rag-portable-batch-import`
2. Confirm `APPROVE_PAID_RAG_PORTABLE_EMBEDDING`
3. Preflight validates 300 packages / 2,692 chunks / checksums before any API call
4. Paid run exports `artifacts/rag/portable-export/` with complete vectors
5. Import via `ProductionCompatibleImporter` against authorized non-Production target only

Existing ar-EG production corpus (100 lessons) remains unchanged — localized batches use `locale_lesson` rows with isolated `index_version`.
