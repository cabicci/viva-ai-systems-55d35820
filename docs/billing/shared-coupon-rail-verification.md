# Shared paid coupons across payment rails — 2026-10-29

## Implemented and applied

Stripe Live remains additional to manual commerce. Reused the existing offer-row lock and payment-specific records; no payment rail or entitlement writer was replaced.

- One combined global limit: consumed uses plus pending bank/InstaPay orders plus pending Live reservations.
- One configured per-email limit: manual consumed/pending and Live consumed/pending counted together. Removed the inconsistent unconditional single-use Live check for non-phone offers; a configured limit of two now permits exactly two uses in either rail order.
- First-payment/new-customer eligibility also recognizes confirmed Live coupon consumption on manual rails. Existing plan, term, market, audience, expiry and phone checks still apply.
- An atomic insert guard serializes a user/request key across manual and Live records. Same-rail retry remains idempotent; changing rail with that same key cannot create a duplicate reservation. New attempts still obey combined limits. Phone-required offers retain the existing stronger one-identity/phone rule, even when the general email limit is higher.
- Discounts do not stack with Kids family pricing. Tests assert 19900 base → 17910 family benefit, but explicit 20% code → 15920, not a stacked total.
- Manual confirmation consumes once; signed Stripe fulfillment consumes once through its existing verified invoice path. Manual refunds do not restore uses, consume a Stripe reservation or issue a Stripe refund. Cancellation/expiry release only unpaid pending manual capacity; unresolved bound Stripe payments retain capacity until permitted reconciliation.

Applied through Lovable Database: `0025_shared_coupon_rail_eligibility_and_attempts.sql`. Read-only project schema checks confirmed both insert guards, combined quote counts and no direct authenticated execution of the guard.

## Verification matrix

| Case | Evidence | Boundary |
|---|---|---|
| Bank and InstaPay → confirmation → Live reserve/bind/consume, reverse order | Actual installed commerce and Live SQL, exact 13520 amount, combined count two, third attempt denied, idempotent confirmations and consumption | Disposable fixture; no real payment |
| Mixed pending uses | Two permitted uses across rails; third denied; global one-use offer blocks other customers | Real quote/order/reservation SQL, no mocked eligibility |
| Cross-rail duplicate request key | Same-rail replay returns prior record; second rail denied | Database attempts, not hosted checkout |
| Genuine simultaneous requests | Native PostgreSQL two-session bank vs Live and InstaPay vs Live races: global cap and duplicate key each produce one winner, one rejection, exactly one persisted reservation/order | Four concurrent scenarios; local isolated database, not hosted concurrency |
| Eligibility | All three rails reject wrong plan, interval, currency/market, targeted customer and expired offer | One representative Pro monthly EGP fixture plus Kids no-stacking; not a live all-catalogue payment census |
| Phone identity | Both directions deny reused phone across accounts; same account/different phone denied | Existing strong rule preserved |
| Manual continuity | Unmapped Stripe offer still works on configured bank/InstaPay; disabled bank does not block InstaPay/Live; expired order cannot be confirmed | No production methods enabled or changed |
| Refund attribution | Explicit funds-verified external refund is idempotent, preserves used coupon count and leaves pending Stripe reservation untouched | Records/entitlements only; no money returned by tests |
| Stripe invoices/durations | Existing signed webhook/discount suites cover object relationships, once/forever, periods and mismatches | Stripe HTTP readbacks mocked in unit suites; real signed Live payment unverified |

New journey suite: **28 native PostgreSQL tests passed**, including all four two-session races. Ordinary disposable run: 27 passed, one native-only case skipped unless its explicit localhost test URL is provided. Existing billing/commerce/UI regression suites were rerun separately; see final chat totals. A skipped native-only case does not negate the separate successful native run.

## Actual production status and limitations

Read-only counts: commerce offers, coupon definitions, admin access coupons, Live mappings and reservations all **zero**; manual orders **one**, commerce entitlements **zero**. Database Live gate **OFF**. InstaPay configured for EGP; bank disabled. No customer coupon, Stripe object, order, payment, receipt, grant or refund was created; no secret, mode or method switch changed; nothing published.

An admin-created paid offer is usable through configured manual rails immediately under its eligibility rules. Stripe additionally requires its reviewed mapping to genuine pre-created Live Coupon/Promotion Code objects and global Live authorization; admin offer creation alone cannot mint those objects with the restricted key. Missing mapping fails closed without breaking manual redemption.

Not launch-ready: current bank lacks enabled instructions; no actual paid code/mapping exists; owner-controlled hosted transfer review/access/refund and Live checkout/renewal/portal/signed discounted invoice and restricted-key expansion/rounding remain unverified. Latest application source has not been published. Repeating discounts and coded Academic-with-assistant remain unsupported, not silently approximated. Real amount/period/grant checks require the separately authorized validation journey.