# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m6-l5-iteration` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | Iteration Loop |
| **productionRoute** | `/learn/builder/builder-m6-l5-iteration` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l5-iteration.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Improvement = one edit at a time — Surgical Edit prevents Regression |
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
| `builder-m6-l5-iteration.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Iteration Loop; Surgical Edit one change; avoid Regression |
| **Mission rubric** | 70% surgical edit · 30% regression protection |
| **Quiz intent** | Color change only — not color + font together (correctIndex 1) |
| **Concepts locked** | Iteration, Regression |
| **Prerequisite** | `builder-m6-l4-components-routes` |
| **Next lesson** | `builder-m6-l6-debugging` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l5-iteration
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l5-iteration.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Iteration Loop
  oneAha: "Improvement = one edit at a time — Surgical Edit prevents Regression"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m6-l4-components-routes]

objectives:
  - id: obj-1
    statement: Learner explains Iteration Loop and Surgical Edit with regression risk.
    measurable: true
  - id: obj-2
    statement: Learner writes one safe surgical edit prompt with do-not-change clause.
    measurable: true

concepts:
  - id: concept-iteration
    term: Iteration
    termEn: Iteration
    definition: Try → observe → fix → try again until goal reached.
    mustPreserve: true
  - id: concept-regression
    term: Regression
    termEn: Regression
    definition: Fixing one thing breaks another that worked.
    mustPreserve: true

blocks:
  - role: orientation
    intent: One edit at a time; surgical prompt after lesson
  - role: tension
    intent: UI looks bad — delete everything?
  - role: core
    intent: Ask → see → review → edit; Surgical Edit phrase
  - role: comparison
    intent: «Looks bad» vs one specific edit
  - role: glossary
    intent: Iteration, Regression
  - role: video
    intent: Four improvement rounds — production Bunny unchanged
  - role: screenshot
    intent: 4-step iteration circle
  - role: quiz
    intent: Color only not color+font (correctIndex 1)
  - role: mission
    intent: Write surgical edit prompt
  - role: confidence_close
    intent: Ready for debugging playbook

mission:
  type: practice
  intent: Element + one change + surgical prompt + do-not-change — ~10 min
  rubricIntent:
    - dimension: surgical_edit
      weight: 70
      criteria: One edit only; specific element and page not whole UI
    - dimension: regression_protection
      weight: 30
      criteria: Explicit do-not-change anything else
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_surgical_prompt_for_learner

termsLocked: [Iteration, Regression, Surgical Edit]

links:
  nextLessonId: builder-m6-l6-debugging
  continuityNote: Debugging — Symptom, isolate, fix

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

- **ماذا ستفهم؟** **التحسين = تعديل واحد كل مرة** — **ليس «غيّر كل شيء» ولا «امسح وابدأ من الأول»**.
- **لماذا الآن؟** **بعد تخطيط الواجهة، أول نسخة من AI لن تكون مضبوطة** — **هذا الدرس يعلّمك الإصلاح بأمان**.
- **ماذا بعد الدرس؟** **ستكتب طلب تعديل جراحي واحد** — **محدد ومضمون النتيجة**.

### Tension — الواجهة شكلها سيء — تمسح كل شيء؟

- **AI بنى واجهة** — **الألوان لا تناسب والزر ليس في مكانه**. **أول رد: «أمسح كل شيء»**.
- **لكن هذا أبطأ طريق**. **كل واجهة محترفة تأخذ ٤–٧ لفات تحسين** — **ليس نسخة واحدة**.
- **السر: تطلب تعديلًا واحدًا محددًا كل مرة** — **وتشاهد النتيجة قبل التالي**.

### Core idea — تعديل واحد كل مرة — لفة التحسين

- **Iteration Loop (حلقة التحسين) = ٤ خطوات**: **اطلب → شاهد النتيجة → راجع → عدّل**. **كل لفة تقرّبك من الشكل المطلوب**.
- **Surgical Edit (تعديل جراحي)**: «**خلي زر الإرسال برتقالي #FF6B35 — لا تغيّر أي شيء آخر.**»
- **لو طلبت تعديلات كثيرة مرة واحدة**، **AI يخمّن** — **وقد يفسد شيئًا كان يعمل (Regression — تراجع)**.

### Comparison — «غيّرها» vs تعديل جراحي

| خطأ — «الواجهة شكلها سيء» | صح — تعديل واحد محدد |
|---------------------------|----------------------|
| **AI لا يفهم «سيء»**. **يخمّن ويغيّر عشوائيًا** — **قد يفسد ما كان يعمل** | «**في صفحة الشات، خلي لون زر «ابعت» برتقالي #FF6B35 والكلام أبيض. لا تغيّر أي شيء آخر.**» **تعديل محدد = نتيجة مضمونة** |

### Glossary — مصطلحان للتحسين

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Iteration (لفة التحسين)** | **تجربة → ملاحظة → تصليح → تجربة ثانية — حتى تصل للهدف** | **كالخياط: مقاسات → تعديل → مقاسات ثانية** |
| **Regression (تراجع)** | **عندما تصلّح شيئًا فيفسد شيء آخر كان يعمل** | **عدّلت حجم الخط في الشات — وفجأة الـ Header (الرأس) اختل** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «٤ لفات تحسين». **لا يُعاد توليده.**

### Screenshot block (intent)

**٤ خطوات دائرية**: **اطلب → شاهد → راجع → عدّل**. **كل لفة = تعديل واحد فقط**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **زر الدخول أزرق فاتح وتريده أزرق غامق مثل زر «نسيت كلمة المرور». ما أنسب prompt؟**

- خيار ١: «**لون زر الدخول أزرق غامق #000080 وكبّر الخط إلى ١٦ بيكسل**»
- **الإجابة الصحيحة (خيار ٢):** «**لون زر الدخول أزرق غامق #000080**»
- خيار ٣: **أمسح الواجهة وأبنِها من الأول**

**التفسير:** **تعديل واحد كل مرة** — **يضمن نتيجة ويمنع Regression**. **اللون والخط = طلبان منفصلان**.

### Mission — اكتب طلب تعديل جراحي آمن

**المقدمة:** **١٠ دقائق كافية**.

**التسليم:**

1. **الصفحة أو العنصر** (مثل «زر الإرسال في صفحة الشات»)
2. **ما تريد تغييره بالضبط** (لون، حجم، مكان — **شيء واحد فقط**)
3. **الـ Prompt الجراحي الكامل**
4. **ما قلت «لا تغيّره»؟**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تعديل جراحي | 70% | **prompt يطلب تعديلًا واحدًا فقط**. **عنصر وصفحة محدّدان — ليس «الواجهة كلها»** |
| حماية من Regression | 30% | **فيه صريح «لا تغيّر أي شيء آخر» أو ما يعادله** |

### Confidence close

- **فهمت:** **التحسين = تعديل واحد كل مرة**. **«غيّر كل شيء» أبطأ وأخطر من التعديل الجراحي**.
- **تستطيع:** **prompt تعديل آمن — جاهز لأي واجهة**.
- **التالي:** **Debugging** — **عندما تفسد الأمور، كيف تصف المشكلة وتعزل السبب**.

---

## 5. Future generation notes

### Downstream locale packages

All Gulf / English / other locales derive from this MSA canonical script — **not** from Egyptian dialect copy directly.

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
| Concept preservation | 5 | Iteration, Regression only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 70/30 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — color only |
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
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
