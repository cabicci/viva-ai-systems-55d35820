# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m3-l1-tools-landscape` |
| **pathId** | `automator` |
| **moduleId** | `automator-m3` |
| **productionTitle (ar-EG)** | Make vs n8n vs Zapier |
| **productionRoute** | `/learn/automator/automator-m3-l1-tools-landscape` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m3-l1-tools-landscape.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Tools differ (Zapier, Make, n8n) — thinking stays Trigger → steps → output |
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
| `automator-m3-l1-tools-landscape.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Choose one tool for first automation candidate by volume, budget, complexity — not fame |
| **Mission rubric** | 60% justified choice · 40% understanding thinking |
| **Quiz intent** | Simple form→email workflow + limited budget = Make free tier |
| **Concepts locked** | No-Code, Integration |
| **Prerequisites** | `automator-m2-l3-decide-what-to-automate` |
| **Next lesson continuity** | `automator-m3-l2-triggers-actions` — PATHS sequential next |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m3-l1-tools-landscape
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m3-l1-tools-landscape.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Tools Landscape
  oneAha: "Tools differ — thinking stays Trigger → steps → output in every platform"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [automator-m2-l3-decide-what-to-automate]

objectives:
  - id: obj-1
    statement: Learner compares Zapier, Make, n8n by ease, price, power — same Trigger → steps → output model.
    measurable: true
  - id: obj-2
    statement: Learner picks one tool for first automation candidate with two practical reasons and verbal build plan.
    measurable: true

concepts:
  - id: concept-no-code
    term: No-Code
    termEn: No-Code
    definition: Build virtual worker flows by drag-and-drop — not a programming course.
    mustPreserve: true
  - id: concept-integration
    term: Integration
    termEn: Integration
    definition: Connecting two apps so they exchange data — what the tool does.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Tools differ; pick one for candidate after lesson; Trigger → steps → output unchanged
  - role: tension
    intent: Picking Zapier because famous — $20/month for 5×/month simple task
  - role: core
    intent: Zapier / Make / n8n tradeoffs; choose by volume and complexity not YouTube
  - role: comparison
    intent: Famous tool vs right-size Make for simple workflow
  - role: glossary
    intent: No-Code (من غير كود); Integration (ربط)
  - role: video
    intent: Optional Zapier vs Make vs n8n — production Bunny unchanged
  - role: screenshot
    intent: Layered automation — same idea in any tool
  - role: quiz
    intent: Simple form→email + limited budget = Make
  - role: mission
    intent: Pick one tool for first candidate — 2 reasons + alternate + verbal Trigger → output plan
  - role: confidence_close
    intent: Tool chosen; next = Triggers + Actions

mission:
  type: practice
  intent: Take first automation candidate from prior lesson; choose one tool (Zapier/Make/n8n/other) with 2 reasons, alternate with why, and verbal build plan — 10 min, no Flow build required
  rubricIntent:
    - dimension: justified_choice
      weight: 60
      criteria: Tool tied to specific candidate; two practical reasons not just "easiest"
    - dimension: thinking_understanding
      weight: 40
      criteria: Alternate with reason; build plan describes Trigger → output
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - pick_tool_for_learner_without_learner_context

termsLocked: [No-Code, Integration, Zapier, Make, n8n, Trigger, workflow]

links:
  nextLessonId: automator-m3-l2-triggers-actions
  continuityNote: Triggers + Actions — build blocks of any Flow

slugValidation:
  validatedAt: 2026-06-04
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pass
  missionRubric: pass
  quizAnswer: pass
```

> **Slug note:** PATHS sequential next after `automator-m3-l1` is `automator-m3-l2-triggers-actions` — recorded in §3 YAML and slugValidation.

---

## 4. Arabic MSA canonical lesson text

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** الأدوات مختلفة — Zapier، Make، n8n — لكن التفكير واحد: **مُشغّل (Trigger)** → خطوات → **نتيجة (Output)**.
- **لماذا الآن؟** بعد أن اخترت أول مهمة للأتمتة، تحتاج أداة تناسب حجمك — وليس أشهر اسم.
- **ماذا بعد الدرس؟** ستختار أداة واحدة لمرشّح الأتمتة — ولماذا.

### Tension — موقف مألوف

- «Zapier أشهر» — وبعد شهر الاشتراك غالٍ.
- تختار أداة لأنها مشهورة — أو لأنها مجانية — دون أن تسأل: كم مهمة/شهر؟ هل تحتاج منطقًا أم خطوات بسيطة؟
- الأداة ليست الهدف. الهدف = العامل الافتراضي ينفّذ النمط الذي اخترته.
- اختيار خاطئ = وقت ضائع في التعلّم — وليس في توفير الوقت.

