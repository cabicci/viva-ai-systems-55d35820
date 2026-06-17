# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `intro-m1-l2-first-prompt` |
| **pathId** | `intro` |
| **moduleId** | `intro-m1` |
| **productionTitle (ar-EG)** | أول Prompt ليك |
| **productionRoute** | `/learn/intro/intro-m1-l2-first-prompt` |
| **productionFile (read-only)** | `src/components/intro/lessons/intro-m1-l2-first-prompt.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.1-draft` |
| **derivedAt** | 2026-06-04 |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | A clear prompt = Role + Context + Task + Format — not magic words |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |

> **Important:** This file is a draft MSA canonical source only. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `intro-m1-l2-first-prompt.ts` (Egyptian blocks + mission) | **Frozen** — production source of truth for default UX |
| Bunny video for this lesson | **Frozen** — existing playback unchanged |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |
| Platform lesson shape / UX | **Frozen** — localization layers on top later |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Learner understands Prompt is a clear request; vague in → vague out; four parts: Role, Context, Task, Format; writes one real prompt after lesson |
| **Block sequence** | Orientation → tension → core idea → glossary → video (optional) → comparison → screenshot → quiz → mission → confidence close |
| **Mission rubric** | 70% clear four-part prompt · 30% real topic from work/daily life |
| **Quiz intent** | Ahmed's vague email — first priority addition = **context** |
| **Concepts locked** | Prompt, Context, Role, Task, Format, AI |
| **Next lesson continuity** | Setup lesson applies prompt pattern in a tool |

### Derivation method

1. Read Egyptian production TS blocks (read-only).
2. Extract objectives, block roles, mission intent, rubric weights, quiz answer key.
3. Normalize learner-facing prose to **neutral Arabic MSA** — same meaning, no Egyptian dialect surface forms.
4. Do **not** write back to production or generate locale packages in this phase.

---

## 3. Structured canonical source

```yaml
lessonId: intro-m1-l2-first-prompt
canonicalVersion: 2026-06-04.1-draft
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/intro-m1-l2-first-prompt.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: First Prompt
  oneAha: "Clear prompt = Role + Context + Task + Format"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [intro-m1-l1-what-is-ai]

objectives:
  - id: obj-1
    statement: Learner can name four parts of a starter prompt (Role, Context, Task, Format).
    measurable: true
  - id: obj-2
    statement: Learner writes one improved prompt for a real need they could use this week.
    measurable: true

concepts:
  - id: concept-prompt
    term: Prompt
    termEn: Prompt
    definition: The message you send the AI to perform a specific task.
    mustPreserve: true
  - id: concept-context
    term: Context
    termEn: Context
    definition: Details that help the AI understand the situation before answering.
    mustPreserve: true
  - id: concept-four-parts
    term: Role + Context + Task + Format
    definition: Framework for a clear first prompt.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you'll learn; why now (after trying AI once); write one real prompt after
  - role: tension
    intent: Vague marketing request → generic output; AI reads exactly what you write
  - role: core
    intent: Four parts with café/post worked example; fix the question not the tool
  - role: glossary
    intent: Prompt (طلب); Context (سياق) — English terms explained once
  - role: video
    intent: Optional weak vs strong prompt demo — production Bunny unchanged
  - role: comparison
    intent: Vague vs clear post examples (Alexandria sweets shop in production)
  - role: screenshot
    intent: Four-box visual — role, context, task, format
  - role: quiz
    intent: Ahmed email — most important first addition = context
  - role: mission
    intent: Write one real prompt; tag [role][context][task][format]; optional one-line reply
  - role: confidence_close
    intent: Prompt = instructions + context; next = open first AI tool

mission:
  type: practice
  intent: Choose real topic (email, post, summary, reply); write one prompt with four parts; honest attempt not perfection
  rubricIntent:
    - dimension: structure
      weight: 70
      criteria: Prompt includes role, context, task, format — even if simple
    - dimension: real_topic
      weight: 30
      criteria: Topic from work or daily life — not empty generic example
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - choose_mission_topic_for_learner

termsLocked: [Prompt, Context, Role, Task, Format, AI]

links:
  nextLessonId: intro-m1-l3-setup-your-ai
  continuityNote: Next lesson opens first AI and sends a simple message — applies this prompt pattern
```

---

## 4. Arabic MSA canonical lesson text

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** adaptation spine for Gulf, English, and future locales · **Not:** replacement for live Egyptian copy

### Orientation — ماذا ستفهم؟

- **ماذا ستفهم؟** الـ **Prompt** (الطلب أو التعليمة التي ترسلها للذكاء الاصطناعي) ليس جملة سحرية، بل طلبًا واضحًا يحدد ما المطلوب من النموذج.
- **لماذا الآن؟** في الدرس السابق جرّبت الذكاء الاصطناعي مرة. اليوم ستفهم لماذا يُعطي أحيانًا ردًا ممتازًا وأحيانًا ردًا عامًا.
- **ماذا بعد الدرس؟** ستكتب **Prompt** واحدًا محسّنًا لحاجة حقيقية من عملك أو يومك — جاهز للاستخدام أو التجربة.

