# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m3-l3-system-then-people` |
| **pathId** | `business` |
| **moduleId** | `business-m3` |
| **productionTitle (ar-EG)** | System الأول — الناس بعدين |
| **productionRoute** | `/learn/business/business-m3-l3-system-then-people` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m3-l3-system-then-people.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | People work better when the system is clear first — AI turns your explanation into a simple SOP; test before hiring |
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
| `business-m3-l3-system-then-people.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | System → SOP → test → people; write raw process, AI structures SOP, learner reviews |
| **Mission rubric** | 60% real process · 40% structured SOP outline |
| **Quiz intent** | Want help replying to customers → write SOP with AI, test a week, then delegate — not hire immediately |
| **Concepts locked** | SOP |
| **Prerequisites** | `business-m3-l2-strategic-operational-admin` |
| **Next lesson** | `business-m4-l1-premature-scaling` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m3-l3-system-then-people
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m3-l3-system-then-people.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: System Then People
  oneAha: "Raw explanation → AI SOP → test twice → then hire or delegate"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m3-l2-strategic-operational-admin]

objectives:
  - id: obj-1
    statement: Learner explains why hiring without SOP adds management load and repeat explanation.
    measurable: true
  - id: obj-2
    statement: Learner writes raw process explanation and produces AI-structured SOP outline with goal, steps, example, one exception.
    measurable: true

concepts:
  - id: concept-sop
    term: SOP
    termEn: SOP
    definition: Fixed way to execute a repeating task — anyone can follow it.
    mustPreserve: true

blocks:
  - role: orientation
    intent: After work-type classification — system before hiring
  - role: tension
    intent: Hired someone — explain same thing daily from memory
  - role: core
    intent: Four steps — raw write, AI SOP, test, then hire/delegate
  - role: glossary
    intent: SOP
  - role: video
    intent: Optional — system before hiring — production Bunny unchanged
  - role: comparison
    intent: People before system vs SOP then people
  - role: diagram
    intent: System → People order — test process before growing team
  - role: quiz
    intent: Customer replies help — SOP with AI, test week, then delegate
  - role: mission
    intent: Raw process → AI SOP outline → one thing still unclear
  - role: confidence_close
    intent: SOP ready to test; next = premature scaling trap

mission:
  type: practice
  intent: Choose one often-explained process; write raw explanation; use AI for SOP outline (goal, steps, example, exception); note one thing needing clarification
  rubricIntent:
    - dimension: real_process
      weight: 60
      criteria: Raw explanation from learner business — not generic example
    - dimension: structured_sop
      weight: 40
      criteria: Outline with clear steps — even if needs small edit
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_process_or_sop_for_learner

termsLocked: [SOP]

links:
  nextLessonId: business-m4-l1-premature-scaling
  continuityNote: Premature scaling — when growth breaks weak systems

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

- **ماذا ستفهم؟** الناس تعمل أفضل عندما يكون النظام واضحًا أولًا — والذكاء الاصطناعي يحوّل شرحك إلى **SOP (إجراء قياسي)** بسيط.
- **لماذا الآن؟** بعد أن صنّفت شغلك وفكّرت في التفويض، التوظيف من دون نظام يزيد الفوضى.
- **ماذا بعد الدرس؟** ستكتب عملية خام وتطلب من الذكاء الاصطناعي يحوّلها لمخطط **SOP** — وتراجعه.

### Tension — موقف مألوف

- موظف جديد يسأل «ماذا أفعل إذا قال العميل كذا؟» — وأنت ترد من الذاكرة. كل يوم نفس الشرح.
- هذا ليس فشل الموظف — بل غياب نظام. من دون **SOP**، كل توظيف يضيف شغل إدارة على رأسك.
- الذكاء الاصطناعي يأخذ شرحك العادي ويرتّبه: خطوات، متى، مثال، استثناء — أنت تراجع وتختبر قبل التوسّع.

### Core idea — نظام → SOP → اختبار → ناس

- **الخطوة ١:** اكتب العملية كما تشرحها لصديق — حتى لو كانت فوضوية.
- **الخطوة ٢:** الذكاء الاصطناعي يرتّبها **SOP:** هدف، خطوات مرقّمة، مثال، «إذا حدث كذا».
- **الخطوة ٣:** جرّب **SOP** بنفسك أو بمساعد مؤقت — عدّل ما ليس واضحًا.
- **الخطوة ٤:** بعد أن يعمل مرتين بنفس الجودة — فكّر في توظيف أو تفويض.

### Glossary — مصطلح واحد

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **SOP (إجراء قياسي)** | طريقة ثابتة لتنفيذ مهمة متكررة — أي شخص يستطيع اتباعها | «رد على استفسار السعر» — ٥ خطوات + قالب + متى تصعّد لصاحب العمل |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — النظام قبل التوظيف. **لا يُعاد توليده**.

### Comparison — توظيف بدون نظام vs SOP أولًا

| ناس قبل نظام | SOP ثم ناس |
|--------------|------------|
| كل موظف يعمل بطريقته. أنت في الوسط — توحّد، تراجع، وتعود Reactive | الذكاء الاصطناعي يساعدك توثّق. الموظف يتبع الخطوات — أنت تراجع الاستثناءات فقط |

### Diagram block (intent)

الترتيب: **System → People (نظام ثم ناس)**. **SOP** واحد واضح أقوى من موظفين بلا دليل. اختبر العملية قبل أن تكبّر الفريق.

### Quiz — تأكيد سريع

**السؤال:** تريد الاستعانة بشخص يرد على العملاء. ما أفضل ترتيب؟

- **الإجابة الصحيحة (correctIndex: 1):** **تكتب SOP للردود مع الذكاء الاصطناعي، تجربه أسبوعًا، ثم تفوّض**
- **التفسير:** النظام أولًا يقلّل الأخطاء والشرح المتكرر. الذكاء الاصطناعي يصوغ **SOP** — أنت تراجع وتختبر.

### Mission — من شرح خام إلى SOP

**المقدمة:** اختر عملية واحدة تشرحها لنفسك كثيرًا (رد عميل، تجهيز طلب، متابعة مورد). اكتبها بأسلوبك — ثم استخدم الذكاء الاصطناعي يحوّلها لمخطط **SOP** (هدف، خطوات، مثال، استثناء). الصق مخطط **SOP** في التسليم.

**التسليم:** اسم العملية · الشرح الخام (٥–١٠ أسطر) · مخطط SOP بعد الذكاء الاصطناعي · شيء واحد لا يزال يحتاج توضيحًا بعد المراجعة.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| عملية حقيقية | 60% | شرح خام من عملك — ليس مثالًا عامًا |
| SOP مرتب | 40% | مخطط فيه خطوات واضحة — حتى لو يحتاج تعديلًا بسيطًا |

### Confidence close

- **فهمت:** التوظيف من دون **SOP** يزيد شغلك — والذكاء الاصطناعي يسرّع توثيق النظام.
- **تستطيع:** لديك مخطط **SOP** لعملية واحدة جاهز للاختبار.
- **التالي:** **توسّع قبل الأوان** — ومتى يكون مبكرًا يكسر الأنظمة الضعيفة.

---

## 5. Future generation notes

Downstream locales from MSA only. No new SOP frameworks introduced. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | SOP only |
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
