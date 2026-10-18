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


## 2026-10-18 — lesson answers and quiz ownership (items 44, 146, 64)

[roadmap:local-batch-44-146-64-20261018]
source: direct owner instruction in receiving chat 01a1443d-497a-7a52-9baf-667fb1b2deb0
scope: ui, existing authenticated read adapter; no schema or production operations
summary: Isolate mission state and tab-scoped unsent drafts by user/lesson/mission/locale; ignore late responses after navigation; restore saved evaluated answers/feedback without regrading; isolate quiz selection/reveal by owner and locale. Preserve stored answers, pass status, attempts, rubric and grading behavior.
sync_status: Local source checkpoint only. No production roadmap row was created or claimed. Twelve pure draft/feedback assertions passed. Component regressions, TypeScript, lint and build are being verified; final results are recorded in the drive-resident implementation receipt. No push, merge, deploy, website publication or live-account activity.

## 2026-10-18 — readable mission examples and grounded feedback (items 2, 147)

[roadmap:local-batch-2-147-20261018]
source: owner instruction to continue the remaining audited corrections in chat 01a1443d-497a-7a52-9baf-667fb1b2deb0
scope: existing mission display/provider normalization and four-locale evaluation instructions; no schema change
summary: Render structured model answers as readable text before persistence and on restoration, preserve existing learner answers and cached payloads, and explain irrecoverable historical object-coercion text without regenerating automatically. Ground feedback in the actual submission, distinguish hypothetical exercises from observed activity, and remove mandatory praise while retaining rubric weights and the pass threshold.
sync_status: Local implementation checkpoint. No production roadmap row claimed. Deterministic synthetic fixtures and mocked provider/client tests are being verified; final results belong in the drive implementation receipt. No merge, deployment or live grading authorized by this checkpoint.
## 2026-10-18 — account accessibility and signup clarity (items 15, 47, 48, 118, 120)

[roadmap:local-batch-account-ui-20261018]
source: direct owner authorization to continue the remaining audited corrections
scope: signup/recovery label associations, mobile menu close label, account day wording and signup context/policy navigation
summary: Associate only the two affected labels; localize the shared menu close control through its caller; use the singular day key for count 1 while preserving other values; expose same-locale policy links in separate tabs so form state remains; explain the platform-wide account without promising paid content access.
sync_status: Local implementation only. Existing authentication and submission handlers are preserved. No new consent requirement, recovery message, registration, account-value change, merge or publication. Validation and review records are retained on the shared drive.
## 2026-10-18 — technical activity state and academic section visibility (items 124, 125, 156)

[roadmap:local-batch-technical-academic-ui-20261018]
source: direct owner authorization to continue audited corrections
scope: existing cabinet lesson quiz/practice UI and academic section navigation
summary: Block incomplete technical quiz submissions with completion guidance, clear stale UI errors on edits and successful retries, and prevent duplicate pending submissions. Use trusted saved activity success consistently in counts and sidebar marks without inventing scores or answers. Reveal an academic section hidden above the sticky header after navigation, leave already visible content in place, and preserve the controlled practice draft.
sync_status: Isolated component regressions and CI validation in progress. No production activity submitted, no database schema or server grading change, and no merge/publication. Responsive live verification remains pending the owner's publication.
## 2026-10-18 — restricted learner text formatting (items 14, 159)

[roadmap:local-batch-lesson-formatting-20261018]
source: direct owner authorization to continue the audited corrections
scope: Intro terminology/comparison inline fields and the separate Academic assignment text renderer
summary: Render paired emphasis in the specified Intro paths, keeping ordinary text and HTML inert. Use the Academic safe text renderer for assignment prompts, grouping authored bullet lines into lists and preserving paragraphs, arithmetic, raw source numbers, rubric and five controlled answer fields. Preserve unmatched literal asterisks; do not rewrite the source lesson or its FAQ.
sync_status: Component and existing regression validation in progress; no learner answer, database row, merge or publication changed. Separate Intro and Academic coverage is required before closing these items.
## 2026-10-18 — learner-facing scope and terminology (items 4, 6, 31, 32, 45, 53)

[roadmap:local-batch-learner-copy-20261018]
source: direct owner authorization to continue audited corrections
scope: Egyptian introductory model definition/value hook, three specifically listed editorial-note locations, technical progress/read-complete wording, and optional Builder invitation in four locales
summary: Distinguish the underlying trained model from its chat application using the recorded OpenAI Academy models resource; remove only specified editorial notes while preserving mission tasks/weights. State account-backed technical progress accurately, separate reading completion from quiz correctness, avoid first-attempt accuracy promises, and present Builder as a goal-dependent option without changing access, order or prerequisites.
reference: https://academy.openai.com/public/clubs/work-users-ynjqu/resources/models (read 2026-10-18; conceptual definition only, no model-version/default claims)
sync_status: Scoped source edits and JSON preservation checks complete; CI review pending. No content-generation request, indexing operation, learner-data change, merge or publication.
## 2026-10-18 — analytics and optional start locale (items 1, 154)

