import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function readAllMigrations(): string {
  const dir = path.join(REPO_ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

const FIX_MIGRATION = "supabase/migrations/20260710153000_billing_service_role_auth_fix.sql";

const SERVICE_ONLY_RPCS = [
  "billing.evaluate_access",
  "billing.reserve_ai_quota",
  "billing.commit_ai_quota",
  "billing.release_ai_quota",
  "billing.apply_subscription_event",
  "billing.grant_monetary_credit",
  "billing.grant_ai_credit",
] as const;

const AUTH_OR_SERVICE_RPCS = [
  "billing.get_entitlement_snapshot",
  "billing.cancel_at_period_end",
] as const;

describe("billing service-role RPC authorization", () => {
  const fixSql = readRepoFile(FIX_MIGRATION);
  const allMigrations = readAllMigrations();

  it("uses auth.jwt() role semantics for service-role gates", () => {
    expect(fixSql).toContain("auth.jwt() ->> 'role'");
    expect(fixSql).not.toMatch(/current_setting\('request\.jwt\.claim\.role'/);
    expect(fixSql).toContain("CREATE OR REPLACE FUNCTION billing.get_entitlement_snapshot");
    expect(readdirSync(path.join(REPO_ROOT, "supabase/migrations"))).toContain(
      "20260710153000_billing_service_role_auth_fix.sql",
    );
  });

  it("defines internal helpers without PUBLIC EXECUTE", () => {
    expect(fixSql).toContain("CREATE OR REPLACE FUNCTION billing.jwt_role()");
    expect(fixSql).toContain("CREATE OR REPLACE FUNCTION billing.is_service_role_caller()");
    expect(fixSql).toMatch(/REVOKE ALL ON FUNCTION billing\.jwt_role\(\) FROM PUBLIC/);
    expect(fixSql).toMatch(
      /REVOKE ALL ON FUNCTION billing\.is_service_role_caller\(\) FROM PUBLIC/,
    );
    expect(fixSql).not.toMatch(/GRANT EXECUTE ON FUNCTION billing\.jwt_role\(\)/);
    expect(fixSql).not.toMatch(/GRANT EXECUTE ON FUNCTION billing\.is_service_role_caller\(\)/);
  });

  it("keeps hardened search_path on billing RPCs", () => {
    for (const fn of [...SERVICE_ONLY_RPCS, ...AUTH_OR_SERVICE_RPCS]) {
      const pattern = new RegExp(
        `CREATE OR REPLACE FUNCTION ${fn.replace(".", "\\.")}[\\s\\S]*?SET search_path = billing, public, pg_temp`,
      );
      expect(fixSql).toMatch(pattern);
    }
  });

  it("keeps SECURITY DEFINER on billing RPCs", () => {
    for (const fn of [...SERVICE_ONLY_RPCS, ...AUTH_OR_SERVICE_RPCS]) {
      const pattern = new RegExp(
        `CREATE OR REPLACE FUNCTION ${fn.replace(".", "\\.")}[\\s\\S]*?SECURITY DEFINER`,
      );
      expect(fixSql).toMatch(pattern);
    }
  });

  it("requires service_role for service-only RPC gates", () => {
    for (const fn of SERVICE_ONLY_RPCS) {
      const pattern = new RegExp(
        `CREATE OR REPLACE FUNCTION ${fn.replace(".", "\\.")}[\\s\\S]*?IF NOT billing\\.is_service_role_caller\\(\\) THEN`,
      );
      expect(fixSql).toMatch(pattern);
    }
  });

  it("permits service_role for anonymous-caller entitlement reads", () => {
    expect(fixSql).toMatch(
      /billing\.get_entitlement_snapshot[\s\S]*IF v_caller IS NULL AND NOT billing\.is_service_role_caller\(\) THEN/,
    );
  });

  it("denies cross-user entitlement reads for authenticated callers", () => {
    expect(fixSql).toMatch(/v_caller IS NOT NULL AND v_caller IS DISTINCT FROM p_user_id/);
    expect(fixSql).toContain("ENTITLEMENT_FORBIDDEN");
  });

  it("revokes PUBLIC EXECUTE and grants minimum roles", () => {
    expect(fixSql).toMatch(
      /REVOKE ALL ON FUNCTION billing\.get_entitlement_snapshot\(uuid\) FROM PUBLIC/,
    );
    expect(fixSql).toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.get_entitlement_snapshot\(uuid\) TO authenticated, service_role/,
    );
    expect(fixSql).toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.evaluate_access\(uuid, text, text\) TO service_role/,
    );
    expect(fixSql).not.toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.evaluate_access\(uuid, text, text\) TO authenticated/,
    );
    expect(fixSql).not.toMatch(
      /GRANT EXECUTE ON FUNCTION billing\.grant_monetary_credit[\s\S]* TO authenticated/,
    );
  });

  it("does not accept client-supplied authorization override parameters", () => {
    expect(fixSql).not.toMatch(/\bp_role\b|\bp_plan\b|\bp_entitlement\b/);
    expect(fixSql).not.toMatch(/current_setting\('request\.jwt\.claims'/);
  });
});
