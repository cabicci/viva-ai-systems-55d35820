# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m1-l1-what-is-llm` |
| **pathId** | `builder` |
| **moduleId** | `builder-m1` |
| **productionTitle (ar-EG)** | إيه هو الـ LLM؟ |
| **productionRoute** | `/learn/builder/builder-m1-l1-what-is-llm` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m1-l1-what-is-llm.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **5-lesson MSA canonical pilot** (Builder path) |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | LLM = smart autocomplete for sentences — predicts language, does not guarantee truth |
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
| `builder-m1-l1-what-is-llm.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | LLM completes language like smart autocomplete — not truth engine; verify facts before showing users |
| **Mission rubric** | 50% real question + answer · 50% verification + product responsibility link |
| **Quiz intent** | Wrong confident news answer — model predicts from training data, not live news |
| **Concepts locked** | LLM, Hallucination, AI |
| **Next lesson** | Tokens and training |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m1-l1-what-is-llm
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m1-l1-what-is-llm.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: What Is an LLM
  oneAha: "LLM predicts best next text — not verified truth"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner explains LLM as language prediction (smart autocomplete) — not search or truth guarantee.
    measurable: true
  - id: obj-2
    statement: Learner asks one verifiable question, checks AI answer, links result to product responsibility for facts.
    measurable: true

concepts:
  - id: concept-llm
    term: LLM
    termEn: Large Language Model
    definition: Smart sentence autocomplete — predicts plausible text, does not query a fact database.
    mustPreserve: true
  - id: concept-hallucination
    term: Hallucination
    termEn: Hallucination
    definition: AI invents confident wrong information — plausible sentence, wrong content.
    mustPreserve: true

blocks:
  - role: orientation
    intent: First Builder lesson — optional path; real question + verification after
  - role: tension
    intent: Confident wrong answer — feels like it knows but completes language
  - role: core
    intent: LLM = autocomplete at sentence level; verification is builder responsibility
  - role: comparison
    intent: Treating as Google vs treating as language assistant with verification
  - role: glossary
    intent: LLM (نموذج لغوي كبير); Hallucination (هلوسة)
  - role: video
    intent: Optional LLM explainer — production Bunny unchanged
  - role: screenshot
    intent: AI assistant UI — question + context + guessed reply
  - role: quiz
    intent: Wrong news details — predicts from old training, not live feed
  - role: mission
    intent: Ask verifiable question; verify; link to product fact responsibility
  - role: confidence_close
    intent: LLM not truth; next = tokens and training

mission:
  type: practice
  intent: Ask AI one verifiable fact question; record answer; verify via source; note right/wrong and why it matters for users
  rubricIntent:
    - dimension: question_and_answer
      weight: 50
      criteria: Clear question and answer; question has verifiable fact
    - dimension: verification_and_build
      weight: 50
      criteria: Real verification step; links result to product responsibility for facts
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - verify_facts_for_learner

termsLocked: [LLM, Hallucination, AI]

links:
  nextLessonId: builder-m1-l2-tokens-training
  continuityNote: Tokens and training — why long requests cost more

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

- **ماذا ستفهم؟** كيف «المساعد الذكي» يكمّل الكلام — مثل **autocomplete (إكمال تلقائي)** ذكي — **ولا يضمن الحقيقة**.
- **لماذا الآن؟** أول درس في **Builder (البناء)** — مسار Level 3 **اختياري**. إذا هدفك استخدام **AI** في عملك، ليس مطلوبًا إكمال المسار.
- **ماذا بعد الدرس؟** سؤال واقعي + طريقة **تحقق** بسيطة — لا برمجة.

### Tension — موقف مألوف

- سألت ChatGPT أو Gemini سؤالًا — ردّ بثقة بمعلومة — وبعد ساعة وجدتها **غير صحيحة**.
- يبدو أنه «يعرف» — لكن الحقيقة أنه **يكمل الكلام الأنسب** مثل **autocomplete** متطوّر.
- عندما تبني منتجًا فيه **AI**، المستخدم سيعتمد على الردود. إذا لم تفهم الفرق، ستبني ميزة **تضلّل** من دون قصد.

### Core idea — الفكرة الأساسية

**يخمّن الكلام الأنسب — لا يتحقق من الحقيقة**

- **LLM (نموذج لغوي كبير)** = **autocomplete (إكمال تلقائي)** ذكي على مستوى جمل كاملة. يتوقّع الكلام الأنسب — **لا يبحث في Google**.
- عندما يردّ بثقة، هذا **ليس** دليلًا أنه «يفهم» — بل أن الجملة **شكلها منطقي**.
- في **Builder**: أي مساعد في منتجك يعمل بنفس المنطق. **التحقق من الحقائق مسؤوليتك** — لا الموديل.
- استخدمه في الكتابة والتلخيص والأفكار. **راجع** أي أرقام أو تواريخ قبل عرضها للمستخدم.

### Comparison — Google vs مساعد لغوي

| خطأ: كأنه Google | صح: كمساعد لغوي |
|------------------|-----------------|
| تفترض كل إجابة حقيقة. ميزة «اسأل أي شيء» بدون تحذير أو تحقق — المستخدم يصدم عند معلومة **مختلقة (Hallucination)** | تستغله في ما يجيده، وتعطيه سياقًا ومصادرًا، وتضيف **خطوة تحقق** للحقائق |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **LLM (نموذج لغوي كبير)** | **autocomplete** ذكي للجمل — يتوقّع الكلام الأنسب، لا يبحث في قاعدة بيانات | ChatGPT و Claude و Gemini — كلهم **LLM** تحت الغطاء |
| **Hallucination (هلوسة)** | عندما **AI** يختلق معلومة **بثقة** — جملة شكلها صحيح لكن المحتوى خطأ | يذكر شخصًا أو تاريخًا خطأ في إجابة «مؤكدة» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري — **LLM** = توقّع اللغة لا الحقيقة. **لا يُعاد توليده**.

### Screenshot block (intent)

واجهة مساعد **AI** — سؤال + سياق + رد مُخمَّن. المساعد ليس مبرمجًا بإجابات جاهزة. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** سألت **AI** عن خبر حصل أمس — ردّ بتفاصيل كلها خطأ بثقة. ما أقرب سبب؟

- **الإجابة الصحيحة:** يخمّن من **البيانات القديمة** التي تدرب عليها — **غير متصل** بأخبار لحظية.
- **التفسير:** **AI** يتوقّع أقرب كلام منطقي — لا يتحقق من الخبر. عند بناء ميزة **AI**، خطّط للتحقق من الحقائق.

### Mission — سؤال واقعي + طريقة تحقق

**المقدمة:** جرّب بنفسك — اسأل أي **AI** سؤالًا فيه حقيقة قابلة للتحقق (تاريخ، رقم، اسم). ١٠ دقائق كافية.

**التسليم:** السؤال · رد **AI** · طريقة التحقق · صح/خطأ · لماذا يهم لو ستعرض ردود **AI** للمستخدمين

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| سؤال ورد حقيقي | 50% | السؤال والرد واضحان؛ السؤال فيه حقيقة قابلة للتحقق |
| تحقق وربط بالبناء | 50% | طريقة تحقق فعلية؛ ربط النتيجة بمسؤولية المنتج عن الحقائق |

### Confidence close

- **فهمت:** **LLM** = **autocomplete** ذكي — لا ضمان للحقيقة. **Builder** Level 3 اختياري.
- **تستطيع:** استخدامه للكتابة والأفكار — والتحقق من الحقائق قبل العرض.
- **التالي:** **Tokens (الرموز)** والتدريب — لماذا الطلب الطويل أبطأ وأغلى.

---

## 5. Future generation notes

Downstream `ar-Gulf` / `en` from this MSA only. Deferred: Bunny · Remotion · RAG · runtime.

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
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Auto-suggest |
| 4 | Default | **Egyptian Arabic production** |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | LLM, Hallucination only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | Training-data answer unchanged |
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
| 6 | Mission rubric 50/50 | ☑ pass |
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer sign-off recorded — next-batch gate met | ☑ pass (approve with notes · 2026-06-04) |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☑ **Project Owner · 2026-06-04 · approved-for-next-batch** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
