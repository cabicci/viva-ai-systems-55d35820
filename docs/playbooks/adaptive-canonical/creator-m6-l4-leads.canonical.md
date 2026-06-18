# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `creator-m6-l4-leads` |
| **pathId** | `creator` |
| **moduleId** | `creator-m6-distribute` |
| **productionTitle (ar-EG)** | من Views لـ Leads |
| **productionRoute** | `/learn/creator/creator-m6-l4-leads` |
| **productionFile (read-only)** | `src/components/intro/lessons/creator-m6-l4-leads.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Followers are not clients without a bridge — simple Lead Magnet or DM offer plus CTA |
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
| `creator-m6-l4-leads.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Build small clear bridge — content builds trust, CTA moves to Lead Magnet or DM step |
| **Mission rubric** | 50% offer clarity · 50% feasibility |
| **Quiz intent** | High engagement no sales inquiries → add bridge with Lead Magnet or DM (correctIndex 1) |
| **Concepts locked** | Lead, Lead Magnet, CTA |
| **Prerequisite** | `creator-m6-l3-analytics` |
| **Next lesson** | `creator-m7-l1-brand-basics` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: creator-m6-l4-leads
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/creator-m6-l4-leads.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: From Views to Leads
  oneAha: "Followers are not clients without a bridge — simple Lead Magnet or DM offer plus CTA"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [creator-m6-l3-analytics]

objectives:
  - id: obj-1
    statement: Learner designs one clear conversion step — Lead Magnet or simple DM offer with CTA.
    measurable: true
  - id: obj-2
    statement: Learner writes one-line CTA and first follow-up message for interested leads.
    measurable: true

concepts:
  - id: concept-lead
    term: Lead
    termEn: Lead
    definition: Person genuinely interested and ready to take a contact or signup step.
    mustPreserve: true
  - id: concept-lead-magnet
    term: Lead Magnet
    termEn: Lead Magnet
    definition: Simple free value in exchange for contact method.
    mustPreserve: true
  - id: concept-cta
    term: CTA
    termEn: Call To Action
    definition: Clear invitation to one step after the content.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Follower not client without bridge — build path from content to leads
  - role: tension
    intent: Gap between attention and purchase — next step unclear
  - role: core
    intent: Content trust plus CTA to Lead Magnet or keyword DM — not instant sale
  - role: comparison
    intent: Followers only vs clear conversion system
  - role: glossary
    intent: Lead, Lead Magnet, CTA
  - role: video
    intent: Build bridge without complexity — production Bunny unchanged
  - role: diagram
    intent: Leads funnel — each stage fewer but higher quality
  - role: quiz
    intent: Add bridge when engagement high no inquiries (correctIndex 1)
  - role: mission
    intent: Design Lead Magnet or DM offer with CTA and first reply
  - role: confidence_close
    intent: Clear conversion step — balanced creator business

mission:
  type: practice
  intent: Lead Magnet or DM offer — problem, offer shape, one-line CTA, first follow-up message
  rubricIntent:
    - dimension: offer_clarity
      weight: 50
      criteria: Offer tied to one direct understandable problem
    - dimension: feasibility
      weight: 50
      criteria: Clear CTA and first message ready for follow-up
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - design_offer_for_learner

termsLocked: [Lead, Lead Magnet, CTA]

links:
  nextLessonId: creator-m7-l1-brand-basics
  continuityNote: Brand basics next — POV before colors

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

- **ماذا ستفهم؟** **المتابع ليس عميلًا** **من دون كوبري (جسر)**.
- **عدد المتابعين مهم** — **لكن من دون انتقال منطقي لعرضك** **يبقى التأثير جميلًا** **من دون نتيجة**.
- **الهدف ليس البيع المباشر** **في كل منشور** — **بل بناء طريق واضح** **من المحتوى إلى Leads (عملاء محتملون)**.

### Tension — المشكلة

- **فجوة بين الانتباه والشراء**.
- **كثيرون يتابعونك ويستفيدون** — **لكن لحظة القرار تضيع** **لأن الخطوة التالية غير واضحة**.
- **من دون CTA (دعوة لاتخاذ إجراء) بسيط** **وقيمة أولية** — **المتابع يبقى متابعًا** **من دون أن يتحول لعميل محتمل**.

