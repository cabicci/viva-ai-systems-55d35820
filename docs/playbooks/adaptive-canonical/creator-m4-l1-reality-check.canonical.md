# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m4-l1-reality-check` |
| **pathId** | `creator` |
| **moduleId** | `creator-m4` |
| **productionTitle (ar-EG)** | Reality Check |
| **productionRoute** | `/learn/creator/creator-m4-l1-reality-check` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m4-l1-reality-check.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Consistency and useful repeated tries beat one random viral hit |
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
| `creator-m4-l1-reality-check.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Useful repeated tries matter more than one random win — read early numbers with small data |
| **Mission rubric** | 60% problem clarity · 40% practical decision |
| **Quiz intent** | Trend vs real audience problem — test the one that solves real pain (correctIndex 1) |
| **Concepts locked** | Iteration, Signal, Small Data |
| **Prerequisite** | `creator-m3-l3-cta` |
| **Next lesson** | `creator-m4-l2-mobile-shooting` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m4-l1-reality-check
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m4-l1-reality-check.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Reality Check
  oneAha: "Useful repeated tries with small data beat one random viral moment"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m3-l3-cta]

objectives:
  - id: obj-1
    statement: Learner reframes early low numbers as normal and reads simple signals instead of final verdicts.
    measurable: true
  - id: obj-2
    statement: Learner reviews 5 ideas for real audience problem fit and picks 2 to test this week with reason.
    measurable: true

concepts:
  - id: concept-iteration
    term: Iteration
    termEn: Iteration
    definition: Re-running the same idea with one specific change to learn.
    mustPreserve: true
  - id: concept-signal
    term: Signal
    termEn: Signal
    definition: A small sign that content is genuinely useful.
    mustPreserve: true
  - id: concept-small-data
    term: Small Data
    termEn: Small Data
    definition: Few data points but enough for a simple decision.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Consistency wins not one hit — useful repeated tries beat random viral moment
  - role: tension
    intent: Small early numbers scare — interpreting them as final verdict stops learning
  - role: core
    intent: Ask what first 5 seconds taught; track completion save DMs meaningful comments; iterate one change; build steady system not chase big number
  - role: comparison
    intent: Harsh quick verdict vs smart retest with different angle
  - role: glossary
    intent: Iteration, Signal, Small Data
  - role: video
    intent: How to do Reality Check — production Bunny unchanged
  - role: screenshot
    intent: Simple review of ideas against clear criteria
  - role: quiz
    intent: Trend vs real problem — test real problem idea (correctIndex 1)
  - role: mission
    intent: Review 5 ideas for real audience problem — pick 2 to test
  - role: confidence_close
    intent: Measure with mind not emotion; every try makes decisions clearer

mission:
  type: practice
  intent: Pick 5 ideas and rate each for real audience problem — choose 2 to test this week with reason
  rubricIntent:
    - dimension: problem_clarity
      weight: 60
      criteria: Each idea tied to understandable problem for specific audience
    - dimension: practical_decision
      weight: 40
      criteria: Two ideas chosen for testing with clear reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_ideas_or_ratings_for_learner

termsLocked: [Iteration, Signal, Small Data]

links:
  nextLessonId: creator-m4-l2-mobile-shooting
  continuityNote: Mobile shooting next — practical production skills

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

- **ماذا ستفهم؟** **الاستمرارية** **تكسب** — **ليس الضربة الواحدة**.
- كثيرون يبدأون **بحماس** و**يتوقفون** بسرعة — لأنهم **ينتظرون نتيجة كبيرة** من **أول فيديوين**.
- **القاعدة:** **المحاولات المفيدة المتكررة** **أهم** من **لقطة نجاح عشوائية**.

### Tension — المشكلة

- **أرقام قليلة** في **البداية** **تُخيف**.
- **أول فترة** الأرقام **صغيرة** — وهذا **طبيعي جدًا** حتى للحسابات **الجيدة**.
- الذي **يوقفك** ليس **الواقع** — بل **تفسير الأرقام** على أنها **حكم نهائي**.

### Core idea — اشتغل بتجارب صغيرة وبيانات بسيطة

- بدل «الفيديو **فشل**» — اسأل: **ماذا تعلّمت** من **أول ٥ ثوانٍ**؟
- **ركّز** على **مؤشرات سهلة:** **نسبة إكمال**، **حفظ**، **رسائل خاصة**، أو **تعليق له معنى** — هذه **Signal (إشارة)** أن المحتوى **مفيد فعلًا**.
- **التقدم الحقيقي** يظهر عندما **تكرّر** المحاولة **بنفس الفكرة** مع **تعديل واحد** كل مرة — **Iteration (تكرار محسّن)**.
- **هدفك** في هذه المرحلة **بناء نظام شغل ثابت** — **لا ملاحقة رقم كبير** بسرعة. **Small Data (بيانات صغيرة)** **كافية** لقرار **بسيط**.

### Comparison — حكم سريع أم اختبار ذكي؟

| الأسلوب المرهق | الأسلوب العملي |
|----------------|----------------|
| «الفيديو **لم يجلب** رقمًا كبيرًا — **إذًا** الفكرة **ماتت**» — **تغلق الباب** **قبل** أن **تتعلّم** | «**أعيد** **نفس الفكرة** **بزاوية مختلفة** **وأقيس** **الفرق**» — **تبني معرفة حقيقية** عن **جمهورك** |

### Glossary — ٣ مفاتيح قياس

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Iteration (تكرار محسّن)** | **إعادة تنفيذ** **نفس الفكرة** مع **تعديل محدّد** **للتعلّم** | **نفس الموضوع** — لكن **Hook (خطاف)** **مختلف** |
| **Signal (إشارة)** | **إشارة صغيرة** تقول إن المحتوى **مفيد فعلًا** | تعليق: «**جرّبتها** **ونجحت**» |
| **Small Data (بيانات صغيرة)** | **بيانات قليلة** — لكنها **كافية** **لاتخاذ قرار بسيط** | **أفضل ٢** من **٥ أفكار** من حيث **الإكمال** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تعمل Reality Check (مراجعة الواقع)». **لا يُعاد توليده.** يمكنك تخطّي الفيديو والبدء **بالمهمة مباشرة**.

### Screenshot block (intent)

لقطة بصرية — **شكل مراجعة بسيط للأفكار**. **بدل العشوائية:** انظر **كل فكرة** على **مقياس واضح:** هل **تحل مشكلة حقيقية** **لجمهور واضح**؟ (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** عندك **فكرتان:** **واحدة ترند** **لكن** **لا مشكلة واضحة** فيها — **والثانية** **بحث أقل** **لكن** **تحل وجعًا حقيقيًا** **لجمهورك**. **أيهما** **تختار** **للاختبار الأول**؟

- خيار ١: **الترند** — لأنه **يضمن مشاهدة أعلى**.
- **الإجابة الصحيحة (خيار ٢):** **الفكرة** التي **تحل مشكلة حقيقية** — **حتى لو** **الأرقام أقل**.
- خيار ٣: **أترك الاثنتين** **حتى** **يأتي إلهام جديد**.

**التفسير:** في **Reality Check (مراجعة الواقع)** **نبني** على **المنفعة الحقيقية** — لأن ذلك **يعطيك إشارات مفيدة** **على المدى الطويل**.

### Mission — راجع ٥ أفكار وحدّد المشكلة الحقيقية

**المقدمة:** اختر **٥ أفكار** من التي **في ذهنك** — **قيّم** **كل واحدة** **بسرعة:** هل **تحل مشكلة حقيقية** **لجمهور واضح**؟

**التسليم:** لكل فكرة (١–٥): الفكرة + المشكلة + نعم/لا · في الآخر: **فكرتان** **ستجربهما** **هذا الأسبوع** **ولماذا**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح المشكلة | 60% | **كل فكرة** **مرتبطة** **بمشكلة مفهومة** **لجمهور محدّد** |
| قرار عملي | 40% | **اختيار فكرتين** **للتجربة** **مع سبب واضح** |

### Confidence close

- **فهمت:** **Reality Check** = **تقيس بعقل** **لا بانفعال** — **Small Data** **كافية** **للبدء**.
- **تستطيع:** **مع كل محاولة** **قراراتك** **أسرع** **وأوضح**.
- **التالي:** **Mobile Shooting (التصوير بالجوال)** — **مهارات إنتاج عملية**.

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
| Concept preservation | 5 | Iteration, Signal, Small Data only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — real problem over trend |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
