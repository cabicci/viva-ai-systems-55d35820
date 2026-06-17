# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `business-m3-l1-delegate-or-automate` |
| **pathId** | `business` |
| **moduleId** | `business-m3` |
| **productionTitle (ar-EG)** | Delegate ولا Automate؟ |
| **productionRoute** | `/learn/business/business-m3-l1-delegate-or-automate` |
| **productionFile (read-only)** | `src/components/intro/lessons/business-m3-l1-delegate-or-automate.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Not every task stays with you — repeat work delegates or automates; AI classifies, summarizes, drafts; human keeps high judgment |
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
| `business-m3-l1-delegate-or-automate.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Matrix — keep, delegate, automate with AI, AI + human review; list 5 weekly tasks and classify each |
| **Mission rubric** | 60% logical classification · 40% first step chosen |
| **Quiz intent** | Summarize 15 customer messages each morning — same shape, no pricing decision → automate with AI |
| **Concepts locked** | Delegate, Automate with AI |
| **Prerequisites** | `business-m2-l3-readiness-signals` |
| **Next lesson** | `business-m3-l2-strategic-operational-admin` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: business-m3-l1-delegate-or-automate
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/business-m3-l1-delegate-or-automate.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Delegate or Automate
  oneAha: "Keep / delegate / automate matrix — AI for repeat low-risk; human for judgment"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [business-m2-l3-readiness-signals]

objectives:
  - id: obj-1
    statement: Learner distinguishes keep, delegate, automate with AI, and AI + human review categories.
    measurable: true
  - id: obj-2
    statement: Learner lists 5 weekly tasks, classifies each, and picks one to start next week with reason.
    measurable: true

concepts:
  - id: concept-delegate
    term: Delegate
    termEn: Delegate
    definition: Hand a clear task to a human who executes to your standards.
    mustPreserve: true
  - id: concept-automate-ai
    term: Automate with AI
    termEn: Automate with AI
    definition: AI executes a repeating step — with boundaries and review when needed.
    mustPreserve: true

blocks:
  - role: orientation
    intent: After readiness check — decide what leaves your hands
  - role: tension
    intent: Owner does everything — no time to build
  - role: core
    intent: Matrix — keep rare/sensitive; delegate clear human tasks; automate repeat+data+low risk; AI draft + human approve
  - role: glossary
    intent: Delegate; Automate with AI
  - role: video
    intent: Optional — what leaves your hands — production Bunny unchanged
  - role: comparison
    intent: Everything with you vs smart distribution
  - role: diagram
    intent: Delegate/automate matrix — repetition vs judgment level
  - role: quiz
    intent: Morning message summary — automate with AI, review list
  - role: mission
    intent: Classify 5 weekly tasks; pick one to start
  - role: confidence_close
    intent: Time frees when repeat leaves hands; next = strategic/operational/admin

mission:
  type: practice
  intent: Write 5 weekly tasks; classify each as keep / delegate / automate with AI / AI + human review; pick one to start next week with reason
  rubricIntent:
    - dimension: logical_classification
      weight: 60
      criteria: Five real tasks — each with classification suited to risk and repetition
    - dimension: first_step
      weight: 40
      criteria: One task chosen to start with reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_tasks_or_classifications_for_learner

termsLocked: [Delegate, Automate with AI]

links:
  nextLessonId: business-m3-l2-strategic-operational-admin
  continuityNote: Strategic / Operational / Admin — why admin drowns strategy and where AI helps

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

- **ماذا ستفهم؟** ليست كل مهمة يجب أن تبقى معك — المتكرر يُفوَّض أو يُؤتمت، والذكاء الاصطناعي يصنّف ويلخّص ويكتب مسودات.
- **لماذا الآن؟** بعد أن فحصت جاهزية العمليات، الخطوة التالية: تقرر ما الذي يخرج من يدك.
- **ماذا بعد الدرس؟** ستعدّد ٥ مهام أسبوعية وتصنّفها: احتفظ، فوّض، أتمت بالذكاء الاصطناعي، أو ذكاء اصطناعي + مراجعة بشرية.

### Tension — موقف مألوف

