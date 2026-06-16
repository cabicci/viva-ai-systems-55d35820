# مسارات (masaarat.ai) — Master Project Tracker

> Single source of truth for project status. Documentation only.
> Reconciled from: `docs/CURRENT_STATUS.md`, `docs/VISUAL_BLUEPRINT.md`, `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md`, repo reality (2026-06-04, baseline `cc84946`).
>
> Status legend: ✅ LOCKED · 🟡 IN PROGRESS · 🔴 BLOCKED · ⏸️ DEFERRED · ⚪ NOT STARTED · ❓ UNKNOWN (needs verification)

---

## 0. Executive Status

| Field | Value |
|------|------|
| Current Phase | **P0 Launch Ready With Warnings** — Aggressive Controlled Launch Ready |
| Previous phase | Phase 3 — AI Assistant P0 ✅ FROZEN |
| Launch Readiness | Production-ready for controlled launch; polish/video/mobile deferred per P0 Constitution |
| Critical blockers | 0 |
| High-priority open items | Brand visual implementation; Visual Freeze F1.c–F8; video audit; mobile UX — **post-launch hardening**, not launch gates |
| Last major milestone | P0 launch hardening: canonical fix + standalone assistant auth (`cc84946`) |
| Last commit snapshot | `cc84946` — "fix: require auth for standalone assistant page" (local + origin/main synced) |
| Last production commit (per CURRENT_STATUS) | `cc84946` (masaarat.ai) |

**Current launch decision:** P0 aggressive controlled launch is **allowed with warnings**. Remaining items are post-launch hardening/cleanup unless live user evidence elevates them to Critical/High. Supersedes pre-constitution perfection gating in §14 below.

---

## Phase 4 — Brand Visual Identity Lock Brief

Status: 🟡 **IMPLEMENTATION PLAN LOCKED** (docs only — batches 1–6 not started; no `src/`, no assets, no deploy)

> **Context:** Phase 3 — AI Assistant P0 is **FROZEN**. Production QA on masaarat.ai passed logged-out and logged-in assistant flows. This section locks the brand visual identity brief before any implementation work.

### Phase 3 closure (Assistant P0 — FROZEN ✅)

| Check | Result |
|-------|--------|
| Logged-out assistant | ✅ PASS — Arabic login message; no POST to `/functions/v1/assistant-runtime` |
| Logged-in assistant | ✅ PASS — HTTP 200 |
| Authorization | ✅ Real user JWT (not `sb_publishable`) |
| Auth errors | ✅ No 401 |
| CORS | ✅ No CORS blocker |
| Lesson context | ✅ PASS |
| Mission integrity | ✅ PASS |
| Out-of-scope redirect | ✅ PASS |
| Mobile usability | ✅ PASS |
| Placement QA | ✅ PASS |
| In-lesson flow | ✅ `AssistantPanel` compact embedded on learn route |
| `/ai-assistant` standalone | ✅ Auth-gated — anonymous redirect to `/login` (`cc84946`); logged-in users retain full page |
| Recommendation | **Freeze Assistant P0 = yes** |

### 1. Current brand

| Item | Value |
|------|-------|
| Arabic name | **مسارات** |
| Domain / public brand | **masaarat.ai** |
| Meaning | Guided learning paths, progress, discovery, direction, learner choice |

**Legacy names — not public-facing (retired):**

- Viva AI Systems
- AI Ecosystem
- AI Ecosystem Platform
- AI Ecosystem Hub

These must not appear as product names in learner-facing UI, SEO, or social metadata.

### 2. Brand personality

- Calm
- Guided
- Beginner-safe
- Arabic-first
- Practical
- Trustworthy
- **Not** flashy
- **Not** tech-intimidating

### 3. Visual direction

| Element | Direction |
|---------|-----------|
| Wordmark | **مسارات** |
| Symbol | Path / route / guided journey / progress |
| Primary color | Soft blue — existing `--primary` OKLCH token |
| Secondary | Mint — existing `--accent` OKLCH token |
| Theme system | **Keep** existing pastel OKLCH system — no full re-theme |
| Typography | **Tajawal** remains suitable |

Supporting path pastels (pink, yellow, lavender, peach, cream) stay **path accents only**, not global brand fields.

