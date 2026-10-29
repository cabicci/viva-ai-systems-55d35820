// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accountDeletionTestDb } from "../__tests__/fixtures/account-deletion-db";

let db: Awaited<ReturnType<typeof accountDeletionTestDb>>;
const admin = randomUUID(), user = randomUUID(), other = randomUUID();
const sql = (name: string) => readFileSync(name, "utf8");
const actor = async (id: string, service = false) => {
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false),set_config('masaarat.stripe_environment',$3,false)", [id, service ? "service_role" : "authenticated", service ? "live" : "test"]);
};
const command = async (action: string, data: Record<string, unknown> = {}) =>
  (await db.query<{v: Record<string, any>}>("select public.commerce_command($1,$2::jsonb) v", [action, JSON.stringify(data)])).rows[0].v;
const selection = { package: "pro", market: "EG", billing_interval: "month", code: "FIXTURE" };
const reserve = async (key = randomUUID(), who = user, change: Record<string, unknown> = {}) => {
  await actor(who, true);
  return (await db.query<{v: {id: string; final_minor: number}}>("select public.reserve_stripe_live_offer($1,$2,$3,$4,$5,$6,$7,$8) v", [who, change.code ?? "FIXTURE", change.package ?? "pro", change.market ?? "EG", change.interval ?? "month", change.phone ?? null, key, change.renewal ?? false])).rows[0].v;
};
const manual = async (method: "bank" | "instapay", key = randomUUID(), who = user, change: Record<string, unknown> = {}) => {
  await actor(who);
  return command("create_order", { ...selection, method, key, ...change });
};
const confirm = async (order: Record<string, any>, method: string) => {
  await actor(admin);
  const data = { key: randomUUID(), method, currency: "EGP", amount_minor: order.final_minor, transaction_reference: randomUUID(), received_at: new Date().toISOString(), funds_verified: true, allocations: [{ order_id: order.id, amount_minor: order.final_minor }] };
  const first = await command("confirm", data);
  await command("confirm", data);
  return first;
};
const consume = async (r: {id: string}, who = user) => {
  await actor(who, true);
  await db.query("select public.bind_stripe_live_offer($1,$2,'cus_fixture','cs_fixture')", [r.id, who]);
  await db.query("select public.consume_stripe_live_offer($1,$2,'sub_fixture','in_fixture','cus_fixture')", [r.id, who]);
  await db.query("select public.consume_stripe_live_offer($1,$2,'sub_fixture','in_fixture','cus_fixture')", [r.id, who]);
};
const count = async (query: string) => (await db.query<{n: number}>(query)).rows[0].n;

beforeAll(async () => {
  db = await accountDeletionTestDb(true);
  await db.exec("CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);");
  for (const name of ["20261004010000_commerce_foundation.sql", "20261004011000_commerce_commands.sql", "20261004012000_commerce_access.sql", "20261004013000_commerce_receipts_mail.sql", "20261004014000_commerce_account_retention.sql", "20261004015000_commerce_payment_mail.sql", "20261004016000_commerce_simple_offers.sql", "20261005100000_technical_education_integration.sql", "20261005101000_technical_stripe_test.sql", "20261005102000_technical_subscription_mail.sql", "20261005110000_admin_kids_lesson_review.sql", "20261006110000_academic_commerce.sql", "20261006111000_academic_content.sql", "20261006112000_academic_stripe_test.sql", "20261006113000_academic_mail_retention.sql", "20261006120000_academic_admin_review.sql"])
    await db.exec(sql(`supabase/migrations/${name}`));
  await db.exec(sql("scripts/email-access/email-access-candidate.sql"));
  await db.exec(sql("docs/billing/20260920_stripe_refunds.sql"));
  for (const name of ["0008_stripe_live_environment_separation.sql", "0009_stripe_live_guard_lifecycle.sql", "0010_stripe_live_rpc_environment.sql", "0011_stripe_live_atomic_risk_holds.sql", "0012_stripe_live_risk_guard_binding_closure.sql", "0013_stripe_live_refund_lock_order.sql", "0014_stripe_live_offer_mapping_prerequisite.sql", "0015_stripe_live_offer_reservations.sql", "0016_stripe_live_offer_retention_and_replay.sql", "0017_stripe_live_offer_retention_stage_fix.sql", "0018_stripe_live_offer_binding_lifetime_closure.sql", "0019_stripe_live_offer_catalogue_binding.sql", "0020_stripe_live_offer_retry_input_closure.sql", "0021_stripe_live_offer_cross_channel_phone_guard.sql"])
    try {
      if (name === "0010_stripe_live_rpc_environment.sql") {
        const names = Array.from(sql(`drizzle/migrations/${name}`).matchAll(/\('public','([^']+)'/g), match => match[1]);
        const missing: string[] = [];
        for (const fn of new Set(names))
          if (!(await db.query("select 1 from pg_proc where pronamespace='public'::regnamespace and proname=$1", [fn])).rows.length) missing.push(fn);
        if (missing.length) throw new Error(`Missing installed fixture prerequisites: ${missing.join(",")}`);
      }
      await db.exec(sql(`drizzle/migrations/${name}`));
    }
    catch (error) { console.error("Fixture migration", name); throw error; }
  await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@example.test',now()),('${user}','member@example.test',now()),('${other}','other@example.test',now()); INSERT INTO public.user_roles VALUES('${admin}','admin');`);
}, 30000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true;");
  await actor(admin);
  for (const method of ["bank", "instapay"])
    await command("configure_method", { code: method, enabled: true, instructions: "Fixture only", destination: "Fixture only", currencies: ["EGP"] });
  await command("create_offer", { code: "FIXTURE", campaign: "Fixture only", package: "pro", kind: "percent", value_minor: 20, currency: "EGP", duration_days: 30, eligibility: "all", renewals: true, valid_from: new Date(Date.now()-10000).toISOString(), valid_until: new Date(Date.now()+86400000).toISOString(), max_redemptions: 10, per_email_limit: 2, enabled: true });
  await db.exec("UPDATE billing.commerce_offers SET billing_interval='month' WHERE code='FIXTURE';");
  await db.exec(`INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,reviewed_at,enabled)
    SELECT f.id,1,'pro','EG','EGP','month',g.gateway_price_id,g.gateway_product_id,'coupon_fixture','promo_fixture','percent',20,'once',now(),true FROM billing.commerce_offers f CROSS JOIN billing.gateway_price_mappings g JOIN billing.market_prices m ON m.id=g.market_price_id JOIN billing.plan_versions v ON v.id=m.plan_version_id JOIN billing.plan_catalog p ON p.id=v.plan_id WHERE f.code='FIXTURE' AND p.plan_key='pro' AND v.billing_interval='month' AND m.market_code='EG' LIMIT 1;`);
});
afterEach(async () => db.exec("ROLLBACK"));

