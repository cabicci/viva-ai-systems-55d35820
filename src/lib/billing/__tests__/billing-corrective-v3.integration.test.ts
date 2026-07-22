import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  disposableDbReady,
  psql,
  psqlAllowFail,
  psqlConcurrent,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../../scripts/billing/disposable-db";

// Corrective V3 proofs. DB-backed proofs are skipped unless BILLING_DISPOSABLE_DB=1
// AND a disposable DB is reachable. The static SQL assertions always run.
const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1" && disposableDbReady();

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const CORRECTIVE_MIGRATION = "supabase/migrations/20260722190000_billing_v3_corrective_refresh.sql";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function billingMigrationFiles(): string[] {
  const dir = path.join(REPO_ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && f.includes("billing"))
    .sort();
}

/** Extract a single CREATE FUNCTION body (up to the closing `$$;`). */
function extractFunctionBody(sql: string, fnName: string): string {
  const marker = `FUNCTION ${fnName}`;
  const start = sql.indexOf(marker);
  if (start < 0) return "";
  const end = sql.indexOf("$$;", start);
  return end < 0 ? sql.slice(start) : sql.slice(start, end + 3);
}

// ---------------------------------------------------------------------------
// Static SQL assertions (always run — no DB required).
// ---------------------------------------------------------------------------
describe("V3 corrective — static SQL assertions", () => {
  const sql = readRepoFile(CORRECTIVE_MIGRATION);

  it("re-defines create_admin_access_coupon as the last-wins definition", () => {
    const defining = billingMigrationFiles().filter((f) =>
      readRepoFile(path.join("supabase/migrations", f)).includes(
        "FUNCTION billing.create_admin_access_coupon",
      ),
    );
    expect(defining.length).toBeGreaterThan(0);
    expect(defining[defining.length - 1]).toBe("20260722190000_billing_v3_corrective_refresh.sql");
  });

  it("effective create_admin_access_coupon has NO all-zero UUID fallback", () => {
    const body = extractFunctionBody(sql, "billing.create_admin_access_coupon");
    expect(body.length).toBeGreaterThan(0);
    expect(body).not.toContain(ZERO_UUID);
    // Identity is auth.uid() only and bare service role is rejected.
    expect(body).toContain("ADMIN_COUPON_UNAUTHENTICATED");
    expect(body).toContain("created_by_admin_id");
    expect(body).toMatch(/v_admin uuid := auth\.uid\(\)/);
  });

  it("declares durable provider-attempt surface (new signature + finalize)", () => {
    expect(sql).toContain(
      "FUNCTION billing.register_provider_attempt(\n  p_reservation_id uuid,\n  p_provider text,",
    );
    expect(sql).toContain(
      "DROP FUNCTION IF EXISTS billing.register_provider_attempt(uuid, integer, text, text)",
    );
    expect(sql).toContain("FUNCTION billing.finalize_provider_attempt(");
    expect(sql).toContain("attempt_idempotency_key");
    expect(sql).toContain("ai_usage_ledger_attempt_status_check");
  });

  it("declares versioned admin-grant policy + canonical grant state", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS billing.admin_grant_policy_versions");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS billing.admin_user_grant_state");
    expect(sql).toContain("FUNCTION billing.resolve_admin_grant_policy(");
    expect(sql).toContain("FUNCTION billing.publish_admin_grant_policy_version(");
    expect(sql).toContain("ADMIN_GRANT_POLICY_UNAVAILABLE");
    expect(sql).toContain("ADMIN_GRANT_POLICY_AMBIGUOUS");
  });

  it("serializes per-user coupon grants with an advisory xact lock", () => {
    const body = extractFunctionBody(sql, "billing.redeem_admin_access_coupon");
    expect(body).toContain("pg_advisory_xact_lock");
    expect(body).toContain("billing.admin_grant:");
    expect(body).toContain("admin_user_grant_state");
  });
});

// ---------------------------------------------------------------------------
// DB-backed proofs.
// ---------------------------------------------------------------------------
const SERVICE = `SET LOCAL request.jwt.claims = '{"role":"service_role"}';`;
const authClaims = (sub: string) =>
  `SET LOCAL request.jwt.claims = '{"sub":"${sub}","role":"authenticated"}';`;