[roadmap:local-batch-analytics-start-20261018]
source: direct owner authorization to continue audited corrections
scope: locale-aware learner analytics and optional five-stage start UI in four locales
summary: Translate UI, metadata, loading/errors, duration/count labels and known path/event labels; preserve locale through dashboard navigation. Preserve analytics queries/calculations and unknown event identifiers. Start generation remains behind the explicit run button with the same ordered five calls and arguments; generated text is preserved as returned.
sync_status: Added isolated renderer coverage using mocked queries and generation functions; CI pending. No live AI request, learner write, merge or publication.
## 2026-10-18 — safe password recovery return (item 119)

[roadmap:local-batch-recovery-context-20261018]
source: direct owner authorization to continue audited corrections
scope: login recovery links, reset-email redirect context, recovery login links and successful reset return
summary: Reuse one validated local navigation boundary after login/reset; preserve supported locale and exact allowed lesson/catalogue destination. Carry only navigation context, excluding email/payment hints from links. Keep Kids-family intent and existing payment login priority. Invalid/external destinations fall back to dashboard. Recovery titles use active locale.
sync_status: Synthetic email/password clients and renderer regressions added to CI; no real email request, password change, merge or publication.
## 2026-10-18 — admin locale and exact build-log return (item 155)

[roadmap:local-batch-admin-locale-return-20261018]
source: direct owner authorization to continue audited corrections
scope: shared admin beforeLoad redirect context and the exact /build-logs authentication destination
summary: Consume route context, validate supported locale, and retain it for login/dashboard denial redirects. Only an exact /build-logs request receives that fixed return destination; query-supplied return values are ignored. Login re-enters the unchanged mandatory server admin check. Every existing protected payload/action still asserts server authorization.
sync_status: Added mocked server-outcome tests and existing SSR admin suite to CI; no live session expiry, role/account change, merge or publication.
## 2026-10-18 — distinct payment read states (item 117)

[roadmap:local-batch-payment-read-states-20261018]
source: direct owner authorization to continue audited corrections
scope: customer order/access list loading, successful-empty, failed-read retry and requested-order states
summary: Distinguish loading and read failures from successful empty lists in four locales. Explain unavailable requested orders, retry reads explicitly, and avoid presenting an unknown entitlement lookup as confirmed paid-wait state. Empty access copy does not establish subscription loss. Existing order commands, authorization and receipt flows are preserved.
sync_status: Added mocked-query renderer regressions with command non-invocation assertions; CI pending. No actual order read/write, payment, role change, merge or publication.
## 2026-10-18 — accessible contact validation (item 121)

[roadmap:local-batch-contact-field-errors-20261018]
source: direct owner authorization to continue audited corrections
scope: local contact field validation, five-character minimum, field/error association and focus
summary: Show localized first-name/email/message/phone/consent errors, associate descriptions and invalid state, focus the first invalid field and provide selectable error summary entries. Display the five-character minimum before submission. Preserve uncontrolled field values and keep service-wide failures separate. Existing submit command, CAPTCHA requirements and server validation remain.
sync_status: Four-locale invalid-form and mocked service-failure tests added; no actual contact submission, CAPTCHA solving, email send, merge or publication.
## 2026-10-18 — price badge flow and narrow curriculum sizing (items 51, 52)

[roadmap:local-batch-responsive-pricing-curriculum-20261018]
source: direct owner authorization to continue audited corrections
scope: Pro/Pro Plus test badge positioning and shared curriculum card sizing/wrapping
summary: Move the existing test-mode badges to separate in-flow rows with wrapping. Use a shrinkable single-column module grid, shrinkable shared cards/rows, wrapped headings/badges and full lesson-title text. Keep all content, links, access decisions, prices, checkout paths and badge visibility unchanged.
sync_status: Existing route/locale regressions and build will run in CI. Browser layout measurement remains pending: local Windows UNC Vite startup failed; no claimed viewport acceptance or production publication.
## 2026-10-18 — announced progress and inline numeric quiz options (items 41, 138)

[roadmap:local-batch-progress-inline-options-20261018]
source: direct owner authorization to continue audited corrections
scope: shared Progress root value, localized progress names at existing callers and Academic quiz option layout
summary: Forward the numerical value to Radix Root so determinate progress is announced consistently; retain indeterminate loading when no value is supplied. Name the previously unnamed Academic, Technical, curriculum and lesson bars with existing localized copy. Keep each Academic option in one shrinkable inline text span beside a fixed-size top-aligned radio, retaining internal BDI and source/key content.
sync_status: Added determinate/indeterminate progress tests and Academic range-option DOM regression. No progress write or quiz selection outside synthetic tests; CI pending and physical screen-reader/viewport checks not claimed.
## 2026-10-18 — completed versus published and narrow account cards (items 140, 158)

