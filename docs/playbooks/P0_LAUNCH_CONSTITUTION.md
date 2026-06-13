# P0 Launch Constitution — Masaarat (masaarat.ai)

**Status:** Active — official P0 operating model  
**Effective:** 2026-06-09  
**Scope:** Launch strategy, incident response, and hard boundaries for P0  
**Does not replace:** curriculum content, lesson bodies, or code — this is an operating constitution only.

---

## Official decision

> **Masaarat P0 Strategy = Aggressive Launch + Rapid Iteration**

We launch at the largest scale possible. We do not wait for perfection. Real user behavior is the primary validation source. Fixes happen rapidly after evidence from real users. No major curriculum restructuring during P0.

---

## A) Launch mode

### Official mode: **Aggressive Controlled Launch**

**Definition:** Large-scale launch with controlled risk — not a perfection-first launch.

| Principle | Meaning |
|-----------|---------|
| **Aggressive** | Maximize reach and real-user exposure as early as possible |
| **Controlled** | Security, trust, and honesty boundaries stay enforced; no broken-trust launches |
| **Not perfection-first** | Polish, visual freeze completion, and edge-case perfection do not gate first real users |

This mode complements — and operationalizes — the launch philosophy in `docs/VIVA_MASTER_BLUEPRINT.md`: ship when learning is clear and trustworthy; polish follows.

---

## B) P0 mission

### Primary goal: **Real-world validation**

P0 exists to learn from real learners, not to prove internal readiness in isolation.

### Success means evidence of:

| Signal | Why it matters |
|--------|----------------|
| **User signup** | Auth and onboarding funnel works end-to-end |
| **Intro start** | First-time users reach lesson 1 |
| **Lesson completion** | Content and flow are finishable |
| **Mission submission** | Core learning loop (do → submit) works |
| **Assistant usefulness** | AI support helps or surfaces clear failure modes |
| **Real friction discovery** | We learn what actually blocks users — not what we assume |

Internal persona sim, audits, and QA inform launch readiness but **do not override** live user evidence during P0.

---

## C) Launch rules

### Do

1. **Do not block launch for polish** — visual freeze gaps, typography sweeps, and non-trust-breaking UX imperfections ship after first users unless they are Critical.
2. **Fix after evidence, not assumptions** — prioritize issues observed in signup, intro, lessons, missions, assistant, or video playback.
3. **Intro-first validation priority** — validate the Intro path (7 lessons) before optimizing deep paths or Pro conversion.
4. **Honest early-access positioning** — product copy, footer, and account surfaces must reflect v0.1 / early access.
5. **Pro honesty ("coming soon")** — do not promise purchasable Pro until checkout exists; free tier and paywall must say payment is coming soon.
6. **No freeze-breaking during P0** — respect the 100-lesson curriculum freeze (see `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md`).
7. **Rapid iteration cadence** — ship fixes in small batches; observe; repeat.

### Do not

- Delay launch until visual freeze F8, full mobile pass, or video regeneration audit complete — unless a **Critical** trust or security issue appears.
- Restructure curriculum, rename slugs, or add/remove lessons during P0.
- Run major redesigns or invent new paths during P0.
- Break the 100-lesson learner freeze or re-include archived Business slugs without an explicit post-P0 decision.

---

## D) P0 KPIs

Track these from day one. Evidence beats intuition.

| KPI | What to measure |
|-----|-----------------|
| **Signup** | New accounts / signup completion rate |
| **Intro start** | Users who open `intro-m1-l1-what-is-ai` or equivalent first lesson |
| **Intro completion** | Users who finish all 7 Intro lessons |
| **Lesson progression** | Progress through PATHS order; drop-off by lesson slug |
| **Mission submit rate** | `mission_submissions` per active user |
| **Mission skip rate** | Skips vs passes; friction signal per lesson |
| **Assistant usage / failure** | Messages sent, 401/500 rates, empty or unhelpful replies |
| **Video issues** | Missing embed, blank iframe, skip-notice frequency |
| **Return rate** | D1 / D7 return to dashboard or next lesson |

**Primary tables / surfaces:** `learner_events`, `user_lesson_status`, `mission_submissions`, `client_error_logs`, dashboard analytics (`/analytics`), support inbox.

