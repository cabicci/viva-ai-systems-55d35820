# Central Integration Handoff — Academic isolated pilot
Date: 2026-10-05
Status: ORIGINAL CURRICULUM AND FOUR-LOCALE PILOT READY FOR REVIEW; NOT MERGED OR RELEASE-READY

Repository: cabicci/viva-ai-systems-55d35820
Branch: work/masaarat-academic-20261005
Base: 062b5f59dc56fabbce89c2034008fa1d8ef21114 (PR154)
Pilot implementation commit: 2ccc6af7e54ca6c688f1d4ef1b6a0c7bf78c4b3b
Review-delivery commit: the commit introducing this updated handoff and review evidence; its immutable SHA is supplied in the delivery message to avoid a self-referential hash.

## Delivered scope
Only the first lesson has full authored content. The other 29 lessons are curriculum outlines with objectives and workload estimates; they are not complete lesson packages.

Seven modules and 30 proposed lessons cover business fundamentals, leadership, small businesses, innovation/feasibility, strategy/business planning, establishment/operations readiness and project management. The owner selected 30 total study hours, overriding the source advert's 40 hours. The proposed 60-minute lesson breakdown is a workload estimate; neither university-credit equivalence nor measured learner time is established.

AC-BUS-M01-L01 is authored in ar-EG, ar-MSA, ar-Gulf and en, with outcomes, six explanation sections, an original worked case, formative quiz/feedback, practical assignment, rubric, FAQ and summary. Four nine-page review PDFs were exported and visually checked. Content is original Masaarat production, with no learner-facing external bibliography. Internal verified academic alignment is kept separately and is not included in the learner bundle or RAG.

The isolated Vite review app reuses platform CSS/Tajawal fonts, Button/Progress and the technical section/sidebar presentation. It is outside production routing and has no database, billing or account persistence. The assistant tab accurately describes an optional separately paid add-on; it does not simulate a connected assistant. Shared navigation, commerce and RAG implementation are deferred to coordinated integration.

A new transparent ACADEMIC logo candidate is included under experiments/academic/assets. Existing logos remain untouched. Candidate acceptance and master-mark fidelity review are outstanding. The preview/video renderer currently use the existing master mark and a text line label.

## Media state and limits
Dedicated branch workflow: .github/workflows/academic-pilot.yml.
First run: https://github.com/cabicci/viva-ai-systems-55d35820/actions/runs/37322389925
Scope is one pilot in four locales, not the entire curriculum. The script uses existing Gemini/Remotion infrastructure with an isolated, contextual Egyptian pronunciation policy, then uploads only a new exact-fingerprint identity to Bunny. Existing media and registries are untouched. Rendering/upload/processing/playback and pronunciation acceptance are distinct states; consult the final delivery and Actions receipts for the observed result. No uploaded or playable state is inferred from a queued workflow.

Full pilot drafts were queued without first obtaining acceptance of a short pronunciation sample. They are provisional: no audio gate is claimed passed. The owner must hear actual output and corrections must be logged by word/context/timestamp before scale-up. Captions and measured video/student workload acceptance are outstanding.

## Verified current-state inputs
Recovery plan v143 and continuation register v73 record current Technical/admin integration through PR154 and supersede historical pending entries. Main independently confirmed the baseline commit. Production claims are attributed to those registers; this task did not retest production. No AGENTS.md existed in the baseline recursive tree. The supplied image and source-video frames were inspected; its audio was not independently transcribed.

## Tests and review
Passed: seven modules, 30 unique lessons and 1,800 planned minutes; four contextual packages; section/outcome/question structure; worked-case arithmetic; absence of external source URLs in learner packages; English text checks; context policy/cache differentiation; isolated TypeScript checks; Vite build; renderer TypeScript check; Python compilation; scoped whitespace checks.

Browser: 4 locales × 2 viewport widths (390/1440) × 8 sections = 64 visits. No uncaught page errors or horizontal overflow. Reading sections, quiz controls and feedback checked. Four PDFs each have nine pages and were visually inspected. Evidence: experiments/academic/review/browser-checks.json; reproducible exporter: review.mjs.

ESLint: zero errors, three react-refresh component-export warnings in the isolated main.tsx entry. Full production application, authentication, payment, database and RAG regression suites were not run because these surfaces were not changed. Local Remotion still rendering bundled successfully but was blocked by this execution environment's network-interface enumeration. Subsequently, the actual CI-rendered Egyptian/MSA MP4s were downloaded, SHA-256 verified and four frames per video visually checked; no clipping was found in those samples. This is sampled frame review, not full audiovisual acceptance.

## Preservation and central coordination
One shared account, independent line entitlements, existing receipts/emails/coupons/invitations, stored-admin lesson access, four locales and other-lines-only switcher remain required. No shared runtime was modified. See INTEGRATION_REQUIREMENTS.md for the server permission matrix, shared ownership and required integration tests. No central-chat message was sent; this handoff is prepared for review there. Central integration retains ownership of global registers.

No merge, website publication, production settings change, migration, indexing, email, payment or existing-media modification was performed. No PR was opened.

## Outstanding requirements
- Owner pilot/course-name/audience/prerequisite and logo acceptance; full course content only after pilot acceptance.
- Actual audio listening and timestamped pronunciation review; video playback/captions and learner workload measurement.
- Package prices/periods, catalogue scope, free-preview policy, assistant usage/dependency and cancellation/refund behavior.
- Completion/assessment/certificate wording; no university accreditation claim is authorized.
- Coordinated production routes, introduction/curriculum integration, shared navigation, commerce, private downloads and isolated RAG; permission/regression testing before any separate merge decision.