### 4. Explicitly forbidden identity directions

- ❌ Sparkles
- ❌ Graduation cap
- ❌ Robot
- ❌ Brain
- ❌ Generic AI starburst
- ❌ Harsh neon AI look
- ❌ Full re-theme from zero

### 5. Required deliverables (after this brief — not started)

Implementation follows this brief; **none of these are in scope for the brief step itself.**

1. **`BrandMark` component** — one unified mark for Navbar, Sidebar, AuthShell, Footer (where appropriate)
2. **Logo / wordmark** — مسارات + masaarat.ai lockup direction
3. **Favicon / app icons** — symbol-only; legible at 16×16 and 32×32; no full Arabic word in favicon
4. **OG / social image** — 1200×630, Arabic-first; replace legacy hosted `og:image`
5. **Replace split icon usage** — Lucide may remain inside lessons/UI, not as permanent brand mark
6. **Fix remaining English path labels** where learner-facing (e.g. path chips, display titles)
7. **Fix social metadata** — e.g. replace legacy `twitter:site` if still pointing at Lovable

### 6. Non-goals for this step (brief only)

- No `src/` changes
- No asset generation
- No favicon creation
- No OG image creation
- No Bunny / media cleanup
- No video work
- No deployment
- No theme token changes
- No UI component changes

### 7. Phase order (locked sequence)

1. **Brand brief** ✅ (this section, §1–§6)
2. **Implementation plan** ✅ ← **current docs step** (§8 below)
3. **Controlled batches 1–5** (Phase 4 implementation — one batch at a time)
4. **Visual QA** (Batch 6 — smoke on Navbar, Sidebar, auth, social meta, favicon)
5. **Bunny / media cleanup** — **after** brand identity lock and visual QA

⚠️ Do not proceed to Bunny / media cleanup until Phase 4 brand visual implementation is complete and smoke-tested.

### 8. Brand Implementation Plan — Controlled Batches

Status: ✅ **PLAN LOCKED** (docs only — execution not started)

> **Audit baseline (2026-06, verified in code):** Live logo: `/brand/masaarat-logo-lockup.png`. Favicon + apple-touch in `src/routes/__root.tsx` → `/brand/masaarat-icon.png`. OG/Twitter image → `https://masaarat.ai/brand/masaarat-og.png`; no `twitter:site` / `@Lovable` in root meta. Remaining brand batch work: forbidden icon cleanup (Batch 5), visual QA (Batch 6). Stale pre-2026 notes about GPT Engineer OG / missing favicon are **obsolete**.

**Global rules (all batches):**

- No AI-generated random icon packs
- No robot / brain / sparkles / starburst as brand identity
- No full re-theme — existing pastel OKLCH stays; **Tajawal** stays
- Logo and symbol assets must come from approved brand files under `public/brand/` — **no regenerated art, no hand-drawn SVG approximations**
- Do **not** use untracked `src/components/brand/BrandMark.tsx`
- One batch at a time; smoke-check before the next batch

---

#### Batch 1 — Source alignment / no visual risk

**Goal:** Align documentation and source-of-truth references without changing learner-visible UI.

| Action | Detail |
|--------|--------|
| Update `public/brand/README.md` | Later — document actual usage: lockup is `/brand/masaarat-logo-lockup.png` (Sidebar, Navbar, AuthShell as applicable) |
| Approved lockup source | Keep `/brand/masaarat-logo-lockup.png` as the approved full lockup |
| Icon source candidate | Treat `/brand/masaarat-icon.png` as favicon/app-icon source **only if file exists** (confirmed present) |
| Do not use | Untracked `BrandMark.tsx`; do not redraw logo or symbol |
| Do not | Create, delete, or move assets in this batch |

**Acceptance:** README matches code references; no `src/` visual changes; no asset mutations.

---

#### Batch 2 — BrandMark wiring

**Goal:** Single tracked component; DRY logo placement; no theme changes.

| Action | Detail |
|--------|--------|
| Create tracked `BrandMark` | New component under `src/components/brand/` that references **approved image assets** (`masaarat-logo-lockup.png`, horizontal/icon variants as needed) — **not** hand-drawn SVG |
| Replace repeated usage | Sidebar `<img src="/brand/masaarat-logo-lockup.png">` (mobile header, drawer, desktop) → one safe component; extend to Navbar / AuthShell when in batch scope |
| Out of scope | Re-theme, token changes, new colors |

