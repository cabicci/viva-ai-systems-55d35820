# Viva AI Systems — Master Project Tracker

> Single source of truth for project status. Documentation only.
> Reconciled from: `docs/CURRENT_STATUS.md`, `docs/VISUAL_BLUEPRINT.md`, `docs/playbooks/CURRICULUM_FREEZE_CONTRACT.md`, repo reality (2026-06-09).
>
> Status legend: ✅ LOCKED · 🟡 IN PROGRESS · 🔴 BLOCKED · ⏸️ DEFERRED · ⚪ NOT STARTED · ❓ UNKNOWN (needs verification)

---

## 0. Executive Status

| Field | Value |
|------|------|
| Current Phase | Visual Freeze — F1.b complete, F1.c queued |
| Launch Readiness | ~70% (estimate; videos + visual freeze + mobile polish gate launch) |
| Critical blockers | 0 |
| High-priority open items | Visual Freeze F1.c–F8, Video regeneration audit, Mobile UX pass |
| Last major milestone | Assistant P0.2 PASS + Visual Freeze F1.b token replacement (P0 learner surfaces) |
| Last commit snapshot | `98974375` — "Replaced hardcoded colors F1.b" |
| Last production commit (per CURRENT_STATUS) | `897cd96c` |

---

## Brand Identity (Locked)

Status: ✅ LOCKED

### Official platform name
**masaarat.ai**

### Meaning
"مسارات" = guided learning paths, progress, discovery, direction, and learner choice.

### Core concept
The platform is built around learning journeys and paths, not generic AI chatbot usage.

### Brand personality
- Calm
- Guided
- Trustworthy
- Premium educational
- Arabic-first
- Beginner-friendly
- Structured progress
- Practical AI

### Visual identity direction (locked)
- Path / journey metaphor
- Subtle progress language
- Movement, guidance, discovery
- Warm premium education
- Not futuristic-neon AI

### Explicitly rejected direction
❌ Generic robot AI  
❌ Glowing brain / cyber visuals  
❌ Neon startup SaaS aesthetic  
❌ Default Lovable / Lucide look  
❌ Random icon language

### Future implications
| Item | Status |
|------|--------|
| Logo system should reflect paths/journeys/progress | 🟡 |
| Custom icon identity required before final launch | 🟡 |
| Path-specific subtle identities allowed under one umbrella | 🟡 |
| Visual freeze must happen before final video regeneration | 🟡 |

### Critical dependency
⚠️ Major color/icon/visual changes may require selective video regeneration.

### Visual Freeze — Button variant legacy aliases (frozen)
- `neon`, `violet`, and `hero` are **frozen legacy aliases** in `src/components/ui/button.tsx`.
- They currently map to the pastel visual system (`--pastel-lavender`, `--pastel-peach`, `--pastel-yellow`).
- **Do not create new color-named button variants.**
- Future variants should be **semantic** (e.g. primary, destructive, warning), not color-named.

---

## 1. Platform Architecture ✅ LOCKED

- ✅ Master Blueprint completed (`docs/VIVA_MASTER_BLUEPRINT.md`)
- ✅ Module + path structure locked (Intro → Business → Creator → Analyst → Automator → Builder)
- ✅ Phase plan defined
- ✅ Reusable lesson runtime (`learn.$pathId.$lessonId.tsx` + `IntroLessonRenderer`)
- ✅ Separation of concerns: navigation SOT (`PATHS`) vs body SOT (`INTRO_LESSON_CONTENT`)
- ✅ Builder constraints documented (`LESSON_SHAPE_CONSTITUTION.md`, `MISSION_CONSTITUTION.md`)

---

## 2. Curriculum Structure ✅ LOCKED

| Item | Value | Status |
|------|------|------|
| Learner shipped lessons | 100 | ✅ |
| Registry / files total | 104 | ✅ |
| Freeze contract | Active | ✅ (`CURRICULUM_FREEZE_CONTRACT.md`) |
| Archived Business slugs excluded | 4 | ✅ |
| Path structure | 6 paths, frozen | ✅ |
| Placement exceptions accepted | 4 | ✅ (documented, not blocking) |

Excluded archived Business slugs: `business-m1-l3-ai-thinking-partner`, `business-m2-l4-pricing-cash-flow`, `business-m3-l4-hiring-onboarding`, `business-m4-l5-business-os-dashboard`.

