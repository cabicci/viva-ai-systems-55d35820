# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `builder-m3-l2-memory-limits` |
| **pathId** | `builder` |
| **moduleId** | `builder-m3` |
| **productionTitle (ar-EG)** | حدود الذاكرة |
| **productionRoute** | `/learn/builder/builder-m3-l2-memory-limits` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m3-l2-memory-limits.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.4-draft` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | AI forgets — the app must remember what matters |
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
| `builder-m3-l2-memory-limits.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Why AI «forgets»; design product to persist what must persist |
| **Mission rubric** | 60% three practical facts · 40% State Snapshot |
| **Quiz intent** | Forgot name/decision after long chat — Context Window (correctIndex 0) |
| **Concepts locked** | Context Window, State Snapshot |
| **Prerequisite** | `builder-m3-l1-context-layer` |
| **Next lesson** | `builder-m4-l1-parameters` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m3-l2-memory-limits
canonicalVersion: 2026-06-04.4-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m3-l2-memory-limits.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Memory Limits
  oneAha: "AI forgets — the app must remember what matters"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m3-l1-context-layer]

objectives:
  - id: obj-1
    statement: Learner explains Context Window limits and signs of overflow; app persists 3–5 key facts.
    measurable: true
  - id: obj-2
    statement: Learner defines 3 facts app must always remember with why and how to pass each.
    measurable: true

concepts:
  - id: concept-context-window
    term: Context Window
    termEn: Context Window
    definition: Max text AI «sees» in conversation — not permanent archive.
    mustPreserve: true
  - id: concept-state-snapshot
    term: State Snapshot
    termEn: State Snapshot
    definition: Short summary of current state — re-injected when chat grows long.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Why AI forgets; define 3 things app must always remember after lesson
  - role: tension
    intent: Agreed plan forgotten after 10 messages — design limit not personal flaw
  - role: core
    intent: Context Window; overflow signs; app stores facts; periodic summary
  - role: comparison
    intent: «Continue from before» vs summary + app-passed facts
  - role: glossary
    intent: Context Window, State Snapshot
  - role: video
    intent: Memory limits in product design — production Bunny unchanged
  - role: screenshot
    intent: Limited memory disclaimer — explicit product design
  - role: quiz
    intent: Forgot basics — Context Window overflow (correctIndex 0)
  - role: mission
    intent: Three facts app must remember + State Snapshot sentence
  - role: confidence_close
    intent: App remembers; next = Temperature/parameters

mission:
  type: practice
  intent: Imagine app with AI assistant — define 3 facts app must persist with why and how — plus Snapshot sentence — ~10–15 min
  rubricIntent:
    - dimension: three_facts
      weight: 60
      criteria: Each fact has «if forgotten» reason; realistic pass method
    - dimension: snapshot
      weight: 40
      criteria: Summary short and focused; covers decisions or current state
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_facts_or_snapshot_for_learner

termsLocked: [Context Window, State Snapshot, Context]

links:
  nextLessonId: builder-m4-l1-parameters
  continuityNote: Parameters — Temperature balance stability vs creativity

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

- **ماذا ستفهم؟** **لماذا الذكاء الاصطناعي «ينسى»** — **وكيف تصمّم منتجك** **ليحفظ ما يجب أن يُحفظ**.
- **لماذا الآن؟** **محادثة طويلة** = **سياق يمتلئ**. **بدون تصميم** — **المساعد يبدو «يتكلم حائطًا»**.
- **ماذا بعد الدرس؟** **ستحدّد ٣ أمور** **يجب أن يفتكرها التطبيق دائمًا**.

### Tension — اتفقتم — وبعد ١٠ رسائل نسي

- **شرحت فكرة**، **اتفقتم على خطة** — **وبعد قليل** **الذكاء الاصطناعي** **بدأ يقترح عكس ما قلته**.
- **ليس أنت** — **الذكاء الاصطناعي ينسى فعلًا**. **هذا ليس عيبًا شخصيًا** — **هذا حد في التصميم**.
- عندما **تبني ميزة ذكاء اصطناعي** — **لا تتوقّع** أن «**المحادثة**» **تحفظ كل شيء** — **التطبيق يجب أن يحفظ ما هو مهم**.

### Core idea — الذكاء الاصطناعي لا يتذكّر للأبد

