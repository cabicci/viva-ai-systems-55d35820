import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { disposableDbReady, psql } from "../../../../scripts/billing/disposable-db";

const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1" && disposableDbReady();
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const MIGRATION = "supabase/migrations/20260916183000_billing_pro_71_lesson_contract.sql";

describe("paid lesson contract — static", () => {
  const sql = readFileSync(path.join(REPO_ROOT, MIGRATION), "utf8");

  it("publishes the approved Pro 71 and Pro Plus 100 caps", () => {
    expect(sql).toContain("('pro'::text, 71::integer)");
    expect(sql).toContain("('pro_plus'::text, 100::integer)");
    expect(sql).toContain("'pro_builder_lesson_count'");
    expect(sql).toContain("THEN 0 ELSE 29");
    expect(sql).toContain("THEN false ELSE v_prior.builder_access END");
  });

  it("returns the exact paid plan key instead of collapsing both plans to Pro", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.get_my_billing_access_tier");
    expect(sql).toContain("RETURN COALESCE(v_plan_key, 'free')");
    expect(sql).toContain("pc.plan_key IN ('pro', 'pro_plus')");
    expect(sql).not.toMatch(/IF EXISTS[\s\S]*RETURN 'pro';/);
  });

  it("fails closed before repointing a catalogue version with billing history", () => {
    expect(sql).toContain("PAID_LESSON_PLAN_VERSION_ALREADY_REFERENCED");
    expect(sql).toContain("billing.payment_transactions");
    expect(sql).toContain("billing.subscriptions");
  });
});

describe.skipIf(!ENABLED)("paid lesson contract — disposable DB", () => {
  beforeAll(() => {
    expect(psql("SELECT to_regnamespace('billing') IS NOT NULL").trim()).toBe("t");
  });

  it("pins every published paid plan version to the active capped policy", () => {
    expect(
      psql(`SELECT string_agg(pc.plan_key || ':' || epv.lesson_count_cap, ',' ORDER BY pc.plan_key)
        FROM billing.plan_versions pv
        JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
        JOIN billing.entitlement_policy_versions epv ON epv.id=pv.entitlement_policy_version_id
        WHERE pv.status='published'
          AND pc.plan_key IN ('pro','pro_plus')
          AND epv.policy_key=pc.plan_key`).trim(),
    ).toBe("pro:71,pro:71,pro_plus:100,pro_plus:100");
  });
});
