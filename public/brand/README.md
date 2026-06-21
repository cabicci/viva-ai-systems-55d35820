# Masaarat Brand Assets

Source of truth: `masaarat-identity-sheet.png` (approved identity sheet uploaded by the user).

## Current runtime usage (verified)

The approved **full lockup** in live UI is:

- **`/brand/masaarat-logo-lockup.png`** — symbol + **مسارات** + **masaarat.ai**

Used today in:

- `src/components/site/Navbar.tsx`
- `src/components/dashboard/Sidebar.tsx` (mobile header, drawer, desktop)
- `src/components/auth/AuthShell.tsx`

Do **not** document or wire `masaarat-logo-horizontal.png` as the Navbar lockup — runtime code uses **`masaarat-logo-lockup.png`**.

## Files

| File | Role |
|------|------|
| `masaarat-identity-sheet.png` | Full approved identity sheet. **DO NOT modify.** |
| `masaarat-logo-lockup.png` | **Approved current lockup source** (symbol + مسارات + masaarat.ai). Primary runtime logo. |
| `masaarat-logo-lockup-sm.png` | Smaller lockup crop — use only when a compact lockup is needed; prefer lockup component wiring in Batch 2. |
| `masaarat-logo-horizontal.png` | Horizontal crop (symbol + مسارات, no `masaarat.ai`). **Not** the current Navbar/Sidebar runtime source. |
| `masaarat-logo-horizontal-rtl.png` | RTL horizontal variant. Reserved for future placements; not current runtime lockup. |
| `masaarat-icon.png` | Symbol-only mark. **Wired** in `src/routes/__root.tsx` as favicon + apple-touch-icon (`/brand/masaarat-icon.png`). |

## Rules

- Do **NOT** redesign or reinterpret the logo. Use approved crops from this folder or from `masaarat-identity-sheet.png`.
- Do **NOT** use the previous SVG approximation (`MasaaratMark.tsx`, removed).
- Do **NOT** use untracked hand-drawn SVG marks. Runtime **`src/components/brand/BrandMark.tsx`** uses approved **`/brand/masaarat-logo-lockup.png`** (PNG lockup, not SVG).
- For new placements, crop from `masaarat-identity-sheet.png` rather than redrawing.
- No AI-generated random icon packs. No regenerated art for logo or symbol.

## Forbidden identity symbols

Do **not** use these as brand identity (learner-facing or permanent brand mark):

- Sparkles
- GraduationCap
- Brain
- Bot / robot
- Generic AI starburst

## Preferred visual direction

Use calm concepts aligned with the brand brief:

- Path / route
- Progress / checkpoints
- Guided journey
- Navigation / direction

Supporting path pastels stay **path accents only**, not global brand fields. Existing pastel OKLCH tokens and **Tajawal** typography remain in place — no full re-theme.

## Removed legacy SVG icons (Design P1)

These **SVG files were removed** from the repo and must not be reintroduced:

- `icons/ai-brain.svg` — **removed**
- `icons/ai-spark.svg` — **removed**
- `icons/assistant-guide.svg` — **removed**

They conflict with the forbidden identity list above (brain, sparkles, generic AI marks). Do not add new runtime or brand references to them.

### Concept PNGs only (reference artwork, not live product icons)

These PNGs may still exist under `icons/concepts/` for archival or internal reference — **not** wired in learner UI or brand surfaces:

- `icons/concepts/ai-brain.png`
- `icons/concepts/ai-spark.png`
- `icons/concepts/assistant-guide.png`

Treat them as concept assets only; prefer path/route artwork and approved lockup PNGs for any live placement.

## Active path icons under `icons/`

Path SVG artwork (`path-builder.svg`, `path-creator.svg`, `path-automator.svg`, `path-analyst.svg`, `path-business.svg`) remains for path/concept use when aligned with the preferred direction and Phase 4 batches.

## TODO — pending icon system migration

All platform icons must later be replaced to match the identity sheet's icon style
(thin-line, mint accent, rounded). Scope to align in follow-up batches:

- path / location icon (المسارات / breadcrumbs)
- guided learning / book icon (دروس / curriculum)
- progress / growth icon (تقدّم / dashboard stats)
- simple practical assistant icon (assistant / مهام) — **not** brain/sparkles/starburst
- dashboard / cards / mission / assistant icons across the app

Until that batch lands, `lucide-react` icons may remain in non-brand UI; the **logo lockup** must always come from approved PNG assets above.
