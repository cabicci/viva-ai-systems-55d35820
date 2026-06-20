# Visual Blueprint — مسارات (masaarat.ai)

> **Historical note:** This document may use legacy project names. Current public brand is **مسارات / masaarat.ai**. Use `docs/CURRENT_STATUS.md` and `docs/playbooks/P0_LAUNCH_CONSTITUTION.md` for current launch source of truth.

> Baseline document for Visual Freeze Phase F0. Documentation only. No code or token values changed.
> Source of truth: `src/styles.css` (316 lines, audited 2026-06-09).

---

## 1. Current Visual Score

- **Overall score:** 68/100
- **Main diagnosis:** Strong pastel/token foundation and cohesive OKLCH identity, but **hardcoded Tailwind color classes (~20 files)** and a **missing typography scale** block a full visual freeze. Elevation vocabulary is also too small for the number of distinct surfaces in use.

---

## 2. Visual Identity Lock (Protected — NEVER Change)

These decisions are frozen at F0 and must not be modified by any later phase without explicit re-opening:

- **Pastel palette identity** — soft blue / mint / pink / pale yellow / lavender / peach / cream. This is brand differentiation.
- **OKLCH color authoring** — perceptually uniform, future-proof.
- **RTL Arabic-first** — `html { direction: rtl }` is canonical.
- **Tajawal / Cairo** font stack — `--font-sans` and `--font-display`.
- **OpenType features `ss01`, `ss02`** enabled on `body`.
- **Base radius `--radius: 1rem`** — warm, beginner-friendly tone.
- **Semantic token names** — `--primary / --secondary / --accent / --business / --pastel-*` are stable contracts; do not rename.
- **Hero gradient direction** — mint top-left, pink top-right, yellow bottom, white→pale-blue base. The signature look.
- **RTL bidi safety rules** for `code / kbd / samp / .ltr-inline / .ltr / .term / .ltr-bidi / .ltr-flex`.
- **A11y primitives** — `:focus-visible` ring, `.skip-to-content` link, `prefers-reduced-motion` overrides.

---

## 3. Current Token Inventory

Documented as-is from `src/styles.css`. No values invented.

### 3.1 Font tokens (`@theme inline`)
- `--font-sans` → `"Tajawal", "Cairo", system-ui, sans-serif`
- `--font-display` → same stack as `--font-sans`

### 3.2 Radius tokens
- `--radius` → `1rem` (base)
- `--radius-sm` → `calc(var(--radius) - 4px)`
- `--radius-md` → `calc(var(--radius) - 2px)`
- `--radius-lg` → `var(--radius)`
- `--radius-xl` → `calc(var(--radius) + 4px)`
- `--radius-2xl` → `calc(var(--radius) + 8px)`
- `--radius-3xl` → `calc(var(--radius) + 12px)`

### 3.3 Semantic color tokens (`:root`)
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary` (soft blue ~`oklch(0.62 0.08 235)`), `--primary-foreground`
- `--secondary` (pastel pink), `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent` (mint), `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### 3.4 Path / accent tokens
- `--business` → pastel lavender `oklch(0.88 0.055 305)`
- Legacy aliases preserved for backwards compatibility:
  - `--neon` → mint
  - `--neon-foreground` → deep mint
  - `--aurora` → primary blue

### 3.5 Pastel surface tokens (decorative)
- `--pastel-blue`
- `--pastel-mint`
- `--pastel-pink`
- `--pastel-yellow`
- `--pastel-lavender`
- `--pastel-peach`
- `--pastel-cream`

### 3.6 Gradient tokens
- `--gradient-hero` — multi-stop radial (mint TL, pink TR, yellow bottom) + base linear
- `--gradient-primary` — blue → light blue
- `--gradient-accent` — mint → pink
- `--gradient-card` — white → pale blue

### 3.7 Shadow tokens
- `--shadow-glow` — primary-tinted, soft
- `--shadow-violet` — accent/mint-tinted (legacy name)
- `--shadow-card` — neutral deep shadow

