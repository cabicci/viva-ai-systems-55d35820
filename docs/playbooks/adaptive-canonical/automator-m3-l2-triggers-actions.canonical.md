# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m3-l2-triggers-actions` |
| **pathId** | `automator` |
| **moduleId** | `automator-m3` |
| **productionTitle (ar-EG)** | Triggers & Actions |
| **productionRoute** | `/learn/automator/automator-m3-l2-triggers-actions` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m3-l2-triggers-actions.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.1-draft` |
| **derivedAt** | 2026-06-04 |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Every automation = Trigger + Actions — «when this happens → do that» |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file. Human review and passing quality scores are required before any downstream use.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `automator-m3-l2-triggers-actions.ts` (Egyptian blocks + mission) | **Frozen** — production source of truth for default UX |
| Bunny video for this lesson | **Frozen** — existing playback unchanged |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** — localization layers on top later |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner understands automation = Trigger + Action(s); designs one workflow on paper before opening a tool |
| **Block sequence** | Orientation → tension → core idea → comparison → glossary → video (optional) → screenshot → quiz → mission → confidence close |
| **Mission rubric** | 60% clear Trigger + linked Actions · 40% measurable Success criteria tied to goal |
| **Quiz intent** | Course purchase → instant WhatsApp with login link = **Webhook trigger + WhatsApp action** (not Schedule poll or Manual) |
| **Concepts locked** | Trigger, Action, Schedule, Webhook, Event |
| **Next lesson continuity** | Filters & Routers — when «when…» needs a routing decision |

### Derivation method

1. Read Egyptian production TS blocks (read-only).
2. Extract objectives, block roles, mission intent, rubric weights, quiz answer key.
3. Normalize learner-facing prose to **neutral Arabic MSA** — same meaning, no Egyptian dialect surface forms.
4. Do **not** write back to production or generate locale packages in this phase.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m3-l2-triggers-actions
canonicalVersion: 2026-06-04.1-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m3-l2-triggers-actions.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Triggers and Actions
  oneAha: "Every automation = Trigger + Actions — when X happens, do Y"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m3-l1-tools-landscape]

objectives:
  - id: obj-1
    statement: Learner can name Trigger and Action and common trigger types (Schedule, Webhook, Event).
    measurable: true
  - id: obj-2
    statement: Learner designs one workflow on paper — one Trigger + 2–3 Actions with data flow.
    measurable: true

concepts:
  - id: concept-trigger
    term: Trigger
    termEn: Trigger
    definition: The event that starts work — «when…»
    mustPreserve: true
  - id: concept-action
    term: Action
    termEn: Action
    definition: What the virtual worker executes after the trigger — «do…»
    mustPreserve: true
  - id: concept-trigger-types
    term: Schedule / Webhook / Event
    definition: Common trigger types — time, instant notification, app event.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Automation = trigger + action(s); design first workflow on paper after lesson
  - role: tension
    intent: Building flow without clear «when» — runs wrong time
  - role: core
    intent: Trigger vs Action; common types; chained actions; form example
  - role: comparison
    intent: Actions-only manual run vs Trigger + Actions autonomous
  - role: glossary
    intent: Trigger (المُشغّل); Action (الفعل)
  - role: video
    intent: Optional trigger/action types; production Bunny unchanged
  - role: screenshot
    intent: Trigger → action chain visual
  - role: quiz
    intent: Course purchase → Webhook + WhatsApp (instant event)
  - role: mission
    intent: Paper design — one Trigger + 2–3 Actions + Success criteria
  - role: confidence_close
    intent: Ready to build in chosen tool; next = Filters & Routers

mission:
  type: practice
  intent: Design workflow for automation candidate — paper only, 10–15 min; Trigger type + «when» + data + chained Actions + Success
  rubricIntent:
    - dimension: trigger_actions
      weight: 60
      criteria: Clear trigger type and «when»; Action 1+2 linked to prior data
    - dimension: success
      weight: 40
      criteria: Measurable success criterion; goal tied to Success
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - build_workflow_in_tool_for_learner

termsLocked: [Trigger, Action, Schedule, Webhook, Event]

links:
  nextLessonId: automator-m3-l3-filters-routers
  continuityNote: Filters & Routers — when «when…» needs a routing decision
```

