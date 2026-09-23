# C01 Stripe Live isolation — review slice, 23 September 2026

Status: code and SQL review only. TEST remains the active checkout, webhook, portal,
and refund path. Do not run the SQL in production, configure Live secrets, enable
Live, or make a real charge or refund from this change.

## Diff and boundaries

- `supabase/functions/_shared/stripe-environment.ts` defaults to TEST. Existing
  checkout, webhook and portal call it with TEST credentials only. The separate
  `STRIPE_LIVE_SECRET_KEY` can be selected by server code only with an explicit
  `live` argument and `BILLING_STRIPE_LIVE_ENABLED=true`; no route selects it.
- `20260923_stripe_live_catalog_isolation.sql` is a **manual draft under docs**,
  outside `supabase/migrations`, so a repository merge cannot auto apply it. It
  introduces `stripe_us_live` alongside `stripe_us` TEST, a unique Live price ID,
  and four service-role-only Live catalog/context RPCs. The existing TEST RPCs
  remain separate. No Live customer, subscription, event or refund write path
  is supplied here.
- `20260923_stripe_live_catalog_isolation.rollback.sql` refuses to reverse the
  constraint changes when any Live gateway mapping, customer, subscription,
  event, transaction or refund exists. Remove such data only through a separately
  reviewed recovery procedure; this rollback never deletes business records.

## Isolated proof

Run `vitest run src/lib/billing/__tests__/stripe-environment.test.ts
src/lib/billing/__tests__/stripe-live-catalog-isolation.integration.test.ts`.
The PGlite integration creates a disposable schema, proves TEST and Live price
lookups remain separate, checks service-role access, conflicts and Live price
uniqueness, then rehearses failed and clean rollback while keeping TEST data.
No production database or Stripe account is used.

## Before any apply or Live route

Central must record the reviewed scope in Roadmap and the two continuation files.
Owner review is required for a current backup, off-device recovery and rollback,
security and release gates, tax/price/legal decisions, Live credentials and
webhook endpoint. Implement and test **separate** Live Checkout, signed webhook,
portal, subscription transitions, refund reconciliation, idempotency, monitoring
and incident recovery with Live identifiers end to end. Reconcile Stripe Live
catalog prices against authoritative `billing.market_prices`. Prove a canary
payment and refund only after specific authorization. Keep TEST as default
through each stage; use a separate reviewed activation approval to turn on Live.

The SQL draft is intentionally incomplete as a launch migration. In particular,
no production apply, Live event consumer, or entitlement grant is authorized.
