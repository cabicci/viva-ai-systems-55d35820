## 2026-10-08 — Correct native Workers Verify transport

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: infra
source: user
summary: The second owner-triggered WhatsApp attempt exposed a transport-stage failure. Native workerd reproduction proves redirect:error is rejected before network. Use manual redirect handling while retaining non-success rejection, credential isolation and no retries. Add the actual-module native Worker gate to existing CI with synthetic outbound only and existing locked dependencies.
sync_status: Existing roadmap history appended with an exact version guard before this correction. Both uncertain attempts and budget preserved. Local 67 focused tests, strict TypeScript and native GET/start/check/redirect rejection pass; the old option fails the native test. All four previous-head workflows passed. Current-head CI, preview sync and real delivery acceptance remain pending. No extra send, provider/schema change, merge or publication.

## 2026-10-08 — Diagnose the first WhatsApp preview failure

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: infra
source: user
summary: The owner selected the existing stored-admin pilot and switched preview to PR165. The first WhatsApp attempt became uncertain with no stored provider SID; the next SMS click was blocked before sending. Add private failure stage / HTTP status / numeric provider-code diagnostics without phones, OTPs, credentials or raw provider text. Preserve quota, exact receipt binding and no-retry behavior.
sync_status: Roadmap history appended with exact version guard at 2026-10-08T16:46:40.033918Z. Provider linkage and single-account pilot are now configured; earlier pending/disabled notes below are historical. Bounded provider reads did not establish the original error or delivery. No reset/resend, provider setup change, merge or publication. Both-channel real arrival/check and current-head CI remain pending.


## 2026-10-08 — Approved native phone migration applied once

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: db
source: user
summary: Owner explicitly approved live phone storage and deletion integration at 17:02 Cairo. Lovable applied the unchanged 10,880-byte SQL once as native Drizzle 0008. Reconcile the actual native journal timestamp, snapshot and generated public RPC type from platform commit 58d00efd628b504a55a6442c639bc3c3d3ba3de7 into this branch. Both SQL source copies are already applied and must not be applied again.
sync_status: Roadmap appended with exact version guard at 2026-10-08T14:10:00.707615Z. Independent DB readback confirms migration row18, created_at1791468373472 and SHA256497eaa033b4e782a2fdfd4e74b430d3aec4b1bd85a6cede4338e27db99d73351; private RLS/service-only RPCs and previous LC09 source match verified. Sending disabled, no test actors, zero sends/challenges/phones. Previous head ec02a210 passed all four required workflows. No provider write, real message, preview switch, merge or publication. WhatsApp linking still requires the native owner approval inside Lovable.

## 2026-10-08 — Direct phone-entry page and verified rollback source

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: ui
source: user
summary: Add a private /verify-phone page reusing the same account verification component and server actions. Keep the exact path through login/signup, display the signed-in account, preserve four locales and require neither an administrator nor a previously verified phone. The owner supplied a test recipient outside source control. Capture the exact live LC09 function through Lovable for the pending additive migration rollback.
sync_status: Roadmap updated with an exact version guard at 2026-10-08T13:48:02.847921Z. Local 49 focused tests, TypeScript and production build passed. Backup MD5 8c92b9dc579d65e68cba2ffb25489e1f matches live source. No persistent phone migration, preview switch, messages, merge or publication. WhatsApp linking still requires the native owner approval inside Lovable.

## 2026-10-08 — Saved signup language for verification

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: ui
source: user
summary: Owner requires verification messages in the language chosen at registration, for both WhatsApp and SMS. Read the saved preferred_locale from the current Auth account before sending; it overrides the page locale and telephone country. Legacy accounts without a valid preference retain explicit page-language selection. Twilio OTP uses ar for all three Arabic UI locales and en for English. Notification hooks remain pending and must use the same stored preference. Register the additive phone migration in the explicit billing inventory and complete missing private route classification for the admin console and move signup regression tests outside the route source directory.
sync_status: Draft PR165, no merge/publish. Prior head b2aa0526 passed14 native PostgreSQL cases and16 browser locale/channel/viewport scenarios. Its last CI step caught the incomplete route catalog; corrected without weakening the assertion. Provider linking still needs interactive owner approval in Lovable; no real sends or persistent schema apply.

## 2026-10-08 — One verification flow for WhatsApp and SMS

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: ui
source: user
summary: Owner explicitly requested both OTP channels, WhatsApp preferred, without duplicate work. Reuse the existing service, account ownership, durable reservations and global/per-actor/per-number quotas. A server-owned channel allowlist gates sends; the UI prefers WhatsApp when available and locks selection during a live attempt. Add isolated mobile/desktop browser checks for four locales and password eyes. Correct native test JSON serialization and transaction cleanup and verify rollback preserves the installed deletion chain.
sync_status: Draft PR165. Local isolated checks pass; physical PostgreSQL and browser CI pending. Existing WhatsApp sender ONLINE, but native provider setup write rejected because interactive owner approval is unavailable externally. No provider change, real send, persistent schema apply, merge or publication. Provider linking must be approved inside Lovable. No Recovery Plan use.

## 2026-10-08 — Password confirmation and visibility

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: ui
source: user
summary: Owner requested re-enter password at signup and full eye controls. Reuse a localized accessible visibility field in signup, login and reset; reject signup mismatch before Auth and preserve password login. No new Auth provider or subscription change.
sync_status: draft in PR165, isolated tests only, no merge/publication.

