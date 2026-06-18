# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m1-l1-from-automation-to-insight` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m1` |
| **productionTitle (ar-EG)** | بياناتك جاهزة — دلوقتي بتسأل |
| **productionRoute** | `/learn/analyst/analyst-m1-l1-from-automation-to-insight` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m1-l1-from-automation-to-insight.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **5-lesson MSA canonical pilot** (Analyst path) |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Having numbers ≠ knowing what to do — Analyst asks before opening any report |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **approved-for-next-batch** |
| **humanReviewerSignOffDate** | 2026-06-04 |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: approved-for-next-batch** (Project Owner · 2026-06-04) — approved only for **controlled canonical expansion**, **not** production rollout or localization. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen (must not change via this artifact)

| Asset | Status |
|-------|--------|
| `analyst-m1-l1-from-automation-to-insight.ts` | **Frozen** |
| Bunny video for this lesson | **Frozen** |
| PATHS / slug / curriculum registry | **Frozen** |
| Mission AI evaluator / runtime | **Frozen** |

### What this artifact preserves from Egyptian production

| Element | Production value (preserved in canonical intent) |
|---------|--------------------------------------------------|
| **Learning objective** | Data ready ≠ decision ready; Automator collects — Analyst asks; pick one source + one decision + one question |
| **Block sequence** | Orientation → tension → core → comparison → glossary → video → diagram → quiz → mission → confidence close |
| **Mission rubric** | 60% clear decision · 40% linked question |
| **Quiz intent** | Cart abandonment — best first question = where in funnel customers drop off |
| **Concepts locked** | Data, Insight, Automator, Analyst, AI, Dashboard |
| **Next lesson continuity** | Feeling to question — turn «I feel…» into a data question |

### Derivation method

Read-only extraction from Egyptian TS + MSA normalization. No production writes.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m1-l1-from-automation-to-insight
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m1-l1-from-automation-to-insight.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: From Automation to Insight
  oneAha: "Automator collects — Analyst asks; numbers alone are not insight"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: []

objectives:
  - id: obj-1
    statement: Learner distinguishes data collection from decision-making; Analyst role = ask before opening reports.
    measurable: true
  - id: obj-2
    statement: Learner picks one table/dashboard/report and writes one decision + one specific question it must answer.
    measurable: true

concepts:
  - id: concept-data
    term: Data
    termEn: Data
    definition: Aggregated numbers and facts — sales, visits, orders — not yet a decision.
    mustPreserve: true
  - id: concept-insight
    term: Insight
    termEn: Insight
    definition: Understanding that tells you what to do — not just a number on screen.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Data ready is start not end; pick one source + decision after lesson
  - role: tension
    intent: Dashboard daily but no decision changes — data as decoration
  - role: core
    intent: Builder/Creator/Automator pipeline; Analyst asks what works and what decision this week
  - role: comparison
    intent: Watching numbers vs entering with a question
  - role: glossary
    intent: Data (بيانات); Insight (رؤية)
  - role: video
    intent: Optional collect-to-decide bridge — production Bunny unchanged
  - role: diagram
    intent: Decision loop — question → answer → decision → action → review
  - role: quiz
    intent: Cart abandonment — funnel drop-off question first
  - role: mission
    intent: One source + one decision + one linked question + action if answered
  - role: confidence_close
    intent: Ask before report; next = feeling to question

mission:
  type: practice
  intent: Pick one real table/dashboard/report; write decision + specific question + action if answered — not complex analysis
  rubricIntent:
    - dimension: clear_decision
      weight: 60
      criteria: Specific decision — not just «look at numbers»
    - dimension: linked_question
      weight: 40
      criteria: Question tied to decision — if answered, learner knows next move
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - pick_source_or_decision_for_learner

termsLocked: [Data, Insight, Dashboard, Automator, Analyst, AI]

links:
  nextLessonId: analyst-m2-l1-feeling-to-question
  continuityNote: Turn feeling into a specific data question

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

> **Dialect:** Modern Standard Arabic (neutral) · **Not:** replacement for live Egyptian copy

### Orientation — بداية الدرس

- **ماذا ستفهم؟** وجود أرقام ليس مثل فهم ما الذي ستفعله — **البيانات (Data)** الجاهزة بداية لا نهاية.
- **لماذا الآن؟** **Automator (الأتمتة)** جمع البيانات تلقائيًا. **Analyst (التحليل)** يحوّلها إلى قرار. حتى جدول أو **Dashboard (لوحة متابعة)** بسيط يكفي للبدء.
- **ماذا بعد الدرس؟** ستختار جدولًا أو **dashboard** أو تقريرًا واحدًا — وتكتب **ما القرار** الذي تريد أخذه منه.

### Tension — موقف مألوف

- **Dashboard (لوحة متابعة)** فيها ٢٠ رسمًا بيانيًا. تفتحه يوميًا وتقول «جميل» — لكن لا شيء تغيّر في عملك بسببه.
- البيانات أصبحت ديكورًا — لا أداة قرار. **Automator** كبّر الكومة، لكن **من دون سؤال محدد** لن تعرف كيف تتحرك.
- **AI (الذكاء الاصطناعي)** يساعدك على صياغة الأسئلة وتلخيص الأرقام — **أنت** تقرر أي سؤال يستحق وقتك وأي قرار ستأخذه.

### Core idea — الفكرة الأساسية

**Automator يجمع — Analyst يسأل**

