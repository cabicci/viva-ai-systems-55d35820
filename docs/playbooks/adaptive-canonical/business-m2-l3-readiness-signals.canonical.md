# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `business-m2-l3-readiness-signals` |
| **pathId** | `business` |
| **moduleId** | `business-m2` |
| **productionTitle (ar-EG)** | علامات الجاهزية للتوسع |
| **productionRoute** | `/learn/business/business-m2-l3-readiness-signals` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m2-l3-readiness-signals.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI amplifies a clear process — it does not invent order from chaos; four readiness questions before automation |
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
| `business-m2-l3-readiness-signals.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | AI works best when process is clear — steps, data, repetition, human review boundaries; audit one process with 4 questions |
| **Mission rubric** | 60% honest audit · 40% clear ready/not-ready judgment |
| **Quiz intent** | Price inquiry process with inconsistent style and no price list → not ready; unify template and prices first |
| **Concepts locked** | Process Readiness |
| **Prerequisites** | `business-m2-l2-retention-flow` |
| **Next lesson** | `business-m3-l1-delegate-or-automate` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m2-l3-readiness-signals
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m2-l3-readiness-signals.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Readiness Signals
  oneAha: "Four questions before AI — clear steps, repetition, data, human review"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m2-l2-retention-flow]

objectives:
  - id: obj-1
    statement: Learner states why AI on a chaotic process makes results worse — AI speeds what exists.
    measurable: true
  - id: obj-2
    statement: Learner audits one real process against four readiness questions and gives ready/not-ready judgment with reason.
    measurable: true

concepts:
  - id: concept-process-readiness
    term: Process Readiness
    termEn: Process Readiness
    definition: Process is written, repeatable, and has data — before adding AI or automation.
    mustPreserve: true

blocks:
  - role: orientation
    intent: After retention flow — check process readiness before automation or delegation
  - role: tension
    intent: AI on chaotic process — wrong answers because steps not agreed
  - role: core
    intent: Four questions — clear steps, repeatable, enough data, human review for sensitive decisions
  - role: glossary
    intent: Process Readiness
  - role: video
    intent: Optional — when process is ready for AI — production Bunny unchanged
  - role: comparison
    intent: Chaotic vs ready process — templates and review before send
  - role: diagram
    intent: Readiness check — fix weak point before adding AI
  - role: quiz
    intent: Price inquiry without unified template/prices → not ready
  - role: mission
    intent: Pick one process; answer 4 questions honestly; ready/not-ready judgment
  - role: confidence_close
    intent: AI amplifies clarity; next = delegate or automate

mission:
  type: practice
  intent: Choose one business process; answer 4 readiness questions honestly; state ready or not ready with reason
  rubricIntent:
    - dimension: honest_audit
      weight: 60
      criteria: Real process with answers to all 4 questions — not generic
    - dimension: clear_judgment
      weight: 40
      criteria: Ready or not-ready decision with logical reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_process_or_judgment_for_learner

termsLocked: [Process Readiness]

links:
  nextLessonId: business-m3-l1-delegate-or-automate
  continuityNote: Delegate or Automate — what stays with you vs what leaves your hands

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

- **ماذا ستفهم؟** الذكاء الاصطناعي يعمل أفضل عندما تكون العملية واضحة — خطوات، بيانات، تكرار، وحدود مراجعة.
- **لماذا الآن؟** صمّمت متابعة عملاء. قبل الأتمتة أو التفويض، يجب أن تتأكد أن العملية نفسها جاهزة.
- **ماذا بعد الدرس؟** ستختار عملية واحدة وتفحصها: واضحة؟ متكررة؟ فيها بيانات؟ تحتاج مراجعة بشرية؟

### Tension — موقف مألوف

- كثيرون يقولون «لنجعل الذكاء الاصطناعي يعمل كل شيء» — ثم يكتشفون أن كل رد خاطئ لأن الخطوات غير متفق عليها.
- الذكاء الاصطناعي لا يُصلح فوضى التشغيل. يسرّع عملية موجودة — إذا كانت العملية غير واضحة، يسرّع الخطأ.
- **Process Readiness (جاهزية العملية)** تعني: تعرف الخطوات، تعرف ما البيانات المطلوبة، وتعرف أين يجب أن يراجع إنسان.

### Core idea — ٤ أسئلة قبل أن تضيف الذكاء الاصطناعي

- **الخطوات واضحة؟** — تستطيع كتابة العملية في ٥–٧ خطوات من دون «يعني» و«حسب الموقف».
- **العملية متكررة؟** — تحدث كل أسبوع أو أكثر — ليست حالة فريدة مرة في السنة.
- **في بيانات كافية؟** — أسماء، تواريخ، أسعار، قوالب — الذكاء الاصطناعي يحتاج مدخلات واضحة.
- **المراجعة البشرية؟** — قرارات حساسة (سعر، شكوى كبيرة، عقد) يجب أن يوافق عليها إنسان حتى لو صاغ الذكاء الاصطناعي المسودة.

### Glossary — مصطلح واحد

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Process Readiness (جاهزية العملية)** | العملية مكتوبة ومتكررة وفيها بيانات — قبل إضافة الذكاء الاصطناعي أو أتمتة | متابعة بعد الشراء: يوم ٣ رسالة شكر + قالب جاهز + قائمة عملاء — جاهزة للذكاء الاصطناعي |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — متى العملية جاهزة للذكاء الاصطناعي. **لا يُعاد توليده**.

### Comparison — عملية فوضوية vs عملية جاهزة

| غير جاهزة | جاهزة |
|-----------|-------|
| «نرد على العملاء حسب مزاجنا» — لا قالب، لا توقيت، الذكاء الاصطناعي يُنتج ردودًا متناقضة | ٣ أنواع شكاوى + قالب رد لكل نوع + مراجعة قبل الإرسال — الذكاء الاصطناعي يملأ المسودة وأنت توافق |

### Diagram block (intent)

علامات الجاهزية — فحص بسيط. إذا كانت نقطة ضعيفة في الأسئلة الأربعة — أصلح العملية أولًا، ثم أضف الذكاء الاصطناعي.

### Quiz — تأكيد سريع

**السؤال:** عملية «رد على استفسارات السعر» — كل مرة بأسلوب مختلف ولا قائمة أسعار. هل هي جاهزة للذكاء الاصطناعي؟

- **الإجابة الصحيحة (correctIndex: 1):** **لا — الخطوات والبيانات غير واضحة؛ يجب توحيد القالب والأسعار أولًا**
- **التفسير:** من دون أسعار وقوالب موحّدة، الذكاء الاصطناعي يُنتج ردودًا غير متسقة. الجاهزية = وضوح العملية.

### Mission — فحص جاهزية عملية واحدة

**المقدمة:** اختر عملية واحدة في عملك (متابعة، رد شكاوى، تسعير، تقرير أسبوعي). أجب على الأسئلة الأربعة بصدق — ليس بما تتمنى. لا يُطلب أتمتة — يُطلب تشخيص.

**التسليم:** اسم العملية · وضوح الخطوات · التكرار · البيانات · المراجعة البشرية · حكم جاهزة/غير جاهزة مع السبب.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| فحص صادق | 60% | عملية حقيقية مع إجابات على الأسئلة الأربعة — ليست عامة |
| حكم واضح | 40% | قرار جاهزة/غير جاهزة مع سبب منطقي |

### Confidence close

- **فهمت:** الذكاء الاصطناعي يضاعف عملية واضحة — لا يخترع نظامًا من الفوضى.
- **تستطيع:** تعرف أي عملية تستحق الذكاء الاصطناعي الآن — وأي واحدة تحتاج ترتيبًا أولًا.
- **التالي:** **Delegate (تفويض) ولا Automate (أتمتة)؟** — ما الذي يبقى معك وما الذي تفوّضه أو تؤتمته بالذكاء الاصطناعي.

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
| Concept preservation | 5 | Process Readiness only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 unchanged |
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
| 7 | Quiz unchanged (correctIndex 1) | ☑ pass |
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