**Acceptance:** All targeted placements use one component; images still load from approved PNG paths; no SVG redraw.

---

#### Batch 3 — Favicon / app icons

> **Status (2026-06):** Wired in `src/routes/__root.tsx`; verify on deploy.

**Goal:** Browser tab and install surfaces use approved symbol-only mark.

| Action | Detail |
|--------|--------|
| Source | Approved icon crop — `/brand/masaarat-icon.png` (or crops derived from identity sheet in a **future asset batch** if additional sizes needed) |
| Meta wiring | Add `rel="icon"` and `apple-touch-icon` in `src/routes/__root.tsx` (root meta only) **after** confirming final asset paths |
| Legibility | Must read clearly at **16×16** and **32×32**; no full Arabic word in favicon |

**Acceptance:** Favicon visible in browser tab; apple-touch resolves; paths stable on masaarat.ai.

---

#### Batch 4 — OG / social

> **Status (2026-06):** Root meta uses `https://masaarat.ai/brand/masaarat-og.png`; legacy GPT Engineer / `@Lovable` social meta removed from code.

**Goal:** Replace legacy Lovable / GPT Engineer social metadata with masaarat.ai brand.

| Action | Detail |
|--------|--------|
| Branded OG image | Create and host on **masaarat.ai** (1200×630, Arabic-first, aligned with identity sheet) |
| Replace legacy URL | Remove `storage.googleapis.com/gpt-engineer-file-uploads/...` from `og:image` and `twitter:image` in `__root.tsx` |
| Twitter site | Remove or replace `@Lovable` **only when official handle is confirmed**; otherwise **omit** `twitter:site` |

**Acceptance:** Social preview cards show masaarat branding; no Lovable/GPT Engineer URLs in meta; no stale `@Lovable` unless intentionally kept.

---

#### Batch 5 — Forbidden icon cleanup

**Goal:** Remove generic AI / graduation iconography from learner-facing brand surfaces.

| Action | Detail |
|--------|--------|
| Replace usage | `Sparkles`, `GraduationCap`, `Brain`, `Bot`, and references to `ai-brain` / `ai-spark` under `public/brand/icons/` |
| Direction | Calm path / progress / navigation concepts instead |
| Priority | Learner-facing first; admin-only icons (e.g. Sidebar dev `Brain` on “Assistant Runtime”) lower priority but must not leak into learner brand identity |
| Asset policy | Quarantine or stop referencing forbidden assets; do not introduce new random icon packs |

**Acceptance:** Learner routes and landing pillars free of forbidden brand symbols; brand asset folder usage aligned with §4 forbidden list.

---

#### Batch 6 — Visual QA

**Goal:** Smoke-test all Phase 4 visual changes before Bunny / media work.

| Surface | Check |
|---------|-------|
| Desktop | Navbar, Sidebar, Footer, auth, dashboard |
| Mobile | Sidebar drawer, header lockup, touch targets |
| Favicon | Tab preview, 16×16 / 32×32 legibility |
| Social | OG/Twitter card preview (masaarat.ai URL) |
| Learner pages | Learn route, path chips, no forbidden icons as brand |
| Auth pages | AuthShell lockup |
| Dashboard / Sidebar | Lockup + nav icons consistent with brief |

**Acceptance:** All checks pass on production or staging before marking Phase 4 implementation complete.

---

**Batch execution order (locked):** 1 → 2 → 3 → 4 → 5 → 6. Do not skip Batch 1 doc alignment before Batch 2 wiring.

---

## Brand Identity (Locked)

Status: ✅ LOCKED

### Official platform name
**masaarat.ai**

### Meaning
"مسارات" = guided learning paths, progress, discovery, direction, and learner choice.

### Core concept
The platform is built around learning journeys and paths, not generic AI chatbot usage.

### Brand personality
- Calm
- Guided
- Trustworthy
- Premium educational
- Arabic-first
- Beginner-friendly
- Structured progress
- Practical AI

### Visual identity direction (locked)
- Path / journey metaphor
- Subtle progress language
- Movement, guidance, discovery
- Warm premium education
- Not futuristic-neon AI

