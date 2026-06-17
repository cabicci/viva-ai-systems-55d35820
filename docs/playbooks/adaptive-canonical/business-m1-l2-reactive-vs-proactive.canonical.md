# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m1-l2-reactive-vs-proactive` |
| **pathId** | `business` |
| **moduleId** | `business-m1` |
| **productionTitle (ar-EG)** | Reactive vs Proactive |
| **productionRoute** | `/learn/business/business-m1-l2-reactive-vs-proactive` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m1-l2-reactive-vs-proactive.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.1-draft` |
| **derivedAt** | 2026-06-04 |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Reduce repetitive Reactive work with AI — make room for Proactive work that moves the business |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file. Human review and passing quality scores are required before any downstream use.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `business-m1-l2-reactive-vs-proactive.ts` (Egyptian blocks + mission) | **Frozen** — production source of truth for default UX |
| Bunny video for this lesson | **Frozen** — existing playback unchanged |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** — localization layers on top later |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner sees how repetitive Reactive work eats thinking time; AI can lighten part of it; classify weekly tasks and pick one Reactive task for AI help |
| **Block sequence** | Orientation → tension → core idea → glossary → video (optional) → comparison → diagram → quiz → mission → confidence close |
| **Mission rubric** | 60% realistic classification of 5 weekly tasks · 40% one Reactive task with specific AI help idea |
| **Quiz intent** | Karim spent 3 hours on supplier crisis first thing — **Reactive** (situation determined his day, not problem size) |
| **Concepts locked** | Reactive, Proactive, AI |
| **Next lesson continuity** | Customer lifecycle — client as journey, not single transaction |

### Derivation method

1. Read Egyptian production TS blocks (read-only).
2. Extract objectives, block roles, mission intent, rubric weights, quiz answer key.
3. Normalize learner-facing prose to **neutral Arabic MSA** — same meaning, no Egyptian dialect surface forms.
4. Do **not** write back to production or generate locale packages in this phase.

---

## 3. Structured canonical source

```yaml
lessonId: business-m1-l2-reactive-vs-proactive
canonicalVersion: 2026-06-04.1-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m1-l2-reactive-vs-proactive.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Reactive vs Proactive
  oneAha: "Reduce repetitive Reactive work with AI to open space for Proactive work"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m1-l1-recurring-decision]

objectives:
  - id: obj-1
    statement: Learner distinguishes Reactive vs Proactive weekly tasks.
    measurable: true
  - id: obj-2
    statement: Learner lists 5 real weekly tasks, classifies each, and picks one Reactive task AI can reduce.
    measurable: true

concepts:
  - id: concept-reactive
    term: Reactive
    termEn: Reactive
    definition: Task that comes to you from outside — you must respond or act immediately.
    mustPreserve: true
  - id: concept-proactive
    term: Proactive
    termEn: Proactive
    definition: Task you plan before it becomes a crisis.
    mustPreserve: true
  - id: concept-ai-help
    term: AI
    definition: Can help with repetitive tasks — summarize, draft reply, prioritize — not solve everything.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Repetitive work waits for you; AI can lighten part; classify 5 tasks after lesson
  - role: tension
    intent: Busy day but nothing built; Reactive mode — world sets your day
  - role: core
    intent: Reactive vs Proactive definitions; goal is not zero Reactive — reduce repeatables with AI
  - role: glossary
    intent: Reactive (رد فعل); Proactive (استباقي)
  - role: video
    intent: Optional — firefighting trap; production Bunny unchanged
  - role: comparison
    intent: Reactive week vs week with Proactive time freed
  - role: diagram
    intent: Reactive day vs Proactive day — reduce repeatables to make build time
  - role: quiz
    intent: Karim + supplier crisis = Reactive (who decided priorities?)
  - role: mission
    intent: List 5 weekly tasks, classify, pick one Reactive for AI help
  - role: confidence_close
    intent: Reactive eats week if unorganized; next = customer lifecycle

mission:
  type: practice
  intent: Honest diagnosis — 5 real weekly tasks classified; one Reactive with specific AI help (not full automation)
  rubricIntent:
    - dimension: realistic_classification
      weight: 60
      criteria: 5 tasks from real week — each classified Reactive or Proactive
    - dimension: ai_choice
      weight: 40
      criteria: One Reactive task with specific AI help idea
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_tasks_for_learner

termsLocked: [Reactive, Proactive, AI]

links:
  nextLessonId: business-m1-l3-customer-lifecycle
  continuityNote: Customer lifecycle — journey not single deal; AI improves each stage
