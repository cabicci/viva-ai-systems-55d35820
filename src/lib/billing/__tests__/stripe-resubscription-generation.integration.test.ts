import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

let db: PGlite;
const sql = async (statement: string): Promise<string> => {
  const result = await db.exec(statement);
  const rows = result.at(-1)?.rows ?? [];
  return rows.map((row) => Object.values(row as Record<string, unknown>).join("|")).join("\n");
};
const queryJson = async (statement: string): Promise<Record<string, unknown>> =>
  JSON.parse(await sql(statement));

const userId = randomUUID();
const proPlanId = randomUUID();
const plusPlanId = randomUUID();
const proPriceId = randomUUID();
const plusPriceId = randomUUID();
const subscriptionId = randomUUID();

const checkout = (key: string) =>
  queryJson(`select public.prepare_stripe_checkout(
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
}) =>
  queryJson(`select public.apply_stripe_webhook_event(
  '${input.eventId}','${input.eventType}','${input.effectiveAt}',${input.transition ? `'${input.transition}'` : "null"},
  '${subscriptionId}','${userId}','${input.planId ?? proPlanId}','${input.priceId ?? proPriceId}',
  'cus_test','${input.gatewaySubscriptionId ?? "sub_new"}','${input.gatewayStatus ?? "active"}',
  '2026-09-18T00:00:00Z','2026-10-18T00:00:00Z',false,
  ${input.transactionId ? `'${input.transactionId}'` : "null"},16900,'EGP',
  jsonb_build_object('checkout_generation','${input.generation}')
)::text`);

describe("Stripe re-subscription generation guard", async () => {
  beforeAll(async () => {
    db = new PGlite();
    const setupSql = `
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create or replace function auth.jwt() returns jsonb language sql stable as $$
        select jsonb_build_object('role', current_setting('request.jwt.claim.role', true))
      $$;
    `;
    const baseSchema = readFileSync(
      "supabase/migrations/20260709190000_billing_schema_phase1.sql",
      "utf8",
    );
    const serviceRoleFunction = `create or replace function billing.is_service_role_caller() returns boolean language sql stable as $$
      select current_setting('request.jwt.claim.role', true) = 'service_role'
    $$;`;
    const machine = readFileSync(
      "supabase/migrations/20260722180000_billing_launch_closure_contracts_v3.sql",
      "utf8",
    );
    const machineSection = machine.slice(
      machine.indexOf(
        "ALTER TABLE billing.subscriptions ADD COLUMN IF NOT EXISTS last_applied_effective_at",
      ),
      machine.indexOf(
        "-- ============================================================================\n-- SECTION G.",
      ),
    );
    const guard = readFileSync(
      "docs/billing/20260918_stripe_resubscription_generation_guard.sql",
      "utf8",
    );
    const repeatedFailure = readFileSync(
      "docs/billing/20260920_repeated_payment_failure.sql",
      "utf8",
    );
    await sql(`${setupSql}\n${baseSchema}\n${serviceRoleFunction}\n${machineSection}\n${guard}\n${repeatedFailure}\n
      select set_config('request.jwt.claim.role','service_role',false);
      insert into billing.entitlement_policy_versions (
        id,policy_key,version_number,status,effective_from,lesson_allowlist_mode,
        builder_access,video_access,rag_enabled,mission_evaluation_enabled,
        reveal_answer_enabled,wow_path_enabled
      ) values (
        '00000000-0000-0000-0000-000000000011','test',1,'published',now(),
        'explicit_list',true,true,true,true,true,true
      );
      insert into billing.refund_policy_versions (
        id,policy_key,version_number,status,effective_from,
        annual_to_monthly_conversion_enabled,proration_method
      ) values (
        '00000000-0000-0000-0000-000000000012','test',1,'published',now(),false,'daily'
      );
      insert into billing.plan_catalog (id,plan_key,display_name,plan_family)
      values
        ('00000000-0000-0000-0000-000000000013','pro','{}','paid'),
        ('00000000-0000-0000-0000-000000000014','pro_plus','{}','paid');
      insert into billing.plan_versions (
        id,plan_id,entitlement_policy_version_id,refund_policy_version_id,
        version_number,billing_interval,status,effective_from
      ) values
        ('${proPlanId}','00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000012',1,'month','published',now()),
        ('${plusPlanId}','00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000012',1,'month','published',now());
      insert into billing.market_prices (
        id,plan_version_id,market_code,currency_code,amount_minor,tax_behavior,status,effective_from
      ) values
        ('${proPriceId}','${proPlanId}','EG','EGP',16900,'exclusive','active',now()),
        ('${plusPriceId}','${plusPlanId}','EG','EGP',30900,'exclusive','active',now());
      insert into billing.subscriptions (
        id,user_id,plan_version_id,market_price_id,access_state,billing_state,
        market_code,currency_code,billing_interval,idempotency_key,expired_at
      ) values (
        '${subscriptionId}','${userId}','${proPlanId}','${proPriceId}','expired','canceled',
        'EG','EGP','month','old-generation',now()
      );`);
  }, 30_000);

  afterAll(async () => {
    await db?.close();
  });

  it("deduplicates unpaid Checkout, then activates the paid repurchase", async () => {
    const first = await checkout("checkout-new");
    const second = await checkout("checkout-different-time-window");
    expect(second.checkout_generation).toBe(first.checkout_generation);
    expect(
      await sql(
        `select access_state||':'||billing_state from billing.subscriptions where id='${subscriptionId}'`,
      ),
    ).toBe("free_active:checkout_pending");

    const paid = await webhook({
      eventId: "evt_paid_new",
      eventType: "invoice.paid",
      effectiveAt: "2026-09-18T10:00:00Z",
      transition: "payment_succeeded",
      generation: String(first.checkout_generation),
      transactionId: "in_paid_new",
    });
    expect(paid).toMatchObject({ processed: true, plan_updated: true });
    expect(
      await sql(`select access_state from billing.subscriptions where id='${subscriptionId}'`),
    ).toBe("paid_active");
  });

  it("keeps pending or failed Pro Plus unpaid", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    expect(
      await webhook({
        eventId: "evt_upgrade_pending",
        eventType: "customer.subscription.updated",
        effectiveAt: "2026-09-18T10:05:00Z",
        transition: null,
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
      }),
    ).toMatchObject({ processed: true, plan_updated: false });
    expect(
      await webhook({
        eventId: "evt_upgrade_failed",
        eventType: "invoice.payment_failed",
        effectiveAt: "2026-09-18T10:06:00Z",
        transition: "payment_failed",
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
        gatewayStatus: "past_due",
      }),
    ).toMatchObject({ processed: true, plan_updated: false });
    expect(
      await sql(
        `select plan_version_id||':'||access_state from billing.subscriptions where id='${subscriptionId}'`,
      ),
    ).toBe(`${proPlanId}:past_due`);

    const transactionsBefore = await sql("select count(*) from billing.payment_transactions");
    for (const [eventId, eventType, effectiveAt] of [
      ["evt_renewal_failed_again", "customer.subscription.updated", "2026-09-18T10:06:01Z"],
      ["evt_renewal_invoice_failed_again", "invoice.payment_failed", "2026-09-18T10:06:02Z"],
    ]) {
      const event = {
        eventId,
        eventType,
        effectiveAt,
        transition: "payment_failed",
        generation,
        gatewayStatus: "past_due",
      };
      expect(await webhook(event)).toMatchObject({ processed: true, plan_updated: false });
      expect(await webhook(event)).toMatchObject({ duplicate: true, processed: true });
      expect(
        await sql(`select status from billing.webhook_events where gateway_event_id='${eventId}'`),
      ).toBe("processed");
    }
    expect(await sql("select count(*) from billing.payment_transactions")).toBe(transactionsBefore);
    expect(
      await sql(
        `select plan_version_id||':'||access_state from billing.subscriptions where id='${subscriptionId}'`,
      ),
    ).toBe(`${proPlanId}:past_due`);
    expect(
      await sql(`select count(*) from (values ('expired'),('refunded'),('suspended'),('refund_pending')) states(state)
        where billing.subscription_next_access_state(state,'payment_failed') is not null`),
    ).toBe("0");
  });

  it("applies a paid proration invoice to the same subscription", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    expect(
      await webhook({
        eventId: "evt_upgrade_paid",
        eventType: "invoice.paid",
        effectiveAt: "2026-09-18T10:07:00Z",
        transition: "payment_succeeded",
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
        transactionId: "in_proration_paid",
      }),
    ).toMatchObject({ processed: true, plan_updated: true });
    expect(
      await sql(`select s.plan_version_id||':'||s.access_state||':'||gs.gateway_subscription_id
      from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
      where s.id='${subscriptionId}'`),
    ).toBe(`${plusPlanId}:paid_active:sub_new`);
  });

  it("cancels and rejects an old-generation replay observably", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    expect(
      await webhook({
        eventId: "evt_cancel_new",
        eventType: "customer.subscription.deleted",
        effectiveAt: "2026-09-18T10:08:00Z",
        transition: "canceled",
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
        gatewayStatus: "canceled",
      }),
    ).toMatchObject({ processed: true });
    expect(
      await webhook({
        eventId: "evt_old_generation",
        eventType: "invoice.paid",
        effectiveAt: "2026-09-18T09:00:00Z",
        transition: "payment_succeeded",
        generation: randomUUID(),
        gatewaySubscriptionId: "sub_old",
        transactionId: "in_old",
      }),
    ).toMatchObject({ processed: false, reason: "CHECKOUT_GENERATION_MISMATCH" });
    expect(
      await sql(`select w.status||':'||w.error_code||':'||s.access_state||':'||s.plan_version_id
      from billing.webhook_events w cross join billing.subscriptions s
      where w.gateway_event_id='evt_old_generation' and s.id='${subscriptionId}'`),
    ).toBe(`failed:CHECKOUT_GENERATION_MISMATCH:expired:${plusPlanId}`);
  });

  it("rejects an older same-generation active metadata update after cancellation", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    const before =
      await sql(`select billing_state||':'||cancel_at_period_end||':'||coalesce(current_period_end::text,'')||':'||gs.raw_status
      from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
      where s.id='${subscriptionId}'`);
    expect(
      await webhook({
        eventId: "evt_delayed_active",
        eventType: "customer.subscription.updated",
        effectiveAt: "2026-09-18T10:07:30Z",
        transition: null,
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
        gatewayStatus: "active",
      }),
    ).toMatchObject({ processed: false, reason: "STALE" });
    expect(
      await sql(`select billing_state||':'||cancel_at_period_end||':'||coalesce(current_period_end::text,'')||':'||gs.raw_status
      from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
      where s.id='${subscriptionId}'`),
    ).toBe(before);
    expect(
      await sql(
        `select status||':'||error_code from billing.webhook_events where gateway_event_id='evt_delayed_active'`,
      ),
    ).toBe("failed:STALE_SUBSCRIPTION_EVENT");
  });

  it("orders metadata-only events and prevents regression", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    expect(
      await webhook({
        eventId: "evt_metadata_new",
        eventType: "customer.subscription.updated",
        effectiveAt: "2026-09-18T10:09:00Z",
        transition: null,
        generation,
        planId: plusPlanId,
        priceId: plusPriceId,
        gatewayStatus: "canceled",
      }),
    ).toMatchObject({ processed: true });
    expect(
      await webhook({
        eventId: "evt_metadata_old",
        eventType: "customer.subscription.updated",
        effectiveAt: "2026-09-18T10:08:30Z",
        transition: null,
        generation,
        planId: proPlanId,
        priceId: proPriceId,
        gatewayStatus: "active",
      }),
    ).toMatchObject({ processed: false, reason: "STALE" });
    expect(
      await sql(`select s.plan_version_id||':'||s.billing_state||':'||gs.raw_status
      from billing.subscriptions s join billing.gateway_subscriptions gs on gs.subscription_id=s.id
      where s.id='${subscriptionId}'`),
    ).toBe(`${plusPlanId}:canceled:canceled`);
  });
  it("reuses one new-user intent and requires matching closed session before rotation", async () => {
    const freshUser = randomUUID();
    const prepare = (plan = proPlanId, price = proPriceId) =>
      queryJson(`select public.prepare_stripe_checkout(
      '${freshUser}','${plan}','${price}','EG','EGP','month','cus_fresh','fresh-${freshUser}'
    )::text`);
    const [a, b] = await Promise.all([prepare(), prepare()]);
    expect(a.checkout_generation).toBe(b.checkout_generation);
    expect(a.subscription_id).toBe(b.subscription_id);
    const conflict = await prepare(plusPlanId, plusPriceId);
    expect(conflict).toMatchObject({
      checkout_generation: a.checkout_generation,
      selection_matches: false,
    });
    expect(
      await sql(
        `select public.record_stripe_checkout_session('${freshUser}','${a.checkout_generation}','cs_fresh')`,
      ),
    ).toBe("true");
    expect(
      await sql(
        `select public.close_stripe_checkout_intent('${freshUser}','${randomUUID()}','cs_fresh')`,
      ),
    ).toBe("false");
    expect(
      await sql(
        `select public.close_stripe_checkout_intent('${freshUser}','${a.checkout_generation}','wrong_session')`,
      ),
    ).toBe("false");
    expect(
      await sql(
        `select public.close_stripe_checkout_intent('${freshUser}','${a.checkout_generation}','cs_fresh')`,
      ),
    ).toBe("true");
    const replacement = await prepare(plusPlanId, plusPriceId);
    expect(replacement.checkout_generation).not.toBe(a.checkout_generation);
    expect(replacement.selection_matches).toBe(true);
    expect(
      await sql(`select count(*) from billing.subscriptions where user_id='${freshUser}'`),
    ).toBe("1");
  });

  it("keeps RPCs service-only and refuses a non-service caller", async () => {
    expect(
      await sql(`select has_function_privilege('authenticated',
      'public.prepare_stripe_checkout(uuid,uuid,uuid,text,text,text,text,text)', 'EXECUTE')`),
    ).toBe("false");
    expect(
      await sql(`select has_function_privilege('anon',
      'public.record_stripe_checkout_session(uuid,uuid,text)', 'EXECUTE')`),
    ).toBe("false");
    await sql(`select set_config('request.jwt.claim.role','authenticated',false)`);
    try {
      await expect(checkout("forbidden")).rejects.toThrow("STRIPE_CHECKOUT_SERVICE_ONLY");
    } finally {
      await sql(`select set_config('request.jwt.claim.role','service_role',false)`);
    }
  });

  it("does not duplicate a payment transaction on event replay", async () => {
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    const before = await sql("select count(*) from billing.payment_transactions");
    expect(
      await webhook({
        eventId: "evt_upgrade_paid",
        eventType: "invoice.paid",
        effectiveAt: "2026-09-18T10:07:00Z",
        transition: "payment_succeeded",
        generation,
        transactionId: "in_proration_paid",
      }),
    ).toMatchObject({ duplicate: true });
    expect(await sql("select count(*) from billing.payment_transactions")).toBe(before);
    expect(
      await sql(`select access_state from billing.subscriptions where id='${subscriptionId}'`),
    ).toBe("expired");
  });

  it("rolls back only changed functions and preserves catalog and data", async () => {
    await sql(readFileSync("docs/billing/20260920_repeated_payment_failure.rollback.sql", "utf8"));
    expect(
      await sql(
        "select billing.subscription_next_access_state('past_due','payment_failed') is null",
      ),
    ).toBe("true");
    const catalogBefore = await sql("select count(*) from billing.plan_versions");
    const eventsBefore = await sql("select count(*) from billing.webhook_events");
    await sql(
      readFileSync(
        "docs/billing/20260918_stripe_resubscription_generation_guard.rollback.sql",
        "utf8",
      ),
    );
    expect(await sql("select count(*) from billing.plan_versions")).toBe(catalogBefore);
    expect(await sql("select count(*) from billing.webhook_events")).toBe(eventsBefore);
    expect(
      await sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('record_stripe_checkout_session','close_stripe_checkout_intent','confirm_stripe_checkout_generation')`),
    ).toBe("0");
  });
});