### Explicitly rejected direction
❌ Generic robot AI  
❌ Glowing brain / cyber visuals  
❌ Neon startup SaaS aesthetic  
❌ Default Lovable / Lucide look  
❌ Random icon language

### Future implications
| Item | Status |
|------|--------|
| Logo system should reflect paths/journeys/progress | 🟡 |
| Custom icon identity required before final launch | 🟡 |
| Path-specific subtle identities allowed under one umbrella | 🟡 |
| Visual freeze must happen before final video regeneration | 🟡 |

### Critical dependency
⚠️ Major color/icon/visual changes may require selective video regeneration.

### Visual Freeze — Button variant legacy aliases (frozen)
- `neon`, `violet`, and `hero` are **frozen legacy aliases** in `src/components/ui/button.tsx`.
- They currently map to the pastel visual system (`--pastel-lavender`, `--pastel-peach`, `--pastel-yellow`).
- **Do not create new color-named button variants.**
- Future variants should be **semantic** (e.g. primary, destructive, warning), not color-named.

### Brand Visual Identity Lock Brief — masaarat.ai

Status: ✅ VISUAL DIRECTION LOCKED (brief) · 🟡 Phase 1 implementation pending

Deep audit verdict (2026-06): **CONDITIONAL PASS** — pastel OKLCH theme and path-based UX fit مسارات; logo, favicon, OG, and unified BrandMark are not built yet.

#### Decision

- **Keep** the existing pastel OKLCH visual system.
- **Do not** re-theme from zero.
- **Primary brand language:** Arabic-first · calm · guided · intelligent · premium enough · beginner-safe.
- **Primary brand color:** soft blue — existing `--primary` token.
- **Secondary guidance/progress color:** mint — existing `--accent` token.
- **Supporting path colors:** pink, yellow, lavender, peach, cream — **path accents only**, not global brand fields.

#### Logo direction

| Item | Direction |
|------|-----------|
| Primary wordmark | **مسارات** |
| Secondary text | **masaarat.ai** |
| Symbol | Path / route / progress / guided journey motif |

**Acceptable symbol ideas:**

- Layered path lines
- Forked route
- Nodes connected by a path
- Progress route with one highlighted current step
- Abstract Arabic **م** — only if legible at favicon size

**Rejected symbol ideas:**

- Sparkles
- Graduation cap
- Robot
- Brain
- Generic AI starburst
- Six different path icons as the main brand

#### BrandMark rule

- Create **one `BrandMark` component** later (not started).
- **Same mark** must be used in: Navbar · Sidebar · AuthShell · Footer (where appropriate) · favicon source · OG image.
- Lucide icons may remain inside lessons/UI, but **not** as the permanent brand mark.

#### Favicon direction

- Symbol-only mark.
- Must work at **16×16** and **32×32**.
- Do **not** use full Arabic word in favicon.
- Deliverables: `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` (if manifest is used).

#### OG / social preview direction

- **1200×630**, Arabic-first.
- Include: مسارات wordmark · masaarat.ai · short Arabic tagline · subtle path motif · blue/mint pastel background.
- Must **replace** legacy gpt-engineer / Lovable-hosted `og:image` — **done in `__root.tsx` (2026-06)**.
- `twitter:site` / `@Lovable` — **not present** in root meta (2026-06).

#### Implementation phases (after this brief — not started)

**Phase 1:**

- Create `BrandMark` component
- Replace Navbar / Sidebar / Auth mark
- Add favicon / app icons
- Wire `__root.tsx` icon links
- Replace OG image and social meta
- Update landing path chips to Arabic (`Ecosystem.tsx`)

**Phase 2 (optional):**

- Footer mark reinforcement
- Admin / dev title cleanup
- Docs legacy rename cleanup

#### Freeze rule

⚠️ **Do not proceed to Bunny / media cleanup** until Phase 1 brand visual implementation is complete and smoke-tested.

---

## Naming / Brand Audit

Status: ✅ NAMING DECISION LOCKED (memo) · 🟡 Learner-surface rename pending

Audit verdict (2026-06): **CONDITIONAL PASS** — structure and Arabic voice are sound; learner UI still ships legacy product names.

