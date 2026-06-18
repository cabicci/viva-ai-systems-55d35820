# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m1-l2-attention-economy` |
| **pathId** | `creator` |
| **moduleId** | `creator-m1` |
| **productionTitle (ar-EG)** | إيه هو اقتصاد الانتباه؟ |
| **productionRoute** | `/learn/creator/creator-m1-l2-attention-economy` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m1-l2-attention-economy.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Useful content with a clear opening wins attention — not louder noise |
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
| `creator-m1-l2-attention-economy.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | On social feeds people decide in seconds — useful content wins attention, not the loudest |
| **Mission rubric** | 60% observation accuracy · 40% pattern extraction |
| **Quiz intent** | Content skipped fast — first fix is start with clear benefit to stop scrolling |
| **Concepts locked** | Attention Economy, Scroll Stop, Useful Angle |
| **Prerequisite** | `creator-m1-l1-why-content` |
| **Next lesson** | `creator-m2-l1-know-audience` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m1-l2-attention-economy
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m1-l2-attention-economy.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Attention Economy
  oneAha: "Useful content with a clear opening wins attention — observation before hooks"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m1-l1-why-content]

objectives:
  - id: obj-1
    statement: Learner explains that on social feeds people decide in seconds; useful clear content wins attention.
    measurable: true
  - id: obj-2
    statement: Learner observes 5 feed posts, documents stop/skip reasons, and names a recurring attention pattern.
    measurable: true

concepts:
  - id: concept-attention-economy
    term: Attention Economy
    termEn: Attention Economy
    definition: A crowded market where everyone competes for people's time and focus.
    mustPreserve: true
  - id: concept-scroll-stop
    term: Scroll Stop
    termEn: Scroll Stop
    definition: The moment that makes the viewer stop scrolling and keep watching or reading.
    mustPreserve: true
  - id: concept-useful-angle
    term: Useful Angle
    termEn: Useful Angle
    definition: The practical angle that makes content immediately useful.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Social feeds = seconds to decide; useful content wins, not loudest
  - role: tension
    intent: Great prep wasted if opening is weak — attention economy before publishing plan
  - role: core
    intent: Clear useful promise from first moment; AI helps formats but learner chooses for audience
  - role: comparison
    intent: Scattered long intro vs practical opening that earns time
  - role: glossary
    intent: Attention Economy, Scroll Stop, Useful Angle
  - role: video
    intent: Why some keep watching and others skip — production Bunny unchanged
  - role: screenshot
    intent: Visual example of clear attention-grabbing content
  - role: quiz
    intent: Skipped content — start with clear benefit to stop scroll (correctIndex 1)
  - role: mission
    intent: Observe 5 posts — stop/skip + reason; name strongest pattern — observation only, not hook writing
  - role: confidence_close
    intent: Sharper eye for attention; next = define audience precisely

mission:
  type: practice
  intent: Observation training — 5 posts with stop/skip + reason; extract recurring attention pattern — not hook writing
  rubricIntent:
    - dimension: observation_accuracy
      weight: 60
      criteria: 5 real examples documented; each has clear stop or skip reason
    - dimension: pattern_extraction
      weight: 40
      criteria: Clear conclusion about a recurring attention pattern
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_posts_or_patterns_for_learner

termsLocked: [Attention Economy, Scroll Stop, Useful Angle]

links:
  nextLessonId: creator-m2-l1-know-audience
  continuityNote: Know audience precisely instead of speaking to everyone

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** على **وسائل التواصل** يقرّر الناس في **ثوانٍ**: هل يكملون أم يتخطّون.
- **الفكرة الأساسية:** المحتوى **المفيد** هو الذي يكسب **الانتباه** — وليس المحتوى الأعلى صوتًا.
- **ماذا بعد الدرس؟** ستتدرب على **ملاحظة** ما يوقف التمرير وما يُتخطّى.

### Tension — المشكلة الشائعة

- مهما بذلت جهدًا في الإعداد، إذا **البداية** غير جذّابة — الناس **ستتخطّى**.
- لذلك فهم **Attention Economy (اقتصاد الانتباه)** يسبق أي **خطة نشر** أو إنتاج.
- معظم المحتوى **يُمرّ** بسرعة — المشكلة غالبًا في **اللحظة الأولى** وليس في الجودة كلها.

### Core idea — المفيد الواضح يفوز

- الذي يربح **الانتباه** عادةً هو المحتوى الذي **يعدّ بفائدة واضحة** من أول لحظة.
- **الذكاء الاصطناعي** قد يساعدك على توليد **صيغ بدايات** بسرعة — لكن **اختيار** الأنسب لجمهورك يبقى مبنيًا على **حكمك** وتجربتك.
- **Useful Angle (زاوية مفيدة):** ابدأ بخطوة عملية تمس **حاجة حقيقية** عند المتلقي.

### Comparison — تشتت أم قيمة مباشرة؟

| محتوى مشتت | محتوى مفيد |
|------------|------------|
| مقدمة طويلة **بلا فائدة مباشرة** — يُتخطّى بسرعة | يبدأ **بفكرة عملية** تمس حاجة حقيقية — يكسب وقتًا أطول وتفاعلًا أعلى |

### Glossary — ٣ مصطلحات أساسية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Attention Economy (اقتصاد الانتباه)** | سوق كبير يتنافس فيه الجميع على **وقت وتركيز** الناس | كل منشور في الخلاصة يحاول أن يأخذ ثوانٍ من انتباهك |
| **Scroll Stop (وقف التمرير)** | اللحظة التي تجعل المتلقي **يوقف التمرير** ويكمل | سؤال واضح عن **مشكلة حقيقية** يوقف التمرير فورًا |
| **Useful Angle (زاوية مفيدة)** | الزاوية **العملية** التي تجعل المحتوى مفيدًا فورًا | بدل كلام عام: **خطوة محددة** يمكن تطبيقها اليوم |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «لماذا يكمل البعض ويتخطّى البعض». **لا يُعاد توليده.**

### Screenshot block (intent)

لقطة بصرية — مثال على محتوى **واضح وسهل الالتقاط** بصريًا. الوضوح البصري والرسالة المركّزة يساعدان المتلقي على الفهم السريع وقرار الاستمرار. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** إذا كان المحتوى ممتازًا لكن الناس **يتخطّونه** بسرعة — ما **أول تعديل** منطقي؟

- خيار ١: نزيد طول الفيديو.
- **الإجابة الصحيحة (خيار ٢):** **نبدأ بفائدة واضحة** تجعل المتلقي **يوقف التمرير**.
- خيار ٣: نغيّر اسم الصفحة كل أسبوع.

**التفسير:** في **اقتصاد الانتباه** البداية الواضحة هي **نقطة الدخول** — بعدها تُعطى بقية الجودة فرصتها.

### Mission — راقب ٥ محتويات في الخلاصة

**المقدمة:** المهمة **تدريب ملاحظة** — **ليس اختبارًا** و**ليس كتابة Hook**. راقب **٥ منشورات**، وسجّل لماذا **توقفت** عند كل واحد أو **لماذا تخطّيته**. الاختبار علّمك **ما الذي تبحث عنه**.

**التسليم:** لكل محتوى (١–٥): وقفت/تخطيت + السبب · في سطر أخير: **أكثر نمط جذب** شدّك

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| دقة الملاحظة | 60% | ٥ أمثلة فعلية؛ كل مثال فيه سبب واضح للوقوف أو التخطي |
| استخراج النمط | 40% | استنتاج واضح لنمط جذب متكرّر |

### Confidence close

- **فهمت:** تميّز بسرعة **ما يشدّ الانتباه** و**ما يُمرّ**.
- **تستطيع:** عينك أدق على **Scroll Stop** و**Useful Angle** قبل أي خطة نشر.
- **التالي:** **Know Your Audience (اعرف جمهورك)** — تحديد الجمهور بدقة بدل الكلام مع الجميع.

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
| Concept preservation | 5 | Attention Economy, Scroll Stop, Useful Angle only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — clear benefit opening |
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
