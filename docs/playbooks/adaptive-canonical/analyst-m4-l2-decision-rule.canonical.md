# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `analyst-m4-l2-decision-rule` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m4` |
| **productionTitle (ar-EG)** | كل تفسير ينتهي بـ «إذًا هعمل…» |
| **productionRoute** | `/learn/analyst/analyst-m4-l2-decision-rule` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m4-l2-decision-rule.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | One number can mislead — every decision needs comparison, related number, and clear action |
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
| `analyst-m4-l2-decision-rule.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Turn any number into a decision question — compared to what, related number, what action changes |
| **Mission rubric** | 50% comparison + context · 50% action + decision rule |
| **Quiz intent** | Orders up 20% but conversion down 12%→8% — compare conversion and review pricing step (correctIndex 1) |
| **Concepts locked** | Baseline, Decision Rule |
| **Prerequisite** | `analyst-m4-l1-pattern-vs-outlier` |
| **Next lesson** | `analyst-m5-l1-four-numbers-dashboard` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m4-l2-decision-rule
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m4-l2-decision-rule.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Decision Rule
  oneAha: "Three questions before any action — compared to what, related number, what would change"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m4-l1-pattern-vs-outlier]

objectives:
  - id: obj-1
    statement: Learner applies the three decision questions to any single number before acting.
    measurable: true
  - id: obj-2
    statement: Learner writes one Decision Rule in if → action format with baseline, related number, and specific action (who + when).
    measurable: true

concepts:
  - id: concept-baseline
    term: Baseline
    termEn: Baseline
    definition: The number you compare against — the normal before you judge.
    mustPreserve: true
  - id: concept-decision-rule
    term: Decision Rule
    termEn: Decision Rule
    definition: If [numeric condition] → [specific action].
    mustPreserve: true

blocks:
  - role: orientation
    intent: One number misleads — decision needs comparison + related numbers; after lesson run one number through 3 questions
  - role: tension
    intent: «Sales down 10%» panic — compared to promo week; flat vs last month
  - role: core
    intent: Compared to what, related number, what action — without 3 questions insight is empty
  - role: comparison
    intent: Number alone (8% conversion) vs number + comparison + action
  - role: glossary
    intent: Baseline, Decision Rule
  - role: video
    intent: Watch — number to decision — production Bunny unchanged
  - role: diagram
    intent: Number → compare → related → action (decision-chain)
  - role: quiz
    intent: Orders up, conversion down — review pricing with comparison (correctIndex 1)
  - role: mission
    intent: One real number through 3 questions + Decision Rule if → action
  - role: confidence_close
    intent: Stop half-story insights; next = four-number dashboard

mission:
  type: practice
  intent: Apply on one real work number — baseline, related number, specific action; no action on half a story
  rubricIntent:
    - dimension: comparison_and_context
      weight: 50
      criteria: Clear baseline — not number alone; related number changes picture
    - dimension: action_and_rule
      weight: 50
      criteria: Action specifies who and when; Decision Rule written as if → action
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_number_or_rule_for_learner

termsLocked: [Baseline, Decision Rule]

links:
  nextLessonId: analyst-m5-l1-four-numbers-dashboard
  continuityNote: Four-number dashboard — start with decision numbers not 50 charts

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

- **ماذا ستفهم؟** **رقم واحد** قد **يُضلّلك** — **القرار** يحتاج **مقارنة** و**أرقامًا مرتبطة**.
- **لماذا الآن؟** في الدرس السابق **فرّقت** بين **النمط** و**الاستثناء**. الآن تحتاج أن **تحوّل أي رقم** إلى **سؤال قرار**.
- **ماذا بعد الدرس؟** ستأخذ **رقمًا واحدًا** وتسأل: **مقارنة بماذا؟** **ما الرقم المرتبط؟** **وماذا سيتغيّر؟**

### Tension — «المبيعات نزلت ١٠٪» — وتوقّف كل شيء

- مدير يقول: «**المبيعات نزلت ١٠٪**». الفريق **يدخل في الذعر** — **خصومات**، **إعلانات**، **اجتماعات طوارئ**.
- **أحد** يسأل: «**نزلت مقارنة بماذا؟**» — **تبيّن** أنها **مقارنة بأسبوع** فيه **عرض خاص**. **مقارنة بالشهر الماضي:** **ثابتة**.
- **رقم من دون مقارنة = نصف قصة**. **القرار الصحيح** يبدأ بـ: **مقارنة بماذا؟** و**ما الرقم الثاني** الذي **يفسّر الصورة**؟

### Core idea — قاعدة القرار: ٣ أسئلة قبل أي Action (إجراء)

1. **Compared to what? — مقارنة بماذا؟** (الأسبوع الماضي، **نفس الفترة** السنة الماضية، **الهدف**)
2. **What related number matters? — ما الرقم المرتبط؟** (المبيعات **نزلت** — لكن **الطلبات زادت**؟ **التحويل** هو المشكلة)
3. **What action would change? — ماذا سيتغيّر** إذا **اتخذت قرارًا؟** (**من** ينفّذ؟ **متى**؟)
4. **من دون** هذه **الأسئلة الثلاثة** — أي «**insight (رؤية)**» قد يكون **كلامًا في الهواء**.

### Comparison — رقم وحده مقابل رقم في سياق قرار

| رقم من دون مقارنة | رقم + مقارنة + Action |
|-------------------|----------------------|
| «**التحويل ٨٪**». قرار: «**نزيد الإعلانات**» — **لا نعرف** إن كان **٨٪** جيدًا أم سيئًا | «**التحويل ٨٪** — **كان ١٢٪** الأسبوع الماضي، **والطلبات زادت**». قرار: «**نراجع رسالة التسعير** — **أنا** — **الأربعاء**» |

### Glossary — مصطلحان للقرار

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Baseline (خط أساس)** | **الرقم** الذي **تقارن** عليه — «**الطبيعي**» **قبل** أن **تحكم** | **متوسط مبيعات** آخر **٤ أسابيع** = **١٠٠٠ جنيه/يوم** |
| **Decision Rule (قاعدة قرار)** | **إذا** [شرط **بأرقام**] → [**Action (إجراء)** **محدّد**] | **إذا** **التحويل** **نزل أكثر من ٥٪** عن الأسبوع الماضي → **نراجع رسالة التسعير** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من رقم إلى قرار». **لا يُعاد توليده.**

### Diagram block (intent)

**سلسلة القرار** (معرّف: `decision-chain`): **رقم → مقارنة بماذا → رقم مرتبط → Action**. **من دون** هذه **السلسلة** **القرار لن يُنفَّذ**.

### Quiz — تأكيد سريع

**السؤال:** **الطلبات زادت ٢٠٪** هذا الأسبوع — لكن **التحويل نزل** من **١٢٪** إلى **٨٪**. ما **أفضل خطوة قرار**؟

- خيار ١: **نزيد الإعلانات** — **الطلبات زادت**.
- **الإجابة الصحيحة (خيار ٢):** **نسأل:** **التحويل نزل مقارنة بماذا؟** و**نراجع خطوة التسعير/العرض** — **Action محدّد**.
- خيار ٣: **نتجاهل الأرقام** — **الطلبات** أهم.

**التفسير:** **رقم واحد** **يُضلّل**. **الطلبات** و**التحويل** **معًا** **يوضّحان** الصورة — والقرار يكون على **ما سيتغيّر فعلًا**.

### Mission — حوّل رقمًا واحدًا إلى قاعدة قرار

**المقدمة:** مهمة **تطبيق** على **رقم حقيقي** من **عملك** — **ليس** نظريًا. اختر **رقمًا واحدًا** تلاحظه **كثيرًا** و**مرّره** على **٣ أسئلة القرار**. **الهدف:** **لا تتخذ Action** على **نصف قصة**.

**التسليم:**

1. **الرقم** الذي اخترته + **من أين** جاء
2. **Compared to what?** — **مقارنة بماذا** و**ما النتيجة**
3. **What related number matters?** — **ما الرقم المرتبط** و**ماذا يقول**
4. **What action would change?** — **Action + من + متى**
5. **Decision Rule** بصيغة: **إذا** [شرط] → [Action]

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مقارنة وسياق | 50% | **Baseline واضح** — **ليس** رقمًا **لوحده**؛ **رقم مرتبط** **يغيّر** فهم الصورة |
| Action وRule | 50% | **Action محدّد** فيه **من** و**متى**؛ **Decision Rule** **مكتوبة** بصيغة **إذا → Action** |

### Confidence close

- **فهمت:** **رقم واحد** **لا يكفي** — **القرار** يحتاج **مقارنة**، **رقمًا مرتبطًا**، و**Action واضحًا**.
- **تستطيع:** **تتوقّف** عن أي «**insight**» وتسأل **الأسئلة الثلاثة** **قبل** أن **تتحرّك**.
- **التالي:** **Dashboard (شاشة الأرقام)** من **٤ أرقام** — **ابدأ** **بأرقام قرار**، **ليس** **٥٠ رسمًا**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Baseline**, **Decision Rule** preserved. Diagram `decision-chain` = production reference. Deferred: Bunny · Remotion · RAG · runtime. Mission stays one-number decision practice — not analytics platform.

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
| Concept preservation | 5 | Baseline, Decision Rule only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — conversion comparison + pricing action |
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

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