### Tension — موقف مألوف

كتبت: «اكتب لي شيئًا عن التسويق» — فحصلت على نص عام؟

الذكاء الاصطناعي لا يقرأ أفكارك. يقرأ ما تكتبه بالضبط. إذا كان الطلب غامضًا، كان الرد غامضًا — ليس لأن الأداة ضعيفة، بل لأن السؤال ناقص تفاصيل.

الخبر الجيد: لا تحتاج أن تكون خبيرًا. تحتاج أربع عناصر بسيطة في رسالتك.

### Core idea — الفكرة الأساسية

**الـ Prompt الواضح = دور + سياق + مهمة + شكل**

- **Role (الدور):** من يكون الذكاء الاصطناعي في هذه الرسالة؟ (محرر، مستشار، مساعد…)
- **Context (السياق):** ما الموقف؟ (من أنت، لمن تكتب، لماذا الآن؟)
- **Task (المهمة):** ماذا تريد بالضبط؟ (تلخيص، أفكار، رد…)
- **Format (الشكل):** كيف يظهر الرد؟ (نقاط، جدول، عدد كلمات…)

**مثال:** بدل «اكتب لي منشورًا» → «أنت محرر محتوى عربي (دور). أفتح مقهى في القاهرة (سياق). اكتب ٣ أفكار منشور لإنستغرام (مهمة)، كل فكرة ٣ أسطر (شكل).»

إذا لم يعجبك الرد، غالبًا المشكلة في الطلب — عدّل السؤال وجرّب مرة أخرى.

### Glossary — مصطلحان أساسيان

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Prompt (طلب)** | الرسالة التي تكتبها للذكاء الاصطناعي لتنفيذ مهمة محددة | «لخّص لي هذا البريد في ٣ نقاط» — هذا Prompt |
| **Context (سياق)** | التفاصيل التي تساعد النموذج على فهم الموقف قبل الإجابة | «أنا موظف مبيعات وأرد على عميل متأخر» أفضل من «اكتب ردًا» فقط |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري يوضح الفرق بين prompt ضعيف وقوي. **لا يُعاد توليده** في هذه المرحلة. النص أعلاه يكفي للقراءة.

### Comparison — مثال من الحياة

| طلب غامض | طلب واضح |
|----------|----------|
| «اكتب لي شيئًا عن التسويق» → فقرات عامة بلا جمهور ولا هدف، صعب الاستخدام | «أنت محرر محتوى. أفتح محل حلويات في الإسكندرية. اكتب ٣ أفكار منشور، كل واحدة سطران» → رد قريب مما ستنشره |

### Screenshot block (intent)

صورة توضيحية: أربع خانات في رسالة واحدة — من الذكاء الاصطناعي؟ ما الموقف؟ ماذا تريد؟ بأي شكل الرد؟ (الأصل البصري في الإنتاج المصري يبقى كما هو.)

### Quiz — تأكيد سريع

**السؤال:** أحمد كتب: «اكتب إيميلًا لوظيفة جديدة». ما أهم إضافة أولًا؟

- **الإجابة الصحيحة:** سياق — من أحمد، ما الوظيفة، ولماذا هذا الإيميل.
- **التفسير:** الذكاء الاصطناعي لا يعرف حياتك. السياق + مهمة واضحة يحوّلان الطلب من عام إلى عملي.

### Mission — مهمتك (intent + MSA draft labels)

**المقدمة:** اختر حاجة تحتاجها فعلًا — بريد، منشور، تلخيص، رد على رسالة — واكتب Prompt واحدًا فيه الدور والسياق والمهمة والشكل. لا يُطلب إجابة مثالية؛ يُطلب محاولة واضحة يمكن تجربتها في أي أداة ذكاء اصطناعي.

**التسليم:**
1. الموضوع الذي اخترته (جملة واحدة)
2. الـ Prompt الكامل — مع تمييز: [دور] [سياق] [مهمة] [شكل]
3. إن جرّبته: الرد في سطر أو سطرين. وإن لم تجرّبه بعد: اكتب أنك ستجرّبه في الدرس التالي.

**معايير التقييم (من الإنتاج — unchanged weights):**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| طلب واضح | 70% | الـ Prompt فيه دور وسياق ومهمة وشكل — حتى لو بسيطًا |
| موضوع حقيقي | 30% | اخترت موضوعًا من عملك أو يومك — لا مثالًا عامًا فارغًا |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** الـ Prompt الواضح ليس سحرًا — هو تعليمات + سياق. كلما أوضحت، تحسّن الرد.
- **تستطيع:** كتابة طلب محدد لأي حاجة وتعديله حتى يناسبك.
- **التالي:** في الدرس القادم ستفتح أول أداة ذكاء اصطناعي وترسل رسالة بسيطة — تطبيق عملي لما كتبته هنا.

