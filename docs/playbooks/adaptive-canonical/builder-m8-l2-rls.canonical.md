# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m8-l2-rls` |
| **pathId** | `builder` |
| **moduleId** | `builder-m8` |
| **productionTitle (ar-EG)** | الحارس الشخصي (RLS) |
| **productionRoute** | `/learn/builder/builder-m8-l2-rls` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m8-l2-rls.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | JWT = من أنت — RLS = أي صفوف ترى — القواعد على المخزن نفسه |
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
| `builder-m8-l2-rls.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | RLS filters rows per user at database level; Policy on every query |
| **Mission rubric** | 60% الشرط صح · 40% السبب |
| **Quiz intent** | task user_id = logged-in user (correctIndex 0) |
| **Concepts locked** | RLS, Policy |
| **Prerequisite** | `builder-m8-l1-sessions-jwt` |
| **Next lesson** | `builder-m9-l1-rag` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m8-l2-rls
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m8-l2-rls.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: RLS — Row Level Security
  oneAha: "JWT = who you are — RLS = which rows you see — rules on the database itself"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m8-l1-sessions-jwt]

objectives:
  - id: obj-1
    statement: Learner explains RLS as database-level filter even when app code forgets WHERE.
    measurable: true
  - id: obj-2
    statement: Learner writes one Policy — user sees only their rows with reason.
    measurable: true

concepts:
  - id: concept-rls
    term: RLS
    termEn: Row Level Security
    definition: Database rules filtering every query before results return.
    mustPreserve: true
  - id: concept-policy
    term: Policy
    termEn: Policy
    definition: Condition the guard applies per row — row user_id = logged-in user.
    mustPreserve: true

blocks:
  - role: orientation
    intent: RLS filters rows; write one policy after lesson; optional depth
  - role: tension
    intent: Client A saw Client B secrets — code-only security not enough
  - role: core
    intent: JWT proves identity; RLS Policy filters every query in database
  - role: comparison
    intent: WHERE in code only vs RLS on database
  - role: glossary
    intent: RLS, Policy
  - role: video
    intent: Row guard — production Bunny unchanged
  - role: screenshot
    intent: RLS diagram — each user sees own rows
  - role: quiz
    intent: user_id = logged-in user (correctIndex 0)
  - role: mission
    intent: One policy — table, link field, condition, why
  - role: confidence_close
    intent: Next = RAG

mission:
  type: practice
  intent: Write simple Policy — table, link field, plain-language condition, why — ~10 min
  rubricIntent:
    - dimension: condition_correct
      weight: 60
      criteria: Condition links row to current user identity; clear table and link field
    - dimension: reason
      weight: 40
      criteria: One line why rule prevents data leak between users
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - write_full_sql_policy_for_learner

termsLocked: [RLS, Policy, JWT, user_id, auth.uid]

links:
  nextLessonId: builder-m9-l1-rag
  continuityNote: RAG — AI answers from your files not guessing

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

- **ماذا ستفهم؟** **كيف تحدّد قواعد على مستوى المخزن أي صفوف يرى كل مستخدم** — **حتى لو كان هناك خطأ في الكود**.
- **لماذا الآن؟** **JWT (كارت دخول مؤقت) يقول «من أنت»** — **RLS (أمان على مستوى السطر) يقول «ماذا مسموح أن ترى» من البيانات**.
- **ماذا بعد الدرس؟** **ستكتب قاعدة واحدة:** **المستخدم يرى بياناته هو فقط**.
- **عمق اختياري:** **لمن يريد بناء تطبيقات حقيقية**. **يمكنك تخطيه والعودة لاحقًا**.

### Tension — عميل A رأى أسرار عميل B

- **تخيّل ذكاءًا اصطناعيًا شخصيًا يتعلم من ملاحظات كل عميل**. **عميل آخر فتح التطبيق فوجد أسرار الأول أمامه**.
- **معرفة ID شيء لا تعني أنك تستطيع رؤيته**. **والكود الصحيح في ٩ أماكن لا يكفي إن نسيت المكان العاشر**.
- **المشكلة:** **الأمان في الكود وحده ليس خط دفاع أخير**.

### Core idea — القواعد تحدد أي صفوف يرى المستخدم

- **JWT يثبت هويتك**. **RLS Policy (سياسة أمان على السطر) تضع فلترًا على كل سؤال للمخزن:** «أرجع فقط الصفوف التي `user_id` فيها = أنا».
- **الفلتر داخل المخزن نفسه** — **ليس في كود التطبيق فقط**.
- **حتى لو نسي الكود في الخلفية شرط WHERE**، **الحارس على السطر يرفض إظهار بيانات ليست لك**.

### Comparison — أمان في الكود vs حارس على كل سطر

| WHERE في الكود فقط | RLS على المخزن |
|--------------------|----------------|
| **`WHERE user_id = currentUser` في كل API**. **نسيت مرة واحدة — أسرار عميل انكشفت** | **Policy على الجدول:** `user_id = auth.uid()`. **أي query — حتى من خطأ — يرجع سطور المستخدم الحالي فقط** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **RLS (أمان على مستوى السطر)** | **قواعد على المخزن نفسه تفلتر أي query قبل إرجاع النتائج** — **حتى لو نسي الكود الفلتر** | **جدول محادثات:** **كل مستخدم يرى محادثاته فقط** |
| **Policy (سياسة)** | **الشرط الذي يطبّقه الحارس على كل سطر** | `USING (user_id = auth.uid())` — **يرجع صفوف من فتح التطبيق فقط** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «حارس على كل سطر». **لا يُعاد توليده.**

### Screenshot block (intent)

**نظارة سحرية لكل مستخدم:**

المخزن **واحد وفيه بيانات الجميع**. **عندما «أحمد» يطلب محادثاته**، **الـ Policy تفلتر وترجع سطوره هو فقط** — **كأن كل واحد يرى ما يخصه فقط**.

### Quiz — تأكيد سريع

**السؤال:** **جدول `tasks` — كل مهمة فيها `user_id`. ما الشرط المنطقي ليرى كل واحد مهامه فقط؟**

- **الإجابة الصحيحة (خيار ١):** **`user_id` للمهمة = `user_id` لمن سجّل الدخول الآن**.
- خيار ٢: **أي شخص يرى أي مهمة طالما معه ID المهمة**.
- خيار ٣: **يجب أن يكون admin ليرى أي مهمة**.

**التفسير:** **فكرة RLS ببساطة:** **نربط كل سطر بصاحبه** — **`user_id` في الصف = `user_id` من JWT**.

### Mission — قاعدة: المستخدم يرى بياناته هو فقط

**المقدمة:** **ستكتب Policy بسيطة لتطبيقك** — **ليس كود SQL كامل، الشرط فقط**. **١٠ دقائق**.

**التسليم:** **اسم الجدول**، **حقل الربط** (`user_id`)، **الشرط بجملة عادية**، **لماذا القاعدة مهمة**.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| الشرط صح | 60% | **الشرط يربط سطر الجدول بهوية المستخدم الحالي**؛ **جدول وحقل ربط واضحان** |
| السبب | 40% | **سطر يشرح لماذا القاعدة تمنع تسريب بيانات بين مستخدمين** |

### Confidence close

- **فهمت:** **JWT = من أنت**. **RLS = أي صفوف ترى** — **القواعد على المخزن نفسه**.
- **تستطيع:** **عندك Policy واحدة جاهزة لتطبيقك**.
- **التالي:** **RAG** — **كيف يرد الذكاء الاصطناعي من ملفاتك وليس من تخمين**.

---

## 5. Future generation notes

Downstream locales from MSA only. **RLS**, **Policy**, **JWT** preserved. RLS diagram = production reference. `auth.uid()` from production only. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | RLS, Policy only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — user_id match |
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
