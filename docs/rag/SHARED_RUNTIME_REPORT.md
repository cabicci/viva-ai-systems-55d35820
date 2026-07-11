# RAG Shared-Runtime Integration Report

**Phase:** Branch-only shared-runtime integration  
**Date:** 2026-07-11

## Schema

- Migration: `20260711200000_rag_locale_index_versioning.sql`
- New table: `rag_index_versions`
- Extended: `knowledge_chunks` (locale, checksums, index versioning)
- New RPCs: `match_locale_knowledge_chunks`, `activate_rag_index_version`, `rollback_rag_index_version`

## Assistant Runtime

- Locale-filtered retrieval via `match_locale_knowledge_chunks`
- Citation metadata in response (`citations[]` + `retrieval` meta)
- No cross-locale fallback; no lesson-scope widening
- Legacy `match_knowledge_chunks` retained when locale absent

## Scripts Added

| Script | Command |
|--------|---------|
| `rag:verify-corpus` | `bun run scripts/rag/verify-corpus.ts` |
| `rag:generate-manifests` | `bun run scripts/rag/generate-manifests.ts` |
| `rag:generate-chunks` | alias of generate-manifests |
| `rag:mock-index` | `bun run scripts/rag/mock-index.ts` |
| `rag:reindex-plan` | `bun run scripts/rag/reindex-plan.ts` |
| `rag:embedding-dry-run` | `bun run scripts/rag/embedding-dry-run.ts` |
| `rag:validate-local` | `bun run test:run -- src/lib/__tests__/rag-` |

## Validation

- Tests: 46/46 PASS
- Chunk totals: 2692 (en 964, ar-MSA 866, ar-Gulf 862) — unchanged
- Mock staging/activation/rollback: PASS
- `bunx vite build`: PASS
- `bun run build`: blocked by roadmap:guard (package.json script change only)

## Embedding Dry-Run (not executed)

- Model: `text-embedding-3-small`
- Chunks: 2692
- Tokens: 518,160 (ceil(char/3.5))
- Requests: 43 @ batch 64
- Base cost: ~$0.0104 USD
- Max retry-adjusted: ~$0.0119 USD

## Recommendation

**READY FOR PAID EMBEDDING APPROVAL**