[roadmap:local-batch-progress-copy-account-sizing-20261018]
source: direct owner authorization to continue audited corrections
scope: four-locale curriculum progress labels and account profile/subscription card sizing
summary: Explicitly label completed versus published map steps, preserving all placeholder variables and calculations. Constrain the account grid/cards with minmax(0,1fr) and min-w-0, preserve email/ID ellipsis, wrap date/subscription values and stack field rows on narrow screens. No account/email/subscription data changed.
sync_status: Existing localization placeholder expectations updated; no new tests mirror copy/CSS. CI pending; 319/390 viewport and independent long-email fixture acceptance remain pending until a working preview is available.
## 2026-10-18 — one example step number (item 139)

[roadmap:local-batch-academic-step-number-20261018]
source: direct owner authorization to continue audited corrections
scope: Academic worked-example list presentation only
summary: Render one visible list-position badge beside each full step body. Remove only a matching leading Step N, Arabic localized step N or numeric-list prefix equal to the actual position; preserve leading emphasis, paragraphs, quantities, decimals and calculation numbers. Original lesson sources and calculations are unchanged.
sync_status: Prefix safety cases and a formatted two-step DOM regression added to the existing Academic suite; CI pending. No saved data or source lesson rewrite, merge or publication.
## 2026-10-18 — readable Systems View original and text (item 160)

[roadmap:local-batch-systems-view-reading-aid-20261018]
source: direct owner authorization to continue audited corrections
scope: exact English and Gulf Systems View lesson visual cells only
summary: Preserve the pinned original images and captions. Transcribe all three visible cards/examples into responsive live text in locale reading order. Offer a localized Radix dialog with original-resolution image, zoom controls, bounded overflow pan/keyboard focus area, Escape close and trigger focus return. Other lesson/locale cells receive no new aid from this scoped change.
sync_status: Both original 1900x1000 images visually inspected from shared drive; no image generation/edit or source-manifest change. Text-order and dialog/zoom/focus tests added. CI pending; 319/390 physical/browser viewport and touch acceptance remain pending.
## 2026-10-18 — academic arithmetic source revision (items 8, 9, 10, 40)

[roadmap:local-batch-academic-arithmetic-20261018]
source: direct owner authorization to continue audited corrections
scope: exact four reported Academic locale/lesson identities and their written-source fingerprints
summary: Correct percentage-point versus relative growth, separate zero/negative contribution effects, include the monthly logo software subscription inside the stated fixed cost, and accept the cash scenario's 550/1800 closing balances with risk/preventive-action reasoning. Preserve unrelated source, original PDF identities, approvals and media mappings. Record exact reversible changed fields and before/after payload hashes.
sync_status: Offline exact-source reconstruction and independent arithmetic checks passed; CI source-import validation pending. Generated transaction SQL is a review artifact only, requiring independent acceptance and the existing inactive-course/unapproved-payload guards. No database change, served-content correction, PDF/media acceptance, merge or publication is claimed.
## 2026-10-18 — automation build-effort payback units (item 55)

[roadmap:local-batch-automation-payback-20261018]
source: direct owner authorization to continue audited corrections; overrides the old canonical ROI-preservation note for this exact dimensional correction
scope: Egyptian primary authoring concepts, its four generated glossary overlays and corresponding MSA canonical definition
summary: Name the duration build-effort payback period and divide build hours by net monthly time saved. Explain 0.5 hour / 2 net hours per month = 0.25 month, after oversight/maintenance. The two-month threshold is an illustrative teaching assumption, with risk and maintenance checks retained. Synchronize Markdown, bullets and table cells without changing other sections, quiz, mission or weights.
sync_status: Exact original generation-source bytes reconstructed for all four edited overlays and pinned in the scoped source-compatibility ledger; image bytes/original manifest unchanged. Egyptian authoring parity and four-locale unit tests added. Offline payload preservation check passed; CI pending. No workflow/AI generation, indexing, database write, merge or publication.
## 2026-10-18 — directional Kids navigation (item 11)

[roadmap:local-batch-kids-directional-navigation-20261018]
source: direct owner authorization to continue audited corrections
scope: existing previous/next labels and four journey copy sets only
summary: Label the existing links Previous/Next in English and السابق/التالي in each Arabic copy set. Preserve the exact routes, locale search, visible-result access gate and first/last number boundaries. No child progress API or destination logic changed.
sync_status: Existing nested/direct Kids route and localization regressions run in CI; no new tests mirror these labels. No child/account mutation, merge or publication.
## 2026-10-18 — honest Pro scope and Intro continuity (items 5, 16)

