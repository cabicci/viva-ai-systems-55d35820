# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m2-l1-know-audience` |
| **pathId** | `creator` |
| **moduleId** | `creator-m2` |
| **productionTitle (ar-EG)** | اعرف جمهورك فعلًا |
| **productionRoute** | `/learn/creator/creator-m2-l1-know-audience` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m2-l1-know-audience.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | One clear audience beats speaking to everyone — audience sentence + 3 pains |
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
| `creator-m2-l1-know-audience.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Define who you speak to — clearer audience = sharper message and higher engagement |
| **Mission rubric** | 50% audience clarity · 50% pain quality |
| **Quiz intent** | «Everyone interested in content» — fix with one audience sentence + 3 core pains |
| **Concepts locked** | Persona, Pain Point, Audience Sentence |
| **Prerequisite** | `creator-m1-l2-attention-economy` |
| **Next lesson** | `creator-m2-l2-content-pillars` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m2-l1-know-audience
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m2-l1-know-audience.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Know Your Audience
  oneAha: "One clear audience beats everyone — audience sentence + 3 real pains"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m1-l2-attention-economy]

objectives:
  - id: obj-1
    statement: Learner explains that speaking to everyone reaches no one; focus increases clarity and engagement.
    measurable: true
  - id: obj-2
    statement: Learner writes one audience sentence and 3 realistic pain points; picks first priority pain with reason.
    measurable: true

concepts:
  - id: concept-persona
    term: Persona
    termEn: Persona
    definition: A practical description of a representative person from your core audience.
    mustPreserve: true
  - id: concept-pain-point
    term: Pain Point
    termEn: Pain Point
    definition: A recurring problem that tires the audience and drives them to seek a solution.
    mustPreserve: true
  - id: concept-audience-sentence
    term: Audience Sentence
    termEn: Audience Sentence
    definition: One precise sentence that defines who you are addressing.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Biggest content shift = define who you speak to; clearer audience = sharper message
  - role: tension
    intent: Generic content feels not made for anyone — effort high, impact weak
  - role: core
    intent: One clear audience is focus not limitation; AI helps organize persona but learner decides
  - role: comparison
    intent: Generic for everyone vs targeted for one clear person with problems
  - role: glossary
    intent: Persona, Pain Point, Audience Sentence
  - role: video
    intent: How to define audience quickly — production Bunny unchanged
  - role: diagram
    intent: Audience persona map — person, problems, goal
  - role: quiz
    intent: «Everyone interested in content» — audience sentence + 3 pains (correctIndex 1)
  - role: mission
    intent: Write audience sentence + 3 pains in people's words; pick first priority pain
  - role: confidence_close
    intent: Clearer who and their pains; next = content pillars

mission:
  type: practice
  intent: Writing practice — one audience sentence + 3 real pains in people's language; first priority pain + why
  rubricIntent:
    - dimension: audience_clarity
      weight: 50
      criteria: Sentence is specific not vague; audience is imaginable as a clear person
    - dimension: pain_quality
      weight: 50
      criteria: Three pains are realistic and direct
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_audience_or_pains_for_learner

termsLocked: [Persona, Pain Point, Audience Sentence]

links:
  nextLessonId: creator-m2-l2-content-pillars
  continuityNote: Build content pillars — stop guessing, work from a stable system

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

- **ماذا ستفهم؟** أقوى **نقلة** في المحتوى تحدث عندما تحدّد **من** الشخص الذي تخاطبه فعلًا.
- **لماذا الآن؟** بعد **Attention Economy (اقتصاد الانتباه)** — كلما كان جمهورك **أوضح**، كانت رسالتك **أدق** وفرصة التفاعل **أعلى**.
- **ماذا بعد الدرس؟** ستكتب **جملة جمهور** واحدة و**٣ آلام** حقيقية.

### Tension — العمومية تضيع الرسالة

- إذا تحدّثت **إلى الجميع** — فأنت **لا تخاطب أحدًا** بعمق.
- عندما يكون الكلام **عامًا**، لا يشعر المتلقي أن المحتوى **صُنع له**.
- النتيجة: **مجهود كبير** — **تأثير ضعيف** ومتقطّع.

### Core idea — جمهور واحد واضح أفضل

- تحديد الجمهور **ليس تقليلًا للفرص** — بل **تركيز** يجعلك تصل بوضوح أسرع.
- **الذكاء الاصطناعي** قد يساعدك على ترتيب أفكار **Persona (شخصية الجمهور)** — لكن قرار **من** جمهورك الحقيقي يجب أن يخرج من **ملاحظتك** وخبرتك.
- **Audience Sentence (جملة الجمهور):** جملة واحدة دقيقة تعرّف **من** تخاطب.

### Comparison — رسالة عامة أم موجّهة؟

| محتوى عام | محتوى موجّه |
|-----------|-------------|
| يحاول أن يناسب **الجميع** — فغالبًا **لا يلمس** أحدًا بعمق | مبني **لشخص واضح** بمشكلاته — أقرب للفهم والتفاعل |

### Glossary — ٣ مصطلحات مهمة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Persona (شخصية الجمهور)** | وصف **عملي** لشخص تمثيلي من جمهورك الأساسي | موظف مبتدئ يحتاج حلولًا سريعة بعد العمل |
| **Pain Point (نقطة ألم)** | **مشكلة متكرّرة** تُتعب الجمهور ويدور على حل | ليس لديه وقت لتنفيذ خطة معقّدة |
| **Audience Sentence (جملة الجمهور)** | **جملة واحدة** دقيقة تعرّف من تخاطب | «أخاطب أصحاب مشاريع صغيرة يريدون محتوى بسيطًا يجذب عملاء» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تحدّد جمهورك بسرعة». **لا يُعاد توليده.**

### Diagram block (intent)

**خريطة شخصية الجمهور** — الرسم يجمع الصورة كاملة: **الشخص**، **مشاكله**، **هدفه** الذي يبحث عنه. (معرّف الإنتاج: `audience-persona`.)

### Quiz — تأكيد سريع

**السؤال:** شخص يقول: «جمهوري **كل** المهتمين بالمحتوى». ما **أفضل تعديل** عملي؟

- خيار ١: يتركها عامة ليصل لعدد أكبر.
- **الإجابة الصحيحة (خيار ٢):** يكتب **جملة جمهور واحدة واضحة** ويحدّد **٣ آلام أساسية**.
- خيار ٣: يركّز على تغيير ألوان التصميم.

**التفسير:** وضوح **جملة الجمهور** و**الآلام الأساسية** هو ما يجعل الرسالة **دقيقة** و**قابلة للتنفيذ**.

### Mission — صياغة جمهورك في جملة

**المقدمة:** المهمة **تدريب كتابة** — **ليس اختبارًا**. المطلوب: **جملة جمهور** واضحة + **٣ آلام** حقيقية **بلسان الناس**.

**التسليم:**

1. جملة الجمهور: «أنا أخاطب [من بالضبط]»
2. الألم ١ · الألم ٢ · الألم ٣
3. جملة ختامية: **أكثر ألم** ستركّز عليه أولًا **ولماذا**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الجمهور | 50% | الجملة محدّدة وليست فضفاضة؛ الجمهور قابل للتخيّل كشخص واضح |
| جودة الآلام | 50% | الآلام الثلاثة واقعية ومباشرة |

### Confidence close

- **فهمت:** تعريف **أدق** لمن تخاطب و**أوجاعه** الأساسية.
- **تستطيع:** **Audience Sentence** + **٣ Pain Points** — جاهزة للخطوة التالية.
- **التالي:** **Content Pillars (أعمدة المحتوى)** — تبني نظامًا ثابتًا بدل التخمين.

---

## 5. Future generation notes

Downstream locales from MSA only. **Persona**, **Pain Point**, **Audience Sentence** preserved as termsLocked. Diagram `audience-persona` remains production reference — no Remotion regen in this step. Deferred: Bunny · RAG · runtime.

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
| Concept preservation | 5 | Persona, Pain Point, Audience Sentence only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — audience sentence + 3 pains |
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

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
