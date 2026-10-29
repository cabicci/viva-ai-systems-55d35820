# Roadmap

- [x] Install guarded Live coded-offer mapping/reservation source, strict invoice proof and neutral public billing copy; actual inventory has zero offers. No publication or activation.
- [ ] Operational Live coded offers (owner supersedes deferral): add verified admin mapping provisioning and terminal-attempt reconciliation; no customer code or Stripe object creation.
- [ ] Audit existing Test/manual/admin access and recommend non-destructive Live transition; preserve every entitlement and keep all Live controls off.

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
- [ ] Live checkout/portal/refund paths per product (blocked: owner approval + Live secrets)
- [ ] Create Live prices in Cabicci LLC Stripe account (blocked: Live account access/approval)
- [ ] Register Live webhook URL in Stripe + publish (blocked: owner approval)
