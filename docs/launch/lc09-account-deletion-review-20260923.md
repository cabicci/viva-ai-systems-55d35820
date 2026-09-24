# LC-09 — deletion contract and staged review (23 September 2026)

Status: **draft / NO-GO**. This change turns the misleading, broken one-click
wipe into an authenticated, idempotent **request**, and blocks direct execution
of the old destructive RPC. It does **not** fulfill or approve a deletion,
cancel Stripe, delete login credentials, revoke sessions, erase personal data,
or define a legal retention period. Do not apply the migration to production
or publish the UI until a staffed request queue and policy are approved.

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

The current draft implements **step 1 only** and disables the unsafe old RPC.
Steps 2–4 are explicit blockers, not inferred from the request result.

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
