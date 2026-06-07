# Assistant Reality Audit

## Current audit stage

Inventory completed. No code changes made.

**Inventory summary (read-only, code inspection):**

- **UI entry:** `/ai-assistant` via sidebar only — not embedded in lesson pages.
- **Runtime:** `assistant-runtime` edge function → Lovable AI Gateway (`gemini-3-flash-preview`); JWT required.
- **Retrieval:** Hybrid keyword (client `searchPlatformContent`) + semantic (`knowledge_chunks` via OpenAI embeddings); semantic degrades silently if embedding key missing.
- **Mission AI:** Separate server path (`evaluateMissionWithAI`, `revealModelMissionAnswer`) — not the lesson assistant.
- **Gaps flagged:** Prompt framed as “Builder”; off-lesson scope defaults to `builder`; `knowledge_chunks` freshness unknown; no deployed ingest edge function; assistant rate-limit fails open on RPC errors; CORS allowlist may exclude production domain.

## Key finding

The next required step is a live behavioral audit of the assistant, still read-only.

Code inspection alone cannot confirm corpus state, retrieval quality, answer trust, or mobile UX under real login.

## Recommended next audit step

Live Assistant Reality Audit (behavioral, read-only):

1. Confirm `knowledge_chunks` row count in Supabase.
2. As a logged-in beginner, test from:
   - Intro L1
   - One Creator lesson
   - `/ai-assistant` off-lesson on mobile
3. Record for each:
   - auth gate
   - retrieval counts: `semanticCount` / `keywordCount`
   - answer quality
   - off-scope behavior
   - rate-limit message
   - error recovery
4. Map findings to blueprint severity:
   - Critical
   - High
   - Medium
   - Low
   - Ignore
5. Do not change code until findings are classified.

## Rules

- Read-only
- No fixes during audit
- No prompt edits
- No assistant behavior changes
- No database writes except normal test-user usage
- Document observed behavior only
