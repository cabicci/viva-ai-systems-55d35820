# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m3-l2-strategic-operational-admin` |
| **pathId** | `business` |
| **moduleId** | `business-m3` |
| **productionTitle (ar-EG)** | Strategic / Operational / Admin |
| **productionRoute** | `/learn/business/business-m3-l2-strategic-operational-admin` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m3-l2-strategic-operational-admin.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Admin and operations eat strategy — AI lightens admin load so strategic work gets protected time |
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
| `business-m3-l2-strategic-operational-admin.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Three work types — strategic, operational, administrative; classify 8 recent tasks; pick one admin task for AI relief |
| **Mission rubric** | 60% realistic classification · 40% admin choice with AI help idea |
| **Quiz intent** | Monthly numbers review + margin decision → strategic — direction and pricing |
| **Concepts locked** | Strategic, Administrative |
| **Prerequisites** | `business-m3-l1-delegate-or-automate` |
| **Next lesson** | `business-m3-l3-system-then-people` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m3-l2-strategic-operational-admin
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m3-l2-strategic-operational-admin.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Strategic / Operational / Admin
  oneAha: "Reduce admin with AI so strategic work gets protected weekly block"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m3-l1-delegate-or-automate]

objectives:
  - id: obj-1
    statement: Learner distinguishes strategic, operational, and administrative work and AI role for each.
    measurable: true
  - id: obj-2
    statement: Learner classifies 8 recent/repeating tasks and picks one administrative task for AI relief with clear help idea.
    measurable: true

concepts:
  - id: concept-strategic
    term: Strategic
    termEn: Strategic
    definition: Work that sets business direction — not daily routine.
    mustPreserve: true
  - id: concept-administrative
    term: Administrative
    termEn: Administrative
    definition: Work that keeps the business running — but does not build new value alone.
    mustPreserve: true

blocks:
  - role: orientation
    intent: After delegate/automate — classify work types to allocate time
  - role: tension
    intent: Full week of admin — no strategic decision made
  - role: core
    intent: Strategic = direction/pricing/partnerships; Operational = delivery/quality; Admin = invoices/scheduling — AI helps admin most
  - role: glossary
    intent: Strategic; Administrative
  - role: video
    intent: Optional — work type distribution — production Bunny unchanged
  - role: comparison
    intent: 80% admin week vs AI-reduced admin with protected strategy block
  - role: diagram
    intent: SOA bars — if admin bar longest, pick one admin task for AI this week
  - role: quiz
    intent: Margin decision after monthly numbers → strategic
  - role: mission
    intent: Classify 8 tasks; pick one admin task for AI
  - role: confidence_close
    intent: Work type clarity; next = system then people / SOP

mission:
  type: practice
  intent: List 8 tasks from last two weeks or repeating; classify strategic/operational/admin; pick one admin task AI should lighten with help idea
  rubricIntent:
    - dimension: realistic_classification
      weight: 60
      criteria: Eight tasks from learner reality — not theoretical list
    - dimension: admin_choice
      weight: 40
      criteria: One admin task with clear AI help idea
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_tasks_or_classifications_for_learner

termsLocked: [Strategic, Administrative]

links:
  nextLessonId: business-m3-l3-system-then-people
  continuityNote: System then people — AI turns explanation into SOP before hiring

slugValidation:
  validatedAt: 2026-06-04
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

- **ماذا ستفهم؟** أصحاب الأعمال يعلقون عندما يأكل الإداري والتشغيلي الاستراتيجية — والذكاء الاصطناعي يخفّف الحمل الإداري.
- **لماذا الآن؟** بعد أن قررت ما تفوّضه وتؤتمته، يجب أن تعرف أنواع الشغل لتُوزّع وقتك صحيحًا.
- **ماذا بعد الدرس؟** ستصنّف ٨ مهام حديثة: **Strategic (استراتيجي)** / **Operational (تشغيلي)** / **Administrative (إداري)** — وتختار مهمة إدارية واحدة للذكاء الاصطناعي.

### Tension — موقف مألوف

- فواتير، ردود، تنسيق، ملفات — نهاية الأسبوع تكتشف أنك لم تفكر في التسعير ولا العرض ولا التوسّع.
- الإداري ضروري — لكن عندما يأخذ ٨٠٪ من الأسبوع، يتحرّك العمل ببطء حتى لو كنت «تعمل كثيرًا».
- الذكاء الاصطناعي يساعد أكثر في الإداري: تلخيص، ترتيب، مسودات. الاستراتيجية تحتاج وقتًا محميًا — ليس بقايا اليوم.

### Core idea — ٣ أنواع شغل — ولكل نوع دور للذكاء الاصطناعي

- **Strategic (استراتيجي):** اتجاه، تسعير، شراكات، عرض جديد — قرارات نادرة وعالية التأثير. الذكاء الاصطناعي شريك تفكير.
- **Operational (تشغيلي):** التوصيل، الجودة، خدمة اليوم — أنت أو الفريق تنفّذ. الذكاء الاصطناعي يساعد في **SOP (إجراء قياسي)** وتشخيص مشاكل.
- **Administrative (إداري):** فواتير، جدولة، أرشفة، ردود روتينية — أكثر مرشّح للذكاء الاصطناعي يختصر الوقت.
- **الهدف:** تقلّل الإداري حتى يأخذ الاستراتيجي بلوكًا محميًا في الأسبوع.

### Glossary — مصطلحان للتصنيف

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Strategic (استراتيجي)** | شغل يحدّد اتجاه العمل — ليس يوميًا روتينيًا | قرار دخول سوق جديد أو تغيير نموذج التسعير |
| **Administrative (إداري)** | شغل يُبقي العمل يمشي — لكنه لا يبني قيمة جديدة وحده | ترتيب ملفات، متابعة فواتير، نسخ بيانات بين جداول |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — توزيع أنواع الشغل. **لا يُعاد توليده**.

### Comparison — أسبوع إداري vs أسبوع متوازن

| ٨٠٪ إداري | إداري مخفّض بالذكاء الاصطناعي |
|-----------|-------------------------------|
| ردود وفواتير وجدولة. الاستراتيجية «غدًا» — وغدًا لا يأتي | الذكاء الاصطناعي يلخّص ويصوغ. ساعتان استراتيجية أسبوعيًا — قرار واحد فعلي يتحرّك |

### Diagram block (intent)

توزيع أنواع الشغل — Strategic · Operational · Admin. إذا كان العمود الإداري أطول من الباقي — ابدأ بمهمة إدارية واحدة للذكاء الاصطناعي هذا الأسبوع.

### Quiz — تأكيد سريع

**السؤال:** مراجعة أرقام الشهر وقرار تعديل هامش الربح. ما نوع هذا الشغل؟

- **الإجابة الصحيحة (correctIndex: 1):** **استراتيجي — قرار اتجاه وتسعير**
- **التفسير:** مراجعة الأرقام قد تبدأ إدارية — لكن قرار الهامش استراتيجي. يستحق وقتًا محميًا وشريك تفكير.

### Mission — صنّف ٨ مهام — واختار إدارية للذكاء الاصطناعي

**المقدمة:** اكتب ٨ مهام عملتها آخر أسبوعين (أو تتكرر). صنّف كل واحدة: استراتيجي / تشغيلي / إداري. اختر مهمة إدارية واحدة يخفّفها الذكاء الاصطناعي. ليس امتحان تصنيف — تشخيص وقتك.

**التسليم:** المهام ١–٨ + تصنيف · المهمة الإدارية المختارة · كيف يساعد الذكاء الاصطناعي (جملة أو جملتين).

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف واقعي | 60% | ٨ مهام من واقعك — ليست قائمة نظرية |
| اختيار إداري | 40% | مهمة إدارية واحدة مع فكرة مساعدة ذكاء اصطناعي واضحة |

### Confidence close

- **فهمت:** توزيع نوع الشغل يوضّح لماذا تضيع الاستراتيجية — والذكاء الاصطناعي يخفّف الإداري.
- **تستطيع:** تعرف ما تقلّله بالذكاء الاصطناعي لتفتح وقتًا للقرار.
- **التالي:** **System ثم People (النظام قبل الناس)** — والذكاء الاصطناعي يساعدك تحوّل الشرح إلى **SOP**.

---

## 5. Future generation notes

Downstream locales from MSA only. No new work-type frameworks introduced. Deferred: Bunny · Remotion · RAG · runtime.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user locale | Manual **always wins** |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Auto-suggest |
| 4 | Default | **Egyptian Arabic production** |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Strategic, Administrative only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

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
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged (correctIndex 1) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
