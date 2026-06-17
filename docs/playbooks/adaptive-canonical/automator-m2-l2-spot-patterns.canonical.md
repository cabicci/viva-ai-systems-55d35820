# Adaptive Lesson Engine — MSA Canonical Draft

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-draft` |
| **lessonId** | `automator-m2-l2-spot-patterns` |
| **pathId** | `automator` |
| **moduleId** | `automator-m2` |
| **productionTitle (ar-EG)** | شوف الأنماط في يومك |
| **productionRoute** | `/learn/automator/automator-m2-l2-spot-patterns` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m2-l2-spot-patterns.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-04.3-draft` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **10-lesson MSA canonical controlled batch** |
| **reviewStatus** | **draft / not production-ready** |
| **oneAha** | "Whenever X, do Y" = pattern — first signal the virtual worker can run |
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
| `automator-m2-l2-spot-patterns.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | "Whenever X, do Y" = pattern; spot 4 signals (repeat, transfer, simple decision, wait); write 3 patterns |
| **Mission rubric** | 60% three patterns · 40% automatibility assessment |
| **Quiz intent** | Copy Excel to CRM after approval = transfer pattern |
| **Concepts locked** | Pattern, Automation |
| **Prerequisites** | `automator-m2-l1-systems-view` |
| **Next lesson** | `automator-m2-l3-decide-what-to-automate` |

### Derivation method

Read-only extraction + MSA normalization.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m2-l2-spot-patterns
canonicalVersion: 2026-06-04.3-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m2-l2-spot-patterns.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Spot Patterns
  oneAha: "Whenever X do Y = pattern — virtual worker's first signal"
  difficulty: intro
  estimatedMinutes: 12
  prerequisites: [automator-m2-l1-systems-view]

objectives:
  - id: obj-1
    statement: Learner explains pattern as fixed trigger (X) + fixed steps (Y); names four automation signals from production.
    measurable: true
  - id: obj-2
    statement: Learner writes 3 "whenever X, do Y" patterns with weekly frequency; identifies clearest trigger and most stable steps.
    measurable: true

concepts:
  - id: concept-pattern
    term: Pattern
    termEn: Pattern
    definition: Something repeating the same way — fixed trigger plus fixed steps.
    mustPreserve: true
  - id: concept-automation
    term: Automation
    termEn: Automation
    definition: Virtual worker runs the pattern alone — without human intervention each time.
    mustPreserve: true

blocks:
  - role: orientation
    intent: Whenever X do Y = pattern; after systems view — write 3 patterns after
  - role: tension
    intent: Same moves on autopilot — virtual worker needs to see pattern first
  - role: core
    intent: Pattern = trigger + steps; 4 signals — repeat, transfer, simple decision, wait
  - role: comparison
    intent: Random replies vs clear "new booking → welcome email + login"
  - role: glossary
    intent: Pattern (نمط); Automation (أتمتة)
  - role: video
    intent: Optional — find patterns in your day — production Bunny unchanged
  - role: screenshot
    intent: Pattern monitoring — same idea as Time Audit for repeats
  - role: quiz
    intent: Excel to CRM copy after approval = transfer pattern
  - role: mission
    intent: 3 whenever/do patterns with frequency; pick clearest trigger and most stable steps
  - role: confidence_close
    intent: 3 patterns logged; next = Decide What to Automate

mission:
  type: practice
  intent: Log 3 work patterns in "whenever X, do Y" form with weekly count; name pattern with clearest trigger and pattern with most stable steps — 10–15 min
  rubricIntent:
    - dimension: three_patterns
      weight: 60
      criteria: Each pattern has whenever + do + frequency; steps ordered not generic
    - dimension: automatibility_assessment
      weight: 40
      criteria: Identified pattern with regular trigger; identified pattern with stable steps
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission
    - invent_patterns_or_assessment_for_learner

termsLocked: [Pattern, Automation, Trigger]

links:
  nextLessonId: automator-m2-l3-decide-what-to-automate
  continuityNote: Decide What to Automate — which pattern to hand to virtual worker first

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

### Orientation — بداية الدرس

- **ماذا ستفهم؟** «كلما X يحدث، أفعل Y» = **نمط (Pattern)** — وهذه أول إشارة أن العامل الافتراضي يستطيع العمل.
- **لماذا الآن؟** بعد أن فكّكت مهمة إلى نظام، الخطوة التالية: إيجاد الأنماط المتكررة في يومك.
- **ماذا بعد الدرس؟** ستكتب ٣ أنماط أتمتة بصيغة «كلما… أفعل…».

### Tension — موقف مألوف

- كلما سأل عميل «رقم الحساب؟» — تنسخ نفس الرقم وترسله. كلما حجز جديد — تكتب إيميل ترحيب.
- تفعل ذلك دون أن تشعر — لكن العامل الافتراضي يحتاج أن يرى **النمط** قبل أن ينفّذه.
- **الأتمتة (Automation)** ليست «أي شيء جميل» — بل «نفس الحركة تتكرر بنفس الطريقة».

### Core idea — «كلما X، أفعل Y» = فرصة أتمتة

- **النمط** = مُشغّل ثابت (X) + خطوات ثابتة (Y). هذا بالضبط ما يفعله العامل الافتراضي.
- **٤ إشارات تدور عليها:** تكرار (نفس الخطوات أكثر من مرتين/أسبوع)، نقل (بيانات من مكان إلى مكان)، قرار بسيط (إذا كذا → افعل كذا)، انتظار (تنتظر شيئًا لتتصرّف).
- **تمرين سريع:** اكتب يومك — أي ساعة فيها واحدة من هذه الإشارات = مرشّح للعامل الافتراضي.
- **مثال:** «كلما ملأ أحد النموذج → أنسخ بياناته إلى جدول → أرسل واتساب ترحيب».

### Comparison — شغل عشوائي vs نمط واضح

| بلا نمط | نمط واضح |
|---------|----------|
| منال ترد على كل عميل بشكل مختلف — لا «كلما… أفعل…». صعب تسليم أي جزء للعامل الافتراضي. | «كلما حجز جديد → إيميل ترحيب + بيانات دخول». نفس الخطوات كل مرة — العامل الافتراضي ينفّذها. |

### Glossary — مصطلحان للأنماط

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Pattern (نمط)** | شيء يتكرر بنفس الطريقة — مُشغّل + خطوات ثابتة | «كلما سأل عميل السعر → أرد من قائمة جاهزة» |
| **Automation (أتمتة)** | العامل الافتراضي ينفّذ **النمط** وحده — من دون تدخّل بشري كل مرة | إيميل ترحيب يُرسل تلقائيًا أول ما يُملأ النموذج |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — كيف تجد الأنماط التي تضيع وقتك و«كلما X أفعل Y». **لا يُعاد توليده**.

### Screenshot block (intent)

مراقبة الأنماط — نفس فكرة **جرد الوقت**: تسجّل ما يتكرر (وقت، مهمة، توقيت) وتستخرج أنماطًا. نفس التمرين على عملك: يدويًا في البداية، ثم العامل الافتراضي.

### Quiz — تأكيد سريع

**السؤال:** أحمد كلما وافق عميل على عرض → ينسخ بياناته من Excel إلى CRM يدويًا. أي نوع **نمط** هذا؟

- **الإجابة الصحيحة:** **نقل — بيانات من مكان إلى مكان بنفس الخطوات**
- **التفسير:** نسخ بيانات من Excel إلى CRM = نقل متكرر. **نمط** واضح للعامل الافتراضي.

### Mission — اكتب ٣ أنماط «كلما… أفعل…»

**المقدمة:** **الأنماط** = حركات تفعلها دون أن تشعر. سترصد ٣ من عملك وتكتبها بصيغة «كلما X، أفعل Y». ١٠–١٥ دقيقة كافية.

**التسليم:** نمط ١ و٢ و٣ — كل واحد: كلما (X — المُشغّل) · أفعل (Y — الخطوات بالترتيب) · مرات في الأسبوع. في الآخر: أي نمط المُشغّل فيه منتظم؟ أي نمط الخطوات فيه ثابتة؟

**معايير التقييم:**

| البعد | الوزن | المعيار |
|-------|-------|---------|
| ٣ أنماط | 60% | كل نمط فيه «كلما» + «أفعل» + تكرار؛ الخطوات مرتّبة — ليست كلامًا عامًا |
| تقييم القابلية | 40% | حدّدت نمطًا بمُشغّل منتظم؛ حدّدت نمطًا بخطوات ثابتة |

### Confidence close

- **فهمت:** «كلما X، أفعل Y» = إشارة أن العامل الافتراضي يستطيع العمل.
- **تستطيع:** لديك ٣ أنماط مرصودة — جاهزة للترتيب حسب الأولوية.
- **التالي:** **Decide What to Automate** — أي **نمط** تسلّمه للعامل الافتراضي أولًا؟

---

## 5. Future generation notes

Downstream locales from MSA only. Four automation signals preserved from production. Deferred: Bunny · Remotion · RAG · runtime.

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
| Concept preservation | 5 | Pattern, Automation only |
| Beginner clarity | 4 | Pending read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | 60/40 rubric matches production |
| Quiz integrity | 5 | Transfer-pattern answer unchanged |
| Assistant boundaries | 4 | forbiddenAssistantBehaviors listed |
| Localization readiness | 4 | §5–§6 present |

| Draft self-assessment average | 4.375 / 5 (informational only) |

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
| 7 | Quiz unchanged | ☑ pass |
| 8 | MSA from Egyptian | ⚠ needs human review |
| 9 | English terms glossed | ⚠ needs human review |
| 10 | Video = production ref only | ☑ pass |
| 11 | Localization UX documented | ☑ pass |
| 12 | Slug validation passed | ☑ pass |
| 13 | Draft self-assessment | ☑ pass |
| 14 | Human reviewer score recorded — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · 10-lesson MSA canonical controlled batch · Draft only.*