### 3.8 Animation tokens (utilities, not CSS variables)
Defined as keyframes + utility classes:
- `pulse-glow` / `.animate-pulse-glow`
- `float` / `.animate-float`
- `flame-flicker` / `.animate-flame`
- `sparkle-twinkle` / `.animate-twinkle`
- `spin-slow` / `.animate-spin-slow`
- `icon-tilt` / `.animate-tilt`
- `chart-bounce` / `.animate-chart-bounce`
- `glow-pulse` / `.animate-glow-pulse`
- `lock-shake` / `.hover-shake .lock-icon`
- `fade-up` / `.animate-fade-up`
- `arrow-nudge` / `.animate-arrow-nudge` / `.animate-arrow-nudge-always`
- `.card-lift` (transition utility)
- All respect `prefers-reduced-motion: reduce`.

### 3.9 Utility classes layered on tokens
- `.glass`, `.glow-primary`, `.glow-violet`
- `.text-gradient`, `.text-gradient-accent`
- `.grid-bg`
- RTL helpers: `.ltr`, `.ltr-wrap`, `.term`, `.ltr-bidi`, `.ltr-flex`

---

## 4. Token Gaps (to be filled in later phases — NOT now)

| Category | Status | Target phase |
|---|---|---|
| Typography scale (`--text-display / -h1 / -h2 / -h3 / -body / -caption`) | **Missing** | F2 |
| Spacing rhythm (`--space-section / -block / -inline`) | **Missing** | F4 |
| Elevation vocabulary (`--shadow-sm / -md / -lg / -elevated / -sticky`) | **Insufficient** (only 3 shadows for ~6 surface types) | F3 |
| CTA primary token (derived gradient with higher chroma) | **Missing** | F7 |
| Empty-state primitive | **Missing** | F6 |
| Loading / skeleton primitive | **Missing** | F6 |
| Error-state primitive | **Missing** | F6 |
| Chat bubble primitive (assistant) | **Missing** | F6 |
| Mobile-safe hero gradient strategy (replace `background-attachment: fixed`) | **Pending** | F5 |
| Dark mode token parity | **Pending audit** | F3 |

---

## 5. Freeze Blockers

These must be resolved (or explicitly deferred) before final sign-off at F8:

1. **Hardcoded Tailwind color classes in learner surfaces** — `~20 files` bypass the token system. High-impact files:
   - `src/components/intro/IntroLessonRenderer.tsx` (8 hits)
   - `src/components/dashboard/Sidebar.tsx` (5 hits)
   - `src/routes/curriculum.tsx` (4 hits)
   - `src/routes/dashboard.tsx`, `src/routes/learn.$pathId.$lessonId.tsx` (2 hits)
   - `src/components/site/Navbar.tsx`, `src/components/dashboard/WelcomeHint.tsx`, `WelcomeChecklist.tsx` (3 hits)
   - Admin/analytics routes (out of learner-critical path but should still be mapped)
2. **No documented typography scale** — heading sizes are ad-hoc per file → hierarchy drift across lessons.
3. **Inconsistent shadow & radius usage** — components mix `rounded-lg / xl / 2xl` and reuse the same 3 shadows across cards, modals, sticky nav, popovers.
4. **Sidebar mobile density** — 360px viewport risk: tap targets, scroll fatigue, visual noise from non-token colors.
5. **Assistant UI primitive gap** — `AssistantPanel.tsx` is single-file; no shared chat-bubble / message-list primitive → "bolted-on" feel risk.

---

## 6. Visual Freeze Phases

