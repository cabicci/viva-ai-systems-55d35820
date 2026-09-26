# Contact automation preparation — 24 September 2026

Status: **offline policy only; not connected, published or sending**. The
current contact server validates processing consent, phone, Turnstile and rate
limit, then submits to the existing HubSpot form. An HTTP success response has
no durable per-submission receipt/queue, reply sender or timer attached. The
published form → matching HubSpot record → actual notification chain remains
unverified, and the previous controlled contact attempt must be resolved
before any new site form submission.

`src/lib/contact-automation-policy.ts` isolates Khalil's approved rules:
Sunday–Thursday, 09:00–17:00 Africa/Cairo; outside hours an immediate receipt
is proposed and detailed follow-up waits until business hours. Routine requests
may proceed through an approved automated answer; custom prices, contracts,
unresolved and unknown cases require Khalil. No action is proposed without
processing consent, a verified HubSpot submission and a stable receipt ID. The
returned idempotency key is **not a dedupe system** until persisted atomically.

## Activation dependencies and acceptance

1. C02 recovers the previous attempt result and verifies the site response,
   exact HubSpot record, and an actual delivered notification separately. Do
   not make a second submission while the first outcome is ambiguous.
2. Verify that `sales@masaarat.ai` exists, can send and receive, and is allowed
   as the sender for business enquiries; verify `info@masaarat.ai` separately
   for support. Connected inbox state or a saved HubSpot draft does not prove
   send-as ability. Choose a supported transactional sender/queue and a
   scheduler; do not assume HubSpot full workflows are available.
3. Provide a stable provider receipt ID plus a durable, unique
   `(submission_id, action)` outbox entry and delivery result for each receipt,
   reply, and escalation. Retry timeouts against the same key. Do not emit on
   HTTP submission success alone or send a message from a test contact.
4. Assign an explicit request type with an unknown → Khalil fallback; review
   routine reply content, escalation destination and existing marketing
   consent. Processing consent allows handling this enquiry but does not grant
   unrelated marketing subscription. Ensure unknown/custom requests never
   receive an invented price or contract commitment.
5. Run disposable tests for dedupe, consent, Cairo opening/closing boundaries,
   weekends, out-of-hours acknowledgement, retry and owner escalation. Then
   verify one authorized end-to-end receipt and actual email delivery before
   activation. Publication remains a separate launch decision.

No sender, scheduling service, secrets, form submissions or CRM configuration
are created by this preparation.
