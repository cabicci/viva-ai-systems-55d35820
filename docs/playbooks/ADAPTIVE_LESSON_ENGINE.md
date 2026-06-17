# Adaptive Lesson Engine — Design Brief

**Status:** Prototype design only — not implemented  
**Effective:** 2026-06-04 (revised: MSA canonical-first workflow)  
**Scope:** Architecture and workflow for a future Masaarat invention  
**Does not replace:** `CURRICULUM_FREEZE_CONTRACT.md`, `P0_LAUNCH_CONSTITUTION.md`, or any production lesson file

**Related:** `docs/CURRENT_STATUS.md` · `docs/playbooks/LESSON_SHAPE_CONSTITUTION.md` · `docs/playbooks/MISSION_CONSTITUTION.md`

---

## 1. Executive summary

The **Adaptive Lesson Engine** is a proposed content pipeline for **مسارات (masaarat.ai)** where **existing Egyptian Arabic production lessons remain the live experience**, and a **derived Arabic MSA canonical layer** becomes the spine for future localized outputs — without forking the curriculum, changing platform UX, or touching shipped videos.

**Correct workflow:**

```
Existing Egyptian production lesson (immutable)
        │
        ▼
  Arabic MSA canonical source (derived, draft)
        │
        ├──► Gulf Arabic locale package (future)
        ├──► English locale package (future)
        └──► other locales (future)
```

Gulf, English, and future dialects **derive from MSA canonical** — not directly from Egyptian production copy. The current 100 Egyptian lessons, Bunny videos, and on-page UX stay frozen until a separate charter authorizes runtime integration.

This document defines the **design only**. No production course, Remotion registry, Bunny GUID, assistant seed, or UI refactor is authorized by this brief.

---

## 2. Foundational principles (non-negotiable)

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Egyptian production is frozen** | The current 100 Egyptian Arabic production lessons are immutable. No bulk conversion, no in-place rewrites. |
| 2 | **Egyptian Bunny videos untouched** | Existing Bunny playback mappings and rendered assets remain as shipped. No re-render, no re-upload, no GUID changes. |
| 3 | **MSA canonical is derived** | Arabic MSA canonical source is **extracted from** the live Egyptian lesson — objectives, block intent, mission rubric — then normalized to neutral MSA. It does not replace production files. |
| 4 | **Localization derives from MSA** | Gulf Arabic, English, and future locale packages are generated **from MSA canonical**, not by re-adapting Egyptian dialect copy directly. Egyptian remains the production default. |
| 5 | **Platform UX unchanged** | Current lesson shape, navigation, mission flow, and assistant surface stay as-is. Localization is **layered on top later**, not a platform redesign. |
| 6 | **No 100-lesson conversion yet** | Prototype cap remains small (see §8). No migration of all learner lessons. |
| 7 | **No video generation yet** | Video script outlines may be documented; no Remotion render, Bunny upload, or publish. |
| 8 | **No production runtime change** | No changes to `src/` lesson loaders, PATHS, missions runtime, assistant/RAG seed, or curriculum registry. |

---

## 3. Future localization UX (design intent)

When runtime localization is implemented (post-prototype), locale resolution follows this **strict priority order**:

| Priority | Source | Behavior |
|----------|--------|----------|
| **1** | Explicit user-selected locale | Manual choice in language/locale selector **always wins**. |
| **2** | Saved account or browser preference | Persisted choice from prior session or profile. |
| **3** | IP / location-based suggestion | Auto-suggest or open a suitable locale when geo signal is available (e.g. Gulf learner → suggest `ar-Gulf`). |
| **4** | Default fallback | **Current Egyptian Arabic experience** — same as today for all learners without a resolved preference. |

**Rule:** manual locale choice **overrides** automatic IP/location detection. Suggestion is not coercion; the selector remains available.

This UX is **future-facing**. No selector, geo routing, or preference storage is implemented by this design doc.

---

## 4. Core idea: Egyptian → MSA → localized outputs

Today, learner content lives in block-based TypeScript lesson files (`INTRO_LESSON_CONTENT`) with Egyptian Arabic voice and explained English terms. Video scripts and Remotion scenes were generated per lesson via a separate pipeline. Bunny playback is **100/100** and frozen.

The Adaptive Lesson Engine addresses post-P0 multilingual scale without duplicating 100 manual rewrites:

```
  ┌──────────────────────────────────────┐
  │  Egyptian production lesson (frozen)  │
  │  TS blocks + Bunny video + mission    │
  └──────────────────┬───────────────────┘
                     │ derive (read-only)
                     ▼
  ┌──────────────────────────────────────┐
  │  Arabic MSA canonical source          │
  │  objectives · block intent · rubric   │
  │  neutral MSA lesson text (draft)      │
  └──────────────────┬───────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
 ar-Gulf pkg      en pkg         future locales
 (from MSA)     (from MSA)       (from MSA)

  ar-EG production ──► unchanged default UX (not regenerated from MSA)
```

**Key properties:**

- Egyptian production is the **historical source of truth** for what learners see today.
- MSA canonical is the **adaptation spine** for new locales.
- Every derived artifact declares `sourceVersion`, `canonicalVersion`, and `localeVersion` pins.
- Regeneration is deterministic relative to those pins.

---

## 5. Why this matters for Masaarat

| Need | How the engine helps |
|------|----------------------|
| **Protect launch investment** | 100 Egyptian lessons + Bunny videos stay live; invention work happens in docs/sandbox only. |
| **Arabic diversity** | Gulf learners get Gulf phrasing derived from shared MSA intent — not a second manual pass over Egyptian slang. |
| **English accessibility** | English packages support diaspora learners without forking objectives or mission intent. |
| **Video + text parity (future)** | When new locale videos are authorized, scripts derive from the same MSA spine as on-page copy. |
| **Assistant honesty** | Assistant profile per locale can enforce tone and forbidden behaviors tied to the same version pins. |
| **RAG integrity** | Chunking and seed jobs key off `ragVersion` so assistant answers match the locale package on screen. |
| **Trust-first scale** | Versioned adaptation replaces emergency copy-paste across 100 files — but only after prototype evidence. |

---

## 6. Non-goals (explicit)

| Non-goal | Reason |
|----------|--------|
| **Implementation in `src/`** | Design-only; no runtime refactor |
| **Converting all 100 learner lessons** | Prototype = 3 lessons maximum; no bulk migration |
| **Video generation / Remotion render / Bunny upload** | Pipeline may reference future stages; no renders now |
| **Assistant seed or DB migrations** | `ragVersion` is specified; no seed job changes |
| **PATHS / slug changes** | Curriculum navigation freeze remains |
| **Mission AI evaluator changes** | Mission *intent* is localized; grading logic unchanged in prototype |
| **Replacing live Egyptian copy with MSA** | MSA canonical is a draft layer beside production, not a swap-in |
| **Platform UX redesign** | Localization layers on top; lesson shape and navigation unchanged |
| **Direct Egyptian → Gulf/EN adaptation** | Gulf and English must pass through MSA canonical |

---

## 7. Proposed MSA canonical schema

MSA canonical source captures **locale-agnostic intent** plus **neutral MSA lesson text** derived from Egyptian production. Suggested shape (conceptual JSON):

```json
{
  "lessonId": "intro-m1-l2-first-prompt",
  "canonicalVersion": "2026-06-04.1",
  "derivedFrom": {
    "productionLocale": "ar-EG",
    "productionFile": "src/components/intro/lessons/intro-m1-l2-first-prompt.ts",
    "derivationMethod": "read-only extraction + MSA normalization"
  },
  "pathId": "intro",
  "moduleId": "intro-m1",
  "meta": {
    "title": "First Prompt",
    "oneAha": "A clear prompt = Role + Context + Task + Format.",
    "difficulty": "intro",
    "estimatedMinutes": 12,
    "prerequisites": ["intro-m1-l1-what-is-ai"]
  },
  "objectives": [
    { "id": "obj-1", "statement": "Learner can name four parts of a starter prompt.", "measurable": true },
    { "id": "obj-2", "statement": "Learner writes one prompt they could send today.", "measurable": true }
  ],
  "concepts": [
    {
      "id": "concept-prompt-parts",
      "term": "Prompt",
      "termEn": "Prompt",
      "definition": "Instruction you give the model: role, context, task, and output format.",
      "mustPreserve": true
    }
  ],
  "blocks": [
    { "role": "orientation", "intent": "What you'll learn; why now; what you'll do after" },
    { "role": "tension", "intent": "Vague request → generic output" },
    { "role": "core", "intent": "Role, context, task, format with worked example" },
    { "role": "glossary", "intent": "Prompt and Context — English explained once" },
    { "role": "video", "intent": "Optional weak vs strong prompt (production Bunny unchanged)" },
    { "role": "comparison", "intent": "Vague vs clear side-by-side" },
    { "role": "quiz", "intent": "Context is first priority for Ahmed email example" },
    { "role": "mission", "intent": "Write one real prompt; tag four parts" },
    { "role": "confidence_close", "intent": "Prompt = instructions + context; next lesson applies in tool" }
  ],
  "mission": {
    "type": "practice",
    "intent": "Write one real prompt for a task this week; learner chooses final text.",
    "rubricIntent": [
      { "dimension": "structure", "weight": 70, "criteria": "Role + context + task + format present" },
      { "dimension": "real_topic", "weight": 30, "criteria": "Concrete topic from work or daily life" }
    ],
    "forbiddenAssistantBehaviors": ["write_full_submission", "auto_pass_mission"]
  },
  "msaLessonText": { "blocks": ["… neutral MSA prose per block role …"] }
}
```

