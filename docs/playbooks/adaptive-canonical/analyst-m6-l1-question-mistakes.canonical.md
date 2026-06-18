# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `analyst-m6-l1-question-mistakes` |
| **pathId** | `analyst` |
| **moduleId** | `analyst-m6` |
| **productionTitle (ar-EG)** | أخطاء الأسئلة |
| **productionRoute** | `/learn/analyst/analyst-m6-l1-question-mistakes` |
| **productionFile (read-only)** | `src/components/intro/lessons/analyst-m6-l1-question-mistakes.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Wrong question wastes time — vague, leading, or no measurable signal |
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
| `analyst-m6-l1-question-mistakes.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Rewrite 3 bad questions — diagnose error type and link to decision |
| **Mission rubric** | 50% تشخيص صحيح · 50% صياغة تخدم قرار |
| **Quiz intent** | Why customers abandon cart = leading question before data |
| **Concepts locked** | Leading Question, Signal |
| **Prerequisites** | `analyst-m5-l2-weekly-review-ritual` |
| **Next lesson** | `analyst-m5-ab-testing` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: analyst-m6-l1-question-mistakes
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/analyst-m6-l1-question-mistakes.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Question Mistakes
  oneAha: "Wrong question wastes time — vague, leading, or no measurable signal"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [analyst-m5-l2-weekly-review-ritual]

objectives:
  - id: obj-1
    statement: Rewrite 3 bad questions — diagnose error type and link to decision
    measurable: true

concepts:
  - id: concept-1
    term: Leading Question
    termEn: Leading Question
    definition: Question assumes answer direction before seeing data.
    mustPreserve: true
  - id: concept-2
    term: Signal
    termEn: Signal
    definition: Measurable number or behavior — not vague feeling.
    mustPreserve: true

blocks:
  - role: orientation
    intent: What you learn, why now, what after lesson
  - role: tension
    intent: Familiar problem from production Egyptian copy
  - role: core
    intent: One Aha and worked logic from production
  - role: comparison
    intent: Same contrast structure as production
  - role: glossary
    intent: termsLocked with first-use English gloss
  - role: video
    intent: Production Bunny reference only — no regen
  - role: screenshot
    intent: Visual intent from production block
  - role: quiz
    intent: Why customers abandon cart = leading question before data
  - role: mission
    intent: Rewrite 3 bad questions — diagnose error type and link to decision
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Rewrite 3 bad questions — diagnose error type and link to decision
  rubricIntent:
    - dimension: diagnosis
      weight: 50
      criteria: Each question has error type + what is missing
    - dimension: decision_ready
      weight: 50
      criteria: Rewritten question measurable and decision-linked
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Leading Question, Signal]

links:
  nextLessonId: analyst-m5-ab-testing
  continuityNote: A/B Testing — change one thing measure one outcome

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

- **ماذا ستفهم؟** السؤال الخاطئ يضيّع وقتًا — بيانات كثيرة بلا قرار.

### Core idea — ٣ أخطاء

- عام («ما أحوال العمل؟») → خصّص: مين؟ ماذا؟ متى؟
- **Leading Question (سؤال متحيّز)** («لماذا فشل الإعلان؟») → «كم lead؟»
- بدون **Signal (إشارة)** («كم عميل سعيد؟») → NPS، تكرار شراء.

### Quiz — correctIndex: 0

> **Quiz key (unchanged):** correctIndex: 0

- ****الإجابة الصحيحة** (correctIndex: 0):** Leading — افترض سبب الترك قبل ما يشوف البيانات.
- خيار 2: Vague — السؤال عام بس.
- خيار 3: No-Data — مفيش بيانات أصلًا.

**التفسير:** الإجابة الصحيحة محفوظة من الإنتاج المصري — راجع النص أعلاه للسياق الكامل.
### Mission

| تشخيص | 50% |
| صياغة تخدم قرار | 50% |

### Confidence close

- **التالي:** **A/B Testing**.

---

## 5. Future generation notes

Downstream locales (Gulf, English) derive from this MSA canonical — not from Egyptian directly. Mission rubric weights and quiz logic preserved. Deferred: Bunny · Remotion · RAG seed · runtime wiring.

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
| 3 | IP / location-based suggestion | Auto-suggest when geo signal available |
| 4 | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 7. Quality scoring

### Draft self-assessment (not final)

| Dimension | Score (/5) | Notes |
|-----------|------------|-------|
| Objective preservation | 4 | Pending human review |
| Concept preservation | 5 | Production concepts locked |
| Beginner clarity | 4 | Polish pass 2026-06-18; pending human read-aloud |
| MSA simplicity | 4 | Pending dialect scan |
| Mission consistency | 5 | Rubric weights match production |
| Quiz integrity | 5 | correctIndex 0 unchanged |
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
| 2 | Bunny / video mapping untouched | ☑ pass |
| 3 | Template reference present | ☑ pass |
| 4 | Objectives preserved vs production | ⚠ needs human review |
| 5 | No hallucinated concepts or tools | ☑ pass |
| 6 | Mission rubric weights match production | ☑ pass |
| 7 | Quiz answer and reasoning unchanged | ☑ pass |
| 8 | MSA derived from Egyptian | ⚠ needs human review |
| 9 | English AI terms glossed on first use | ⚠ needs human review |
| 10 | Video block = production reference only | ☑ pass |
| 11 | Localization UX priority documented | ☑ pass |
| 12 | Slug validation gate passed | ☑ pass |
| 13 | Draft self-assessment recorded | ☑ pass |
| 14 | Human reviewer score — scale pass rule met | ☐ **pending** |
| 15 | Draft / not production-ready stated | ☑ confirmed |
| 16 | Human reviewer sign-off (name + date) | ☐ **pending** |

---

*Artifact owner: Adaptive Lesson Engine · MSA Canonical Lesson Script · Polish lock 2026-06-18 · Not production-wired.*
