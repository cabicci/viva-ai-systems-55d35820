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

### Later verified connection checkpoint, 8 October

The owner added the connection and reported API friendly name `masaarat`.
Lovable's native inventory found one connection named `Khalil's Twilio`, linked
it to this project and successfully read provider resources. The association of
`masaarat` with the underlying API key is owner-reported, not independently read.

The runtime uses the Twilio connector gateway, with server-only opaque
`TWILIO_API_KEY` and `LOVABLE_API_KEY` credentials. These are not a raw Twilio SK
key/secret. The transport now supports this actual binding; it does not call
the AI Gateway. Legacy direct Account SID/Auth Token support remains only when
no connector configuration is present. Partial native configuration fails closed.

Verify and Messaging services were absent. One SMS/voice-capable number was
present; no voice/Make setting was changed. WhatsApp sender linkage was not
established; `masaarat_whatsapp_test` was pending approval as a MARKETING template,
which is not authentication-template acceptance. No message was sent.

Creation of one Verify Service named `Masaarat` was attempted through Lovable.
The gateway rejected the write because interactive owner approval is unavailable
in this external session. Nothing was created; the service remains pending an
owner action inside Lovable. Do not retry the rejected write through another
client or ask for new credentials. A configured connector does not prove OTP
delivery. All website send endpoints, persistent configuration and event hooks
remain pending, and PR165 remains a draft.

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

## Latest implementation checkpoint — 8 October 2026

The existing service is `masaarat OTP`. Lovable saved its reference as server-only
`TWILIO_VERIFY_SERVICE_SID` and the subsequent GET succeeded. The earlier missing
service/approval entries are historical and no longer a setup blocker. No SMS
arrival has been tested. WhatsApp authentication remains unconfigured.

The current PR adds one account-page WhatsApp/SMS flow and authenticated server functions.
The server revalidates the current Auth user/email; a service-only RPC derives the
actor from that server context. Browser data cannot select an actor, provider SID,
or approval result. The client chooses only a delivery channel; the private server-controlled channel allowlist decides whether it can be used. A private schema holds challenges and verified phones;
no direct learner/admin/table write can mark a number verified. Verify is not
phone sign-in, parent consent or a paid entitlement.

A reservation commits before the paid provider POST. The initial off-by-default
pilot allows only explicit actor UUIDs and Egyptian numbers. Its conservative
application caps are 3 sends per account/number per rolling day, 20 globally per
UTC day, five code checks per challenge, ten-minute expiry and a 30-second
in-flight lease. Uncertain sends consume budget and block another send until
expiry; there is no automatic retry or fallback. These are implementation limits,
not Twilio pricing or provider policy claims. Previous verified ownership remains
until a replacement is approved. Exactly bound `approved` plus `valid=true`
receipts and a live check lease are required; deletion/conflicting ownership wins.

The additive migration is mirrored in the Drizzle inventory as
`0008_account_phone_verification`. It wraps the installed LC09 chain rather than
replacing its financial/commerce/journey behavior. In-flight leases fence erasure;
challenge/contact data and the pilot identifier are erased at `learner_erased`.
Global budget is not refunded by account deletion. Retention of unexpired provider
assets is unchanged. No verification code is stored in SQL or passed to the RPC.

The owner also requested password confirmation and eye buttons. Signup now
requires exact password equality before Auth; login, signup and reset reuse a
localized visibility control. This does not change password policy or Auth mode.

Remaining gates: actual native PostgreSQL/concurrency CI, current-database
transactional rehearsal through Lovable, apply disabled schema through Lovable,
owner-controlled phone target and bounded real delivery/check test, browser/mobile
verification and merge/publication authorization. Persistent notification
switches/templates/logs/usage, signup/plan/grant/coupon/invitation/receipt messaging
hooks and a mandatory verified-phone transition for offers remain pending. This
slice changes no commerce function and must not be advertised as all messaging
features complete. The Recovery Plan is not used or updated.

### Owner correction and dual-channel checkpoint

The owner explicitly requires BOTH WhatsApp and SMS testing, with WhatsApp first.
Both reuse the existing Verify service, orchestration, ownership record, quota
and expiry rules. The account UI prefers WhatsApp when it is in the server-owned
channel allowlist and offers SMS as an explicit alternative. Changing channel
during a live challenge is disabled. There is no second provider POST on an
uncertain attempt. Initial channel configuration is SMS-only until the WhatsApp
provider setup is proven; the overall sending switch remains OFF.

Lovable's fresh provider read found the own Masaarat WhatsApp sender ONLINE and
one empty Messaging Service. Verify's WhatsApp linkage is empty. The attempt to
add that existing sender to the existing pool was blocked by the native connector
requiring interactive owner approval in Lovable. No provider change or send
occurred. The next provider action must happen in the owner’s Lovable editor;
do not retry through a different client. Authentication template readiness and
real arrival/check acceptance remain unverified for WhatsApp and SMS.

The current project's Preview can switch a GitHub branch, but uses the same live
backend. It was not switched. Lovable's read-only database role cannot run the
DDL rollback rehearsal; its migration tool persists changes. Native PostgreSQL
rehearsal, concurrency and rollback are therefore tested in the disposable CI
phone_test database, not claimed as an executed production-database rehearsal.
The first native run exposed JSON fixture serialization and failed-transaction
cleanup in the test adapter; both were corrected without weakening database
permissions or assertions. Browser checks use actual components and shipped CSS
at 375/1280 pixels in four locales, with synthetic Auth/Verify and every external
request blocked. They do not establish real Twilio delivery.

### Saved registration language

Both verification channels use the current account's saved signup
`user_metadata.preferred_locale`, already stored by the registration flow. A
different page language or telephone country cannot override a valid saved choice.
Legacy accounts with no valid preference use their explicit current page choice.
Provider Locale is `en` for English and `ar` for ar-EG/ar-MSA/ar-Gulf. Verify
authentication templates provide Arabic, not separate Egyptian/Gulf OTP dialects;
no custom OTP wording or translation template is claimed. Both channels and all
four choices have provider-form and saved-preference regression coverage.
Future notification queues must snapshot this same account preference and select
the corresponding approved template revision; these event hooks remain pending.

On head b2aa0526 the disposable PostgreSQL job passed14 cases, including two
physical races, and browser checks passed16 locale/channel/viewport scenarios.
The final CI route-catalog assertion caught a missing private communications route
and a signup test in the route directory. The route is now classified private
(no sitemap/indexing), and the test was moved to the existing lib/**tests** folder
without relaxing the assertion. Current-head required CI remains a release gate.
