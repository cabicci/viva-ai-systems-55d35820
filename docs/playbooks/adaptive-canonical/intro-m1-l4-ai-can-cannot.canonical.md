# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l4-ai-can-cannot` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | الـ AI يقدر يعمل إيه ومينفعش يعمل إيه؟ |
| **productionRoute** | `/learn/intro/intro-m1-l4-ai-can-cannot` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l4-ai-can-cannot.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | AI is strong in language — needs caution with facts; smart user knows when to trust and when to verify |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending**. Does **not** modify production files, Bunny video, or runtime.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `intro-m1-l4-ai-can-cannot.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Learner knows when to trust AI vs verify; classifies 3 real situations |
| **Mission rubric** | 70% logical classification · 30% personal thinking |
| **Quiz intent** | Nora summarizing 1-hour meeting — AI works, verify numbers if needed (correctIndex: 0) |
| **Concepts locked** | Hallucination, Verification |
| **Prerequisites** | `intro-m1-l3-setup-your-ai` |
| **Next lesson** | `intro-m1-l5-ai-vs-software` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l4-ai-can-cannot
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l4-ai-can-cannot.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: AI Can and Cannot
  oneAha: "AI strong in language — caution with facts; verification is normal"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [intro-m1-l3-setup-your-ai]

objectives:
  - id: obj-1
    statement: Learner distinguishes fast-trust tasks (writing, ideas) from verify-first tasks (numbers, law, medicine).
    measurable: true
  - id: obj-2
    statement: Learner classifies 3 real situations as AI-ok, AI-with-verification, or ask-human.
    measurable: true

concepts:
  - id: concept-hallucination
    term: Hallucination
    termEn: Hallucination
    definition: When AI states incorrect information with confidence.
    mustPreserve: true
  - id: concept-verification
    term: Verification
    termEn: Verification
    definition: Confirm important facts from a trusted source before relying on them.
    mustPreserve: true

blocks:
  - role: orientation
    intent: AI useful but not infallible; classify 3 situations after lesson
  - role: tension
    intent: AI answered confidently then was wrong — limits matter
  - role: core
    intent: Strong in language; caution with facts; verification is part of workflow
  - role: glossary
    intent: Hallucination (هلوسة); Verification (مراجعة)
  - role: video
    intent: Strength vs caution examples — production Bunny unchanged
  - role: comparison
    intent: Use fast (drafts, ideas) vs verify first (numbers, legal, financial)
  - role: screenshot
    intent: Simple trust map — strength left, caution right
  - role: quiz
    intent: Meeting summary = AI ok with spot-check on numbers (correctIndex: 0)
  - role: mission
    intent: Classify 3 real situations with reasoning
  - role: confidence_close
    intent: Verification normal; next = AI vs regular software

mission:
  type: practice
  intent: Pick 3 real situations; classify each as AI-ok / AI-with-verification / ask-human with one-line why
  rubricIntent:
    - dimension: logical_classification
      weight: 70
      criteria: 3 situations classified showing understanding of trust vs verification
    - dimension: personal_thinking
      weight: 30
      criteria: Each situation from learner's life or work — not empty generic examples
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_situations_for_learner

termsLocked: [Hallucination, Verification, AI]

links:
  nextLessonId: intro-m1-l5-ai-vs-software
  continuityNote: Next lesson — when to use AI vs regular software for each task

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

> **Dialect:** Modern Standard Arabic (neutral) · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** الـ AI مفيد جدًا — لكنه ليس معصومًا من الخطأ. المستخدم الذكي يعرف متى يثق ومتى يراجع.
- **لماذا الآن؟** في الدرس السابق فتحت AI وجربت أول رسالة. اليوم ستعرف كيف تستخدمه بأمان دون خوف من التجربة.
- **ماذا بعد الدرس؟** ستصنّف ٣ مواقف من حياتك — ما يناسب AI، وما يحتاج مراجعة، وما يفضّل فيه سؤال إنسان.

### Tension — موقف مألوف

هل رد الـ AI بثقة — ثم ظهر فيه خطأ؟

هذا يحدث. لا يعني أن الأداة «سيئة» — يعني أنك تحتاج معرفة حدودها.

أخطر شيء ليس أن الـ AI يخطئ. أخطر شيء أنه يخطئ بثقة — فتصدّق دون مراجعة.

الخبر الجيد: في مهام كثيرة الـ AI يوفر وقتًا كبيرًا. الهدف أن تعرف متى تستخدمه بسرعة ومتى تأخذ ثانية للمراجعة.

### Core idea — الفكرة الأساسية

**الـ AI قوي في اللغة — يحتاج حذرًا في الحقائق**

- يعمل جيدًا في: صياغة، تلخيص، ترتيب أفكار، عصف ذهني، شرح بأسلوب بسيط.
- يحتاج حذرًا في: أرقام دقيقة، أخبار اليوم، قانون وطب ومال، بيانات خاصة عنك أو شركتك.
- **Verification (مراجعة)** جزء من استخدام الـ AI — ليس دليل فشل ولا أن الأداة معطّلة. مثل مراجعة رسالة مهمة قبل الإرسال.
- قاعدة بسيطة: استخدمه بسرعة في الكتابة والأفكار. إذا كان الرد فيه رقم أو قرار مهم — راجعه من مصدر تثق فيه.

### Glossary — مصطلحان يحميانك

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Hallucination (هلوسة)** | عندما يقول الـ AI معلومة بثقة — والمعلومة غير صحيحة | رقم إحصائي أو تاريخ بلا مصدر حقيقي |
| **Verification (مراجعة)** | تتأكد من المعلومة المهمة من مصدر موثوق قبل الاعتماد عليها | إذا أعطى AI سعرًا أو تاريخًا — راجعه من موقع رسمي أو جدولك الأصلي |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny بأمثلة عملية على حدود الثقة. **لا يُعاد توليده**.

### Comparison — مثال من الحياة

| استخدم بسرعة | راجع قبل الاعتماد |
|--------------|-------------------|
| تلخيص اجتماع، مسودة بريد، ترتيب أفكار لمنشور — خذ الرد وعدّل بصوتك | سعر مادة اليوم، نصيحة قانونية، رقم مالي في تقرير — استخدم AI كبداية، وتحقق من مصدر موثوق |

### Screenshot block (intent)

خريطة بسيطة: على جانب — كتابة وتلخيص وأفكار (استخدم بثقة). على الجانب الآخر — أرقام وحقائق متغيرة (راجع قبل الاعتماد). الصورة توضّح الفكرة — ليست قاعدة خوف.

### Quiz — تأكيد سريع

**السؤال:** نورا تريد تلخيص اجتماع ساعة في ٥ نقاط. ما أفضل تصنيف؟

- **الإجابة الصحيحة (correctIndex: 0):** يناسب AI — وتراجع النقاط المهمة إذا فيها أرقام.
- **التفسير:** التلخيص من أقوى استخدامات الـ AI. المراجعة للتفاصيل الحساسة — لا للخوف من التجربة.

### Mission — مهمتك

**المقدمة:** اختر ٣ مواقف حقيقية من عملك أو دراستك أو يومك. صنّف كل واحد: يناسب AI / استخدمه مع مراجعة / الأفضل سؤال إنسان أو لا تشارك بيانات حساسة.

**التسليم (لكل موقف):** الموقف (جملة) · التصنيف · لماذا (سطر)

**معايير التقييم (unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف منطقي | 70% | ٣ مواقف مصنّفة توضّح الفرق بين الثقة والمراجعة |
| تفكير شخصي | 30% | كل موقف من حياتك أو عملك — لا أمثلة عامة فارغة |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** الـ AI مساعد قوي — والمراجعة جزء طبيعي من العمل معه.
- **تستطيع:** استخدامه بثقة في الكتابة والأفكار، والتحقق عندما يكون الموضوع فيه حقائق مهمة.
- **التالي:** في الدرس القادم ستعرف متى تستخدم AI ومتى تستخدم برنامجًا عاديًا — لتختار الأداة الصحيحة لكل مهمة.

---

## 5. Future generation notes

Downstream Gulf/EN from this MSA canonical only. Quiz correctIndex: 0 preserved. Mission 70/30 unchanged. Bunny frozen.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Always wins |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Suggest only |
| 4 | Default | Egyptian `ar-EG` unchanged |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending review |
| Concept preservation | 5 | Hallucination, Verification only |
| Beginner clarity | 4 | Simple sentences |
| MSA simplicity | 4 | Neutral MSA |
| Mission consistency | 5 | 70/30 matches production |
| Quiz integrity | 5 | correctIndex 0 |
| Assistant boundaries | 4 | Listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| All dimensions | — | **pending** |

| Human reviewer average | **pending** |
| **Production-ready?** | **no** |

### Human reviewer sign-off

| Field | Value |
|-------|-------|
| **Reviewer** | **pending** |
| **Date** | **pending** |
| **Decision** | **pending** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