### Naming Decision Memo — masaarat.ai Brand Lock

**Owner decision:** The project brand is **masaarat.ai** only.

#### Decision

| Item | Value |
|------|-------|
| Public brand | **masaarat.ai** |
| Arabic display name | **مسارات** |
| Domain | masaarat.ai (reserved) |

#### Retired names (do not use as product names)

- Viva AI Systems
- AI Ecosystem
- AI Ecosystem Platform
- AI Ecosystem Hub

**Rules:**

- Retired names must not appear in learner-facing UI.
- **Viva AI Systems** is not the internal codename for this project going forward.
- **Ecosystem** / **منظومة** may be used only as a descriptive metaphor (living system, connected paths), not as the product name.

#### Canonical learner labels

| Concept | Label |
|---------|-------|
| Platform | مسارات |
| Domain | masaarat.ai |
| Assistant | مساعد المنصة |
| Lesson | درس |
| Mission | مهمة |
| Path | مسار |
| Dashboard | اللوحة |
| Feedback | ملاحظات / توجيه |

#### Path display names

| Slug ID | Arabic display |
|---------|----------------|
| intro | المقدمة |
| business | الأعمال |
| creator | المحتوى |
| analyst | التحليل |
| automator | الأتمتة |
| builder | البناء |

#### Level display names

| Level | Arabic display |
|-------|----------------|
| Stage 00 | مرحلة البداية |
| Level 1 — AI User | المستوى ١ — مستخدم AI |
| Level 2 — AI Operator | المستوى ٢ — مشغّل AI |
| Level 3 — AI Builder | المستوى ٣ — باني AI |

#### Implementation note (not started)

**P0 rename batch — learner-facing surfaces first:**

- `__root.tsx` meta / SEO / JSON-LD
- Navbar
- Sidebar
- Footer
- Landing hero
- `PATH_META` / `PATHS` display titles
- `ai-assistant.tsx`
- Assistant runtime prompt wording
- Learn missing-content error state
- Mission feedback label `Clear`
- Canonical URL / og URL

**Docs cleanup batch (gradual):** Legacy **Viva AI Systems** naming in historical docs clarified in Batch 4C (2026-06). Retired product names must not reappear in learner-facing UI or SEO.

---

## 1. Platform Architecture ✅ LOCKED

- ✅ Master Blueprint completed (`docs/VIVA_MASTER_BLUEPRINT.md`)
- ✅ Module + path structure locked (Intro → Business → Creator → Analyst → Automator → Builder)
- ✅ Phase plan defined
- ✅ Reusable lesson runtime (`learn.$pathId.$lessonId.tsx` + `IntroLessonRenderer`)
- ✅ Separation of concerns: navigation SOT (`PATHS`) vs body SOT (`INTRO_LESSON_CONTENT`)
- ✅ Builder constraints documented (`LESSON_SHAPE_CONSTITUTION.md`, `MISSION_CONSTITUTION.md`)

---

## 2. Curriculum Structure ✅ LOCKED

| Item | Value | Status |
|------|------|------|
| Learner shipped lessons | 100 | ✅ |
| Registry / files total | 104 | ✅ |
| Freeze contract | Active | ✅ (`CURRICULUM_FREEZE_CONTRACT.md`) |
| Archived Business slugs excluded | 4 | ✅ |
| Path structure | 6 paths, frozen | ✅ |
| Placement exceptions accepted | 4 | ✅ (documented, not blocking) |

Excluded archived Business slugs: `business-m1-l3-ai-thinking-partner`, `business-m2-l4-pricing-cash-flow`, `business-m3-l4-hiring-onboarding`, `business-m4-l5-business-os-dashboard`.

---

## 3. Lesson Placement & Module Logic 🟡 IN PROGRESS

- ✅ Module structure correctness — verified per path
- ✅ Placement review for the 4 exception lessons (signed off temporarily)
- ⏸️ Naming normalization for the 4 exceptions — DEFERRED to post-P0 cleanup
- ✅ Route alignment (`/learn/{pathId}/{lessonId}` matches PATHS)

Exceptions (slug `m{N}` ≠ module id, accepted):
- `creator-m4-repurposing` in `creator-m5-polish`
- `analyst-m4-automated-dashboard` in `analyst-m5`
- `analyst-m5-ab-testing` in `analyst-m6`
- `automator-m3-testing-automation` in `automator-m4`

