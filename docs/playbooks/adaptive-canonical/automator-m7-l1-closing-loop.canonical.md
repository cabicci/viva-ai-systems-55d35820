# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m7-l1-closing-loop` |
| **pathId** | `automator` |
| **moduleId** | `automator-m7` |
| **productionTitle (ar-EG)** | بياناتك جاهزة — اللي جاي |
| **productionRoute** | `/learn/automator/automator-m7-l1-closing-loop` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m7-l1-closing-loop.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Separate automations become a system when linked into one customer journey with data for Analyst |
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
| `automator-m7-l1-closing-loop.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Link lead capture → reply → follow-up into one end-to-end journey; one Analyst decision question |
| **Mission rubric** | 60% connected journey · 40% Analyst bridge |
| **Quiz intent** | Three channels + follow-up running — best question = which channel brought buyers (not count or staff replies) |
| **Concepts locked** | Customer Journey, Feedback Loop |
| **Prerequisites** | `automator-m6-l3-follow-up` |
| **Next lesson** | End of Automator path — bridge to Analyst path (`pending-path-validation`) |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m7-l1-closing-loop
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m7-l1-closing-loop.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Closing the Loop
  oneAha: "Linked automations = one customer journey + data that feeds Analyst decisions"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m6-l3-follow-up]

objectives:
  - id: obj-1
    statement: Learner maps lead → reply → follow-up as one connected journey with logged data at each step.
    measurable: true
  - id: obj-2
    statement: Learner writes one Analyst decision question based on journey data and names what was missing before linking.
    measurable: true

concepts:
  - id: concept-customer-journey
    term: Customer Journey
    termEn: Customer Journey
    definition: Full path from first interest to follow-up or purchase — not one step alone.
    mustPreserve: true
  - id: concept-feedback-loop
    term: Feedback Loop
    termEn: Feedback Loop
    definition: Data automation logs feeds back to show what to improve.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Separate automations become system when linked; draw end-to-end journey after lesson
  - role: tension
    intent: Form, WhatsApp, follow-up all work — but no full picture; can't answer what worked
  - role: core
    intent: Lead capture → reply → follow-up; each step logs source/time/channel/response/conversion
  - role: comparison
    intent: Separate carrots vs one connected customer journey
  - role: glossary
    intent: Customer Journey (رحلة العميل); Feedback Loop (حلقة تحسين)
  - role: video
    intent: Optional Automator to Analyst summary — production Bunny unchanged
  - role: screenshot
    intent: Journey from lead to follow-up
  - role: quiz
    intent: Three channels — which brought buyers with highest conversion (Analyst question)
  - role: mission
    intent: Map 5–6 stage journey lead→follow-up + one Analyst question + what was missing
  - role: confidence_close
    intent: Automator path complete; bridge to Analyst path

mission:
  type: practice
  intent: Map customer journey — reception, reply, follow-up, close — 5–6 stages + one Analyst decision question + one sentence on what was missing before linking; no real numbers required — 10–15 min
  rubricIntent:
    - dimension: connected_journey
      weight: 60
      criteria: 5 linked stages not separate automations
    - dimension: analyst_bridge
      weight: 40
      criteria: One decision question based on journey data
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_journey_or_analyst_question_for_learner

termsLocked: [Customer Journey, Feedback Loop, Lead, Analyst]

links:
  nextLessonId: pending-path-validation
  continuityNote: End of Automator path — learner selects Analyst path from map; first Analyst lesson is analyst-m1-l1-from-automation-to-insight

slugValidation:
  validatedAt: 2026-06-04
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pending-path-validation
  missionRubric: pass
  quizAnswer: pass
```

> **Slug note:** `automator-m7-l1-closing-loop` is the final lesson in Automator PATHS. No sequential `nextLessonId` within path. Continuity bridges to Analyst path per production confidence close.

---

## 4. Arabic MSA canonical lesson text

### Orientation — بداية الدرس

- **ماذا ستفهم؟** أتمتات منفصلة قوية — لكن عندما تتربط في **رحلة عميل (Customer Journey)** واحدة تصبح نظامًا.
- **لماذا الآن؟** بعد جمع leads وواتساب ومتابعة، تحتاج الصورة الكاملة وليس كل جزء وحده.
- **ماذا بعد الدرس؟** سترسم رحلة من البداية للنهاية من lead حتى follow-up.

### Tension — موقف مألوف

