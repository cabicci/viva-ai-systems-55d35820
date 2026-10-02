// @vitest-environment node
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";

let db: PGlite;
const user = randomUUID();
const other = randomUUID();
const subscription = randomUUID();
const query = async (statement: string) =>
  (await db.query<{ value: unknown }>(statement)).rows[0]?.value;
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
    db = await accountDeletionTestDb();
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

  it("preserves active provider-attempt accounting and blocks new attempts for the actual reservation owner", async () => {
    await db.exec(
      `UPDATE billing.subscriptions SET plan_version_id=(SELECT pv.id FROM billing.plan_versions pv JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE pc.plan_key='pro' AND pv.billing_interval='month' LIMIT 1),current_period_end=now()+interval '1 month' WHERE user_id='${user}'`,
    );
    const reservation = (await query(
      `SELECT billing.reserve_ai_quota('${user}','assistant_runtime','lesson-1','${randomUUID()}',1,'lc09-reservation') AS value`,
    )) as { reservation_id: string };
    expect(reservation.reservation_id).toBeTruthy();
    expect(
      await query(
        `SELECT billing.register_provider_attempt('${reservation.reservation_id}','openai','provider-1','attempt-1') AS value`,
      ),
    ).toMatchObject({ attempt_index: 1 });
    await expectDenied(
      () =>
        query(
          `SELECT billing.register_provider_attempt('${randomUUID()}','openai','missing','missing') AS value`,
        ),
      /RESERVATION_NOT_FOUND/,
    );
    await enable();
    const c = await claim();
    await expectDenied(
      () =>
        query(
          `SELECT billing.register_provider_attempt('${reservation.reservation_id}','openai','provider-2','attempt-2') AS value`,
        ),
      /ACCOUNT_DELETION_PENDING/,
    );
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /FINANCIAL_RECONCILIATION_PENDING/,
    );
    await query(
      `SELECT billing.finalize_provider_attempt('${reservation.reservation_id}',1,'succeeded',10,20,1000) AS value`,
    );
    await advance(c.lease_token, "provider_reconciled");
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

  it("blocks welcome and subscription claims and waits for earlier sender leases before erasure", async () => {
    const event = randomUUID();
    await db.exec(`UPDATE billing.subscriptions SET plan_version_id=(SELECT pv.id FROM billing.plan_versions pv JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE pc.plan_key='pro' AND pv.billing_interval='month' LIMIT 1) WHERE id='${subscription}';
      INSERT INTO billing.subscription_events(id,subscription_id,event_type,source,processing_status,to_access_state,from_access_state,idempotency_key,occurred_at)
      VALUES('${event}','${subscription}','payment_succeeded','gateway_webhook','applied','paid_active','free_active','mail_${event}',now());
      UPDATE public.account_welcome_outbox SET first_attempt_at=now(),lease_until=now()+interval '5 minutes' WHERE user_id='${user}';
      UPDATE public.subscription_mail_outbox SET first_attempt_at=now(),lease_until=now()+interval '5 minutes' WHERE user_id='${user}';`);
    await enable();
    const c = await claim();
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /LC09_ACCOUNT_MAIL_SEND_PENDING/,
    );
    await db.exec(
      `UPDATE public.account_welcome_outbox SET provider_email_id='welcome_settled' WHERE user_id='${user}';`,
    );
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /LC09_ACCOUNT_MAIL_SEND_PENDING/,
    );
    await db.exec(
      `UPDATE public.subscription_mail_outbox SET provider_email_id='subscription_settled' WHERE user_id='${user}';`,
    );
    await db.exec(
      `UPDATE public.account_welcome_outbox SET provider_email_id=NULL,lease_until=now()-interval '1 minute' WHERE user_id='${user}';`,
    );
    for (const fn of [
      "claim_account_welcome_emails",
      "claim_account_welcome_emails_v2",
      "claim_subscription_mail",
    ])
      expect(
        await query(
          `SELECT count(*)::int AS value FROM public.${fn}() WHERE ${fn === "claim_subscription_mail" ? "event_id='" + event + "'" : "user_id='" + user + "'"}`,
        ),
      ).toBe(0);
    await db.exec(`DELETE FROM public.account_welcome_outbox WHERE user_id='${user}';
      INSERT INTO public.account_welcome_outbox(user_id,recipient) VALUES('${user}','same@example.test');`);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.account_welcome_outbox WHERE user_id='${user}'`,
      ),
    ).toBe(0);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.account_welcome_outbox WHERE user_id='${other}'`,
      ),
    ).toBe(1);
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.subscription_mail_outbox WHERE user_id='${user}'`,
      ),
    ).toBe(0);
  });

  it("erases verified contact mail and receipts, waits for an existing sender and blocks requeue without affecting another recipient", async () => {
    const targetMail = randomUUID(),
      otherMail = randomUUID();
    await db.exec(`SELECT public.queue_contact_acknowledgement('${targetMail}','same@example.test','en','support','Support','Private body','<p>Private body</p>');
      SELECT public.queue_contact_acknowledgement('${otherMail}','other@example.test','en','support','Other','Other body','<p>Other body</p>');
      UPDATE public.contact_acknowledgement_outbox SET first_attempt_at=now(),lease_until=now()+interval '5 minutes' WHERE id='${targetMail}';`);
    await enable();
    const c = await claim();
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /LC09_CONTACT_SEND_PENDING/,
    );
    await expectDenied(
      () =>
        db.exec(
          `SELECT public.queue_contact_acknowledgement('${randomUUID()}','same@example.test','en','support','Again','Again','<p>Again</p>')`,
        ),
      /ACCOUNT_DELETION_BLOCKED/,
    );
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.claim_contact_acknowledgements() WHERE recipient='same@example.test'`,
      ),
    ).toBe(0);
    await db.exec(`UPDATE public.contact_acknowledgement_outbox SET provider_email_id='email_lc09' WHERE id='${targetMail}';
      SELECT public.record_contact_mail_receipt('receipt_lc09','email_lc09','same@example.test','email.delivered',now());`);
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.contact_acknowledgement_outbox WHERE id='${targetMail}'`,
      ),
    ).toBe(0);
    expect(
      await query(
        "SELECT count(*)::int AS value FROM public.contact_mail_receipts WHERE event_id='receipt_lc09'",
      ),
    ).toBe(0);
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.contact_acknowledgement_outbox WHERE id='${otherMail}'`,
      ),
    ).toBe(1);
    expect(
      await query(
        "SELECT public.record_contact_mail_receipt('late_lc09','email_lc09','same@example.test','email.delivered',now()) AS value",
      ),
    ).toBe("ignored");
    await db.exec(`DELETE FROM auth.users WHERE id='${user}'`);
    await advance(c.lease_token, "complete");
    expect(
      await query(
        `SELECT contact_recipient AS value FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`,
      ),
    ).toBeNull();
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
    await db.exec("SET LOCAL ROLE authenticated");
    expect(
      await query(
        `SELECT count(*)::int AS value FROM public.kids_profiles WHERE parent_id='${user}'`,
      ),
    ).toBe(0);
    await db.exec("RESET ROLE");
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

  it("keeps unknown Checkout creation pending, records it after blocking and prevents both billing portals", async () => {
    const attempt = (await query(
      `SELECT public.lc09_begin_kids_checkout('${user}','kids-checkout-test','customer=cus_lc09') AS value`,
    )) as { attempt_id: string };
    await enable();
    const c = await claim();
    await expectDenied(
      () => advance(c.lease_token, "provider_reconciled"),
      /RECONCILIATION_PENDING/,
    );
    expect(
      await query(
        `SELECT public.lc09_record_kids_checkout('${user}','${attempt.attempt_id}','cs_test',true) AS value`,
      ),
    ).toBe(false);
    for (const fn of ["get_stripe_portal_context", "get_kids_stripe_portal_context"])
      await expectDenied(
        () => query(`SELECT public.${fn}('${user}') AS value`),
        /ACCOUNT_DELETION_PENDING/,
      );
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    expect(
      await query(
        `SELECT count(*)::int AS value FROM billing.account_checkout_attempts WHERE user_id='${user}'`,
      ),
    ).toBe(0);
  });

  it("pauses an in-progress job without removing its tombstone or restoring access", async () => {
    await enable();
    const c = await claim();
    await db.exec("UPDATE billing.account_deletion_control SET enabled=false");
    await expectDenied(() => advance(c.lease_token, "provider_reconciled"), /LC09_DISABLED/);
    expect(
      await query(
        `SELECT billing.evaluate_access('${user}','lesson','builder:intro')->>'allowed' AS value`,
      ),
    ).toBe("false");
    expect(await query(`SELECT count(*)::int AS value FROM auth.users WHERE id='${user}'`)).toBe(1);
  });

  it("includes legacy Storage ownership, verifies erasure and protects shared platform content", async () => {
    await db.exec(`CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text,name text,owner_id text,owner uuid);
      INSERT INTO storage.objects VALUES('personal-test','new','${user}',NULL),('personal-test','legacy',NULL,'${user}'),
        ('personal-test','other','${other}',NULL),('kids-lesson-content','platform','${user}',NULL)`);
    await enable();
    await expectDenied(claim, /LC09_SHARED_STORAGE_REVIEW_REQUIRED/);
    expect(
      await query("SELECT count(*)::int AS value FROM billing.account_deletion_lifecycle"),
    ).toBe(0);
    await db.exec(`UPDATE storage.objects SET owner_id=NULL WHERE name='platform'`);
    await expectDenied(claim, /LC09_STORAGE_BUCKET_REVIEW_REQUIRED/);
    await db.exec(
      `UPDATE billing.account_deletion_control SET learner_storage_buckets=ARRAY['personal-test']`,
    );
    const c = (await claim()) as {
      lease_token: string;
      stage: string;
      storage_objects: { bucket: string; name: string }[];
    };
    expect(c.storage_objects.map((o) => o.name).sort()).toEqual(["legacy", "new"]);
    await advance(c.lease_token, "provider_reconciled");
    await advance(c.lease_token, "learner_erased");
    await db.exec(`DELETE FROM auth.users WHERE id='${user}'`);
    await expectDenied(() => advance(c.lease_token, "complete"), /STORAGE_OBJECTS_REMAIN/);
    await db.exec(`DELETE FROM storage.objects WHERE coalesce(owner_id,owner::text)='${user}'`);
    await advance(c.lease_token, "complete");
    expect(await query("SELECT count(*)::int AS value FROM storage.objects")).toBe(2);
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
