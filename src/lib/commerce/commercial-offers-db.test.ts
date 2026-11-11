// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accountDeletionTestDb } from "../__tests__/fixtures/account-deletion-db";
import { manualPurchaseDbCases } from "./manual-purchases-db-cases";
let db: Awaited<ReturnType<typeof accountDeletionTestDb>>;
const admin = randomUUID(),
  user = randomUUID(),
  other = randomUUID();
const sql = (file: string) => readFileSync(file, "utf8");
const actor = async (id: string = user, service = false) => {
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false),set_config('masaarat.stripe_environment',$3,false)",
    [id, service ? "service_role" : "authenticated", service ? "live" : "test"],
  );
};
async function recover<T>(run: () => Promise<T>): Promise<T> {
  await db.exec("SAVEPOINT attempt");
  try {
    const result = await run();
    await db.exec("RELEASE SAVEPOINT attempt");
    return result;
  } catch (e) {
    await db.exec("ROLLBACK TO SAVEPOINT attempt; RELEASE SAVEPOINT attempt");
    throw e;
  }
}
const value = async (q: string, args: unknown[] = []) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy fixture queries return heterogeneous PostgreSQL scalar/JSON values.
  recover(async () => (await db.query<{ v: any }>(q, args)).rows[0].v);
const command = (action: string, data: Record<string, unknown> = {}) =>
  value("select public.commerce_command($1,$2::jsonb) v", [action, JSON.stringify(data)]);
beforeAll(async () => {
  db = await accountDeletionTestDb(true);
  await db.exec(
    "CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner_id text);",
  );
  for (const name of [
    "20261004010000_commerce_foundation.sql",
    "20261004011000_commerce_commands.sql",
    "20261004012000_commerce_access.sql",
    "20261004013000_commerce_receipts_mail.sql",
    "20261004014000_commerce_account_retention.sql",
    "20261004015000_commerce_payment_mail.sql",
    "20261004016000_commerce_simple_offers.sql",
    "20261005100000_technical_education_integration.sql",
    "20261005101000_technical_stripe_test.sql",
    "20261005102000_technical_subscription_mail.sql",
    "20261005110000_admin_kids_lesson_review.sql",
    "20261006110000_academic_commerce.sql",
    "20261006111000_academic_content.sql",
    "20261006112000_academic_stripe_test.sql",
    "20261006113000_academic_mail_retention.sql",
    "20261006120000_academic_admin_review.sql",
  ])
    await db.exec(sql(`supabase/migrations/${name}`));
  await db.exec(sql("scripts/email-access/email-access-candidate.sql"));
  await db.exec(sql("docs/billing/20260920_stripe_refunds.sql"));
  const rag = sql("scripts/academic-education/assistant-rag-candidate.sql");
  await db.exec(
    "ALTER TABLE public.academic_courses ADD COLUMN assistant_review_enabled boolean NOT NULL DEFAULT false;" +
      rag.slice(
        rag.indexOf("CREATE TABLE public.academic_content_course_grants"),
        rag.indexOf("-- Return the authoritative access mode"),
      ),
  );
  // Replay the exact installed commerce/assistant billing segment; RAG import
  // functions after this boundary are unrelated to coupon journeys.
  await db.exec(
    sql("scripts/academic-education/assistant-native-candidate.sql").split(
      "CREATE FUNCTION public.academic_import_chunks",
    )[0] + "COMMIT;",
  );
  // Include the installed privacy classification/erasure chain as well as the
  // billing segment; importing vector content remains outside this fixture.
  const academicNative = sql("scripts/academic-education/assistant-native-candidate.sql");
  await db.exec(
    academicNative.slice(
      academicNative.indexOf("-- Classify the new user-owned question ledger"),
      academicNative.lastIndexOf("COMMIT;"),
    ),
  );
  for (const name of [
    "0008_stripe_live_environment_separation.sql",
    "0009_stripe_live_guard_lifecycle.sql",
    "0010_stripe_live_rpc_environment.sql",
    "0011_stripe_live_atomic_risk_holds.sql",
    "0012_stripe_live_risk_guard_binding_closure.sql",
    "0013_stripe_live_refund_lock_order.sql",
    "0014_stripe_live_offer_mapping_prerequisite.sql",
    "0015_stripe_live_offer_reservations.sql",
    "0016_stripe_live_offer_retention_and_replay.sql",
    "0017_stripe_live_offer_retention_stage_fix.sql",
    "0018_stripe_live_offer_binding_lifetime_closure.sql",
    "0019_stripe_live_offer_catalogue_binding.sql",
    "0020_stripe_live_offer_retry_input_closure.sql",
    "0021_stripe_live_offer_cross_channel_phone_guard.sql",
  ])
    try {
      if (name === "0010_stripe_live_rpc_environment.sql") {
        const names = Array.from(
          sql(`drizzle/migrations/${name}`).matchAll(/\('public','([^']+)'/g),
          (match) => match[1],
        );
        const missing: string[] = [];
        for (const fn of new Set(names))
          if (
            !(
              await db.query(
                "select 1 from pg_proc where pronamespace='public'::regnamespace and proname=$1",
                [fn],
              )
            ).rows.length
          )
            missing.push(fn);
        if (missing.length)
          throw new Error(`Missing installed fixture prerequisites: ${missing.join(",")}`);
      }
      await db.exec(sql(`drizzle/migrations/${name}`));
    } catch (error) {
      console.error("Fixture migration", name);
      throw error;
    }
  await db.exec(
    `INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@example.test',now()),('${user}','member@example.test',now()),('${other}','other@example.test',now()); INSERT INTO public.user_roles VALUES('${admin}','admin');`,
  );
  await db.exec(sql("drizzle/migrations/0025_shared_coupon_rail_eligibility_and_attempts.sql"));
  // Rehearse free access on the actual current payment/risk wrapper stack,
  // preserving all offer, portal and cross-rail contracts before composition.
  for (const name of [
    "0022_live_offer_admin_operations.sql",
    "0023_billing_portal_environment_continuity.sql",
    "0024_live_offer_admin_list_alias_closure.sql",
  ])
    await db.exec(sql(`drizzle/migrations/${name}`));
  await db.exec(sql("scripts/free-access/free-access-candidate.sql"));

  await db.exec("ALTER TABLE auth.users ADD COLUMN created_at timestamptz DEFAULT now()");
  await db.exec(sql("supabase/migrations/20261021120000_assistant_card_content_access.sql"));
  const cards = sql("scripts/card-assistant/assistant-candidate.sql");
  await db.exec(
    cards.slice(
      cards.indexOf("CREATE TABLE public.card_assistant_policy"),
      cards.indexOf("CREATE TABLE public.card_assistant_chunks"),
    ),
  );
  const windowStart = cards.indexOf("CREATE TABLE public.card_assistant_question_windows");
  await db.exec(cards.slice(windowStart, cards.indexOf("DO $$", windowStart)));
  await db.exec(
    cards.slice(
      cards.indexOf("-- Classify the operational user-owned window"),
      cards.lastIndexOf("COMMIT;"),
    ),
  );
  await db.exec(sql("drizzle/migrations/0027_commercial_policy_20261102.sql"));
  await db.exec(sql("drizzle/migrations/0028_commercial_offer_policy.sql"));
  await db.exec(sql("drizzle/migrations/0030_unified_manual_purchase_rails.sql"));
  // Rehearse the next learning layer on the installed commerce/privacy stack.
  // The old fixture's minimal progress table omitted these learner columns.
  await db.exec(
    "ALTER TABLE public.lesson_progress ADD COLUMN status text DEFAULT 'not-started', ADD COLUMN updated_at timestamptz DEFAULT now()",
  );
  const notes = sql("supabase/migrations/20260509012347_6670908b-5c45-46ea-a953-2bdbb5d91eeb.sql");
  await db.exec(notes.slice(notes.indexOf("-- Lesson notes per user")));
  await db.exec(sql("supabase/migrations/20260511203303_c68e200d-6663-4d38-bec1-54fdfa31ab1f.sql"));
  await db.exec(sql("supabase/migrations/20260512122051_b9cb43de-e8ea-4c33-99db-911192104d86.sql"));
  await db.exec(sql("supabase/migrations/20260520201444_9de74f71-3ab1-4408-811f-c96177dfdf75.sql"));
  await db.exec(sql("supabase/migrations/20261007072809_unified_learning_journey.sql"));
  await db.exec(sql("drizzle/migrations/0031_student_learning_records.sql"));
}, 60000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec("BEGIN; UPDATE billing.commerce_control SET enabled=true");
  await actor(admin);
  await command("configure_method", {
    code: "bank",
    enabled: true,
    instructions: "Fixture only",
    destination: "Fixture",
    currencies: ["EGP"],
  });
});
afterEach(async () => db.exec("ROLLBACK"));
manualPurchaseDbCases({
  user,
  other,
  admin,
  actor,
  command,
  value,
  retentionEvidence: async () => {
    const term = await offer({ discount_duration: "forever" });
    await manualPurchase();
    const live = await offer({ code: "RETENTIONLIVE" });
    await mapping(live);
    await actor(user, true);
    const reservation = await value(
      "SELECT public.reserve_stripe_live_offer($1,'RETENTIONLIVE','pro','EG','month','+201012345678',$2,false) v",
      [user, randomUUID()],
    );
    return { termOfferId: term.id as string, reservationId: reservation.id as string };
  },
});

