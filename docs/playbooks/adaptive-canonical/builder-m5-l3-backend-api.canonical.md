# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m5-l3-backend-api` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | كواليس التطبيق وساعي البريد |
| **productionRoute** | `/learn/builder/builder-m5-l3-backend-api` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l3-backend-api.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | API connects what the client sees to hidden backend work |
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
| `builder-m5-l3-backend-api.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | API connects Frontend to Backend; every button = at least one API request |
| **Mission rubric** | 60% clear path · 40% logical |
| **Quiz intent** | Backend talks to AI on client's behalf (correctIndex 1) |
| **Concepts locked** | Backend, API |
| **Prerequisite** | `builder-m5-l2-frontend` |
| **Next lesson** | `builder-m5-l4-database-intro` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l3-backend-api
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l3-backend-api.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Backend & API (Mail Carrier)
  oneAha: "API connects what the client sees to hidden backend work"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l2-frontend]

objectives:
  - id: obj-1
    statement: Learner explains API as messenger between Frontend and Backend.
    measurable: true
  - id: obj-2
    statement: Learner maps button → UI action → backend action → screen response for 3 actions.
    measurable: true

concepts:
  - id: concept-backend
    term: Backend
    termEn: Backend
    definition: Where app thinks — receives, talks to AI, returns.
    mustPreserve: true
  - id: concept-api
    term: API
    termEn: API (Application Programming Interface)
    definition: Language that carries requests and responses between interface and backend.
    mustPreserve: true

blocks:
  - role: orientation
    intent: API connects visible to hidden; map button flow after lesson
  - role: tension
    intent: Send clicked but nothing happens — no link to backend
  - role: core
    intent: API = waiter; every button = API request
  - role: comparison
    intent: Menu without waiter vs working restaurant
  - role: glossary
    intent: Backend, API
  - role: video
    intent: Button to response path — production Bunny unchanged
  - role: screenshot
    intent: Button → request → response
  - role: quiz
    intent: Backend talks to AI (correctIndex 1)
  - role: mission
    intent: Map 3 actions through API path
  - role: confidence_close
    intent: Every button = request; next = Database

mission:
  type: practice
  intent: Map API path for 3 actions in an AI app — UI → backend → return — ~5–10 min
  rubricIntent:
    - dimension: clear_path
      weight: 60
      criteria: Each action has 3 steps — UI → backend → return; backend includes talk to AI or fetch data
    - dimension: logical
      weight: 40
      criteria: Screen response tied to request; no magic step without explanation
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_api_flow_for_learner

termsLocked: [Backend, API, Frontend]

links:
  nextLessonId: builder-m5-l4-database-intro
  continuityNote: Database — why app needs memory

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

- **ماذا ستفهم؟** **API (واجهة برمجة التطبيقات / ساعي البريد)** **تربط ما يراه العميل بالعمل الذي يحدث خلف الشاشة**.
- **لماذا الآن؟** **بدون «ساعي بريد» بين الواجهة والكواليس** — **لا يعمل أي تطبيق**.
- **ماذا بعد الدرس؟** **سترسم خريطة**: **زر → ماذا يحدث في الكواليس**.

### Tension — تنقر «إرسال» — ولا شيء يحدث

- **الزر يعمل**. **الشاشة تحمّل**. **لكن الرد لا يصل** — **أو يظهر خطأ**.
- **الواجهة أدت عملها**: **أخذت كلامك ونقر «إرسال»**. **لكن لا أحد يربطها بالكواليس**.
- **API = الجرسون** — **ينقل الطلب من الطاولة إلى المطبخ ويرجع الطعام**.

### Core idea — API تربط الظاهر بالمخفي

- **العميل يكتب في الواجهة وينقر زرًا** — **هذا ما يراه**.
- **الكواليس تستقبل الطلب، تكلّم AI، وترجع الرد** — **هذا ما لا يراه**.
- **API = اللغة التي تنقل الطلب والرد بين الاثنين**.
- **كل زر في تطبيقك = طلب API واحد على الأقل**.

### Comparison — منيو بدون جرسون vs مطعم يعمل

| بدون API | مع API |
|----------|--------|
| **العميل يكتب على المنيو** — **لكن لا أحد يوصّل الطلب للمطبخ**. **المنيو جميل — لكن لا طعام** | **العميل يطلب → الجرسون يأخذ الطلب → المطبخ يطبخ → الجرسون يرجع الطعام**. **كل خطوة مربوطة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Backend (الكواليس)** | **المكان الذي يفكّر فيه التطبيق** — **يستقبل، يكلّم AI، ويرجع** | **عند «إرسال»**، **الكواليس ترسل السؤال للـ AI** |
| **API (ساعي البريد)** | **اللغة التي تنقل الطلبات والردود بين الواجهة والكواليس** | **زر «إرسال» → API → الكواليس تكلّم AI → API → الرد يظهر** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من الزر إلى الرد — مسار API». **لا يُعاد توليده.**

### Screenshot block (intent)

**اكتب رسالة وانقر إرسال**: **الواجهة ترسل طلبًا → الكواليس تكلّم AI → الرد يعود للشاشة**. **هذا مسار API**.

### Quiz — تأكيد سريع

**السؤال:** **العميل كتب سؤالًا ونقر Send. أي مكوّن مسؤول عن تكلّم AI؟**

- خيار ١: **الواجهة** — **لأن العميل يكتب فيها**.
- **الإجابة الصحيحة (خيار ٢):** **الكواليس** — **هي التي تكلّم AI نيابة عن العميل**.
- خيار ٣: **المتصفح يكلّم AI مباشرة**.

**التفسير:** **الواجهة تأخذ الطلب**. **API تنقله**. **الكواليس تكلّم AI**.

### Mission — ارسم خريطة: زر → ماذا يحدث؟

**المقدمة:** **مهمة تخطيط — ليست كودًا**. **٥–١٠ دقائق كافية**.

**التسليم:** **لكل action اكتب مسار API (واجهة → كواليس → يرجع):**

1. «إرسال سؤال»
2. «فتح محادثة قديمة»
3. «محادثة جديدة»

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مسار واضح | 60% | **كل action فيها ٣ خطوات: واجهة → كواليس → رد**. **الكواليس فيها «تكلّم AI» أو «جلب بيانات»** |
| منطقي | 40% | **الرد على الشاشة مربوط بالطلب**. **لا خطوة «سحر» بلا تفسير** |

### Confidence close

- **فهمت:** **API تربط الظاهر بالمخفي** — **كل زر = طلب**.
- **تستطيع:** **خريطة button → API action لـ ٣ actions**.
- **التالي:** **Database (المخزن)** — **لماذا التطبيق يحتاج «ذاكرة»**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Backend**, **API**, **Frontend** preserved. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Backend, API only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — Backend talks to AI |
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
