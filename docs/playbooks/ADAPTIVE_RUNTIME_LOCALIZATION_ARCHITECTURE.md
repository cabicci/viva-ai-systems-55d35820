# Adaptive Runtime Localization Architecture — masaarat.ai / مسارات

**Status:** Architecture design only — **not implemented**  
**Effective:** 2026-06-18  
**Phase:** **Phase 0** (this document only)  
**Governing sources:** FINAL MASTER HANDOFF · AUDIT LOCK REPORT · `ADAPTIVE_LESSON_ENGINE.md` · `P0_LAUNCH_CONSTITUTION.md` · `CURRICULUM_FREEZE_CONTRACT.md`

**Scope:** Non-breaking runtime localization architecture for future rollout.  
**Does not authorize:** runtime wiring, Supabase migrations, i18n libraries, video regeneration, Egyptian lesson edits, language selector UI, publish, or any change outside this file.

---

## 1. Current locked state

| Layer | State | Rule |
|-------|--------|------|
| **Live production locale** | **`ar-EG`** (Egyptian Arabic) | Default fallback for all learners today |
| **Egyptian lesson files** | **104** `.ts` modules in `src/components/intro/lessons/` | **Locked — do not modify** |
| **Active learner PATHS** | **100** lessons | Egyptian content is the runtime source of truth |
| **Archived Business lessons** | **4** slugs retained for asset stability | Excluded from PATHS and RAG seed; files frozen |
| **Bunny video mappings** | **100/100** learner GUIDs | Locked — no regeneration |
| **Remotion registry** | **104** entries (100 learner + 4 archived) | Locked |
| **MSA canonical scripts** | **100/100** `*.canonical.md` at `2026-06-18.1-polished` | **Complete, API-reviewed, polished, locked** — **not production-wired** |
| **MSA review status** | `polished / not production-wired` | Docs-only; no `src/` integration |
| **Future locales** | **`ar-Gulf`**, **`en`** | Not started; derive from MSA canonical per `ADAPTIVE_LESSON_ENGINE.md` |
| **Current codebase** | Arabic / RTL-first | **No i18n infrastructure** (no locale registry, no translation resolver, no language selector) |
| **Assistant / RAG** | Seeded for **100** Egyptian learner lessons (**198** chunks) | Locale-agnostic retrieval today; Egyptian source text |

**Invariant:** Egyptian production is the live experience until a later phase explicitly enables a locale behind a feature flag. MSA canonical is architecture-ready source text, not runtime content.

---

## 2. Core principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Same `lessonId` across locales** | `intro-m1-l2-first-prompt` (and every slug) is stable globally. Locale changes *presentation*, not identity, routing keys, or progress keys. |
| 2 | **Localization layer above current system** | Resolver + registry sit *above* frozen Egyptian loaders. No in-place replacement of `INTRO_LESSON_CONTENT` or PATHS lesson IDs. |
| 3 | **No replacement of Egyptian content** | Egyptian `.ts` blocks remain immutable. Other locales load from separate translation artifacts or derived packages. |
| 4 | **No runtime activation in Phase 0** | This document does not wire anything. Implementation requires a separate phase charter + feature flag. |
| 5 | **Feature-flagged rollout only** | Each locale surface (UI, one lesson, assistant, missions, video) ships behind explicit flags — default off for non-`ar-EG`. |
| 6 | **Fallback-first design** | Missing translation → `ar-EG` content. Missing video → `ar-EG` Bunny GUID. Missing RAG chunk → Egyptian chunk. Never blank or broken. |
| 7 | **MSA derives; Gulf/EN derive from MSA** | Localization pipeline follows Egyptian → MSA canonical → locale packages. Do not bypass MSA for Gulf or English. |
| 8 | **Progress is locale-agnostic** | Completion, unlock, and mission submission state bind to `lessonId` + user, not locale. |
| 9 | **Manual choice beats automation** | Geo/IP may *suggest*; never force locale. User selector and saved preference override inference. |
| 10 | **One step at a time** | UI shell before lesson bodies; text before video; pilot before scale. |

---

## 3. Locale model

### 3.1 Supported future locales

| Locale code | Label (working) | Role | Status |
|-------------|-----------------|------|--------|
| **`ar-EG`** | Egyptian Arabic | **Live production default** | Shipped |
| **`ar-MSA`** | Modern Standard Arabic | First derived runtime locale (from canonical scripts) | Docs-only |
| **`ar-Gulf`** | Gulf Arabic | Future derived locale | Not started |
| **`en`** | English | Future derived locale | Not started |

