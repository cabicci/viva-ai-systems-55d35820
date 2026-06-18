# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m5-l5-mini-win` |
| **pathId** | `builder` |
| **moduleId** | `builder-m5` |
| **productionTitle (ar-EG)** | Mini-Win: شوف إنت فهمت إيه |
| **productionRoute** | `/learn/builder/builder-m5-l5-mini-win` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m5-l5-mini-win.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Small and shipped beats complete and untested — Mini Win before perfection |
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
| `builder-m5-l5-mini-win.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Mini Win = smallest shippable version; feedback beats feature list |
| **Mission rubric** | 60% Mini Win defined · 40% clear boundaries |
| **Quiz intent** | Define Mini Win before Phase 3 (correctIndex 0) |
| **Concepts locked** | Mini Win, MVP |
| **Prerequisite** | `builder-m5-l4-database-intro` |
| **Next lesson** | `builder-m6-l1-idea-to-page` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m5-l5-mini-win
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m5-l5-mini-win.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Mini Win — Check What You Learned
  oneAha: "Small and shipped beats complete and untested — Mini Win before perfection"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m5-l4-database-intro]

objectives:
  - id: obj-1
    statement: Learner explains Mini Win as smallest published version with real user feedback.
    measurable: true
  - id: obj-2
    statement: Learner defines Mini Win with page + action + outcome + boundaries + 3 testers.
    measurable: true

concepts:
  - id: concept-mini-win
    term: Mini Win
    termEn: Mini Win
    definition: Smallest published version proving the idea works — not prototype in head.
    mustPreserve: true
  - id: concept-mvp
    term: MVP
    termEn: Minimum Viable Product
    definition: Same idea in English — least product delivering real value.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Small shipped > big untested; define Mini Win after lesson
  - role: tension
    intent: 20 features planned — nothing live after a month
  - role: core
    intent: One page + one action + one outcome; feedback from 3 users
  - role: comparison
    intent: Plan everything first vs Mini Win in a week
  - role: glossary
    intent: Mini Win, MVP
  - role: video
    intent: Why small is faster — production Bunny unchanged
  - role: core
    intent: Three layers ready — minimal in each, end-to-end (no screenshot in production)
  - role: quiz
    intent: Define Mini Win first (correctIndex 0)
  - role: mission
    intent: Define Mini Win with boundaries and testers
  - role: confidence_close
    intent: Bridge to Phase 3; next = idea to page

mission:
  type: practice
  intent: Define Mini Win — page, action, outcome, not-now list, 3 testers — ~5–10 min
  rubricIntent:
    - dimension: mini_win_defined
      weight: 60
      criteria: Page + action + outcome — not full app; imaginable shipped in a week
    - dimension: clear_boundaries
      weight: 40
      criteria: Has not-now list; 3 named testers
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_mini_win_for_learner

termsLocked: [Mini Win, MVP, Product Request, Frontend, Backend, Database]

links:
  nextLessonId: builder-m6-l1-idea-to-page
  continuityNote: Idea to page — any idea becomes screens and steps

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

- **ماذا ستفهم؟** **«صغير ومنشور» أفضل من «كامل وغير مجرب»** — **Mini Win (انتصار صغير) قبل الكمال**.
- **لماذا الآن؟** **أنهيت ٣ طبقات**: **واجهة، كواليس، مخزن**. **وقت التوقف والتثبيت**.
- **ماذا بعد الدرس؟** **ستعرّف Mini Win لتطبيقك** — **أصغر نسخة تنشرها وتجربها**.

### Tension — تخطّط لتطبيق ضخم — ولا تبدأ

- **لديك ٢٠ ميزة في ذهنك**: **login، دفع، ٥ لغات، dashboard، notifications...**
- **بعد شهر ما زلت تخطّط** — **ولا شيء يعمل أمام مستخدم حقيقي**.
- **المشكلة ليست الفكرة**. **المشكلة أنك تنتظر «الكمال» قبل التجربة**.

### Core idea — صغير ومنشور > كامل وغير مجرب

- **Mini Win = أصغر نسخة من تطبيقك تنشرها وتجربها مع مستخدم حقيقي**.
- **صفحة واحدة + action (فعل) واحد + نتيجة واحدة = كفاية للبداية**.
- **Feedback (ملاحظات) من ٣ مستخدمين أهم من ٣٠ ميزة لم يجرّبها أحد**.
- **Phase 2 أنهت المفاهيم — Phase 3 ستبني**. **Mini Win جسرك**.

### Comparison — تطبيق كامل في الذهن vs Mini Win

| «سأفعل كل شيء أولًا» | Mini Win في أسبوع |
|----------------------|-------------------|
| **٣ أشهر تخطيط**. **login + دفع + ١٠ صفحات**. **لا أحد جرّب — لا feedback** | **صفحة واحدة: اكتب سؤال → AI يرد**. **٥ أصدقاء جرّبوا**. **عرفت ما يعمل وما لا** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Mini Win (انتصار صغير)** | **أصغر نسخة منشورة تثبت أن الفكرة تعمل** — **ليس prototype (نموذج) في الذهن** | «**AI يلخّص مقال**» — **صفحة واحدة، لصق + زر + ملخص. بس** |
| **MVP (Minimum Viable Product — أقل منتج قابل للتطبيق)** | **نفس الفكرة بالإنجليزي** — **أقل منتج يقدّم قيمة حقيقية** | **Uber بدأ بـ «اطلب عربية»** — **بدون Uber Eats** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «لماذا «صغير» أسرع — Mini Win». **لا يُعاد توليده.**

### Core block — ٣ طبقات جاهزة للبناء

- **Frontend**: **العميل يرى وينقر**.
- **Backend**: **AI يعمل خلف الشاشة**.
- **Database**: **التطبيق يتذكر**.
- **Mini Win = أقل شيء في كل طبقة** — **لكن يعمل end-to-end (من البداية للنهاية)**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **سارة لديها فكرة AI app فيها ١٥ ميزة. ما أفضل خطوة قبل Phase 3؟**

- **الإجابة الصحيحة (خيار ١):** **تعرّف Mini Win — أصغر نسخة تنشرها وتجربها**.
- خيار ٢: **تكمّل تخطيط الـ ١٥ ميزة كلها**.
- خيار ٣: **تتعلم React و SQL أولًا**.

**التفسير:** **Mini Win أولًا** — **feedback حقيقي أهم من خطة كاملة بلا تجربة**.

### Mission — عرّف Mini Win لتطبيقك

**المقدمة:** **مهمة تعريف — ليست بناء**. **استخدم Product Request من درس الانتقال**. **٥–١٠ دقائق**.

**التسليم:**

1. **الفكرة (جملة)**
2. **Mini Win**: **صفحة واحدة، action واحد، نتيجة واحدة**
3. **ما ليس في Mini Win (لاحقًا)**: **feature 1، feature 2**
4. **أول ٣ testers (مجرّبين)**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| Mini Win محدّد | 60% | **صفحة + action + نتيجة** — **ليس «تطبيقًا كاملًا»**. **تستطيع تخيّله منشورًا في أسبوع** |
| حدود واضحة | 40% | **فيه «ليس الآن»**. **٣ testers محدّدون** |

### Confidence close

- **فهمت:** **صغير ومنشور > كامل وغير مجرب**. **Mini Win = جسرك لـ Phase 3**.
- **تستطيع:** **تعريف Mini Win + حدود + ٣ testers**.
- **التالي:** **من فكرة لصفحة** — **كيف أي idea تصبح شاشات وخطوات**.

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
| Concept preservation | 5 | Mini Win, MVP only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Mini Win first |
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
