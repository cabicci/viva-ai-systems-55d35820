# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m5-l1-transition` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | Transition — من اللغة للـ App |
| **productionRoute** | `/learn/builder/builder-m5-l1-transition` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l1-transition.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Building starts with a clear product description — not code |
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
| `builder-m5-l1-transition.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Phase 2 transition — describe product (idea + user + goal) before any tool |
| **Mission rubric** | 60% three lines clear · 40% measurable goal |
| **Quiz intent** | Write idea + user + goal before opening any tool (correctIndex 0) |
| **Concepts locked** | Product Request, Phase 2 |
| **Prerequisite** | `builder-m4-l1-parameters` |
| **Next lesson** | `builder-m5-l2-frontend` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l1-transition
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l1-transition.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Transition — From Language to App
  oneAha: "Building starts with a clear product description — not code"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m4-l1-parameters]

objectives:
  - id: obj-1
    statement: Learner explains that building starts with product description (idea + user + goal), not code.
    measurable: true
  - id: obj-2
    statement: Learner writes a Product Request with three one-sentence lines.
    measurable: true

concepts:
  - id: concept-product-request
    term: Product Request
    termEn: Product Request
    definition: Simple description — what the app is, for whom, and what the user reaches.
    mustPreserve: true
  - id: concept-phase-2
    term: Phase 2
    termEn: Phase 2 (Building)
    definition: Turn AI idea from chat into real product — screens + storage + logic.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Describe before build; 3 sentences after lesson
  - role: tension
    intent: Great idea but vague prompt → generic output
  - role: core
    intent: Three layers; first step = product description; Lovable reads clear request
  - role: comparison
    intent: Vague «make app» vs clear product request
  - role: glossary
    intent: Product Request, Phase 2
  - role: video
    intent: Phase 1 → Phase 2 — production Bunny unchanged
  - role: screenshot
    intent: Bridge from chat to app layers
  - role: quiz
    intent: Idea + user + goal first (correctIndex 0)
  - role: mission
    intent: Write Product Request — idea, user, goal
  - role: confidence_close
    intent: Not becoming programmer; next = Frontend vs Backend

mission:
  type: practice
  intent: Choose an AI app idea and write idea + user + goal — one sentence each — ~5–10 min
  rubricIntent:
    - dimension: three_clear
      weight: 60
      criteria: One sentence per line; user specific not just «people»
    - dimension: measurable_goal
      weight: 40
      criteria: Goal describes outcome; can imagine when user is «done»
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_product_idea_for_learner

termsLocked: [Product Request, Phase 2, Lovable, Prompt]

links:
  nextLessonId: builder-m5-l2-frontend
  continuityNote: Frontend vs Backend — what client sees vs what runs behind

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

- **ماذا ستفهم؟** **البناء يبدأ بوصف واضح** — **ليس بالكود**. **ما التطبيق؟** **لمن؟** **وما الهدف؟**
- **لماذا الآن؟** **أنهيت مرحلة «تكلّم الذكاء الاصطناعي»**. **الآن ستصف فكرة تطبيق** — **Lovable (مساعد بناء)** **أو أدوات أخرى تبني من وصفك**.
- **ماذا بعد الدرس؟** **٣ جمل فقط**: **فكرة + مستخدم + هدف**. **ليس برمجة**.
- **أنت لا تتحول إلى مبرمج**. **أنت تتعلّم وصف المنتج** — **والأداة تبني من وصفك**.

### Tension — فكرة قوية — ولا تعرف من أين تبدأ

- **تفتح Lovable أو أي أداة وتكتب «اعمل تطبيق ذكاء اصطناعي»** — **فيخرج شيء عام ليس ما في ذهنك**.
- **المشكلة ليست الأداة**. **المشكلة أنك لم تحدّد**: **من سيستخدمه؟** **وماذا يريد أن يصل إليه؟**
- **الحل**: **٣ جمل واضحة قبل أي أداة**. **لا تحتاج JavaScript** — **تحتاج وصف منتج**.

### Core idea — البناء يبدأ بطلب منتج واضح

- **أي تطبيق = ٣ طبقات بسيطة**: **واجهة (ما يراه العميل)**، **كواليس (ما يعمل خلفها)**، **مخزن (ما يتذكره)**.
- **الخطوة الأولى ليست كودًا** — **بل وصف المنتج**: **فكرة + مستخدم + هدف**.
- **عندما يكون الثلاثة واضحين**، **Lovable يفهمك من أول مرة**.
- **أنت تتعلّم الوصف** — **والأداة تبني**. **هذا جسر ثقة قبل الدروس التقنية**.

### Comparison — طلب غامض vs طلب منتج واضح

| طلب غامض | طلب منتج واضح |
|----------|----------------|
| «**اعمل تطبيق ذكاء اصطناعي للمطاعم**» — **الأداة تخمّن كل شيء**. **ستعدّل ٥ مرات ولا تصل** | «**تطبيق لصاحب مطعم صغير — العميل يكتب مكوناته والذكاء الاصطناعي يقترح وصفة. الهدف: أول وصفة في ٣٠ ثانية**» — **هذه بداية بناء حقيقية** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Product Request (طلب المنتج)** | **وصف بسيط**: **ما التطبيق، لمن، وماذا يريد المستخدم أن يصل إليه** | «**مساعد ذكاء اصطناعي لطلاب الجامعة — يلخّص محاضرات PDF في ٥ نقاط**» |
| **Phase 2 (مرحلة البناء)** | **تحويل فكرة الذكاء الاصطناعي من شات إلى منتج حقيقي**: **شاشات + تخزين + منطق** | **Phase 1 = تكلّم AI**. **Phase 2 = ابنِ له بيتًا يعيش فيه** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من الكلام للبناء — Phase 1 إلى Phase 2». **لا يُعاد توليده.**

### Screenshot block (intent)

**الجسر — من Prompts (طلبات) إلى طبقات التطبيق:**

**على اليسار فقاعات شات** — **على اليمين شاشة تطبيق + سيرفر + مخزن**. **أنهيت «تكلّم AI»**. **الآن تبني له بيتًا**: **واجهة يراها العميل، كواليس تعمل، مخزن يتذكر**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **سارة تريد تطبيق ذكاء اصطناعي يساعد أصحاب محلات على كتابة أوصاف منتجات. ما أفضل أول خطوة؟**

- **الإجابة الصحيحة (خيار ١):** **تكتب فكرة التطبيق + المستخدم + الهدف — قبل أن تفتح أي أداة**.
- خيار ٢: **تفتح Lovable وتكتب «اعمل تطبيق AI»**.
- خيار ٣: **تتعلم JavaScript أولًا**.

**التفسير:** **Product Request أولًا** — **عندما تعرف «لمن» و«لماذا»**، **أي أداة تفهمك**. **الكود يأتي لاحقًا**.

### Mission — اكتب طلب منتجك

**المقدمة:** **مهمة كتابة — ليست برمجة**. **٥–١٠ دقائق كافية**.

**التسليم:**

1. **الفكرة (جملة واحدة):** التطبيق ماذا يفعل؟
2. **المستخدم (جملة واحدة):** من سيستخدمه؟
3. **الهدف (جملة واحدة):** ماذا يريد أن يصل إليه عند الانتهاء؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| الثلاثة واضحون | 60% | **كل سطر جملة واحدة**؛ **المستخدم محدّد (ليس «الناس» فقط)** |
| الهدف قابل للقياس | 40% | **الهدف يصف نتيجة** — **ليس «تطبيقًا جميلًا»**؛ **تستطيع تخيّل المستخدم «انتهى» متى** |

### Confidence close

- **فهمت:** **البناء يبدأ بوصف واضح — ليس بكود**. **أنت لا تتحول إلى مبرمج**.
- **تستطيع:** **لديك ٣ جمل جاهزة** — **جسر ثقة قبل الدروس التقنية**.
- **التالي:** **Frontend vs Backend** — **الفرق بين ما يراه العميل وما يعمل خلفه**.

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
| Concept preservation | 5 | Product Request, Phase 2 only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Product Request first |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