### 3.2 Resolution priority (strict order)

**Manual language selector (future):** A learner-facing locale picker in the shell (nav, settings, or lesson chrome) is **planned but not implemented** — not in Phase 0, not in current production, and forbidden until a future phase charter authorizes it (see §12).

When runtime localization is implemented, locale resolves in this order — **higher wins**:

| Priority | Source | Behavior |
|----------|--------|----------|
| **1** | **URL locale segment or query** | Explicit route/query param (e.g. `?locale=ar-MSA` or `/ar-msa/...`) — highest priority for shareable links |
| **2** | **Manual language selector** (future UI) | Explicit in-session choice from the locale picker; writes to saved preference or cookie; **not implemented now** |
| **3** | **Saved user preference** | Account profile or authenticated setting in `user_locale_preferences` (future table) |
| **4** | **Cookie / local persistence** | Browser-stored choice for returning anonymous or pre-auth sessions |
| **5** | **Geo/IP suggestion** | Soft suggestion only — banner or selector pre-highlight, **never auto-switch without consent** |
| **6** | **Default fallback** | **`ar-EG`** — identical to today's production |

**Rules:**

- Geo/IP suggestion **must not** override URL, manual selector choice, saved preference, or cookie.
- The manual language selector **must remain available** once implemented; learners can always return to `ar-EG`.
- Invalid or unsupported locale code → **`ar-EG`**.

### 3.3 Direction and language attributes

| Locale | `lang` | `dir` | Notes |
|--------|--------|-------|-------|
| `ar-EG`, `ar-MSA`, `ar-Gulf` | `ar` | `rtl` | Shared RTL shell; dialect copy differs |
| `en` | `en` | `ltr` | Requires LTR-capable layout tokens |

Root `<html lang dir>` and in-app direction context update from resolved locale — **dynamic RTL/LTR** without changing lesson IDs.

---

## 4. Content architecture

### 4.1 Localized lesson registry (future)

A **Localized Lesson Registry** maps `(lessonId, locale)` → content source metadata:

```text
lessonId + locale → {
  contentSource:   "egyptian-ts" | "msa-canonical-md" | "locale-package-json"
  contentRef:      path or storage key
  fallbackLocale:  "ar-EG"
  status:          "draft" | "reviewed" | "published"
  canonicalVersion: "2026-06-18.1-polished" | null
}
```

- **`ar-EG`:** always resolves to existing `INTRO_LESSON_CONTENT[lessonId]` (frozen TS).
- **`ar-MSA`:** resolves to approved `docs/playbooks/adaptive-canonical/{lessonId}.canonical.md` (or future compiled runtime package) with **`ar-EG` block fallback** for any missing section.
- **`ar-Gulf` / `en`:** future packages derived from MSA canonical — never direct Egyptian rewrite.

Registry is **read-only at runtime** for `ar-EG`; other locales are additive.

### 4.2 Lesson translation resolver (future)

```text
resolveLesson(lessonId, requestedLocale)
  │
  ├─ if requestedLocale == "ar-EG" → load Egyptian TS (current path)
  │
  ├─ if feature flag OFF for locale → ar-EG
  │
  ├─ lookup registry (lessonId, requestedLocale)
  │     ├─ hit + published → load locale package
  │     └─ miss / draft / partial → apply fallback policy (below)
  │
  └─ return { blocks, locale, fallbackUsed, dir, lang }
```

**Fallback policy (explicit):**

| Condition | Fallback |
|-----------|----------|
| **Full locale miss** — no published package for `(lessonId, requestedLocale)` | **Full `ar-EG` lesson** (all blocks from frozen Egyptian TS) |
| **Partial lesson / block miss** — locale package exists but a block is missing, draft, or unpublishable | **Matching `ar-EG` block** for that section only (quiz, mission prompt, narrative, etc.); log the gap |
| **`ar-MSA` as intermediate fallback** | **Not default.** `ar-MSA` may only substitute for a missing block or lesson **if a future phase explicitly approves that policy in writing** (separate charter). Until then, any miss → `ar-EG` |

### 4.3 Shared progress and unlock state

Progress keys: **`userId` + `lessonId`** (and path/module context as today). Locale switch **must not** reset or duplicate progress.

| Event | Storage key | Locale-dependent? |
|-------|-------------|-------------------|
| Lesson viewed / completed | `lessonId` | **No** |
| Mission submitted | `lessonId` + `missionId` | **No** (copy localized; submission ID stable) |
| Quiz answered | `lessonId` + quiz id | **No** |
| Unlock chain | `lessonId` prerequisites | **No** |

