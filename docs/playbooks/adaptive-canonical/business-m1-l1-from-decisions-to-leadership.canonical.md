# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `business-m1-l1-from-decisions-to-leadership` |
| **pathId** | `business` |
| **moduleId** | `business-m1` |
| **productionTitle (ar-EG)** | القرارات بقت بتنفّذ نفسها — دورك إيه؟ |
| **productionRoute** | `/learn/business/business-m1-l1-from-decisions-to-leadership` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m1-l1-from-decisions-to-leadership.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI is part of Business OS — move from Operator (bottleneck) to system builder via one repeating decision |
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
| `business-m1-l1-from-decisions-to-leadership.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | AI as Business OS — not just faster tasks; list 3 repeating decisions and pick one for AI as thinking partner or system |
| **Mission rubric** | 60% real decisions · 40% clear AI choice |
| **Quiz intent** | Sara replying to every customer last = Operator mode — no reply/follow-up system |
| **Concepts locked** | Operator, Business OS |
| **Prerequisites** | `[]` (path entry) |
| **Next lesson** | `business-m1-l2-reactive-vs-proactive` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m1-l1-from-decisions-to-leadership
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m1-l1-from-decisions-to-leadership.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: From Decisions to Leadership
  oneAha: "AI as Business OS — Operator to system builder via one repeating decision"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner distinguishes AI as tool, system, and thinking partner — and names the shift from Operator to system designer.
    measurable: true
  - id: obj-2
    statement: Learner lists 3 repeating decisions/problems from their business and selects one where AI helps as partner or system with reason.
    measurable: true

concepts:
  - id: concept-operator
    term: Operator
    termEn: Operator
    definition: Business owner as bottleneck — every decision and follow-up passes through them.
    mustPreserve: true
  - id: concept-business-os
    term: Business OS
    termEn: Business OS
    definition: Habits, decisions, and AI assists that run the business on rhythm — not daily mood.
    mustPreserve: true

blocks:
  - role: orientation
    intent: AI as Business OS; path entry — list 3 repeating decisions after
  - role: tension
    intent: Business runs only when you're present — WhatsApp, pricing, supplier = bottleneck not leader
  - role: core
    intent: Three levels — tool, system, thinking partner; from "I do" to "I design what runs"
  - role: glossary
    intent: Operator (منفّذ); Business OS (نظام تشغيل)
  - role: video
    intent: Optional — from Operator to system builder — production Bunny unchanged
  - role: comparison
    intent: Operator day (reactive WhatsApp) vs system-builder day (protected thinking hour)
  - role: diagram
    intent: Operator-to-Leader spectrum — first step = one repeating decision for AI
  - role: quiz
    intent: Sara last to reply daily = Operator mode — no system
  - role: mission
    intent: 3 repeating decisions + pick one for AI with reason — practical not theoretical
  - role: confidence_close
    intent: AI in business operations; next = reactive vs proactive

mission:
  type: practice
  intent: Write 3 repeating decisions/problems from real business; choose one for AI as thinking partner or system with one-sentence reason
  rubricIntent:
    - dimension: real_decisions
      weight: 60
      criteria: All three are real decisions or problems from learner context — not generic examples
    - dimension: clear_ai_choice
      weight: 40
      criteria: One decision chosen with reason tied to their business
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_decisions_or_choice_for_learner

termsLocked: [Operator, Business OS]

links:
  nextLessonId: business-m1-l2-reactive-vs-proactive
  continuityNote: Reactive vs Proactive — why owners stay in firefighting and how AI reduces repetition

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

### Orientation — بداية المسار

- **ماذا ستفهم؟** الذكاء الاصطناعي ليس أداة تسرّع المهام فقط — يمكن أن يكون جزءًا من **Business OS (نظام تشغيل الأعمال)** الذي ينقلك من منفّذ إلى باني نظام.
- **لماذا الآن؟** مسار **Business** ليس إدارة عامة — بل كيف تشغّل عملك بالذكاء الاصطناعي كنظام تشغيل: قرارات، وقت، عملاء، وتكرار.
- **ماذا بعد الدرس؟** ستكتب ٣ قرارات أو مشاكل تتكرر عندك — وتختار واحدة يستطيع الذكاء الاصطناعي مساعدتك فيها كشريك تفكير أو كنظام.

### Tension — موقف مألوف

- إذا كان كل قرار صغير يمرّ عليك — رد واتساب، موافقة سعر، متابعة مورد — فأنت لست قائدًا، أنت عنق الزجاجة.
- كثيرون يستخدمون الذكاء الاصطناعي لكتابة إيميل أسرع. هذا مفيد — لكنه ١٠٪ من القيمة. الـ ٩٠٪ الباقية عندما يساعدك الذكاء الاصطناعي في التفكير في القرار، ورؤية التكرار، وبناء نظام يعمل من دونك.
- السؤال ليس «هل أنا ذكي بما يكفي؟» — السؤال: «ما الذي يتكرر كل أسبوع ويأكل وقتي، وكيف يخفّفه الذكاء الاصطناعي حتى أبني نظامًا؟»

### Core idea — الذكاء الاصطناعي: أداة — نظام — شريك تفكير

- **المستوى ١ — أداة:** تكتب **Prompt** وتأخذ ردًا أسرع (رسالة، تلخيص، فكرة). هذا **Operator (منفّذ)** بسرعة أعلى.
- **المستوى ٢ — نظام:** تستخدم الذكاء الاصطناعي لتوثيق قرار متكرر، ترتيب أولويات، أو تقليل شغل إداري يتكرر كل أسبوع.
- **المستوى ٣ — شريك تفكير:** تضع قرارًا أمام الذكاء الاصطناعي، فيطرح أسئلة ويوضّح بدائل — وأنت تقرر. هذا يحرّر وقتك للبناء لا للإطفاء.
- **التحوّل الحقيقي:** من «أنا أعمل» إلى «أنا أصمّم ما يعمل». الذكاء الاصطناعي لا يستبدلك — بل يساعدك على بناء **Business OS** خطوة بخطوة.

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Operator (منفّذ)** | صاحب العمل الذي يمشي العمل بطاقته — كل قرار ومتابعة تمرّ عليه | يرد على كل رسالة، يوافق على كل طلب، ولا وقت للتفكير في التوسّع |
| **Business OS (نظام تشغيل)** | مجموعة عادات وقرارات ومساعدات ذكاء اصطناعي تجعل العمل يشتغل بإيقاع — لا بمزاجك اليومي | قائمة أولويات أسبوعية + قوالب رد + وقت محمي للتفكير |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — من منفّذ إلى باني نظام. **لا يُعاد توليده**.

### Comparison — يوم Operator vs يوم باني نظام

| يوم Operator | يوم باني نظام |
|--------------|---------------|
| تفتح الواتساب أولًا، ترد ساعتين، تطفئ مشاكل، تنام وقد شعرت أنك «اشتغلت» — لكن لا قرار استراتيجي اتُّخذ | ساعة محمية للتفكير والأرقام، الذكاء الاصطناعي يساعدك ترتّب الأولويات، ثم تتعامل مع الرسائل — أنت اخترت متى، لا الرسائل |

### Diagram block (intent)

طيف التحوّل من **Operator** إلى قائد. لا تحتاج قفزة فورية. الخطوة الأولى: تعرف أين أنت — وتختار قرارًا متكررًا واحدًا يساعدك فيه الذكاء الاصطناعي كنظام.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** سارة تفتخر بأنها آخر من يرد على عملاء العمل كل يوم. ما التشخيص الأقرب؟

- **الإجابة الصحيحة:** **وضع Operator — حضورها ضروري لأنه لا نظام رد أو متابعة**
- **التفسير:** إذا كانت الجودة تعتمد على حضورها الشخصي، فالعمل لا يزال نظامًا شخصيًا لا **Business OS**. الذكاء الاصطناعي يستطيع المساعدة في قوالب ومتابعة — لكن أولًا تعرف التكرار.

### Mission — ٣ قرارات متكررة — وواحدة للذكاء الاصطناعي

**المقدمة:** مهمة تطبيقية — ليست تحليلًا نظريًا. اكتب ٣ قرارات أو مشاكل تتكرر في عملك كل أسبوع، واختر واحدة يستطيع الذكاء الاصطناعي مساعدتك فيها كشريك تفكير أو كنظام. لا يُطلب حل كامل — يُطلب وعي واختيار واضح.

**التسليم:** قرار متكرر #١ · #٢ · #٣ · ما اخترته للذكاء الاصطناعي (واحد فقط) — ولماذا هو أنسب من الثلاثة.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| قرارات حقيقية | 60% | الثلاثة قرارات أو مشاكل من واقعك — ليست أمثلة عامة |
| اختيار واضح | 40% | قرار واحد مختار وسبب مربوط بعملك |

### Confidence close

- **فهمت:** الذكاء الاصطناعي جزء من تشغيل العمل — ليس سرعة في الكتابة فقط. والتحوّل من **Operator** إلى باني نظام يبدأ بقرار متكرر واحد.
- **تستطيع:** اختيار مشكلة حقيقية والتفكير فيها مع الذكاء الاصطناعي كشريك أو كنظام.
- **التالي:** **Reactive vs Proactive** — لماذا يبقى أصحاب الأعمال في وضع الإطفاء، وكيف يقلّل الذكاء الاصطناعي الشغل المتكرر.

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
| Concept preservation | 5 | Operator, Business OS only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Operator-mode answer unchanged |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
