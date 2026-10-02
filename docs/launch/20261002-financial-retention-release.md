# Account/family deletion: fifteen-day financial erasure

Owner decision: `OWNER-FINANCIAL-15D-01`. Keep the completed nine-account cleanup
closed. Keep both protected owner/test accounts and their family data. The
financial period is fifteen elapsed days from verified account/Auth deletion;
the request date, retries, delivery dates and a paused job never reset it.
HubSpot remains a separately retained CRM. Backups are not a release gate.
Stripe stays TEST; this candidate adds no live-payment permission.

## Current production and source boundary

Read-only inspection on 2 October found nine completed lifecycles, two preserved
Auth accounts and `account_deletion_control.enabled=false`. No financial purge
RPC or deadline columns existed. The two accepted contact outboxes and delivered
receipts remained intact. The active `masaarat-account-welcome-v1` schedule is
existing work, not a missing job to recreate. PR #127 is merged; PR #53 remains
the integrated draft. The actual website-served SHA is still unverified.

The new migration is additive:
`20261002090000_account_financial_retention_15_days.sql`. It starts financial
purging disabled, backfills the deadline on existing completed lifecycles and
preserves the installed Auth, entitlement, contact and Kids deletion guards.
The already-applied contact and deletion migrations must not run again.

## Behavior and evidence

- One deadline: `completed_at + 360 hours`. A service-only claim leases a due
  account; a repeated or competing worker cannot purge it twice.
- Only after the deadline, erase the account's dependent finance, tax/refund,
  gateway, credit, coupon, AI, webhook/retry and Kids financial rows in one
  transaction, in FK order. Keep shared price/policy/package definitions and
  other users' rows. Unlink a deleted administrator's attribution on another
  person's coupon/grant rather than deleting that person's record.
- Keep only the existing protected deletion tombstone and completion dates.
  These contain the UUID and operational decisions; they are not anonymous.
  Do not describe this as erasing every trace of the UUID.
- Reject new direct financial writes after the deadline. Signed, TEST-verified
  paid/refund deliveries consult the deadline before applying money/access
  changes and are acknowledged without retaining a new financial payload.
  Pause does not reopen access or extend retention.
- New/unclassified ownership tables, ambiguous cross-account references or
  target-bearing shared reconciliation aggregates fail the entire local
  transaction. These are actionable erasure failures, not a financial/legal
  hold or permission to silently retain data indefinitely.
- The protected worker deletes and verifies the owned Stripe TEST Customer
  before completing local erasure. Lost provider responses resume from the
  deleted Customer response. Provider/database outages leave a visible retry;
  no completion may be claimed before both verifications pass.

Stripe's Customer deletion removes card details and prevents new operations.
Deleted customers can still be retrieved for history. This API operation does
**not** prove that historical transactions were erased from Stripe:
https://docs.stripe.com/api/customers/delete.
This provider limit does not change Masaarat's approved fifteen-day local rule.
Do not claim provider-wide erasure or introduce an indefinite local hold.

Isolated acceptance covers the timing boundary, service-only ACLs, valid/invalid
leases, actual FK erasure, receipt/credit/coupon cleanup, preserved other users
and definitions, late paid/refund delivery, direct recreation denial,
idempotency, retry/pause and the authored batch entrypoint. Native cumulative
PostgreSQL additionally checks competing workers and a late-event race.
Exact-head CI receipts belong in the two authoritative registers; passing local
checks is not production acceptance.

## Concrete production sequence, requiring its separate confirmation

1. Validate the exact reviewed PR #53 head and current production state. Apply
   only the new migration, with both account and financial activation off.
2. Deploy the reviewed `account-deletion-job` and `billing-stripe-webhook` after
   the new RPCs exist. The webhook must not call a missing deadline RPC.
3. Generate/bind `ACCOUNT_DELETION_JOB_SECRET` in the protected server and the
   matching Vault entry `masaarat_account_lifecycle_job_secret`. Never return,
   log or commit either value. Keep `STRIPE_SECRET_KEY` TEST.
4. Run method/auth/disabled checks without deleting an account or sending mail.
   Confirm the app and worker activation switches agree with database controls.
5. After explicit activation, install the single protected minute schedule in
   `lc09-account-lifecycle-schedule.sql`. Preserve existing welcome/contact jobs.
   The batch has separate account-erasure and financial-erasure switches and
   returns counts only. Verify HTTP results, including deferred work; cron's
   submission success alone is insufficient. A minute schedule can execute
   physical erasure after the deadline; it is not a zero-latency guarantee.
6. Perform the separately authorized synthetic-family production acceptance
   once, preserve the other family, and link the evidence to the served release.
   Do not reuse either protected account as a deletion test.

Pause using `lc09-finalizer-pause.sql` plus both protected worker flags. Keep
the tombstones, deadline/write/entitlement guards and existing receipt functions.
Pausing cannot recover deleted data. There is no backup/recovery prerequisite.

Contact transport is already accepted. Do not repeat the contact submission,
controlled inbox deliveries, or webhook transport tests for this finance change.
Read the current contact flags/bindings before proposing mail activation.
