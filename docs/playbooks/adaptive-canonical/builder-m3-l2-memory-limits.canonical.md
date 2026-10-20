# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m3-l2-memory-limits` |
| **pathId** | `builder` |
| **moduleId** | `builder-m3` |
| **productionTitle (ar-EG)** | حدود الذاكرة |
| **productionRoute** | `/learn/builder/builder-m3-l2-memory-limits` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m3-l2-memory-limits.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
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
| **Quiz intent** | Current-request inspection confirms name/decision omitted; preserve correctIndex 0 and distinguish stored state from supplied context |
| **Concepts locked** | Context Window, State Snapshot |
| **Prerequisite** | `builder-m3-l1-context-layer` |
| **Next lesson** | `builder-m4-l1-parameters` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m3-l2-memory-limits
canonicalVersion: 2026-06-18.1-polished
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
    statement: Learner explains model-dependent token context, investigates the supplied request and distinguishes it from persisted application state.
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
    intent: Model-dependent token context; investigate signals; app persists and forwards relevant state; approximate summary-review reminder
  - role: comparison
    intent: «Continue from before» vs summary + app-passed facts
  - role: glossary
    intent: Context Window, State Snapshot
  - role: video
    intent: Memory limits in product design — production Bunny unchanged
  - role: screenshot
    intent: Limited memory disclaimer — explicit product design
  - role: quiz
    intent: Inspection confirms facts absent from the current request (correctIndex 0)
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

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **لماذا الذكاء الاصطناعي «ينسى»** — **وكيف تصمّم منتجك** **ليحفظ ما يجب أن يُحفظ**.
- **لماذا الآن؟** **محادثة طويلة** = **سياق يمتلئ**. **بدون تصميم** — **المساعد يبدو «يتكلم حائطًا»**.
- **ماذا بعد الدرس؟** **ستحدّد ٣ أمور** **يجب أن يفتكرها التطبيق دائمًا**.

### Tension — اتفقتم — ثم اختلف الرد

شرحتم فكرة واتفقتم على خطة، ثم جاء رد يناقضها.

هذا يدعو إلى مراجعة السياق المرسل، ولا يثبت وحده امتلاء نافذة السياق.

يحفظ التطبيق الحالة المهمة خارج المحادثة ويختار منها المعلومات اللازمة لكل طلب.

### Core idea — الذكاء الاصطناعي لا يتذكّر للأبد

- سعة Context Window (نافذة السياق) تُقاس بالـ tokens (الرموز) وتختلف بحسب النموذج؛ لا يوجد حد ثابت من الرسائل أو الأسابيع.
- يعمل النموذج على السياق الذي يرسله التطبيق في الطلب الحالي. قد ينتقي التطبيق الرسائل أو يلخّصها أو يسترجع معلومات محفوظة.
- إغفال معلومة من الطلب أو تلخيصها لا يعني حذفها من تخزين التطبيق؛ حفظ الحالة وإرسال السياق وظيفتان منفصلتان.
- التكرار ونسيان الاسم وتناقض القرارات إشارات للفحص، وليست تشخيصاً مؤكداً لامتلاء النافذة. افحص الطلب الحالي قبل تحديد السبب.
- احفظ الحقائق والقرارات اللازمة وراجعها قبل تمريرها. مراجعة ملخص كل ١٥–٢٠ رسالة تذكير تقريبي يتغير مع طول الرسائل، وليس حداً تقنياً أو ضماناً للتذكر.

### Comparison — ترغي وتنتظر vs تلخّص وتمرّر

| طلب متابعة دون فحص | حالة محفوظة وسياق مختار |
| --- | --- |
| طلب المتابعة دون التحقق من إرسال الاسم والقرارات قد يترك السياق ناقصاً، ولو كانت هذه المعلومات محفوظة في التطبيق. | يحفظ التطبيق الحالة ويسترجع المطلوب أو يراجع ملخصاً ثم يرسله مع الطلب، دون افتراض وصول الأرشيف كله للنموذج. |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | المثال |
| --- | --- | --- |
| **Context Window (شباك الذاكرة)** | ميزانية السياق المتاح للنموذج في الطلب، مقاسة بالرموز (tokens) بحسب النموذج والمحتوى المرسل؛ ليست أرشيفاً دائماً. | تستهلك الرسائل الطويلة رموزاً أكثر؛ لا تُحذف الرسالة الأولى تلقائياً بعد ٥٠ رسالة كقاعدة عامة. |
| **State Snapshot (لقطة حالة)** | **ملخّص قصير للوضع الحالي** — **تعيده للذكاء الاصطناعي** عندما **تطول المحادثة** | «**قرّرنا: لون أزرق، جمهور شباب، المفتوح: صفحة التسعير.**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «Context Window — كيف تتعامل معه في تصميم المنتج». **لا يُعاد توليده.**

### Screenshot block (intent)

**ذاكرة محدودة — تصميم صريح:**

**التنبيه** **ليس قانونيًا** — **هو اعتراف** أن **الذاكرة لها حد**. **المساعد يرى سياقك** + **جزءًا من المحتوى** — **ليس «كل شيء»**. **في منتجك**: **حدّد ما الذي يحفظه التطبيق خارج المحادثة** **ويمرّره كل مرة**.

### Quiz — تأكيد سريع

**السؤال:** يحفظ التطبيق الاسم وقرار المشروع، لكن فحص الطلب الحالي أكد غيابهما عن السياق المرسل للنموذج. ما الخلل المؤكد في إعداد الطلب؟

**الإجابة الصحيحة:** لم يُمرّر الاسم والقرار ضمن السياق الحالي؛ راجع اختيار المعلومات وإرسالها.

**التفسير:** يثبت الفحص غياب المعلومتين من الطلب، لا حذفهما من التخزين أو بلوغ عدد ثابت من الرسائل. راجع الاسترجاع والتلخيص والتمرير؛ النسيان وحده لا يثبت امتلاء نافذة السياق.

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
| Concept preservation | 5 | Context Window, State Snapshot only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
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
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
