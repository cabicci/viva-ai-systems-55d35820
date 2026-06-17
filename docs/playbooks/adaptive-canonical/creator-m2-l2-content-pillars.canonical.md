# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m2-l2-content-pillars` |
| **pathId** | `creator` |
| **moduleId** | `creator-m2` |
| **productionTitle (ar-EG)** | اختار ٣ Pillars |
| **productionRoute** | `/learn/creator/creator-m2-l2-content-pillars` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m2-l2-content-pillars.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Three clear content pillars end daily «what do I post?» guessing |
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
| `creator-m2-l2-content-pillars.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Build 3 clear content pillars so publishing decisions are faster and presence stays coherent |
| **Mission rubric** | 50% pillar clarity · 50% idea quality |
| **Quiz intent** | Scattered topics — first fix is choose 3 pillars and distribute ideas under them (correctIndex 1) |
| **Concepts locked** | Content Pillar, Topic Idea, Content Mix |
| **Prerequisite** | `creator-m2-l1-know-audience` |
| **Next lesson** | `creator-m3-l1-hook` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m2-l2-content-pillars
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m2-l2-content-pillars.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Content Pillars
  oneAha: "Three clear pillars stop daily guessing — every idea maps to one pillar"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m2-l1-know-audience]

objectives:
  - id: obj-1
    statement: Learner explains that content pillars are fixed main themes and every idea must follow one pillar.
    measurable: true
  - id: obj-2
    statement: Learner defines 3 distinct pillars and writes 3 practical topic ideas under each.
    measurable: true

concepts:
  - id: concept-content-pillar
    term: Content Pillar
    termEn: Content Pillar
    definition: A fixed main theme that generates many content pieces over time.
    mustPreserve: true
  - id: concept-topic-idea
    term: Topic Idea
    termEn: Topic Idea
    definition: A small idea that belongs to one specific pillar.
    mustPreserve: true
  - id: concept-content-mix
    term: Content Mix
    termEn: Content Mix
    definition: Balanced distribution of content across pillars.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Pillars make publishing easier — build 3 clear pillars for steady direction
  - role: tension
    intent: Without pillars ideas feel random and presence stays weak
  - role: core
    intent: Three pillars enough — AI suggests ideas per pillar; learner chooses for audience
  - role: comparison
    intent: Random variety vs clear pillars and cohesive message
  - role: glossary
    intent: Content Pillar, Topic Idea, Content Mix
  - role: video
    intent: Choosing pillars practically — production Bunny unchanged
  - role: diagram
    intent: How one pillar branches to many ideas without losing identity
  - role: quiz
    intent: Scattered topics — choose 3 pillars and distribute (correctIndex 1)
  - role: mission
    intent: 3 pillars + 3 ideas each — system-building practice, not test
  - role: confidence_close
    intent: Content map ready; next = Hook because first seconds decide watch/skip

mission:
  type: practice
  intent: Define 3 clear pillars and write 3 practical ideas per pillar — system building, not test
  rubricIntent:
    - dimension: pillar_clarity
      weight: 50
      criteria: Pillars are distinct and clear; each can sustain ongoing content
    - dimension: idea_quality
      weight: 50
      criteria: 3 ideas per pillar clearly tied to that pillar
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_pillars_or_ideas_for_learner

termsLocked: [Content Pillar, Topic Idea, Content Mix]

links:
  nextLessonId: creator-m3-l1-hook
  continuityNote: Hook next — first seconds decide whether people keep watching

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

- **ماذا ستفهم؟** عندما تحدّد **أعمدة محتواك (Content Pillars)**، يصبح **قرار النشر** أسهل وأسرع.
- **الهدف:** أن تبني **٣ أعمدة واضحة** تمشي عليها بثبات.
- **ماذا بعد الدرس؟** ستملك **خريطة محتوى** بدل الحيرة اليومية «عن ماذا أنشر؟».

### Tension — المشكلة الشائعة

- **كل يوم سؤال:** «عن ماذا أنشر؟»
- **من دون أعمدة:** الأفكار تبدو **عشوائية** ومُجهِدة.
- حتى مع **عمل جيد**، **حضورك** يبقى ضعيفًا إذا لم تكن الرسالة **متماسكة**.

### Core idea — ٣ أعمدة كافية

- **Content Pillar (عمود محتوى):** موضوع رئيسي **ثابت** — وكل **فكرة محتوى** يجب أن تتبع **أحدها**.
- **٣ أعمدة** كافية جدًا — لا تحتاج قائمة طويلة.
- **الذكاء الاصطناعي (AI)** قد يقترح **أفكارًا** تحت كل عمود — لكن **اختيار** ما يخدم **جمهورك** و**أهدافك** يبقى **قرارك**.

### Comparison — تنوع عشوائي أم أعمدة واضحة؟

| من دون أعمدة | مع أعمدة |
|--------------|----------|
| أفكار **متقطعة** — والرسالة **غير واضحة** للجمهور | كل فكرة تخدم **صورة واحدة متماسكة** — فيعرف المتابع **في ماذا تميّز** |

### Glossary — ٣ مصطلحات أساسية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Content Pillar (عمود محتوى)** | موضوع رئيسي **ثابت** يتكرّر منه محتوى كثير | تعليم، تجارب، أدوات |
| **Topic Idea (فكرة موضوع)** | فكرة **صغيرة** تابعة لعمود معيّن | تحت عمود الأدوات: أداة تنظّم **كتابة السكربت (Script)** |
| **Content Mix (مزيج المحتوى)** | **توزيع** المحتوى بين الأعمدة بشكل **متوازن** | كل أسبوع منشور من **كل عمود** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «اختيار الأعمدة عمليًا». **لا يُعاد توليده.** يمكنك تخطّي الفيديو والبدء بالمهمة من نفس الصفحة.

### Diagram block (intent)

رسم توضيحي — **شكل توزيع الأعمدة**. يوضّح كيف **العمود الواحد** يتفرّع إلى **أفكار متعددة** دون أن تضيع **هوية المحتوى**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** إذا كان لديك **عشر مواضيع متفرقة** ولا تعرف كيف **تثبّت حضورك** — ما **أفضل خطوة أولى**؟

- خيار ١: تنشرها **كلها بالتساوي**.
- **الإجابة الصحيحة (خيار ٢):** **تختار ٣ أعمدة رئيسية** وتوزّع الأفكار **تحتها**.
- خيار ٣: **توقف النشر** شهرًا كاملًا.

**التفسير:** حصر الأفكار داخل **٣ أعمدة** يخلق **وضوحًا** و**استمرارية** بدل **التشتيت**.

### Mission — ٣ أعمدة + ٣ أفكار لكل عمود

**المقدمة:** المهمة **تدريب بناء نظام** — **ليس اختبارًا**. حدّد **٣ أعمدة واضحة** واكتب **٣ أفكار عملية** لكل عمود.

**التسليم:** لكل عمود (١–٣): الاسم + ٣ أفكار مرتبطة به

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الأعمدة | 50% | الأعمدة **مختلفة وواضحة**؛ كل عمود ينفع أن يُنتج منه محتوى **مستمر** |
| جودة الأفكار | 50% | **٣ أفكار** لكل عمود **مرتبطة به بوضوح** |

### Confidence close

- **فهمت:** **Content Pillars** توقف **التخمين** اليومي في «عن ماذا أنشر؟».
- **تستطيع:** تدخل أي أسبوع وعندك **اتجاه واضح** بدل الحيرة.
- **التالي:** **Hook (خطاف)** — لأن **أول ثوانٍ** هي التي تقرّر: هل يكمل الناس أم لا؟

---

## 5. Future generation notes

Downstream locales from MSA only. **Content Pillar**, **Topic Idea**, **Content Mix** preserved as termsLocked — gloss on first use in each locale. Deferred: Bunny · Remotion · RAG · runtime. Mission remains pillar-building practice — assistants must not write pillars or ideas for the learner.

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
| Concept preservation | 5 | Content Pillar, Topic Idea, Content Mix only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — 3 pillars distribute ideas |
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
| 6 | Mission rubric 50/50 | ☑ pass |
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
