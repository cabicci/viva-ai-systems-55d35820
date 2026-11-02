// @vitest-environment node
import {
  runMeteredQuestion,
  recordedQuestionProvider,
  type QuestionRpc,
  type QuestionIdentity,
} from "../../../../supabase/functions/assistant-runtime/question-metering";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const child = "33333333-3333-4333-8333-333333333333";
const child2 = "44444444-4444-4444-8444-444444444444";
const admin = "99999999-9999-4999-8999-999999999999";
const fingerprint = "a".repeat(64);
let sequence = 0;
const uuid = () => `aaaaaaaa-aaaa-4aaa-8aaa-${String(++sequence).padStart(12, "0")}`;
const emailAccessSql = readFileSync(
  "scripts/email-access/email-access-candidate.sql",
  "utf8",
).replaceAll("\r\n", "\n");
const installedEmailFunction = (start: string, end: string) =>
  emailAccessSql.slice(
    emailAccessSql.indexOf(start),
    emailAccessSql.indexOf(end, emailAccessSql.indexOf(start)),
  );
type PurchaseResponse = {
  id: string;
  price_id: string;
  product_id: string;
  customer_id: string | null;
  amount_minor: number;
  currency: string;
};
type InvitationSummary = {
  grant_kind: "comprehensive" | "single_curriculum";
  monthly_questions: number;
};

