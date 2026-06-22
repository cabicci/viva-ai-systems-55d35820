# Locale Runtime Foundation (Phase 1)

**Status:** Foundation only — **no production behavior change**  
**Effective:** 2026-06-22

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- Feature flags remain **off** for localized lessons, videos, and RAG

## What did **not** ship

- No import of `locale-fragment-final-bundle-v3.zip`
- No mass write of ar-Gulf/en JSON into runtime folders (still sample-only)
- No locale selector UI, cookies, or geo/IP detection
- No changes to live lesson routes, Bunny/Remotion video mapping, Supabase, or Egyptian lesson content

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT`. The access layer is internal scaffolding for a later wired phase.
