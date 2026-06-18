# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `intro-m1-l1-what-is-ai` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | AI يعني إيه فعلًا؟ |
| **productionRoute** | `/learn/intro/intro-m1-l1-what-is-ai` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l1-what-is-ai.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | AI is a helpful tool — takes your request and returns a response; not magic |
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
| `intro-m1-l1-what-is-ai.ts` (Egyptian blocks + mission) | **Frozen** — production source of truth for default UX |
| Bunny video for this lesson | **Frozen** — existing playback unchanged |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** — localization layers on top later |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner understands AI is a helper tool (not magic); tries one simple AI task from daily life |
| **Block sequence** | Orientation → tension → core idea → glossary → video → comparison → screenshot → quiz → mission → confidence close |
| **Mission rubric** | 70% tried yourself · 30% observation from you |
| **Quiz intent** | Best start = open ChatGPT or Gemini and try something simple from your day |
| **Concepts locked** | AI, Model, ChatGPT, Gemini, Claude |
| **Next lesson continuity** | First Prompt lesson — practical writing after understanding the tool |

### Derivation method

1. Read Egyptian production TS blocks (read-only).
2. Extract objectives, block roles, mission intent, rubric weights, quiz answer key.
3. Normalize learner-facing prose to **neutral Arabic MSA** — same meaning, no Egyptian dialect surface forms.
4. Do **not** write back to production or generate locale packages in this phase.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l1-what-is-ai
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l1-what-is-ai.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: What Is AI
  oneAha: "AI is a helpful tool — request in, response out — not magic"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner can explain AI as a helper tool that takes a request and returns a response.
    measurable: true
  - id: obj-2
    statement: Learner tries one simple AI task from daily life and notes what happened.
    measurable: true

concepts:
  - id: concept-ai
    term: AI
    termEn: Artificial Intelligence
    definition: Software that helps with a specific task — writing, summarizing, organizing ideas.
    mustPreserve: true
  - id: concept-model
    term: Model
    termEn: Model
    definition: The ready-made program you talk to (ChatGPT, Gemini, Claude).
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you'll learn; why now (everyone talks about AI); try one small thing after
  - role: tension
    intent: Hearing about AI without knowing where to start — no expert required today
  - role: core
    intent: AI = helper tool like calculator; doesn't think like human; try beats long explanation
  - role: glossary
    intent: AI (ذكاء اصطناعي); Model (موديل) — English terms explained once
  - role: video
    intent: Same idea in two minutes — production Bunny unchanged
  - role: comparison
    intent: Wrong understanding (expect mind-reading) vs right (clear request, iterate)
  - role: screenshot
    intent: Simple loop — question → response → adjust
  - role: quiz
    intent: Best start today = open AI and try simple daily task
  - role: mission
    intent: Try AI on one small real thing; note what happened
  - role: confidence_close
    intent: AI = helper tool; next = first clear Prompt

mission:
  type: practice
  intent: Open any free AI; request something small from your day; write what happened (or planned attempt if no account yet)
  rubricIntent:
    - dimension: tried_yourself
      weight: 70
      criteria: Clear request sent to AI with response seen — or planned attempt (request + tool) if no account yet
    - dimension: observation
      weight: 30
      criteria: Wrote something simple about the experience — even if response was imperfect
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_mission_topic_for_learner

termsLocked: [AI, Model, ChatGPT, Gemini, Claude]

links:
  nextLessonId: intro-m1-l2-first-prompt
  continuityNote: Next lesson teaches first clear Prompt — first practical step after understanding the tool

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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine for Gulf, English, and future locales · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** الـ **AI (ذكاء اصطناعي)** ليس سحرًا — هو أداة تأخذ طلبًا منك وترجع ردًا. مثل مساعد ذكي على الهاتف.
- **لماذا الآن؟** الجميع يتحدث عن الذكاء الاصطناعي، وطبيعي أن تشعر أن الموضوع كبير. هذا الدرس يفكّكه لك في خطوات بسيطة دون تعقيد.
- **ماذا بعد الدرس؟** ستجرب أداة ذكاء اصطناعي واحدة في شيء صغير من يومك — وتصبح واثقًا أنك تستطيع إكمال باقي المسار.

