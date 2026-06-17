# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m5-l2-frontend` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | واجهة التطبيق (Frontend) |
| **productionRoute** | `/learn/builder/builder-m5-l2-frontend` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l2-frontend.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Frontend = what you see — Backend = what works behind |
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
| `builder-m5-l2-frontend.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Distinguish Frontend (visible UI) from Backend (hidden work) |
| **Mission rubric** | 60% correct classification · 40% clear reason |
| **Quiz intent** | Text input box on screen = Frontend (correctIndex 0) |
| **Concepts locked** | Frontend, Backend |
| **Prerequisite** | `builder-m5-l1-transition` |
| **Next lesson** | `builder-m5-l3-backend-api` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l2-frontend
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l2-frontend.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Frontend (Application Interface)
  oneAha: "Frontend = what you see — Backend = what works behind"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l1-transition]

objectives:
  - id: obj-1
    statement: Learner defines Frontend vs Backend using visible vs hidden work.
    measurable: true
  - id: obj-2
    statement: Learner classifies 5 app parts as Frontend or Backend with reasoning.
    measurable: true

concepts:
  - id: concept-frontend
    term: Frontend
    termEn: Frontend
    definition: Everything on screen the client sees and interacts with.
    mustPreserve: true
  - id: concept-backend
    term: Backend
    termEn: Backend
    definition: Hidden work — receives request, talks to AI, returns response.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Frontend vs Backend; classify 5 parts after lesson
  - role: tension
    intent: «AI not responding» — is it look or work?
  - role: core
    intent: Restaurant analogy; ask what client sees vs what runs behind
  - role: comparison
    intent: Button won't click vs no response arrives
  - role: glossary
    intent: Frontend, Backend
  - role: video
    intent: Look vs work — production Bunny unchanged
  - role: screenshot
    intent: Inspect shows Frontend code
  - role: quiz
    intent: Text input = Frontend (correctIndex 0)
  - role: mission
    intent: Classify 5 parts of AI app
  - role: confidence_close
    intent: Layer first; next = APIs

mission:
  type: practice
  intent: Open any AI app and classify 5 parts — Frontend or Backend with why — ~5–10 min
  rubricIntent:
    - dimension: correct_classification
      weight: 60
      criteria: 1–3 usually Frontend; 4–5 usually Backend/Database; each choice has logical reason
    - dimension: clear_reason
      weight: 40
      criteria: Reason separates «seen» from «works behind»; not guess without explanation
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - classify_for_learner_without_reasoning

termsLocked: [Frontend, Backend, Database]

links:
  nextLessonId: builder-m5-l3-backend-api
  continuityNote: APIs — how interface and backend talk

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

- **ماذا ستفهم؟** **Frontend (الواجهة)** = **ما يراه العميل وينقر عليه**. **Backend (الكواليس)** = **العمل الذي يحدث خلف الشاشة**.
- **لماذا الآن؟** **عندما يحدث خطأ**، **أول سؤال**: **المشكلة في الشكل أم في العمل؟**
- **ماذا بعد الدرس؟** **ستميّز ٥ أجزاء في أي تطبيق** — **Frontend أم Backend**.

### Tension — «الذكاء الاصطناعي لا يرد» — أين المشكلة؟

- **يقول العميل «التطبيق لا يعمل»** — **لكن ماذا بالضبط؟** **الزر لا ينقر؟** **أم ينقر ولا يوجد رد؟**
- **«لا يعمل» جملة عامة**. **بدون معرفة: شكل أم عمل** — **ستضيع وقتًا في إصلاح خاطئ**.
- **أول خطوة دائمًا**: **حدّد الطبقة** — **واجهة (Frontend) أم كواليس (Backend)**.

### Core idea — Frontend = ترى — Backend = يعمل

- **Frontend** = **كل شيء على الشاشة**: **أزرار، نصوص، ألوان، مربعات الكتابة**.
- **Backend** = **العمل الذي لا تراه**: **تكلّم AI، تحقق من بيانات، حفظ، قرارات**.
- **في مطعم**: **المنيو والطاولة = Frontend**. **المطبخ = Backend**.
- **عند الإصلاح، اسأل**: **ماذا يرى العميل؟** **أم العمل خلفه لا يسير؟**

### Comparison — زر لا شكله vs رد لا يصل

| مشكلة Frontend | مشكلة Backend |
|----------------|---------------|
| **الزر رمادي ولا ينقر**. **أو الشاشة فارغة**. **العميل لا يستطيع البدء** — **المشكلة في الشكل** | **الزر يعمل والشاشة تحمّل** — **لكن لا رد**. **أو رسالة خطأ**. **الشكل سليم** — **العمل خلفه متوقف** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Frontend (الواجهة)** | **الوجه** — **كل ما يراه العميل ويتعامل معه على الشاشة** | **مربع كتابة السؤال + زر «إرسال» + قائمة المحادثات** |
| **Backend (الكواليس)** | **العقل** — **يستقبل الطلب، يكلّم AI، ويرجع الرد** | **عندما تنقر «إرسال»**، **الكواليس ترسل السؤال للـ AI** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «شكل vs عمل — Frontend و Backend». **لا يُعاد توليده.**

### Screenshot block (intent)

**افتح أي تطبيق AI → انقر يمين → Inspect**. **ما تراه Frontend** — **الكود الذي بنى الشاشة**. **جرّب بنفسك (F12 أو Inspect)**.

### Quiz — تأكيد سريع

**السؤال:** **في تطبيق شات AI، مربع الكتابة الذي تكتب فيه السؤال — Frontend أم Backend؟**

- **الإجابة الصحيحة (خيار ١):** **Frontend** — **لأن العميل يراه ويستخدمه**.
- خيار ٢: **Backend** — **لأنه يرسل السؤال**.
- خيار ٣: **Database** — **لأنه يحفظ الكلام**.

**التفسير:** **مربع الكتابة على الشاشة = Frontend**. **إرسال السؤال للـ AI = Backend**.

### Mission — فرّق ٥ أجزاء

**المقدمة:** **مهمة تحليل — ليست كودًا**. **افتح أي تطبيق AI تستخدمه**. **٥–١٠ دقائق كافية**.

**التسليم:** **لكل جزء اكتب Frontend أو Backend مع السبب:**

1. مربع كتابة السؤال
2. زر «إرسال»
3. الرد الذي يظهر على الشاشة
4. تكلّم AI بالسؤال (العمل الذي لا تراه)
5. حفظ المحادثة للعودة غدًا

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| التصنيف صحيح | 60% | **١–٣ غالبًا Frontend**. **٤–٥ غالبًا Backend/Database**. **كل اختيار له سبب منطقي** |
| السبب واضح | 40% | **السبب يفرّق «يرى» عن «يعمل خلف»**. **ليس تخمينًا بلا تعليل** |

### Confidence close

- **فهمت:** **Frontend = ترى**. **Backend = يعمل**. **أول خطوة في أي مشكلة: حدّد الطبقة**.
- **تستطيع:** **تمييز ٥ أجزاء في أي تطبيق** — **وتعرف أين المشكلة غالبًا**.
- **التالي:** **API (ساعي البريد)** — **كيف تتكلّم الواجهة والكواليس**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Frontend**, **Backend**, **Database** preserved. Chrome Inspect reference from production only. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Frontend, Backend only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — text box = Frontend |
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