describe("campaign access, questions and email notices", () => {
  beforeEach(async () => {
    const intake = sql("drizzle/migrations/0034_course_intake.sql");
    const sourceStart = intake.indexOf(
      "CREATE OR REPLACE FUNCTION billing.assistant_source_specs(",
    );
    const sourceEnd = intake.indexOf("--> statement-breakpoint", sourceStart);
    const pause = sql("drizzle/migrations/0051_communications_drain_gate.sql");
    const contact = sql("drizzle/migrations/0050_contact_automation.sql");
    await db.exec(`
      ALTER TABLE auth.users ADD COLUMN is_anonymous boolean DEFAULT false;
      CREATE SCHEMA curriculum_private;
      CREATE TABLE curriculum_private.courses(area text,id text);
      ALTER FUNCTION billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)
        SET SCHEMA curriculum_private;
      ALTER FUNCTION curriculum_private.assistant_source_specs(uuid,text,text,uuid,timestamptz)
        RENAME TO previous_assistant_source_specs;
    `);
    await db.exec(intake.slice(sourceStart, sourceEnd));
    await db.exec(
      pause.slice(0, pause.indexOf("CREATE FUNCTION public.set_communications_starts_paused")),
    );
    await db.exec(
      contact.slice(
        contact.indexOf("CREATE FUNCTION billing.lock_contact_accounts"),
        contact.indexOf("-- Resolve the full request family"),
      ),
    );
    await db.exec(sql("drizzle/migrations/0055_free_access_campaign_notices.sql"));
    await db.exec(sql("drizzle/migrations/0056_campaign_manual_paid_time.sql"));
    await db.exec(sql("drizzle/migrations/0057_campaign_stripe_renewal.sql"));
    await db.exec(
      "UPDATE auth.users SET created_at=now()-interval '30 days',email_confirmed_at=now()-interval '29 days'",
    );
  });

  const free = (action: string, data: Record<string, unknown>) =>
    value("SELECT public.free_access_window_command($1,$2::jsonb) v", [
      action,
      JSON.stringify(data),
    ]);
  const notices = (action: string, data: Record<string, unknown> = {}) =>
    value("SELECT public.access_notice_mail($1,$2::jsonb) v", [action, JSON.stringify(data)]);
  const control = (action: string, data: Record<string, unknown> = {}) =>
    value("SELECT public.access_notice_control($1,$2::jsonb) v", [action, JSON.stringify(data)]);
  const opening = () => ({
    key: randomUUID(),
    title: "Synthetic learning period",
    targets: ["ai:business"],
    starts_at: new Date(Date.now() - 3_600_000).toISOString(),
    ends_at: new Date(Date.now() + 13 * 86_400_000).toISOString(),
    enabled: true,
    assistant_questions: 25,
    email_notices: true,
  });

  it("queues one opted-in announcement and one notice after an in-period signup is confirmed", async () => {
    const signup = randomUUID();
    await actor(user);
    expect(await control("preferences", { opted_in: true })).toEqual({ opted_in: true });
    await expect(control("status", { source_id: randomUUID() })).rejects.toThrow(
      "ACCESS_NOTICE_ADMIN_REQUIRED",
    );
    await expect(notices("claim")).rejects.toThrow("ACCESS_NOTICE_SERVER_ONLY");
    await actor(admin);
    const input = opening();
    const created = await free("create", input);
    expect(await free("create", input)).toEqual(created);
    await db.query(
      "INSERT INTO auth.users(id,email,created_at) VALUES($1,'signup@example.test',now())",
      [signup],
    );
    await actor(user, true);
    const [first] = await notices("claim");
    expect(first).toMatchObject({
      recipient: "member@example.test",
      payload: { kind: "campaign_start", questions: 25 },
    });
    const claim = { id: first.id, lease: first.lease };
    expect(await notices("authorize", claim)).toBe(true);
    expect(await notices("authorize", claim)).toBe(false);
    expect(await notices("result", { ...claim, provider_id: "synthetic-confirmed-id" })).toBe(true);
    await db.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [signup]);
    const second = await notices("claim");
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({
      recipient: "signup@example.test",
      payload: { kind: "campaign_signup" },
    });
    expect(await notices("claim")).toEqual([]);
    expect(
      await value(
        "SELECT public.record_contact_mail_receipt('event-fixture','synthetic-confirmed-id','member@example.test','email.delivered',now()) v",
      ),
    ).toBe("recorded");
    await actor(admin);
    expect(await control("status", { source_id: created.id })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recipient: "member@example.test", status: "email.delivered" }),
      ]),
    );
  });

  it("keeps the same assistant pool when edits change its limit and revokes it at pause", async () => {
    await actor(admin);
    const input = opening();
    const { id, version } = await free("create", input);
    const pool = () =>
      value(
        "SELECT (SELECT row_to_json(s) FROM billing.free_access_question_specs($1,'ai','ai',NULL,now()) s) v",
        [user],
      );
    expect(await pool()).toMatchObject({ source_key: "free-window:" + id, units: 25 });
    await db.query("SELECT billing.assistant_sync_periods($1,'ai','ai',NULL)", [user]);
    await db.query(
      "UPDATE billing.assistant_allowance_periods SET used=4 WHERE user_id=$1 AND source_key=$2",
      [user, "free-window:" + id],
    );
    const base = {
      ...input,
      id,
      expected_version: version,
      key: randomUUID(),
      assistant_questions: 30,
    };
    const updated = await free("update", base);
    await db.query("SELECT billing.assistant_sync_periods($1,'ai','ai',NULL)", [user]);
    expect(
      await value(
        "SELECT jsonb_build_array(unit_limit,used) v FROM billing.assistant_allowance_periods WHERE user_id=$1 AND source_key=$2",
        [user, "free-window:" + id],
      ),
    ).toEqual([30, 4]);
    expect(
      await value("SELECT billing.assistant_source_permits($1,'intro-m1-l1-what-is-ai') v", [
        "free-window:" + id,
      ]),
    ).toBe(false);
    await free("update", {
      ...base,
      enabled: false,
      expected_version: updated.version,
      key: randomUUID(),
    });
    expect(await pool()).toBeNull();
    expect(
      await value("SELECT billing.assistant_source_permits($1,'__course__') v", [
        "free-window:" + id,
      ]),
    ).toBe(false);
  });

  it("queues targeted coupons once and honors opt-out before a send", async () => {
    const issued = await offer();
    await actor(user);
    await control("preferences", { opted_in: false });
    await actor(user, true);
    expect(await notices("claim")).toEqual([]);
    await actor(user);
    await control("preferences", { opted_in: true });
    await actor(user, true);
    expect(await notices("claim")).toEqual([
      expect.objectContaining({
        recipient: "member@example.test",
        payload: expect.objectContaining({ kind: "coupon", code: "TEST" }),
      }),
    ]);
    expect(
      await value(
        "SELECT count(*)::integer v FROM billing.access_notice_outbox WHERE source_id=$1",
        [issued.id],
      ),
    ).toBe(1);
  });

  it("updates a pending end reminder after a date edit and skips last-day signup reminders", async () => {
    const recent = randomUUID();
    await actor(user);
    await control("preferences", { opted_in: true });
    await actor(admin);
    const input = {
      ...opening(),
      starts_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      ends_at: new Date(Date.now() + 10 * 3_600_000).toISOString(),
    };
    const created = await free("create", input);
    await db.query(
      "INSERT INTO auth.users(id,email,created_at,email_confirmed_at) VALUES($1,'recent@example.test',now(),now())",
      [recent],
    );
    await actor(user, true);
    const openingNotices = await notices("claim");
    expect(openingNotices).toHaveLength(2);
    for (const row of openingNotices) {
      const claim = { id: row.id, lease: row.lease };
      expect(await notices("authorize", claim)).toBe(true);
      expect(await notices("result", { ...claim, provider_id: "sent-" + row.id })).toBe(true);
    }
    await db.query(
      "UPDATE billing.access_notice_outbox SET first_attempt_at=now()-interval '2 days' WHERE kind='campaign_start'",
    );
    const [reminder] = await notices("claim");
    expect(reminder).toMatchObject({
      recipient: "member@example.test",
      payload: { kind: "campaign_end" },
    });
    await actor(admin);
    const extended = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await free("update", {
      ...input,
      id: created.id,
      expected_version: created.version,
      key: randomUUID(),
      ends_at: extended,
    });
    await actor(user, true);
    expect(await notices("authorize", { id: reminder.id, lease: reminder.lease })).toBe(false);
    expect(await notices("claim")).toEqual([]);
  });

  it("appends campaign time once to a paid manual purchase confirmed after the start", async () => {
    await actor(admin);
    const window = await free("create", opening());
    await offer();
    const { order } = await manualPurchase();
    const award = () => value("SELECT public.award_campaign_manual_time() v");
    await expect(award()).rejects.toThrow("COMMERCIAL_SERVICE_ONLY");
    await actor(user, true);
    expect(await award()).toEqual({ awarded: 1 });
    expect(await award()).toEqual({ awarded: 0 });
    expect(
      await value(
        `SELECT (a.new_end-a.old_end)=(w.ends_at-w.starts_at)
          AND e.ends_at=a.new_end AND a.user_id=$3 v
         FROM billing.campaign_manual_time_awards a
         JOIN billing.free_access_windows w ON w.id=a.window_id
         JOIN billing.commerce_entitlements e ON e.id=a.entitlement_id
         WHERE w.id=$1 AND e.order_id=$2`,
        [window.id, order.id, user],
      ),
    ).toBe(true);
  });
  it("claims a paid Live term once and keeps the gift access and question clocks separate", async () => {
    await actor(admin);
    const window = await free("create", opening());
    const claim = () => value("SELECT public.claim_campaign_stripe_renewals() v");
    await expect(claim()).rejects.toThrow("COMMERCIAL_SERVICE_ONLY");
    await actor(user, true);
    const internal = randomUUID();
    await db.exec(
      "INSERT INTO billing.stripe_live_control(singleton,live_enabled) VALUES(true,true) ON CONFLICT(singleton) DO UPDATE SET live_enabled=true",
    );
    expect(await claim()).toEqual([]);
    await db.query(
      `INSERT INTO billing.subscriptions(id,user_id,plan_version_id,market_price_id,access_state,billing_state,
          current_period_start,current_period_end,market_code,currency_code,billing_interval,idempotency_key)
        SELECT $1,$2,v.id,m.id,'paid_active','active',date_trunc('second',now())-interval '20 days',
          date_trunc('second',now())+interval '1 day','EG','EGP','month','campaign-test-core'
        FROM billing.market_prices m JOIN billing.plan_versions v ON v.id=m.plan_version_id
          JOIN billing.plan_catalog p ON p.id=v.plan_id
        WHERE p.plan_key='pro' AND v.billing_interval='month' AND m.market_code='EG' AND m.status='active' LIMIT 1`,
      [internal, user],
    );
    await db.query(
      `INSERT INTO billing.gateway_subscriptions(subscription_id,gateway_code,gateway_subscription_id,
          gateway_customer_id,status,stripe_environment)
        VALUES($1,'stripe_us_live','sub_campaign','cus_campaign','active','live')`,
      [internal],
    );
    expect(await claim()).toEqual([]);
    await db.query(
      `INSERT INTO billing.payment_transactions(subscription_id,user_id,gateway_code,gateway_transaction_id,
          transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at,succeeded_at,stripe_environment)
        VALUES($1,$2,'stripe_us_live','in_campaign','checkout','succeeded',1000,'EGP','campaign-paid-fixture',
          now(),now(),'live')`,
      [internal, user],
    );
    const [job] = await claim();
    expect(job).toMatchObject({
      scope: "core",
      internalId: internal,
      userId: user,
      subscriptionId: "sub_campaign",
      invoiceId: "in_campaign",
      state: "pending",
    });
    expect(await claim()).toEqual([]);
    expect(job.giftEnd - job.paidEnd).toBeCloseTo(
      await value(
        "SELECT extract(epoch from ends_at-starts_at)::integer v FROM billing.free_access_windows WHERE id=$1",
        [window.id],
      ),
      0,
    );
    const step = (action: string, lease = job.lease) =>
      value(
        "SELECT public.step_campaign_stripe_renewal($1,$2,$3,'sub_sched_campaign','price_campaign',$4) v",
        [job.id, lease, action, job.paidEnd - 21 * 86_400],
      );
    expect(await step("create", randomUUID())).toBe(false);
    expect(await step("create")).toBe(true);
    expect(await step("bind")).toBe(true);
    expect(await step("authorize")).toBe(true);
    expect(await step("scheduled")).toBe(true);
    expect(
      await value(
        "SELECT public.get_campaign_stripe_cancellation($1::uuid,md5($1::uuid::text||':ai:'||$2::text)) v",
        [user, internal],
      ),
    ).toMatchObject({ id: job.id, scheduleId: "sub_sched_campaign" });
    expect(
      await value(
        "SELECT public.get_campaign_stripe_cancellation($1,md5($2::text||':ai:'||$3::text)) v",
        [other, user, internal],
      ),
    ).toBeNull();
    const activate = () =>
      value("SELECT public.activate_campaign_stripe_renewal($1,'sub_sched_campaign') v", [job.id]);
    expect(await activate()).toBe(false);
    await db.query(
      `UPDATE billing.campaign_stripe_renewals SET paid_end=date_trunc('second',now())-interval '1 second',
          gift_end=date_trunc('second',now())+interval '13 days' WHERE id=$1`,
      [job.id],
    );
    await db.query(
      `UPDATE billing.subscriptions SET current_period_end=date_trunc('second',now())-interval '1 second' WHERE id=$1`,
      [internal],
    );
    expect(await activate()).toBe(true);
    expect(await activate()).toBe(true);
    expect(
      await value(
        `SELECT s.current_period_end=a.gift_end AND s.current_period_start=a.paid_start v
       FROM billing.subscriptions s JOIN billing.campaign_stripe_renewals a ON a.internal_id=s.id WHERE a.id=$1`,
        [job.id],
      ),
    ).toBe(true);
    expect(
      await value(
        "SELECT EXISTS(SELECT 1 FROM billing.assistant_source_specs($1,'ai','ai',NULL,now()) WHERE source_key=$2 AND units=25) v",
        [user, "free-window:" + window.id],
      ),
    ).toBe(true);
    expect(
      await value(
        "SELECT EXISTS(SELECT 1 FROM billing.assistant_source_specs($1,'ai','ai',NULL,now()) WHERE source_key=$2) v",
        [user, "ai:" + internal],
      ),
    ).toBe(false);
    await db.query(
      "UPDATE billing.free_access_windows SET ends_at=now()-interval '1 second' WHERE id=$1",
      [window.id],
    );
    expect(
      await value(
        "SELECT EXISTS(SELECT 1 FROM billing.assistant_source_specs($1,'ai','ai',NULL,now()) WHERE source_key=$2) v",
        [user, "free-window:" + window.id],
      ),
    ).toBe(false);
    expect(
      await value("SELECT current_period_end>now() v FROM billing.subscriptions WHERE id=$1", [
        internal,
      ]),
    ).toBe(true);
  });

  it("extends scoped access only for the same paid Live invoice and honors a refund", async () => {
    await actor(admin);
    const window = await free("create", opening());
    await actor(user, true);
    await db.exec(
      "INSERT INTO billing.stripe_live_control(singleton,live_enabled) VALUES(true,true) ON CONFLICT(singleton) DO UPDATE SET live_enabled=true",
    );
    const insert = `INSERT INTO billing.academic_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,
        last_event_at,paid_invoice_id,starts_at,ends_at,stripe_environment)
      VALUES($1,$2,'cus_academic','price_academic','active',now(),'in_academic',
        date_trunc('second',now())-interval '1 month',date_trunc('second',now())+interval '1 day',$3)`;
    await actor(user);
    await db.query(insert, [user, "sub_academictest", "test"]);
    await actor(user, true);
    await db.query(insert, [user, "sub_academiclive", "live"]);
    await db.query(
      "UPDATE billing.free_access_windows SET ends_at=now()-interval '1 second' WHERE id=$1",
      [window.id],
    );
    const jobs = await value("SELECT public.claim_campaign_stripe_renewals() v");
    expect(jobs).toHaveLength(1);
    const [job] = jobs;
    expect(job).toMatchObject({ scope: "academic", subscriptionId: "sub_academiclive" });
    await db.query(
      `UPDATE billing.campaign_stripe_renewals SET state='scheduled',schedule_id='sub_sched_academic',
          price_id='price_academic',paid_start=date_trunc('second',now())-interval '1 month',
          paid_end=date_trunc('second',now())-interval '1 second',
          gift_end=date_trunc('second',now())+interval '13 days' WHERE id=$1`,
      [job.id],
    );
    await db.query(
      `UPDATE billing.academic_stripe_subscriptions SET ends_at=date_trunc('second',now())-interval '1 second',
          refunded=true WHERE subscription_id='sub_academiclive'`,
    );
    const activate = () =>
      value("SELECT public.activate_campaign_stripe_renewal($1,'sub_sched_academic') v", [job.id]);
    expect(await activate()).toBe(false);
    await db.query(
      "UPDATE billing.academic_stripe_subscriptions SET refunded=false WHERE subscription_id='sub_academiclive'",
    );
    expect(await activate()).toBe(true);
    expect(
      await value(
        "SELECT ends_at=date_trunc('second',now())+interval '13 days' AND paid_invoice_id='in_academic' v FROM billing.academic_stripe_subscriptions WHERE subscription_id='sub_academiclive'",
      ),
    ).toBe(true);
  });
  it("keeps Kids access tied to the existing paid family entitlement", async () => {
    await actor(admin);
    await free("create", opening());
    await actor(user, true);
    await db.exec(
      "INSERT INTO billing.stripe_live_control(singleton,live_enabled) VALUES(true,true) ON CONFLICT(singleton) DO UPDATE SET live_enabled=true",
    );
    await db.exec(
      `INSERT INTO public.kids_stripe_prices(market_code,billing_interval,discounted,currency_code,
         amount_minor,gateway_product_id,gateway_price_id,stripe_environment)
       VALUES('EG','month',false,'egp',1000,'prod_kids','price_kids','live')`,
    );
    await db.query(
      `INSERT INTO public.kids_stripe_subscriptions(parent_id,gateway_subscription_id,gateway_customer_id,
          gateway_price_id,status,latest_paid_invoice_id,paid_through,last_event_at,stripe_environment)
        VALUES($1,'sub_kidscampaign','cus_kids','price_kids','active','in_kids',
          date_trunc('second',now())+interval '1 day',now(),'live')`,
      [user],
    );
    const claim = () => value("SELECT public.claim_campaign_stripe_renewals() v");
    expect(await claim()).toEqual([]);
    await db.query(
      `INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference)
        VALUES($1,date_trunc('second',now())-interval '1 month',date_trunc('second',now())+interval '1 day',
          'stripe-live:sub_kidscampaign')`,
      [user],
    );
    const [job] = await claim();
    expect(job.scope).toBe("kids");
    await db.query(
      `UPDATE billing.campaign_stripe_renewals SET state='scheduled',schedule_id='sub_sched_kids',
          price_id='price_kids',paid_start=date_trunc('second',now())-interval '1 month',
          paid_end=date_trunc('second',now())-interval '1 second',
          gift_end=date_trunc('second',now())+interval '13 days' WHERE id=$1`,
      [job.id],
    );
    await db.query(
      `UPDATE public.kids_stripe_subscriptions SET paid_through=date_trunc('second',now())-interval '1 second'
          WHERE parent_id=$1 AND stripe_environment='live'`,
      [user],
    );
    await db.query(
      `UPDATE public.kids_family_entitlements SET active_until=date_trunc('second',now())-interval '1 second',
          entitlement_reference='manual:other-grant' WHERE parent_id=$1`,
      [user],
    );
    const activate = () =>
      value("SELECT public.activate_campaign_stripe_renewal($1,'sub_sched_kids') v", [job.id]);
    expect(await activate()).toBe(false);
    await db.query(
      "UPDATE public.kids_family_entitlements SET entitlement_reference='stripe-live:sub_kidscampaign' WHERE parent_id=$1",
      [user],
    );
    expect(await activate()).toBe(true);
    expect(
      await value(
        `SELECT s.paid_through=e.active_until AND e.active_until=date_trunc('second',now())+interval '13 days'
          AND s.latest_paid_invoice_id='in_kids' v
        FROM public.kids_stripe_subscriptions s JOIN public.kids_family_entitlements e USING(parent_id)
        WHERE s.parent_id=$1 AND s.stripe_environment='live'`,
        [user],
      ),
    ).toBe(true);
  });
});
async function offer(extra: Record<string, unknown> = {}) {
  await actor(admin);
  return command("simple_offer", {
    key: randomUUID(),
    audience: "individual",
    emails: ["member@example.test"],
    group_name: "",
    package: "pro",
    market: "EG",
    billing_interval: "month",
    percent: 20,
    delivery: "coupon",
    code: "TEST",
    locale: "en",
    limit_mode: "time",
    valid_until: null,
    max_redemptions: null,
    expected_price_minor: 16900,
    ...extra,
  });
}
async function mapping(f: { id: string }, duration = "once", months: number | null = null) {
  await actor(admin, true);
  const p = await value(
    "select m.id v from billing.market_prices m join billing.plan_versions v on v.id=m.plan_version_id join billing.plan_catalog p on p.id=v.plan_id where p.plan_key='pro' and v.billing_interval='month' and m.market_code='EG' and m.status='active' limit 1",
  );
  await value(
    "select public.register_stripe_gateway_catalog($1,'price_fixture','prod_fixture') v",
    [p],
  );
  const data = {
    key: randomUUID(),
    offer_id: f.id,
    market: "EG",
    interval: "month",
    duration,
    duration_in_months: months,
    price_id: "price_fixture",
    product_id: "prod_fixture",
    coupon_id: "coupon_fixture",
    promotion_code_id: "promo_fixture",
    reviewed: true,
    review_reference: "Local fixture",
  };
  const m = await value("select public.stripe_live_offer_admin($1,'provision',$2::jsonb) v", [
    admin,
    JSON.stringify(data),
  ]);
  await value("select public.stripe_live_offer_admin($1,'enable',$2::jsonb) v", [
    admin,
    JSON.stringify({
      id: m.id,
      key: randomUUID(),
      reviewed: true,
      review_reference: "Local fixture",
    }),
  ]);
  return m;
}
async function manualPurchase(afterExpiry = false) {
  await actor(user);
  const order = await command("create_order", {
    package: "pro",
    market: "EG",
    billing_interval: "month",
    code: "TEST",
    phone: "+201012345678",
    method: "bank",
    key: randomUUID(),
    renewal: true,
  });
  await actor(admin);
  if (afterExpiry)
    await db.query("update billing.commerce_orders set start_rule='after_expiry' where id=$1", [
      order.id,
    ]);
  const payment = await command("confirm", {
    key: randomUUID(),
    method: "bank",
    currency: "EGP",
    amount_minor: order.final_minor,
    transaction_reference: randomUUID(),
    received_at: new Date().toISOString(),
    funds_verified: true,
    allocations: [{ order_id: order.id, amount_minor: order.final_minor }],
  });
  return { order, payment };
}
describe("commercial coupon policy on the current payment schema", () => {
  it("keeps recurring 100% coupon grants in consecutive months and stops after revocation", async () => {
    const f = await offer({ percent: 100, discount_duration: "forever" });
    await actor(user);
    const redeem = () =>
      command("create_order", {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        code: "TEST",
        phone: "+201012345678",
        method: "bank",
        key: randomUUID(),
        renewal: true,
      });
    const first = await redeem();
    const second = await redeem();
    expect(second.discount_term_renewal).toBe(true);
    expect(
      await value(
        "select e2.starts_at=e1.ends_at v from billing.commerce_entitlements e1 join billing.commerce_grants g1 on g1.id=e1.grant_id join billing.commerce_grants g2 on g2.offer_order_id=$2 join billing.commerce_entitlements e2 on e2.grant_id=g2.id where g1.offer_order_id=$1",
        [first.id, second.id],
      ),
    ).toBe(true);
    await actor(admin);
    const firstGrant = await value(
      "select e.id v from billing.commerce_entitlements e join billing.commerce_grants g on g.id=e.grant_id where g.offer_order_id=$1",
      [first.id],
    );
    await command("manage_access", {
      id: firstGrant,
      operation: "revoke",
      reason: "Fixture only",
      key: randomUUID(),
    });
    expect(
      await value("select billing.commercial_manual_term($1,$2,'member@example.test') v", [
        f.id,
        user,
      ]),
    ).toBe(false);
  });
  it.each(["refund", "revoke"])(
    "ends a forever coupon when its original purchase is invalidated by %s",
    async (action) => {
      const f = await offer({ discount_duration: "forever" });
      const { order, payment } = await manualPurchase();
      // The first month ending normally does not terminate an earned forever term.
      await db.query(
        "update billing.commerce_entitlements set starts_at=now()-interval '2 months',ends_at=now()-interval '1 month' where order_id=$1",
        [order.id],
      );
      const valid = () =>
        value("select billing.commercial_manual_term($1,$2,'member@example.test') v", [f.id, user]);
      expect(await valid()).toBe(true);
      if (action === "refund") {
        await command("refund", {
          payment_id: payment.id,
          order_id: order.id,
          amount_minor: order.final_minor,
          reference: "Fixture refund",
          reason: "Fixture only",
          funds_verified: true,
          revoke_access: false,
          key: randomUUID(),
        });
      } else {
        const entitlement = await value(
          "select id v from billing.commerce_entitlements where order_id=$1",
          [order.id],
        );
        await command("manage_access", {
          id: entitlement,
          operation: "revoke",
          reason: "Fixture only",
          key: randomUUID(),
        });
      }
      expect(await valid()).toBe(false);
      await actor(user);
      await expect(
        command("create_order", {
          package: "pro",
          market: "EG",
          billing_interval: "month",
          code: "TEST",
          phone: "+201012345678",
          method: "bank",
          key: randomUUID(),
          renewal: true,
        }),
      ).rejects.toThrow(/LIMIT|ALREADY_USED/);
      expect(
        await value("select consumed_count v from billing.commerce_offers where id=$1", [f.id]),
      ).toBe(1);
    },
  );
  it("starts a repeating coupon from actual activation after the already-paid period", async () => {
    const f = await offer({ discount_duration: "repeating", discount_duration_months: 3 });
    await db.exec(`INSERT INTO billing.subscriptions(user_id,plan_version_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key,current_period_start,current_period_end)
      SELECT '${user}',v.id,'paid_active','active','EG','EGP','month','pre-existing-period',now(),now()+interval '10 days' FROM billing.plan_versions v JOIN billing.plan_catalog c ON c.id=v.plan_id WHERE c.plan_key='pro' AND v.billing_interval='month' LIMIT 1`);
    const { order } = await manualPurchase(true);
    expect(
      await value(
        "select t.starts_at=e.starts_at and t.ends_at=e.starts_at+interval '3 months' and t.starts_at>o.confirmed_at v from billing.commerce_discount_terms t join billing.commerce_orders o on o.id=t.first_order_id join billing.commerce_entitlements e on e.order_id=o.id where t.offer_id=$1 and o.id=$2",
        [f.id, order.id],
      ),
    ).toBe(true);
  });
  it("stores explicit top-up scope and duration and rejects unauthorized or invalid configurations", async () => {
    const catalogue = await command("offer_catalogue");
    expect(catalogue).toContainEqual(
      expect.objectContaining({
        package: "question_topup",
        billing_interval: "one_time",
        original_minor: 5000,
      }),
    );
    const f = await offer({ discount_duration: "repeating", discount_duration_months: 3 });
    expect(f).toMatchObject({
      discount_duration: "repeating",
      discount_duration_months: 3,
      product_scope: "subscription",
    });
    await expect(
      offer({ code: "BAD", discount_duration: "repeating", discount_duration_months: null }),
    ).rejects.toThrow("DURATION");
    const topup = await offer({
      code: "TOPUP",
      package: "question_topup",
      billing_interval: "one_time",
      product_scope: "question_topup",
      expected_price_minor: 5000,
    });
    expect(topup.product_scope).toBe("question_topup");
    await expect(
      offer({
        code: "FREE",
        package: "question_topup",
        billing_interval: "one_time",
        product_scope: "question_topup",
        expected_price_minor: 5000,
        percent: 100,
      }),
    ).rejects.toThrow("INVALID_OFFER");
    await actor(user);
    await expect(command("simple_offer", { key: randomUUID() })).rejects.toThrow("ADMIN_REQUIRED");
  });
  it("requires the exact reviewed repeating duration and keeps replay and capacity guards", async () => {
    const f = await offer({ discount_duration: "repeating", discount_duration_months: 3 });
    await expect(mapping(f, "repeating", 2)).rejects.toThrow("DEFINITION_MISMATCH");
    await mapping(f, "repeating", 3);
    await actor(user, true);
    const key = randomUUID(),
      args = [user, "TEST", "pro", "EG", "month", "+201012345678", key, false];
    const r = await value(
      "select public.reserve_stripe_live_offer($1,$2,$3,$4,$5,$6,$7,$8) v",
      args,
    );
    expect(r).toMatchObject({
      final_minor: 13520,
      mapping: { duration: "repeating", duration_in_months: 3 },
    });
    expect(
      (await value("select public.reserve_stripe_live_offer($1,$2,$3,$4,$5,$6,$7,$8) v", args)).id,
    ).toBe(r.id);
  });
  it("applies the better Kids automatic discount without consuming an inferior coupon", async () => {
    await offer({ package: "kids", expected_price_minor: 19900, percent: 5 });
    await db.exec(`INSERT INTO billing.subscriptions(user_id,plan_version_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key,current_period_start,current_period_end)
   SELECT '${user}',v.id,'paid_active','active','EG','EGP','month','fixture',now(),now()+interval '1 month' FROM billing.plan_versions v JOIN billing.plan_catalog c ON c.id=v.plan_id WHERE c.plan_key='pro' AND v.billing_interval='month' LIMIT 1`);
    await actor(user, true);
    const choice = await value(
      "select public.select_commercial_discount($1,'kids','EG','month','TEST',false) v",
      [user],
    );
    expect(choice).toMatchObject({
      use_offer: false,
      quote: { final_minor: 17910, offer_id: null },
    });
    expect(await value("select count(*)::int v from public.stripe_live_offer_reservations")).toBe(
      0,
    );
  });
  it("keeps manual renewal inside one paid discount term without consuming more campaign slots", async () => {
    const f = await offer({ discount_duration: "repeating", discount_duration_months: 3 });
    const buy = async () => {
      await actor(user);
      const o = await command("create_order", {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        code: "TEST",
        phone: "+201012345678",
        method: "bank",
        key: randomUUID(),
        renewal: true,
      });
      await actor(admin);
      await command("confirm", {
        key: randomUUID(),
        method: "bank",
        currency: "EGP",
        amount_minor: o.final_minor,
        transaction_reference: randomUUID(),
        received_at: new Date().toISOString(),
        funds_verified: true,
        allocations: [{ order_id: o.id, amount_minor: o.final_minor }],
      });
      return o;
    };
    const first = await buy();
    const second = await buy();
    expect(second.final_minor).toBe(13520);
    expect(second.discount_term_renewal).toBe(true);
    expect(
      await value("select consumed_count v from billing.commerce_offers where id=$1", [f.id]),
    ).toBe(1);
    const term = await value(
      "select to_jsonb(t) v from billing.commerce_discount_terms t where offer_id=$1",
      [f.id],
    );
    expect(term.first_order_id).toBe(first.id);
    await db.query(
      "update billing.commerce_discount_terms set starts_at=now()-interval '4 months',ends_at=now()-interval '1 month' where offer_id=$1",
      [f.id],
    );
    await actor(user);
    await expect(
      command("create_order", {
        package: "pro",
        market: "EG",
        billing_interval: "month",
        code: "TEST",
        phone: "+201012345678",
        method: "bank",
        key: randomUUID(),
        renewal: true,
      }),
    ).rejects.toThrow(/LIMIT|ALREADY_USED/);
  });
  it("binds discounted top-up credit to one payment and consumes its coupon atomically once", async () => {
    const f = await offer({
      package: "question_topup",
      billing_interval: "one_time",
      product_scope: "question_topup",
      expected_price_minor: 5000,
    });
    await actor(admin, true);
    const cat = await value(
      "select to_jsonb(c) v from billing.commercial_catalogue c where kind='question_topup'",
    );
    const config = {
      key: randomUUID(),
      offer_id: f.id,
      market: "EG",
      interval: "one_time",
      duration: "once",
      price_id: cat.price_id,
      product_id: cat.product_id,
      coupon_id: "coupon_topup",
      promotion_code_id: "promo_topup",
      reviewed: true,
      review_reference: "Local fixture",
    };
    const m = await value("select public.stripe_live_offer_admin($1,'provision',$2::jsonb) v", [
      admin,
      JSON.stringify(config),
    ]);
    await value("select public.stripe_live_offer_admin($1,'enable',$2::jsonb) v", [
      admin,
      JSON.stringify({
        id: m.id,
        key: randomUUID(),
        reviewed: true,
        review_reference: "Local fixture",
      }),
    ]);
    await actor(user, true);
    const offerIntent = JSON.stringify({ code: "TEST", phone: "+201012345678", key: randomUUID() });
    const request = randomUUID();
    const args = [user, "question_topup", null, null, null, request, "account", offerIntent];
    const p = await value(
      "select public.prepare_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8::jsonb) v",
      args,
    );
    expect(p.amount_minor).toBe(4000);
    expect(
      (
        await value(
          "select public.prepare_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8::jsonb) v",
          args,
        )
      ).id,
    ).toBe(p.id);
    await expect(
      value("select public.prepare_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8::jsonb) v", [
        user,
        "question_topup",
        null,
        null,
        null,
        randomUUID(),
        "account",
        offerIntent,
      ]),
    ).rejects.toThrow(/unique|duplicate/i);
    await value(
      "select public.bind_commercial_purchase_session($1,'cs_live_fixture','cus_fixture',$2,$3) v",
      [p.id, cat.price_id, cat.product_id],
    );
    const paid = [
      p.id,
      "evt_fixture",
      "pi_fixture",
      4000,
      "EGP",
      new Date().toISOString(),
      "cs_live_fixture",
      "cus_fixture",
      cat.price_id,
      cat.product_id,
    ];
    await value(
      "select public.fulfill_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) v",
      paid,
    );
    expect(
      (
        await value(
          "select public.fulfill_commercial_purchase($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) v",
          paid,
        )
      ).replay,
    ).toBe(true);
    expect(
      await value("select consumed_count v from billing.commerce_offers where id=$1", [f.id]),
    ).toBe(1);
    expect(
      await value(
        "select sum(credit_units)::int v from billing.ai_credit_ledger where user_id=$1 and source_type='commercial_purchase'",
        [user],
      ),
    ).toBe(100);
    expect(
      await value(
        "select subscription_id v from public.stripe_live_offer_reservations where id=$1",
        [p.parameters.quote.offer.id],
      ),
    ).toBeNull();
  });
});