Mission **rubric weights** and **correctIndex** stay canonical across locales (from MSA canonical / Egyptian source). Only **prompt copy** and **learner-facing instructions** localize.

### 4.4 Localized missions copy

Mission runtime logic (evaluation, weights, server-side scoring) remains unchanged. Localization adds:

- Mission title / brief / examples in target locale
- Submission placeholder text
- Success / retry messages

Fallback: Egyptian mission copy from live lesson blocks if locale mission copy missing.

### 4.5 Localized assistant strings

- System prompts, empty states, error messages, and UI chrome for `AssistantPanel` become locale-keyed string bundles.
- Retrieval context still path/lesson-aware; **answer language** follows resolved locale.
- Fallback: `ar-EG` strings + Egyptian retrieval when locale bundle incomplete.

### 4.6 Localized UI strings

Shell copy localizes first (homepage, nav, footer, auth, path cards, lesson chrome labels). Lesson body blocks localize last (highest risk / highest volume).

String source hierarchy (future):

1. In-repo JSON bundles per locale (Phase 1)
2. Optional `ui_strings` table for marketing/legal hot edits (later)

### 4.7 Localized video mapping

Separate **Video Locale Map**: `(lessonId, locale) → bunnyGuid | null`.

- **`ar-EG`:** current GUID (locked)
- **Other locales:** future GUIDs when rendered — **null → fallback to `ar-EG` video** with optional caption/subtitle track later

No change to existing GUID table until Phase 5.

---

## 5. Runtime architecture

### 5.1 Resolver flow (future)

```text
Request → LocaleMiddleware
            │
            ├─ resolveLocale(url, user, cookie, geoSuggestion) → locale
            ├─ setLangDir(locale) → <html lang dir>
            │
            ▼
         Route handler
            │
            ├─ Shell routes (/, /start, nav) → UI string resolver(locale)
            │
            ├─ /learn/:pathId/:lessonId
            │     ├─ PATHS unchanged (lessonId validation)
            │     ├─ resolveLesson(lessonId, locale)
            │     ├─ resolveVideo(lessonId, locale) → guid | fallback
            │     └─ AssistantPanel(locale, lessonId, pathId)
            │
            └─ /ai-assistant → auth gate unchanged → assistant(locale)
```

### 5.2 UI direction / language handling

- **Provider:** `LocaleContext` (future) exposing `{ locale, lang, dir, setLocale }`.
- **Tailwind / layout:** use logical properties (`ms-`, `me-`, `ps-`, `pe-`) where possible; audit hard-coded `rtl:` variants before `en` launch.
- **Typography:** Arabic locales share Cairo (or successor); English may need Latin stack adjustment — document in visual charter before Phase 1.

### 5.3 Rollout order inside runtime (when authorized)

| Order | Surface | Rationale |
|-------|---------|-----------|
| 1 | Homepage, nav, footer | Low risk; no lesson content |
| 2 | Auth / onboarding strings | High visibility; small string count |
| 3 | Path catalog / module titles | Medium; no block parser |
| 4 | Lesson chrome (labels, buttons) | Medium |
| 5 | **One MSA pilot lesson body** | Validates resolver + fallback |
| 6 | Assistant locale filter | Depends on chunk metadata |
| 7 | Missions copy | Server + client alignment |
| 8 | Full lesson corpus per locale | Scale behind flags |
| 9 | Locale-specific videos | Last — highest cost |

**Hard rule:** **No lesson ID changes.** Routes remain `/learn/:pathId/:lessonId`.

### 5.4 Feature flags (future)

| Flag | Controls |
|------|----------|
| `locale.ui.enabled` | Shell string localization |
| `locale.ar-MSA.pilotLessonId` | Single lesson MSA body (Phase 2) |
| `locale.ar-MSA.enabled` | Full MSA lesson rollout |
| `locale.assistant.localeFilter` | RAG locale metadata filter |
| `locale.missions.localizedCopy` | Mission prompt localization |
| `locale.video.ar-MSA` | Non-EG Bunny GUIDs |

Default: **all off** except implicit `ar-EG`.

---

## 6. Database design (on paper only)

**No migrations in Phase 0.** The following tables describe a **future** Supabase shape. All changes require Lovable-managed migration + RLS review.

