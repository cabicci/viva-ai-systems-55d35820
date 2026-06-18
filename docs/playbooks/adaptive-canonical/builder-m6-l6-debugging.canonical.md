# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m6-l6-debugging` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | لو الدنيا بازت — Debugging |
| **productionRoute** | `/learn/builder/builder-m6-l6-debugging` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l6-debugging.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | When app fails: Symptom → isolate last change → request fix |
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
| `builder-m6-l6-debugging.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Debugging playbook: Symptom, Expected vs Actual, last change — no coding required |
| **Mission rubric** | 70% complete bug report · 30% simple language |
| **Quiz intent** | Describe scenario precisely first (correctIndex 0) |
| **Concepts locked** | Symptom, Expected vs Actual |
| **Prerequisite** | `builder-m6-l5-iteration` |
| **Next lesson** | `builder-m7-l1-tables-columns` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l6-debugging
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l6-debugging.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Debugging — When Things Break
  oneAha: "When app fails: Symptom → isolate last change → request fix"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m6-l5-iteration]

objectives:
  - id: obj-1
    statement: Learner applies 3-step debugging playbook without technical jargon.
    measurable: true
  - id: obj-2
    statement: Learner writes bug report with page, expected, actual, last change.
    measurable: true

concepts:
  - id: concept-symptom
    term: Symptom
    termEn: Symptom
    definition: Exactly what happens — specific scenario not «broken».
    mustPreserve: true
  - id: concept-expected-actual
    term: Expected vs Actual
    termEn: Expected vs Actual
    definition: What should happen vs what did happen.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Symptom → isolate → fix; bug report after lesson
  - role: tension
    intent: «App broken» — no starting point
  - role: core
    intent: 3 steps; 90% last change; send 3 facts to Lovable
  - role: comparison
    intent: Vague vs 3 precise facts
  - role: glossary
    intent: Symptom, Expected vs Actual
  - role: video
    intent: Simple debugging playbook — production Bunny unchanged
  - role: screenshot
    intent: 3-step debugging diagram
  - role: quiz
    intent: Describe Symptom first (correctIndex 0)
  - role: mission
    intent: Write bug report for imagined break
  - role: confidence_close
    intent: Next = Tables & Columns

mission:
  type: practice
  intent: Bug report — page, expected, actual, last change — ~10 min
  rubricIntent:
    - dimension: complete_bug_report
      weight: 70
      criteria: Page + expected + actual + last change; actual is specific scenario
    - dimension: simple_language
      weight: 30
      criteria: Each line simple words — no heavy technical jargon
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_bug_report_for_learner

termsLocked: [Symptom, Expected, Actual, Debugging, Lovable, Route]

links:
  nextLessonId: builder-m7-l1-tables-columns
  continuityNote: Tables & Columns — organize app data

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

- **ماذا ستفهم؟** **عندما يخطئ التطبيق**: **صفّي العرض (Symptom) → اعزل السبب (آخر تعديل) → بعدها اطلب الإصلاح**.
- **لماذا الآن؟** **أي تطبيق يخطئ — هذا طبيعي**. **الفرق أن لديك playbook (دليل) بسيطًا بلا برمجة**.
- **ماذا بعد الدرس؟** **ستكتب تقرير bug**: **الصفحة، المتوقع، الفعلي، آخر تعديل**.

### Tension — «التطبيق معطّل» — ولا تعرف من أين تبدأ

- **تضغط Send والشاشة تدور بلا رد**. **أول رد: «التطبيق معطّل»** — **لكن هذا لا يساعد أحدًا على الإصلاح**.
- **أكبر الشركات تطبيقاتها تخطئ كل يوم**. **الفرق: لديهم طريقة واضحة**.
- **لا يُطلب منك stack trace** — **يُطلب وصف ما يحدث في جملة واحدة واضحة**.

### Core idea — اعرض العرض → اعزل السبب → اطلب الإصلاح

- **الخطوة ١ — Symptom (العرض)**: «**عندما العميل ينقر Send في صفحة الشات، الشاشة تدور بلا رد.**»
- **الخطوة ٢ — Isolate (عزل)**: «**ما آخر شيء غيّرته قبل أن تفسد الأمور؟**» **في ٩٠٪ الغلطة من آخر تعديل**.
- **الخطوة ٣ — Fix (إصلاح)**: **أرسل ٣ معلومات لمساعد Lovable** — **ما يحدث، ما المفروض، آخر تعديل**.

### Comparison — وصف عام vs وصف يصلّح في ثوانٍ

| خطأ — «التطبيق معطّل» | صح — ٣ معلومات بالضبط |
|----------------------|------------------------|
| **يرد بـ ١٠ اقتراحات عامة وتدور في حلقة** | «**عند Send الشاشة تدور (فعلي). المفروض AI يرد (متوقع). آخر تعديل: أضفت زرًا جديدًا (سبب محتمل).**» **في ثوانٍ يعرف أين المشكلة** |

### Glossary — مصطلحان للتشخيص

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Symptom (العرض)** | **ما يحدث بالضبط** — **ليس «معطّل»، بل سيناريو محدد** | «**عندما أنقر Send، الشاشة تدور بلا رد.**» |
| **Expected vs Actual (متوقع vs فعلي)** | **ما كان المفروض أن يحدث — وما حدث فعلًا** | **متوقع: AI يرد. فعلي: الشاشة تدور.** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Playbook عندما تفسد الأمور — Debugging». **لا يُعاد توليده.**

### Screenshot block (intent)

**٣ خطوات**: **صفّي العرض → ارجع لآخر تعديل → أرسل ٣ معلومات**. **لا تحتاج فهم كود — تحتاج وصفًا**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **العميل ينقر Send والشاشة تدور. ما أول خطوة قبل أن تطلب من Lovable الإصلاح؟**

- **الإجابة الصحيحة (خيار ١):** **اوصف السيناريو بالضبط: «عندما ينقر Send في صفحة الشات، الشاشة تدور بلا رد.»**
- خيار ٢: **أعمل refresh للصفحة مرات**.
- خيار ٣: **أقول «التطبيق معطّل، صلّحه بمعرفتك.»**

**التفسير:** **Symptom أولًا** — **عندما تصف السيناريو بالضبط، تستطيع البحث عن السبب والسؤال بوضوح**.

### Mission — اكتب تقرير bug لتطبيقك

**المقدمة:** **تخيّل أن تطبيقك تعطّل**. **١٠ دقائق**.

**التسليم:**

1. **الصفحة (Route)**: أي صفحة فيها المشكلة؟
2. **المتوقع (Expected)**: ماذا كان المفروض أن يحدث؟
3. **الفعلي (Actual)**: ماذا يحدث فعلًا؟ (سيناريو محدد)
4. **آخر تعديل (Last change)**: ما آخر شيء غيّرته؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تقرير bug كامل | 70% | **صفحة + متوقع + فعلي + آخر تعديل**. **الوصف الفعلي سيناريو محدد — ليس «معطّل»** |
| بساطة اللغة | 30% | **كل سطر بكلمات بسيطة — بلا مصطلحات تقنية معقّدة** |

### Confidence close

- **فهمت:** **أي تطبيق يخطئ** — **الحل يبدأ بعرض واضح وعزل السبب، لا بالذعر**.
- **تستطيع:** **تقرير bug جاهز — ٣ معلومات تجعل أي مساعد يفهمك في ثوانٍ**.
- **التالي:** **Tables & Columns** — **كيف تنظّم بيانات التطبيق في جداول وأعمدة**.

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
| Concept preservation | 5 | Symptom, Expected vs Actual only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 70/30 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Symptom first |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
