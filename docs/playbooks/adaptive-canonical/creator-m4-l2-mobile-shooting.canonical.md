# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m4-l2-mobile-shooting` |
| **pathId** | `creator` |
| **moduleId** | `creator-m4` |
| **productionTitle (ar-EG)** | التصوير بالموبايل |
| **productionRoute** | `/learn/creator/creator-m4-l2-mobile-shooting` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m4-l2-mobile-shooting.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Four basics — light, sound, framing, first seconds — beat waiting for expensive gear |
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
| `creator-m4-l2-mobile-shooting.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Mobile phone can produce professional video when light, sound, framing, and opening seconds are set first |
| **Mission rubric** | 60% basics commitment · 40% strong opening |
| **Quiz intent** | Best pre-record order — set light/sound/framing then write Hook (correctIndex 1) |
| **Concepts locked** | Framing, Hook, Ambient Noise |
| **Prerequisite** | `creator-m4-l1-reality-check` |
| **Next lesson** | `creator-m4-l3-ai-writing` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m4-l2-mobile-shooting
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m4-l2-mobile-shooting.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Mobile Shooting
  oneAha: "Four basics — light, sound, framing, first seconds — beat waiting for expensive gear"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m4-l1-reality-check]

objectives:
  - id: obj-1
    statement: Learner sets light, sound, and framing before recording on a mobile phone.
    measurable: true
  - id: obj-2
    statement: Learner opens with a clear Hook that delivers value in the first seconds.
    measurable: true

concepts:
  - id: concept-framing
    term: Framing
    termEn: Framing
    definition: How you arrange yourself in the frame so the eye rests and understands quickly.
    mustPreserve: true
  - id: concept-hook
    term: Hook
    termEn: Hook
    definition: The first sentence that keeps the viewer watching.
    mustPreserve: true
  - id: concept-ambient-noise
    term: Ambient Noise
    termEn: Ambient Noise
    definition: Background noise that can drown out speech.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Phone can produce pro video — focus on four basics only
  - role: tension
    intent: Strong content lost when face is dark, sound bad, or start is slow
  - role: core
    intent: Light in front, quiet place, stable phone, Hook in first seconds
  - role: comparison
    intent: Waiting for perfect gear vs simple mobile setup and regular posting
  - role: glossary
    intent: Framing, Hook, Ambient Noise
  - role: video
    intent: Quick mobile shooting steps — production Bunny unchanged
  - role: screenshot
    intent: Simple setup — light in front, stable phone, strong start
  - role: quiz
    intent: Best pre-record order — basics then Hook (correctIndex 1)
  - role: mission
    intent: Record 60-second video or write shoot-ready script with basics
  - role: confidence_close
    intent: Quality is not luxury nor complexity — start simple today

mission:
  type: practice
  intent: Choose record or script path — fill one with light, sound, framing, and Hook
  rubricIntent:
    - dimension: basics_commitment
      weight: 60
      criteria: Record or script path complete — light, sound, framing described clearly
    - dimension: strong_opening
      weight: 40
      criteria: Clear Hook serving the idea from first seconds
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_shoot_setup_for_learner

termsLocked: [Framing, Hook, Ambient Noise]

links:
  nextLessonId: creator-m4-l3-ai-writing
  continuityNote: AI as writing assistant next — draft then edit by hand

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

- **ماذا ستفهم؟** **هاتفك** **يستطيع** أن **يُنتج فيديو محترمًا** — **المشكلة ليست** **غياب كاميرا غالية**.
- **المشكلة** في **أساسيات التصوير** — **اليوم** **نركّز** على **أربعة أمور فقط:** **النور**، **الصوت**، **الكادر**، **وأول ثوانٍ**.

### Tension — المشكلة

- **محتوى قوي** **قد يضيع** بسبب **وجه مظلم**، **صوت مزعج**، أو **بداية بطيئة**.
- **الجمهور** **يمنح الفيديو ثوانٍ قليلة** **ليقرّر** **هل يكمل أم يتخطّى**.

### Core idea — اضبط الأساسيات قبل أي مؤثرات

- **النور:** **اجعل المصدر أمامك** **لا خلفك** — **النافذة** **غالبًا** **أفضل حل مجاني**.
- **الصوت:** **المكان الهادئ مهم جدًا** — **قرب الميكروفون من فمك** **يُحدث فرقًا واضحًا**.
- **الكادر (Framing):** **ثبّت الهاتف** — **اجعل العين قريبة من مستوى العدسة**.
- **أول ثوانٍ:** **ابدأ بجملة واضحة** **تُوصل قيمة الفيديو فورًا** — **لا مقدمة طويلة**. هذه **Hook (خطاف)** **تشدّ المشاهد**.

### Comparison — تعقيد زائد أم تنفيذ بسيط؟

| الأسلوب المعطّل | الأسلوب العملي |
|-----------------|----------------|
| **انتظار معدات مثالية** **قبل البدء** — **تبقى مؤجلًا** **ولا ينزل محتوى** | **تصوير بالهاتف** **بإضاءة وصوت وكادر مضبوطين** — **ونشر منتظم** |

### Glossary — ٣ مصطلحات سريعة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Framing (الكادر)** | **طريقة ترتيبك** **داخل الإطار** **حتى يرتاح العين** | **رأسك غير مقطوع** **ومساحة بسيطة فوقك** |
| **Hook (خطاف)** | **أول جملة** **تشدّ المشاهد** **ليكمل الفيديو** | «**إن كان لديك دقيقة** **ستفهم أصل المشكلة**» |
| **Ambient Noise (ضوضاء الخلفية)** | **دوشة الخلفية** **التي قد تُضيع الكلام** | **صوت مروحة** **أو شارع عالٍ** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «تصوير سريع بالهاتف». **لا يُعاد توليده.** **خطوات قصيرة لتصوير أوضح** — **يمكنك تخطّي الفيديو** **والبدء بالمهمة مباشرة**.

### Screenshot block (intent)

لقطة بصرية — **إعداد تصوير عملي**. **تجهيز بسيط يُحدث فرقًا:** **نور أمامك**، **هاتف ثابت**، **وبداية قوية من أول ثانية**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **قبل** **تسجيل فيديو ٦٠ ثانية بالهاتف** — **أي ترتيب** **أفضل للبداية؟**

- خيار ١: **أبدأ التصوير فورًا** **ثم أراجع الصوت والنور**.
- **الإجابة الصحيحة (خيار ٢):** **أضبط النور والصوت والكادر** — **ثم أكتب أول جملة Hook**.
- خيار ٣: **أركّز على الفلتر أولًا** **ثم أراجع المحتوى**.

**التفسير:** **الترتيب الصحيح** **يضمن** **أن الأساسيات تخدم المحتوى** — **لا أن تعطل الرسالة**.

### Mission — سجّل فيديو ٦٠ ثانية أو اكتب سكريبته

**المقدمة:** **اختر مسارًا واحدًا:** **تسجيل فيديو ٦٠ ثانية فعلي**، **أو كتابة سكريبت تصوير جاهز للتنفيذ** **بنفس القواعد**.

**التسليم:** Hook · إعداد النور · إعداد الصوت · وصف الكادر · المحتوى أو وصف التسجيل

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| التزام الأساسيات | 60% | **مسار التسجيل أو السكريبت مكتمل** — **النور والصوت والكادر موصوفون بوضوح** |
| بداية قوية | 40% | **Hook واضح** **يخدم الفكرة من أول ثوانٍ** |

### Confidence close

- **فهمت:** **جودة الفيديو** **ليست رفاهية** — **لكنها أيضًا لا تحتاج تعقيدًا**.
- **تستطيع:** **ابدأ نسخة بسيطة اليوم** — **والتحسين يأتي مع التكرار**.
- **التالي:** **AI كمساعد كتابة** — **مسودة ثم تعديل بيدك**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Framing**, **Hook**, **Ambient Noise** preserved as termsLocked — gloss on first use in each locale. Deferred: Bunny · Remotion · RAG · runtime. Mission remains record-or-script practice — assistants must not fill shoot setup or Hook for the learner.

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
| Concept preservation | 5 | Framing, Hook, Ambient Noise only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — basics then Hook |
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
