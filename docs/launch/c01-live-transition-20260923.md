# C01 Stripe Live transition proposal — 23 September 2026

Status: **proposal only; TEST remains active; Live is blocked**. This document
describes the implementation and acceptance sequence. It does not authorize
credentials, database changes, real charges, refunds, or a production switch.

## Evidence and current boundary

- Source baseline: `main` at `1fff97b2305c32f88dc332dacfa8242053621199`.
  Checkout, webhook, and portal require a `rk_test_` or `sk_test_` key; the
  webhook rejects `livemode=true`; refund validation requires Test objects.
- The database functions and tables currently use `stripe_us` for Test prices,
  customers, subscriptions, events, and transactions. `gateway_price_mappings`
  is unique on `(market_price_id, gateway_code)` and `gateway_customers` on
  `(user_id, gateway_code)`. Reusing those rows for Live could send Test IDs
  to the Live API or overwrite Test history. Changing only a key is unsafe.
- Read-only production query at 2026-09-23 10:44:27 UTC: zero active provider
  links, zero internally managed paid subscriptions, zero Test customer links,
  and eight active Test price mappings. This is a point-in-time result, not a
  guarantee about later subscriptions.
- The same production catalog has eight active published price combinations.
  The table below records their current minor units; these are not approved
  Live Products or Prices and must be confirmed by the owner at activation.
- Stripe account visible to the connected reader: Cabicci LLC, Live mode.
  Its connected context does not expose the Test account or authorize a charge.
  Read-only Live inventory on 2026-09-23: one unrelated active product named
  `Render`, zero webhook endpoints, and zero active tax registrations. None of
  the eight Masaarat combinations is a verified Live product/price.

## Required implementation slice

1. Preserve existing `stripe_us` rows and endpoints as Test. Add distinct Live
   gateway identity (proposed `stripe_us_live`) to the required billing tables,
   unique constraints, RPC queries, and event/transaction provenance. Apply an
   additive, reversible migration only after a fresh encrypted backup and a
   disposable restore/rehearsal. Never rewrite historic Test identifiers.
2. Introduce explicit server configuration, defaulting to Test. Keep the
   existing `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` scoped to Test.
   Configure separate write-only `STRIPE_LIVE_SECRET_KEY` (prefer a restricted
   key with reviewed permissions) and `STRIPE_LIVE_WEBHOOK_SECRET` only after
   authorization. Reject missing or mismatched mode/key/endpoint combinations
   before any Stripe or database write. Do not put a secret in Vite/client code.
3. Deploy separately named Live Checkout, webhook, and portal endpoints, or an
   equivalently isolated server route with a verified independent mode boundary.
   The signed webhook must verify its own Live secret and assert
   `event.livemode===true`; Test continues to assert false. Refund evidence must
   assert the same mode across payment, invoice, subscription, and intent.
4. Register Live Products and Prices per plan/market/interval from the approved
   `billing.market_prices` rows. Do not copy Test `price_` or `cus_` IDs. Persist
   Live mappings under the Live gateway identity. Compare amount, currency,
   interval, tax behavior, and product name before opening Checkout. Keep
   subscription metadata and idempotency keys mode-specific.
5. Add a server-controlled, default-off gate for *new* Live Checkouts. The
   browser never chooses billing mode. The kill switch closes new Checkout
   creation without dropping webhook processing for existing subscriptions.
   Ensure existing subscriptions and Portal route to their own environment.
6. Tests before migration/merge: Test key rejects Live endpoint and vice versa;
   a signed Test event cannot process on Live or the reverse; Test IDs cannot
   resolve in Live; wrong price/currency/plan fails closed; replay remains
   idempotent; a failed Live write grants no entitlement; Portal/refund respect
   mode; database grants remain service-role only; rollback preserves Test
   records. Run Billing integration on isolated PostgreSQL, then CI and the
   affected browser checkout journey. `skipped` is not a pass.

The current repository has **none of this Live separation implemented**. The
slice must be reviewed as a code/SQL diff with a runnable rollback before any
Live environment configuration. The TEST matrix accepted in Report 35 is
retained and is not rerun without a relevant code change.

## Configuration and owner decisions

| Boundary | TEST now | Proposed Live after approval |
| --- | --- | --- |
| Secret key | `STRIPE_SECRET_KEY`, Test prefix | Separate `STRIPE_LIVE_SECRET_KEY`, Live prefix, server-only |
| Webhook | `STRIPE_WEBHOOK_SECRET`, signed Test events | Separate destination and `STRIPE_LIVE_WEBHOOK_SECRET`, signed Live events |
| Catalog and customers | `stripe_us`, eight active Test price mappings | `stripe_us_live`, new verified Live mappings and customers |
| Checkout route | Existing TEST endpoint | Separate default-off Live endpoint/gate |
| Tax | Existing published prices, no new automation | Owner/tax-adviser decision; verify registrations before considering Stripe Tax |

The owner must specify: which legal seller and Stripe account; permitted
countries (EG and/or INTL), currency per market, published monthly/annual
amounts, tax treatment and tax registrations, refund policy, and one controlled
real purchase amount/account and its authorized refund. Do not infer that
`automatic_tax` collects anything without active registrations. No real card
details or secret values belong in the review thread.

| Plan | Egypt month / year (EGP minor units) | International month / year (USD minor units) |
| --- | ---: | ---: |
| Pro | 16,900 / 169,000 | 699 / 6,990 |
| Pro Plus | 30,900 / 309,000 | 1,299 / 12,990 |

Candidate controlled purchase for explicit review: one Egypt Pro monthly
subscription at the currently published 16,900 EGP minor units (169 EGP),
using the owner's authorized test identity and real payment instrument; then
refund that exact invoice amount and cancel renewal after inspecting the
signed events and entitlement. The owner must approve this amount, account,
refund, market and tax handling before any real operation. If Egypt checkout
is not supported by the account or tax decision, select an approved market
and published amount before attempting a transaction.

## Controlled activation and rollback

After explicit authorization, first reconcile the approved catalog and
credentials through the authorized owner route. Apply/rehearse the additive
migration and deploy mode-separated handlers with the Live Checkout gate off;
verify both webhook signatures and Test isolation. Enable the gate only for the
approved controlled purchase; inspect Checkout, signed webhook, invoice,
entitlement (Pro without Builder or Plus with Builder), amount/currency, and
replay. Then execute the separately authorized refund/cancel and verify access
and accounting. Keep records needed for replay and reconciliation.

If acceptance fails, close **new** Live Checkout immediately and return the
frontend to TEST or a clearly disabled purchase state. Continue receiving and
processing signed Live webhook events for any existing real subscription; do
not blindly disable that destination. Revert the corresponding code release if
needed, retain mode-tagged rows and financial audit trail, and reconcile any
real charge/refund with Stripe. SQL rollback must be tested against the exact
deployed definitions before use; a destructive restore is not the first
rollback step. Record exact source SHA and deployment ID at activation.

References: Report 40, checklist rows 15–17 (LC-25/26/27/28, MEP-047/058),
Report 35 TEST acceptance, `supabase/functions/billing-stripe-{checkout,webhook,portal}`,
`supabase/functions/_shared/stripe-refunds.ts`, and the existing billing SQL.
