# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m5-l4-database-intro` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | المخزن الذكي (Database) |
| **productionRoute** | `/learn/builder/builder-m5-l4-database-intro` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l4-database-intro.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | App needs memory (Database) — not just screen and backend work |
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
| `builder-m5-l4-database-intro.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Database = persistent memory; table like Excel on server |
| **Mission rubric** | 60% four clear columns · 40% logical reason |
| **Quiz intent** | Old orders from Database (correctIndex 2) |
| **Concepts locked** | Database, Table |
| **Prerequisite** | `builder-m5-l3-backend-api` |
| **Next lesson** | `builder-m5-l5-mini-win` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l4-database-intro
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l4-database-intro.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Database Intro (Smart Storage)
  oneAha: "App needs memory (Database) — not just screen and backend work"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l3-backend-api]

objectives:
  - id: obj-1
    statement: Learner explains three layers — Frontend, Backend, Database — and why memory matters.
    measurable: true
  - id: obj-2
    statement: Learner designs a table with 4 columns for an AI app.
    measurable: true

concepts:
  - id: concept-database
    term: Database
    termEn: Database
    definition: Permanent archive — saves clients, chats, anything that must persist.
    mustPreserve: true
  - id: concept-table
    term: Table
    termEn: Table
    definition: Rows and columns like Excel; each row = client or conversation.
    mustPreserve: true

blocks:
  - role: orientation
    intent: App needs memory; design 4-column table after lesson
  - role: tension
    intent: Client returns after week — app forgot everything
  - role: core
    intent: Frontend see, Backend work, Database remember; Excel on server
  - role: comparison
    intent: Browser-only storage vs server Database
  - role: glossary
    intent: Database, Table
  - role: video
    intent: Why Excel isn't enough — production Bunny unchanged
  - role: screenshot
    intent: Progress saved off device
  - role: quiz
    intent: Old data from Database (correctIndex 2)
  - role: mission
    intent: Design 4-column table
  - role: confidence_close
    intent: Three layers complete; next = Mini Win

mission:
  type: practice
  intent: Design table name + 4 columns with type, example, why — ~5–10 min
  rubricIntent:
    - dimension: four_clear_columns
      weight: 60
      criteria: Each column has name + type + example; columns tied to AI app not random
    - dimension: logical_reason
      weight: 40
      criteria: Each column has why important; info helps app remember client
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_table_schema_for_learner

termsLocked: [Database, Table, Frontend, Backend]

links:
  nextLessonId: builder-m5-l5-mini-win
  continuityNote: Mini Win — small and shipped beats complete and untested

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

- **ماذا ستفهم؟** **أي تطبيق يحتاج «ذاكرة»** — **مكانًا يحفظ فيه العملاء والمحادثات**.
- **لماذا الآن؟** **بدون مخزن**، **العميل يعود غدًا فيجد كل شيء فارغًا**.
- **ماذا بعد الدرس؟** **ستصمّم جدولًا بـ ٤ أعمدة** — **كورقة Excel لتطبيقك**.

### Tension — العميل عاد بعد أسبوع — والتطبيق نسيانه

- **العميل تحدّث مع AI، حصل على إجابة ممتازة، وأغلق التطبيق**.
- **بعد أسبوع فتح مرة أخرى** — **لا محادثة، لا اسمه، كأنه أول مرة**.
- **التطبيق بدون ذاكرة = إنسان بدون ذاكرة**. **كل يوم بداية جديدة**.

### Core idea — التطبيق يحتاج ذاكرة

- **Frontend = ترى**. **Backend = يعمل**. **Database (المخزن) = يتذكر**.
- **أي معلومة يجب أن تبقى غدًا** — **محادثات، أسماء، طلبات** — **مكانها المخزن**.
- **فكّر فيه كورقة Excel على سيرفر**: **صف لكل عميل، أعمدة للمعلومات**.
- **لا SQL مطلوب الآن** — **المطلوب: ماذا يجب أن يُخزَّن؟**

### Comparison — متصفح العميل vs مخزن على السيرفر

| تخزين في المتصفح فقط | مخزن على السيرفر |
|----------------------|-------------------|
| **المحادثات على جهاز العميل**. **فتح من هاتف آخر = فارغ**. **مسح cache = كل شيء ذهب** | **البيانات محفوظة خارج جهاز العميل**. **يعود من أي هاتف — يجد محادثاته**. **هذا Database** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Database (المخزن)** | **الأرشيف الدائم** — **يحفظ عملاء، محادثات، وأي شيء يجب أن يبقى** | «**آخر سؤال سأله العميل**» — **محفوظ في صف في الجدول** |
| **Table (جدول)** | **صفوف وأعمدة — كـ Excel**. **كل صف = عميل أو محادثة** | **أعمدة: الاسم \| الإيميل \| آخر زيارة \| آخر سؤال** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «لماذا Excel لا يكفي — المخزن الذكي». **لا يُعاد توليده.**

### Screenshot block (intent)

**التقدّم ليس على جهازك** — **لو فتحت من هاتف آخر تجده**. **لأنه محفوظ في مخزن**. **تطبيقك يعمل بنفس الفكرة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 2

**السؤال:** **العميل فتح التطبيق بعد ٦ أشهر ويجد كل طلباته القديمة. البيانات من أين؟**

- خيار ١: **من الواجهة على هاتفه**.
- خيار ٢: **من الكواليس التي تعمل الآن**.
- **الإجابة الصحيحة (خيار ٣):** **من المخزن — Database**.

**التفسير:** **أي معلومة قديمة محفوظة ومُرجَعة = Database**. **الواجهة تعرض — المخزن يحفظ**.

### Mission — صمّم جدولًا بـ ٤ أعمدة

**المقدمة:** **مهمة تخطيط — ليست SQL**. **٥–١٠ دقائق كافية**.

**التسليم:**

1. **اسم الجدول** (مثل «عملاء» أو «محادثات»)
2. **٤ أعمدة** — **لكل عمود: الاسم، نوع المعلومة (نص/رقم/تاريخ)، مثال، لماذا مهم**
3. **جملة «لماذا مهم» لكل عمود**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٤ أعمدة واضحة | 60% | **كل عمود فيه اسم + نوع + مثال**. **الأعمدة مربوطة بتطبيق AI — ليست عشوائية** |
| السبب منطقي | 40% | **كل عمود له «لماذا مهم»**. **المعلومات تساعد التطبيق «يتذكر» العميل** |

### Confidence close

- **فهمت:** **التطبيق = واجهة + كواليس + ذاكرة**. **بدون مخزن، العميل يُنسى**.
- **تستطيع:** **جدول بـ ٤ أعمدة** — **أساس أي تطبيق AI**.
- **التالي:** **Mini Win** — **«صغير ومنشور» أفضل من «كامل وغير مجرب»**.

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
| Concept preservation | 5 | Database, Table only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 2 — Database |
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
