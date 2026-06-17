# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m5-l1-editing` |
| **pathId** | `creator` |
| **moduleId** | `creator-m5-polish` |
| **productionTitle (ar-EG)** | المونتاج — Cut, Caption, Pace |
| **productionRoute** | `/learn/creator/creator-m5-l1-editing` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m5-l1-editing.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Editing clarifies the message — cut what does not serve the core idea |
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
| `creator-m5-l1-editing.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Cut excess, keep clear path — every sentence must serve the idea |
| **Mission rubric** | 50% execution clarity · 50% message improvement |
| **Quiz intent** | Delete line that weakens clarity even if nice (correctIndex 1) |
| **Concepts locked** | Pacing, Cut for Clarity |
| **Prerequisite** | `creator-m4-l3-ai-writing` |
| **Next lesson** | `creator-m4-repurposing` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m5-l1-editing
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m5-l1-editing.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Editing — Cut, Caption, Pace
  oneAha: "Editing clarifies the message — cut what does not serve the core idea"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m4-l3-ai-writing]

objectives:
  - id: obj-1
    statement: Learner asks whether each sentence serves the idea and removes repetition or drift.
    measurable: true
  - id: obj-2
    statement: Learner builds a 6-point editing checklist or applies edits to one short clip with documented cuts.
    measurable: true

concepts:
  - id: concept-pacing
    term: Pacing
    termEn: Pacing
    definition: Speed of transition between sentences and shots in a video.
    mustPreserve: true
  - id: concept-cut-for-clarity
    term: Cut for Clarity
    termEn: Cut for Clarity
    definition: Cut the part that distracts so meaning becomes clearer.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Editing clarifies message not just decorates it
  - role: tension
    intent: Raw cut is scattered — repetition and slow starts lose viewers
  - role: core
    intent: Every sentence serves idea — delete drift, tighten pacing, clear arc
  - role: comparison
    intent: Stacking all clips vs focused message-only shots
  - role: glossary
    intent: Pacing, Cut for Clarity
  - role: video
    intent: Quick edit on short clip — production Bunny unchanged
  - role: screenshot
    intent: Before/after edit timeline — shorter clearer version
  - role: quiz
    intent: Delete non-serving line (correctIndex 1)
  - role: mission
    intent: 6-point checklist OR edit one clip with what was cut/shortened
  - role: confidence_close
    intent: Smart edit shortens distance to viewer — Repurposing next

mission:
  type: practice
  intent: Build 6-point editing checklist OR edit one short piece with documented changes
  rubricIntent:
    - dimension: execution_clarity
      weight: 50
      criteria: Specific steps or documented real edits
    - dimension: message_improvement
      weight: 50
      criteria: Clear that edit made idea easier to understand
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - perform_edit_for_learner

termsLocked: [Pacing, Cut for Clarity]

links:
  nextLessonId: creator-m4-repurposing
  continuityNote: Repurposing next — one idea to multiple formats

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

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **المونتاج يُوضّح رسالتك** — **ليس فقط يجمّلها**.
- **حتى لو الفكرة ممتازة** — **العرض الضعيف** **يُخلي الرسالة تضيع**.
- **المونتاج الصحيح** **يزيل الزوائد** **ويجعل المعنى يصل أسرع وأوضح**.

### Tension — المشكلة

- **النسخة الخام** **غالبًا مشتتة**.
- **كلام مكرّر**، **سكتات طويلة**، **وبدايات بطيئة** **تجعل المشاهد يغادر**.
- **التحرير ليس رفاهية** — **بل وسيلة احترام وقت المتفرّج**.

### Core idea — قص الزائد وخلي المسار واضحًا

- **ابدأ بسؤال بسيط:** **هل كل جملة في الفيديو تخدم الفكرة أم لا؟**
- **احذف** **أي جملة مكرّرة** **أو خروج عن الموضوع** — **Cut for Clarity (قص للوضوح)**.
- **اجعل الإيقاع متماسكًا:** **بداية واضحة**، **نقطة أساسية**، **ثم خاتمة عملية** — **Pacing (إيقاع)** **سليم**.
- **إن كان الصوت أو الصورة** **في جزء معيّن مشتّتين** — **اختصره أو استبدله**.

### Comparison — تكديس لقطات أم رسالة مركّزة؟

| الأسلوب المربك | الأسلوب الواضح |
|----------------|----------------|
| **إضافة كل اللقطات** **من دون فلترة** — **الفيديو يصبح زحمة تفاصيل** | **اختيار اللقطات** **التي تخدم الفكرة فقط** — **المعنى يصل بسرعة وبثقة** |

### Glossary — مصطلحان أساسيان

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Pacing (إيقاع)** | **سرعة انتقال الفيديو** **بين الجمل واللقطات** | **قص السكتة الطويلة** **يُحسّن الإيقاع مباشرة** |
| **Cut for Clarity (قص للوضوح)** | **قص الجزء** **الذي يُشتّت** **حتى يصبح المعنى أوضح** | **حذف جملة جانبية** **لا علاقة لها بالنقطة** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «تحرير سريع على قطعة قصيرة». **لا يُعاد توليده.** **يمكنك تخطّي الفيديو** **وتنفيذ المهمة مباشرة**.

### Screenshot block (intent)

لقطة بصرية — **فرق قبل وبعد التحرير**. **النسخة المعدّلة أقصر وأوضح** — **كل جزء له وظيفة** **ولا حشو يضيع التركيز**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **أثناء مراجعة فيديو قصير** — **وجدت جملة لطيفة** **لكنها لا تخدم الفكرة الأساسية**. **ماذا تفعل؟**

- خيار ١: **أتركها** **لأنها جميلة** **وقد تعجب بعض الناس**.
- **الإجابة الصحيحة (خيار ٢):** **أحذفها** **لأنها تُضعف وضوح الرسالة**.
- خيار ٣: **أكرّرها** **في البداية والنهاية**.

**التفسير:** **التحرير الفعّال** **يُقدّم الوضوح على الزينة** — **كل جملة يجب أن تخدم الهدف**.

### Mission — اعمل Checklist تحرير أو عدّل قطعة واحدة

**المقدمة:** **اختياران عمليان:** **بناء Checklist (قائمة مراجعة) بسيطة للتحرير** — **أو تطبيق التحرير على قطعة قصيرة عندك**.

**التسليم:** مسار Checklist (٦ نقاط) **أو** مسار تطبيق (ما حذفته · ما اختصرته · كيف أصبحت الرسالة أوضح)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح التنفيذ | 50% | **خطوات محددة** **أو تعديلات فعلية موثّقة** |
| تحسّن الرسالة | 50% | **واضح أن التعديل** **جعل الفكرة أسهل للفهم** |

### Confidence close

- **فهمت:** **المونتاج الذكي** **يُختصر المسافة** **بين فكرتك وعقل المشاهد**.
- **تستطيع:** **كل مرة تحرّر بوعي** — **جودة المحتوى وثقتك ترتفعان**.
- **التالي:** **Repurposing (إعادة توظيف)** — **من فكرة واحدة** **لأكثر من شكل محتوى**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Pacing**, **Cut for Clarity** preserved as termsLocked. Deferred: Bunny · Remotion · RAG · runtime. Mission is checklist or documented edit — assistants must not perform the edit for the learner.

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
| Concept preservation | 5 | Pacing, Cut for Clarity only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — delete non-serving line |
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
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
