# Curriculum Freeze Contract

**Status:** Active as of Assistant P0 prep  
**Purpose:** Document the current curriculum source of truth and RAG seed scope. No content, registry, or slug changes until Assistant P0 is complete.

---

## Source of truth

### 1. Learner navigation and order

`PATHS` in `src/lib/curriculum-data.ts` is the **learner navigation and order source of truth**.

It defines:

- Path order (Intro → Business → Creator → Analyst → Automator → Builder)
- Modules per path
- Lesson titles, order within modules, and routes
- Lesson `state` (`available` vs `coming-soon`)

### 2. Lesson bodies

`INTRO_LESSON_CONTENT` in `src/components/intro/lessons/index.ts` is the **lesson body source of truth**.

It maps each slug to its full block-based lesson content (paragraphs, concepts, quiz, mission, confidence close).

### 3. Runtime availability

Runtime renders **only** lessons in the intersection:

```
PATHS (available lessons) ∩ INTRO_LESSON_CONTENT (registered slugs)
```

- Route: `/learn/{pathId}/{lessonId}`
- Renderer: `src/routes/learn.$pathId.$lessonId.tsx`
- Availability gate: `SHIPPED_LESSON_IDS = Object.keys(INTRO_LESSON_CONTENT)` — a lesson is `available` on the path only if its slug exists in the registry.

The unified adapter (`src/lib/unified-lessons.ts`) uses the same intersection for RAG chunking, missions, and legacy consumers.

---

## Lesson counts

| Scope | Count |
|-------|-------|
| **Learner shipped lessons** | **100** |
| **Registry / files total** | **104** |

All 100 learner lessons have matching content files and routes. The 4 additional registry entries are archived Business content (see below).

---

## Archived Business slugs (excluded)

These 4 slugs exist in `INTRO_LESSON_CONTENT` and on disk but are **intentionally excluded** from the learner path in `PATHS`. They must **not** appear in learner navigation and must **not** be included in RAG seed for Assistant P0:

1. `business-m1-l3-ai-thinking-partner`
2. `business-m2-l4-pricing-cash-flow`
3. `business-m3-l4-hiring-onboarding`
4. `business-m4-l5-business-os-dashboard`

---

## RAG seed scope (Assistant P0)

**RAG seed scope for Assistant P0 = 100 learner slugs only.**

- Include: every slug that is `available` on `PATHS` and present in `INTRO_LESSON_CONTENT`
- Exclude: the 4 archived Business slugs above
- Do not seed from registry orphans, dead files, or coming-soon placeholders

---

## Freeze rules before Assistant P0

### No slug renames

**No slug renames before Assistant P0.**

Slug, lesson id, filename, and `INTRO_LESSON_CONTENT` key must remain aligned (`slug = id = filename`).

### Slug / module placement exceptions (accepted)

These 4 lessons sit in a curriculum module whose id does not match the slug’s `m{N}` prefix. This is **accepted temporarily** and **must not block Assistant P0**:

| Slug | Curriculum module |
|------|-------------------|
| `creator-m4-repurposing` | `creator-m5-polish` |
| `analyst-m4-automated-dashboard` | `analyst-m5` |
| `analyst-m5-ab-testing` | `analyst-m6` |
| `automator-m3-testing-automation` | `automator-m4` |

Do not rename or move these before P0. Document and seed by slug as listed on the learner path.

---

## Post-P0 cleanup (deferred)

After Assistant P0 is stable, a separate pass may handle:

- Naming normalization (slug ↔ module alignment where desired)
- Export constant cleanup (e.g. `BUILDER_M7_*` vs `builder-m8-*` filenames)
- Doc purge (remove stale `lessons-data.ts` references)
- Optional constitution alignment (e.g. Creator confidence-close eyebrows)

None of the above is required for P0 freeze or RAG seed.

---

## Quick reference

```
Navigation SOT:  src/lib/curriculum-data.ts          → PATHS
Body SOT:        src/components/intro/lessons/index.ts → INTRO_LESSON_CONTENT
Runtime:         PATHS ∩ INTRO_LESSON_CONTENT         → 100 lessons
RAG seed (P0):   same 100 slugs; exclude 4 archived Business
```