| Phase | Name | Scope | Output |
|---|---|---|---|
| **F0** | Token Inventory & Lock | Document current tokens + identity locks (this doc) | `docs/VISUAL_BLUEPRINT.md` baseline |
| F1 | Hardcoded Color Replacement Map | Map every hardcoded `text-*-NNN` / `bg-*-NNN` to a semantic token (no edits) | Replacement table |
| F2 | Typography Scale Definition | Define `--text-*` size tokens + per-element rules | Token spec |
| F3 | Elevation & Radius Lock | Expand shadow vocabulary; lock per-surface radius rules | Surface→token matrix |
| F4 | Spacing Rhythm Tokens | Define `--space-section / -block / -inline`; map to lesson blocks & cards | Rhythm spec |
| F5 | Mobile Spec Freeze | Tap-target minimums, sidebar collapse, hero gradient mobile fix | Mobile spec |
| F6 | Component Primitive Inventory | List all surfaces; flag missing primitives (Skeleton, EmptyState, ErrorState, ChatBubble, ProgressRing) | Primitive gap list |
| F7 | Premium / Trust Layer Spec | Micro-signals (borders, refined shadows, badges, celebration) — palette unchanged | Premium spec |
| F8 | Sign-off & Blueprint Freeze | Final consolidated `VISUAL_BLUEPRINT.md` becomes the source of truth | Frozen blueprint |

---

## 7. Non-Goals (F0)

- **No visual refactor yet.**
- **No token value changes yet.**
- **No component edits yet.**
- **No palette change.**
- **No typography switch yet.**
- **No `styles.css` changes.**
- **No `src/` changes.**

---

_F0 baseline established. Proceed to F1 only after explicit approval._

---

## F1 — Hardcoded Color Replacement Map

Read-only audit of hardcoded Tailwind color utilities across `src/`. Semantic
token classes (`text-primary`, `bg-background`, `text-muted-foreground`,
`border-border`, `bg-card`, etc.) are intentionally excluded.

### Totals

- Total hardcoded color hits: **169**
- Files affected: **28**
- Top repeated classes:
  - `bg-white` × 37
  - `border-white` × 14
  - `bg-black` × 8
  - `border-amber-400` × 7
  - `bg-amber-400` × 7
  - `text-slate-700` × 6
  - `text-amber-300` × 6
  - `border-rose-300` × 4
  - `border-emerald-300` × 4
  - `text-white` × 3

### Priority Buckets

- **P0 — Learner-facing** (must replace before freeze):
  IntroLessonRenderer, IntroSection, QuizBlock, MissionRubricSubmit,
  CompletionReward, DifficultyPrompt, Sidebar, Navbar, Hero,
  BackToDashboard, Journey, WelcomeChecklist, WelcomeHint,
  `routes/dashboard.tsx`, `routes/curriculum.tsx`,
  `routes/learn.$pathId.$lessonId.tsx`, `routes/account.tsx`.
- **P1 — Admin / shared infra**:
  `routes/admin.index.tsx`, `routes/analytics.tsx`,
  `routes/system-state.tsx`, `routes/build-logs.tsx`,
  `routes/assistant-runtime.tsx`, `lib/dna-report.functions.ts`
  (PDF render — keep raw color for print fidelity, flag only).
  *(Historical — removed in admin cleanup: `admin.v9-review`, `admin.persona-sim-v9`,
  `behavior-architecture`, `creator.workbook`, `icons-preview`.)*
- **P2 — Decorative / low-risk**:
  `components/ui/dialog.tsx` & `components/ui/sheet.tsx` (`bg-black` =
  shadcn overlay default), `components/image-gallery/GalleryGrid.tsx`.

### Replacement Map (semantic targets)

