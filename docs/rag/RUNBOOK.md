# RAG & AI Assistant — Runbook

## Prerequisites

- Isolated worktree: `E:\Projects\viva-rag-ai-assistant`
- Branch: `work/rag-ai-assistant-complete`
- Content Freeze SHA: `3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2`
- Bun runtime

## Local Verification (no paid calls)

### 1. Verify corpus

```bash
bun run scripts/rag/verify-corpus.ts
```

Expected: `ok: true`, 300 packages, 40 AG4 records.

### 2. Generate manifests

```bash
bun run scripts/rag/generate-manifests.ts
```

Writes to `artifacts/rag/`:
- `package-manifest.json`
- `chunk-manifest.json`
- `chunks.json`

Dry-run (no file writes):

```bash
bun run scripts/rag/generate-manifests.ts --dry-run
```

### 3. Run tests

```bash
bun run test:run -- src/lib/__tests__/rag-
```

## Incremental Reindex Workflow

1. Copy current manifests to `*.previous.json` in `artifacts/rag/`
2. Regenerate manifests after corpus changes
3. Review reindex plan output (skip/reindex/delete/retry counts)
4. For retry-only-failed: pass failed package paths to pipeline

## Paid Embedding Execution (NOT in this phase)

Requires separate approval. Steps when approved:

1. Review chunk manifest `chunkCount` and estimated batches
2. Configure `OPENAI_API_KEY` in server environment
3. Execute via admin seed or dedicated indexer
4. Verify `knowledge_chunks` row count matches chunk manifest
5. Run retrieval smoke test on `assistant-runtime`

## Rollback

1. Restore `package-manifest.previous.json` and `chunk-manifest.previous.json`
2. Re-run generate with previous corpus state
3. Delete orphan chunks identified by `planSupersededChunkCleanup`

## Forbidden in Local Phase

- `git push`, `git fetch`, `git pull`
- OpenAI or third-party embedding/chat API calls
- Supabase migration execution
- Production database writes
- Curriculum package edits
