## 2026-10-03 — Immediate mail through the existing Edge worker

[roadmap:5ef825a9-66b9-430f-9c03-57b161126504]
scope: infra
source: user
summary: Reuse installed server-only worker authorization for target-only welcome/contact dispatch; preserve immutable queues, idempotency, retries and separate batch lifecycle. No new secret, Vault, cron or migration; no accepted-message resend.
sync_status: matching roadmap_items note appended; current production and acceptance evidence remain in the two authoritative registers

## 2026-10-03 — Immediate confirmed-account welcome

[roadmap:5ef825a9-66b9-430f-9c03-57b161126504]
scope: infra
source: user
summary: Verified-request immediate welcome attempt reuses the durable outbox, existing transport, idempotency and retry; preserve account/family deletion locks and local displaced-session sign-out. No new Vault/token/cron or resend.
sync_status: matching roadmap_items note appended; deployment and final acceptance remain separate in the two authoritative registers

## 2026-10-03 — Shared lifecycle packaging correction

[roadmap:lifecycle-shared-packaging-20261003]
scope: infra
source: user
summary: Preserve the lifecycle handler implementation unchanged in _shared so the existing welcome function packages it; keep dedicated endpoint compatibility exports. The additional Vault/token setup remains cancelled.
sync_status: recorded in source and the two authoritative registers with integration evidence

## 2026-10-03 — Existing scheduled lifecycle integration

[roadmap:lifecycle-existing-worker-20261003]
scope: infra
source: user
summary: Reuse the existing protected welcome scheduler for internal account/financial lifecycle processing; no new Vault binding, token or cron. Preserve fifteen-day deadlines, durable leases, family erasure, separate switches and mail isolation.
sync_status: recorded in CURRENT_STATUS; production/CI evidence belongs in the existing two authoritative registers

# Roadmap sync marker

[roadmap:cc83bcf5-3929-45ff-b3a5-8ff8abd7f5bf]
date: 2026-09-25
scope: db
source: ai
summary: Prepare child-specific consent receipts, atomic profile creation and withdrawal; all release gates remain unchanged
sync_status: pending Central roadmap_items update

This change is prepared locally. The matching roadmap_items update is pending Central coordination.
The build's roadmap guard fails on ANY meaningful project change without a fresh marker.

## 2026-09-30 — account recovery email

[roadmap:account-service-email]
scope: other
source: user
summary: Localize password recovery in the four existing locales using the existing verified-recipient profile lookup, preserving SDK signature verification and recovery URLs.
sync_status: source change prepared; roadmap_items and production delivery are not claimed

## 2026-09-30 — LC-09 cumulative review

[roadmap:account-deletion-review]
scope: other
source: user
summary: Synchronize the existing request-only deletion draft with PR #117, update the explicit cumulative migration inventory, and collect manual/policy checks for the final review round.
sync_status: draft only; final deletion, roadmap_items update and production activation are not claimed

The automatic Billing gate found one stale adult-quota inventory assertion.
The review correction scopes that assertion to adult migrations; the complete
cumulative inventory remains checked separately. One corrected-head run is
pending. Kids runtime and payment behavior are unchanged.

## 2026-09-30 — release evidence inventory

[roadmap:billing-validation-evidence]
scope: infra
source: user
summary: Reuse the reviewed named-suite checker for the current 15-suite/175-test TEST inventory, and synchronize the adult quota and cumulative migration assertions.
sync_status: source prepared; no payment, Kids runtime, database or production deployment change

## 2026-09-30 — marketing conversions

[roadmap:MEP-060]
scope: ui
source: user
summary: Measure accepted contact leads and distinct pricing views only after analytics consent, with no submitted personal data or payment events; localize the signup document title without changing account creation or redirects.
sync_status: source change prepared; roadmap_items production update and deployment are not claimed

## 2026-09-30 — remaining nonfinancial security and operations gates

[roadmap:launch-security-closure]
scope: infra
source: user
summary: Repair the installed dependency advisories, prove the shipped RAG corpus RLS in disposable PostgreSQL, and reconcile the operational handoff with accepted evidence and final-round review sequencing.
sync_status: candidate source; no production deployment, DB mutation, Kids feature change or financial action claimed

## 2026-09-30 — completed delivery receipts

