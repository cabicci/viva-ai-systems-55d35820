# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m2-l3-decide-what-to-automate` |
| **pathId** | `automator` |
| **moduleId** | `automator-m2` |
| **productionTitle (ar-EG)** | قرّر إيه يتأتمت |
| **productionRoute** | `/learn/automator/automator-m2-l3-decide-what-to-automate` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m2-l3-decide-what-to-automate.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-04 |
| **pilotSet** | **25-lesson MSA canonical accelerated batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Best first automation = repeating + simple + low risk — not the hardest or flashiest Flow |
| **workflowPosition** | Egyptian production → **this MSA canonical** → future Gulf / English / other locales |
| **templateReference** | [`MSA_CANONICAL_TEMPLATE.md`](MSA_CANONICAL_TEMPLATE.md) · templateVersion `2026-06-04` |
| **humanReviewerSignOff** | **pending** |
| **humanReviewerSignOffDate** | **pending** |

> **Important:** This file is a **draft** MSA canonical source only — **not production-ready**. **Human reviewer sign-off: pending** — not approved for production rollout, localization, or controlled batch scale until a named reviewer records scores and checklist sign-off. It does **not** modify the live lesson, Bunny video, mission runtime, assistant/RAG seed, or any production file.

---

## 2. Source preservation summary

### What is frozen

