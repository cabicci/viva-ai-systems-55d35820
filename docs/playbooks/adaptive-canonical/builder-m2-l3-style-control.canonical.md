# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m2-l3-style-control` |
| **pathId** | `builder` |
| **moduleId** | `builder-m2` |
| **productionTitle (ar-EG)** | Style & Tone |
| **productionRoute** | `/learn/builder/builder-m2-l3-style-control` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m2-l3-style-control.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Style and Tone = product identity in every AI reply |
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
| `builder-m2-l3-style-control.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Make AI speak in your voice — not generic ChatGPT tone |
| **Mission rubric** | 60% clear voice profile · 40% before/after |
| **Quiz intent** | Beginner tool explanation — friendly peer tone best (correctIndex 1) |
| **Concepts locked** | Tone, Voice Profile |
| **Prerequisite** | `builder-m2-l2-instructions-examples` |
| **Next lesson** | `builder-m3-l1-context-layer` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m2-l3-style-control
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m2-l3-style-control.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Style Control
  oneAha: "Style and Tone = product identity in every AI reply"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m2-l2-instructions-examples]

objectives:
  - id: obj-1
    statement: Learner distinguishes Style, Tone, and Persona; links Voice Profile to System Prompt.
    measurable: true
  - id: obj-2
    statement: Learner writes a short Voice Profile with tone words, avoid/replace pair, and before/after example.
    measurable: true

concepts:
  - id: concept-tone
    term: Tone
    termEn: Tone
    definition: The feeling conveyed — formal, friendly, energetic, calm.
    mustPreserve: true
  - id: concept-voice-profile
    term: Voice Profile
    termEn: Voice Profile
    definition: Short description of product speech style — added to System Prompt.
    mustPreserve: true

blocks:
  - role: orientation
    intent: AI in your voice; write Voice Profile after lesson
  - role: tension
    intent: Generic product description → marketing cliché; personalization fixes tone
  - role: core
    intent: Style, Tone, Persona; Voice Profile in System Prompt
  - role: comparison
    intent: Vague request vs tone-specific perfume description
  - role: glossary
    intent: Tone, Voice Profile
  - role: video
    intent: Style and Tone in any Prompt — production Bunny unchanged
  - role: screenshot
    intent: Manifesto text with clear tone — not accident
  - role: quiz
    intent: Beginner tool — friendly peer tone (correctIndex 1)
  - role: mission
    intent: Write Voice Profile — tone, avoid/replace, before/after
  - role: confidence_close
    intent: Style = identity; next = Context Layer

mission:
  type: practice
  intent: Write short voice file for assistant or product content — tone in 3 words, avoid/replace, before/after — ~10–15 min
  rubricIntent:
    - dimension: voice_profile_clarity
      weight: 60
      criteria: Tone specific — not just «professional»; has word + replacement
    - dimension: before_after
      weight: 40
      criteria: Both examples truly different; second matches Profile
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_voice_profile_for_learner

termsLocked: [Tone, Voice Profile, Style, System Prompt, Persona]

links:
  nextLessonId: builder-m3-l1-context-layer
  continuityNote: Context Layer — right context at the right time

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

- **ماذا ستفهم؟** **كيف تجعل الذكاء الاصطناعي يتكلم بصوتك** — **ليس** بصوت «**ChatGPT العام**».
- **لماذا الآن؟** **المستخدم يشعر بالمنتج** من **نبرة المساعد والنصوص**. **نفس المعلومة** بإحساس مختلف = **منتج مختلف**.
- **ماذا بعد الدرس؟** ستكتب **Voice Profile (ملف صوت)** **قصيرًا** لمساعد أو محتوى.

### Tension — «اكتب وصف منتج» — وطلع كليشيه

- طلبت **وصف برفان** — وطلع: «**اكتشف سحر الرائحة الفاخرة التي تأسر القلوب...**»
- هذا **ليس صوتك** — هذا **صوت تسويقي محفوظ**. **كل منتج ذكاء اصطناعي** **بدون Style Guide (دليل أسلوب)** يخرج **نفس الكلام**.
- **Personalization (التخصيص)** = **تحدّد النبرة والكلمات** التي **تمثّلك** — **قبل** أن يرى المستخدم **أول رد**.

### Core idea — الذكاء الاصطناعي بصوتك = تجربة مخصّصة

- **Style (الأسلوب)** = **الشكل**: **رسمي** أم **عادي**؟ **نقاط** أم **فقرات**؟
- **Tone (النبرة)** = **الإحساس**: **هادئ**، **حماسي**، **مطمئن**؟
- **Persona (الشخصية)** = **الشخصية الكاملة**: «**تكلم كأنك خبير قهوة يخاطب مبتدئًا**».
- في **Builder**: **Voice Profile** في **System Prompt (طلب النظام)** = **كل رد يبدو من منتجك** — **ليس** من **أي محادثة عامة**.

### Comparison — طلب عام vs طلب بنبرة

| طلب عام | طلب بنبرة |
|---------|-----------|
| «**اكتب وصف برفان.**» — **نبرة تسويقية مكررة**: «فاخر»، «سحر»، «أسر القلوب» | «**اكتب وصف برفان** — **نبرة شاعر هادئ**، **جملتان**، **بدون** ‚فاخر‘ أو ‚سحر‘، **للقرّاء**.» — «**ريحة تبقى في الغرفة بعد أن تغلق الكتاب.**» |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Tone (النبرة)** | **الإحساس الذي يصل من الكلام** — رسمي، ودود، حماسي، هادئ | **إيميل لعميل** (رسمي) ≠ **دردشة مع صديق** (ودود) |
| **Voice Profile (ملف الصوت)** | **وصف قصير لأسلوب كلام منتجك** — **تضيفه** في **System Prompt** | «**جمل قصيرة**، **لغة بسيطة**، **بدون كلمات تسويقية** — **استبدل** ‚فاخر‘ **بـ** ‚مريح‘.» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Style و Tone — كيف تضبطهما في أي Prompt». **لا يُعاد توليده.**

### Screenshot block (intent)

**نبرة واضحة — ليست صدفة:**

«**تنفيذ قبل التنظير**»، «**نظام لا فوضى**» — **جمل قصيرة**، **موقف واضح**. هذا **نتيجة Prompt** **حدّد النبرة**: **manifesto (بيان)**، **بدون كليشيهات**. **نفس المعنى** بنبرة «**تسويقية**» كان **يبدو منتجًا آخر**.

### Quiz — تأكيد سريع

**السؤال:** **تشرح أداة جديدة لمبتدئين** — تريدهم **يشعرون أنك واحد منهم**. **ما النبرة الأنسب؟**

- خيار ١: **تقنية معقدة** — **مصطلحات كثيرة**
- **الإجابة الصحيحة (خيار ٢):** **صديق متحمس** — **بسيط وودود**
- خيار ٣: **تحذيرية** — **تخوّف من الخطأ**

**التفسير:** **نبرة الصديق** **تريح المبتدئ** — وهذا **ما تثبّته** في **Voice Profile** المساعد.

### Mission — اعمل Voice Profile

**المقدمة:** **اكتب ملف صوت قصير** لمساعد أو محتوى منتجك. **١٠–١٥ دقيقة**.

**التسليم:**

1. **النبرة في ٣ كلمات** (مثال: ودود، مباشر، بسيط)
2. **كلمة تتجنّبها + البديل** (مثال: بدل «حضرتك» → «أنت»)
3. **مثال قبل/بعد:**
   - **رد ذكاء اصطناعي عام** (سطر)
   - **نفس الرد بصوت برنامجك** (سطر)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ملف صوت واضح | 60% | **النبرة محددة** — **ليس** «احترافي» **فقط**؛ **فيه كلمة + بديل** |
| قبل / بعد | 40% | **المثالان مختلفان فعلًا**؛ **الثاني يطابق الـ Profile** |

### Confidence close

- **فهمت:** **Style و Tone** = **هوية المنتج** في **كل رد ذكاء اصطناعي**.
- **تستطيع:** **Voice Profile** **جاهز** تضيفه في **System Prompt**.
- **التالي:** **Context Layer (طبقة السياق)** — **السياق الصحيح في الوقت الصحيح**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Tone**, **Voice Profile**, **Style**, **System Prompt**, **Persona** preserved — gloss on first use. No new tools. Screenshot = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Tone, Voice Profile only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — friendly peer tone |
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
