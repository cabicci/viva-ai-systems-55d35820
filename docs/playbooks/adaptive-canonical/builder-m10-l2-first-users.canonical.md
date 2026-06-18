# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m10-l2-first-users` |
| **pathId** | `builder` |
| **moduleId** | `builder-m10` |
| **productionTitle (ar-EG)** | أول مستخدمين |
| **productionRoute** | `/learn/builder/builder-m10-l2-first-users` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m10-l2-first-users.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | أول ١٠ مستخدمين معلمون — ليسوا أرقامًا؛ Feedback Loop أسرع من الإعلانات |
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
| `builder-m10-l2-first-users.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | First 10 users teach reality; personal outreach + feedback loop |
| **Mission rubric** | 50% رسالة واضحة · 50% أسئلة مفيدة |
| **Quiz intent** | Talk to users who left and stayed before new marketing (correctIndex 0) |
| **Concepts locked** | Early Adopters, Feedback Loop |
| **Prerequisite** | `builder-m10-l1-deploy-domain` |
| **Next lesson** | End of Builder path — `pending-path-validation` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m10-l2-first-users
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m10-l2-first-users.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: First Users
  oneAha: "First 10 users are teachers not metrics — Feedback Loop beats ads"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [builder-m10-l1-deploy-domain]

objectives:
  - id: obj-1
    statement: Learner explains why first 10 named users beat waiting for traffic.
    measurable: true
  - id: obj-2
    statement: Learner writes invite message + 2 post-trial questions for real feedback.
    measurable: true

concepts:
  - id: concept-early-adopters
    term: Early Adopters
    termEn: Early Adopters
    definition: People willing to try while product is half-built and tolerate issues.
    mustPreserve: true
  - id: concept-feedback-loop
    term: Feedback Loop
    termEn: Feedback Loop
    definition: Listen → fix one problem → return to user → listen again.
    mustPreserve: true

blocks:
  - role: orientation
    intent: First 10 teach reality; invite + 2 questions after; Builder capstone
  - role: tension
    intent: Live but nobody uses — posting and waiting fails
  - role: core
    intent: 5-10 people you know + weekly calls > 1000 ad visitors
  - role: comparison
    intent: Wait for visitors vs listen to 10 people
  - role: glossary
    intent: Early Adopters, Feedback Loop
  - role: video
    intent: First 10 without marketing — production Bunny unchanged
  - role: screenshot
    intent: User progress dashboard example
  - role: quiz
    intent: Talk to users before new marketing (correctIndex 0)
  - role: mission
    intent: Invite message + 2 post-trial questions
  - role: confidence_close
    intent: Builder optional depth complete — other paths remain

mission:
  type: practice
  intent: App one-liner + invite message for 3 people + 2 post-trial questions — ~10–15 min
  rubricIntent:
    - dimension: clear_message
      weight: 50
      criteria: Short message says what app is and asks specific trial; no marketing fluff
    - dimension: useful_questions
      weight: 50
      criteria: 2 questions get real feedback on behavior not just did you like it
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_user_outreach_for_learner

termsLocked: [Early Adopters, Feedback Loop, retention, iteration]

links:
  nextLessonId: pending-path-validation
  continuityNote: End of Builder path — Creator Automator Business Analyst paths remain

slugValidation:
  validatedAt: 2026-06-18
  lessonId: pass
  productionFile: pass
  prerequisites: pass
  nextLessonId: pending-path-validation
  missionRubric: pass
  quizAnswer: pass
```

---

## 4. Arabic MSA canonical lesson text

> **Dialect:** Modern Standard Arabic (neutral) · **Role:** final MSA canonical lesson script for downstream locale derivation · **Not:** live Egyptian copy · **Not:** production-wired or rendered

### Orientation — بداية الدرس

- **ماذا ستفهم؟** **لماذا أول ١٠ مستخدمين يعلّمونك الواقع** — **أكثر من أي خطة على ورق**.
- **لماذا الآن؟** **التطبيق live** — **لكن الصمت مريب**. **تحتاج ناسًا حقيقيين يجربون ويقولون الحقيقة**.
- **ماذا بعد الدرس؟** **ستكتب رسالة دعوة + سؤالين تسألهما بعد التجربة**.

### Tension — Live — ولا أحد يستخدم

