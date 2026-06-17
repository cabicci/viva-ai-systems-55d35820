# Adaptive Lesson Engine — Design Brief

**Status:** Prototype design only — not implemented  
**Effective:** 2026-06-04  
**Scope:** Architecture and workflow for a future Masaarat invention  
**Does not replace:** `CURRICULUM_FREEZE_CONTRACT.md`, `P0_LAUNCH_CONSTITUTION.md`, or any production lesson file

**Related:** `docs/CURRENT_STATUS.md` · `docs/playbooks/LESSON_SHAPE_CONSTITUTION.md` · `docs/playbooks/MISSION_CONSTITUTION.md`

---

## 1. Executive summary

The **Adaptive Lesson Engine** is a proposed content pipeline for **مسارات (masaarat.ai)** where **one canonical lesson source** drives many localized, audience-aware outputs without forking the curriculum into separate codebases.

From a single canonical record, the engine would generate — under explicit version pins — localized lesson text, video script, voice direction, mission copy, assistant profile hints, and RAG/version metadata for multiple audiences and locales (e.g. Egyptian Arabic, Gulf Arabic, English).

This document defines the **design only**. No production course, Remotion registry, Bunny GUID, or assistant seed scope changes are authorized by this brief.

---

## 2. Core idea: one lesson source → many localized outputs

Today, learner content lives primarily in block-based TypeScript lesson files (`INTRO_LESSON_CONTENT`) with one shipped locale voice (Egyptian Arabic + explained English terms). Video scripts and Remotion scenes were generated per lesson via a separate pipeline.

The Adaptive Lesson Engine inverts the duplication problem:

```
                    ┌─────────────────────────┐
                    │  Canonical Lesson Source │
                    │  (objectives, concepts,  │
                    │   mission intent, terms) │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  localePackage            localePackage           localePackage
  (ar-EG)                  (ar-Gulf)               (en)
        │                       │                       │
   lesson text              lesson text             lesson text
   video script             video script            video script
   voice direction          voice direction         voice direction
   mission copy             mission copy            mission copy
   assistant profile        assistant profile       assistant profile
   ragVersion metadata      ragVersion metadata     ragVersion metadata
```

**Key property:** every derived artifact declares which `sourceVersion` and `localeVersion` it was built from. Regeneration is deterministic relative to those pins, not relative to “latest prompt vibes.”

---

## 3. Why this matters for Masaarat

| Need | How the engine helps |
|------|----------------------|
| **Arabic diversity** | Egyptian learners and Gulf learners share objectives but not phrasing, examples, or rhythm. One canonical spine avoids 3× manual rewrites. |
| **English accessibility** | English packages support diaspora learners and future markets without a separate curriculum fork. |
| **Video + text parity** | Video scripts and on-page lesson text drift today when regenerated independently. One source → aligned script and blocks. |
| **Assistant honesty** | Assistant profile per locale can enforce tone, forbidden behaviors (e.g. solving missions), and retrieval boundaries tied to the same lesson version learners see. |
| **RAG integrity** | Chunking and seed jobs can key off `ragVersion` so assistant answers match the locale package on screen — not an older Arabic draft or an English glossary orphan. |
| **Scale after P0** | Post-launch expansion (new paths, refreshes, dialect packs) becomes **versioned adaptation**, not emergency copy-paste across 100 files. |

Masaarat’s differentiation is not “more lessons” — it is **trustworthy, localized, applied AI learning**. The engine protects that trust as surface area grows.

---

## 4. Non-goals (explicit)

The following are **out of scope** for this design phase and any immediate follow-up unless a separate constitution amends the freeze:

| Non-goal | Reason |
|----------|--------|
| **Implementation in `src/`** | Design-only; no runtime refactor |
| **Converting all 100 learner lessons** | Prototype = 3 lessons maximum |
| **Video generation / Remotion render / Bunny upload** | Pipeline design may reference future stages; no renders now |
| **Assistant seed or DB migrations** | `ragVersion` is specified; no seed job changes |
| **PATHS / slug changes** | Curriculum navigation freeze remains |
| **Mission AI evaluator changes** | Mission *intent* is localized; grading logic unchanged in prototype |
| **Replacing `INTRO_LESSON_CONTENT` in production** | Canonical source is a *proposed* layer above or beside current files for prototype only |