- كل شيء يعمل — لكن لا صورة كاملة.
- لديك نموذج يستقبل leads. واتساب يرد. متابعة ترسل رسائل. كل واحد يعمل.
- لكنك لا تعرف: أي قناة تجلب leads أفضل؟ أي رسالة متابعة تفتح ردودًا؟ أين يتعطل العميل؟
- أتمتات منفصلة بلا ربط = شغل كثير بلا تعلّم. الربط يولّد بيانات — والبيانات تدخلك مسار **Analyst**.

### Core idea — رحلة واحدة = Lead → رد → متابعة → بيانات

- **Lead capture:** يمسك الاهتمام ويسجّله.
- **WhatsApp / رد فوري:** يخدم العميل بثقة.
- **Follow-up:** يكمل المحادثة إذا سكت.
- كل خطوة تسجّل: مصدر، وقت، قناة، رد، تحويل. هذا ما يقرأه **Analyst**.

### Comparison — جزر منفصلة vs رحلة متصلة

| أتمتات منفصلة | رحلة عميل واحدة |
|---------------|-----------------|
| نموذج يعمل، واتساب يعمل، متابعة تعمل — لكن لا خريطة. «ما الذي نفع؟» — لا إجابة. | Lead من إعلان → تسجيل → رد واتساب → متابعة يوم ٢ و٥ → تحويل أو إغلاق. كل خطوة مسجّلة — تستطيع السؤال والتحسين. |

### Glossary — مصطلحان للربط

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Customer Journey (رحلة العميل)** | المسار الكامل من أول اهتمام حتى متابعة أو شراء — وليس خطوة واحدة | إعلان → نموذج → ترحيب → متابعة → مكالمة مبيعات |
| **Feedback Loop (حلقة تحسين)** | البيانات التي تسجّلها الأتمتة تعود لتخبرك بما يُحسَّن | «متابعة يوم ٢ على واتساب فتحت ٤٠٪ رد — يوم ٥ بريد فتح ١٠٪» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — ملخّص رحلة Automator وكيف البيانات تجهّزك لمسار Analyst. **لا يُعاد توليده**.

### Screenshot block (intent)

كل مرحلة تغذّي التي بعدها وتسجّل بيانات. **الرحلة المتصلة** = أسئلة **Analyst** سيجيب عليها.

### Quiz — تأكيد سريع

**السؤال:** عندك leads من ٣ قنوات ومتابعة تعمل — لكنك لا تعرف أي قناة تجلب عملاء يشترون. أفضل سؤال تسأله للبيانات؟

- **الإجابة الصحيحة (correctIndex: 1):** **أي قناة جلبت leads اشتروا بأعلى نسبة؟**
- **التفسير:** **الرحلة المتصلة** تتيح لك أسئلة قرار — وليس عدًّا فقط. القناة + التحويل = **Analyst**.

### Mission — ارسم رحلة lead → follow-up

**المقدمة:** المهمة خريطة رحلة — وليس تدقيقًا تقنيًا. اربط ما تعلّمته: استقبال، رد، متابعة — في مسار عميل واحد. لا يلزم أرقام حقيقية — يلزم ٥–٦ مراحل + سؤال **Analyst** واحد.

**التسليم:** مصدر lead · مراحل ١–٤ (استقبال، رد، متابعة، نهاية) · سؤال **Analyst** واحد · جملة: ما الذي كان ناقصًا قبل الربط؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| رحلة متصلة | 60% | ٥ مراحل مربوطة — وليس أتمتات منفصلة |
| جسر Analyst | 40% | سؤال قرار واحد مبني على بيانات الرحلة |

### Confidence close

- **فهمت:** أتمتات مربوطة = **رحلة عميل (Customer Journey)** + بيانات للتحسين.
- **تستطيع:** لديك خريطة من البداية للنهاية من lead حتى follow-up.
- **التالي:** مسار **Analyst** — تقرأ البيانات التي يولّدها نظامك وتتخذ قرارات أفضل. (نهاية مسار Automator — ارجع للخريطة واختر **Analyst**.)

---

## 5. Future generation notes

Downstream locales from MSA only. Customer Journey and Analyst bridge preserved. Deferred: Bunny · Remotion · RAG · runtime. Path-completion UX unchanged — learner picks next path from map.

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
| Concept preservation | 5 | Customer Journey, Feedback Loop locked |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — channel conversion question unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present; path-end bridge documented |

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
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 1) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation — path end documented | ☑ pending-path-validation |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
