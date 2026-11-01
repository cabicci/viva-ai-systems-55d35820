# Existing access continuity audit — 2026-10-29

Read-only aggregate project database checks; no customer codes or personal data selected or exposed.

| Source | Total | Current access / paid period |
|---|---:|---:|
| Legacy Core user subscriptions | 0 | 0 |
| Core billing subscriptions / gateway subscriptions | 0 | 0 |
| Academic / Technical Stripe subscriptions | 0 / 0 | 0 / 0 |
| Kids Stripe Test history | 1 refunded | 0 current paid periods |
| Kids family entitlements | 1 | 1 current, finite, admin-referenced |
| Admin access grants / active admin state | 1 / 0 | 0 |
| Email access grants | 11 | 0 |
| Commerce entitlements | 0 | 0 |
| Commerce offers / purchase coupon definitions / admin coupons | 0 / 0 / 0 | 0 |
| Live offer mappings / reservations | 0 / 0 | 0 |

The currently active Kids grant has an admin reference, not a Stripe reference, and overlaps refunded Test Stripe history. That is **not proof of improper access**: preserve the explicit admin grant and dates. No grant was revoked, extended or relabeled.

## Non-destructive transition

- New paid purchases after authorized launch use Live only; retain all historical Test records and all existing manual/admin/email access dates. Never convert `cus_`/`sub_` IDs between environments or recreate subscriptions automatically.
- There are no current managed paid Stripe subscribers in these database records to migrate. This is database evidence, not an account-wide Stripe census or verification of off-site subscriptions.
- The portal helper now authenticates a per-scope environment lookup. Live subscriptions stay on Live lifecycle even when checkout is disabled. Test subscriptions are never sent to a Live customer portal. Ambiguous/no managed subscriptions fail closed.
- The existing Test lock intentionally disables resumable Test portals and ignores Test grant/extend events after switching mode. If future audit discovers active Test subscriptions, resolve them before the switch: owner-reviewed cancellation through Stripe, keep legitimately granted access to its existing expiry, and invite an explicit new Live purchase only when appropriate. Do not unlock Test resume/checkout or force customers to repurchase immediately.
- Manual/admin grants are not recurring Stripe subscriptions and have no Stripe portal. A later Live purchase must preserve their existing access rather than revoke them. Re-audit aggregate rows immediately before launch; this snapshot can become stale.
- Confirm domain endpoint JSON guards, restricted-key expansion evidence, actual offered discount definitions and authorized publication before enabling Live. No payment or Stripe object was created by this audit.

## Verification limitations

Fixture/disposable PostgreSQL tests are not proof of an actual paid Live invoice, concurrent hosted redemption, or restricted-key coupon expansion. With no real offers/mappings/reservations, the authenticated admin empty-inventory view can be checked, but no customer offer can truthfully be exercised end-to-end without separate provisioning and payment authorization.