| Asset | Status |
|-------|--------|
| `automator-m2-l3-decide-what-to-automate.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Prioritize first automation: repeating + simple + low risk; rank 5 tasks on easy/hard × high/low frequency matrix |
| **Mission rubric** | 60% matrix + 5 tasks · 40% decision + rule |
| **Quiz intent** | Form-to-sheet copy (40×/month, 3 steps) beats creative report or personal partner email |
| **Concepts locked** | Task Candidate, Build-effort payback period |
| **Prerequisites** | `automator-m2-l2-spot-patterns` |
| **Next lesson** | `automator-m3-l1-tools-landscape` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m2-l3-decide-what-to-automate
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m2-l3-decide-what-to-automate.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Decide What to Automate
  oneAha: "First automation = repeating + simple + low risk — quick win for the virtual worker"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [automator-m2-l2-spot-patterns]

objectives:
  - id: obj-1
    statement: Learner applies three priority criteria — frequency, simplicity, risk — to rank automation candidates.
    measurable: true
  - id: obj-2
    statement: Learner places 5 tasks on easy/hard × high/low frequency matrix and picks first automation plus one manual exception with rule.
    measurable: true

concepts:
  - id: concept-task-candidate
    term: Task Candidate
    termEn: Task Candidate
    definition: Task screened for repeat, simplicity, and low risk before automation.
    mustPreserve: true
  - id: concept-roi
    term: Build-effort payback period
    termEn: Build-effort payback period
    definition: Build time (hours) ÷ net monthly time saved (hours/month) = build-effort payback period (months). Example: 0.5 ÷ 2 = 0.25 month, assuming the 2 hours/month is net of oversight and maintenance. Under two months is a teaching assumption, not a universal rule; retain risk and maintenance checks.
    mustPreserve: true

blocks:
  - role: orientation
    intent: First automation = repeat + simple + low risk; matrix 5 tasks after lesson
  - role: tension
    intent: Automating hardest/coolest task — 3 hours, runs once/month; enthusiasm ≠ criterion
  - role: core
    intent: Three criteria; easy/hard × frequency matrix; form-to-sheet win vs personal email counter
  - role: comparison
    intent: First Flow = hardest vs first Flow = easiest repeating
  - role: glossary
    intent: Task Candidate (مرشّح أتمتة); مدة استرداد جهد البناء (Build-effort payback period)
  - role: video
    intent: Optional — rank automation candidates — production Bunny unchanged
  - role: screenshot
    intent: Priority matrix — easy/hard × frequency
  - role: quiz
    intent: Three candidates — form-to-sheet wins (repeat + simple + low risk)
  - role: mission
    intent: Place 5 audit/pattern tasks on matrix; pick first automation + manual exception + rule
  - role: confidence_close
    intent: Five ranked tasks + one candidate ready; next = Tools Landscape

mission:
  type: practice
  intent: Take 5 tasks from audit or patterns; place each on matrix (easy/hard × high/low frequency); pick first automation from easy+high quadrant + one manual exception + one rule — 10–15 min design
  rubricIntent:
    - dimension: matrix_five_tasks
      weight: 60
      criteria: Each task in clear quadrant with frequency and steps; matrix spread logical
    - dimension: decision_rule
      weight: 40
      criteria: First automation from easy+high frequency; manual exception with reason + applicable rule
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_tasks_or_matrix_placement_for_learner

termsLocked: [Task Candidate, Build-effort payback period, Flow]

links:
  nextLessonId: automator-m3-l1-tools-landscape
  continuityNote: Tools Landscape — tools differ, thinking stays Trigger → steps → output

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

- **ماذا ستفهم؟** أفضل أول أتمتة = مهمة متكرّرة + بسيطة + مخاطرة قليلة — وليست أصعب حاجة ولا أروع **تدفق عمل (Flow)**.
- **لماذا الآن؟** بعد أن رصدت الأنماط، تحتاج ترتيبها — ليس كل نمط يستحق أن يكون الأول للعامل الافتراضي.
- **ماذا بعد الدرس؟** ستضع ٥ مهام على مصفوفة (سهل/صعب × تكرار عالي/منخفض) وتختار الأولى.

### Tension — موقف مألوف

- «سأؤتمت هذا — يبدو رائعًا!» — وبعد ٣ ساعات لا فائدة.
- تختار أصعب مهمة — أو أندر نمط — وتبني **تدفق عمل (Flow)** معقّدًا. يعمل مرة في الشهر.
- الحماس ليس معيارًا. المعيار: كم ساعة ستوفر كل أسبوع؟ وإذا أخطأت، ماذا يحدث؟
- أول أتمتة للعامل الافتراضي = فوز سريع — وليس مشروعًا طويلًا.

### Core idea — متكرّر + بسيط + مخاطرة قليلة = أولوية

- **٣ معايير للأولوية:** التكرار (كم مرة/أسبوع؟)، البساطة (٢–٣ خطوات ثابتة؟)، المخاطرة (إذا أخطأت — ما الضرر؟).
- **مصفوفة بسيطة:** أفقي = سهل ↔ صعب، ورأسي = تكرار عالٍ ↔ منخفض. السهل والمتكرر مرشح وليس موافقة تلقائية؛ قد تستبعده المخاطرة.
- **مثال توضيحي:** نسخ بيانات نموذج مصطنعة إلى جدول مسودة منفصل —٤٠ مرة/شهر وثلاث خطوات. يراجع شخص النتيجة قبل استخدامها ويمكن إعادة بناء المسودة؛ لا رسائل آلية ولا تعديل للسجل المعتمد.
- **مثال مضاد:** «بريد شخصي لشريك» — مرة كل شهرين، يحتاج لمسة بشرية. اتركه يدويًا.
- **فحص مخاطرة لكل مرشح:** حدّد أثر الخطأ وإمكانية المراجعة قبل الاستخدام وإمكانية التراجع. قد تُستبعد مهمة سهلة ومتكررة إذا كان ضررها مرتفعًا.


### Comparison — أتمتة بالحماس vs أتمتة بالترتيب

| أول Flow = الأصعب | أول Flow = الأسهل المتكرّر |
|---|---|
| كريم أتمت ردود ذكاء اصطناعي معقّدة — ٥ ساعات بناء — يحدث ٣ مرات/شهر. عائد ضعيف ومخاطرة عالية إذا أخطأ. | **فحص مخاطرة لكل مرشح:** حدّد أثر الخطأ وإمكانية المراجعة قبل الاستخدام وإمكانية التراجع. قد تُستبعد مهمة سهلة ومتكررة إذا كان ضررها مرتفعًا. |


### Glossary — مصطلحان للاختيار

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Task Candidate (مرشّح أتمتة)** | مهمة نفحصها: متكرّرة؟ بسيطة؟ مخاطرة قليلة؟ | «بريد ترحيب بعد حجز» — مرشّح قوي |
| **مدة استرداد جهد البناء (Build-effort payback period)** | وقت بناء الأتمتة بالساعات ÷ صافي الوقت الموفّر شهرياً بالساعات/شهر = مدة الاسترداد بالشهور. حد أقل من شهرين افتراض تعليمي لهذا المثال، وليس قاعدة جدوى عامة؛ راجع المخاطر والصيانة والمتابعة. | ٣٠ دقيقة بناء = ٠٫٥ ساعة؛ نفترض توفير ساعتين شهرياً صافياً بعد وقت المتابعة والصيانة: ٠٫٥ ÷ ٢ = ٠٫٢٥ شهر. |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تختار أول أتمتة: متكرّر، بسيط، مخاطرة قليلة. **لا يُعاد توليده**.

### Screenshot block (intent)

مصفوفة القرار — محور = سهل أو صعب. محور = تكرار عالي أو منخفض. الزاوية «سهل + تكرار عالي» = أولوية العامل الافتراضي. استخدمها في المهمة.

### Quiz — تأكيد سريع

**السؤال:** أي مرشح أنسب لأول أتمتة؟ (أ) نسخ بيانات نموذج مصطنعة لمسودة منفصلة،٤٠ مرة/شهر وثلاث خطوات؛ مراجعة قبل الاستخدام وإعادة بناء ممكنة، دون إرسال أو تعديل للسجل المعتمد. (ب) مسودة تقرير إبداعي أسبوعي من عشر خطوات؛ قد يضر التفسير الخاطئ بالقرار وتلزم مراجعة قبل التوزيع. (ج) بريد شخصي لشريك مرة كل شهرين؛ يحتاج موافقة ولا يمكن محو أثره بالكامل بعد الإرسال.

1. أتمتة (أ): نسخ البيانات المصطنعة إلى المسودة الخاضعة للمراجعة.
2. أتمتة (ب): إعداد التقرير الإبداعي الأسبوعي.
3. أتمتة (ج): إرسال البريد الشخصي للشريك.

**التفسير:** يجمع (أ) التكرار والبساطة مع ضوابط معلنة: بيانات مصطنعة ومسودة منفصلة قابلة لإعادة البناء ومراجعة قبل الاستخدام. يتطلب (ب) حكمًا أعقد، و(ج) نادر وله أثر خارجي. المخاطرة قيد مستقل عن ربع المصفوفة.

**correctIndex:** 0 (unchanged)


### Mission — رتّب ٥ مهام على المصفوفة

خذ ٥ مهام من **جرد الوقت** أو الأنماط — وضع كل واحدة على المصفوفة (سهل/صعب × تكرار عالي/منخفض). ١٠–١٥ دقيقة كافية.

**التسليم:**

1. لكل مهمة من الخمس، اكتب الاسم والربع والتكرار الأسبوعي وعدد الخطوات.
2. لكل مرشح، حدّد أثر الخطأ وإمكانية المراجعة قبل الاستخدام والتراجع.
3. اختر المرشح الأول إذا كان سهلًا ومتكررًا واجتاز فحص المخاطرة، وفسّر أي سبب لاستبعاده.
4. سمِّ مهمة تبقى يدوية حتى لو تكررت، مع السبب.
5. اكتب قاعدة للمهام القادمة. هذا تصميم ولا يتطلب تشغيل أتمتة.

**معايير التقييم:**

| البعد | الوزن | المعيار |
|---|---|---|
| مصفوفة + ٥ مهام | 60% | لكل مهمة من الخمس ربع منطقي وتكرار وخطوات وأثر خطأ وإمكانية مراجعة وتراجع. |
| قرار + قاعدة | 40% | يجتاز الاختيار فحص مخاطرة مستقلًا؛ قد يستبعد الضرر المرتفع مهمة سهلة ومتكررة. يتضمن استثناءً يدويًا مبررًا وقاعدة مستقبلية. |


### Confidence close

- **فهمت:** أول أتمتة = متكرّرة + بسيطة + مخاطرة قليلة — وليست أصعب **تدفق عمل (Flow)**.
- **تستطيع:** لديك ٥ مهام مرتّبة ومرشّح واحد جاهز للعامل الافتراضي.
- **التالي:** **Tools Landscape** — الأدوات مختلفة، لكن التفكير واحد.

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
| Concept preservation | 5 | Task Candidate, Build-effort payback period locked |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | correctIndex 0 — form-to-sheet answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.25 / 5 (informational only) |

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

| # | Check | Status |
|---|-------|--------|
| 1 | Egyptian production untouched | ☑ pass |
| 2 | Bunny untouched | ☑ pass |
| 3 | Template reference | ☑ pass |
| 4 | Objectives preserved | ⚠ needs human review |
| 5 | No hallucinated concepts | ☑ pass |
| 6 | Mission rubric 60/40 | ☑ pass |
| 7 | Quiz unchanged (correctIndex: 0) | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Polished / not production-wired | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*


## 2026-10-18 — approved audit correction 55

Owner-authorized correction supersedes the original ROI preservation entry only for this dimensional-error fix. Use build time divided by net monthly time saving, with the 0.25-month example and explicit oversight/maintenance assumption. The two-month limit is illustrative. Egyptian authoring and four generated glossary overlays are synchronized; mission/quiz/rubric and risk checks are preserved. This update does not fabricate the pending human sign-off or authorize media generation.


Audit97 correction (2026-10-18): explicit synthetic-data/review/reversibility assumptions and a separate risk gate. Prior audit55 payback glossary is preserved. Agent-reviewed draft; human/live acceptance pending.