- **Context Window (شباك الذاكرة)** = «**شباك ذاكرة**» — **الذكاء الاصطناعي يرى آخر كم كلمة فقط**. **ما قبل ذلك** **سقط من المكتب**.
- **علامات أنك خرجت خارج الشباك**: **يكرّر نفسه**، **ينسى اسمك**، **يناقض قرارات**، **يختلق تفاصيل**.
- **الحل في المنتج**: **التطبيق يحفظ ٣–٥ حقائق ثابتة** (اسم، تفضيلات، قرارات) **ويمرّرها مع كل طلب**.
- **في المحادثة**: **ملخّص قصير كل ١٥–٢٠ رسالة** — «**ملخص الوضع: ١)... ٢)...**»

### Comparison — ترغي وتنتظر vs تلخّص وتمرّر

| «كمّل من الأول» | ملخّص + تمرير من التطبيق |
|----------------|---------------------------|
| **محادثة ٣٠ رسالة** — «**كمّل من الذي قلته لك.**» **هو نسي**. **سيبدأ يخمن** — **وأنت ستبني على معلومات خاطئة** | «**ملخص: ١) المشروع... ٢) القرارات... ٣) المفتوح...**» + **التطبيق يمرّر اسم المستخدم وتفضيلاته كل مرة** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Context Window (شباك الذاكرة)** | **أقصى كم نص يراه الذكاء الاصطناعي في المحادثة** — **ليس أرشيفًا دائمًا** | **بعد ٥٠ رسالة** — **أول رسالة** **حُذفت من ذاكرته المؤقتة** |
| **State Snapshot (لقطة حالة)** | **ملخّص قصير للوضع الحالي** — **تعيده للذكاء الاصطناعي** عندما **تطول المحادثة** | «**قرّرنا: لون أزرق، جمهور شباب، المفتوح: صفحة التسعير.**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Context Window — كيف تتعامل معه في تصميم المنتج». **لا يُعاد توليده.**

### Screenshot block (intent)

**ذاكرة محدودة — تصميم صريح:**

**التنبيه** **ليس قانونيًا** — **هو اعتراف** أن **الذاكرة لها حد**. **المساعد يرى سياقك** + **جزءًا من المحتوى** — **ليس «كل شيء»**. **في منتجك**: **حدّد ما الذي يحفظه التطبيق خارج المحادثة** **ويمرّره كل مرة**.

### Quiz — تأكيد سريع

**السؤال:** **بعد أسبوع محادثة** — **الذكاء الاصطناعي نسي اسمك** **وناقض قرارًا اتفقتما عليه**. **ما أقرب سبب؟**

- **الإجابة الصحيحة (خيار ١):** **خرجت خارج Context Window** — **المعلومات سقطت من الشباك**.
- خيار ٢: **الذكاء الاصطناعي عمل هلوسة مفاجئة** **بدون علاقة بالذاكرة**.
- خيار ٣: **المشكلة في لهجتك**.

**التفسير:** عندما **ينسى أساسيات** — **غالبًا المعلومة ليست في الشباك**. **الحل:** **التطبيق يحفظ ويمرّر**.

### Mission — ٣ أمور يجب أن يفتكرها التطبيق

**المقدمة:** **تخيّل تطبيقًا فيه مساعد ذكاء اصطناعي** — **حدّد ٣ حقائق** **يجب أن يحفظها التطبيق** (**ليس** أن **الذكاء الاصطناعي يتذكّر وحده**). **١٠–١٥ دقيقة**.

**التسليم:**

1. **نوع التطبيق** (مثال: متجر، تعليم، حجز)
2. **٣ أمور يجب أن يفتكرها دائمًا** — **لكل واحدة**:
   - **ما الحقيقة؟**
   - **لماذا مهمة إن نسيها؟**
   - **كيف يمرّرها التطبيق؟** (حقل قاعدة بيانات، session، أول كل Prompt)
3. **جملة State Snapshot** إذا **طالت المحادثة**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ حقائق عملية | 60% | **كل حقيقة لها سبب «لو نسي»**؛ **طريقة التمرير واقعية** |
| Snapshot | 40% | **الملخّص قصير ومركّز**؛ **يغطي قرارات أو حالة حالية** |

### Confidence close

- **فهمت:** **الذكاء الاصطناعي ينسى** — **التطبيق هو الذي يفتكر**. **Context Window** **حدّ** **وليس ميزة**.
- **تستطيع:** **تحديد ٣ حقائق + Snapshot** **لأي ميزة محادثة**.
- **التالي:** **Temperature (درجة الحرارة)** — **ثبات مقابل إبداع**.

---

## 5. Future generation notes

Downstream locales from MSA only. **Context Window**, **State Snapshot**, **Context** preserved — gloss on first use. No new tools. Screenshot = production reference. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Context Window, State Snapshot only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Context Window overflow |
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

*Artifact owner: Adaptive Lesson Engine · 25-lesson MSA canonical accelerated batch · Draft only.*