## Changed files
- .github/workflows/academic-pilot.yml
- docs/academic/CRITERIA_AND_DECISIONS.md
- docs/academic/CURRICULUM_PROPOSAL.ar.md
- docs/academic/INTEGRATION_HANDOFF.md
- docs/academic/INTEGRATION_REQUIREMENTS.md
- docs/academic/INTERNAL_ACADEMIC_ALIGNMENT.md
- docs/academic/curriculum-proposal.json
- experiments/academic/.gitignore
- experiments/academic/Diagram.tsx
- experiments/academic/README.md
- experiments/academic/assets/README.md
- experiments/academic/assets/masaarat-academic-candidate.png
- experiments/academic/content/ar-EG.json
- experiments/academic/content/ar-Gulf.json
- experiments/academic/content/ar-MSA.json
- experiments/academic/content/en.json
- experiments/academic/index.html
- experiments/academic/main.tsx
- experiments/academic/media/build.py
- experiments/academic/media/policy.py
- experiments/academic/media/production-request.json
- experiments/academic/media/upload.py
- experiments/academic/media/vendor/gemini_tts.py
- experiments/academic/review.mjs
- experiments/academic/review/browser-checks.json
- experiments/academic/style.css
- experiments/academic/tsconfig.json
- experiments/academic/validate.py
- experiments/academic/vite.config.ts
- remotion/src/academic/index.tsx

## Media follow-up
The Egyptian and MSA videos rendered successfully and uploaded as new Bunny identities, but the original 300-second readiness checks expired with Bunny still at status 2 (processing). Read-only verification run 37324850367 rechecks the same identities without reupload/deletion. Egyptian measured duration is 310.308 seconds and MSA is 342.228 seconds; the proposed eight-minute video allocation is not an actual measured length. Keep the full 30-hour ledger provisional pending a learner timing trial and an explicit allocation revision.

Render provenance remains commit 2ccc6af; subsequent helper hardening removed legacy automatic content rewriting across all locales. Completed Egyptian/MSA job logs contain no softening/rewrite fallback events. The candidate media are not silently attributed to the hardened renderer revision.

## Additional verification files
- .github/workflows/academic-verify.yml
- experiments/academic/media/verify.py
- experiments/academic/media/verification-request.json
- experiments/academic/media-manifest.json
- experiments/academic/review/media-receipts.json

Read-only verification 37324850367 finished without readiness: both Egyptian and MSA were still Bunny status 2 at 2026-10-05T14:32:29–30Z. This is tracked as AC-MEDIA-01. Recheck these exact IDs; do not rerender/reupload merely because the initial workflow is red. Source files themselves are retained for review.

Additional review files: docs/academic/AUDIO_REVIEW.md and experiments/academic/review/bunny-verification.json.

## Final media observation — 2026-10-05
All four locale MP4s rendered, passed stream/checksum verification, were retained as review files and uploaded to four new Bunny identities. Each initial readiness step exceeded its 300-second budget while Bunny remained status 2. Consequently the production workflow is failed on readiness, not a successful release. The review embed manifest intentionally retains null URLs and playbackReady=false. No new duplicate uploads were attempted.

| Locale | Measured MP4 seconds | Bunny video ID | Acceptance |
| --- | --- | --- | --- |
| ar-EG | 310.308 | 69b5c1a7-f37b-4b5b-b771-5f7910736a32 | Playback unverified; listener review pending |
| ar-MSA | 342.228 | 954a46c1-cf01-4efa-a156-bb56cf8bc95c | Playback unverified; listener review pending |
| ar-Gulf | 294.188 | cc3416fa-e248-45ff-aea9-d0498e276a79 | Playback unverified; listener review pending |
| en | 317.628 | b3ca5096-df11-4a30-8be1-51d9f65f6510 | Playback unverified; listener review pending |

Visual sampling: four actual frames each for Egyptian/MSA, one each for Gulf/English; no clipping observed in these ten sampled frames. This does not substitute for full playback/audio review. All four completed job logs show no automatic softening fallback event. Source/render provenance and hashes are in media-receipts.json.

## Complete branch file inventory
- .github/workflows/academic-pilot.yml
- .github/workflows/academic-verify.yml
- docs/academic/AUDIO_REVIEW.md
- docs/academic/CRITERIA_AND_DECISIONS.md
- docs/academic/CURRICULUM_PROPOSAL.ar.md
- docs/academic/INTEGRATION_HANDOFF.md
- docs/academic/INTEGRATION_REQUIREMENTS.md
- docs/academic/INTERNAL_ACADEMIC_ALIGNMENT.md
- docs/academic/curriculum-proposal.json
- experiments/academic/.gitignore
- experiments/academic/Diagram.tsx
- experiments/academic/README.md
- experiments/academic/assets/README.md
- experiments/academic/assets/masaarat-academic-candidate.png
- experiments/academic/content/ar-EG.json
- experiments/academic/content/ar-Gulf.json
- experiments/academic/content/ar-MSA.json
- experiments/academic/content/en.json
- experiments/academic/index.html
- experiments/academic/main.tsx
- experiments/academic/media-manifest.json
- experiments/academic/media/build.py
- experiments/academic/media/policy.py
- experiments/academic/media/production-request.json
- experiments/academic/media/upload.py
- experiments/academic/media/vendor/gemini_tts.py
- experiments/academic/media/verification-request.json
- experiments/academic/media/verify.py
- experiments/academic/review.mjs
- experiments/academic/review/browser-checks.json
- experiments/academic/review/bunny-verification.json
- experiments/academic/review/media-receipts.json
- experiments/academic/style.css
- experiments/academic/tsconfig.json
- experiments/academic/validate.py
- experiments/academic/vite.config.ts
- remotion/src/academic/index.tsx
