# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m3-l3-filters-routers` |
| **pathId** | `automator` |
| **moduleId** | `automator-m3` |
| **productionTitle (ar-EG)** | Filters & Routers |
| **productionRoute** | `/learn/automator/automator-m3-l3-filters-routers` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m3-l3-filters-routers.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Filter = gate (pass/stop). Router = fork (different paths by condition) |
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
| `automator-m3-l3-filters-routers.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Automation useful when path chosen by condition; add one if/then to workflow |
| **Mission rubric** | 50% clear condition · 50% different paths |
| **Quiz intent** | Purchase value splits to two email paths = Router (not Filter stop or single path) |
| **Concepts locked** | Filter, Router |
| **Prerequisites** | `automator-m3-l1-tools-landscape` (batch; m3-l2 canonical exists separately) |
| **Next lesson** | `automator-m4-l1-connect-database` (PATHS order after m3 module) |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m3-l3-filters-routers
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m3-l3-filters-routers.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Filters and Routers
  oneAha: "Filter = gate pass/stop; Router = fork to different paths by condition"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m3-l1-tools-landscape]

objectives:
  - id: obj-1
    statement: Learner distinguishes Filter (gate) from Router (fork) and when each applies.
    measurable: true
  - id: obj-2
    statement: Learner designs one if/then for a repeating workflow with testable condition and distinct then/else paths.
    measurable: true

concepts:
  - id: concept-filter
    term: Filter
    termEn: Filter
    definition: Gate — condition met → pass; else → stop workflow.
    mustPreserve: true
  - id: concept-router
    term: Router
    termEn: Router
    definition: Fork — same trigger, different paths by condition.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Route by condition; add one if/then after lesson
  - role: tension
    intent: Same reply to all WhatsApp messages — angry customer; workflow has no decision
  - role: core
    intent: Filter vs Router; one clear if/then; start with one branch not ten
  - role: comparison
    intent: Single path vs one if/then by message type
  - role: glossary
    intent: Filter (فلتر); Router (موزّع)
  - role: video
    intent: Optional Filter vs Router — production Bunny unchanged
  - role: screenshot
    intent: Same trigger — different paths by choice
  - role: quiz
    intent: Purchase value → two email paths = Router
  - role: mission
    intent: Design one if/then for repeating workflow — condition + then + else + input examples
  - role: confidence_close
    intent: One if/then ready; next = Connect Database

mission:
  type: practice
  intent: Pick repeating workflow; add one if/then that changes path or stops execution — design only; AI may suggest wording, learner chooses final — 10–15 min
  rubricIntent:
    - dimension: clear_condition
      weight: 50
      criteria: One specific if/then not vague; condition testable yes/no
    - dimension: different_paths
      weight: 50
      criteria: then and else do different things; one input example per path
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_workflow_or_condition_for_learner

termsLocked: [Filter, Router, workflow, Trigger, if/then]

links:
  nextLessonId: automator-m4-l1-connect-database
  continuityNote: Connect Database — automation stores organized data not just replies

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

- **ماذا ستفهم؟** الأتمتة تصبح مفيدة عندما تختار **المسار** الصحيح حسب الشرط — وليس عندما يمرّ كل شيء في خط واحد.
- **لماذا الآن؟** بعد **المُشغّلات (Triggers)** و**الأفعال (Actions)**، تحتاج التفريق: استفسار سعر ≠ شكوى ≠ متابعة — ولكل واحد رد مختلف.
- **ماذا بعد الدرس؟** ستضيف if/then واحدًا لـ **مسار عمل (workflow)** لديك: إذا [شرط] → [مسار أو فعل].

### Tension — موقف مألوف

- «نفس الرد لكل الرسائل» — والعميل غاضب.
- لديك أتمتة ترد على رسائل واتساب. أحد يسأل عن السعر — يصله «شكرًا لتواصلك». أحد يشتكي — نفس الرد.
- الشغل المتكرر ليس المشكلة — المشكلة أن **مسار العمل (workflow)** بلا قرار: كل شيء في نفس المسار.
- العامل الافتراضي يحتاج أن يعرف: متى أكمل؟ متى أوقف؟ متى أذهب لمسار آخر؟ — هذا عمل **الفلتر (Filter)** و**الموزّع (Router)**.

### Core idea — Filter = بوابة. Router = مفترق طرق

- **Filter (فلتر):** إذا تحقّق الشرط → البيانات تمر. إذا لا → **مسار العمل (workflow)** يتوقف هنا. مثال: «إذا وُجد رقم هاتف → تابع».
- **Router (موزّع):** نفس **المُشغّل (Trigger)**، لكنه يتفرّع إلى مسارات حسب الشرط. مثال: سعر → مسار مبيعات. شكوى → مسار دعم.
- if/then واحد يغيّر تجربة العميل — من رد عام إلى رد مناسب للحالة.
- ابدأ بشرط واحد واضح — وليس ١٠ فروع من أول يوم.

### Comparison — مسار واحد vs مسار حسب الحالة

| مسار واحد لكل شيء | if/then واحد |
|-------------------|--------------|
| كل lead يأخذ نفس البريد ونفس الرد — العميل الذي يشتكي يشعر أنك لا تسمعه. | إذا الرسالة فيها «سعر» → أرسل قائمة أسعار. غير ذلك → حوّل للدعم. كل حالة ردها مناسب. |

### Glossary — مصطلحان للمسارات

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Filter (فلتر)** | بوابة: الشرط تحقّق → يمر. لا → يتوقف | إذا لا يوجد بريد في النموذج → لا تكمل التسجيل |
| **Router (موزّع)** | مفترق طرق: نفس **المُشغّل**، مسارات مختلفة حسب الشرط | VIP → رسالة خاصة. عميل جديد → رسالة ترحيب |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تضيف if/then لـ **مسار العمل (workflow)**: متى Filter ومتى Router. **لا يُعاد توليده**.

### Screenshot block (intent)

نفس الحدث (مستخدم دخل) — لكن المسار يتغيّر حسب الاختيار. نفس الفكرة في عملك: lead جديد → مسار. شكوى → مسار آخر.

### Quiz — تأكيد سريع

**السؤال:** عميل اشترى فوق ٥٠٠٠ جنيه → بريد شكر خاص. تحت ٥٠٠٠ → بريد عادي. ما الأنسب؟

- **الإجابة الصحيحة (correctIndex: 0):** **Router يفرّق حسب قيمة الشراء — مساران مختلفان**
- **التفسير:** تحتاج مسارين مختلفين حسب الشرط — هذا **Router**. **Filter** يوقف أو يمرّر، ولا يوزّع.

### Mission — أضف if/then واحد لـ workflow

**المقدمة:** المهمة تصميم — وليس بناء إلزامي. اختر **مسار عمل (workflow)** متكررًا وأضف شرطًا واحدًا يغيّر المسار أو يوقف التنفيذ. يمكن للذكاء الاصطناعي اقتراح صياغة — أنت تختار النهائي.

**التسليم:** **مسار العمل (workflow)** · **المُشغّل (Trigger)** · if/then (شرط، then، else) · مثال input لكل مسار

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| شرط واضح | 50% | if/then واحد محدّد — وليس كلامًا عامًا؛ الشرط قابل للاختبار (نعم/لا) |
| مسارات مختلفة | 50% | then و else يفعلان شيئًا مختلفًا فعلًا؛ مثال input لكل مسار |

### Confidence close

- **فهمت:** الأتمتة تصبح أذكى عندما تختار المسار حسب الشرط — **Filter** يوقف أو يمرّر، **Router** يوزّع.
- **تستطيع:** لديك if/then واحد جاهز لإضافته لـ **مسار عمل (workflow)** حقيقي.
- **التالي:** **Connect Database** — عندما تحفظ الأتمتة بيانات منظمة وليس فقط ترد.

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
| Concept preservation | 5 | Filter, Router locked |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Router answer unchanged |
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
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 50/50 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed (next = m4-l1 per PATHS) | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
