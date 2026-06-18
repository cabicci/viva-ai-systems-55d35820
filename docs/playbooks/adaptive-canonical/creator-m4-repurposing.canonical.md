# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m4-repurposing` |
| **pathId** | `creator` |
| **moduleId** | `creator-m5-polish` |
| **productionTitle (ar-EG)** | Repurposing — مضاعف المحتوى |
| **productionRoute** | `/learn/creator/creator-m4-repurposing` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m4-repurposing.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | One strong piece becomes several — adapt per platform, not copy-paste |
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
| `creator-m4-repurposing.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Adapt one idea to 3 platform-fit formats — AI suggests, you judge voice and usefulness |
| **Mission rubric** | 60% three different formats · 40% your judgment edit |
| **Quiz intent** | AI multi-format adapt beats same link everywhere (correctIndex 1) |
| **Concepts locked** | Repurposing, Format Adaptation |
| **Prerequisite** | `creator-m5-l1-editing` |
| **Next lesson** | `creator-m5-l2-thumbnails-captions` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m4-repurposing
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m4-repurposing.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Repurposing — Content Multiplier
  oneAha: "One strong piece becomes several — adapt per platform, not copy-paste"
  difficulty: intro
  estimatedMinutes: 15
  prerequisites: [creator-m5-l1-editing]

objectives:
  - id: obj-1
    statement: Learner distinguishes adaptation from copy-paste across platforms.
    measurable: true
  - id: obj-2
    statement: Learner converts one original into 3 different platform-fit formats with one authenticity edit.
    measurable: true

concepts:
  - id: concept-repurposing
    term: Repurposing
    termEn: Repurposing
    definition: Turn one original piece into multiple formats with platform-specific adjustment.
    mustPreserve: true
  - id: concept-format-adaptation
    term: Format Adaptation
    termEn: Format Adaptation
    definition: Change length, tone, and structure for each publishing place.
    mustPreserve: true

blocks:
  - role: orientation
    intent: One strong piece → several — each platform gets its fit not paste
  - role: tension
    intent: Same post everywhere fails — each platform has different rhythm
  - role: core
    intent: Same core idea in reel, LinkedIn post, story questions — AI suggests you review
  - role: comparison
    intent: Copy same text vs AI-assisted smart adaptation
  - role: glossary
    intent: Repurposing, Format Adaptation
  - role: video
    intent: One idea multiple platforms — production Bunny unchanged
  - role: flow
    intent: Original → AI suggests formats → you choose and edit → publish
  - role: quiz
    intent: Multi-format AI adapt with your edits (correctIndex 1)
  - role: mission
    intent: One idea → 3 formats with one voice-preserving edit
  - role: confidence_close
    intent: Repurposing multiplies system — Thumbnail and caption next

mission:
  type: practice
  intent: Original plus 3 platform formats and one edit to keep your voice
  rubricIntent:
    - dimension: three_different_formats
      weight: 60
      criteria: Each format for different platform or shape — not same text copied
    - dimension: your_judgment
      weight: 40
      criteria: One edit showing you reviewed and chose your voice
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - generate_all_formats_without_learner_review

termsLocked: [Repurposing, Format Adaptation]

links:
  nextLessonId: creator-m5-l2-thumbnails-captions
  continuityNote: Thumbnail and caption next — the door that gets people in

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

- **ماذا ستفهم؟** **قطعة محتوى قوية واحدة** **قد تصبح عدة قطع** — **لكن لكل منصة شكلها المناسب** — **لا نسخ ولصق**.
- **لماذا الآن؟** **بعد المونتاج** **لديك محتوى أوضح**. **Repurposing (إعادة توظيف)** **يجعل نفس الفكرة تصل** **لمنصات أكثر** **من دون البدء من الصفر**.
- **بعد الدرس:** **تأخذ فكرة أو منشورًا أو سكريبتًا واحدًا** — **وتحوّله إلى ٣ صيغ مختلفة**.

### Tension — موقف مألوف

- **تأخذ نفس المنشور الطويل** **وتضعه على فيسبوك وLinkedIn وX** — **والنتيجة ضعيفة على كل منصة**.
- **هذا ليس Repurposing** — **بل copy-paste (نسخ ولصق)**. **كل منصة** **لها إيقاع وطول ونبرة مختلفة**.
- **AI** **يساعدك تستخرج الأفكار وتلخّص وتعيد الصياغة** — **وأنت تختار** **ما يبقى صادقًا ومفيدًا**.

### Core idea — تكييف — لا نسخ

- **Repurposing** **= نفس الفكرة الأساسية** **بأشكال تناسب كل منصة:** **ريل قصير**، **منشور LinkedIn**، **ثريد X**، **فقرة نشرة**، **أسئلة ستوري**.
- **فيديو أو منشور طويل واحد** **قد يُنتج:** **٣ سكريبتات قصيرة**، **منشورًا مهنيًا**، **٥ أسئلة تفاعل**.
- **AI يقترح صيغًا** — **أنت تراجع:** **هل النبرة لا تزال أنت؟** **هل المعلومة مفيدة في هذا الشكل؟**
- **مثال Prompt (طلب):** «**حوّل هذا المحتوى إلى:** **١) منشور LinkedIn قصير ٢) ٣ سكريبتات فيديو قصيرة ٣) ٥ أسئلة ستوري ٤) فقرة نشرة** — **واجعل كل نسخة مناسبة لمنصتها.**»

### Comparison — نسخ نفس النص أم تكييف ذكي؟

| نسخ نفس النص | تكييف بالـ AI |
|--------------|---------------|
| **منشور ٥٠٠ كلمة** **على LinkedIn وX** — **الناس تتخطّى**. **شكل واحد** **لا يناسب كل مكان** | **نفس الفكرة:** **ثريد ٥ تغريدات**، **ريل ٤٥ ثانية**، **سؤال ستوري واحد** — **كل واحد يخدم المنصة** |

### Glossary — مصطلحان للمضاعفة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Repurposing (إعادة توظيف)** | **تحويل قطعة أصلية** **لصيغ متعددة** **مع تعديل للمنصة** | **فيديو ٨ دقائق → ٣ مقاطع قصيرة + ملخص منشور** |
| **Format Adaptation (تكييف الصيغة)** | **تغيير الطول والنبرة والهيكل** **حسب مكان النشر** | **نفس النصيحة:** **جملة قوية على X** — **فقرة قصة على LinkedIn** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «فكرة واحدة، منصات متعددة». **لا يُعاد توليده.** **يمكنك متابعة القراءة** — **الدرس مكتفٍ بذاته**.

### Flow block — من الأصل إلى الصيغ

1. **قطعة أصلية واضحة** (فيديو / منشور / سكريبت)
2. **AI يقترح صيغًا لكل منصة**
3. **أنت تختار وتعدّل** — **تنشر بثقة**

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **لديك فيديو ١٠ دقائق** **عن نصيحة تسويق**. **أفضل Repurposing؟**

- خيار ١: **تنشر رابط الفيديو نفسه** **على كل المنصات** **بنفس التعليق**.
- **الإجابة الصحيحة (خيار ٢):** **تطلب من AI** **ريلًا قصيرًا + منشور LinkedIn + ٣ أسئلة ستوري** — **وتعدّل كل واحد**.
- خيار ٣: **تنسخ أول ٣ دقائق كنص على X** **من دون تعديل**.

**التفسير:** **Repurposing = تكييف لكل منصة**. **AI يُسرّع** — **الحكم والأصالة عليك**.

### Mission — فكرة واحدة → ٣ صيغ

**المقدمة:** **مضاعفة عملية** — **ليس نشرًا إلزاميًا**. **اختر فكرة أو منشورًا أو سكريبتًا** — **حوّله إلى ٣ صيغ مختلفة** — **عدّل ما لا يشبه صوتك**. **١٠–٢٠ دقيقة كافية**.

**التسليم:** الأصل · صيغة ١ (منصة + محتوى) · صيغة ٢ · صيغة ٣ · تعديل واحد للأصالة

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ صيغ مختلفة | 60% | **كل صيغة لمنصة أو شكل مختلف** — **لا نسخ نفس النص** |
| حكمك أنت | 40% | **تعديل واحد** **يوضّح أنك راجعت** **واخترت صوتك** |

### Confidence close

- **فهمت:** **Repurposing يضاعف نظام المحتوى** — **الفكرة واحدة**، **الأشكال متعددة**، **وAI يُختصر الشغل**.
- **تستطيع:** **تحوّل قطعة واحدة** **إلى ٣ صيغ جاهزة للمراجعة والنشر**.
- **التالي:** **Thumbnail (صورة الغلاف) والكابشن** — **الباب الذي يجعل الناس تدخل المحتوى**.

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
| Concept preservation | 5 | Repurposing, Format Adaptation only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — multi-format adapt |
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
