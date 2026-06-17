# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m1-l1-why-content` |
| **pathId** | `creator` |
| **moduleId** | `creator-m1` |
| **productionTitle (ar-EG)** | ليه المحتوى مش Posting؟ |
| **productionRoute** | `/learn/creator/creator-m1-l1-why-content` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m1-l1-why-content.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.2-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **5-lesson MSA canonical pilot** (Creator path) |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Content is a system — audience + problem + repeatable format — not random posting |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **approved-for-next-batch** |
| **humanReviewerSignOffDate** | 2026-06-04 |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: approved-for-next-batch** (Project Owner · 2026-06-04) — approved only for **controlled canonical expansion**, **not** production rollout or localization. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `creator-m1-l1-why-content.ts` (Egyptian blocks + mission) | **Frozen** — production source of truth for default UX |
| Bunny video for this lesson | **Frozen** — existing playback unchanged |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** — localization layers on top later |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner sees difference between random posting and a content system; exits with audience + problem + repeatable format frame |
| **Block sequence** | Orientation → tension → core → comparison → glossary → video → screenshot → quiz → mission → confidence close |
| **Mission rubric** | 60% promise clarity · 40% repeatability |
| **Quiz intent** | Daily posts with no direction — first fix = clear content promise + repeatable format type |
| **Concepts locked** | Content System, Content Promise, Repeatable Format, AI |
| **Next lesson continuity** | Attention economy — why attention is scarce currency |

### Derivation method

1. Read Egyptian production TS blocks (read-only).
2. Extract objectives, block roles, mission intent, rubric weights, quiz answer key.
3. Normalize learner-facing prose to **neutral Arabic MSA** — same meaning, no Egyptian dialect surface forms.
4. Do **not** write back to production or generate locale packages in this phase.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m1-l1-why-content
canonicalVersion: 2026-06-04.2-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m1-l1-why-content.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Why Content Is Not Posting
  oneAha: "Content system = fixed audience + clear problem + repeatable format"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner distinguishes random posting from a content system with audience, problem, and repeatable format.
    measurable: true
  - id: obj-2
    statement: Learner writes one content promise covering who, problem, repeatable type, and one-sentence pledge.
    measurable: true

concepts:
  - id: concept-content-system
    term: Content System
    termEn: Content System
    definition: Fixed audience + clear problem + repeatable content type — not daily improvisation.
    mustPreserve: true
  - id: concept-content-promise
    term: Content Promise
    termEn: Content Promise
    definition: What the audience expects from you every time.
    mustPreserve: true
  - id: concept-repeatable-format
    term: Repeatable Format
    termEn: Repeatable Format
    definition: Content shape you can reuse without starting from zero each time.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Real work is building a system — not posting more; exit with audience + problem + format frame
  - role: tension
    intent: Daily posting, weak results — effort without direction
  - role: core
    intent: Content system = fixed promise to defined audience; AI helps ideas — learner judges fit
  - role: comparison
    intent: Random posting vs repeatable content system
  - role: glossary
    intent: Content System, Content Promise, Repeatable Format — English glossed once
  - role: video
    intent: Optional chaos-to-system demo — production Bunny unchanged
  - role: screenshot
    intent: Visual of ordered content path
  - role: quiz
    intent: No-direction daily posts — fix = promise + repeatable type
  - role: mission
    intent: Write content promise — who, problem, repeatable type, one-sentence pledge
  - role: confidence_close
    intent: System vs random posting; next = attention economy

mission:
  type: practice
  intent: Write content promise with audience, problem, repeatable type, one-sentence pledge — practice not test
  rubricIntent:
    - dimension: promise_clarity
      weight: 60
      criteria: Specific audience; clear understandable problem
    - dimension: repeatability
      weight: 40
      criteria: Chosen content type is repeatable consistently
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_audience_or_promise_for_learner

termsLocked: [Content System, Content Promise, Repeatable Format, AI]

links:
  nextLessonId: creator-m1-l2-attention-economy
  continuityNote: Next — attention economy and why people scroll past

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine for Gulf, English, and future locales · **Not:** replacement for live Egyptian copy

### Orientation — بداية واضحة

- في هذا الدرس ستكتشف أن العمل الحقيقي ليس النشر كثيرًا، بل بناء **نظام محتوى (Content System)** يجعل كل قطعة لها هدف.
- ستخرج بإطار بسيط: **لمن** تتحدث، **ما المشكلة**، و**ما نوع المحتوى** الذي يمكنك تكراره بثبات.

### Tension — واقع متكرر

- كثيرون ينشرون يوميًا، لكن لا تفاعل حقيقي ولا رسائل جدية.
- المشكلة غالبًا ليست في الجهد — المشكلة أن النشر يحدث **من دون اتجاه ثابت**.

### Core idea — الفكرة الأساسية

**نظام محتوى = قرارات ثابتة**

- عندما يصبح المحتوى نظامًا، كل منشور يخدم **وعد محتوى (Content Promise)** واضحًا لجمهور محدد.
- **الذكاء الاصطناعي (AI)** يساعدك على إخراج أفكار وإعادة صياغة بسرعة — لكن الحكم على ما يناسبك يجب أن يكون **قرارك أنت**.

### Comparison — مقارنة سريعة

| نشر عابر | نظام محتوى |
|----------|------------|
| فكرة كل يوم من الصفر — تعب أعلى ونتائج متذبذبة | رسالة ثابتة ونوع محتوى متكرر — الجمهور يفهمك أسرع ويثق بك أكثر |

