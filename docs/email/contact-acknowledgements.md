# Contact acknowledgements

## Current integration state — 2 October 2026

PRs #123, #124 and #125 are merged. Both contact migrations, the worker and
receipt webhook are already deployed. The two specifically authorized owner
messages reached the inbox on 1 October and have authenticated delivered
receipts. Reuse those results; do not resubmit the accepted contact form or
repeat transport tests. The existing six-event Resend webhook is enabled.

Read-only checks on 2 October confirm two completed outboxes/two delivered
receipts, no contact schedule, and the existing active five-minute welcome
schedule. Current app/worker flag values are unverified; an older disabled
flag report does not establish their current values. Preserve the welcome job.
The existing signing secret needs protected rotation/rebinding before contact
activation; never return its value. Production activation and new sends require
their separate confirmation. The owner cancelled the backup requirement; it is
not a release or migration gate. The current registers supersede older state.

Support and institutional requests receive a necessary receipt acknowledgement after successful CAPTCHA, rate limiting and HubSpot acceptance. The form provides an explicit request type; company names never determine routing. Support sends from `info@mail.masaarat.ai` and institutions from `sales@mail.masaarat.ai`, using the existing verified sending subdomain. Replies go to `info@masaarat.ai` and `sales@masaarat.ai` respectively. This does not assign a HubSpot owner or subscribe a recipient to marketing.

The recipient's stored preferred locale takes priority. For visitors without an account preference, the explicitly selected form locale is used. Supported values are ar-EG, ar-MSA, ar-Gulf and en. No IP-based language inference is used. All messages use the current Masaarat logo and pastel shell, Sunday–Thursday 09:00–17:00 Africa/Cairo service hours, and no promised response deadline. Submitted message contents are never copied into the email.

## Activation

1. Reconcile the already-applied `20261001120000_contact_acknowledgements.sql` and `20261001123000_contact_mail_receipts.sql`, including their generated Drizzle artifacts. Do not apply them again. Reuse the accepted isolated and production ACL evidence.
2. Preserve the deployed `contact-mail-job` and `contact-mail-webhook`. Publish the reviewed matching application source only under its release confirmation. Check the current `CONTACT_MAIL_ENABLED` switches on app and worker in protected configuration before activation; do not infer current values from the handoff.
3. Recheck the existing verified `mail.masaarat.ai` sending domain in Resend; confirmed Verified on 1 October 2026. Gmail alias delivery alone does not prove Resend sender verification. Disable provider open/click tracking; preserve Workspace MX records.
4. Supply server-only `RESEND_API_KEY` and a dedicated `CONTACT_MAIL_JOB_SECRET` of at least 32 characters. The worker also needs its existing Supabase service configuration. No credentials are stored in this repository.
5. After separate activation confirmation, bind the existing dedicated worker secret to Vault name `masaarat_contact_mail_job_secret` and install `contact-mail-schedule.sql`. It posts to the existing contact worker with its dedicated Bearer secret. Preserve the active welcome schedule. Verify HTTP outcomes; cron submission alone does not prove completion.
6. Preserve the existing `contact-mail-webhook` registration and its delivered, delivery_delayed, bounced, failed, complained and suppressed events. Rotate/rebind its signing secret only in the protected provider/server configuration before activation. Signed raw-body verification precedes DB access; events must match stored provider ID and exact recipient. Duplicates and older events cannot overwrite newer outcomes. A receipt arriving before persisted send completion returns 503 for provider retry; unrelated mail is acknowledged and ignored.
7. Reuse the completed authorized transport, signed delivery and inbox evidence. After activation confirmation enable the flag on app and worker together and verify normal automated operation without a duplicate contact submission or controlled send. Record visual acceptance separately. No historic HubSpot contacts are backfilled.

Claims are limited to five, leased for five minutes, and use a stable provider key per stored request. The subject, content, recipient and locale are frozen at queue time. Unknown send outcomes retry with the same key for less than 23 hours; older outcomes require reconciliation. Permanent provider rejection blocks the row. API acceptance is not delivery or inbox evidence. The contact receipt webhook records authenticated delivery outcomes separately from API acceptance. SMTP delivery still does not prove inbox placement; inspect the controlled recipient inbox separately.

HubSpot is an external system: its acceptance and local enqueue are not atomic. Enqueue failure leaves the accepted contact successful and emits a payload-free operational error, preventing a duplicate submission prompt. Such failures need operational reconciliation; this is not a durable intake replacement or an exactly-once HubSpot guarantee. ID deduplication applies to a queued accepted request, not separate new form submissions.

Outbox rows contain personal email data and service content, restricted to service_role. Apply the existing operational retention policy; no automatic deletion schedule is installed here. Rollback disables both flags first and unschedules the worker, preserving rows for reconciliation. No production migration, schedule, provider configuration or email send occurs from source preparation or CI.
