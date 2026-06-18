# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m4-l2-reactive-relapse` |
| **pathId** | `business` |
| **moduleId** | `business-m4` |
| **productionTitle (ar-EG)** | الرجوع لـ Reactive Mode |
| **productionRoute** | `/learn/business/business-m4-l2-reactive-relapse` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m4-l2-reactive-relapse.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Relapse is expected under pressure — triggers + protection rules + AI monitoring |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending** — not approved for production rollout, localization, or controlled batch scale until a named reviewer records scores and checklist sign-off. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `business-m4-l2-reactive-relapse.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Identify 2 relapse triggers + protection rule each + weekly AI question |
| **Mission rubric** | 60% محفّزات حقيقية · 40% قواعد قابلة للتنفيذ |
| **Quiz intent** | Sales spike flooded WhatsApp = name trigger, AI summary, one protection rule |
| **Concepts locked** | Reactive Relapse |
| **Prerequisites** | `business-m4-l1-premature-scaling` |
| **Next lesson** | `business-m4-l3-weekly-rhythm` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: business-m4-l2-reactive-relapse
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m4-l2-reactive-relapse.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Reactive Relapse
  oneAha: "Relapse is expected under pressure — triggers + protection rules + AI monitoring"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [business-m4-l1-premature-scaling]

objectives:
  - id: obj-1
    statement: Identify 2 relapse triggers + protection rule each + weekly AI question
    measurable: true

concepts:
  - id: concept-1
    term: Reactive Relapse
    termEn: Reactive Relapse
    definition: Return to firefighting after a period of system — due to pressure trigger.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you learn, why now, what after lesson
  - role: tension
    intent: Familiar problem from production Egyptian copy
  - role: core
    intent: One Aha and worked logic from production
  - role: comparison
    intent: Same contrast structure as production
  - role: glossary
    intent: termsLocked with first-use English gloss
  - role: video
    intent: Production Bunny reference only — no regen
  - role: screenshot
    intent: Visual intent from production block
  - role: quiz
    intent: Sales spike flooded WhatsApp = name trigger, AI summary, one protection rule
  - role: mission
    intent: Identify 2 relapse triggers + protection rule each + weekly AI question
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Identify 2 relapse triggers + protection rule each + weekly AI question
  rubricIntent:
    - dimension: real_triggers
      weight: 60
      criteria: Two triggers from your experience
    - dimension: actionable_rules
      weight: 40
      criteria: Two simple rules + weekly monitoring question
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Reactive Relapse, SOP, AI]

links:
  nextLessonId: business-m4-l3-weekly-rhythm
  continuityNote: Weekly Rhythm — deeper weekly review ritual

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

### Orientation — بداية الدرس

- **ماذا ستفهم؟** حتى بعد بناء **نظام**، **الضغط** قد يعيدك إلى **Reactive Mode (وضع الإطفاء)** — و**الذكاء الاصطناعي (AI)** يساعدك على **مراقبة الإشارات** و**تلخيص التحذيرات**.
- **لماذا الآن؟** بنيت **إيقاعًا** و**SOP (إجراءات تشغيل قياسية)** وفكّرت في **التوسّع**. **الرجوع للإطفاء** **أخطر** عندما تشعر أنك «**انتهيت**».
- **ماذا بعد الدرس؟** ستحدّد **أهم محفّزين للرجوع (relapse)** و**قاعدة حماية** لكل واحد منهما.

### Tension — موقف مألوف

- **أسبوعان** من **نظام جيد** — ثم **حملة ناجحة**، **شكوى كبيرة**، أو **ضغط كاش** — وفجأة أنت **مجددًا** في **ردود** و**مطافئ**.
- **Reactive Relapse (رجوع للإطفاء)** **ليس** فشلًا أخلاقيًا — إنه **إشارة** أن **محفّز ضغط** كسر **الحماية**.
- **محفّزات شائعة:** نمو مفاجئ، فجوة في الفريق، شكاوى متكررة، ضغط كاش. **AI** يلخّص **الأسبوع** ويقول لك «**ما الذي زاد عن المعتاد؟**»

### Core idea — راقب المحفّز — وليس فقط «كن منضبطًا»

- **Relapse** يبدأ **صغيرًا**: تفتح رسالة «**فقط هذه**» **قبل** بلوك الاستراتيجية — ثم **اليوم كله** **Reactive**.
- **قاعدة الحماية** بسيطة وقابلة للتنفيذ: «**لا واتساب قبل ٩:٣٠**» أو «**أي شكوى كبيرة → مسودة AI + رد بعد ساعة**».
- **AI** يساعدك **أسبوعيًا**: لخّص شكاوى العملاء، عدّد الرسائل، حدّد **موضوعًا متكررًا** — **إشارة مبكرة** **قبل** أن تغرق.

### Glossary — مصطلحات مقفلة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Reactive Relapse (رجوع للإطفاء)** | تعود لإدارة اليوم **بالردود والأزمات** بعد فترة **نظام** — بسبب **محفّز ضغط** | بعد إطلاق منتج: **٣ أيام** ردود فقط — **بلوك الاستراتيجية** اختفى |
| **SOP (إجراءات تشغيل قياسية)** | خطوات **متفق عليها** تقلّل **الارتجال** تحت الضغط | «**أي شكوى كبيرة** → مسودة **AI** ثم رد بعد ساعة» |
| **AI monitoring (مراقبة بالذكاء الاصطناعي)** | **سؤال أسبوعي** لـ **AI** يلخّص **الإشارات** قبل أن تغرق | «**ما الموضوع المتكرر** في شكاوى هذا الأسبوع؟» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تكتشف الرجوع مبكرًا». **لا يُعاد توليده.**

### Comparison — أمل «أتجاوز الأزمة» مقابل قاعدة حماية

| بدون قواعد | مع قواعد + AI |
|------------|---------------|
| «**هذا الأسبوع استثناء**» — ثم **شهر كامل** **Reactive** | **محفّز معروف** + **قاعدة** + **ملخص أسبوعي من AI** — **تعود للنظام أسرع** |

### Diagram block (intent)

**دورة الرجوع للإطفاء** (معرّف: `reactive-relapse-cycle`): **المحفّز** → **إطفاء** → **تعب** → **تأجيل النظام**. **اقطع الدورة** بـ **قاعدة واحدة واضحة**.

### Quiz — تأكيد سريع

**السؤال:** بعد **شهر نظام**، **قفزت المبيعات** و**انفجر واتساب**. **ما أفضل رد أول؟**

- خيار ١: أترك **النظام** تمامًا — **المبيعات أهم**.
- **الإجابة الصحيحة (خيار ٢):** أعرّف **المحفّز**، أستخدم **AI للتلخيص**، وأطبّق **قاعدة حماية واحدة**.
- خيار ٣: أوظّف **فورًا** **من دون SOP**.

**التفسير:** **النمو** محفّز **شائع** للـ **relapse**. **التلخيص بـ AI** + **قاعدة** يحافظان على **جزء من النظام**.

### Mission — محفّزان + قاعدة حماية

**المقدمة:** فكّر في **آخر مرة** شعرت أنك **عدت Reactive** (أو قريبًا منها). حدّد **أهم محفّزين** عندك — واكتب **قاعدة حماية بسيطة** لكل واحد. **ليس وعدًا أبديًا** — قواعد **تستطيع تنفيذها الأسبوع القادم**.

**التسليم:**

1. **محفّز relapse #١**
2. **قاعدة حماية #١**
3. **محفّز relapse #٢**
4. **قاعدة حماية #٢**
5. **سؤال واحد** ستسأله لـ **AI كل أسبوع** للمراقبة

**قالب المهمة:**

```
١) محفّز ١:
   [مثال: ضغط كاش]