### Tension — موقف مألوف

هل تسمع عن الذكاء الاصطناعي كثيرًا ولا يتضح لك من أين تبدأ؟

طبيعي. بعض الناس يقولون «استخدم ChatGPT» دون أن يشرحوا لك ما هو أصلًا.

لا يُطلب منك أن تكون خبيرًا اليوم. المطلوب فقط أن تفهم الفكرة الأساسية وتجربها مرة واحدة بيدك.

إذا شعرت أن الكلام كثير، خذها خطوة بخطوة — كل قسم صغير ولوحده.

### Core idea — الفكرة الأساسية

**الـ AI أداة مساعدة — ليس سحرًا ولا بديلًا عنك**

- الـ AI برنامج تعلّم من أمثلة كثيرة، ويُعطيك ردًا قريبًا مما طلبته. مثل الآلة الحاسبة: يوفر وقتًا، لكن القرار في يدك.
- لا يفكّر كالإنسان — يحسب أنسب رد مما رآه من قبل. لذلك يخطئ أحيانًا، وهذا طبيعي.
- ما يهمك ليس أن تفهم كل التفاصيل التقنية — بل أن تفتح أي أداة وتجرب طلبًا بسيطًا. التجربة تعلّمك أسرع من أي شرح طويل.

### Glossary — مصطلحان أساسيان

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **AI (ذكاء اصطناعي)** | برنامج يساعدك في مهمة محددة — كتابة، تلخيص، تنظيم أفكار | عندما تطلب من ChatGPT كتابة رسالة — هذا استخدام AI |
| **Model (موديل)** | اسم البرنامج الجاهز الذي تتحدث معه | ChatGPT و Gemini و Claude — كل واحد Model مختلف لكن الفكرة واحدة |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny يشرح نفس الفكرة في دقيقتين. **لا يُعاد توليده** في هذه المرحلة. النص أعلاه يكفي للقراءة.

### Comparison — مثال من الحياة

| لو فهمته خطأ | لو فهمته صح |
|--------------|-------------|
| تتوقع أنه يفهم نيتك من أول مرة، وتغضب عندما يكون الرد غير مناسب. فتتركه وتقول «لا يعمل معي» | تكتب طلبًا واضحًا، ترى الرد، وتعدّل سؤالك. كل محاولة تعلّمك كيف تتعامل معه كأداة — لا كإنسان |

### Screenshot block (intent)

صورة توضيحية: حلقة بسيطة — سؤال → رد → تعديل. مربع سؤال فوق ورد الـ AI تحته — مثل أي محادثة ذكاء اصطناعي. الصورة توضّح الشكل — لا تحتاج فهم برمجة أو إعدادات.

### Quiz — تأكيد سريع

**السؤال:** ما أفضل طريقة لتبدأ فهم الـ AI اليوم؟

- **الإجابة الصحيحة (correctIndex: 1):** تفتح ChatGPT أو Gemini وتطلب منه شيئًا بسيطًا من يومك.
- **التفسير:** تجربة واحدة صغيرة تعلّمك أكثر من قراءة طويلة. هذا بالضبط ما ستفعله في المهمة.

### Mission — مهمتك (intent + MSA draft labels)

**المقدمة:** جرّب الذكاء الاصطناعي في شيء بسيط من يومك. افتح أي AI مجاني (ChatGPT أو Gemini أو Claude)، اطلب شيئًا صغيرًا، واكتب ما حدث. إذا لا يوجد حساب الآن: اكتب الطلب الذي كنت ستُرسله + الأداة التي ستفتحها — هذا مقبول.

**التسليم:**
1. ماذا طلبت من الـ AI؟ (أو ما كنت ستطلبه)
2. أي أداة استخدمت أو ستستخدم؟
3. ما كان الرد — في سطر أو سطرين (أو «سأجرب لاحقًا»)
4. ما الذي فاجأك في التجربة؟

