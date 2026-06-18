# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m3-l1-hook` |
| **pathId** | `creator` |
| **moduleId** | `creator-m3` |
| **productionTitle (ar-EG)** | Hook: أول ٣ ثواني |
| **productionRoute** | `/learn/creator/creator-m3-l1-hook` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m3-l1-hook.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | A strong Hook is a fast clear promise — first seconds decide if content gets a chance |
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
| `creator-m3-l1-hook.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Before value lands, viewer must decide to stay — strong Hook gives content a chance |
| **Mission rubric** | 50% format variety · 50% conscious choice |
| **Quiz intent** | Low views with good content — rewrite first sentence clearer and stronger (correctIndex 1) |
| **Concepts locked** | Hook, Pattern Break, Retention Start |
| **Prerequisite** | `creator-m2-l2-content-pillars` |
| **Next lesson** | `creator-m3-l2-script-structure` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m3-l1-hook
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m3-l1-hook.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Hook — First Seconds
  oneAha: "Hook is a fast clear promise — viewer decides in first seconds whether to stay"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m2-l2-content-pillars]

objectives:
  - id: obj-1
    statement: Learner explains that a Hook is a fast promise of benefit or curiosity, not just a pretty sentence.
    measurable: true
  - id: obj-2
    statement: Learner writes 3 different Hooks for one topic and justifies which to try first.
    measurable: true

concepts:
  - id: concept-hook
    term: Hook
    termEn: Hook
    definition: The first sentence or shot that closes the chance of a quick skip.
    mustPreserve: true
  - id: concept-pattern-break
    term: Pattern Break
    termEn: Pattern Break
    definition: An opening different from what is expected that makes the eye stop.
    mustPreserve: true
  - id: concept-retention-start
    term: Retention Start
    termEn: Retention Start
    definition: The share of people who decided to keep watching after the first seconds.
    mustPreserve: true

blocks:
  - role: orientation
    intent: First seconds decide — strong Hook gives rest of content a chance
  - role: tension
    intent: Strong content with weak opening loses the critical first moment
  - role: core
    intent: Hook = fast promise; AI suggests formats; learner chooses for audience tone
  - role: comparison
    intent: Traditional long intro vs direct Hook
  - role: glossary
    intent: Hook, Pattern Break, Retention Start
  - role: video
    intent: Building Hook practically — production Bunny unchanged
  - role: screenshot
    intent: Visual example of attention-grabbing opening
  - role: quiz
    intent: Low views — rewrite first sentence stronger (correctIndex 1)
  - role: mission
    intent: Write 3 Hooks for one topic — writing practice, not test
  - role: confidence_close
    intent: Ready for strong openings; next = full script structure

mission:
  type: practice
  intent: Pick one topic and write 3 different Hooks with final choice and reason — writing practice, not test
  rubricIntent:
    - dimension: format_variety
      weight: 50
      criteria: Three Hooks are genuinely different; each is clear and fast to grasp
    - dimension: conscious_choice
      weight: 50
      criteria: Clear justification for the chosen Hook
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_hooks_for_learner

termsLocked: [Hook, Pattern Break, Retention Start]

links:
  nextLessonId: creator-m3-l2-script-structure
  continuityNote: Next lesson builds full script from start to finish

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

- **ماذا ستفهم؟** قبل أن **تصل القيمة**، يجب أن **يقرّر المشاهد** أن يكمل.
- **Hook (خطاف):** البداية **القوية** هي التي تمنح **بقية المحتوى** فرصة أن «يعيش».
- **ماذا بعد الدرس؟** ستكتب **بدايات** توقف المشاهد وتمنح محتواك فرصة.

### Tension — مشكلة شائعة

- **محتوى قوي** — **وبداية ضعيفة**.
- كثيرون يبدأون **بمقدمة طويلة** — فتضيع **أول لحظة حاسمة**.
- المشاهد **غالبًا** لا يمنح **فرصة ثانية** إذا **لم تشدّه** البداية.

### Core idea — الخطاف وعد سريع وواضح

- **Hook (خطاف)** ليس مجرد **جملة جميلة** — هو **وعد سريع** بفائدة أو **فضول** يجعل المشاهد **يكمل**.
- **الذكاء الاصطناعي (AI)** قد يقترح **صيغًا متعددة** للخطاف — لكن **اختيار** الأنسب **لنبرة جمهورك** و**مساحة الفيديو** يبقى **حكمك**.

### Comparison — مقدمة تقليدية أم خطاف مباشر؟

| بداية تقليدية | خطاف مباشر |
|---------------|------------|
| **تحيات طويلة** وتعريفات — فيتسرّب المشاهد **قبل القيمة** | **سؤال** أو **وعد واضح** من **أول جملة** — فيحدث **توقف** ثم **تكملة** |

### Glossary — ٣ مصطلحات مهمة

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Hook (خطاف)** | **أول جملة** أو **لقطة** تغلق فرصة **التخطّي السريع** | «٣ أخطاء تخسرك العملاء وأنت **لا تنتبه**» |
| **Pattern Break (كسر النمط)** | افتتاحية **مختلفة** عن المتوقّع تجعل **العين** تتوقّف | **نتيجة مفاجئة** قبل الشرح |
| **Retention Start (بداية الاحتفاظ)** | **نسبة** من قرّروا **التكملة** بعد **أول ثوانٍ** | كلما كانت **البداية** أوضح، **زاد الاحتفاظ** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «بناء خطاف عملي». **لا يُعاد توليده.** يمكنك تخطّي الفيديو والبدء بالمهمة — الخطوات **مكتوبة بالكامل** هنا.

### Screenshot block (intent)

لقطة بصرية — **مثال لخطاف ملفت**. الفكرة: **أول ثانية** تكون **مختلفة** و**واضحة** بما يكفي لتمنحك **فرصة**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** إذا كان **نفس المحتوى** يُشاهَد **قليلًا** — أي **تعديل** غالبًا **يرفع** فرصة المشاهدة؟

- خيار ١: **زيادة طول** الفيديو.
- **الإجابة الصحيحة (خيار ٢):** **إعادة كتابة أول جملة** بشكل **أوضح** و**أقوى**.
- خيار ٣: **تغيير اسم الحساب**.

**التفسير:** **أول جملة** تحدّد قرار المشاهد: **يكمل** أم **لا** — فتعزيزها **يؤثر مباشرة** على **Retention Start (بداية الاحتفاظ)**.

### Mission — اكتب ٣ خطافات لنفس الموضوع

**المقدمة:** المهمة **تدريب كتابة** — **ليس اختبارًا**. اختر **موضوعًا واحدًا** واكتب له **٣ خطافات مختلفة**.

**التسليم:** الموضوع · ٣ خطافات (سؤال / رقم أو نتيجة / وعد واضح) · أي خطاف ستجربه أولًا ولماذا

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تنوع الصيغ | 50% | الخطافات **الثلاثة مختلفة فعلًا**؛ كل خطاف **واضح** و**سريع الفهم** |
| اختيار واعٍ | 50% | **تبرير واضح** للخطاف **المختار** |

### Confidence close

- **فهمت:** **Hook (خطاف)** = **وعد سريع** — وليس «جملة حلوة» فقط.
- **تستطيع:** تكتب **بدايات** توقف المشاهد وتمنح محتواك **فرصة**.
- **التالي:** **بنية السكربت (Script Structure)** — كيف تبني **سكربتًا كاملًا** من البداية إلى النهاية.

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
| Concept preservation | 5 | Hook, Pattern Break, Retention Start only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — rewrite first sentence |
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
