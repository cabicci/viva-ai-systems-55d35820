# Locale Runtime Foundation

**Status:** Phases 1–4 + 6.5 preview parity + **Phase 9 live manual locale routing**  
**Effective:** 2026-06-23

## What shipped

- Supported locale registry: `ar-EG`, `ar-MSA`, `ar-Gulf`, `en`
- Locale types, display metadata, and safe resolver (`resolveLocale` → default `ar-EG`)
- Internal lesson access helpers (`resolveLessonAccess`) with `ar-EG` fallback
- **Phase 2:** Full ar-Gulf/en JSON packages imported to `src/lib/locale-lessons/` from sanitized final-v3 staging (100+100)
- **Phase 3:** Internal/test-only wiring for ar-MSA canonical JSON + imported ar-Gulf/en via `resolveLessonAccess(lessonId, locale, { internalTestOverride: true })`
- **Phase 4:** Query-only locale preview on lesson routes: `?locale={ar-MSA|ar-Gulf|en}&previewLocale=1` — backward compatible
- **Phase 6.5:** Deterministic package → preview bridge (`adaptLocalizedPackageToPreviewContent`) with live-like section cards, tables, glossary/comparison blocks, read-only quiz/mission, and markdown parsing
- **Phase 9:** Live manual locale via `?locale=` + `masaarat_locale` cookie + `LanguageSelector` (labels: مصري / فصحى / خليجي / English). Package locales load **without** `previewLocale=1`. Non–ar-EG: video placeholder, assistant disabled banner, no mission/progress writes. Rollback: `VITE_LOCALIZED_LESSONS_ENABLED=false`.
- Feature flags: `localizedLessonsEnabled` and `localeUiEnabled` default **on** (Phase 9); videos and RAG remain off

## What did **not** ship

- No IP/location geo detection (Phase 10)
- No changes to Bunny/Remotion video mapping, Supabase schema, or Egyptian lesson content
- No localized RAG/assistant retrieval for ar-MSA/ar-Gulf/en
- No mission submit or progress writes on localized package pages

**Next:** See [Phase 8 — Public Localization Activation Architecture](./localization/PUBLIC_LOCALIZATION_ACTIVATION_ARCHITECTURE.md) for the approved activation plan (manual selector, URL/cookie, geo, live rendering, interim assistant/video/progress policies, and Phases 9–13).

## Live production

Learners still receive **ar-EG** Egyptian TypeScript lessons via `INTRO_LESSON_CONTENT` unless an internal tester opens an explicit preview URL (`previewLocale=1` + supported `locale`). ar-MSA remains the canonical text source.
