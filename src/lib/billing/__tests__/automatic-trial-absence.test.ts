import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function readRepoFile(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

// Only scan the billing surface: billing migrations + the billing types. This
// deliberately ignores historical docs elsewhere in the repo.
function billingMigrationFiles(): string[] {
  const dir = path.join(REPO_ROOT, "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && f.includes("billing"))
    .sort();
}

const TYPES_FILE = "src/lib/billing/types/index.ts";
const V3_MIGRATION = "supabase/migrations/20260722180000_billing_launch_closure_contracts_v3.sql";

describe("automatic 14-day trial is abolished (static scans)", () => {
  it("free plan TS defaults do not seed a 14-day / 24-quota trial", () => {
    const src = readRepoFile(TYPES_FILE);
    const freeBlock = src.slice(src.indexOf("free: {"), src.indexOf("pro: {"));
    expect(freeBlock).toContain("assistantRuntimePeriodDays: null");
    expect(freeBlock).not.toMatch(/assistantRuntimePeriodDays:\s*14\b/);
    expect(freeBlock).not.toMatch(/assistantRuntimePeriodQuota:\s*24\b/);
  });

  it("V3 migration carries the abolition guard and markers", () => {
    const sql = readRepoFile(V3_MIGRATION);
    expect(sql).toContain("assert_no_automatic_trial");
    expect(sql).toContain("AUTOMATIC_TRIAL_FORBIDDEN");
    expect(sql).toContain("'automatic_trial', false");
  });

  it("no billing migration enables an automatic trial flag", () => {
    for (const file of billingMigrationFiles()) {
      const sql = readFileSync(path.join(REPO_ROOT, "supabase/migrations", file), "utf8");
      expect(sql, file).not.toMatch(/'automatic_trial',\s*true/);
      expect(sql, file).not.toMatch(/"automatic_trial":\s*true/);
    }
  });

  it("V3 seeds the free policy with a NULL trial window", () => {
    const sql = readRepoFile(V3_MIGRATION);
    const freeSeed = sql.slice(
      sql.indexOf("('free', 1, 'published'"),
      sql.indexOf("('pro', 1, 'published'"),
    );
    expect(freeSeed.length).toBeGreaterThan(0);
    // period quota 0 and period days NULL (no automatic full-access window).
    expect(freeSeed).toMatch(/0,\s*0,\s*0,\s*NULL/);
  });
});
