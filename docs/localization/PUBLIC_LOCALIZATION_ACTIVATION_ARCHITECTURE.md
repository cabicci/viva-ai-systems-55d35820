# Phase 8 — Public Localization Activation Architecture

**Status:** Plan only — **not implemented**  
**Baseline commit:** `c79e857` (Phase 7.5 label sanitizer on `origin/main`)  
**Effective:** 2026-06-23  
**Governing docs:** `docs/LOCALE_RUNTIME_FOUNDATION.md` · `docs/playbooks/ADAPTIVE_RUNTIME_LOCALIZATION_ARCHITECTURE.md` · `HANDOFF.md`

**Scope:** Architecture for making all four lesson locales **publicly live** with manual selection and IP-based suggestion, **before** locale video generation.

**Does not authorize:** runtime wiring, feature-flag flip, Supabase migrations, RAG re-seed, Remotion/Bunny renders, assistant changes, mission submit changes, publish, or edits to Egyptian lesson files / package JSON.

---

## 1. Product goal

Learners should be able to **choose and persist** a locale (or accept a geo suggestion) and see **live localized lesson pages** for all 100 shipped lessons in:

| Locale | Content source today | Video today |
|--------|----------------------|-------------|
| **ar-EG** | `INTRO_LESSON_CONTENT` (Egyptian TS) | Bunny — 100/100 |
| **ar-MSA** | `src/lib/locale-lessons/ar-MSA/lessons/*.json` | None |
| **ar-Gulf** | `src/lib/locale-lessons/ar-Gulf/lessons/*.json` | None |
| **en** | `src/lib/locale-lessons/en/lessons/*.json` | None |

**Video generation is Phase 13** — it runs **after** localized pages are live and QA’d, so renders target the same URLs learners already use.

**Preview mode today (internal only):**

```text
/learn/{pathId}/{lessonId}?locale={ar-MSA|ar-Gulf|en}&previewLocale=1
```

**Live mode (future):** same path, **no** `previewLocale=1`, resolved locale from URL + cookie + (later) geo — gated by `localizedLessonsEnabled`.

---

## 2. Core invariants (unchanged)

1. **`lessonId` is global** — progress, curriculum routes, and video registry keys stay `intro-m1-l1-what-is-ai`, etc.
2. **Egyptian TS is frozen** — ar-EG never loads from JSON packages.
3. **Same renderer parity** — public localized lessons use the Phase 6.5 bridge (`adaptLocalizedPackageToPreviewContent` + `LocalePackagePreviewRenderer` or a renamed production wrapper with identical output).
4. **Manual choice beats automation** — URL and cookie/selector override geo suggestion.
5. **Fail safe to ar-EG** — invalid locale, missing package, or flag-off → Egyptian production content (never blank).
6. **No silent wrong-language assistant** — non–ar-EG pages must not query Egyptian RAG as if it were localized.

---

## 3. Locale availability

| Code | Learner label (UI) | Direction | Production content | Package status | Public live (after activation) |
|------|-------------------|-----------|--------------------|----------------|--------------------------------|
| `ar-EG` | العامية المصرية | RTL | Egyptian TS | Shipped | **Default** — unchanged |
| `ar-MSA` | العربية الفصحى | RTL | JSON packages | 100/100, hygiene PASS | Live when flag + resolver on |
| `ar-Gulf` | خليجي | RTL | JSON packages | 100/100, hygiene PASS | Live when flag + resolver on |
| `en` | English | LTR | JSON packages | 100/100, hygiene PASS | Live when flag + resolver on |

**Not in scope for Phase 8:** new locales, package rewrites, ar-EG copy edits, curriculum ID changes.

---

## 4. Locale resolution order

When `localizedLessonsEnabled` is **on**, resolve effective locale in **strict priority** (higher wins):