---

## 5. Proposed canonical lesson schema

Canonical source is **locale-agnostic intent**, not final copy. Suggested shape (conceptual JSON):

```json
{
  "lessonId": "intro-m1-l2-first-prompt",
  "sourceVersion": "2026-06-04.1",
  "pathId": "intro",
  "moduleId": "intro-m1",
  "meta": {
    "title": "First Prompt",
    "oneAha": "A good first prompt names role, task, and output format.",
    "difficulty": "intro",
    "estimatedMinutes": 12,
    "prerequisites": ["intro-m1-l1-what-is-ai"]
  },
  "objectives": [
    { "id": "obj-1", "statement": "Learner can name three parts of a starter prompt.", "measurable": true },
    { "id": "obj-2", "statement": "Learner writes one prompt they could send today.", "measurable": true }
  ],
  "concepts": [
    {
      "id": "concept-prompt-parts",
      "term": "Prompt",
      "termEn": "Prompt",
      "definition": "Instruction you give the model: who it is, what to do, how to answer.",
      "mustPreserve": true,
      "allowedExamples": ["role + task + format"]
    }
  ],
  "blocks": [
    { "role": "hero", "intent": "Orient: first prompt fear → one small win" },
    { "role": "tension", "intent": "Blank screen / don't know what to type" },
    { "role": "core", "intent": "Role, task, format with one worked example" },
    { "role": "example", "intent": "Bad vague prompt vs better structured prompt" },
    { "role": "glossary", "intent": "Prompt, model, output — English explained once" },
    { "role": "quiz", "intent": "Pick which prompt has all three parts" },
    { "role": "confidence_close", "intent": "You can send one prompt today" }
  ],
  "mission": {
    "type": "practice",
    "intent": "Write one real prompt for a task they'll do this week; AI may suggest wording — learner chooses final text.",
    "rubricIntent": [
      { "dimension": "structure", "weight": 60, "criteria": "Role + task + format present" },
      { "dimension": "specificity", "weight": 40, "criteria": "Concrete enough to run today" }
    ],
    "forbiddenAssistantBehaviors": ["write_full_submission", "auto_pass_mission"]
  },
  "video": {
    "intent": "60–90s spoken walkthrough of the same one Aha; no new concepts",
    "sceneOutline": ["hook", "tension", "three parts", "mini demo", "CTA next lesson"]
  },
  "assistant": {
    "scope": "lesson_local",
    "allowedHelp": ["clarify_terms", "reflect_on_structure", "ask_socratic_questions"],
    "forbiddenHelp": ["complete_mission", "invent_new_objectives"]
  },
  "termsLocked": ["Prompt", "LLM"],
  "links": {
    "nextLessonId": "intro-m1-l3-setup-your-ai",
    "continuityNote": "Setup lesson applies the prompt pattern in a tool."
  }
}
```

**Design rules for canonical source:**

- Blocks carry **intent**, not final Egyptian/Gulf/English prose.
- `mustPreserve: true` concepts cannot be dropped in localization.
- Mission stores **intent + rubric intent**, not locale-specific prompt strings.
- `sourceVersion` bumps only when objectives, concepts, or mission intent change — not when Egyptian copy is polished.

---

## 6. Proposed localized package schema

Each locale adapter emits a **locale package** — the bundle consumed by UI, video prep, assistant, and RAG indexing jobs.