---

## E) Incident severity

| Severity | Definition | Response target |
|----------|------------|-----------------|
| **Critical** | Blocks signup, auth, intro lesson load, mission submit, or exposes data / internal content publicly | **Same day** |
| **High** | Breaks a core loop for many users (assistant down, paywall lie, widespread video failure, progression dead-end) | **24–72 hours** |
| **Medium** | Friction, copy mismatch, non-blocking UX, observability gaps, polish | **Batch later** (post first 72h observation window) |

Escalation and operational steps: see `docs/RUNBOOK.md`. Security launch blockers (workbook leak, public persona-sim, missing legal pages, unguarded admin routes) were closed in Batch A1/A2 — **regression to those patterns is Critical**.

---

## F) P0 hard boundaries

### No (during P0)

| Boundary | Rationale |
|----------|-----------|
| Curriculum restructuring | 100-lesson architecture is frozen |
| Lesson count changes | Learner path = 100; registry may hold 104 with 4 archived |
| Slug renames | Breaks routes, RAG seed, video registry alignment |
| Major redesign | Invalidates user learning and iteration signal |
| Path invention | New paths require architecture decision + post-P0 work |

### Keep

- **100-lesson learner freeze** — `PATHS ∩ INTRO_LESSON_CONTENT` = 100 shipped lessons.
- **4 archived Business slugs excluded** from learner path and RAG seed:
  - `business-m1-l3-ai-thinking-partner`
  - `business-m2-l4-pricing-cash-flow`
  - `business-m3-l4-hiring-onboarding`
  - `business-m4-l5-business-os-dashboard`
- **Assistant P0 assumptions** — RAG seed = 100 learner slugs only; no Builder fallback; semantic retrieval + grounding hardening frozen per Assistant P0.2.
- **Launch blocker closure** — admin-only internal tools; legal draft pages live; no public persona-sim URLs.

Full freeze contract: `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md`.

---

## G) Launch sequence

```
1. Big launch          → Aggressive Controlled Launch at max reach
2. Observe 72 hours    → Watch P0 KPIs; collect friction; no panic refactors
3. Rapid fixes         → Critical same-day; High within 24–72h; evidence-driven batches
4. P1 improvements     → Medium items, visual freeze continuation, payments, progression hardening
```

**First 72 hours:** prioritize observation and Critical/High fixes only. Resist curriculum or architecture changes unless a Critical trust failure forces a hotfix.

---

## H) Consistency with project docs

This constitution must stay aligned with:

| Document | Alignment |
|----------|-----------|
| `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md` | 100-lesson freeze, archived Business exclusion, RAG scope |
| `docs/playbooks/CURRICULUM_ARCHITECTURE_DECISION.md` | 100-lesson architecture decision |
| `docs/VIVA_MASTER_BLUEPRINT.md` | Beginner-first, trust-before-polish philosophy |
| `docs/MASTER_PROJECT_TRACKER.md` | Launch readiness tracking; blocker status |
| `docs/RUNBOOK.md` | Incident response and rollback |
| `docs/playbooks/ASSISTANT_REALITY_AUDIT.md` | Assistant P0 frozen scope |

If this document conflicts with the **Curriculum Freeze Contract** on lesson counts or slug policy, **the Freeze Contract wins** for content boundaries. This document wins for **launch timing and iteration cadence**.

---

## Quick reference card

```
Mode:     Aggressive Controlled Launch
Goal:     Real-world validation
Freeze:   100 learner lessons (104 registry − 4 archived Business)
Pro:      Honest "coming soon" until checkout
Fix:      After evidence → Critical same-day → High 24–72h → Medium batch
Sequence: Launch → 72h observe → rapid fix → P1
```

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-09 | Initial P0 Launch Constitution — Aggressive Launch + Rapid Iteration |
| 2026-06-04 | Status reconciliation: duplicate canonical fixed (`0d58a49`); standalone `/ai-assistant` auth-gated (`cc84946`); in-lesson assistant confirmed; `public/persona-sim` leak closed; Mega audit PASS WITH WARNINGS; Critical blockers = 0 |
