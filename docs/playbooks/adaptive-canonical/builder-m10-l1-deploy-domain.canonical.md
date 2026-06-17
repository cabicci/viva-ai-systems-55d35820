# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m10-l1-deploy-domain` |
| **pathId** | `builder` |
| **moduleId** | `builder-m10` |
| **productionTitle (ar-EG)** | Deploy و Domain |
| **productionRoute** | `/learn/builder/builder-m10-l1-deploy-domain` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m10-l1-deploy-domain.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | Deploy = لينك عام — الأسرار في Environment Variables لا في الكود |
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
| `builder-m10-l1-deploy-domain.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Deploy = public URL; secrets in Environment Variables not code |
| **Mission rubric** | 60% تصنيف صح · 40% أولوية الخطر |
| **Quiz intent** | API keys in Production vault not code (correctIndex 0) |
| **Concepts locked** | Deploy, Environment Variables |
| **Prerequisite** | `builder-m9-l3-agents` |
| **Next lesson** | `builder-m10-l2-first-users` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m10-l1-deploy-domain
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m10-l1-deploy-domain.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Deploy & Domain
  oneAha: "Deploy = public link — secrets in Environment Variables not in code"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m9-l3-agents]

objectives:
  - id: obj-1
    statement: Learner explains Deploy as public URL and secrets in server vault not code.
    measurable: true
  - id: obj-2
    statement: Learner lists 3 public vs 3 secret items and identifies most dangerous leak.
    measurable: true

concepts:
  - id: concept-deploy
    term: Deploy
    termEn: Deploy
    definition: Move app from local machine to server with public URL anyone can open.
    mustPreserve: true
  - id: concept-env-vars
    term: Environment Variables
    termEn: Environment Variables
    definition: Server-side secret vault for API keys and database passwords.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Public link + protected secrets; classify public vs secret after
  - role: tension
    intent: App works on localhost — nobody else can open it
  - role: core
    intent: Deploy to server; secrets in Env Vars not GitHub
  - role: comparison
    intent: Secret in code vs secret in vault
  - role: glossary
    intent: Deploy, Environment Variables
  - role: video
    intent: localhost to world — production Bunny unchanged
  - role: screenshot
    intent: Build log — successful deploy
  - role: quiz
    intent: API keys in Production vault (correctIndex 0)
  - role: mission
    intent: List 3 public + 3 secret + most dangerous
  - role: confidence_close
    intent: Next = First users

mission:
  type: practice
  intent: Classify 3 public vs 3 secret items + most dangerous secret + why — ~10 min
  rubricIntent:
    - dimension: correct_classification
      weight: 60
      criteria: 3 public items URL UI content; 3 secrets API keys DB JWT
    - dimension: danger_priority
      weight: 40
      criteria: Most dangerous secret with logical reason money users data
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_deploy_config_for_learner

termsLocked: [Deploy, Environment Variables, localhost, HTTPS, API keys]

links:
  nextLessonId: builder-m10-l2-first-users
  continuityNote: First 10 users — reality teaches more than any plan

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

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **كيف تطلّع تطبيقك بلينك عام** — **وتبقي الأسرار في مكان محمي**.
- **لماذا الآن؟** **بنيت واجهة ومخزنًا وذكاءًا اصطناعيًا** — **لكن ما زال على localhost**. **لا أحد غيرك يستطيع استخدامه**.
- **ماذا بعد الدرس؟** **ستفرّق بين ما هو «عام» (لينك، اسم)** **وما هو «سري» (API keys)**.

### Tension — تطبيق جيد — لكن محبوس على جهازك

- **كل شيء يعمل على `localhost`** — **لكن لا أحد في العالم يستطيع فتحه**.
- **ترسل `localhost:5173` لصديقك** — **لن يفتح عنده**. **التطبيق ما زال فكرة على جهازك**.
- **Deploy (إطلاق)** = **تطلّعه للإنترنت**. **لكن مفتاح OpenAI يجب أن يبقى سريًا** — **ليس في الكود**.

### Core idea — لينك عام + أسرار محمية

- **Deploy** = **الكود يذهب إلى سيرفر** — **الناس تفتحه من URL عام** (مثل `my-app.com`).
- **الأسرار (API keys، مفاتيح المخزن)** **تذهب إلى «خزنة» على السيرفر** — **Environment Variables (متغيرات البيئة)** — **ليس في GitHub**.
- **الفرق:** **ما يراه الناس (لينك، واجهة)** **مقابل ما يجب أن يبقى مخفيًا (مفاتيح)**.

### Comparison — مفتاح في الكود vs مفتاح في خزنة

| سر في الكود | سر في Env Vars |
|-------------|----------------|
| **مفتاح OpenAI في ملف على GitHub** — **أي شخص يراه ويستخدمه على حسابك**. **كارثة مالية وأمان** | **الكود عام — المفاتيح في خزنة السيرفر فقط**. **اللينك عام، الأسرار محمية** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Deploy (إطلاق)** | **نقل التطبيق من جهازك إلى سيرفر** — **URL عام يفتحه أي شخص** | **من localhost → `https://my-ai-app.com`** |
| **Environment Variables (متغيرات البيئة)** | **خزنة أسرار على السيرفر** — **مفاتيح API وكلمات سر المخزن** | **OPENAI_API_KEY في إعدادات Production** — **ليس في الكود** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «من localhost للعالم». **لا يُعاد توليده.**

### Screenshot block (intent)

**سجل البناء — إطلاق ناجح:**

كل deploy = **نسخة جديدة على الإنترنت**. **سجل البناء يوضح ما نجح وما فشل** — **ليس صندوقًا أسود**.

### Quiz — تأكيد سريع

**السؤال:** **التطبيق يعمل على جهازك. ما أخطر شيء قد تنساه قبل الإطلاق؟**

- **الإجابة الصحيحة (خيار ١):** **مفاتيح API في خزنة Production** — **ليس في الكود أو GitHub**.
- خيار ٢: **لون زر «Submit» في الواجهة**.
- خيار ٣: **عدد صفحات 404**.

**التفسير:** **أسرار خاطئة = التطبيق يتعطل أو يُسرق**. **اللينك عام — والأسرار يجب أن تبقى في الخزنة**.

### Mission — قائمة: عام vs سري

**المقدمة:** **قبل Deploy — فرّق ما يراه الناس وما يجب أن يبقى مخفيًا**. **١٠ دقائق**.

**التسليم:** **٣ أشياء عامة**، **٣ أسرار**، **أي سر لو تسرّب يكون الأخطر** ولماذا.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تصنيف صح | 60% | **٣ عامة (URL، واجهة، محتوى عام)**؛ **٣ أسرار (API keys، DB password، JWT secret)** |
| أولوية الخطر | 40% | **أخطر سر بسبب منطقي (أموال، بيانات مستخدمين، ...)** |

### Confidence close

- **فهمت:** **Deploy = لينك عام**. **الأسرار = في خزنة** — **ليس في الكود**.
- **تستطيع:** **عندك قائمة عام vs سري جاهزة قبل الإطلاق**.
- **التالي:** **أول ١٠ مستخدمين** — **الواقع يعلّمك أكثر من أي خطة**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Deploy**, **Environment Variables**, **localhost** preserved. Build log screenshot = production reference. Deferred: Bunny · Remotion · CI deploy · runtime.

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
| Concept preservation | 5 | Deploy, Env Vars only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — API keys in vault |
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
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
