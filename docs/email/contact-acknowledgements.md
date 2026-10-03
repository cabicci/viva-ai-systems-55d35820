## 2026-10-03 — Common immediate and retry transport candidate

After persistence, the application calls account-welcome-job with a server-authorized target-only contact request using its installed worker authorization. The same Edge transport handles immediate sends and existing scheduled retries. Immediate dispatch never runs unrelated mail or account/financial batches. A completed target returns zero claims, preserving the accepted messages. Worker failures leave the durable retry intact. No new secret, Vault, cron, migration or receipt change is required. CONTACT_MAIL_DIRECT_ENABLED remains the sole contact activation flag. CI/deployment/current acceptance belong in the two authoritative registers; do not repeat completed intake or transport tests.

Rollback: revert the bounded dispatch source change and redeploy the application and existing account-welcome-job together. Keep all outboxes, receipts, migrations, runtime flags and the existing schedule intact.

# Contact acknowledgements

## Current integration state — 3 October 2026

PRs #123–#127 and #53 are already merged. The original contact outbox and
receipt migrations/functions are already deployed; do not reapply them.
The two approved owner messages delivered on 1 October, signed receipts and
inbox evidence remain accepted. No duplicate form submission or manual send
is needed to repeat that evidence.

The owner authorized immediate server-side sending after accepted contact
intake. This candidate reuses the existing transport, frozen outbox, receipts
and account-deletion suppression. It does not require a new contact cron job,
Vault binding, or replacement sending API key. The existing five-minute
welcome schedule also retries contact messages when the owner-enabled
CONTACT_MAIL_DIRECT_ENABLED is exactly true. Welcome/subscription/contact streams report their own outcome; a failed
stream cannot prevent another stream running.

Source implementation is separate from deployment and activation evidence.
On 3 October the owner asked Lovable to activate the direct route, then explicitly
asked to remove obsolete remnants. CONTACT_MAIL_DIRECT_ENABLED is the sole
activation switch for both the app and existing retry worker. The original
CONTACT_MAIL_ENABLED and CONTACT_MAIL_JOB_SECRET are no longer consumed.
The obsolete contact-mail-job entrypoint, deployment config and contact cron
preparation are removed. Production deletion of that endpoint and unused
protected names must be established through supported platform operations.
The outbox, claim/completion RPCs, shared worker and receipt webhook are active
and preserved. No contact-specific Vault binding or cron is required.
Webhook signing-secret rotation/rebinding remains unresolved; the verified
Resend sending API key is preserved.
The owner's execution approvals and cancellation of the backup requirement
remain effective; no repeated business approval is requested.

Support and institutional requests receive a necessary receipt acknowledgement after successful CAPTCHA, rate limiting and HubSpot acceptance. The form provides an explicit request type; company names never determine routing. Support sends from `info@mail.masaarat.ai` and institutions from `sales@mail.masaarat.ai`, using the existing verified sending subdomain. Replies go to `info@masaarat.ai` and `sales@masaarat.ai` respectively. This does not assign a HubSpot owner or subscribe a recipient to marketing.

The recipient's stored preferred locale takes priority. For visitors without an account preference, the explicitly selected form locale is used. Supported values are ar-EG, ar-MSA, ar-Gulf and en. No IP-based language inference is used. All messages use the current Masaarat logo and pastel shell, Sunday–Thursday 09:00–17:00 Africa/Cairo service hours, and no promised response deadline. Submitted message contents are never copied into the email.

## Applied platform receipt — 3 October 2026

PR128 merged at `6d47bca83269ea5e77ec0c8fd2d08b96c6a6d565` after CI444
and LC09 passed on `03dc4ec2663b02d2ed8b14dd3adf389cba5ac3f3`.
The platform applied the targeted claim once and deployed both workers.
Independent DB verification at 06:52:18Z confirms the function, service-only
execution, LC09 guard, two preserved outboxes/receipts, no unsent rows and
unchanged welcome cron. Protected worker calls returned 200, contact disabled
and welcome/subscription zero counts with contact:null. Application publication
and contact activation are separate, still unverified at this checkpoint.

