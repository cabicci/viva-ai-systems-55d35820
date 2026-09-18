import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const runIntegration = process.env.BILLING_DISPOSABLE_DB === "1" ? describe : describe.skip;
const port = 55439;
const databaseUrl = `postgresql://lovable@127.0.0.1:${port}/postgres?sslmode=disable`;
let dataDirectory = "";

const sql = (statement: string): string => {
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-t", "-A"], {
    encoding: "utf8",
    input: statement,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
};

const queryJson = (statement: string): Record<string, unknown> => JSON.parse(sql(statement));

const userId = randomUUID();
const proPlanId = randomUUID();
const plusPlanId = randomUUID();
const proPriceId = randomUUID();
const plusPriceId = randomUUID();
const subscriptionId = randomUUID();

const checkout = (key: string) => queryJson(`select public.prepare_stripe_checkout(
  '${userId}','${proPlanId}','${proPriceId}','EG','EGP','month','cus_test','${key}'
)::text`);

const webhook = (input: {
  eventId: string;
  eventType: string;
  effectiveAt: string;
  transition: string | null;
  generation: string;
  planId?: string;
  priceId?: string;
  gatewaySubscriptionId?: string;
  gatewayStatus?: string;
  transactionId?: string | null;
}) => queryJson(`select public.apply_stripe_webhook_event(
  '${input.eventId}','${input.eventType}','${input.effectiveAt}',${input.transition ? `'${input.transition}'` : "null"},
  '${subscriptionId}','${userId}','${input.planId ?? proPlanId}','${input.priceId ?? proPriceId}',
  'cus_test','${input.gatewaySubscriptionId ?? "sub_new"}','${input.gatewayStatus ?? "active"}',
  '2026-09-18T00:00:00Z','2026-10-18T00:00:00Z',false,
  ${input.transactionId ? `'${input.transactionId}'` : "null"},16900,'EGP',
  jsonb_build_object('checkout_generation','${input.generation}')
)::text`);