| Hardcoded class                       | Recommended token / replacement                              | Token exists? |
|---------------------------------------|--------------------------------------------------------------|---------------|
| `bg-white` (cards, panels, sheets)    | `bg-card` (most cases) / `bg-popover` (overlays)             | ✅            |
| `bg-white` (badge/contrast chip)      | `bg-background` over colored surface                         | ✅            |
| `border-white` (on colored surfaces)  | `border-border` or new `--border-onColor` token              | ⚠️ new        |
| `bg-white/10` `bg-white/20` (alpha)   | new `--surface-overlay` / `--surface-overlay-strong`         | ⚠️ new        |
| `text-white`                          | `text-primary-foreground` / `text-card-foreground`           | ✅            |
| `bg-black` (overlays in dialog/sheet) | keep (shadcn primitive), document exemption                  | n/a           |
| `bg-black` (PDF/render-only)          | keep (export fidelity)                                       | n/a           |
| `border-amber-400` / `bg-amber-400`   | `--accent-warning` (pastel amber)                            | ⚠️ new        |
| `text-amber-300` / `text-amber-200`   | `--accent-warning-foreground`                                | ⚠️ new        |
| `bg-amber-50` `bg-amber-100` (admin)  | `--accent-warning-soft`                                      | ⚠️ new        |
| `text-amber-800` / `text-amber-900`   | `--accent-warning-strong-foreground`                         | ⚠️ new        |
| `border-emerald-400` / `bg-emerald-*` | `--accent-success` family                                    | ⚠️ new        |
| `text-emerald-100..300`               | `--accent-success-foreground` (on dark)                      | ⚠️ new        |
| `bg-emerald-50/100` `text-emerald-8*` | `--accent-success-soft` / `--accent-success-strong-fg`       | ⚠️ new        |
| `bg-emerald-600/700`                  | `--accent-success-strong`                                    | ⚠️ new        |
| `border-rose-*` / `bg-rose-*` / text  | `--accent-danger` family (replaces ad-hoc destructive use)   | ⚠️ partial (`--destructive` exists, no soft variants) |
| `text-red-200/300` `bg-red-400`       | unify under `--accent-danger` (drop red, keep rose)          | ⚠️ new        |
| `text-slate-600..900` (admin text)    | `text-foreground` / `text-muted-foreground`                  | ✅            |
| `bg-slate-50..200` (admin surfaces)   | `bg-muted` / `bg-card`                                       | ✅            |
| `border-slate-200/300`                | `border-border`                                              | ✅            |
| `text-sky-400` (account icon)         | `--path-builder` accent token                                | ✅            |
| `text-orange-400` (account icon)      | `--path-creator` accent token                                | ✅            |
| `text-amber-400` (account icon)       | `--path-automator` accent token                              | ✅            |
| `text-emerald-400` (account icon)     | `--path-analyst` accent token                                | ✅            |

### Per-file Findings (high-signal)

**P0 — `src/components/intro/IntroLessonRenderer.tsx`** (8 hits, lines 171,
192, 259, 339, 362–363, 448, 527, 547): mix of `bg-white/10`,
`border-white/20`, `bg-amber-400`, `text-amber-300`, `bg-black/40`,
`text-white`. Used for video shell, hint chips, mission CTAs, lesson nav.
→ requires `--surface-overlay`, `--accent-warning`, and a documented
on-dark overlay scale before replacement.

**P0 — `src/components/intro/IntroSection.tsx`** (7 hits, lines 14, 20–21,
43): badge/header chrome over gradient hero. → same overlay + warning
tokens.

**P0 — `src/components/intro/QuizBlock.tsx`** (12 hits, lines 138–175):
correct/incorrect state colors (`emerald-*`, `red-*`, `white/*`).
→ needs `--accent-success` and `--accent-danger` families.

**P0 — `src/components/intro/MissionRubricSubmit.tsx`** (line 391):
`bg-white/10 border-white/20` chrome → `--surface-overlay`.

**P0 — `src/components/learn/DifficultyPrompt.tsx`** (11 hits, lines
98–138): three-tier difficulty pills (rose / amber / emerald).
→ `--accent-danger / warning / success`.

**P0 — `src/components/learn/CompletionReward.tsx`** (line 69):
`text-amber-300` star → `--accent-warning-foreground`.

**P0 — `src/components/dashboard/Sidebar.tsx`** (5 hits, lines 63, 92,
133, 155, 180): all `bg-white/*` for active state chips on the gradient
sidebar. → `--surface-overlay` family.

**P0 — `src/components/dashboard/WelcomeHint.tsx` & `WelcomeChecklist.tsx`**
(4 hits): `bg-white` panels → `bg-card` or overlay token depending on
context.

**P0 — `src/components/site/Navbar.tsx`** (line 9): `bg-white/80`
backdrop → `bg-background/80` or `--surface-glass` token.

