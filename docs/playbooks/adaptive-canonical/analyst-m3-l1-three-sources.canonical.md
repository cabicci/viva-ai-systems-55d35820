# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `analyst-m3-l1-three-sources` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m3` |
| **productionTitle (ar-EG)** | المصادر الثلاثة |
| **productionRoute** | `/learn/analyst/analyst-m3-l1-three-sources` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m3-l1-three-sources.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Good decisions need three sources — behavior, results, and words |
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
| `analyst-m3-l1-three-sources.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Strong decisions combine three sources — what people do, what happened, and what people say |
| **Mission rubric** | 60% 3 distinct sources · 40% linked to decision |
| **Quiz intent** | Scattered data across WhatsApp, invoices, notes — first step: gather in one place (correctIndex 0) |
| **Concepts locked** | Source, SSOT |
| **Prerequisite** | `analyst-m2-l2-right-question-rule` |
| **Next lesson** | `analyst-m3-l2-ai-summarization` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m3-l1-three-sources
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m3-l1-three-sources.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Three Sources
  oneAha: "A strong decision needs behavior + results + words — one source shows only part of the picture"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [analyst-m2-l2-right-question-rule]

objectives:
  - id: obj-1
    statement: Learner names the three source types — behavior, results, words — and why one source alone can mislead.
    measurable: true
  - id: obj-2
    statement: Learner maps one real decision to three distinct sources and identifies what a missing source could hide.
    measurable: true

concepts:
  - id: concept-source
    term: Source
    termEn: Source
    definition: Where you get your data — WhatsApp, invoices, sheet, CRM.
    mustPreserve: true
  - id: concept-ssot
    term: SSOT
    termEn: Single Source of Truth
    definition: One place that gathers sources so you do not get lost — does not have to be complex.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Three sources for good decisions; after lesson link one decision to three sources
  - role: tension
    intent: Five apps for one question — decide from invoices only, miss WhatsApp context
  - role: core
    intent: Behavior, Results, Words — one source = partial picture; three together = stronger decision
  - role: comparison
    intent: One source (invoices only) vs three sources (invoices + WhatsApp + team notes)
  - role: glossary
    intent: Source, SSOT
  - role: video
    intent: Watch — three sources — production Bunny unchanged
  - role: diagram
    intent: Behavior + results + words → one decision (three-sources-merge)
  - role: quiz
    intent: Scattered data — first step gather in one place (correctIndex 0)
  - role: mission
    intent: One decision mapped to behavior + results + words sources; note what missing source hides
  - role: confidence_close
    intent: Three-source map ready; next = AI summarization

mission:
  type: practice
  intent: Practical map — one decision, three distinct sources (behavior, results, words); no automation required — clarity only
  rubricIntent:
    - dimension: three_distinct_sources
      weight: 60
      criteria: Behavior + results + words — not the same tool three times
    - dimension: linked_to_decision
      weight: 40
      criteria: Each source linked to the decision — clear what you will find
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_decision_or_sources_for_learner

termsLocked: [Source, SSOT]

links:
  nextLessonId: analyst-m3-l2-ai-summarization
  continuityNote: AI summarization — use AI with these sources without losing context

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

- **ماذا ستفهم؟** القرار الجيد غالبًا يحتاج **٣ مصادر**: **ما يفعله الناس**، **ما حدث فعلًا**، و**ما يقوله الناس**.
- **لماذا الآن؟** بعد أن تعلّمت **طرح السؤال الصحيح** — يجب أن تعرف **من أين** تأتي الإجابة. **مصدر واحد** قد **يُخفِي** جزءًا من الصورة.
- **ماذا بعد الدرس؟** ستربط **قرارًا واحدًا** بـ **٣ مصادر مختلفة**.

### Tension — تفتح ٥ تطبيقات لتجيب سؤالًا واحدًا

- **واتساب** في مكان، **الفواتير** في مكان، **ملاحظاتك** في دفتر — كل مصدر **لوحده**. تنسى **نصف Context (السياق)**.
- تقرّر من **فاتورة فقط** — ولا تسمع أن العملاء يتحدّثون عن **شيء آخر** على الواتساب.
- **الذكاء الاصطناعي** يساعدك على **التلخيص** من مصادر مختلفة — **أنت** تحدّد **المصدر الناقص** قبل أن **تقرّر**.

### Core idea — ٣ مصادر تكمّل بعضها

1. **سلوك (Behavior)** — **ما يفعله الناس**: زيارات، clicks، طلبات، رسائل واتساب.
2. **نتائج (Results)** — **ما حدث فعلًا**: مبيعات، فواتير، إيرادات، conversions.
3. **كلام (Words)** — **ما يقوله الناس**: شكاوى، استفسارات، ملاحظاتك، آراء العملاء.
4. **مصدر واحد** يعطيك **جزءًا** من الصورة — **الثلاثة معًا** يعطونك **قرارًا أقوى**.
5. إذا كان **Automator (مسار الأتمتة)** يعمل، قد تُجمَّع المصادر الثلاثة في **Sheet** أو **CRM** واحد — **الفكرة نفسها**.

### Comparison — مصدر واحد مقابل ثلاث مصادر

| مصدر واحد | ثلاث مصادر |
|-----------|------------|
| تقرّر من **فواتير المبيعات** فقط — المبيعات **نزلت**، فتقلّل الإعلان. لكن العملاء على الواتساب يسألون عن **منتج آخر** | **فواتير + واتساب + ملاحظات الفريق** — تكتشف أن المشكلة في **منتج واحد** وليس في الإعلان. **القرار يتغيّر** |

### Glossary — مصطلحان للمصادر

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Source (مصدر)** | **المكان** الذي تجلب منه **بياناتك** — واتساب، فواتير، شيت، CRM | رسائل العملاء على واتساب = **مصدر كلام** |
| **SSOT (مكان واحد للحقيقة)** | **مكان واحد** يجمع المصادر حتى **لا تتوه** — **ليس** بالضرورة معقّدًا | Sheet واحد فيه ملخص أسبوعي من الواتساب + المبيعات + الملاحظات |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «المصادر الثلاثة». **لا يُعاد توليده.**

### Diagram block (intent)

**٣ مصادر → قرار واحد** (معرّف: `three-sources-merge`): **سلوك + نتائج + كلام** في مكان واحد — **سؤال واحد = إجابة أقوى**. استخدمه في المهمة.

### Quiz — تأكيد سريع

**السؤال:** بيانات العملاء **موزّعة** بين واتساب وفواتير وملاحظات في دفتر. ما **أول خطوة** لرؤية صورة كاملة؟

- **الإجابة الصحيحة (خيار ١):** **تجمع البيانات** في **مكان واحد** مثل Google Sheet أو Notion.
- خيار ٢: تتجاهل الواتساب والملاحظات وتركّز **فقط** على الفواتير.
- خيار ٣: تبدأ CRM جديدًا **من دون** نقل البيانات القديمة.

**التفسير:** **تشتت البيانات** يجعلك **لا ترى** الصورة. **تجميعها** في مكان واحد هو **الأساس** — قبل أي تحليل.

### Mission — اربط قرارًا واحدًا بـ ٣ مصادر

**المقدمة:** مهمة **خريطة عملية** — **ليس** بناء نظام معقّد. اختر **قرارًا واحدًا** تريد اتخاذه (أو قرارًا قريبًا). حدّد **٣ مصادر مختلفة**: ما يفعله الناس، ما حدث، وما يقوله الناس. **لا أتمتة مطلوبة** — **وضوح المصادر** مطلوب.

**التسليم:**

1. القرار (جملة واحدة)
2. **مصدر السلوك** — ما يفعله الناس؟ (مصدر + ما ستجد)
3. **مصدر النتائج** — ما حدث فعلًا؟ (مصدر + ما ستجد)
4. **مصدر الكلام** — ما يقوله الناس؟ (مصدر + ما ستجد)
5. إذا **مصدر واحد ناقص** — ما الذي قد **يُخفِيه** عنك؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ مصادر مختلفة | 60% | **سلوك + نتائج + كلام** — **ليس** نفس الأداة ٣ مرات |
| ربط بالقرار | 40% | كل مصدر **مربوط بالقرار** — واضح **ما ستجد** |

### Confidence close

- **فهمت:** القرار الجيد يحتاج **سلوك + نتائج + كلام** — **مصدر واحد** يعطيك **جزءًا فقط**.
- **تستطيع:** لديك **خريطة ٣ مصادر** لقرار واحد — تعرف **ما الناقص** قبل أن تقرّر.
- **التالي:** **AI والتلخيص** — كيف تستخدمه مع هذه المصادر **من دون** أن تفقد السياق.

---

## 5. Future generation notes

Downstream locales from MSA only. **Source**, **SSOT** preserved. Diagram `three-sources-merge` = production reference. Deferred: Bunny · Remotion · RAG · runtime. Mission stays source-mapping practice — not system build.

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
| Concept preservation | 5 | Source, SSOT only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — gather in one place |
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

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
