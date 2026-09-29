import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const parent = randomUUID();
const otherParent = randomUUID();

async function row(sql: string) {
  return (await db.exec(sql)).at(-1)?.rows[0] as Record<string, unknown> | undefined;
}

describe("Kids full refund and new test subscription", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE SCHEMA billing;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
      CREATE TABLE billing.gateway_customers (
        user_id uuid, gateway_code text, status text, gateway_customer_id text
      );
      CREATE TABLE public.kids_stripe_prices (gateway_price_id text PRIMARY KEY);
      CREATE TABLE public.kids_stripe_subscriptions (
        parent_id uuid PRIMARY KEY, gateway_subscription_id text NOT NULL,
        gateway_customer_id text NOT NULL, gateway_price_id text NOT NULL,
        status text NOT NULL, latest_paid_invoice_id text, paid_through timestamptz,
        last_event_at timestamptz NOT NULL, updated_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.kids_stripe_events (event_id text PRIMARY KEY, parent_id uuid);
      CREATE TABLE public.kids_stripe_refunds (
        refund_id text PRIMARY KEY, parent_id uuid, invoice_id text, amount_minor integer, status text
      );
      CREATE TABLE public.kids_family_entitlements (
        parent_id uuid PRIMARY KEY, active_from timestamptz, active_until timestamptz,
        entitlement_reference text
      );
      INSERT INTO public.kids_stripe_prices VALUES ('price_1');
      INSERT INTO billing.gateway_customers VALUES
        ('${parent}','stripe_us','active','cus_parent');
      INSERT INTO public.kids_stripe_subscriptions
        (parent_id,gateway_subscription_id,gateway_customer_id,gateway_price_id,
         status,latest_paid_invoice_id,paid_through,last_event_at)
      VALUES
        ('${parent}','sub_old','cus_parent','price_1','active','in_old',now()+interval '1 month',now()),
        ('${otherParent}','sub_refunded','cus_other','price_1','refunded','in_other',now()+interval '1 month',now());
      INSERT INTO public.kids_family_entitlements VALUES
        ('${parent}',now()-interval '1 day',now()+interval '1 month','stripe-test:sub_old'),
        ('${otherParent}',now()-interval '1 day',now()+interval '1 year','owner-admin-kids-test');
    `);
    await db.exec(
      readFileSync(
        "supabase/migrations/20260929110000_kids_refund_reentry_and_access_status.sql",
        "utf8",
      ),
    );
  });

  afterAll(async () => {
    await db?.close();
  });

  it("clears an older refund's stale paid-through date and reports only the caller's test grant", async () => {
    expect(
      await row(
        `SELECT paid_through FROM public.kids_stripe_subscriptions WHERE parent_id='${otherParent}'`,
      ),
    ).toEqual({ paid_through: null });
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${otherParent}',false)`);
    expect(await row("SELECT * FROM public.get_my_kids_access_status() ")).toMatchObject({
      access_source: "test_grant",
    });
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${parent}',false)`);
    expect(await row("SELECT * FROM public.get_my_kids_access_status() ")).toMatchObject({
      access_source: "stripe_test",
    });
    expect(
      await row(
        "SELECT has_function_privilege('anon','public.get_my_kids_access_status()','EXECUTE') AS allowed",
      ),
    ).toEqual({ allowed: false });
  });

  it("revokes a full refund, survives its retry and delayed cancellation, then allows a new paid test subscription", async () => {
    const refunded = await row(`SELECT public.apply_kids_stripe_refund(
      'evt_refund','${parent}','sub_old','cus_parent','in_old','re_old',100,100,'succeeded',now()
    ) AS applied`);
    expect(refunded).toEqual({ applied: true });
    expect(
      await row(
        `SELECT status,paid_through FROM public.kids_stripe_subscriptions WHERE parent_id='${parent}'`,
      ),
    ).toEqual({ status: "refunded", paid_through: null });
    expect(
      await row(
        `SELECT count(*)::integer AS count FROM public.kids_family_entitlements WHERE parent_id='${parent}'`,
      ),
    ).toEqual({ count: 0 });
    expect(
      await row(`SELECT public.apply_kids_stripe_refund(
      'evt_refund','${parent}','sub_old','cus_parent','in_old','re_old',100,100,'succeeded',now()
    ) AS applied`),
    ).toEqual({ applied: true });
    expect(
      await row(`SELECT public.apply_kids_stripe_event(
      'evt_canceled','${parent}','sub_old','cus_parent','price_1','canceled',now(),false,NULL,NULL,NULL
    ) AS applied`),
    ).toEqual({ applied: false });
    expect(
      await row(`SELECT public.apply_kids_stripe_event(
      'evt_new','${parent}','sub_new','cus_parent','price_1','active',now(),true,'in_new',
      now(),now()+interval '1 month'
    ) AS applied`),
    ).toEqual({ applied: true });
    expect(
      await row(`SELECT status,gateway_subscription_id FROM public.kids_stripe_subscriptions
      WHERE parent_id='${parent}'`),
    ).toEqual({ status: "active", gateway_subscription_id: "sub_new" });
    expect(
      await row(`SELECT entitlement_reference FROM public.kids_family_entitlements
      WHERE parent_id='${parent}'`),
    ).toEqual({ entitlement_reference: "stripe-test:sub_new" });
    expect(
      await row(`SELECT public.apply_kids_stripe_event(
      'evt_old_late','${parent}','sub_old','cus_parent','price_1','canceled',now(),false,NULL,NULL,NULL
    ) AS applied`),
    ).toEqual({ applied: false });
    expect(
      await row(`SELECT entitlement_reference FROM public.kids_family_entitlements
      WHERE parent_id='${parent}'`),
    ).toEqual({ entitlement_reference: "stripe-test:sub_new" });
  });
});
