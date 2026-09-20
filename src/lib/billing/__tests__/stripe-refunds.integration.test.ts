import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
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

describe("Stripe refund database reconciliation", async () => {
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

  beforeAll(async () => {
    await sql(`ALTER TABLE billing.payment_transactions ADD COLUMN gross_minor bigint;
      ALTER TABLE billing.payment_transactions ADD COLUMN tax_minor bigint;`);
    await sql(readFileSync("docs/billing/20260920_stripe_refunds.sql", "utf8"));
  });
  beforeEach(async () => {
    await sql("BEGIN");
    const intent = await checkout("refund-checkout");
    await webhook({
      eventId: "evt_refund_payment",
      eventType: "invoice.paid",
      effectiveAt: "2026-09-18T10:00:00Z",
      transition: "payment_succeeded",
      generation: String(intent.checkout_generation),
      transactionId: "in_refund_payment",
    });
  });
  afterEach(async () => {
    await sql("ROLLBACK");
  });

  afterAll(async () => {
    await db?.close();
  });

  const refund = async (
    input: {
      event?: string;
      id?: string;
      amount?: number;
      status?: string;
      time?: string;
      invoice?: string;
      current?: boolean;
      generation?: string;
      provider?: string;
    } = {},
  ) => {
    const generation =
      input.generation ??
      (await sql(
        `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
      ));
    return queryJson(`select public.apply_stripe_refund_event(
      '${input.event ?? "evt_refund_1"}','refund.updated','${input.time ?? "2026-09-18T11:00:00Z"}',
      '${input.id ?? "re_partial"}','${input.invoice ?? "in_refund_payment"}','${input.status ?? "succeeded"}',
      ${input.amount ?? 5000},'egp','${input.provider ?? "sub_new"}','cus_test','${generation}',${input.current ?? true}
    )::text`);
  };
  const state = () =>
    sql(`select access_state from billing.subscriptions where id='${subscriptionId}'`);

  it("keeps partial access and revokes cumulative full refund exactly once", async () => {
    expect(await refund()).toMatchObject({
      processed: true,
      refunded_minor: 5000,
      cancel_subscription: false,
    });
    expect(await state()).toBe("paid_active");
    expect(await refund()).toMatchObject({ duplicate: true, refunded_minor: 5000 });
    expect(await sql("select count(*) from billing.refunds")).toBe("1");
    expect(
      await refund({
        event: "evt_refund_2",
        id: "re_remainder",
        amount: 11900,
        time: "2026-09-18T11:01:00Z",
      }),
    ).toMatchObject({ refunded_minor: 16900, cancel_subscription: true });
    expect(await state()).toBe("refunded");
    expect(
      await refund({
        event: "evt_refund_2",
        id: "re_remainder",
        amount: 11900,
        time: "2026-09-18T11:01:00Z",
      }),
    ).toMatchObject({ duplicate: true, cancel_subscription: true });
    expect(
      await sql("select count(*) from billing.subscription_events where event_type='refunded'"),
    ).toBe("1");
  });

  it("records pending, success, cancellation and late failure without granting access", async () => {
    expect(await refund({ amount: 16900, status: "pending" })).toMatchObject({
      held_minor: 16900,
      cancel_subscription: false,
    });
    expect(await state()).toBe("refund_pending");
    expect(
      await refund({ event: "evt_success", amount: 16900, time: "2026-09-18T11:01:00Z" }),
    ).toMatchObject({ cancel_subscription: true });
    expect(await state()).toBe("refunded");
    const generation = await sql(
      `select checkout_generation from billing.subscriptions where id='${subscriptionId}'`,
    );
    expect(
      await webhook({
        eventId: "evt_refund_cancel",
        eventType: "customer.subscription.deleted",
        effectiveAt: "2026-09-18T11:02:00Z",
        transition: "canceled",
        generation,
        gatewayStatus: "canceled",
      }),
    ).toMatchObject({ processed: true });
    expect(await state()).toBe("refunded");
    expect(
      await refund({
        event: "evt_failed",
        amount: 16900,
        status: "failed",
        time: "2026-09-18T11:03:00Z",
      }),
    ).toMatchObject({
      refunded_minor: 0,
      held_minor: 0,
      manual_review_required: true,
      cancel_subscription: false,
    });
    expect(await state()).toBe("refunded");
  });

  it("does not regress a successful refund on stale or same-second pending delivery", async () => {
    await refund({ amount: 16900 });
    expect(
      await refund({
        event: "evt_old_pending",
        amount: 16900,
        status: "pending",
        time: "2026-09-18T10:59:00Z",
      }),
    ).toMatchObject({ stale: true, refunded_minor: 16900 });
    expect(
      await refund({ event: "evt_tied_pending", amount: 16900, status: "pending" }),
    ).toMatchObject({ stale: true, refunded_minor: 16900 });
    expect(await sql("select status from billing.refunds")).toBe("succeeded");
  });

  it("does not revoke later invoices or a replacement provider generation", async () => {
    expect(await refund({ amount: 16900, current: false })).toMatchObject({
      cancel_subscription: false,
    });
    expect(await state()).toBe("paid_active");
    expect(
      await refund({
        event: "evt_replaced",
        amount: 16900,
        generation: randomUUID(),
        provider: "sub_old",
      }),
    ).toMatchObject({ cancel_subscription: false });
    expect(await state()).toBe("paid_active");
  });

  it("rolls back unknown payment, over-refund, mismatched currency and colliding IDs", async () => {
    const rejects = async (call: () => Promise<unknown>, message: string) => {
      await sql("SAVEPOINT invalid_refund");
      await expect(call()).rejects.toThrow(message);
      await sql("ROLLBACK TO SAVEPOINT invalid_refund");
    };
    await rejects(() => refund({ invoice: "in_missing" }), "STRIPE_REFUND_PAYMENT_NOT_READY");
    expect(await sql("select count(*) from billing.refunds")).toBe("0");
    await refund();
    await rejects(
      () => refund({ event: "evt_over", id: "re_over", amount: 12000 }),
      "STRIPE_REFUND_EXCEEDS_CAPTURED",
    );
    await rejects(
      () => refund({ event: "evt_collision", amount: 5001 }),
      "STRIPE_REFUND_ID_COLLISION",
    );
    await sql("update billing.payment_transactions set currency_code='USD'");
    await rejects(() => refund({ event: "evt_wrong_currency" }), "STRIPE_REFUND_PAYMENT_MISMATCH");
    expect(await sql("select count(*) from billing.refunds")).toBe("1");
  });

  it("allocates tax to the cent and frees allocations after a failed refund", async () => {
    await sql("update billing.payment_transactions set tax_minor=101,gross_minor=16900");
    await refund({ amount: 5000 });
    await refund({
      event: "evt_final",
      id: "re_final",
      amount: 11900,
      time: "2026-09-18T11:01:00Z",
    });
    expect(
      await sql("select sum((metadata->>'tax_allocated_minor')::bigint) from billing.refunds"),
    ).toBe("101");
    await refund({
      event: "evt_failed_tax",
      id: "re_final",
      amount: 11900,
      status: "failed",
      time: "2026-09-18T11:02:00Z",
    });
    expect(
      await sql(
        "select metadata->>'tax_allocated_minor' from billing.refunds where gateway_refund_id='re_final'",
      ),
    ).toBe("0");
    expect(
      await sql("select sum((metadata->>'tax_allocated_minor')::bigint) from billing.refunds"),
    ).toBe("29");
  });

  it("restricts the RPC to the service caller", async () => {
    const signature =
      "public.apply_stripe_refund_event(text,text,timestamptz,text,text,text,bigint,text,text,text,uuid,boolean)";
    for (const role of ["anon", "authenticated"]) {
      expect(await sql(`select has_function_privilege('${role}','${signature}','EXECUTE')`)).toBe(
        "false",
      );
    }
    await sql(
      "select set_config('request.jwt.claim.role','authenticated',false); SAVEPOINT no_service",
    );
    await expect(refund()).rejects.toThrow("STRIPE_REFUND_SERVICE_ONLY");
    await sql("ROLLBACK TO SAVEPOINT no_service");
  });

  it("rolls back function additions while preserving money records", async () => {
    await refund();
    // The rollback script owns its transaction; remove wrappers inside this test transaction.
    await sql(
      readFileSync("docs/billing/20260920_stripe_refunds.rollback.sql", "utf8")
        .replace(/^BEGIN;$/m, "")
        .replace(/^COMMIT;$/m, ""),
    );
    expect(await sql("select count(*) from billing.refunds")).toBe("1");
    expect(
      await sql("select billing.subscription_next_access_state('refunded','canceled') is null"),
    ).toBe("true");
    expect(
      await sql("select billing.subscription_next_access_state('past_due','payment_failed')"),
    ).toBe("past_due");
  });
});