| Priority | Source | Mechanism | Notes |
|----------|--------|-----------|-------|
| **1** | **Explicit URL locale** | Valid `?locale={code}` on current route | Shareable; wins over everything except invalid code → ar-EG |
| **2** | **Manual selector** | `LanguageSelector` change → write cookie + update React context | Navbar + Sidebar (already wired behind `localeUiEnabled`) |
| **3** | **Persisted cookie** | `masaarat_locale` (recommended name) — httpOnly optional later | Survives sessions; read on SSR/first paint |
| **4** | **Authenticated preference** | Future `user_locale_preferences` (Phase 12+) | Only when logged in; syncs cookie on login |
| **5** | **Geo / IP suggestion** | Server reads deployment geo header → **suggestion only** until accepted or cookie set | Phase 10; never overrides 1–4 |
| **6** | **Default fallback** | **`ar-EG`** | Identical to today’s production |

### Resolution rules

- **`?locale=ar-EG`** → Egyptian TS (explicit default).
- **`?locale=en`** without live flag → today: ar-EG; after activation: English package.
- **Invalid / unknown code** → `ar-EG`.
- **Package missing for lesson** → `ar-EG` with `fallbackUsed: true` (log internally; no learner-facing error wall).
- **Geo suggestion** may pre-select selector highlight or one-time banner — **must not** write cookie without user action (except “Use suggested language” click).

### Central resolver (target shape)

Extend today’s stack — do **not** fork:

```text
resolvePublicLocale(input: {
  urlLocale?: string
  cookieLocale?: string
  userPreference?: string   // later
  geoCountry?: string       // Phase 10
}) → SupportedLocale

resolveLessonAccess(lessonId, effectiveLocale, { liveMode: true })
  → egyptian-ts | locale-package-json (same as preview, minus internalTestOverride)
```

Replace preview-only gate (`previewLocale=1` + `internalTestOverride`) with **`localizedLessonsEnabled`** (or `liveMode`) for public routes.

---

## 5. Manual language selector

### Where it appears

| Surface | Component | Status |
|---------|-----------|--------|
| **Navbar** (marketing / top bar) | `LanguageSelector` | Exists — hidden (`localeUiEnabled=false`) |
| **Dashboard Sidebar** | `LanguageSelector` | Exists — hidden |
| **Lesson page chrome** (optional Phase 9+) | Same component or compact variant | Recommended for in-lesson switching |

**Recommendation:** Enable selector in **Navbar + Sidebar** at Phase 9 launch; add compact lesson-header variant if analytics show learners don’t discover nav control.

### Available labels

Use `LOCALE_META[locale].displayName` (already defined):

- ar-EG → العامية المصرية  
- ar-MSA → العربية الفصحى  
- ar-Gulf → خليجي  
- en → English  

Show **internal codes** (`ar-MSA`) only in dev/debug — never in production UI.

### Persistence

| Store | Key | TTL | Written when |
|-------|-----|-----|--------------|
| Cookie | `masaarat_locale` | 1 year | Selector change or “Accept suggestion” |
| React context | `LocaleProvider` | Session | Hydrate from cookie + URL on load |
| URL | `?locale=` | Per navigation | Optional sync on selector change (recommended: **yes**, for shareable state) |

**Selector behavior:**

1. User picks locale → `setLocale` + write cookie + update URL (`?locale=`) on lesson/dashboard links.
2. Navigating curriculum/lesson links **preserve** locale query (TanStack Router `search` inheritance).
3. Choosing ar-EG clears package path → Egyptian renderer + existing videos/mission/assistant.

### Effect on lesson content

| Effective locale | Renderer | Mission submit | Assistant |
|------------------|----------|----------------|-----------|
| ar-EG | `IntroLessonRenderer` + TS blocks | Full (today) | Egyptian RAG |
| ar-MSA / ar-Gulf / en | Package adapter + live-like renderer | **Interim: read-only or ar-EG gate** (§9) | **Interim: disabled / banner** (§8) |

---

## 6. IP / location detection (Phase 10)

### Signal source (recommended)

| Deployment | Header | Notes |
|------------|--------|-------|
| **Cloudflare** | `CF-IPCountry` | ISO 3166-1 alpha-2 |
| **Vercel** | `x-vercel-ip-country` | If ever migrated |
| **Generic fallback** | None | Skip geo; use cookie/default |

