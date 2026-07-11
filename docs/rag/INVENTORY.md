# RAG & AI Assistant — Inventory

**Agent:** Agent 2 — RAG & AI Assistant  
**Date:** 2026-07-11

## Classification Summary

| Action | Items |
|--------|-------|
| **Keep** | `assistant-runtime` edge fn, `platform-retrieval.ts`, `knowledge_chunks` schema/RPC, `assistant-seed.functions.ts`, assistant UI, locale-lessons packages, AG4 manifest |
| **Refactor** | Dual seed pipelines (Python + TS) → consolidate on locale-package indexer |
| **Replace** | `docs/ARCHITECTURE.md`, `docs/RUNBOOK.md` stale RAG references |
| **Archive** | Phase13b reports, persona-sim old versions, `ASSISTANT_REALITY_AUDIT.md` |
| **Delete** | Doc refs to non-existent `ingest-curriculum-knowledge`, `semantic-search`, `AssistantFab` |
| **Missing** | Conversation DB persistence, assistant token logging, locale-aware vector corpus |

## New Workstream Files (this phase)

| Path | Purpose |
|------|---------|
| `src/lib/rag/*` | Deterministic corpus verification, chunking, manifests |
| `scripts/rag/verify-corpus.ts` | CLI corpus verification |
| `scripts/rag/generate-manifests.ts` | CLI manifest generation |
| `src/lib/__tests__/rag-*.test.ts` | RAG test suite |
| `docs/rag/*` | Workstream documentation |

## Existing Runtime (unchanged)

| Path | Classification |
|------|----------------|
| `supabase/functions/assistant-runtime/index.ts` | Keep |
| `src/lib/platform-retrieval.ts` | Keep |
| `src/lib/assistant-seed.functions.ts` | Refactor (Egyptian-only seed) |
| `scripts/seed-knowledge/run.py` | Refactor (legacy regex seed) |
| `src/components/assistant/AssistantPanel.tsx` | Keep |
| `src/lib/assistant-session-store.ts` | Keep (Missing persistence) |

## Identified Source of Truth

**For multi-locale RAG indexing:** `src/lib/locale-lessons/{en,ar-MSA,ar-Gulf}/lessons/` (300 packages)

**For legacy Egyptian keyword search:** `curriculum-data.ts` + `intro/lessons/` (100 lessons)

## Content Defects

None blocking corpus verification. Any future content defects should be recorded for Localization or Scientific Review — not edited by this workstream.
