# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m4-l2-webhooks-api` |
| **pathId** | `automator` |
| **moduleId** | `automator-m4` |
| **productionTitle (ar-EG)** | Webhooks & APIs |
| **productionRoute** | `/learn/automator/automator-m4-l2-webhooks-api` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m4-l2-webhooks-api.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | API = you ask; Webhook = they notify you — instant events need webhooks |
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
| `automator-m4-l2-webhooks-api.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Distinguish API from Webhook; describe one use case with payload |
| **Mission rubric** | 50% حدث واتجاه · 50% Payload |
| **Quiz intent** | Instant payment welcome = webhook from gateway |
| **Concepts locked** | Webhook, Payload, API, workflow |
| **Prerequisites** | `automator-m4-l1-connect-database` |
| **Next lesson** | `automator-m4-l3-error-handling` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m4-l2-webhooks-api
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m4-l2-webhooks-api.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Webhooks & APIs
  oneAha: "API = you ask; Webhook = they notify you — instant events need webhooks"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m4-l1-connect-database]

objectives:
  - id: obj-1
    statement: Distinguish API from Webhook; describe one use case with payload
    measurable: true

concepts:
  - id: concept-1
    term: Webhook
    termEn: Webhook
    definition: Instant notification when an event happens.
    mustPreserve: true
  - id: concept-2
    term: Payload
    termEn: Payload
    definition: Data inside the message the automation uses.
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
    intent: Instant payment welcome = webhook from gateway
  - role: mission
    intent: Distinguish API from Webhook; describe one use case with payload
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Distinguish API from Webhook; describe one use case with payload
  rubricIntent:
    - dimension: event_direction
      weight: 50
      criteria: Specific event; clear sender and receiver
    - dimension: payload
      weight: 50
      criteria: 3+ fields with examples; reason vs polling
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Webhook, Payload, API, workflow, Endpoint]

links:
  nextLessonId: automator-m4-l3-error-handling
  continuityNote: Error Handling — alert before customer hurt

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

- **ماذا ستفهم؟** **Webhook (إشعار فوري)** = تطبيق يقول لتطبيق آخر «حدث شيء» — من دون أن تسأل كل فترة.
- **لماذا الآن؟** بعد أن عرفت أين تُخزَّن البيانات، تحتاج أن تفهم كيف تتواصل التطبيقات.
- **ماذا بعد الدرس؟** ستشرح حالة استخدام واحدة لـ **Webhook** + ما البيانات (**Payload**) التي تُرسل.

### Tension — موقف مألوف

- «**مسار العمل (workflow)** يسأل كل دقيقة: هل هناك جديد؟»
- **مسار العمل (workflow)** يسأل الموقع ١٤٤٠ مرة في اليوم — معظم الردود «لا». يستهلك وقتًا بلا فائدة.
- العميل دفع — لكن الأتمتة عرفت بعد ٦٠ ثانية. رسالة الترحيب تأخرت.
- العامل الافتراضي يحتاج: متى ينتظر الإبلاغ؟ (**Webhook**) — ومتى يذهب ليسأل بنفسه؟ (**API**).

### Core idea — API = أنت تسأل. Webhook = هم يُبلّغونك

- **API:** أنت ترسل طلبًا — «أعطني طلبات اليوم». أنت من بدأ.
- **Webhook (إشعار فوري):** التطبيق الآخر يرسل — «طلب جديد الآن!» — فور حدوث الحدث.
- **Payload (حمولة البيانات)** = البيانات داخل الرسالة: اسم، مبلغ، تاريخ.
- في Make و n8n توجد **عُقد (nodes)** جاهزة — لا يلزم كتابة كود.

### Comparison — تسأل كل دقيقة vs يُبلّغك فورًا

| Polling — تسأل كل دقيقة | Webhook — يُبلّغك |
|-------------------------|-------------------|
| الأتمتة تسأل «هل هناك طلب؟» آلاف المرات. بطيء، مكلف، متأخر. | الموقع يرسل فور الدفع: اسم + مبلغ + بريد. **مسار العمل (workflow)** يعمل في نفس الثانية. |

### Glossary — مصطلحان للتواصل

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Webhook (إشعار فوري)** | إشعار فوري عند حدوث حدث | عميل دفع → الموقع يرسل webhook للأتمتة |
| **Payload (حمولة البيانات)** | البيانات داخل الرسالة | `{ name, amount, email }` |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — **Webhook vs API**. **لا يُعاد توليده**.

### Screenshot block (intent)

**Endpoint (نقطة استقبال)** — التطبيقات تتكلم عبر نقاط استقبال: **Webhook** يستقبل، **API** يرسل. البيانات = **Payload**.

### Quiz — تأكيد سريع

**السؤال:** تريد رسالة ترحيب فورًا عند دفع العميل. ما الأنسب؟

- **الإجابة الصحيحة (correctIndex: 0):** **Webhook (إشعار فوري)** من بوابة الدفع — يُبلّغك لحظة الدفع
- **التفسير:** حدث لحظي يحتاج webhook. Polling بطيء ومكلف.

### Mission — اشرح حالة webhook واحدة

**المقدمة:** شرح — وليس بناء. الذكاء الاصطناعي قد يقترح صياغة — أنت تختار النهائي.

**التسليم:** الحدث · من يرسل · من يستقبل · **Payload** (٣ حقول) · لماذا webhook أفضل من polling

| البعد | الوزن | المعيار |
|-------|-------|---------|
| حدث واتجاه | 50% | حدث محدّد؛ واضح من يرسل ومن يستقبل |
| Payload | 50% | ٣ حقول بأمثلة؛ سبب webhook واضح |

### Confidence close

- **فهمت:** **Webhook** + **Payload** — تطبيق يُبلّغ تطبيقًا عند حدوث حدث.
- **تستطيع:** لديك use case واحد جاهز.
- **التالي:** **Error Handling** — تنبيه قبل أن يتأذى العميل.

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
