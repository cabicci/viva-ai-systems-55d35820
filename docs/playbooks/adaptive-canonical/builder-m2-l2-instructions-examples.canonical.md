# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m2-l2-instructions-examples` |
| **pathId** | `builder` |
| **moduleId** | `builder-m2` |
| **productionTitle (ar-EG)** | Instructions vs Examples |
| **productionRoute** | `/learn/builder/builder-m2-l2-instructions-examples` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m2-l2-instructions-examples.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Examples teach AI the shape — adjectives alone fail |
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
| `builder-m2-l2-instructions-examples.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | When to describe vs show examples; examples fix output quality in product AI |
| **Mission rubric** | 60% two consistent examples · 40% pattern analysis |
| **Quiz intent** | Same-shape posts — Few-shot examples best (correctIndex 0) |
| **Concepts locked** | Instructions, Few-shot Prompting |
| **Prerequisite** | `builder-m2-l1-prompt-layer` |
| **Next lesson** | `builder-m2-l3-style-control` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m2-l2-instructions-examples
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m2-l2-instructions-examples.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Instructions vs Examples
  oneAha: "Examples teach AI the shape — adjectives alone fail"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m2-l1-prompt-layer]

objectives:
  - id: obj-1
    statement: Learner distinguishes Instructions (rules/steps) from Examples (show desired output shape).
    measurable: true
  - id: obj-2
    statement: Learner builds a Prompt with two examples + explicit pattern line for a repeated output type.
    measurable: true

concepts:
  - id: concept-instructions
    term: Instructions
    termEn: Instructions
    definition: Rules and steps in words — suited to structured tasks.
    mustPreserve: true
  - id: concept-few-shot
    term: Few-shot Prompting
    termEn: Few-shot Prompting
    definition: Give AI 2–3 examples of desired shape before the actual request.
    mustPreserve: true

blocks:
  - role: orientation
    intent: When to describe vs show; write Prompt with two examples + pattern after lesson
  - role: tension
    intent: Detailed adjectives → cliché output; AI imitates patterns better than vague traits
  - role: core
    intent: Instructions vs Examples; Few-shot in Builder/Lovable; one example beats 100 adjectives
  - role: comparison
    intent: Describe headlines vs show one headline pattern to copy
  - role: glossary
    intent: Instructions, Few-shot Prompting
  - role: video
    intent: When to describe vs show — production Bunny unchanged
  - role: screenshot
    intent: Matching cards from one example — pattern replication
  - role: quiz
    intent: Same-shape posts — Few-shot best (correctIndex 0)
  - role: mission
    intent: Weak request → add two examples + pattern line; name the pattern
  - role: confidence_close
    intent: Examples teach shape; next = Style Control

mission:
  type: practice
  intent: Take weak podcast-ideas request; add two examples + pattern line; state pattern learned — ~10–15 min
  rubricIntent:
    - dimension: consistent_examples
      weight: 60
      criteria: Both examples same style; clear pattern line present
    - dimension: pattern_analysis
      weight: 40
      criteria: Named the pattern (not just «better»); usable in product Prompt
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_examples_or_pattern_for_learner

termsLocked: [Instructions, Few-shot Prompting, Prompt, Pattern]

links:
  nextLessonId: builder-m2-l3-style-control
  continuityNote: Style Control — how the assistant speaks in your voice

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

- **ماذا ستفهم؟** **متى** تصف بالكلام و**متى** تُري **مثالًا** — وكيف يفرّق ذلك في **جودة مخرجات الذكاء الاصطناعي** في منتجك.
- **لماذا الآن؟** كثير من **Prompts (الطلبات)** تفشل **ليس** لأن **الذكاء الاصطناعي** «ضعيف» — بل لأنك **وصفته بصفات** («احترافي»، «إبداعي») **بدل** أن تُري **الشكل**.
- **ماذا بعد الدرس؟** ستكتب **Prompt** فيه **مثالان** + **سطر نمط (pattern)** واضح.

### Tension — شرحت بالتفصيل — والرد أي كلام

- كتبت «**اكتب بأسلوب جذّاب ومميز**» — والرد جاء **كليشيهات**: «اكتشف السحر» و«تجربة فريدة».
- **الذكاء الاصطناعي** **بارع في التقليد** أكثر من **فهم الصفات العامة**.
- عندما **تبني ميزة** (عناوين، ردود دعم، كروت واجهة): **مثالان صحيحان** = **أسلوب ثابت** لكل المستخدمين.

### Core idea — المثال يعلّم أفضل من الصفة

- **Instructions (تعليمات)** = **خطوات أو قواعد بالكلام**: «اعمل ١، ٢، ٣».
- **Examples (أمثلة)** = **أرِه شكل الرد** الذي تريده: «**اعمل مثل هذا وهذا**».
- **الذكاء الاصطناعي** **يقلّد الأنماط**. **مثال واحد أو اثنان** أقوى من **١٠٠ صفة** («قصير»، «ودود»، «مبدع»).
- في **Builder**: عندما تطلب من **Lovable** «**اعمل ٤ كروت مثل هذا الكارت**» — هذا **Few-shot Prompting (طلب بأمثلة قليلة)**. **نفس الفكرة** في أي **Prompt**.

### Comparison — وصف vs مثال — نفس الطلب

| وصف بالكلام | مثال يقلّده |
|-------------|-------------|
| «**اكتب لي ٣ عناوين جذّابة** لمنتج عسل.» — غالبًا «عسل النحل الذهبي» و«شفاء من الطبيعة» — **كلام عام** | «**اكتب لي ٣ عناوين** لعسل، **على نمط**: ‚ذهب سائل من الطبيعة‘.» — **الردود كلها شاعرية** مثل المثال |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Instructions (تعليمات)** | **قواعد وخطوات بالكلام** — مناسبة للمهام المنظمة | «**اقرأ المقال** → **حدّد ٣ أفكار** → **لخّص كل واحدة في سطر**.» |
| **Few-shot Prompting (طلب بأمثلة قليلة)** | **تعطي الذكاء الاصطناعي ٢–٣ أمثلة** للشكل المطلوب **قبل** الطلب الفعلي | **إيميلان** للرد على العملاء + «**اكتب ردًا** على الإيميل الجديد **بنفس الأسلوب**.» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Instructions vs Examples — متى توصف ومتى تُري». **لا يُعاد توليده.**

### Screenshot block (intent)

**كروت متطابقة — من مثال واحد:**

الكروت **كلها نفس التنسيق**. **ليس** من تعليمات طويلة — من **مثال واحد**: «**اعمل كارتًا مثل هذا** للمسارات الأخرى.» **الذكاء الاصطناعي** فهم **النمط (pattern)** و**قلّده**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** تريد **منشورات بنفس شكل**: «**فطار متوازن يجعل يومك أفضل**». **ما أفضل طريقة؟**

- **الإجابة الصحيحة (خيار ١):** **أعطه ٢–٣ أمثلة بنفس الشكل (Few-shot)**.
- خيار ٢: **أكتب له تعليمات طويلة** عن «شكل الجملة».
- خيار ٣: **أقل له اكتب منشورات عن العادات** وخلاص.

**التفسير:** عندما **الشكل صعب أن توصفه** — **الأمثلة تثبّت النمط**. هذا **أساس أي ميزة محتوى** في منتجك.

### Mission — مثالان + pattern — لنفس الطلب

**المقدمة:** **طلب ضعيف** → **أضف مثالين** + **جملة pattern**. **١٠–١٥ دقيقة** كافية.

**التسليم:**

1. **الطلب الضعيف:** «**اكتب لي ٣ أفكار لبودكاست** عن ريادة الأعمال»
2. **الطلب المحسّن** — أضف:
   - **مثال ١** (فكرة + عنوان)
   - **مثال ٢** (فكرة + عنوان)
   - **سطر pattern:** «**اكتب لي ٣ أفكار على نفس النمط**»
3. **ما النمط (pattern) الذي علّمه المثالان؟** (جملة واحدة)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مثالان متسقان | 60% | **المثالان بنفس الأسلوب**؛ **فيه سطر pattern واضح** |
| تحليل النمط | 40% | **وصفت الـ pattern** — **ليس** «**أصبح أفضل**» فقط؛ **قابل للاستخدام** في **Prompt منتج** |

### Confidence close

- **فهمت:** **الأمثلة تعلّم الذكاء الاصطناعي الشكل** — **الصفات العامة لا تكفي**.
- **تستطيع:** بناء **Prompts** فيها **٢–٣ أمثلة** + **pattern** لأي **مخرج متكرّر**.
- **التالي:** **Style Control (التحكم في الأسلوب)** — **كيف يتكلم المساعد بصوتك**.

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
| Concept preservation | 5 | Instructions, Few-shot only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Few-shot examples |
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
