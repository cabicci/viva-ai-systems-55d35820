# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m2-l2-build-your-offer` |
| **pathId** | `business` |
| **moduleId** | `business-m2` |
| **productionTitle (ar-EG)** | ابني عرضك — التحويل مش المنتج |
| **productionRoute** | `/learn/business/business-m2-l2-build-your-offer` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m2-l2-build-your-offer.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Customer buys transformation they understand — clear Offer beats vague price |
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
| `business-m2-l2-build-your-offer.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Customer buys understood transformation; write one clear Offer sentence using who/result/time/method/objection/risk reducer |
| **Mission rubric** | 60% offer clarity · 40% trust/risk |
| **Quiz intent** | "Too expensive" without asking about outcome → reframe Offer with AI focusing on result and risk reducer |
| **Concepts locked** | Offer, Risk Reducer |
| **Prerequisites** | `business-m2-l1-customer-lifecycle` |
| **Next lesson** | `business-m2-l2-retention-flow` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m2-l2-build-your-offer
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m2-l2-build-your-offer.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Build Your Offer
  oneAha: "Customer buys understood transformation — clear Offer beats vague price"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m2-l1-customer-lifecycle]

objectives:
  - id: obj-1
    statement: Learner distinguishes product/service from Offer — promise customer understands (who, result, time, trust, risk).
    measurable: true
  - id: obj-2
    statement: Learner writes one clear Offer sentence using template with risk reducer; explains why target customer understands quickly.
    measurable: true

concepts:
  - id: concept-offer
    term: Offer
    termEn: Offer
    definition: Promise the customer understands — who, result, time, trust, lower risk.
    mustPreserve: true
  - id: concept-risk-reducer
    term: Risk Reducer
    termEn: Risk Reducer
    definition: Element that reduces customer fear of buying — guarantee, trial, refund, proof.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Customer buys transformation; after customer lifecycle — write one Offer after
  - role: tension
    intent: "Too expensive" often = unclear outcome, duration, trust — not price alone
  - role: core
    intent: Product ≠ Offer; good Offer answers who, result, time, trust, risk; price part of Offer
  - role: comparison
    intent: "60-min marketing consult 500 EGP" vs clear transformation promise for small shops
  - role: glossary
    intent: Offer (عرض); Risk Reducer (مقلّل مخاطرة)
  - role: video
    intent: Optional — product to Offer — production Bunny unchanged
  - role: diagram
    intent: One-line Offer formula — who/result/time/method/objection/risk reducer
  - role: quiz
    intent: "Expensive" without outcome question → reframe Offer with AI, test on one customer
  - role: mission
    intent: Write one Offer line using template + why target understands — AI may suggest, learner decides
  - role: confidence_close
    intent: Clear Offer for content, follow-up, pricing; next = Retention Flow

mission:
  type: practice
  intent: Write one Offer sentence (1–2 lines) using who/result/time/method/objection/risk reducer + one sentence why target customer understands
  rubricIntent:
    - dimension: offer_clarity
      weight: 60
      criteria: Who + result + time/context present — not generic product description
    - dimension: trust_risk
      weight: 40
      criteria: Objection or risk reducer present — even if simple
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_offer_or_business_for_learner

termsLocked: [Offer, Risk Reducer]

links:
  nextLessonId: business-m2-l2-retention-flow
  continuityNote: Retention Flow — keep relationship alive after customer understands Offer and buys

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

- **ماذا ستفهم؟** العميل لا يشتري المنتج — يشتري **التحويل** الذي يفهمه. **Offer (العرض)** الواضح أهم من سعر «شبه المناسب».
- **لماذا الآن؟** في الدرس السابق رسمت رحلة العميل. قبل الاحتفاظ والمتابعة، يجب أن يفهم العميل ما الذي يشتريه.
- **ماذا بعد الدرس؟** ستكتب عرضًا بسيطًا لعملك أو فكرتك — بصيغة واحدة واضحة.

### Tension — موقف مألوف

- كثيرون يقولون «العملاء لا يدفعون». تسأل العميل — تجده لا يفهم النتيجة، ولا المدة، ولا لماذا يثق بك.
- المشكلة غالبًا ليست السعر دائمًا — المشكلة وضوح **Offer**. منتج بلا عرض = قائمة مميزات بلا وعد مفهوم.
- الذكاء الاصطناعي يساعدك تختبر الوضوح: يطرح اعتراضات، يقترح صياغة أوضح، ويسأل «هل هذا مفهوم لغير متخصص؟» — وأنت تقرر.

### Core idea — المنتج ≠ العرض — العرض هو الوعد المفهوم

- **المنتج/الخدمة:** ما تسلّمه — جلسة، وجبة، دورة، صيانة.
- **Offer (العرض):** ما يتخيّله العميل أنه سيحصل عليه — نتيجة، وقت، ثقة، مخاطرة أقل.
- **عرض جيد يجيب:** لمن؟ ما النتيجة؟ في أي وقت/سياق؟ لماذا يثق؟ ما الذي يقلّل مخاطرته؟
- السعر جزء من **Offer** — لكن إذا لم يفهم العميل التحويل، أي سعر يبدو غاليًا أو مشبوهًا.

### Comparison — عرض غير واضح vs عرض يُفهم

| منتج فقط | عرض واضح |
|----------|----------|
| «استشارة تسويق ٦٠ دقيقة — ٥٠٠ جنيه». العميل: «ماذا سيخرج؟» — ولا يحجز. | «أساعد أصحاب المحلات الصغيرة يحدّدوا ٣ أولويات تسويق في ٦٠ دقيقة — حتى لو لا وقت — مع خطة مكتوبة تطبّقها الأسبوع القادم». العميل يفهم التحويل. |

### Glossary — مصطلحان للعرض

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Offer (عرض)** | الوعد الذي يفهمه العميل — لمن، نتيجة، وقت، ثقة، مخاطرة أقل | ليس «دورة ١٠ ساعات» — «تخرج بخطة محتوى ٤ أسابيع جاهزة للتنفيذ» |
| **Risk Reducer (مقلّل مخاطرة)** | شيء يقلّل خوف العميل من الشراء — ضمان، تجربة، استرداد، دليل | «جلسة استكشاف ١٥ دقيقة مجانية قبل الالتزام» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — من منتج إلى **Offer**. **لا يُعاد توليده**.

### Diagram block (intent)

صيغة **Offer** في سطر واحد: بساعد [مين] يوصلوا إلى [نتيجة] في [وقت/سياق] باستخدام [طريقة] — حتى لو [اعتراض] — مع [مقلّل مخاطرة]. املأ الفراغات في المهمة.

### Quiz — تأكيد سريع

**السؤال:** عميل قال «غالي» على خدمة — لكنه لم يسأل عن النتيجة. ما أفضل خطوة مع الذكاء الاصطناعي؟

- **الإجابة الصحيحة:** **اطلب من الذكاء الاصطناعي إعادة صياغة العرض بتركيز على النتيجة ومقلّل المخاطرة — واختبره على عميل واحد**
- **التفسير:** «غالي» غالبًا وضوح لا رقم. الذكاء الاصطناعي يساعد في الصياغة والاعتراضات — القرار والاختبار عليك.

### Mission — اكتب عرضًا واحدًا بصيغة واضحة

**المقدمة:** مهمة صياغة عملية — ليست شعرًا. اكتب عرضًا بسيطًا لعملك أو فكرة شغلك باستخدام الصيغة. يمكنك استخدام الذكاء الاصطناعي لاقتراح صياغة — أنت تختار النهائي. لا يُطلب إطلاق — يُطلب جملة واحدة يفهمها غير متخصص.

**التسليم:** عرضك كسطر واحد (أو سطرين) باستخدام: بساعد [مين] يوصلوا إلى [نتيجة محددة] في [وقت/سياق] باستخدام [طريقة] حتى لو [اعتراض شائع] مع [مقلّل مخاطرة] + جملة: لماذا العميل المستهدف سيفهم هذا بسرعة؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح العرض | 60% | فيه لمن + نتيجة + وقت/سياق — ليس وصف منتج عام |
| ثقة ومخاطرة | 40% | فيه اعتراض أو مقلّل مخاطرة — حتى لو بسيط |

### Confidence close

- **فهمت:** العميل يشتري تحويلًا يفهمه — والذكاء الاصطناعي يساعدك تختبر الصياغة والاعتراضات.
- **تستطيع:** لديك عرض واحد واضح تبني عليه محتوى ومتابعة وتسعير.
- **التالي:** **Retention Flow** — كيف تجعل العلاقة حية بعد أن يفهم العميل عرضك ويشتري.

---

## 5. Future generation notes

Downstream locales from MSA only. Offer formula preserved from production. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Offer, Risk Reducer only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Reframe-offer answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

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
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
