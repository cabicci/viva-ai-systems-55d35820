# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m2-l1-feeling-to-question` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m2` |
| **productionTitle (ar-EG)** | حوّل الشعور لسؤال |
| **productionRoute** | `/learn/analyst/analyst-m2-l1-feeling-to-question` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m2-l1-feeling-to-question.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Feelings must become data questions — metric + period + comparison |
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
| `analyst-m2-l1-feeling-to-question.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | General work feelings are not enough — convert «I feel that…» into answerable data questions |
| **Mission rubric** | 60% 3 specific questions · 40% data source |
| **Quiz intent** | «Response time feels too long» — avg response time this month vs last (correctIndex 1) |
| **Concepts locked** | Feeling, Baseline |
| **Prerequisite** | `analyst-m1-l1-from-automation-to-insight` |
| **Next lesson** | `analyst-m2-l2-right-question-rule` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m2-l1-feeling-to-question
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m2-l1-feeling-to-question.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Feeling to Question
  oneAha: "Feelings become useful when converted to measurable questions with comparison"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m1-l1-from-automation-to-insight]

objectives:
  - id: obj-1
    statement: Learner distinguishes feeling from data question; converts vague statements to metric + period + comparison.
    measurable: true
  - id: obj-2
    statement: Learner converts 3 «I feel that…» statements to specific questions and names one data source for at least 2.
    measurable: true

concepts:
  - id: concept-feeling
    term: Feeling
    termEn: Feeling
    definition: A general sense without numbers — does not drive a clear decision.
    mustPreserve: true
  - id: concept-baseline
    term: Baseline
    termEn: Baseline
    definition: The normal number you compare against — to know if you are on track or not.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Feelings not enough — convert to answerable data questions; 3 conversions after lesson
  - role: tension
    intent: «Sales are bad» / «Ad not working» — everyone talks, no numbers; gut decisions backfire
  - role: core
    intent: Write feeling as-is → who/how many/when/compare → sharpen → actionable answer
  - role: comparison
    intent: Feeling vs question — no number/period vs metric + 30 days + cost
  - role: glossary
    intent: Feeling, Baseline
  - role: video
    intent: Watch — feeling to question — production Bunny unchanged
  - role: diagram
    intent: 4 examples — feeling → question, baseline, action (feeling-to-question-table)
  - role: quiz
    intent: CS response time feeling — avg minutes this month vs last (correctIndex 1)
  - role: mission
    intent: Convert 3 real «I feel that…» to questions; one source answers at least 2
  - role: confidence_close
    intent: 3 ready questions; next = right question rule

mission:
  type: practice
  intent: Practical conversion — 3 real feelings from work to metric + period + comparison; name data source for ≥2 — 10–15 min
  rubricIntent:
    - dimension: three_specific_questions
      weight: 60
      criteria: Each question has metric + period + comparison — not a vague question
    - dimension: data_source
      weight: 40
      criteria: One source can answer at least two of the three questions
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_feelings_or_questions_for_learner

termsLocked: [Feeling, Baseline]

links:
  nextLessonId: analyst-m2-l2-right-question-rule
  continuityNote: Right question rule — ensure the question is worth your time

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

- **ماذا ستفهم؟** الشعور العام عن العمل **لا يكفي** — يجب أن **يتحوّل** إلى **سؤال** تجيب عليه **البيانات**.
- **لماذا الآن؟** بعد أن عرفت أن **الأرقام** تحتاج **سؤالًا** — الخطوة التالية: تحويل «**أشعر أن…**» إلى **سؤال محدّد**.
- **ماذا بعد الدرس؟** ستحوّل **٣ جمل** «أشعر أن…» إلى **أسئلة قابلة للإجابة**.

### Tension — «المبيعات سيئة» — لكن لا أحد يعرف لماذا

- «**المبيعات سيئة**» **ليس سؤالًا** — إنه **شعور**. «**الإعلان لا يعمل**» — أيضًا **شعور**.
- الجميع **يتكلّم** — لكن **لا أحد** يستطيع الإجابة **بأرقام**.
- قرارات بال**حدس**: إيقاف إعلان → بعد أسبوعين تكتشف أنه كان يجلب **نصف العملاء**.
- **الذكاء الاصطناعي** يساعدك على **إعادة صياغة** الشعور كسؤال — **أنت** تختار السؤال الذي **يفعلًا** يهم **قرارك**.

### Core idea — السؤال يفتح الباب — الشعور يغلقه

1. اكتب **Feeling (الشعور)** كما هو: «العملاء غير راضين».
2. اسأل: **من؟** **كم؟** **متى؟** **مقارنة بماذا؟** — «كم عميلًا شكا **هذا الشهر**؟»
3. **خصّص أكثر:** «ما **أكثر ٣ شكاوى** تكرّرت؟»
4. كلما أصبح السؤال **أدق** — أصبحت الإجابة **قابلة للتنفيذ** — ويتحوّل **التذمّر** إلى **إدارة**.

### Comparison — شعور مقابل سؤال

| شعور | سؤال |
|------|------|
| «**أشعر أن الإعلان لا يعمل**» — **لا رقم**، **لا فترة**، **لا مقارنة**. القرار **بالحدس** | «**كم lead** جاء من هذا الإعلان **آخر ٣٠ يومًا** **وبكم**؟» — الرقم يقول: أوقفه أم **كبّره**. قرار **بلا ندم** |

### Glossary — مصطلحان للتحويل

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Feeling (شعور)** | إحساس **عام** **بلا أرقام** — **لا** يحرّكك لقرار واضح | «أشعر أن مبيعاتي قليلة» — **شعور**، **ليس** سؤالًا |
| **Baseline (خط الأساس)** | **الرقم العادي** الذي **تقارن** عليه — لتعرف: هل أنت **بخير** أم **لا** | «مبيعاتي ١٠٠ ألف — **متوسطي ١٥٠**» — **١٥٠** هي **Baseline** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من شعور إلى سؤال». **لا يُعاد توليده.**

### Diagram block (intent)

**٤ أمثلة — من شعور إلى قرار** (معرّف: `feeling-to-question-table`): لكل شعور — **سؤال محدّد**، **Baseline** للمقارنة، **إجراء واضح**. استخدمه في المهمة.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** قال مديرك: «**أشعر أن وقت رد** خدمة العملاء **أصبح طويلًا جدًا**». ما **أفضل سؤال** للبيانات؟

- خيار ١: هل اشتكى عملاء من طول وقت الرد مؤخرًا؟
- **الإجابة الصحيحة (خيار ٢):** **متوسط وقت الرد** أصبح **كم دقيقة** **هذا الشهر**، **مقارنة بالشهر الماضي**؟
- خيار ٣: هل أصبح العملاء غير راضين بسبب طول وقت الرد؟

**التفسير:** هذا السؤال يحوّل الشعور إلى **رقم قابل للقياس** + **مقارنة** — فتصبح الإجابة **قابلة للتنفيذ**.

### Mission — حوّل ٣ «أشعر أن…» إلى أسئلة

**المقدمة:** مهمة **تحويل عملي** — **ليس** تحليلًا إحصائيًا. اكتب **٣ جمل** «أشعر أن…» من **عملك الحقيقي** (أو من حولك). حوّل كل واحدة إلى **سؤال** تجيب عليه **البيانات**. **١٠–١٥ دقيقة** كافية.

**التسليم:** لكل شعور (١–٣):

- «أشعر أن…» (الشعور الأصلي)
- → السؤال المحدّد (**Metric + فترة + مقارنة**)

+ **مصدر واحد** يجيب على **سؤالين على الأقل** من الثلاثة (Sheet / CRM / Analytics…)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ أسئلة محدّدة | 60% | كل سؤال فيه **رقم أو مقياس** + **فترة** + **مقارنة** — ليس سؤالًا عامًا |
| مصدر للإجابة | 40% | مصدر **واحد** على الأقل يمكن الإجابة منه **سؤالين** |

### Confidence close

- **فهمت:** **Feeling** يصبح مفيدًا عندما **يتحوّل** إلى سؤال **تجيب** عليه البيانات — **ليس** عندما يبقى «أشعر أن…».
- **تستطيع:** **٣ أسئلة** جاهزة تبدأ بها أي **تحليل**.
- **التالي:** **Right Question Rule (قاعدة السؤال الصح)** — كيف تتأكد أن السؤال **يستحق** وقتك.

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
| Concept preservation | 5 | Feeling, Baseline only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — avg response time with comparison |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
