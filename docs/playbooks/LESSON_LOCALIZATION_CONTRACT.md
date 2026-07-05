# Lesson Localization Contract

Phase **12.6** — future-proof pipeline for keeping **ar-EG**, **ar-MSA**, **ar-Gulf**, and **en** aligned when lessons, paths, or modules change.

This document is the **contract**. Enforcement lives in `scripts/locale-lessons/validate-*.ts` (Batch 1).

---

## 1. Current flow (today)

```
ar-EG canonical (TypeScript blocks)
  src/components/intro/lessons/<lessonId>.ts
  src/components/intro/lessons/index.ts  → INTRO_LESSON_CONTENT
  src/lib/curriculum-data.ts             → lesson(..., "available", route)
        │
        ▼
ar-MSA JSON package (adaptation source)
  src/lib/locale-lessons/ar-MSA/lessons/<lessonId>.json
        │
        ▼ Fragment pipeline (extract → adapt → inject → validate)
ar-Gulf + en JSON packages
  src/lib/locale-lessons/{ar-Gulf,en}/lessons/<lessonId>.json
        │
        ▼ Derived indexes (must stay in sync)
  {locale}/manifest.json
  {locale}/lesson-titles.json
  locale-curriculum/{locale}/labels.json   (path/module chrome)
  src/locales/{locale}/ui.json             (global UI chrome)
        │
        ▼ Runtime resolvers
  resolveLessonAccess()        → package JSON vs egyptian-ts
  getCurriculum*Label()       → overlays + indexes + curriculum-data fallback
  getUiString()                → ui.json (ar-EG fallback for missing keys)
```

**Not yet locale-aware (known debt — Batch 2+):**

- `src/components/intro/lesson-continuity.ts` — single Egyptian map
- `IntroLessonRenderer` / `QuizBlock` / mission toasts — ar-EG TS path only
- Route `head()` meta — static Arabic
- `mission-gate.ts`, `assistant-seed.functions.ts` — read Egyptian TS only

---

## 2. Lesson Localization Contract (schema)

One logical record per `lessonId`. Structure is **locale-invariant**; learner-facing text is **per locale**.

| Field | Locale-specific? | Notes |
|-------|------------------|-------|
| `lessonId` | No | Immutable; equals route slug |
| `pathId`, `moduleId` | No | From curriculum |
| `canonicalVersion` | No | Bump on structural change |
| `productionRoute` | No | `/learn/{pathId}/{lessonId}` |
| `title` | Yes | Catalog + H1 fallback |
| `titleEn` | Optional | SEO helper |
| `summary` | Yes | Card / preview |
| `sections[]` | Yes | Same roles/order all locales |
| `sections[].quiz` | Yes text / No index | `correctIndex` must match source |
| `sections[].mission` | Yes text / No weights | Rubric weights unchanged |
| `continuity.nextBridge` | Yes | Replaces `LESSON_CONTINUITY[id]` |
| `continuity.completeBridge` | Yes | End-of-path copy |
| `chrome.*` | Yes | Renderer labels (video skip, glossary, etc.) |
| `seo.pageTitle`, `seo.description` | Yes | Per-locale head meta (future) |

### Structure parity rule

For every non–ar-EG locale package adapted from ar-MSA:

- Same `lessonId`, `pathId`, `moduleId`, `nextLessonId`
- Same section count and `role` order
- Same quiz option count and `correctIndex`
- Same mission rubric row count and `weight` values
- Only **learner-facing string fields** may differ

Enforced today by `scripts/locale-lessons/lib/validate-structural-parity.ts` (generation pipeline). Batch 1 adds index/manifest/UI gates.

---

## 3. Derived indexes (generated, not hand-edited)

| Index | Path | Source of truth |
|-------|------|-----------------|
| Package manifest | `{locale}/manifest.json` | Must list exactly active curriculum lesson IDs |
| Title index | `{locale}/lesson-titles.json` | Must equal each package `title` field |
| Path/module labels | `locale-curriculum/{locale}/labels.json` | Overlays on `curriculum-data` |
| Continuity index | *future* `{locale}/continuity.json` | Per-locale bridge text (Batch 2) |
| UI strings | `src/locales/{locale}/ui.json` | Global chrome; identical key sets |

**Rule:** Regenerate title index and manifest in the **same change** as package JSON updates.

---

## 4. Forbidden drift rules

| Rule | Validator |
|------|-----------|
| No generic placeholder titles | `validate-title-index-parity` |
| No duplicate titles per locale | `validate-title-index-parity` |
| No Arabic in `en` titles / ui values | title + ui validators |
| No index/package title mismatch | `validate-title-index-parity` |
| No manifest vs curriculum ID drift | `validate-manifest-curriculum-sync` |
| No missing/extra `ui.json` keys across locales | `validate-ui-key-parity` |
| No hardcoded Arabic in wired curriculum/paywall chrome | `validate-locale-leak-scan` |
| No Egyptian continuity on non–ar-EG learn routes | `validate-locale-leak-scan` (until Batch 2) |
| No silent `ui.json` fallback hiding missing keys | warnings when value === key |

---

## 5. Add-new-lesson checklist (future)

### A. ar-EG activation (required)

1. `src/components/intro/lessons/<lesson-id>.ts`
2. `src/components/intro/lessons/index.ts`
3. `src/lib/curriculum-data.ts` — `lesson(..., "available", route)`
4. `bunx tsc --noEmit`

### B. Locale packages

5. `src/lib/locale-lessons/ar-MSA/lessons/<lesson-id>.json`
6. Run fragment adaptation → ar-Gulf + en JSON
7. Update `{ar-MSA,ar-Gulf,en}/manifest.json`
8. Regenerate `{ar-MSA,ar-Gulf,en}/lesson-titles.json` from package `title`
9. Add continuity strings × 4 locales (after Batch 2 index exists)

### C. Validation (must pass before merge)

```bash
bun scripts/locale-lessons/validate-localization-contract.ts
bun test src/lib/__tests__/locale-curriculum-lesson-labels.test.ts
bun test src/lib/__tests__/locale-learner-chrome-12-5d-a.test.ts
bunx tsc --noEmit
```

### D. Publish gates (separate approval)

- Production QA on `/curriculum` and `/learn` for all four locales
- Mission QA if rubric changed
- Flag video re-render if hero/mission/diagram text changed
- Assistant re-seed if Egyptian body changed (admin; locale packages not seeded yet)
- Roadmap marker when required by build guard

---

## 6. Validation commands (Batch 1)

Run individually:

```bash
bun scripts/locale-lessons/validate-title-index-parity.ts
bun scripts/locale-lessons/validate-manifest-curriculum-sync.ts
bun scripts/locale-lessons/validate-ui-key-parity.ts
bun scripts/locale-lessons/validate-locale-leak-scan.ts
```

Run all:

```bash
bun scripts/locale-lessons/validate-localization-contract.ts
```

**Note:** `locale-leak-scan` fails on continuity until **Batch 2** localizes `lesson-continuity.ts`. Title/manifest/UI validators should pass on current `main`.

---

## 7. Related docs

- `HANDOFF.md` — 3-file rule for new ar-EG lessons
- `scripts/locale-lessons/README-pilot-generation.md` — fragment CI workflows
- Phase 12.5A–D — curriculum path/module/lesson labels + learner chrome
