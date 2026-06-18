# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m1-l2-tokens-training` |
| **pathId** | `builder` |
| **moduleId** | `builder-m1` |
| **productionTitle (ar-EG)** | Tokens والتدريب |
| **productionRoute** | `/learn/builder/builder-m1-l2-tokens-training` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m1-l2-tokens-training.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Long prompts cost time and money — shorten before changing models |
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
| `builder-m1-l2-tokens-training.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Long input/output = more time and cost; every character in an AI feature counts |
| **Mission rubric** | 60% real comparison · 40% shortening analysis |
| **Quiz intent** | AI slow — first try shorten prompt and remove filler (correctIndex 1) |
| **Concepts locked** | Token, Training |
| **Prerequisite** | `builder-m1-l1-what-is-llm` |
| **Next lesson** | `builder-m2-l1-prompt-layer` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m1-l2-tokens-training
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m1-l2-tokens-training.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Tokens and Training
  oneAha: "Long prompts = time + cost — shorten before switching models"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m1-l1-what-is-llm]

objectives:
  - id: obj-1
    statement: Learner explains why long prompts increase latency and cost; identifies Token billing on input and output.
    measurable: true
  - id: obj-2
    statement: Learner compares long vs short prompt for same task; lists what was removed and links savings to product use.
    measurable: true

concepts:
  - id: concept-token
    term: Token
    termEn: Token
    definition: A small piece of text — a word or part of one. AI bills for tokens in and out.
    mustPreserve: true
  - id: concept-training
    term: Training
    termEn: Training
    definition: Phase before you use the model — learns from massive text. You use it; you do not train it.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Why long requests cost more; compare short vs long after lesson
  - role: tension
    intent: Long prompt with filler — slow or expensive; not always «slow model»
  - role: core
    intent: Text split into Tokens; input + output + context = bill; shorten non-essential
  - role: comparison
    intent: Filler intro vs direct «summarize in 3 bullets»
  - role: glossary
    intent: Token, Training
  - role: video
    intent: Why length matters — production Bunny unchanged
  - role: diagram
    intent: Prompt → tokenize → model → reply — each step consumes tokens (ai-summarization-flow)
  - role: quiz
    intent: AI slow — shorten prompt first (correctIndex 1)
  - role: mission
    intent: Same request long vs short; what removed; savings at 100 runs/day
  - role: confidence_close
    intent: Shorten before send; next = prompt layer

mission:
  type: practice
  intent: Same request in long and short form — list removed filler; estimate savings at 100 runs/day — ~10 min
  rubricIntent:
    - dimension: real_comparison
      weight: 60
      criteria: Both prompts same task; short version actually shorter
    - dimension: shortening_analysis
      weight: 40
      criteria: Named what was removed and why; linked to cost or speed in product
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_prompts_or_savings_for_learner

termsLocked: [Token, Training, Prompt]

links:
  nextLessonId: builder-m2-l1-prompt-layer
  continuityNote: Prompt layer — why the request shapes product behavior

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

- **ماذا ستفهم؟** **لماذا** الطلب **الطويل** يأخذ **وقتًا أطول** و**تكلفة أكبر** — وكيف يؤثر ذلك على **كل Prompt (طلب)** ستكتبه.
- **لماذا الآن؟** عندما تبني **ميزة ذكاء اصطناعي** في منتجك — **كل حرف** يُحاسَب عليه. **الاختصار** ليس ترفًا — بل **تصميم**.
- **ماذا بعد الدرس؟** ستقارن **Prompt** قصيرًا وطويلًا وتقول **ما الذي ستزيله**.

### Tension — Prompt طويل — والرد بطيء أو غالي

- كتبت **مقدمة طويلة** و«من فضلك» و«يا صديقي» — والرد جاء **بعد وقت**، أو **فاتورة API** زادت.
- ليس بالضرورة أن **النموذج** «بطيء» — غالبًا **أنت** أرسلت **كلامًا أكثر** من اللازم.
- في **Lovable** أو **Cursor**: كلما كان **Context (السياق)** أكبر — كلما كان **البناء والرد** أبطأ. **القاعدة:** **اختصر** — **تكسب**.

### Core idea — المدخلات والمخرجات الطويلة = وقت وتكلفة أكبر

- **الذكاء الاصطناعي** يقسّم كلامك إلى **قطع صغيرة (Tokens)** — **Token (توكن)** = كلمة أو **جزء** منها.
- **كل Token** في **الداخل** و**كل Token** في **الرد** يُحاسَب عليه: **سرعة**، **تكلفة**، **حد الذاكرة**.
- عندما **تبني**: **System Prompt** طويل + **سياق المستخدم** + **تاريخ المحادثة** = **فاتورة ووقت**. **اختصر** ما **ليس ضروريًا**.
- **اختصر الطلب**، **حدّد المطلوب**، **اشطب المقدمات** — **نفس النتيجة** غالبًا **بتكلفة أقل**.

### Comparison — نفس الطلب · صياغتان

| حشو ومقدمات | مباشر |
|-------------|--------|
| «يا صديقي الذكاء الاصطناعي، من فضلك لو سمحت ممكن تساعدني في حاجة بسيطة وهي إنك تلخّص لي المقال ده…» — **كل المقدمة** عدّاد **يلف على الفاضي** | «**لخّص المقال** في **٣ نقاط**.» — **جملة قصيرة**، **رد أسرع**، **تكلفة أقل**، **ونفس النتيجة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Token (توكن)** | **قطعة صغيرة** من النص — **الكلمة** أو **جزء** منها. **الذكاء الاصطناعي** يحاسب عليها **في الداخل والخارج** | «مرحبا» قد تكون **توken** أو **اثنتين** حسب **اللغة** و**النموذج** |
| **Training (التدريب)** | **مرحلة** قبل أن **تستخدم** النموذج — يتعلّم من **كمّ هائل** من النصوص. **أنت** **لا** تدربه؛ **تستخدمه** فقط | **ChatGPT** «**تدرّب**» على نصوص الإنترنت — **أنت** فقط **تكتب Prompt** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Tokens والتدريب: لماذا الطول يؤثر». **لا يُعاد توليده.**

### Diagram block (intent)

**من الطلب إلى الرد — كل خطوة تُحاسَب** (معرّف: `ai-summarization-flow`):

**Prompt → تقسيم Tokens → النموذج → رد**

كل خطوة في المسار **تستهلك Tokens**. عندما **تختصر الطلب** — **تختصر المسار** كله.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** إذا كان **الذكاء الاصطناعي** **بطيئًا** في الرد — ما **أول شيء** تجربه؟

- خيار ١: **تغيّر النموذج** فورًا.
- **الإجابة الصحيحة (خيار ٢):** **تختصر طلبك** وتشيل **المقدمات الزائدة**.
- خيار ٣: **تنتظر** وتعيد المحاولة **بلا تغيير**.

**التفسير:** **اختصار الطلب** أسرع **تحسين** — **قبل** تغيير **الأدوات** أو **النماذج**.

### Mission — Prompt قصير مقابل طويل — ما الذي ستزيله؟

**المقدمة:** **نفس الطلب** بصياغتين: **واحدة طويلة** و**واحدة مختصرة**. **١٠ دقائق** كافية.

**التسليم:**

1. **الطلب الطويل** (اكتبه أو انسخه)
2. **الطلب المختصر** (نفس المطلوب، **أقل كلام**)
3. **ما الذي شيلته** من الطويل؟ (مقدمات، تكرار، تفاصيل زائدة)
4. إذا **الميزة** في منتجك ستعمل **١٠٠ مرة/يوم** — **الاختصار** سيوفر **ماذا**؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مقارنة حقيقية | 60% | الطلبان **لنفس المطلوب**؛ **المختصر** **فعلًا** أقصر |
| تحليل الاختصار | 40% | حدّدت **ما** أُزيل **ولماذا**؛ **ربطت** بال**تكلفة** أو **السرعة** في المنتج |

### Confidence close

- **فهمت:** **الطلب الطويل** = **وقت وتكلفة أكبر**. **الاختصار** جزء من **تصميم** أي **ميزة ذكاء اصطناعي**.
- **تستطيع:** كتابة **Prompts** **مباشرة** و**إزالة الحشو** **قبل** الإرسال.
- **التالي:** **Prompt Layer (طبقة الطلب)** — **لماذا** الطلب = **سلوك المنتج**.

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
| Concept preservation | 5 | Token, Training only (+ Prompt gloss) |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — shorten prompt first |
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
