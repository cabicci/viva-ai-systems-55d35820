# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `business-m2-l2-retention-flow` |
| **pathId** | `business` |
| **moduleId** | `business-m2` |
| **productionTitle (ar-EG)** | Retention Flow |
| **productionRoute** | `/learn/business/business-m2-l2-retention-flow` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m2-l2-retention-flow.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Retention is not luck — three post-purchase touchpoints keep the relationship alive; AI drafts, you review and send |
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
| `business-m2-l2-retention-flow.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Retention starts after purchase — design a 3-step Retention Flow for one customer type; AI helps draft messages |
| **Mission rubric** | 60% realistic flow · 40% clear AI role |
| **Quiz intent** | Customer bought once and did not return → first step is post-purchase follow-up touch + confirmation draft — not more ads |
| **Concepts locked** | Retention Flow, Touchpoint |
| **Prerequisites** | `business-m2-l2-build-your-offer` |
| **Next lesson** | `business-m2-l3-readiness-signals` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m2-l2-retention-flow
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m2-l2-retention-flow.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Retention Flow
  oneAha: "Three post-purchase touchpoints — AI drafts follow-up, learner reviews before send"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m2-l2-build-your-offer]

objectives:
  - id: obj-1
    statement: Learner explains why retention starts after purchase and why follow-up is not annoyance.
    measurable: true
  - id: obj-2
    statement: Learner designs a 3-step Retention Flow for one customer type with timing, message goal, and simple satisfaction question.
    measurable: true

concepts:
  - id: concept-retention-flow
    term: Retention Flow
    termEn: Retention Flow
    definition: Ordered follow-up sequence after purchase — each step has a goal and timing.
    mustPreserve: true
  - id: concept-touchpoint
    term: Touchpoint
    termEn: Touchpoint
    definition: Each message or contact that reaches the customer in the journey.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Retention after Offer clarity — design 3-step flow for one customer type
  - role: tension
    intent: Customer bought then silence — no follow-up means they disappear
  - role: core
    intent: Three touches — day 3 confirm, day 14 value, day 30 friendly return; NPS-style satisfaction signal
  - role: glossary
    intent: Retention Flow; Touchpoint
  - role: video
    intent: Optional — post-purchase follow-up — production Bunny unchanged
  - role: comparison
    intent: More ads vs organized follow-up with AI drafts
  - role: diagram
    intent: Follow-up cadence — timing over volume
  - role: quiz
    intent: One-time buyer — first step is follow-up touch + confirmation draft
  - role: mission
    intent: 3-step retention plan for one customer type — timing, message goal, AI role, satisfaction question
  - role: confidence_close
    intent: Retention + AI drafting; next = process readiness signals

mission:
  type: practice
  intent: Choose one customer type and write a 3-step Retention Flow — when, message goal, how AI helps draft; include one satisfaction question
  rubricIntent:
    - dimension: real_flow
      weight: 60
      criteria: Three steps with timing and goal — tied to a real customer type
    - dimension: ai_role
      weight: 40
      criteria: Clear how AI helps with drafting or summarizing
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_flow_or_customer_type_for_learner

termsLocked: [Retention Flow, Touchpoint]

links:
  nextLessonId: business-m2-l3-readiness-signals
  continuityNote: Readiness signals — is the process ready before adding AI or delegating?

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

- **ماذا ستفهم؟** الاحتفاظ بالعميل ليس حظًا — المتابعة بعد الشراء تُبقي العلاقة حية، والذكاء الاصطناعي يساعدك تكتبها بسرعة.
- **لماذا الآن؟** في الدرس السابق وضّحت **Offer (العرض)** — العميل يعرف ما يشتري. الآن السؤال: بعد الشراء، كيف نُبقي العلاقة نشطة؟ كثير من الضعف يحدث بعد الشراء — العميل يختفي من دون متابعة.
- **ماذا بعد الدرس؟** ستصمّم **Retention Flow (مسار احتفاظ)** بسيطًا من ٣ خطوات لنوع عميل واحد عندك.

### Tension — موقف مألوف

- تجلب عملاء جددًا، لكن نفس الأشخاص لا يعودون. ليس دائمًا لأن المنتج سيئ — أحيانًا لأنه لا متابعة بعد الشراء.
- المتابعة لا تعني إزعاجًا. معناها: تأكد أنه راضٍ، قدّم مساعدة، وذكّره في الوقت المناسب.
- الذكاء الاصطناعي يكتب مسودات رسائل، يخصّص النبرة، ويساعدك تسأل سؤال رضا بسيط — أنت تراجع وترسل.

### Core idea — ٣ لمسات بعد الشراء — مش حملة ضخمة

- **لمسة ١ — بعد أيام قليلة:** «هل كل شيء على ما يرام؟ هل تحتاج شيئًا؟» — تأكيد + باب للشكوى المبكرة.
- **لمسة ٢ — بعد أسبوعين:** محتوى مفيد أو عرض مناسب — ليس فقط «اشترِ مرة أخرى».
- **لمسة ٣ — بعد شهر:** تذكير ودّي + دعوة للعودة أو الترشيح.
- سؤال **NPS (مؤشر رضا)** أو رضا بسيط («من ١ إلى ٥، كيف كانت تجربتك؟») يعطيك إشارة — والذكاء الاصطناعي يساعدك تصوغه وتلخّص الردود.

### Glossary — مصطلحان للمتابعة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Retention Flow (مسار احتفاظ)** | سلسلة متابعة مرتبة بعد الشراء — كل خطوة لها هدف ووقت | يوم ٣: تأكيد. يوم ١٤: قيمة مضافة. يوم ٣٠: دعوة للعودة |
| **Touchpoint (نقطة تلامس)** | كل رسالة أو اتصال يصل للعميل في الرحلة | واتساب شكر بعد الطلب — أول نقطة تلامس في المسار |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — متابعة بعد الشراء. **لا يُعاد توليده**.

### Comparison — إعلانات أكثر vs متابعة منظمة

| بدون Flow | مع Flow + AI |
|-----------|--------------|
| كل جهد على جلب جدد. من اشتروا مرة يختفون — وتدفع مرة أخرى للتعويض | ٣ رسائل مدروسة بعد الشراء. نفس العملاء يعودون — والذكاء الاصطناعي يختصر كتابة كل لمسة |

### Diagram block (intent)

إيقاع المتابعة — **Cadence (إيقاع)**. التوقيت أهم من الكمية. ابدأ بـ ٣ خطوات — ودع الذكاء الاصطناعي يصوغ المسودات، أنت تراجع قبل الإرسال.

### Quiz — تأكيد سريع

**السؤال:** عميل اشترى منك مرة ولم يعد. ما أفضل خطوة أولى مع الذكاء الاصطناعي؟

- **الإجابة الصحيحة (correctIndex: 1):** **تصميم لمسة متابعة بعد الشراء + مسودة رسالة تأكيد**
- **التفسير:** الاحتفاظ غالبًا أرخص من الجلب. الذكاء الاصطناعي يساعد في صياغة المتابعة — لا يستبدل قرار التوقيت والمحتوى.

### Mission — ٣ خطوات احتفاظ لنوع عميل واحد

**المقدمة:** مهمة تصميم عملي — ليست أتمتة كاملة. اختر نوع عميل واحد (أو عميلًا نموذجيًا) واكتب **Retention Flow** من ٣ خطوات: متى، ما الرسالة، وكيف يساعدك الذكاء الاصطناعي تكتبها. لا يُطلب إرسال فعلي اليوم — يُطلب خطة واضحة.

**التسليم:** نوع العميل · الخطوة ١ (توقيت + هدف) · الخطوة ٢ · الخطوة ٣ · سؤال رضا بسيط (جملة واحدة).

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| Flow واقعي | 60% | ٣ خطوات بتوقيت وهدف — مربوطة بنوع عميل حقيقي |
| دور الذكاء الاصطناعي | 40% | واضح كيف يساعد في الصياغة أو التلخيص |

### Confidence close

- **فهمت:** الاحتفاظ يبدأ بعد الشراء — والذكاء الاصطناعي يخفّف كتابة المتابعة.
- **تستطيع:** لديك ٣ خطوات جاهزة لنوع عميل واحد.
- **التالي:** **علامات الجاهزية للتوسع** — هل العملية جاهزة قبل أن تضيف الذكاء الاصطناعي أو تفوّض؟

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
| Concept preservation | 5 | Retention Flow, Touchpoint only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
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
| 7 | Quiz unchanged (correctIndex 1) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
