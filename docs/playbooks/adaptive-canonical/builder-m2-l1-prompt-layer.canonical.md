# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m2-l1-prompt-layer` |
| **pathId** | `builder` |
| **moduleId** | `builder-m2` |
| **productionTitle (ar-EG)** | تشريح الـ Prompt |
| **productionRoute** | `/learn/builder/builder-m2-l1-prompt-layer` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m2-l1-prompt-layer.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Prompt = product behavior — System Instruction defines the assistant before the first user question |
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
| `builder-m2-l1-prompt-layer.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Prompt is the layer that defines AI feature behavior; write a System Instruction for a simple assistant |
| **Mission rubric** | 60% clear instructions · 40% practical example |
| **Quiz intent** | Best prompt for sweets shop posts includes name, product, place, duration — specific details beat vague requests |
| **Concepts locked** | Prompt, System Instruction, Lovable, Cursor |
| **Prerequisites** | `builder-m1-l2-tokens-training` |
| **Next lesson** | `builder-m2-l2-instructions-examples` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m2-l1-prompt-layer
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m2-l1-prompt-layer.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: The Prompt Layer
  oneAha: "Prompt = product behavior — System Instruction before first user question"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m1-l2-tokens-training]

objectives:
  - id: obj-1
    statement: Learner explains Prompt as product-behavior layer (System Instruction + user request), not a single question.
    measurable: true
  - id: obj-2
    statement: Learner writes a System Instruction for one simple assistant with role, tone, accept/reject rules, and example Q&A.
    measurable: true

concepts:
  - id: concept-prompt
    term: Prompt
    termEn: Prompt
    definition: Everything written to the AI — clearer request yields more usable output in a real product.
    mustPreserve: true
  - id: concept-system-instruction
    term: System Instruction
    termEn: System Instruction
    definition: Fixed text defining the assistant's role and rules before any user question.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Prompt is behavior layer; first prompt = first UX; write System Instruction after
  - role: tension
    intent: Vague request → generic reply; System Prompt missing = empty assistant for every user
  - role: core
    intent: Prompt = System Instruction + user ask; Builder sets hidden behavior; product thinking not code
  - role: comparison
    intent: Vague marketing plan vs specific pizza restaurant Cairo one-week plan
  - role: glossary
    intent: Prompt (الأمر); System Instruction (تعليمات النظام)
  - role: video
    intent: Optional — how prompt layer shapes assistant behavior — production Bunny unchanged
  - role: screenshot
    intent: Organized curriculum page built from detailed prompt vs vague page request
  - role: quiz
    intent: Sweets shop posts — option with name, product, place, duration wins
  - role: mission
    intent: Write System Instruction for support / lesson explainer / content ideas assistant — 10–15 min
  - role: confidence_close
    intent: Prompt = product behavior; next = Instructions vs Examples

mission:
  type: practice
  intent: Write System Instruction for one assistant type — role, tone, accept/reject, example Q&A — not a chat transcript
  rubricIntent:
    - dimension: clear_instructions
      weight: 60
      criteria: Role defined (not generic assistant); accept/reject rules present
    - dimension: practical_example
      weight: 40
      criteria: Example matches rules; reply imaginable in a real product
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_assistant_role_or_rules_for_learner

termsLocked: [Prompt, System Instruction, Lovable, Cursor]

links:
  nextLessonId: builder-m2-l2-instructions-examples
  continuityNote: Instructions vs Examples — why examples beat description alone

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

- **ماذا ستفهم؟** **Prompt (الطلب)** ليس «سؤالًا واحدًا» — بل الطبقة التي تحدّد سلوك أي ميزة ذكاء اصطناعي في منتجك.
- **لماذا الآن؟** في Lovable و Cursor، أول **Prompt** للمساعد = أول تجربة للمستخدم. الغموض هنا يعني منتجًا ضعيفًا.
- **ماذا بعد الدرس؟** ستكتب **System Instruction (تعليمات النظام)** لمساعد بسيط.

### Tension — موقف مألوف

- طلبت من الذكاء الاصطناعي شيئًا عامًا — فخرج رد عام بلا فائدة.
- كأنك تسأل صديقك «ماذا نأكل؟» فيجيب «أي شيء». المشكلة ليست الذكاء — المشكلة نقص التفاصيل.
- عندما تبني مساعدًا في منتجك، **System Prompt** هو «شخصية وقواعد المساعد» — إن كان ناقصًا، كل مستخدم سيرى نفس الردود الفارغة.

### Core idea — Prompt = سلوك المنتج

- **Prompt** = كل ما تكتبه للذكاء الاصطناعي: **System Instruction** (من هو وكيف يرد) + طلب المستخدم.
- في **Builder**: **System Prompt** ثابت خلف الكواليس — المستخدم يرى مربع السؤال فقط. أنت تحدّد السلوك.
- كلما كان الطلب أوضح (منتج، جمهور، مدة، شكل الرد)، كانت المخرجات قابلة للاستخدام في منتج حقيقي.
- لا تحتاج كودًا — تحتاج تفكير منتج: لمن يخدم هذا المساعد؟ ماذا يرد؟ وماذا يرفض؟

### Comparison — طلب غامض vs طلب واضح

| طلب غامض | طلب واضح |
|----------|----------|
| «اعمل خطة تسويق.» — الذكاء الاصطناعي لا يعرف لِمَ ولِمَن. النتيجة كلام عام منسوخ. | «اعمل خطة تسويق لمطعم بيتزا جديد في القاهرة — أسبوع واحد، جمهور شباب ١٨–٢٥.» — رد عملي يمكن تنفيذه. |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Prompt (الطلب)** | الطلب الذي تكتبه للذكاء الاصطناعي — كلما كان أوضح، كان الرد أدق | «لخّص في ٣ نقاط» أفضل من «لخّص.» |
| **System Instruction (تعليمات النظام)** | النص الثابت الذي يحدّد دور المساعد قبل أي سؤال من المستخدم | «أنت مساعد دعم لمحل عصير — رد بالعربية الفصحى البسيطة، جمل قصيرة.» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تحدّد طبقة **Prompt** سلوك المساعد في أي منتج. **لا يُعاد توليده**.

### Screenshot block (intent)

صفحة منهج منظمة — هيدر، شريط تقدّم، ومراحل مرقّمة. بُنيت بـ **Prompt** فيه الهيكل والترتيب وشكل كل مرحلة. لو كان الطلب «اعمل صفحة منهج» فقط، لكانت قائمة عادية. الفرق = التفاصيل في **Prompt**.

### Quiz — تأكيد سريع

**السؤال:** تريد أن يعمل الذكاء الاصطناعي على بوستات لمحل حلويات «سكر زيادة» في القاهرة — كنافة بالمانجو — لمدة أسبوع. ما أفضل **Prompt**؟

- **الإجابة الصحيحة:** **اقترح أفكار بوستات لمدة أسبوع لمحل «سكر زيادة» في القاهرة — كنافة بالمانجو**
- **التفسير:** التفاصيل (الاسم، المنتج، المكان، المدة) = رد قابل للاستخدام في منتج حقيقي.

### Mission — اكتب System Instruction لمساعد

**المقدمة:** ستكتب تعليمات نظام لمساعد ذكاء اصطناعي بسيط — ليست محادثة، بل «قواعد العمل». ١٠–١٥ دقيقة.

**التسليم:** اختر واحدًا (مساعد دعم لمتجر أونلاين · مساعد يشرح دروسًا لمبتدئين · مساعد يقترح أفكار محتوى). يتضمّن: (١) الدور (٢) أسلوب الكلام (٣) ما يرد عليه وما يرفضه (٤) مثال سؤال + رد في سطرين.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تعليمات واضحة | 60% | الدور محدّد — ليس «مساعدًا عامًا»؛ فيه قواعد رد ورفض |
| مثال عملي | 40% | المثال يطابق القواعد؛ الرد قابل للتخيّل في منتج |

### Confidence close

- **فهمت:** **Prompt** = سلوك المنتج. **System Instruction** تحدّد المساعد قبل أول سؤال.
- **تستطيع:** كتابة تعليمات نظام واضحة لأي ميزة ذكاء اصطناعي — من دون كود.
- **التالي:** **Instructions vs Examples** — لماذا المثال أقوى من الوصف.

---

## 5. Future generation notes

Downstream locales from MSA only. Tool names (Lovable, Cursor) preserved from production — gloss only, no new tools. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Prompt, System Instruction only — production tool names as references |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Specific-details answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

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
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