- **Builder** بنى المنتج — كل نقرة وكل طلب يُسجّل. **Creator** جلب **Reach (الوصول)** — كل مشاهدة وكل lead يُحفظ.
- **Automator** وصل كل ذلك في مكان واحد: CRM أو Sheet أو قاعدة بيانات.
- **Analyst** يقف أمام البيانات ويسأل: ما الذي يعمل؟ ما الذي لا يعمل؟ **ما القرار** الذي يجب أن آخذه هذا الأسبوع؟
- الأرقام وحدها ليست **Insight (رؤية)** — **الرؤية** تظهر عندما يوصلك السؤال إلى قرار قابل للتنفيذ.

### Comparison — مثال من الحياة

| تتفرج فقط | تدخل بسؤال |
|-----------|------------|
| تفتح تقرير المبيعات كل صباح — ترى الأرقام وتمضي — لا سؤال ولا قرار | «لماذا انخفض **Conversion (التحويل)** ٥٪ هذا الأسبوع؟» — تفتح التقرير بسؤال واحد، تخرج بقرار محدد، تنفّذه اليوم |

### Glossary — مصطلحان للبداية

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Data (بيانات)** | أرقام وحقائق مجمّعة — مبيعات، زيارات، طلبات | «بعت ٤٥ قطعة هذا الأسبوع» — رقم، لا قرار |
| **Insight (رؤية)** | فهم يخبرك **ما الذي تفعله** — لا مجرد رقم على الشاشة | «البيع يزيد يوم الجمعة — أزيد الإعلان يوم الخميس» — **رؤية** تغيّر قرارًا |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny اختياري — من التجميع إلى القرار. **لا يُعاد توليده** في هذه المرحلة.

### Diagram block (intent)

حلقة القرار — ٥ مراحل: **Dashboard** بدون سؤال = ديكور. سؤال محدد → إجابة → قرار → تنفيذ → مراجعة. (الأصل البصري في الإنتاج يبقى كما هو.)

### Quiz — تأكيد سريع

> **Quiz key (unchanged):** correctIndex: 2

**السؤال:** لاحظت أن كثيرًا من الزبائن يضيفون منتجات للسلة ولا يشترون. ما أفضل أول سؤال للبيانات؟

- **الإجابة الصحيحة:** **أين بالضبط** يترك الزبائن عملية الشراء (**funnel drop-off**)؟
- **التفسير:** سؤال محدد يفهم «أين المشكلة» — يوصلك لقرار بخصوص مسار الشراء. الأرقام العامة لا تكفي.

### Mission — اختر مصدرًا واحدًا — وحدّد قرارك

**المقدمة:** توجيه عملي — ليس تحليلًا معقدًا. اختر جدولًا أو **dashboard** أو تقريرًا واحدًا (حتى Sheet بسيط). اكتب **ما القرار** الذي تريد أخذه منه.

**التسليم:** (١) المصدر · (٢) القرار في جملة واحدة · (٣) سؤال واحد محدد يجب أن تجيبه البيانات · (٤) إذا أجبت الآن — ماذا ستفعل؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| قرار واضح | 60% | قرار محدد — ليس «أشاهد الأرقام» فقط |
| سؤال مربوط | 40% | السؤال مربوط بالقرار — إذا أُجيب، تعرف كيف تتحرك |

### Confidence close — ماذا لديك الآن؟

- **فهمت:** وجود أرقام ≠ فهم ما تفعل — **Analyst** يسأل قبل فتح أي تقرير.
- **تستطيع:** مصدر واحد + قرار واحد + سؤال واحد يوجّهك.
- **التالي:** حوّل الشعور إلى سؤال — «أشعر أن…» → سؤال تجيبه البيانات.

---

## 5. Future generation notes

| Target locale | Derives from | Not from |
|---------------|--------------|----------|
| `ar-Gulf` | This MSA canonical | Egyptian dialect directly |
| `en` | This MSA canonical | Egyptian dialect directly |

Deferred: Bunny regen · Remotion · RAG seed · runtime · PATHS changes.

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
| 1 | Explicit user-selected locale | Manual choice **always wins** |
| 2 | Saved account or browser preference | Persisted from prior session |
| 3 | IP / location-based suggestion | Auto-suggest when geo available |
| 4 | Default fallback | **Current Egyptian Arabic experience** |

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| **Objective preservation** | 4 | Pending human review |
| **Concept preservation** | 5 | Data, Insight only — no new tools |
| **Beginner clarity** | 4 | Polish pass 2026-06-18; pending human read-aloud |
| **MSA simplicity** | 4 | Pending dialect scan |
| **Mission consistency** | 5 | 60/40 rubric matches production |
| **Quiz integrity** | 5 | Funnel drop-off answer unchanged |
| **Assistant boundaries** | 4 | forbiddenAssistantBehaviors listed |
| **Localization readiness** | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

### Human reviewer sign-off (via review packet)

Recorded in [`HUMAN_REVIEW_PACKET_5_LESSONS.md`](HUMAN_REVIEW_PACKET_5_LESSONS.md) — per-dimension scores not recorded; decision **approve with notes**.

| Field | Value |
|-------|-------|
| **Reviewer** | Project Owner |
| **Date** | 2026-06-04 |
| **Decision** | approve with notes |
| **Next-batch authorization** | yes — **controlled canonical expansion only** |
| **Note** | Approved only for controlled canonical expansion — **not** production rollout or localization |

| Human reviewer average | **not scored — approve with notes via packet** |
| **Next controlled batch authorized?** | **yes — approved-for-next-batch** |
| **Production-ready?** | **no** |

---

## 8. Review checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production file untouched | ☑ pass |
| 2 | Bunny video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production (60/40) | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer sign-off recorded — next-batch gate met | ☑ pass (approve with notes · 2026-06-04) |
| 15 | **Draft / not production-ready** stated | ☑ confirmed |
| 16 | Human reviewer sign-off | ☑ **Project Owner · 2026-06-04 · approved-for-next-batch** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
