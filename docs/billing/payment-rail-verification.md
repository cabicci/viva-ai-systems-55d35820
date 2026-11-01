# Payment rails — 2026-10-29

Stripe Live adds a rail; it does not replace external commerce orders, manual review, InstaPay, wallet, bank configuration, or existing access. No payment, order, receipt, refund, grant, Stripe object, switch or deployment was created by this verification. Roadmap records and source/tests were updated.

## Current status

- Commerce enabled. InstaPay and wallet enabled with destination/instructions, EGP only. Bank exists but is disabled with empty instructions/destination; neither EGP nor USD bank payment is currently purchasable. Do not enable or invent bank details automatically.
- Live database gate false (no control row; installed function defaults false). Hosted and local checkout mode return `test`; this does not independently prove each environment variable's literal value or Stripe account catalogue/webhook state. No activation performed.
- Zero commerce offers, coupon definitions and admin access coupons. No actual coded paid purchase can be exercised without an owner-configured offer and reviewed Live mapping. This is not an absent-current-discount blocker: Kids family prices are registered separately.
- One InstaPay awaiting-receipt order; zero commerce entitlements. One refunded Kids Test history row, zero current paid Kids periods; one active non-Stripe/admin-referenced Kids grant preserved. Core subscriptions zero. Earlier broader continuity audit is in `live-continuity-audit.md`; re-audit all scopes immediately before switching mode.

## Journey matrix

| Step | Manual transfer | Stripe Live | Evidence / remaining boundary |
|---|---|---|---|
| Package/term/market | Five packages retain selection; authenticated annual EG quotes read through customer UI | Standard offer-page handoff repaired; 20 selection contract cases plus actual component regression | Kids annual INTL outgoing Test request intercepted before server; Live is disabled, no Session created |
| Eligibility/discount | Server quote; Kids family benefit replaces, not stacks with explicit code; expiry/cap/identity tests | 28 registered mappings; reviewed immutable coded mappings, once/forever, no stacking | Inventory tests pass where accessible; catalogue activation and real restricted-key discounted expansion/rounding still require owner validation |
| Instructions/checkout | Frozen order instructions, receipt authorization and review tested | Server mode and fail-closed checkout tested | InstaPay/wallet EGP configured; bank disabled; no USD manual rail configured |
| Confirmation/grant | Funds-verified admin confirmation; idempotent allocation, exact amount, grant and mail failure tests | Signed paid invoice and permitted graph proof; async/risk tests | Disposable/database fixture tests, not a real paid hosted journey |
| Renewal | New confirmed payment, no auto-collection; existing access expiry preserved | Paid invoice periods, once/forever discount proof, lifecycle lock | Real hosted renewal not exercised |
| Refund/cancellation | Order-scoped refund allocations; cancel pending order; no Stripe refund implied | Stripe risk holds and lifecycle events, no unrelated Render fulfillment | Manual refund RPC records a confirmed external refund; it does not send money. Real refund/cancel validation pending |
| Management | Customer Orders and admin commerce review; no Stripe portal for manual grants | Environment-aware authenticated portal, no Test-to-Live migration | Hosted route guards verified; actual managed portal and owner-controlled actions not exercised |
| Attribution/replay | Commerce order constraint rejects Stripe/Paymob; manual grants remain order-linked | Signed account/environment/payment graph, Stripe-specific entitlement references | Shared capacity test blocks Live reservation while manual order pending, and manual quote while Live reserved. Sequential disposable proof only; actual concurrent hosted redemption remains unverified |

## Hosted HTTP evidence

Read-only GETs on **both** `https://masaarat.ai` and `https://viva-ai-systems.lovable.app` (following existing redirect):

- `/api/billing/mode?intent=checkout` and `?intent=portal`: HTTP 200, JSON `{"mode":"test"}`. Unscoped portal response is a compatibility result, not a subscriber portal test.
- `?intent=bogus`: HTTP 400, JSON `{"error":"INVALID_INTENT"}`.
- `/api/stripe-live/checkout`, `/api/stripe-live/portal`, `/api/public/stripe-live-webhook`: HTTP 405, JSON `{"error":"METHOD_NOT_ALLOWED"}`.

The newly repaired offer-page source is **not published**. Hosted GET guards do not prove signed webhook processing or authenticated money-moving paths.

## Verification and launch boundary

- Focused billing/commerce/UI suites: **563 passed, 42 skipped**. The shared-capacity test also ran separately and passed. Skipped cases include unavailable native concurrency/database evidence; never count them as verified.
- Automatic compilation reported `build OK` after source changes. No separate manual production build or typecheck was run; the automatic harness owns those checks.
- Authenticated local UI: all five server transfer quotes, package selection and outgoing checkout request verified without creating an order or payment. Transfer attribution absent; Stripe attribution visible only when selected. Screenshots confirmed final states.
- Before launch: owner supplies real bank instructions if bank should be offered; authorize deployment of latest source, validate hosted authenticated transfer creation/receipt/review/access/refund and Stripe paid checkout/renewal/portal/risk behavior with controlled real transactions. Configure future codes and real mapped Coupons/Promotion Codes only when an offer exists; verify expansion and concurrent cross-rail use then.
- Preserve all users, Test records and manual/admin dates. Do not relabel, move, recreate or automatically revoke existing access. Keep Live switches off until the required validation and separately authorized launch.