```json
{
  "lessonId": "intro-m1-l2-first-prompt",
  "sourceVersion": "2026-06-04.1",
  "localeVersion": "ar-EG.2026-06-04.1",
  "locale": "ar-EG",
  "audience": "egyptian_beginner",
  "derivedAt": "2026-06-04T12:00:00Z",
  "reviewStatus": "draft | reviewed | approved",

  "lessonText": {
    "blocks": [
      {
        "role": "hero",
        "eyebrow": "…",
        "title": "…",
        "block": { "kind": "paragraphs", "paragraphs": ["…"] }
      }
    ],
    "termGlossary": [
      { "termEn": "Prompt", "firstUseAr": "الـ Prompt (طلب/تعليمة للـ AI) — …" }
    ]
  },

  "videoScript": {
    "scenes": [
      {
        "sceneId": "s1",
        "spoken": "…",
        "voice": "egyptian_female_calm",
        "visualIntent": "TitleCard — first prompt",
        "durationHintSec": 8
      }
    ],
    "voiceDirection": {
      "persona": "coach_not_lecturer",
      "pace": "medium",
      "codeSwitchRules": "English terms on first use only; then Arabic"
    }
  },

  "mission": {
    "intro": "…",
    "prompt": "…",
    "template": "…",
    "buttonLabel": "…",
    "rubric": [
      { "label": "…", "weight": 60, "criteria": ["…"] }
    ],
    "localeNotes": "Mission asks learner to write; assistant must not fill template."
  },

  "assistantProfile": {
    "persona": "مسارات coach — Egyptian",
    "tone": "warm_direct",
    "retrievalScope": "lesson_only",
    "systemHints": ["Do not solve mission", "Explain Prompt on first mention"],
    "forbiddenPatterns": ["هاكتبلك المهمة", "ده الحل النهائي"]
  },

  "ragMetadata": {
    "ragVersion": "ar-EG.2026-06-04.1.r1",
    "chunkPolicy": "lesson_blocks + mission_intro",
    "excludeArchived": true,
    "sourceHash": "sha256:…"
  }
}
```

Packages are **immutable once approved**. Edits require a new `localeVersion`.

---

## 7. Prototype candidate lessons (exactly three)

Selection criteria: one clear Aha each, mission present, English terms to localize, cross-path coverage, already shipped in PATHS with Bunny playback — **read-only reference**, no file edits in prototype phase.

| # | Path | `lessonId` | Title (current) | Why this lesson |
|---|------|------------|-----------------|-----------------|
| 1 | **Intro** | `intro-m1-l2-first-prompt` | أول Prompt ليك | Foundational; tight one Aha; mission is writing practice; high reuse across locales |
| 2 | **Business** | `business-m1-l2-reactive-vs-proactive` | Reactive vs Proactive | Leadership framing; English pair terms; mindset shift — tests Gulf vs Egyptian tone without new concepts |
| 3 | **Automator** | `automator-m3-l2-triggers-actions` | Triggers & Actions | Workflow vocabulary; diagram-friendly; tests technical term glossaries and voice script pacing |

**Not in prototype:** Builder (Automator chosen for operational vocabulary), Analyst, Creator, archived Business slugs.

---

## 8. Prototype stages

Sequential gates — each stage produces artifacts + human review before the next.

| Stage | Output | Gate |
|-------|--------|------|
| **1. Canonical extraction** | `canonical.json` per lesson from existing TS blocks + curriculum metadata | Objectives/concepts/mission intent validated against live lesson; no new concepts added |
| **2. Egyptian rewrite (`ar-EG`)** | `localePackage` draft | Native Egyptian read; English terms explained on first use |
| **3. Gulf rewrite (`ar-Gulf`)** | `localePackage` draft | Gulf naturalness review; same objectives checklist pass |
| **4. English rewrite (`en`)** | `localePackage` draft | Plain English; Arabic product names where brand requires |
| **5. Mission localization** | Mission block in each package | Mission constitution pass; assistant forbidden behaviors explicit |
| **6. Assistant profile** | `assistantProfile` per locale | Reality audit: cannot solve mission; lesson-scoped retrieval only |
| **7. Review gate** | `reviewStatus: approved` | Human sign-off: objectives preserved, no hallucinated concepts |
| **8. Future: video script → Remotion → Bunny** | `videoScript` + optional render | **Not in prototype execution** — design hook only; requires `videoVersion` pin |

Prototype **stops after stage 7** with three lessons × three locales = nine packages (draft/reviewed), stored outside production paths (e.g. `docs/prototypes/adaptive-lesson-engine/` — folder creation deferred to implementation charter).

---

## 9. Guardrails

