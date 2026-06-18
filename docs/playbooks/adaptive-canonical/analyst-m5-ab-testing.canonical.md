# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m5-ab-testing` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m5` |
| **productionTitle (ar-EG)** | اختبار A/B بسيط |
| **productionRoute** | `/learn/analyst/analyst-m5-ab-testing` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m5-ab-testing.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | A/B = one change, one metric — not random experiments |
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
| `analyst-m5-ab-testing.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Design simple A/B: one variable, metric, observation window, decisions |
| **Mission rubric** | 60% متغيّر + مقياس · 40% ملاحظة + قرار |
| **Quiz intent** | Multiple changes same week = not A/B — need one variable |
| **Concepts locked** | A/B Test, Sample Size |
| **Prerequisites** | `analyst-m6-l1-question-mistakes` |
| **Next lesson** | `analyst-m6-l2-interpretation-mistakes` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m5-ab-testing
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m5-ab-testing.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: A/B Testing
  oneAha: "A/B = one change, one metric — not random experiments"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [analyst-m6-l1-question-mistakes]

objectives:
  - id: obj-1
    statement: Design simple A/B: one variable, metric, observation window, decisions
    measurable: true

concepts:
  - id: concept-1
    term: A/B Test
    termEn: A/B Test
    definition: Compare two versions with one difference only.
    mustPreserve: true
  - id: concept-2
    term: Sample Size
    termEn: Sample Size
    definition: Observations needed before trusting result.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you learn, why now, what after lesson
  - role: tension
    intent: Familiar problem from production Egyptian copy
  - role: core
    intent: One Aha and worked logic from production
  - role: comparison
    intent: Same contrast structure as production
  - role: glossary
    intent: termsLocked with first-use English gloss
  - role: video
    intent: Production Bunny reference only — no regen
  - role: screenshot
    intent: Visual intent from production block
  - role: quiz
    intent: Multiple changes same week = not A/B — need one variable
  - role: mission
    intent: Design simple A/B: one variable, metric, observation window, decisions
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Design simple A/B: one variable, metric, observation window, decisions
  rubricIntent:
    - dimension: variable_metric
      weight: 60
      criteria: One variable + metric defined before start
    - dimension: observation_decision
      weight: 40
      criteria: Realistic duration + success/fail decisions
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [A/B Test, Sample Size]

links:
  nextLessonId: analyst-m6-l2-interpretation-mistakes
  continuityNote: أخطاء الأسئلة — السؤال الخاطئ يضيّع الوقت حتى لو البيانات صحيحة

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **A/B Test (اختبار A/B)** يعني أن تغيّر **شيئًا واحدًا** وتقيس **نتيجة واحدة** — **وليس** تجارب عشوائية متعددة في نفس الوقت.
- **لماذا الآن؟** بعد أن تعرف **أخطاء التفسير**، تحتاج طريقة تتأكد أن **التغيير** هو سبب **النتيجة** — **وليس** صدفة أو ضجيجًا في البيانات.
- **ماذا بعد الدرس؟** ستصمّم **اختبار A/B بسيطًا**: ماذا تقارن، ما **المتغيّر الواحد**، ما **المقياس (Metric)**، ومدة **الملاحظة** قبل أن تتخذ قرارًا.

### Tension — موقف مألوف

- غيّرت **العنوان** و**السعر** و**الصورة** في **نفس الأسبوع** — **زادت المبيعات**. قد تقول: «إذن **كل شيء** نفع!»
- هذا **ليس** **A/B test** — هذا **فوضى (chaos)**. **متغيّرات كثيرة** = **لا درس** يمكن استخلاصه من التجربة.
- **الذكاء الاصطناعي (AI)** يساعدك على صياغة **فرضية** وتفسير **النتيجة** — **لكن أنت** تحدّد **متغيّرًا واحدًا** و**مقياسًا واحدًا** **قبل** أن تبدأ.

### Core idea — A مقابل B — متغيّر واحد — مقياس قبل البداية

- **A/B** = نسخة **A** (كما هي) **مقابل** نسخة **B** (تغيير **واحد** فقط). **الباقي ثابت**.
- حدّد **المقياس** **قبل** البداية: **Conversion (نسبة التحويل)**، **Clicks (نقرات)**، **Revenue (الإيراد)** — **وليس** «نرى ماذا يحدث».
- **تحذير للمبتدئ:** **عيّنة صغيرة** = نتيجة **غير مضمونة**. **٢–٤ أسابيع** ملاحظة **أفضل** من **٣ أيام** فقط.
- **AI** يساعدك على صياغة الفرضية والتفسير — **لكن لا تبالغ**: لا تقل «أثبتنا ١٠٠٪» من **٢٠ زائر** فقط.

### Comparison — تجارب عشوائية مقابل A/B منظّم

| «جرّبنا كل شيء» (فوضى) | A/B واحد (منظّم) |
|------------------------|------------------|
| **٣ تغييرات** في أسبوع — **لا نعرف** ما الذي نفع. **قرار** مبني على **تخمين** | **عنوان A** مقابل **عنوان B** — **نفس الصفحة**، **نفس السعر** — **أسبوعان** — **Conversion %** |

### Glossary — مصطلحان للاختبار

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **A/B Test (اختبار A/B)** | مقارنة **نسختين** — **فرق واحد** فقط — لقياس **أثر التغيير** | صفحة **A** (عنوان قديم) **مقابل** **B** (عنوان جديد) — **Conversion %** |
| **Sample Size (حجم العيّنة)** | عدد **الملاحظات** التي تحتاجها **قبل** أن تثق في النتيجة | **٢٠ زائر** = مبكر — **٢٠٠+** أفضل للمبتدئين |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «A/B بسيط». **لا يُعاد توليده.** الدرس **مكتفي** بالقراءة إن لم يكن لديك وقت للمشاهدة.

### Diagram block (intent)

**Pattern (نمط) مقابل Outlier (قيمة شاذة)** (معرّف: `pattern-vs-outlier`): نتيجة **A/B** تحتاج **نمطًا** مستقرًا — **وليس** قفزة **يوم واحد** شاذة. **استخدم** هذا التمييز عند تفسير النتائج **وفي المهمة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** غيّرت **العنوان** و**الصورة** و**السعر** — **زادت المبيعات**. **ما المشكلة؟**

- **الإجابة الصحيحة (خيار ١):** **متغيّرات كثيرة** — **ليس** **A/B**. تحتاج **تغييرًا واحدًا** + **مقياسًا محددًا** **قبل** البداية.
- خيار ٢: المبيعات **يجب** أن تنخفض **وليس** أن تزيد.
- خيار ٣: تحتاج **AI أكثر**.

**التفسير:** **A/B** = **متغيّر واحد**. **٣ تغييرات** = **لا نعرف** ما السبب.

### Mission — صمّم A/B test بسيط

**المقدمة:** هذه مهمة **تصميم** — **وليس** تشغيلًا إلزاميًا. اكتب **اختبار A/B**: ماذا تقارن، ما المتغيّر، المقياس، ومدة الملاحظة. **قد يقترح AI** صياغة — **أنت** تختار النهائي.

**التسليم:**

1. ماذا تقارن (**A** مقابل **B** — وصف مختصر)
2. **المتغيّر الواحد** الذي تغيّر
3. **المقياس (Metric)** — محدد **قبل** البداية
4. مدة **الملاحظة** + مكان القياس
5. **قرار محتمل** إذا نجح **B** — وإذا فشل

**قالب المهمة:**

```
A مقابل B:
A: [النسخة الحالية]
B: [التغيير الوحيد]

