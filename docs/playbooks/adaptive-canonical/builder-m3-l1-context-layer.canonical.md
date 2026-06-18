# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m3-l1-context-layer` |
| **pathId** | `builder` |
| **moduleId** | `builder-m3` |
| **productionTitle (ar-EG)** | إيه السياق؟ |
| **productionRoute** | `/learn/builder/builder-m3-l1-context-layer` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m3-l1-context-layer.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Right context at the right time — from the app, not user memory |
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
| `builder-m3-l1-context-layer.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Pass right context at right time so AI replies «for you» not «for anyone» |
| **Mission rubric** | 60% app-passed context · 40% complete prompt |
| **Quiz intent** | Marketing plan — project details first (correctIndex 0) |
| **Concepts locked** | Context, Context Card |
| **Prerequisite** | `builder-m2-l3-style-control` |
| **Next lesson** | `builder-m3-l2-memory-limits` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m3-l1-context-layer
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m3-l1-context-layer.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Context Layer
  oneAha: "Right context at the right time — from the app, not user memory"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m2-l3-style-control]

objectives:
  - id: obj-1
    statement: Learner explains Context as info AI sees before replying; designs app-passed context fields.
    measurable: true
  - id: obj-2
    statement: Learner writes Context for one imagined AI feature — 4 auto fields + full prompt example.
    measurable: true

concepts:
  - id: concept-context
    term: Context
    termEn: Context
    definition: Information AI sees with the question — role, project, stage.
    mustPreserve: true
  - id: concept-context-card
    term: Context Card
    termEn: Context Card
    definition: Fixed summary to start important chats — or app passes automatically.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Right context at right time; write Context for one AI feature after lesson
  - role: tension
    intent: Clear question → dumb reply; AI lacks who/what/budget/platform
  - role: core
    intent: Context definition; app passes context; background before request
  - role: comparison
    intent: Vague content plan vs full project context
  - role: glossary
    intent: Context, Context Card
  - role: video
    intent: Context Layer changes quality — production Bunny unchanged
  - role: screenshot
    intent: Context box before question — assistant knows path/lesson
  - role: quiz
    intent: Marketing plan — project details first (correctIndex 0)
  - role: mission
    intent: One AI feature — 4 auto context fields + full prompt
  - role: confidence_close
    intent: Context from app; next = memory limits

mission:
  type: practice
  intent: Imagine product with one AI feature — write context app must pass automatically — 4 fields + full prompt — ~10–15 min
  rubricIntent:
    - dimension: app_context
      weight: 60
      criteria: Four realistic fields — user does not retype each time; feature clear
    - dimension: complete_prompt
      weight: 40
      criteria: Context before question; expected reply feels personalized
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_context_fields_for_learner

termsLocked: [Context, Context Card, Prompt]

links:
  nextLessonId: builder-m3-l2-memory-limits
  continuityNote: Memory limits — why AI forgets

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

- **ماذا ستفهم؟** **كيف تعطي الذكاء الاصطناعي السياق الصحيح** — **في الوقت الصحيح** — حتى **ترد أي ميزة في منتجك «لك»** **وليس** «**لأي شخص**».
- **لماذا الآن؟** **Prompt (طلب)** و**Style (أسلوب)** **بدون Context (سياق)** = **ردود عامة**. **المستخدم يشعر** أن المساعد «**لا يفهمه**».
- **ماذا بعد الدرس؟** ستكتب **Context** **لميزة ذكاء اصطناعي واحدة** في منتج تتخيله.

### Tension — سؤال واضح — وردّ غبي

- «**اعملي خطة محتوى**» — والرد **خطة عامة منسوخة** **ليست لمشروعك**.
- **المشكلة ليست السؤال** — **المشكلة** أن **الذكاء الاصطناعي لا يعرف**: **من أنت؟** **لمن؟** **بكم؟** **على أي منصة؟**
- في **أي تطبيق فيه ذكاء اصطناعي** — **السياق الذي تمرّره** (ملف المستخدم، المرحلة، آخر إجراء) = **فرق** بين «**مساعد**» و«**حائط**».

### Core idea — السياق الصحيح في الوقت الصحيح

- **Context (السياق)** = **كل المعلومات** التي **يراها الذكاء الاصطناعي قبل أن يرد**: **من أنت**، **ما مشروعك**، **ما الذي حصل قبل ذلك**.
- **تخيّل طبيبًا معه ملفك** **مقابل** **طبيب أول مرة**. **نفس السؤال** — **رد مختلف**.
- في **Builder**: **ليس ضروريًا** أن **المستخدم يكتب السياق كل مرة** — **أنت تمرّره من التطبيق** (صفحة، دور، بيانات).
- **القاعدة:** **خلفية قبل الطلب**. **كلما كان السياق أوضح** — **كلما كان المخرج قابلًا للتنفيذ**.

### Comparison — سؤال عام vs سياق كامل

| بدون سياق | سياق قبل الطلب |
|-----------|----------------|
| «**اعملي خطة محتوى.**» — **الذكاء الاصطناعي يخمّن**. **خطة عامة** — **ليست لمشروعك** | «**أنا صاحب مخبز في القاهرة**، **ميزانية ٢٠٠٠/شهر**، **جمهور نساء ٣٠–٤٥ على انستغرام**. **خطة ٤ أسابيع.**» — **خطة تنفّذها** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Context (السياق)** | **المعلومات التي يراها الذكاء الاصطناعي مع السؤال** — دورك، مشروعك، المرحلة | «**المستخدم في صفحة الدفع**» + «**آخر طلب من ٣ أيام**» |
| **Context Card (بطاقة سياق)** | **ملخّص ثابت تبدأ به أي محادثة مهمة** — **أو التطبيق يمرّره تلقائيًا** | «**أنا [دور] في [مجال]. المشروع: [...]. أحتاج الآن: [...].**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تغيّر Context Layer جودة أي ميزة ذكاء اصطناعي». **لا يُعاد توليده.**

### Screenshot block (intent)

**سياق يظهر قبل السؤال:**

**قبل أن تكتب** — **المساعد يعرف** **في أي مسار** و**أي درس**. **هذا السياق** **يجعل الرد يكمّل رحلتك** — **ليس إجابات عامة**. **نفس الفكرة** في **أي منتج**: **مرّر للذكاء الاصطناعي ما المستخدم «فيه» الآن**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** تريد **ذكاءًا اصطناعيًا يساعدك في خطة تسويق**. **ما أفضل خطوة أولًا؟**

- **الإجابة الصحيحة (خيار ١):** **تعطيه تفاصيل المشروع والعميل والميزانية قبل الطلب**.
- خيار ٢: **تطلب «اكتب خطة تسويق»** وخلاص.
- خيار ٣: **تسأله أسئلة عامة** عن التسويق.

**التفسير:** **الخلفية قبل الطلب** — **هذا ما ستصمّمه** في **أي ميزة ذكاء اصطناعي** في منتجك.

### Mission — Context لميزة AI واحدة

**المقدمة:** **تخيّل منتجًا فيه ميزة ذكاء اصطناعي واحدة** — **واكتب السياق** الذي **يجب أن يمرّره التطبيق**. **١٠–١٥ دقيقة**.

**التسليم:**

1. **الميزة** (مثال: «**اقتراح وجبات**»، «**رد دعم**»، «**تلخيص تقرير**»)
2. **٤ حقول سياق** يمرّرها التطبيق **تلقائيًا**:
   - **من المستخدم** (دور/نوع)
   - **من المشروع/المنتج**
   - **من الجلسة** (آخر إجراء)
   - **من المرحلة** (أي شاشة)
3. **مثال Prompt كامل** (سياق + **سؤال مستخدم قصير**)

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| سياق من التطبيق | 60% | **٤ حقول واقعية** — **ليس** أن **المستخدم يكتبها كل مرة**؛ **الميزة واضحة** |
| Prompt كامل | 40% | **السياق قبل السؤال**؛ **الرد المتوقّع يبدو «مخصّصًا»** |

### Confidence close

- **فهمت:** **Context** = **السياق الصحيح في الوقت الصحيح** — **من التطبيق** **وليس** من **ذاكرة المستخدم**.
- **تستطيع:** **تصميم ٤ حقول سياق** **لأي ميزة ذكاء اصطناعي**.
- **التالي:** **حدود الذاكرة** — **لماذا الذكاء الاصطناعي ينسى**.

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
| Concept preservation | 5 | Context, Context Card only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — project details first |
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