/** Drop psql command tags so only the query result value remains. */
function lastValue(out: string): string {
  const lines = out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !["BEGIN", "SET", "COMMIT", "ROLLBACK"].includes(s));
  return lines[lines.length - 1] ?? "";
}

function tx(claims: string, body: string): string {
  return lastValue(psql(`BEGIN; ${claims} ${body}; COMMIT;`));
}

function txAllowFail(claims: string, body: string): { ok: boolean; out: string } {
  return psqlAllowFail(`BEGIN; ${claims} ${body}; COMMIT;`);
}

function countOk(results: { ok: boolean }[]): number {
  return results.filter((r) => r.ok).length;
}

const USER_PROV = "aaaa1111-1111-1111-1111-111111111111";
const USER_POLICY_A = "bbbb1111-1111-1111-1111-111111111111";
const USER_POLICY_B = "bbbb2222-2222-2222-2222-222222222222";
const USER_POLICY_PAID = "bbbb3333-3333-3333-3333-333333333333";
const ADMIN_REAL = "cccc9999-9999-9999-9999-999999999999";
const USER_TARGET = "cccc1111-1111-1111-1111-111111111111";
const NON_ADMIN = "cccc2222-2222-2222-2222-222222222222";
const USER_DISTINCT = "dddd1111-1111-1111-1111-111111111111";
const ADMIN_ID = "99999999-9999-9999-9999-999999999999";

function seedPaidSubscription(userId: string, policyKey: string, version: number, quota: number) {
  psql(`INSERT INTO billing.entitlement_policy_versions
    (policy_key, version_number, status, effective_from, lesson_allowlist_mode,
     lesson_count_cap, builder_access, video_access, rag_enabled,
     assistant_runtime_per_lesson_quota, assistant_runtime_general_monthly_quota,
     assistant_runtime_period_quota, assistant_runtime_period_days,
     mission_evaluation_enabled, reveal_answer_enabled, wow_path_enabled, policy_json, published_at)
    VALUES ('${policyKey}', 1, 'published', now(), 'curriculum_snapshot',
      74, true, true, true, NULL, ${quota}, NULL, NULL, true, true, true, '{}'::jsonb, now())
    ON CONFLICT (policy_key, version_number)
    DO UPDATE SET assistant_runtime_general_monthly_quota = ${quota}`);

  psql(`INSERT INTO billing.plan_versions
    (plan_id, entitlement_policy_version_id, version_number, billing_interval, status, effective_from, published_at)
    SELECT pc.id, epv.id, ${version}, 'month', 'published', now(), now()
    FROM billing.plan_catalog pc, billing.entitlement_policy_versions epv
    WHERE pc.plan_key='pro' AND epv.policy_key='${policyKey}' AND epv.version_number=1
    ON CONFLICT (plan_id, version_number) DO NOTHING`);

  psql(`DELETE FROM billing.ai_usage_ledger WHERE user_id='${userId}'`);
  psql(`DELETE FROM billing.entitlement_usage WHERE user_id='${userId}'`);
  psql(`DELETE FROM billing.subscriptions WHERE user_id='${userId}'`);
  psql(`INSERT INTO billing.subscriptions
    (user_id, plan_version_id, access_state, billing_state, market_code, currency_code, billing_interval, idempotency_key, current_period_end)
    SELECT '${userId}', pv.id, 'paid_active', 'active', 'INTL', 'USD', 'month', 'corr-sub-${userId}', now() + interval '30 days'
    FROM billing.plan_versions pv
    JOIN billing.entitlement_policy_versions epv ON epv.id = pv.entitlement_policy_version_id
    WHERE epv.policy_key='${policyKey}' AND pv.version_number=${version}`);
}

function reserve(userId: string, req: string, idem: string): string {
  return tx(
    SERVICE,
    `SELECT (billing.reserve_ai_quota('${userId}','assistant_runtime', NULL, '${req}', 1, '${idem}')->>'reservation_id')`,
  );
}

