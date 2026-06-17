# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m7-l2-relations` |
| **pathId** | `builder` |
| **moduleId** | `builder-m7` |
| **productionTitle (ar-EG)** | Relations بين الجداول |
| **productionRoute** | `/learn/builder/builder-m7-l2-relations` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m7-l2-relations.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | العلاقات تجاوب على أسئلة حقيقية — `user_id` = الوصلة التي تمنع الفوضى |
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
| `builder-m7-l2-relations.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Relations answer real questions; Foreign Key links tables; One-to-Many |
| **Mission rubric** | 70% تصميم العلاقة · 30% قرار الحذف |
| **Quiz intent** | Cascade Delete on user delete protects privacy (correctIndex 0) |
| **Concepts locked** | Foreign Key, One-to-Many |
| **Prerequisite** | `builder-m7-l1-tables-columns` |
| **Next lesson** | `builder-m7-l3-queries` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m7-l2-relations
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m7-l2-relations.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Relations between Tables
  oneAha: "Relations answer real questions — user_id is the link that prevents chaos"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m7-l1-tables-columns]

objectives:
  - id: obj-1
    statement: Learner explains how table relations answer questions like "this customer's conversations".
    measurable: true
  - id: obj-2
    statement: Learner designs One-to-Many relation with Foreign Key and delete behavior.
    measurable: true

concepts:
  - id: concept-foreign-key
    term: Foreign Key
    termEn: Foreign Key
    definition: Column pointing to id in another table — the link between them.
    mustPreserve: true
  - id: concept-one-to-many
    term: One-to-Many
    termEn: One-to-Many
    definition: One row in table A → many rows in table B.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Relations answer real questions; design user-to-many after lesson
  - role: tension
    intent: AI sends wrong user's data — no formal link between conversation and owner
  - role: core
    intent: users + conversations; user_id Foreign Key; One-to-Many
  - role: comparison
    intent: One big table vs two linked tables
  - role: glossary
    intent: Foreign Key, One-to-Many
  - role: video
    intent: Link tables practically — production Bunny unchanged
  - role: screenshot
    intent: users, posts, comments linked by user_id, post_id
  - role: quiz
    intent: Cascade Delete on user delete (correctIndex 0)
  - role: mission
    intent: Design user-to-many relation with delete behavior
  - role: confidence_close
    intent: Ready for Queries

mission:
  type: practice
  intent: Design One-to-Many — one table, many table, link column, delete behavior — ~10 min
  rubricIntent:
    - dimension: relation_design
      weight: 70
      criteria: user_id in many table; points to one table id; One-to-Many stated
    - dimension: delete_decision
      weight: 30
      criteria: Delete behavior chosen; reason privacy or data protection
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_relation_schema_for_learner

termsLocked: [Foreign Key, One-to-Many, user_id, Cascade Delete]

links:
  nextLessonId: builder-m7-l3-queries
  continuityNote: Queries — ask the database a clear question

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

- **ماذا ستفهم؟** **العلاقات بين الجداول** تجاوب على **أسئلة حقيقية** — مثل «محادثات هذا العميل» أو «ملفات هذا المستخدم».
- **لماذا الآن؟** **بعد تصميم الجداول**، **يجب ربطها** — **وإلا البيانات كومة والتطبيق يتلخبط**.
- **ماذا بعد الدرس؟** **ستصمّم علاقة واحد-لكثير (One-to-Many)** — **مستخدم → محادثات كثيرة**.

### Tension — الذكاء الاصطناعي ينسى من يكلمه

- **الذكاء الاصطناعي يكلم أحمد ثم سارة** — **وفجأة يرسل لسارة ملخص محادثة أحمد**. **كارثة خصوصية**.
- **المشكلة:** **كل المحادثات في كومة واحدة** **ولا وصلة رسمية** بين كل محادثة وصاحبها.
- **الحل:** **فصل الجداول وربطها بـ Foreign Key (مفتاح أجنبي)** — **كل شيء مربوط بصاحبه**.

### Core idea — العلاقات تجاوب على أسئلة حقيقية

- **بدل جدول واحد فيه كل شيء** — **جدولان**: `users` و `conversations`. **كل محادثة فيها `user_id` يشير إلى صاحبها**.
- **One-to-Many (واحد لكثير):** **عميل واحد → محادثات كثيرة**. **كل محادثة لصاحب واحد فقط**.
- **السؤال «أحضر محادثات العميل ٥» = علاقة**. **بدونها، المخزن لا يجيب**.

### Comparison — كومة واحدة vs فصل وربط

| كل شيء في جدول واحد | جدولان مربوطان |
|---------------------|----------------|
| `محادثات(اسم_العميل, ايميل, رسالة)`. **تغيير الاسم؟ تعديل كل الرسائل**. **خطأ في حرف؟ عميل جديد** | `users(id, name)` و `conversations(id, user_id, message)`. **تغيير الاسم في مكان واحد**. **كل محادثة مربوطة بـ `user_id`** |

### Glossary — مصطلحان للربط

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Foreign Key (مفتاح أجنبي)** | **عمود في جدول يشير إلى `id` في جدول آخر** — **الوصلة بينهما** | `conversations.user_id` → `users.id` |
| **One-to-Many (واحد لكثير)** | **صف واحد في جدول أ → صفوف كثيرة في جدول ب** | **عميل واحد → محادثات كثيرة**. **كل محادثة لصاحب واحد** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «ربط الجداول عمليًا». **لا يُعاد توليده.**

### Screenshot block (intent)

**الوصلة بين الجداول:**

تخيّل `users` = العملاء و `posts` = المحادثات. **`posts.user_id` = الوصلة** التي تقول **من صاحب المحادثة**. **بدونها، التطبيق أعمى**.

### Quiz — تأكيد سريع

**السؤال:** **كل عميل (`user`) له محادثات كثيرة (`conversations`). إذا مسح العميل حسابه، ما الأأمن لمحادثاته؟**

- **الإجابة الصحيحة (خيار ١):** **المحادثات تُمسح معه (Cascade Delete)** — **لحماية خصوصيته**.
- خيار ٢: **المحادثات تبقى و `user_id` يصبح فارغًا**.
- خيار ٣: **النظام يرفض مسح العميل طالما له محادثات**.

**التفسير:** **Cascade Delete يحمي خصوصية العميل** — **لا بيانات حساسة بعد مغادرته**.

### Mission — صمّم علاقة user-to-many

**المقدمة:** **تطبيقك فيه مستخدمون وكل مستخدم له أشياء كثيرة** (محادثات، ملفات، مهام). **صمّم العلاقة**. **١٠ دقائق**.

**التسليم:** **جدول «واحد»**، **جدول «كثير»**، **عمود الربط** (`user_id` → `id`)، **سلوك عند الحذف** ولماذا.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصميم العلاقة | 70% | **`user_id` في جدول «كثير»**؛ **يشير إلى `id` في «واحد»**؛ **One-to-Many واضحة** |
| قرار الحذف | 30% | **سلوك عند مسح المستخدم**؛ **السبب منطقي — خصوصية أو حماية** |

### Confidence close

- **فهمت:** **العلاقات تجاوب على أسئلة حقيقية**. **`user_id` = الوصلة التي تمنع الفوضى**.
- **تستطيع:** **عندك علاقة user-to-many مصمّمة** — **جاهزة لأسئلة محددة للمخزن**.
- **التالي:** **Queries** — **كيف تسأل المخزن سؤالًا واضحًا وتجلب بياناتك بسرعة**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Foreign Key**, **One-to-Many**, **Cascade Delete** preserved. Relations diagram = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Foreign Key, One-to-Many only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 70/30 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Cascade Delete |
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
| 6 | Mission rubric 70/30 | ☑ pass |
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
