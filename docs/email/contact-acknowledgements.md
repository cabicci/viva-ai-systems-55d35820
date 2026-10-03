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
welcome schedule also retries contact messages when either CONTACT_MAIL_ENABLED
or the owner-enabled CONTACT_MAIL_DIRECT_ENABLED is exactly true. Welcome/subscription/contact streams report their own outcome; a failed
stream cannot prevent another stream running.

Source implementation is separate from deployment and activation evidence.
The original CONTACT_MAIL_ENABLED setting remains false. On 3 October the owner
asked Lovable to activate the direct route; Lovable created the new protected
CONTACT_MAIL_DIRECT_ENABLED=true setting and changed the server gate. Integration
preserves this work and shares the same decision with the existing retry worker.
The supported setter still cannot replace existing secret names. Production
availability of the direct flag and sending key must be proven without printing
values. Webhook signing-secret rotation/rebinding remains unresolved; the
verified Resend sending API key is preserved.
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

1. Merge the reviewed, tested candidate and preserve later Lovable changes.
   Apply only `20261003070000_contact_immediate_claim.sql`; it requires the
   installed LC-09 suppression function and exposes the targeted claim only
   to service_role. Its rollback is dropping that new function after reverting
   the application; no existing data or migrations are removed.
2. Deploy the matching `account-welcome-job` (and preserved `contact-mail-job`
   shared helper) with the existing contact switch disabled, then publish the
   application. Verify the current five-minute welcome schedule still calls
   its existing protected endpoint successfully. Do not change that schedule,
   its dedicated token, or its Vault binding. The old contact schedule SQL is
   retained as historical preparation and must not be installed for this route.
3. Resolve the existing protected webhook signing-secret rotation/rebinding
   gate without exposing values. Preserve its six event types and verified
   sending domain with tracking disabled. This does not replace RESEND_API_KEY.
4. Preserve the owner-enabled server/Edge `CONTACT_MAIL_DIRECT_ENABLED=true`.
   Deploy the worker with the shared activation decision and publish the tested
   application. Confirm both runtimes see the decision and that the application
   server has the existing sending key. Do not claim activation while runtime
   availability remains unverified. The original CONTACT_MAIL_ENABLED stays false.
5. Verify normal accepted intake triggers the targeted first attempt and the
   already running worker can retry deferred rows. Reuse prior inbox/receipt
   transport evidence; do not recreate accepted historical tests. Source tests
   cover the changed failure, retry, isolation and deletion paths. A real new
   intake can establish changed production behavior under the existing bounded
   send authorization; visual acceptance remains a separate final-round item.
6. Disable both contact flags in both runtimes to roll back sending, preserving
   outbox/receipt records. Revert the candidate worker/application if needed.
   **Do not unschedule the welcome job**: it serves welcome/subscription mail.

The accepted request first queues immutable content, then claims only its own
outbox ID and awaits a bounded Resend attempt (transport timeout: ten seconds).
Failed/unknown outcomes remain durable for the existing worker's next eligible
run. Claim/completion errors emit a payload-free error while the already
accepted contact submission stays successful. No detached process is assumed
to survive an HTTP response. An empty targeted claim never consumes older rows.

Claims are limited to five, leased for five minutes, and use a stable provider key per stored request. The subject, content, recipient and locale are frozen at queue time. Unknown send outcomes retry with the same key for less than 23 hours; older outcomes require reconciliation. Permanent provider rejection blocks the row. API acceptance is not delivery or inbox evidence. The contact receipt webhook records authenticated delivery outcomes separately from API acceptance. SMTP delivery still does not prove inbox placement; inspect the controlled recipient inbox separately.

HubSpot is an external system: its acceptance and local enqueue are not atomic. Enqueue failure leaves the accepted contact successful and emits a payload-free operational error, preventing a duplicate submission prompt. Such failures need operational reconciliation; this is not a durable intake replacement or an exactly-once HubSpot guarantee. ID deduplication applies to a queued accepted request, not separate new form submissions.

Outbox rows contain personal email data and service content, restricted to service_role. Apply the existing operational retention policy; no automatic deletion schedule is installed here. Rollback disables both contact switches in both runtimes, preserving the welcome schedule and rows for reconciliation. No production migration, schedule, provider configuration or email send occurs from source preparation or CI.

## Direct activation reconciliation — 3 October 2026

Lovable source d483c089 includes the owner's new direct setting and TanStack
package alignment (react-start1.168.60, router1.170.41, plugin1.168.42,
start-server-core override1.169.39). The integration branch preserves those
changes and the updated lock, restores prior roadmap history, and closes the
missing retry activation. No original migration or accepted transport test is
replayed. Publication and scheduled-worker receipts will be recorded after
current-head CI gates pass.