// Only pre-existing dependencies are fixtures. The complete actual forward
// migration, its locking/selection/RLS/functions and every new table run in PG.
const baseline = `
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA auth; CREATE SCHEMA billing;
 CREATE TYPE public.app_role AS ENUM ('admin');
 CREATE TABLE auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,created_at timestamptz default now(),blocked boolean default false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
 CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('fixture.service',true),'yes')='yes'$$;
 CREATE FUNCTION billing.commerce_account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=$1 AND NOT blocked)$$;
 CREATE FUNCTION billing.commerce_assert_identity(uuid) RETURNS text LANGUAGE plpgsql AS $$DECLARE e text; BEGIN SELECT email INTO e FROM auth.users WHERE id=$1 AND email_confirmed_at IS NOT NULL AND NOT blocked; IF e IS NULL THEN RAISE EXCEPTION 'IDENTITY'; END IF; RETURN e; END$$;
 CREATE TABLE billing.plan_catalog(id uuid primary key,plan_key text);
 CREATE TABLE billing.plan_versions(id uuid primary key,plan_id uuid);
 CREATE TABLE billing.subscriptions(id uuid primary key,user_id uuid,plan_version_id uuid,market_price_id uuid,access_state text,current_period_start timestamptz,current_period_end timestamptz,paid_activation_at timestamptz);
 CREATE FUNCTION billing.resolve_ai_assistant_limits(uuid) RETURNS TABLE(general_monthly_limit int,per_lesson_limit int) LANGUAGE sql AS $$SELECT 50,3$$;
 CREATE TABLE billing.academic_stripe_subscriptions(subscription_id text primary key,user_id uuid,price_id text,starts_at timestamptz,ends_at timestamptz,status text,refunded boolean default false);
 CREATE TABLE billing.academic_stripe_prices(gateway_price_id text primary key,course_id text,includes_assistant boolean);
 CREATE TABLE billing.entitlement_policy_versions(policy_key text,status text,effective_from timestamptz,effective_to timestamptz,assistant_runtime_general_monthly_quota int,assistant_runtime_per_lesson_quota int);
 INSERT INTO billing.entitlement_policy_versions VALUES('pro','published',now()-interval '1 year',NULL,50,3),('pro_plus','published',now()-interval '1 year',NULL,150,6);
 CREATE TABLE billing.technical_stripe_subscriptions(LIKE billing.academic_stripe_subscriptions INCLUDING ALL);
 CREATE TABLE public.kids_family_entitlements(parent_id uuid primary key,active_from timestamptz,active_until timestamptz);
 CREATE TABLE billing.gateway_customers(user_id uuid,stripe_environment text,gateway_code text,gateway_customer_id text);
 CREATE FUNCTION billing.stripe_gateway_code() RETURNS text LANGUAGE sql AS $$SELECT 'stripe_us_live'$$;
 CREATE TABLE billing.entitlement_usage(user_id uuid,usage_category text,period_start timestamptz,period_end timestamptz,used_count int,reserved_count int,lesson_id text);
 CREATE TABLE billing.ai_topup_purchases(id uuid,expires_at timestamptz NOT NULL);
 CREATE TABLE billing.ai_credit_ledger(id uuid default gen_random_uuid(),user_id uuid,entry_type text,credit_units int,balance_after int,source_type text,source_id uuid,expires_at timestamptz,idempotency_key text unique,occurred_at timestamptz,metadata jsonb default '{}');
 CREATE TABLE billing.commerce_lesson_catalog(lesson_id text primary key,path_id text);
 INSERT INTO billing.commerce_lesson_catalog VALUES('intro-m1-l1-what-is-ai','intro'),('business-m1-l2-paid','business');
 CREATE TABLE billing.commerce_control(access_enabled boolean); INSERT INTO billing.commerce_control VALUES(true);
 CREATE FUNCTION billing.commerce_quote(text,text,text,text,text,boolean DEFAULT false) RETURNS jsonb LANGUAGE sql AS $$SELECT '{"original_minor":30900,"final_minor":30900}'::jsonb$$;
 CREATE TABLE billing.commerce_entitlements(id uuid primary key,user_id uuid,package text,starts_at timestamptz,ends_at timestamptz,revoked_at timestamptz);
 CREATE TABLE public.kids_release_control(singleton boolean,lesson_access_enabled boolean,accepts_child_data boolean); INSERT INTO public.kids_release_control VALUES(true,true,true);
 CREATE TABLE public.kids_content_approvals(level_id text,lesson_number int,locale text);
 INSERT INTO public.kids_content_approvals VALUES('level-1',3,'ar-EG');
 CREATE TABLE public.kids_profiles(id uuid primary key,parent_id uuid,level_id text,display_name text);
 CREATE FUNCTION public.kids_parent_can_manage_profiles() RETURNS boolean LANGUAGE sql AS $$SELECT auth.uid() IS NOT NULL$$;
 CREATE FUNCTION public.kids_profile_has_consent(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=$1 AND parent_id=auth.uid())$$;
 CREATE TABLE public.technical_release_control(enabled boolean); INSERT INTO public.technical_release_control VALUES(true);
 CREATE TABLE public.technical_lesson_content(lesson_id text,locale text); INSERT INTO public.technical_lesson_content VALUES('M01-L02','ar-EG');
 CREATE TABLE public.academic_courses(id text primary key,titles jsonb,enabled boolean,assistant_enabled boolean,assistant_review_enabled boolean default false);
 INSERT INTO public.academic_courses(id,titles,enabled,assistant_enabled) VALUES('AC-BUS','{"en":"Business"}',true,true),('AC-OTHER','{"en":"Other"}',true,true);
 CREATE TABLE public.academic_assistant_policy(course_id text,runtime_enabled boolean);
 INSERT INTO public.academic_assistant_policy VALUES('AC-BUS',true),('AC-OTHER',true);
 CREATE FUNCTION public.academic_review_allowed(text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE FUNCTION public.assistant_card_content_access(uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('card_id',$2,'admin_review',false,'lessons','{}'::jsonb)$$;
 CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,approved boolean,introductory boolean);
 CREATE TABLE public.academic_content_course_grants(entitlement_id uuid,course_id text);
 CREATE TABLE public.academic_assistant_course_grants(entitlement_id uuid,course_id text);
 CREATE TABLE public.academic_assistant_questions(user_id uuid,course_id text,lesson_id text,created_at timestamptz);
 INSERT INTO public.academic_lesson_content VALUES('AC-BUS','L1','ar-EG',true,false),('AC-OTHER','L1','ar-EG',true,false);
 CREATE TABLE public.card_assistant_policy(area text,card_id text,questions_per_hour int,runtime_enabled boolean default true);
 INSERT INTO public.card_assistant_policy(area,card_id,questions_per_hour) VALUES('kids','level-1',20),('technical','furniture',20);
 CREATE TABLE public.card_assistant_steps(area text,card_id text,step_id text,source_key text,kids_level text,kids_lesson int,technical_lesson text);
 INSERT INTO public.card_assistant_steps VALUES('kids','level-1','3','level-1:3','level-1',3,NULL),('technical','furniture','step','M01-L02',NULL,NULL,'M01-L02');
 CREATE TABLE billing.email_access_grants(id uuid primary key default gen_random_uuid(),recipient_email text,scope_mode text,catalogues text[],duration_days int,user_id uuid,activated_at timestamptz,ends_at timestamptz,revoked_at timestamptz,created_at timestamptz default now(),created_by uuid,request_key uuid unique default gen_random_uuid(),parameters jsonb default '{}');
 CREATE TABLE billing.email_access_audit(id uuid primary key default gen_random_uuid(),grant_id uuid,actor uuid,action text,request_key uuid unique,details jsonb default '{}',created_at timestamptz default now());
 CREATE TABLE billing.email_access_mail(id uuid primary key,locale text,status text default 'pending',claim_token uuid,lease_until timestamptz,first_attempt_at timestamptz,attempts int default 0,provider_id text,created_at timestamptz default now());
 CREATE FUNCTION billing.email_access_catalogues() RETURNS jsonb LANGUAGE sql AS $$SELECT '[{"id":"ai:pro","title":"AI Pro","titles":{"ar-EG":"الذكاء الاصطناعي"}},{"id":"ai:pro_plus","title":"AI"},{"id":"academic:AC-BUS","title":"Business"},{"id":"academic:AC-OTHER","title":"Other"},{"id":"technical:furniture","title":"Technical"},{"id":"kids","title":"Kids"}]'::jsonb$$;
 ${installedEmailFunction("CREATE FUNCTION billing.email_access_has(", "CREATE FUNCTION billing.email_access_activate(")}
 CREATE FUNCTION billing.email_access_activate(p_user uuid) RETURNS integer LANGUAGE plpgsql AS $$DECLARE v_email text; g record; BEGIN SELECT email INTO v_email FROM auth.users WHERE id=p_user; FOR g IN SELECT * FROM billing.email_access_grants WHERE recipient_email=v_email AND user_id IS NULL AND revoked_at IS NULL ORDER BY id FOR UPDATE LOOP UPDATE billing.email_access_grants SET user_id=p_user,activated_at=now() WHERE id=g.id; END LOOP; RETURN 0; END$$;
 CREATE FUNCTION billing.evaluate_access(p_user_id uuid,p_resource_type text,p_resource_id text) RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',billing.commerce_account_allowed(p_user_id) AND (p_resource_id='intro-m1-l1-what-is-ai' OR EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=p_user_id AND current_period_end>now()) OR EXISTS(SELECT 1 FROM billing.email_access_grants WHERE user_id=p_user_id AND activated_at<=now() AND (ends_at IS NULL OR ends_at>now()) AND revoked_at IS NULL)))$$;
 CREATE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean LANGUAGE sql AS $$SELECT billing.commerce_account_allowed(auth.uid()) AND (EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions WHERE user_id=auth.uid() AND ends_at>now() AND NOT refunded) OR EXISTS(SELECT 1 FROM billing.email_access_grants WHERE user_id=auth.uid() AND activated_at<=now() AND (ends_at IS NULL OR ends_at>now()) AND revoked_at IS NULL AND (scope_mode='all_published' OR ('academic:'||p_course)=ANY(catalogues))))$$;
 CREATE FUNCTION public.technical_can_access(text) RETURNS boolean LANGUAGE sql AS $$SELECT billing.email_access_has(auth.uid(),'technical:furniture') OR EXISTS(SELECT 1 FROM billing.technical_stripe_subscriptions WHERE user_id=auth.uid() AND ends_at>now() AND NOT refunded)$$;
 CREATE FUNCTION public.kids_can_access_lesson(uuid,text,int,text) RETURNS boolean LANGUAGE sql AS $$SELECT public.kids_profile_has_consent($1) AND (billing.email_access_has(auth.uid(),'kids') OR EXISTS(SELECT 1 FROM public.kids_family_entitlements WHERE parent_id=auth.uid() AND active_until>now()))$$;
 ${installedEmailFunction("CREATE FUNCTION public.email_access_command(", "-- Compose with each existing access authority;")}
 ${installedEmailFunction("CREATE FUNCTION public.email_access_mail(", "CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(")}
 CREATE FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
 CREATE FUNCTION public.lc09_complete_financial_purge(uuid,uuid,boolean DEFAULT false) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${user}','one@example.invalid',now()-interval '5 days'),('${other}','two@example.invalid',now()),('${admin}','admin@example.invalid',now());
 INSERT INTO public.kids_profiles VALUES('${child}','${user}','level-1','Child one'),('${child2}','${user}','level-1','Child two');
 INSERT INTO billing.plan_catalog VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pro');
 INSERT INTO billing.plan_versions VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
`;

