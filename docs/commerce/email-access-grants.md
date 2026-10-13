# Pre-registration lesson access grants

Review candidate for PR #180. **No production migration, deployment, real invitation, or website publication is part of this change.**

## Behavior

Use **Admin → Commerce → Grant access by email**. Enter the recipient email, select all published lessons or published packages/catalogues, choose 1–36,500 days or permanent, and optionally request an invitation. Invitation defaults off.

A grant is independent of Auth and every payment provider. Creating it never creates an Auth account. It initially displays **Pending registration**. The database trigger on an Auth verified email activates matching pending grants in the same transaction as registration/confirmation. The first authenticated access read therefore sees the grant without a client claim request, coupon, payment, or another administrator decision. An existing verified account activates during grant creation. Unverified and suspended/deleting accounts cannot activate.

Only the stored verified Auth email is authoritative. Normalize surrounding whitespace and case; do not merge plus aliases or dotted addresses. The activated user ID remains immutable. A changed/unverified email stops grant-based access; it cannot transfer the grant to another user.

The specified duration starts at activation. Permanent means a null internal expiry. Admins can revoke pending or active grants, extend finite active or expired grants (from the later of now/previous expiry), search/filter status, and inspect creation/activation/extension/revocation audit history. Expired status is derived from the deadline, with no cron dependency.

## Scope and composition

| Catalogue             | Lesson scope                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| AI Pro                | Existing canonical 71-lesson contract, excludes Builder                                                                 |
| AI Pro Plus           | Existing canonical 100-lesson contract                                                                                  |
| Kids                  | Approved lessons, with released country, guardian declaration, child profile and current profile consent still required |
| Technical — furniture | Released furniture lessons only                                                                                         |
| Academic course       | Enabled course and approved lesson in the requested locale only                                                         |
| All published         | All of the above, including future published catalogues; unpublished/unapproved content stays closed                    |

Scopes never imply administrator privileges. AI core grants reuse published policy limits (Pro 50/month, 3/lesson; Pro Plus 150/month, 6/lesson in the current fixture). Overlaps use the largest applicable existing allowance, never a sum or unlimited usage. Course lesson access does not grant the separately purchased Academic assistant add-on. Nothing writes Stripe subscriptions, coupons, prices or payment entitlements. Expiring/revoking a grant composes with still-valid paid sources.

Grant rows, audit and opt-in invitation outbox are private/RLS protected. Public RPCs check stored administrator role and verified/lifecycle identity; activation accepts no email, grant ID or arbitrary user ID. Advisory/row locks and durable request keys make creation/activation/management atomic and idempotent. Auth registration and concurrent admin creation serialize by recipient email without locking an Auth row from the admin transaction.

## Optional invitation

The existing protected account-welcome scheduler and Resend transport deliver an opt-in service invitation, using existing secrets and a stable provider idempotency key. The invitation links to normal login/registration, never to a bearer access token. A durable lease/outbox records delivery separately from access. Delivery failure never rolls back or duplicates the grant. Unknown expired leases are quarantined; retries are bounded to three attempts within 23 hours, inside the provider idempotency window. The admin grant row exposes invitation status.

LC09 blocks in-flight mail before learner erasure and erases recipient grants, audit and outbox at learner erasure, without extending financial retention. Auth hard deletion also cascades activated grants and their owned data.

## Validation and installation boundary

The cumulative commerce DB suite applies existing commerce, Kids, Technical and Academic SQL, then `scripts/email-access/email-access-candidate.sql`, only in disposable PostgreSQL/PGlite. Its native CI service is restricted to localhost `commerce_test`. Tests cover registration without account creation, unverified/verified existing users, verified OAuth insertion, first access before any claim RPC, repeat creation/confirmation, actual concurrent transactions, wrong-email/JWT/table/helper claims, administrator role removal, expiry, permanent grants, extensions, paid overlaps across all four lesson families, publication/locale/course gates, Kids consent, AI caps, mail leases and deletion. React tests exercise create/scope/permanent/invitation defaults, uncertain-response keys, status/audit, revoke and extend. Invitation/Edge tests use mocked providers; no messages are sent.

The SQL is deliberately a review candidate outside the auto-applied migration directory. Before any later authorized release, Lovable must review/rehearse the candidate against the **actual installed functions**, apply it once, then deploy the modified existing mail worker and the website code. Guarded definition replacements fail closed if the installed contract differs. Register a proper migration through the project's approved Lovable workflow then; do not invent/apply a timestamped production migration from this task.

Browser-based Supabase signup/confirmation and an owner-operated admin smoke test remain release acceptance steps after an authorized rehearsal/deployment. Current tests exercise the real SQL verification trigger in synthetic Auth tables and React interactions; they do not claim a live Supabase Auth/UI rollout.

## Invitation and recipient controls — 2026-10-14

The grant form now has a separate four-locale invitation-language selector; changing it does not require changing the administrator's interface language. The existing validated locale is saved with the opt-in mail request.

New grant emails link to `/signup?locale=...&email=...`. The worker obtains the prefilled email from the stored recipient, not arbitrary template payload data. The email is a form hint only: verified Auth identity and the existing grant activation transaction still determine access. Both signup and the existing-account login accept an editable validated email hint. No account or grant is created by opening the link. HTML links escape query separators.

Both Grant access by email and Coupons and invitations reuse the existing admin-only paginated Auth directory through a registered-email picker. It supports search through later pages, single-recipient replacement, group additions without duplicates, loading/retry states, and manual entry of an unregistered address. The query cache is partitioned by the current administrator and discarded after unmount. No email-directory endpoint or table is exposed to anonymous users.

No database migration or change to duration, activation, quotas, Stripe, or paid entitlement composition is required. Release requires the updated existing `account-welcome-job` dependency bundle plus owner publication of the website. Historical deployment receipts and database acceptance remain independent of this source change. Validation commands include the commerce and auth regression suites, TypeScript, lint, the application build, and `scripts/commerce/invitation-browser-check.mjs` with synthetic local responses only.
