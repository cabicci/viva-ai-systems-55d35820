// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";

let db: PGlite;
const user = randomUUID();
const other = randomUUID();
const subscription = randomUUID();
const query = async (statement: string) =>
  (await db.query<{ value: unknown }>(statement)).rows[0]?.value;
const migration = (name: string) => readFileSync(`supabase/migrations/${name}`, "utf8");
const claim = async () =>
  (await query(`SELECT public.lc09_claim_deletion('${user}') AS value`)) as {
    lease_token: string;
    stage: string;
  };
const advance = async (lease: string, next: string) =>
  query(`SELECT public.lc09_advance_deletion('${user}','${lease}','${next}') AS value`);
async function expectDenied(action: () => Promise<unknown>, pattern: RegExp) {
  await db.exec("SAVEPOINT expected_denial");
  try {
    await expect(action()).rejects.toThrow(pattern);
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT expected_denial; RELEASE SAVEPOINT expected_denial");
  }
}

describe("LC-09 disabled lifecycle, erasure and financial replay", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT jsonb_build_object('role',current_setting('request.jwt.claim.role',true))$$;
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('request.jwt.claim.role',true)$$;
      CREATE TYPE public.app_role AS ENUM('admin','user');
      CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
      CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)$$;
      CREATE TABLE public.lc09_policy_probe(value integer); INSERT INTO public.lc09_policy_probe VALUES(1);
      ALTER TABLE public.lc09_policy_probe ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON public.lc09_policy_probe TO authenticated;
      CREATE POLICY administrator_read ON public.lc09_policy_probe TO authenticated USING(public.has_role(auth.uid(),'admin'));
      CREATE TABLE public.user_subscriptions(user_id uuid PRIMARY KEY,tier text,status text,current_period_end timestamptz);
      CREATE TABLE public.lesson_progress(user_id uuid,lesson_id text);
      CREATE FUNCTION public.delete_my_account_data() RETURNS void LANGUAGE sql AS $$SELECT$$;
      GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;`);
    for (const name of [
      "20260709190000_billing_schema_phase1.sql",
      "20260710153000_billing_service_role_auth_fix.sql",
      "20260722180000_billing_launch_closure_contracts_v3.sql",
      "20260722190000_billing_v3_corrective_refresh.sql",
      "20260914190000_billing_entitlement_snapshot_validity.sql",
      "20260915070000_billing_paid_ai_quota_alignment.sql",
      "20260916183000_billing_pro_71_lesson_contract.sql",
      "20260917120000_stripe_test_checkout_bridge.sql",
      "20260923123000_account_deletion_request_gate.sql",
      "20260924190000_kids_parent_content_access_foundation.sql",
      "20260925120000_kids_parent_access_review.sql",
      "20260925140000_kids_market_release_gates.sql",
      "20260925160000_kids_family_profile_limit.sql",
      "20260925190000_kids_retention_email.sql",
      "20260925210000_kids_profile_consent.sql",
      "20260927110000_kids_parent_self_attestation.sql",
      "20260928100000_kids_parent_privacy_record.sql",
      "20260928120000_kids_stripe_test_billing.sql",
      "20260929110000_kids_refund_reentry_and_access_status.sql",
    ])
      await db.exec(migration(name));
    // Exercise the runtime generation extension as well as cumulative migration
    // functions. The wrapper must retain this installed implementation.
    await db.exec(
      readFileSync("docs/billing/20260918_stripe_resubscription_generation_guard.sql", "utf8"),
    );
    await db.exec(migration("20261001153000_account_deletion_lifecycle.sql"));
  }, 30_000);
  afterAll(async () => db?.close());
  beforeEach(async () => {
    await db.exec(`BEGIN;
      SELECT set_config('request.jwt.claim.role','service_role',false);
      INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${user}','same@example.test',now()),('${other}','other@example.test',now());
      INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');
      INSERT INTO billing.subscriptions(id,user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key)
      VALUES('${subscription}','${user}','paid_active','active','EG','EGP','month','lc09-sub');
      INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status,metadata)
      VALUES('${user}','stripe_us','cus_lc09','active','{"mode":"test"}');
      INSERT INTO public.lesson_progress VALUES('${user}','lesson-1'),('${other}','lesson-2');
      INSERT INTO billing.user_entitlement_snapshots(user_id,snapshot_version,access_state,entitlement_json,generated_at,expires_at)
      VALUES('${user}',1,'paid_active','{"paid_content_entitled":true}',now(),now()+interval '1 hour');`);
  });
  afterEach(async () => db.exec("ROLLBACK"));
  const enable = async () =>
    db.exec(`UPDATE billing.account_deletion_control SET enabled=true,
    financial_retention_reference='synthetic-finance',crm_retention_reference='synthetic-crm',
    responder_reference='synthetic-owner',release_reference='synthetic-release'`);

  it("does not block access from a request, and cannot start without explicit policy and rollout", async () => {
    expect(
      await query(
        `SELECT billing.get_entitlement_snapshot('${user}')->>'paid_content_entitled' AS value`,
      ),
    ).toBe("true");
    await expectDenied(claim, /LC09_DISABLED/);
    await expectDenied(
      () => db.exec("UPDATE billing.account_deletion_control SET enabled=true"),
      /check constraint/,
    );
    expect(
      await query("SELECT count(*)::int AS value FROM billing.account_deletion_lifecycle"),
    ).toBe(0);
  });

  it("blocks cached entitlements, AI reservations, admin grants and fresh Checkout", async () => {
    await enable();
    await claim();
    expect(
      await query(
        `SELECT billing.get_entitlement_snapshot('${user}')->>'paid_content_entitled' AS value`,
      ),
    ).toBe("false");
    expect(
      await query(
        `SELECT billing.evaluate_access('${user}','lesson','lesson-1')->>'allowed' AS value`,
      ),
    ).toBe("false");
    await expectDenied(
      () =>
        db.exec(
          `SELECT billing.reserve_ai_quota('${user}','assistant_runtime','lesson-1','${randomUUID()}',1,'quota')`,
        ),
      /ACCOUNT_DELETION_PENDING/,
    );
    await expectDenied(
      () => db.exec(`SELECT public.get_stripe_checkout_context('${user}','pro','month','EG')`),
      /ACCOUNT_DELETION_PENDING/,
    );
    await db.exec(
      `UPDATE billing.subscriptions SET access_state='paid_active' WHERE user_id='${user}'`,
    );
    expect(
      await query(
        `SELECT access_state AS value FROM billing.subscriptions WHERE user_id='${user}'`,
      ),
    ).toBe("suspended");
    await db.exec(`INSERT INTO billing.user_entitlement_snapshots(user_id,snapshot_version,access_state,entitlement_json,generated_at,expires_at)
      VALUES('${user}',2,'paid_active','{"paid_content_entitled":true}',now(),now()+interval '1 hour')`);
    expect(
      await query(
        `SELECT entitlement_json->>'paid_content_entitled' AS value FROM billing.user_entitlement_snapshots WHERE snapshot_version=2`,
      ),
    ).toBe("false");
    await expectDenied(
      () => db.exec(`INSERT INTO public.lesson_progress VALUES('${user}','resurrected')`),
      /ACCOUNT_DELETION_PENDING/,
    );
  });

  it("preserves signed late payment evidence idempotently without restoring a plan", async () => {
    await enable();
    await claim();
    const late = `SELECT public.apply_stripe_webhook_event('evt_lc09','invoice.paid',now(),'payment_succeeded',
      '${subscription}','${user}',NULL,NULL,'cus_lc09','sub_lc09','active',now(),now()+interval '1 month',false,
      'pi_lc09',1000,'EGP','{}') AS value`;
    expect(await query(late)).toMatchObject({
      processed: true,
      access_suppressed: true,
      duplicate: false,
    });
    expect(await query(late)).toMatchObject({
      processed: true,
      access_suppressed: true,
      duplicate: true,
    });
    expect(
      await query(
        "SELECT count(*)::int AS value FROM billing.payment_transactions WHERE gateway_transaction_id='pi_lc09'",
      ),
    ).toBe(1);
    expect(
      await query(
        `SELECT access_state AS value FROM billing.subscriptions WHERE user_id='${user}'`,
      ),
    ).toBe("suspended");
  });

  it("requires a current lease, rejects a second worker, and erases only the requested learner", async () => {
    await enable();
    const c = await claim();
    await expectDenied(claim, /LC09_WORKER_BUSY/);
    await expectDenied(() => advance(randomUUID(), "provider_reconciled"), /LC09_LEASE_LOST/);
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.lesson_progress WHERE user_id='${user}'`,
      ),
    ).toBe(0);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.lesson_progress WHERE user_id='${other}'`,
      ),
    ).toBe(1);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM billing.subscriptions WHERE user_id='${user}'`,
      ),
    ).toBe(1);
    await expectDenied(() => advance(c.lease_token, "complete"), /LC09_AUTH_IDENTITY_STILL_EXISTS/);
    await db.exec(`DELETE FROM auth.users WHERE id='${user}'`);
    await advance(c.lease_token, "complete");
    expect(await claim()).toEqual({ stage: "complete" });
    const fresh = randomUUID();
    await db.exec(`INSERT INTO auth.users(id,email) VALUES('${fresh}','same@example.test')`);
    expect(
      await query(
        `SELECT billing.get_entitlement_snapshot('${fresh}')->>'paid_content_entitled' AS value`,
      ),
    ).toBe("false");
  });

  it("erases Kids profiles, progress, consents and parent records, preserving the other family and financial receipts", async () => {
    const child = randomUUID(),
      otherChild = randomUUID(),
      policy = randomUUID();
    await db.exec(`UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true;
      UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='synthetic-review' WHERE country_code='EG';
      INSERT INTO public.kids_consent_policies(id,country_code,version,locale,notice_text,consent_text,review_reference,enabled)
        VALUES('${policy}','EG','test','en',repeat('notice ',20),repeat('consent ',4),'synthetic-review',true);
      INSERT INTO public.kids_parent_access_requests(parent_id,parent_email,adult_confirmed,status,country_code)
        VALUES('${user}','same@example.test',true,'approved','EG'),('${other}','other@example.test',true,'approved','EG');
      INSERT INTO public.kids_parent_verifications(parent_id,verified_at,verification_reference)
        VALUES('${user}',now(),'test'),('${other}',now(),'test');
      INSERT INTO public.kids_parent_attestations(parent_id,policy_id,country_code)
        VALUES('${user}','${policy}','EG'),('${other}','${policy}','EG');
      INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id)
        VALUES('${child}','${user}','Child A','level-1'),('${otherChild}','${other}','Child B','level-1');
      INSERT INTO public.kids_lesson_progress(profile_id,level_id,lesson_number,locale)
        VALUES('${child}','level-1',1,'en'),('${otherChild}','level-1',1,'en');
      INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference)
        VALUES('${child}','${user}','${policy}','test'),('${otherChild}','${other}','${policy}','test');
      INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference)
        VALUES('${user}',now()-interval '1 day',now()+interval '1 month','stripe-test:sub_kids'),
        ('${other}',now()-interval '1 day',now()+interval '1 month','other-family');
      INSERT INTO public.kids_retention_notices(parent_id,expiry,recipient_email,profile_ids)
        VALUES('${user}',now(),'same@example.test',ARRAY['${child}']::uuid[]);
      INSERT INTO public.kids_stripe_prices(market_code,billing_interval,discounted,currency_code,amount_minor,gateway_product_id,gateway_price_id)
        VALUES('EG','month',false,'egp',19900,'prod_kids','price_kids');
      INSERT INTO public.kids_stripe_subscriptions(parent_id,gateway_subscription_id,gateway_customer_id,gateway_price_id,status,latest_paid_invoice_id,paid_through,last_event_at)
        VALUES('${user}','sub_kids','cus_lc09','price_kids','active','in_kids',now()+interval '1 month',now());
      INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES('evt_before','${user}');
      INSERT INTO public.kids_stripe_refunds(refund_id,parent_id,invoice_id,amount_minor,status)
        VALUES('re_kids','${user}','in_kids',100,'succeeded');
      SELECT set_config('request.jwt.claim.sub','${user}',false);`);
    expect(await query("SELECT public.kids_parent_can_manage_profiles() AS value")).toBe(true);
    await enable();
    const c = await claim();
    expect(await query("SELECT public.kids_parent_can_manage_profiles() AS value")).toBe(false);
    expect(
      await query("SELECT count(*)::int AS value FROM public.get_my_kids_access_status()"),
    ).toBe(0);
    await expectDenied(
      () =>
        db.exec(
          `INSERT INTO public.kids_profiles(parent_id,display_name,level_id) VALUES('${user}','stale','level-1')`,
        ),
      /ACCOUNT_DELETION_PENDING/,
    );
    const late = `SELECT public.apply_kids_stripe_event('evt_kids_late','${user}','sub_kids','cus_lc09','price_kids','active',now(),true,'in_kids',now(),now()+interval '1 month') AS value`;
    expect(await query(late)).toBe(true);
    expect(await query(late)).toBe(false);
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    await db.exec(`DELETE FROM auth.users WHERE id='${user}'`);
    await advance(c.lease_token, "complete");
    for (const table of [
      "kids_profiles",
      "kids_profile_consents",
      "kids_parent_attestations",
      "kids_parent_verifications",
      "kids_parent_access_requests",
      "kids_family_entitlements",
    ]) {
      expect(
        await query(`SELECT count(*)::int AS value FROM public.${table} WHERE parent_id='${user}'`),
      ).toBe(0);
      expect(
        await query(
          `SELECT count(*)::int AS value FROM public.${table} WHERE parent_id='${other}'`,
        ),
      ).toBe(1);
    }
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.kids_lesson_progress WHERE profile_id='${child}'`,
      ),
    ).toBe(0);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.kids_lesson_progress WHERE profile_id='${otherChild}'`,
      ),
    ).toBe(1);
    expect(
      await query(
        `SELECT recipient_email AS value FROM public.kids_retention_notices WHERE parent_id='${user}'`,
      ),
    ).toBe(null);
    for (const table of ["kids_stripe_subscriptions", "kids_stripe_refunds"])
      expect(
        await query(`SELECT count(*)::int AS value FROM public.${table} WHERE parent_id='${user}'`),
      ).toBe(1);
    expect(await query(late.replace("evt_kids_late", "evt_after_auth"))).toBe(true);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.kids_family_entitlements WHERE parent_id='${user}'`,
      ),
    ).toBe(0);
  });

  it("requires financial settlement and rolls back erasure if an ownership table is unclassified", async () => {
    await enable();
    const c = await claim();
    await db.exec(`INSERT INTO billing.payment_transactions(subscription_id,user_id,gateway_code,gateway_transaction_id,
      transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at)
      VALUES('${subscription}','${user}','stripe_us','pi_pending','checkout','pending',100,'EGP','pending',now())`);
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /LC09_FINANCIAL_RECONCILIATION_PENDING/,
    );
    await db.exec("UPDATE billing.payment_transactions SET status='succeeded'");
    await advance(c.lease_token, "provider_reconciled");
    await db.exec("CREATE TABLE public.new_learner_data(user_id uuid)");
    await expectDenied(
      () => advance(c.lease_token, "learner_erased"),
      /LC09_UNCLASSIFIED_USER_TABLE/,
    );
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.lesson_progress WHERE user_id='${user}'`,
      ),
    ).toBe(1);
  });

  it("revokes client access to worker controls and preserved implementations", async () => {
    expect(
      await query(
        "SELECT has_table_privilege('authenticated','billing.account_deletion_lifecycle','SELECT') AS value",
      ),
    ).toBe(false);
    expect(
      await query(
        "SELECT has_function_privilege('authenticated','public.lc09_claim_deletion(uuid)','EXECUTE') AS value",
      ),
    ).toBe(false);
    expect(
      await query(
        "SELECT has_function_privilege('service_role','billing.lc09_previous_get_entitlement_snapshot(uuid)','EXECUTE') AS value",
      ),
    ).toBe(false);
    await db.exec("SELECT set_config('request.jwt.claim.role','authenticated',false)");
    await expectDenied(claim, /LC09_SERVICE_ONLY/);
  });

  it("preserves existing RLS policy bindings and denies a blocked administrator", async () => {
    await db.exec(`INSERT INTO public.user_roles VALUES('${user}','admin'),('${other}','admin');
      SELECT set_config('request.jwt.claim.sub','${user}',false);
      SET LOCAL ROLE authenticated;`);
    expect(await query("SELECT count(*)::int AS value FROM public.lc09_policy_probe")).toBe(1);
    await db.exec("RESET ROLE");
    await enable();
    await claim();
    await db.exec("SET LOCAL ROLE authenticated");
    expect(await query("SELECT count(*)::int AS value FROM public.lc09_policy_probe")).toBe(0);
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${other}',false)`);
    expect(await query("SELECT count(*)::int AS value FROM public.lc09_policy_probe")).toBe(1);
    await db.exec("RESET ROLE");
  });
});