---

## 4. Arabic MSA canonical lesson text

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine for Gulf, English, and future locales · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** كل أتمتة = «لما هذا يحصل، افعل ذلك» — **Trigger (المُشغّل)** + فعل أو أكثر (**Action**).
- **لماذا الآن؟** بعد اختيار الأداة، تحتاج تصميم أول **workflow** للعامل الافتراضي — قبل فتح أي شاشة.
- **ماذا بعد الدرس؟** ستصمّم **workflow** واحدًا: مُشغّل → ٢–٣ actions.

### Tension — موقف مألوف

تبني Flow — من دون أن تعرف «لما ماذا؟»

تفتح الأداة وتضيف actions — لكن المُشغّل غير واضح. الـ Flow يعمل… لكن ليس في الوقت الصحيح.

العامل الافتراضي يحتاج أن يعرف: ما الحدث الذي يوقظه؟ وما الذي ينفّذه بعد أن يستيقظ؟

«لما X → افعل Y» — جملة واحدة تصمّم بها أي أتمتة.

### Core idea — الفكرة الأساسية

**لما هذا يحصل → افعل ذلك**

- **Trigger (المُشغّل):** الحدث الذي يبدأ العمل — نموذج اكتمل، رسالة وصلت، الساعة ٩ صباحًا.
- **Action (الفعل):** ما ينفّذه العامل الافتراضي — يرسل بريدًا، يضيف صفًا، يرسل واتساب.
- أنواع **Triggers** شائعة: **Schedule (موعد)**، **Webhook (إشعار فوري لما يحدث شيء)**، **Event (حدث في تطبيق)**.
- Actions متسلسلة: مخرجات action الأول = مدخلات الثاني. كسلسلة وراء بعض.
- **مثال:** «لما يملأ أحد النموذج → سجّل في جدول → أرسل واتساب ترحيب».

### Comparison — مثال من الحياة

| Actions فقط | Trigger + Actions |
|-------------|-------------------|
| بنت Flow يرسل بريدًا — لكن لا تعرف «متى». تضغط تشغيلًا يدويًا كل مرة. هذا ليس عاملًا افتراضيًا | «لما نموذج جديد → بريد ترحيب». لا تفتح الأداة — العامل الافتراضي يعمل وحده |

### Glossary — مصطلحان للـ workflow

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Trigger (المُشغّل)** | «لما…» — الحدث الذي يوقظ العامل الافتراضي | عميل اشترى دورة (**Webhook** من بوابة الدفع) |
| **Action (الفعل)** | «افعل…» — الخطوة التي تُنفَّذ بعد المُشغّل | أرسل واتساب فيه رابط الدخول |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري عن أنواع المُشغّلات والأفعال. **لا يُعاد توليده** في هذه المرحلة.

### Screenshot block (intent)