### Core idea — الأدوات مختلفة — التفكير واحد

- **Zapier** — ربط جاهز؛ راجع المزايا المطلوبة وحدود الخطة. تعتمد التكلفة على الخطة والاستخدام.
- **Make** — سيناريوهات مرئية؛ قارن المزايا والحدود والاستخدام بدل افتراض أنه أقل تكلفة.
- **n8n** — الكود متاح بنموذج fair-code؛ تخضع الاستضافة الذاتية للإصدار وشروط الترخيص المطبقة، ولا يوصف هنا بأنه مفتوح المصدر.
- **القاعدة:** اختر وفق المهمة والحجم والتعقيد. قارن خطط Free والمدفوعة والربط المطلوب. يختلف تعريف task في Zapier عن credit في Make؛ لا تفترض تساويهما.


### Comparison — اختيار بالشهرة vs اختيار بالحجم

| اختيار بالشهرة | اختيار حسب المتطلبات |
|---|---|
| مثال افتراضي: اختارت نور خطة مدفوعة بقيمة٢٠ دولارًا شهريًا لخمس مرات «نموذج → بريد» دون فحص الحاجة للمزايا المدفوعة. هذا اختيار خطة وليس سعرًا لازمًا للمهمة. | تفحص نور أولًا خطتي Free في Zapier وMake وفق الربط والخطوات والتكرار والحجم، ثم تقارن المدفوع عند الحاجة. لا يمثل المثال اختبارًا فعليًا لأي ربط أو خطة. |


### Glossary — مصطلحان للأدوات

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **No-Code (من غير كود)** | أدوات تبني فيها العامل الافتراضي بسحب وإفلات — وليس دورة برمجة | Make: نموذج → جدول → واتساب |
| **Integration (ربط)** | توصيل برنامجين ليتبادلا بيانات — هذا ما تفعله الأداة | Google Forms ↔ Google Sheets |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — Zapier vs Make vs n8n: متى تستخدم كل واحدة. **لا يُعاد توليده**.

### Screenshot block (intent)

أي أداة أتمتة = طبقات: شيء يدخل (**مُشغّل**) → خطوات → شيء يخرج. Zapier و Make و n8n نفس الفكرة — اختلاف في السهولة والسعر والقوة.

### Quiz — تأكيد سريع

**السؤال:** تحتاج مسار «نموذج → بريد ترحيب» بسيطًا نحو٢٠ مرة شهريًا بميزانية محدودة. ما التصرف الأنسب قبل اختيار الأداة؟

1. قارن خطتي Free وفق الربط والخطوات والتكرار وتعريف الاستخدام، ثم اختر خطة تلبي المتطلبات.
2. ابدأ باستضافة n8n ذاتيًا لمجرد إتاحة الكود، قبل فحص الإعداد والصيانة.
3. اشترِ خطة Zapier مدفوعة لشهرة الاسم، قبل فحص الحاجة للمزايا المدفوعة.

**التفسير:** تحدد المتطلبات الاختيار. افحص خطتي Free وحدودهما وادفع عند الحاجة. لا يثبت عدد التشغيلات وحده أن أداة أقل تكلفة دائمًا أو الوحيدة المجانية.

**correctIndex:** 0 (unchanged)


### Mission — اختر أداة واحدة — ولماذا

**المقدمة:** خذ مرشّح الأتمتة الأول من الدرس السابق — واختر أداة واحدة (Zapier / Make / n8n / غيرها). ١٠ دقائق كافية — لا يلزم بناء **تدفق عمل (Flow)**.

**التسليم:** مرشّح الأتمتة · الأداة المختارة · سببان للاختيار · بديل ولماذا · خطة بناء (**مُشغّل → خطوات → نتيجة** بالكلام)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| اختيار مبرّر | 60% | أداة مربوطة بمرشّح محدّد؛ سببان عمليان — وليس «أسهل» فقط |
| فهم التفكير | 40% | بديل مع سبب؛ خطة بناء تصف **مُشغّل → نتيجة** |

### Confidence close

- **فهمت:** الأدوات مختلفة — التفكير (**مُشغّل → خطوات → نتيجة**) واحد في الجميع.
- **تستطيع:** لديك أداة مختارة لمرشّح الأتمتة الأول — جاهزة للتصميم.
- **التالي:** **Triggers + Actions (المُشغّلات والأفعال)** — لبنات أي **تدفق عمل (Flow)**.

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
| Concept preservation | 5 | No-Code, Integration; Zapier/Make/n8n from production |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Make answer unchanged |
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
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
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


Audit57/122 correction (2026-10-18): license description and plan-dependent comparison checked against official vendor references; quiz key remains0. Agent-reviewed draft, human language/live acceptance pending.
