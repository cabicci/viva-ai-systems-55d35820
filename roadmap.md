# Roadmap

- [x] Audit Live fulfillment and add isolated, signature-verified async/risk handlers and focused tests.
- [x] Apply and validate persistent Live risk holds through Lovable migrations, including atomic revocation, direct-write guards, duplicate/collision checks and concurrent renewal ordering.

- [x] Stripe Live phase 1: environment column + DB kill switch (OFF) + guard triggers
- [x] Shared server module for Test/Live separation + separate Live webhook route (Live OFF)
- [x] Tests for separation and mixing rejection
- [ ] Live checkout/portal/refund paths per product (blocked: owner approval + Live secrets)
- [ ] Create Live prices in Cabicci LLC Stripe account (blocked: Live account access/approval)
- [ ] Register Live webhook URL in Stripe + publish (blocked: owner approval)
