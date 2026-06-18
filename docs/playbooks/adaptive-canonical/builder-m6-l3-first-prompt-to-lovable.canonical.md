# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `builder-m6-l3-first-prompt-to-lovable` |
| **pathId** | `builder` |
| **moduleId** | `builder-m6` |
| **productionTitle (ar-EG)** | أول Prompt لـ Lovable |
| **productionRoute** | `/learn/builder/builder-m6-l3-first-prompt-to-lovable` |
| **productionFile (read-only)** | `src/components/intro/lessons/builder-m6-l3-first-prompt-to-lovable.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | First prompt = goal + users + pages + style + constraints |
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
| `builder-m6-l3-first-prompt-to-lovable.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | First Lovable prompt needs 5 parts; Lovable = build assistant, not coding |
| **Mission rubric** | 60% all five present · 40% copy-ready |
| **Quiz intent** | Constraints limit scope (correctIndex 0) |
| **Concepts locked** | Prompt Spec, Scope |
| **Prerequisite** | `builder-m6-l2-wireframe` |
| **Next lesson** | `builder-m6-l4-components-routes` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: builder-m6-l3-first-prompt-to-lovable
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/builder-m6-l3-first-prompt-to-lovable.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: First Prompt to Lovable
  oneAha: "First prompt = goal + users + pages + style + constraints"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [builder-m6-l2-wireframe]

objectives:
  - id: obj-1
    statement: Learner lists five Prompt Spec parts and explains Lovable as describe-not-code tool.
    measurable: true
  - id: obj-2
    statement: Learner writes copy-ready first Lovable prompt from Wireframe.
    measurable: true

concepts:
  - id: concept-prompt-spec
    term: Prompt Spec
    termEn: Prompt Spec (UI specification)
    definition: Full recipe — goal, users, pages, style, constraints.
    mustPreserve: true
  - id: concept-scope
    term: Scope
    termEn: Scope
    definition: What is in this version vs later.
    mustPreserve: true

blocks:
  - role: orientation
    intent: 5-part prompt; copy-ready draft after lesson
  - role: tension
    intent: «Build UI» literal → wrong output
  - role: core
    intent: Goal, Users, Pages, Style, Constraints defined
  - role: comparison
    intent: 3 words vs full Prompt Spec
  - role: glossary
    intent: Prompt Spec, Scope
  - role: video
    intent: Vague vs clear prompt — production Bunny unchanged
  - role: screenshot
    intent: Prompt → Preview in Lovable
  - role: quiz
    intent: Constraints for Home-only no login (correctIndex 0)
  - role: mission
    intent: Write first Lovable prompt draft
  - role: confidence_close
    intent: Ready for Components & Routes

mission:
  type: practice
  intent: Draft Goal, Users, Pages, Style, Constraints from Wireframe — ~10–15 min
  rubricIntent:
    - dimension: five_present
      weight: 60
      criteria: All five written; Pages tied to Wireframe not generic
    - dimension: copy_ready
      weight: 40
      criteria: Style has at least two colors; Constraints define not-now
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_lovable_prompt_for_learner

termsLocked: [Prompt Spec, Scope, Lovable, Wireframe, Prompt]

links:
  nextLessonId: builder-m6-l4-components-routes
  continuityNote: Components & Routes — how pages connect

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

- **ماذا ستفهم؟** **أول Prompt (طلب) يحتاج ٥ أجزاء**: **goal + users + pages + style + constraints**.
- **لماذا الآن؟** **لديك Wireframe** — **الآن حوّله إلى طلب Lovable يفهمك من أول مرة**.
- **ماذا بعد الدرس؟** **مسودة prompt جاهزة للنسخ** — **ليس كودًا ولا برمجة**.
- **Lovable = مساعد بناء يقرأ وصفك ويطلع واجهة**. **أنت توصف — لا تبرمج**.

### Tension — «اعمل واجهة» — فيخرج ليس ما في بالك

