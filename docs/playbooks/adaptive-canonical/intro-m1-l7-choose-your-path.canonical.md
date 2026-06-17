# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l7-choose-your-path` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | اختار مسارك |
| **productionRoute** | `/learn/intro/intro-m1-l7-choose-your-path` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l7-choose-your-path.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Choose the path that solves your real problem — not what looks most impressive on paper |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending**. Does **not** modify production files, Bunny video, or runtime. **Intro capstone** — next lesson depends on chosen path (sentinel in §3).

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `intro-m1-l7-choose-your-path.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Learner chooses one path (Business, Creator, Analyst, Automator, Builder) based on real 2-month goal |
| **Mission rubric** | 70% goal-based decision · 30% clarity of choice |
| **Quiz intent** | Mona loses time on repetitive follow-up messages — Automator (correctIndex: 0) |
| **Concepts locked** | Path, Builder, Business, Creator, Analyst, Automator |
| **Prerequisites** | `intro-m1-l6-learn-without-fear` |
| **Next lesson** | `pending-path-validation` — learner's chosen path first lesson (not sequential in Intro PATHS) |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l7-choose-your-path
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l7-choose-your-path.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Choose Your Path
  oneAha: "One path for one real problem — not five starts at once"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [intro-m1-l6-learn-without-fear]

objectives:
  - id: obj-1
    statement: Learner maps five paths to problem types (Business, Creator, Analyst, Automator, Builder).
    measurable: true
  - id: obj-2
    statement: Learner commits to one path with 2–3 sentences tied to a real goal and one 2-month outcome.
    measurable: true

concepts:
  - id: concept-path
    term: Path
    termEn: Path
    definition: Focused lesson series on one skill type — not required to finish all paths.
    mustPreserve: true
  - id: concept-builder
    term: Builder
    termEn: Builder
    definition: Optional deep technical path for building apps and tools — not the platform's core promise.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Five paths solve different problems; one clear decision after Intro complete
  - role: tension
    intent: Want all 5 paths at once → distraction worse than slow focus
  - role: core
    intent: Level 1 User (Business, Creator, Analyst); Level 2 Operator (Automator); Level 3 Builder optional
  - role: glossary
    intent: Path (مسار); Builder (باني)
  - role: video
    intent: Choose by problem — production Bunny unchanged
  - role: comparison
    intent: All paths at once vs one path to one result
  - role: screenshot
    intent: Curriculum map — levels not race
  - role: quiz
    intent: Repetitive follow-up messages = Automator (correctIndex: 0)
  - role: mission
    intent: Choose one path; 2–3 sentences why; one 2-month outcome — Intro capstone
  - role: confidence_close
    intent: Intro complete; open chosen path first lesson

mission:
  type: reflection
  intent: Choose one path; explain 2–3 sentences linked to real goal; state one outcome for next two months
  rubricIntent:
    - dimension: goal_based_decision
      weight: 70
      criteria: Path linked to real problem or goal — not general curiosity
    - dimension: clarity_of_choice
      weight: 30
      criteria: 2–3 sentences explain why this path fits now
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_path_for_learner

termsLocked: [Path, Builder, Business, Creator, Analyst, Automator]

links:
  nextLessonId: pending-path-validation
  continuityNote: Learner opens chosen path first lesson — Intro PATHS ends here; next slug is path-dependent

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

- **ماذا ستفهم؟** المسارات الخمسة ليست سباق شعبية — كل واحد يحل نوع مشكلة مختلف.
- **لماذا الآن؟** أكملت Intro: فهمت AI، كتبت Prompt، جربت أداة، عرفت حدود الثقة، واختارت الأداة المناسبة. الآن وقت قرار واحد واضح.
- **ماذا بعد الدرس؟** ستختار مسارًا واحدًا وتشرح لماذا — بناءً على هدف حقيقي عندك، لا على ما يبدو «أقوى».

### Tension — موقف مألوف

هل تريد البدء في الـ ٥ مسارات معًا؟

الحماس يجعلك تريد Business و Creator و Builder وكل شيء مرة واحدة.

لكن ٥ بدايات مفتوحة غالبًا = صفر نتيجة ملموسة. التشتت أخطر من البطء.

القرار الصحيح: مسار واحد أولًا — نتيجة واحدة — ثم إضافة مسار ثانٍ إذا احتجت.

### Core idea — الفكرة الأساسية

**اختر المسار الذي يحل مشكلتك — لا ما يبدو أجمل**

- المنصة مرتبة على ٣ مستويات. Intro (الذي أكملته) = البداية للجميع.
- **المستوى ١ — AI User:** **Business** (تشغيل عملك بـ AI)، **Creator** (محتوى وجمهور بـ AI)، **Analyst** (قرارات أذكى بالأرقام وAI).
- **المستوى ٢ — AI Operator:** **Automator** (عمل متكرر يعمل تلقائيًا — متابعة، تقارير).
- **المستوى ٣ — AI Builder:** **Builder (باني)** — اختياري وعميق. لبناء أدوات وتطبيقات بـ AI. ليس الوعد الأساسي للمنصة؛ لمن يريد بناء منتج بنفسه.
- اسأل نفسك: ما أكبر مشكلة أريد حلها في الشهرين القادمين؟ المسار الذي يطابقها هو اختيارك.

### Glossary — مصطلحان للخريطة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Path (مسار)** | مجموعة دروس مركّزة على نوع مهارة واحد — لا يلزم إكمال كل المسارات | تبدأ بـ Creator إذا مشكلتك محتوى وجمهور |
| **Builder (باني)** | مسار تقني اختياري لبناء تطبيقات وأدوات — لمن يريد الغوص أعمق | إذا مشكلتك «لدي فكرة تطبيق» — لا إذا مشكلتك «أريد منشورًا أسبوعيًا» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — ٥ مشاكل شائعة و٥ مسارات. **لا يُعاد توليده**.

### Comparison — مثال من الحياة

| كل المسارات مرة واحدة | مسار واحد لنتيجة واحدة |
|-----------------------|------------------------|
| أول درس من كل مسار — وبعد شهر لا مشروع ولا محتوى ولا أتمتة واضحة | تختار مسارًا، تكمل أول وحدة، وتخرج بشيء ملموس — ثم تفكر في الثاني |

### Screenshot block (intent)

خريطة المسارات حسب المستوى: فوق Intro، تحتها مسارات المستوى ١ (Business، Creator، Analyst)، ثم Automator، وأخيرًا Builder للعمق الاختياري. الاختيار = تركيز — لا قفل باقي المسارات.

### Quiz — تأكيد سريع

**السؤال:** منى وقتها يضيع في رسائل متابعة متكررة كل يوم. ما أنسب مسار للبداية؟

- **الإجابة الصحيحة (correctIndex: 0):** Automator.
- **التفسير:** المهام المتكررة = Automator. Builder للتطبيقات — لا للمتابعة اليومية.

### Mission — مهمتك · ختام Intro

**المقدمة:** مهمة اختيار المسار — ختام Intro. اختر مسارًا واحدًا: Business أو Creator أو Analyst أو Automator أو Builder. اكتب ٢–٣ جمل لماذا اخترته بناءً على هدف حقيقي.

**التسليم:**
1. المسار الذي اخترته
2. لماذا اخترته — ٢–٣ جمل مربوطة بهدف حقيقي
3. نتيجة واحدة تريد الوصول إليها في الشهرين القادمين (جملة)

**معايير التقييم (unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| قرار مبني على هدف | 70% | المسار مربوط بمشكلة أو هدف حقيقي — لا فضولًا عامًا |
| وضوح الاختيار | 30% | ٢–٣ جمل توضّح لماذا هذا المسار أنسب لك الآن |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** AI أداة عملية — Prompt واضح، تجربة آمنة، ثقة مع مراجعة، وأداة مناسبة لكل مهمة.
- **تستطيع:** اختيار مسار واحد والبدء — دون خوف ودون تشتت.
- **التالي:** افتح مسارك وابدأ أول درس. Intro انتهى — رحلتك الحقيقية تبدأ الآن.

---

## 5. Future generation notes

Downstream locales from MSA only. Quiz correctIndex: 0 (Automator). Mission 70/30 unchanged. `nextLessonId: pending-path-validation` until path-choice runtime exists. Bunny frozen.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Always wins |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Suggest only |
| 4 | Default | Egyptian `ar-EG` unchanged |

Path names (Business, Creator, etc.) may stay English in MSA with Arabic gloss per production.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending review |
| Concept preservation | 5 | Five paths + Path/Builder terms only |
| Beginner clarity | 4 | Simple sentences |
| MSA simplicity | 4 | Neutral MSA |
| Mission consistency | 5 | 70/30 matches production |
| Quiz integrity | 5 | correctIndex 0 — Automator |
| Assistant boundaries | 4 | Listed; no path-picking |
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
| 4 | Objectives preserved (Intro capstone path choice) | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0 — Automator) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed (nextLessonId: pending-path-validation) | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Intro capstone · Draft only.*