Read country **on the server** (TanStack Start / middleware) and pass as `geoCountry` to client bootstrap — do not expose raw IP to client.

### Country → suggested locale

| Condition | Suggested locale | Rationale |
|-----------|------------------|-----------|
| **EG** | `ar-EG` | Egyptian production default |
| **Gulf GCC** (`AE`, `SA`, `QA`, `KW`, `BH`, `OM`) | `ar-Gulf` | Gulf copy variant |
| **Other Arabic-majority** (`MA`, `DZ`, `TN`, `LY`, `JO`, `LB`, `SY`, `IQ`, `PS`, `YE`, `SD`, `MR`, `SO`, `DJ`, `KM`) | `ar-MSA` | MSA fallback for Arabic outside Egypt/Gulf |
| **International / non-Arabic / unknown** | **`en`** | Product goal: English is the international locale; ar-EG remains one click away |
| **VPN / tor / missing header** | No suggestion | Fall through to cookie → ar-EG |

**Override rule:** If cookie or URL locale is set, **ignore** geo for resolution (geo may still inform a dismissible banner: “We suggested English — change anytime”).

**Privacy:** Store last suggestion as `geo_suggested_locale` in session or short-lived cookie — not PII. No auto-write to `masaarat_locale` without consent.

---

## 7. URL strategy

### Options compared

| Approach | Pros | Cons |
|----------|------|------|
| **`?locale=en` query** | Already partially wired; no routeTree explosion; easy share links; matches preview URLs minus `previewLocale` | Less “clean” SEO; must preserve query on internal links |
| **`/en/learn/...` path prefix** | SEO-friendly; clear locale in path | Large route migration; duplicate route tree; harder rollback |
| **Cookie-only** | Clean URLs | Not shareable; breaks “send this link” workflows; bad for support |

### **Recommendation: query param first, path prefix later**

**Phase 9–11 (live activation):**

```text
/learn/{pathId}/{lessonId}?locale=en
/dashboard?locale=ar-Gulf
/curriculum?locale=ar-MSA
```

- Drop **`previewLocale=1`** for public live mode.
- Keep **`previewLocale=1`** as internal/staging escape hatch until Phase 11 sign-off, then deprecate in docs.

**Migration path:**

1. **Phase 9:** `localizedLessonsEnabled` + `?locale=` + cookie; `resolveRouteLessonAccess` treats valid package locale as live (no preview flag).
2. **Phase 10:** Add geo banner; URL/cookie unchanged.
3. **Phase 11:** QA all 400 public URLs (100 lessons × 4 locales).
4. **Future (optional Phase 14+):** 301 from `?locale=en` to `/en/learn/...` if SEO requires — only after stable metrics.

**Default URL (no query):** resolves via cookie → geo suggestion → **ar-EG**.

---

## 8. Lesson rendering (live mode)

### Pipeline (already built — activate, don’t rewrite)

```text
resolveLessonAccess → locale-package-json
loadLocalePackageLesson(locale, lessonId)
adaptLocalizedPackageToPreviewContent(pkg)
LocalePackagePreviewRenderer (or LocalePackageLiveRenderer alias)
```

### Differences: preview vs live

| Aspect | Preview (today) | Live (Phase 9+) |
|--------|-----------------|-----------------|
| Gate | `previewLocale=1` + `internalTestOverride` | `localizedLessonsEnabled` |
| Banner | “Internal preview” (if shown) | None — normal lesson chrome |
| Mission | Read-only preview block | Interim policy §9 |
| Quiz | Read-only | Read-only until locale mission policy defined |
| Video block | Omitted / note | Controlled placeholder §7 |
| Progress writes | Disabled / no-op recommended | Policy §9 |
| Label hygiene | Phase 7.5 sanitizer | Same adapter — no regressions |

### ar-EG compatibility

- No `locale` query or `locale=ar-EG` → **`IntroLessonRenderer`** unchanged.
- Existing Bunny video blocks, mission submit, assistant — unchanged.

