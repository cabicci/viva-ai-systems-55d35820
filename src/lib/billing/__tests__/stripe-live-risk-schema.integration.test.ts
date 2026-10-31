import { billingSchemaReadSsl } from "../../../test/billing-schema-ssl";
import { describe, expect, it } from "vitest";
import postgres from "postgres";

// Restricted project database connection: schema-only reads, no secret output.
const enabled = Boolean(process.env.PGHOST);
describe.skipIf(!enabled)("Applied Live risk-hold database contract", () => {
  it("exposes both RPCs only to the server role", async () => {
    const db = postgres({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: billingSchemaReadSsl(process.env),
      max: 1,
    });
    try {
      const rows = await db`SELECT p.proname,
        has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
        has_function_privilege('authenticated',p.oid,'EXECUTE') AS client,
        has_function_privilege('service_role',p.oid,'EXECUTE') AS server
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.proname IN ('apply_stripe_live_risk_hold','get_stripe_live_risk_hold')`;
      expect(rows).toHaveLength(2);
      for (const row of rows)
        expect([row.anon, row.client, row.server]).toEqual([false, false, true]);
    } finally {
      await db.end();
    }
  });
  it("guards all six paid-access/binding tables and hold evidence", async () => {
    const db = postgres({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: billingSchemaReadSsl(process.env),
      max: 1,
    });
    try {
      const rows = await db`SELECT c.relname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
        WHERE NOT t.tgisinternal AND t.tgname IN ('zz_live_risk_guard','zz_live_risk_evidence_guard')`;
      expect(rows.map((r) => r.relname).sort()).toEqual(
        [
          "academic_stripe_subscriptions",
          "gateway_customers",
          "gateway_subscriptions",
          "kids_family_entitlements",
          "kids_stripe_subscriptions",
          "subscriptions",
          "technical_stripe_subscriptions",
          "webhook_events",
        ].sort(),
      );
    } finally {
      await db.end();
    }
  });
});
