# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m7-l3-queries` |
| **pathId** | `builder` |
| **moduleId** | `builder-m7` |
| **productionTitle (ar-EG)** | Queries: ازاي بتجيب البيانات |
| **productionRoute** | `/learn/builder/builder-m7-l3-queries` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m7-l3-queries.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Query = سؤال محدد للمخزن — السؤال الواضح = صفحة سريعة وآمنة |
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
| `builder-m7-l3-queries.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Query = specific question; SELECT/WHERE/ORDER/LIMIT; not SELECT * |
| **Mission rubric** | 60% ٣ أسئلة واضحة · 40% شروط وحدود |
| **Quiz intent** | Slow page → check SELECT * first (correctIndex 0) |
| **Concepts locked** | Query, WHERE |
| **Prerequisite** | `builder-m7-l2-relations` |
| **Next lesson** | `builder-m8-l1-sessions-jwt` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m7-l3-queries
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m7-l3-queries.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Queries — How to Fetch Data
  oneAha: "Query = specific question to the database — clear question = fast safe page"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m7-l2-relations]

objectives:
  - id: obj-1
    statement: Learner explains Query as specific question with SELECT, WHERE, ORDER, LIMIT.
    measurable: true
  - id: obj-2
    statement: Learner writes 3 plain-language questions with filters and limits for real pages.
    measurable: true

concepts:
  - id: concept-query
    term: Query
    termEn: Query
    definition: Specific command to fetch particular information from the database.
    mustPreserve: true
  - id: concept-where
    term: WHERE
    termEn: WHERE
    definition: Filter defining who or what gets returned.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Query = specific question; write 3 questions after lesson
  - role: tension
    intent: Page loads 6 seconds — wrong question fetches everything
  - role: core
    intent: SELECT columns needed; WHERE user_id; ORDER + LIMIT
  - role: comparison
    intent: Fetch all vs specific question
  - role: glossary
    intent: Query, WHERE
  - role: video
    intent: Ask database correctly — production Bunny unchanged
  - role: screenshot
    intent: Dashboard cards = separate queries
  - role: quiz
    intent: SELECT * first suspect (correctIndex 0)
  - role: mission
    intent: Write 3 plain-language questions with conditions
  - role: confidence_close
    intent: Next = Sessions & JWT

mission:
  type: practice
  intent: Write 3 plain-language questions — table, conditions, order/limit — ~10–15 min
  rubricIntent:
    - dimension: clear_questions
      weight: 60
      criteria: Simple language not complex SQL; serve real app pages
    - dimension: conditions_limits
      weight: 40
      criteria: Filter who/what; order or count limit — not fetch everything
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_queries_for_learner

termsLocked: [Query, WHERE, SELECT, LIMIT, ORDER BY]

links:
  nextLessonId: builder-m8-l1-sessions-jwt
  continuityNote: Sessions & JWT — know who is logged in

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

- **ماذا ستفهم؟** **Query (سؤال للمخزن)** = **سؤال محدد** — «أحضر محادثات هذا العميل من آخر أسبوع» **وليس «أحضر كل شيء»**.
- **لماذا الآن؟** **بعد تصميم الجداول وربطها**، **تحتاج أن تسأل المخزن بشكل صحيح** — **وإلا الصفحة تتحمّل في ثوانٍ**.
- **ماذا بعد الدرس؟** **ستكتب ٣ أسئلة بلغة بسيطة** — **المخزن يجيب عليها**.

### Tension — الصفحة تتحمّل ٦ ثوانٍ — والذكاء الاصطناعي «بطيء»

- **العميل يفتح سجل محادثاته** — **وينتظر ٦ ثوانٍ**. **يظن أن الذكاء الاصطناعي بطيء**، **لكن المشكلة في السؤال للمخزن**.
- **السؤال الخطأ:** «أحضر كل المحادثات» — **السيرفر يرجع ١٠٠ ألف سطر وأنت تحتاج ٢٠ فقط**.
- **السؤال الصح:** «أحضر ٢٠ محادثة لهذا العميل — الأحدث أولًا» — **٢٠٠ ميللي ثانية**.

### Core idea — Query = سؤال محدد للمخزن

- **أي سؤال = ٤ أجزاء:** **ماذا تريد (SELECT)** — **من أين (FROM)** — **بشروط ماذا (WHERE)** — **ترتيب وحد (ORDER + LIMIT)**.
- **SELECT الأعمدة التي تحتاجها فقط** — **ليس `SELECT *`**. **WHERE `user_id = العميل الحالي`** — **لئلا يرى بيانات غيره**.
- **ORDER BY `created_at` desc + LIMIT 20** = **الأحدث ٢٠ فقط**. **السؤال الواضح = صفحة سريعة**.

### Comparison — أحضر كل شيء vs اطلب ما تحتاج

| أحضر كل شيء ثم فلتر | سؤال محدد |
|---------------------|-----------|
| `select('*')` **من جدول فيه ١٠٠ ألف محادثة** — **بطيء، ثقيل، وغير آمن** | «أحضر `id, title, status` من `tasks` — **لهذا العميل فقط** — **الأحدث أولًا** — **١٠ فقط». **سريع وخفيف وآمن** |

### Glossary — مصطلحان للسؤال

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Query (سؤال للمخزن)** | **أمر محدد ترسله للمخزن لجلب معلومة معينة** | «أحضر آخر ١٠ محادثات لهذا العميل» — **هذا Query** |
| **WHERE (شرط)** | **الفلتر الذي يحدد من أو ماذا يُجلب** | `WHERE user_id = العميل_الحالي` — **محادثاته هو فقط** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تسأل المخزن بشكل صحيح». **لا يُعاد توليده.**

### Screenshot block (intent)

**كل رقم وراءه سؤال للمخزن:**

الصفحة **ليست جدولًا خامًا** — **أسئلة منفصلة للمخزن**. **كل بطاقة = Query محدد**. **السؤال الواضح = رقم يتحدّث بسرعة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **صفحة سجل المحادثات بطيئة — السؤال يأخذ ٦ ثوانٍ. ما أول شيء تشك فيه؟**

- **الإجابة الصحيحة (خيار ١):** **أستخدم `SELECT *` بدل تحديد الأعمدة التي أحتاجها**.
- خيار ٢: **السيرفر يحتاج إمكانيات أعلى**.
- خيار ٣: **الـ JOIN كثيرة وتحتاج تقسيمًا**.

**التفسير:** **أول وأسهل خطوة:** **اطلب الأعمدة التي تحتاجها فقط**. **`SELECT *` يبطّئ كل شيء**.

### Mission — اكتب ٣ أسئلة بلغة بسيطة

**المقدمة:** **فكّر في تطبيقك** — **ما الأسئلة التي تحتاجها الصفحات؟** **اكتبها بلغة بسيطة**. **١٠–١٥ دقيقة**.

**التسليم:** لكل سؤال — **السؤال بلغة عادية**، **من أي جدول**، **الشروط**، **الترتيب والعدد**.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ أسئلة واضحة | 60% | **لغة بسيطة — ليست SQL معقدة**؛ **تخدم صفحات حقيقية** |
| شروط وحدود | 40% | **فلتر (من / الحالة)** — **ليس «أحضر كل شيء»**؛ **ترتيب أو حد للعدد** |

### Confidence close

- **فهمت:** **Query = سؤال محدد للمخزن**. **السؤال الواضح = صفحة سريعة وآمنة**.
- **تستطيع:** **عندك ٣ أسئلة بلغة بسيطة** — **جاهزة للتحويل إلى كود أو Prompt في Lovable**.
- **التالي:** **Sessions & JWT** — **كيف تعرف من العميل الداخل وتحمي بياناته**.

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
| Concept preservation | 5 | Query, WHERE only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — SELECT * |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
