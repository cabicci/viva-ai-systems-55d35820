# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l6-learn-without-fear` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | اتعلم AI من غير خوف |
| **productionRoute** | `/learn/intro/intro-m1-l6-learn-without-fear` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l6-learn-without-fear.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Learning = small useful attempts repeated — not complete technical knowledge first |
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
| `intro-m1-l6-learn-without-fear.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Learner writes one small next step and one fear they won't let stop them |
| **Mission rubric** | 70% realistic step · 30% fear awareness |
| **Quiz intent** | Non-programmer Sara afraid to start — simple Prompt in safe task (correctIndex: 1) |
| **Concepts locked** | Iteration, Prompt, AI, Model, API |
| **Prerequisites** | `intro-m1-l5-ai-vs-software` |
| **Next lesson** | `intro-m1-l7-choose-your-path` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l6-learn-without-fear
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l6-learn-without-fear.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Learn Without Fear
  oneAha: "Small repeated attempts beat waiting to understand everything"
  difficulty: intro
  estimatedMinutes: 10
  prerequisites: [intro-m1-l5-ai-vs-software]

objectives:
  - id: obj-1
    statement: Learner identifies one small safe AI step to take soon.
    measurable: true
  - id: obj-2
    statement: Learner names one fear and states why it will not block progress.
    measurable: true

concepts:
  - id: concept-iteration
    term: Iteration
    termEn: Iteration
    definition: Improve step by step — adjust the request until the result works for you.
    mustPreserve: true

blocks:
  - role: orientation
    intent: No technical background needed; small useful attempts; write next step + fear after
  - role: tension
    intent: Feeling late or that everyone else understands — you're in Intro = you started
  - role: core
    intent: Three fears same fix = small try today; bad reply = feedback not failure
  - role: glossary
    intent: Iteration (تحسين خطوة بخطوة)
  - role: video
    intent: You don't need to be technical — production Bunny unchanged
  - role: comparison
    intent: Wait to understand everything vs one safe small try today
  - role: screenshot
    intent: Loop — try, notice, adjust, repeat
  - role: quiz
    intent: Sara non-programmer — simple Prompt in safe task (correctIndex: 1)
  - role: mission
    intent: Write small next step + one fear + why it won't stop you
  - role: confidence_close
    intent: Keep small attempts; next = choose your path (Intro capstone)

mission:
  type: reflection
  intent: Write one small upcoming AI step, one fear, and why that fear won't block you — honest two lines enough
  rubricIntent:
    - dimension: realistic_step
      weight: 70
      criteria: Specific small step — not huge vague goal
    - dimension: fear_awareness
      weight: 30
      criteria: Real fear named and decision it won't stop you — even if simple
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_fear_or_step_for_learner

termsLocked: [Iteration, Prompt, AI, Model, API]

links:
  nextLessonId: intro-m1-l7-choose-your-path
  continuityNote: Final Intro lesson — choose one path based on real problem

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

- **ماذا ستفهم؟** لا تحتاج أن تكون تقنيًا — تحتاج تجارب صغيرة مفيدة تتكرر.
- **لماذا الآن؟** في الدرس السابق عرفت متى تستخدم AI ومتى تستخدم برنامجًا. قبل اختيار المسار، نزيل الحاجز الذي يوقف كثيرًا: الخوف.
- **ماذا بعد الدرس؟** ستكتب خطوة صغيرة قادمة — وخوفًا واحدًا لن تسمح له بإيقافك.

### Tension — موقف مألوف

هل تشعر أنك متأخر — أو أن الجميع يفهم إلا أنت؟

كثيرون يقولون: بالتأكيد أحتاج برمجة، هذا ليس لي، فاتني القطار.

الحقيقة: أنت في Intro الآن — وهذا يعني أنك بدأت. المتأخر الحقيقي هو من يشاهد دون أن يجرب.

الـ AI ليس امتحان ذكاء. هو أداة تتعلمها كأي مهارة — بمحاولات صغيرة، لا بفهم كل شيء مرة واحدة.

### Core idea — الفكرة الأساسية

**التعلم = محاولات صغيرة — لا معرفة كاملة**

- أكثر ٣ مخاوف توقف المبتدئين: «أنا متأخر»، «أنا غير تقني»، «الجميع يفهم إلا أنا». الحل واحد: تجربة صغيرة اليوم.
- لا تحتاج فهم Model أو API. تحتاج كتابة جملة، رؤية الرد، وقول «عدّله هكذا» — كما تعلمت في دروس الـ **Prompt (طلب)** والتجربة الأولى.
- إذا لم يعجبك الرد، هذا ليس فشلًا — هذا تغذية راجعة. اطلب تعديلًا واحدًا: أقصر، أوضح، بنبرة مختلفة.
- ابدأ في أمور آمنة: رسالة، تلخيص ملاحظات، فكرة منشور. بعد الارتياح، استخدمه في عمل أهم.

### Glossary — مصطلح واحد

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Iteration (تحسين خطوة بخطوة)** | لا تنتظر ردًا مثاليًا من أول مرة — عدّل الطلب مرة ومرتين حتى يناسبك | «اختصره في ٥ نقاط» أو «اجعل النبرة أودّ» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — طريقة بسيطة للتجربة اليومية. **لا يُعاد توليده**.

### Comparison — مثال من الحياة

| تنتظر فهم كل شيء | تجربة صغيرة |
|------------------|-------------|
| تشاهد شروحات كثيرة وتبقى خائفًا من التجربة. المعرفة تزيد والمهارة تبقى صفر | Prompt واحد آمن. ترى الرد، تطلب تعديلًا، وتتعلم من النتيجة. كرر غدًا |

### Screenshot block (intent)

مسار خطوات: جرّب → لاحظ → عدّل → كرر. كل خطوة صغيرة تبني ثقة. إذا كان الرد ضعيفًا — عدّل السؤال وتعلّم.

### Quiz — تأكيد سريع

**السؤال:** سارة ليست مبرمجة وخائفة من البداية. ما أفضل خطوة الآن؟

- **الإجابة الصحيحة (correctIndex: 1):** تكتب Prompt بسيطًا في مهمة آمنة مثل رسالة أو تلخيص.
- **التفسير:** البداية باللغة الطبيعية وتجربة صغيرة — لا بالبرمجة ولا بالانتظار.

### Mission — مهمتك

**المقدمة:** تأمل عملي — اكتب خطوة صغيرة ستفعلها قريبًا مع AI، وخوفًا واحدًا قررت أنه لن يوقفك. سطران صادقان يكفيان.

**التسليم:**
1. خطوتي الصغيرة القادمة (جملة واحدة)
2. خوف واحد لدي من AI أو التعلم
3. لماذا هذا الخوف لن يوقفني (جملة أو جملتان)

**معايير التقييم (unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| خطوة واقعية | 70% | خطوة صغيرة محددة — لا هدف ضخم أو عام |
| وعي بالخوف | 30% | خوف حقيقي وقرار أنه لن يوقفك — حتى لو بسيطًا |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** لا تحتاج أن تكون تقنيًا — تحتاج إكمال محاولات صغيرة مفيدة.
- **تستطيع:** اختيار خطوة واحدة وتنفيذها دون أن يوقفك الخوف.
- **التالي:** في الدرس الأخير من Intro ستختار مسارًا واحدًا يناسب مشكلتك الحقيقية — لا ما يبدو أجمل على الورق.

---

## 5. Future generation notes

Downstream locales from MSA only. Quiz correctIndex: 1. Mission 70/30 unchanged. Bunny frozen.

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
| Concept preservation | 5 | Iteration + prior Intro terms only |
| Beginner clarity | 4 | Simple sentences |
| MSA simplicity | 4 | Neutral MSA |
| Mission consistency | 5 | 70/30 matches production |
| Quiz integrity | 5 | correctIndex 1 |
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
| 7 | Quiz unchanged (correctIndex: 1) | ☑ pass |
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
