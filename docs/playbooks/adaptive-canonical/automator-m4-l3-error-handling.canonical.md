# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m4-l3-error-handling` |
| **pathId** | `automator` |
| **moduleId** | `automator-m4` |
| **productionTitle (ar-EG)** | Error Handling |
| **productionRoute** | `/learn/automator/automator-m4-l3-error-handling` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m4-l3-error-handling.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Automation fails — alert before the customer is hurt |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending** — not approved for production rollout, localization, or controlled batch scale until a named reviewer records scores and checklist sign-off. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `automator-m4-l3-error-handling.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Write one alert rule: if step fails → who gets notified how |
| **Mission rubric** | 40% خطوة وسبب · 60% قاعدة تنبيه |
| **Quiz intent** | Temporary API 500 = retry then alert + log |
| **Concepts locked** | Retry, Alert, workflow, API |
| **Prerequisites** | `automator-m4-l2-webhooks-api` |
| **Next lesson** | `automator-m3-testing-automation` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m4-l3-error-handling
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m4-l3-error-handling.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Error Handling
  oneAha: "Automation fails — alert before the customer is hurt"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m4-l2-webhooks-api]

objectives:
  - id: obj-1
    statement: Write one alert rule: if step fails → who gets notified how
    measurable: true

concepts:
  - id: concept-1
    term: Retry
    termEn: Retry
    definition: Automation tries again when a step fails.
    mustPreserve: true
  - id: concept-2
    term: Alert
    termEn: Alert
    definition: Notify someone who can act after retries exhaust.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you learn, why now, what after lesson
  - role: tension
    intent: Familiar problem from production Egyptian copy
  - role: core
    intent: One Aha and worked logic from production
  - role: comparison
    intent: Same contrast structure as production
  - role: glossary
    intent: termsLocked with first-use English gloss
  - role: video
    intent: Production Bunny reference only — no regen
  - role: screenshot
    intent: Visual intent from production block
  - role: quiz
    intent: Temporary API 500 = retry then alert + log
  - role: mission
    intent: Write one alert rule: if step fails → who gets notified how
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Write one alert rule: if step fails → who gets notified how
  rubricIntent:
    - dimension: step_cause
      weight: 40
      criteria: Specific failure step; realistic cause
    - dimension: alert_rule
      weight: 60
      criteria: Who + how + log; clear retry count
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Retry, Alert, workflow, API]

links:
  nextLessonId: automator-m3-testing-automation
  continuityNote: Testing Automation — test before going live

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

- **ماذا ستفهم؟** الأتمتة تفشل — السؤال «كيف ستعرف قبل أن يتأذى العميل؟»
- **لماذا الآن؟** بعد **Webhooks** وقاعدة البيانات، **مسار العمل (workflow)** يعمل ٢٤/٧ — من دون تنبيه، الفشل صامت.
- **ماذا بعد الدرس؟** ستكتب قاعدة تنبيه: لو [فشل] → [مين يُبلَّغ + كيف].

### Tension — موقف مألوف

- «٢٠٠ عميل لم يجدوا ردًا» — ولم يعرف أحد.
- **API** الرسائل فشل أسبوعًا — لا بريد، لا واتساب، لا تنبيه.
- العملاء ظنوا أنكم تجاهلتموهم. اكتُشف الأمر عندما اتصل عميل كبير.
- القاعدة: لو فشلت الخطوة → يُبلَّغ شخص فورًا — قبل أن يشعر العميل.

### Core idea — فشل متوقّع + تنبيه قبل الألم

- **Retry (إعادة محاولة):** جرّب ٢–٣ مرات — كثير من الأخطاء مؤقتة (شبكة، timeout).
- لو فشل بعد **Retry:** سجّل الخطأ + بلّغ شخصًا — لا تصمت.
- قاعدة واحدة: لو [الخطوة X فشلت] → [واتساب/بريد لـ Y].
- الهدف: تعرف في دقائق — لا بعد أسبوع.

### Comparison — فشل صامت vs إشارة فورية

| فشل صامت | تنبيه فوري |
|----------|------------|
| **API** توقف — **workflow** سكت. ٢٠٠ عميل بلا رد. | **Retry** ٣ مرات → فشل → واتساب + سجل في جدول failed. تعرف في ٥ دقائق. |

### Glossary — مصطلحان للفشل

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Retry (إعادة محاولة)** | الأتمتة تحاول تلقائيًا عند فشل خطوة | إرسال بريد فشل → ٣ محاولات |
| **Alert (تنبيه)** | إشعار لمن يستطيع التصرف بعد انتهاء **Retry** | «فشل إرسال ١٥ رسالة — راجع failed» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — **Retry، تسجيل، تنبيه**. **لا يُعاد توليده**.

### Screenshot block (intent)

كل طبقة في **مسار العمل (workflow)** تحتاج خطة بديلة: لو فشلت → ما البديل؟

### Quiz — تأكيد سريع

**السؤال:** **API** الرسائل يعيد خطأ ٥٠٠ لثوانٍ — ثم يعمل. ما أفضل تعامل؟

- **الإجابة الصحيحة (correctIndex: 0):** **Retry** ٣ مرات — ولو فشل، تنبيه + تسجيل في جدول failed
- **التفسير:** أخطاء مؤقتة = **Retry**. بعد الفشل = **Alert** قبل أن يتأذى العميل.

### Mission — اكتب قاعدة تنبيه واحدة

**المقدمة:** تصميم — وليس بناء إلزامي. الذكاء الاصطناعي قد يقترح — أنت تختار.

| البعد | الوزن | المعيار |
|-------|-------|---------|
| خطوة وسبب | 40% | خطوة فشل محدّدة؛ سبب واقعي |
| قاعدة تنبيه | 60% | مين + كيف + ماذا يُسجَّل؛ **Retry** واضح |

### Confidence close

- **فهمت:** الأتمتة تفشل — النظام الجيد يُبلّغك قبل العميل.
- **تستطيع:** قاعدة تنبيه جاهزة لـ **workflow**.
- **التالي:** **اختبار الأتمتة** — قبل live.

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — not from Egyptian directly. Mission rubric weights and quiz logic preserved. Deferred: Bunny · Remotion · RAG seed · runtime wiring.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Production concepts locked |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 0 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | — | **pending** |
| Concept preservation | — | **pending** |
| Beginner clarity | — | **pending** |
| MSA simplicity | — | **pending** |
| Mission consistency | — | **pending** |
| Quiz integrity | — | **pending** |
| Assistant boundaries | — | **pending** |
| Localization readiness | — | **pending** |

| Human reviewer average | **pending — not yet scored** |
| **Production-ready?** | **no** |

### Human reviewer sign-off

| Field | Value |
|-------|-------|
| **Reviewer** | **pending** |
| **Date** | **pending** |
| **Decision** | **pending** |
| **Controlled batch authorization** | **pending** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny / video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer score — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready stated | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
