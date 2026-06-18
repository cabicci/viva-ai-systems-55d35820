# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m5-l1-llm-in-flow` |
| **pathId** | `automator` |
| **moduleId** | `automator-m5` |
| **productionTitle (ar-EG)** | LLM جوه الـ Flow |
| **productionRoute** | `/learn/automator/automator-m5-l1-llm-in-flow` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m5-l1-llm-in-flow.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI step reads, classifies, summarizes — not just moves data |
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
| `automator-m5-l1-llm-in-flow.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Add one AI step; define input, structured output, next step |
| **Mission rubric** | 60% وضوح الخطوة · 40% ربط بالسير |
| **Quiz intent** | Classify message and extract name/requirement — not just faster copy |
| **Concepts locked** | LLM Step, Structured Output, Flow, Trigger |
| **Prerequisites** | `automator-m3-testing-automation` |
| **Next lesson** | `automator-m5-l2-rag-in-n8n` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m5-l1-llm-in-flow
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m5-l1-llm-in-flow.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: LLM in Flow
  oneAha: "AI step reads, classifies, summarizes — not just moves data"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m3-testing-automation]

objectives:
  - id: obj-1
    statement: Add one AI step; define input, structured output, next step
    measurable: true

concepts:
  - id: concept-1
    term: LLM Step
    termEn: LLM Step
    definition: Flow step sending text to AI and returning classification/summary.
    mustPreserve: true
  - id: concept-2
    term: Structured Output
    termEn: Structured Output
    definition: AI responds in fixed fields the next step can read.
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
    intent: Classify message and extract name/requirement — not just faster copy
  - role: mission
    intent: Add one AI step; define input, structured output, next step
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Add one AI step; define input, structured output, next step
  rubricIntent:
    - dimension: step_clarity
      weight: 60
      criteria: Defined input and output — not vague AI understands
    - dimension: flow_link
      weight: 40
      criteria: Clear what happens after AI result in flow
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [LLM Step, Structured Output, Flow, Trigger, Action]

links:
  nextLessonId: automator-m5-l2-rag-in-n8n
  continuityNote: RAG in Automation — answer from your documents not guess

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

- **ماذا ستفهم؟** في **الأتمتة (Automation)** الذكاء الاصطناعي يقرأ ويصنّف ويلخّص — لا ينقل بيانات فقط.
- **لماذا الآن؟** بعد الاختبار، **Flow (تدفق عمل)** جاهز قبل إضافة خطوة ذكاء.
- **ماذا بعد الدرس؟** خطوة **AI** واحدة في **Workflow** — وظيفتها بالضبط.

### Tension — موقف مألوف

- رسالة واتساب طويلة → تُسجَّل في جدول — الفريق يقرأ ويصنّف يدويًا كل يوم.
- **الأتمتة (Automation)** نقلت البيانات — لم تفعل الشغل الذي يستهلك الوقت.

### Core idea — خطوة AI = فهم وكتابة

- قبل: **Trigger (مُشغّل)** → **Action (فعل)** → حفظ. بيانات تتحرك بلا «فهم».
- مع **LLM Step (خطوة ذكاء):** تصنيف، ملخص، مسودة رد — **Structured Output (رد منظم)** للخطوة التالية.
- **AI** لا يستبدل النظام — يضيف خطوة تفكير واحدة.

### Comparison — نقل vs فهم

| نقل فقط | خطوة AI |
|---------|---------|
| رسالة → شيت كما هي — قراءة يدوية | AI يصنّف ويستخرج الاسم → **Flow** يوجّه تلقائيًا |

### Glossary

| **LLM Step (خطوة ذكاء)** | خطوة ترسل نصًا للـ AI وترجع تصنيفًا أو ملخصًا |
| **Structured Output (رد منظم)** | حقول ثابتة — ليس فقرة طويلة |

### Video block (production reference only)

> فيديو Bunny — **AI في السير**. **لا يُعاد توليده**.

### Quiz — تأكيد سريع

- **الإجابة الصحيحة (correctIndex: 1):** تصنيف الرسالة واستخراج الاسم والمطلوب بشكل منظم
- **التفسير:** خطوة AI تضيف فهمًا — لا سرعة نقل فقط.

### Mission — خطوة AI واحدة

| البعد | الوزن |
|-------|-------|
| وضوح الخطوة | 60% |
| ربط بالسير | 40% |

### Confidence close

- **التالي:** **RAG** — الرد من ملفاتك لا من تخمين.

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — not from Egyptian directly. Mission rubric weights and quiz logic preserved. Deferred: Bunny · Remotion · RAG seed · runtime wiring.

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
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
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

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