- **اللينك يعمل**. **تقنيًا كل شيء تمام**. **لكن لا تسجيلات — لا feedback**.
- **تكتب منشورًا على فيسبوك وتنتظر**. **٥٠٠ زائر، ٢٠ يسجّلون، ولا أحد يعود**.
- **المشكلة ليست marketing** — **المشكلة أنك لا تسمع من ١٠ ناس تعرفهم بالاسم**.

### Core idea — أول ١٠ مستخدمين يعلّمونك الواقع

- **أول ١٠ ليسوا للأرقام** — **للتعلّم**. **هم من يقولون: هل هذا يحل مشكلة؟ أم شكل جميل فقط؟**
- **٥–١٠ ناس تعرفهم + مكالمة ١٥ دقيقة كل أسبوع** **أفضل من ١٠٠٠ زائر من إعلان**.
- **Iteration (تكرار التحسين):** **تسمع → تصلّح مشكلة واحدة → ترجع إليهم**. **بعد شهر — منتج الناس يحتاجونه**.

### Comparison — تنتظر الزوار vs تسمع ١٠ ناس

| إطلاق وتنتظر | ١٠ أوائل + استماع |
|--------------|-------------------|
| **منشور عام → زوار → تسجيل → لا عودة**. **تضيف features من دون معرفة ما يحتاجه الناس** | **١٠ ناس بالاسم**. **كل أسبوع ٣ مكالمات: «آخر مرة فتحت لماذا؟» «ماذا لم تستطع فعله؟»**. **مشكلة واحدة → تصلّح → ترجع** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Early Adopters (المستخدمون الأوائل)** | **من يجرّبون والمنتج لم يكتمل بعد** — **ويصبرون على المشاكل** | **أصدقاؤك يجرّبون مطعمك أول يوم والإضاءة لم تُركّب بعد** |
| **Feedback Loop (حلقة التغذية الراجعة)** | **تسمع → تعدّل → ترجع للمستخدم → تسمع مرة أخرى**. **أسرع طريقة للتطور** | **«المشكلة التي ذكرتها حُلّت»** — **وترجع تأخذ رأيه** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «أول ١٠ من دون marketing». **لا يُعاد توليده.**

### Screenshot block (intent)

**قياس التقدّم — ليس للمنظر:**

عند بناء واجهة تطبيقك — **فكّر: كيف يرى المستخدم أنه يتقدم؟** **هذه الأرقام تحرّك السلوك** — **ليس للزينة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **بعد ٤ أسابيع: ٤ من ١٠ ما زالوا يستخدمون التطبيق. ما القرار الصحيح؟**

- **الإجابة الصحيحة (خيار ١):** **ترجع تكلم من غادر ومن بقي** — **تفهم المشكلة قبل marketing جديد**.
- خيار ٢: **تبدأ إعلانات لتجيب ١٠ آخرين**.
- خيار ٣: **تستسلم — المنتج فشل**.

**التفسير:** **٤٠٪ retention يحتاج فهمًا** — **ليس كمية جديدة**. **اسمع أولًا، ثم قرّر**.

### Mission — رسالة دعوة + ٢ سؤال

**المقدمة:** **أول ١٠ يأتون بمجهودك الشخصي** — **ليس بإعلان**. **١٠–١٥ دقيقة**.

**التسليم:** **تطبيقك في سطر**، **رسالة الدعوة لـ ٣ ناس**، **سؤال ١ بعد التجربة**، **سؤال ٢ بعد التجربة**.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| رسالة واضحة | 50% | **رسالة قصيرة** — **تقول ما التطبيق وتطلب تجربة محددة**؛ **لا كلام تسويقي زائد** |
| أسئلة مفيدة | 50% | **سؤالان يخرجان feedback حقيقيًا** — **ليس «أعجبك؟» فقط**؛ **عن سلوك فعلي (آخر استخدام، أين التلخبط)** |

### Confidence close

- **فهمت:** **أول ١٠ مستخدمين = معلمون** — **ليسوا أرقامًا**.
- **تستطيع:** **عندك رسالة دعوة + سؤالان جاهزان**.
- **عمق Builder (اختياري) انتهى** — **مسارات Creator و Automator و Business و Analyst ما زالت قيمة لإكمال رحلتك**.

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
| Concept preservation | 5 | Early Adopters, Feedback Loop only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — listen before marketing |
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
| 12 | Slug validation — path end documented | ☑ pending-path-validation |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ pending |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human sign-off | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