المتغيّر الواحد:
[ما الذي تغيّر — عنوان / سعر / CTA…]

المقياس:
[Metric — مثال: Conversion %]

الملاحظة:
[مدة — مثال: أسبوعان] + [مكان — صفحة / بريد…]

قرار إذا نجح B:
[إذن سأفعل…]

قرار إذا فشل B:
[إذن سأفعل…]
```

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| متغيّر + مقياس | 60% | **متغيّر واحد** + **مقياس محدد قبل البداية** |
| ملاحظة + قرار | 40% | **مدة واقعية** + **قرار محتمل** للنجاح والفشل |

### Confidence close

- **فهمت:** **A/B** = **تغيير واحد**، **نتيجة واحدة** — و**AI** يساعد **من دون مبالغة**.
- **تستطيع:** لديك **تصميم A/B test** جاهز للتجربة.
- **التالي:** **أخطاء الأسئلة** — عندما **السؤال الخاطئ** يضيّع وقتك **حتى لو البيانات صحيحة**.

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — **not** from Egyptian directly. **Mission rubric weights (60/40)** and **quiz logic (correctIndex 0)** preserved. Diagram `pattern-vs-outlier` = production visual intent only. **Comparison block** and **full quiz options** must survive locale derivation. Deferred: Bunny · Remotion · RAG seed · runtime wiring. **Do not** upgrade `reviewStatus` or human sign-off from this artifact alone.

---

### Script layer status (polish lock — 2026-06-18)

| Field | Value |
|-------|-------|
| **Layer** | MSA Canonical Lesson Script |
| **API audit** | 100/100 reviewed (Anthropic) — 0 CONTENT FAIL |
| **Polish pass** | 2026-06-18 — read-aloud naturalness, gloss normalization, quiz reasoning, mission clarity |
| **Production wiring** | **Not wired** — Egyptian `ar-EG` remains default UX |
| **Video / render** | **Not rendered** — Bunny production videos frozen |
| **Runtime localization** | **Not active** — no locale switch in `src/` |
| **Human sign-off** | **pending** — not production-ready for rollout |

### Feeds next architecture stages (when chartered)

1. Runtime language / locale architecture
2. Video script / voice-over pipeline
3. Assistant localization
4. Mission localization packages
5. Gulf / English / other locale generation from MSA — **not** from Egyptian directly

### Explicitly deferred

- Remotion render / Bunny upload / publish
- Runtime locale switching in `src/`
- Mission evaluator changes
- Assistant/RAG seed from canonical
- Replacing Egyptian on-page copy with this MSA text
## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Production concepts locked |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 0 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

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
| 2 | Bunny / video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer score — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready stated | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