**Design rules for MSA canonical:**

- Derived read-only from Egyptian production; production file never modified by this pipeline.
- Blocks carry **intent** and **MSA draft text**; Egyptian dialect stays in production only.
- `mustPreserve: true` concepts cannot be dropped in downstream localization.
- `canonicalVersion` bumps when objectives, concepts, or mission intent change — not when Gulf copy is polished.

---

## 8. Proposed localized package schema (future)

Each locale adapter emits a **locale package** from MSA canonical — consumed in future by UI, video prep, assistant, and RAG indexing.

```json
{
  "lessonId": "intro-m1-l2-first-prompt",
  "canonicalVersion": "2026-06-04.1",
  "localeVersion": "ar-Gulf.2026-06-04.1",
  "locale": "ar-Gulf",
  "derivedFrom": "msa-canonical",
  "reviewStatus": "draft | reviewed | approved",
  "lessonText": { "blocks": ["…"] },
  "mission": { "intro": "…", "rubric": ["…"] },
  "assistantProfile": { "forbiddenPatterns": ["…"] },
  "ragMetadata": { "ragVersion": "ar-Gulf.2026-06-04.1.r1" }
}
```

**Egyptian (`ar-EG`) production packages are not regenerated from MSA.** They remain the shipped TS + Bunny baseline. New locale packages are additive.

Packages are **immutable once approved**. Edits require a new `localeVersion`.

---

## 9. Prototype candidate lessons (exactly three)

Selection criteria: one clear Aha each, mission present, English terms to localize, cross-path coverage, already shipped in PATHS with Bunny playback — **read-only reference**, no file edits in prototype phase.

| # | Path | `lessonId` | Title (current) | Why this lesson |
|---|------|------------|-----------------|-----------------|
| 1 | **Intro** | `intro-m1-l2-first-prompt` | أول Prompt ليك | Foundational; tight one Aha; mission is writing practice; canonical sample exists |
| 2 | **Business** | `business-m1-l2-reactive-vs-proactive` | Reactive vs Proactive | Leadership framing; English pair terms; mindset shift |
| 3 | **Automator** | `automator-m3-l2-triggers-actions` | Triggers & Actions | Workflow vocabulary; diagram-friendly; technical glossaries |

**Not in prototype:** Builder, Analyst, Creator, archived Business slugs.

---

## 10. Prototype stages (MSA canonical-first)

| Stage | Output | Gate |
|-------|--------|------|
| **1. Read Egyptian production** | Snapshot of live TS blocks + mission rubric (read-only) | No production file edits |
| **2. Derive MSA canonical** | `*.canonical.md` per lesson: intent + MSA draft text | Objectives/concepts/mission intent validated against live lesson |
| **3. Gulf from MSA (`ar-Gulf`)** | `localePackage` draft | Gulf naturalness review; derived from MSA, not Egyptian copy-paste |
| **4. English from MSA (`en`)** | `localePackage` draft | Plain English; same objectives checklist |
| **5. Mission localization** | Mission block in each package | Mission constitution pass; assistant forbidden behaviors explicit |
| **6. Assistant profile** | `assistantProfile` per locale | Cannot solve mission; lesson-scoped retrieval only |
| **7. Review gate** | `reviewStatus: approved` | Human sign-off: objectives preserved, no hallucinated concepts |
| **8. Future: video script → Remotion → Bunny** | `videoScript` + optional render | **Not in prototype execution** — production Bunny unchanged |

Prototype **stops after stage 7** with draft/reviewed packages stored under `docs/playbooks/adaptive-canonical/` (and future sandbox dirs). **No learner-facing deploy.**

---

## 11. Guardrails

