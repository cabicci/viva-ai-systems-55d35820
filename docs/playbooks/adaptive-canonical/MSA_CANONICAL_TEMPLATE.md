# MSA Canonical Extraction — System Template

**Status:** Reusable extraction standard · docs-only  
**Effective:** 2026-06-04  
**Applies to:** All future `*.canonical.md` drafts under `docs/playbooks/adaptive-canonical/`  
**Does not modify:** production lesson files, Bunny videos, Remotion, missions runtime, assistant/RAG seed, or platform UX

**Related:** [`ADAPTIVE_LESSON_ENGINE.md`](../ADAPTIVE_LESSON_ENGINE.md) · [`LESSON_SHAPE_CONSTITUTION.md`](../LESSON_SHAPE_CONSTITUTION.md) · [`MISSION_CONSTITUTION.md`](../MISSION_CONSTITUTION.md)

---

## 1. Purpose

Standardize how **every** Egyptian production lesson is converted into a **draft MSA canonical artifact** — without manual one-off fixes per lesson.

This template defines:

- What to read (input) and what to produce (output)
- Required file sections and schemas
- MSA style rules and forbidden drift
- Quality scoring (/5) and pass/fail gates
- Human review checklist
- A reusable generation prompt for assisted extraction

**Workflow position:**

```
Egyptian production lesson (frozen)
        │
        ▼
MSA canonical draft (*.canonical.md)  ← this template
        │
        ▼
Future Gulf / English / other locales (from MSA — not from Egyptian directly)
```

Every canonical draft is **draft / not production-ready** until a human reviewer records passing scores and signed checklist items.

---

## 2. Input and output

### Input

| Field | Requirement |
|-------|-------------|
| **Source** | Existing Egyptian Arabic production lesson |
| **Read method** | Read-only — typically `src/components/{path}/lessons/{lessonId}.ts` |
| **Also reference** | Curriculum metadata, mission rubric, quiz answer key, block order |
| **Must not edit** | Source TS file, Bunny mapping, PATHS, runtime |

### Output

| Field | Requirement |
|-------|-------------|
| **Artifact path** | `docs/playbooks/adaptive-canonical/{lessonId}.canonical.md` |
| **Artifact type** | `msa-canonical-draft` |
| **Dialect** | Neutral Modern Standard Arabic (MSA) |
| **Review status** | `draft / not production-ready` until human gate passes |
| **Version pin** | `canonicalVersion` (e.g. `YYYY-MM-DD.N-draft`) |

---

## 3. Required sections (every canonical file)

Every `*.canonical.md` must include these sections in order:

| # | Section | Contents |
|---|---------|----------|
| 1 | **Metadata** | lessonId, pathId, production file (read-only), canonicalVersion, reviewStatus, template reference |
| 2 | **Source preservation summary** | Frozen assets, preserved objectives/rubric/quiz, derivation method |
| 3 | **Structured canonical source** | YAML or JSON block: objectives, concepts, blocks (intent), mission, termsLocked |
| 4 | **Arabic MSA canonical lesson text** | Block-by-block MSA prose derived from Egyptian production |
| 5 | **Future generation notes** | Downstream locales from MSA; deferred video/RAG/runtime |
| 6 | **Localization UX notes** | Locale resolution priority (see §8) |
| 7 | **Quality scoring** | /5 scores per dimension + pass/fail result |
| 8 | **Review checklist** | Human sign-off items with status |

Optional appendices (lesson-specific): assistant boundary notes, video production-reference callout.

---

## 4. MSA style rules

Apply when writing §4 (MSA lesson text):

| Rule | Guidance |
|------|----------|
| **Simple Arabic** | Short sentences. One idea per sentence where possible. Avoid nested clauses. |
| **Beginner-friendly** | Assume first-time AI learner. No jargon beyond lesson concepts. |
| **Not academic** | No lecture tone, no heavy formal phrasing, no bureaucratic Arabic. |
| **Avoid heavy formal phrasing** | Prefer «ستفهم» / «اكتب» over stiff equivalents; stay warm and direct in MSA. |
| **English AI terms on first use** | Gloss once: **Prompt (طلب)**, **Context (سياق)**, etc. — then Arabic or agreed short form. |
| **Preserve original lesson intent** | Same one Aha, same block pedagogical job, same mission and quiz logic as Egyptian production. |
| **Neutral MSA** | Remove Egyptian dialect surface forms (e.g. «هتفهم», «عايز», «مفيش») — same meaning in MSA. |
| **No UX redesign** | Block roles match production shape; do not invent new block types or reorder pedagogical flow. |

