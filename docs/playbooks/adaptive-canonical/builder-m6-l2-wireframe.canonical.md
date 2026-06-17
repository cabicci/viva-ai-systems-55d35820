# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m6-l2-wireframe` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | Wireframe — ارسم قبل ما تبني |
| **productionRoute** | `/learn/builder/builder-m6-l2-wireframe` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l2-wireframe.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Wireframe = sketch before building — boxes and names, not colors |
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
| `builder-m6-l2-wireframe.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Wireframe prevents chaos; boxes + names before AI build |
| **Mission rubric** | 60% three screens described · 40% boxes not design |
| **Quiz intent** | Wireframe = boxes and names only (correctIndex 0) |
| **Concepts locked** | Wireframe, CTA |
| **Prerequisite** | `builder-m6-l1-idea-to-page` |
| **Next lesson** | `builder-m6-l3-first-prompt-to-lovable` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l2-wireframe
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l2-wireframe.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Wireframe — Sketch Before You Build
  oneAha: "Wireframe = sketch before building — boxes and names, not colors"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m6-l1-idea-to-page]

objectives:
  - id: obj-1
    statement: Learner explains Wireframe as structure-only sketch with CTA per screen.
    measurable: true
  - id: obj-2
    statement: Learner describes or draws 3 wireframe screens from prior User Flow.
    measurable: true

concepts:
  - id: concept-wireframe
    term: Wireframe
    termEn: Wireframe
    definition: Sketch — boxes with names, no design colors or images.
    mustPreserve: true
  - id: concept-cta
    term: CTA
    termEn: Call to Action
    definition: Main button the client should click.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Wireframe before build; describe 3 screens after lesson
  - role: tension
    intent: «Build UI» without map → 5 wrong tries
  - role: core
    intent: Boxes + names; 10 min sketch beats 3 hours rework
  - role: comparison
    intent: Vague build vs 7 named boxes
  - role: glossary
    intent: Wireframe, CTA
  - role: video
    intent: Boxes to interface — production Bunny unchanged
  - role: screenshot
    intent: Wireframe example — boxes not colors
  - role: quiz
    intent: No colors in wireframe (correctIndex 0)
  - role: mission
    intent: 3 wireframe screen lists with CTA
  - role: confidence_close
    intent: Ready for first Lovable prompt

mission:
  type: practice
  intent: Wireframe list for 3 screens from prior lesson — sections + CTA — ~10–15 min
  rubricIntent:
    - dimension: three_screens_described
      weight: 60
      criteria: Each screen bullet list not paragraph; clear CTA each screen
    - dimension: boxes_not_design
      weight: 40
      criteria: No colors or fonts — section names only; logical order
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_wireframe_for_learner

termsLocked: [Wireframe, CTA, User Flow]

links:
  nextLessonId: builder-m6-l3-first-prompt-to-lovable
  continuityNote: First Lovable prompt — goal + users + pages + style + constraints

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

- **ماذا ستفهم؟** **Wireframe (إطار سلكي / رسمة كروكية) = رسم قبل البناء** — **يمنع اللخبطة**.
- **لماذا الآن؟** **لديك User Flow** — **الآن حوّله إلى مربعات على ورقة**.
- **ماذا بعد الدرس؟** **ستصف أو ترسم ٣ شاشات** — **مربعات وأسماء، بدون ألوان**.

### Tension — «ابنِ واجهة» — فيخرج أي كلام

- **تطلب من AI أن يبني واجهة** — **فيخرج شيء عام ليس ما في ذهنك**.
- **تعدّل ٥ مرات**. **كل مرة تخمين جديد**. **٣ ساعات ضاعت**.
- **المشكلة: لم ترسم الخريطة أولًا**. **AI يخمّن — أنت يجب أن توضّح**.

### Core idea — الرسمة الكروكية تمنع اللخبطة

- **Wireframe = مربعات + أسماء** — **بدون ألوان ولا صور**.
- **هدفه يجيب**: **ماذا في أول الشاشة؟** **أين الزر الرئيسي؟** **ما ترتيب الأقسام؟**
- **ورقة وقلم في ١٠ دقائق > ٣ ساعات تعديل على واجهة خاطئة**.
- **عندما تصف Wireframe لـ AI** — **النتيجة أقرب من ذهنك من أول مرة**.

### Comparison — «ابنِ واجهة» vs «عندي ٧ مربعات»

| بدون Wireframe | مع Wireframe |
|----------------|--------------|
| «**ابنِ واجهة AI وصفات**» — **AI يخمّن. ٥ محاولات. ما زال غير مضبوط** | «**هيدر + مربع نص + زر «اقترح» + ٣ كروت وصفات**» — **AI يبني ما وصفته. أقرب من أول مرة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Wireframe (إطار سلكي)** | **رسم كروكي — مربعات بأسماء، بدون تصميم** | **مربع مكتوب فيه «مربع كتابة» + مستطيل «زر إرسال»** |
| **CTA (Call to Action — دعوة للفعل)** | **أهم زر — الذي يجب أن ينقره العميل** | «**ابدأ المحادثة**» أو «**اقترح وصفة**» — **واضح وكبير** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من مربعات إلى واجهة». **لا يُعاد توليده.**

### Screenshot block (intent)

**مربعات + أسماء**. **«هيدر»، «مربع نص»، «زر»، «٣ كروت»**. **هذه اللغة التي يفهمها AI**.

### Quiz — تأكيد سريع

**السؤال:** **تعمل Wireframe وتجد نفسك ترسم ألوانًا وصور أطباق. هل هذا صحيح؟**

- **الإجابة الصحيحة (خيار ١):** **لا — Wireframe مربعات وأسماء فقط، بدون تصميم**.
- خيار ٢: **نعم — هكذا AI يفهم أفضل**.
- خيار ٣: **لا — كان يجب صور حقيقية**.

**التفسير:** **Wireframe = هيكل وترتيب**. **الألوان والصور تأتي لاحقًا**.

### Mission — ارسم أو اوصف ٣ شاشات

**المقدمة:** **رسم أو وصف — ليس كودًا**. **استخدم ٣ شاشات من الدرس السابق**. **١٠–١٥ دقيقة**.

**التسليم:** **لكل شاشة قائمة Wireframe:**

- **[قسم]: [ماذا بداخله]**
- **CTA: [أهم زر]**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ شاشات موصوفة | 60% | **كل شاشة قائمة نقط — ليست فقرة**. **CTA واضح في كل شاشة** |
| مربعات لا تصميم | 40% | **لا ألوان ولا fonts — أسماء أقسام فقط**. **الترتيب منطقي — الأهم أولًا** |

### Confidence close

- **فهمت:** **Wireframe = رسمة كروكية تمنع الفوضى — قبل أي Prompt**.
- **تستطيع:** **٣ شاشات موصوفة — جاهزة لأول prompt**.
- **التالي:** **أول Prompt لـ Lovable** — **goal + users + pages + style + constraints**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Wireframe**, **CTA**, **User Flow** preserved. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Wireframe, CTA only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — boxes only |
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
| 6 | Mission rubric 60/40 | ☑ pass |
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
