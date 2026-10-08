# Twilio communications setup

Owner scope, 8 October 2026: prepare the admin communications console and connect
Masaarat to Twilio; test before merging and publishing. Lovable owns all Supabase
platform operations. Roadmap: `6b617b31-c9be-44c8-98fb-a3e18f6f311a`.

## This draft

- `/admin/communications` has services, message drafts, delivery-log and usage tabs.
  It is protected by the existing SSR administrator guard. A readiness request
  verifies the stored administrator role and the account deletion gate before
  checking provider configuration. It returns booleans only.
- The server transport implements Twilio Verify start/check and a GET service
  connectivity check. No verification endpoint or notification sender is exposed.
- Activation controls are disabled. Draft templates are not approved, editable,
  stored in Supabase or submitted to Meta. Logs/usage explicitly remain pending.
- The existing registration, email verification, paid access, grants, coupons,
  invitations, receipts and phone deduplication behavior have not been changed.
  These event names describe the required next integration, not installed hooks.

Lovable's read-only configuration check on 8 October found no Twilio connection
and none of the five requested Twilio settings. The account, US number and Meta
display-name approval are owner-reported; actual sender/Verify readiness is pending.
Connector setup is completed through the Lovable dashboard by the account owner.
Never put tokens in Git, browser-readable environment variables, chat or logs.

## Supabase implementation handoff to Lovable

Do not apply this plan until the correct Masaarat Twilio account and runtime
configuration are established. Prepare/rehearse the additive migration first;
Lovable applies the tested migration and server configuration. No direct cloud
Supabase operations outside the existing Lovable connection.

1. Store singleton service switches, per-event switches, template revisions,
   approval attribution, channel/locale, provider Content SID and quota limits.
   Default all delivery switches off. Readiness is separate from activation.
   Editing an approved revision creates a new draft and disables its sends.
2. Keep verified phones and challenge receipts in a private schema. No learner
   or administrator can directly write a verified flag or provider receipt.
   Authenticate every server action; require current confirmed email and an
   active account. The server derives the actor from the verified session.
3. Reserve per-user and per-number attempts, resend cooldown, verification check
   attempts, expiry and a global cap transactionally before requesting Twilio.
   Bind a random challenge to the exact user, normalized phone, chosen channel
   and provider verification SID. Never store or log the entered verification
   code. An uncertain send is retained for reconciliation without automatic retry.
4. Only server-side provider `approved` plus `valid=true` for the same service,
   SID and phone can commit ownership. Use compare-and-set on the live challenge,
   recheck account deletion and unique phone ownership. Retain the previous
   verified phone until a change succeeds. A caller's user metadata is not proof.
5. Add account phone verification after email registration and on phone change;
   do not replace password/email login or require OTP at every login. Make SMS
   retry an explicit channel choice. Do not assume the provider's automatic
   WhatsApp-to-SMS pilot feature is available.
6. Phone-required offers must use the account's server-verified phone when the
   new verification integration is enabled. Arbitrary checkout form text must
   not satisfy ownership. Preserve existing per-offer locks, user/email/phone
   deduplication, frozen quotes, idempotency, paid entitlement and guardian checks.
   Decide the existing-user transition before imposing a new mandatory gate.
7. Queue notifications durably from committed authoritative events, with a
   unique event/channel/template-revision key. Failed messaging must not roll
   back payment or grant activation. Do not replay historical events when
   switches are enabled, and do not send a misleading success message on quote,
   attempted payment, draft grant or uploaded-but-unreviewed receipt.
8. Send notifications only to the same account's verified phone with applicable
   channel consent, approved templates and current activation flags. New-account
   notifications before phone verification remain suppressed. Email-only group
   invitations cannot be converted into WhatsApp sends without an authorized
   verified phone/consent. No bulk/customer sends are authorized in this slice.
9. Provider acceptance is not delivery. Store a message SID and reconcile
   delivery status through an authenticated provider webhook/readback. Validate
   signatures against the canonical callback URL and original parameters; reject
   altered callbacks. Never resend an accepted/uncertain message automatically.
10. Extend LC09 before enabling writes: block new verifications/sends on deletion
    request, stop pending sends, fence in-flight leases, erase challenge/contact
    data at the authoritative learner-erasure stage and verify no personal data
    remains. Add no unclassified public `user_id` table. Preserve financial
    retention and all existing lease/version guards.

## Authoritative event sources

| Event               | Required trigger                                         | Must not imply                          |
| ------------------- | -------------------------------------------------------- | --------------------------------------- |
| account_registered  | Committed confirmed account / explicit onboarding policy | Phone ownership or paid access          |
| phone_verified      | Exact challenge ownership commit                         | Subscription/grant activation           |
| plan_activated      | Authoritative paid entitlement activation                | Attempted/failed payment succeeded      |
| grant_activated     | Committed valid grant                                    | Administrator role or guardian consent  |
| coupon_redeemed     | Authoritative offer consumption                          | A quote alone consumed the offer        |
| invitation_accepted | Committed acceptance                                     | Permission to send to imported contacts |
| receipt_reviewed    | Committed review outcome                                 | Every reviewed receipt was accepted     |

## Release gate

Before merge/publication: real owner-controlled phone test through the configured
Verify service; SMS/WhatsApp readiness for intended countries; native PostgreSQL
allow/deny, quota/concurrency, entitlement and LC09 rehearsal; template-edit and
event-suppression tests; locale/mobile UI checks; required CI and build. There
is no authorized live test recipient or spending cap in this draft. Obtain the
concrete target/test authorization before sending messages. Do not publish on
the strength of mocked transport tests or a GET connectivity check.

Official references: [Twilio Verify](https://www.twilio.com/docs/verify/api/verification),
[verification checks](https://www.twilio.com/docs/verify/api/verification-check),
[WhatsApp sender setup for Verify](https://www.twilio.com/docs/verify/whatsapp/byo),
[Egypt SMS rules](https://www.twilio.com/en-us/guidelines/eg/sms).
