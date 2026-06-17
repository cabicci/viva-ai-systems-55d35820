# مسارات (masaarat.ai) — Current Status

## Current Phase

**P0 Launch Ready** — Aggressive Controlled Launch Ready

Operating model: `docs/playbooks/P0_LAUNCH_CONSTITUTION.md`.

Drift cleanup: **complete enough for launch** (Final Drift Re-audit PASS — launch blockers 0, high runtime blockers 0).

## Completed

- Master Blueprint completed
- Mission Constitution completed
- Mission Target Design completed
- Lesson Shape Constitution completed
- Pilot Template Decision completed
- Curriculum Architecture Decision completed
- Intro full rewrite completed
- Business / Creator / Analyst / Automator / Builder rewrites completed
- Learner path aligned to 100 lessons
- Registry remains 104 with 4 archived Business lessons excluded from learner path
- Mission Runtime Phase A + B1/B2 + B3-lite completed
- Fast UX pass and polish completed
- Persona-100 diagnostics completed
- 6 technical lesson fixes completed — f45ba9f
- 8-lesson terminology pass completed — 133637b
- Curriculum Freeze Contract committed — a3f1ecb
- Assistant P0 semantic seed + retrieval smoke test PASS
- knowledge_chunks seeded (100 learner lessons / 198 chunks)
- Path-aware retrieval filtering completed
- Builder fallback removed
- Prompt grounding hardening P0.1 completed
- Semantic similarity threshold P0.2 completed
- Unsupported-topic fallback completed
- Assistant production hardening completed
- P0 Launch Constitution committed — Aggressive Controlled Launch + Rapid Iteration (`docs/playbooks/P0_LAUNCH_CONSTITUTION.md`)
- Launch blockers Batch A1/A2 closed (route guards, legal drafts, persona-sim secured)
- P0 Safe Fixes published and verified (strict validators, rate limits, dynamic admin load) — with auth-limitation warning documented
- Duplicate homepage canonical fixed and verified on production — `0d58a49`
- Standalone `/ai-assistant` auth-gated (anonymous → `/login`); verified on production — `cc84946`
- In-lesson assistant: `AssistantPanel` compact embedded on every open lesson (`/learn/$pathId/$lessonId`)
- `public/persona-sim` local leak cleaned; assets secured under `src/data/` + admin-only server fns
- Mega Source-of-Truth Audit: **PASS WITH WARNINGS**
- Drift cleanup Batches 1–4C completed (route auth, brand/naming, stale audit artifacts, Remotion loader drift)
- Final Drift Re-audit: **PASS** — launch blockers 0; PATHS 100; registry/content 104 (100 learner + 4 archived Business); RAG seed 100; Bunny playback 100/100
- Production route/source smoke: **PASS** (post onboarding hotfix — no spinner, no redirect loop, no protected content exposed)
- Onboarding legacy redirect hotfix — `26b8758`

## In Progress

- Post-launch hardening and cleanup (non-blocking backlog only)
- Visual Freeze Planning (deferred polish per P0 Constitution)

## Blocked

None

## Launch blockers

**Critical / High / High runtime: 0 open.** Remaining items are post-launch hardening unless live evidence elevates them.

## Known post-launch (non-blocking)

- Remotion registry missing `analyst-m5-ab-testing` — affects **future video regeneration pipeline only**; Bunny learner playback remains **100/100** (GUID exists).

## Latest Production Commit

26b87589d563ee9b9399b64339026516aa28e83e

## Next Planned Step

Choose one (all valid post-drift):

1. **Launch / marketing preparation** — aggressive controlled launch + 72h observation (per P0 Launch Constitution)
2. **Optional small Remotion alignment batch** — add `analyst-m5-ab-testing` before future video regeneration (not required for current playback)
3. **Post-launch hardening backlog** — system-state GAPS refresh, doc/tooling sync, visual polish

## Latest Assistant Milestone

Assistant P0.2 PASS · standalone page auth-gated · in-lesson embedding confirmed