---

## 5. Forbidden drift

Extractors and reviewers must reject drafts that:

| Forbidden | Meaning |
|-----------|---------|
| **No new concepts** | Do not add tools, frameworks, promises, or objectives not in production |
| **No new tools** | Do not name products, APIs, or workflows absent from source lesson |
| **No changed mission intent** | Rubric dimensions, weights, and learner task unchanged |
| **No changed quiz answer** | Correct index and pedagogical reasoning unchanged |
| **No video regeneration implication** | Video block = production Bunny reference only; no render/upload/publish language |

Also forbidden: editing production files, changing PATHS/slugs, implying Egyptian copy will be replaced by MSA, or adapting Gulf/English directly from Egyptian (must pass through MSA canonical).

---

## 6. Structured canonical source schema

Use in §3 of each artifact:

```yaml
lessonId: {slug}
canonicalVersion: YYYY-MM-DD.N-draft
templateVersion: 2026-06-04
derivedFrom:
  productionLocale: ar-EG
  productionFile: src/components/{path}/lessons/{lessonId}.ts
  derivationMethod: read-only extraction + MSA normalization

meta:
  title: {English working title}
  oneAha: {single sentence}
  difficulty: intro | intermediate | advanced
  estimatedMinutes: {number}
  prerequisites: [{lessonId}, ...]

objectives:
  - id: obj-N
    statement: {measurable learner outcome}
    measurable: true

concepts:
  - id: concept-{slug}
    term: {term}
    termEn: {English if applicable}
    definition: {locale-agnostic definition}
    mustPreserve: true

blocks:
  - role: {orientation|tension|core|glossary|video|comparison|screenshot|quiz|mission|confidence_close|...}
    intent: {one-line pedagogical job — not final copy}

mission:
  type: practice | reflection | ...
  intent: {what learner does}
  rubricIntent:
    - dimension: {slug}
      weight: {percent}
      criteria: {unchanged from production}
  forbiddenAssistantBehaviors:
    - write_full_submission
    - auto_pass_mission

termsLocked: [{term}, ...]

links:
  nextLessonId: {slug}
  continuityNote: {one line}
```

---

## 7. MSA lesson text schema

Use in §4 — one subsection per production block role:

```markdown
### {Block role} — {MSA title mirroring intent}

{MSA paragraphs, lists, tables as needed}

> Production reference only (video blocks): existing Bunny playback unchanged.
```

**Per-block requirements:**

| Block role | MSA text must include |
|------------|----------------------|
| orientation | What you'll learn · why now · what after lesson |
| tension | Familiar problem · why vague fails |
| core | One Aha · worked example if in production |
| glossary | termsLocked with first-use English gloss |
| video | Explicit: production video reference only — no regen |
| comparison | Same contrast structure as production |
| quiz | Question · correct answer · explanation (unchanged logic) |
| mission | Intro · deliverable · rubric labels (weights in §3) |
| confidence_close | Recap · capability · next lesson bridge |

---

## 8. Localization UX rule

Document in §6 of every canonical artifact. **Future runtime** — not implemented by extraction:

| Priority | Source | Rule |
|----------|--------|------|
| **1** | Explicit user-selected locale | Manual choice **always wins** |
| **2** | Saved account or browser preference | Persisted from prior session |
| **3** | IP / location-based suggestion | Auto-suggest when geo signal available |
| **4** | Default fallback | **Current Egyptian Arabic experience** (unchanged production) |

Manual locale choice overrides automatic detection. Egyptian remains default for learners without a resolved preference.

---

## 9. Quality scoring rubric (/5)

Score each dimension **1–5** after draft extraction. Record scores in §7 of the artifact.

