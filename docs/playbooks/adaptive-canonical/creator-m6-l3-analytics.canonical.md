# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m6-l3-analytics` |
| **pathId** | `creator` |
| **moduleId** | `creator-m6-distribute` |
| **productionTitle (ar-EG)** | قراءة Analytics بسيطة |
| **productionRoute** | `/learn/creator/creator-m6-l3-analytics` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m6-l3-analytics.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Views alone mislead — read Watch Time, Save Rate, and Action Metric weekly |
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
| `creator-m6-l3-analytics.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Read posts with 3 signals — Watch Time, Save Rate, Action Metric — one improvement decision weekly |
| **Mission rubric** | 50% metric choice · 50% executive decision |
| **Quiz intent** | Lower views but better Watch Time and Save beats high views alone (correctIndex 1) |
| **Concepts locked** | Watch Time, Save Rate, Action Metric |
| **Prerequisite** | `creator-m6-l2-scheduling` |
| **Next lesson** | `creator-m6-l4-leads` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m6-l3-analytics
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m6-l3-analytics.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Simple Analytics Reading
  oneAha: "Views alone mislead — read Watch Time, Save Rate, and Action Metric weekly"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m6-l2-scheduling]

objectives:
  - id: obj-1
    statement: Learner reviews last 3 posts using Watch Time, Save Rate, and Action Metric instead of views alone.
    measurable: true
  - id: obj-2
    statement: Learner assigns each of 3 posts its most important metric with reason and one weekly improvement decision.
    measurable: true

concepts:
  - id: concept-watch-time
    term: Watch Time
    termEn: Watch Time
    definition: Average time people continued watching the content.
    mustPreserve: true
  - id: concept-save-rate
    term: Save Rate
    termEn: Save Rate
    definition: Save share compared to view count.
    mustPreserve: true
  - id: concept-action-metric
    term: Action Metric
    termEn: Action Metric
    definition: Indicator of a real step after viewing such as follow or message.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Views alone not enough — some lower-view posts build audience better
  - role: tension
    intent: Decisions on views alone repeat traffic without trust or conversion
  - role: core
    intent: Three signals weekly — one improvement decision only
  - role: comparison
    intent: Surface views read vs smart three-metric read
  - role: glossary
    intent: Watch Time, Save Rate, Action Metric
  - role: video
    intent: Read numbers without complexity — production Bunny unchanged
  - role: diagram
    intent: Analytics triangle — balance three signals not views only
  - role: quiz
    intent: Lower views stronger quality signal (correctIndex 1)
  - role: mission
    intent: 3 posts each with key metric and one weekly decision
  - role: confidence_close
    intent: Lead by indicators not impression — leads lesson next

mission:
  type: practice
  intent: Three posts with goal, key metric, reason, plus one next-week decision
  rubricIntent:
    - dimension: metric_selection
      weight: 50
      criteria: Each post has clear metric and justification not generic pick
    - dimension: executive_decision
      weight: 50
      criteria: One improvement decision directly tied to analysis
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - assign_metrics_for_learner

termsLocked: [Watch Time, Save Rate, Action Metric]

links:
  nextLessonId: creator-m6-l4-leads
  continuityNote: Leads next — bridge from attention to real contact

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

- **ماذا ستفهم؟** **المشاهدات (views) وحدها ليست كافية**.
- **رقم views قد يفرحك** — **لكنه لا يقول الحقيقة كاملة**. **منشورات مشاهداتها أقل** **لكن تأثيرها أعلى بكثير**.
- **المهم** **أن تفهم الإشارة الصحيحة:** **ما الذي يدل** **أن المحتوى يبني جمهورًا** **لا أن يمرّ في الـ feed فقط**.

### Tension — المشكلة

- **التركيز على رقم واحد** **يُضلّلك**.
- **عندما كل قرارك مبني على views** — **قد تكرر نوع محتوى** **يجلب زحمة** **من دون ثقة أو تحويل**.
- **تحس أنك تعمل كثيرًا** **لكن النمو الحقيقي بطيء** — **لأنك تقيس شيئًا** **غير مرتبط بهدفك الأساسي**.

### Core idea — اقرأ المنشور بثلاث إشارات

- **ثبّت على ٣ مؤشرات:** **Watch Time (وقت المشاهدة)**، **Save Rate (نسبة الحفظ)**، **Follow/Action Rate** — **Action Metric (مؤشر فعل)**.
- **Watch Time** **يقول هل البداية شدّت**. **Save Rate** **يقول هل القيمة تستحق الرجوع**. **Action Metric** **يقول هل زادت الثقة**.
- **كل أسبوع** **راجع آخر ٣ منشورات** — **واكتب قرار تحسين واحد فقط**. **التحسين الصغير المنتظم** **أفضل من تغييرات عشوائية كبيرة**.

### Comparison — قراءة سطحية أم قراءة ذكية؟

| قراءة سطحية | قراءة ذكية |
|-------------|------------|
| **منشور جاب views عالية إذن ممتاز** — **من دون فهم وقت المشاهدة والحفظ** | **أراجع ٣ مؤشرات أساسية قبل الحكم** — **أعرف ما أكرّر** **للبناء طويل الأمد** |

### Glossary — مصطلحات التحليل البسيط

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Watch Time (وقت المشاهدة)** | **متوسط الوقت** **الذي أكمل فيه الناس المحتوى** | **إن كانت البداية ضعيفة** **ستجد الرقم ينخفض بسرعة** |
| **Save Rate (نسبة الحفظ)** | **نسبة الحفظ** **مقارنة بعدد المشاهدات** | **كلما كانت القيمة عملية** **غالبًا ترتفع نسبة الحفظ** |
| **Action Metric (مؤشر فعل)** | **مؤشر يدل على خطوة فعلية** **بعد المشاهدة** | **منشور views أقل** **لكن جاب رسائل جدية = مؤشر أقوى** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تقرأ الأرقام من دون تعقيد». **لا يُعاد توليده.** **تحليل سريع** **وقرار تحسين واضح كل أسبوع**.

### Diagram block (intent)

مخطط بصري — **مثلث المؤشرات الأساسية**. **وازن بين الإشارات الثلاث** **بدل الاعتماد على views فقط** — **حتى يكون الحكم أدق**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **لديك منشوران:** **الأول views أعلى لكن Save Rate ضعيف** — **والثاني views أقل لكن Watch Time وSave أحسن**. **أي واحد تعتمد عليه** **كإشارة لتحسين المحتوى القادم؟**

- خيار ١: **الأول** **لأنه أعلى مشاهدة**.
- **الإجابة الصحيحة (خيار ٢):** **الثاني** **لأنه أقوى في الجودة والنية**.
- خيار ٣: **لا واحد** — **أختار حسب المزاج**.

**التفسير:** **المؤشرات التي تعكس القيمة الحقيقية** **أهم من رقم المشاهدة الخام** — **لأنها تقود لنمو أمتن**.

### Mission — حدّد لكل منشور أهم Metric

**المقدمة:** **اختر ٣ منشورات** — **قرّر لكل واحد المقياس الأهم** **الذي يعكس نجاحه فعلًا**.

**التسليم:** لكل منشور — الهدف · المقياس الأهم · السبب · **قرار واحد للأسبوع القادم**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| اختيار المقاييس | 50% | **كل منشور له metric واضح ومبرر** — **لا اختيار عام** |
| قرار تنفيذي | 50% | **قرار تحسين واحد** **مرتبط مباشرة بالتحليل** |

### Confidence close

- **فهمت:** **لديك الآن عدسة واضحة** **تفصل بين ضوضاء الأرقام والإشارات المهمة فعلًا**.
- **تستطيع:** **الدرس التالي** **يحوّل هذا الانتباه** **إلى Leads (عملاء محتملون) حقيقيين**.
- **التالي:** **من Views إلى Leads** — **كوبري صغير وواضح**.

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
| Concept preservation | 5 | Watch Time, Save Rate, Action Metric only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — quality signal over raw views |
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
