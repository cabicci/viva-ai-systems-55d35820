# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `creator-m7-l2-grid-consistency` |
| **pathId** | `creator` |
| **moduleId** | `creator-m7-identity` |
| **productionTitle (ar-EG)** | Grid Consistency على الـ Profile |
| **productionRoute** | `/learn/creator/creator-m7-l2-grid-consistency` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m7-l2-grid-consistency.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Simple visual consistency helps strangers understand you in three seconds |
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
| `creator-m7-l2-grid-consistency.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Simple grid rules — similar colors, steady font, clear cover pattern — Visual Checklist before publish |
| **Mission rubric** | 50% checklist quality · 50% improvement plan |
| **Quiz intent** | New visitor confused in 3 seconds → fix visual pattern with checklist (correctIndex 1) |
| **Concepts locked** | Grid Pattern, Cover Consistency, Visual Checklist |
| **Prerequisite** | `creator-m7-l1-brand-basics` |
| **Next lesson** | End of Creator path (`pending-path-validation`) |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m7-l2-grid-consistency
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m7-l2-grid-consistency.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Grid Consistency on Profile
  oneAha: "Simple visual consistency helps strangers understand you in three seconds"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m7-l1-brand-basics]

objectives:
  - id: obj-1
    statement: Learner applies few sustainable grid rules — similar colors, steady font, understandable cover type.
    measurable: true
  - id: obj-2
    statement: Learner builds 6-point Visual Checklist for profile and grid with one fix this week.
    measurable: true

concepts:
  - id: concept-grid-pattern
    term: Grid Pattern
    termEn: Grid Pattern
    definition: Repeating visual arrangement in post layout.
    mustPreserve: true
  - id: concept-cover-consistency
    term: Cover Consistency
    termEn: Cover Consistency
    definition: Steady look of video covers in font and general color.
    mustPreserve: true
  - id: concept-visual-checklist
    term: Visual Checklist
    termEn: Visual Checklist
    definition: Pre-publish review list that ensures identity consistency.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Consistency helps stranger decide fast — grid shows content type before caption
  - role: tension
    intent: Random grid = confused message even if content strong
  - role: core
    intent: Same spirit not copy — few rules you can keep — quality followers not just count
  - role: comparison
    intent: Messy first impression vs clear consistent grid
  - role: glossary
    intent: Grid Pattern, Cover Consistency, Visual Checklist
  - role: video
    intent: Grid understandable in 3 seconds — production Bunny unchanged
  - role: screenshot
    intent: Consistent grid example — message clear before details
  - role: quiz
    intent: Visual pattern plus checklist (correctIndex 1)
  - role: mission
    intent: 6-point profile consistency checklist plus one weekly fix
  - role: confidence_close
    intent: Creator track complete — integrated system from platform to identity

mission:
  type: practice
  intent: Six-point checklist covering visual pattern colors fonts reels covers content clarity intro posts one weekly fix
  rubricIntent:
    - dimension: checklist_quality
      weight: 50
      criteria: Six points clear and actually quick to review
    - dimension: improvement_plan
      weight: 50
      criteria: One specific actionable fix this week
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - build_checklist_for_learner

termsLocked: [Grid Pattern, Cover Consistency, Visual Checklist]

links:
  nextLessonId: pending-path-validation
  continuityNote: End of Creator path — full creator system complete

slugValidation:
  validatedAt: 2026-06-04
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pending-path-validation
  missionRubric: pass
  quizAnswer: pass
```

---

## 4. Arabic MSA canonical lesson text

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **الاتساق يساعد الغريب** **أن يفهمك بسرعة**.
- **أي شخص جديد** **يدخل بروفايلك** **يتخذ قرارًا سريعًا جدًا:** **أيكمل المتابعة أم يمضي**.
- **الاتساق في Grid (الشبكة)** **يقلل الحيرة** — **ويوضّح نوع المحتوى** **قبل أن يقرأ Caption (تعليق) واحدًا**.

### Tension — المشكلة

- **شبكة عشوائية = رسالة مشوشة**.
- **إن كان لكل منشور لون وستايل مختلف** — **يشعر الزائر** **أن الحساب بلا اتجاه** **حتى لو المحتوى قوي**.
- **التشتت البصري** **يجعل المتابع الجديد** **لا يفهم** **بماذا تساعده بالضبط**.

### Core idea — ثبات بسيط يوصل المعنى أسرع

