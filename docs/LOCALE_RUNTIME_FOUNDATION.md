# Locale Runtime Foundation

**Status:** Phases 1–3 internal wiring — **no production behavior change**  
**Effective:** 2026-06-22

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- **Phase 2:** Full ar-Gulf/en JSON packages imported to `src/lib/locale-lessons/` from sanitized final-v3 staging (100+100)
- **Phase 3:** Internal/test-only wiring for ar-MSA canonical JSON + imported ar-Gulf/en via `resolveLessonAccess(lessonId, locale, { internalTestOverride: true })`
- Feature flags remain **off** for localized lessons, videos, and RAG

## What did **not** ship

- No locale selector UI, URL/cookie/IP/user-setting resolver, or live route changes
- No changes to live lesson routes, Bunny/Remotion video mapping, Supabase, or Egyptian lesson content

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT`. ar-MSA remains the canonical text source; ar-Gulf/en JSON is available internally for tests only until a later flag-on phase.
