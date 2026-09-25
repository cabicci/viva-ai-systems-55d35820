# Kids retention email operations

## Prepared behavior

Apply the six Kids migrations in filename order only after their existing
rollout gates. The retention migration does not schedule work or contact a
provider. `kids_retention_control` starts with both flags false. Enabling a flag
requires an operational release reference. This reference does not itself
establish legal adequacy.

`kids-retention-job` accepts POST only and requires an independently generated
high-entropy `KIDS_RETENTION_JOB_SECRET` of at least 32 characters. No parent or
admin browser role can schedule, claim, mark delivery or delete via these RPCs.
`KIDS_RETENTION_ENABLED=true` is also required. A service scheduler must hold the
secret privately; never place it in a client, repository or public URL.

The worker prepares at most 25 notices, claims at most five emails and processes
at most 25 deletion candidates per invocation. Claims last ten minutes. The
first attempt fixes the message body and idempotency key for all retries. A permanent
provider or configuration rejection blocks the notice for operator review. Missing
or ambiguous send outcomes remain pending; automatic retries stop after 23 hours,
inside Resend's 24-hour idempotency window. An operator must reconcile older
unknown outcomes with the provider before any new send is authorized. Do not
clear `first_attempt_at` or issue a fresh provider key to bypass this protection.

`kids-retention-webhook` requires `KIDS_RETENTION_WEBHOOK_ENABLED=true` and
`RESEND_WEBHOOK_SECRET`. Provider delivery IDs, signed event IDs, the adult
recipient and timestamps are checked and stored. Unrelated messages are ignored.
An unknown provider ID for a currently sending adult recipient returns a retry
response, covering webhook arrival before the send receipt commits. The
signature verifier's five-minute window applies to the delivery attempt header,
not the original event time. It must not reject legitimate delayed retries based
solely on the event creation time.

Before dispatching use `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`, optional
`RESEND_REPLY_TO_EMAIL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` through
the existing secure server environment. Keep Workspace receiving MX records.
Never log provider bodies, credentials, recipient emails or child profile IDs.

## Deletion scope and recovery

Actual deletion requires the database deletion flag, matching current paid
expiry and confirmed parent email, no recorded delivery failure, and both
90-day/14-day deadlines. A transaction advisory lock shared with entitlement
writes and profile creation prevents stale family counts or expiry decisions.
Deletion uses READ COMMITTED isolation and the notice's exact profile snapshot.
Repeated execution returns zero after the first receipt. A changed recipient
needs a fresh notice and delivery grace period.

The stored receipt records notice identity, deletion time and profile count.
It does not assert removal from backups or processors. Before production
activation, implement the approved backup/processor erasure procedure, including
reapplication of deletions after recovery. Set a reviewed retention period for
adult notices and event receipts; they are not an indefinite audit archive.
Erasure on an earlier parent request follows its separate process.

For immediate operational pause, turn off the job environment flag and both
database flags. No destructive rollback restores deleted rows: use the reviewed
recovery process and deletion journal, respecting prior erasure requests.

## Acceptance and integration boundary

Local checks exercise default-off behavior, role denial, bounded queue
pagination, leases, submission/delivery distinction, duplicate events, wrong
recipients, future timestamps, delivery-failure ordering, renewal, changed email,
both time boundaries, newly created profile exclusion, cross-family isolation,
progress cascade and repeat deletion. They use synthetic accounts only.

Before activating: connect the existing Resend account, verify the sending
domain and reply address, securely store scoped credentials, configure the
signed webhook, deploy the two functions, rehearse production-compatible SQL
and concurrency in an isolated environment, approve a test recipient/content,
verify actual delivery, and install the service scheduler within provider
quota. Keep marketing subscription and unsubscribe handling separate; Kids
notices contain no child names, profile IDs or promotional material.

This change does not deploy a scheduler, send mail, charge an account, enable
child collection or run production deletion.
