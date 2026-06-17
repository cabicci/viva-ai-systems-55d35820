# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l3-setup-your-ai` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | افتح أول AI ليك في دقيقتين |
| **productionRoute** | `/learn/intro/intro-m1-l3-setup-your-ai` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l3-setup-your-ai.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.5-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | First real win = open one AI and send one simple message — no complexity |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending** — not approved for production rollout, localization, or controlled batch scale until a named reviewer records scores and checklist sign-off. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `intro-m1-l3-setup-your-ai.ts` (Egyptian blocks + mission) | **Frozen** |
| Bunny video for this lesson | **Frozen** |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner opens one free Chatbot and sends first real message; applies Prompt from prior lesson |
| **Block sequence** | Orientation → tension → core → glossary → video → comparison → screenshot → quiz → mission → confidence close |
| **Mission rubric** | 70% real experience · 30% next step |
| **Quiz intent** | Sara the beginner — best step = open one Chatbot and send simple first message |
| **Concepts locked** | Chatbot, Prompt, ChatGPT, Gemini, Claude, API |
| **Prerequisites** | `intro-m1-l2-first-prompt` |
| **Next lesson continuity** | AI can/cannot — safe use after first real interaction |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production TS.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l3-setup-your-ai
canonicalVersion: 2026-06-04.5-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l3-setup-your-ai.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Setup Your AI
  oneAha: "First win = open one AI + send one simple message"
  difficulty: intro
  estimatedMinutes: 10
  prerequisites: [intro-m1-l2-first-prompt]

objectives:
  - id: obj-1
    statement: Learner opens one free Chatbot and sends a first simple message.
    measurable: true
  - id: obj-2
    statement: Learner identifies one thing to try tomorrow with the same tool.
    measurable: true

concepts:
  - id: concept-chatbot
    term: Chatbot
    termEn: Chatbot
    definition: Page or app where you write a question and AI replies immediately.
    mustPreserve: true

blocks:
  - role: orientation
    intent: First win = open + message; apply Prompt from last lesson hands-on
  - role: tension
    intent: Watching lessons without opening AI = learning to drive without steering wheel
  - role: core
    intent: Simple interface; any free tool works; no API or paid plan needed for start
  - role: glossary
    intent: Chatbot (محادثة AI) — one term only
  - role: video
    intent: Open tool, first message — production Bunny unchanged
  - role: comparison
    intent: Compare-and-wait vs open-and-try today
  - role: screenshot
    intent: All Chatbot UIs similar — text box below, reply above
  - role: quiz
    intent: Beginner Sara — open one Chatbot, send simple message (correctIndex: 0)
  - role: mission
    intent: Open AI, send one message, note first reply, plan tomorrow try
  - role: confidence_close
    intent: First win done; next = what AI can and cannot do safely

mission:
  type: practice
  intent: Open ChatGPT/Gemini/Claude; send one message (prior Prompt or simple question); note reply and next try
  rubricIntent:
    - dimension: real_experience
      weight: 70
      criteria: Opened tool and sent message — or planned attempt (message + tool) if no account yet
    - dimension: next_step
      weight: 30
      criteria: Wrote one thing to try again — even if small
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_mission_message_for_learner

termsLocked: [Chatbot, Prompt, ChatGPT, Gemini, Claude, API]

links:
  nextLessonId: intro-m1-l4-ai-can-cannot
  continuityNote: Next lesson covers what AI can do safely and what needs human verification

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** أول فوز حقيقي = تفتح أداة ذكاء اصطناعي واحدة وترسل رسالة بسيطة — دون تعقيد.
- **لماذا الآن؟** في الدرس السابق تعلمت كتابة **Prompt (طلب أو تعليمات ترسلها للـ AI)** أوضح. اليوم ستجربه بيدك لا على الورق فقط.
- **ماذا بعد الدرس؟** ستكون قد فتحت أداة وأرسلت أول رسالة — وهذا يفتح لك باقي المسار.

### Tension — موقف مألوف

هل تشاهد الدروس دون أن تفتح أداة ذكاء اصطناعي؟

هذا مثل تعلم القيادة دون الجلوس خلف المقود.

إذا لم تكن هناك أداة مفتوحة، كل درس لاحق سيبقى كلامًا جميلًا — لكن ليس مهارة.

هدف هذا الدرس بسيط: تفتح **Chatbot (محادثة AI)** واحدًا وترسل رسالة واحدة اليوم.

### Core idea — الفكرة الأساسية

