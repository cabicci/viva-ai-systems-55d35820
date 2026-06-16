# Curriculum Architecture Decision — مسارات (masaarat.ai)

> **Historical note:** This document may use legacy project names. Current public brand is **مسارات / masaarat.ai**. Use `docs/CURRENT_STATUS.md` and `docs/playbooks/P0_LAUNCH_CONSTITUTION.md` for current launch source of truth.

## Purpose

This document records the final curriculum architecture decision before any lesson rewrite or code implementation. It is the source of truth for lesson counts, track structure, slug policy, additions, removals, rewrite order, and risks.

**Status:** Architecture freeze (documentation only — no implementation in this step).

---

## 1. Decision Summary

The final recommended curriculum architecture is **100 lessons total**.

### Track structure

**Stage 00:**

- Intro

**Level 1 — AI User:**

- Business
- Creator
- Analyst

**Level 2 — AI Operator:**

- Automator

**Level 3 — AI Builder:**

- Builder

### Final lesson counts

| Track | Lessons |
|-------|--------:|
| Intro | 7 |
| Business | 13 |
| Creator | 19 |
| Analyst | 14 |
| Automator | 18 |
| Builder | 29 |
| **Total** | **100** |

---

## 2. Why 100 Lessons

### Current implemented platform (99 lessons)

| Track | Count |
|-------|------:|
| Intro | 7 |
| Business | 16 |
| Creator | 18 |
| Analyst | 12 |
| Automator | 17 |
| Builder | 29 |
| **Total** | **99** |

### Redesigned track proposal files (88 lessons, excluding Intro)

| Track | Count |
|-------|------:|
| Business | 12 |
| Creator | 18 |
| Analyst | 12 |
| Automator | 17 |
| Builder | 29 |
| **Path subtotal** | **88** |

### Net-new lessons (`missing-lessons-additions.md`)

| Slug | Track |
|------|-------|
| `business-m2-l2-build-your-offer` | Business |
| `creator-m4-repurposing` | Creator |
| `automator-m3-testing-automation` | Automator |
| `analyst-m4-automated-dashboard` | Analyst |
| `analyst-m5-ab-testing` | Analyst |

**Proposed path-only total after additions:** 88 + 5 = **93**

**Final platform total with Intro:** 93 + 7 = **100**

### Count reporting rule

- **93** = path tracks only (excludes Intro).
- **100** = full platform including Intro.
- Always state which denominator is used when comparing counts.

---

## 3. Slug Policy

**Do not mass-rename existing lesson slugs.**

Existing lesson slugs should stay stable unless there is a strong migration reason.

### Why

Mass slug renaming may break:

- Learner progress
- Mission state
- Lesson registry
- Routes
- Video mapping
- Remotion references
- Generated assets
- Analytics
- Future migration logic

### How to use redesigned proposal slugs

The redesigned proposal slugs are treated as **curriculum/content targets**, not forced implementation IDs.

**Only the 5 net-new lessons** should receive new slugs during implementation.

---

## 4. Additions

Add these 5 lessons later during implementation (not in this documentation step).

### Business

- **Slug:** `business-m2-l2-build-your-offer`
- **Position:** after customer lifecycle

### Creator

- **Slug:** `creator-m4-repurposing`
- **Position:** after editing

### Automator

- **Slug:** `automator-m3-testing-automation`
- **Position:** after error handling

### Analyst

- **Slug:** `analyst-m4-automated-dashboard`
- **Position:** after four numbers dashboard

- **Slug:** `analyst-m5-ab-testing`
- **Position:** after interpretation mistakes

---

## 5. Track Decisions

### Intro

**Decision:** Keep 7 lessons.

**Action:**

- Rewrite L2–L7 as one connected Intro curriculum using the pilot template and mission constitution.
- L1 (`intro-m1-l1-what-is-ai`) is already piloted and should be treated as the reference.

**Reason:**

Intro is the gate into all paths. It must become beginner-safe, confidence-building, and structurally aligned before large-scale persona testing.

---

### Business

**Decision:** Replace current Business arc with redesigned Business curriculum, plus the Offer lesson.

**Final count:** 13 lessons.

**Action:**

- Use redesigned Business as the main source.
- Compress or absorb useful ideas from removed current lessons where needed.

**Important absorption:**

- Pricing/cash-flow concepts may be partially absorbed into Offer or readiness lessons.
- Hiring/onboarding concepts may be partially absorbed into system-then-people.
- Business OS dashboard concepts may be partially absorbed into ecosystem/capstone framing.