| Guardrail | Enforcement |
|-----------|-------------|
| **No hallucinated concepts** | Localizer may not add objectives, tools, or promises not in canonical `concepts` / `objectives` |
| **Preserve objectives** | Automated diff: every `objective.id` must appear in reviewer checklist per locale |
| **Preserve mission intent** | Rubric dimensions and weights unchanged; only copy localizes |
| **Assistant must not solve missions** | `forbiddenAssistantBehaviors` + `forbiddenPatterns` required on every package |
| **English terms explained in Arabic first use** | `termGlossary` required for `termsLocked`; Gulf/Egyptian packages validated |
| **Every output tied to `sourceVersion`** | Packages without matching canonical pin are invalid for seed/render |
| **No PATHS changes** | Prototype packages reference existing slugs only |
| **No learner-facing deploy** | Approved packages do not auto-publish to masaarat.ai |

---

## 10. Versioning model

Four-layer pin chain:

```
sourceVersion  →  localeVersion  →  videoVersion  →  ragVersion
     │                  │                 │                │
 canonical         localized          Remotion/         assistant
 intent            lesson text        Bunny artifact    seed chunks
                   mission copy
                   assistant profile
```

| Version | Bumps when | Example |
|---------|------------|---------|
| **`sourceVersion`** | Objectives, concepts, mission intent, or block *roles* change | `2026-06-04.1` → `2026-06-04.2` |
| **`localeVersion`** | Approved copy change in one locale (no canonical change) | `ar-EG.2026-06-04.1` → `ar-EG.2026-06-08.1` |
| **`videoVersion`** | New render/mux for that locale script | `ar-EG.vid.2026-06-10.1` |
| **`ragVersion`** | Chunk set or embedding policy change for that locale package | `ar-EG.2026-06-04.1.r1` |

**Rule:** downstream consumers must refuse mismatched pins (e.g. UI on `localeVersion` X cannot seed RAG on `ragVersion` derived from Y).

Current production baseline (unchanged by this doc): single Egyptian package implicit in TS files; Bunny `100/100`; Remotion registry `100/100` learner (`6a6a40e`).

---

## 11. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Canonical extraction drifts from live TS** | High | Stage 1 diff tool; prototype lessons chosen from frozen 100 |
| **Locale packages diverge in meaning** | High | Shared objectives checklist + bilingual reviewer |
| **Assistant over-help on missions** | High | Profile forbidden patterns; eval harness before any seed |
| **Version pin sprawl** | Medium | One manifest per lesson listing active pins per locale |
| **Scope creep → 100-lesson migration** | High | Explicit non-goal; prototype cap = 3 lessons |
| **Video pipeline assumed ready** | Medium | Stage 8 documented as future; no render in prototype |
| **Gulf/Egyptian political or cultural tone misses** | Medium | Human review gate; no fully automated approval |
| **English package cannibalizes Arabic brand** | Low | English as additive locale; masaarat.ai Arabic-first unchanged |

---

## 12. Recommendation

**Proceed with prototype design and offline package drafts only.**

1. **Do not** touch production course files, PATHS, Remotion, Bunny, or assistant seed.
2. **Do** charter a follow-up **Prototype Phase 0** (separate playbook) to extract canonical JSON for the three lessons above into a sandbox directory.
3. **Do** run Egyptian → Gulf → English localization passes with human review gates before any talk of runtime integration.
4. **Defer** video script execution and RAG version bumps until at least one locale package is `approved` and mission/assistant guardrails pass a scripted audit.

The Adaptive Lesson Engine is the right long-term architecture for Masaarat’s multilingual, trust-first scale — but launch posture today remains: **technical cleanup closed; production course frozen; this invention stays design + sandbox until P0 evidence says otherwise.**

---

## Prototype sample outputs

| Sample | Status | Notes |
|--------|--------|-------|
| [`adaptive-samples/intro-m1-l2-first-prompt.sample.md`](adaptive-samples/intro-m1-l2-first-prompt.sample.md) | **draft / docs-only** | First one-lesson package: `ar-MSA-v0`, `ar-EG-v0`, `ar-Gulf-v0`, `en-v0` · missions · assistant profiles · video outline · `prototype-v0` |

Additional prototype lessons (`business-m1-l2-reactive-vs-proactive`, `automator-m3-l2-triggers-actions`) remain planned; not yet sampled.

---

*Document owner: Masaarat curriculum architecture · Prototype design only · No implementation authorized by this file.*
