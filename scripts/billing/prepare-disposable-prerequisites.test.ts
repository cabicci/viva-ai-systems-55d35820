// @vitest-environment node
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { disposablePrerequisiteSources, prepareDisposablePrerequisites, requireDisposableTarget } from "./prepare-disposable-prerequisites";

const root = path.resolve(import.meta.dirname, "../..");
const local = { BILLING_DISPOSABLE_DB: "1", PGHOST: "127.0.0.1", PGPORT: "54322", PGDATABASE: "postgres", PGUSER: "postgres" };
describe("billing disposable prerequisites", () => {
  it("admits only the explicit ephemeral loopback target", () => {
    expect(() => requireDisposableTarget(local)).not.toThrow();
  });
  it.each([
    { BILLING_DISPOSABLE_DB: undefined }, { PGHOST: "localhost" }, { PGHOST: "127.0.0.1.example.invalid" },
    { PGHOST: "project.supabase.co" }, { PGPORT: "5432" }, { PGDATABASE: "another" }, { PGUSER: "another" },
    { DATABASE_URL: "postgres://override.invalid/postgres" },
  ])("rejects a changed target before source reads or a connection %j", async (override) => {
    await expect(prepareDisposablePrerequisites({ ...local, ...override }, "/deliberately-absent-sources"))
      .rejects.toThrow("Exact disposable loopback database required");
  });
  it("replays the missing installed baseline before the exact ordered18 raw billing migrations", () => {
    const sources = disposablePrerequisiteSources(root);
    expect(sources).toHaveLength(22);
    const files = sources.map((r) => r.file);
    expect(files.slice(0, 4)).toEqual([
      "scripts/email-access/email-access-candidate.sql", "docs/billing/20260920_stripe_refunds.sql",
      "scripts/academic-education/assistant-rag-candidate.sql", "scripts/academic-education/assistant-native-candidate.sql",
    ]);
    expect(files.slice(4).map((f) => Number(path.basename(f).slice(0, 4))))
      .toEqual(Array.from({ length: 18 }, (_, i) => i + 8));
    for (const source of sources) {
      expect(source.bytes.equals(readFileSync(path.join(root, source.file)))).toBe(true);
      expect(source.sha256).toBe(createHash("sha256").update(source.bytes).digest("hex"));
    }
    const supabase = readFileSync(path.join(root, "supabase/migrations/20261006112000_academic_stripe_test.sql"), "utf8");
    expect(supabase).not.toContain("includes_assistant");
    expect(sources[3].bytes.toString()).toContain("ADD COLUMN includes_assistant");
    expect(sources.find((r) => r.file.includes("0010_"))!.bytes.toString()).toContain("register_academic_assistant_stripe_price");
    expect(sources.find((r) => r.file.includes("0011_"))!.bytes.toString()).toContain("CREATE FUNCTION public.apply_stripe_live_risk_hold");
  });
});
