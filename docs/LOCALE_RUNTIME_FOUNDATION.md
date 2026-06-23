# Locale Runtime Foundation

**Status:** Phases 1–4 + 6.5 internal preview parity — **no production behavior change**  
**Effective:** 2026-06-22

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- **Phase 2:** Full ar-Gulf/en JSON packages imported to `src/lib/locale-lessons/` from sanitized final-v3 staging (100+100)
- **Phase 3:** Internal/test-only wiring for ar-MSA canonical JSON + imported ar-Gulf/en via `resolveLessonAccess(lessonId, locale, { internalTestOverride: true })`
- **Phase 4:** Explicit query-only locale preview on lesson routes: `?locale={ar-MSA|ar-Gulf|en}&previewLocale=1` — default routes unchanged (ar-EG)
- **Phase 6.5:** Deterministic package → preview bridge (`adaptLocalizedPackageToPreviewContent`) with live-like section cards, tables, glossary/comparison blocks, read-only quiz/mission, and markdown parsing — **preview only**
- Feature flags remain **off** for localized lessons, videos, and RAG

## What did **not** ship

- No public locale selector UI (`localeUiEnabled` stays off)
- No cookie/IP/user-setting resolver, or global flag-on behavior
- No changes to Bunny/Remotion video mapping, Supabase, or Egyptian lesson content
- No mission submit, assistant/RAG locale switching, or progress mutation in preview mode
- Public selector remains **blocked** until assistant/RAG/progress/video policy is resolved

**Next:** See [Phase 8 — Public Localization Activation Architecture](./localization/PUBLIC_LOCALIZATION_ACTIVATION_ARCHITECTURE.md) for the approved activation plan (manual selector, URL/cookie, geo, live rendering, interim assistant/video/progress policies, and Phases 9–13).

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT` unless an internal tester opens an explicit preview URL (`previewLocale=1` + supported `locale`). ar-MSA remains the canonical text source.
