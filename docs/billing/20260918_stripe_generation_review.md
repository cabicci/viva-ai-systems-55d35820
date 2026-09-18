# Stripe re-subscription correction — source review

Owner direction: coding and verification are performed directly through GitHub.
Lovable is reserved for operations unavailable through direct access. The coding
run `umsg_01m2v189yhf3xthajxbj0x4v2c` was stopped at `f4d6bf1`.

## Corrected behavior

- An intentional repurchase starts an unpaid generation; suspended/refunded
  subscriptions remain blocked. A per-user PostgreSQL advisory transaction lock
  also serializes first-row initialization.
- One durable checkout intent survives retries and time-window changes. A changed
  selection waits for an in-flight creation; an existing session is expired at
  Stripe before its exact generation/session can be closed and replaced. A payment
  racing expiration aborts replacement. Stripe idempotency uses the generation.
- Paid entitlement requires the paid invoice/session to reference the current
  subscription and latest invoice, and one unambiguous matching paid price.
  Current `pricing.price_details.price` and legacy line shapes are supported;
  unused-time credits and unrelated manual invoice items cannot authorize a plan.
- Metadata-only events have an ordering watermark and cannot reactivate terminal
  state. Payment transitions retain their own watermark so a newer metadata-only
  notification does not discard a valid payment. Rejected events are observable.
- Shared code lives inside `supabase/functions/_shared` for Edge deployment.
- Rollback restores only the captured deployed Checkout/Webhook RPC definitions;
  it does not replay entire historical migrations or reseed the catalog.

## Local validation

`bunx vitest run --config vitest.billing.config.ts`

The suite runs the actual checkout coordinator, paid-price decision code, HTTP
handler rejection paths, and SQL functions in in-memory PostgreSQL via PGlite.
It covers re-purchase, repeat requests, changed selections, in-flight conflicts,
payment/expiration races, paid proration, unpaid upgrades, stale metadata,
generation mismatch, replay, service-only access and rollback preservation.
PGlite serializes local requests; this is not a multi-process PostgreSQL load test.
No Stripe requests, customer records, payment transactions or persistent databases
are created by the suite. Each database is closed after its test file.

Focused TypeScript validation includes both Edge entrypoints and the tests, using
a test-only Deno declaration outside the repository. Full application CI remains
the required repository gate; a local billing run does not substitute for it.

## Deployment hold and exact next operations

The SQL stays in `docs/billing`, outside automatic migrations. Do not deploy these
DB-dependent functions until the existing Backup/Restore gate is satisfied:
encrypted full logical backup, isolated restore, schema/row/RLS/function checks,
and recorded recovery timing. Scope includes auth, public, billing, entitlement
and webhook records, roles/grants and extensions. Storage objects and secrets
require separate recovery handling. A function-only rollback is not a backup.

Before rollout, establish that no legacy open Checkout session or active Sandbox
subscription can accept payment with pre-generation metadata. Confirm this through
the authorized Sandbox access; do not infer it from an internal canceled row.
Apply the reviewed SQL atomically, deploy the two matching functions with their
shared modules, then perform one controlled signed Sandbox journey, portal upgrade,
failed payment and replay. Frontend Publish and Live remain outside this change.
Rollback restores matching previous Edge code and the captured RPC definitions;
it preserves nullable provenance columns and does not undo historical row changes.

## Cleanup still open

Internal test subscription: `7b7e5d64-6598-445f-846a-b10b9b0c63f5`.
Last read-only inventory: expired/canceled, inactive gateway mapping, four payment
transactions and twelve subscription events. Stripe customer:
`cus_VHZuia6kqMalf6`. Keep replay protection until dependency-safe cleanup is
executed. Provider-retained paid invoices/events and reusable catalog/portal
configuration must be distinguished from deletable trial records. Do not delete
the owner's account or learning progress. Zero active subscriptions is not proof
that all test effects have been removed.

Reference for invoice line shapes: https://docs.stripe.com/api/invoice-line-item/object
Reference for expiration semantics: https://docs.stripe.com/api/checkout/sessions/expire
