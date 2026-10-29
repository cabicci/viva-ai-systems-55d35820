// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Live offer reservation database rules (disposable PostgreSQL)", () => {
  it("enforces expired/used/market/interval/cap rules, immutable bindings and duplicate consumption", async () => {
    const db = new PGlite();
    try {
      await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA billing;
        CREATE TABLE billing.commerce_offers(id uuid primary key,code text,package text,kind text,value_minor bigint,currency text,enabled boolean,
          valid_until timestamptz,max_redemptions int,consumed_count int,require_phone boolean,billing_interval text);
        CREATE TABLE billing.commerce_orders(user_id uuid,recipient_email text,offer_id uuid,offer_consumed boolean,expires_at timestamptz,review_status text);
        CREATE TABLE billing.commerce_control(enabled boolean); INSERT INTO billing.commerce_control VALUES(true);
        CREATE TABLE billing.account_deletion_lifecycle(user_id uuid,stage text,financial_purged_at timestamptz);
        CREATE TABLE public.kids_stripe_prices(stripe_environment text,discounted boolean,market_code text,billing_interval text,gateway_price_id text,gateway_product_id text,amount_minor bigint);
        CREATE FUNCTION billing.commerce_price(text,text,text) RETURNS jsonb LANGUAGE sql AS $$select '{"original_minor":19900}'::jsonb$$;
        CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql AS $$select true$$;
        CREATE FUNCTION billing.current_stripe_environment() RETURNS text LANGUAGE sql AS $$select 'live'$$;
        CREATE FUNCTION billing.account_deletion_blocked(uuid) RETURNS boolean LANGUAGE sql AS $$select false$$;
        CREATE FUNCTION billing.commerce_assert_identity(uuid) RETURNS text LANGUAGE sql AS $$select 'fixture@example.invalid'$$;
        CREATE FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid DEFAULT NULL,uuid DEFAULT NULL) RETURNS void LANGUAGE sql AS $$select$$;
        CREATE FUNCTION public.get_stripe_live_risk_hold(text,uuid) RETURNS boolean LANGUAGE sql AS $$select false$$;
        CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$select $1='99999999-9999-4999-8999-999999999999'::uuid$$;
        CREATE FUNCTION billing.commerce_quote(p text,m text,i text,c text,e text,r boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql AS $$
          BEGIN IF m<>'EG' OR i<>'month' OR NOT EXISTS(SELECT 1 FROM billing.commerce_offers WHERE code=c AND enabled AND valid_until>now()) THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
          RETURN '{"original_minor":19900,"final_minor":17910,"offer_kind":"percent"}'::jsonb; END $$;`);
      for (const file of ["0014_stripe_live_offer_mapping_prerequisite.sql", "0015_stripe_live_offer_reservations.sql", "0016_stripe_live_offer_retention_and_replay.sql", "0017_stripe_live_offer_retention_stage_fix.sql", "0018_stripe_live_offer_binding_lifetime_closure.sql", "0019_stripe_live_offer_catalogue_binding.sql", "0020_stripe_live_offer_retry_input_closure.sql", "0021_stripe_live_offer_cross_channel_phone_guard.sql", "0022_live_offer_admin_operations.sql"])
        await db.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
      const offer = "11111111-1111-4111-8111-111111111111", user = "22222222-2222-4222-8222-222222222222", key = "33333333-3333-4333-8333-333333333333";
      const admin = "99999999-9999-4999-8999-999999999999";
      await expect(db.query("select public.stripe_live_offer_admin($1,'list','{}')", [user])).rejects.toThrow("ADMIN_REQUIRED");
      expect((await db.query<{allowed:boolean}>("select has_function_privilege('authenticated','public.stripe_live_offer_admin(uuid,text,jsonb)','EXECUTE') as allowed")).rows[0]?.allowed).toBe(false);
      await db.exec(`INSERT INTO public.kids_stripe_prices VALUES('live',false,'EG','month','price_fixture','prod_fixture',19900);
        INSERT INTO billing.commerce_offers VALUES('${offer}','SYNTHETIC','kids','percent',10,'EGP',true,now()+interval '1 day',1,0,false,'month');
        INSERT INTO public.stripe_live_offer_mappings(offer_id,version,package,market_code,currency,billing_interval,price_id,product_id,coupon_id,promotion_code_id,kind,value_minor,duration,reviewed_at,enabled)
        VALUES('${offer}',1,'kids','EG','EGP','month','price_fixture','prod_fixture','coupon_fixture','promo_fixture','percent',10,'once',now(),true);`);
      const reserve = (market = "EG", interval = "month", requestKey = key) => db.query<{value: {id: string}}>(
        "select public.reserve_stripe_live_offer($1,'SYNTHETIC','kids',$2,$3,NULL,$4,false) as value", [user,market,interval,requestKey]);
      await expect(reserve("INTL")).rejects.toThrow("INELIGIBLE");
      await expect(reserve("EG", "year")).rejects.toThrow("INELIGIBLE");
      await db.exec(`UPDATE billing.commerce_offers SET valid_until=now()-interval '1 second' WHERE id='${offer}'`);
      await expect(reserve()).rejects.toThrow("INELIGIBLE");
      await db.exec(`UPDATE billing.commerce_offers SET valid_until=now()+interval '1 day' WHERE id='${offer}'`);
      const first = (await reserve()).rows[0]?.value;
      if (!first) throw new Error("missing reservation");
      expect((await reserve()).rows[0]?.value.id).toBe(first.id);
      await expect(reserve("EG", "month", "44444444-4444-4444-8444-444444444444")).rejects.toThrow();
      await expect(db.query("select billing.commerce_quote('kids','EG','month','SYNTHETIC','fixture@example.invalid',false)")).rejects.toThrow("LIMIT");
      await db.query("select public.bind_stripe_live_offer($1,$2,'cus_fixture','cs_fixture')", [first.id,user]);
      const release = { id: first.id, key: "55555555-5555-4555-8555-555555555555", session_id: "cs_fixture", customer_id: "cus_fixture", status: "complete", payment_status: "unpaid", terminal_verified: true };
      await expect(db.query("select public.stripe_live_offer_admin($1,'release',$2)", [admin,JSON.stringify(release)])).rejects.toThrow("RELEASE_UNPROVEN");
      await expect(db.query("select public.bind_stripe_live_offer($1,$2,'cus_other','cs_fixture')", [first.id,user])).rejects.toThrow("BINDING_CONFLICT");
      await db.query("select public.consume_stripe_live_offer($1,$2,'sub_fixture','in_fixture','cus_fixture')", [first.id,user]);
      await db.query("select public.consume_stripe_live_offer($1,$2,'sub_fixture','in_fixture','cus_fixture')", [first.id,user]);
      expect((await db.query<{n:number}>("select consumed_count as n from billing.commerce_offers")).rows[0]?.n).toBe(1);
      await expect(db.query("select public.stripe_live_offer_admin($1,'release',$2)", [admin,JSON.stringify({ ...release, status: "expired" })])).rejects.toThrow("RELEASE_UNPROVEN");
      const rid = "66666666-6666-4666-8666-666666666666";
      await db.exec(`INSERT INTO public.stripe_live_offer_reservations(id,mapping_id,offer_id,user_id,recipient_email,request_key,expires_at,original_minor,final_minor,customer_id,session_id)
        SELECT '${rid}',mapping_id,offer_id,'77777777-7777-4777-8777-777777777777','terminal@example.invalid','88888888-8888-4888-8888-888888888888','infinity',19900,17910,'cus_terminal','cs_terminal' FROM public.stripe_live_offer_reservations WHERE id='${first.id}'`);
      const terminal = { ...release,id:rid,key:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",session_id:"cs_terminal",customer_id:"cus_terminal",status:"expired" };
      await db.query("select public.stripe_live_offer_admin($1,'release',$2)", [admin,JSON.stringify(terminal)]);
      await db.query("select public.stripe_live_offer_admin($1,'release',$2)", [admin,JSON.stringify(terminal)]);
      expect((await db.query<{n:number}>("select count(*)::int as n from public.stripe_live_offer_admin_audit where action='release'")).rows[0]?.n).toBe(1);
      expect((await db.query<{expired:boolean}>("select expires_at<=now() as expired from public.stripe_live_offer_reservations where id=$1",[rid])).rows[0]?.expired).toBe(true);
      await expect(db.query("select public.consume_stripe_live_offer($1,$2,'sub_terminal','in_terminal','cus_terminal')",[rid,"77777777-7777-4777-8777-777777777777"])).rejects.toThrow("RELEASED");
      await expect(db.query("select public.stripe_live_offer_admin($1,'release',$2)",[admin,JSON.stringify({...terminal,customer_id:'cus_other'})])).rejects.toThrow("REPLAY_CONFLICT");
      await db.query("delete from public.stripe_live_offer_reservations where id=$1",[rid]);
      await expect(reserve()).rejects.toThrow("REPLAY_CONFLICT");
      await expect(db.exec("UPDATE public.stripe_live_offer_mappings SET value_minor=20")).rejects.toThrow(/IMMUTABLE|DEFINITION_MISMATCH/);
      await expect(db.exec("UPDATE public.stripe_live_offer_mappings SET version=2")).rejects.toThrow("IMMUTABLE");
      await db.exec(`INSERT INTO billing.account_deletion_lifecycle VALUES('${user}','learner_erased',NULL);
        UPDATE billing.account_deletion_lifecycle SET stage='learner_erased' WHERE user_id='${user}'`);
      expect((await db.query<{phone:string|null,email:string}>("select phone,recipient_email as email from public.stripe_live_offer_reservations")).rows[0]).toEqual({phone:null,email:""});
      await db.exec(`UPDATE billing.account_deletion_lifecycle SET financial_purged_at=now() WHERE user_id='${user}'`);
      expect((await db.query<{n:number}>("select count(*)::int as n from public.stripe_live_offer_reservations")).rows[0]?.n).toBe(0);
    } finally { await db.close(); }
  }, 30000);
});