---

## 3. Lesson Placement & Module Logic 🟡 IN PROGRESS

- ✅ Module structure correctness — verified per path
- ✅ Placement review for the 4 exception lessons (signed off temporarily)
- ⏸️ Naming normalization for the 4 exceptions — DEFERRED to post-P0 cleanup
- ✅ Route alignment (`/learn/{pathId}/{lessonId}` matches PATHS)

Exceptions (slug `m{N}` ≠ module id, accepted):
- `creator-m4-repurposing` in `creator-m5-polish`
- `analyst-m4-automated-dashboard` in `analyst-m5`
- `analyst-m5-ab-testing` in `analyst-m6`
- `automator-m3-testing-automation` in `automator-m4`

---

## 4. Naming & File Unification 🟡 IN PROGRESS

- ✅ Lesson IDs follow `{path}-m{module}-l{lesson}-{slug}` (Core rule)
- ✅ `slug = id = filename` rule active per freeze contract
- ✅ Route consistency aligned with PATHS
- 🟡 Source-of-truth alignment: PATHS / routes / registry / files aligned for 100 learner slugs; 4 archived registry-only entries remain by design
- ⏸️ Export-constant cleanup (e.g. `BUILDER_M7_*` vs `builder-m8-*` filenames) — DEFERRED
- ⏸️ Stale doc purge (`lessons-data.ts` references) — DEFERRED

---

## 5. Lesson Content Quality ✅ LOCKED (with deferred polish)

- ✅ All 6 paths rewrites completed (Intro, Business, Creator, Analyst, Automator, Builder)
- ✅ Content freeze active per `CURRICULUM_FREEZE_CONTRACT.md`
- ✅ 6 technical lesson fixes (`f45ba9f`)
- ✅ 8-lesson terminology pass (`133637b`)
- 🟡 Eyebrow close review — ❓ status per-path not centrally tracked
- ⏸️ Optional constitution alignment (Creator confidence-close eyebrows) — DEFERRED
- Remaining content debt: ❓ no central debt log

---

## 6. Missions ✅ LOCKED

- ✅ Mission Constitution + Target Design complete
- ✅ Mission Runtime Phase A + B1 + B2 + B3-lite complete
- ✅ Rubric alignment per constitution
- ✅ Runtime validation via `MissionRubricSubmit`
- 🟡 Markdown cleanup sweep across all missions — ❓ not centrally verified

---

## 7. Images Inside Lessons 🟡 IN PROGRESS

- ❓ Diagram quality — no central audit log
- ❓ Repeated visuals — no audit
- ❓ Missing visuals — no audit
- ❓ Placeholders — no audit
- ⚪ Lesson-image audit — NOT STARTED as a formal pass

> This is one of the largest uncertainty areas. A dedicated image audit is recommended before final visual freeze.

---

## 8. Videos 🟡 IN PROGRESS / 🔴 GATING LAUNCH

- ✅ Bulk generation completed for shipped lessons (per workflow history)
- ❓ Per-lesson Bunny coverage table — not centrally maintained here
- 🟡 Changed-lesson impact audit — pending; must re-run after any lesson content edits since last batch
- 🔴 **Regeneration decision pending**: see core rule — *Major visual changes may require video regeneration.* Final video freeze depends on Visual Freeze (F0–F8) completion.
- Final freeze dependency: Visual Freeze F8 must complete before final video lock.

> **CRITICAL**: Any content/script edit to a lesson file must trigger `lesson-video.yml` (per Core rule). Audit pending to confirm all edits since last batch were re-rendered.

---

## 9. Assistant (AI Teacher) ✅ LOCKED (P0.2)

| Phase | Status |
|------|------|
| P0 semantic seed + retrieval smoke | ✅ PASS |
| P0.1 prompt grounding hardening | ✅ |
| P0.2 semantic similarity threshold | ✅ |
| Seed: knowledge_chunks | ✅ 100 learner lessons / 198 chunks |
| Retrieval | ✅ Path-aware filtering |
| Grounding | ✅ Hardened |
| Fallback behavior | ✅ Unsupported-topic fallback active; Builder fallback removed |
| Production hardening | ✅ |
| In-lesson assistant | ❓ Status not explicitly tracked in CURRENT_STATUS — needs verification |

---

