# Locale Runtime Foundation (Phase 1)

**Status:** Foundation only — **no production behavior change**  
**Effective:** 2026-06-22

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- **Phase 2:** Full ar-Gulf/en JSON packages imported to `src/lib/locale-lessons/` from sanitized final-v3 staging (100+100)
- Feature flags remain **off** for localized lessons, videos, and RAG

## What did **not** ship

- No import of raw zip content without sanitization
- No locale selector UI, cookies, or geo/IP detection
- No changes to live lesson routes, Bunny/Remotion video mapping, Supabase, or Egyptian lesson content

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT`. Full ar-Gulf/en JSON is on disk for a later gated wiring phase.