### Core idea — اعمل كوبريًا صغيرًا وواضحًا

- **المحتوى يبني ثقة** — **والـ CTA ينقل الشخص** **لخطوة محددة:** **تحميل هدية بسيطة**، **أو رسالة بكلمة مفتاحية**، **أو تسجيل قصير**.
- **الهدف في هذه المرحلة** **ليس البيع الفوري** — **بل جمع Leads جادة** **تتابع معها باحترام**.
- **كلما كان الكوبري بسيطًا وواضحًا** — **زاد التحويل** **من دون ضغط أو إلحاح**.

### Comparison — متابعون فقط أم نظام تحويل؟

| من دون كوبري | بكوبري واضح |
|--------------|-------------|
| **محتوى جميل وتفاعل جيد** — **لكن لا خطوة انتقال واضحة** — **جمهور واسع وتحويل ضعيف** | **قيمة مجانية بسيطة + CTA محدد + متابعة** — **Leads أكثر جودة** **حتى لو المشاهدات أقل** |

### Glossary — مصطلحات التحويل

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Lead (عميل محتمل)** | **شخص مهتم فعلًا** **ومستعد لخطوة للتواصل أو التسجيل** | **أرسل كلمة مفتاحية في DM** **للحصول على التفاصيل** |
| **Lead Magnet (أداة جذب)** | **قيمة مجانية بسيطة** **مقابل وسيلة تواصل** | **Checklist أو Template** **مرتبط بمشكلته المباشرة** |
| **CTA (دعوة لاتخاذ إجراء)** | **دعوة واضحة** **لخطوة واحدة بعد المحتوى** | «**أرسل كلمة «دليل»** **لأصلك الملف**» |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — «كيف تبني الكوبري من دون تعقيد». **لا يُعاد توليده.** **تحويل المتابع المهتم** **إلى Lead فعلي** **من دون أن تكون بيعيًا زائدًا**.

### Diagram block (intent)

مخطط بصري — **قمع التحويل من المحتوى إلى Leads**. **كل مرحلة تقلل العدد** **لكن تزيد الجودة**. **المهم** **أن يكون الانتقال من مرحلة لمرحلة واضحًا**. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 1

**السؤال:** **لديك تفاعل عالٍ** **لكن لا استفسارات شراء** — **أنسب خطوة أولى؟**

- خيار ١: **أزيد عدد المنشورات فقط**.
- **الإجابة الصحيحة (خيار ٢):** **أضيف كوبريًا واضحًا:** **Lead Magnet أو عرض DM بسيط**.
- خيار ٣: **ألغي المحتوى التعليمي** **وأركز عروضًا مباشرة فقط**.

**التفسير:** **المشكلة هنا غالبًا** **في غياب الانتقال الواضح** — **لا في حجم التفاعل نفسه**.

### Mission — صمّم Lead Magnet أو عرض DM بسيط

**المقدمة:** **خطوة تحويل واحدة واضحة** **تطبقها هذا الأسبوع** **من دون تعقيد**.

**التسليم:** Lead Magnet **أو** DM offer · المشكلة · شكل العرض · CTA جملة واحدة · **نص أول رسالة للمهتمين**

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| وضوح العرض | 50% | **العرض مرتبط بمشكلة واحدة مباشرة ومفهومة** |
| قابلية التنفيذ | 50% | **CTA واضح** **ورسالة أولى جاهزة للمتابعة** |

### Confidence close

- **فهمت:** **لن تعتمد على الصدفة**. **لديك خطوة تحويل واضحة** **تعمل عليها وتطوّرها بالأرقام**.
- **تستطيع:** **تبني Creator business متوازنًا** — **محتوى يصل** **ونظام يحوّل**.
- **التالي:** **Brand Basics** — **POV ثابت قبل الألوان**.

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
| Concept preservation | 5 | Lead, Lead Magnet, CTA only |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 50/50 rubric matches production |
| Quiz integrity | 5 | correctIndex 1 — add bridge |
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
