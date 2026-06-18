# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m3-l2-script-structure` |
| **pathId** | `creator` |
| **moduleId** | `creator-m3` |
| **productionTitle (ar-EG)** | بنية السكريبت الكاملة |
| **productionRoute** | `/learn/creator/creator-m3-l2-script-structure` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m3-l2-script-structure.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Clear script structure — Hook then Value then Proof then one CTA — saves time and focus |
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
| `creator-m3-l2-script-structure.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Script is order not complexity — Hook → Value → Proof → one CTA |
| **Mission rubric** | 50% structure completeness · 50% executability |
| **Quiz intent** | Good info but 4 asks at end — problem is scattered final CTA (correctIndex 1) |
| **Concepts locked** | Value Block, Proof, CTA |
| **Prerequisite** | `creator-m3-l1-hook` |
| **Next lesson** | `creator-m3-l3-cta` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m3-l2-script-structure
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m3-l2-script-structure.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Script Structure
  oneAha: "Hook → Value → Proof → one CTA — clear structure prevents drift during filming"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m3-l1-hook]

objectives:
  - id: obj-1
    statement: Learner explains the four-part script shape — Hook, Value, Proof, single CTA.
    measurable: true
  - id: obj-2
    statement: Learner writes one post or video outline with all four parts present and executable.
    measurable: true

concepts:
  - id: concept-value-block
    term: Value Block
    termEn: Value Block
    definition: The part that delivers the core idea or step directly.
    mustPreserve: true
  - id: concept-proof
    term: Proof
    termEn: Proof
    definition: Simple evidence that the talk is actionable.
    mustPreserve: true
  - id: concept-cta
    term: CTA
    termEn: Call To Action
    definition: One clear ask after the script ends.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Clear script saves time — simple shape Hook Value Proof CTA
  - role: tension
    intent: Improvisation loses the idea — viewer exits before core message
  - role: core
    intent: Hook stops scroll; Value delivers; Proof supports; one CTA only; AI drafts, learner decides tone
  - role: comparison
    intent: Scattered script vs clear structure with one job per part
  - role: glossary
    intent: Value Block, Proof, CTA
  - role: video
    intent: Building script step by step — production Bunny unchanged
  - role: screenshot
    intent: Balanced script parts in short video
  - role: quiz
    intent: Four different asks at end — problem is final CTA (correctIndex 1)
  - role: mission
    intent: One outline with Hook Value Proof CTA — writing practice
  - role: confidence_close
    intent: Clear execution template; apply to more ideas and watch engagement

mission:
  type: practice
  intent: Write one content outline — Hook then Value then Proof then CTA — writing practice, not test
  rubricIntent:
    - dimension: structure_completeness
      weight: 50
      criteria: All four parts present and clear
    - dimension: executability
      weight: 50
      criteria: Outline is direct and easy to turn into real content
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_script_outline_for_learner

termsLocked: [Value Block, Proof, CTA]

links:
  nextLessonId: creator-m3-l3-cta
  continuityNote: Next lesson deepens CTA — one useful ask matched to video goal

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

- **ماذا ستفهم؟** **السكربت (Script)** ليس **تعقيدًا** — هو **ترتيب** يمنع **اللبس** وقت **التصوير**.
- **الشكل البسيط:** **Hook (خطاف)** ثم **قيمة** ثم **دليل** ثم **طلب واحد واضح**.
- **ماذا بعد الدرس؟** ستملك **قالب تنفيذ** ترتّب به أفكارك بسرعة.

### Tension — المشكلة الشائعة

- **الارتجال** يضيع **الفكرة**.
- **من دون بنية:** الفيديو **يطول** و**يضيع** منه **الهدف**.
- المشاهد **غالبًا** يخرج **قبل** أن تصل **رسالتك الأساسية**.

### Core idea — خطاف ثم قيمة ثم دليل ثم CTA

- ابدأ **بجملة** توقف المشاهد — **Hook (خطاف)**.
- بعدها قدّم **القيمة الأساسية** بوضوح — **Value Block (كتلة القيمة)**.
- **ادعم** الكلام **بدليل** أو **مثال واقعي** — **Proof (دليل)**.
- في النهاية **اطلب خطوة واحدة فقط** — **CTA (طلب واضح للمشاهد)**.
- **الذكاء الاصطناعي (AI)** قد يساعدك **ترتّب المسودة** بسرعة — لكن **القرار النهائي** **لنبرة السكربت** و**دقته** يجب أن يكون **منك**.

### Comparison — سكربت مرتب أم كلام مشتت؟

| بدون بنية | ببنية واضحة |
|-----------|-------------|
| **أفكار متداخلة** و**طلبات متعددة** في الآخر — فيضعف **التأثير** | **كل جزء** له **وظيفة** — فيفهم المشاهد بسرعة ويعرف **ماذا يفعل** بعد الفيديو |

### Glossary — ٣ مصطلحات أساسية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Value Block (كتلة القيمة)** | الجزء الذي **يقدّم** الفكرة أو **الخطوة الأساسية** مباشرة | **طريقة مختصرة** تنفّذها **فورًا** |
| **Proof (دليل)** | **دليل بسيط** يثبت أن الكلام **قابل للتطبيق** | **نتيجة رقمية** أو **مثال عملي** |
| **CTA (طلب واضح للمشاهد)** | **طلب واحد واضح** بعد انتهاء السكربت | «جرّب الخطوة **اليوم** وأرسل لي **النتيجة**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «بناء سكربت خطوة بخطوة». **لا يُعاد توليده.** يمكنك تخطّي الفيديو — كل العناصر **مكتوبة للتنفيذ المباشر**.

### Screenshot block (intent)

لقطة بصرية — **شكل السكربت المتوازن**. **التوزيع الواضح** على **أجزاء قصيرة** يجعل السكربت **مركّزًا** و**سهل التنفيذ**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** إذا كان سكربتك فيه **معلومات جيدة** — لكن **النهاية** فيها **٤ طلبات مختلفة** — أين **المشكلة الأساسية**؟

- خيار ١: جزء **الدليل (Proof)**.
- **الإجابة الصحيحة (خيار ٢):** جزء **الطلب النهائي (CTA)** — لأنه **مشتت**.
- خيار ٣: جزء **الخطاف (Hook)**.

**التفسير:** **CTA (طلب واضح للمشاهد)** يجب أن يكون **واحدًا واضحًا** — حتى يعرف المشاهد **الخطوة المطلوبة** **فورًا**.

### Mission — اكتب مخطط بوست أو فيديو واحد

**المقدمة:** المهمة **تدريب كتابة** — **ليس اختبارًا**. اكتب **مخطط محتوى واحد** بالبنية: **Hook → Value → Proof → CTA**.

**التسليم:** الموضوع · Hook · القيمة الأساسية · الدليل · CTA (طلب واحد)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| اكتمال البنية | 50% | **الأجزاء الأربعة** موجودة **وواضحة** |
| قابلية التنفيذ | 50% | المخطط **مباشر** و**سهل** أن يتحوّل إلى **محتوى فعلي** |

### Confidence close

- **فهمت:** **Script Structure (بنية السكربت)** = **Hook → Value → Proof → CTA واحد**.
- **تستطيع:** ترتّب أفكارك بسرعة وتنتج محتوى **أوضح** بثقة أعلى.
- **التالي:** **CTA** بعمق — **طلب واحد مفيد** يطابق **هدف الفيديو**.

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
| Concept preservation | 5 | Value Block, Proof, CTA only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — scattered final CTA |
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