[roadmap:launch-closure-receipts]
scope: infra
source: user
summary: Record the accepted CI/Billing heads, ordinary merge, scoped live deployment-ID responses and current governance requirements while preserving the separate final manual gates.
sync_status: documentation only; no new deployment, database or runtime change

## 2026-10-01 — account and family deletion

[roadmap:account-deletion-review]
scope: db
source: user
summary: Prepare disabled finalization, full Kids family erasure, retained financial replay guards, and recoverable Checkout coordination. The owner explicitly included Kids in account deletion; all broader Kids work remains paused.
sync_status: draft implementation and tests; roadmap_items production update and activation are not claimed

## 2026-10-03 — immediate contact acknowledgement

[roadmap:contact-immediate-send]
scope: other
source: user
summary: Start a targeted server-side attempt after durable contact enqueue; reuse the existing welcome schedule for isolated retries, preserving sender, receipts and LC-09 deletion suppression.
sync_status: source candidate tested locally; production activation and roadmap_items update are not claimed

CI443 surfaced GHSA-vfj7-8cjw-p6xm in braces3.0.3 (no patched braces release).
The existing override mechanism pins Chokidar4.0.3, removing braces and its unused
transitives. TanStack watches a literal route directory; unstorage watches its
base directory and supports Chokidar4. Two actual watcher tests cover add/change/
unlink and storage notifications. bun audit is clean (627 packages); no gate is
disabled. Reference: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm and
https://github.com/paulmillr/chokidar#upgrading.

## 2026-10-03 — preserve platform migration artifacts

[roadmap:contact-immediate-platform-sync]
scope: infra
source: user
summary: Reconcile Lovable's already-applied targeted-claim migration artifact, generated types and migration-tool dependencies after PR128 deployment; update the lock without reapplying SQL.
sync_status: platform function deployed with contact disabled; application publication and activation remain separate

## 2026-10-03 — owner-enabled direct route integration

[roadmap:d50a17d1-6185-4015-9798-d2d79b3035d3]
date: 2026-10-03
scope: other
source: user
summary: [scope:infra] contact confirmation emails now send at form submit via CONTACT_MAIL_DIRECT_ENABLED, no cron/Vault

This file is updated after the matching roadmap_items row is updated.
The build's roadmap guard fails on ANY meaningful project change without a fresh marker.

The same activation decision governs direct sends and retries on the existing welcome schedule. Historical receipts above are preserved; production activation evidence remains a separate gate.

## 2026-10-03 — remove obsolete contact delivery path

[roadmap:contact-direct-retirement]
scope: infra
source: user
summary: Owner-requested retirement of unused contact cron preparation, legacy Edge entrypoint and original switch consumption; preserve immediate delivery, existing-worker retries and all receipt/outbox data.
sync_status: source prepared; platform deletion and runtime acceptance remain separate

## 2026-10-03 — isolated furniture lesson experiment

[roadmap:furniture-pilot-temporary-branch]
scope: lessons
source: user
summary: Owner revised the temporary furniture lesson to Egyptian colloquial Arabic and English only. Calculated assembly animation reuses existing Remotion, Gemini TTS, lesson-video Actions and Bunny pipeline; both narrated videos completed through Actions37155581488 and reached Bunny status4 in the technical-education collection; grounded generative assistant and human teaching assessment remain pending. A silent Higgsfield comparison sample completed; no further photorealistic shots planned.
sync_status: temporary branch only; no roadmap_items database update, entitlement change, production activation or deployment claimed


## 2026-10-04 — furniture preview presentation refinements

[roadmap:furniture-pilot-temporary-branch]
scope: lessons
source: user
summary: Remove the learner-facing source footer and workbook reference section; offer workbook, cut list and drawings exclusively as PDFs in Lesson files; place contextual, expandable drawing thumbnails beside the six explanation sections in both authored locales. Reuse existing diagrams, media and preview hosting.
sync_status: temporary branch and isolated private preview only; no roadmap_items database or main-production changes


## 2026-10-04 — descriptive furniture PDF filenames

[roadmap:furniture-pilot-temporary-branch]
scope: lessons
source: user
summary: All experimental PDF downloads now save as localized file type plus lesson title, including the workbook link in Practice. Asset URLs, PDF contents and videos are reused.
sync_status: temporary branch and existing private preview only


