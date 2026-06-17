# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m2-l1-customer-lifecycle` |
| **pathId** | `business` |
| **moduleId** | `business-m2` |
| **productionTitle (ar-EG)** | دورة حياة العميل |
| **productionRoute** | `/learn/business/business-m2-l1-customer-lifecycle` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m2-l1-customer-lifecycle.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.2-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **5-lesson MSA canonical pilot** (Business path) |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Customer is a journey through 5 stages — AI helps each stage when you know the weak one |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **approved-for-next-batch** |
| **humanReviewerSignOffDate** | 2026-06-04 |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: approved-for-next-batch** (Project Owner · 2026-06-04) — approved only for **controlled canonical expansion**, **not** production rollout or localization. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `business-m2-l1-customer-lifecycle.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Customer = journey (Awareness → Advocacy), not one transaction; map real journey + weakest stage |
| **Mission rubric** | 60% realistic five-stage journey · 40% weakness diagnosis with reason |
| **Quiz intent** | 100 new / 15 return — focus Retention before more ads |
| **Concepts locked** | Customer Journey, Weakest Stage, Awareness, Consideration, Purchase, Retention, Advocacy, AI |
| **Prerequisite** | `business-m1-l2-reactive-vs-proactive` (PATHS order) |
| **Next lesson** | `business-m2-l2-build-your-offer` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m2-l1-customer-lifecycle
canonicalVersion: 2026-06-04.2-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m2-l1-customer-lifecycle.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Customer Lifecycle
  oneAha: "Customer = 5-stage journey; fix weakest stage before buying more traffic"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m1-l2-reactive-vs-proactive]

objectives:
  - id: obj-1
    statement: Learner names five customer journey stages and sees AI help per stage after mapping.
    measurable: true
  - id: obj-2
    statement: Learner maps real customer journey across five stages and identifies weakest stage with reason.
    measurable: true

concepts:
  - id: concept-customer-journey
    term: Customer Journey
    termEn: Customer Journey
    definition: All stages from first awareness to advocacy — not purchase moment only.
    mustPreserve: true
  - id: concept-weakest-stage
    term: Weakest Stage
    termEn: Weakest Stage
    definition: Stage where most people drop — fixing it often cheaper than new acquisition.
    mustPreserve: true
  - id: concept-five-stages
    term: Awareness / Consideration / Purchase / Retention / Advocacy
    definition: Standard lifecycle stages preserved from production.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Customer = journey; AI improves each station when weak point known
  - role: tension
    intent: Ad spend up, weak return rate — leak in journey not awareness only
  - role: core
    intent: Five stages defined; AI helps messaging per stage after honest map
  - role: glossary
    intent: Customer Journey; Weakest Stage
  - role: video
    intent: Optional journey explainer — production Bunny unchanged
  - role: comparison
    intent: More ads vs fix weak Retention stage
  - role: diagram
    intent: Five-stage funnel — find leak not only fill top
  - role: quiz
    intent: Low return rate — Retention focus first
  - role: mission
    intent: Map five stages for real business + weakest stage + why
  - role: confidence_close
    intent: Journey map ready; next = build offer

mission:
  type: practice
  intent: Map real customer through Awareness, Consideration, Purchase, Retention, Advocacy; name weakest stage and why — honest map not full campaign
  rubricIntent:
    - dimension: realistic_journey
      weight: 60
      criteria: Five stages tied to learner business — not generic definitions
    - dimension: weakness_diagnosis
      weight: 40
      criteria: Specific weak stage with logical reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_journey_stages_for_learner

termsLocked: [Customer Journey, Weakest Stage, Awareness, Consideration, Purchase, Retention, Advocacy, AI]

links:
  nextLessonId: business-m2-l2-build-your-offer
  continuityNote: Build offer and retention paths on today's journey map

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

### Orientation — بداية الدرس

- **ماذا ستفهم؟** العميل **ليس صفقة واحدة** — هو **رحلة (Customer Journey)** من أول ما يسمع عنك حتى يرشّحك. **AI** يمكن أن يحسّن كل **محطة**.
- **لماذا الآن؟** بعد التفرقة بين العمل **Reactive (رد فعل)** و **Proactive (استباقي)**، ننتقل لأهم جزء في أي عمل: **رحلة العميل**.
- **ماذا بعد الدرس؟** سترسم **رحلة عميل** حقيقية — وتحدّد **أضعف محطة (Weakest Stage)**.

### Tension — موقف مألوف

- كثيرون يرون العميل = «اشترى وانتهى». يجلبون جددًا بالإعلانات — لكن **نسبة الرجوع** ضعيفة والتكلفة تزيد.
- المشكلة غالبًا ليست «نحتاج إعلانات أكثر» — المشكلة في **محطة ضعيفة** في الرحلة: **Awareness (وعي)**، **Consideration (تفكير)**، **Purchase (شراء)**، **Retention (احتفاظ)**، أو **Advocacy (ترشيح)**.
- **AI** يساعدك على رسم الرحلة وكتابة رسائل متابعة — لكن يجب أن تعرف **أين التسريب**.

### Core idea — ٥ محطات — وكل محطة فرصة

- **Awareness (وعي):** العميل عرف أنك موجود — إعلان، صديق، بحث.
- **Consideration (تفكير):** يقارن — السعر، الثقة، المراجعات.
- **Purchase (شراء):** أول صفقة — التجربة هنا تحدد هل يرجع.
- **Retention (احتفاظ):** يرجع ثانيًا — متابعة، قيمة متكررة.
- **Advocacy (ترشيح):** يقول لغيره — **أرخص** من إعلان جديد.
- **AI** يساعد في صياغة رسائل لكل محطة — لكن **التشخيص** يبدأ من رسم الرحلة الحقيقية.

### Glossary — مصطلحان للرحلة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Customer Journey (رحلة العميل)** | كل المحطات من أول سماع عنك حتى الترشيح | منشور → استفسار → طلب → متابعة → رجوع → ترشيح |
| **Weakest Stage (أضعف محطة)** | المحطة التي أكثر الناس يتوقفون عندها | ٦٠٪ يشتري مرة ولا يرجع — الضعف غالبًا في **Retention** لا **Awareness** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — ٥ محطات وكيف **AI** يساعد. **لا يُعاد توليده**.

### Comparison — إعلانات أكثر vs إصلاح محطة

| تركّز على جلب جدد فقط | تصلّح أضعف محطة |
|------------------------|-----------------|
| تزيد الإعلانات — الجدد يأتون — لكن نفس النسبة لا ترجع — التكلفة ترتفع | ترسم الرحلة — تكتشف أن **المتابعة بعد الشراء** ضعيفة — رسالة بسيطة + **AI** — نفس العملاء يرجعون أكثر |

### Diagram block (intent)

خريطة **٥ محطات** — قمع: كل محطة فيها من يكمل ومن يتوقف. الهدف معرفة **أين التسريب**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** عمل يجلب ١٠٠ عميل جديد شهريًا — ١٥ فقط يرجعون. ما أنسب تركيز أول؟

- **الإجابة الصحيحة:** تحسين محطة **Retention (احتفاظ)** — لماذا من اشترى لا يرجع؟
- **التفسير:** جلب عميل جديد غالبًا **أغلى** من إرجاع عميل موجود. إذا الضعف في الرجوع — ابدأ بالاحتفاظ قبل زيادة الإعلانات.

### Mission — ارسم رحلة عميل — وحدّد الضعف

**المقدمة:** تطبيق على عملك — ليس نظرية. ارسم رحلة عميل حقيقي عبر المحطات الخمس. ثم حدّد **أضعف محطة** ولماذا.

**التسليم:** Awareness · Consideration · Purchase · Retention · Advocacy · أضعف محطة + السبب

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| رحلة واقعية | 60% | المحطات الخمس مربوطة بعملك — لا تعريفات عامة |
| تشخيص الضعف | 40% | محطة ضعيفة محددة مع سبب منطقي |

### Confidence close

- **فهمت:** العميل **رحلة** — **AI** يساعد في كل محطة عندما تعرف **أين الضعف**.
- **تستطيع:** رسم رحلة حقيقية واختيار محطة واحدة للتحسين.
- **التالي:** بناء **Offer (عرض)** ومسارات احتفاظ — على أساس الرحلة التي رسمتها.

---

## 5. Future generation notes

Downstream locales from MSA only. Deferred: Bunny · Remotion · RAG · runtime · PATHS.

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
| Concept preservation | 5 | Five stages + journey terms only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Retention answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer sign-off (via review packet)

Recorded in [`HUMAN_REVIEW_PACKET_5_LESSONS.md`](HUMAN_REVIEW_PACKET_5_LESSONS.md) — per-dimension scores not recorded; decision **approve with notes**.

| Field | Value |
|-------|-------|
| **Reviewer** | Project Owner |
| **Date** | 2026-06-04 |
| **Decision** | approve with notes |
| **Next-batch authorization** | yes — **controlled canonical expansion only** |
| **Note** | Approved only for controlled canonical expansion — **not** production rollout or localization |

| Human reviewer average | **not scored — approve with notes via packet** |
| **Next controlled batch authorized?** | **yes — approved-for-next-batch** |
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
| 14 | Human reviewer sign-off recorded — next-batch gate met | ☑ pass (approve with notes · 2026-06-04) |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☑ **Project Owner · 2026-06-04 · approved-for-next-batch** |

---

*Artifact owner: Adaptive Lesson Engine · 5-lesson MSA canonical pilot · Draft only.*
