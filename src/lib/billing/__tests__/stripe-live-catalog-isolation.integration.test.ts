import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const draft = readFileSync("docs/billing/20260923_stripe_live_catalog_isolation.sql", "utf8");
const rollback = readFileSync(
  "docs/billing/20260923_stripe_live_catalog_isolation.rollback.sql",
  "utf8",
);
const schema = readFileSync("supabase/migrations/20260709190000_billing_schema_phase1.sql", "utf8");
const marketPrice = "00000000-0000-0000-0000-000000000101";
const otherPrice = "00000000-0000-0000-0000-000000000102";
const userId = "00000000-0000-0000-0000-000000000103";
let db: PGlite;

const rows = async (statement: string) => (await db.query<Record<string, unknown>>(statement)).rows;
const serviceRole = async () => {
  await db.query("select set_config('request.jwt.claim.role', 'service_role', false)");
};

describe("review-only Stripe Live catalog separation", () => {
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`create role anon; create role authenticated; create role service_role;
      ${schema}
      create function billing.is_service_role_caller() returns boolean language sql stable as $$
        select current_setting('request.jwt.claim.role', true)='service_role'
      $$;
      insert into billing.entitlement_policy_versions
        (policy_key,version_number,status,effective_from,lesson_allowlist_mode,
         builder_access,video_access,rag_enabled,mission_evaluation_enabled,
         reveal_answer_enabled,wow_path_enabled)
      values ('pro',1,'published',now(),'explicit_list',false,true,true,true,true,true);
      insert into billing.plan_catalog (plan_key,display_name,plan_family)
      values ('pro','{}','paid');
      insert into billing.plan_versions
        (plan_id,entitlement_policy_version_id,version_number,billing_interval,status,effective_from)
      select p.id,e.id,1,'month','published',now()-interval '1 hour'
      from billing.plan_catalog p cross join billing.entitlement_policy_versions e;
      insert into billing.market_prices
        (id,plan_version_id,market_code,currency_code,amount_minor,tax_behavior,status,effective_from)
      select '${marketPrice}',id,'EG','EGP',16900,'exclusive','active',now()-interval '1 hour'
      from billing.plan_versions;
      insert into billing.market_prices
        (id,plan_version_id,market_code,currency_code,amount_minor,tax_behavior,status,effective_from)
      select '${otherPrice}',id,'INTL','USD',699,'exclusive','active',now()-interval '1 hour'
      from billing.plan_versions;
      insert into billing.gateway_price_mappings
        (market_price_id,gateway_code,gateway_price_id,gateway_product_id,status)
      values ('${marketPrice}','stripe_us','price_test_one','prod_test_one','active');`);
    await db.exec(draft);
    await db.query("select set_config('request.jwt.claim.role', 'anon', false)");
  }, 30_000);

  afterEach(async () => {
    await db?.close();
  });

  it("keeps TEST mapping and context isolated from Live while enforcing service role", async () => {
    await expect(
      rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_one','prod_live_one')`),
    ).rejects.toThrow("STRIPE_CATALOG_SERVICE_ONLY");
    await serviceRole();
    await rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_one','prod_live_one')`);
    const context = (
      await rows(`select public.get_stripe_checkout_context_live(
      '${userId}','pro','month','EG') as c`)
    )[0].c as Record<string, unknown>;
    expect(context).toMatchObject({
      mode: "live",
      gateway_code: "stripe_us_live",
      gateway_price_id: "price_live_one",
      gateway_product_id: "prod_live_one",
      gateway_customer_id: null,
      subscription_id: null,
      amount_minor: 16900,
    });
    expect(
      await rows(`select gateway_code,gateway_price_id from billing.gateway_price_mappings
      where market_price_id='${marketPrice}' order by gateway_code`),
    ).toEqual([
      { gateway_code: "stripe_us", gateway_price_id: "price_test_one" },
      { gateway_code: "stripe_us_live", gateway_price_id: "price_live_one" },
    ]);
    expect(
      (await rows(`select public.resolve_stripe_subscription_plan_live('price_test_one') as p`))[0]
        .p,
    ).toBeNull();
    expect(
      (await rows(`select public.resolve_stripe_subscription_plan_live('price_live_one') as p`))[0]
        .p,
    ).toMatchObject({ gateway_code: "stripe_us_live", market_price_id: marketPrice });
  });

  it("rejects conflicting catalog identity and the same Live price reused for another market", async () => {
    await serviceRole();
    await rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_one','prod_live_one')`);
    await rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_one','prod_live_one')`);
    await expect(
      rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_other','prod_live_one')`),
    ).rejects.toThrow("LIVE_CATALOG_MAPPING_CONFLICT");
    await expect(
      rows(`select public.register_stripe_gateway_catalog_live(
      '${otherPrice}','price_live_one','prod_live_one')`),
    ).rejects.toThrow();
    await expect(
      rows(`select public.register_stripe_gateway_catalog_live(
      '${otherPrice}','price_test_one','bad-id')`),
    ).rejects.toThrow("INVALID_LIVE_CATALOG_IDS");
  });

  it("rolls back only with no Live records and leaves TEST data intact", async () => {
    await serviceRole();
    await rows(`select public.register_stripe_gateway_catalog_live(
      '${marketPrice}','price_live_one','prod_live_one')`);
    await expect(db.exec(rollback)).rejects.toThrow("LIVE_RECORDS_PRESENT_ROLLBACK_FORBIDDEN");
    await db.exec("ROLLBACK");
    await db.query(
      "delete from billing.gateway_price_mappings where gateway_code='stripe_us_live'",
    );
    await db.exec(rollback);
    expect(
      (await rows("select gateway_price_id from billing.gateway_price_mappings"))[0]
        .gateway_price_id,
    ).toBe("price_test_one");
    await expect(
      rows(`select public.get_stripe_checkout_context_live(
      '${userId}','pro','month','EG')`),
    ).rejects.toThrow();
    await expect(
      db.query(`insert into billing.gateway_price_mappings
      (market_price_id,gateway_code,gateway_price_id,status)
      values ('${otherPrice}','stripe_us_live','price_live_two','active')`),
    ).rejects.toThrow();
  });
});
