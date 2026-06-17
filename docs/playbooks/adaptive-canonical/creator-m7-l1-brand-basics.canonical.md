# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m7-l1-brand-basics` |
| **pathId** | `creator` |
| **moduleId** | `creator-m7-identity` |
| **productionTitle (ar-EG)** | Brand Basics — Colors, Fonts, Logo |
| **productionRoute** | `/learn/creator/creator-m7-l1-brand-basics` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m7-l1-brand-basics.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | People remember your stance before your colors — POV first, design supports it |
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
| `creator-m7-l1-brand-basics.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | POV sentence drives content — colors serve POV not replace it |
| **Mission rubric** | 50% POV clarity · 50% content translation |
| **Quiz intent** | When people cannot say what you stand for — define POV first (correctIndex 1) |
| **Concepts locked** | POV, Brand Promise, Consistency |
| **Prerequisite** | `creator-m6-l4-leads` |
| **Next lesson** | `creator-m7-l2-grid-consistency` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m7-l1-brand-basics
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m7-l1-brand-basics.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Brand Basics — Colors, Fonts, Logo
  oneAha: "People remember your stance before your colors — POV first, design supports it"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m6-l4-leads]

objectives:
  - id: obj-1
    statement: Learner writes one POV sentence that summarizes their stance in their field.
    measurable: true
  - id: obj-2
    statement: Learner gives two content examples guided by POV plus one sentence they will avoid.
    measurable: true

concepts:
  - id: concept-pov
    term: POV
    termEn: Point of View
    definition: Sentence that clarifies your distinct stance in your field.
    mustPreserve: true
  - id: concept-brand-promise
    term: Brand Promise
    termEn: Brand Promise
    definition: What the audience expects from you every time they follow.
    mustPreserve: true
  - id: concept-consistency
    term: Consistency
    termEn: Consistency
    definition: Steady message and tone over time.
    mustPreserve: true

blocks:
  - role: orientation
    intent: People remember stance not colors — POV in words choices presentation
  - role: tension
    intent: Pretty content no fingerprint — changing colors but no distinctive sentence
  - role: core
    intent: POV sentence first then colors serve it — steady POV connects topics
  - role: comparison
    intent: Visual-only brand vs POV-led brand
  - role: glossary
    intent: POV, Brand Promise, Consistency
  - role: video
    intent: Brand starts from POV — production Bunny unchanged
  - role: screenshot
    intent: Design serves core idea not replaces it
  - role: quiz
    intent: Define POV before visual tweaks (correctIndex 1)
  - role: mission
    intent: One POV sentence with two content examples and one rejected sentence
  - role: confidence_close
    intent: Brand has clear stance — every post passes POV test

mission:
  type: practice
  intent: Field and audience line, POV starting with I believe, two examples, one anti-POV sentence
  rubricIntent:
    - dimension: pov_clarity
      weight: 50
      criteria: Sentence specific and understandable not generic for anyone
    - dimension: content_translation
      weight: 50
      criteria: Two clear examples plus rejected sentence confirming stance
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_pov_for_learner

termsLocked: [POV, Brand Promise, Consistency]

links:
  nextLessonId: creator-m7-l2-grid-consistency
  continuityNote: Grid consistency next — visual pattern for new visitors

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

- **ماذا ستفهم؟** **الناس تتذكرك من موقفك** — **لا من ألوانك**.
- **الهوية البصرية مهمة** — **لكن الذي يجعل الناس تتذكرك فعلًا** **هو وجهة نظرك الثابتة** **في الموضوع الذي تتحدث فيه**.
- **هذا الدرس يركز على جوهر Brand (العلامة):** **موقف واضح** **يظهر في الكلام والاختيارات وطريقة تقديمك**.

### Tension — المشكلة

- **محتوى جميل شكلًا** **لكن بلا بصمة**.
- **كثير من صنّاع المحتوى** **يغيّرون ألوانًا وخطوطًا** — **لكن لا يُقال عنهم جملة واحدة مميزة**.
- **عندما موقفك غير واضح** — **يراك المتابع محتوى عامًا قابلًا للاستبدال** **حتى لو التصميم جميل**.

### Core idea — POV ثابت = ذاكرة أقوى

- **POV (Point of View — وجهة نظر)** **هي الجملة** **التي تلخص كيف ترى العالم في مجالك** — **وتجعل المحتوى كله يمشي في خط واحد**.
- **الألوان تخدم POV** **لا العكس**. **أولًا تعرف موقفك** — **ثم تختار شكلًا يخدمه**.
- **عندما يكون موقفك ثابتًا** — **حتى مواضيع مختلفة** **تبقى متصلة** **بنفس الهوية الذهنية عند الجمهور**.

### Comparison — براند شكلي أم براند بموقف؟

| براند شكلي فقط | براند بموقف واضح |
|----------------|------------------|
| **تصميم منظم** **لكن الرسالة تتغير كل يوم** — **الناس تحب الشكل** **لكن لا تعرف أين تقف** | **POV ثابت يقود المحتوى** **والتصميم يدعمه** — **الناس تتذكرك** **من طريقة التفكير قبل الشكل** |

### Glossary — مصطلحات تثبيت الهوية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **POV (وجهة نظر)** | **الجملة** **التوضّح موقفك المختلف في مجالك** | «**أنا ضد نصائح الإنتاجية السريعة** **وأفضّل أنظمة بسيطة قابلة للاستمرار**» |
| **Brand Promise (وعد العلامة)** | **الوعد** **الذي يتوقعه الجمهور منك كل مرة** | «**ستحصل على خطوات عملية** **قابلة للتنفيذ من دون تعقيد**» |
| **Consistency (اتساق)** | **ثبات الرسالة والنبرة مع الوقت** | **حتى مع اختلاف المواضيع** **الخط العام للموقف يبقى واضحًا** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «بناء براند يبدأ من POV». **لا يُعاد توليده.** **كيف تكتب موقفًا واحدًا** **يقود المحتوى كله**.

### Screenshot block (intent)

لقطة بصرية — **مثال عملي لهوية واضحة**. **الشكل يخدم الفكرة الأساسية** — **لا يأخذ مكانها**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **التصميمات عندك جميلة** **لكن الناس لا تستطيع قول** **بماذا أنت معروف** — **أول أولوية؟**

- خيار ١: **تغيير الألوان أسبوعيًا** **حتى تمسك أسلوبًا**.
- **الإجابة الصحيحة (خيار ٢):** **تحديد POV** **جملة واحدة واضحة** **قبل أي تعديل شكلي**.
- خيار ٣: **زيادة عدد المنشورات** **من دون تغيير الرسالة**.

**التفسير:** **الهوية الحقيقية تبدأ من وضوح موقفك**. **الشكل يدعم الرسالة** **لكن لا يعوّض غيابها**.

### Mission — اكتب جملة POV واحدة

**المقدمة:** **لب البراند:** **جملة موقف واحدة** **تكون مرجعًا لكل محتوى تنشره**.

**التسليم:** مجال + جمهور · جملة POV تبدأ بـ «أنا مؤمن أن…» · مثالان محتوى · **جملة واحدة لن تقولها لأنها ضد موقفك**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الـ POV | 50% | **الجملة محددة ومفهومة** — **ليست عامة لأي شخص** |
| ترجمتها للمحتوى | 50% | **مثالان واضحان + جملة مرفوضة** **تؤكد ثبات الموقف** |

### Confidence close

- **فهمت:** **لديك الآن الجملة** **التي تميزك** **حتى قبل أن يحفظ الناس اسمك أو ألوانك**.
- **تستطيع:** **كل محتوى جديد** **يجب أن يمرّ بسؤال واحد:** **هل يخدم موقفي أم لا؟**
- **التالي:** **Grid Consistency** — **اتساق البروفايل للزائر الجديد**.

---

## 5. Future generation notes

Downstream locales from MSA only. **POV**, **Brand Promise**, **Consistency** preserved as termsLocked. Deferred: Bunny · Remotion · RAG · runtime. Mission is learner's POV sentence — assistants must not invent POV for them.

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
| Concept preservation | 5 | POV, Brand Promise, Consistency only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — POV before visuals |
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
