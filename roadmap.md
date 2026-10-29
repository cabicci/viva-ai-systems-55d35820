# Roadmap

- [ ] Verify future paid coupon eligibility and one shared redemption limit across Stripe Live, bank and InstaPay with full database journey tests; repair only demonstrated gaps, preserve rails and keep Live off.

- [x] Audit manual-transfer and Stripe journeys separately; repair lossy offer-page Stripe selection, verify shared capacity and preserve source attribution/access; publish evidence matrix in docs/billing/payment-rail-verification.md, no activation.
- [ ] Complete hosted real-payment validation per rail and cross-rail concurrency before launch; blocked by owner-controlled transactions, unpublished latest source and bank configuration if bank is required.

- [x] Install guarded Live coded-offer mapping/reservation source, strict invoice proof and neutral public billing copy; actual inventory has zero offers. No publication or activation.
- [x] Operational Live coded offers: authorized immutable admin mapping workflow, explicit once/forever review, Session discount proof and idempotent terminal reservation reconciliation implemented; no customer code or Stripe object created.
- [x] Audit existing Test/manual/admin access: one current admin-referenced Kids grant preserved despite refunded Test history; no current paid Stripe periods; non-destructive transition documented, environment-aware portal lookup preserves Test lock.
- [ ] When a paid code is configured: owner provisions its pre-created Live Coupon/Promotion Code and verifies restricted-key expansion/rounding, signed discounted invoice and hosted concurrency; no code currently exists and none will be invented.

- [x] Audit 28 unique Live mappings with zero amount mismatches, including Kids family prices; adapt signed risk events to permitted payment graph reads; price and Invoice Payment GETs returned 200; public billing Test wording removed in source. Catalogue activation and full Stripe catalogue readback remain separate; absent hypothetical offers are not blockers.

- [x] Verify owner scope correction: direct counts zero for commerce_offers, coupon_definitions and admin_access_coupons; repository audit found no usable static coded offers or prohibited Disputes/Radar reads; focused tests 129 passed, 1 schema-access skip. Future codes are not current launch blockers.

- [x] Complete method-aware hosted dispatch for all four billing routes; published mode 200 Test JSON, Live GET 405 JSON, unsigned checkout/portal POST 403 (trusted-origin/no bearer 401), unsigned webhook POST 400; both domains verified through canonical redirect, no payments.

- [x] Restore published billing mode exact-path Worker dispatch; verified checkout/portal 200 Test JSON and invalid intent 400 on the primary domain and the Lovable domain via its existing 302 canonical redirect; published Pro button selects Test with payment request blocked before reaching the server.

- [x] Add modest four-locale Stripe trust text beside package purchase controls without altering billing behavior; verify existing button/billing tests and automatic build.

- [x] Audit Live fulfillment and add isolated, signature-verified async/risk handlers and focused tests.
- [x] Apply and validate persistent Live risk holds through Lovable migrations, including atomic revocation, direct-write guards, duplicate/collision checks and concurrent renewal ordering.

- [x] Stripe Live phase 1: environment column + DB kill switch (OFF) + guard triggers
- [x] Shared server module for Test/Live separation + separate Live webhook route (Live OFF)
- [x] Tests for separation and mixing rejection
- [x] Live checkout/portal/refund source paths per product with gated hosted dispatch; latest changes remain unpublished.
- [x] Register 28 Live price mappings including Kids family and Academic assistant variants; actual catalogue activation is separate.
- [ ] Register Live webhook URL in Stripe + publish (blocked: owner approval)
