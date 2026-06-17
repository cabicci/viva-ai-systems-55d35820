# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m4-l1-parameters` |
| **pathId** | `builder` |
| **moduleId** | `builder-m4` |
| **productionTitle (ar-EG)** | Parameters: Temperature + Top-p + Max tokens |
| **productionRoute** | `/learn/builder/builder-m4-l1-parameters` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m4-l1-parameters.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Temperature = stability vs creativity — per feature, not one global number |
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
| `builder-m4-l1-parameters.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Temperature balances reply stability vs creativity; when to tune per AI feature |
| **Mission rubric** | 60% three logical choices · 40% reason for each |
| **Quiz intent** | Code must be correct first try — low Temperature (correctIndex 0) |
| **Concepts locked** | Temperature, Parameters |
| **Prerequisite** | `builder-m3-l2-memory-limits` |
| **Next lesson** | `builder-m5-l1-transition` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m4-l1-parameters
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m4-l1-parameters.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Parameters (Temperature)
  oneAha: "Temperature = stability vs creativity — per feature, not one global number"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m3-l2-memory-limits]

objectives:
  - id: obj-1
    statement: Learner explains Temperature as stability vs creativity tradeoff with low/medium/high ranges.
    measurable: true
  - id: obj-2
    statement: Learner assigns Temperature to three feature types — facts, content, chat — with reasoning.
    measurable: true

concepts:
  - id: concept-temperature
    term: Temperature
    termEn: Temperature
    definition: Numeric setting — near 0 = stable; high = creative variety.
    mustPreserve: true
  - id: concept-parameters
    term: Parameters
    termEn: Parameters
    definition: API settings like Temperature — tune model behavior outside the Prompt.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Temperature balance; choose for 3 cases after lesson
  - role: tension
    intent: Same question twice → different answers; sometimes variety wanted, sometimes not
  - role: core
    intent: Temperature mechanics; ~0.2 facts, ~0.5 balance, ~1 creative
  - role: comparison
    intent: Low temp extraction vs high temp slogans
  - role: glossary
    intent: Temperature, Parameters
  - role: video
    intent: When to raise vs lower — production Bunny unchanged
  - role: screenshot
    intent: Uniform lesson cards — low temp suits structured content
  - role: quiz
    intent: Code first try — low Temperature (correctIndex 0)
  - role: mission
    intent: Temperature for facts, content, chat features with why
  - role: confidence_close
    intent: Per-feature settings; next = Transition to app building

mission:
  type: practice
  intent: Set Temperature for three imagined product features — facts, content, chat — with why each — ~10–15 min
  rubricIntent:
    - dimension: logical_choices
      weight: 60
      criteria: Facts → low; content → higher than facts
    - dimension: reasoning_per_choice
      weight: 40
      criteria: Each why tied to stability or variety; chat in reasonable range
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_temperature_choices_for_learner

termsLocked: [Temperature, Parameters, Prompt]

links:
  nextLessonId: builder-m5-l1-transition
  continuityNote: Transition — from prompting language to building the app

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

- **ماذا ستفهم؟** **Temperature (درجة الحرارة)** = **توازن بين ثبات الردود وإبداعها** — **ومتى تضبطها** في **كل ميزة ذكاء اصطناعي**.
- **لماذا الآن؟** **نفس السؤال مرتين** → **ردّان مختلفان** — **ليس دائمًا «خطأ»**؛ **ربما إعداداتك**.
- **ماذا بعد الدرس؟** **ستختار Temperature** **لـ ٣ حالات**: **حقائق**، **محتوى**، **محادثة**.

### Tension — نفس السؤال — ردّان مختلفان

- **سألت الذكاء الاصطناعي نفس السؤال مرتين** — **وخرج ردّان مختلفان**. **تشعر أنه «غير موثوق»**.
- **أحيانًا تريد تنوّعًا** (أفكار إعلانات). **وأحيانًا تريد نفس الإجابة** (كود، أرقام).
- **في منتجك**: **ميزة استخراج بيانات** = **ثبات**. **ميزة brainstorming (عصف ذهني)** = **إبداع**. **يجب أن تفصل**.

### Core idea — Temperature = ثبات vs إبداع

- **كل كلمة** **يختارها الذكاء الاصطناعي** **من احتمالات**. **Temperature** **تقول**: **خذ الأكثر توقّعًا (ثبات)** **أم جرّأة (إبداع)**؟
- **منخفض (~٠.٢)**: **نفس السؤال ≈ نفس الرد**. **للحقائق**، **الكود**، **استخراج JSON**.
- **متوسط (~٠.٥)**: **توازن** — **إيميلات**، **شرح**، **محادثة عامة**.
- **عالي (~١)**: **تنوّع وأفكار جديدة** — **عناوين**، **حملات**، **محتوى إبداعي**.

### Comparison — دقة vs brainstorming

| Temperature منخفضة | Temperature عالية |
|--------------------|-------------------|
| «**استخرج السعر من النص.**» — **تريد نفس النتيجة كل مرة**. **منخفض = موثوق للمنتج** | «**اقترح ٥ slogans (شعارات) لبراند قهوة.**» — **تريد مفاجآت**. **عالي = أفكار مختلفة كل مرة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Temperature (درجة الحرارة)** | **إعداد رقمي**: **قريب من ٠ = ثبات**. **عالي = إبداع وتنوّع** | **OpenAI**: ~**٠.٢** حقائق، ~**٠.٥** توازن، ~**١** إبداع |
| **Parameters (معاملات)** | **إعدادات API** **مثل Temperature** — **تضبط سلوك النموذج من خارج الـ Prompt** | **ميزة «تلخيص»** temp **منخفضة** — **ميزة «أفكار»** temp **عالية** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Temperature — ثبات vs إبداع في تصميم المنتج». **لا يُعاد توليده.**

### Screenshot block (intent)

**نفس الشكل — لأن الثبات مطلوب:**

**كروت الدروس** **نفس الشكل** — **صفر مفاجآت**. **هذا مناسب** **لمحتوى منظم** (temp **منخفضة**). **لو كانت temp عالية** — **كل كارت** **كان يخرج بترتيب وأسلوب مختلف** — **صعب تمشي في المنهج**.

### Quiz — تأكيد سريع

**السؤال:** **تكتب كودًا** **يجب أن يخرج صحيحًا من أول مرة**. **ما الأنسب؟**

- **الإجابة الصحيحة (خيار ١):** **Temperature منخفضة** — **ثبات ودقة**.
- خيار ٢: **Temperature عالية** — **أفكار جديدة**.
- خيار ٣: **Temperature متوسطة** — **للدردشة فقط**.

**التفسير:** **الكود والحقائق** = temp **منخفضة**. **الإبداع** **للـ brainstorming فقط**.

### Mission — Temperature لـ ٣ ميزات

**المقدمة:** **اضبط Temperature** **لثلاث حالات** في منتج تتخيله. **١٠–١٥ دقيقة**.

**التسليم:**

1. **ميزة حقائق** (استخراج بيانات، أسئلة FAQ، ترجمة حرفية):
   - **Temperature:** [منخفضة / متوسطة / عالية]
   - **لماذا:**
2. **ميزة محتوى** (منشورات، عناوين، أفكار):
   - **Temperature:** [...]
   - **لماذا:**
3. **ميزة محادثة** (مساعد يتكلم مع المستخدم):
   - **Temperature:** [...]
   - **لماذا:**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ اختيارات منطقية | 60% | **حقائق → منخفضة**؛ **محتوى → أعلى من الحقائق** |
| سبب لكل واحد | 40% | **كل «لماذا» مربوط بثبات أو تنوّع**؛ **المحادثة في نطاق معقول** (ليس extreme خطأ) |

### Confidence close

- **فهمت:** **Temperature** = **ثبات vs إبداع** — **ميزة ميزة** **وليس رقمًا واحدًا للكل**.
- **تستطيع:** **اختيار إعداد** **لكل نوع**: **حقائق**، **محتوى**، **محادثة**.
- **التالي:** **Transition (الانتقال)** — **من Prompting إلى بناء المنتج**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Temperature**, **Parameters**, **Prompt** preserved — gloss on first use. **OpenAI** reference from production only — no new tools. Screenshot = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Temperature, Parameters only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — low Temperature for code |
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
