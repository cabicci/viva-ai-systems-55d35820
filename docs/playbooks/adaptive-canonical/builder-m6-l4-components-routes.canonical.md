# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m6-l4-components-routes` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | Components & Routes |
| **productionRoute** | `/learn/builder/builder-m6-l4-components-routes` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l4-components-routes.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | App = reusable Components + Routes — edit once, update everywhere |
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
| `builder-m6-l4-components-routes.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Components = reusable UI pieces with Props; Routes = full pages with URLs |
| **Mission rubric** | 50% three clear routes · 50% three components with Props |
| **Quiz intent** | One ConversationCard component with Props (correctIndex 0) |
| **Concepts locked** | Component, Route |
| **Prerequisite** | `builder-m6-l3-first-prompt-to-lovable` |
| **Next lesson** | `builder-m6-l5-iteration` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l4-components-routes
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l4-components-routes.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Components & Routes
  oneAha: "App = reusable Components + Routes — edit once, update everywhere"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m6-l3-first-prompt-to-lovable]

objectives:
  - id: obj-1
    statement: Learner defines Component vs Route and rule of three for extraction.
    measurable: true
  - id: obj-2
    statement: Learner plans 3 routes and 3 components with Props for their app.
    measurable: true

concepts:
  - id: concept-component
    term: Component
    termEn: Component
    definition: UI piece written once, reused with different data (Props).
    mustPreserve: true
  - id: concept-route
    term: Route
    termEn: Route
    definition: Full page with browser URL address.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Components + Routes; plan 3 each after lesson
  - role: tension
    intent: Copy-paste same UI → inconsistent app
  - role: core
    intent: Lego pieces + page URLs; one job per component
  - role: comparison
    intent: Repeat code vs rule of three extraction
  - role: glossary
    intent: Component, Route
  - role: video
    intent: Components and Routes in app — production Bunny unchanged
  - role: screenshot
    intent: Curriculum page reuses ModuleCard, LessonRow
  - role: quiz
    intent: ConversationCard with Props (correctIndex 0)
  - role: mission
    intent: 3 routes + 3 components with Props
  - role: confidence_close
    intent: Ready for iteration loop

mission:
  type: practice
  intent: Plan 3 routes + 3 components with Props and where they appear — ~10–15 min
  rubricIntent:
    - dimension: three_clear_routes
      weight: 50
      criteria: Each route has path and goal; covers core user journey
    - dimension: three_components_props
      weight: 50
      criteria: Each component has name and Props; where it appears specified
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_component_map_for_learner

termsLocked: [Component, Route, Props]

links:
  nextLessonId: builder-m6-l5-iteration
  continuityNote: Iteration Loop — one surgical edit at a time

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

- **ماذا ستفهم؟** **التطبيق = قطع صغيرة قابلة لإعادة الاستخدام (Components) + صفحات لها عنوان (Routes)**.
- **لماذا الآن؟** **عمق Builder اختياري** — **لكن إن كنت تبني منتجًا، هذا الدرس يمنع تكرار نفس الكود في كل صفحة**.
- **ماذا بعد الدرس؟** **ستحدّد ٣ components و٣ صفحات لتطبيقك** — **قبل أي كود**.

### Tension — زر أزرق هنا وأخضر هناك — والتطبيق يبدو ملخبطًا

- **كل صفحة شكلها مختلف قليلًا**. **زر الإرسال أزرق في الشات وأخضر في الإعدادات**.
- **المشكلة: كرّرت نفس الكود بنسخ ولصق**. **أي تعديل بسيط = تعديل في التطبيق كله**.
- **الحل: ابنِ القطعة مرة واحدة واستخدمها في كل مكان**.

### Core idea — قطعة قابلة لإعادة الاستخدام + مسار لكل صفحة

- **Component (مكوّن) = قطعة lego صغيرة**: **زر، فقاعة رسالة، كارت محادثة**. **تصمّمها مرة وتستخدمها ببيانات مختلفة (Props — خصائص)**.
- **Route (مسار) = الصفحة الكاملة التي لها عنوان في المتصفح** — **مثل `/chat` أو `/settings`**.
- **الصفحة نفسها component كبير يجمع components أصغر**. **قاعدة: كل component يعمل شيئًا واحدًا فقط**.

### Comparison — تكرار الكود vs قاعدة الـ ٣ مرات

| خطأ — نفس الشكل في ٣ أماكن | صح — Component مرة واحدة |
|----------------------------|---------------------------|
| **تكرر شكل رسالة المستخدم في ٣ أماكن**. **تغيّر حجم الخط — تنسى مكانًا — الواجهة تفسد** | **المرة الثالثة: اقف — اخرج Component منفصل**. **تعدّل مرة — يسمع في كل مكان** |

### Glossary — مصطلحان للواجهة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Component (مكوّن)** | **قطعة واجهة تُكتب مرة وتُستخدم مرات ببيانات مختلفة** | **`ChatBubble` — مرة sender=User ومرة sender=AI، نفس القالب** |
| **Route (مسار)** | **الصفحة الكاملة التي لها عنوان في المتصفح** | **`/chat` = صفحة الشات، `/history` = المحادثات القديمة** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Components و Routes في التطبيق». **لا يُعاد توليده.**

### Screenshot block (intent)

**أي واجهة احترافية تبدو معقدة** — **لكنها تكرار لـ ٣–٤ قوالب**. **ModuleCard و LessonRow = Components تتكرر ببيانات مختلفة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **تحتاج كارتًا لكل محادثة سابقة — عنوان وملخص وتاريخ. ما أنسب طريقة؟**

- **الإجابة الصحيحة (خيار ١):** **Component واحد `ConversationCard` — تمرّر له بيانات كل محادثة كـ Props**.
- خيار ٢: **Component جديد لكل محادثة: `ConversationCard1`، `ConversationCard2`...**
- خيار ٣: **ادمج كل الكروت في component واحد كبير `HistoryPage`**.

**التفسير:** **Component تُكتب مرة وتُستخدم ببيانات مختلفة** — **يقلّل التكرار ويجعل التعديل في مكان واحد**.

### Mission — حدّد ٣ components و٣ صفحات

**المقدمة:** **قبل أي كود — خطّط على الورق**. **١٠–١٥ دقيقة**.

**التسليم:**

1. **٣ صفحات (Routes)** — **مسار + هدف لكل واحدة**
2. **٣ Components** — **اسم + Props + في أي صفحة/صفحات يظهر**
3. **هل component يحتاج «ذاكرة» داخلية (state)؟** **أي واحد ولِم؟**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ صفحات واضحة | 50% | **كل Route لها مسار وهدف**. **الصفحات تغطي رحلة العميل الأساسية** |
| ٣ Components بـ Props | 50% | **كل Component له اسم و Props محدّدة**. **محدّد أين يظهر** |

### Confidence close

- **فهمت:** **التطبيق = Components قابلة لإعادة الاستخدام + Routes لكل صفحة**. **تعدّل القطعة مرة — تسمع في كل مكان**.
- **تستطيع:** **خريطة ٣ صفحات و٣ components — جاهزة لأول prompt في Lovable**.
- **التالي:** **Iteration Loop** — **تحسين تعديل واحد كل مرة**.

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
| Concept preservation | 5 | Component, Route only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — ConversationCard + Props |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
