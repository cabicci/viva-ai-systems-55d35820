# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m5-l1-four-numbers-dashboard` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m5` |
| **productionTitle (ar-EG)** | ٤ أرقام بس |
| **productionRoute** | `/learn/analyst/analyst-m5-l1-four-numbers-dashboard` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m5-l1-four-numbers-dashboard.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | A useful dashboard starts with four decision numbers — not fifty charts |
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
| `analyst-m5-l1-four-numbers-dashboard.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Build a weekly dashboard of exactly four decision numbers with comparison and thresholds |
| **Mission rubric** | 50% focus and selection · 50% comparison and threshold |
| **Quiz intent** | Leads up, conversion down, revenue flat — focus on conversion (correctIndex 1) |
| **Concepts locked** | KPI, Threshold |
| **Prerequisite** | `analyst-m4-l2-decision-rule` |
| **Next lesson** | `analyst-m4-automated-dashboard` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m5-l1-four-numbers-dashboard
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m5-l1-four-numbers-dashboard.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Four Numbers Dashboard
  oneAha: "Four decision numbers with this week, last week, and arrow — not forty vanity metrics"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m4-l2-decision-rule]

objectives:
  - id: obj-1
    statement: Learner selects exactly four metrics where a change would change their decision; each with comparison row.
    measurable: true
  - id: obj-2
    statement: Learner builds a simple weekly dashboard with values, last week, threshold, and one action if a number goes red.
    measurable: true

concepts:
  - id: concept-kpi
    term: KPI
    termEn: Key Performance Indicator
    definition: A specific number — if it changes, your decision changes.
    mustPreserve: true
  - id: concept-threshold
    term: Threshold
    termEn: Threshold
    definition: The number that if crossed requires an Action.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Dashboard = four decision numbers; after lesson draw 4-number dashboard
  - role: tension
    intent: 20 numbers on screen — 10 minutes, no decision; clutter delays action
  - role: core
    intent: Pick 4 where change = decision change; this week + last week + arrow; business vs non-business examples
  - role: comparison
    intent: 20-chart dashboard vs 4 clear decision numbers
  - role: glossary
    intent: KPI, Threshold
  - role: video
    intent: Watch — four numbers only — production Bunny unchanged
  - role: diagram
    intent: Four KPI slots with week comparison (four-kpi-dashboard)
  - role: quiz
    intent: Leads up, conversion down — focus conversion (correctIndex 1)
  - role: mission
    intent: Design 4-number dashboard with values, thresholds, one red-number action
  - role: confidence_close
    intent: Weekly review starts with 4 numbers; next = automated dashboard

mission:
  type: practice
  intent: Practical design — 4 numbers for learner context (business, learning, content, personal, team); simple sheet or paper OK
  rubricIntent:
    - dimension: focus_and_selection
      weight: 50
      criteria: Exactly four numbers each justified; fit learner context; each linked to possible decision
    - dimension: comparison_and_threshold
      weight: 50
      criteria: This week and last week values; threshold per number
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_dashboard_for_learner

termsLocked: [KPI, Threshold]

links:
  nextLessonId: analyst-m4-automated-dashboard
  continuityNote: Automated dashboard — one of the four updates itself

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

- **ماذا ستفهم؟** **Dashboard (شاشة فيها أهم الأرقام)** **المفيد** يبدأ **بأرقام قرار قليلة** — **ليس** **٥٠ رسمًا**.
- **لماذا الآن؟** في **الوحدة السابقة** كل **استنتاج** أصبح له **Action (إجراء)**. الآن تحتاج **٤ أرقام** تلخّص «**هل شغلي يسير؟**» **كل أسبوع**.
- **ماذا بعد الدرس؟** **ترسم Dashboard** من **٤ أرقام** **لمشروعك** أو **عملك**.

### Tension — Dashboard فيه ٢٠ رقم — ولا قرار

- **تفتح** Sheet أو أداة فيها **charts كثيرة** — **تقضي ١٠ دقائق** — **وتغلق** **من دون** أن تعرف «**ماذا يجب أن أفعل؟**»
- المشكلة **ليس** **نقص بيانات** — المشكلة **ازدحام**. **كل رقم إضافي** **يؤخّر** **القرار**.
- **Dashboard** **ليس** ليبدو أنك **محترف** — **بل** **في ثوانٍ** تعرف: **هل هناك مشكلة** أم **لا**؟

### Core idea — ٤ أرقام قرار — ليس ٤٠ metric (مقياس)

- **اختر ٤ أرقام فقط** — **إذا تغيّر واحد** منها، **يتغيّر قرارك**. **ليس** أي رقم «**جميل للعرض**».
- **كل رقم** بجانبه: **قيمة هذا الأسبوع**، **الأسبوع الماضي**، و**سهم (↑/↓)** — **لأن المقارنة** **جزء من العرض**.
- **بيزنس:** **Leads (ناس أبدت اهتمامًا)** · **Conversion (التحويل)** · **Revenue (الإيراد)** · **Retention (الناس كملت ورجعت)**. **غير بيزنس:** Progress · Responses · Results · Repeat.
- **إذا** لديك **أكثر من ٤** — اسأل: «**إذا حذفت هذا، كيف أقرّر؟**» **ما لا يجيب** = **ليس dashboard**.

### Comparison — ٢٠ رقم مقابل ٤ أرقام قرار

| Dashboard مليء | ٤ أرقام واضحة |
|----------------|---------------|
| **١٥ chart** — views، clicks، time on page، bounce… **تفتحه وتغلقه**. **نهاية الأسبوع:** «**أشعر** أن هناك **شيئًا خطأ**» **لكن لا أعرف ماذا** | **Leads ١٢٠ (↑)** · **Conversion ٨٪ (↓)** · **Revenue 15k (↑)** · **Retention ٣٠٪ (↓)**. **في ثانية:** **Conversion** و**Retention** **يحتاجان قرارًا** |

### Glossary — مصطلحان للـ Dashboard

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **KPI (مؤشر قرار)** | **رقم محدّد** — **إذا تغيّر**، **يتغيّر قرارك** | **Conversion %** — **إذا نزل**، **تحتاج** **مراجعة خطوة البيع** |
| **Threshold (حد قرار)** | **الرقم** الذي **إذا تجاوزته** — **يجب Action** | **إذا Retention نزل عن ٣٥٪** → **اجتماع متابعة عملاء** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «٤ أرقام بس». **لا يُعاد توليده.**

### Diagram block (intent)

**Dashboard أسبوعي من ٤ خانات** (معرّف: `four-kpi-dashboard`): **٤ أرقام** — **كل واحد:** **هذا الأسبوع**، **السابق**، **والسهم**. **إذا واحد أحمر** — **تعرف أين القرار**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **Leads زادت ٢٠٪** — **Conversion نزل** من **١٢٪** إلى **٨٪** — **Revenue ثابت**. **على أي رقم** **تركّز أولًا** **من الـ ٤**؟

- خيار ١: **Leads** — **لأنها زادت**.
- **الإجابة الصحيحة (خيار ٢):** **Conversion** — **لأنه نزل** **رغم** **زيادة الطلبات**، **وهذا يؤثّر** على **Revenue**.
- خيار ٣: **Revenue** — **لأنه ثابت** **فلا مشكلة**.

**التفسير:** **Leads** و**Conversion** **معًا** **يوضّحان** الصورة. **Conversion نزل** = **مشكلة في التحويل** — **هذا رقم قرار**.

### Mission — ارسم Dashboard من ٤ أرقام

**المقدمة:** مهمة **تصميم عملي** — **ليس** ديكورًا. **اختر ٤ أرقام** **تناسب سياقك** — **بيزنس**، **تعلّم**، **محتوى**، **شخصي**، أو **فريق** — **واكتبها** في **dashboard بسيط** (Sheet، Notion، ورقة). **لا أداة معقّدة مطلوبة** — **٤ أرقام** **تقرأها كل أسبوع** **وتقرّر**.

**التسليم:**

1. **المشروع/العمل** الذي **Dashboard** **له**
2. **الأربع أرقام** (Metric + **لماذا اخترته**)
3. **لكل رقم:** **قيمة هذا الأسبوع · الأسبوع الماضي · Threshold**
4. **إذا رقم واحد «أحمر»** — **ما القرار؟**
5. **رابط أو وصف بسيط** **لشكل Dashboard**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تركيز واختيار | 50% | **أربع أرقام بالضبط** — **كل واحد مبرّر**؛ **مناسبة لسياق المتعلم**؛ **كل رقم مربوط بقرار محتمل** |
| مقارنة وThreshold | 50% | **قيمة هذا الأسبوع والسابق**؛ **Threshold أو حد قرار لكل رقم** |

### Confidence close

- **فهمت:** **Dashboard مفيد** = **٤ أرقام قرار** **تقرأها كل أسبوع** — **ليس** **ازدحام charts**.
- **تستطيع:** لديك **٤ أرقام** **تبدأ** بها **أي مراجعة أسبوعية**.
- **التالي:** **Automated Dashboard (لوحة تلقائية)** — **اجعل رقمًا واحدًا** **من الأربعة** **يتحدّث لوحده**.

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
| Concept preservation | 5 | KPI, Threshold only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — focus Conversion |
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
| 6 | Mission rubric 50/50 | ☑ pass |
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