runIntegration("Stripe re-subscription generation guard", () => {
  beforeAll(() => {
    dataDirectory = mkdtempSync(join(tmpdir(), "masaarat-billing-pg-"));
    spawnSync("chown", ["-R", "1000:1000", dataDirectory]);
    const init = spawnSync("setpriv", ["--reuid=1000", "--regid=1000", "--init-groups", "initdb", "-D", dataDirectory, "-A", "trust"], { encoding: "utf8" });
    if (init.status !== 0) throw new Error(init.stderr || init.stdout);
    const start = spawnSync("setpriv", ["--reuid=1000", "--regid=1000", "--init-groups", "pg_ctl", "-D", dataDirectory, "-o", `-k /tmp -p ${port} -h 127.0.0.1`, "-w", "start"], { encoding: "utf8" });
    if (start.status !== 0) throw new Error(start.stderr || start.stdout);

    sql(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select jsonb_build_object('role', current_setting('request.jwt.claim.role', true))
      $$;
    `);
    sql(readFileSync("supabase/migrations/20260709190000_billing_schema_phase1.sql", "utf8"));
    sql(`create or replace function billing.is_service_role_caller() returns boolean language sql stable as $$
      select current_setting('request.jwt.claim.role', true) = 'service_role'
    $$`);
    const machine = readFileSync("supabase/migrations/20260722180000_billing_launch_closure_contracts_v3.sql", "utf8");
    sql(machine.slice(
      machine.indexOf("ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_effective_at"),
      machine.indexOf("-- ============================================================================\n-- SECTION G."),
    ));
    sql(readFileSync("docs/billing/20260918_stripe_resubscription_generation_guard.sql", "utf8"));
    sql(`select set_config('request.jwt.claim.role','service_role',false);
      insert into billing.subscriptions (
        id,user_id,plan_version_id,market_price_id,access_state,billing_state,
        market_code,currency_code,billing_interval,idempotency_key,expired_at
      ) values (
        '${subscriptionId}','${userId}','${proPlanId}','${proPriceId}','expired','canceled',
        'EG','EGP','month','old-generation',now()
      );`);
  }, 30_000);

  afterAll(() => {
    if (dataDirectory) {
      spawnSync("setpriv", ["--reuid=1000", "--regid=1000", "--init-groups", "pg_ctl", "-D", dataDirectory, "-m", "immediate", "stop"]);
      rmSync(dataDirectory, { recursive: true, force: true });
    }
  });

  it("deduplicates unpaid Checkout, then activates the paid repurchase", () => {
    const first = checkout("checkout-new");
    const second = checkout("checkout-new");
    expect(second.checkout_generation).toBe(first.checkout_generation);
    expect(sql(`select access_state||':'||billing_state from billing.subscriptions where id='${subscriptionId}'`))
      .toBe("free_active:checkout_pending");

    const paid = webhook({
      eventId: "evt_paid_new", eventType: "invoice.paid", effectiveAt: "2026-09-18T10:00:00Z",
      transition: "payment_succeeded", generation: String(first.checkout_generation), transactionId: "in_paid_new",
    });
    expect(paid).toMatchObject({ processed: true, plan_updated: true });
    expect(sql(`select access_state from billing.subscriptions where id='${subscriptionId}'`)).toBe("paid_active");
  });

  it("keeps pending or failed Pro Plus unpaid", () => {
    const generation = sql(`select checkout_generation from billing.subscriptions where id='${subscriptionId}'`);
    expect(webhook({
      eventId: "evt_upgrade_pending", eventType: "customer.subscription.updated", effectiveAt: "2026-09-18T10:05:00Z",
      transition: null, generation, planId: plusPlanId, priceId: plusPriceId,
    })).toMatchObject({ processed: true, plan_updated: false });
    expect(webhook({
      eventId: "evt_upgrade_failed", eventType: "invoice.payment_failed", effectiveAt: "2026-09-18T10:06:00Z",
      transition: "payment_failed", generation, planId: plusPlanId, priceId: plusPriceId, gatewayStatus: "past_due",
    })).toMatchObject({ processed: true, plan_updated: false });
    expect(sql(`select plan_version_id||':'||access_state from billing.subscriptions where id='${subscriptionId}'`))
      .toBe(`${proPlanId}:past_due`);
  });

  it("applies a paid proration invoice to the same subscription", () => {
    const generation = sql(`select checkout_generation from billing.subscriptions where id='${subscriptionId}'`);
    expect(webhook({
      eventId: "evt_upgrade_paid", eventType: "invoice.paid", effectiveAt: "2026-09-18T10:07:00Z",
      transition: "payment_succeeded", generation, planId: plusPlanId, priceId: plusPriceId,
      transactionId: "in_proration_paid",
    })).toMatchObject({ processed: true, plan_updated: true });
    expect(sql(`select s.plan_version_id||':'||s.access_state||':'||gs.gateway_subscription_id
      from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
      where s.id='${subscriptionId}'`)).toBe(`${plusPlanId}:paid_active:sub_new`);
  });

  it("cancels and rejects an old-generation replay observably", () => {
    const generation = sql(`select checkout_generation from billing.subscriptions where id='${subscriptionId}'`);
    expect(webhook({
      eventId: "evt_cancel_new", eventType: "customer.subscription.deleted", effectiveAt: "2026-09-18T10:08:00Z",
      transition: "canceled", generation, planId: plusPlanId, priceId: plusPriceId, gatewayStatus: "canceled",
    })).toMatchObject({ processed: true });
    expect(webhook({
      eventId: "evt_old_generation", eventType: "invoice.paid", effectiveAt: "2026-09-18T09:00:00Z",
      transition: "payment_succeeded", generation: randomUUID(), gatewaySubscriptionId: "sub_old", transactionId: "in_old",
    })).toMatchObject({ processed: false, reason: "CHECKOUT_GENERATION_MISMATCH" });
    expect(sql(`select w.status||':'||w.error_code||':'||s.access_state||':'||s.plan_version_id
      from billing.webhook_events w cross join billing.subscriptions s
      where w.gateway_event_id='evt_old_generation' and s.id='${subscriptionId}'`))
      .toBe(`failed:CHECKOUT_GENERATION_MISMATCH:expired:${plusPlanId}`);
  });
});