**Reason:**

Current Business is too close to generic management. Redesigned Business has a clearer AI operating system narrative.

---

### Creator

**Decision:** Merge current Creator with redesigned Creator, plus Repurposing.

**Final count:** 19 lessons.

**Action:**

- Adopt redesigned ordering:
  - Attention Economy before Why Content
  - Hook/Script/CTA before Audience/Pillars if confirmed safe for flow
  - Add Repurposing after Editing
- Keep useful current/pilot content where stronger.

**Reason:**

Current and redesigned Creator are close in lesson count, but the redesigned arc has clearer movement toward a content system that produces leads.

---

### Analyst

**Decision:** Merge and expand.

**Final count:** 14 lessons.

**Action:**

- Use redesigned Analyst as the main conceptual spine.
- Add Automated Dashboard and A/B Test.
- Keep beginner-safe framing.
- Avoid assuming advanced tool readiness too early.

**Reason:**

Analyst should teach better decisions with numbers, not academic data analysis.

---

### Automator

**Decision:** Merge and add Testing.

**Final count:** 18 lessons.

**Action:**

- Use redesigned Automator framing: problem-first before tool-first.
- Add Testing after Error Handling.

**Reason:**

Automator must feel like saving real time, not learning n8n for its own sake.

---

### Builder

**Decision:** Keep current 29-lesson structure and slugs. Rewrite content shape using redesigned Builder.

**Final count:** 29 lessons.

**Action:**

- Do not renumber Builder slugs.
- Use redesigned hooks, promises, Aha, examples, and beginner-safe framing.

**Reason:**

Builder is Level 3 optional depth. Slug stability matters more here because renumbering scope is high-risk.

---

## 6. Removed / Merged Business Lessons

Current Business lessons that should **not** remain as standalone lessons:

| Current slug | Treatment |
|--------------|-----------|
| `business-m1-l3-ai-thinking-partner` | Merge into redesigned opening / leadership framing |
| `business-m2-l4-pricing-cash-flow` | Absorb lightly into Offer / readiness / scaling |
| `business-m3-l4-hiring-onboarding` | Absorb into system-then-people if needed |
| `business-m4-l5-business-os-dashboard` | Absorb into full ecosystem / capstone logic if needed |

---

## 7. Rewrite Order

Recommended order:

1. Architecture decision freeze (this document)
2. Intro connected rewrite plan
3. Intro L2–L7 content rewrite as one connected curriculum
4. Implement Intro rewrite in controlled waves
5. Business full rewrite package
6. Creator full rewrite package
7. Analyst full rewrite package
8. Automator full rewrite package
9. Builder rewrite package last

---

## 8. Important Principle

Content should be written as **connected curriculum packages**, not isolated lesson edits.

Implementation can happen in waves, but curriculum writing must respect the full path arc.

**Rule:**

- Plan/write at path level.
- Implement safely in smaller batches.

---

## 9. Risks

### Slug migration risk

Mass renaming can break progress, missions, videos, registry, and routes.

**Mitigation:** Keep current slugs for existing lessons.

### Count confusion

93 excludes Intro. 100 includes Intro.

**Mitigation:** Always report both path-only count and full-platform count.

### Business compression risk

Moving Business from 16 to 13 may lose useful operator topics.

**Mitigation:** Absorb useful parts into stronger redesigned lessons.

### Tool prerequisite risk

Analyst dashboard, A/B testing, Automator webhooks, and Builder database/security can overwhelm beginners.

**Mitigation:** Use beginner-safe framing and optional-depth notes.

### Copy vs implementation risk

Redesigned markdown may not map 1:1 to current code shape.

**Mitigation:** Use markdown as curriculum target, not direct file migration.

---

## 10. Next Step After This Document

After this document is reviewed and approved:

1. Commit this documentation file.
2. Start Intro Connected Rewrite Plan.
3. Do not rewrite random individual lessons before the connected Intro plan is approved.

---

## References

- `docs/VIVA_MASTER_BLUEPRINT.md`
- `docs/playbooks/P0_LAUNCH_CONSTITUTION.md`
- `docs/playbooks/LESSON_SHAPE_CONSTITUTION.md`
- `docs/playbooks/MISSION_CONSTITUTION.md`
- `docs/playbooks/MISSION_TARGET_DESIGN.md`
- `docs/playbooks/PILOT_TEMPLATE_DECISION.md`
- Redesigned track files (external): `*-track-curriculum.md`, `missing-lessons-additions.md`
