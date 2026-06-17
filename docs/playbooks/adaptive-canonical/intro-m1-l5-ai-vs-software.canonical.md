# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l5-ai-vs-software` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | AI مش زي البرامج العادية |
| **productionRoute** | `/learn/intro/intro-m1-l5-ai-vs-software` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l5-ai-vs-software.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Fixed software for exact calculation — flexible AI for language; best results often use both |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending**. Does **not** modify production files, Bunny video, or runtime.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `intro-m1-l5-ai-vs-software.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Learner chooses right tool (AI, Software, or both) for 3 real tasks |
| **Mission rubric** | 70% logical choice · 30% real tasks |
| **Quiz intent** | 200 sales numbers needing exact total = Excel or calculator (correctIndex: 0) |
| **Concepts locked** | Software, AI, Excel |
| **Prerequisites** | `intro-m1-l4-ai-can-cannot` |
| **Next lesson** | `intro-m1-l6-learn-without-fear` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l5-ai-vs-software
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l5-ai-vs-software.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: AI vs Software
  oneAha: "Fixed software for calculation — flexible AI for language; often both"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [intro-m1-l4-ai-can-cannot]

objectives:
  - id: obj-1
    statement: Learner explains Software gives same output for same input; AI varies by context and language.
    measurable: true
  - id: obj-2
    statement: Learner assigns AI, Software, or both to 3 real tasks with reasoning.
    measurable: true

concepts:
  - id: concept-software
    term: Software
    termEn: Software
    definition: Tool with fixed rules — same input yields same output.
    mustPreserve: true
  - id: concept-ai
    term: AI
    termEn: AI
    definition: Language-based assistant that understands your question and responds in context.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Not every task needs AI; choose right tool for 3 tasks after lesson
  - role: tension
    intent: Using AI for everything → strange results; calculator vs AI difference
  - role: core
    intent: Software = fixed (Excel, calendar); AI = flexible language; often combine both
  - role: glossary
    intent: Software (برنامج); AI (ذكاء اصطناعي)
  - role: video
    intent: Fixed vs flexible — production Bunny unchanged
  - role: comparison
    intent: AI for everything vs right tool in right place
  - role: screenshot
    intent: Two columns — fixed programs vs AI language tasks
  - role: quiz
    intent: Exact sales total = Excel/calculator (correctIndex: 0)
  - role: mission
    intent: Choose tool for 3 real tasks with why
  - role: confidence_close
    intent: Software for precision; AI for language; next = learn without fear

mission:
  type: practice
  intent: Pick 3 small real tasks; assign AI / Software / both with one-line why each
  rubricIntent:
    - dimension: logical_choice
      weight: 70
      criteria: 3 tasks with appropriate tool each — even if simple
    - dimension: real_tasks
      weight: 30
      criteria: Tasks from learner's life or work — not empty generic examples
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_tasks_for_learner

termsLocked: [Software, AI, Excel]

links:
  nextLessonId: intro-m1-l6-learn-without-fear
  continuityNote: Next lesson addresses fear and delay — learning without feeling late or non-technical

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

> **Dialect:** Modern Standard Arabic (neutral) · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** ليست كل مهمة تحتاج AI — والبرنامج العادي ليس أضعف، بل مختلف.
- **لماذا الآن؟** في الدرس السابق عرفت متى تثق في الـ AI ومتى تراجع. اليوم ستعرف متى تختار AI أصلًا.
- **ماذا بعد الدرس؟** ستختار الأداة المناسبة لـ ٣ مهام من حياتك — AI، أو **Software (برنامج)**، أو الاثنين معًا.

### Tension — موقف مألوف

هل تستخدم AI في كل شيء — وتتفاجأ عندما تكون النتيجة غريبة؟

الآلة الحاسبة تحسب ٢+٢ = ٤ كل مرة. Excel يجمع نفس الأرقام بنفس النتيجة. هذا **Software** بقواعد ثابتة.

الـ AI يكتب ويفكّر باللغة — الرد قد يختلف قليلًا كل مرة حسب سؤالك.

عندما تخلط بينهما، تسأل في المكان الخطأ وتظن أن «AI لا يعمل». الحل: اختيار الأداة الصحيحة للمهمة.

### Core idea — الفكرة الأساسية

**برنامج ثابت للحساب — AI مرن للكلام**

- **Software ثابت:** آلة حاسبة، Excel، CRM، تقويم، نظام فواتير — نفس المدخل يعطي نفس النتيجة. ممتاز عندما العملية واضحة ومتكررة.
- **AI مرن:** يساعدك في الكتابة، التلخيص، التفكير، المقارنة، الشرح — ممتاز عندما المهمة تحتاج لغة أو حكمًا أو تنويعًا.
- أفضل نتيجة غالبًا من الاثنين: Excel يحسب الأرقام، والـ AI يكتب ملخصًا بسيطًا للإدارة. التقويم يحفظ المواعيد، والـ AI يصوغ رسالة تذكير.
- لا تحتاج فهم برمجة. اسأل: هل المهمة تحتاج دقة ثابتة أم صياغة وتفكيرًا؟

### Glossary — فرق بسيط

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Software (برنامج)** | أداة بقواعد ثابتة — نفس المدخل يعطي نفس النتيجة | Excel يجمع الأرقام. التقويم يحفظ الموعد |
| **AI (ذكاء اصطناعي)** | مساعد باللغة — يفهم سؤالك ويطلع ردًا مناسبًا للسياق | يكتب ٣ صيغًا لبريد أو يلخّص ملاحظاتك |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — برنامج ثابت مقابل AI مرن. **لا يُعاد توليده**.

### Comparison — مثال من الحياة

| AI لكل شيء | كل أداة في مكانها |
|------------|-------------------|
| تطلب منه حساب فاتورة أو رقمًا دقيقًا من الذاكرة — قد تجد فرقًا أو خطأ | Excel أو الآلة للحساب. Google للمصادر. AI للشرح والصياغة والترتيب |

### Screenshot block (intent)

عمود للبرامج الثابتة (حساب، جدولة، أرشفة) وعمود للـ AI (كتابة، تلخيص، أفكار). كثير من العمل الحقيقي يستخدم الاثنين — لا واحدًا فقط.

### Quiz — تأكيد سريع

**السؤال:** لديك ٢٠٠ رقم مبيعات وتريد الإجمالي بالضبط. ما أفضل أداة؟

- **الإجابة الصحيحة (correctIndex: 0):** Excel أو آلة حاسبة.
- **التفسير:** الحساب الدقيق يحتاج برنامجًا ثابتًا. AI يأتي بعدها للملخص إذا احتجت.

### Mission — مهمتك

**المقدمة:** اختر ٣ مهام صغيرة وحقيقية من حياتك أو عملك. حدد لكل واحدة: AI / Software / الاثنين — مع سبب واضح.

**معايير التقييم (unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| اختيار منطقي | 70% | ٣ مهام مع أداة مناسبة لكل واحدة |
| مهام حقيقية | 30% | المهام من حياتك أو عملك — لا أمثلة عامة فارغة |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** البرنامج للدقة والتكرار. الـ AI للغة والأفكار. كثير من العمل يحتاج الاثنين.
- **تستطيع:** النظر لأي مهمة والقول: هل تحتاج حسابًا ثابتًا أم كلامًا أم الاثنين؟
- **التالي:** في الدرس القادم نتحدث عن الخوف والتأخر — وكيف تكمل التعلم دون أن تشعر أنك متأخر أو «غير تقني».

---

## 5. Future generation notes

Downstream locales from MSA only. Quiz correctIndex: 0. Mission 70/30 unchanged. Bunny frozen.

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Always wins |
| 2 | Saved preference | Persisted |
| 3 | Geo suggestion | Suggest only |
| 4 | Default | Egyptian `ar-EG` unchanged |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending review |
| Concept preservation | 5 | Software, AI, Excel only |
| Beginner clarity | 4 | Simple sentences |
| MSA simplicity | 4 | Neutral MSA |
| Mission consistency | 5 | 70/30 matches production |
| Quiz integrity | 5 | correctIndex 0 |
| Assistant boundaries | 4 | Listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| All dimensions | — | **pending** |

| Human reviewer average | **pending** |
| **Production-ready?** | **no** |

### Human reviewer sign-off

| Field | Value |
|-------|-------|
| **Reviewer** | **pending** |
| **Date** | **pending** |
| **Decision** | **pending** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
