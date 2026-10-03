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
