# Viva AI Systems — Visual Blueprint

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
