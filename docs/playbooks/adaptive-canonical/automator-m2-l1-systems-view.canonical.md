# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m2-l1-systems-view` |
| **pathId** | `automator` |
| **moduleId** | `automator-m2` |
| **productionTitle (ar-EG)** | كل شغل = System |
| **productionRoute** | `/learn/automator/automator-m2-l1-systems-view` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m2-l1-systems-view.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Every repeating task = Trigger → Process → Output — foundation for virtual worker handoff |
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
| `automator-m2-l1-systems-view.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Any repeating task = system: Trigger → Process → Output; decompose one repeating task |
| **Mission rubric** | 70% system breakdown · 30% automation step |
| **Quiz intent** | Facebook price inquiry — customer message is Trigger (not price list or CRM log) |
| **Concepts locked** | Trigger, Output, Process |
| **Prerequisites** | `automator-m1-l1-where-you-are` |
| **Next lesson** | `automator-m2-l2-spot-patterns` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m2-l1-systems-view
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m2-l1-systems-view.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Systems View
  oneAha: "Repeating task = Trigger → Process → Output — virtual worker needs the map"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [automator-m1-l1-where-you-are]

objectives:
  - id: obj-1
    statement: Learner explains repeating task as Trigger → Process → Output system ready for virtual worker.
    measurable: true
  - id: obj-2
    statement: Learner decomposes one weekly repeating task into trigger, 4+ process steps, output, and one automation candidate with reason.
    measurable: true

concepts:
  - id: concept-trigger
    term: Trigger
    termEn: Trigger
    definition: Event that starts the system — without it nothing moves.
    mustPreserve: true
  - id: concept-output
    term: Output
    termEn: Output
    definition: What the system delivers when done — what the virtual worker "hands off."
    mustPreserve: true

blocks:
  - role: orientation
    intent: Repeating task = system; after Time Audit — decompose one task after
  - role: tension
    intent: Reply from scratch daily — tasks not system; virtual worker needs map
  - role: core
    intent: Trigger / Process / Output with WhatsApp inquiry example
  - role: comparison
    intent: Task thinking vs system thinking for inquiry replies
  - role: glossary
    intent: Trigger (المُشغّل); Output (النتيجة)
  - role: video
    intent: Optional — see work as system — production Bunny unchanged
  - role: screenshot
    intent: Connected layers — input, process, output per layer
  - role: quiz
    intent: Facebook price message — customer message = Trigger
  - role: mission
    intent: Decompose one audit task — trigger + 4 steps + output + one automation step — design not build
  - role: confidence_close
    intent: One task as system; next = Spot Patterns

mission:
  type: practice
  intent: Pick one weekly repeating task from audit; break into trigger, 4+ process steps, output, and one step to automate with reason — 10–15 min design exercise
  rubricIntent:
    - dimension: system_breakdown
      weight: 70
      criteria: Specific repeating task from learner work; trigger + 4 process steps + clear output
    - dimension: automation_step
      weight: 30
      criteria: One step chosen with reason (repetition / time / errors)
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_task_or_system_breakdown_for_learner

termsLocked: [Trigger, Output, Process, Automator]

links:
  nextLessonId: automator-m2-l2-spot-patterns
  continuityNote: Spot Patterns — "whenever X, do Y" = automation opportunity

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

- **ماذا ستفهم؟** أي مهمة متكررة = نظام: **مُشغّل (Trigger)** → عملية → **نتيجة (Output)**. عندما تراها هكذا، تستطيع تسليمها للعامل الافتراضي.
- **لماذا الآن؟** بعد أن عرفت أي مهام تستهلك وقتك، الخطوة التالية: تفكيك واحدة منها إلى أجزاء واضحة.
- **ماذا بعد الدرس؟** ستحوّل مهمة متكررة واحدة إلى مُشغّل + عملية + نتيجة.

### Tension — موقف مألوف

- «أرد على هذه الرسالة» — كل يوم من البداية: رسالة جديدة → تفكّر → تبحث → ترد → تنسى التسجيل.
- تفكّر في مهام منفصلة — لا في نظام. النتيجة: نفس الشغل يتكرر، ولا شيء يتراكم.
- العامل الافتراضي يحتاج خريطة — لا قائمة مهام عشوائية.

### Core idea — مُشغّل → عملية → نتيجة

- **المُشغّل (Trigger):** ما الذي يبدأ العمل؟ — رسالة واتساب، نموذج جديد، موعد محدّد.
- **العملية (Process):** ما الخطوات التي تمشي كل مرة؟ — تفهم الطلب، تبحث عن السعر، تتخذ قرارًا.
- **النتيجة (Output):** ما الذي يخرج في النهاية؟ — رد للعميل، صف في جدول، تذكير.
- **مثال:** «رد على استفسار واتساب» = مُشغّل: رسالة → عملية: فهم + بحث سعر → نتيجة: رد + تسجيل.
- عندما تفكّك المهمة هكذا، يعرف العامل الافتراضي أين يعمل بالضبط.

### Comparison — مهمة منفصلة vs نظام واضح

| تفكير مهام | تفكير نظام |
|------------|------------|
| «أحتاج أن أرد على الرسالة» — كل مرة من البداية، بلا خطوات ثابتة. صعب تسليمه لأحد أو لأداة. | «نظام رد الاستفسارات»: مُشغّل = رسالة → عملية = ٤ خطوات ثابتة → نتيجة = رد + CRM. يمكن تحسينه أو أتمتته. |

### Glossary — مصطلحان للنظام

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Trigger (المُشغّل)** | الحدث الذي يبدأ النظام — من دونه لا شيء يتحرّك | عميل يرسل «بكم؟» على واتساب |
| **Output (النتيجة)** | ما يخرج من النظام عند الانتهاء — ما «يسلّمه» العامل الافتراضي | رد بالسعر + صف جديد في جدول العملاء |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تفكّك أي مهمة متكررة إلى مُشغّل وعملية ونتيجة. **لا يُعاد توليده**.

### Screenshot block (intent)

طبقات متصلة — كل طبقة فيها مدخل ومعالجة ومخرج. أي شغل متكرر = طبقات وراء بعض: شيء يدخل → خطوات تتحوّل → شيء يخرج. نفس الفكرة على مهمة من عملك — لا يلزم أن تكون معقّدة.

### Quiz — تأكيد سريع

**السؤال:** عميل يرسل رسالة على فيسبوك يسأل عن سعر منتج. في «نظام الرد»، ما **المُشغّل (Trigger)**؟

- **الإجابة الصحيحة:** **رسالة العميل الجديدة**
- **التفسير:** **المُشغّل** = الحدث الذي يبدأ النظام. هنا رسالة العميل — لا قائمة الأسعار ولا تسجيل CRM (هذان عملية ونتيجة).

### Mission — فكّك مهمة متكررة لنظام

**المقدمة:** اختر مهمة واحدة تعملها كل أسبوع (من **جرد الوقت**). فكّكها إلى مُشغّل + عملية + نتيجة — هذا تصميم، لا بناء أداة. ١٠–١٥ دقيقة كافية.

**التسليم:** اسم المهمة · المُشغّل (ماذا يبدأها، متى/من مين) · العملية (٤ خطوات على الأقل بالترتيب) · النتيجة (ماذا يخرج ولمن) · لو ستؤتمت خطوة واحدة فقط — أيها ولماذا؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تفكيك النظام | 70% | مهمة محددة ومتكررة من عملك؛ مُشغّل + ٤ خطوات عملية + نتيجة واضحة |
| خطوة الأتمتة | 30% | اخترت خطوة واحدة بسبب (تكرار / وقت / أخطاء) |

### Confidence close

- **فهمت:** أي مهمة متكررة = مُشغّل → عملية → نتيجة. هذا أساس كل أتمتة.
- **تستطيع:** لديك مهمة واحدة مفكّكة كنظام — جاهزة لاكتشاف الأنماط.
- **التالي:** **Spot Patterns** — «كلما X يحدث، أفعل Y» = فرصة أتمتة.

---

## 5. Future generation notes

Downstream locales from MSA only. Trigger/Process/Output model preserved. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Trigger, Output — Process referenced from production |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 70/30 rubric matches production |
| Quiz integrity | 5 | Customer-message trigger answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

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
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