## 2026-10-04 — temporary technical education brand

[roadmap:furniture-pilot-temporary-branch]
scope: ui
source: user
summary: Add a TECH wordmark using the KIDS logo lockup, letter colors and typography, with a localized technical-education caption. Show it immediately beside KIDS in desktop/mobile navigation only when the experimental lesson opts in.
sync_status: existing temporary branch/private preview only; normal Navbar callers retain current navigation

## 2026-10-04 — technical journey implementation

[roadmap:furniture-pilot-temporary-branch]
scope: lessons
source: user
summary: Begin the authorized technical journey on the existing experiment branch: source-free 7-section/21-module/80-lesson catalogue; original first-module content in four registers; reading, examples, quizzes, saved practice, PDF-only downloads, contextual diagrams and device-local preview progress. Reuse M04-L02 and extend its authored copy, PDFs and narrated assembly script to four locales. Main-site package/account integration follows content acceptance.
sync_status: implementation in progress on temporary branch; checks, media production and preview deployment not yet accepted; no central roadmap_items database, billing, account permissions, main merge or production changes

Acceptance update: 22 scoped tests, TypeScript, scoped lint, production build, Remotion geometry and audio gate passed. Local browser checks accepted four locales on mobile/desktop, PDF names, reload persistence and isolated endpoints. The first 5 authored lesson IDs are ready for reading; 75 catalogue entries remain in preparation. 20 production cells are configured, with one compatible existing English video reusable and 19 newly rendered cells pending. No production or account-progress integration is claimed.

Delivery evidence: experiment source f4c4051b5556dc4c981c2100b66c0fea21064fb3; private preview deployment appgdep_6ac19e28d1988191b32bede202bdfd82 succeeded. Existing Actions run37165099121 is producing first-batch media; collection ready, original adult jobs skipped. PDF exporter is persisted with content/output hash reuse. Main-site package/account integration remains pending after accepted content.

[roadmap:furniture-pilot-temporary-branch]
2026-10-04 — Correcting repeated explanation diagrams: 12 section-specific foundation figures and six unique cut-list figures across all four registers. Reading, zoom assets and PDF workbooks share the same drawings. Scope remains temporary branch/private preview; no entitlement/main integration change. Regression checks cover actual SVG content uniqueness. Publication and visual acceptance pending.
Acceptance: 23 scoped tests, TypeScript, scoped lint, production build, 40 mobile/desktop locale lesson views and all 44 PDF layout gates passed. 18 distinct explanation drawings are shared by reading/zoom/workbook. Private preview publication pending; main/account/package unchanged.

Illustration correction published: temporary branch commit 8ef640f8; private preview source 77ca53c6; deployment appgdep_6ac1e621fa688191a887dd8b8edd97b2 succeeded 2026-10-04T05:38:15Z. Main integration remains pending.

[roadmap:furniture-pilot-temporary-branch]
2026-10-04 — Remove the technical journey's duplicate language controls and use the existing platform LanguageSelector. Match Arabic technical-video typography to the existing Remotion Cairo theme; reuse narration caches. Five authored lesson IDs/20 successful video jobs verified in run37165099121; 75 lessons remain unproduced. Temporary branch/private preview only; no main-site, Kids, account or billing change. Checks and revised media publication pending.
Acceptance: 18 scoped tests, application TypeScript/lint/build, Remotion TypeScript, geometry and audio-mux checks passed. Rendered all 81 Arabic scene frames with the existing Cairo font and visually checked all three Arabic registers. English assembly pixel comparison passed seven scenes and retains its accepted media revision. Header language-switch browser verification and revised media publication in progress.
Header acceptance completed: 16 real language changes passed on mobile/desktop, using only the existing selector, preserving the lesson and localized content. Shared locale-navigation hook unchanged. Run37186728823 is rebuilding corrected media with voice-cache reuse; first Egyptian M01-L01 render complete, Bunny upload/readiness in progress. Private preview update pending.
First Cairo video accepted for playback: Egyptian M01-L01, Bunny5a7ddb0e-7154-4fae-9a36-6b5ceced090f, status4, 106s; job111390141615 succeeded in run37186728823. Existing narration reused five cached segments with zero new TTS generation. Remaining revised media continues through the existing serialized workflow. Private preview update being prepared with this ready mapping.