## 10. UI / Visual System 🟡 IN PROGRESS

| Phase | Status |
|------|------|
| F0 — Token Inventory & Lock | ✅ (`docs/VISUAL_BLUEPRINT.md`) |
| F1 — Hardcoded color replacement map | ✅ |
| F1.a — Author missing semantic tokens | ✅ (surface + accent tokens added) |
| F1.b — Replace hardcoded colors in P0 learner surfaces | ✅ 25 replacements across 6 files |
| F1.c — Sweep secondary learner files | ⚪ NEXT |
| F2–F8 | ⚪ NOT STARTED |
| Typography scale | 🔴 Missing — flagged in VISUAL_BLUEPRINT §1 |
| Spacing system | ❓ Not formally codified |
| Token system | ✅ OKLCH pastel identity locked |
| Hardcoded color cleanup | 🟡 ~20 files audited; 6 done, remainder pending |
| Visual freeze ↔ video dependency | 🔴 Must finish before final video lock |

Current visual score (per blueprint): **68/100**.

---

## 11. Mobile UX ⚪ NOT STARTED (as a formal pass)

- ❓ Sidebar mobile behavior — basic responsive present, no formal audit
- ❓ Responsiveness across breakpoints — no formal pass
- ❓ Scroll fatigue on long lessons — not measured
- ❓ Tap-target sizing — not audited
- Visual smoke at 390×844 passed for `/dashboard` only (F1.b check)

> Recommend a dedicated Mobile UX phase after Visual Freeze F2.

---

## 12. Security & Runtime 🟡 IN PROGRESS

- ❓ Service keys — assumed configured (Lovable Cloud managed); not re-verified here
- ❓ RLS — no central policy audit log; assistant tables seeded under standard setup
- ❓ Admin protection — status not centrally tracked
- ❓ Rate limiting (assistant) — status unknown
- ✅ Assistant production hardening completed (per CURRENT_STATUS)

> Recommend formal security pass via `security--run_security_scan` before launch.

---

## 13. Analytics / Observability 🟡 IN PROGRESS

- ✅ Persona-100 diagnostics completed
- ✅ Retrieval debug tooling used during P0
- ❓ Assistant runtime metrics dashboard — not centrally tracked
- ❓ Learner tracking / funnel analytics — status unknown

---

## 14. Launch Readiness

### Must before launch
1. Visual Freeze F1.c → F8 complete
2. Typography scale defined and applied
3. Lesson-image audit complete (Section 7)
4. Video regeneration audit + re-render of any changed lessons (Section 8)
5. Mobile UX pass (Section 11)
6. Formal security scan + admin/rate-limit verification (Section 12)
7. In-lesson assistant status verified (Section 9)

### Can wait after launch
- Naming normalization for the 4 placement-exception slugs
- Export-constant cleanup (`BUILDER_M7_*` etc.)
- Stale doc purge (`lessons-data.ts` references)
- Optional constitution alignment (Creator confidence-close eyebrows)
- Advanced analytics dashboards

### Known risks
- 🔴 Video staleness if visual freeze triggers regeneration of many lessons
- 🟡 Typography scale gap may force a second visual sweep
- 🟡 Mobile UX has had no formal pass — unknown regressions likely
- 🟡 Image audit is the largest uncertainty area
- 🟡 Security posture not centrally verified

---

## 15. Immediate Next Priorities

1. **Naming & file unification audit**
2. **Lesson placement verification**
3. **Lesson image audit** (Section 7) — full pass, classify gaps
4. **Video impact audit** — diff edited lessons since last batch vs Bunny
5. **Visual Freeze continuation** (F1.c–F8)
6. **Custom icon identity direction**
7. **Final visual freeze**
8. **Selective video regeneration** — only after visual freeze complete
9. **Mobile UX formal pass** — sidebar, tap targets, scroll fatigue
10. **Security scan** — RLS, admin, rate limiting, service-key review

> Reason: Avoid redesign work that later forces rework of videos/content.

---

## Uncertainty Areas (explicitly marked ❓)

- Per-lesson Bunny video coverage table
- Lesson image audit (no formal pass yet)
- Mobile UX state across breakpoints
- RLS / admin / rate-limit posture
- In-lesson assistant status
- Eyebrow close review completion per path
- Markdown cleanup status across all missions
- Central content-debt log
