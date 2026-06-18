# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m3-l3-cta` |
| **pathId** | `creator` |
| **moduleId** | `creator-m3` |
| **productionTitle (ar-EG)** | CTA: ازاي تخلّي المتفرّج يتحرّك |
| **productionRoute** | `/learn/creator/creator-m3-l3-cta` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m3-l3-cta.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | One CTA matched to one video goal — clear, easy, useful to the viewer |
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
| `creator-m3-l3-cta.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Without CTA viewer closes even after good video — one useful ask matched to goal |
| **Mission rubric** | 50% phrasing clarity · 50% goal alignment |
| **Quiz intent** | Useful how-to best goal is save/share — save and send to someone who needs it (correctIndex 1) |
| **Concepts locked** | CTA, Save/Share CTA, Lead CTA |
| **Prerequisite** | `creator-m3-l2-script-structure` |
| **Next lesson** | `creator-m4-l1-reality-check` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m3-l3-cta
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m3-l3-cta.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: CTA — Move the Viewer
  oneAha: "One CTA matched to one video goal — clear, easy, directly useful to viewer"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m3-l2-script-structure]

objectives:
  - id: obj-1
    statement: Learner explains that each video has one goal and one strong CTA — clear, easy, useful to viewer.
    measurable: true
  - id: obj-2
    statement: Learner writes 3 CTAs (question, save/share, Lead DM) for one idea and picks final with reason.
    measurable: true

concepts:
  - id: concept-cta
    term: CTA
    termEn: Call To Action
    definition: The sentence asking the viewer to take one step after the video.
    mustPreserve: true
  - id: concept-save-share-cta
    term: Save/Share CTA
    termEn: Save/Share CTA
    definition: Ask to save or share when content is reference-worthy and useful later.
    mustPreserve: true
  - id: concept-lead-cta
    term: Lead CTA
    termEn: Lead CTA
    definition: Direct ask that opens conversation with Leads — people who showed interest and may become customers.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Right CTA moves people with one useful step — not generic like please
  - role: tension
    intent: Many asks at once confuse viewer — pressure without value hurts trust
  - role: core
    intent: One video one goal; CTA clear easy useful; audience vs spread vs Lead paths
  - role: comparison
    intent: Generic please vs one intentional step tied to value
  - role: glossary
    intent: CTA, Save/Share CTA, Lead CTA
  - role: video
    intent: Applying CTA practically — production Bunny unchanged
  - role: screenshot
    intent: Visual example of one clear specific CTA
  - role: quiz
    intent: Useful how-to — save/share CTA best (correctIndex 1)
  - role: mission
    intent: 3 CTAs for one idea — question, save/share, Lead DM — pick final
  - role: confidence_close
    intent: One goal one CTA clear value; apply on real video

mission:
  type: practice
  intent: Write 3 CTAs for same content idea — question, save/share, Lead DM — pick final with reason
  rubricIntent:
    - dimension: phrasing_clarity
      weight: 50
      criteria: Each CTA has a clear understandable action verb
    - dimension: goal_alignment
      weight: 50
      criteria: Final choice justified by video goal
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_ctas_for_learner

termsLocked: [CTA, Save/Share CTA, Lead CTA]

links:
  nextLessonId: creator-m4-l1-reality-check
  continuityNote: Reality check next — measure with small data instead of emotional verdicts

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

- **ماذا ستفهم؟** **CTA (طلب واضح للمشاهد)** — إذا **لم يكن موجودًا**، المشاهد **يغلق** — **حتى لو** الفيديو **جيد**.
- **الهدف:** أن تطلب **خطوة واحدة مفيدة** للمشاهد **ولك** — **ليس** مجرد «أعجبني يا جماعة».
- **ماذا بعد الدرس؟** ستكتب **طلبات جاهزة للنشر** تطابق **هدف كل فيديو**.

### Tension — المشكلة

- **الطلبات الكثيرة** **تلخبط** المشاهد.
- «تابعني **و**أعجب **و**علّق **و**شارك **و**احفظ» — **في نفس اللحظة** — ف**غالبًا** لا يفعل **شيئًا**.
- **الضغط** **من دون قيمة** يظهر **بسرعة** — و**يقلّل الثقة** في المحتوى.

### Core idea — اختر CTA واحدًا على قد هدف الفيديو

- **كل فيديو** له **هدف واحد:** **تفاعل**، **حفظ ومشاركة**، أو **محادثة بيع**.
- **CTA (طلب واضح للمشاهد)** **القوي** يجمع **٣** أمور: **واضح**، **سهل التنفيذ**، **وفائدة مباشرة** للمشاهد.
- **هدفك بناء جمهور؟** اسأل **سؤالًا حقيقيًا** يجعل الناس **يردّون بخبرة**.
- **هدفك انتشار مفيد؟** اطلب **حفظًا** أو **مشاركة** **بشكل محدّد** — **Save/Share CTA (طلب حفظ أو مشاركة)**.
- **هدفك Leads (ناس أبدوا اهتمامًا وقد يصبحون عملاء)؟** اطلب **رسالة خاصة** **بكلمة واضحة** **وخطوة بعدها** — **Lead CTA (طلب Leads)**.

### Comparison — رجاء عام أم خطوة مقصودة؟

| الأسلوب المشتت | الأسلوب الذكي |
|----------------|---------------|
| «إن **أعجبك** افعل **كل شيء**» — طلب **عام** **غير مرتبط** بهدف — **نتيجة ضعيفة** | «أرسل لي كلمة **خطة** في **DM (رسالة خاصة)** لأرسل لك **القالب**» — **طلب واحد**، **واضح**، **مربوط بقيمة** |

### Glossary — ٣ مصطلحات تكفي

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **CTA (طلب واضح للمشاهد)** | الجملة التي **تطلب** من المشاهد **خطوة** بعد الفيديو | «اكتب **أكثر تحدٍّ** يقابلك في **أول أسبوع**» |
| **Save/Share CTA (طلب حفظ أو مشاركة)** | طلب **حفظ** أو **مشاركة** عندما يكون المحتوى **مرجعيًا** ومفيدًا **لاحقًا** | «**احفظ** الفيديو **وأرسله** لمن **يستفيد** منه» |
| **Lead CTA (طلب Leads)** | طلب **مباشر** يفتح **محادثة** مع **Leads (ناس أبدوا اهتمامًا)** | «أرسل كلمة **عرض** في **DM** لأرسل لك **التفاصيل**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «تطبيق CTA عملي». **لا يُعاد توليده.** يمكنك تخطّي الفيديو والمتابعة **بالمهمة مباشرة**.

### Screenshot block (intent)

لقطة بصرية — **مثال CTA واضح**. **الطلب واضح ومحدّد:** **خطوة واحدة فقط** — **بلغة بسيطة** يفهمها أي مشاهد **بسرعة**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** إذا كان الفيديو **يشرح طريقة مختصرة مفيدة** — وأنسب **هدف** أن الناس **يرجعون** إليه **لاحقًا** و**يرسلونه** لمن **يحتاجه** — أي **CTA** **أفضل**؟

- خيار ١: «إن **أعجبك** اعمل **إعجاب** و**متابعة** و**تعليق** **الآن**».
- **الإجابة الصحيحة (خيار ٢):** «**احفظ** الفيديو **وأرسله** لشخص **قد يستفيد** منه».
- خيار ٣: «أرسل لي **DM حالًا** لأحجز لك **مكالمة**».

**التفسير:** هذا **CTA** **مرتبط** **بهدف المحتوى** فعلًا: **حفظ ومشاركة** — **من دون ضغط** و**من دون تشتيت**.

### Mission — اكتب ٣ CTAs جاهزين للنشر

**المقدمة:** اكتب **٣ CTAs** **لنفس فكرة محتوى:** **واحد سؤال**، **واحد حفظ أو مشاركة**، **واحد Lead في DM**. الهدف أن **تميّز** بينهم وتختار **الصحيح** حسب **هدفك**.

**التسليم:** فكرة الفيديو · CTA سؤال · CTA حفظ/مشاركة · CTA Lead · أي واحد في النسخة النهائية ولماذا

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح الصياغة | 50% | كل **CTA** فيه **فعل واضح** **ومفهوم** |
| ارتباط بالهدف | 50% | **الاختيار النهائي** **مبرّر** **بهدف الفيديو** |

### Confidence close

- **فهمت:** **هدف واحد** · **CTA واحد** · **قيمة واضحة**.
- **تستطيع:** تنفّذ المهمة على **فيديو حقيقي** — وستلاحظ **فرقًا** في **التفاعل** و**جودة الرسائل**.
- **التالي:** **Reality Check (مراجعة الواقع)** — تقيس **بعقل** **لا بانفعال**.

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
| Concept preservation | 5 | CTA, Save/Share CTA, Lead CTA only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — save/share for reference content |
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
