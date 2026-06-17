# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m6-l1-idea-to-page` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | من فكرة لصفحة |
| **productionRoute** | `/learn/builder/builder-m6-l1-idea-to-page` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l1-idea-to-page.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Idea = screens + steps — User Flow before colors or code |
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
| `builder-m6-l1-idea-to-page.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Translate AI idea to User Flow with 3 screens before code |
| **Mission rubric** | 60% three logical screens · 40% clear goal |
| **Quiz intent** | Draw User Flow first (correctIndex 0) |
| **Concepts locked** | User Flow, Screen |
| **Prerequisite** | `builder-m5-l5-mini-win` |
| **Next lesson** | `builder-m6-l2-wireframe` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l1-idea-to-page
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l1-idea-to-page.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Idea to Page
  oneAha: "Idea = screens + steps — User Flow before colors or code"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l5-mini-win]

objectives:
  - id: obj-1
    statement: Learner maps AI idea to User Flow with start, middle, end screens.
    measurable: true
  - id: obj-2
    statement: Learner draws 3-screen flow with see/do and arrows between screens.
    measurable: true

concepts:
  - id: concept-user-flow
    term: User Flow
    termEn: User Flow
    definition: Steps the client walks to reach their goal.
    mustPreserve: true
  - id: concept-screen
    term: Screen
    termEn: Screen
    definition: Each step in the journey = one screen in the app.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Idea to screens; 3-screen flow after lesson
  - role: tension
    intent: Great idea — blank page when opening builder
  - role: core
    intent: Journey = screens; 3 enough; User Flow = map
  - role: comparison
    intent: Start with look vs start with journey
  - role: glossary
    intent: User Flow, Screen
  - role: video
    intent: Idea to map — production Bunny unchanged
  - role: screenshot
    intent: Page = goal + clear steps
  - role: quiz
    intent: User Flow first (correctIndex 0)
  - role: mission
    intent: 3-screen flow with arrows
  - role: confidence_close
    intent: Ready for wireframe

mission:
  type: practice
  intent: Write idea + 3 screens (see/do) + arrows — ~5–10 min
  rubricIntent:
    - dimension: three_logical_screens
      weight: 60
      criteria: Start → middle → end not random; each screen has see and do
    - dimension: clear_goal
      weight: 40
      criteria: Screen 3 has outcome not open end; arrows connect steps
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_user_flow_for_learner

termsLocked: [User Flow, Screen]

links:
  nextLessonId: builder-m6-l2-wireframe
  continuityNote: Wireframe — sketch before building prevents chaos

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

- **ماذا ستفهم؟** **أي فكرة AI تستطيع بناؤها كشاشات + خطوات** — **قبل أي كود**.
- **لماذا الآن؟** **Phase 3 البناء يبدأ بخريطة** — **ليس بألوان أو ميزات عشوائية**.
- **ماذا بعد الدرس؟** **سترسم flow (تدفق) من ٣ شاشات** — **بداية، وسط، نهاية**.

### Tension — فكرة قوية — وصفحة بيضاء

- **لديك فكرة AI رائعة** — **لكن عند فتح أداة البناء لا تعرف أول خطوة**.
- **تبدأ بالألوان؟** **أم بالـ model؟** **أم بالـ Prompt؟** — **وتضيع ساعات**.
- **المشكلة ليست الأداة**. **المشكلة أن الفكرة لم تُترجم بعد إلى رحلة العميل**.

### Core idea — الفكرة = شاشات + خطوات

- **أي تطبيق AI = رحلة**: **العميل يفتح → يفعل شيئًا → يصل للهدف**.
- **كل خطوة = شاشة**. **٣ شاشات كافية للبداية: بداية، وسط، نهاية**.
- **قبل الألوان والكود: ارسم «كيف يمشي العميل»**.
- **User Flow (رحلة المستخدم) = الخريطة**. **الشاشات = البيوت على الخريطة**.

### Comparison — تبدأ بالشكل vs تبدأ بالرحلة

| تبدأ بالشكل | تبدأ بالرحلة |
|-------------|--------------|
| «**AI يخطط رحلات**» → **تصمّم شاتًا جميلًا**. **بعد ساعتين: لا تعرف من أين يبدأ العميل** | «**يفتح → يكتب «إيطاليا ٥ أيام» → AI يسأل ميزانية → يعرض خطة**» — **٣ خطوات = ٣ شاشات. واضح** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **User Flow (رحلة المستخدم)** | **الخطوات التي يمشيها العميل ليصل لهدفه** | **يفتح → يكتب سؤال → يأخذ إجابة. ٣ خطوات** |
| **Screen (شاشة)** | **كل خطوة في الرحلة = شاشة واحدة في التطبيق** | **شاشة ١: مربع كتابة. شاشة ٢: AI يسأل. شاشة ٣: النتيجة** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من فكرة إلى User Flow وشاشات». **لا يُعاد توليده.**

### Screenshot block (intent)

**أي صفحة = هدف واحد + خطوات واضحة**. **المستخدم يدخل → يرى الخريطة → يختار**. **نفس المنطق لتطبيقك**.

### Quiz — تأكيد سريع

**السؤال:** **تعمل AI يخطط تمارين رياضية. ما أهم أول خطوة؟**

- **الإجابة الصحيحة (خيار ١):** **ترسم User Flow: من «يحدد هدفه» حتى «يأخذ الخطة»**.
- خيار ٢: **تختار أفضل AI model**.
- خيار ٣: **تصمّم شكل شاشة النتيجة**.

**التفسير:** **الرحلة أولًا** — **عندما تعرف الخطوات، تعرف الشاشات والأسئلة التي يحتاج AI أن يسألها**.

### Mission — ارسم flow من ٣ شاشات

**المقدمة:** **مهمة تخطيط — ليست كودًا**. **ورقة وقلم أو notes**. **٥–١٠ دقائق**.

**التسليم:**

1. **الفكرة (جملة)**
2. **٣ شاشات** — **لكل واحدة: ماذا يرى؟ ماذا يفعل؟**
3. **سهم بين كل شاشة**: «بعد ما يفعل X → يذهب إلى Y»

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ شاشات منطقية | 60% | **بداية → وسط → نهاية — ليست عشوائية**. **كل شاشة فيها «يرى» و«يفعل»** |
| هدف واضح | 40% | **شاشة ٣ فيها نتيجة — ليست «نهاية مفتوحة»**. **الأسهم تربط الخطوات** |

### Confidence close

- **فهمت:** **الفكرة = شاشات + خطوات**. **User Flow قبل الألوان**.
- **تستطيع:** **flow من ٣ شاشات — جاهز للـ Wireframe**.
- **التالي:** **Wireframe** — **لماذا الرسمة الكروكية تمنع اللخبطة**.

---

## 5. Future generation notes

Downstream locales from MSA only. **User Flow**, **Screen** preserved. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | User Flow, Screen only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — User Flow first |
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

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
