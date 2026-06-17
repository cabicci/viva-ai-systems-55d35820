# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `analyst-m4-l1-pattern-vs-outlier` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m4` |
| **productionTitle (ar-EG)** | Pattern أم Outlier؟ |
| **productionRoute** | `/learn/analyst/analyst-m4-l1-pattern-vs-outlier` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m4-l1-pattern-vs-outlier.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Not every strange number deserves a strategy change — distinguish pattern from one-time outlier |
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
| `analyst-m4-l1-pattern-vs-outlier.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Not every odd number deserves a plan change — classify pattern vs one-time outlier vs insufficient data |
| **Mission rubric** | 60% correct classification · 40% decision from pattern only |
| **Quiz intent** | Friday sales spike pattern + one big-client day — act on Friday pattern, not outlier (correctIndex 1) |
| **Concepts locked** | Pattern, Outlier |
| **Prerequisite** | `analyst-m3-l2-ai-summarization` |
| **Next lesson** | `analyst-m4-l2-decision-rule` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m4-l1-pattern-vs-outlier
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m4-l1-pattern-vs-outlier.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Pattern vs Outlier
  oneAha: "Pattern = plan on it; Outlier = understand it first — do not build strategy on one point"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m3-l2-ai-summarization]

objectives:
  - id: obj-1
    statement: Learner defines Pattern vs Outlier and applies the 3-times-in-3-periods practical rule.
    measurable: true
  - id: obj-2
    statement: Learner classifies 5 numbers or days and writes one decision based on pattern only — not outlier.
    measurable: true

concepts:
  - id: concept-pattern
    term: Pattern
    termEn: Pattern
    definition: Something that repeats across different periods — worth planning on (budget, SOP, forecast).
    mustPreserve: true
  - id: concept-outlier
    term: Outlier
    termEn: Outlier
    definition: A number far from normal — happened once or twice; understand cause before big decision.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Pattern vs outlier; after lesson classify 5 numbers or days
  - role: tension
    intent: One triple sales day → doubled ads; next week back to normal — strategic mistake
  - role: core
    intent: Pattern = plan; Outlier = understand; insufficient data = wait; 3 times in 3 periods = pattern
  - role: comparison
    intent: React to one number vs read 8 weeks — Friday spike as pattern
  - role: glossary
    intent: Pattern, Outlier
  - role: video
    intent: Watch — pattern or outlier — production Bunny unchanged
  - role: diagram
    intent: Stable line = pattern; single spike = outlier (pattern-vs-outlier)
  - role: quiz
    intent: Friday pattern + big client outlier — plan inventory for Thursday (correctIndex 1)
  - role: mission
    intent: Classify 5 values; one decision from pattern only
  - role: confidence_close
    intent: Pause before strategy change; next = decision rule

mission:
  type: practice
  intent: Practical classification — 5 numbers or days from work; stop before changing decision on one odd point
  rubricIntent:
    - dimension: correct_classification
      weight: 60
      criteria: Each value classified with clear reason; outliers not treated as patterns
    - dimension: decision_from_pattern
      weight: 40
      criteria: Decision built on repetition — not on one point
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_metrics_or_values_for_learner

termsLocked: [Pattern, Outlier]

links:
  nextLessonId: analyst-m4-l2-decision-rule
  continuityNote: Decision rule — one number can mislead; decision needs comparison and related numbers

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

- **ماذا ستفهم؟** **ليس** كل **رقم غريب** يستحق **تغيير خطتك** — يجب أن تعرف: **هل هذا نمط يتكرّر** أم **استثناء لمرّة واحدة**؟
- **لماذا الآن؟** في الدرس السابق **استخرجت ملخّصات** من **الذكاء الاصطناعي**. الآن تحتاج أن **تميّز** ما **يستحق قرارًا** وما **يستحق تفسيرًا فقط**.
- **ماذا بعد الدرس؟** ستصنّف **٥ أرقام أو أيام**: **نمط**، **استثناء**، أو **لا بيانات كافية**.

### Tension — رقم واحد غريب — وقررت تغيير كل شيء

- **يوم واحد** المبيعات **تضاعفت ٣ مرات** — فقررت **مضاعفة الإعلانات**. **الأسبوع التالي** عادت **للطبيعي**.
- المشكلة: **قرار استراتيجي** اتُخذ على **استثناء**. **حملة لمرّة واحدة**، **عميل كبير**، أو **خطأ تسجيل** — **ليس بالضرورة** «**نظامًا جديدًا**».
- **قبل** أن تتصرّف على **رقم واحد** — اسأل: **هل حدث هذا من قبل؟** أم **أول مرّة**؟

### Core idea — نمط = خطّط — استثناء = افهم

- **Pattern (نمط):** شيء **يتكرّر** في **فترات مختلفة** — **يستحق** أن **تخطّط** عليه (ميزانية، SOP، توقّع).
- **Outlier (استثناء):** شيء **حدث مرّة أو مرتين** **بعيدًا عن المعتاد** — **افهم سببه** قبل **أي قرار كبير**.
- **لا بيانات كافية:** **نقطة واحدة** أو **يومان** — **لا تتخذ** قرارًا استراتيجيًا. **اجمع أكثر** أو **انتظر**.
- **قاعدة عملية:** **٣ مرات** في **٣ فترات مختلفة** = **نمط** يمكنك **الثقة** به.

### Comparison — ردّ فعل على رقم مقابل قراءة صحيحة

| قرار على رقم واحد | قراءة قبل القرار |
|-------------------|------------------|
| مبيعات **يوم الجمعة** **قفزت** — **زادت الإعلانات** فورًا. بعد أسبوع اكتشفت أنها **مناسبة خاصة** | **نفس القفزة** — راجعت **٨ أسابيع**: **الجمعة** دائمًا **أعلى ٤٠٪**. هذا **نمط** — **خطّطت** **زيادة مخزون يوم الخميس** |

### Glossary — مصطلحان للتمييز

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Pattern (نمط)** | **تكرار منتظم** يمكنك **توقّعه** و**التخطيط** عليه | مبيعات **التورتات** **تتضاعف كل جمعة** من **٦ شهور** |
| **Outlier (استثناء)** | **رقم بعيد** عن المعتاد — **حدث مرّة أو مرتين** فقط | **يوم واحد** بعت **٥٠ ألف جنيه** والمتوسط **٥٠٠** — بسبب **عميل جملة** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «نمط ولا استثناء؟». **لا يُعاد توليده.**

### Diagram block (intent)

**نمط مستقر وقفزة لمرّة واحدة** (معرّف: `pattern-vs-outlier`): **الخط المستقر = نمط** تخطّط عليه. **القفزة الواحدة = استثناء** تفهم **سببه** — **لا تغيّر** استراتيجيتك **بسببه**.

### Quiz — تأكيد سريع

**السؤال:** مبيعاتك **كل جمعة** **أعلى ٣٠–٤٠٪** من باقي الأيام — **من ٣ شهور**. **يوم واحد فقط** **تضاعفت ٥ مرات** بسبب **عميل كبير**. **على ماذا** تتصرّف؟

- خيار ١: **تضاعف الإعلانات** بسبب **يوم العميل الكبير**.
- **الإجابة الصحيحة (خيار ٢):** **تخطّط لزيادة مخزون يوم الخميس** — لأن **الجمعة نمط متكرّر**.
- خيار ٣: **تتجاهل** الجمعة والعميل الكبير — **كلاهما** غير مهم.

**التفسير:** **الجمعة = نمط** — **يستحق تخطيطًا**. **يوم العميل الكبير = استثناء** — **افهمه** لكن **لا تبنِ** عليه **استراتيجية**.

### Mission — صنّف ٥ أرقام أو أيام

**المقدمة:** مهمة **تمييز عملي** — **ليس** رسمًا بيانيًا. خذ **٥ أرقام أو ٥ أيام** من **عملك** (حقيقي أو تخيلي) و**صنّف** كل واحد. **الهدف:** تتعلّم **التوقّف** قبل أن **تغيّر قرارًا** بسبب **رقم غريب**.

**التسليم:**

1. **Metric (المقياس)** الذي تتابعه (مبيعات، طلبات، شكاوى…)
2. **٥ قيم** — كل واحدة في سطر (رقم + يوم/أسبوع)
3. لكل قيمة: **نمط / استثناء / لا بيانات كافية + لماذا**
4. **قرار واحد** ستتخذه **بناءً على النمط فقط** (**ليس** الاستثناء)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف صحيح | 60% | كل قيمة **مصنّفة** **بسبب واضح**؛ **الاستثناءات** **لم تُعامل** كنمط |
| قرار من النمط | 40% | القرار **مبني على التكرار** — **ليس** على **نقطة واحدة** |

### Confidence close

- **فهمت:** **ليس** كل **رقم غريب** يستحق **تغيير خطتك**. **النمط** يستحق **قرارًا** — **الاستثناء** يستحق **تفسيرًا**.
- **تستطيع:** **تتوقّف** وتسأل «**هل هذا يتكرّر؟**» قبل **أي قرار استراتيجي**.
- **التالي:** **قاعدة القرار** — **رقم واحد** قد **يُضلّلك**؛ القرار يحتاج **مقارنة** و**أرقامًا مرتبطة**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Pattern**, **Outlier** preserved. Diagram `pattern-vs-outlier` = production reference. Deferred: Bunny · Remotion · RAG · runtime. Mission stays classification practice — not charting.

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
| Concept preservation | 5 | Pattern, Outlier only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — plan on Friday pattern |
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

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
