# Masaarat Brand Assets

Source of truth: `masaarat-identity-sheet.png` (approved identity sheet uploaded by the user).

## Files

- `masaarat-identity-sheet.png` — full approved identity sheet. DO NOT modify.
- `masaarat-logo-horizontal.png` — cropped horizontal lockup (symbol + مسارات, no `masaarat.ai`). Used in Navbar.
- `masaarat-icon.png` — symbol-only mark. Reserved for sidebar/app icon use.

## Rules

- Do NOT redesign or reinterpret the logo. Use the approved crops above.
- Do NOT use the previous SVG approximation (`MasaaratMark.tsx`, removed).
- For new placements, crop from `masaarat-identity-sheet.png` rather than redrawing.

## TODO — pending icon system migration

All platform icons must later be replaced to match the identity sheet's icon style
(thin-line, mint accent, rounded). Scope to align in a follow-up batch:

- path / location icon (المسارات / breadcrumbs)
- guided learning / book icon (دروس / curriculum)
- progress / growth icon (تقدّم / dashboard stats)
- simple practical AI / star icon (assistant / مهام)
- dashboard / cards / mission / assistant icons across the app

Until that batch lands, `lucide-react` icons remain in place everywhere except the Navbar logo.