صورة توضيحية: كل خطوة = مُشغّل → action. مثال: «أنهيت مهمة» → «سجّل» + «افتح التالية» + «ذكّر». (الأصل البصري في الإنتاج المصري يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** أريد أول ما يشتري عميل دورة، أن يصله واتساب فورًا فيه رابط الدخول. ما التصميم الصحيح؟

- **الإجابة الصحيحة:** Trigger: **Webhook** من بوابة الدفع (شراء جديد). Action: إرسال واتساب.
- **التفسير:** الشراء = حدث فوري → Webhook. «لما يشتري → أرسل واتساب» — هذا تصميم العامل الافتراضي.

*(الخيارات الخاطئة المحفوظة من الإنتاج: Schedule كل ساعة للبحث عن مشتريات؛ Manual لكل عميل.)*

### Mission — مهمتك (intent + MSA draft labels)

**المقدمة:** صمّم workflow لمرشّح الأتمتة لديك — Trigger واحد + ٢–٣ Actions. تصميم على ورقة — لا بناء في الأداة. ١٠–١٥ دقيقة كافية.

**التسليم:** الهدف في سطر · Trigger (نوع + «لما…» + البيانات) · Action 1 و 2 (مع ربط المدخلات) · (اختياري) Action 3 · Success — كيف تعرف أنه اشتغل؟

**معايير التقييم (من الإنتاج — unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| Trigger + Actions | 60% | Trigger واضح بنوع و«لما…»؛ Action 1 + 2 مربوطان بالبيانات السابقة |
| Success | 40% | معيار نجاح قابل للقياس؛ الهدف مربوط بالـ Success |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** كل أتمتة = «لما هذا يحصل → افعل ذلك» — مُشغّل + actions.
- **تستطيع:** لديك workflow مصمّم جاهز — تستطيع بناءه في الأداة التي اخترتها.
- **التالي:** Filters & Routers — عندما «لما…» يحتاج قرارًا: إلى أين تذهب؟

---

## 5. Future generation notes

### Downstream locale packages (not created in this artifact)

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect copy directly |
| `en` | This MSA canonical | Egyptian dialect copy directly |

### Generation stages (when authorized)

1. **Gulf package** — MSA → Gulf naturalness; preserve Trigger/Action/Webhook gloss on first use.
2. **English package** — MSA → plain English; technical terms defined simply.
3. **Assistant profile** — must not design full workflow or build in tool for learner.
4. **Video script** — optional; production Bunny for `ar-EG` stays frozen.

### Explicitly deferred

- 100-lesson bulk derivation · Remotion/Bunny · runtime locale switching · mission evaluator changes

---

## 6. Localization UX notes

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §8 — **future runtime**:

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** |

Manual locale choice overrides automatic detection. Egyptian remains default.

---

## 7. Quality scoring

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §9 — scores **1–5**; pass rule: no dimension below **4/5**, average **≥ 4.3/5**.

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| **Objective preservation** | 4 | Objectives present; ⚠ human review: Trigger+Action design outcome clarity |
| **Concept preservation** | 5 | Trigger, Action, Schedule, Webhook, Event only — no drift |
| **Beginner clarity** | 4 | Simple MSA; ⚠ human review: automator path technical pacing |
| **MSA simplicity** | 4 | Neutral MSA; ⚠ human review: dialect residue scan |
| **Mission consistency** | 5 | 60/40 rubric and paper-design intent match production |
| **Quiz integrity** | 5 | Webhook + WhatsApp answer and instant-event reasoning unchanged |
| **Assistant boundaries** | 4 | forbiddenAssistantBehaviors listed; ⚠ human review: no workflow-build refusal phrasing |
| **Localization readiness** | 4 | §5–§6 present; ⚠ human review: EN technical glossary consistency |

| Metric | Value |
|--------|-------|
| **Average** | **4.375 / 5** |
| **Pass rule (≥ 4.3, all ≥ 4)** | **pass (provisional — pending human sign-off)** |
| **Scored by** | draft self-assessment · 2026-06-04 |
| **Production-ready?** | **no** — draft only until checklist §8 complete |

---

## 8. Review checklist

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §10.

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production file untouched | ☑ pass (read-only derivation) |
| 2 | Bunny video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production (60/40) | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian — not back-translated | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Quality scores recorded — pass rule met (provisional) | ⚠ needs human review |
| 13 | **Draft / not production-ready** stated explicitly | ☑ confirmed |
| 14 | Human reviewer sign-off | ☐ pending |

---

*Artifact owner: Adaptive Lesson Engine prototype · MSA canonical-first workflow · Draft only · Does not modify production lesson, video, or runtime.*