describe.skipIf(!ENABLED)("V3 corrective — DB proofs (disposable DB)", () => {
  beforeAll(() => {
    if (!process.env.PGHOST && !process.env.DATABASE_URL) {
      const start = startLocalSupabase();
      expect(start.ok).toBe(true);
      const reset = resetLocalDatabase();
      expect(reset.ok).toBe(true);
    } else {
      const probe = psql("SELECT to_regnamespace('billing') IS NOT NULL");
      expect(probe.trim()).toBe("t");
    }
  }, 300000);

  // -------------------------------------------------------------------------
  // A. Durable provider-attempt rows.
  // -------------------------------------------------------------------------
  describe("A. durable provider attempts", () => {
    it("creates one durable row per invocation, charges quota once, allocates indices", () => {
      seedPaidSubscription(USER_PROV, "corr_prov", 98, 100);
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a1", "corr-prov-res-1");
      expect(resId).toMatch(/^[0-9a-f-]{36}$/);

      const i1 = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-A',NULL)->>'attempt_index')`,
      );
      expect(i1).toBe("1");
      const usedAfter1 = psql(
        `SELECT used_count FROM billing.entitlement_usage WHERE user_id='${USER_PROV}' AND usage_category='ai_assistant'`,
      );
      expect(usedAfter1.trim()).toBe("1");

      const i2 = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-B',NULL)->>'attempt_index')`,
      );
      expect(i2).toBe("2");
      const i3 = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-C',NULL)->>'attempt_index')`,
      );
      expect(i3).toBe("3");

      // Quota is charged exactly once regardless of attempt count.
      const usedFinal = psql(
        `SELECT used_count FROM billing.entitlement_usage WHERE user_id='${USER_PROV}' AND usage_category='ai_assistant'`,
      );
      expect(usedFinal.trim()).toBe("1");

      const attemptRows = psql(
        `SELECT count(*) FROM billing.ai_usage_ledger WHERE reservation_id='${resId}' AND attempt_index >= 1`,
      );
      expect(attemptRows.trim()).toBe("3");
      const distinctProviders = psql(
        `SELECT count(DISTINCT provider_request_id) FROM billing.ai_usage_ledger WHERE reservation_id='${resId}' AND attempt_index >= 1`,
      );
      expect(distinctProviders.trim()).toBe("3");
      const totalRows = psql(
        `SELECT count(*) FROM billing.ai_usage_ledger WHERE reservation_id='${resId}'`,
      );
      expect(totalRows.trim()).toBe("4");
    }, 120000);

    it("is idempotent on attempt_idempotency_key replay", () => {
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a2", "corr-prov-res-2");
      const first = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-replay','k-replay')->>'attempt_index')`,
      );
      const replay = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-replay','k-replay')->>'attempt_index')`,
      );
      expect(replay).toBe(first);
      const attemptRows = psql(
        `SELECT count(*) FROM billing.ai_usage_ledger WHERE reservation_id='${resId}' AND attempt_index >= 1`,
      );
      expect(attemptRows.trim()).toBe("1");
    }, 120000);

    it("rejects a provider_request_id already bound to another reservation", () => {
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a3", "corr-prov-res-3");
      tx(
        SERVICE,
        `SELECT billing.register_provider_attempt('${resId}','openai','prov-conflict',NULL)`,
      );
      const other = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a4", "corr-prov-res-4");
      const conflict = txAllowFail(
        SERVICE,
        `SELECT billing.register_provider_attempt('${other}','openai','prov-conflict',NULL)`,
      );
      expect(conflict.ok).toBe(false);
    }, 120000);

    it("allocates distinct attempt indices under concurrency", () => {
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a5", "corr-prov-res-5");
      return psqlConcurrent([
        `BEGIN; ${SERVICE} SELECT billing.register_provider_attempt('${resId}','openai','prov-conc-1',NULL); COMMIT;`,
        `BEGIN; ${SERVICE} SELECT billing.register_provider_attempt('${resId}','openai','prov-conc-2',NULL); COMMIT;`,
      ]).then((res) => {
        expect(countOk(res)).toBe(2);
        const distinctIdx = psql(
          `SELECT count(DISTINCT attempt_index) FROM billing.ai_usage_ledger WHERE reservation_id='${resId}' AND attempt_index >= 1`,
        );
        expect(distinctIdx.trim()).toBe("2");
      });
    }, 120000);

    it("finalizes attempt states with fail-closed transitions", () => {
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a6", "corr-prov-res-6");
      const idx = tx(
        SERVICE,
        `SELECT (billing.register_provider_attempt('${resId}','openai','prov-final',NULL)->>'attempt_index')`,
      );
      const done = tx(
        SERVICE,
        `SELECT (billing.finalize_provider_attempt('${resId}',${idx},'succeeded',10,20,1000)->>'attempt_status')`,
      );
      expect(done).toBe("succeeded");

      // Idempotent replay to the same terminal status.
      const replay = tx(
        SERVICE,
        `SELECT (billing.finalize_provider_attempt('${resId}',${idx},'succeeded',10,20,1000)->>'idempotent_replay')`,
      );
      expect(replay).toBe("true");

      // Invalid terminal-to-different-terminal transition fails closed.
      const invalid = txAllowFail(
        SERVICE,
        `SELECT billing.finalize_provider_attempt('${resId}',${idx},'failed',0,0,0)`,
      );
      expect(invalid.ok).toBe(false);
    }, 120000);

    it("refuses to release a reservation once a provider attempt began", () => {
      const resId = reserve(USER_PROV, "aaaa0000-0000-0000-0000-0000000000a7", "corr-prov-res-7");
      tx(SERVICE, `SELECT billing.register_provider_attempt('${resId}','openai','prov-rel',NULL)`);
      const rel = txAllowFail(SERVICE, `SELECT billing.release_ai_quota('${resId}','rel-idem-1')`);
      expect(rel.ok).toBe(false);
    }, 120000);
  });

  // -------------------------------------------------------------------------
  // B. Versioned admin-grant AI quota policy.
  // -------------------------------------------------------------------------
  describe("B. versioned admin-grant policy", () => {
    function policyVersionId(version: number): string {
      return psql(
        `SELECT id FROM billing.admin_grant_policy_versions WHERE policy_key='admin_learner_grant' AND version_number=${version}`,
      ).trim();
    }

    function seedCouponAndRedeem(userId: string, code: string, idem: string) {
      psql(`DELETE FROM billing.admin_access_grants WHERE user_id='${userId}'`);
      psql(`DELETE FROM billing.admin_user_grant_state WHERE user_id='${userId}'`);
      psql(`DELETE FROM billing.admin_access_coupons WHERE code_hash='${code}'`);
      psql(`INSERT INTO billing.admin_access_coupons
        (code_hash, intended_user_id, created_by_admin_id, reason, status, idempotency_key)
        VALUES ('${code}', '${userId}', '${ADMIN_ID}', 'policy version test', 'active', 'create-${code}')`);
      return tx(
        authClaims(userId),
        `SELECT (billing.redeem_admin_access_coupon('${code}','${idem}')->>'policy_version_id')`,
      );
    }

    it("seeds exactly one published v1 (quota 500, duration 72)", () => {
      const row = psql(
        `SELECT ai_assistant_quota_limit || ':' || grant_duration_hours || ':' || status FROM billing.admin_grant_policy_versions WHERE policy_key='admin_learner_grant' AND version_number=1`,
      );
      expect(row.trim()).toBe("500:72:published");
      const resolved = tx(
        SERVICE,
        `SELECT (billing.resolve_admin_grant_policy(now())).version_number`,
      );
      expect(resolved).toBe("1");
    }, 120000);

    it("stores the resolved policy_version_id on redemption and resolves its quota", () => {
      const v1 = policyVersionId(1);
      const stored = seedCouponAndRedeem(USER_POLICY_A, "policy-code-a", "redeem-a");
      expect(stored).toBe(v1);
      const limit = tx(SERVICE, `SELECT billing.resolve_ai_assistant_limit('${USER_POLICY_A}')`);
      expect(limit).toBe("500");
    }, 120000);

    it("publishing a newer version changes future resolution but retains history", () => {
      const v1 = policyVersionId(1);
      // Publish v2 with a different quota via service role.
      const pub = tx(
        SERVICE,
        `SELECT (billing.publish_admin_grant_policy_version(999, 72, 'admin_learner_grant', now())->>'version_number')`,
      );
      expect(pub).toBe("2");

      // Current resolution is v2; a historical timestamp still resolves v1.
      const nowVersion = tx(
        SERVICE,
        `SELECT (billing.resolve_admin_grant_policy(now())).version_number`,
      );
      expect(nowVersion).toBe("2");
      const pastVersion = tx(
        SERVICE,
        `SELECT (billing.resolve_admin_grant_policy(now() - interval '1000 years')).version_number`,
      );
      expect(pastVersion).toBe("1");

      // The pre-existing grant retains the v1 snapshot (limit stays 500).
      const retained = tx(SERVICE, `SELECT billing.resolve_ai_assistant_limit('${USER_POLICY_A}')`);
      expect(retained).toBe("500");
      expect(
        psql(
          `SELECT policy_version_id FROM billing.admin_user_grant_state WHERE user_id='${USER_POLICY_A}'`,
        ).trim(),
      ).toBe(v1);

      // A new redemption snapshots v2 and resolves the new quota.
      const v2 = policyVersionId(2);
      const stored = seedCouponAndRedeem(USER_POLICY_B, "policy-code-b", "redeem-b");
      expect(stored).toBe(v2);
      const newLimit = tx(SERVICE, `SELECT billing.resolve_ai_assistant_limit('${USER_POLICY_B}')`);
      expect(newLimit).toBe("999");
    }, 120000);

    it("fails closed when the policy is unavailable or ambiguous", () => {
      const unavailable = txAllowFail(
        SERVICE,
        `SELECT billing.resolve_admin_grant_policy(now() - interval '2000 years')`,
      );
      expect(unavailable.ok).toBe(false);
      expect(unavailable.out).toContain("ADMIN_GRANT_POLICY_UNAVAILABLE");

      // Force ambiguity by inserting a second overlapping published row directly.
      psql(`INSERT INTO billing.admin_grant_policy_versions
        (policy_key, version_number, status, effective_from, effective_to, ai_assistant_quota_limit, grant_duration_hours, published_at)
        VALUES ('admin_learner_grant', 9999, 'published', now() - interval '1 day', NULL, 123, 72, now())`);
      const ambiguous = txAllowFail(SERVICE, `SELECT billing.resolve_admin_grant_policy(now())`);
      expect(ambiguous.ok).toBe(false);
      expect(ambiguous.out).toContain("ADMIN_GRANT_POLICY_AMBIGUOUS");
      psql(
        `DELETE FROM billing.admin_grant_policy_versions WHERE policy_key='admin_learner_grant' AND version_number=9999`,
      );
    }, 120000);

    it("a paid plan still resolves the plan quota, not the admin-grant quota", () => {
      seedPaidSubscription(USER_POLICY_PAID, "corr_paid", 97, 272);
      const limit = tx(SERVICE, `SELECT billing.resolve_ai_assistant_limit('${USER_POLICY_PAID}')`);
      expect(limit).toBe("272");
    }, 120000);
  });

  // -------------------------------------------------------------------------
  // C. Real creator-admin identity on coupon creation.
  // -------------------------------------------------------------------------
  describe("C. create_admin_access_coupon identity", () => {
    beforeAll(() => {
      // has_role needs a public.user_roles row, which FKs auth.users.
      psqlAllowFail(
        `INSERT INTO auth.users (id, instance_id, aud, role, email)
         VALUES ('${ADMIN_REAL}', '${ZERO_UUID}', 'authenticated', 'authenticated', 'corr-admin@test.local')
         ON CONFLICT (id) DO NOTHING`,
      );
      psqlAllowFail(
        `INSERT INTO public.user_roles (user_id, role) VALUES ('${ADMIN_REAL}', 'admin'::public.app_role)
         ON CONFLICT (user_id, role) DO NOTHING`,
      );
    });

    it("lets a real admin JWT create a coupon attributed to auth.uid()", () => {
      psql(`DELETE FROM billing.admin_access_coupons WHERE code_hash='ident-code-1'`);
      const couponId = tx(
        authClaims(ADMIN_REAL),
        `SELECT (billing.create_admin_access_coupon('${USER_TARGET}','identity test','ident-code-1','ident-idem-1')->>'coupon_id')`,
      );
      expect(couponId).toMatch(/^[0-9a-f-]{36}$/);
      const createdBy = psql(
        `SELECT created_by_admin_id FROM billing.admin_access_coupons WHERE code_hash='ident-code-1'`,
      );
      expect(createdBy.trim()).toBe(ADMIN_REAL);
    }, 120000);

    it("rejects a non-admin authenticated caller", () => {
      const res = txAllowFail(
        authClaims(NON_ADMIN),
        `SELECT billing.create_admin_access_coupon('${USER_TARGET}','x','ident-code-2','ident-idem-2')`,
      );
      expect(res.ok).toBe(false);
      expect(res.out).toContain("ADMIN_COUPON_FORBIDDEN");
    }, 120000);

    it("rejects a bare service_role token without a subject", () => {
      const res = txAllowFail(
        SERVICE,
        `SELECT billing.create_admin_access_coupon('${USER_TARGET}','x','ident-code-3','ident-idem-3')`,
      );
      expect(res.ok).toBe(false);
      expect(res.out).toContain("ADMIN_COUPON_UNAUTHENTICATED");
    }, 120000);
  });

  // -------------------------------------------------------------------------
  // D. Distinct coupons per user serialize and stack cumulatively.
  // -------------------------------------------------------------------------
  describe("D. distinct coupon concurrency", () => {
    it("redeems two distinct coupons concurrently to a single canonical +144h state", () => {
      psql(`DELETE FROM billing.admin_access_grants WHERE user_id='${USER_DISTINCT}'`);
      psql(`DELETE FROM billing.admin_user_grant_state WHERE user_id='${USER_DISTINCT}'`);
      psql(
        `DELETE FROM billing.admin_access_coupons WHERE code_hash IN ('dist-code-1','dist-code-2')`,
      );
      psql(`INSERT INTO billing.admin_access_coupons
        (code_hash, intended_user_id, created_by_admin_id, reason, status, idempotency_key)
        VALUES
          ('dist-code-1', '${USER_DISTINCT}', '${ADMIN_ID}', 'distinct 1', 'active', 'create-dist-1'),
          ('dist-code-2', '${USER_DISTINCT}', '${ADMIN_ID}', 'distinct 2', 'active', 'create-dist-2')`);

      const redeem = (code: string, idem: string) =>
        `BEGIN; ${authClaims(USER_DISTINCT)} SELECT billing.redeem_admin_access_coupon('${code}','${idem}'); COMMIT;`;

      return psqlConcurrent([
        redeem("dist-code-1", "dist-redeem-1"),
        redeem("dist-code-2", "dist-redeem-2"),
      ]).then((res) => {
        expect(countOk(res)).toBe(2);

        const redeemed = psql(
          `SELECT count(*) FROM billing.admin_access_coupons WHERE code_hash IN ('dist-code-1','dist-code-2') AND status='redeemed'`,
        );
        expect(redeemed.trim()).toBe("2");

        // Exactly one canonical state row, stacked to ~now + 144h.
        const stateRows = psql(
          `SELECT count(*) FROM billing.admin_user_grant_state WHERE user_id='${USER_DISTINCT}'`,
        );
        expect(stateRows.trim()).toBe("1");
        const hours = Number(
          psql(
            `SELECT EXTRACT(EPOCH FROM (expires_at - now()))/3600 FROM billing.admin_user_grant_state WHERE user_id='${USER_DISTINCT}'`,
          ),
        );
        expect(hours).toBeGreaterThan(143);
        expect(hours).toBeLessThanOrEqual(144.5);

        // Only the newest history grant remains active.
        const activeGrants = psql(
          `SELECT count(*) FROM billing.admin_access_grants WHERE user_id='${USER_DISTINCT}' AND status='active'`,
        );
        expect(activeGrants.trim()).toBe("1");
      });
    }, 120000);
  });
});
