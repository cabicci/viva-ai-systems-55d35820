# MSA Canonical Pilot — Human Review Packet (5 Lessons)

**Status:** Awaiting human reviewer / project owner sign-off  
**Created:** 2026-06-04  
**Scope:** Docs-only · 5-lesson MSA canonical pilot gate  
**Prior gate:** [`HUMAN_REVIEW_PACKET_3_LESSONS.md`](HUMAN_REVIEW_PACKET_3_LESSONS.md) (prototype trio — approved for this pilot)  
**Related:** [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · [`ADAPTIVE_LESSON_ENGINE.md`](../ADAPTIVE_LESSON_ENGINE.md)

---

## Instructions for reviewer

1. **Only the human reviewer or project owner** may complete scoring, decision, and sign-off in this packet. Automated tools and agents **must not** approve on behalf of a human.
2. Read each canonical draft in full before scoring:
   - [`creator-m1-l1-why-content.canonical.md`](creator-m1-l1-why-content.canonical.md)
   - [`analyst-m1-l1-from-automation-to-insight.canonical.md`](analyst-m1-l1-from-automation-to-insight.canonical.md)
   - [`builder-m1-l1-what-is-llm.canonical.md`](builder-m1-l1-what-is-llm.canonical.md)
   - [`business-m2-l1-customer-lifecycle.canonical.md`](business-m2-l1-customer-lifecycle.canonical.md)
   - [`automator-m1-l1-where-you-are.canonical.md`](automator-m1-l1-where-you-are.canonical.md)
3. Compare against production lesson files (read-only) and PATHS slugs where noted.
4. Score each dimension **1–5**. **Pass rule per lesson:** no dimension below **4/5**; average **≥ 4.3/5**.
5. Record decision: **approve** · **approve with notes** · **reject**.
6. After sign-off, copy approved scores into each draft’s §7 (Human reviewer score) and update `humanReviewerSignOff` in that draft’s metadata — in a **separate commit** after human review (not pre-filled here).

### Sign-off policy

- **Human / project owner sign-off is required** before any scaling beyond this 8-draft corpus or any runtime integration work.
- **Approval in this packet authorizes the next controlled documentation batch only** — it does **not** authorize production localization, learner-facing deploy, Bunny changes, or assistant/RAG seed updates.
- Egyptian production lessons, Bunny videos, PATHS, missions runtime, and platform UX remain **unchanged** regardless of this review.

### Scale gate

**Do not proceed to the next canonical batch or downstream locale work** until:

- This packet is completed for all five lessons, **and**
- Each lesson decision is **approve** or **approve with notes** (not **reject**), **and**
- Project owner confirms next-step charter in writing.

Read-only audit (pre-packet): **PASS WITH NOTES** — no blockers to opening this packet.

---

## Summary table (all five lessons)

| # | Path | lessonId | canonicalVersion | slugValidation | Draft self-assessment avg | Human score avg | Decision | Sign-off |
|---|------|----------|------------------|----------------|---------------------------|-----------------|----------|----------|
| 1 | creator | `creator-m1-l1-why-content` | `2026-06-04.2-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 2 | analyst | `analyst-m1-l1-from-automation-to-insight` | `2026-06-04.2-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 3 | builder | `builder-m1-l1-what-is-llm` | `2026-06-04.2-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 4 | business | `business-m2-l1-customer-lifecycle` | `2026-06-04.2-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |
| 5 | automator | `automator-m1-l1-where-you-are` | `2026-06-04.2-draft` | pass | 4.375 (informational) | _pending_ | _pending_ | _pending_ |

---

## Lesson 1 — `creator-m1-l1-why-content`

| Field | Value |
|-------|-------|
| **lessonId** | `creator-m1-l1-why-content` |
| **pathId** | `creator` |
| **Canonical draft** | [`creator-m1-l1-why-content.canonical.md`](creator-m1-l1-why-content.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/creator-m1-l1-why-content.ts` |
| **Production route** | `/learn/creator/creator-m1-l1-why-content` |

### oneAha

Content is a **system** — audience + problem + repeatable format — not random posting.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| وضوح الوعد / promise clarity | **60%** | Specific audience; clear understandable problem |
| قابلية التكرار / repeatability | **40%** | Chosen content type is repeatable consistently |

**Mission intent:** Write content promise — who, problem, repeatable type, one-sentence pledge (practice, not test).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Daily posts with different shapes and no direction — best corrective step? |
| **Correct answer** | Define clear **content promise** and choose **repeatable content type** |
| **correctIndex** | `1` |
| **Reasoning** | Real improvement starts from promise clarity and repeatable pattern — not posting volume |

### MSA canonical summary

Neutral MSA draft: content system vs random posting; Content System, Content Promise, Repeatable Format glossed in §4. AI helps ideas — learner judges fit. Video/screenshot = production Bunny/assets reference only. Next PATHS: `creator-m1-l2-attention-economy`. Prerequisite: none (path entry).

### Known audit notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-04.
- **All five pilot lessons:** human read-aloud / MSA naturalness review still required.
- Creator §5 future-generation notes are fuller than sibling pilot drafts (reference standard).

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

## Lesson 2 — `analyst-m1-l1-from-automation-to-insight`

| Field | Value |
|-------|-------|
| **lessonId** | `analyst-m1-l1-from-automation-to-insight` |
| **pathId** | `analyst` |
| **Canonical draft** | [`analyst-m1-l1-from-automation-to-insight.canonical.md`](analyst-m1-l1-from-automation-to-insight.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/analyst-m1-l1-from-automation-to-insight.ts` |
| **Production route** | `/learn/analyst/analyst-m1-l1-from-automation-to-insight` |

### oneAha

Having numbers ≠ knowing what to do — **Analyst asks** before opening any report.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| قرار واضح / clear decision | **60%** | Specific decision — not «look at numbers» only |
| سؤال مربوط / linked question | **40%** | Question tied to decision — if answered, learner knows next move |

**Mission intent:** Pick one table/dashboard/report; write one decision + one specific question + action if answered (practical, not complex analysis).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Many customers add to cart but don’t buy — best first data question? |
| **Correct answer** | **Where exactly** do customers abandon checkout (**funnel drop-off**)? |
| **correctIndex** | `2` |
| **Reasoning** | Specific question locates the problem in the purchase path; generic traffic metrics insufficient |

### MSA canonical summary

Neutral MSA draft: Automator collects — Analyst asks; Data vs Insight; decision loop diagram. Dashboard/video = production reference. Builder/Creator/Automator pipeline preserved. Next PATHS: `analyst-m2-l1-feeling-to-question`. Prerequisite: none (path entry).

### Known audit notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-04.
- **Gloss gaps in MSA §4:** `lead`, `CRM`, `Reach`, `funnel drop-off` — add Arabic gloss on first use or confirm acceptable as pilot deferral.
- **§5 future generation notes thinner** than creator/prototype docs — not blocking.
- **All five pilot lessons:** human read-aloud / MSA naturalness review still required.
- §1 vs YAML `oneAha` wording differs slightly — both align with production intent; optional alignment in human review.

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

## Lesson 3 — `builder-m1-l1-what-is-llm`

| Field | Value |
|-------|-------|
| **lessonId** | `builder-m1-l1-what-is-llm` |
| **pathId** | `builder` |
| **Canonical draft** | [`builder-m1-l1-what-is-llm.canonical.md`](builder-m1-l1-what-is-llm.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/builder-m1-l1-what-is-llm.ts` |
| **Production route** | `/learn/builder/builder-m1-l1-what-is-llm` |

### oneAha

**LLM** = smart autocomplete for sentences — predicts language, does **not** guarantee truth.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| سؤال ورد حقيقي / question and answer | **50%** | Clear Q+A; question has verifiable fact |
| تحقّق وربط بالبناء / verification and build link | **50%** | Real verification step; links result to product responsibility for facts |

**Mission intent:** Ask AI one verifiable fact question; verify via source; note right/wrong and why it matters for users (~10 min).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Asked AI about yesterday’s news — confident wrong details. Closest cause? |
| **Correct answer** | Guesses from **old training data** — not connected to live news |
| **correctIndex** | `0` |
| **Reasoning** | AI predicts plausible text — does not verify news; plan fact-checking when building features |

### MSA canonical summary

Neutral MSA draft: LLM as autocomplete; Hallucination glossed; Google vs language-assistant comparison; optional Builder path called out. Product names (ChatGPT, Gemini, Claude) mirror production. Video/screenshot = production reference. Next PATHS: `builder-m1-l2-tokens-training`. Prerequisite: none (path entry).

### Known audit notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-04.
- **§5 future generation notes thinner** than creator/prototype docs — not blocking.
- **All five pilot lessons:** human read-aloud / MSA naturalness review still required.

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

## Lesson 4 — `business-m2-l1-customer-lifecycle`

| Field | Value |
|-------|-------|
| **lessonId** | `business-m2-l1-customer-lifecycle` |
| **pathId** | `business` |
| **Canonical draft** | [`business-m2-l1-customer-lifecycle.canonical.md`](business-m2-l1-customer-lifecycle.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/business-m2-l1-customer-lifecycle.ts` |
| **Production route** | `/learn/business/business-m2-l1-customer-lifecycle` |

### oneAha

Customer is a **journey** through 5 stages — AI helps each stage when you know the **weak one**.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| رحلة واقعية / realistic journey | **60%** | Five stages tied to learner business — not generic definitions |
| تشخيص الضعف / weakness diagnosis | **40%** | Specific weak stage with logical reason |

**Mission intent:** Map real customer through Awareness → Advocacy; name weakest stage and why — honest map, not full campaign.

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | 100 new customers/month — only 15 return. Best first focus? |
| **Correct answer** | Improve **Retention** — why buyers don’t come back |
| **correctIndex** | `1` |
| **Reasoning** | New acquisition often costlier than retaining existing; fix return rate before more ads |

### MSA canonical summary

Neutral MSA draft: five lifecycle stages (Awareness, Consideration, Purchase, Retention, Advocacy); Customer Journey and Weakest Stage glossed; ads vs fix-leak comparison. Diagram/video = production reference. Next PATHS: `business-m2-l2-build-your-offer`. Prerequisite: `business-m1-l2-reactive-vs-proactive`.

### Known audit notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-04 (prerequisite + nextLessonId verified).
- **§5 future generation notes thinner** than creator/prototype docs — not blocking.
- **All five pilot lessons:** human read-aloud / MSA naturalness review still required.

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

## Lesson 5 — `automator-m1-l1-where-you-are`

| Field | Value |
|-------|-------|
| **lessonId** | `automator-m1-l1-where-you-are` |
| **pathId** | `automator` |
| **Canonical draft** | [`automator-m1-l1-where-you-are.canonical.md`](automator-m1-l1-where-you-are.canonical.md) |
| **Source production file (read-only)** | `src/components/intro/lessons/automator-m1-l1-where-you-are.ts` |
| **Production route** | `/learn/automator/automator-m1-l1-where-you-are` |

### oneAha

**Virtual worker** saves time — but **Time Audit** first to find repeating tasks.

### Mission rubric (production weights — must match)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| ٥ مهام بأرقام / five tasks with numbers | **60%** | Each task has frequency and minutes; weekly total calculated |
| قرار أولوية / priority decision | **40%** | Biggest waste + simplest task identified; first automation choice has logical reason |

**Mission intent:** Observation not building — list 5 repeating weekly tasks with times; pick first automation candidate with reason (10–15 min).

### Quiz key (must match production)

| Field | Value |
|-------|-------|
| **Question** | Sara sends manual welcome emails — 30 min/day. Best step before opening any automation tool? |
| **Correct answer** | **Count the task**, its time, and weekly frequency — confirm it’s a priority |
| **correctIndex** | `0` |
| **Reasoning** | Audit first — when «welcome email» = 30 min/day, that’s the first virtual-worker candidate |

### MSA canonical summary

Neutral MSA draft: Automator as virtual worker; Time Audit and Workflow glossed; Make/Zapier/n8n and Flow preserved from production; Builder/Creator bridge. Journey-map screenshot = production reference. Next PATHS: `automator-m2-l1-systems-view`. Prerequisite: none (path entry).

### Known audit notes / issues

- Draft self-assessment only — not a human pass.
- Slug validation passed 2026-06-04.
- **§5 future generation notes thinner** than creator/prototype docs — not blocking.
- **All five pilot lessons:** human read-aloud / MSA naturalness review still required.

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

Complete after all five lessons reviewed:

| Field | Value |
|-------|-------|
| **All five decisions recorded?** | ☐ yes · ☐ no |
| **Any rejections?** | ☐ yes · ☐ no |
| **Next controlled batch authorized?** | ☐ yes · ☐ no — **only if all approve/approve-with-notes and owner confirms; not production localization** |
| **Owner name** | |
| **Date** | |
| **Owner sign-off** | |

---

*Packet owner: Masaarat curriculum architecture · Human review required · No agent sign-off.*