٢) قاعدة ١:
   [مثال: مراجعة كاش كل اثنين قبل أي صرف كبير]

٣) محفّز ٢:
   [مثال: شكاوى متكررة]

٤) قاعدة ٢:
   [مثال: AI يلخّص الشكاوى يوم الجمعة]

٥) سؤال أسبوعي للـ AI:
   [اكتب هنا]
```

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| محفّزات حقيقية | 60% | **محفّزان** من **تجربتك** — **وليس** قائمة عامة |
| قواعد قابلة للتنفيذ | 40% | **قاعدتان بسيطتان** + **سؤال مراقبة أسبوعي** |

### Confidence close

- **فهمت:** **Relapse** **متوقع** تحت **الضغط** — و**AI** يساعدك **تراقب مبكرًا**.
- **تستطيع:** لديك **قواعد حماية** لـ **أخطر محفّزين** عندك.
- **التالي:** **المراجعة الأسبوعية العميقة (Weekly Rhythm)** — **ليس** إيقاعًا يوميًا فقط، بل «**ما الذي تغيّر؟**»

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — **not** from Egyptian directly. **Mission rubric weights (60/40)** and **quiz logic (correctIndex 1)** preserved. Diagram `reactive-relapse-cycle` and **Amal-style comparison** must survive locale derivation. **SOP** and **AI monitoring** glossed in §4 glossary — sourced from production orientation/core blocks only. Deferred: Bunny · Remotion · RAG seed · runtime wiring. **Do not** upgrade `reviewStatus` or human sign-off from this artifact alone.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Production concepts locked |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | — | **pending** |
| Concept preservation | — | **pending** |
| Beginner clarity | — | **pending** |
| MSA simplicity | — | **pending** |
| Mission consistency | — | **pending** |
| Quiz integrity | — | **pending** |
| Assistant boundaries | — | **pending** |
| Localization readiness | — | **pending** |

| Human reviewer average | **pending — not yet scored** |
| **Production-ready?** | **no** |

### Human reviewer sign-off

| Field | Value |
|-------|-------|
| **Reviewer** | **pending** |
| **Date** | **pending** |
| **Decision** | **pending** |
| **Controlled batch authorization** | **pending** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny / video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer score — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready stated | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