describe("owner commercial policy, actual SQL in disposable PostgreSQL", () => {
  let db: PGlite;
  const value = async <T = unknown>(sql: string, params: unknown[] = []) =>
    (await db.query<{ v: T }>(sql, params)).rows[0]?.v;
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(baseline);
    await db.exec(readFileSync("drizzle/migrations/0027_commercial_policy_20261102.sql", "utf8"));
  });
  afterEach(async () => db?.close());
  async function withLegacyData(sql: string) {
    await db.close();
    db = new PGlite();
    await db.exec(baseline);
    await db.exec(sql);
    await db.exec(readFileSync("drizzle/migrations/0027_commercial_policy_20261102.sql", "utf8"));
  }
  const reserve = (
    request = uuid(),
    area = "ai",
    course = "ai",
    lesson = "intro-m1-l1-what-is-ai",
    kid: string | null = null,
  ) =>
    value<{ allowed: boolean; status: string }>(
      "SELECT public.reserve_assistant_question($1,$2,$3,$4,'ar-EG',$5,$6,$7) AS v",
      [user, area, course, lesson, kid, request, fingerprint],
    );
  const settle = (request: string, outcome = "answered", lesson = "intro-m1-l1-what-is-ai") =>
    value("SELECT public.settle_assistant_question($1,$2,$3,$4,$5) AS v", [
      user,
      request,
      fingerprint,
      outcome,
      JSON.stringify({ status: 200, body: { answer: "Fixture" }, proof: [{ lessonId: lesson }] }),
    ]);
  async function purchase(
    kind = "lifetime_course",
    area: string | null = "academic",
    course: string | null = "AC-BUS",
    kid: string | null = null,
    scope = "account",
  ) {
    const p = await value<PurchaseResponse>(
      "SELECT public.prepare_commercial_purchase($1,$2,$3,$4,$5,$6,$7) AS v",
      [user, kind, area, course, kid, uuid(), scope],
    );
    const session = `cs_live_${++sequence}`;
    await value("SELECT public.bind_commercial_purchase_session($1,$2,'cus_fixture',$3,$4) AS v", [
      p.id,
      session,
      p.price_id,
      p.product_id,
    ]);
    const args = [
      p.id,
      `evt_${++sequence}`,
      `pi_${++sequence}`,
      p.amount_minor,
      p.currency,
      new Date().toISOString(),
      session,
      "cus_fixture",
      p.price_id,
      p.product_id,
    ];
    await value(
      "SELECT public.fulfill_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS v",
      args,
    );
    return { ...p, session, args };
  }

  it("clamps month ends without drift and uses Cairo calendar days", async () => {
    const w = await value<{ starts_at: string; ends_at: string }>(
      "SELECT to_jsonb(w) AS v FROM billing.assistant_month_window('2024-01-31 12:00Z','2024-03-30 13:00Z') w",
    );
    expect(new Date(w.starts_at).toISOString()).toBe("2024-02-29T12:00:00.000Z");
    expect(new Date(w.ends_at).toISOString()).toBe("2024-03-31T12:00:00.000Z");
    expect(await value("SELECT billing.assistant_cairo_day('2026-07-01 21:30Z')::text AS v")).toBe(
      "2026-07-02",
    );
    expect(await value("SELECT billing.assistant_cairo_day('2026-01-01 21:30Z')::text AS v")).toBe(
      "2026-01-01",
    );
  });

  it("enforces service-only writes and exact course and child purchase binding", async () => {
    expect(
      await value("SELECT public.assistant_card_content_access($1,'intro') AS v", [user]),
    ).toMatchObject({ lessons: { entitled_lesson_ids: ["intro-m1-l1-what-is-ai"] } });
    await db.query(
      "INSERT INTO billing.gateway_customers VALUES($1,'live','stripe_us_live','cus_fixture')",
      [user],
    );
    const p = await purchase();
    expect(p.customer_id).toBe("cus_fixture");
    expect(
      await value("SELECT billing.commercial_course_owned($1,'academic','AC-BUS') AS v", [user]),
    ).toBe(true);
    expect(
      await value("SELECT billing.commercial_course_owned($1,'academic','AC-OTHER') AS v", [user]),
    ).toBe(false);
    await expect(
      db.query(
        "SELECT public.prepare_commercial_purchase($1,'lifetime_course','kids','kids',$2,$3,'family')",
        [other, child, uuid()],
      ),
    ).rejects.toThrow("INVALID_SELECTION");
    expect(
      await value(
        "SELECT public.fulfill_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS v",
        p.args,
      ),
    ).toMatchObject({ replay: true });
    await db.exec("SET fixture.service='no'");
    await expect(reserve()).rejects.toThrow("SERVICE_ONLY");
  });

  it("holds a paid purchase permanently, including a hold arriving before fulfillment", async () => {
    const p = await purchase();
    await value(
      "SELECT public.apply_commercial_purchase_risk_hold('evt_hold',$1,$2,'refund') AS v",
      [p.session, p.args[2]],
    );
    expect(
      await value("SELECT billing.commercial_course_owned($1,'academic','AC-BUS') AS v", [user]),
    ).toBe(false);
    await expect(
      db.query("SELECT public.fulfill_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", p.args),
    ).rejects.toThrow("HELD");
  });

  it("settles only answered questions, replays once, and counts two daily out-of-course attempts free", async () => {
    const q = uuid();
    await reserve(q);
    expect(await settle(q)).toMatchObject({ charged_units: 1 });
    expect(await settle(q)).toMatchObject({ charged_units: 1, replay: true });
    expect(await reserve(q)).toMatchObject({ status: "replay", allowed: false });
    await expect(
      db.query(
        "SELECT public.reserve_assistant_question($1,'ai','ai','intro-m1-l1-what-is-ai','ar-EG',NULL,$2,$3)",
        [user, q, "b".repeat(64)],
      ),
    ).rejects.toThrow("CONFLICT");
    for (const outcome of ["system_failure", "insufficient", "out_of_scope", "out_of_scope"]) {
      const id = uuid();
      await reserve(id);
      expect(await settle(id, outcome)).toMatchObject({ charged_units: 0 });
    }
    const third = uuid();
    await reserve(third);
    expect(await settle(third, "out_of_scope")).toMatchObject({ charged_units: 1 });
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 8 });
  });

  it("uses first-month lifetime allowance once, then nonexpiring purchased credit", async () => {
    const p = await purchase();
    await purchase("question_topup", null, null, null);
    let id = uuid();
    await reserve(id, "academic", "AC-BUS", "L1");
    await settle(id);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 99, purchased_remaining: 100 });
    await db.query(
      "UPDATE billing.commercial_purchases SET paid_at=now()-interval '2 months' WHERE id=$1",
      [p.id],
    );
    id = uuid();
    await reserve(id, "academic", "AC-BUS", "L1");
    await settle(id);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 0, purchased_remaining: 99, access_allowed: true });
  });

  it("shares family topups only after each child's own allowance and never with another household", async () => {
    await purchase("lifetime_course", "kids", "kids", child, "family");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    expect(
      await value("SELECT public.card_assistant_access('kids','level-1','3','ar-EG',$1) AS v", [
        child,
      ]),
    ).toBe(true);
    expect(
      await value("SELECT public.card_assistant_access('kids','level-1','3','ar-EG',$1) AS v", [
        child2,
      ]),
    ).toBe(false);
    await purchase("lifetime_course", "kids", "kids", child2, "family");
    await purchase("question_topup", null, null, null, "family");
    const a = uuid();
    await reserve(a, "kids", "kids", "level-1:3", child);
    await settle(a);
    expect(
      await value("SELECT public.assistant_question_balance($1,'kids','kids',$2) AS v", [
        user,
        child2,
      ]),
    ).toMatchObject({ monthly_remaining: 100, purchased_remaining: 100 });
    expect(
      await value("SELECT public.assistant_question_balance($1,'kids','kids',$2) AS v", [
        other,
        child,
      ]),
    ).toMatchObject({ access_allowed: false, purchased_remaining: 0 });
    await db.query(
      "UPDATE billing.assistant_allowance_periods SET used=unit_limit WHERE user_id=$1 AND source_key=(SELECT 'lifetime:'||id FROM billing.commercial_purchases WHERE child_id=$2)",
      [user, child],
    );
    const b = uuid();
    await reserve(b, "kids", "kids", "level-1:3", child);
    await settle(b);
    expect(
      await value("SELECT public.assistant_question_balance($1,'kids','kids',$2) AS v", [
        user,
        child2,
      ]),
    ).toMatchObject({ monthly_remaining: 100, purchased_remaining: 99 });
  });

  it("does not grant 110 lifetime AI questions, and prevents duplicate lifetime purchases", async () => {
    await purchase("lifetime_course", "ai", "ai");
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 100 });
    await expect(
      db.query(
        "SELECT public.prepare_commercial_purchase($1,'lifetime_course','ai','ai',NULL,$2,'account')",
        [user, uuid()],
      ),
    ).rejects.toThrow("ALREADY_OWNED");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    expect(await value("SELECT public.get_my_commercial_access() AS v")).toMatchObject({
      ai_lifetime_access: true,
      ai_lesson_ids: ["business-m1-l2-paid", "intro-m1-l1-what-is-ai"],
    });
  });

  it("reuses a pending lifetime selection and releases it only after verified terminal unpaid expiry", async () => {
    const key = uuid();
    const first = await value<PurchaseResponse>(
      "SELECT public.prepare_commercial_purchase($1,'lifetime_course','ai','ai',NULL,$2,'account') AS v",
      [user, key],
    );
    const repeated = await value<PurchaseResponse>(
      "SELECT public.prepare_commercial_purchase($1,'lifetime_course','ai','ai',NULL,$2,'account') AS v",
      [user, uuid()],
    );
    expect(repeated.id).toBe(first.id);
    await value(
      "SELECT public.bind_commercial_purchase_session($1,'cs_live_expiry','cus_fixture',$2,$3) AS v",
      [first.id, first.price_id, first.product_id],
    );
    await expect(
      db.query(
        "SELECT public.close_commercial_purchase_session($1,'cs_live_expiry','cus_fixture','open','unpaid',NULL)",
        [first.id],
      ),
    ).rejects.toThrow("EVIDENCE_MISMATCH");
    await expect(
      db.query(
        "SELECT public.close_commercial_purchase_session($1,'cs_live_expiry','cus_fixture','expired','unpaid','pi_pending')",
        [first.id],
      ),
    ).rejects.toThrow("EVIDENCE_MISMATCH");
    expect(
      await value(
        "SELECT public.close_commercial_purchase_session($1,'cs_live_expiry','cus_fixture','expired','unpaid',NULL) AS v",
        [first.id],
      ),
    ).toEqual({ closed: true });
    await expect(
      db.query(
        "SELECT public.prepare_commercial_purchase($1,'lifetime_course','ai','ai',NULL,$2,'account')",
        [user, key],
      ),
    ).rejects.toThrow("REQUEST_EXPIRED");
    const replacement = await value<PurchaseResponse>(
      "SELECT public.prepare_commercial_purchase($1,'lifetime_course','ai','ai',NULL,$2,'account') AS v",
      [user, uuid()],
    );
    expect(replacement.id).not.toBe(first.id);
  });

  it("preserves actual Academic 150/6 and existing use until renewal, then applies 300 without the lesson cap", async () => {
    await withLegacyData(`INSERT INTO billing.academic_stripe_prices VALUES('price_academic','AC-BUS',true);
   INSERT INTO billing.academic_stripe_subscriptions VALUES('sub_academic','${user}','price_academic',now()-interval '10 days',now()+interval '20 days','active',false);
   INSERT INTO public.academic_assistant_questions VALUES('${user}','AC-BUS','L1',now()),('${user}','AC-BUS','L1',now());`);
    expect(
      await value(
        "SELECT jsonb_build_array(monthly_units,per_lesson_units) AS v FROM billing.commercial_legacy_terms WHERE source_key='academic:sub_academic'",
      ),
    ).toEqual([150, 6]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 148 });
    await db.exec(`UPDATE billing.commercial_legacy_terms SET first_new_period_at=now()-interval '1 day';
   UPDATE billing.academic_stripe_subscriptions SET starts_at=now(),ends_at=now()+interval '29 days';`);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 300 });
    expect(
      await value(
        "SELECT per_lesson AS v FROM billing.assistant_source_specs($1,'academic','AC-BUS',NULL,now())",
        [user],
      ),
    ).toBeNull();
  }, 15000);

  it("freezes manual paid quota until renewal and keeps the snapshot's price identity", async () => {
    const id = uuid();
    await withLegacyData(
      `INSERT INTO billing.commerce_entitlements VALUES('${id}','${user}','pro',now()-interval '10 days',now()+interval '20 days',NULL);`,
    );
    expect(
      await value(
        "SELECT jsonb_build_array(monthly_units,per_lesson_units,price_reference->>'package') AS v FROM billing.commercial_legacy_terms WHERE source_key=$1",
        [`commerce:${id}`],
      ),
    ).toEqual([50, 3, "pro"]);
    expect(
      await value(
        "SELECT units AS v FROM billing.assistant_source_specs($1,'ai','ai',NULL,now())",
        [user],
      ),
    ).toBe(50);
  }, 15000);

  it("adds a scoped invitation pool to paid allowance and starts new invitations only at acceptance", async () => {
    const invitation = uuid();
    await db.exec(`INSERT INTO billing.subscriptions VALUES('${uuid()}','${user}','cccccccc-cccc-4ccc-8ccc-cccccccccccc',NULL,'paid_active',now()-interval '1 day',now()+interval '29 days',now()-interval '1 day');
   INSERT INTO billing.email_access_grants(id,recipient_email,scope_mode,catalogues,duration_days) VALUES('${invitation}','one@example.invalid','selected',ARRAY['ai:pro'],NULL);`);
    await value("SELECT billing.email_access_activate($1) AS v", [user]);
    expect(
      await value("SELECT activated_at AS v FROM billing.email_access_grants WHERE id=$1", [
        invitation,
      ]),
    ).toBeNull();
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [other]);
    await expect(
      db.query("SELECT public.accept_commercial_invitation($1)", [invitation]),
    ).rejects.toThrow("DENIED");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    const accepted = await value<{ ends_at: string | null }>(
      "SELECT public.accept_commercial_invitation($1) AS v",
      [invitation],
    );
    expect(accepted.ends_at).toBeNull();
    expect(
      await value("SELECT public.accept_commercial_invitation($1) AS v", [invitation]),
    ).toEqual(accepted);
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 450 });
    expect(
      (
        await db.query(
          "SELECT * FROM billing.assistant_source_specs($1,'academic','AC-BUS',NULL,now())",
          [user],
        )
      ).rows,
    ).toHaveLength(0);
    await db.exec("UPDATE billing.subscriptions SET access_state='expired'");
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 300 });
    await db.exec("UPDATE billing.subscriptions SET access_state='paid_active'");
    await db.query("UPDATE billing.email_access_grants SET revoked_at=now() WHERE id=$1", [
      invitation,
    ]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 150 });
  });

  it("serializes simultaneous final-unit reservations, replay identities and provider telemetry", async () => {
    await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]);
    await db.query("UPDATE billing.assistant_allowance_periods SET used=9 WHERE user_id=$1", [
      user,
    ]);
    await db.query(
      "INSERT INTO billing.assistant_outside_days VALUES($1,billing.assistant_cairo_day(now()),2)",
      [user],
    );
    const a = uuid(),
      b = uuid();
    const results = await Promise.all([reserve(a), reserve(b)]);
    expect(results.filter((r) => r.allowed)).toHaveLength(1);
    expect(results.filter((r) => r.status === "quota_exceeded")).toHaveLength(1);
    const winning = results[0].allowed ? a : b;
    expect(await reserve(winning)).toMatchObject({ status: "in_progress", allowed: false });
    const attempt = uuid();
    expect(
      await value(
        "SELECT public.assistant_question_provider_attempt($1,$2,$3,'fixture',$4,'started') AS v",
        [user, winning, fingerprint, attempt],
      ),
    ).toEqual({ ok: true });
    await value(
      "SELECT public.assistant_question_provider_attempt($1,$2,$3,'fixture',$4,'succeeded') AS v",
      [user, winning, fingerprint, attempt],
    );
    await settle(winning);
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 0 });
    expect(
      await value(
        "SELECT has_function_privilege('authenticated','public.reserve_assistant_question(uuid,text,text,text,text,uuid,uuid,text)','EXECUTE') AS v",
      ),
    ).toBe(false);
  });

  it("accepts course-wide AI questions, checks actual source scope and stops answers after a risk hold", async () => {
    const p = await purchase("lifetime_course", "ai", "ai");
    const q = uuid();
    expect(
      await value(
        "SELECT public.reserve_assistant_question($1,'ai','ai',NULL,'ar-EG',NULL,$2,$3) AS v",
        [user, q, fingerprint],
      ),
    ).toMatchObject({ allowed: true });
    expect(await settle(q, "answered", "business-m1-l2-paid")).toMatchObject({ charged_units: 1 });
    const pending = uuid();
    await reserve(pending);
    await value(
      "SELECT public.apply_commercial_purchase_risk_hold('evt_revoke',$1,$2,'refund') AS v",
      [p.session, p.args[2]],
    );
    // Free introductory content remains available independently, but the paid
    // curriculum is no longer available for a cached or pending answer.
    const paid = uuid();
    await expect(reserve(paid, "ai", "ai", "business-m1-l2-paid")).rejects.toThrow("ACCESS_DENIED");
  });
  it("includes Academic assistant at its base price, exposes only own invitation labels and prunes replay text", async () => {
    expect(
      await value(
        "SELECT billing.academic_checkout_quote('academic','EG','month',NULL,'one@example.invalid',false,true) AS v",
      ),
    ).toMatchObject({ final_minor: 30900, academic_assistant: true, assistant_surcharge_minor: 0 });
    await db.query(
      "INSERT INTO billing.email_access_grants(recipient_email,scope_mode,catalogues) VALUES('one@example.invalid','selected',ARRAY['ai:pro']),('two@example.invalid','all_published','{}')",
    );
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    const invites = await value<{ catalogue_details: unknown }[]>(
      "SELECT public.get_my_commercial_invitations() AS v",
    );
    expect(invites).toHaveLength(1);
    expect(invites[0].catalogue_details).toEqual([
      { id: "ai:pro", title: "AI Pro", titles: { "ar-EG": "الذكاء الاصطناعي" } },
    ]);
    const q = uuid();
    await reserve(q);
    await settle(q);
    await db.query(
      "UPDATE billing.assistant_requests SET settled_at=now()-interval '25 hours' WHERE request_id=$1",
      [q],
    );
    expect(await value("SELECT public.prune_assistant_response_cache() AS v")).toEqual({
      pruned: 1,
    });
    expect(
      await value("SELECT response AS v FROM billing.assistant_requests WHERE request_id=$1", [q]),
    ).toBeNull();
    expect(
      await value("SELECT charged_units AS v FROM billing.assistant_requests WHERE request_id=$1", [
        q,
      ]),
    ).toBe(1);
  });
  it("runs the real shared runtime ledger against SQL: answer, replay, conflict, failures and Cairo outside attempts", async () => {
    await purchase("lifetime_course", "academic", "AC-BUS");
    const rpc: QuestionRpc = async (name, args) => {
      const parameters: Record<string, string[]> = {
        reserve_assistant_question: [
          "p_user_id",
          "p_area",
          "p_course",
          "p_lesson",
          "p_locale",
          "p_child_id",
          "p_request_id",
          "p_fingerprint",
        ],
        settle_assistant_question: [
          "p_user_id",
          "p_request_id",
          "p_fingerprint",
          "p_outcome",
          "p_response",
        ],
        assistant_question_provider_attempt: [
          "p_user_id",
          "p_request_id",
          "p_fingerprint",
          "p_model",
          "p_attempt_id",
          "p_status",
        ],
      };
      if (!parameters[name]) throw new Error("Unexpected test RPC");
      const values = parameters[name].map((key) =>
        key === "p_response" ? JSON.stringify(args[key]) : args[key],
      );
      try {
        return {
          ok: true,
          data: await value<Record<string, unknown>>(
            `SELECT public.${name}(${values.map((_, index) => `$${index + 1}`).join(",")}) AS v`,
            values,
          ),
        };
      } catch (error) {
        return {
          ok: false,
          status: String(error).includes("CONFLICT") ? 409 : 503,
          error: "ASSISTANT_REQUEST_CONFLICT",
        };
      }
    };
    const identity: QuestionIdentity = {
      userId: user,
      area: "academic",
      course: "AC-BUS",
      lesson: "L1",
      locale: "ar-EG",
      childId: null,
      requestId: uuid(),
      query: "Explain the supported course concept",
    };
    let providers = 0;
    const execute = async (fingerprint: string) => {
      const answer = await recordedQuestionProvider(
        rpc,
        { userId: user, requestId: identity.requestId, fingerprint },
        "local-fixture",
        async () => {
          providers++;
          return "A grounded course explanation";
        },
      );
      return {
        status: 200,
        body: { answer },
        proof: [{ lessonId: "L1" }],
        outcome: "answered" as const,
      };
    };
    const first = await runMeteredQuestion(identity, rpc, execute, async () => true);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ chargedUnits: 1, balance: { monthly_remaining: 99 } });
    const retry = await runMeteredQuestion(identity, rpc, execute, async () => true);
    expect(retry.status).toBe(200);
    expect(retry.body).toMatchObject({ answer: "A grounded course explanation", replay: true });
    expect(providers).toBe(1);
    const conflict = await runMeteredQuestion(
      { ...identity, query: "A different question" },
      rpc,
      execute,
      async () => true,
    );
    expect(conflict.status).toBe(409);
    expect(providers).toBe(1);
    const insufficient = await runMeteredQuestion(
      { ...identity, requestId: uuid() },
      rpc,
      async () => ({
        status: 200,
        body: { answer: "Insufficient course evidence" },
        outcome: "insufficient",
      }),
      async () => true,
    );
    expect(insufficient.body).toMatchObject({
      chargedUnits: 0,
      balance: { monthly_remaining: 99 },
    });
    const failure = await runMeteredQuestion(
      { ...identity, requestId: uuid() },
      rpc,
      async () => {
        throw Error("private provider failure");
      },
      async () => true,
    );
    expect(failure.body).toMatchObject({ chargedUnits: 0, balance: { monthly_remaining: 99 } });
    const charges = [];
    for (let index = 0; index < 3; index++) {
      const result = await runMeteredQuestion(
        { ...identity, requestId: uuid(), query: "Outside this curriculum" },
        rpc,
        async () => ({
          status: 200,
          body: { answer: "Outside the course" },
          outcome: "out_of_scope",
        }),
        async () => true,
      );
      charges.push(result.body.chargedUnits);
    }
    expect(charges).toEqual([0, 0, 1]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 98 });
  }, 15000);
  it("does not expose an in-flight review answer after the protected administrator role is revoked", async () => {
    const id = uuid();
    await value(
      "SELECT public.reserve_assistant_question($1,'ai','ai','intro-m1-l1-what-is-ai','ar-EG',NULL,$2,$3) AS v",
      [admin, id, fingerprint],
    );
    await db.exec(
      "CREATE OR REPLACE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT false$$",
    );
    const response = JSON.stringify({
      status: 200,
      body: { answer: "Protected review answer" },
      proof: [{ lessonId: "intro-m1-l1-what-is-ai" }],
    });
    await expect(
      db.query("SELECT public.settle_assistant_question($1,$2,$3,'answered',$4)", [
        admin,
        id,
        fingerprint,
        response,
      ]),
    ).rejects.toThrow("REVIEW_ACCESS_CHANGED");
    expect(
      await value("SELECT response AS v FROM billing.assistant_requests WHERE request_id=$1", [id]),
    ).toBeNull();
    expect(
      await value("SELECT public.settle_assistant_question($1,$2,$3,'system_failure',$4) AS v", [
        admin,
        id,
        fingerprint,
        JSON.stringify({ status: 503, body: { error: "Access changed" } }),
      ]),
    ).toMatchObject({ charged_units: 0 });
  });

  it("gives the verified administrator unlimited nonbillable questions in all four areas without any question counters", async () => {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
    expect(await value("SELECT public.academic_assistant_access('AC-BUS','L1','ar-EG') AS v")).toBe(
      "admin",
    );
    expect(
      await value("SELECT public.assistant_card_content_access($1,'business') AS v", [admin]),
    ).toMatchObject({ admin_review: true });
    expect(
      await value("SELECT public.card_assistant_access('kids','level-1','3','ar-EG',$1) AS v", [
        admin,
      ]),
    ).toBe(true);
    expect(
      await value(
        "SELECT public.card_assistant_access('technical','furniture','step','ar-EG',NULL) AS v",
      ),
    ).toBe(true);
    const scopes: [string, string, string, string | null][] = [
      ["ai", "ai", "business-m1-l2-paid", null],
      ["academic", "AC-BUS", "L1", null],
      ["technical", "furniture", "M01-L02", null],
      ["kids", "kids", "level-1:3", admin],
    ];
    const expected = {
      access_allowed: true,
      admin_review: true,
      unlimited: true,
      monthly_remaining: 0,
      purchased_remaining: 0,
    };
    const pending: string[] = [];
    for (const [area, course, lesson, profile] of scopes) {
      // Exceed every previous hourly threshold before making the real request.
      await db.query(
        `INSERT INTO billing.assistant_requests(user_id,request_id,fingerprint,area,course,lesson,locale,child_id,wallet_scope,funding,state,outcome,charged_units)
    SELECT $1,gen_random_uuid(),$2,$3,$4,$5,'ar-EG',$6,CASE WHEN $3='kids' THEN 'family' ELSE 'account' END,'review','settled','answered',0 FROM generate_series(1,60)`,
        [admin, fingerprint, area, course, lesson, profile],
      );
      expect(
        await value("SELECT public.assistant_question_balance($1,$2,$3,$4) AS v", [
          admin,
          area,
          course,
          profile,
        ]),
      ).toEqual(expected);
      for (const outcome of ["answered", "out_of_scope"]) {
        const id = uuid();
        expect(
          await value(
            "SELECT public.reserve_assistant_question($1,$2,$3,$4,'ar-EG',$5,$6,$7) AS v",
            [admin, area, course, lesson, profile, id, fingerprint],
          ),
        ).toMatchObject({ allowed: true, balance: expected });
        expect(
          await value("SELECT public.settle_assistant_question($1,$2,$3,$4,$5) AS v", [
            admin,
            id,
            fingerprint,
            outcome,
            JSON.stringify({
              status: 200,
              body: { answer: "Admin answer" },
              proof: [{ lessonId: lesson }],
            }),
          ]),
        ).toMatchObject({ charged_units: 0, balance: expected });
      }
      const id = uuid();
      pending.push(id);
      await value("SELECT public.reserve_assistant_question($1,$2,$3,$4,'ar-EG',$5,$6,$7) AS v", [
        admin,
        area,
        course,
        lesson,
        profile,
        id,
        fingerprint,
      ]);
    }
    for (const table of [
      "assistant_allowance_periods",
      "assistant_outside_days",
      "ai_credit_ledger",
    ])
      expect(
        await value(`SELECT count(*)::int AS v FROM billing.${table} WHERE user_id=$1`, [admin]),
      ).toBe(0);
    await db.exec(
      "CREATE OR REPLACE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT false$$",
    );
    for (const id of pending)
      await expect(
        db.query("SELECT public.settle_assistant_question($1,$2,$3,'answered',$4)", [
          admin,
          id,
          fingerprint,
          JSON.stringify({ status: 200, body: { answer: "No longer allowed" } }),
        ]),
      ).rejects.toThrow("REVIEW_ACCESS_CHANGED");
    for (const [area, course, , profile] of scopes)
      expect(
        await value("SELECT public.assistant_question_balance($1,$2,$3,$4) AS v", [
          admin,
          area,
          course,
          profile,
        ]),
      ).toMatchObject({ unlimited: false, admin_review: false });
  }, 15000);

  it("adds independent 300-question invitations for one email and preserves each acceptance anniversary and revocation", async () => {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) {
      const data = {
        key: uuid(),
        email: "one@example.invalid",
        grant_kind: "comprehensive",
        scope_mode: "selected",
        catalogues: ["ai:pro_plus"],
        duration_days: 90,
      };
      const created = await value<{ id: string }>(
        "SELECT public.email_access_command('create',$1) AS v",
        [JSON.stringify(data)],
      );
      ids.push(created.id);
      expect(
        await value("SELECT public.email_access_command('create',$1) AS v", [JSON.stringify(data)]),
      ).toEqual(created);
    }
    expect(ids[0]).not.toBe(ids[1]);
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    for (const id of ids) await value("SELECT public.accept_commercial_invitation($1) AS v", [id]);
    await db.query(
      "UPDATE billing.email_access_grants SET activated_at=now()-interval '2 months 3 days',ends_at=now()+interval '20 days' WHERE id=$1",
      [ids[0]],
    );
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 600 });
    expect(
      await value(
        "SELECT count(DISTINCT starts_at)::int AS v FROM billing.assistant_allowance_periods WHERE user_id=$1",
        [user],
      ),
    ).toBe(2);
    await db.query(
      "INSERT INTO billing.subscriptions VALUES($1,$2,'cccccccc-cccc-4ccc-8ccc-cccccccccccc',NULL,'paid_active',now(),now()+interval '29 days',now())",
      [uuid(), user],
    );
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 750 });
    await db.query(
      "UPDATE billing.email_access_grants SET ends_at=now()-interval '1 second' WHERE id=$1",
      [ids[0]],
    );
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 450 });
    await db.query("UPDATE billing.email_access_grants SET revoked_at=now() WHERE id=$1", [ids[1]]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'ai','ai',NULL) AS v", [user]),
    ).toMatchObject({ monthly_remaining: 150 });
  });

  it("grants single-curriculum invitations 100 monthly without subscriptions and shares the Kids invitation across owned children", async () => {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
    const ids: Record<string, string> = {};
    for (const catalogue of [
      "academic:AC-BUS",
      "academic:AC-OTHER",
      "ai:pro_plus",
      "technical:furniture",
      "kids",
    ]) {
      const data = {
        key: uuid(),
        email: "one@example.invalid",
        grant_kind: "single_curriculum",
        scope_mode: "selected",
        catalogues: [catalogue],
        duration_days: 90,
        invitation: true,
      };
      ids[catalogue] = (
        await value<{ id: string }>("SELECT public.email_access_command('create',$1) AS v", [
          JSON.stringify(data),
        ])
      ).id;
    }
    for (const catalogues of [["ai:pro"], ["academic:AC-BUS", "academic:AC-OTHER"]])
      await expect(
        db.query("SELECT public.email_access_command('create',$1)", [
          JSON.stringify({
            key: uuid(),
            email: "one@example.invalid",
            grant_kind: "single_curriculum",
            scope_mode: "selected",
            catalogues,
          }),
        ]),
      ).rejects.toThrow("INVALID_SCOPE");
    const mailed = await value<{ payload: Pick<InvitationSummary, "grant_kind"> }[]>(
      "SELECT public.email_access_mail('claim','{}') AS v",
    );
    expect(mailed).toHaveLength(5);
    expect(mailed.every((x) => x.payload.grant_kind === "single_curriculum")).toBe(true);
    const listed = await value<{ grants: InvitationSummary[] }>(
      "SELECT public.email_access_command('list','{}') AS v",
    );
    expect(
      listed.grants.every(
        (x) => x.grant_kind === "single_curriculum" && x.monthly_questions === 100,
      ),
    ).toBe(true);
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    expect(
      (
        await value<InvitationSummary[]>("SELECT public.get_my_commercial_invitations() AS v")
      ).every((x) => x.monthly_questions === 100),
    ).toBe(true);
    await value("SELECT public.accept_commercial_invitation($1) AS v", [ids["academic:AC-BUS"]]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ access_allowed: true, monthly_remaining: 100 });
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-OTHER',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ access_allowed: false, monthly_remaining: 0 });
    for (const [catalogue, id] of Object.entries(ids))
      if (catalogue !== "academic:AC-BUS")
        await value("SELECT public.accept_commercial_invitation($1) AS v", [id]);
    const scopes: [string, string, string, string | null][] = [
      ["ai", "ai", "business-m1-l2-paid", null],
      ["academic", "AC-BUS", "L1", null],
      ["academic", "AC-OTHER", "L1", null],
      ["technical", "furniture", "M01-L02", null],
      ["kids", "kids", "level-1:3", child],
    ];
    for (const [area, course, lesson, profile] of scopes) {
      expect(
        await value("SELECT public.assistant_question_balance($1,$2,$3,$4) AS v", [
          user,
          area,
          course,
          profile,
        ]),
      ).toMatchObject({ access_allowed: true, unlimited: false, monthly_remaining: 100 });
      const id = uuid();
      await reserve(id, area, course, lesson, profile);
      expect(await settle(id, "answered", lesson)).toMatchObject({
        charged_units: 1,
        balance: { monthly_remaining: 99 },
      });
    }
    expect(
      await value("SELECT public.assistant_question_balance($1,'kids','kids',$2) AS v", [
        user,
        child2,
      ]),
    ).toMatchObject({ monthly_remaining: 99 });
    expect(
      await value("SELECT public.assistant_question_balance($1,'kids','kids',$2) AS v", [
        other,
        child,
      ]),
    ).toMatchObject({ access_allowed: false });
    await db.query(
      "UPDATE billing.email_access_grants SET activated_at=now()-interval '2 months 3 days' WHERE id=$1",
      [ids["academic:AC-BUS"]],
    );
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 100 });
    await db.query("UPDATE billing.email_access_grants SET revoked_at=now() WHERE id=$1", [
      ids["academic:AC-BUS"],
    ]);
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-BUS',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ access_allowed: false });
    expect(
      await value("SELECT public.assistant_question_balance($1,'academic','AC-OTHER',NULL) AS v", [
        user,
      ]),
    ).toMatchObject({ monthly_remaining: 99 });
    expect(
      await value("SELECT count(*)::int AS v FROM billing.subscriptions WHERE user_id=$1", [user]),
    ).toBe(0);
  }, 15000);
});
