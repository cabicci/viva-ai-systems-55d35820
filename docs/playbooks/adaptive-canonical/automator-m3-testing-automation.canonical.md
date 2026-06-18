# Adaptive Lesson Engine — MSA Canonical Lesson Script

## 1. Metadata

| Field | Value |
|-------|-------|
| **artifactType** | `msa-canonical-script` |
| **lessonId** | `automator-m3-testing-automation` |
| **pathId** | `automator` |
| **moduleId** | `automator-m4` |
| **productionTitle (ar-EG)** | اختبر قبل ما تطلع |
| **productionRoute** | `/learn/automator/automator-m3-testing-automation` |
| **productionFile (read-only)** | `src/components/intro/lessons/automator-m3-testing-automation.ts` |
| **productionLocale** | `ar-EG` (Egyptian Arabic — **immutable**, live experience) |
| **canonicalVersion** | `2026-06-18.1-polished` |
| **derivedAt** | 2026-06-18 |
| **pilotSet** | **final corpus completion batch** |
| **reviewStatus** | **polished / not production-wired** |
| **scriptLayer** | **MSA Canonical Lesson Script** — API-reviewed · architecture-ready · not production-wired / not rendered / not runtime-localized |
| **polishPass** | `2026-06-18` |
| **oneAha** | Testing protects customer trust — unit, flow, edge cases, manual review |
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
| `automator-m3-testing-automation.ts` | **Frozen** |
| Bunny video | **Frozen** |
| PATHS / runtime | **Frozen** |

### What this artifact preserves

| Element | Production value |
|---------|------------------|
| **Learning objective** | Build test checklist: unit, full flow, 3 edge cases, manual review |
| **Mission rubric** | 50% Unit + Full-flow · 50% Edge + Review |
| **Quiz intent** | Test data + 3 edge cases + manual review before production |
| **Concepts locked** | Unit Test, Integration Test, workflow, Flow |
| **Prerequisites** | `automator-m4-l3-error-handling` |
| **Next lesson** | `automator-m5-l1-llm-in-flow` |

### Derivation method

Read-only extraction + MSA normalization from Egyptian production blocks.

---

## 3. Structured canonical source

```yaml
lessonId: automator-m3-testing-automation
canonicalVersion: 2026-06-18.1-polished
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/intro/lessons/automator-m3-testing-automation.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: Testing Automation
  oneAha: "Testing protects customer trust — unit, flow, edge cases, manual review"
  difficulty: intermediate
  estimatedMinutes: 12
  prerequisites: [automator-m4-l3-error-handling]

objectives:
  - id: obj-1
    statement: Build test checklist: unit, full flow, 3 edge cases, manual review
    measurable: true

concepts:
  - id: concept-1
    term: Unit Test
    termEn: Unit Test
    definition: Test one step or condition without full flow.
    mustPreserve: true
  - id: concept-2
    term: Integration Test
    termEn: Integration Test
    definition: Run full workflow end-to-end with fake data.
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
    intent: Test data + 3 edge cases + manual review before production
  - role: mission
    intent: Build test checklist: unit, full flow, 3 edge cases, manual review
  - role: confidence_close
    intent: Recap + next lesson bridge

mission:
  type: practice
  intent: Build test checklist: unit, full flow, 3 edge cases, manual review
  rubricIntent:
    - dimension: unit_flow
      weight: 50
      criteria: Unit test with input/output; full flow with test data
    - dimension: edge_review
      weight: 50
      criteria: 3 edge cases empty/wrong/duplicate; manual review who/what
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [Unit Test, Integration Test, workflow, Flow]

links:
  nextLessonId: automator-m5-l1-llm-in-flow
  continuityNote: LLM in Flow — AI as a node in automation

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

- **ماذا ستفهم؟** الاختبار يمنع أخطاء محرجة في **الأتمتة (Automation)** — ليس رفاهية تقنية.
- **لماذا الآن؟** بعد معالجة الأخطاء، **مسار العمل (workflow)** شغّال — تحتاج التأكد أنه لن يرسل «undefined» لـ ٥٠٠ عميل.
- **ماذا بعد الدرس؟** قائمة اختبار: خطوة → مسار كامل → حالات غريبة → مراجعة يدوية.

### Tension — موقف مألوف

- «الأتمتة أرسلت «مرحبًا undefined» لكل العملاء»
- شغّلت **workflow** على production من دون اختبار — ٣٠٠ عميل، ثقة ضاعت في ساعة.
- دقيقة اختبار قبل live كانت ستكشف حقل الاسم الفارغ.

### Core idea — ٤ مستويات اختبار

- **Unit Test (اختبار خطوة):** لو الاسم فارغ، ماذا يحدث؟
- **Integration Test (اختبار التدفق):** شغّل **Flow (تدفق عمل)** كاملًا ببيانات تجريبية.
- **Edge cases (حالات غريبة):** فارغ، خطأ، مكرر — ٣ حالات على الأقل.
- **Manual review (مراجعة يدوية):** عين بشرية قبل فتح production — آخر بوابة.

### Comparison — live بدون اختبار vs checklist

| «نجرب على العملاء» | Checklist قبل live |
|---------------------|---------------------|
| أول خطأ يصل لـ ٣٠٠ عميل | بيانات تجريبية → edge cases → مراجعة → production |

### Glossary — مصطلحان للاختبار

| المصطلح | المعنى | مثال |
|---------|--------|------|
| **Unit Test (اختبار خطوة)** | جزء واحد — **node** أو شرط | إيميل فارغ → **Filter** يوقف؟ |
| **Integration Test (اختبار التدفق)** | **Workflow** كامل ببيانات وهمية | lead «اختبار» → وصل بريد + صف في الجدول؟ |

### Video block (production reference only)

> في الإنتاج: فيديو Bunny — **اختبر قبل live**. **لا يُعاد توليده**.

### Diagram block (intent)

Unit → Full flow → Edge cases → Manual review → Live

### Quiz — تأكيد سريع

**السؤال:** **workflow** جديد يرسل ترحيبًا. أفضل خطوة قبل production؟

- **الإجابة الصحيحة (correctIndex: 0):** بيانات تجريبية + ٣ edge cases + مراجعة يدوية
- **التفسير:** الخطأ يبقى عندك — لا عند العميل.

### Mission — test checklist

| البعد | الوزن | المعيار |
|-------|-------|---------|
| Unit + Full-flow | 50% | unit بمدخل ونتيجة؛ full-flow ببيانات تجريبية |
| Edge + Review | 50% | ٣ edge cases؛ مراجعة يدوية (مين + ماذا) |

### Confidence close

- **فهمت:** الاختبار يحمي ثقة العملاء.
- **تستطيع:** checklist جاهز قبل live.
- **التالي:** **LLM في Flow** — الذكاء الاصطناعي كـ **node**.

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
