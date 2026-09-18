import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { createDisposableBillingDatabase, type DisposableDatabase } from "../../../../scripts/billing/disposable-db";

const runIntegration = process.env.BILLING_DISPOSABLE_DB === "1" ? describe : describe.skip;

const userId = randomUUID();
const proPlanId = randomUUID();
const plusPlanId = randomUUID();
const proPriceId = randomUUID();
const plusPriceId = randomUUID();
const subscriptionId = randomUUID();
let database: DisposableDatabase;
let client: Client;

const call = async <T>(sql: string, values: unknown[] = []): Promise<T> => {
  const result = await client.query(sql, values);
  return result.rows[0] as T;
};

const checkout = (idempotencyKey: string) => call<{ result: Record<string, unknown> }>(
  "select public.prepare_stripe_checkout($1,$2,$3,'EG','EGP','month','cus_test',$4) result",
  [userId, proPlanId, proPriceId, idempotencyKey],
);

const webhook = (input: {
  eventId: string;
  eventType: string;
  effectiveAt: string;
  transition: string | null;
  planId?: string;
  priceId?: string;
  gatewaySubscriptionId?: string;
  gatewayStatus?: string;
  generation: string;
  transactionId?: string | null;
}) => call<{ result: Record<string, unknown> }>(
  `select public.apply_stripe_webhook_event(
    $1,$2,$3,$4,$5,$6,$7,$8,'cus_test',$9,$10,
    '2026-09-18T00:00:00Z','2026-10-18T00:00:00Z',false,$11,16900,'EGP',
    jsonb_build_object('checkout_generation',$12::text)
  ) result`,
  [
    input.eventId,
    input.eventType,
    input.effectiveAt,
    input.transition,
    subscriptionId,
    userId,
    input.planId ?? proPlanId,
    input.priceId ?? proPriceId,
    input.gatewaySubscriptionId ?? "sub_new",
    input.gatewayStatus ?? "active",
    input.transactionId ?? null,
    input.generation,
  ],
);

