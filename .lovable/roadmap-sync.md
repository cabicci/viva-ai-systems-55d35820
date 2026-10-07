## 2026-10-05 — Released technical enrolment copy

[roadmap:1e5f7920-f35b-4407-9bc0-17c9ff429489]
scope: ui
source: user
summary: Production verification found one obsolete enrolment-coming-later sentence below the available technical plans link. Reuse the existing four-locale independent-plan/Pro Plus-price copy. No payment, access, backend or media change.
sync_status: same release roadmap item; technical import/admin/checkout and frontend deployed, final copy correction and verification in progress

## 2026-10-05 — Technical checkout deployment packaging

[roadmap:1e5f7920-f35b-4407-9bc0-17c9ff429489]
scope: infra
source: user
summary: Cloud import verified 320 lesson packages and 644 private PDFs. Fix observed technical checkout deployment failure by placing the unchanged coordinator in _shared; preserve Kids import compatibility and deletion/idempotency behavior. Videos remain on Bunny.
sync_status: same production roadmap item in progress; checkout redeployment and administrator migration precede frontend publication

## 2026-10-05 — Technical furniture integration

[roadmap:1e5f7920-f35b-4407-9bc0-17c9ff429489]
scope: lessons
source: user
summary: Integrate 80 lessons/320 contextual packages, protect 644 original PDFs, preserve 320 delivered videos, save progress to the account and add independent technical payments/coupons at Pro Plus prices. Publication authorized; pronunciation review belongs to the owner. Existing AI/Kids/menu/payment contracts retained; Stripe TEST.
sync_status: production roadmap row created; release evidence pending

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

## 2026-10-04 — isolated unified commerce implementation

[roadmap:commerce-groups-manual-payments-20261004]
scope: db
source: user
summary: Implement independent external orders, confirmed payments, private receipts, complimentary grants, package entitlements, group imports, offers and explicit invitation batches. Preserve Stripe TEST, legacy coupon constraints, family consent, account suspension and the existing 15-day financial deletion rule.
sync_status: isolated candidate; launch checkpoint ACCEPTANCE-EXPLANATION-PAUSE-12 remains paused. No merge, production migration, real mail/payment, Paymob activation or deployment is claimed.
## 2026-10-05 — Administrator access in all learning lines

[roadmap:1e5f7920-f35b-4407-9bc0-17c9ff429489]
scope: lessons
source: user
summary: Extend existing administrator lesson access to Kids using the administrator's own account, with no child profile or family subscription. Preserve server role, account, release and content approval checks and normal parent access. Verify all 320 technical and 144 Kids localized lesson tuples. Videos stay on Bunny.
sync_status: same production roadmap item remains in progress; cloud execution and publication are paused by Lovable human-input gate

## 2026-10-06 — Academic written-first integration

[roadmap:0e77dbf5-3737-4742-93ec-b44764a4d9fa]
source: user
scope: db
summary: Integrate pinned written handoff 7b93d7d with independent Academic access, private downloads and TEST commerce. Preserve active media run and source branch. Course and assistant remain disabled pending acceptance; no production release claimed.
sync_status: matching roadmap item created in_progress before implementation

Integration gate correction: CI37455120227 reported GHSA-68fv-2mgg-jv7q in source-map-js1.2.1. Pin the patched1.2.2 dependency only; preserve the advisory gate and active media branch.

## 2026-10-06 — Academic administrator review activation
roadmap_item_id: 0e77dbf5-3737-4742-93ec-b44764a4d9fa
source: user
scope: db
summary: Complete cloud setup and private import so the stored administrator sees the course card and all written lessons/PDFs. Separate review_enabled from public enabled/approved. Preserve ordinary learner gates, source video production and disabled assistant.
sync_status: owner instructed continuation after confirming missing cloud schema; activation and verification in progress


[roadmap:ACADEMIC-NAVIGATION-05] 2026-10-06 — Owner requests consistent learning-area navigation. /academic is now a general overview using the shared LineIntroduction; /academic/curriculum lists server-authorized course cards; each card opens its existing course modules/lessons. Navbar curriculum and return links preserve all four locales; unified login accepts the fixed curriculum destination. No entitlement/payment/media/publication flags changed. Private PDF import remains a separate authorized operational step; results recorded in the authoritative registers.

[roadmap:SHARED-COURSE-CATALOGUES-06] 2026-10-06 — Owner clarified Technical and Academic curriculum buttons must both open stacked full-width course cards, each opening a separate course contents page. Reused one CourseCatalogue component and CurriculumLayout; moved existing furniture contents to /technical/courses/furniture and preserved all 80 lesson URLs/rights/progress. Academic remains server-authorized. No content, payment or media changes.

The owner supplied screenshots showing reversed hero actions. Academic now uses the same unmodified LineIntroduction as Technical: primary plans button followed by curriculum link, with identical labels, order and styles in all four locales.


## [roadmap:path-story-20261006] Owner-approved unified learning journey
Implement Masaarat → line paths → path introduction → optional stations → learning steps. Four contextual locales; shared admin/learner pages with existing server-authorised subscription bypass. One catalogue per line; legacy catalogue redirects. Preserve all source payloads, PDFs, Bunny mappings, production runs, billing rules, parental consent and profiles. Approval in owner chat 2026-10-06; About/vision/mission/values reflect the intellectual and knowledge growth narrative. Validation and deployment are reported separately.

## 2026-10-07 — Learner login continuation

[roadmap:2ed66ecf-84ce-4a5f-b5f5-85f5ff928d1f]
scope: ui
source: user
summary: Complete PR160/161 public QA by preserving all four locales and safe lesson return destinations through server verification, hydrated auth gate, login and signup. Make the Builder Egyptian locale explicit. No entitlement, payment or media changes.
sync_status: matching roadmap row created before this marker; 58 tests, TypeScript and scoped lint passed; build, CI and production verification pending.
