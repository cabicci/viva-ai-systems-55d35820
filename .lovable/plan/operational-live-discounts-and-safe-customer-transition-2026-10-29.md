# Operational Live discounts and safe customer transition

## Confirmed findings
- The existing server checkout, durable mappings, reservations, replay protection and signed invoice discount proof are already implemented. Reuse them rather than replace the billing architecture.
- Production has zero commerce offers, purchase coupon definitions, admin coupons, Live offer mappings and Live offer reservations. Do not invent a code or create Stripe objects.
- No Core, Academic or Technical Stripe subscription rows or legacy Core subscription rows were returned. Kids has one refunded Test subscription with no current paid period, while one related family entitlement is currently active. Preserve that access; its provenance needs review, not automatic revocation.
- One admin grant and eleven email grants exist, with zero currently active in the checked records. No commerce entitlements were returned.

## Build
1. Add narrowly authorized administration to provision a new immutable mapping version for an existing paid commerce offer and registered Live price. Require explicit `once` or `forever`, discount definition, actual pre-created Coupon/Promotion Code IDs, review evidence and an idempotency key. Return sanitized verification status; never create Stripe products, prices, coupons or customer codes. Separate mapping availability from global Live activation.
2. Validate the mapped coupon and promotion through permitted expanded Stripe Checkout/discount relationships before handing a customer a checkout URL, and again on signed invoice fulfillment. Missing evidence or denied expansion must fail closed. No broader restricted-key permissions, client-controlled totals, or Kids family stacking.
3. Add admin reconciliation for bound reservations. Release capacity only after matching Live Session/customer/reservation readbacks prove an expired unpaid Session with no subscription/payment capable of completing. Paid, asynchronous, ambiguous or conflicting attempts remain held for review. Record durable, idempotent reconciliation evidence; never use a cancel-page visit as proof.
4. Make the admin workflow usable and localized in the existing commerce administration, including mapping status and unresolved attempts. Keep free/admin-access codes on their existing grant paths; legacy paid coupon definitions must not silently become Live discounts without an explicit reviewed commerce-offer mapping.
5. Document the aggregate continuity audit and a non-destructive transition: preserve Test/manual/admin grants and their dates; never relabel Test IDs as Live or recreate subscriptions automatically. Portal routing must follow the existing subscription's environment rather than only the global new-checkout mode. Identify the Kids exception for owner review without changing access.
6. Confirm neutral customer-facing checkout wording in all four languages and all four endpoint guards locally; keep mode, database gate, Live catalogue and webhook OFF. No publication or deployment.

## Technical details
- Use authenticated server functions with a server-verified admin role before privileged access; use the existing supported migration tool only for necessary additive functions/audit state.
- Reuse existing offer-row locks, immutable versioning, catalogue validation, reservation and fulfillment RPCs. Reconciliation must share capacity locks and never release a consumed reservation.
- Once means first paid invoice only; forever means recurring discount. Repeating durations and coded Academic-with-assistant remain explicitly unsupported and cannot be enabled silently.
- Add concrete tests for authorization, mapping definition/market/interval mismatches, duration, no stacking, expiry/caps/replay, terminal versus asynchronous reconciliation, and environment-specific portal continuity. Run focused suites and authenticated admin UI checks; inspect automatic compilation.
- Actual discounted Live payment and restricted-key expansion verification remain unverified unless existing permitted evidence is available; no payments or new Stripe objects will be created to test them.

## Completion boundary
Provide operational source/test changes and a clear provisioning checklist, with remaining evidence requirements stated precisely. Keep all current access unchanged and all Live controls off pending a separately authorized launch.