runIntegration("Stripe re-subscription generation guard", () => {
  beforeAll(async () => {
    database = await createDisposableBillingDatabase();
    client = new Client({ connectionString: database.url, ssl: false });
    await client.connect();
    const baseSchema = await Bun.file("supabase/migrations/20260709190000_billing_schema_phase1.sql").text();
    const stateMachine = await Bun.file("supabase/migrations/20260722180000_billing_launch_closure_contracts_v3.sql").text();
    const guard = await Bun.file("docs/billing/20260918_stripe_resubscription_generation_guard.sql").text();

    await client.query(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select jsonb_build_object('role', current_setting('request.jwt.claim.role', true))
      $$;
      create or replace function gen_random_uuid() returns uuid language sql volatile as $$
        select md5(random()::text || clock_timestamp()::text)::uuid
      $$;
    `);
    await client.query(baseSchema);
    await client.query(`
      create or replace function billing.is_service_role_caller() returns boolean
      language sql stable as $$ select current_setting('request.jwt.claim.role', true) = 'service_role' $$;
    `);
    const stateSection = stateMachine.slice(stateMachine.indexOf("ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_effective_at"), stateMachine.indexOf("-- ============================================================================\n-- SECTION G."));
    await client.query(stateSection);
    await client.query(guard.replace(/^\\ir.*$/gm, ""));
    await client.query("select set_config('request.jwt.claim.role','service_role',false)");
    await client.query(
      `insert into billing.subscriptions (
        id,user_id,plan_version_id,market_price_id,access_state,billing_state,
        market_code,currency_code,billing_interval,idempotency_key,expired_at
      ) values ($1,$2,$3,$4,'expired','canceled','EG','EGP','month','old-generation',now())`,
      [subscriptionId, userId, proPlanId, proPriceId],
    );
  });

  afterAll(async () => {
    await client?.end();
    await database?.cleanup();
  });

  it("keeps repeat Checkout unpaid and deduplicated, then activates the paid repurchase", async () => {
    const first = await checkout("checkout-new");
    const second = await checkout("checkout-new");
    expect(second.result.checkout_generation).toBe(first.result.checkout_generation);

    const unpaid = await call<{ access_state: string; billing_state: string }>(
      "select access_state,billing_state from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    expect(unpaid).toMatchObject({ access_state: "free_active", billing_state: "checkout_pending" });

    const paid = await webhook({
      eventId: "evt_paid_new",
      eventType: "invoice.paid",
      effectiveAt: "2026-09-18T10:00:00Z",
      transition: "payment_succeeded",
      generation: String(first.result.checkout_generation),
      transactionId: "in_paid_new",
    });
    expect(paid.result).toMatchObject({ processed: true, plan_updated: true });
    const active = await call<{ access_state: string; plan_version_id: string }>(
      "select access_state,plan_version_id from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    expect(active).toMatchObject({ access_state: "paid_active", plan_version_id: proPlanId });
  });

  it("does not grant a pending or failed Pro Plus upgrade", async () => {
    const current = await call<{ checkout_generation: string }>(
      "select checkout_generation from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    const pending = await webhook({
      eventId: "evt_upgrade_pending",
      eventType: "customer.subscription.updated",
      effectiveAt: "2026-09-18T10:05:00Z",
      transition: null,
      planId: plusPlanId,
      priceId: plusPriceId,
      gatewayStatus: "active",
      generation: current.checkout_generation,
    });
    expect(pending.result).toMatchObject({ processed: true, plan_updated: false });
    const failed = await webhook({
      eventId: "evt_upgrade_failed",
      eventType: "invoice.payment_failed",
      effectiveAt: "2026-09-18T10:06:00Z",
      transition: "payment_failed",
      planId: plusPlanId,
      priceId: plusPriceId,
      gatewayStatus: "past_due",
      generation: current.checkout_generation,
    });
    expect(failed.result).toMatchObject({ processed: true, plan_updated: false });
    const row = await call<{ plan_version_id: string; access_state: string }>(
      "select plan_version_id,access_state from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    expect(row).toMatchObject({ plan_version_id: proPlanId, access_state: "past_due" });
  });

  it("applies the paid proration invoice to the same subscription and upgrades the plan", async () => {
    const current = await call<{ checkout_generation: string }>(
      "select checkout_generation from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    const paidUpgrade = await webhook({
      eventId: "evt_upgrade_paid",
      eventType: "invoice.paid",
      effectiveAt: "2026-09-18T10:07:00Z",
      transition: "payment_succeeded",
      planId: plusPlanId,
      priceId: plusPriceId,
      gatewayStatus: "active",
      generation: current.checkout_generation,
      transactionId: "in_proration_paid",
    });
    expect(paidUpgrade.result).toMatchObject({ processed: true, plan_updated: true });
    const row = await call<{ plan_version_id: string; access_state: string; gateway_subscription_id: string }>(
      `select s.plan_version_id,s.access_state,gs.gateway_subscription_id
       from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
       where s.id=$1`,
      [subscriptionId],
    );
    expect(row).toMatchObject({
      plan_version_id: plusPlanId,
      access_state: "paid_active",
      gateway_subscription_id: "sub_new",
    });
  });

  it("cancels and rejects old-generation replay without relabeling it processed", async () => {
    const current = await call<{ checkout_generation: string }>(
      "select checkout_generation from billing.subscriptions where id=$1",
      [subscriptionId],
    );
    const canceled = await webhook({
      eventId: "evt_cancel_new",
      eventType: "customer.subscription.deleted",
      effectiveAt: "2026-09-18T10:08:00Z",
      transition: "canceled",
      planId: plusPlanId,
      priceId: plusPriceId,
      gatewayStatus: "canceled",
      generation: current.checkout_generation,
    });
    expect(canceled.result).toMatchObject({ processed: true });

    const replay = await webhook({
      eventId: "evt_old_generation",
      eventType: "invoice.paid",
      effectiveAt: "2026-09-18T09:00:00Z",
      transition: "payment_succeeded",
      gatewaySubscriptionId: "sub_old",
      generation: randomUUID(),
      transactionId: "in_old",
    });
    expect(replay.result).toMatchObject({ processed: false, reason: "CHECKOUT_GENERATION_MISMATCH" });
    const evidence = await call<{ status: string; error_code: string; access_state: string; plan_version_id: string }>(
      `select w.status,w.error_code,s.access_state,s.plan_version_id
       from billing.webhook_events w cross join billing.subscriptions s
       where w.gateway_event_id='evt_old_generation' and s.id=$1`,
      [subscriptionId],
    );
    expect(evidence).toMatchObject({
      status: "failed",
      error_code: "CHECKOUT_GENERATION_MISMATCH",
      access_state: "expired",
      plan_version_id: plusPlanId,
    });
  });
});