describe("real commerce coupon journey across payment rails", () => {
  it.each(["bank", "instapay"] as const)("%s confirmation and Live consumption share a limit of two", async method => {
    const o = await manual(method); expect(o.final_minor).toBe(13520);
    await confirm(o, method);
    const r = await reserve(); expect(r.final_minor).toBe(13520);
    await consume(r);
    expect(await count("select consumed_count::int n from billing.commerce_offers")).toBe(2);
    expect(await count("select count(*)::int n from billing.commerce_entitlements")).toBe(1);
    await expect(manual(method)).rejects.toThrow(/LIMIT|ALREADY_USED/);
  });
  it.each(["bank", "instapay"] as const)("Live first then %s obeys the same allowed two uses", async method => {
    await consume(await reserve());
    const o = await manual(method); await confirm(o, method);
    expect(await count("select consumed_count::int n from billing.commerce_offers")).toBe(2);
    await expect(reserve()).rejects.toThrow(/LIMIT|ALREADY_USED/);
  });
  it("a mixed pending manual and Live reservation exhaust the same per-customer limit", async () => {
    await manual("bank"); await reserve();
    await expect(manual("instapay")).rejects.toThrow(/LIMIT|ALREADY_USED/);
    expect(await count("select count(*)::int n from billing.commerce_orders")).toBe(1);
    expect(await count("select count(*)::int n from public.stripe_live_offer_reservations")).toBe(1);
  });
  it("same attempt key cannot reserve separately on manual and Live", async () => {
    const key = randomUUID(); const o = await manual("bank", key);
    expect((await manual("bank", key)).id).toBe(o.id);
    await expect(reserve(key)).rejects.toThrow(/RETRY_CONFLICT|REPLAY_CONFLICT/);
  });
  it("same Live attempt cannot create a separate manual reservation", async () => {
    const key = randomUUID(); const r = await reserve(key);
    expect((await reserve(key)).id).toBe(r.id);
    await expect(manual("instapay", key)).rejects.toThrow(/RETRY_CONFLICT|REPLAY_CONFLICT/);
  });
  it("Live usage respects a first-payment-only coupon on subsequent manual purchase", async () => {
    await db.exec("UPDATE billing.commerce_offers SET renewals=false");
    await consume(await reserve());
    await expect(manual("bank")).rejects.toThrow(/INELIGIBLE/);
  });
  it("Live consumption disqualifies new-customer-only offers on manual rails", async () => {
    await consume(await reserve());
    await db.exec("UPDATE billing.commerce_offers SET eligibility='new_customer',per_email_limit=10");
    await expect(manual("instapay")).rejects.toThrow(/INELIGIBLE/);
  });
});