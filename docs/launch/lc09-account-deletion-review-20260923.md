# LC-09 — deletion contract and staged review (23 September 2026)

Status: **disabled implementation draft / NO-GO**. Account deletion now has a
prepared finalizer covering learner records, parent/child profiles, progress,
consents, parent attestations and credentials, with durable access blocking,
TEST-provider reconciliation and resumable checkpoints. This has not been
merged, deployed, activated or exercised on a real account. The request UI
continues to report `pending_review`. No retention period is invented.

## 1 October: Kids scope decision and complete finalization preparation

The owner explicitly confirmed that account deletion includes Kids. This
replaces the earlier exclusion of Kids from this repair only. Broader Kids
changes stay paused. Deletion remains final, and a returning person registers
with a new UUID without inheriting the former progress or entitlement.

Prepared migration `20261001153000_account_deletion_lifecycle.sql` starts
disabled, requires finance/CRM/responder/release policy references, and exposes
only service-role claim/checkpoint RPCs. The worker separately requires a long
job secret and an explicitly enabled environment flag. Neither is provisioned
by this draft. Temporary tests use synthetic identities and mocked processors.

The lifecycle blocks adult and Kids access, Checkout, AI and privileged role
checks before any erasure. Original function OIDs remain in place so existing
RLS policies cannot keep calling an unguarded implementation. Restrictive RLS
and write guards protect against a stale JWT. Shared editorial records and
unrelated families are preserved. Unknown learner/family ownership tables fail
closed instead of producing a false completion.

Kids progress and consents cascade only through the selected parent's child
profiles. Parent requests, attestations, verification and grants are erased.
Retention notices lose their recipient and child IDs and are cancelled. Auth
parent cascades are removed from processor receipts so financial evidence is
not destroyed accidentally. Signed late paid events are recorded without
regranting access; refund reconciliation remains possible.

Checkout parameters are persisted before the Kids session creation call. If
the response is lost, the deletion job reuses the original Stripe key and
parameters, expires the recovered session and reconciles the provider again.
Adult Checkout creation still blocks erasure until its existing coordinator
records the outcome. Active and scheduled TEST renewals are cancelled without
automatic prorated invoices or refunds. Outstanding invoices, payment attempts,
AI attempts, pending refunds and disputes hold the workflow for reconciliation.

Financial and processor records remain restricted pseudonymous evidence until
an approved field/expiry schedule is supplied. This draft does not erase Stripe
customer/payment records or HubSpot CRM. A blanket promise that every external
record disappears would conflict with the owner's prior separate CRM decision
and the unresolved financial-retention decision. Those policies, the responder,
backup/rollback rehearsal and the final live acceptance are still release gates.
Storage manifests cover current and legacy owner columns. Shared audio, Kids
lesson content and DNA archive ownership stops the job for review/reassignment
instead of deleting platform content used by other accounts. The approved learner bucket list starts empty. Unknown bucket ownership
stops for classification. Owned learner objects are removed through Storage API and completion checks their absence.
A completed isolated database test is not production deletion proof.

Automated receipt for predecessor `3d99a3973f25699843f78df446e0d6d18c4a4048`:
CI `36861328436` SUCCESS and native cumulative LC-09 `36861328517` SUCCESS
with 11/11 tests and no skipped tests. Billing `36861328473` found the provider
attempt guard was resolving a ledger primary key instead of the reservation
root. The correction uses `reservation_id` plus `attempt_index=0`, preserves
the old missing-reservation error, and checks `registered` attempts until their financial result settles. A regression proves normal
accounting continues before blocking and cannot start another attempt afterward.
The corrected `df0158a9f2026b713e70ec5e33c9f58d231a112e` then passed
CI `36863360845`, native cumulative deletion `36863360857` (11/11), and Billing
`36863360633` (175/23/1, no failures/skips/todo). The subsequent scoped Storage
ownership guard requires its own exact-head run before release. Local Deno checks passed for both
changed Edge entrypoints; the pause script retains tombstones and access guards.

The request note and confirmation describe the complete Kids scope and final
delete/new-registration contract in all four locales, while preserving the
request-only status until the operational review.