**P0 — `src/components/site/Hero.tsx`** (3 hits, lines 29, 72, 87):
`bg-white/10` chrome over hero → `--surface-overlay`.

**P0 — `src/components/site/BackToDashboard.tsx`** (line 29):
`bg-white/10` pill → `--surface-overlay`.

**P0 — `src/components/site/Journey.tsx`** (line 124): `bg-white/10`
chrome → `--surface-overlay`.

**P0 — `src/routes/curriculum.tsx`** (8 hits, lines 365, 380, 472–473,
506–507): warning chips (`amber-*`) + `bg-white/*` thumbs.
→ `--accent-warning` + `--surface-overlay`.

**P0 — `src/routes/dashboard.tsx`** (line 341): `bg-white/10` → overlay.

**P0 — `src/routes/learn.$pathId.$lessonId.tsx`** (5 hits, lines 250,
264, 330–331): `bg-white/*` chrome + `amber-400` warning state.
→ overlay + warning tokens.

**P0 — `src/routes/account.tsx`** (5 hits, lines 321–336, 423): path
icon colors (orange/amber/sky/emerald) + `bg-white/10` chip.
→ already-existing `--path-*` tokens + overlay.

**P1 — `src/routes/admin.index.tsx`**: admin dashboard palette — same
accent-family migration as other P1 admin surfaces.

**P1 — `src/routes/analytics.tsx`** (3 hits, lines 274, 309, 335):
`bg-white/10` overlay → overlay token.

**P1 — `src/routes/system-state.tsx`** (line 321): `bg-white/10`.

**P1 — `src/routes/build-logs.tsx`** (4 hits, lines 143, 169, 171, 196):
`bg-white/*` + `border-white/*` chrome → overlay tokens.

**P1 — `src/lib/dna-report.functions.ts`** (line 411): inline PDF HTML —
`text-white bg-black` for print. **Exempt** from token migration; flag
only.

**P2 — `src/components/ui/dialog.tsx` & `sheet.tsx`** (line 24 each):
`bg-black/80` overlay = shadcn default. **Exempt**; document as the
single sanctioned `bg-black` usage in primitives.

**P2 — `src/components/image-gallery/GalleryGrid.tsx`** (lines 72, 99):
`bg-black/50 text-white` overlay for image captions. → `--surface-scrim`
new token, or accept as primitive-level exemption.

### Recommended Replacement Order

1. **F1.a — Token authoring (blocks replacement):** define new tokens in
   `src/styles.css` (no component edits yet):
   - `--surface-overlay`, `--surface-overlay-strong`, `--surface-scrim`
   - `--border-onColor`
   - `--accent-warning`, `--accent-warning-soft`, `--accent-warning-foreground`,
     `--accent-warning-strong`, `--accent-warning-strong-foreground`
   - `--accent-success` family (same shape)
   - `--accent-danger` family (extend `--destructive` with soft + strong-fg)
   - `--surface-glass` (frosted Navbar)
2. **F1.b — P0 learner-facing sweep** (single, mechanical pass):
   IntroLessonRenderer, IntroSection, QuizBlock, MissionRubricSubmit,
   CompletionReward, DifficultyPrompt, Sidebar, Navbar, Hero,
   BackToDashboard, Journey, WelcomeHint, WelcomeChecklist,
   dashboard/curriculum/learn/account routes.
3. **F1.c — P1 admin sweep:** `admin.index.tsx`, analytics,
   system-state, build-logs, assistant-runtime.
4. **F1.d — Exemption ledger:** document `dialog.tsx` / `sheet.tsx` /
   `dna-report.functions.ts` / `GalleryGrid.tsx` overlays as sanctioned
   raw-color usages in this blueprint.

### Classes That Must Wait for New Tokens

All `bg-white/*`, `border-white/*`, `amber-*`, `emerald-*`, `rose-*`,
`red-*` instances depend on F1.a tokens. Only `slate-*`, `bg-white`
(opaque), and path-icon colors can be replaced today using the existing
token set.

### Non-Goals (re-confirmed)

- No component edits this phase.
- No `styles.css` edits this phase.
- No visual refactor.