| Dimension | 1 (fail) | 3 (acceptable) | 5 (excellent) |
|-----------|----------|----------------|---------------|
| **Objective preservation** | Objectives added/removed/changed | All objectives present; wording loose | Objectives clear and measurable in MSA |
| **Concept preservation** | New concepts or tools introduced | Only production concepts | termsLocked honored; no drift |
| **Beginner clarity** | Confusing or expert-level | Readable for target learner | Simple, scannable, one-idea-per-beat |
| **MSA simplicity** | Dialect-heavy or overly formal | Neutral MSA throughout | Simple, warm MSA; no academic tone |
| **Mission consistency** | Weights or task changed | 70/30 (or prod weights) + intent intact | Mission copy clearly matches production intent |
| **Quiz integrity** | Wrong answer or reasoning | Correct answer preserved | Question + explanation match pedagogy |
| **Assistant boundaries** | Missing or weak forbidden behaviors | forbiddenAssistantBehaviors listed | Clear: no mission solve, no topic pick |
| **Localization readiness** | Missing UX priority or downstream notes | §5–§6 present | MSA clearly marked as spine for Gulf/EN |

### Pass / fail rule

| Rule | Threshold |
|------|-----------|
| **Minimum per dimension** | No score **below 4/5** |
| **Average** | **≥ 4.3/5** across all eight dimensions |
| **Human gate** | Review checklist signed; `reviewStatus` stays draft until pass |

**Fail action:** Revise MSA text or structured source; re-score. Do not publish or wire to runtime.

**Example calculation:** scores `(4,5,4,4,5,4,4,4)` → average = 4.25 → **fail** (below 4.3). Scores `(4,5,4,4,5,5,4,4)` → average = 4.375 → **pass** if all ≥ 4.

---

## 10. Review checklist (template)

Copy into §8 of each artifact; mark ☐ pending · ☑ pass · ⚠ needs human review:

| # | Check |
|---|-------|
| 1 | Egyptian production file untouched |
| 2 | Bunny / video mapping untouched |
| 3 | Template reference present (`MSA_CANONICAL_TEMPLATE.md`) |
| 4 | Objectives preserved vs production |
| 5 | No hallucinated concepts or tools |
| 6 | Mission rubric weights match production |
| 7 | Quiz answer and reasoning unchanged |
| 8 | MSA derived from Egyptian — not back-translated from EN/Gulf |
| 9 | English AI terms glossed on first use |
| 10 | Video block = production reference only |
| 11 | Localization UX priority documented |
| 12 | Quality scores recorded — pass rule met |
| 13 | **Draft / not production-ready** stated explicitly |
| 14 | Human reviewer sign-off |

---

## 11. Reusable generation prompt template

Use when assisted-extracting a new canonical draft. Replace `{placeholders}`.

```markdown
You are extracting an MSA canonical draft for Masaarat Adaptive Lesson Engine.

STRICT RULES:
- Read-only: do NOT modify any production file.
- Input: Egyptian production lesson at `{productionFile}`.
- Output: draft MSA canonical markdown following `MSA_CANONICAL_TEMPLATE.md`.
- Workflow: Egyptian (frozen) → MSA canonical → future locales from MSA.
- This output is DRAFT / NOT PRODUCTION-READY.

MSA STYLE:
- Simple, beginner-friendly Arabic — not academic.
- Neutral MSA; remove Egyptian dialect surface forms.
- Explain English AI terms on first use only.
- Preserve lesson intent, block order, mission rubric weights, quiz answer.

FORBIDDEN:
- No new concepts, tools, or objectives.
- No changed mission intent or quiz answer.
- No video regeneration or Bunny changes.
- No Gulf/English packages in this step.

PRODUCE these sections:
1. Metadata (include templateVersion: 2026-06-04)
2. Source preservation summary
3. Structured canonical source (YAML per template schema)
4. Arabic MSA canonical lesson text (block-by-block)
5. Future generation notes
6. Localization UX notes (manual > saved > geo > Egyptian default)
7. Quality scoring (/5) — self-score then mark items needing human review
8. Review checklist

Lesson: `{lessonId}`
Path: `{pathId}`
canonicalVersion: `{canonicalVersion}`

After draft: verify pass rule (no dimension < 4/5, average ≥ 4.3/5) or flag failures for human fix.
```

---

## 12. File naming and versioning

| Item | Convention |
|------|------------|
| **Filename** | `{lessonId}.canonical.md` |
| **canonicalVersion** | `YYYY-MM-DD.N-draft` until human approval |
| **templateVersion** | `2026-06-04` (bump when this template changes) |
| **Approval** | New suffix e.g. `-reviewed` or version bump — separate charter |

---

*Template owner: Masaarat curriculum architecture · All future MSA canonical drafts must follow this file.*