**معايير التقييم (من الإنتاج — unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| جرّبت بنفسك | 70% | طلب واضح أُرسل لـ AI ورأيت ردًا — أو محاولة مخطّطة (الطلب + الأداة) |
| ملاحظة منك | 30% | كتبت شيئًا بسيطًا عن تجربتك — حتى لو الرد غير مثالي |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** الـ AI أداة مساعدة — تأخذ طلبًا وترجع ردًا. ليس سحرًا، وليس بديلًا عنك.
- **تستطيع:** فتح أي AI مجاني وطلب شيء بسيط دون خوف.
- **التالي:** في الدرس القادم ستتعلم كتابة أول **Prompt (طلب)** واضح — أول خطوة عملية بعد فهم الأداة.

---

## 5. Future generation notes

### Downstream locale packages (not created in this artifact)

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect copy directly |
| `en` | This MSA canonical | Egyptian dialect copy directly |
| Future locales | This MSA canonical | — |

### Generation stages (when authorized)

1. **Gulf package** — MSA → Gulf naturalness pass; preserve objectives; mission rubric weights unchanged.
2. **English package** — MSA → plain English; gloss AI/Model on first use; same quiz answer key (correctIndex: 1).
3. **Assistant profile** — per locale; same forbidden behaviors.
4. **RAG metadata** — future seed job only when charter exists.
5. **Video script** — optional beat map from MSA; production Bunny for `ar-EG` stays frozen.

### Explicitly deferred

- Bulk derivation beyond this batch
- Remotion render / Bunny upload / publish
- Runtime locale switching in `src/`
- Mission evaluator changes
- Replacing Egyptian on-page copy with this MSA text

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

When platform localization ships (future — not implemented by this draft):

### Locale resolution priority

| Priority | Source | Rule |
|----------|--------|------|
| 1 | **Explicit user-selected locale** | Manual selector choice always wins |
| 2 | **Saved account or browser preference** | Persisted from prior session |
| 3 | **IP / location-based suggestion** | Auto-suggest suitable locale when geo signal available |
| 4 | **Default fallback** | **Current Egyptian Arabic experience** — identical to today |

### UX constraints

- **Platform shape unchanged** — same block types, mission flow, quiz, video slot.
- **Suggestion ≠ override** — geo may suggest Gulf or English; user can dismiss and stay on Egyptian default.
- **Egyptian remains default** — learners without preference see production `ar-EG` exactly as shipped.
- **No silent locale swap** — manual choice persists over geo on next visit.

---

## 7. Quality scoring

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §9 — **draft self-assessment is not final**; scale requires **human reviewer score**.

### Draft self-assessment (not final)

Informational only — does **not** authorize scale or production use.

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| **Objective preservation** | 4 | Objectives present; pending human review |
| **Concept preservation** | 5 | AI, Model, named tools only — no new concepts |
| **Beginner clarity** | 4 | Simple sentences; polish pass 2026-06-18; pending human read-aloud review |
| **MSA simplicity** | 4 | Neutral MSA; pending dialect/formality scan |
| **Mission consistency** | 5 | 70/30 rubric and task intent match production |
| **Quiz integrity** | 5 | correctIndex 1 — try simple daily task unchanged |
| **Assistant boundaries** | 4 | forbiddenAssistantBehaviors listed |
| **Localization readiness** | 4 | §5–§6 present |

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

Per [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) §10.

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production file untouched | ☑ pass (read-only derivation) |
| 2 | Bunny video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved (AI as tool + one real try) | ⚠ needs human review |
| 5 | No hallucinated concepts beyond AI, Model, ChatGPT, Gemini, Claude | ☑ pass |
| 6 | Mission rubric weights match production (70% tried / 30% observation) | ☑ pass |
| 7 | Quiz intent preserved (correctIndex: 1 — open AI, try simple task) | ☑ pass |
| 8 | MSA text derived from Egyptian — not Gulf/EN back-translated | ⚠ needs human review |
| 9 | English terms explained on first use in MSA draft | ⚠ needs human review |
| 10 | Video block marked production-reference only — no regen implied | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded (informational only) | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | **Draft / not production-ready** stated explicitly | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
