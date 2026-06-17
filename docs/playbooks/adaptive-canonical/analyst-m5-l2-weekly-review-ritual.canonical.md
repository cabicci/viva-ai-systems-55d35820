# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `analyst-m5-l2-weekly-review-ritual` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m5` |
| **productionTitle (ar-EG)** | Review أسبوعي = ١٥ دقيقة |
| **productionRoute** | `/learn/analyst/analyst-m5-l2-weekly-review-ritual` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m5-l2-weekly-review-ritual.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Weekly review turns numbers into one decision — not a long report |
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
| `analyst-m5-l2-weekly-review-ritual.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Plan 30-min review: 4 numbers, 3 AI questions, one decision |
| **Mission rubric** | 60% ٤ أرقام + ٣ أسئلة · 40% قرار واحد |
| **Quiz intent** | Ask what changed + AI help interpret — then one decision |
| **Concepts locked** | Weekly Review, One Decision Rule |
| **Prerequisites** | `analyst-m4-automated-dashboard` |
| **Next lesson** | `analyst-m6-l1-question-mistakes` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m5-l2-weekly-review-ritual
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m5-l2-weekly-review-ritual.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Weekly Review Ritual
  oneAha: "Weekly review turns numbers into one decision — not a long report"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [analyst-m4-automated-dashboard]

objectives:
  - id: obj-1
    statement: Plan 30-min review: 4 numbers, 3 AI questions, one decision
    measurable: true

concepts:
  - id: concept-1
    term: Weekly Review
    termEn: Weekly Review
    definition: Fixed habit reading 4 numbers and one weekly decision.
    mustPreserve: true
  - id: concept-2
    term: One Decision Rule
    termEn: One Decision Rule
    definition: Review ends with one action — not long task list.
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
    intent: Ask what changed + AI help interpret — then one decision
  - role: mission
    intent: Plan 30-min review: 4 numbers, 3 AI questions, one decision
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Plan 30-min review: 4 numbers, 3 AI questions, one decision
  rubricIntent:
    - dimension: numbers_questions
      weight: 60
      criteria: Four metrics + three practical AI questions
    - dimension: one_decision
      weight: 40
      criteria: One decision with Action Owner Deadline
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Weekly Review, One Decision Rule]

links:
  nextLessonId: analyst-m6-l1-question-mistakes
  continuityNote: Question Mistakes — wrong question wastes time even with good data

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

- **ماذا ستفهم؟** **Weekly Review (ريفيو أسبوعي)** يحوّل الأرقام لقرار واحد — لا تقريرًا طويلًا.
- **لماذا الآن؟** بعد لوحة تتحدّث — تحتاج عادة ثابتة.

### Core idea — ٤ أرقام → ٣ أسئلة AI → قرار واحد

- **One Decision Rule (قرار واحد):** Action + Owner + Deadline.
- ٣٠ دقيقة — لا ساعتين.

### Quiz — correctIndex: 0

- «ماذا تغيّر؟» + AI للتفسير — ثم قرار واحد.

### Mission

| ٤ أرقام + ٣ أسئلة | 60% |
| قرار واحد | 40% |

### Confidence close

- **التالي:** **Question Mistakes**.

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
| Quiz integrity | 5 | correctIndex 0 unchanged |
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