---

## 9. Video policy (pre–Phase 13)

| Locale | Behavior |
|--------|----------|
| **ar-EG** | Existing Bunny URLs / Remotion registry — no change |
| **ar-MSA / ar-Gulf / en** | **No video asset** — show controlled placeholder card: “Video for this language is coming soon” + optional static diagram from package; **do not** fall back to Egyptian video silently (wrong dialect/audio) |

**Phase 13:** Generate from **live localized page URLs** (same `lessonId` + locale query) so QA and render inputs match production.

**Flag:** Keep `localizedVideosEnabled=false` until Bunny mappings exist per `(lessonId, locale)`.

---

## 10. Assistant / RAG policy

### Problem

RAG today: **~198 chunks** from **Egyptian** learner lessons. Serving Egyptian retrieval on an English page is a **trust bug**.

### Interim policy (Phase 9–11) — **Option B recommended**

| Effective locale | Assistant panel |
|------------------|-----------------|
| **ar-EG** | Full assistant (current behavior) |
| **ar-MSA / ar-Gulf / en** | **Visible but disabled** with localized banner: “Assistant for this language is coming soon” / Arabic equivalent |

**Why not silent disable (Option A):** Learners may think the product is broken; banner sets expectation.

**Hard rules:**

- Do **not** call `platform-retrieval` / assistant runtime with Egyptian chunks when `effectiveLocale !== 'ar-EG'`.
- Do **not** pass English lesson text to Egyptian-tuned prompts without locale-specific system instructions.

### Phase 12 (later)

- Separate chunk namespaces: `(lesson_id, locale)` in `knowledge_chunks` or filtered metadata.
- Re-seed from localized packages / canonical — **separate approved migration + seed job**.
- Enable `localizedRagEnabled` per locale behind flag.

---

## 11. Progress / mission policy

### Current schema

`lesson_progress` keys: **`user_id` + `lesson_id`** — **no locale column**.

### Recommendation: **shared progress by `lessonId`** (Phase 9–11)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Progress key | `lessonId` only | “Completed intro-m1-l1” means finished the lesson conceptually in any language |
| Unlock / gating | Same graph for all locales | Avoid forcing re-completion in another dialect |
| Mission submit (localized) | **Disabled** until locale-aware rubric + AI eval | Prevents Egyptian rubric scoring Gulf/EN text |
| Mission submit (ar-EG) | Unchanged | Production path |
| Preview mode | Never write progress | Keep `internalTestOverride` paths no-op for mutations |

### Corruption guardrails

1. Localized live pages: **do not** call mission submit or progress upsert until Phase 12+ charter.
2. Quiz on localized pages: **display-only** (already true in preview bridge).
3. If later locale-specific progress is required, add optional `locale` column with default `'ar-EG'` — **not Phase 9**.

---

## 12. Feature flags (rollout gates)

| Flag | Phase 9 default | Purpose |
|------|-----------------|---------|
| `localizedLessonsEnabled` | `false` → flip after QA | Package JSON on live routes |
| `localeUiEnabled` | `false` → flip with lessons | Show `LanguageSelector` |
| `localizedVideosEnabled` | `false` | Stay off until Phase 13 |
| `localizedRagEnabled` | `false` | Stay off until Phase 12 |
| `localeRuntimeEnabled` | `false` | Master kill switch if needed |

**Staging:** Enable flags on preview/staging with `?locale=` before production flip.

---

## 13. Implementation phases (after this plan)

### Phase 9 — Manual selector + URL/cookie wiring

**Goal:** Public live localized **lesson reading** for ar-MSA/ar-Gulf/en without geo.

**Deliverables:**

1. `resolvePublicLocale()` — URL → cookie → ar-EG.
2. Wire `localizedLessonsEnabled` + `localeUiEnabled` (env or controlled deploy flag).
3. Update `resolveRouteLessonAccess` — valid `?locale=` loads packages **without** `previewLocale=1`.
4. Cookie read/write (`masaarat_locale`); selector updates URL on navigation.
5. Preserve locale in Link/search across curriculum, dashboard, lesson next/prev.
6. Live renderer path (rename optional); keep Phase 7.5 adapter.
7. Video placeholder for non–ar-EG; assistant banner/disabled; mission/progress no-op on localized pages.
8. Tests: resolver unit tests, route tests, regression 300/300 hygiene, ar-EG default unchanged.

