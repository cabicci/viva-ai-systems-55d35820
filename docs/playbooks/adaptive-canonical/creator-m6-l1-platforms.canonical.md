# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m6-l1-platforms` |
| **pathId** | `creator` |
| **moduleId** | `creator-m6-distribute` |
| **productionTitle (ar-EG)** | اختيار المنصات |
| **productionRoute** | `/learn/creator/creator-m6-l1-platforms` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m6-l1-platforms.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | One Primary Platform plus optional Echo — not everywhere at once |
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
| `creator-m6-l1-platforms.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Choose one Primary Platform by audience, format, and weekly capacity — optional Echo later |
| **Mission rubric** | 50% decision clarity · 50% selection logic |
| **Quiz intent** | Deep 8–12 min content → YouTube as primary (correctIndex 0) |
| **Concepts locked** | Primary Platform, Echo Platform, Native Format |
| **Prerequisite** | `creator-m5-l2-thumbnails-captions` |
| **Next lesson** | `creator-m6-l2-scheduling` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m6-l1-platforms
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m6-l1-platforms.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Choosing Platforms
  oneAha: "One Primary Platform plus optional Echo — not everywhere at once"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m5-l2-thumbnails-captions]

objectives:
  - id: obj-1
    statement: Learner picks one Primary Platform based on audience location, preferred format, and weekly commitment.
    measurable: true
  - id: obj-2
    statement: Learner documents one platform choice with three reasons and first implementation step this week.
    measurable: true

concepts:
  - id: concept-primary-platform
    term: Primary Platform
    termEn: Primary Platform
    definition: Main platform where you publish your best content version.
    mustPreserve: true
  - id: concept-echo-platform
    term: Echo Platform
    termEn: Echo Platform
    definition: Secondary platform that republishes primary content with light adjustment.
    mustPreserve: true
  - id: concept-native-format
    term: Native Format
    termEn: Native Format
    definition: Content shape the platform favors and promotes.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Start where audience attention is — strong in one place not everywhere
  - role: tension
    intent: Scattered across 4 platforms breaks consistency and learning
  - role: core
    intent: One Primary Platform by audience format capacity — Echo after 2 months
  - role: comparison
    intent: Scattered try-everything vs focused primary build
  - role: glossary
    intent: Primary Platform, Echo Platform, Native Format
  - role: video
    intent: How to choose first platform — production Bunny unchanged
  - role: diagram
    intent: Platforms grid by attention type — video fast, long explain, text
  - role: quiz
    intent: Deep long-form → YouTube primary (correctIndex 0)
  - role: mission
    intent: One primary platform with 3 reasons and first step this week
  - role: confidence_close
    intent: One platform decision = strong start — scheduling next

mission:
  type: practice
  intent: One primary platform decision with audience, format, capacity reasons and first step
  rubricIntent:
    - dimension: decision_clarity
      weight: 50
      criteria: One specific platform named not open options
    - dimension: selection_logic
      weight: 50
      criteria: Three reasons tied to audience format and realistic capacity
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_platform_for_learner

termsLocked: [Primary Platform, Echo Platform, Native Format]

links:
  nextLessonId: creator-m6-l2-scheduling
  continuityNote: Scheduling next — turn decision into sustainable rhythm

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

- **ماذا ستفهم؟** **ليس مطلوبًا** **أن تكون موجودًا في كل مكان**. **المطلوب** **أن تكون واضحًا وقويًا** **في مكان واحد** **يستمع إليك فيه الناس**.
- **اختيار المنصة الصحيح من البداية** **يوفر شهورًا من التجربة العشوائية** — **ويجعل مجهودك يظهر أسرع**.

### Tension — المشكلة

- **التشتت بين منصات كثيرة** **يكسر الاستمرارية**.
- **عندما تنشر في ٤ منصات** **بنفس الطاقة** — **غالبًا لا منصة تأخذ حقها**. **كل منصة** **لها Format (صيغة)** **وسلوك جمهور مختلف**.
- **النتيجة:** **لا تعرف ما نجح فعلًا** — **وتفقد الثقة** **رغم أن المشكلة في الاستراتيجية لا فيك**.

### Core idea — منصة رئيسية + صدى بسيط

- **اختر Primary Platform (منصة رئيسية) واحدة** **بناءً على ٣ أمور:** **أين جمهورك**، **صيغتك المفضلة**، **وقدرتك على الالتزام أسبوعيًا**.
- **بعد الالتزام شهرين** **على المنصة الرئيسية** — **يمكنك Echo Platform (منصة صدى)** **تعيد فيها نفس الفكرة** **بتعديل بسيط**.
- **قاعدة اليوم:** **القرار ليس «أين الترند؟»** — **بل «أين أبني علاقة حقيقية** **مع نفس الناس كل أسبوع؟»**

### Comparison — تفكير منتشر أم تفكير مركّز؟

| اختيار مشتت | اختيار مركّز |
|-------------|--------------|
| **أنزل كل يوم في منصة مختلفة** — **تعب عالٍ وتعلم بطيء** **ولا هوية واضحة** | **أركز على منصة واحدة أساسية** — **نظام نشر ثابت** **وبيانات أوضح ونمو أهدأ لكن مستمر** |

### Glossary — مصطلحات مهمة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Primary Platform (منصة رئيسية)** | **المنصة** **التي تضع فيها أفضل نسخ محتواك** | **إن كان جمهورك يتعلم من فيديوهات قصيرة** — **TikTok قد تكون الأساسية** |
| **Echo Platform (منصة صدى)** | **منصة ثانية** **تعيد فيها نشر محتوى الأساسية** **بتعديل بسيط** | **نفس فكرة الفيديو** **بعد قص وتعديل Caption** **تنزلها Reels** |
| **Native Format (صيغة أصلية)** | **شكل المحتوى** **الذي تحبه المنصة وتدفعه** | **منشور نصي قوي على LinkedIn** **أفضل من فيديو ضعيف منسوخ** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تختار المنصة الأولى». **لا يُعاد توليده.** **خطوات عملية** **حسب جمهورك وطاقتك الحالية**.

### Diagram block (intent)

مخطط بصري — **خريطة المنصات حسب نوع الانتباه**. **حدّد أين يتخذ جمهورك قراره أسرع:** **فيديو سريع**، **شرح أطول**، **أم محتوى نصي**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **تقدّم شروحات عميقة ٨–١٢ دقيقة** **وجمهورك يبحث عن تفاصيل قبل الشراء** — **ماذا تختار كمنصة رئيسية** **لأول ٦٠ يومًا؟**

- **الإجابة الصحيحة (خيار ١):** **YouTube**
- خيار ٢: **Instagram Stories فقط**
- خيار ٣: **X Threads فقط**

**التفسير:** **المحتوى العميق** **يحتاج منصة تسمح بوقت مشاهدة أطول وسياقًا كاملًا** — **وهذا يخدمه YouTube أوضح**.

### Mission — اختار منصة رئيسية واحدة ولِمَ

**المقدمة:** **قرار واحد واضح:** **منصة رئيسية واحدة الآن** — **مع سبب منطقي يجعلك تلتزم**.

**التسليم:** مجال + جمهور · المنصة · ٣ أسباب (جمهور · صيغة · وقت/طاقة) · أول خطوة هذا الأسبوع

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح القرار | 50% | **منصة واحدة محددة** — **لا خيارات مفتوحة** |
| منطق الاختيار | 50% | **الأسباب الثلاثة** **مرتبطة بالجمهور والصيغة والقدرة الواقعية** |

### Confidence close

- **فهمت:** **لديك الآن منطق واضح للاختيار** **بدل الحيرة**. **هذا أول حجر** **في بناء Creator System ثابت**.
- **تستطيع:** **في الدرس التالي** **تحوّل هذا القرار** **إلى جدول نشر قابل للاستمرار**.
- **التالي:** **الجدولة والاستمرارية** — **Batch + Calendar**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Primary Platform**, **Echo Platform**, **Native Format** preserved as termsLocked. Deferred: Bunny · Remotion · RAG · runtime. Mission is learner's platform decision — assistants must not choose the platform for them.

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
| Concept preservation | 5 | Primary, Echo, Native Format only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — YouTube for deep content |
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