## 2026-10-08 — Account phone verification draft

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: db
source: user
summary: Continue PR165 using the existing masaarat OTP service and saved TWILIO_VERIFY_SERVICE_SID. Add an account-bound SMS verification draft with private ownership/challenge data, before-send quotas, exact receipt/check leases, confirmed email/current account checks and LC09 erasure. Preserve email/password sign-in and all subscription/offer access. Initial country scope is Egypt; rollout is off and restricted to an explicit pilot actor allowlist.
sync_status: local implementation and rehearsal; real delivery not tested. No duplicate service, code generation in Lovable, merge or publication. No Recovery Plan use. Platform migration handoff remains through Lovable.

## 2026-10-08 — Linked Twilio connector runtime

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: infra
source: user
summary: Lovable linked the owner-added Twilio connection to this project and confirmed the actual native gateway binding. Adapt the private Verify transport to opaque server-only connector credentials without requiring another Auth Token. Partial connector configuration fails closed. Provider service creation is blocked by Lovable's interactive approval boundary and requires owner action inside its editor; no write retry through another client.
sync_status: draft PR165; no Verify service created, message send, feature migration, merge or publish. WhatsApp sender linkage unverified and marketing test template pending. Supabase/platform operations through Lovable only.

## 2026-10-08 — Twilio communications setup draft

[roadmap:6b617b31-c9be-44c8-98fb-a3e18f6f311a]
scope: ui
source: user
summary: Prepare an isolated administrator communications console and private Verify transport. Configuration checks return booleans only after stored-admin and account-active authorization. All send switches remain disabled. Signup/phone/offers/grants/invitations/receipt event hooks and persistence are pending the correct Twilio account/connector setup through Lovable. Existing auth, payment and entitlements retained.
sync_status: draft only; no Supabase migration, code delivery, provider send, merge or publication. Lovable verified the five Twilio settings and connector absent on 2026-10-08. Real testing required before integration/release.

## 2026-10-07 — Multi-domain social sharing card

[roadmap:b5525659-9af0-488c-b4ad-494e206e46be]
scope: ui
source: user
summary: Replace AI-only social artwork with the approved umbrella headline and four learning fields. Preserve the exact original logo PNG without generation or retouching; use a new image URL for root Open Graph and Twitter metadata. Existing localized title and description remain intact.
sync_status: draft implementation; publication prohibited by owner; roadmap row records the same scope

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

## 2026-10-07 — Unified account journey
[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40]
scope: ui, db
source: user
summary: Owner approved My journey / رحلتي; one /my-learning destination, localized legacy dashboard redirect, per-product progress from existing records, child-specific summaries, durable resume bookmarks and explicit Kids completion marks. No quiz/mastery claim from opening or self-marking a step. Existing progress, lesson content, subscriptions, admin roles and media preserved.
sync_status: appended to the matching production roadmap row before implementation checks. Candidate migration and UI only; production migration/publication pending.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] PR163 follow-up: retain localized legacy dashboard head for the existing localization contract; new journey tests join the existing CI navigation gate. CI532 found this route-head contract before build; no gate disabled.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] PR163 LC09 follow-up: classify journey_visits in the guarded existing erasure inventory, reuse lifecycle read/write blocking, and verify own/other bookmarks before auth deletion in the cumulative native test. Nine isolated migration tests passed; native CI revalidation pending. Production unchanged.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] B024-151 authenticated successfully but its fixture waited for retired /dashboard. Update that wait to canonical /my-learning, require the rendered journey heading, and capture synthetic-account desktop/mobile receipts with overflow checks. Frozen video gate and its digest unchanged.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] Visual receipt review: CI534/LC09-77/B024-152 passed. Initial screenshots captured loading states. Wait for real AI/Technical cards and capture English/Egyptian desktop/mobile; hide the redundant floating return link on /my-learning and use its approved name across locales. No frozen gate changes.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] Billing289 passed concurrency and quiz ACL; its only Phase A failure was the stale exact migration inventory (11 already-merged files plus this additive journey migration). Extend the explicit expected list, retaining exact equality and every wrapper/permission assertion. No billing behavior or historical migration edited. Localized chrome test also reconciled with the existing main label Next step.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] B024-153 stricter loaded-card gate failed waiting for AI. Retain that gate and capture sanitized local REST status paths/UI text on failure for diagnosis. Seed the Technical enabled flag in the disposable fixture only, matching its released state; no production flags or data changed.

[roadmap:421c000b-e7e8-4a13-a2d4-85920e6c7f40] B024-154 receipt confirmed HTTP403/42501 from legacy lesson_progress/user_active_device/user_mission_state/build_logs in the fresh CLI database. Production read-only inspection confirms the corresponding authenticated grants. Restore only required grants in the bounded disposable fixture, retain every RLS policy and the loaded-card assertion. The UI correctly showed an explicit progress-load error; no fake zero progress. New journey_visits RPC/table returned200. Production unchanged.


## 2026-10-07 — owner-authorized website release

roadmap_id: b5525659-9af0-488c-b4ad-494e206e46be
source: user
scope: ui
summary: Owner explicitly authorized merging and publishing the reviewed My journey and original-logo social card. PR163 merged at e1f270b9; social-card candidate synchronizes that base and its exact migration inventory. Preserve payments, entitlements and Academic media production. The branded promotional video is a delivered standalone creative, not a new homepage feature or social post.
sync_status: controlled release in progress; apply the reviewed journey migration before frontend deployment, verify current-head checks and live output, then reconcile both continuation registers. This supersedes the earlier no-publication hold only for this release.

