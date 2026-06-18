# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m9-l3-agents` |
| **pathId** | `builder` |
| **moduleId** | `builder-m9` |
| **productionTitle (ar-EG)** | AI بياخد قرارات لوحده (Agents) |
| **productionRoute** | `/learn/builder/builder-m9-l3-agents` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m9-l3-agents.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Agent = هدف + أدوات (Tools) + حدود — ليس chatbot يكتفي بالكلام |
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
| `builder-m9-l3-agents.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Agent = goal + tools + boundaries; acts not just replies |
| **Mission rubric** | 60% هدف وأدوات · 40% حد أمان |
| **Quiz intent** | search_orders first before create_ticket (correctIndex 0) |
| **Concepts locked** | Agent, Tool |
| **Prerequisite** | `builder-m9-l2-embeddings` |
| **Next lesson** | `builder-m10-l1-deploy-domain` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m9-l3-agents
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m9-l3-agents.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Agents — AI Takes Decisions
  oneAha: "Agent = goal + tools + boundaries — not a chatbot that only talks"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m9-l2-embeddings]

objectives:
  - id: obj-1
    statement: Learner explains Agent as goal + tools + boundaries vs chatbot.
    measurable: true
  - id: obj-2
    statement: Learner designs Agent — goal, 2 tools, 1 out-of-scope boundary.
    measurable: true

concepts:
  - id: concept-agent
    term: Agent
    termEn: Agent
    definition: AI that decides and executes using tools — not just text replies.
    mustPreserve: true
  - id: concept-tool
    term: Tool
    termEn: Tool
    definition: Function the Agent can call — like sendEmail or findOrder.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Agent needs goal + tools + boundary; optional depth
  - role: tension
    intent: AI described solution but did not execute — customer frustrated
  - role: core
    intent: Agent uses tools; boundaries define out-of-scope
  - role: comparison
    intent: Chatbot tells vs Agent does
  - role: glossary
    intent: Agent, Tool
  - role: video
    intent: Think act observe loop — production Bunny unchanged
  - role: screenshot
    intent: Agent loop diagram
  - role: quiz
    intent: search_orders before create_ticket (correctIndex 0)
  - role: mission
    intent: Goal + 2 tools + 1 boundary
  - role: confidence_close
    intent: Next = Deploy

mission:
  type: practice
  intent: Design simple Agent — goal, 2 tools with names, 1 boundary with why — ~10–15 min
  rubricIntent:
    - dimension: goal_tools
      weight: 60
      criteria: Clear one-line goal; two different tools with name and description
    - dimension: safety_boundary
      weight: 40
      criteria: One realistic out-of-scope limit with logical reason
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_agent_code_for_learner

termsLocked: [Agent, Tool, Boundaries, search_orders, create_ticket]

links:
  nextLessonId: builder-m10-l1-deploy-domain
  continuityNote: Deploy — public link and protected secrets

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **الـ Agent (وكيل ذكاء اصطناعي)** **يحتاج هدفًا + أدوات + حدود** — **ليس ردود كلام فقط**.
- **لماذا الآن؟** **RAG جعل الذكاء الاصطناعي يرد من ملفاتك** — **لكن «احجز لي موعدًا» طلب تنفيذ لا معلومة**.
- **ماذا بعد الدرس؟** **ستحدد هدفًا + أداتين + حدًا واحدًا (خارج النطاق)**.
- **عمق اختياري:** **لمن يريد بناء agents**. **يمكنك تخطيه إن كان هدفك استخدام الذكاء الاصطناعي في عملك فقط**.

### Tension — الذكاء الاصطناعي وصف الحل — لكن لم ينفّذ

- **العميل: «أريد إلغاء اشتراكي»**. **الذكاء الاصطناعي: «اذهب إلى Settings → Billing → Cancel»**.
- **العميل أغلق المحادثة غاضبًا** — **أعطيته تعليمات بدل إنهاء المشكلة**.
- **Chatbot يرد**. **Agent ينفّذ** — **لكن بأدوات محددة وحدود واضحة**.

### Core idea — Agent = هدف + أدوات + حدود

- **Agent** = **ذكاء اصطناعي يتخذ قرارات ويستخدم Tools (أدوات/functions)** **للتنفيذ في العالم الحقيقي**.
- **Tools مثل `cancelSubscription` أو `searchOrders`** — **الـ Agent يختار متى يستخدمها**.
- **Boundaries (حدود):** **ما خارج النطاق** — **مثل «لا تمسح بيانات من دون تأكيد» أو «لا تدفع من دون موافقة»**.

### Comparison — Chatbot يقول vs Agent يعمل

| Chatbot — كلام فقط | Agent — تنفيذ |
|--------------------|---------------|
| «لإلغاء الاشتراك، افعل كذا». **العميل ما زال يتحرك بنفسه** | **يستخدم `getSubscription` → يسأل «أكّد الإلغاء؟» → `cancelSubscription`**. **المهمة انتهت في ٢٠ ثانية** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Agent (وكيل)** | **ذكاء اصطناعي يتخذ قرارات وينفّذ** — **ليس ردود كلام فقط** | **يلغي اشتراكًا، يغيّر موعدًا — بنفسه باستخدام أدوات** |
| **Tool (أداة)** | **function في الكود يستدعيها الـ Agent** — **مثل `sendEmail` أو `findOrder`** | **كالشيف يستخدم سكينة** — **الـ Agent يستخدم tool للتنفيذ** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «فكّر، نفّذ، كرّر». **لا يُعاد توليده.**

### Screenshot block (intent)

**دائرة تفكير الـ Agent:**

**Think → Act (أداة) → Observe (النتيجة) → كرّر** حتى تنتهي المهمة. **هذا ما يجعله يحل مشاكل من عدة خطوات**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **عميل لا يجد فاتورته. عندك `search_orders` و `create_ticket`. بماذا يبدأ الـ Agent؟**

- **الإجابة الصحيحة (خيار ١):** **`search_orders` أولًا** — **يجمع معلومات قبل أي إجراء**.
- خيار ٢: **`create_ticket` مباشرة** — **يفتح شكوى فورًا**.
- خيار ٣: **يسأل العميل رقم الفاتورة** — **من دون بحث**.

**التفسير:** **Agent ذكي يجمع المعلومات أولًا** — **كموظف خدمة عملاء** — **قبل التنفيذ**.

### Mission — هدف + ٢ أدوات + ١ حد

**المقدمة:** **صمّم Agent بسيطًا** — **ليس كودًا، تخطيط فقط**. **١٠–١٥ دقيقة**.

**التسليم:** **الهدف (سطر)**، **أداة ١** (اسم، ماذا تفعل)، **أداة ٢**، **حد واحد خارج النطاق** ولماذا.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| هدف وأدوات | 60% | **هدف واضح في سطر**؛ **أداتان مختلفتان — اسم ووصف لكل واحدة** |
| حد أمان | 40% | **حد واحد واقعي (خارج النطاق)**؛ **سبب منطقي للحد** |

### Confidence close

- **فهمت:** **Agent = هدف + tools + حدود** — **ليس chatbot فقط**.
- **تستطيع:** **عندك تصميم Agent بأداتين وحد واحد**.
- **التالي:** **Deploy** — **تطلّع تطبيقك للعالم بلينك عام وأسرار محمية**.

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
| Concept preservation | 5 | Agent, Tool only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — search first |
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
