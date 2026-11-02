# Commercial policy implementation — review record

Branch: `codex/packages-policy-20261102` in `cabicci/viva-ai-systems-55d35820`.
Base: `da69a7ba44395f8e06632c0c6143b38447d3d32f`.
Owner policy: [approved-commercial-policy-2026-11-02.md](approved-commercial-policy-2026-11-02.md).

## Release state

Prepared in the existing repository. No merge, database migration, website publication, live customer payment, or customer-subscription mutation was performed. The owner confirmed there are no current site subscriptions; an unnecessary existing-subscription migration script was removed before delivery.

Two explicitly authorized Stripe LIVE catalogue prices were created and read back. Their identifiers and verified amounts are recorded in [stripe-live-catalogue-2026-11-02.json](stripe-live-catalogue-2026-11-02.json). Catalogue creation does not publish their website checkout.

## Implemented behavior

- Unified server-side question reservation and settlement across AI, Academic, Technical and Kids. Grounded answers debit once; insufficient information and system errors do not. Stable retry identities and response proof validation protect against duplicate charging.
- Owner-requested administrator exception: protected platform administrators use the assistant across all curricula without question quotas or billing. Ordinary users retain their plan limits; administrator status is checked on the server and revocation is enforced.
- The first assistant opening in a session shows a permissions and balance popup with an acknowledgement action. Acknowledgement is scoped to the signed-in account and session.
- Anniversary monthly allowances, Cairo daily out-of-course counter, additive scoped paid/invitation pools, separate child allowances and shared nonexpiring family top-ups.
- Lifetime purchase of exactly one curriculum; Kids rights belong to one selected owned child. Initial 100-question allowance lasts one month only. Existing lesson, ownership, consent, release, role and risk guards remain enforced.
- One-time checkout uses the shared Live gates, registered prices and customer ownership. Signed webhook fulfillment verifies the Session, price, customer, PaymentIntent and charge, then atomically grants the bound right or credit. Refund/risk holds cannot be undone by later ordinary events.
- Invitation acceptance starts its configured duration. The recipient sees covered curricula and the allowance before accepting.
- Multiple concurrent invitations for the same email/account are allowed. Each comprehensive invitation contributes its own 300 monthly questions for its granted curricula, with independent acceptance, renewal, expiry and revocation.
- A separate single-curriculum invitation contributes 100 monthly questions throughout its validity. No subscription is required; multiple curriculum invitations for one email remain independent. Comprehensive invitations retain their 300-question pool.
- One best eligible discount; explicit top-up coupon scope; configurable first-payment, specified-month or ongoing subscription discounts. Manual renewals preserve their original term and do not consume a second campaign slot. Refunded or revoked origin payments cannot keep their renewal discount.
- Existing-period protection remains in code for future releases. No separate Academic assistant activation charge for new purchases.

## Local verification

- Assistant/runtime/access/worker/currentness suites: 575 passing tests across 20 files, including actual shared runtime-to-SQL execution.
- Complete billing configuration: 211 passing tests; two environment-dependent checks skipped. The skipped checks were not represented as live validation.
- Combined new policy SQL, coupon SQL and purchase/invitation UI: 33 passing tests. These overlap some focused reports; counts must not be added to claim a unique total.
- Owner follow-up SQL verification: 19 passing tests, including unlimited administrators in four areas, 100-question invitations without subscriptions, independent invitation pools and role revocation. Follow-up invitation/schema/mail/benefit UI checks: 38 passing tests; combined coupon migration replay: 9 passing tests.
- Session permissions popup: 20 passing tests, covering all four locales, acknowledgement, reopening, separate accounts, new sign-ins, failed balance loading and administrator display. The server derives a noncredential session key from the verified sign-in; access decisions remain server-side.
- Final post-popup compatibility run: all 195 existing assistant currentness/ownership tests passed against the acknowledged-session fixtures. No identity, retirement or transport-retry assertions were removed.
- Complete GitHub assistant suite at `d7188ffa2e1819deecdceef6b7b3c66ac7da3b9c`: all 1,051 tests across 65 files passed, including the session-retirement correction. Local Windows source-hash checks depend on checking out the pinned SQL with its exact Git line endings; the complete Linux run verified the repository bytes directly.
- Independent payment review found and corrected the binding RPC response shape, expired unpaid checkout retry, coupon-only top-up presentation, and shared customer-registration integration.
- Final post-review TypeScript checking, the standard production build, and whitespace verification passed. The production build includes assistant integration, roadmap and 400 contextual-asset guards.

The tests used local fixtures/PGlite, without production queries, live test charges or provider-generated assistant answers. They do not replace an authorized post-publication user purchase/answer check.

The final-unit reservation test submits concurrent requests through one PGlite connection; it verifies serialized allocation and replay behavior. It is not a multi-connection hosted PostgreSQL load test.

## Applying the reviewed change

After owner review, merge this same branch and apply Drizzle migrations `0027_commercial_policy_20261102.sql` and `0028_commercial_offer_policy.sql` through the existing release process. Do not run a second Supabase migration copy. Publish the existing Masaarat project when authorized. No new Lovable project, database project or Stripe account is required.