---

## 4. Naming & File Unification 🟡 IN PROGRESS

- ✅ Lesson IDs follow `{path}-m{module}-l{lesson}-{slug}` (Core rule)
- ✅ `slug = id = filename` rule active per freeze contract
- ✅ Route consistency aligned with PATHS
- 🟡 Source-of-truth alignment: PATHS / routes / registry / files aligned for 100 learner slugs; 4 archived registry-only entries remain by design
- ⏸️ Export-constant cleanup (e.g. `BUILDER_M7_*` vs `builder-m8-*` filenames) — DEFERRED
- ⏸️ Stale doc purge (`lessons-data.ts` references) — DEFERRED

---

## 5. Lesson Content Quality ✅ LOCKED (with deferred polish)

- ✅ All 6 paths rewrites completed (Intro, Business, Creator, Analyst, Automator, Builder)
- ✅ Content freeze active per `CURRICULUM_FREEZE_CONTRACT.md`
- ✅ 6 technical lesson fixes (`f45ba9f`)
- ✅ 8-lesson terminology pass (`133637b`)
- 🟡 Eyebrow close review — ❓ status per-path not centrally tracked
- ⏸️ Optional constitution alignment (Creator confidence-close eyebrows) — DEFERRED
- Remaining content debt: ❓ no central debt log

---

## 6. Missions ✅ LOCKED

- ✅ Mission Constitution + Target Design complete
- ✅ Mission Runtime Phase A + B1 + B2 + B3-lite complete
- ✅ Rubric alignment per constitution
- ✅ Runtime validation via `MissionRubricSubmit`
- 🟡 Markdown cleanup sweep across all missions — ❓ not centrally verified

---

## 7. Images Inside Lessons 🟡 IN PROGRESS

- ❓ Diagram quality — no central audit log
- ❓ Repeated visuals — no audit
- ❓ Missing visuals — no audit
- ❓ Placeholders — no audit
- ⚪ Lesson-image audit — NOT STARTED as a formal pass

> This is one of the largest uncertainty areas. A dedicated image audit is recommended before final visual freeze.

---

## 8. Videos 🟡 IN PROGRESS (post-launch dependency)

- ✅ Bulk generation completed for shipped lessons (per workflow history)
- ❓ Per-lesson Bunny coverage table — not centrally maintained here
- 🟡 Changed-lesson impact audit — pending; must re-run after any lesson content edits since last batch
- 🔴 **Regeneration decision pending**: see core rule — *Major visual changes may require video regeneration.* Final video freeze depends on Visual Freeze (F0–F8) completion.
- Final freeze dependency: Visual Freeze F8 must complete before final video lock.

> **CRITICAL**: Any content/script edit to a lesson file must trigger `lesson-video.yml` (per Core rule). Audit pending to confirm all edits since last batch were re-rendered.

---

## 9. Assistant (AI Teacher) ✅ LOCKED (P0 — FROZEN)

| Phase | Status |
|------|------|
| P0 semantic seed + retrieval smoke | ✅ PASS |
| P0.1 prompt grounding hardening | ✅ |
| P0.2 semantic similarity threshold | ✅ |
| Auth: user JWT + logged-out guard | ✅ (`aed96c6` / production `b6ecd2a`) |
| Standalone `/ai-assistant` auth gate | ✅ Anonymous → `/login` (`cc84946`); does not affect in-lesson panel |
| Seed: knowledge_chunks | ✅ 100 learner lessons / 198 chunks |
| Retrieval | ✅ Path-aware + lesson-aware keyword corpus |
| Grounding | ✅ Hardened |
| Mission integrity | ✅ No full submission; coaching only |
| Fallback behavior | ✅ Unsupported-topic fallback active |
| Production hardening | ✅ |
| In-lesson assistant | ✅ `AssistantPanel` compact on learn route |
| Production P0 QA (masaarat.ai) | ✅ FROZEN — logged-out + logged-in PASS |

---

## 10. UI / Visual System 🟡 IN PROGRESS