- **كتبت «ابنِ واجهة AI»** — **خرجت ألوان فاقعة وأقسام لا تريدها**.
- **Lovable يبني ما تكتبه حرفيًا** — **ليس ما تتمنى**. **٣ كلمات = تخمين كامل**.
- **الحل**: **اكتب وصفة ٥ أجزاء** — **انسخها في Lovable وشاهد النتيجة**.

### Core idea — أول prompt = ٥ أجزاء

- **Goal (الهدف)**: **ما نوع الواجهة ولأجل ماذا؟**
- **Users (المستخدمون)**: **من سيستخدمها؟**
- **Pages (الصفحات)**: **اذكر Wireframe بالاسم**.
- **Style (الأسلوب)**: **ألوان، نبرة، mood (مزاج)**.
- **Constraints (الحدود)**: **ما الذي ليس في النسخة الأولى**.

### Comparison — «ابنِ واجهة» vs Prompt Spec

| ٣ كلمات | Prompt Spec |
|---------|-------------|
| «**ابنِ واجهة كافيه**» — **AI يخمّن كل شيء. ٦ تعديلات. ما زال غير مضبوط** | **Goal: landing page لكافيه + AI باريستا. Users: زبائن ٢٠–٣٥. Pages: hero + منيو ٦ مشروبات + تواصل. Style: دافئ، بنّي وبيج. Constraints: بدون login** |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Prompt Spec (مواصفات الواجهة)** | **الوصفة الكاملة** — **goal, users, pages, style, constraints** | **كمواصفات بدلة للخياط: مقاس، لون، عدد أزرار** |
| **Scope (النطاق)** | **ما في هذه النسخة — وما لاحقًا** | «**صفحة واحدة فقط — Home**» — **ليس «موقعًا كاملًا»** |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «prompt غامض vs واضح». **لا يُعاد توليده.**

### Screenshot block (intent)

**Prompt على اليسار — preview على اليمين**. **الـ prompt ليس «اعمل واجهة»** — **فيه goal، نشاط، أقسام بالاسم، وstyle**. **النتيجة أقرب من أول مرة**.

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 0

**السؤال:** **تريد Lovable يبني Home Page فقط — بدون login. ما أفضل جزء في Prompt Spec؟**

- **الإجابة الصحيحة (خيار ١):** **Constraints: صفحة واحدة (Home) — بدون login في النسخة الأولى**.
- خيار ٢: «**اعمل موقعًا كاملًا**».
- خيار ٣: **Style: ألوان جميلة**.

**التفسير:** **Constraints + Scope يحدّدان الحدود** — **AI لا يخمّن ميزات زائدة**.

### Mission — اكتب أول prompt لـ Lovable

**المقدمة:** **مسودة للنسخ — ليس تنفيذًا**. **استخدم Wireframe من الدرس السابق**. **١٠–١٥ دقيقة**.

**التسليم:**

- **Goal:** [نوع الواجهة + ماذا تفعل]
- **Users:** [من يستخدمها]
- **Pages:** [أقسام Wireframe بالاسم]
- **Style:** [لونان + mood]
- **Constraints:** [ما ليس في النسخة الأولى]

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| الخمسة موجودون | 60% | **Goal, Users, Pages, Style, Constraints — كلهم مكتوبون**. **Pages مربوطة بـ Wireframe** |
| جاهز للنسخ | 40% | **Style فيه لونان على الأقل**. **Constraints تحدّد «ليس الآن»** |

### Confidence close

- **فهمت:** **أول prompt = ٥ أجزاء**. **Lovable مساعد بناء — أنت توصف لا تبرمج**.
- **تستطيع:** **مسودة جاهزة للنسخ في Lovable عندما تريد**.
- **التالي:** **Components & Routes** — **كيف تتربط الصفحات**.

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
| Concept preservation | 5 | Prompt Spec, Scope only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — Constraints |
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
