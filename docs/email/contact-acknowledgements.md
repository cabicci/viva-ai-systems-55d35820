# Contact acknowledgements

Support and institutional requests receive a necessary receipt acknowledgement after successful CAPTCHA, rate limiting and HubSpot acceptance. The form provides an explicit request type; company names never determine routing. Support uses `info@masaarat.ai`, institutions `sales@masaarat.ai`, with the same reply destination. This does not assign a HubSpot owner or subscribe a recipient to marketing.

The recipient's stored preferred locale takes priority. For visitors without an account preference, the explicitly selected form locale is used. Supported values are ar-EG, ar-MSA, ar-Gulf and en. No IP-based language inference is used. All messages use the current Masaarat logo and pastel shell, Sunday–Thursday 09:00–17:00 Africa/Cairo service hours, and no promised response deadline. Submitted message contents are never copied into the email.

## Activation

1. Rehearse `20261001120000_contact_acknowledgements.sql` on an isolated DB, then apply through the approved migration process with a backup and rollback plan.
2. Deploy `contact-mail-job` and the matching application source. Keep `CONTACT_MAIL_ENABLED` absent/false on both services until the complete sending path is accepted.
3. Verify both root-domain sending identities in the existing Resend account. Gmail alias delivery alone does not prove Resend sender verification. Disable provider open/click tracking; preserve Workspace MX records.
4. Supply server-only `RESEND_API_KEY` and a dedicated `CONTACT_MAIL_JOB_SECRET` of at least 32 characters. The worker also needs its existing Supabase service configuration. No credentials are stored in this repository.
5. Use the existing protected scheduler to POST to the job endpoint with its dedicated Bearer secret. Do not reuse an account-welcome schedule to activate subscription or Kids mail. Verify the current schedule contract before creating it.
6. Accept one specifically authorized transport test, signed provider receipt and inbox arrival. The previously accepted contact submission must not be repeated. After acceptance enable the flag on app and worker together. No historic HubSpot contacts are backfilled.

Claims are limited to five, leased for five minutes, and use a stable provider key per stored request. The subject, content, recipient and locale are frozen at queue time. Unknown send outcomes retry with the same key for less than 23 hours; older outcomes require reconciliation. Permanent provider rejection blocks the row. API acceptance is not delivery or inbox evidence. This slice does not add a receipt webhook; the existing signed receipt integration must be configured and matched for activation acceptance.

HubSpot is an external system: its acceptance and local enqueue are not atomic. Enqueue failure leaves the accepted contact successful and emits a payload-free operational error, preventing a duplicate submission prompt. Such failures need operational reconciliation; this is not a durable intake replacement or an exactly-once HubSpot guarantee. ID deduplication applies to a queued accepted request, not separate new form submissions.

Outbox rows contain personal email data and service content, restricted to service_role. Apply the existing operational retention policy; no automatic deletion schedule is installed here. Rollback disables both flags first and unschedules the worker, preserving rows for reconciliation. No production migration, schedule, provider configuration or email send occurs from source preparation or CI.