| Phase | Status |
|------|------|
| F0 — Token Inventory & Lock | ✅ (`docs/VISUAL_BLUEPRINT.md`) |
| F1 — Hardcoded color replacement map | ✅ |
| F1.a — Author missing semantic tokens | ✅ (surface + accent tokens added) |
| F1.b — Replace hardcoded colors in P0 learner surfaces | ✅ 25 replacements across 6 files |
| F1.c — Sweep secondary learner files | ⚪ NEXT |
| F2–F8 | ⚪ NOT STARTED |
| Typography scale | 🔴 Missing — flagged in VISUAL_BLUEPRINT §1 |
| Spacing system | ❓ Not formally codified |
| Token system | ✅ OKLCH pastel identity locked |
| Hardcoded color cleanup | 🟡 ~20 files audited; 6 done, remainder pending |
| Visual freeze ↔ video dependency | 🔴 Must finish before final video lock |

### Visual Freeze — Admin UI / Deferred Issues

#### Admin SSR auth access issue
- **Affected routes:** `/admin/v9-review`, `/admin/persona-sim-v9`
- **Issue:** Direct URL / headless access triggers SSR admin guard before client session is available, causing redirect to `/login`.
- **Impact:** Blocks authenticated visual smoke-check for these admin diagnostic pages.
- **Status:** Deferred; not part of Visual Freeze Batch #1 (merged `40f4d5d`).
- **Possible future fixes:**
  - Move routes under authenticated client-only layout
  - Set route SSR disabled if appropriate
  - Expose links through admin index
- **Freeze decision:** Does not block Batch #1 merge — pre-existing and unrelated to token fixes. Must be resolved or explicitly accepted before final admin UI freeze.

### F1.d Visual Freeze Lock Plan