- صاحب عمل يكتب كل رد، يحاسب كل فاتورة، يراجع كل منشور — ثم يتعجب لماذا لا وقت للتوسّع.
- ليست كل مهمة تستحق وقتك. القرارات الاستراتيجية والعلاقات الحساسة — معك. التكرار — للنظام أو للفريق أو للذكاء الاصطناعي.
- الذكاء الاصطناعي يستطيع: يلخّص، يصنّف، يكتب مسودة، يقترح ترتيبًا. الحكم العالي والموافقة النهائية — إنسان.

### Core idea — مصفوفة: احتفظ — فوّض — أتمت

- **احتفظ:** قرارات نادرة، ثقة عالية، علاقة حساسة — لا تسلّمها للذكاء الاصطناعي من دون مراجعة.
- **فوّض:** مهمة واضحة لإنسان — متابعة يومية، تنفيذ ميداني، خدمة عملاء مباشرة.
- **أتمت بالذكاء الاصطناعي:** تكرار + بيانات + مخاطرة منخفضة — تلخيص، قوالب، فرز رسائل.
- **ذكاء اصطناعي + مراجعة بشرية:** الذكاء الاصطناعي يكتب المسودة، أنت توافق قبل الإرسال — مناسب للأسعار والشكاوى.

### Glossary — مصطلحان للتفويض

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Delegate (تفويض)** | تسليم مهمة واضحة لإنسان ينفّذها حسب معاييرك | موظف يرد على استفسارات الشحن — بقالب وافقت عليه |
| **Automate with AI (أتمتة بالذكاء الاصطناعي)** | الذكاء الاصطناعي ينفّذ خطوة متكررة — مع حدود ومراجعة عند الحاجة | تلخيص ٢٠ رسالة واتساب كل صباح في قائمة أولويات |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — ما الذي يخرج من يدك. **لا يُعاد توليده**.

### Comparison — كل شيء معك vs توزيع ذكي

| كل شيء معك | توزيع ذكي |
|------------|-----------|
| ٥ ساعات ردود وإداري. صفر وقت لقرار تسعير أو عرض جديد | الذكاء الاصطناعي يلخّص الرسائل، موظف يتابع التوصيل، أنت ساعة قرارات فقط |

### Diagram block (intent)

مصفوفة التفويض والأتمتة — المحوران: تكرار المهمة ومستوى الحكم. ابدأ بمهمة واحدة في ربع «أتمت بالذكاء الاصطناعي».

### Quiz — تأكيد سريع

**السؤال:** تلخيص ١٥ رسالة عميل كل صباح — نفس الشكل، لا قرار سعر. ما أنسب تصنيف؟

- **الإجابة الصحيحة (correctIndex: 1):** **أتمت بالذكاء الاصطناعي — تلخيص وترتيب، وأنت تراجع القائمة**
- **التفسير:** تكرار + مخاطرة منخفضة = مرشّح قوي للذكاء الاصطناعي. القرارات الحساسة تبقى مع مراجعة.

### Mission — صنّف ٥ مهام أسبوعية

**المقدمة:** اكتب ٥ مهام تعملها كل أسبوع (أو تقريبًا). لكل مهمة حدّد: احتفظ / فوّض / أتمت بالذكاء الاصطناعي / ذكاء اصطناعي + مراجعة بشرية. لا يُطلب تنفيذ — يُطلب قرار توزيع.

**التسليم:** المهام الخمس + تصنيف كل واحدة · المهمة التي ستبدأ بها الأسبوع القادم — ولماذا.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف منطقي | 60% | ٥ مهام حقيقية — كل واحدة بتصنيف مناسب للمخاطرة والتكرار |
| خطوة أولى | 40% | مهمة واحدة مختارة للبداية مع سبب |

### Confidence close

- **فهمت:** الوقت يتحرّر عندما يخرج المتكرر من يدك — والذكاء الاصطناعي أداة في المصفوفة.
- **تستطيع:** تعرف ما تحتفظ به وما تؤتمته أولًا.
- **التالي:** **Strategic / Operational / Admin** — لماذا الإداري والتشغيلي يغرقان الاستراتيجية وكيف يخفّف الذكاء الاصطناعي كل نوع.

---

## 5. Future generation notes

Downstream locales from MSA only. No new delegation frameworks introduced. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Delegate, Automate with AI only |
| Beginner clarity | 4 | Pending read-aloud |
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
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