**Exit criteria:** Owner can share `?locale=en` links; selector persists; ar-EG unchanged; no RAG leak.

---

### Phase 10 — IP auto-detect

**Goal:** Suggest locale from country header; never override manual choice.

**Deliverables:**

1. Server middleware reads `CF-IPCountry` (or equivalent).
2. `suggestLocaleFromCountry(country)` per §6.
3. One-time dismissible banner + selector pre-highlight.
4. Tests with mocked country headers.

**Exit criteria:** EG → suggest ar-EG; AE → suggest ar-Gulf; DE → suggest en; cookie overrides.

---

### Phase 11 — Live localized QA

**Goal:** Sign-off before assistant/video investment.

**Matrix:** 100 lessons × 4 locales = **400** public URLs (not 300 — includes ar-EG baseline spot checks).

**Checks:** resolution order, selector persistence, placeholder video, assistant disabled, no progress corruption, RTL/LTR, strict label hygiene, build/tests green.

---

### Phase 12 — Locale-aware RAG / assistant

**Goal:** Enable assistant per locale with correct chunks.

**Deliverables:** Schema/seed design, locale-filtered retrieval, prompt locale, flip `localizedRagEnabled`, mission policy revisit.

---

### Phase 13 — Video generation from live pages

**Goal:** Bunny mappings for ar-MSA, ar-Gulf, en from stable live URLs.

**Deliverables:** Remotion inputs from packages, per-locale GUID registry, flip `localizedVideosEnabled` per locale batch.

---

## 14. Risks and explicit non-goals

| Risk | Mitigation |
|------|------------|
| Wrong-language assistant | Hard block retrieval when `locale !== ar-EG` until Phase 12 |
| Egyptian video on EN page | Placeholder only — no silent fallback |
| Progress corruption | No upsert from localized pages in Phase 9 |
| SEO duplicate content | Same path + query — acceptable for Phase 9; path prefix deferred |
| Geo misclassification | Manual selector always visible; suggestion ≠ lock-in |

**Non-goals for Phase 8–11:** package JSON edits, ar-EG rewrites, Remotion renders, Supabase migrations (except Phase 12 charter), full mission localization.

---

## 15. Phase 11 verification checklist (preview)

- [ ] `git` clean; flags documented  
- [ ] ar-EG: no query → Egyptian content + video  
- [ ] `?locale=en` → English package, LTR, no Orientation leaks  
- [ ] Selector + cookie survive refresh  
- [ ] URL locale overrides cookie  
- [ ] Cookie overrides geo suggestion  
- [ ] Assistant disabled/banner on non–ar-EG  
- [ ] No mission submit on localized pages  
- [ ] 300/300 adapter hygiene + 100 ar-EG spot checks  
- [ ] Build + tests green  

---

## 16. Related code map (reference)

| Concern | File |
|---------|------|
| Flags | `src/lib/locale/feature-flags.ts` |
| Locale types / labels | `src/lib/locale/types.ts` |
| Selector UI | `src/components/locale/LanguageSelector.tsx` |
| Context | `src/lib/locale/locale-context.tsx` |
| Lesson access | `src/lib/locale-lessons/resolve-lesson-access.ts` |
| Route preview gate | `src/lib/locale-lessons/lesson-preview-search.ts` |
| Adapter / labels | `src/lib/locale-lessons/adapt-package-to-preview-content.ts`, `package-section-labels.ts` |
| Live-like renderer | `src/components/locale/LocalePackagePreviewRenderer.tsx` |
| Lesson route | `src/routes/learn.$pathId.$lessonId.tsx` |
| Progress | `src/lib/lesson-progress.ts` |

---

*End of Phase 8 plan.*
