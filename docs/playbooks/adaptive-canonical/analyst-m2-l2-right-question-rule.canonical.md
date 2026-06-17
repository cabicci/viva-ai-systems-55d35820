# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `analyst-m2-l2-right-question-rule` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m2` |
| **productionTitle (ar-EG)** | السؤال الصح أهم من الإجابة |
| **productionRoute** | `/learn/analyst/analyst-m2-l2-right-question-rule` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m2-l2-right-question-rule.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | A question earns analysis only if the answer would change your decision |
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
| `analyst-m2-l2-right-question-rule.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Analysis is worth it only if the answer can change a decision — filter vague questions |
| **Mission rubric** | 60% decision test · 40% improvement |
| **Quiz intent** | «What affected restaurant sales?» → branch customer count comparison last 30 days (correctIndex 0) |
| **Concepts locked** | Threshold, Actionable |
| **Prerequisite** | `analyst-m2-l1-feeling-to-question` |
| **Next lesson** | `analyst-m3-l1-three-sources` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m2-l2-right-question-rule
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m2-l2-right-question-rule.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Right Question Rule
  oneAha: "Question worth analysis only if answer X vs Y changes your decision"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m2-l1-feeling-to-question]

objectives:
  - id: obj-1
    statement: Learner applies decision test — if answer X or Y would not change action, question is not worth analysis time.
    measurable: true
  - id: obj-2
    statement: Learner tests 3 questions with X/Y branches; rewrites failed questions with decision-linked improvement.
    measurable: true

concepts:
  - id: concept-threshold
    term: Threshold
    termEn: Threshold
    definition: The number at which you decide what to do — not an arbitrary number.
    mustPreserve: true
  - id: concept-actionable
    term: Actionable
    termEn: Actionable
    definition: A question whose answer makes you move — not knowledge for its own sake.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Question worth analysis only if answer changes decision; test 3 questions after lesson
  - role: tension
    intent: «How are sales?» — 10 hours, no decision; wrong question → wrong data → wrong decision
  - role: core
    intent: Specific, measurable, decision-linked, time-bound; quick test if X/Y changes action
  - role: comparison
    intent: Vague sales question vs specific repeat-buyer count with clear next step
  - role: glossary
    intent: Threshold, Actionable
  - role: video
    intent: The question worth your time — production Bunny unchanged
  - role: diagram
    intent: Same topic two phrasings two outcomes (question-scorecard)
  - role: quiz
    intent: Restaurant sales impact — branch customer decline comparison (correctIndex 0)
  - role: mission
    intent: Test 3 questions with X/Y decision branches; rewrite failures
  - role: confidence_close
    intent: Filter before data work; next = three sources

mission:
  type: practice
  intent: Practical filter — 3 questions with «if X / if Y, what decision?»; rewrite any that fail — not an exam
  rubricIntent:
    - dimension: decision_test
      weight: 60
      criteria: Each question has X and Y and different decision — or clear why it would not change
    - dimension: improvement
      weight: 40
      criteria: If a question failed — improved version linked to a decision
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_questions_or_decisions_for_learner

termsLocked: [Threshold, Actionable]

links:
  nextLessonId: analyst-m3-l1-three-sources
  continuityNote: Three sources — behavior, results, customer voice

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

- **ماذا ستفهم؟** السؤال **يستحق التحليل** فقط إذا **الإجابة** تستطيع أن **تغيّر قرارك** — **ليس** أي سؤال يستحق وقتك.
- **لماذا الآن؟** بعد أن تعلّمت **تحويل الشعور إلى سؤال** — يجب التأكد أن السؤال **فعلًا** يوصّلك إلى **قرار**.
- **ماذا بعد الدرس؟** ستختبر **٣ أسئلة** بقاعدة: «**إذا** كانت الإجابة X **أو** Y — **هل** سأغيّر قراري؟»

### Tension — «ما أحوال البيع؟» — و١٠ ساعات بلا قرار

- السؤال **العام** يجلب **إجابة طويلة ومبهمة**. تفتح البيانات، تتفرّج، تغلق — **ولا شيء** يتغيّر.
- **اسأل خطأ** → تجمع **بيانات خطأ** → تفسّر **خطأ** → تقرّر **خطأ**. **السؤال** يوجّه **كل شيء** بعده.
- **الذكاء الاصطناعي** يساعدك على **تحسين صياغة** السؤال — **أنت** تقرر: **هل الإجابة** ستغيّر **شيئًا فعلًا**؟

### Core idea — السؤال الصح = إجابته تغيّر قرار

1. **محدّد** — فيه **من / ماذا / متى / كم**.
2. **قابل للقياس** — الإجابة **رقم** أو **نسبة**.
3. **متعلّق بقرار** — إذا جاءت الإجابة — **هناك** شيء **سيتغيّر**.
4. **في وقت محدّد** — «**هذا الأسبوع**» أو «**آخر ٣٠ يومًا**».
5. **اختبار سريع:** إذا كانت الإجابة **X** أو **Y** — **هل** سأغيّر قراري؟ إذا **لا** — السؤال **لا يستحق**.

### Comparison — سؤال عام مقابل سؤال محدّد

| سؤال عام | سؤال محدّد |
|----------|-------------|
| «**ما أحوال البيع؟**» — إجابة **١٠ ساعات**. **لا قرار**. تغلق البيانات وتذهب | «**كم عميلًا** اشترى **مرتين** **هذا الشهر**؟» — إجابة **في دقيقة**. إذا **كبير**: كرّر الحملة. إذا **صغير**: **follow-up** |

### Glossary — مصطلحان للسؤال

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Threshold (حد القرار)** | **الرقم** عنده **تقرر** ماذا تفعل — **ليس** رقمًا عشوائيًا | «إذا المبيعات **أقل من ١٠** — أوقف الإعلان» — **١٠** هي **Threshold** |
| **Actionable (قابل للتنفيذ)** | سؤال **إجابته** تجعلك **تتحرّك** — **ليس** معلومة للمعرفة فقط | «**كم** ننفق على الإعلانات؟» — إجابته تجعلك **تدفع** أو **توفر** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «السؤال الذي يستحق». **لا يُعاد توليده.**

### Diagram block (intent)

**نفس الموضوع · صياغتان · نتيجتان** (معرّف: `question-scorecard`): سؤال **عام** يفشل في الشروط — سؤال **محدّد** ينجح. استخدم **البطاقة** في المهمة.

### Quiz — تأكيد سريع

**السؤال:** صاحب مطعم سأل **الذكاء الاصطناعي**: «**ما الذي أثر** على مبيعات المطعم **الشهر الماضي**؟» ما **أفضل تحسين** للسؤال؟

- **الإجابة الصحيحة (خيار ١):** «**بناءً على بيانات آخر ٣٠ يومًا** — **كم عميلًا** **قلّ** عددهم **مقارنة بالشهر الذي قبله** **من كل فرع**؟»
- خيار ٢: «هل هناك إعلانات جديدة يمكن عملها لزيادة المبيعات **الشهر القادم**؟»
- خيار ٣: «ما **أكثر الأطباق** التي يحبها الناس؟»

**التفسير:** السؤال **المحسّن** **محدّد** + **قابل للقياس** + **مرتبط بقرار**. إذا ظهرت الإجابة — **ستعرف** كيف **تتحرّك**.

### Mission — اختبر ٣ أسئلة بقاعدة القرار

**المقدمة:** مهمة **فلتر عملي** — **ليس امتحانًا**. اكتب **٣ أسئلة** (من الدرس السابق أو من عملك). لكل سؤال طبّق: «**إذا** كانت الإجابة **X** أو **Y** — **هل** سأغيّر قراري؟» إذا **لا** — **أعد صياغة** السؤال.

**التسليم:** لكل سؤال (١–٣):

- السؤال
- إذا **X**: [ما القرار؟] · إذا **Y**: [ما القرار؟] · **هل** يتغيّر القرار؟ (نعم / لا)

+ إذا **فشل** سؤال — **النسخة المحسّنة**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| اختبار القرار | 60% | كل سؤال فيه **X** و**Y** و**قرار مختلف** — أو توضيح **لماذا** لن يتغيّر |
| تحسين | 40% | إذا **فشل** سؤال — **نسخة محسّنة** **مرتبطة بقرار** |

### Confidence close

- **فهمت:** السؤال **يستحق التحليل** فقط إذا **الإجابة** تستطيع **تغيير قرارك** — هذا **الفلتر** قبل أي تحليل.
- **تستطيع:** اختبار **أي سؤال** بسرعة **قبل** أن تضيع وقتًا في البيانات.
- **التالي:** **Three Sources (المصادر الثلاثة)** — **سلوك الناس**، **النتائج**، **كلام العملاء**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Threshold**, **Actionable** preserved. Diagram `question-scorecard` = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Threshold, Actionable only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — branch comparison question |
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

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
