# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m3-l2-ai-summarization` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m3` |
| **productionTitle (ar-EG)** | AI = أسرع محلّل عندك |
| **productionRoute** | `/learn/analyst/analyst-m3-l2-ai-summarization` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m3-l2-ai-summarization.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI summarizes fast — but only with a clear question, context, and decision-ready output |
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
| `analyst-m3-l2-ai-summarization.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | AI can summarize in seconds — but needs clear question, context, and decision-linked output |
| **Mission rubric** | 50% question + context · 50% observations + decision |
| **Quiz intent** | 30 customer messages — best step: copy sample with data type + period + extract 3 observations + one decision (correctIndex 1) |
| **Concepts locked** | Summarization, Context |
| **Prerequisite** | `analyst-m3-l1-three-sources` |
| **Next lesson** | `analyst-m4-l1-pattern-vs-outlier` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m3-l2-ai-summarization
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m3-l2-ai-summarization.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: AI Summarization
  oneAha: "Useful summary = question + context + one possible decision — not a generic 'summarize this'"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m3-l1-three-sources]

objectives:
  - id: obj-1
    statement: Learner distinguishes empty Prompt from decision-ready Prompt with data type, period, and specific ask.
    measurable: true
  - id: obj-2
    statement: Learner runs AI on a small sample and delivers 3 specific observations plus one decision linked to the top observation.
    measurable: true

concepts:
  - id: concept-summarization
    term: Summarization
    termEn: Summarization
    definition: Turning lots of data into few observations — only with a clear question.
    mustPreserve: true
  - id: concept-context
    term: Context
    termEn: Context
    definition: Information that helps AI understand what the data is and who it is for.
    mustPreserve: true

blocks:
  - role: orientation
    intent: AI summarizes fast with clear question + context; after lesson 3 observations + one decision
  - role: tension
    intent: «Summarize this» → generic output; problem is empty question not AI
  - role: core
    intent: Question + context + output (3 observations + one decision); AI reads, you verify
  - role: comparison
    intent: Empty Prompt vs decision-ready Prompt with WhatsApp sample
  - role: glossary
    intent: Summarization, Context
  - role: video
    intent: Watch — AI as analysis tool — production Bunny unchanged
  - role: diagram
    intent: Data + question + context → 3 observations → one decision (ai-summarization-flow)
  - role: quiz
    intent: 30 messages — copy with context + specific ask (correctIndex 1)
  - role: mission
    intent: Small sample + full Prompt + 3 observations + one decision + one verification point
  - role: confidence_close
    intent: Summarization skill ready; next = pattern vs outlier

mission:
  type: practice
  intent: Practical — small table or sample (10–20 rows); AI observations you can act on; clear question required
  rubricIntent:
    - dimension: question_and_context
      weight: 50
      criteria: Prompt includes data type + period + specific question
    - dimension: observations_and_decision
      weight: 50
      criteria: 3 specific observations — not generic description; one decision linked to an observation
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_prompt_or_data_for_learner

termsLocked: [Summarization, Context]

links:
  nextLessonId: analyst-m4-l1-pattern-vs-outlier
  continuityNote: Pattern vs Outlier — do not change strategy because of one strange number

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **الذكاء الاصطناعي** يستطيع **تلخيص** بياناتك في **ثوانٍ** — لكن يجب أن تعطيه **سؤالًا واضحًا** و**Context (سياقًا) محدّدًا**.
- **لماذا الآن؟** في الدرس السابق **جمعت مصادرك** في مكان واحد. الآن وقت أن **تستخرج ملاحظات** بدل قراءة **كل سطر**.
- **ماذا بعد الدرس؟** ستعطي **الذكاء الاصطناعي** جدولًا صغيرًا أو **عينة بيانات** وتطلب **٣ ملاحظات + قرارًا محتملًا واحدًا**.

### Tension — «لخّص لي هذا» — والنتيجة كلام عام

- كثيرون يرسلون **٥٠ رسالة** للذكاء الاصطناعي ويقولون «**لخّص**». النتيجة: **جمل عامة** لا تساعد في **قرار**.
- المشكلة **ليس** الذكاء الاصطناعي — المشكلة أن **السؤال فارغ**. **من دون سياق** و**من دون سؤال محدّد**، أي ملخّص يبدو «**جميلًا**» لكنه **غير مفيد**.
- **الذكاء الاصطناعي** أسرع **محلّل** عندك — **أنت** تحدّد: **ما الذي تريد معرفته؟** و**ما الذي سيتغيّر** إذا عرفته؟

### Core idea — ملخّص مفيد = سؤال + سياق + قرار محتمل

- **السؤال:** ليس «**لخّص**» — بل «**ما أكثر ٣ مشاكل تكرّرت؟**» أو «**ما الذي تغيّر عن الأسبوع الماضي؟**»
- **السياق:** نوع البيانات، **الفترة**، و**مصدرها** — «هذه رسائل عملاء **آخر ٧ أيام**» أو «هذه **١٥ صفًا** من شيت المبيعات».
- **المخرج المطلوب:** **٣ ملاحظات محدّدة + قرار واحد** ممكن أن تتخذه — **ليس** وصفًا عامًا للبيانات.
- **الذكاء الاصطناعي** يقرأ **بدلًا عنك** — **أنت** تتحقّق وتقرّر. إذا لم تكن الملاحظة **مربوطة بقرار**، اطلب **مرة أخرى** بسؤال **أوضح**.

### Comparison — Prompt (طلب) فارغ مقابل Prompt جاهز للقرار

| سؤال فارغ | سؤال + سياق |
|-----------|-------------|
| «**لخّص لي** هذه الرسائل». النتيجة: «العملاء لديهم أسئلة متنوعة» — **ولا تعرف** ماذا تفعل | «هذه **٤٠ رسالة واتساب** آخر أسبوع. استخرج: ١) **أكثر ٣ شكاوى** تكرّرت ٢) **أي طلب جديد** ظهر ٣) **قرار واحد** ممكن أن آخذه هذا الأسبوع». النتيجة **جاهزة للتنفيذ** |

### Glossary — مصطلحان للملخّص

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Summarization (تلخيص)** | تحويل **بيانات كثيرة** إلى **ملاحظات قليلة** — **بشرط** سؤال واضح | بدل قراءة **١٠٠ رسالة**، تخرج «**٧٠٪** يسألون عن التوصيل» |
| **Context (سياق)** | معلومات تجعل **الذكاء الاصطناعي** يفهم **ما هذه البيانات** و**لمن** | «رسائل عملاء **محل حلويات** — **آخر ٧ أيام** — **قبل موسم العيد**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «AI كأداة تحليل». **لا يُعاد توليده.**

### Diagram block (intent)

**من البيانات إلى القرار** (معرّف: `ai-summarization-flow`): **بيانات + سؤال + سياق → ٣ ملاحظات → قرار واحد**. نفس المسار يعمل على رسائل، فواتير، أو أي جدول صغير.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** لديك **٣٠ رسالة عميل** آخر أسبوع. تريد معرفة إن كان هناك **مشكلة متكررة** تستحق **قرارًا**. ما **أفضل خطوة**؟

- خيار ١: ترسل للذكاء الاصطناعي «**لخّص الرسائل**» **من دون** تفاصيل.
- **الإجابة الصحيحة (خيار ٢):** **تنسخ العينة** وتكتب: **نوع البيانات + الفترة + «استخرج ٣ ملاحظات متكررة + قرارًا واحدًا محتملًا»**.
- خيار ٣: تقرأ **كل رسالة** بنفسك وتتجاهل الذكاء الاصطناعي.

**التفسير:** **الملخّص المفيد** يبدأ **بسؤال وسياق**. **الذكاء الاصطناعي** يسرّع القراءة — **أنت** تحدّد **ما الذي تحتاج معرفته**.

### Mission — لخّص عينة صغيرة واستخرج قرارًا

**المقدمة:** مهمة **تطبيق عملي** — **ليس** نظريًا. خذ **جدولًا صغيرًا** أو **عينة بيانات** (**١٠–٢٠ صفًا** يكفي) واستخدم **الذكاء الاصطناعي** لاستخراج ملاحظات **يمكنك التحرّك** عليها. **لا بيانات ضخمة مطلوبة** — **سؤال واضح** و**مخرج مربوط بقرار** مطلوبان.

**التسليم:**

1. مصدر البيانات + عدد الصفوف/الأسطر
2. **Prompt (الطلب)** الذي أرسلته — **انسخه كاملًا** (فيه **سؤال + سياق**)
3. **٣ ملاحظات** — كل واحدة **سطر**
4. **قرار واحد محتمل** بناءً على **أهم ملاحظة**
5. **ما الذي تحتاج** التأكد منه **قبل** تنفيذ القرار؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| سؤال وسياق | 50% | **Prompt** فيه **نوع البيانات + فترة + سؤال محدّد** |
| ملاحظات وقرار | 50% | **٣ ملاحظات محدّدة** — **ليس** وصفًا عامًا؛ **قرار واحد** مربوط بملاحظة |

### Confidence close

- **فهمت:** **الذكاء الاصطناعي** يلخّص **بسرعة** — لكن **السؤال والسياق** عليك. **الملخّص بدون قرار = وقت ضائع**.
- **تستطيع:** **تمرّر** أي **عينة بيانات** وتستخرج **ملاحظات جاهزة** للمراجعة والقرار.
- **التالي:** **Pattern vs Outlier (نمط مقابل استثناء)** — كيف **لا تغيّر** استراتيجيتك بسبب **رقم غريب واحد**.

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
| Concept preservation | 5 | Summarization, Context only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — context + specific ask |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
