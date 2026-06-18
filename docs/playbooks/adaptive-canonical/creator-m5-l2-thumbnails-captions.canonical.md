# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m5-l2-thumbnails-captions` |
| **pathId** | `creator` |
| **moduleId** | `creator-m5-polish` |
| **productionTitle (ar-EG)** | Thumbnails & Captions |
| **productionRoute** | `/learn/creator/creator-m5-l2-thumbnails-captions` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m5-l2-thumbnails-captions.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Thumbnail and caption are the door — test Hook lines and short Thumbnail text |
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
| `creator-m5-l2-thumbnails-captions.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Clear door — short Thumbnail text, Hook caption opener, one promise per Thumbnail |
| **Mission rubric** | 50% phrasing variety · 50% conscious choice |
| **Quiz intent** | Test 3 Hook opens with short Thumbnail text (correctIndex 1) |
| **Concepts locked** | Hook Line, Thumbnail Text, CTR |
| **Prerequisite** | `creator-m4-repurposing` |
| **Next lesson** | `creator-m6-l1-platforms` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m5-l2-thumbnails-captions
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m5-l2-thumbnails-captions.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Thumbnails and Captions
  oneAha: "Thumbnail and caption are the door — test Hook lines and short Thumbnail text"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m4-repurposing]

objectives:
  - id: obj-1
    statement: Learner writes Thumbnail with few words, strong contrast, one clear promise.
    measurable: true
  - id: obj-2
    statement: Learner drafts 3 caption Hook opens or 3 Thumbnail texts and picks strongest with reason.
    measurable: true

concepts:
  - id: concept-hook-line
    term: Hook Line
    termEn: Hook Line
    definition: First line that grabs attention quickly.
    mustPreserve: true
  - id: concept-thumbnail-text
    term: Thumbnail Text
    termEn: Thumbnail Text
    definition: The few words shown on the cover image.
    mustPreserve: true
  - id: concept-ctr
    term: CTR
    termEn: Click-Through Rate
    definition: Share of people who clicked after seeing title and image.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Thumbnail and caption are first click decision — after repurposing formats
  - role: tension
    intent: Weak door loses excellent content — dull image or long caption opener
  - role: core
    intent: Few Thumbnail words, strong contrast, Hook caption opener, test 2-3 opens
  - role: comparison
    intent: Crowded text vs clear door-opening message
  - role: glossary
    intent: Hook Line, Thumbnail Text, CTR
  - role: video
    intent: Improve door before publish — production Bunny unchanged
  - role: screenshot
    intent: Thumbnail and caption examples — clear promise at first glance
  - role: quiz
    intent: Test 3 Hook opens with short Thumbnail (correctIndex 1)
  - role: mission
    intent: 3 caption Hook opens OR 3 Thumbnail texts with final pick and why
  - role: confidence_close
    intent: You ease access to content — apply three versions on one video

mission:
  type: practice
  intent: One video — 3 caption Hook opens or 3 Thumbnail texts plus strongest pick
  rubricIntent:
    - dimension: phrasing_variety
      weight: 50
      criteria: Three versions genuinely different not one-word swap
    - dimension: conscious_choice
      weight: 50
      criteria: Final pick based on clear promise to audience
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - pick_best_version_for_learner

termsLocked: [Hook Line, Thumbnail Text, CTR]

links:
  nextLessonId: creator-m6-l1-platforms
  continuityNote: Platform choice next — start where your audience listens

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

- **ماذا ستفهم؟** **بعد** **أن تُنتج من فكرة واحدة أكثر من شكل محتوى** — **السؤال الآن:** **كيف تجعل كل نسخة تُرى وتُفتح؟**
- **Thumbnail (صورة الغلاف) والكابشن** **أول قرار للمشاهد:** **ينقر أم يتخطّى**.

### Tension — المشكلة

- **باب ضعيف** **يخسر محتوى ممتازًا**.
- **إن كانت الصورة باهتة** **أو النص طويلًا وغير واضح** — **المشاهد لن يمنح الفيديو فرصة**.
- **أيضًا** **إن كان أول سطر في الكابشن مملًا** — **القارئ لن يصل للنقطة المهمة**.

### Core idea — اجعل الباب واضحًا وسريع الفهم

- **Thumbnail جيد:** **نص قليل**، **تباين قوي**، **وفكرة واضحة من أول نظرة**.
- **كابشن جيد:** **أول سطر Hook Line (خطاف)** — **ثم جملة توضّح الفائدة بسرعة**.
- **اختبر ٢ أو ٣ بدايات للكابشن** — **واختر الأسرع في إيصال المعنى**.
- **لا تخلط الرسائل:** **كل Thumbnail** **له وعد واحد واضح**.

### Comparison — نص مزدحم أم رسالة تفتح الباب؟

| الأسلوب الضعيف | الأسلوب الأقوى |
|----------------|----------------|
| **Thumbnail فيه كلام كثير** **وكابشن يبدأ بمقدمة طويلة** — **المشاهد يملّ قبل أن يفهم** | **Thumbnail مركّز بكلمات قليلة** **وكابشن يبدأ بجملة مشوقة** **مرتبطة بالفائدة** |

### Glossary — ٣ مصطلحات أساسية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Hook Line (خطاف)** | **أول سطر** **يشدّ الانتباه بسرعة** | «**أغلب الناس يخطئون في هذه الخطوة**» |
| **Thumbnail Text (نص الغلاف)** | **الكلمات القليلة** **الظاهرة على صورة الغلاف** | **٣ كلمات واضحة** **أفضل من جملة طويلة** |
| **CTR (نسبة النقر)** | **نسبة الناس** **الذين نقروا** **بعد رؤية العنوان والصورة** | **تحسين الباب يرفع النقر** **حتى قبل تغيير المحتوى** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «تحسين الباب قبل النشر». **لا يُعاد توليده.** **يمكنك تخطّي الفيديو** **والبدء بالمهمة**.

### Screenshot block (intent)

لقطة بصرية — **نماذج Thumbnail وكابشن**. **الرسالة واضحة من أول ثانية:** **نص قليل**، **قراءة سهلة**، **ووعد مفهوم**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **محتواك مفيد** **لكن الوصول ضعيف** — **أي اختيار يُحسّن باب الدخول بسرعة؟**

- خيار ١: **أزيد طول الكابشن جدًا** **لأشرح كل التفاصيل**.
- **الإجابة الصحيحة (خيار ٢):** **أكتب ٣ بدايات Hook للكابشن** **وأختبر أقواهم** **مع نص Thumbnail مختصر**.
- خيار ٣: **أترك نفس الصورة والكابشن** **وأغيّر الموسيقى فقط**.

**التفسير:** **اختبار بدايات الكابشن** **مع Thumbnail واضح** **يُعطي أسرع تحسين** **في قرار النقر**.

### Mission — اكتب ٣ افتتاحيات كابشن أو نصوص Thumbnail

**المقدمة:** **اختر فيديوًا واحدًا** — **اكتب ٣ صياغات للباب:** **إما ٣ افتتاحيات كابشن** **أو ٣ نصوص Thumbnail**.

**التسليم:** النسخة ١ · ٢ · ٣ · **النسخة الأقوى ولِمَ**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| تنوع الصياغات | 50% | **النسخ الثلاثة مختلفة فعلًا** — **لا تبديل كلمة واحدة فقط** |
| اختيار واعٍ | 50% | **اختيار النسخة النهائية** **مبني على وضوح الوعد للجمهور** |

### Confidence close

- **فهمت:** **أنت لا تُزيّن المحتوى فقط** — **بل تُسهّل على الناس** **الوصول إليه وفهمه بسرعة**.
- **تستطيع:** **طبّق النسخ الثلاثة على فيديو واحد** — **وسترى فرقًا واضحًا في الاستجابة**.
- **التالي:** **اختيار المنصات** — **ابدأ من مكان انتباه جمهورك**.

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
| Concept preservation | 5 | Hook Line, Thumbnail Text, CTR only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — test Hooks + short Thumbnail |
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
| 6 | Mission rubric 50/50 | ☑ pass |
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