[roadmap:furniture-pilot-temporary-branch] Egyptian qaf review — 2026-10-04

User requires qaf pronunciation to be decided per word and context, including words that retain qaf. Scoped inspection found the legacy compact TTS prompt still says qaf=hamza, while the allow-list preprocessor also transforms selected words. The existing voice review pack now contains all qaf tokens in the five Egyptian narration scripts and a mandatory context/listening gate. This is a recorded acceptance requirement, not a completed audio fix. Existing Cairo renders reuse earlier audio; pronunciation correction and word-level listener decisions remain pending. No global TTS prompt, accepted audio, other locale voice or main-site behavior was changed.


[roadmap:furniture-pilot-temporary-branch] Private preview delivery: source89ba7808fd2273012147a23daea226369219c0b3, deployment appgdep_6ac20681821881918debe0509c4a2ac4 succeeded at 2026-10-04T07:56:00Z. The owner-private preview contains the single platform header selector and the new Cairo Egyptian M01-L01 video GUID5a7ddb0e-7154-4fae-9a36-6b5ceced090f. Main integration remains unchanged. Actions run37186728823 has completed Egyptian M01-L01 through L03; L04 is in progress. Later media mappings are not included in this compiled preview. Egyptian pronunciation remains pending word/context and actual-listening acceptance.


[roadmap:furniture-pilot-temporary-branch] Source recovered — 2026-10-04: resolved-reference prepare_materialize placed the exact source at /workspace/scratch/61b6becf6b09/technical-source-recovery/Metwood_Furniture_Design(1).pdf. Verified 183250232 bytes, 408 pages and SHA25663ae6c7b933fe33cacddbb32210390d43926da632b72d9cbeb5643f10bc6a136; applied Library identity/xattrs. The earlier HTTP502 materialization blocker is superseded. The second agent has resumed actual remaining-75 authoring in its isolated branch/worktree, starting M02–M06. Existing curriculum mapping is reused without restarting planning. No new lesson-completion count, audio acceptance or publication is claimed until reviewed batch evidence arrives.


[roadmap:furniture-pilot-temporary-branch]

### Reviewed M02 integration and scoped Egyptian voice production — 2026-10-04

Integrated agent batch 4effbd66: four M02 lessons, 16 contextual locale packages, 12 distinct concept geometries, 32 PDF downloads and 16 narration text packages. Agent acceptance: 64 PDF pages visually reviewed, 32 browser cases, all 44 previous PDFs unchanged. Coordinator reviewed Arabic/English contact sheets, and confirmed all 48 existing localized first-module SVGs remain byte-identical after the additional-diagram dispatcher. Current authored content: 9 of 80; new media does not count as complete until generated and checked.

Technical Egyptian TTS now uses an explicit context-based pronunciation policy and preserves authored text and dimensions. The old blanket qaf-to-hamza prompt/preprocessor is bypassed only for technical Egyptian calls; existing adult and other-locale profiles remain unchanged. Exact provider-payload comparison passed for 81 non-Egyptian segments; guarded compatibility preserves 15 existing audio/render identities only for the reviewed unchanged inputs. Egyptian segment cache identity includes its exact speech, focus, voice, model and policy, so compatible unaffected segments can be reused safely on retries. Actual new-audio naturalness remains pending listening; a prompt regression test is not speech acceptance.

The existing workflow now selects only content-reviewed, missing/revised media and verifies readiness before reuse. Its matrix is bounded to 200 cells and reports the remainder explicitly for subsequent production checkpoints. Up to two technical cells run together, and per-cell mapping commits retry against the latest temporary branch. Original adult build job is unchanged. Reviewed media manifest includes the nine lessons; no outline-only entry is approved for production.

Coordinator acceptance so far: six voice-policy tests, six scheduling tests, nine authoring-integrity regression tests, audio-mux gate, 17 shared diagram/content tests, application TypeScript and scoped lint passed. Previous Cairo Actions run37186728823 completed successfully for all 20 original cells. New production and updated preview are pending until their returned receipts are recorded. No main integration, pricing, account progress or database changes.
