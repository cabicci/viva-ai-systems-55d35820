# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m4-l1-connect-database` |
| **pathId** | `automator` |
| **moduleId** | `automator-m4` |
| **productionTitle (ar-EG)** | وصّل الـ DB من Builder |
| **productionRoute** | `/learn/automator/automator-m4-l1-connect-database` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m4-l1-connect-database.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | DB = automation memory — organized place + fields + when write/read |
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
| `automator-m4-l1-connect-database.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Automation stronger with organized data storage; define where workflow stores + which fields |
| **Mission rubric** | 60% place + fields · 40% write + read |
| **Quiz intent** | Daily lead registration — sales report needs workflow writing to organized table with fixed fields |
| **Concepts locked** | Schema, CRUD |
| **Prerequisites** | `automator-m3-l3-filters-routers` |
| **Next lesson** | `automator-m4-l2-webhooks-api` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m4-l1-connect-database
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m4-l1-connect-database.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Connect Database
  oneAha: "DB = automation memory — one place, fixed fields, when write and read"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m3-l3-filters-routers]

objectives:
  - id: obj-1
    statement: Learner explains why automation needs organized storage not just messages.
    measurable: true
  - id: obj-2
    statement: Learner defines storage place, 3+ fields, write trigger, and read use case for one workflow.
    measurable: true

concepts:
  - id: concept-schema
    term: Schema
    termEn: Schema
    definition: Fields you store — column names and types.
    mustPreserve: true
  - id: concept-crud
    term: CRUD
    termEn: CRUD
    definition: Create write, Read read, Update update, Delete delete.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Automation stores organized data; pick storage place + fields after lesson
  - role: tension
    intent: Welcome email sent but no record when sales asks who registered
  - role: core
    intent: DB = memory; 3 fields enough; workflow reads and writes same place
  - role: comparison
    intent: Email only vs record + email
  - role: glossary
    intent: Schema (شكل الجدول); CRUD (قراءة وكتابة)
  - role: video
    intent: Optional connect DB — production Bunny unchanged
  - role: screenshot
    intent: Organized data behind workflow
  - role: quiz
    intent: Daily leads + sales report = organized table write/read
  - role: mission
    intent: Design storage plan — place, 3+ fields, write trigger, read user
  - role: confidence_close
    intent: Storage plan ready; next = Webhooks & APIs

mission:
  type: practice
  intent: Pick workflow; define where data stores, 3+ fields, when written (after trigger), when read (who/why) — design only; AI may suggest columns, learner chooses — 10–15 min
  rubricIntent:
    - dimension: place_fields
      weight: 60
      criteria: Specific storage place not "we'll see"; 3+ fields with clear names
    - dimension: write_read
      weight: 40
      criteria: Write tied to trigger; read has clear user and purpose
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_storage_schema_for_learner

termsLocked: [Schema, CRUD, DB, workflow, Trigger]

links:
  nextLessonId: automator-m4-l2-webhooks-api
  continuityNote: Webhooks & APIs — when one app tells another "something happened"

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** الأتمتة تصبح أقوى عندما تحفظ بيانات منظمة — وليس فقط ترسل رسالة وتنسى.
- **لماذا الآن؟** **مسار العمل (workflow)** يقرأ ويكتب — ومن دون مكان واضح للبيانات، الشغل المتكرر يعود يدويًا.
- **ماذا بعد الدرس؟** ستختار أين يخزّن **مسار العمل (workflow)** البيانات + ما الحقول التي يحتاجها.

### Tension — موقف مألوف

- «العميل سجّل — ولا نجد بياناته».
- الأتمتة ترسل بريد ترحيب — جيد. لكن عندما تسأل المبيعات «من هذا العميل؟» — لا سجل.
- البيانات ذهبت في البريد فقط — وليس في مكان منظم يمكن الرجوع إليه كل يوم.
- العامل الافتراضي يحتاج ذاكرة: أين يحفظ؟ ما الحقول؟ متى يقرأ؟ — من دون ذلك يعود الشغل المتكرر يدويًا.

### Core idea — DB = ذاكرة الأتمتة

- كل lead أو طلب يحتاج تسجيلًا في مكان واحد — جدول أو شيت منظم بحقول ثابتة.
- اكتب: متى تُكتب البيانات؟ (بعد التسجيل) — متى تُقرأ؟ (تقرير يومي، متابعة).
- ٣ حقول كافية للبداية: اسم، تواصل، تاريخ/حالة — لا يلزم ٢٠ عمودًا.
- **مسار العمل (workflow)** يقرأ من نفس المكان الذي يكتب فيه — هذا ما يجعل الشغل المتكرر يعمل وحده.

### Comparison — رسالة وخلاص vs سجل منظم

| بريد فقط | سجل + بريد |
|----------|------------|
| الأتمتة ترسل بريدًا — البيانات في صندوق الوارد. بعد أسبوع: من سجّل؟ لا أحد يعرف. | نفس الأتمتة تكتب صفًا في جدول (اسم، هاتف، تاريخ) + ترسل بريدًا. المتابعة تلقائية. |

### Glossary — مصطلحان للتخزين

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Schema (شكل الجدول)** | الحقول التي تحفظها — اسم كل عمود ونوعه | leads: name, phone, status, created_at |
| **CRUD (قراءة وكتابة)** | Create = اكتب. Read = اقرأ. Update = حدّث. Delete = امسح | تسجيل جديد → Create. تقرير يومي → Read |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تختار أين يخزّن **مسار العمل (workflow)** وما الحقول — دون تعقيد. **لا يُعاد توليده**.

### Screenshot block (intent)

كل حدث (تسجيل، تقدّم، طلب) يُسجّل في مكان واحد. **مسار العمل (workflow)** يقرأ ويكتب من نفس المصدر — وليس ملفات متفرقة.

### Quiz — تأكيد سريع

**السؤال:** أتمتة تسجّل عملاء جدد كل يوم. المبيعات تحتاج تقريرًا بأسمائهم. ما الأهم؟

- **الإجابة الصحيحة (correctIndex: 0):** **مسار العمل (workflow) يكتب كل عميل في جدول منظم بحقول ثابتة — ويقرأ منه للتقرير**
- **التفسير:** السجل المنظم = ذاكرة الأتمتة. بريد من دون جدول = الشغل المتكرر يعود يدويًا.

### Mission — حدّد أين تُخزَّن البيانات

**المقدمة:** المهمة تصميم — وليس ربطًا تقنيًا إلزاميًا. اختر **مسار عمل (workflow)** وحدّد: أين تُحفظ البيانات؟ وما الحقول؟ يمكن للذكاء الاصطناعي اقتراح أعمدة — أنت تختار النهائي.

**التسليم:** **مسار العمل (workflow)** · مكان التخزين · ٣ حقول على الأقل · متى تُكتب (بعد أي **مُشغّل**) · متى تُقرأ (من يستخدمها ولماذا)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مكان + حقول | 60% | مكان تخزين محدّد — وليس «سنرى»؛ ٣ حقول على الأقل بأسماء واضحة |
| كتابة وقراءة | 40% | متى تُكتب مربوطة بـ **المُشغّل (Trigger)**؛ متى تُقرأ فيها مستخدم واضح |

### Confidence close

- **فهمت:** الأتمتة أقوى عندما لديها ذاكرة منظمة — مكان + حقول + متى تكتب وتقرأ.
- **تستطيع:** لديك خطة تخزين جاهزة لـ **مسار عمل (workflow)** حقيقي.
- **التالي:** **Webhooks & APIs** — عندما يقول تطبيق لتطبيق آخر «حدث شيء».

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
| Concept preservation | 5 | Schema, CRUD locked |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — organized table answer unchanged |
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
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
