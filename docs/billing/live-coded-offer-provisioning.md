# Live coded-offer provisioning and verification

## Actual inventory — 2026-10-29

The project's database returned **0 total rows in each of `billing.commerce_offers`, `billing.coupon_definitions`, and `billing.admin_access_coupons`**, therefore **0 configured coded offers**. No private codes, customer emails, names or phone numbers were selected. No offer-specific Stripe Coupons or Promotion Codes are required for the current launch.

Owner supersedes the narrower current-offers scope: the system must operationally support future configured paid codes as well as Kids family prices. No code or Stripe object should be invented. The existing checkout/fulfillment architecture is reused.

## Admin operational workflow

1. Create an actual offer through existing commerce administration, with reviewed audience, currency/market, interval, expiry/cap and redemption rules. 100%/free and admin access remain on existing non-Stripe grant paths. Legacy purchase coupon definitions are not automatically converted.
2. In Cabicci LLC Live, an authorized owner separately pre-creates the exact product-restricted Coupon and Promotion Code defined below. The site's restricted key is not given Coupons/Promotion Codes write/read permissions.
3. In commerce administration → offers → Live discount mappings, select the existing internal offer and enter real registered Price/Product and pre-created Coupon/Promotion Code IDs, explicit first-invoice-only or every-renewal duration, and review reference. Save a reviewed immutable version (initially unavailable). Server/database recheck the discount from the offer and catalogue, not a client amount.
4. Approve mapping availability separately with a review reference. This is owner attestation, not a claim of Stripe readback verification. Global Live switches remain independent and OFF until launch authorization. Checkout binds capacity then verifies expanded Session promotion/coupon/product/totals before returning its URL; a denied or incomplete expansion is unavailable, never Test fallback. Signed invoices independently verify the actual discount and paid period before fulfillment.
5. Use Verify terminal state on a bound reservation to perform read-only Stripe Session reconciliation. Only expired, unpaid Sessions with no subscription/payment and exact customer/reservation binding can release capacity. Completed async/unpaid, paid, missing or contradictory evidence stays held. Release is durable/idempotent and consumed reservations cannot be released or restored. Cancellation page visits are not proof.

Administration records private durable review/release evidence. It never creates Stripe objects, enables global switches, or changes customer access.

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
- Shared rail rules additionally count manual orders and Live pending/consumed reservations against the same configured per-customer limit. Confirmed Live use participates in first-payment/new-customer eligibility on manual rails. One user/request key cannot create both a manual order and a Live reservation; changing rails requires a new attempt after safe cancellation/reconciliation. Phone-required offers retain their existing stricter one-identity/phone restriction.
- Checkout sends one server-selected Promotion Code with `allow_promotion_codes=false`; no client amount, Stripe ID or mode is accepted. Existing exact-path hosted routes are reused.
- Signed `invoice.paid` requires invoice → subscription → customer and reservation → Checkout Session relationships; one standard mapped price/quantity/period; expanded mapped coupon/promotion; exact discount and paid totals; no extra items, taxes, credits or stacking.
- No separate commerce entitlement is granted. Existing Core/Kids/Academic/Technical paid writers and risk-hold guards remain authoritative. Verified current invoice-line periods must equal subscription item periods.
- Personal reservation fields are anonymized at learner deletion and deleted at financial purge. Pending bound attempts conservatively retain capacity until reconciled.

## Future coded-offer prerequisites — not current launch blockers

1. No actual offers or reviewed Coupon/Promotion Code mappings exist.
2. Owner must choose explicit duration for each future offer. Repeating duration and coded Academic-with-assistant are unsupported and fail closed.
3. Verify `expand[]=discounts.source.coupon` and Checkout `line_items` expansion with the deployed Stripe API version and restricted key. No Coupons/Promotion Codes endpoint reads or permission broadening were added. If expansion is denied or evidence differs, fulfillment fails non-2xx.
4. Percentage rounding must agree between the installed commerce integer quote and Stripe. Any mismatch fails closed; low-value/odd fractional variants need provisioning-time verification.
5. Bound canceled/failed attempts reserve capacity conservatively. The admin terminal-Session readback flow now releases only provably expired unpaid Sessions without a payment graph; asynchronous or paid ambiguous attempts require separate investigation and cannot be manually forced through this workflow.
6. Native disposable PostgreSQL now verifies genuine concurrent bank/InstaPay versus Live reservation races for shared global caps and attempt keys. Hosted coded-redemption concurrency and signed real Live discounted invoice checks remain **not verified**; project database credentials used for verification are schema-limited. See `shared-coupon-rail-verification.md` for current evidence.
7. Catalogue/webhook activation and publishing remain separate authorized work. No new revision was published in this task.

## Verification

Final billing and existing commerce suites: **464 passed, 42 skipped, zero failures**, including disposable PostgreSQL admin provision/replay/duration/market/authorization and terminal-release/idempotency tests. Automatic compilation/type validation: **build OK**; roadmap guard passed. Authenticated owner administration returned zero paid offers/mappings/reservations, with save disabled; four-language desktop/phone checks found no horizontal overflow. Database Live control has zero rows (fails closed to OFF); mode is unset and environment Live-enable flag is off. Local mode endpoint remains `200 {"mode":"test"}`; all three Live routes reject GET with `405 {"error":"METHOD_NOT_ALLOWED"}`. These are local/authenticated source checks, not publication of this revision or actual discounted payment proof.