**افتح واحدًا — جرّب — وقد بدأت**

- الـ Chatbot شكله بسيط: مربع كتابة في الأسفل، والرد يظهر في الأعلى. مثل أي تطبيق محادثة — لكن الطرف الآخر ذكاء اصطناعي.
- لا تحتاج اختيار «الأداة المثالية». ChatGPT أو Gemini أو Claude — أي واحد مجاني يكفي للبداية.
- لا تحتاج **API (وسيلة تخلي برنامجين يتواصلان)** ولا اشتراكًا مدفوعًا. النسخة المجانية كافية لتجارب الدروس الأولى.
- أول رسالة يمكن أن تكون بسيطة: «بماذا تستطيع مساعدتي في عملي؟» أو استخدم الـ Prompt الذي كتبته في الدرس السابق.

### Glossary — مصطلح واحد

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Chatbot (محادثة AI)** | صفحة أو تطبيق تكتب فيه سؤالًا والـ AI يرد عليك فورًا | ChatGPT و Gemini و Claude — كلهم Chatbots بنفس الفكرة |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny قصير — اختيار أداة، فتح حساب، أول رسالة. **لا يُعاد توليده** في هذه المرحلة.

### Comparison — مثال من الحياة

| تقارن وتنتظر | تفتح وتجرّب |
|--------------|-------------|
| تفتح فيديوهات مقارنة وتنتظر «الأفضل». بعد أسبوع: لم ترسل رسالة بعد | تختار ChatGPT أو Gemini، تسجّل دخولًا، وترسل سؤالًا بسيطًا. في دقائق بدأت فعلًا |

### Screenshot block (intent)

ثلاث واجهات Chatbot: مربع كتابة في الأسفل ومحادثة تظهر في الأعلى. الواجهة لا تحتاج شرحًا طويلًا. أول رسالة أهم من اختيار الأداة المثالية.

### Quiz — تأكيد سريع

**السؤال:** سارة مبتدئة ومتوترة من اختيار الأداة. ما أفضل خطوة الآن؟

- **الإجابة الصحيحة (correctIndex: 0):** تفتح Chatbot واحدًا وترسل أول رسالة بسيطة.
- **التفسير:** الهدف ليس اختيارًا مثاليًا. الهدف أول تفاعل حقيقي — وبعدها تتحسّن.

### Mission — مهمتك

**المقدمة:** افتح ChatGPT أو Gemini أو Claude (أي واحد مجاني). أرسل رسالة واحدة — الـ Prompt من الدرس السابق أو سؤال بسيط. إذا لا يوجد حساب: اكتب الرسالة + الأداة — مقبول.

**التسليم:**
1. أي Chatbot فتحت أو ستفتح؟
2. أول رسالة أرسلتها — انسخها كما هي
3. أول رد — لخّصه في سطرين (أو «سأجرب لاحقًا»)
4. شيء واحد ستجربه غدًا

**معايير التقييم (unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تجربة حقيقية | 70% | فتحت أداة وأرسلت رسالة — أو محاولة مخطّطة |
| خطوة تالية | 30% | كتبت شيئًا ستجربه مرة أخرى — حتى لو صغيرًا |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** أول فوز = فتح + رسالة واحدة. لا تحتاج إعدادات معقدة ولا اشتراكًا.
- **تستطيع:** فتح أي AI مجاني وإرسال طلب واضح كما تعلمت — ورؤية الرد.
- **التالي:** في الدرس القادم ستعرف ما يستطيع الـ AI فعله بأمان — وما يجب أن تتحقق منه بنفسك.

---

## 5. Future generation notes

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian directly |
| `en` | This MSA canonical | Egyptian directly |

### Explicitly deferred

- Remotion / Bunny regen · runtime locale switching · mission evaluator changes · replacing Egyptian copy

---

## 6. Localization UX notes

| Priority | Source | Rule |
|----------|--------|------|
| 1 | Explicit user-selected locale | Manual choice always wins |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo available |
| 4 | Default fallback | **Current Egyptian Arabic experience** |

Egyptian remains default. Platform shape unchanged. No silent locale swap.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Chatbot, Prompt, named tools only |
| Beginner clarity | 4 | Simple sentences |
| MSA simplicity | 4 | Neutral MSA |
| Mission consistency | 5 | 70/30 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

### Human reviewer score (required before scale)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| All dimensions | — | **pending** |

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
| 6 | Mission rubric 70/30 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score — scale pass rule | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · final corpus completion batch · Draft only.*
