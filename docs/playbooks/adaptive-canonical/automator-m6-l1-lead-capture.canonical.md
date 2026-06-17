# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m6-l1-lead-capture` |
| **pathId** | `automator` |
| **moduleId** | `automator-m6` |
| **productionTitle (ar-EG)** | استقبال Leads من Creator |
| **productionRoute** | `/learn/automator/automator-m6-l1-lead-capture` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m6-l1-lead-capture.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Every lead = instant record + reply + alert — nothing lost |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending** — not approved for production rollout, localization, or controlled batch scale until a named reviewer records scores and checklist sign-off. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `automator-m6-l1-lead-capture.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Draw lead capture workflow: trigger, save, reply, alert |
| **Mission rubric** | 60% سير كامل · 40% واقعية |
| **Quiz intent** | Each signup saved + auto welcome + alert — waiting loses leads |
| **Concepts locked** | Lead, Webhook, Trigger |
| **Prerequisites** | `automator-m5-l3-agents` |
| **Next lesson** | `automator-m6-l2-whatsapp-flow` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m6-l1-lead-capture
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m6-l1-lead-capture.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Lead Capture
  oneAha: "Every lead = instant record + reply + alert — nothing lost"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m5-l3-agents]

objectives:
  - id: obj-1
    statement: Draw lead capture workflow: trigger, save, reply, alert
    measurable: true

concepts:
  - id: concept-1
    term: Lead
    termEn: Lead
    definition: Person who showed interest but has not bought yet.
    mustPreserve: true
  - id: concept-2
    term: Webhook
    termEn: Webhook
    definition: Instant signal to automation when form submits.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you learn, why now, what after lesson
  - role: tension
    intent: Familiar problem from production Egyptian copy
  - role: core
    intent: One Aha and worked logic from production
  - role: comparison
    intent: Same contrast structure as production
  - role: glossary
    intent: termsLocked with first-use English gloss
  - role: video
    intent: Production Bunny reference only — no regen
  - role: screenshot
    intent: Visual intent from production block
  - role: quiz
    intent: Each signup saved + auto welcome + alert — waiting loses leads
  - role: mission
    intent: Draw lead capture workflow: trigger, save, reply, alert
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Draw lead capture workflow: trigger, save, reply, alert
  rubricIntent:
    - dimension: full_flow
      weight: 60
      criteria: 4 steps trigger save reply alert — complete
    - dimension: realism
      weight: 40
      criteria: Real channel + specific person alerted
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Lead, Webhook, Trigger]

links:
  nextLessonId: automator-m6-l2-whatsapp-flow
  continuityNote: WhatsApp Flow — smart replies with trust and consent

slugValidation:
  validatedAt: 2026-06-18
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pass
  missionRubric: pass
  quizAnswer: pass
```

---

## 4. Arabic MSA canonical lesson text
### Orientation — بداية الدرس

- **ماذا ستفهم؟** **Lead capture automation** يمنع ضياع المهتمين — تسجيل ورد وتنبيه.
- **لماذا الآن؟** جسر بين الاهتمام الخارجي ونظام عملك.

### Tension — «كان مهتمًا — ثم ضاع»

- فورم أو رسالة «أريد السعر» — رُئيت متأخرًا أو نُسيت.
- لا نظام يمسك كل **Lead (عميل محتمل)** فورًا.

### Core idea — كل lead = تسجيل + رد + تنبيه

- لحظة التسجيل → حفظ → رد ترحيب → تنبيه للمتابعة.
- **Webhook (إشعار فوري)** عند إرسال الفورم.

### Quiz — correctIndex: 1

- كل تسجيل يُحفظ + رد ترحيب + تنبيه — الانتظار = ضياع فرص.

### Mission

| سير كامل | 60% |
| واقعية | 40% |

### Confidence close

- **التالي:** **WhatsApp Flow**.

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — not from Egyptian directly. Mission rubric weights and quiz logic preserved. Deferred: Bunny · Remotion · RAG seed · runtime wiring.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Production concepts locked |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | — | **pending** |
| Concept preservation | — | **pending** |
| Beginner clarity | — | **pending** |
| MSA simplicity | — | **pending** |
| Mission consistency | — | **pending** |
| Quiz integrity | — | **pending** |
| Assistant boundaries | — | **pending** |
| Localization readiness | — | **pending** |

| Human reviewer average | **pending — not yet scored** |
| **Production-ready?** | **no** |

### Human reviewer sign-off

| Field | Value |
|-------|-------|
| **Reviewer** | **pending** |
| **Date** | **pending** |
| **Decision** | **pending** |
| **Controlled batch authorization** | **pending** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny / video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer score — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready stated | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