```

---

## 4. Arabic MSA canonical lesson text

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine for Gulf, English, and future locales · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** العمل المتكرر الذي ينتظر ردك كل يوم يأكل وقت التفكير — والذكاء الاصطناعي (**AI**) يستطيع تخفيف جزء منه.
- **لماذا الآن؟** في الدرس السابق حدّدت قرارًا متكررًا. اليوم ستفهم لماذا تعود نفس القرارات كل أسبوع وتبقيك في وضع «الإطفاء».
- **ماذا بعد الدرس؟** ستعدّد ٥ مهام أسبوعية وتصنّفها **Reactive (رد فعل)** أو **Proactive (استباقي)** — وتختار مهمة Reactive واحدة يقلّلها الذكاء الاصطناعي.

### Tension — موقف مألوف

تُغلق يومك وأنت «اشتغلت» — لكن لا شيء بُني.

صاحب عمل يفتح واتساب صباحًا — مورد، عميل، موظف، شكوى. الساعة ٣ بعد الظهر يجد نفسه ما زال يرد. لا وقت للتسعير ولا للتخطيط.

هذا **Reactive mode**: العالم يحدّد يومك — لا أنت. ليس كسلًا — بل تكرار عمل لم يُنظّم.

الذكاء الاصطناعي لا يحلّ كل المشاكل. لكنه يساعد في المهام المتكررة: تلخيص، صياغة رد، ترتيب أولويات — ليفتح نصف ساعة **Proactive** كل أسبوع.

### Core idea — الفكرة الأساسية

**قلّل المتكرر — افتح باب الاستباقي**

- **Reactive (رد فعل):** عمل يأتيك — رسالة، مشكلة، طلب عاجل. يجب أن يُنجَز، لكنه لا يبني العمل وحده.
- **Proactive (استباقي):** عمل تختاره أنت — تسعير، عرض جديد، متابعة عميل مهم، تحسين عملية. هذا ما يحرّك العمل.
- إذا كان ٩٠٪ من أسبوعك Reactive، لن تصل إلى بناء نظام. الهدف ليس صفر Reactive — الهدف تقليل المتكرر بالذكاء الاصطناعي حتى يصبح Proactive ممكنًا.
- اسأل: «ما المهمة التي أفعلها كل أسبوع بنفس الطريقة؟» — هذه أول مرشّحة للذكاء الاصطناعي.

### Glossary — مصطلحان للتصنيف

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Reactive (رد فعل)** | مهمة تأتيك من الخارج — يجب أن ترد أو تتصرف فورًا | شكوى عميل، رسالة مورد، طلب عاجل من موظف |
| **Proactive (استباقي)** | مهمة تخطّط لها قبل أن تصير أزمة | مراجعة أرقام الأسبوع، تحديث قائمة أسعار، تصميم متابعة عملاء |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري عن فخ الإطفاء اليومي — لماذا العمل المتكرر يأكل وقت القرار. **لا يُعاد توليده** في هذه المرحلة.

### Comparison — مثال من الحياة

| أسبوع Reactive | أسبوع فيه Proactive |
|----------------|---------------------|
| كل يوم يبدأ بالرسائل. نهاية الأسبوع: متعب، لكن لا قرار تسعير ولا تحسين عملية | قلّلت ٣ مهام متكررة بالذكاء الاصطناعي. فتحت ساعتين لمراجعة أرقام وتعديل عرض — العمل تحرّك خطوة |

### Diagram block (intent)

رسم توضيحي: يوم Reactive مقابل يوم Proactive — توزيع اليوم. الهدف ليس إلغاء Reactive — بل تقليل المتكرر ليفتح وقت للبناء. (الأصل البصري في الإنتاج المصري يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** كريم فتح واتساب أول الصبح بسبب مشكلة مورد كبيرة وقضى ٣ ساعات. ما هذا؟

- **الإجابة الصحيحة:** Reactive — الموقف حدّد يومه قبل أن يختار أولوياته.
- **التفسير:** حجم المشكلة ليس المعيار. المعيار: من قرّر ماذا تعمل أولًا؟ تقليل المتكرر يبدأ بمعرفة متى «العالم» يأخذ يومك.

### Mission — مهمتك (intent + MSA draft labels)

**المقدمة:** المهمة عملية — لا تحفيز. اكتب ٥ مهام تفعلها كل أسبوع (أو تقريبًا)، وصنّف كل واحدة Reactive أو Proactive. ثم اختر مهمة Reactive واحدة يستطيع الذكاء الاصطناعي تقليلها. لا يُطلب أتمتة كاملة — يُطلب تشخيص صادق.

**التسليم:** المهام الخمس + التصنيف + مهمة Reactive المختارة + كيف يساعد الذكاء الاصطناعي (جملة أو جملتان).

**معايير التقييم (من الإنتاج — unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف واقعي | 60% | ٥ مهام من أسبوعك الحقيقي — كل واحدة مصنّفة |
| اختيار للذكاء الاصطناعي | 40% | مهمة Reactive واحدة مع فكرة مساعدة محددة |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** Reactive يأكل الأسبوع إن لم يُنظّم — والذكاء الاصطناعي يقلّل المتكرر حتى يصبح Proactive ممكنًا.
- **تستطيع:** أن تعرف ما يأخذ وقتك فعلًا — لا ما «يُفترض» أن تفعله.
- **التالي:** دورة حياة العميل — العميل رحلة لا صفقة واحدة، وكيف يحسّن الذكاء الاصطناعي كل محطة.

---

## 5. Future generation notes

### Downstream locale packages (not created in this artifact)

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect copy directly |
| `en` | This MSA canonical | Egyptian dialect copy directly |

### Generation stages (when authorized)

1. **Gulf package** — MSA → Gulf naturalness; preserve Reactive/Proactive pair terms on first use.
2. **English package** — MSA → plain English; define Reactive/Proactive simply.
3. **Assistant profile** — per locale; must not classify tasks or pick AI candidate for learner.
4. **Video script** — optional beat map from MSA; production Bunny for `ar-EG` stays frozen.

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
| **Objective preservation** | 4 | Objectives present; ⚠ human review: confirm classification + AI choice outcomes |
| **Concept preservation** | 5 | Reactive, Proactive, AI only — no drift |
| **Beginner clarity** | 4 | Simple MSA; ⚠ human review: business-owner audience read-aloud |
| **MSA simplicity** | 4 | Neutral MSA; ⚠ human review: scan for dialect residue |
| **Mission consistency** | 5 | 60/40 rubric and honest-diagnosis intent match production |
| **Quiz integrity** | 5 | Reactive answer + «who decided priorities» reasoning unchanged |
| **Assistant boundaries** | 4 | forbiddenAssistantBehaviors listed; ⚠ human review: refusal phrasing |
| **Localization readiness** | 4 | §5–§6 present; ⚠ human review: Gulf business tone notes |

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