---

## 5. Future generation notes

### Downstream locale packages (not created in this artifact)

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect copy directly |
| `en` | This MSA canonical | Egyptian dialect copy directly |
| Future locales | This MSA canonical | — |

### Generation stages (when authorized)

1. **Gulf package** — MSA → Gulf naturalness pass; preserve objectives checklist; mission rubric weights unchanged.
2. **English package** — MSA → plain English; define Prompt/Context on first use; same quiz answer key.
3. **Assistant profile** — per locale; same forbidden behaviors; tone adapted.
4. **RAG metadata** — `ragVersion` pin must match approved `localeVersion` (future seed job — not now).
5. **Video script** — optional beat map from MSA; **new** `videoVersion` only when render charter exists; production Bunny for `ar-EG` stays.

### Version pin chain (future)

```
canonicalVersion: 2026-06-04.1-draft
    │
    ├── localeVersion: ar-Gulf.* (future, from MSA)
    ├── localeVersion: en.* (future, from MSA)
    └── ar-EG production (unchanged — no localeVersion regen)
            │
            ├── videoVersion: (production Bunny — frozen)
            └── ragVersion: (production seed — frozen until charter)
```

### Explicitly deferred

- 100-lesson bulk derivation
- Remotion render / Bunny upload / publish
- Runtime locale switching in `src/`
- Mission evaluator changes
- Replacing Egyptian on-page copy with this MSA text

---

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

- **Platform shape unchanged** — same block types, mission flow, quiz, video slot; only copy/locale layer differs.
- **Suggestion ≠ override** — geo may suggest Gulf or English; user can dismiss and stay on Egyptian default.
- **Egyptian remains default** — learners without preference see production `ar-EG` exactly as shipped.
- **No silent locale swap** — if geo suggests a locale, UX should make suggestion visible; manual choice persists over geo on next visit.

---

## 7. Quality scoring rubric

Use this rubric when reviewing MSA canonical drafts and downstream locale packages derived from them.

| Dimension | Weight | Score 0 (fail) | Score 1 (pass) | Score 2 (strong) |
|-----------|--------|----------------|----------------|------------------|
| **Objective fidelity** | 25% | Objectives added, removed, or changed vs production | All production objectives preserved | Objectives preserved and clearly measurable in MSA text |
| **Concept preservation** | 20% | New tools/promises not in production | Only Prompt, Context, four-part framework | Locked terms consistent; no dialect-only concepts smuggled in |
| **Mission intent** | 20% | Rubric weights or dimensions changed | 70/30 structure + real topic preserved | Mission intro/prompt/template intent clear in MSA |
| **MSA neutrality** | 15% | Egyptian dialect surface forms dominate | Neutral MSA readable throughout | Consistent MSA; English terms glossed once |
| **Block parity** | 10% | Missing block roles vs production | Same block sequence and intent | Each block intent mappable to production eyebrow/title |
| **Quiz integrity** | 10% | Wrong answer or changed reasoning | Context-first answer preserved | Explanation matches production pedagogical intent |

**Pass threshold:** ≥ 85% weighted score with no dimension at 0.

**MSA canonical-specific gate:** reviewer confirms text was derived from Egyptian production read-only and does not contradict live lesson meaning.

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production file untouched | ☐ pending |
| 2 | Bunny video mapping untouched | ☐ pending |
| 3 | Objectives preserved (four-part prompt + one real prompt mission) | ☐ pending |
| 4 | No hallucinated concepts beyond Prompt, Context, Role, Task, Format, AI | ☐ pending |
| 5 | Mission rubric weights match production (70% structure / 30% real topic) | ☐ pending |
| 6 | Quiz intent preserved (context first for Ahmed email) | ☐ pending |
| 7 | MSA text derived from Egyptian — not Gulf/EN back-translated | ☐ pending |
| 8 | English terms explained on first use in MSA draft | ☐ pending |
| 9 | Video block marked production-reference only — no regen implied | ☐ pending |
| 10 | Downstream locales documented as MSA-derived (not Egyptian-direct) | ☐ pending |
| 11 | Localization UX priority documented (manual > saved > geo > Egyptian default) | ☐ pending |
| 12 | Quality rubric applied — score recorded | ☐ pending |
| 13 | Ready for human review | ☐ pending |
| 14 | **Not ready for production until approved** | ✅ confirmed |

---

*Artifact owner: Adaptive Lesson Engine prototype · MSA canonical-first workflow · Draft only · Does not modify production lesson, video, or runtime.*
