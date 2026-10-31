// @vitest-environment node
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { academicFixturePrices, disposablePrerequisiteSources, prepareDisposablePrerequisites, requireDisposableTarget } from "./prepare-disposable-prerequisites";
import { PGlite } from "@electric-sql/pglite";
import { APPROVED_PRICES_MINOR } from "../../src/lib/billing/catalogue/prices";

const root = path.resolve(import.meta.dirname, "../..");
const local = { BILLING_DISPOSABLE_DB: "1", PGHOST: "127.0.0.1", PGPORT: "54322", PGDATABASE: "postgres", PGUSER: "postgres" };
describe("billing disposable prerequisites", () => {
  it("keeps the actual Academic availability guard closed while planning synthetic catalogue rows", async () => {
    const db = new PGlite();
    try {
      await db.exec(`CREATE SCHEMA billing; CREATE TABLE public.academic_courses(enabled boolean); INSERT INTO public.academic_courses VALUES(false);
        CREATE FUNCTION billing.commerce_price(p_package text,p_market text,p_interval text,p_offer uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $$
        DECLARE v_currency text; BEGIN v_currency:='EGP'; RETURN '{}'::jsonb; END $$;`);
      const migration = readFileSync(path.join(root, "supabase/migrations/20261006113000_academic_mail_retention.sql"), "utf8");
      const guard = migration.slice(migration.indexOf("DO $$ DECLARE d text; BEGIN\n d:=pg_get_functiondef('billing.commerce_price"), migration.indexOf("-- Preserve every existing offer catalogue"));
      expect(guard).toContain("ACADEMIC_UNAVAILABLE");
      await db.exec(guard);
      await expect(db.query("select billing.commerce_price('academic','EG','month')")).rejects.toThrow("ACADEMIC_UNAVAILABLE");
      const core = [{ id: "fixture", plan_key: "pro_plus", market_code: "EG", billing_interval: "month", amount_minor: APPROVED_PRICES_MINOR.EG.pro_plus.month }];
      expect(academicFixturePrices(core, "EG", "month", { sales_enabled: false, runtime_enabled: false, eg_month_minor: 5000 }))
        .toEqual({ base: 30900, addon: 35900 });
      expect((await db.query<{ enabled: boolean }>("select enabled from public.academic_courses")).rows).toEqual([{ enabled: false }]);
      await expect(db.query("select billing.commerce_price('academic','EG','month')")).rejects.toThrow("ACADEMIC_UNAVAILABLE");
    } finally { await db.close(); }
  });
  it.each([
    ["EG", "month", 5000, 35900], ["EG", "year", 60000, 369000],
    ["INTL", "month", 100, 1399], ["INTL", "year", 1200, 14190],
  ] as const)("derives %s/%s fixture prices from the approved base while sales stay off", (market, interval, extra, total) => {
    const core = [{ id: "fixture", plan_key: "pro_plus", market_code: market, billing_interval: interval,
      amount_minor: APPROVED_PRICES_MINOR[market].pro_plus[interval] }];
    expect(academicFixturePrices(core, market, interval, { sales_enabled: false, runtime_enabled: false,
      [`${market === "EG" ? "eg" : "usd"}_${interval}_minor`]: extra })).toEqual({ base: core[0].amount_minor, addon: total });
  });
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