[roadmap:local-batch-continuity-pricing-copy-20261018]
source: direct owner authorization to continue audited corrections
scope: four pricing FAQ answer-3 strings and the seven Intro continuity-card review
summary: Align Pro FAQ with its package card: listed paths excluding Builder, listed video/RAG and assistant allowances. Review the actual seven-step Intro order; use the approved first-card literal and correct four further stale bridge descriptions to their real next destinations. Last two bridges already align. Preserve all ordering, destinations, learning bodies, entitlement/price and checkout behavior.
sync_status: Scoped copy/order review recorded on the shared drive; existing locale/routing regressions run in CI. No new tests mirror wording. No external send, data write, merge or publication.
## 2026-10-18 — complete English example copy (items 46, 50, 63)

[roadmap:local-batch-english-example-copy-20261018]
source: direct owner authorization to continue audited corrections
scope: exact English style-control delivery example, leads glossary CTA and attention-economy mission subtitle
summary: Demonstrate replacing purchase with buy for a simple direct voice in both delivery and Markdown. Complete the CTA keyword/action/channel/benefit in its table and broken parallel Markdown. Name the mission Observe 5 Posts in the Feed, preserving the five observations and rubric. Exact leaf-level changes are recorded in the source-provenance ledger; unrelated sections, image bytes and original generation manifest are unchanged.
sync_status: Offline scope/reversal/weight checks passed; existing source-provenance and mission/runtime regressions run in CI. No new tests mirror these copy edits. No message/lead service connection, learner write, merge or publication.
## 2026-10-18 — server-scoped adjacent Academic steps (item 13)

[roadmap:local-batch-academic-adjacent-navigation-20261018]
source: direct owner authorization to continue audited corrections
scope: authorized Academic lesson navigation, actual runtime catalogue order and existing read-only server access RPC
summary: Find adjacent accessible steps within the exact current course/locale runtime list, scanning outward only until the nearest server-allowed candidate on each side. Never guess numeric course order or infer access from a published title. Preserve localized first/last boundaries, display loading/read failure with retry and keep identity-scoped query keys. Destination lesson delivery rechecks its existing server authorization; navigation calls no progress or submission writer.
sync_status: Added runtime-order/denial/boundary/error and four-locale renderer tests with mocked read clients, plus existing page fixtures remain isolated. CI pending. No schema change, live protected fetch, learner update, merge or publication.
## 2026-10-18 — complete route boundary and comparable metrics (items 56, 58, 59)

[roadmap:local-batch-metric-examples-20261018]
source: direct owner authorization to continue audited corrections
scope: three Egyptian primary-authoring examples, corresponding MSA canonical fields and twelve locale overlays
summary: Cover 5000 exactly with complementary >=5000 and <5000 wording, keeping each existing currency and Router key. State a fictional current-month 100-thousand sales value versus the prior-three-month average of 150 thousand in the same unit; distinguish a reference from a sector/quality target. Compare 40/100 WhatsApp replies and 10/100 email replies within 48 hours after each delivery; distinguish replies from opens and avoid attributing the difference to channel alone while retaining day-two/day-five timing.
sync_status: Exact source reversals, preserved other sections/key/options/weights and independent boundary/metric calculations recorded offline. English source diagrams inspected and contain no conflicting numerical example; all image bytes/original manifest retained. Egyptian authoring parity and four-locale source regressions added; CI pending. No workflow, message, live data write, media generation, merge or publication.
## 2026-10-18 — 30-minute weekly-review session and derived visual (item 60)

[roadmap:local-batch-weekly-review-session-20261018]
source: direct owner authorization to continue audited corrections
scope: Egyptian weekly-review curriculum/source title, plan/video labels, one separately versioned diagram and exact Bunny title proposal
summary: Adopt a 30-minute review session while preserving the detailed timeline/task and distinguishing session duration from reading/video runtime. The original image unexpectedly still said 15; a built-in image_gen edit now says 30 and preserves the three-card text/order. Keep the original manifest/image intact and verify/select the new PNG through a hash-bound audited revision ledger. Align gallery/title metadata with the effective asset. The live Bunny poster was read paused and already says 30, with actual runtime 167 seconds; its player title still says 15.
sync_status: Original/new asset and source hashes recorded; image visual check complete. Added original/revision/source/locale-binding tests and a metadata-only Bunny title tool with mocked GET/POST/verification tests. No provider write, video generation/upload, progress write, merge or publication. Bunny title application remains a separate reviewed delivery step; do not close the item as a deployed correction yet.