| Guardrail | Enforcement |
|-----------|-------------|
| **Egyptian production immutable** | No edits to 100 lesson TS files, Bunny mappings, or curriculum for this invention |
| **MSA before downstream locales** | Gulf/EN packages must declare `derivedFrom: msa-canonical` |
| **No hallucinated concepts** | Localizer may not add objectives, tools, or promises not in canonical `concepts` / `objectives` |
| **Preserve objectives** | Every `objective.id` in reviewer checklist per locale |
| **Preserve mission intent** | Rubric dimensions and weights unchanged; only copy localizes |
| **Assistant must not solve missions** | `forbiddenAssistantBehaviors` + `forbiddenPatterns` on every package |
| **English terms explained in Arabic first use** | Required for Arabic locale packages |
| **Every output tied to version pins** | Packages without matching canonical pin are invalid for seed/render |
| **No PATHS changes** | Prototype packages reference existing slugs only |
| **No learner-facing deploy** | Approved packages do not auto-publish to masaarat.ai |
| **Manual locale overrides geo** | Documented in §3; enforced when UX ships |

---

## 12. Versioning model

```
Egyptian production (frozen)
        │
        ▼
canonicalVersion  →  localeVersion  →  videoVersion  →  ragVersion
     │                    │                 │                │
 MSA intent +         Gulf / EN /       future render    assistant
 MSA draft text       future locales    (not now)        seed chunks
```

| Version | Bumps when | Example |
|---------|------------|---------|
| **`canonicalVersion`** | Objectives, concepts, mission intent, or block *roles* change | `2026-06-04.1` → `2026-06-04.2` |
| **`localeVersion`** | Approved copy change in one derived locale | `ar-Gulf.2026-06-04.1` → `ar-Gulf.2026-06-08.1` |
| **`videoVersion`** | New render/mux for that locale script (future) | unassigned in prototype |
| **`ragVersion`** | Chunk set or embedding policy change | `ar-Gulf.2026-06-04.1.r1` |

**Rule:** downstream consumers must refuse mismatched pins.

Current production baseline (unchanged by this doc): Egyptian Arabic implicit in TS files; Bunny `100/100`; Remotion registry `100/100` learner.

---

## 13. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **MSA derivation drifts from Egyptian intent** | High | Stage 2 diff against live TS; human review gate |
| **Skipping MSA and adapting Egyptian → Gulf directly** | High | Schema requires `derivedFrom: msa-canonical`; review checklist |
| **Locale packages diverge in meaning** | High | Shared objectives checklist + bilingual reviewer |
| **Assistant over-help on missions** | High | Profile forbidden patterns; eval harness before any seed |
| **Scope creep → 100-lesson migration** | High | Explicit non-goal; prototype cap = 3 lessons |
| **Accidental production or video changes** | High | Docs-only prototype; Bunny/Remotion out of scope |
| **UX redesign bundled with localization** | Medium | Principle §2.5: layer on top, shape unchanged |
| **Geo suggestion overrides user agency** | Medium | Manual selector always wins (§3) |

---

## 14. Recommendation

**Proceed with MSA canonical-first design and offline draft artifacts only.**

1. **Do not** touch production course files, PATHS, Remotion, Bunny, assistant seed, or platform UX.
2. **Do** derive MSA canonical drafts from read-only Egyptian production for prototype lessons.
3. **Do** generate Gulf and English from MSA canonical — not from Egyptian dialect copy.
4. **Defer** video script execution, RAG version bumps, locale selector, and geo routing until approved packages pass review gates.

The Adaptive Lesson Engine is the right long-term architecture for Masaarat's multilingual, trust-first scale — but launch posture today remains: **Egyptian production frozen; MSA canonical-first workflow recorded; this invention stays design + sandbox until P0 evidence says otherwise.**

---

## Prototype canonical artifacts

| Artifact | Status | Notes |
|----------|--------|-------|
| [`adaptive-canonical/intro-m1-l2-first-prompt.canonical.md`](adaptive-canonical/intro-m1-l2-first-prompt.canonical.md) | **draft / docs-only** | MSA canonical derived from Egyptian production · not production-ready · does not modify live lesson or Bunny video |

Additional prototype lessons (`business-m1-l2-reactive-vs-proactive`, `automator-m3-l2-triggers-actions`) remain planned; not yet canonicalized.

**Superseded:** multi-locale sample package (`adaptive-samples/intro-m1-l2-first-prompt.sample.md`) — removed; workflow reset to MSA canonical-first.

---

*Document owner: Masaarat curriculum architecture · Prototype design only · No implementation authorized by this file.*
