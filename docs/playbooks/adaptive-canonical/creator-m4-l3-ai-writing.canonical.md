# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m4-l3-ai-writing` |
| **pathId** | `creator` |
| **moduleId** | `creator-m4` |
| **productionTitle (ar-EG)** | AI كمساعد كتابة |
| **productionRoute** | `/learn/creator/creator-m4-l3-ai-writing` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m4-l3-ai-writing.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI speeds the draft — you edit at least three lines so the voice stays yours |
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
| `creator-m4-l3-ai-writing.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Use AI as draft helper — clear Context, take Draft, edit at least 3 lines by hand |
| **Mission rubric** | 40% Context quality · 60% personal edit |
| **Quiz intent** | Context + Draft + 3-line edit beats publish-as-is (correctIndex 1) |
| **Concepts locked** | Context, Draft, Edit Pass |
| **Prerequisite** | `creator-m4-l2-mobile-shooting` |
| **Next lesson** | `creator-m5-l1-editing` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m4-l3-ai-writing
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m4-l3-ai-writing.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: AI as Writing Assistant
  oneAha: "AI speeds the draft — you edit at least three lines so the voice stays yours"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m4-l2-mobile-shooting]

objectives:
  - id: obj-1
    statement: Learner writes a Prompt with clear Context — audience, goal, tone, length.
    measurable: true
  - id: obj-2
    statement: Learner takes an AI Draft and edits at least three lines to preserve personal voice.
    measurable: true

concepts:
  - id: concept-context
    term: Context
    termEn: Context
    definition: Information you give AI so it understands your request precisely.
    mustPreserve: true
  - id: concept-draft
    term: Draft
    termEn: Draft
    definition: First raw version of text before refinement.
    mustPreserve: true
  - id: concept-edit-pass
    term: Edit Pass
    termEn: Edit Pass
    definition: A human editing round to bring text closer to your voice.
    mustPreserve: true

blocks:
  - role: orientation
    intent: AI is writing assistant not replacement — draft then edit by hand
  - role: tension
    intent: Publishing AI text unchanged kills personality
  - role: core
    intent: Clear Prompt with Context, quick Draft, edit 3+ lines including opener and example
  - role: comparison
    intent: Copy-paste vs conscious edit with clear Context
  - role: glossary
    intent: Context, Draft, Edit Pass
  - role: video
    intent: Prompt → Draft → edit workflow — production Bunny unchanged
  - role: screenshot
    intent: Draft before and after personal edit
  - role: quiz
    intent: Context + Draft + 3-line edit (correctIndex 1)
  - role: mission
    intent: Write Prompt, paste AI Draft, edit 3 lines with reason
  - role: confidence_close
    intent: AI opens fast — you give the text its real voice

mission:
  type: practice
  intent: Full Prompt, raw AI Draft, 3 human edits with two-line reason
  rubricIntent:
    - dimension: context_quality
      weight: 40
      criteria: Prompt includes clear audience, goal, and tone
    - dimension: personal_edit
      weight: 60
      criteria: Three real edits with convincing reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - generate_draft_for_learner_without_edit

termsLocked: [Context, Draft, Edit Pass]

links:
  nextLessonId: creator-m5-l1-editing
  continuityNote: Editing next — cut excess so the message lands faster

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

- **ماذا ستفهم؟** **الذكاء الاصطناعي (AI)** **مساعد كتابة** — **ليس بديلًا عنك**.
- **AI** **يُسرّع العمل** — **لكن إن تركته كل شيء** **يخرج كلامًا عامًا** **يشبه غيرك**.
- **المطلوب:** **استخدمه كمسودة** — **ثم عدّل بيدك** **حتى يبقى الصوت صوتك**.

### Tension — المشكلة

- **نسخ نص AI كما هو** **يقتل شخصيتك**.
- **عندما تنشر** **من دون تعديل** — **المتابع يشعر** **أن الكلام متصنع ومكرّر**.
- **الفرق الحقيقي:** **أمثلتك**، **طريقتك**، **واختيارات كلماتك**.

### Core idea — اكتب Context واضحًا ثم عدّل النص

- **ابدأ بـ Prompt (طلب)** **فيه الجمهور والهدف والنبرة وطول المحتوى** — هذا **Context (سياق)** **واضح**.
- **اطلب Draft (مسودة) أولية سريعة** — **لا نصًا نهائيًا مثاليًا**.
- **بعدها عدّل ٣ سطور على الأقل بيدك:** **بداية أقوى**، **مثال منك**، **وخاتمة بطريقتك** — **Edit Pass (جولة تعديل)**.
- **أي جملة** **لا تشبهك** — **غيّرها فورًا** **حتى لو كانت سليمة لغويًا**.

### Comparison — نسخ مباشر أم تحرير واعٍ؟

| الأسلوب الضعيف | الأسلوب الأقوى |
|----------------|----------------|
| **Prompt عام** **ثم نشر النص كما هو** — **محتوى بارد ومتشابه** | **Prompt فيه Context واضح** **ثم تعديل يدوي للجمل الأساسية** — **أقرب لصوتك فعلًا** |

### Glossary — ٣ كلمات ستستخدمها دائمًا

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Context (سياق)** | **المعلومات** **التي تُعطيها للـ AI** **ليفهم طلبك بدقة** | **الجمهور:** **أصحاب أعمال صغيرة** |
| **Draft (مسودة)** | **أول نسخة خام** **من النص قبل التنقيح** | **مسودة ٨٠ كلمة** **لفيديو قصير** |
| **Edit Pass (جولة تعديل)** | **جولة تعديل بشرية** **لتقريب النص من صوتك** | **تغيير البداية** **وإضافة مثال شخصي** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Workflow سريع للكتابة». **لا يُعاد توليده.** **Prompt ثم Draft ثم تعديل** — **يمكنك تخطّي الفيديو** **والبدء بالمهمة**.

### Screenshot block (intent)

لقطة بصرية — **شكل Draft قبل وبعد التعديل**. **استخدم AI لتسريع البداية** — **لكن النسخة النهائية** **يجب أن تمرّ بتعديلك الشخصي**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **تريد كتابة فيديو قصير بصوتك الحقيقي بمساعدة AI** — **أي اختيار أدق؟**

- خيار ١: **أطلب نصًا كاملًا** **أنشره كما هو لتوفير الوقت**.
- **الإجابة الصحيحة (خيار ٢):** **أكتب Context واضحًا** — **آخذ Draft** — **ثم أعدّل ٣ سطور على الأقل بطريقتي**.
- خيار ٣: **أستخدم AI لتصحيح علامات الترقيم فقط** **من دون أي مسودة**.

**التفسير:** **هذا الأسلوب** **يوازن السرعة** **مع الحفاظ على شخصيتك** **في الكتابة**.

### Mission — اكتب Draft بالـ AI ثم عدّل ٣ سطور

**المقدمة:** **خطوتان واضحتان:** **مسودة من AI** — **ثم تعديل بشري منك** **على ٣ سطور** **حتى تظهر شخصيتك**.

**التسليم:** Prompt كامل · مسودة AI كما هي · ٣ سطور عدّلتها · سطران يشرحان لماذا التعديلات أقرب لصوتك

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| جودة الـ Context | 40% | **البرومبت فيه جمهور وهدف ونبرة واضحة** |
| التعديل الشخصي | 60% | **٣ تعديلات فعلية واضحة** **مع سبب مقنع** |

### Confidence close

- **فهمت:** **AI يفتح البداية بسرعة** — **وأنت** **تُعطي النص روحك الحقيقية**.
- **تستطيع:** **كل مرة تعدّل بوعي** — **صوتك يصبح أوضح** **وثقتك في الكتابة تزيد**.
- **التالي:** **المونتاج** — **قص الزائد** **وخلي المسار واضحًا**.

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
| Concept preservation | 5 | Context, Draft, Edit Pass only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 40/60 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — Context + Draft + edit |
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
| 6 | Mission rubric 40/60 | ☑ pass |
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