---

## F1.a — Semantic Color Tokens (added)

New tokens authored in `src/styles.css` (OKLCH, pastel-aligned). Components are **not yet migrated** — these are pre-positioned for the F1 replacement sweep.

### Surface tokens
| Token | Value | Use |
|---|---|---|
| `--surface-overlay` | `oklch(1 0 0 / 0.70)` | Soft white-glass over hero/imagery |
| `--surface-glass` | `oklch(1 0 0 / 0.45)` | Frosted floating panels |
| `--surface-scrim` | `oklch(0.20 0.03 260 / 0.50)` | Modal/sheet backdrop |
| `--border-onColor` | `oklch(1 0 0 / 0.40)` | Border on colored/hero surfaces |

### Accent / status tokens (pastel-aligned)
| Token | Value |
|---|---|
| `--accent-warning` / `-foreground` | `oklch(0.92 0.10 90)` / `oklch(0.32 0.10 75)` |
| `--accent-success` / `-foreground` | `oklch(0.88 0.08 160)` / `oklch(0.28 0.09 160)` |
| `--accent-danger` / `-foreground` | `oklch(0.88 0.07 20)` / `oklch(0.34 0.13 22)` |
| `--accent-info` / `-foreground` | `oklch(0.90 0.05 235)` / `oklch(0.30 0.08 235)` |

All tokens are mapped under `@theme inline` → exposed as Tailwind utilities: `bg-surface-overlay`, `bg-surface-glass`, `bg-surface-scrim`, `border-border-onColor`, `bg-accent-warning`, `text-accent-warning-foreground`, etc.

### Dark mode
Project has no `.dark` overrides yet (light-only pastel identity). Dark-mode counterparts deferred to a later phase when dark theme is introduced.

### Status
- Tokens defined ✅
- Components migrated ❌ (F1 sweep)
- Visual change: none (tokens unused so far)

---

## F1.b — P0 Learner-Facing Replacement Sweep (applied)

Hardcoded Tailwind color classes replaced with semantic tokens. No layout/spacing/copy changes.

| File | Replacements |
|---|---|
| `src/components/intro/IntroLessonRenderer.tsx` | 9 |
| `src/components/dashboard/Sidebar.tsx` | 5 |
| `src/components/site/Navbar.tsx` | 1 |
| `src/routes/dashboard.tsx` | 1 |
| `src/routes/curriculum.tsx` | 5 |
| `src/routes/learn.$pathId.$lessonId.tsx` | 4 |
| **Total** | **25** |

### Mapping used
- `bg-white/[0.02|0.03|0.06]`, `bg-white/5` → `bg-foreground/5` (subtle hover surface, token-driven)
- `border-white/10` → `border-border`
- `bg-white/80` (Navbar) → `bg-surface-overlay`
- `bg-white` (solid card) → `bg-card`
- `bg-black/40 | /50 | /70` → `bg-surface-scrim`
- `text-white/90` → `text-primary-foreground`
- `bg-amber-400/*`, `border-amber-400/*`, `text-amber-300*` → `bg-accent-warning/*`, `border-accent-warning/*`, `text-accent-warning-foreground`

### Remaining hardcoded colors in edited files
None. All six files are now token-only.

### Deferred classes
- `dialog.tsx` / `sheet.tsx` shadcn scrim (`bg-black/...`) — intentionally exempt
- `dna-report.functions.ts` PDF render — exempt
- `GalleryGrid.tsx` caption overlay — exempt

### Next batch (F1.c candidates)
- `src/components/intro/IntroSection.tsx`
- `src/components/intro/QuizBlock.tsx`
- `src/components/intro/MissionRubricSubmit.tsx`
- `src/components/intro/CompletionReward.tsx`
- `src/components/intro/DifficultyPrompt.tsx`
- `src/components/site/Hero.tsx`, `BackToDashboard.tsx`, `Journey.tsx`, `WelcomeHint.tsx`, `WelcomeChecklist.tsx`
- `src/routes/learn.tsx`, `src/routes/account.tsx`