**Tracker snapshot:** `main` @ `b61bac1` (Batch #1 `40f4d5d` + deferred admin SSR auth note).

#### 1. Current status
- **F1.c Batch #1 complete** — critical token blockers merged (`40f4d5d`).
- **Token criticals resolved** — admin persona palettes, `LessonDiagrams.tsx`, `system-state` print isolation.
- **system-state print/export isolated** — hard-coded hex confined to `@media print` with documented comment.
- **Button legacy aliases documented** — `neon`, `violet`, `hero` frozen (see Brand Identity §Visual Freeze).
- **Admin SSR auth documented** — deferred known issue (see Admin UI / Deferred Issues above).

#### 2. Lock criteria (F1.d)
- No hard-coded visual hex in locked learner/admin visual surfaces except documented print/export isolation.
- Font remains **Tajawal** only.
- Icon library remains **lucide-react** only.
- CSS motion only — **no framer-motion**.
- RTL utilities remain canonical.
- Button legacy aliases frozen — **no new color-named variants**.
- Visual changes after lock require explicit reason (regression fix, accessibility, or approved launch polish).

#### 3. Known exclusions / deferred
- Admin SSR auth access issue (`/admin/v9-review`, `/admin/persona-sim-v9`).
- Dark mode tokens.
- Card variants system.
- Shadow scale narrowing.
- Admin theme namespace.
- `GalleryGrid` `bg-[#FAFCFE]` wrapper (pre-existing; out of Batch #1 scope).
- Legacy hex in other non–Batch #1 diagram files (e.g. `ANALYST_BUSINESS_DIAGRAMS` and gallery thumbnails not edited in Batch #1).

#### 4. Recommended F1.d decision
- **CONDITIONAL LOCK** — not an absolute lock.
- **Learner visual system** can be locked for P0 launch polish.
- **Admin visual access** remains deferred until SSR auth issue is resolved or explicitly accepted.
- **No large visual refactor** before launch polish unless a new **Critical** visual blocker appears.

#### 5. Next step after F1.d
1. **Phase 4 — Brand Visual Identity Lock Brief** (docs) → implementation plan → BrandMark/logo/favicon/OG
2. **Bunny / media cleanup** (after brand visual implementation + QA)
3. **Launch polish**

Current visual score (per blueprint): **68/100**.

---

## 11. Mobile UX ⚪ NOT STARTED (as a formal pass)

- ❓ Sidebar mobile behavior — basic responsive present, no formal audit
- ❓ Responsiveness across breakpoints — no formal pass
- ❓ Scroll fatigue on long lessons — not measured
- ❓ Tap-target sizing — not audited
- Visual smoke at 390×844 passed for `/dashboard` only (F1.b check)

> Recommend a dedicated Mobile UX phase after Visual Freeze F2.

---

## 12. Security & Runtime 🟡 IN PROGRESS

- ❓ Service keys — assumed configured (Lovable Cloud managed); not re-verified here
- ❓ RLS — no central policy audit log; assistant tables seeded under standard setup
- ❓ Admin protection — status not centrally tracked
- ❓ Rate limiting (assistant) — status unknown
- ✅ Assistant production hardening completed (per CURRENT_STATUS)

> Recommend formal security pass via `security--run_security_scan` before launch.

---

## 13. Analytics / Observability 🟡 IN PROGRESS

- ✅ Persona-100 diagnostics completed
- ✅ Retrieval debug tooling used during P0
- ❓ Assistant runtime metrics dashboard — not centrally tracked
- ❓ Learner tracking / funnel analytics — status unknown

---

## 14. Launch Readiness

**P0 operating model:** `docs/playbooks/P0_LAUNCH_CONSTITUTION.md` — Aggressive Launch + Rapid Iteration. Launch is not gated on visual perfection; Critical trust/security issues still block.

**Current launch decision (2026-06):** P0 aggressive controlled launch is **allowed with warnings**. Critical blockers = 0. Mega Source-of-Truth Audit and production route/source smoke: **PASS WITH WARNINGS**.

**Security launch blockers (closed):** workbook admin lock, persona-sim internal-only (+ local `public/persona-sim` leak cleaned), legal draft pages, admin route guards (Batch A1/A2), duplicate canonical fixed (`0d58a49`), standalone `/ai-assistant` auth-gated (`cc84946`).

### Superseded: pre-constitution "Must before launch"

> ⚠️ The list below reflected pre-P0 perfection gating. **Superseded by P0 Launch Constitution** — do not treat as launch blockers unless a new Critical trust/security issue is proven.

1. Visual Freeze F1.c → F8 complete — **post-launch polish**
2. Typography scale defined and applied — **post-launch polish**
3. Lesson-image audit complete (Section 7) — **post-launch**
4. Video regeneration audit + re-render of any changed lessons (Section 8) — **post-launch** (unless content edit triggers CI)
5. Mobile UX pass (Section 11) — **post-launch**
6. Formal security scan + admin/rate-limit verification (Section 12) — **recommended**; P0 Safe Fixes applied; not blocking after Batch A1/A2
7. In-lesson assistant status verified (Section 9) ✅ **closed**

### Can wait after launch
- Naming normalization for the 4 placement-exception slugs
- Export-constant cleanup (`BUILDER_M7_*` etc.)
- Stale doc purge (`lessons-data.ts` references)
- Optional constitution alignment (Creator confidence-close eyebrows)
- Advanced analytics dashboards

### Known risks
- 🔴 Video staleness if visual freeze triggers regeneration of many lessons
- 🟡 Typography scale gap may force a second visual sweep
- 🟡 Mobile UX has had no formal pass — unknown regressions likely
- 🟡 Image audit is the largest uncertainty area
- 🟡 Security posture not centrally verified

---

## 15. Immediate Next Priorities

1. **Phase 4 brand implementation plan** (BrandMark, logo, favicon, OG, learner-facing labels)
2. **Lesson image audit** (Section 7) — full pass, classify gaps
3. **Video impact audit** — diff edited lessons since last batch vs Bunny
4. **Visual Freeze continuation** (F1.c–F8)
5. **Custom icon identity direction**
6. **Final visual freeze**
7. **Selective video regeneration** — only after visual freeze complete
8. **Mobile UX formal pass** — sidebar, tap targets, scroll fatigue
9. **Security scan** — RLS, admin, rate limiting, service-key review

> Reason: Avoid redesign work that later forces rework of videos/content.

---

## Uncertainty Areas (explicitly marked ❓)

- Per-lesson Bunny video coverage table
- Lesson image audit (no formal pass yet)
- Mobile UX state across breakpoints
- RLS / admin / rate-limit posture
- In-lesson assistant status ✅ (Section 9 — P0 FROZEN)
- Eyebrow close review completion per path
- Markdown cleanup status across all missions
- Central content-debt log