`drizzle/migrations/0000_contact_immediate_claim.sql` is the platform receipt of
the **same already-applied SQL** as the Supabase-named source file, SHA256
`7be1032cb9ed890c80c8fa255f05bc76b4b82f5a214fb01beca063ab8015649f`.
These are not two migrations to execute. Do not replay either on production.
Generated types and Drizzle configuration/dependencies are preserved; the lock
is reconciled separately before website publication. Supabase timestamp-ledger
absence does not establish that old effective objects were never installed.

## Coordinated rollout and rollback

1. Merge only after current-head CI and LC09 pass. Preserve the owner's new
   direct flag and reviewed package alignment. All migrations are already
   applied; do not replay either the original SQL or platform receipts.
2. Deploy the matching existing account-welcome-job and publish the application.
   Confirm CONTACT_MAIL_DIRECT_ENABLED and sending credentials in the runtimes
   without exposing values. Verify the existing five-minute welcome schedule
   reports an enabled contact stream. Do not change its protected endpoint,
   dedicated token or Vault binding; it also serves welcome/subscription mail.
3. Remove the obsolete deployed contact-mail-job and only its unused contact
   settings through supported platform operations. Verify no contact-specific
   cron or Vault name exists. Preserve all live mail tables and RPCs.
4. Complete the separate signing-secret rotation/rebinding using protected
   configuration; keep the webhook's six event types and tracking disabled.
5. Reuse the accepted original transport evidence. Establish the changed normal
   intake path from actual production evidence without repeating those tests.
   Source tests cover failure, retry, isolation and account-deletion suppression.
6. Rollback sending by setting CONTACT_MAIL_DIRECT_ENABLED=false in both
   runtimes through supported protected configuration. If that capability is
   unavailable, revert the app and retry worker to their disabled release.
   Preserve the outbox/receipts and welcome schedule. Restoring the obsolete
   contact endpoint or setting the retired flag cannot activate this route.

The accepted request first queues immutable content, then claims only its own
outbox ID and awaits a bounded Resend attempt (transport timeout: ten seconds).
Failed/unknown outcomes remain durable for the existing worker's next eligible
run. Claim/completion errors emit a payload-free error while the already
accepted contact submission stays successful. No detached process is assumed
to survive an HTTP response. An empty targeted claim never consumes older rows.

Claims are limited to five, leased for five minutes, and use a stable provider key per stored request. The subject, content, recipient and locale are frozen at queue time. Unknown send outcomes retry with the same key for less than 23 hours; older outcomes require reconciliation. Permanent provider rejection blocks the row. API acceptance is not delivery or inbox evidence. The contact receipt webhook records authenticated delivery outcomes separately from API acceptance. SMTP delivery still does not prove inbox placement; inspect the controlled recipient inbox separately.

HubSpot is an external system: its acceptance and local enqueue are not atomic. Enqueue failure leaves the accepted contact successful and emits a payload-free operational error, preventing a duplicate submission prompt. Such failures need operational reconciliation; this is not a durable intake replacement or an exactly-once HubSpot guarantee. ID deduplication applies to a queued accepted request, not separate new form submissions.

Outbox rows contain personal email data and service content, restricted to service_role. Apply the existing operational retention policy; no automatic deletion schedule is installed here. Rollback disables the direct switch in both runtimes, preserving the welcome schedule and rows for reconciliation. No production migration, schedule, provider configuration or email send occurs from source preparation or CI.

## Direct activation reconciliation — 3 October 2026

Lovable source d483c089 includes the owner's new direct setting and TanStack
package alignment (react-start1.168.60, router1.170.41, plugin1.168.42,
start-server-core override1.169.39). The integration branch preserves those
changes and the updated lock, restores prior roadmap history, and closes the
missing retry activation. No original migration or accepted transport test is
replayed. Publication and scheduled-worker receipts will be recorded after
current-head CI gates pass.

## Owner-requested retirement — 3 October 2026

Only unused contact infrastructure is retired. Applied migration history and
accepted delivery evidence remain traceable. Auth/welcome/subscription mail,
Resend transport and financial lifecycle schedules are independent and retained.