### 6.1 `lesson_translations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `lesson_id` | text | Stable slug; FK logical to curriculum |
| `locale` | text | `ar-MSA`, `ar-Gulf`, `en` |
| `content_json` | jsonb | Render-ready blocks or reference key |
| `canonical_version` | text | e.g. `2026-06-18.1-polished` |
| `status` | enum | `draft`, `reviewed`, `published` |
| `source_hash` | text | Audit trail vs Egyptian/MSA source |
| `created_at`, `updated_at` | timestamptz | |

**Unique:** `(lesson_id, locale)` where `status = published` (one active published row per pair).

### 6.2 `mission_translations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `lesson_id` | text | |
| `mission_id` | text | Stable mission key |
| `locale` | text | |
| `prompt_copy` | text / jsonb | Localized learner-facing copy |
| `status` | enum | |
| `rubric_ref` | text | Points to canonical rubric — not duplicated per locale |

### 6.3 `ui_strings`

| Column | Type | Notes |
|--------|------|-------|
| `key` | text | e.g. `nav.home` |
| `locale` | text | |
| `value` | text | |
| `context` | text | `shell`, `legal`, `marketing` |
| `updated_at` | timestamptz | |

**Unique:** `(key, locale)`.

### 6.4 `localized_video_assets`

| Column | Type | Notes |
|--------|------|-------|
| `lesson_id` | text | |
| `locale` | text | |
| `bunny_guid` | text | |
| `duration_sec` | int | optional |
| `status` | enum | `processing`, `published`, `deprecated` |
| `remotion_build_id` | text | audit |

**Unique:** `(lesson_id, locale)` published.

### 6.5 `user_locale_preferences`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK/FK | auth.users |
| `preferred_locale` | text | |
| `geo_suggested_locale` | text | last suggestion — not auto-applied |
| `updated_at` | timestamptz | |

### 6.6 RLS principles

- **Public read** only for `published` translation rows and UI strings intended for anonymous shell.
- **Authenticated read** for all published lesson/mission translations.
- **Write** restricted to service role / admin — no client-side insert of lesson body content.
- **User preference:** users read/write **own** row only.
- Align with existing soft-delete and audit log patterns from P0 Safe Fixes.

### 6.7 Indexing principles

- `(lesson_id, locale, status)` on translation tables
- `(key, locale)` on `ui_strings`
- `(user_id)` on preferences
- Partial indexes on `status = 'published'` for hot paths

### 6.8 Auditability

- Store `canonical_version`, `source_hash`, and `reviewed_by` on publish
- Never overwrite published row in place — version bump or new row with effective date
- Log locale fallback events at debug level (optional analytics table later)

---

## 7. AI Assistant / RAG localization

### 7.1 Current state

- **198** chunks from **100** Egyptian learner lessons
- Path-aware + semantic retrieval; **no locale dimension** on chunks today
- P0.2 PASS — must not regress for `ar-EG`

### 7.2 Future locale-aware retrieval

```text
retrieve(query, { locale, lessonId, pathId })
  │
  ├─ filter chunks where chunk.locale IN (requestedLocale, "ar-EG")
  ├─ rank preferred locale first
  ├─ if no hits in requestedLocale → ar-EG only (fallback)
  └─ prompt: "Answer in {locale} using provided context; do not mix dialects unless user asks"
```

### 7.3 Chunk metadata (future)

Each `knowledge_chunks` row gains (conceptual):

- `locale` (`ar-EG` | `ar-MSA` | …)
- `lesson_id` (unchanged)
- `source_layer` (`production` | `msa-canonical` | `locale-package`)
- `canonical_version` when applicable

**Seed rule:** Egyptian chunks remain; MSA chunks **additive** — do not delete or replace Egyptian seed until explicit cutover charter.

### 7.4 Answer quality rules

- **Do not mix** Egyptian, MSA, Gulf, and English in one answer unless the learner explicitly requests comparison or translation.
- Unsupported topic fallback unchanged — locale-aware wording only.
- Rate limits and validators from P0 Safe Fixes apply per locale string length where relevant.

### 7.5 Future evaluation dataset

Maintain a fixed set of **~50 queries** per locale covering:

- Lesson-specific questions (pilot lesson first)
- Path navigation ("what's next in Builder?")
- Mission help
- Unsupported topic boundary

Score: grounding, locale purity, fallback correctness. Run before each phase promotion.

---

## 8. Video strategy

