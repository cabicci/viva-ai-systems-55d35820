// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accountDeletionTestDb, accountDeletionSchemaSql } from "../__tests__/fixtures/account-deletion-db";

type Db = { query<T = Record<string, unknown>>(q: string, args?: unknown[]): Promise<{ rows: T[] }>; exec(q: string): Promise<unknown>; close(): Promise<void> };
let db: Db;
const nativeUrl = process.env.COUPON_RAIL_NATIVE_DATABASE_URL;
let native: ReturnType<typeof postgres> | undefined;
const admin = randomUUID(), user = randomUUID(), other = randomUUID();
const sql = (name: string) => readFileSync(name, "utf8");
const actor = async (id: string, service = false) => {
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false),set_config('masaarat.stripe_environment',$3,false)", [id, service ? "service_role" : "authenticated", service ? "live" : "test"]);
};
async function recover<T>(run: () => Promise<T>): Promise<T> {
  await db.exec("SAVEPOINT attempt");
  try { const result = await run(); await db.exec("RELEASE SAVEPOINT attempt"); return result; }
  catch (error) { await db.exec("ROLLBACK TO SAVEPOINT attempt; RELEASE SAVEPOINT attempt"); throw error; }
}
const command = async (action: string, data: Record<string, unknown> = {}) => recover(async () =>
  (await db.query<{v: Record<string, any>}>("select public.commerce_command($1,$2::jsonb) v", [action, JSON.stringify(data)])).rows[0].v);
