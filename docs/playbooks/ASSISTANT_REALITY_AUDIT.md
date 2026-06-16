# Assistant Reality Audit

> **Historical note:** Point-in-time audit inventory; may not reflect current runtime. Current public brand is **مسارات / masaarat.ai**. Use `docs/CURRENT_STATUS.md` and `docs/playbooks/P0_LAUNCH_CONSTITUTION.md` for current launch source of truth.

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

## Confirmed knowledge_chunks status

- The `knowledge_chunks` table exists in production.
- Current production row count: **0**.
- `source_type` grouping is empty.

## Decision

**Do not seed `knowledge_chunks` now.**

Reason:
The assistant knowledge base must be generated from the final frozen curriculum, not from temporary lesson content that will still change during code review, content review, mission redesign, UI/UX review, theme review, and video regeneration.

## Correct timing for seeding

`knowledge_chunks` should be populated only after:

1. Code review is complete.
2. Content review is complete.
3. Missions are stabilized.
4. UI/UX and theme decisions are stable.
5. Videos are regenerated or ready for regeneration.
6. Content Freeze is confirmed.

## Current severity

**High planned gap.**

This is not an immediate fix task.

It becomes an implementation task after Content Freeze.

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
