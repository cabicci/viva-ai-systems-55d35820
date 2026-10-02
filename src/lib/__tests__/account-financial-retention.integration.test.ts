// @vitest-environment node
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";

let db: PGlite;
const user = randomUUID(),
  other = randomUUID(),
  sub = randomUUID(),
  payment = randomUUID();
const scalar = async (sql: string) => (await db.query<{ value: unknown }>(sql)).rows[0]?.value;
const enable = () =>
  db.exec("UPDATE billing.account_deletion_control SET financial_purge_enabled=true");
const due = () =>
  db.exec(
    `UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id='${user}'`,
  );
const claim = () =>
  scalar(`SELECT public.lc09_claim_financial_purge('${user}') AS value`) as Promise<{
    lease_token: string;
    stage: string;
  }>;
const finish = (lease: string) =>
  scalar(`SELECT public.lc09_complete_financial_purge('${user}','${lease}') AS value`);
async function denied(sql: string, pattern: RegExp) {
  await db.exec("SAVEPOINT denied");
  try {
    await expect(db.exec(sql)).rejects.toThrow(pattern);
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT denied; RELEASE SAVEPOINT denied");
  }
}

describe("account financial erasure after fifteen elapsed days", () => {
  beforeAll(async () => {
    db = await accountDeletionTestDb(true);
  }, 30_000);
  afterAll(async () => db?.close());
  beforeEach(async () => {
    await db.exec(`BEGIN;
      SELECT set_config('request.jwt.claim.role','service_role',false);
      INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');
      INSERT INTO billing.account_deletion_lifecycle(user_id,stage,completed_at,financial_retention_reference,crm_retention_reference,release_reference)
        VALUES('${user}','complete',now(),'OWNER-FINANCIAL-15D-01','crm-separate','synthetic');
      INSERT INTO billing.subscriptions(id,user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key)
        VALUES('${sub}','${user}','suspended','canceled','EG','EGP','month','finance-own'),
        (gen_random_uuid(),'${other}','paid_active','active','EG','EGP','month','finance-other');
      INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status,metadata)
        VALUES('${user}','stripe_us','cus_financial_erase','active','{"mode":"test"}'),
        ('${other}','stripe_us','cus_financial_erase_other','active','{"mode":"test"}');
      INSERT INTO billing.gateway_subscriptions(subscription_id,gateway_code,gateway_subscription_id,gateway_customer_id,status)
        VALUES('${sub}','stripe_us','sub_financial_erase','cus_financial_erase','canceled');
      INSERT INTO billing.payment_transactions(id,subscription_id,user_id,gateway_code,gateway_transaction_id,transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at,metadata)
        VALUES('${payment}','${sub}','${user}','stripe_us','in_financial_erase','checkout','succeeded',1000,'EGP','finance-payment',now(),'{"stripe_event_id":"evt_financial_erase"}');
      INSERT INTO billing.tax_records(payment_transaction_id,jurisdiction,tax_amount_minor,tax_rate_bps,status,calculated_at)
        VALUES('${payment}','EG',0,0,'calculated',now());
      INSERT INTO billing.refunds(payment_transaction_id,refund_type,status,amount_minor,currency_code,reason_code,gateway_code,idempotency_key,requested_at)
        VALUES('${payment}','manual','succeeded',1000,'EGP','synthetic','stripe_us','finance-refund',now());
      INSERT INTO billing.subscription_events(subscription_id,event_type,idempotency_key,occurred_at,source)
        VALUES('${sub}','canceled','finance-event',now(),'system');
      INSERT INTO billing.webhook_events(gateway_code,gateway_event_id,event_type,status,signature_valid,received_at,idempotency_key,payload_encrypted,payload_minimized)
        VALUES('stripe_us','evt_financial_erase','invoice.paid','processed',true,now(),'finance-receipt','private'::bytea,'{}'),
        ('stripe_us','evt_financial_other','invoice.paid','processed',true,now(),'finance-other-receipt','other'::bytea,'{"customer":"cus_financial_erase_other"}');
      INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES('evt_financial_kids','${user}');
      INSERT INTO public.kids_stripe_refunds(refund_id,parent_id,invoice_id,amount_minor,status)
        VALUES('re_financial_kids','${user}','in_financial_kids',1000,'succeeded');
      INSERT INTO public.kids_retention_notices(parent_id,expiry,recipient_email,profile_ids)
        VALUES('${user}',now(),NULL,'{}');`);
  });
  afterEach(async () => db.exec("ROLLBACK"));

  it("starts disabled and schedules the exact deadline from completion, including DST-independent elapsed time", async () => {
    expect(
      await scalar("SELECT financial_purge_enabled AS value FROM billing.account_deletion_control"),
    ).toBe(false);
    expect(
      await scalar(
        `SELECT extract(epoch FROM financial_due_at-completed_at)::int AS value FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`,
      ),
    ).toBe(15 * 24 * 60 * 60);
    await denied(`SELECT public.lc09_claim_financial_purge('${user}')`, /PURGE_DISABLED/);
    await enable();
    await denied(`SELECT public.lc09_claim_financial_purge('${user}')`, /NOT_DUE/);
    expect(
      await scalar("SELECT count(*)::int AS value FROM public.lc09_financial_purge_candidates()"),
    ).toBe(0);
  });
  it("retains finance before the boundary and becomes due at that boundary", async () => {
    await enable();
    await db.exec(
      `UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '359 hours' WHERE user_id='${user}'`,
    );
    expect(await scalar(`SELECT public.lc09_financial_expired('${user}') AS value`)).toBe(false);
    await db.exec(
      `UPDATE billing.account_deletion_lifecycle SET completed_at=statement_timestamp()-interval '360 hours' WHERE user_id='${user}'`,
    );
    expect(await scalar(`SELECT public.lc09_financial_expired('${user}') AS value`)).toBe(true);
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.payment_transactions WHERE user_id='${user}'`,
      ),
    ).toBe(1);
  });
  it("rejects browser/anonymous callers and null, wrong or expired leases", async () => {
    await enable();
    await due();
    await denied(
      `SET LOCAL ROLE authenticated; SELECT public.lc09_claim_financial_purge('${user}')`,
      /permission denied/,
    );
    await denied(
      `SELECT set_config('request.jwt.claim.role','authenticated',true); SELECT public.lc09_claim_financial_purge('${user}')`,
      /SERVICE_ONLY/,
    );
    await denied(`SELECT public.lc09_complete_financial_purge('${user}',NULL)`, /LEASE_LOST/);
    const c = await claim();
    await denied(`SELECT public.lc09_claim_financial_purge('${user}')`, /WORKER_BUSY/);
    await denied(
      `SELECT public.lc09_complete_financial_purge('${user}','${randomUUID()}')`,
      /LEASE_LOST/,
    );
    await db.exec(
      `UPDATE billing.account_deletion_lifecycle SET financial_lease_until=now()-interval '1 second' WHERE user_id='${user}'`,
    );
    await denied(
      `SELECT public.lc09_complete_financial_purge('${user}','${c.lease_token}')`,
      /LEASE_LOST/,
    );
  });
  it("atomically erases dependent receipts and Kids finance, preserves the other account, and is idempotent", async () => {
    const before = await scalar(
      `SELECT jsonb_agg(to_jsonb(x)) AS value FROM billing.gateway_customers x WHERE user_id='${other}'`,
    );
    await enable();
    await due();
    const c = await claim();
    expect(c.stage).toBe("financial_due");
    expect(await finish(c.lease_token)).toEqual({ stage: "financial_purged" });
    for (const table of ["subscriptions", "gateway_customers", "payment_transactions"]) {
      expect(
        await scalar(`SELECT count(*)::int AS value FROM billing.${table} WHERE user_id='${user}'`),
      ).toBe(0);
    }
    for (const table of ["kids_stripe_events", "kids_stripe_refunds", "kids_retention_notices"]) {
      expect(
        await scalar(
          `SELECT count(*)::int AS value FROM public.${table} WHERE parent_id='${user}'`,
        ),
      ).toBe(0);
    }
    expect(await scalar("SELECT count(*)::int AS value FROM billing.tax_records")).toBe(0);
    expect(await scalar("SELECT count(*)::int AS value FROM billing.refunds")).toBe(0);
    expect(
      await scalar(
        "SELECT count(*)::int AS value FROM billing.webhook_events WHERE gateway_event_id='evt_financial_erase'",
      ),
    ).toBe(0);
    expect(
      await scalar(
        "SELECT count(*)::int AS value FROM billing.webhook_events WHERE gateway_event_id='evt_financial_other'",
      ),
    ).toBe(1);
    expect(
      await scalar(
        `SELECT jsonb_agg(to_jsonb(x)) AS value FROM billing.gateway_customers x WHERE user_id='${other}'`,
      ),
    ).toEqual(before);
    expect(await claim()).toEqual({ stage: "financial_purged" });
    expect(await finish(c.lease_token)).toEqual({ stage: "financial_purged" });
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`,
      ),
    ).toBe(1);
  });
  it("ignores paid/refund deliveries after expiry without restoring access or retaining their payloads, even while paused", async () => {
    await due();
    expect(
      await scalar(
        `SELECT public.apply_stripe_webhook_event('evt_after_deadline','invoice.paid',now(),'payment_succeeded','${sub}','${user}',NULL,NULL,'cus_financial_erase','sub_financial_erase','active',now(),now()+interval '1 month',false,NULL,NULL,NULL,'{"private":"do not retain"}') AS value`,
      ),
    ).toEqual({ processed: true, access_suppressed: true, financial_erased: true });
    expect(
      await scalar(
        `SELECT public.apply_kids_stripe_event('evt_kids_after_deadline','${user}','sub_kids_after_deadline','cus_financial_erase','unknown_price','active',now(),true,'in_after_deadline',now(),now()+interval '1 month') AS value`,
      ),
    ).toBe(false);
    expect(
      await scalar(
        `SELECT public.apply_kids_stripe_refund('evt_refund_after_deadline','${user}','sub_kids_after_deadline','cus_financial_erase','in_after_deadline','re_after_deadline',100,100,'succeeded',now()) AS value`,
      ),
    ).toBe(false);
    expect(
      await scalar(
        "SELECT count(*)::int AS value FROM billing.webhook_events WHERE gateway_event_id LIKE '%after_deadline%'",
      ),
    ).toBe(0);
  });

  it("erases credit, coupon, AI and retry ledgers while preserving shared definitions and another user's coupon", async () => {
    const definition = randomUUID(),
      topup = randomUUID(),
      adminCoupon = randomUUID(),
      outbox = randomUUID();
    await db.exec(`DELETE FROM billing.account_deletion_lifecycle WHERE user_id='${user}';
      INSERT INTO billing.coupon_definitions(id,coupon_code,campaign_key,discount_type,discount_value,applicable_plan_keys,status,valid_from,valid_to)
        VALUES('${definition}','synthetic','synthetic','percent',10,ARRAY['pro'],'active',now(),now()+interval '1 day');
      INSERT INTO billing.coupon_assignments(coupon_definition_id,user_id,verified_email_hash,status,assigned_at,expires_at,idempotency_key)
        VALUES('${definition}','${user}','synthetic_hash_123','assigned',now(),now()+interval '1 day','financial-coupon');
      INSERT INTO billing.purchase_coupon_reservations(coupon_definition_id,user_id,idempotency_key)
        VALUES('${definition}','${user}','financial-reservation');
      INSERT INTO billing.ai_topup_package_versions(id,package_key,version_number,status,credit_units,expiry_days,market_prices,effective_from)
        VALUES('${topup}','synthetic',1,'published',100,30,'{}',now());
      INSERT INTO billing.ai_topup_purchases(user_id,ai_topup_package_version_id,payment_transaction_id,credit_units_granted,expires_at,status,idempotency_key)
        VALUES('${user}','${topup}','${payment}',100,now()+interval '1 day','expired','financial-topup');
      INSERT INTO billing.monetary_credit_allocations(user_id,source_payment_transaction_id,allocated_minor,remaining_minor,currency_code,status,refund_id)
        VALUES('${user}','${payment}',1000,0,'EGP','refunded',(SELECT id FROM billing.refunds LIMIT 1));
      INSERT INTO billing.monetary_credit_ledger(user_id,entry_type,amount_minor,currency_code,balance_after_minor,source_type,source_id,idempotency_key,occurred_at)
        VALUES('${user}','refund',1000,'EGP',0,'payment','${payment}','financial-money',now());
      INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,idempotency_key,occurred_at)
        VALUES('${user}','expire',100,0,'purchase','${payment}','financial-ai-credit',now());
      INSERT INTO billing.ai_usage_ledger(user_id,usage_category,model_key,request_id,input_tokens,output_tokens,provider_cost_micro,billable,status,idempotency_key,occurred_at)
        VALUES('${user}','assistant_runtime','synthetic',gen_random_uuid(),10,10,100,false,'committed','financial-ai-usage',now());
      INSERT INTO billing.admin_access_coupons(id,code_hash,intended_user_id,created_by_admin_id,reason,idempotency_key)
        VALUES('${adminCoupon}','own_code_hash','${user}','${other}','synthetic','financial-admin'),
        (gen_random_uuid(),'other_code_hash','${other}','${user}','preserve-other','financial-admin-other');
      INSERT INTO billing.admin_access_grants(user_id,source_coupon_id,starts_at,expires_at,status,idempotency_key)
        VALUES('${user}','${adminCoupon}',now(),now()+interval '1 day','revoked','financial-grant');
      INSERT INTO billing.outbox_events(id,aggregate_type,aggregate_id,event_type,payload,status,idempotency_key)
        VALUES('${outbox}','subscription','${sub}','synthetic','{}','published','financial-outbox');
      INSERT INTO billing.dead_letter_events(source_type,source_id,event_type,payload,error_code,failed_at,status)
        VALUES('outbox','${outbox}','synthetic','{}','synthetic',now(),'discarded');
      INSERT INTO billing.job_executions(job_type,idempotency_key,status,input,started_at)
        VALUES('synthetic','financial-job','succeeded','{"user_id":"${user}"}',now());
      INSERT INTO billing.legacy_subscription_import_audit(legacy_user_id,billing_subscription_id,mapped_access_state,mapped_billing_state)
        VALUES('${user}','${sub}','suspended','canceled');
      INSERT INTO billing.account_deletion_lifecycle(user_id,stage,completed_at,financial_retention_reference,crm_retention_reference,release_reference)
        VALUES('${user}','complete',now(),'OWNER-FINANCIAL-15D-01','crm-separate','synthetic');`);
    await enable();
    await due();
    const c = await claim();
    await finish(c.lease_token);
    for (const table of [
      "coupon_assignments",
      "purchase_coupon_reservations",
      "ai_topup_purchases",
      "monetary_credit_allocations",
      "monetary_credit_ledger",
      "ai_credit_ledger",
      "ai_usage_ledger",
      "admin_access_grants",
    ]) {
      expect(
        await scalar(`SELECT count(*)::int AS value FROM billing.${table} WHERE user_id='${user}'`),
      ).toBe(0);
    }
    for (const table of [
      "outbox_events",
      "dead_letter_events",
      "job_executions",
      "legacy_subscription_import_audit",
    ]) {
      expect(await scalar(`SELECT count(*)::int AS value FROM billing.${table}`)).toBe(0);
    }
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.admin_access_coupons WHERE intended_user_id='${user}'`,
      ),
    ).toBe(0);
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.admin_access_coupons WHERE intended_user_id='${other}' AND created_by_admin_id IS NULL`,
      ),
    ).toBe(1);
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.coupon_definitions WHERE id='${definition}'`,
      ),
    ).toBe(1);
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.ai_topup_package_versions WHERE id='${topup}'`,
      ),
    ).toBe(1);
  });

  it("rolls back shared references and rejects attempts to recreate finance after the deadline", async () => {
    await db.exec(`INSERT INTO billing.payment_transactions(user_id,subscription_id,gateway_code,gateway_transaction_id,transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at)
      VALUES('${other}','${sub}','stripe_us','in_shared_financial','checkout','succeeded',1000,'EGP','financial-shared',now());`);
    await enable();
    await due();
    const c = await claim();
    await denied(
      `SELECT public.lc09_complete_financial_purge('${user}','${c.lease_token}')`,
      /SHARED_FINANCIAL_REFERENCE/,
    );
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.payment_transactions WHERE user_id='${user}'`,
      ),
    ).toBe(1);
    await denied(
      `INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status)
      VALUES('${user}','future','future_financial','active')`,
      /RETENTION_EXPIRED/,
    );
  });
  it("rolls back all erasure on an unclassified financial ownership table", async () => {
    await enable();
    await due();
    const c = await claim();
    await db.exec("CREATE TABLE billing.future_financial_data(user_id uuid,private_payload text)");
    await denied(
      `SELECT public.lc09_complete_financial_purge('${user}','${c.lease_token}')`,
      /UNCLASSIFIED_FINANCIAL_TABLE/,
    );
    expect(
      await scalar(
        `SELECT count(*)::int AS value FROM billing.payment_transactions WHERE user_id='${user}'`,
      ),
    ).toBe(1);
    expect(
      await scalar(
        `SELECT financial_purged_at AS value FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`,
      ),
    ).toBe(null);
  });
  it("pauses physical erasure, releases a failed worker, and resumes the same due account", async () => {
    await enable();
    await due();
    const c = await claim();
    expect(
      await scalar(
        `SELECT public.lc09_complete_financial_purge('${user}','${c.lease_token}',true) AS value`,
      ),
    ).toEqual({ stage: "financial_due" });
    await db.exec("UPDATE billing.account_deletion_control SET financial_purge_enabled=false");
    await denied(`SELECT public.lc09_claim_financial_purge('${user}')`, /PURGE_DISABLED/);
    expect(await scalar(`SELECT public.lc09_financial_expired('${user}') AS value`)).toBe(true);
    await enable();
    const next = await claim();
    expect(next.lease_token).not.toBe(c.lease_token);
    await finish(next.lease_token);
  });
});
