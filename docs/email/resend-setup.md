# Resend email delivery

This integration adds a server-side transactional transport and signed receipt verification. It does not activate an email account, deploy functions, send messages, or subscribe recipients to marketing.

## Marketing and operational scope

Resend belongs to the existing MEP-048/060 welcome and lifecycle-email work. Reuse the approved Arabic/English welcome previews from C02. Their existence is not delivery evidence. The accepted contact → HubSpot → operational inbox flow is a separate implementation and must not be replaced or retested as proof of Resend.

| Stream         | Data and recipient                                              | Release requirement                                                                                                          |
| -------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Transactional  | Adult account email and necessary account notice only           | Verified sender, server-stored recipient, bounded outbox retries, signed delivery receipts                                   |
| Marketing      | Adults who explicitly opted into the relevant marketing purpose | Consent source/date/version, unsubscribe and suppression handling, approved content and audience                             |
| Kids retention | Guardian email with a generic account notice                    | Kids release gates plus retention outbox and confirmed delivery; no child name, progress, level, age or identifiers in email |

Never infer marketing consent from account creation, a contact submission, payment, or guardian consent. No child records are exported to Resend contacts or HubSpot marketing. Welcome marketing, campaigns and nurture schedules remain disabled until their separate consent and recipient controls exist. Required account notices must not contain promotions.

## Configuration to complete before activation

1. Reuse the existing Resend account/team if one exists. Inspect its current plan and usage before considering any upgrade; no paid plan or add-on is required by this code.
2. Add a dedicated sending subdomain such as `mail.masaarat.ai` if it is not already verified. This is a proposed configuration, not evidence that the domain exists. Publish only the exact DKIM and sending return-path DNS records supplied by Resend. Keep Google Workspace's root-domain MX records unchanged; do not enable Resend inbound receiving for `masaarat.ai`.
3. Use a verified `From` address in that sending domain, with `Reply-To: info@masaarat.ai`. This mailbox is the existing operational reply destination; no new `support@` mailbox is assumed. Disable open and click tracking for operational/Kids notices.
4. Store `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL` and `RESEND_WEBHOOK_SECRET` only in the protected server configuration managed through Lovable. Prefer a domain-scoped sending key; webhook signing uses its separate secret. Never use a `VITE_` prefix, commit keys or place keys in browser code. Keep sending disabled until the required controls and delivery test have been accepted.
5. Register the prepared retention webhook URL only after the matching function is approved and deployed. Subscribe at least to `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.complained`, and `email.suppressed`. Reuse the account's existing endpoint if appropriate instead of buying capacity solely for a second endpoint.
6. Approve one exact test recipient and message, then verify API acceptance, the matching signed delivery receipt, and actual inbox arrival separately. No test email is sent by the unit tests.

If a login, verification, API-key input or DNS approval is unavailable, report that exact missing step. Source preparation must not be reported as live account configuration.

## Server contract

`supabase/functions/_shared/resend.ts` exports:

- `sendTransactionalEmail(config, message, fetcher?)`: sends one recipient to the fixed Resend endpoint. Requires an explicit enabled flag, a Masaarat sender, plain-text content and a stable idempotency key. It returns the provider email ID on API acceptance only, or a bounded error category. It never retries internally, logs payloads, follows redirects, or adds contacts.
- `verifyResendWebhook(rawBody, headers, webhookSecret, nowMs?)`: verifies the raw-body Svix HMAC and a five-minute timestamp tolerance with WebCrypto, then returns only event ID, event type, email ID, event time and recipients. It does not grant authorization or persist a receipt itself.

The caller must persist the outbox before sending, bind each result to its stored adult recipient, and deduplicate `svix-id` in the database. A received event must match the stored provider email ID and exact intended recipient before changing state. A successful send response or `email.sent` event does **not** start a delivery-dependent deadline. `email.delivered` means acceptance by the recipient's mail server; it does not prove human reading or inbox placement. Bounce, suppression and complaint events must prevent unsafe retries and destructive actions.

Resend retains idempotency keys for 24 hours. Keep a durable application outbox beyond that window. The prepared Kids worker stops unresolved automatic retries before the window expires; an unknown result must be reconciled before another send. Preserve the original recipient and content on retry. Never generate a fresh key just to bypass a failed request.

## Costs and acceptance

No provider purchase, campaign send, or production email activation is part of this change. Check the live account and [official pricing](https://resend.com/pricing) for plan limits before launch; do not assume a quota is sufficient without the expected adult-email volume. Payment or an upgrade requires the owner's concrete approval. The application transport imposes no additional third-party SDK dependency.

## Official references

Checked 2026-09-25:

- [Sending API](https://resend.com/docs/api-reference/emails/send-email)
- [Idempotency keys and 24-hour retention](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Signed webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Svix HMAC protocol and published test vector](https://docs.svix.com/receiving/verifying-payloads/how-manual)
- [Email delivery event meaning](https://resend.com/docs/webhooks/emails/delivered)
- [Event types, bounces, complaints and suppressions](https://resend.com/docs/webhooks/event-types)

Regression coverage: `src/lib/__tests__/resend-transport.test.ts` uses mocked network requests, locally signed fixtures and the official Svix vector. No credentials, real recipients, provider calls or child data are required.
