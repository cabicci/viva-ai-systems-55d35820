# Live coded-offer checkout safety

## Current audited inventory

The actual project database contains **0 commerce offer records and 0 currently active paid coded offers**. No customer codes or personal data were queried. There are therefore no offer-specific Stripe objects or IDs to provision from the current inventory.

Installed eligibility rules cover package, EGP/USD market, optional monthly/annual interval, percentage or fixed discount, validity dates, global redemption cap including pending orders, per-email limits, optional targeted audiences, required phone reuse protection, new-customer eligibility and renewal eligibility. An explicit code replaces the Kids automatic family discount.

**Important:** `renewals` means an existing customer may redeem an offer; it does not define Stripe recurring discount duration. Existing commerce access uses one paid order and 30/365-day simple-offer durations. Do not infer a perpetual subscription discount from that flag.

## Proposed implementation

1. Add service-only, versioned Live mapping records for internal offer IDs, registered base price/product, market/currency/interval, precreated coupon and promotion-code IDs, reviewed discount definition and explicit duration. Leave all mappings disabled and empty; never invent Stripe IDs or create Stripe objects.
2. Add authenticated, server-validated coded-offer checkout with transactional identity/cap reservations shared with existing manual offer limits. Revalidate package, currency, interval, expiry, usage, audience, phone and renewal eligibility. Bind retries to immutable mapping versions. Resolve Kids codes against its standard price, not its family price. Unmapped or unreviewed offers remain unavailable for Stripe.
3. Bind the reservation to the created Checkout Session/customer/subscription and prove its mapped discount on signed `invoice.paid` using permitted expanded invoice/subscription/session reads. Verify one mapped discount, price/product, coupon/promotion relationship, totals, currency, period and the immutable project offer snapshot. Consume once by invoice identity; renewals cannot consume again or extend beyond the verified paid period. Preserve risk holds and existing event guards.
4. Preserve manual/free behavior while mode is Test; route fully mapped paid codes to Live only after the server-owned public mode and existing gates permit it. No fallback between modes.
5. Revise public billing Test labels, errors, pricing/paywall descriptions and subscription terms across all four locales without changing internal historical Test records. Do not falsely advertise real payments while Test remains selected.
6. Run focused eligibility, concurrency, replay, expired/used-code, amount, currency/interval, unmapped/incorrect-object and webhook failure tests. Check automatic compilation; separate manual typecheck/build commands are prohibited by this environment.

## Required provisioning and launch blockers

- Current offer-specific provisioning list: **none**, because there are zero offer records. Future offers must exist before exact definitions can be generated.
- Each future mapping needs the actual Live coupon ID and promotion-code ID, an explicit `once`/`repeating`/`forever` policy (and month count for repeating), product restrictions and percentage or currency-specific fixed amount. Discount duration must be owner-reviewed; renewal eligibility alone is insufficient.
- Stripe caps/expiry/customer restrictions must not be less restrictive than the reviewed offer; the project remains authoritative for cross-channel identity and redemption limits. Private customer restrictions are never included in chat.
- The restricted key has no Coupons/Promotion Codes read permission. Do not broaden it: validate discount definitions through permitted expanded payment objects and fail closed if required evidence is unavailable. Verify those expansions before enabling any mapping.
- Catalogue/webhook activation, all mapping provisioning, hosted end-to-end validation and publication remain separate launch blockers. No secrets, switches, Stripe objects or payments will be changed in this work.

## Technical details

Use this project's supported Lovable migration tool for additive schema/RPC changes, explicit service-only grants and RLS. Keep authenticated request validation in existing server boundaries and preserve exact-path hosted dispatch. Integrate reservation locking with commerce offer/order locking, paid-access writers and current lifecycle/user risk-hold locks; no independent entitlement grant path. Add migration-backed disposable/rollback database tests rather than testing safety only with mocks.