- **الاتساق لا يعني** **أن كل منشور نسخة من الآخر** — **لكنه يعني نفس الروح:** **ألوان قريبة**، **خط ثابت**، **ونوع أغلفة مفهوم**.
- **عندما تكون الشبكة واضحة** — **أي شخص جديد** **يحدّد مجالك وقيمتك بسرعة** — **وهذا يرفع جودة المتابعين** **لا العدد فقط**.
- **ابدأ بقواعد قليلة** **تلتزم بها فعلًا** — **بدل نظام معقّد** **لا يكمل أسبوعين**.

### Comparison — انطباع أولي مشوش أم واضح؟

| شبكة غير متسقة | شبكة متسقة |
|----------------|------------|
| **ألوان وخطوط متغيرة** — **الزائر يغادر بسرعة** **لأنه لا يفهم الخط العام** | **ستايل واضح ومتكرر** — **الزائر يفهم الهوية في ثوانٍ** **ويكون مستعدًا للمتابعة بثقة** |

### Glossary — مصطلحات إدارة الاتساق

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Grid Pattern (نمط الشبكة)** | **الترتيب البصري المتكرر** **في شكل المنشورات** | **تعليمي · قصة · دعوة إجراء** **ثم تكرار نفس الدورة** |
| **Cover Consistency (اتساق الغلاف)** | **ثبات شكل أغلفة الفيديوهات** **في الخط واللون العام** | **نفس الخط** **ونفس مكان العنوان** **في كل غلاف** |
| **Visual Checklist (قائمة مراجعة بصرية)** | **قائمة مراجعة قبل النشر** **تضمن ثبات الهوية** | «**هل اللون والنبرة والغلاف** **مطابقان للنمط؟**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تجعل الشبكة مفهومة في ٣ ثوانٍ». **لا يُعاد توليده.** **خطوات سريعة** **لتثبيت الهوية البصرية** **من دون فقدان المرونة**.

### Screenshot block (intent)

لقطة بصرية — **مثال شبكة متسقة**. **التناسق يجعل الرسالة مفهومة** **حتى قبل قراءة التفاصيل**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** **زائر جديد** **لا يفهم حسابك في أول ٣ ثوانٍ** — **أنسب تحسين أولي؟**

- خيار ١: **أزيد عدد المنشورات فقط**.
- **الإجابة الصحيحة (خيار ٢):** **أثبّت نمطًا بصريًا واضحًا** **وأطبّق checklist قبل النشر**.
- خيار ٣: **أغيّر الهوية كل أسبوع** **لأكون متجدّدًا**.

**التفسير:** **الوضوح يأتي من الثبات**. **checklist بسيطة قبل النشر** **تمنع التشتت** **وتوضّح الهوية أسرع**.

### Mission — اعمل Checklist لاتساق البروفايل

**المقدمة:** **ابنِ checklist سريعة** **تراجع بها البروفايل والشبكة** **قبل أي نشر جديد**.

**التسليم:** ٦ نقاط (نمط بصري · ألوان وخط · أغلفة ريلز · وضوح نوع المحتوى · ٣ منشورات تعرّفك · **تعديل واحد هذا الأسبوع**)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| جودة الـ checklist | 50% | **النقاط الست واضحة** **وقابلة للمراجعة السريعة فعلًا** |
| خطة التحسين | 50% | **تعديل واحد محدد** **وقابل للتنفيذ هذا الأسبوع** |

### Confidence close

- **فهمت:** **وصلت لآخر درس في مسار Creator** — **ولديك الآن نظام متكامل:** **منصة · جدول · تحليل · تحويل · هوية · اتساق**.
- **تستطيع:** **من الآن فصاعدًا** **عملك ليس عشوائيًا** — **أنت تعمل كصانع محتوى واعٍ** **يبني أصلًا طويل المدى**.
- **التالي:** **نهاية مسار Creator** — **استمر بالنظام الذي بنيته**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Grid Pattern**, **Cover Consistency**, **Visual Checklist** preserved as termsLocked. Deferred: Bunny · Remotion · RAG · runtime. Last Creator path lesson — nextLessonId `pending-path-validation`. Mission checklist is learner-built — assistants must not build it for them.

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
| Concept preservation | 5 | Grid Pattern, Cover Consistency, Visual Checklist only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — visual pattern + checklist |
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
| 12 | Slug validation — path end documented | ☑ pending-path-validation |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