| Rule | Detail |
|------|--------|
| **Current Bunny mappings** | **Locked** — 100/100 learner GUIDs |
| **No regeneration now** | Phase 0–4 use Egyptian video for all locales |
| **Future per-locale assets** | Same `lessonId`, different `bunny_guid` in `localized_video_assets` |
| **Fallback** | Missing locale video → play `ar-EG` GUID |
| **MSA video scripts** | May be derived from MSA canonical §4 — **render only after text validated in runtime** |
| **Rollout gate** | Phase 5 only; requires Phase 2–4 text validation + feature flag |
| **Remotion** | New renders are additive entries — do not mutate existing 104 registry rows |
| **Cost control** | Pilot one lesson video per locale before batch |

---

## 9. Rollout phases

| Phase | Name | Deliverable | Runtime? | Feature flag |
|-------|------|-------------|----------|--------------|
| **0** | **Architecture doc** | This document | **No** | — |
| **1** | UI strings / shell | Homepage, nav, footer localized strings | Yes — behind flag | `locale.ui.enabled` |
| **2** | MSA pilot lesson | **One** lesson page renders MSA body from canonical | Yes — behind flag | `locale.ar-MSA.pilotLessonId` |
| **3** | Assistant / RAG | Locale filter on chunks + answer language | Yes — behind flag | `locale.assistant.localeFilter` |
| **4** | Missions localization | Localized mission prompts; shared rubric | Yes — behind flag | `locale.missions.localizedCopy` |
| **5** | Videos | Locale-specific Bunny GUIDs (pilot → scale) | Yes — behind flag | `locale.video.*` |
| **6** | Gulf / English expansion | Derived packages from MSA; full corpus | Yes — per-locale flags | `locale.ar-Gulf.enabled`, `locale.en.enabled` |

### Phase 2 gate — human reviewer sign-off

Any **MSA runtime pilot** (Phase 2) requires a **defined human reviewer sign-off policy** before the pilot lesson receives production visibility — **even behind a feature flag**.

MSA canonical scripts are **locked and API-reviewed** (`2026-06-18.1-polished`, `polished / not production-wired`) but **`humanReviewerSignOff` remains pending per artifact** per `ADAPTIVE_LESSON_ENGINE.md` §9g. Polish lock and API pass **do not** equal live runtime approval for learner display.

**Phase 2 must not start until:**

- Sign-off criteria, reviewer role, and per-lesson approval workflow are documented
- The pilot `lessonId` is **explicitly approved** for runtime display under the sign-off policy
- Stakeholders accept that unapproved MSA scripts stay docs-only regardless of resolver readiness

**Between every phase:** Cursor/GitHub sync verification · Lovable runtime QA · fallback matrix test · `ar-EG` no-regression check · update `CURRENT_STATUS.md` / tracker **only when phase completes** (not in Phase 0).

**Tooling split (unchanged):**

- **Cursor:** docs, static checks, registry design, diff review
- **Lovable:** runtime wiring, Supabase, publish, live QA

---

## 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking `ar-EG` production** | Critical — live learners see wrong/missing content | Fallback-first resolver; default flag off; Egyptian TS path untouched; pilot one lesson |
| **Mixing dialects** | Trust / comprehension loss | Locale purity in assistant prompts; separate chunk layers; no blended copy in single block |
| **RAG quality drop** | Wrong or English-heavy answers | Locale filter + eval dataset; keep Egyptian seed; additive MSA chunks |
| **SEO duplication** | Duplicate URLs / hreflang confusion | Plan `hreflang` + canonical URL strategy before Phase 1; avoid parallel unflagged routes |
| **Video cost explosion** | Budget / time overrun | Phase 5 last; pilot one GUID; no batch regeneration |
| **Maintenance load** | 4 locales × 100 lessons | Derive Gulf/EN from MSA; automate gap detection; status field on translations |
| **Premature paid marketing** | Traffic hits half-localized product | No paid scale until Phase 1 shell + Phase 2 pilot pass QA on `masaarat.ai` |
| **Progress desync** | Learner loses completion on locale switch | Bind state to `lessonId` only; integration tests |
| **Supabase drift** | Cursor vs Lovable mismatch | Migrations **only via Lovable**; sync check after each phase |

---

## 11. Testing strategy

### 11.1 Static tests (Cursor / CI)

- Registry completeness: every PATHS `lessonId` has `ar-EG` entry
- Locale registry: no orphan `(lessonId, locale)` without `lessonId` in PATHS
- Feature flag defaults off in config snapshot
- No accidental imports of `*.canonical.md` into `src/` (grep guard)
- String bundle key parity across locales (missing key fails build)

### 11.2 Route checks