const selection = { package: "pro", market: "EG", billing_interval: "month", code: "FIXTURE" };
const reserve = async (key = randomUUID(), who = user, change: Record<string, unknown> = {}) => {
  await actor(who, true);
  return recover(async () => (await db.query<{v: {id: string; final_minor: number}}>("select public.reserve_stripe_live_offer($1,$2,$3,$4,$5,$6,$7,$8) v", [who, change.code ?? "FIXTURE", change.package ?? "pro", change.market ?? "EG", change.interval ?? "month", change.phone ?? null, key, change.renewal ?? false])).rows[0].v);
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
  if (nativeUrl) {
    const url = new URL(nativeUrl);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/coupon_rail_test")
      throw new Error("Disposable localhost coupon_rail_test required");
    const client = postgres(nativeUrl, { max: 1, onnotice: () => {} }); native = client;
    db = { query: async <T>(q: string, args: unknown[] = []) => ({ rows: await client.unsafe(q, args.map(v => typeof v === "string" && (v.startsWith("{") || v.startsWith("[")) ? client.json(JSON.parse(v)) : v) as never) as unknown as T[] }), exec: q => client.unsafe(q), close: () => client.end() };
    for (const statement of accountDeletionSchemaSql(true)) await db.exec(statement);
  } else db = await accountDeletionTestDb(true);
  await db.exec("CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);");
  for (const name of ["20261004010000_commerce_foundation.sql", "20261004011000_commerce_commands.sql", "20261004012000_commerce_access.sql", "20261004013000_commerce_receipts_mail.sql", "20261004014000_commerce_account_retention.sql", "20261004015000_commerce_payment_mail.sql", "20261004016000_commerce_simple_offers.sql", "20261005100000_technical_education_integration.sql", "20261005101000_technical_stripe_test.sql", "20261005102000_technical_subscription_mail.sql", "20261005110000_admin_kids_lesson_review.sql", "20261006110000_academic_commerce.sql", "20261006111000_academic_content.sql", "20261006112000_academic_stripe_test.sql", "20261006113000_academic_mail_retention.sql", "20261006120000_academic_admin_review.sql"])
    await db.exec(sql(`supabase/migrations/${name}`));
  await db.exec(sql("scripts/email-access/email-access-candidate.sql"));
  await db.exec(sql("docs/billing/20260920_stripe_refunds.sql"));
  const rag = sql("scripts/academic-education/assistant-rag-candidate.sql");
  await db.exec("ALTER TABLE public.academic_courses ADD COLUMN assistant_review_enabled boolean NOT NULL DEFAULT false;" + rag.slice(rag.indexOf("CREATE TABLE public.academic_content_course_grants"), rag.indexOf("-- Return the authoritative access mode")));
  // Replay the exact installed commerce/assistant billing segment; RAG import
  // functions after this boundary are unrelated to coupon journeys.
  await db.exec(sql("scripts/academic-education/assistant-native-candidate.sql").split("CREATE FUNCTION public.academic_import_chunks")[0] + "COMMIT;");
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
  await db.exec(sql("drizzle/migrations/0025_shared_coupon_rail_eligibility_and_attempts.sql"));
}, 30000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true;");
  await actor(admin);
  for (const method of ["bank", "instapay"])
    await command("configure_method", { code: method, enabled: true, instructions: "Fixture only", destination: "Fixture only", currencies: ["EGP"] });
  await command("create_offer", { code: "FIXTURE", campaign: "Fixture only", package: "pro", kind: "percent", value_minor: 20, currency: "EGP", duration_days: 30, eligibility: "all", renewals: true, valid_from: new Date(Date.now()-10000).toISOString(), valid_until: new Date(Date.now()+86400000).toISOString(), max_redemptions: 10, per_email_limit: 2, enabled: true });
  await db.exec("UPDATE billing.commerce_offers SET billing_interval='month' WHERE code='FIXTURE';");
  await actor(admin, true);
  const price = (await db.query<{id: string}>("select m.id from billing.market_prices m join billing.plan_versions v on v.id=m.plan_version_id join billing.plan_catalog p on p.id=v.plan_id where p.plan_key='pro' and v.billing_interval='month' and m.market_code='EG' and m.status='active' limit 1")).rows[0];
  if (!price) throw new Error("Missing published fixture price");
  await db.query("select public.register_stripe_gateway_catalog($1,'price_fixture','prod_fixture')", [price.id]);
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
  it.each(["bank", "instapay"] as const)("shared global cap of one blocks %s after another customer's Live reservation", async method => {
    await db.exec("UPDATE billing.commerce_offers SET max_redemptions=1");
    await reserve(randomUUID(), other);
    await expect(manual(method)).rejects.toThrow(/LIMIT/);
    expect(await count("select count(*)::int n from billing.commerce_orders")).toBe(0);
  });
  it.each(["bank", "instapay"] as const)("pending %s reserves the global limit of one against another Live customer", async method => {
    await db.exec("UPDATE billing.commerce_offers SET max_redemptions=1");
    const o = await manual(method);
    await expect(reserve(randomUUID(), other)).rejects.toThrow(/LIMIT/);
    await actor(user); await command("cancel_order", { id: o.id });
    expect((await reserve(randomUUID(), other)).final_minor).toBe(13520);
    expect(await count("select consumed_count::int n from billing.commerce_offers")).toBe(0);
  });
  it.each(["bank", "instapay", "live"] as const)("%s rejects wrong plan, term, currency, targeted customer and expired codes", async rail => {
    const attempt = (change: Record<string, unknown> = {}, who = user) => rail === "live"
      ? reserve(randomUUID(), who, change) : manual(rail, randomUUID(), who, change);
    await expect(attempt({ package: "pro_plus" })).rejects.toThrow(/INELIGIBLE/);
    await expect(attempt(rail === "live" ? { interval: "year" } : { billing_interval: "year" })).rejects.toThrow(/INELIGIBLE/);
    await expect(attempt({ market: "INTL" })).rejects.toThrow(/INELIGIBLE/);
    await db.exec("UPDATE billing.commerce_offers SET email='member@example.test'");
    await expect(attempt({}, other)).rejects.toThrow(/INELIGIBLE/);
    await db.exec("UPDATE billing.commerce_offers SET valid_until=now()-interval '1 second'");
    await expect(attempt()).rejects.toThrow(/INELIGIBLE/);
    expect(await count("select count(*)::int n from public.stripe_live_offer_reservations")).toBe(0);
    expect(await count("select count(*)::int n from billing.commerce_orders")).toBe(0);
  });
  it.each(["bank", "instapay"] as const)("%s and Live keep phone-required one-identity use independent of email cap", async rail => {
    await db.exec("UPDATE billing.commerce_offers SET require_phone=true");
    await manual(rail, randomUUID(), user, { phone: "+201000000001" });
    await expect(reserve(randomUUID(), other, { phone: "+201000000001" })).rejects.toThrow(/ALREADY_USED/);
    await expect(reserve(randomUUID(), user, { phone: "+201000000002" })).rejects.toThrow(/ALREADY_USED/);
  });
  it.each(["bank", "instapay"] as const)("Live phone use blocks %s on another customer", async rail => {
    await db.exec("UPDATE billing.commerce_offers SET require_phone=true");
    await reserve(randomUUID(), user, { phone: "+201000000001" });
    await expect(manual(rail, randomUUID(), other, { phone: "+201000000001" })).rejects.toThrow(/ALREADY_USED/);
  });
  it("changing Live replay inputs cannot create another attempt or change quoted amount", async () => {
    const key = randomUUID(); await reserve(key);
    await expect(reserve(key, user, { renewal: true })).rejects.toThrow(/REPLAY_CONFLICT/);
    expect(await count("select count(*)::int n from public.stripe_live_offer_reservations")).toBe(1);
  });
  it("manual expiry prevents confirmation and releases only the pending capacity", async () => {
    await db.exec("UPDATE billing.commerce_offers SET max_redemptions=1");
    const o = await manual("bank");
    await db.query("UPDATE billing.commerce_orders SET expires_at=now()-interval '1 second' WHERE id=$1", [o.id]);
    await expect(confirm(o, "bank")).rejects.toThrow(/NOT_CONFIRMABLE/);
    expect(await count("select count(*)::int n from billing.commerce_payments")).toBe(0);
    expect(await count("select count(*)::int n from billing.commerce_entitlements")).toBe(0);
    expect((await reserve()).final_minor).toBe(13520);
  });
  it("Kids explicit discount replaces the family benefit for the shared quote and Live reservation", async () => {
    await actor(admin);
    await command("grant", { user_id: user, package: "pro", duration_days: 30, reason: "Fixture existing access", key: randomUUID() });
    await command("create_offer", { code: "KIDS_FIXTURE", campaign: "Fixture only", package: "kids", kind: "percent", value_minor: 20, currency: "EGP", duration_days: 30, eligibility: "all", renewals: true, valid_from: new Date(Date.now()-10000).toISOString(), valid_until: new Date(Date.now()+86400000).toISOString(), max_redemptions: 10, per_email_limit: 2, enabled: true });
    await actor(user);
    expect((await command("quote", { package: "kids", market: "EG", billing_interval: "month" })).final_minor).toBe(17910);
    expect((await command("quote", { package: "kids", market: "EG", billing_interval: "month", code: "KIDS_FIXTURE" })).final_minor).toBe(15920);
    await actor(admin, true);
    await db.exec("INSERT INTO public.kids_stripe_prices(market_code,billing_interval,discounted,currency_code,amount_minor,gateway_product_id,gateway_price_id,stripe_environment) VALUES('EG','month',false,'egp',19900,'prod_kidsfixture','price_kidsfixture','live')");
    await db.exec("INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,reviewed_at,enabled) SELECT id,1,'kids','EG','EGP','month','price_kidsfixture','prod_kidsfixture','coupon_kidsfixture','promo_kidsfixture','percent',20,'once',now(),true FROM billing.commerce_offers WHERE code='KIDS_FIXTURE'");
    expect((await reserve(randomUUID(), user, { package: "kids", code: "KIDS_FIXTURE" })).final_minor).toBe(15920);
  });
  it.each(["bank", "instapay"] as const)("%s remains usable when a future coupon lacks its Live mapping", async method => {
    await db.exec("UPDATE public.stripe_live_offer_mappings SET enabled=false");
    await expect(reserve()).rejects.toThrow(/NOT_MAPPED/);
    expect((await manual(method)).final_minor).toBe(13520);
  });
  it("disabled bank fails without blocking InstaPay or the reviewed Live mapping", async () => {
    await db.exec("UPDATE billing.commerce_methods SET enabled=false WHERE code='bank'");
    await expect(manual("bank")).rejects.toThrow(/METHOD_UNAVAILABLE/);
    expect((await manual("instapay")).final_minor).toBe(13520);
    expect((await reserve()).final_minor).toBe(13520);
  });
  it("manual refund does not restore coupon uses or consume a Stripe reservation", async () => {
    const o = await manual("instapay");
    const payment = await confirm(o, "instapay");
    const r = await reserve();
    await actor(admin);
    const refund = { payment_id: payment.id, order_id: o.id, amount_minor: 13520, reference: "Fixture external refund", reason: "Fixture only", funds_verified: true, revoke_access: true, key: randomUUID() };
    await command("refund", refund); await command("refund", refund);
    expect(await count("select consumed_count::int n from billing.commerce_offers")).toBe(1);
    expect(await count("select count(*)::int n from billing.commerce_refunds")).toBe(1);
    expect(await count("select count(*)::int n from public.stripe_live_offer_reservations where consumed_at is not null")).toBe(0);
    await consume(r);
    expect(await count("select consumed_count::int n from billing.commerce_offers")).toBe(2);
    await expect(manual("bank")).rejects.toThrow(/LIMIT/);
  });
  it.skipIf(!nativeUrl)("native two-session races never double-reserve a shared global cap or attempt key", async () => {
    if (!nativeUrl || !native) throw new Error("Native fixture unavailable");
    await db.exec("COMMIT"); // Publish only this disposable fixture to peer sessions.
    for (const method of ["bank", "instapay"] as const) for (const sameKey of [false, true]) {
      const code = `RACE_${method.toUpperCase()}_${sameKey ? "KEY" : "CAP"}`;
      await db.query("INSERT INTO billing.commerce_offers(code,campaign,package,kind,value_minor,currency,duration_days,eligibility,renewals,valid_from,valid_until,max_redemptions,per_email_limit,enabled,billing_interval) SELECT $1,campaign,package,kind,value_minor,currency,duration_days,eligibility,renewals,valid_from,valid_until,$2,10,enabled,billing_interval FROM billing.commerce_offers WHERE code='FIXTURE'", [code, sameKey ? 10 : 1]);
      await db.query("INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,reviewed_at,enabled) SELECT f.id,1,m.package,m.market_code,m.currency,m.billing_interval,m.price_id,m.product_id,m.coupon_id,m.promotion_code_id,m.kind,m.value_minor,m.duration,now(),true FROM billing.commerce_offers f CROSS JOIN public.stripe_live_offer_mappings m WHERE f.code=$1 LIMIT 1", [code]);
      const key = randomUUID();
      const run = async (live: boolean) => {
        const peer = postgres(nativeUrl, { max: 1 });
        try {
          await peer.unsafe("BEGIN");
          await peer.unsafe("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false),set_config('masaarat.stripe_environment',$3,false)", [user, live ? "service_role" : "authenticated", live ? "live" : "test"]);
          if (live) await peer.unsafe("select public.reserve_stripe_live_offer($1,$2,'pro','EG','month',NULL,$3,false)", [user, code, sameKey ? key : randomUUID()]);
          else await peer.unsafe("select public.commerce_command('create_order',$1::jsonb)", [peer.json({ ...selection, code, method, key })]);
          await peer.unsafe("COMMIT"); return "reserved";
        } catch (error) {
          await peer.unsafe("ROLLBACK");
          const message = error instanceof Error ? error.message : "";
          if (!/COMMERCE_OFFER_LIMIT|RETRY_CONFLICT|REPLAY_CONFLICT/.test(message)) throw error;
          return "blocked";
        } finally { await peer.end(); }
      };
      expect((await Promise.all([run(false), run(true)])).sort()).toEqual(["blocked", "reserved"]);
      const total = (await db.query<{n: number}>("select ((select count(*) from billing.commerce_orders where offer_id=f.id)+(select count(*) from public.stripe_live_offer_reservations where offer_id=f.id))::int n from billing.commerce_offers f where code=$1", [code])).rows[0].n;
      expect(total).toBe(1);
    }
  }, 30000);
});