# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m9-l2-embeddings` |
| **pathId** | `builder` |
| **moduleId** | `builder-m9` |
| **productionTitle (ar-EG)** | إزاي الـ AI بيلاقي المعلومة |
| **productionRoute** | `/learn/builder/builder-m9-l2-embeddings` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m9-l2-embeddings.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Embedding يجد المعنى — ليس الكلمة الحرفية؛ Vector Search يربط أسئلة مختلفة بنفس المقطع |
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
| `builder-m9-l2-embeddings.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Embedding = text to meaning numbers; Vector Search finds similar meaning |
| **Mission rubric** | 50% سؤالين مختلفين · 50% chunk منطقي |
| **Quiz intent** | Embed recipe name + ingredients + steps together (correctIndex 0) |
| **Concepts locked** | Embedding, Vector Search |
| **Prerequisite** | `builder-m9-l1-rag` |
| **Next lesson** | `builder-m9-l3-agents` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m9-l2-embeddings
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m9-l2-embeddings.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Embeddings — How AI Finds Information
  oneAha: "Embedding finds meaning not literal words — Vector Search links different phrasings"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m9-l1-rag]

objectives:
  - id: obj-1
    statement: Learner explains Embedding as meaning map and Vector Search vs literal search.
    measurable: true
  - id: obj-2
    statement: Learner writes 2 questions same meaning different words + expected chunk.
    measurable: true

concepts:
  - id: concept-embedding
    term: Embedding
    termEn: Embedding
    definition: Convert text to numbers representing position on meaning map.
    mustPreserve: true
  - id: concept-vector-search
    term: Vector Search
    termEn: Vector Search
    definition: Find nearest meaning vectors to question — not literal word match.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Embedding finds meaning; 2 different-word questions after; optional depth
  - role: tension
    intent: Literal search fails — «يرد» not in article but topic covered
  - role: core
    intent: Text to vector; similar meaning = close numbers; find nearest chunks
  - role: comparison
    intent: Literal word search vs embedding meaning search
  - role: glossary
    intent: Embedding, Vector Search
  - role: video
    intent: Text to meaning map — production Bunny unchanged
  - role: screenshot
    intent: Embeddings diagram — vectors in space
  - role: quiz
    intent: Recipe name + ingredients + steps for embedding (correctIndex 0)
  - role: mission
    intent: 2 questions same meaning + expected chunk
  - role: confidence_close
    intent: Next = Agents

mission:
  type: practice
  intent: 2 different-word questions same intent + expected chunk + why — ~10 min
  rubricIntent:
    - dimension: two_different_questions
      weight: 50
      criteria: Same meaning different words; not same sentence reordered
    - dimension: logical_chunk
      weight: 50
      criteria: One chunk both should find; short why embedding links them
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_embedding_examples_for_learner

termsLocked: [Embedding, Vector, Vector Search, chunks, RAG]

links:
  nextLessonId: builder-m9-l3-agents
  continuityNote: Agents — AI that acts not just replies

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

- **ماذا ستفهم؟** **Embedding (تحويل الكلام لأرقام تمثّل المعنى)** **يجد المعنى** — **ليس الكلمة الحرفية**.
- **لماذا الآن؟** **RAG يحتاج البحث في ملفاتك** — **والبحث العادي لا يفهم «ماذا تقصد»**.
- **ماذا بعد الدرس؟** **ستكتب سؤالين مختلفين في الكلمات** — **نفس المعنى**.
- **عمق اختياري:** **لمن يريد بناء RAG حقيقي**. **يمكنك تخطيه والعودة لاحقًا**.

### Tension — العميل كتب «كيف يرد الذكاء الاصطناعي؟» — ولا نتائج

- **البحث التقليدي يبحث عن الكلمات حرفيًا**. **«يرد» غير مكتوبة في المقال** — **رغم أن المقال يشرح الموضوع!**
- **المخزن جيد في مقارنة النصوص** — **لكنه لا يفهم أن «يرد» و«يجيب» و«يولّد ردًا» نفس الفكرة**.
- **لكي يعمل RAG صحيحًا**، **نحتاج بحثًا بالمعنى** — **ليس بالحروف**.

### Core idea — Embeddings تجد المعنى — ليس الكلمات

- **Embedding** = **تحويل أي نص لقائمة أرقام تمثّل «مكانه على خريطة المعاني»**.
- **الجمل القريبة في المعنى — أرقامها قريبة**. **«قطة تلعب» و«كلب يجري» أقرب من «البورصة»**.
- **عندما يسأل العميل**، **نحوّل سؤاله إلى Vector (طريقة تخزين المعنى رقميًا)** **ونبحث عن أقرب Chunks (أجزاء صغيرة من المحتوى)** — **حتى لو الكلمات مختلفة**.

### Comparison — بحث حرفي vs بحث بالمعنى

| بحث بالكلمة | embedding |
|-------------|-----------|
| «كيف يرد الذكاء الاصطناعي؟» — **لا تطابق حرفي**. **العميل يظن لا محتوى** | **السؤال يتحول إلى Vector** — **يجد Chunks عن «توليد الرد»**. **نفس المعنى، كلمات مختلفة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Embedding (تحويل الكلام لأرقام تمثّل المعنى)** | **تحويل النص إلى Vector** — **أرقام تصف المعنى على «خريطة»** | **«عربية» → ١٥٣٦ رقمًا يصف المعنى من زوايا مختلفة** |
| **Vector Search (بحث بالمعنى)** | **البحث عن أقرب Vectors للسؤال** — **ليس تطابقًا حرفيًا** | **«وصفات سريعة» يجد «وجبات في ١٥ دقيقة»** — **من دون كلمة «سريعة»** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من نص لخريطة معاني». **لا يُعاد توليده.**

### Screenshot block (intent)

**من نص إلى vector إلى خريطة:**

كل جملة **لها «مكان» على الخريطة**. **المعنى القريب = نقاط قريبة**. **المعنى البعيد = مكان آخر تمامًا**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **مدونة وصفات — العميل يبحث «أكل خفيف وسريع». ما أفضل شيء تعمل له embedding؟**

- **الإجابة الصحيحة (خيار ١):** **اسم الوصفة + المكونات + طريقة التحضير — معًا**.
- خيار ٢: **اسم الوصفة فقط**.
- خيار ٣: **عدد السعرات فقط**.

**التفسير:** **كلما كان السياق أغنى**، **يفهم الـ embedding «خفيف وسريع» أفضل** — **ليس الاسم فقط**.

### Mission — سؤالان — نفس المعنى، كلمات مختلفة

**المقدمة:** **اختبار embeddings: سؤالان مختلفان في الكلمات — نفس القصد**. **١٠ دقائق**.

**التسليم:** **نوع المحتوى**، **سؤال ١**، **سؤال ٢ (نفس المعنى، كلمات مختلفة)**، **الـ chunk المتوقع**، **لماذا يجدانه الاثنان**.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| سؤالان مختلفان | 50% | **نفس المعنى — كلمات مختلفة فعلًا**؛ **ليس نفس الجملة بترتيب مختلف** |
| chunk منطقي | 50% | **chunk واحد يجدهما الاثنان**؛ **شرح قصير لماذا يربطهما embedding** |

### Confidence close

- **فهمت:** **Embeddings = بحث بالمعنى** — **ليس بالكلمة الحرفية**.
- **تستطيع:** **عندك سؤالان للاختبار** — **نفس القصد، كلمات مختلفة**.
- **التالي:** **Agents** — **الذكاء الاصطناعي الذي ينفّذ لا يكتفي بالرد**.

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
| Concept preservation | 5 | Embedding, Vector Search only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — full recipe context |
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
| 6 | Mission rubric 50/50 | ☑ pass |
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
