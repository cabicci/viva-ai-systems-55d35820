# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m1-l1-where-you-are` |
| **pathId** | `automator` |
| **moduleId** | `automator-m1` |
| **productionTitle (ar-EG)** | أنت فين في الخريطة؟ |
| **productionRoute** | `/learn/automator/automator-m1-l1-where-you-are` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m1-l1-where-you-are.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.2-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **5-lesson MSA canonical pilot** (Automator path) |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Virtual worker saves time — but Time Audit first to find repeating tasks |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off pending.** It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `automator-m1-l1-where-you-are.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Before automation — know which repeating tasks eat weekly time; list 5 with minutes |
| **Mission rubric** | 60% five tasks with numbers · 40% priority decision (biggest waste + first automation pick) |
| **Quiz intent** | Manual welcome emails 30 min/day — audit task frequency and time before opening tool |
| **Concepts locked** | Time Audit, Workflow, Automator, Virtual worker, Make, Zapier, n8n, Flow |
| **Next lesson** | `automator-m2-l1-systems-view` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m1-l1-where-you-are
canonicalVersion: 2026-06-04.2-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m1-l1-where-you-are.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Where You Are on the Map
  oneAha: "Automator = virtual worker — Time Audit before any tool"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner explains Automator as virtual worker on repeating tasks; audit before tools.
    measurable: true
  - id: obj-2
    statement: Learner lists 5 repeating weekly tasks with times per occurrence and weekly totals; picks first automation candidate with reason.
    measurable: true

concepts:
  - id: concept-time-audit
    term: Time Audit
    termEn: Time Audit
    definition: Log repeating tasks and minutes each — know where virtual worker should start.
    mustPreserve: true
  - id: concept-workflow
    term: Workflow
    termEn: Workflow
    definition: Fixed steps start to finish — what virtual worker follows each time.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Know repeating tasks before building; list 5 + weekly time after
  - role: tension
    intent: Opens Make/Zapier/n8n — still doing same manual work — no audit
  - role: core
    intent: Virtual worker on repeats; Builder product + Creator audience; audit first
  - role: comparison
    intent: Build flows without audit vs audit welcome-email time first
  - role: glossary
    intent: Time Audit (جرد الوقت); Workflow (سير العمل)
  - role: video
    intent: Optional Builder/Creator → Automator bridge — production Bunny unchanged
  - role: screenshot
    intent: Five-path journey map visual
  - role: quiz
    intent: Manual welcome emails — count task before automation tool
  - role: mission
    intent: 5 repeating tasks with counts/minutes/totals + biggest waste + simplest + first automation pick
  - role: confidence_close
    intent: Weekly task list ready; next = systems view

mission:
  type: practice
  intent: Observation not building — 5 repeating tasks with frequency and minutes; identify biggest time sink and first automation with reason — 10–15 min
  rubricIntent:
    - dimension: five_tasks_with_numbers
      weight: 60
      criteria: Each task has frequency and minutes; weekly total calculated
    - dimension: priority_decision
      weight: 40
      criteria: Biggest waste + simplest task identified; first automation choice has logical reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_tasks_or_pick_automation_for_learner

termsLocked: [Time Audit, Workflow, Automator, Flow]

links:
  nextLessonId: automator-m2-l1-systems-view
  continuityNote: Systems view — repeating task as trigger → process → output

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

- **ماذا ستفهم؟** قبل بناء أي أتمتة، يجب أن تعرف **أي مهام متكررة** تستهلك وقتك كل أسبوع.
- **لماذا الآن؟** بعد **Builder (البناء)** (المنتج) و **Creator (المحتوى)** (الجمهور)، **Automator (الأتمتة)** هو «**العامل الافتراضي**» الذي يجعل الشغل المتكرر يمشي وحده.
- **ماذا بعد الدرس؟** ستعدّ **٥ مهام متكررة** وتحسب الوقت الذي تضيعه فيها أسبوعيًا.

### Tension — موقف مألوف

- تسمع عن Make و Zapier و n8n — تفتح يوتيوب وتبني **Flow (تدفق عمل)** — وبعد أسبوع **ما زلت** تعمل نفس الشغل بيدك.
- المشكلة **ليست الأداة**. المشكلة أنك **لم تعرف** أي مهمة تتكرر وتضيع وقتك فعلًا.
- **العامل الافتراضي** لا يظهر من فراغ — يعمل على مهام **واضحة ومتكررة** حدّدتها أولًا.

### Core idea — شوف الوقت الضائع — بعدين سلّم للعامل الافتراضي

- **Automator** = بناء «عامل افتراضي» يكرّر شغلك المتكرر: ردود، نقل بيانات، تذكيرات، متابعة.
- **Builder** بنى المنتج. **Creator** جلب الناس. **Automator** يربط الاثنين ويوفّر ساعات كل أسبوع.
- **الخطوة الأولى ليست أداة** — هي **Time Audit (جرد الوقت)**: أي مهمة تفعلها أكثر من مرتين في الأسبوع؟ كم دقيقة كل مرة؟
- عندما تعرف **٥ مهام** الأكثر تكرارًا، ستعرف **أين** يعمل العامل الافتراضي أولًا.

### Comparison — بناء أدوات vs معرفة أين الوقت

| بناء من دون Audit | Audit أولًا |
|-------------------|-------------|
| فتح Make وبناء ٣ **Flows** — لكن **ما زال** يرسل إيميلات ترحيب بيده ساعة يوميًا — الأتمتة ليست على المهمة التي تضيع وقته | عدّ: إيميل ترحيب × ٢٠ عميل × ٣ دقائق = ساعة يوميًا. أول **Flow** = إيميل ترحيب تلقائي. وفّر ٥ ساعات أسبوعيًا |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Time Audit (جرد الوقت)** | تسجيل المهام المتكررة ووقت كل واحدة — لتعرف أين يعمل العامل الافتراضي | «رد على استفسار واتساب» — ١٥ مرة/أسبوع × ٤ دقائق = ساعة |
| **Workflow (سير العمل)** | خطوات ثابتة من بداية لنهاية — كما يمشي عليها العامل الافتراضي كل مرة | عميل يسأل → ترد بالسعر → تسجّله في جدول |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — من Builder و Creator إلى Automator. **لا يُعاد توليده**.

### Screenshot block (intent)

خريطة الرحلة — ٥ مسارات متصلة. **Builder** → **Creator** → **Automator**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** سارة ترسل إيميل ترحيب لكل عميل جديد يدويًا — ٣٠ دقيقة يوميًا. ما أفضل خطوة **قبل** فتح أي أداة أتمتة؟

- **الإجابة الصحيحة:** **تعدّ المهمة ووقتها وتكرارها** في الأسبوع — لتعرف أن هذه أولوية.
- **التفسير:** **Audit** أولًا — عندما تعرف «إيميل ترحيب» = ٣٠ دقيقة يوميًا، ستعرف أن هذه **أول مهمة** للعامل الافتراضي.

### Mission — اعمل Audit لأسبوعك

**المقدمة:** مراقبة — **لا بناء**. قبل تسليم أي شغل للعامل الافتراضي، يجب معرفة المهام المتكررة. ١٠–١٥ دقيقة كافية.

**التسليم:** ٥ مهام (اسم · مرات/أسبوع · دقائق/مرة · إجمالي) · أكبر وقت ضائع · أبسط مهمة · أول أتمتة + السبب

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٥ مهام بأرقام | 60% | كل مهمة فيها مرات ودقائق؛ الإجمالي الأسبوعي محسوب |
| قرار أولوية | 40% | أكبر وقت ضائع + أبسط مهمة؛ اختيار أول أتمتة له سبب |

### Confidence close

- **فهمت:** **Automator** = عامل افتراضي يوفّر وقت — لكن يجب معرفة **أي مهام متكررة** تستهلك وقتك أولًا.
- **تستطيع:** قائمة ٥ مهام بوقتها الأسبوعي — جاهزة لاختيار **أول أتمتة**.
- **التالي:** **Systems View (رؤية الأنظمة)** — كيف تتحول أي مهمة متكررة إلى نظام (مُشغّل → عملية → نتيجة).

---

## 5. Future generation notes

Downstream locales from MSA only. Tool names (Make, Zapier, n8n) preserved from production — gloss only, no new tools. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Time Audit, Workflow only — production tool names as references |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Audit-first answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Reviewer | Date |
|-----------|------------|----------|------|
| Objective preservation | — | pending | — |
| Concept preservation | — | pending | — |
| Beginner clarity | — | pending | — |
| MSA simplicity | — | pending | — |
| Mission consistency | — | pending | — |
| Quiz integrity | — | pending | — |
| Assistant boundaries | — | pending | — |
| Localization readiness | — | pending | — |

| Human reviewer average | **not scored** |
| **Scale pass** | **not met — sign-off pending** |
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
| 14 | Human reviewer score | ☐ pending |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 5-lesson MSA canonical pilot · Draft only.*