Final corrected-head receipts belong in the original continuation registers. The former
request-only history remains as historical evidence and does not describe the
new finalizer's implementation.

## 30 September: validation infrastructure resolved

PR #120 merged at `559a82a7e36769e700974e102488b7e29751c241` and fixes
the stale 173-test summary check with exact named-suite and per-suite counts.
On its exact head, CI `36703452558` and Billing `36703452382` passed:
175 Phase A, 23 Phase B and 1 Phase C, with zero failures/skips/todo.
This draft is now synchronized with that main. The prior corrected draft
`29687e5035debb5efde9a767c5de61dca32569a0` passed CI `36698831224`
and all seven LC-09 DB tests in `36698831198`; its Billing `36698831261`
failed only the obsolete summary count after all phases passed. New-head
results must be recorded separately. This remains a request-only draft.


## Continuation on 30 September 2026

The review branch is synchronized with main
`5a5e24ddcaaae81265375c17ef42576e0c0258c8` (PR #117). The explicit migration
inventory now includes the cumulative migrations through 29 September; no
Kids migration or runtime behavior is changed by this continuation. Current
head validation must be recorded separately from the earlier draft results.
Local continuation checks: 11 tests passed and 11 PostgreSQL-dependent tests
were skipped because this workspace has no disposable PostgreSQL service.
TypeScript, changed-file ESLint/Prettier and the 6 GB production build passed.
The existing GitHub disposable database gate must run on the new exact head;
these local results do not claim that gate passed.

Head `7180e594971cabf2201f7f7521283eaeac83c22e`: CI run `36697702353`
and LC-09 run `36697702368` passed; the latter applied/reset the latest
cumulative schema and passed all 7 request-gate tests with none skipped.
Billing run `36697702352` failed one static assertion (174/175 Phase A
passed): its adult-quota migration selector included the separate Kids billing
migration. Phase B passed 23/23 and Phase C passed 1/1. The targeted correction
excludes Kids filenames from that adult selector while the public RPC bridge
test still tracks every cumulative migration. No runtime/migration bytes are
changed. One corrected-head run is required; no historical result proves it.

The owner asked to complete implementation and automated checks first, and
collect manual reviews into one final round. Password-reset inbox/link checks,
the limited incident-alert receipt, production release checks and the deletion
policy decisions below belong in that round. This sequencing decision does
not approve financial/CRM retention or actual irreversible deletion. Kids
changes remain paused and Stripe remains TEST.

Before a finalizer can be approved, the review must specify the retained
financial fields and expiry rule, the separate CRM retention rule, the
deletion responder, and treatment of parent-account cascades and processor
evidence. Existing schema/design and restore evidence remain valid within
their documented limits. Request-only tests cannot prove final deletion or
non-restoration of access after final deletion.

## Owner decision recorded 24 September 2026

- Once the complete, verified deletion workflow is available, deleting the
  platform account is final: no account recovery window. A returning person
  must register a new account; old learner progress and entitlement must never
  transfer to the new identity. This is the intended final contract, **not**
  behavior implemented by this request-only draft.
- The account deletion scope is the platform account and platform-owned learner
  data. HubSpot support messages and business enquiries are **retained under a
  separate CRM policy**; deleting the platform account must neither erase
  HubSpot records nor silently promise their erasure. Requests concerning CRM
  data need their own handling and policy. The retention period, privacy notice,
  access controls and response procedure for those records remain unapproved.
- This decision does not authorize deletion of billing evidence, provider
  records, a production migration or any payment operation. Financial data
  that must be retained or linked for reconciliation is an unresolved policy
  conflict with a blanket "delete all data" promise; classify it explicitly
  before publishing final account-deletion wording.

### Why the final workflow cannot safely ship from this decision alone

The current schema requires `billing.subscriptions.user_id` and
`billing.payment_transactions.user_id` (`NOT NULL`), while
`billing.subscription_events.subscription_id` references the subscription
without a cascading delete. The former public wipe only deletes a selected
list of `public` tables and neither removes `auth.users` nor accounts for those
financial dependencies or later provider events. A final deletion therefore
needs an approved rule for each retained financial identifier and a tested
guard against late access restoration. Keeping HubSpot records separately
does not resolve the billing references. **Do not reinterpret the current
request receipt as completed account deletion.**

## Contract and required final workflow

1. An authenticated person requests deletion; the database records only their
   JWT-derived user ID and timestamps. Repeats return `pending_review` with no
   duplicate request. The same user can still log in and retain existing access.
2. A named responder confirms ownership and reads TEST/Live provider mode from
   server data. Stop new Checkout and inspect any open Checkout sessions, active
   or scheduled subscriptions, refund/dispute state and webhook backlog. Cancel
   renewal through the correct Stripe environment, reconcile the provider
   confirmation and late events, and independently verify no further renewal.
   An interrupted cancellation must remain pending; never report deletion.
3. Once pending finance actions are settled and retention policy approved,
   atomically block entitlement/checkout for this user, invalidate snapshots,
   remove learner-owned records, and mark a durable tombstone. Make every
   entitlement getter, checkout and webhook transition consult this tombstone.
   Signed late/replayed provider events still enter the financial audit trail,
   but cannot grant access. Test before any production apply.
4. Revoke sessions and remove the login identity using the authorized Supabase
   Admin Auth API only after the guarded transaction and provider reconciliation;
   retry safely on interruption. Confirm the Auth operation separately. Record
   completion without exposing identifiers publicly. Prove that a new signup
   using the same email creates an independent identity without restoring the
   deleted learner state or paid access. Handle retained HubSpot contact records
   under the separate CRM policy, outside this platform account deletion.

The historical request-only version implemented **step 1 only** and disabled the unsafe old RPC.
The new disabled finalizer prepares steps 2–4. Policy and operational acceptance are still blockers, and completion is never inferred from a request result.

## Table/field retention proposal for owner and legal review

| Surface and fields | Proposed treatment and reason | Access | Duration |
| --- | --- | --- | --- |
| `public.lesson_progress`, notes, missions, quiz attempts, activity, AI conversations, profile/device and other user-owned learner rows | Delete after provider cancellation, pending refund review and an irreversible access gate; these do not support financial reconciliation. Include dependent Storage objects in an approved procedure. | User until completion; limited deletion service during processing | Delete at completion, timing to approve |
| `auth.users`, identities and sessions | Revoke sessions and delete identity using Auth Admin after the guarded data transaction; verify separately. | Auth Admin service only | Delete at completion, timing to approve |
| `billing.subscriptions` (`id`, `user_id`, period, state, plan, provider reference), `gateway_customers` and `gateway_subscriptions` (gateway IDs) | Retain the minimal link needed for provider cancellation, webhook replay, refund/dispute reconciliation; mask or unlink user and provider identifiers once the approved retention condition is met. Never blanket CASCADE. | Service role; designated finance responder | **Decision required**, no assumed statutory number |
| `billing.payment_transactions`, `refunds`, `tax_records`, `subscription_events`, `webhook_events` and `billing_audit_log` (`event/transaction/refund IDs`, amounts, currency, status, timestamps and necessary correlation) | Retain minimal financial proof and idempotency for refunds, accounting and signed-event replay. Scrub unnecessary email, address, token or free-text in `metadata`, `payload_minimized` and `payload_encrypted` under an approved schedule. | Service role and restricted financial review | **Decision required** by jurisdiction, purpose and dispute window |
| `billing.user_entitlement_snapshots`, `entitlement_usage`, AI/credit ledgers and coupon assignments (`user_id`, email/phone hashes, linkage and amounts) | Invalidate entitlement immediately at completion. Remove nonfinancial usage and direct identifiers; separately classify monetary balance, allocations, credits and coupon accounting so refunds still reconcile. | Service role; finance only for monetary rows | **Decision required** per field |
| Stripe customer/payment method metadata | Provider-specific cancellation, reconciliation and deletion/anonymization or restricted retention only under an approved financial schedule. Local SQL does not erase provider records. | Restricted provider admins | **Decision required** with processor obligations |
| HubSpot support messages, business enquiries and contacts | Retain separately from platform account deletion per owner decision. Document purposes, notice, access, retention and an independent data-request route; no HubSpot deletion is implied by platform deletion. | Restricted CRM admins and designated responder | **Decision required**; indefinite retention is not yet approved |

Before accepting any duration, Central/owner must name the entity, market,
legal basis, finance/CRM processors, storage location, purge trigger and audit
owner. No user-facing text promises a number before that review.

## Migration and recovery

- `supabase/migrations/20260923123000_account_deletion_request_gate.sql`
  creates a service-only queue, an authenticated no-argument request RPC, and
  revokes the unsafe RPC. It does not modify financial records or policies.
- `docs/launch/lc09-account-deletion-request.rollback.sql` is a guarded
  rehearsal script. Never restore the unsafe RPC's authenticated EXECUTE.
  Reversing UI and database together is **not** a safe rollback to the old
  destructive path; a pending queue remains for responders to process.
- CI must apply the **latest cumulative schema** in a disposable Supabase tree,
  then test the effective RPC with paid dependencies and unrelated users.
  Current tests prove only the request gate; a full deletion completion/late
  webhook non-restoration test must be added to the finalizing slice.

Central retains ownership of the two continuation trackers. PR #52 stays
separate and TEST remains the only active payment mode.

## Finalization design against the current schema

The `NOT NULL` user columns are **not, by themselves, a foreign-key blocker to
Auth identity deletion**. In `20260709190000_billing_schema_phase1.sql`, both
`billing.subscriptions.user_id` and `billing.payment_transactions.user_id` are
UUID columns without a reference to `auth.users`. The concrete failure in the
effective wipe from `20260801120000_billing_legacy_user_subscriptions_compat.sql`
is its deletion of the subscription while financial events and gateway rows
still reference that subscription. Do not solve this with cascading deletion
of financial evidence.

Proposed retention decision, not an approved policy:

- Preserve the former user UUID and existing subscription/transaction IDs as
  restricted financial correlation keys when financial retention is required.
  This is pseudonymous data, not anonymous data. Remove learner and login data
  separately; never reuse that UUID or resolve new registrations by email back
  to it. This approach does not require making financial user IDs nullable.
- Retain only payment/refund amounts, currency, tax evidence, status, provider
  references and event/idempotency correlation necessary for reconciliation.
  Classify free-text metadata, encrypted payloads, payment-method references,
  credits and coupon allocations individually before scrubbing: some can
  contain identifiers or unsettled monetary claims.
- The approved schedule must state purpose, expiry trigger/duration, any active
  dispute exception, the party responsible for expiry, and processor/backup
  treatment. No statutory period or indefinite retention is inferred here.
  CRM remains a separate policy under the already recorded owner decision.

The next implementation must be one coherent database-and-worker change:

1. Add a service-only durable lifecycle record keyed by the old UUID, with a
   rollout switch initially off. Transition into a blocking state under a
   per-user lock. Request submission alone must not create that state.
2. Make Checkout preparation, subscription event application, entitlement
   snapshot generation/reading, and AI reservation use the same lock and
   lifecycle decision. A denied account cannot acquire fresh access through
   an admin grant, legacy subscription mirror or an in-flight Checkout.
3. Continue recording verified late provider events and valid financial
   transactions idempotently, but suppress access-producing transitions.
   Rejecting the entire webhook transaction would also roll back its audit
   receipt and is not an adequate resurrection guard.
4. Reconcile provider renewal cancellation and pending monetary actions before
   learner erasure. Persist each external step so interruption is resumable.
   Invalidate cached snapshots, delete covered learner records, and revoke and
   delete Auth identity with the Admin API; verify each result separately.
5. Include the new Kids dependencies explicitly: `kids.parent_access_reviews`,
   the family/profile foundation and retention notice rows reference
   `auth.users` with cascading deletion. A parent's explicit account-deletion
   request is distinct from subscription-expiry retention. Do not accidentally
   erase required processor-deletion evidence via that cascade, or claim an
   expiry notice was sent for a user-requested deletion.
6. Rehearse late/replayed events, concurrent Checkout, worker interruption,
   non-requesting family isolation and independent registration with the same
   email. Only then propose production activation with a reviewed retention
   schedule and a named responder for exceptions.

No lifecycle guard or finalizer is implemented by this design section. An
unused tombstone table or an edge-only check would not satisfy these controls.