### Glossary — ٣ مصطلحات للدرس

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Content System (نظام محتوى)** | جمهور محدد + مشكلة واضحة + نوع محتوى متكرر | كل أسبوع نفس نوع النصائح العملية لنفس الشريحة |
| **Content Promise (وعد المحتوى)** | ما يتوقعه الناس منك كل مرة | معي ستحصل على خطوات بسيطة قابلة للتطبيق — لا كلامًا عامًا |
| **Repeatable Format (شكل متكرر)** | شكل محتوى تعيده بسهولة من دون البدء من الصفر | منشور ثابت: مشكلة → ٣ خطوات → ملخص سريع |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري «من العشوائية للنظام». **لا يُعاد توليده** في هذه المرحلة.

### Screenshot block (intent)

لقطة توضح ترتيب المحتوى كمسار واضح بدل نشر عشوائي — كل جزء له دور. (الأصل البصري في الإنتاج المصري يبقى كما هو.)

### Quiz — سؤال واحد للتطبيق

**السؤال:** شخص ينشر يوميًا لكن كل منشور بشكل مختلف ومن دون اتجاه — ما أقرب خطوة لتصحيح المسار؟

- **الإجابة الصحيحة:** يحدد **وعد محتوى (Content Promise)** واضحًا ويختار **نوع محتوى متكرر (Repeatable Format)**.
- **التفسير:** التحسن الحقيقي يبدأ من وضوح الوعد والنمط المتكرر — لا من زيادة الكمية.

### Mission — اكتب وعد المحتوى بتاعك

**المقدمة:** المهمة تدريب عملي — لا اختبار. اكتب وعد محتوى يحدد: لمن، المشكلة، نوع محتوى تكرره.

**التسليم:** (١) أنا أتحدث إلى: [فئة] · (٢) المشكلة الأساسية: [مشكلة] · (٣) نوع المحتوى المتكرر: [نوع] · (٤) وعدي في جملة واحدة: [جملة]

**معايير التقييم (من الإنتاج — unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الوعد | 60% | الفئة محددة؛ المشكلة واضحة |
| قابلية التكرار | 40% | نوع المحتوى قابل للتكرار بثبات |

### Confidence close — إقفال الدرس

- أنت الآن ترى الفرق بين نشر عشوائي و**نظام محتوى (Content System)** حقيقي.
- **التالي:** اقتصاد الانتباه — كيف يقرر الناس أن يكملوا أو يتخطوا.

---

## 5. Future generation notes

### Downstream locale packages (not created in this artifact)

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect copy directly |
| `en` | This MSA canonical | Egyptian dialect copy directly |

### Generation stages (when authorized)

1. **Gulf package** — MSA → Gulf naturalness; preserve Content System / Promise / Format glosses on first use.
2. **English package** — MSA → plain English; same mission rubric weights.
3. **Assistant profile** — per locale; must not write promise or pick audience for learner.
4. **Video script** — optional beat map from MSA; production Bunny for `ar-EG` stays frozen.

### Explicitly deferred

- Bunny video regeneration · Remotion render · RAG seed update · runtime wiring · PATHS changes

---

## 6. Localization UX notes

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §8 — **future runtime**:

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** |

Manual locale choice overrides automatic detection. Egyptian remains default.

---

## 7. Quality scoring

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §9 — **draft self-assessment is not final**; scale requires **human reviewer score**.

### Draft self-assessment (not final)

Informational only — does **not** authorize scale or production use.

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| **Objective preservation** | 4 | Objectives present; pending human review |
| **Concept preservation** | 5 | Content System, Promise, Format only |
| **Beginner clarity** | 4 | Simple MSA; pending read-aloud |
| **MSA simplicity** | 4 | Neutral MSA; pending dialect scan |
| **Mission consistency** | 5 | 60/40 rubric matches production |
| **Quiz integrity** | 5 | Promise + repeatable format answer unchanged |
| **Assistant boundaries** | 4 | forbiddenAssistantBehaviors listed |
| **Localization readiness** | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer sign-off (via review packet)

Recorded in [`HUMAN_REVIEW_PACKET_5_LESSONS.md`](HUMAN_REVIEW_PACKET_5_LESSONS.md) — per-dimension scores not recorded; decision **approve with notes**.

| Field | Value |
|-------|-------|
| **Reviewer** | Project Owner |
| **Date** | 2026-06-04 |
| **Decision** | approve with notes |
| **Next-batch authorization** | yes — **controlled canonical expansion only** |
| **Note** | Approved only for controlled canonical expansion — **not** production rollout or localization |

| Human reviewer average | **not scored — approve with notes via packet** |
| **Next controlled batch authorized?** | **yes — approved-for-next-batch** |
| **Production-ready?** | **no** |

---

## 8. Review checklist

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §10.

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production file untouched | ☑ pass (read-only derivation) |
| 2 | Bunny video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production (60/40) | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian — not back-translated | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded (informational only) | ☑ pass |
| 14 | Human reviewer sign-off recorded — next-batch gate met | ☑ pass (approve with notes · 2026-06-04) |
| 15 | **Draft / not production-ready** stated explicitly | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☑ **Project Owner · 2026-06-04 · approved-for-next-batch** |

---

*Artifact owner: Adaptive Lesson Engine · 5-lesson MSA canonical pilot · Draft only · Does not modify production lesson, video, or runtime.*
