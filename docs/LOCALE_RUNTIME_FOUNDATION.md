# Locale Runtime Foundation

**Status:** Phases 1–3 internal wiring — **no production behavior change**  
**Effective:** 2026-06-22

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- **Phase 2:** Full ar-Gulf/en JSON packages imported to `src/lib/locale-lessons/` from sanitized final-v3 staging (100+100)
- **Phase 3:** Internal/test-only wiring for ar-MSA canonical JSON + imported ar-Gulf/en via `resolveLessonAccess(lessonId, locale, { internalTestOverride: true })`
- **Phase 4:** Explicit query-only locale preview on lesson routes: `?locale={ar-MSA|ar-Gulf|en}&previewLocale=1` — default routes unchanged (ar-EG)
- Feature flags remain **off** for localized lessons, videos, and RAG

## What did **not** ship

- No locale selector UI, cookie/IP/user-setting resolver, or global flag-on behavior
- No changes to Bunny/Remotion video mapping, Supabase, or Egyptian lesson content
- No mission, assistant, RAG, or progress behavior changes in preview mode

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT` unless an internal tester opens an explicit preview URL (`previewLocale=1` + supported `locale`). ar-MSA remains the canonical text source.
