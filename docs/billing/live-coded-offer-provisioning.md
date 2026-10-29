# Live coded-offer provisioning and verification

## Actual inventory — 2026-10-29

The project's database returned **0 total `billing.commerce_offers` rows**, therefore **0 active paid coded offers**. No private codes, customer emails, names or phone numbers were selected. No offer-specific Stripe Coupons or Promotion Codes can be truthfully specified from this empty inventory.

The 28 registered base/family/assistant price mappings are unchanged. No Stripe object was created, activated or updated. Public mode and Live switches were not changed.

## Definitions to provision after offers exist

For each paid offer/market/interval mapping, provision in Cabicci LLC Live:

- Coupon: exact `percent_off` from the offer, OR `amount_off` in minor units plus its exact `EGP`/`USD` currency; never both. Percentage 100% and discounts reducing the price to zero remain on the existing free path.
- `applies_to.products`: exactly the single registered Masaarat product for that mapping. Kids uses its standard price, not the 10% family variant.
- Explicit reviewed `duration=once` or `forever`. `renewals=true` only allows previous customers to redeem; it is **not** consent to a perpetual discount. `repeating` remains blocked pending a reviewed temporal policy.
- Promotion Code: references that exact coupon; owner-selected code value stays private. Match expiry and global redemption cap when applicable. Apply actual customer restrictions without exposing them in reports. The project additionally enforces cross-channel account/email/phone use limits and eligibility.
- Mapping: actual coupon and `promo_…` IDs; internal offer UUID; version; package; market; currency; interval; registered `price_…` and `prod_…` IDs; discount kind/value; duration; review timestamp. Insert a reviewed version, not an editable reused version. Enable only after evidence checks and launch authorization.

No example ID in tests is a provisioning ID. Do not copy synthetic fixture IDs into mappings.

## Source implementation

- Service-only immutable mappings and private reservations are installed by migrations `0014`–`0021`.
- Reservation/quote/manual-phone paths share commerce offer-row locks and capacity accounting. Retries bind immutable inputs; usage increments once on verified invoice consumption.
- Checkout sends one server-selected Promotion Code with `allow_promotion_codes=false`; no client amount, Stripe ID or mode is accepted. Existing exact-path hosted routes are reused.
- Signed `invoice.paid` requires invoice → subscription → customer and reservation → Checkout Session relationships; one standard mapped price/quantity/period; expanded mapped coupon/promotion; exact discount and paid totals; no extra items, taxes, credits or stacking.
- No separate commerce entitlement is granted. Existing Core/Kids/Academic/Technical paid writers and risk-hold guards remain authoritative. Verified current invoice-line periods must equal subscription item periods.
- Personal reservation fields are anonymized at learner deletion and deleted at financial purge. Pending bound attempts conservatively retain capacity until reconciled.

## Exact launch blockers

1. No actual offers or reviewed Coupon/Promotion Code mappings exist.
2. Owner must choose explicit duration for each future offer. Repeating duration and coded Academic-with-assistant are unsupported and fail closed.
3. Verify `expand[]=discounts.source.coupon` and Checkout `line_items` expansion with the deployed Stripe API version and restricted key. No Coupons/Promotion Codes endpoint reads or permission broadening were added. If expansion is denied or evidence differs, fulfillment fails non-2xx.
4. Percentage rounding must agree between the installed commerce integer quote and Stripe. Any mismatch fails closed; low-value/odd fractional variants need provisioning-time verification.
5. Bound canceled/failed/expired attempts reserve capacity conservatively; a reviewed Stripe-readback release/reconciliation flow is still required before capped coded offers launch.
6. Actual-database concurrent coded-redemption and signed real Live discounted invoice checks are **not verified**. Current database test credentials are schema-limited. Disposable PostgreSQL tests exercise installed migrations but are not proof of hosted concurrency.
7. Catalogue/webhook activation and publishing remain separate authorized work. No new revision was published in this task.

## Verification

Final focused billing and existing commerce suites: **449 passed, 42 skipped, zero failures**, including cumulative `0014`–`0021` disposable PostgreSQL tests. Automatic compilation: **build OK, 21:50:08 UTC**; roadmap guard passed. Actual server helper returned database Live checkout `false`; mode is unset and the environment Live-enable flag is off. Public pricing pages were checked locally in all four languages: no billing Test wording, no horizontal overflow or browser errors; mode endpoint remains `200 {"mode":"test"}`. Separate manual typecheck/production build commands are prohibited in this environment; their separate results remain unverified.