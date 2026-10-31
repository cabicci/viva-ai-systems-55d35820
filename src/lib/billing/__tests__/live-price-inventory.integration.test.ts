import { describe, expect, it } from "vitest";
import postgres from "postgres";

describe.skipIf(!process.env.PGHOST)("Registered Live price inventory", () => {
  it("maps all 28 visible plan/term/market/family and assistant variants with exact amounts", async (context) => {
    const db = postgres({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: "require",
      max: 1,
    });
    try {
      const [access] =
        await db`select has_schema_privilege(current_user,'billing','USAGE') as allowed`;
      if (access?.allowed !== true) {
        context.skip(); // Restricted schema-only test credentials cannot read billing rows.
        return;
      }
      const rows =
        await db`select pc.plan_key as scope,pv.billing_interval,mp.market_code,false as discounted,mp.amount_minor,gpm.gateway_price_id
        from billing.gateway_price_mappings gpm join billing.market_prices mp on mp.id=gpm.market_price_id
        join billing.plan_versions pv on pv.id=mp.plan_version_id join billing.plan_catalog pc on pc.id=pv.plan_id where gpm.stripe_environment='live'
        union all select 'kids',billing_interval,market_code,discounted,amount_minor,gateway_price_id from public.kids_stripe_prices where stripe_environment='live'
        union all select 'technical',billing_interval,market_code,false,amount_minor,gateway_price_id from billing.technical_stripe_prices where stripe_environment='live'
        union all select case when includes_assistant then 'academic_assistant' else 'academic' end,billing_interval,market_code,false,amount_minor,gateway_price_id
        from billing.academic_stripe_prices where stripe_environment='live'`;
      const amounts: Record<string, number[]> = {
        pro: [16900, 169000, 699, 6990],
        pro_plus: [30900, 309000, 1299, 12990],
        kids: [19900, 199000, 799, 7990],
        kids_discount: [17910, 179100, 719, 7191],
        academic: [30900, 309000, 1299, 12990],
        academic_assistant: [35900, 369000, 1399, 14190],
        technical: [30900, 309000, 1299, 12990],
      };
      expect(rows).toHaveLength(28);
      expect(new Set(rows.map((row) => row.gateway_price_id)).size).toBe(28);
      for (const [scope, expected] of Object.entries(amounts)) {
        const keys = [
          ["EG", "month"],
          ["EG", "year"],
          ["INTL", "month"],
          ["INTL", "year"],
        ];
        for (const [index, [market, interval]] of keys.entries()) {
          const matches = rows.filter(
            (row) =>
              row.scope === (scope === "kids_discount" ? "kids" : scope) &&
              row.discounted === (scope === "kids_discount") &&
              row.market_code === market &&
              row.billing_interval === interval,
          );
          expect(matches).toHaveLength(1);
          expect(Number(matches[0]?.amount_minor)).toBe(expected[index]);
          expect(matches[0]?.gateway_price_id).toMatch(/^price_/);
        }
      }
    } finally {
      await db.end();
    }
  });
});