- `/learn/:pathId/:lessonId` resolves for all 100 PATHS lessons under `ar-EG`
- Pilot lesson resolves under `ar-MSA` with flag on
- Invalid locale → `ar-EG`
- Archived lessons remain excluded from PATHS navigation

### 11.3 Fallback matrix

| Condition | Expected |
|-----------|----------|
| Locale flag off | Full `ar-EG` |
| MSA block missing | `ar-EG` block |
| MSA lesson missing | Full `ar-EG` lesson |
| MSA video missing | `ar-EG` Bunny GUID |
| MSA RAG chunk missing | Egyptian chunk |
| Invalid locale code | `ar-EG` |

### 11.4 RTL / LTR checks

- `ar-*` locales: `dir=rtl`, layout mirrors correctly
- `en`: `dir=ltr`, no clipped nav/footer
- Locale switch updates `html` attributes without full reload (if SPA)

### 11.5 Auth / progress preservation

- Locale switch mid-path: progress bar unchanged
- Mission submission before/after switch: same `mission_id` history
- Anonymous → login: preference persists

### 11.6 Assistant retrieval tests

- Egyptian query → Egyptian chunks only (flag off)
- MSA query with flag on → MSA chunks preferred; fallback logged
- Cross-locale lesson question → correct `lessonId` grounding

### 11.7 Visual QA (Lovable)

- Shell Phase 1: homepage, nav, footer in pilot locale
- Lesson pilot: one MSA lesson side-by-side with EG control
- Mobile pass before phase promotion

### 11.8 No-regression checks for `ar-EG`

- Persona-100 or subset smoke on **`ar-EG` only** after every phase
- Bunny playback 100/100 unchanged
- P0.2 assistant thresholds unchanged for Egyptian path
- **Zero** diff in `src/components/intro/lessons/*.ts` during Phase 0–2

---

## 12. What must not be done now

The following are **explicitly forbidden** until a future phase charter authorizes them:

- [ ] **Runtime wiring** — no resolver, no locale middleware, no registry loader in `src/`
- [ ] **Supabase changes** — no migrations, RLS edits, or edge function locale logic
- [ ] **Video work** — no Remotion render, Bunny upload, GUID change, or mapping edit
- [ ] **Egyptian lesson edits** — no changes to `src/components/intro/lessons/*.ts`
- [ ] **Language selector implementation** — no UI component, no cookie write
- [ ] **Dependency installation** — no `i18next`, `react-intl`, or similar
- [ ] **i18n framework adoption** — design only; evaluate at Phase 1 gate
- [ ] **Publish / deploy** — no Lovable publish for localization
- [ ] **MSA canonical edits** — corpus locked at `2026-06-18.1-polished` unless separate content charter
- [ ] **RAG re-seed** — no chunk replacement for Egyptian corpus
- [ ] **Mission runtime logic changes** — scoring/weights frozen
- [ ] **PATHS / lessonId changes** — routing keys immutable

**Phase 0 complete when:** this document is reviewed and the next phase (Phase 1 UI strings) is explicitly approved.

---

## Appendix A — Relationship to existing artifacts

| Artifact | Role in localization |
|----------|---------------------|
| `INTRO_LESSON_CONTENT` | `ar-EG` source — frozen |
| `docs/playbooks/adaptive-canonical/*.canonical.md` | `ar-MSA` script source — locked, not wired |
| `PATHS` / `curriculum-data.ts` | Navigation truth — lesson IDs immutable |
| `archived-lessons.ts` | Exclusion list — unchanged |
| `knowledge_chunks` | RAG — Egyptian today; locale column future |
| Bunny GUID registry | `ar-EG` video — locked |
| `ADAPTIVE_LESSON_ENGINE.md` | Content pipeline law — Egyptian → MSA → locales |
| `P0_LAUNCH_CONSTITUTION.md` | Launch mode — localization phases must not violate trust boundaries |

---

## Appendix B — Open decisions (for Phase 1 gate)

1. **URL strategy:** query param (`?locale=`) vs path prefix (`/ar-msa/`) vs subdomain — SEO and shareability tradeoff.
2. **String storage:** in-repo JSON vs `ui_strings` table first.
3. **MSA pilot lesson ID:** nominate one low-risk slug (e.g. `intro-m1-l2-first-prompt`) after stakeholder sign-off.
4. **hreflang / canonical policy** for marketing pages.
5. **i18n library vs lightweight custom resolver** — decide at Phase 1 only.

---

*End of Phase 0 architecture. No runtime changes authorized by this document.*
