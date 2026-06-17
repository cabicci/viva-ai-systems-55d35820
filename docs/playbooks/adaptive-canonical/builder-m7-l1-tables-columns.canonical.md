# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m7-l1-tables-columns` |
| **pathId** | `builder` |
| **moduleId** | `builder-m7` |
| **productionTitle (ar-EG)** | Tables & Columns |
| **productionRoute** | `/learn/builder/builder-m7-l1-tables-columns` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m7-l1-tables-columns.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Table = نوع بيانات — Column = صفة بنوعها؛ النوع الصح من الأول يوفر مشاكل لاحقًا |
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
| `builder-m7-l1-tables-columns.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Table = نوع بيانات؛ Column = صفة بنوعها؛ تصميم صحيح من البداية |
| **Mission rubric** | 50% ثلاث جداول منطقية · 50% أنواع أعمدة صح |
| **Quiz intent** | عمود `price` → `numeric not null` (correctIndex 0) |
| **Concepts locked** | Table, Column |
| **Prerequisite** | `builder-m6-l6-debugging` |
| **Next lesson** | `builder-m7-l2-relations` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m7-l1-tables-columns
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m7-l1-tables-columns.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Tables & Columns
  oneAha: "Table = data type — Column = attribute with type; correct types from day one"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m6-l6-debugging]

objectives:
  - id: obj-1
    statement: Learner explains Table as one data type and Column as typed attribute per row.
    measurable: true
  - id: obj-2
    statement: Learner designs 3 tables with correct column types (uuid, timestamptz, numeric, not null).
    measurable: true

concepts:
  - id: concept-table
    term: Table
    termEn: Table
    definition: Storage for one kind of data — like one Excel sheet per topic.
    mustPreserve: true
  - id: concept-column
    term: Column
    termEn: Column
    definition: Attribute per row with a specific data type.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Table = type; Column = attribute; design 3 tables after lesson
  - role: tension
    intent: All text columns → slow, inaccurate app; wrong types break analytics
  - role: core
    intent: One table per type; column types uuid, integer, timestamptz, numeric
  - role: comparison
    intent: All text vs correct types per column
  - role: glossary
    intent: Table, Column
  - role: video
    intent: Correct table design — production Bunny unchanged
  - role: screenshot
    intent: AI reads context tables (currentUser, currentPath)
  - role: quiz
    intent: price column → numeric not null (correctIndex 0)
  - role: mission
    intent: Design 3 tables with columns and types
  - role: confidence_close
    intent: Ready for Relations — linking tables

mission:
  type: practice
  intent: Design 3 tables for app data — name, columns, types, not null — ~10–15 min
  rubricIntent:
    - dimension: logical_tables
      weight: 50
      criteria: Each table one data type; id uuid primary key in each
    - dimension: column_types
      weight: 50
      criteria: Dates timestamptz; numbers integer/numeric; essential fields not null
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_table_schemas_for_learner

termsLocked: [Table, Column, Database, uuid, timestamptz, numeric]

links:
  nextLessonId: builder-m7-l2-relations
  continuityNote: Relations — link tables to answer real questions

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

- **ماذا ستفهم؟** **Table (جدول)** = **نوع بيانات** (مستخدمون، محادثات). **Column (عمود)** = **صفة لكل صف** (اسم، تاريخ، تقييم).
- **لماذا الآن؟** **عمق Builder اختياري** — لكن إن كان تطبيقك يخزّن بيانات، **التصميم الصح من الأول** يوفر مشاكل لاحقًا.
- **ماذا بعد الدرس؟** **ستصمّم ٣ جداول** لتطبيقك — **كل جدول بأعمدته وأنواعها**.

### Tension — كل شيء text — بطيء وغير دقيق

- **تصمم أول جدول في المخزن الذكي (Database)** — **وكل عمود نوعه `text`**. **سهل في البداية**، لكن **بعد شهور التطبيق بطيء**.
- **تقييم المستخدم في `text`؟** **النظام لن يحسب متوسط التقييمات**. **التاريخ في `text`؟** **لن يرتّب من الأحدث**.
- **الجدول = نوع البيانات**. **العمود = الصفة**. **النوع الخطأ = مشاكل من أول يوم**.

### Core idea — الجدول = نوع — العمود = صفة بنوعها

- **كل جدول يمثّل نوعًا واحدًا**: `users`، `conversations`، `documents` — **ليس «كل شيء في جدول واحد»**.
- **كل عمود = صفة + نوع بيانات**: `id` = uuid، `rating` = integer، `created_at` = timestamptz.
- **قواعد مهمة**: `not null` **للحقول الأساسية**. **uuid للـ IDs**. **numeric للأموال**. **timestamptz للتواريخ**.

### Comparison — كل شيء text vs أنواع صحيحة

| كل الأعمدة text | كل عمود بنوعه |
|-----------------|---------------|
| `user_rating text` — **لا متوسط**. `created_at text` — **لا ترتيب زمني**. **بطيء وغير دقيق** | `user_rating integer`، `created_at timestamptz default now()`، `id uuid primary key`. **تحليل وتطوير أسهل** |

### Glossary — مصطلحان للمخزن

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Table (جدول)** | **مكان تخزّن نوعًا واحدًا من البيانات** — **كجدول Excel لموضوع واحد** | جدول `conversations` — **كل صف = محادثة واحدة** |
| **Column (عمود)** | **صفة لكل صف — لها نوع بيانات محدد** | `title text not null` — **عنوان إجباري نصي** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «تصميم جدول صح». **لا يُعاد توليده.**

### Screenshot block (intent)

**الذكاء الاصطناعي يقرأ الجداول لفهم السياق:**

قبل أن يجيب **الذكاء الاصطناعي**، **ينظر إلى جداول** مثل `currentUser` و `currentPath`. **التصميم الصح = ذاكرة سريعة ودقيقة**.

### Quiz — تأكيد سريع

**السؤال:** **تعمل جدول `services` وفيه عمود `price` (سعر الخدمة). ما الأنسب؟**

- **الإجابة الصحيحة (خيار ١):** **`numeric not null`** — **الأموال دقيقة وكل خدمة لها سعر**.
- خيار ٢: `integer nullable` — **رقم صحيح وقد يكون السعر غير محدد**.
- خيار ٣: `text not null` — **كتابة السعر كنص «١٠٠ جنيه»**.

**التفسير:** **`numeric` للأموال** (كسور عشرية). **`not null`** لأن **كل خدمة معروضة لها سعر**.

### Mission — صمّم ٣ جداول لتطبيقك

**المقدمة:** **فكّر في بيانات تطبيقك** — **ما الذي يجب تخزينه؟** **صمّم ٣ جداول**. **١٠–١٥ دقيقة**.

**التسليم:** لكل جدول — **الاسم**، **نوع البيانات**، **الأعمدة** (اسم، نوع، not null/nullable)، **هل فيه `id uuid primary key`؟**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ جداول منطقية | 50% | **كل جدول نوع بيانات واحد**؛ **`id uuid primary key` في كل جدول** |
| أنواع الأعمدة صح | 50% | **التواريخ `timestamptz`**؛ **الأرقام integer/numeric**؛ **الحقول الأساسية `not null`** |

### Confidence close

- **فهمت:** **الجدول = نوع بيانات**. **العمود = صفة بنوعها**. **النوع الصح من الأول = تطبيق سريع ودقيق**.
- **تستطيع:** **عندك ٣ جداول مصمّمة** — **جاهزة للربط**.
- **التالي:** **Relations** — **كيف تربط الجداول لتجاوب على أسئلة حقيقية**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Table**, **Column**, **Database** preserved — gloss on first use. Type names (`uuid`, `timestamptz`, `numeric`) from production only. Screenshot = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Table, Column only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — numeric not null |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

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
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
