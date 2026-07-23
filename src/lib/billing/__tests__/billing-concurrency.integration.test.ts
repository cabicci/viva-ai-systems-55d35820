import { beforeAll, describe, expect, it } from "vitest";
import {
  disposableDbReady,
  psql,
  psqlConcurrent,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../../scripts/billing/disposable-db";

// Real overlapping-transaction proofs for the billing concurrency invariants.
// Skipped unless BILLING_DISPOSABLE_DB=1 AND a disposable DB is reachable.
const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1" && disposableDbReady();

const USER_RESERVE = "11111111-1111-1111-1111-111111111111";
const USER_COUPON = "22222222-2222-2222-2222-222222222222";
const USER_REFUND = "33333333-3333-3333-3333-333333333333";
const ADMIN_ID = "99999999-9999-9999-9999-999999999999";

const SERVICE = `SET LOCAL request.jwt.claims = '{"role":"service_role"}';`;
const authClaims = (sub: string) =>
  `SET LOCAL request.jwt.claims = '{"sub":"${sub}","role":"authenticated"}';`;

function countOk(results: { ok: boolean }[]): number {
  return results.filter((r) => r.ok).length;
}

describe.skipIf(!ENABLED)("billing concurrency proofs (disposable DB)", () => {
  beforeAll(() => {
    // CI may already have started Supabase and exported PG*. Locally, start+reset.
    if (!process.env.PGHOST && !process.env.DATABASE_URL) {
      const start = startLocalSupabase();
      expect(start.ok).toBe(true);
      const reset = resetLocalDatabase();
      expect(reset.ok).toBe(true);
    } else {
      // Ensure schema is present on the already-provisioned disposable DB.
      const probe = psql("SELECT to_regnamespace('billing') IS NOT NULL");
      expect(probe.trim()).toBe("t");
    }
  }, 300000);

  it("reserve_ai_quota: at most one of two concurrent reserves succeeds (limit 1)", () => {
    // A dedicated policy/plan/subscription giving an AI limit of exactly 1.
    psql(`INSERT INTO billing.entitlement_policy_versions
      (policy_key, version_number, status, effective_from, lesson_allowlist_mode,
       lesson_count_cap, builder_access, video_access, rag_enabled,
       assistant_runtime_per_lesson_quota, assistant_runtime_general_monthly_quota,
       assistant_runtime_period_quota, assistant_runtime_period_days,
       mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled, policy_json, published_at)
      VALUES ('conc_test', 1, 'published', now(), 'curriculum_snapshot',
        74, true, true, true, NULL, 1, NULL, NULL, true, true, true, '{}'::jsonb, now())
      ON CONFLICT (policy_key, version_number)
      DO UPDATE SET assistant_runtime_general_monthly_quota = 1`);

    psql(`INSERT INTO billing.plan_versions
      (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
      SELECT pc.id, epv.id, 99, 'month', 'published', now(), now()
      FROM billing.plan_catalog pc, billing.entitlement_policy_versions epv
      WHERE pc.plan_key='pro' AND epv.policy_key='conc_test' AND epv.version_number=1
      ON CONFLICT (plan_id, version_number) DO NOTHING`);

    psql(`DELETE FROM billing.ai_usage_ledger WHERE user_id='${USER_RESERVE}'`);
    psql(`DELETE FROM billing.entitlement_usage WHERE user_id='${USER_RESERVE}'`);
    psql(`DELETE FROM billing.subscriptions WHERE user_id='${USER_RESERVE}'`);
    psql(`INSERT INTO billing.subscriptions
      (user_id, plan_version_id, access_state, billing_state, market_code, currency_code, billing_interval, idempotency_key, current_period_end)
      SELECT '${USER_RESERVE}', pv.id, 'paid_active', 'active', 'INTL', 'USD', 'month', 'conc-sub-${USER_RESERVE}', now() + interval '30 days'
      FROM billing.plan_versions pv
      JOIN billing.entitlement_policy_versions epv ON epv.id = pv.entitlement_policy_version_id
      WHERE epv.policy_key='conc_test' AND pv.version_number=99`);

    const reserve = (req: string, idem: string) =>
      `BEGIN; ${SERVICE} SELECT billing.reserve_ai_quota('${USER_RESERVE}','assistant_runtime', NULL, '${req}', 1, '${idem}'); COMMIT;`;

    const results = psqlConcurrent([
      reserve("aaaaaaaa-0000-0000-0000-000000000001", "conc-res-a"),
      reserve("aaaaaaaa-0000-0000-0000-000000000002", "conc-res-b"),
    ]);

    return results.then((res) => {
      expect(countOk(res)).toBeLessThanOrEqual(1);
      const committed = Number(
        psql(
          `SELECT COALESCE(used_count + reserved_count, 0) FROM billing.entitlement_usage WHERE user_id='${USER_RESERVE}' AND usage_category='ai_assistant'`,
        ) || "0",
      );
      expect(committed).toBeLessThanOrEqual(1);
    });
  }, 120000);

  it("redeem_admin_access_coupon: at most one of two concurrent redeems succeeds", () => {
    psql(`DELETE FROM billing.admin_access_grants WHERE user_id='${USER_COUPON}'`);
    psql(`DELETE FROM billing.admin_access_coupons WHERE code_hash='conc-code-hash'`);
    psql(`INSERT INTO billing.admin_access_coupons
      (code_hash, intended_user_id, created_by_admin_id, reason, status, idempotency_key)
      VALUES ('conc-code-hash', '${USER_COUPON}', '${ADMIN_ID}', 'concurrency test', 'active', 'conc-coupon-create')`);

    const redeem = (idem: string) =>
      `BEGIN; ${authClaims(USER_COUPON)} SELECT billing.redeem_admin_access_coupon('conc-code-hash', '${idem}'); COMMIT;`;

    return psqlConcurrent([redeem("conc-redeem-a"), redeem("conc-redeem-b")]).then((res) => {
      expect(countOk(res)).toBeLessThanOrEqual(1);
      const grants = Number(
        psql(`SELECT count(*) FROM billing.admin_access_grants WHERE user_id='${USER_COUPON}'`) ||
          "0",
      );
      expect(grants).toBeLessThanOrEqual(1);
    });
  }, 120000);

  it("authorize_refund: concurrent refunds cannot exceed refundable amount", () => {
    psql(`DELETE FROM billing.refunds r USING billing.payment_transactions p
      WHERE r.payment_transaction_id = p.id AND p.user_id='${USER_REFUND}'`);
    psql(`DELETE FROM billing.payment_transactions WHERE user_id='${USER_REFUND}'`);
    psql(`INSERT INTO billing.payment_transactions
      (id, user_id, gateway_code, gateway_transaction_id, transaction_type, status,
       amount_minor, currency_code, tax_amount_minor, gross_minor, tax_minor, idempotency_key, initiated_at)
      VALUES ('44444444-4444-4444-4444-444444444444', '${USER_REFUND}', 'stripe_us', 'conc-tx-1', 'checkout', 'succeeded',
        10000, 'USD', 1400, 10000, 1400, 'conc-pt-1', now())`);

    const refund = (idem: string) =>
      `BEGIN; ${SERVICE} SELECT billing.authorize_refund('44444444-4444-4444-4444-444444444444', 6000, '${idem}', 'requested_by_customer', 'manual'); COMMIT;`;

    return psqlConcurrent([refund("conc-refund-a"), refund("conc-refund-b")]).then((res) => {
      expect(countOk(res)).toBeLessThanOrEqual(1);
      const total = Number(
        psql(
          `SELECT COALESCE(SUM(r.amount_minor), 0) FROM billing.refunds r
           JOIN billing.payment_transactions p ON p.id = r.payment_transaction_id
           WHERE p.user_id='${USER_REFUND}' AND r.status IN ('pending','processing','succeeded')`,
        ) || "0",
      );
      expect(total).toBeLessThanOrEqual(10000);
    });
  }, 120000);
});
