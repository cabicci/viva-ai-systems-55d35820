# MSA Canonical Prototype — Human Review Packet (3 Lessons)

**Status:** Awaiting human reviewer / project owner sign-off  
**Created:** 2026-06-05  
**Scope:** Docs-only · Prototype gate before 5-lesson pilot  
**Related:** [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · [`ADAPTIVE_LESSON_ENGINE.md`](../ADAPTIVE_LESSON_ENGINE.md)

---

## Instructions for reviewer

1. **Only the human reviewer or project owner** may complete scoring, decision, and sign-off in this packet. Automated tools and agents **must not** approve on behalf of a human.
2. Read each canonical draft in full before scoring:
   - [`intro-m1-l2-first-prompt.canonical.md`](intro-m1-l2-first-prompt.canonical.md)
   - [`business-m1-l2-reactive-vs-proactive.canonical.md`](business-m1-l2-reactive-vs-proactive.canonical.md)
   - [`automator-m3-l2-triggers-actions.canonical.md`](automator-m3-l2-triggers-actions.canonical.md)
3. Compare against production lesson files (read-only) and PATHS slugs where noted.
4. Score each dimension **1–5**. **Pass rule per lesson:** no dimension below **4/5**; average **≥ 4.3/5**.
5. Record decision: **approve** · **approve with notes** · **reject**.
6. After sign-off, copy approved scores into each draft’s §7b (Human reviewer score) and update `humanReviewerSignOff` in that draft’s metadata — in a **separate commit** after human review (not pre-filled here).

### Scale gate

**Do not scale to the 5-lesson MSA canonical pilot** until:

- This packet is completed for all three lessons, **and**
- Each lesson decision is **approve** or **approve with notes** (not **reject**), **and**
- Project owner confirms pilot charter in writing.

Egyptian production lessons, Bunny videos, and platform UX remain **unchanged** regardless of this review.

---

## Summary table (all three lessons)

| # | Path | lessonId | canonicalVersion | slugValidation | Draft self-assessment avg | Human score avg | Decision | Sign-off |
|---|------|----------|------------------|----------------|---------------------------|-----------------|----------|----------|
| 1 | intro | `intro-m1-l2-first-prompt` | `2026-06-04.1-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 2 | business | `business-m1-l2-reactive-vs-proactive` | `2026-06-04.1-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 3 | automator | `automator-m3-l2-triggers-actions` | `2026-06-04.1-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |

---

## Lesson 1 — `intro-m1-l2-first-prompt`

| Field | Value |
|-------|-------|
| **lessonId** | `intro-m1-l2-first-prompt` |
| **pathId** | `intro` |
| **Canonical draft** | [`intro-m1-l2-first-prompt.canonical.md`](intro-m1-l2-first-prompt.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/intro-m1-l2-first-prompt.ts` |
| **Production route** | `/learn/intro/intro-m1-l2-first-prompt` |

### oneAha

A clear prompt = **Role + Context + Task + Format** — not magic words.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| طلب واضح / clear structure | **70%** | Prompt includes role, context, task, format — even if simple |
| موضوع حقيقي / real topic | **30%** | Topic from work or daily life — not empty generic example |

**Mission intent:** Write one real prompt; tag [role][context][task][format]; honest attempt (not perfection).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Ahmed wrote: «اكتب إيميل لشغل جديد» — what to add first? |
| **Correct answer** | **Context** — who Ahmed is, the role, why this email |
| **correctIndex** | `0` |
| **Reasoning** | AI does not know the learner’s life; context + clear task makes request practical |

### MSA canonical summary

Neutral MSA draft derived read-only from Egyptian production. Teaches four-part prompt framework with café/post and Alexandria sweets examples. Glossary: Prompt (طلب), Context (سياق). Video block = production Bunny reference only. Next PATHS lesson: `intro-m1-l3-setup-your-ai`.

### Known notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-05 (prerequisite + nextLessonId verified).
- Pending: read-aloud for beginner clarity; scan MSA for residual dialect or stiff phrasing.
- Assistant `forbiddenPatterns` not expanded beyond YAML behaviors list.

### Reviewer scoring (/5)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | | |
| Concept preservation | | |
| Beginner clarity | | |
| MSA simplicity | | |
| Mission consistency | | |
| Quiz integrity | | |
| Assistant boundaries | | |
| Localization readiness | | |

| **Average** | | |
| **Pass (≥ 4.3, all ≥ 4)?** | ☐ yes · ☐ no | |

### Reviewer decision

☐ **approve**  
☐ **approve with notes**  
☐ **reject**

**Notes (if any):**

---

### Sign-off (human only — do not pre-fill)

| Field | Value |
|-------|-------|
| **Reviewer name** | |
| **Date** | |
| **Signature / confirmation** | |

---

## Lesson 2 — `business-m1-l2-reactive-vs-proactive`

| Field | Value |
|-------|-------|
| **lessonId** | `business-m1-l2-reactive-vs-proactive` |
| **pathId** | `business` |
| **Canonical draft** | [`business-m1-l2-reactive-vs-proactive.canonical.md`](business-m1-l2-reactive-vs-proactive.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/business-m1-l2-reactive-vs-proactive.ts` |
| **Production route** | `/learn/business/business-m1-l2-reactive-vs-proactive` |

### oneAha

Reduce repetitive **Reactive** work with AI — make room for **Proactive** work that moves the business.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| تصنيف واقعي / realistic classification | **60%** | 5 tasks from real week — each classified Reactive or Proactive |
| اختيار للـ AI / AI choice | **40%** | One Reactive task with specific AI help idea |

**Mission intent:** Honest diagnosis — 5 weekly tasks classified; one Reactive with AI help (not full automation).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Karim opened WhatsApp first thing for supplier crisis — spent 3 hours. What is this? |
| **Correct answer** | **Reactive** — situation determined his day before he chose priorities |
| **correctIndex** | `1` |
| **Reasoning** | Problem size is not the criterion; who decided what you do first? |
| **Distractors (do not teach)** | «Proactive — solved important problem» · «Business OS» (quiz only) |

### MSA canonical summary

Neutral MSA draft: Reactive vs Proactive framing for business owners; WhatsApp/firefighting tension; 90% Reactive warning; AI lightens repeatables. Diagram block = production visual reference. PATHS next: `business-m2-l1-customer-lifecycle`. Prerequisite: `business-m1-l1-from-decisions-to-leadership`.

### Known notes / issues

- Production **close text** mentions customer lifecycle; **`lesson-continuity.ts`** message for this slug mentions «٤ مسارات» — internal production inconsistency; canonical preserved close text + PATHS next slug.
- Slug errors from earlier audit **fixed** (prerequisite + nextLessonId).
- Pending: business-owner read-aloud; Gulf tone notes for downstream locales.

### Reviewer scoring (/5)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | | |
| Concept preservation | | |
| Beginner clarity | | |
| MSA simplicity | | |
| Mission consistency | | |
| Quiz integrity | | |
| Assistant boundaries | | |
| Localization readiness | | |

| **Average** | | |
| **Pass (≥ 4.3, all ≥ 4)?** | ☐ yes · ☐ no | |

### Reviewer decision

☐ **approve**  
☐ **approve with notes**  
☐ **reject**

**Notes (if any):**

---

### Sign-off (human only — do not pre-fill)

| Field | Value |
|-------|-------|
| **Reviewer name** | |
| **Date** | |
| **Signature / confirmation** | |

---

## Lesson 3 — `automator-m3-l2-triggers-actions`

| Field | Value |
|-------|-------|
| **lessonId** | `automator-m3-l2-triggers-actions` |
| **pathId** | `automator` |
| **Canonical draft** | [`automator-m3-l2-triggers-actions.canonical.md`](automator-m3-l2-triggers-actions.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/automator-m3-l2-triggers-actions.ts` |
| **Production route** | `/learn/automator/automator-m3-l2-triggers-actions` |

### oneAha

Every automation = **Trigger + Actions** — «when this happens → do that».

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| Trigger + Actions | **60%** | Clear trigger type and «when…»; Action 1 + 2 linked to prior data |
| Success | **40%** | Measurable success criterion; goal tied to Success |

**Mission intent:** Paper design only — one Trigger + 2–3 Actions + Success (10–15 min); no build in tool.

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | On course purchase, send instant WhatsApp with login link — correct design? |
| **Correct answer** | **Trigger:** Webhook from payment gateway (new purchase). **Action:** send WhatsApp |
| **correctIndex** | `0` |
| **Reasoning** | Purchase = instant event → Webhook; «when they buy → send WhatsApp» |
| **Wrong options** | Schedule hourly poll · Manual trigger per customer |

### MSA canonical summary

Neutral MSA draft: Trigger/Action framework; Schedule, Webhook, Event types; chained actions; Heba comparison example. MSA §4 glosses **مسار عمل (workflow)**, **تدفق عمل (Flow)**, **أفعال (Actions)**, **Webhook (إشعار فوري)**. Video = Bunny reference only. Next: `automator-m3-l3-filters-routers`.

### Known notes / issues

- English glosses added in MSA §4; metadata/YAML intent blocks still use bare English (acceptable outside learner text).
- Glossary section title uses «workflow» without gloss — cosmetic.
- Pending: automator-path read-aloud; assistant refusal phrasing for «build my workflow» requests.

### Reviewer scoring (/5)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | | |
| Concept preservation | | |
| Beginner clarity | | |
| MSA simplicity | | |
| Mission consistency | | |
| Quiz integrity | | |
| Assistant boundaries | | |
| Localization readiness | | |

| **Average** | | |
| **Pass (≥ 4.3, all ≥ 4)?** | ☐ yes · ☐ no | |

### Reviewer decision

☐ **approve**  
☐ **approve with notes**  
☐ **reject**

**Notes (if any):**

---

### Sign-off (human only — do not pre-fill)

| Field | Value |
|-------|-------|
| **Reviewer name** | |
| **Date** | |
| **Signature / confirmation** | |

---

## Packet completion (project owner)

Complete after all three lessons reviewed:

| Field | Value |
|-------|-------|
| **All three decisions recorded?** | ☐ yes · ☐ no |
| **Any rejections?** | ☐ yes · ☐ no |
| **5-lesson pilot authorized?** | ☐ yes · ☐ no — **only if all approve/approve-with-notes and owner confirms** |
| **Owner name** | |
| **Date** | |
| **Owner sign-off** | |

---

*Packet owner: Masaarat curriculum architecture · Human review required · No agent sign-off.*
