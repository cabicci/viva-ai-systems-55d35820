# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m9-l1-rag` |
| **pathId** | `builder` |
| **moduleId** | `builder-m9` |
| **productionTitle (ar-EG)** | AI يرد من ملفاتك (RAG) |
| **productionRoute** | `/learn/builder/builder-m9-l1-rag` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m9-l1-rag.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | RAG = الذكاء الاصطناعي يجيب من ملفاتك — ليس Fine-tuning ولا تخمين |
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
| `builder-m9-l1-rag.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | RAG answers from your files; search → inject → answer; not Fine-tuning |
| **Mission rubric** | 60% مصدر واضح · 40% أسئلة واقعية |
| **Quiz intent** | Prepare files/chunks first (correctIndex 0) |
| **Concepts locked** | RAG, RAG not Fine-tuning |
| **Prerequisite** | `builder-m8-l2-rls` |
| **Next lesson** | `builder-m9-l2-embeddings` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m9-l1-rag
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m9-l1-rag.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: RAG — AI Answers from Your Files
  oneAha: "RAG = AI answers from your files — not Fine-tuning, not guessing"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m8-l2-rls]

objectives:
  - id: obj-1
    statement: Learner explains RAG as search files → inject excerpt → answer from source.
    measurable: true
  - id: obj-2
    statement: Learner designs RAG map — one source, 3 customer questions, fallback if no answer.
    measurable: true

concepts:
  - id: concept-rag
    term: RAG
    termEn: Retrieval-Augmented Generation
    definition: AI searches your files first then answers from excerpts — not guessing.
    mustPreserve: true
  - id: concept-not-finetuning
    term: RAG not Fine-tuning
    termEn: RAG vs Fine-tuning
    definition: Fine-tuning changes model; RAG injects files at question time.
    mustPreserve: true

blocks:
  - role: orientation
    intent: RAG from files; design map after lesson; optional Builder L3 depth
  - role: tension
    intent: AI gave wrong price — hallucination; never read your data
  - role: core
    intent: Search → inject → answer; RAG not Fine-tuning; say I don't know
  - role: comparison
    intent: Ask AI directly vs RAG from your files
  - role: glossary
    intent: RAG, RAG not Fine-tuning
  - role: video
    intent: Question to answer from files — production Bunny unchanged
  - role: screenshot
    intent: RAG 3-step diagram
  - role: quiz
    intent: Prepare files/chunks first (correctIndex 0)
  - role: mission
    intent: One source + 3 questions + fallback
  - role: confidence_close
    intent: Next = Embeddings

mission:
  type: practice
  intent: RAG design map — app, one source, 3 questions, fallback — ~10 min; no code
  rubricIntent:
    - dimension: source_clear
      weight: 60
      criteria: One specific source not all files; logical why most important
    - dimension: realistic_questions
      weight: 40
      criteria: 3 real customer questions — answer must come from source not guess
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_rag_architecture_for_learner

termsLocked: [RAG, Fine-tuning, chunks, hallucination, Prompt]

links:
  nextLessonId: builder-m9-l2-embeddings
  continuityNote: Embeddings — search finds meaning not literal words

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

- **ماذا ستفهم؟** **RAG (الذكاء الاصطناعي يجيب من ملفاتك)** = **يجيب من بياناتك بدل التخمين**.
- **لماذا الآن؟** **عندما يرد مساعدك في التطبيق على أسعار أو سياسات**، **يجب أن يقرأ من بياناتك** — **ليس من ذاكرته العامة**.
- **ماذا بعد الدرس؟** **خريطة تصميم بسيطة:** **مصدر واحد + ٣ أسئلة يجيب عليها منه** — **ليس كودًا**.
- **عمق اختياري:** **Builder المستوى ٣**. **إن كان هدفك استخدام الذكاء الاصطناعي في عملك فقط — ليس مطلوبًا**.

### Tension — الذكاء الاصطناعي قال سعرًا خاطئًا

- **تسأل GPT عن سعر منتجك** — **يرد «٢٩ دولارًا»**. **لم ترسل هذا السعر أبدًا!**
- **الذكاء الاصطناعي يخمّن إجابة تبدو منطقية** — **هذا hallucination (تأليف)**. **العميل يفقد الثقة**.
- **المشكلة ليست في الذكاء الاصطناعي** — **المشكلة أنه لم يقرأ بياناتك قبل الإجابة**.

### Core idea — RAG = يرد من ملفاتك — ليس من تخمين

- **قبل أن يجيب الذكاء الاصطناعي**، **النظام يبحث في ملفاتك**، **يجد المقطع الصحيح**، **ويقول للذكاء الاصطناعي: «اجب من هذه الورقة فقط»**.
- **RAG** = **ابحث في ملفاتك + أضف المقتطف للسؤال + اكتب الإجابة**.
- **RAG ليس Fine-tuning (تدريب الموديل):** **Fine-tuning يغيّر الموديل نفسه**. **RAG يحقن ملفاتك وقت السؤال** — **من دون لمس الموديل**.
- **إن لم تكن المعلومة في ملفاتك** — **«لا أعرف» أفضل من التأليف**.

### Comparison — سؤال مباشر vs قراءة ملفاتك أولًا

| سؤال للذكاء الاصطناعي من ذاكرته | RAG من ملفاتك |
|--------------------------------|---------------|
| «ما سياسة الاسترجاع؟» — **يخمّن من معلومات عامة**. **إجابة خاطئة = عميل غاضب** | **النظام يجد فقرة «سياسة الاسترجاع» في PDF الخاص بك**، **يضعها في الـ Prompt (طلب)**، **والذكاء الاصطناعي ينقل منها**. **دقة من بياناتك** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **RAG** | **الذكاء الاصطناعي يجيب من ملفاتك** — **يبحث في مصادرك أولًا ثم يكتب** | **كموظف يفتح ملف الأسعار قبل الرد على العميل** — **ليس من ذاكرته** |
| **RAG ليس Fine-tuning** | **Fine-tuning = تدريب الموديل على بياناتك**. **RAG = قراءة من ملفاتك وقت السؤال** — **أسهل للبداية** | **مساعد يعرف أسعارك؟ RAG يكفي** — **لا تحتاج تدريب موديل كامل** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من سؤال لإجابة من ملفاتك». **لا يُعاد توليده.**

### Screenshot block (intent)

**٣ خطوات في الخلفية:**

(١) **السؤال يتحول لبحث في ملفاتك**. (٢) **أقرب فقرات (chunks) ترجع**. (٣) **السؤال + الفقرات يُرسلان للذكاء الاصطناعي** — **يرد من ورقتك لا يخمّن**.

### Quiz — تأكيد سريع

**السؤال:** **تريد مساعد دعم لمتجرك يرد على الشحن والأسعار. ما أول خطوة صحيحة؟**

- **الإجابة الصحيحة (خيار ١):** **تجهّز ملفاتك (أسعار، سياسات)** — **تقسّمها chunks وتخزّنها للبحث**.
- خيار ٢: **تعمل fine-tuning لموديل GPT على كل منتجاتك**.
- خيار ٣: **تكتب كل الإجابات المحتملة في جدول يدوي**.

**التفسير:** **RAG يبدأ بتجهيز المصادر** — **تقسيم وفهرسة** — **قبل أي إجابة**.

### Mission — اختر مصدرًا واحدًا للذكاء الاصطناعي

**المقدمة:** **خريطة تصميم — ليس كود**. **١٠ دقائق**.

**التسليم:** **تطبيقك في سطر**، **مصدر واحد** (اسم، نوع، لماذا الأهم)، **٣ أسئلة عميل**، **الرد البديل إن لم تكن الإجابة في المصدر**.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| مصدر واضح | 60% | **مصدر واحد محدد** — **ليس «كل الملفات» بشكل عام**؛ **سبب منطقي لأهميته** |
| أسئلة واقعية | 40% | **٣ أسئلة عميل حقيقية** — **الإجابة من المصدر لا تخمين** |

### Confidence close

- **فهمت:** **RAG = ذكاء اصطناعي يجيب من ملفاتك**. **ليس Fine-tuning** — **حقن ملفات وقت السؤال**.
- **تستطيع:** **عندك خريطة تصميم: مصدر + ٣ أسئلة + رد بديل**.
- **التالي:** **Embeddings** — **كيف يجد البحث المعنى لا الكلمة الحرفية**.

---

## 5. Future generation notes

Downstream locales from MSA only. **RAG**, **Fine-tuning**, **chunks**, **Prompt** preserved. RAG diagram = production reference. Deferred: Bunny · Remotion · assistant RAG seed · runtime.

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
| Concept preservation | 5 | RAG, not Fine-tuning only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — prepare files first |
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

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
