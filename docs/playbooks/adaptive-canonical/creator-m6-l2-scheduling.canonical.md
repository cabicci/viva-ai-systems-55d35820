# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m6-l2-scheduling` |
| **pathId** | `creator` |
| **moduleId** | `creator-m6-distribute` |
| **productionTitle (ar-EG)** | الجدولة والاستمرارية |
| **productionRoute** | `/learn/creator/creator-m6-l2-scheduling` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m6-l2-scheduling.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Consistency beats bursts — Batching plus Content Calendar with 3 posts weekly |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending.** It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `creator-m6-l2-scheduling.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Simple system — weekly Batching slot plus 3 fixed publish times on Content Calendar |
| **Mission rubric** | 50% schedule clarity · 50% feasibility |
| **Quiz intent** | 3 posts weekly with batch slot beats mood daily or wait for 10 perfect (correctIndex 1) |
| **Concepts locked** | Batching, Content Calendar, Cadence |
| **Prerequisite** | `creator-m6-l1-platforms` |
| **Next lesson** | `creator-m6-l3-analytics` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m6-l2-scheduling
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m6-l2-scheduling.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Scheduling and Consistency
  oneAha: "Consistency beats bursts — Batching plus Content Calendar with 3 posts weekly"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m6-l1-platforms]

objectives:
  - id: obj-1
    statement: Learner sets fixed weekly Batching slot and 3 publish times on Content Calendar.
    measurable: true
  - id: obj-2
    statement: Learner defines minimum fallback version for a compressed week.
    measurable: true

concepts:
  - id: concept-batching
    term: Batching
    termEn: Batching
    definition: Group same type of work in one session instead of daily fragments.
    mustPreserve: true
  - id: concept-content-calendar
    term: Content Calendar
    termEn: Content Calendar
    definition: Schedule with publish dates and content types planned ahead.
    mustPreserve: true
  - id: concept-cadence
    term: Cadence
    termEn: Cadence
    definition: Steady rhythm you maintain in publishing.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Consistency wins over bursts — 3 weekly posts beat one hot week then silence
  - role: tension
    intent: Daily what-to-post question exhausts — no calendar means unpredictable audience
  - role: core
    intent: Fixed batch slot plus 3 publish days — consistency beats bursts, sustainable before perfect
  - role: comparison
    intent: Random publish vs fixed prep day and 3 publish days
  - role: glossary
    intent: Batching, Content Calendar, Cadence
  - role: video
    intent: Build livable schedule — production Bunny unchanged
  - role: diagram
    intent: Weekly calendar — prep day reduces chaos, fixed publish builds trust
  - role: quiz
    intent: 3 weekly + batch slot (correctIndex 1)
  - role: mission
    intent: 3 post schedule plus batching slot and compressed-week minimum
  - role: confidence_close
    intent: You have a system not just intention — analytics next

mission:
  type: practice
  intent: Weekly plan — 3 posts, batch slot, post types, minimum fallback if week breaks
  rubricIntent:
    - dimension: schedule_clarity
      weight: 50
      criteria: Three publish times with clear day and time
    - dimension: feasibility
      weight: 50
      criteria: Realistic batch slot plus clear fallback if pressure hits
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_schedule_for_learner

termsLocked: [Batching, Content Calendar, Cadence]

links:
  nextLessonId: creator-m6-l3-analytics
  continuityNote: Simple analytics next — read signals not just views

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

- **ماذا ستفهم؟** **الاستمرارية تكسب** **أمام الدفعات**. **من ينجح في المحتوى** **ليس من ينشر مرة واحدة بقوة** — **بل من له إيقاع ثابت** **تعتاد عليه الناس**.
- **٣ منشورات أسبوعيًا بانتظام** **أقوى من أسبوع «نار»** **ثم أسبوعين غياب**.

### Tension — المشكلة

- **الحماس المؤقت** **يكسر خطتك**.
- **أغلب التعطيل يبدأ من سؤال يومي مرهق:** «**ماذا أنشر اليوم؟**» **عندما يتكرر كل يوم** — **القرار نفسه يصبح حملًا**.
- **من دون جدول واضح** — **حتى المحتوى الجيد يخرج متقطعًا** **والجمهور لا يعرف متى يتوقعك**.

### Core idea — نظام بسيط: Batch + Calendar

- **خصص Slot (فترة) أسبوعيًا ثابتًا** **للتصوير أو التحضير بالجملة** — **Batching (تجميع)** **يحل مشكلة الوقت** **بدل إطفاء حرائق يومية**.
- **بعد التحضير** — **ضع مواعيد نشر محددة مسبقًا:** **٣ مرات أسبوعيًا مثلًا**. **Content Calendar (جدول المحتوى)** **واضح**.
- **القاعدة:** **consistency beats bursts (الاستمرارية تتفوق على الدفعات)**. **كن قابلًا للاستمرار** **قبل أن تكون مثاليًا**. **Cadence (إيقاع)** **ثابت**.

### Comparison — إيقاع عشوائي أم إيقاع ثابت؟

| بدون نظام | بنظام واضح |
|-----------|------------|
| **انشر عندما تفرغ** — **أسبوع ٥ منشورات وأسبوع لا شيء** — **توتر وتراجع تفاعل** | **يوم تحضير ثابت + ٣ أيام نشر ثابتة** — **مجهود أقل وتوقع أعلى من الجمهور** |

### Glossary — مصطلحات التنفيذ

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Batching (تجميع)** | **تجمع نفس نوع الشغل** **في مرة واحدة** | **تصوير ٣ فيديوهات** **في جلسة واحدة** |
| **Content Calendar (جدول المحتوى)** | **جدول فيه مواعيد النشر** **وأنواع المحتوى مسبقًا** | **الإثنين نصيحة** — **الأربعاء قصة** — **الجمعة CTA خفيف** |
| **Cadence (إيقاع)** | **الإيقاع الثابت** **الذي تمشي عليه في النشر** | **٣ منشورات أسبوعيًا** **لمدة ٨ أسابيع متتالية** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تبني جدولًا قابلًا للحياة». **لا يُعاد توليده.** **خطوات عملية** **من دون احتراق**.

### Diagram block (intent)

مخطط بصري — **تقويم أسبوعي للنشر والتحضير**. **اليوم الثابت للتحضير يقلل الفوضى** — **وأيام النشر الثابتة تبني توقعًا وثقة**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **هدفك الاستمرارية** **ومتاح لك ٤ ساعات أسبوعيًا** — **أي خطة أقرب للنجاح على المدى الطويل؟**

- خيار ١: **أنشر يوميًا** **عندما يكون لدي مزاج**.
- **الإجابة الصحيحة (خيار ٢):** **أعمل ٣ منشورات أسبوعيًا** **بجدول ثابت + Slot batching**.
- خيار ٣: **أنتظر أسبوعًا كاملًا** **حتى أجهّز ١٠ منشورات مثالية**.

**التفسير:** **الخطة الثابتة القابلة للتنفيذ** **أفضل من خطط ضخمة صعبة الالتزام** — **وهذا جوهر الاستمرارية**.

### Mission — ابني جدول ٣ منشورات + Slot batching

**المقدمة:** **خطة أسبوعية واقعية:** **٣ منشورات ثابتة** **مع وقت تحضير واحد بالجملة**.

**التسليم:** المنصة · ٣ مواعيد نشر · Slot batching (يوم + مدة) · نوع كل منشور · **أقل نسخة تلتزم بها إن اختلط الأسبوع**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الجدول | 50% | **٣ مواعيد نشر محددة** **اليوم/الوقت بوضوح** |
| قابلية التنفيذ | 50% | **Slot batching واقعي** **+ بديل واضح عند الضغط** |

### Confidence close

- **فهمت:** **لديك الآن هيكل أسبوعي** **يعمل حتى في الأيام المزدحمة**. **هذا الفرق** **بين Creator هاوٍ وCreator منظّم**.
- **تستطيع:** **في الخطوة التالية** **تقرأ أرقامك صحًا** **لتطوّر الجدول بالمؤشرات لا بالمزاج**.
- **التالي:** **قراءة Analytics بسيطة** — **Watch Time · Save · Action**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Batching**, **Content Calendar**, **Cadence** preserved as termsLocked. Deferred: Bunny · Remotion · RAG · runtime. Mission is learner's weekly plan — assistants must not invent the schedule.

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
| Concept preservation | 5 | Batching, Content Calendar, Cadence only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — 3 weekly + batch slot |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | | pending |
| Concept preservation | | pending |
| Beginner clarity | | pending |
| MSA simplicity | | pending |
| Mission consistency | | pending |
| Quiz integrity | | pending |
| Assistant boundaries | | pending |
| Localization readiness | | pending |

| Human reviewer average | **pending — not scored** |
| **Production-ready?** | **no** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 50/50 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
