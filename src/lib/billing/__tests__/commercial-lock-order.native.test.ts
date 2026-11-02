// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { requireDisposableTarget } from "../../../../scripts/billing/prepare-disposable-prerequisites";

const read = (file: string) => readFileSync(file, "utf8").replaceAll("\r\n", "\n");
const source = read("drizzle/migrations/0027_commercial_policy_20261102.sql");
const start = source.indexOf("CREATE FUNCTION billing.commercial_lock(");
const end = source.indexOf("--> statement-breakpoint", start);
if (start < 0 || end <= start) throw new Error("Original commercial lock source is missing");
const original = source.slice(start, end).trim();
const repair = read("drizzle/migrations/0033_commercial_family_lock_order.sql");
const familyCall = "PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,751603));";
const legacyPrefixes = [
  "account-lifecycle:",
  "stripe-checkout:",
  "live-risk-user:",
  "commercial-account:",
];
const metadata = `SELECT pg_get_functiondef(p.oid) AS definition,md5(pg_get_functiondef(p.oid)) AS digest,
 p.oid::text AS oid,p.proowner::text AS owner,p.proacl::text AS acl,p.proconfig::text AS config,p.prosecdef AS definer
 FROM pg_proc p WHERE p.oid='billing.commercial_lock(uuid)'::regprocedure`;
type Metadata = {
  definition: string;
  digest: string;
  oid: string;
  owner: string;
  acl: string | null;
  config: string;
  definer: boolean;
};
const preserved = ({ definition: _definition, digest: _digest, ...rest }: Metadata) => rest;

async function isolated() {
  const db = new PGlite();
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA billing;",
  );
  await db.exec(original);
  await db.exec(
    "REVOKE ALL ON FUNCTION billing.commercial_lock(uuid) FROM PUBLIC,anon,authenticated,service_role",
  );
  return db;
}

describe("guarded family-first commercial lock repair, isolated SQL", () => {
  it("preserves all original locks, owner, security settings and ACL", async () => {
    const db = await isolated();
    try {
      const before = (await db.query<Metadata>(metadata)).rows[0];
      expect(before.digest).toBe("b8977340d404b1178c6d4a8daa047af2");
      await db.exec(repair);
      const after = (await db.query<Metadata>(metadata)).rows[0];
      expect(after.digest).toBe("7b5513a541129182dbe44058b0cc314c");
      expect(preserved(after)).toEqual(preserved(before));
      expect(after.definition.indexOf(familyCall)).toBeGreaterThan(0);
      let previous = after.definition.indexOf(familyCall);
      for (const prefix of legacyPrefixes) {
        const position = after.definition.indexOf(`hashtextextended('${prefix}'`);
        expect(position).toBeGreaterThan(previous);
        previous = position;
      }
    } finally {
      await db.close();
    }
  });

  it("rejects a changed prior function without replacing it", async () => {
    const db = await isolated();
    try {
      await db.exec(
        original
          .replace("CREATE FUNCTION", "CREATE OR REPLACE FUNCTION")
          .replace("-- Same lifecycle/checkout", "-- Different reviewed source lifecycle/checkout"),
      );
      const before = (await db.query<Metadata>(metadata)).rows[0];
      await expect(db.exec(repair)).rejects.toThrow("COMMERCIAL_LOCK_PRECONDITION_CHANGED");
      expect((await db.query<Metadata>(metadata)).rows[0]).toEqual(before);
    } finally {
      await db.close();
    }
  });

  it("rolls the function replacement back with a later transaction failure", async () => {
    const db = await isolated();
    try {
      const before = (await db.query<Metadata>(metadata)).rows[0];
      await expect(
        db.exec(
          `BEGIN;\n${repair}\nDO $$BEGIN RAISE EXCEPTION 'TEST_LATE_FAILURE'; END$$;\nCOMMIT;`,
        ),
      ).rejects.toThrow("TEST_LATE_FAILURE");
      await db.exec("ROLLBACK");
      expect((await db.query<Metadata>(metadata)).rows[0]).toEqual(before);
    } finally {
      await db.close();
    }
  });
});

type AdvisoryLock = { key: string; granted: boolean };
type Witness = {
  family: string;
  lifecycle: string;
  required: string[];
  waiting: AdvisoryLock[];
  acquired: string[];
  lifecycleAvailable: boolean;
};
const enabled = process.env.COMMERCIAL_LOCK_NATIVE === "1";

describe.skipIf(!enabled)(
  "commercial lock order, two real disposable PostgreSQL connections",
  () => {
    it("reproduces the old inversion and makes the repaired writer wait on family before lifecycle", async () => {
      // Validate BEFORE any connection. No DATABASE_URL/.env/remote fallback.
      requireDisposableTarget(process.env);
      const connect = (name: string) =>
        postgres({
          host: "127.0.0.1",
          port: 54322,
          database: "postgres",
          username: "postgres",
          password: process.env.PGPASSWORD,
          ssl: false,
          max: 1,
          idle_timeout: 0,
          connect_timeout: 5,
          connection: { application_name: name },
          onnotice: () => {},
        });
      const holder = connect("commercial-lock-regression-holder");
      const waiter = connect("commercial-lock-regression-waiter");
      let previous: Metadata | null = null;
      let installed = false;
      try {
        await holder.unsafe("SET statement_timeout='10s'; SET lock_timeout='5s'");
        await waiter.unsafe("SET statement_timeout='10s'; SET lock_timeout='5s'");
        const existing = await holder<
          { present: boolean }[]
        >`SELECT to_regprocedure('billing.commercial_lock(uuid)') IS NOT NULL AS present`;
        if (existing[0].present) previous = (await holder.unsafe<Metadata[]>(metadata))[0];
        await holder.unsafe(original.replace("CREATE FUNCTION", "CREATE OR REPLACE FUNCTION"));
        installed = true;
        if (!previous)
          await holder.unsafe(
            "REVOKE ALL ON FUNCTION billing.commercial_lock(uuid) FROM PUBLIC,anon,authenticated,service_role",
          );
        const before = (await holder.unsafe<Metadata[]>(metadata))[0];
        expect(before.digest).toBe("b8977340d404b1178c6d4a8daa047af2");
        expect(
          (
            await holder`SELECT to_regprocedure('billing.account_deletion_blocked(uuid)') IS NOT NULL AS ready`
          )[0].ready,
        ).toBe(true);
        const waiterPid = Number((await waiter`SELECT pg_backend_pid() AS pid`)[0].pid);
        const user = randomUUID(); // Lock identity only: never inserted into auth/learner tables.
        const keys = await holder<{ label: string; key: string }[]>`
        SELECT label,((k>>32)&4294967295)::text||':'||(k&4294967295)::text AS key FROM (
          SELECT 'family' AS label,hashtextextended(${user}::text,751603) AS k
          UNION ALL SELECT 'account-lifecycle:',hashtextextended('account-lifecycle:'||${user}::text,0)
          UNION ALL SELECT 'stripe-checkout:',hashtextextended('stripe-checkout:'||${user}::text,0)
          UNION ALL SELECT 'live-risk-user:',hashtextextended('live-risk-user:'||${user}::text,0)
          UNION ALL SELECT 'commercial-account:',hashtextextended('commercial-account:'||${user}::text,0)
        ) k`;
        const family = keys.find((row) => row.label === "family")!.key;
        const lifecycle = keys.find((row) => row.label === "account-lifecycle:")!.key;
        const required = keys.map((row) => row.key).sort();
        expect(new Set(required).size).toBe(5);

        async function witness(): Promise<Witness> {
          let waiting: AdvisoryLock[] = [];
          let lifecycleAvailable = false;
          let finish:
            | Promise<{ ok: true; acquired: string[] } | { ok: false; error: unknown }>
            | undefined;
          try {
            await holder.begin(async (tx) => {
              await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user}::text,751603))`;
              finish = waiter
                .begin(async (worker) => {
                  await worker`SELECT billing.commercial_lock(${user}::uuid)`;
                  // Exact installed reader that exposed the original inversion.
                  await worker`SELECT billing.account_deletion_blocked(${user}::uuid)`;
                  const owned = await worker<
                    AdvisoryLock[]
                  >`SELECT classid::text||':'||objid::text AS key,granted FROM pg_locks
                WHERE pid=pg_backend_pid() AND locktype='advisory' AND objsubid=1`;
                  expect(owned.every((row) => row.granted)).toBe(true);
                  return owned.map((row) => row.key).sort();
                })
                .then(
                  (acquired) => ({ ok: true as const, acquired }),
                  (error) => ({ ok: false as const, error }),
                );
              const deadline = Date.now() + 4000;
              while (Date.now() < deadline) {
                waiting = await tx<
                  AdvisoryLock[]
                >`SELECT classid::text||':'||objid::text AS key,granted FROM pg_locks
                WHERE pid=${waiterPid} AND locktype='advisory' AND objsubid=1`;
                if (waiting.some((row) => row.key === family && !row.granted)) break;
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
              expect(waiting.some((row) => row.key === family && !row.granted)).toBe(true);
              lifecycleAvailable = (
                await tx<
                  { available: boolean }[]
                >`SELECT pg_try_advisory_xact_lock(hashtextextended('account-lifecycle:'||${user}::text,0)) AS available`
              )[0].available;
              if (lifecycleAvailable)
                await tx`SELECT billing.account_deletion_blocked(${user}::uuid)`;
              // Committing releases the holder's family/lifecycle locks so the
              // waiting writer finishes; no timeout/deadlock timing decides success.
            });
          } finally {
            // Consume the writer outcome even if a lock-state assertion failed.
            if (finish) await finish;
          }
          if (!finish) throw new Error("Writer never started");
          const outcome = await finish;
          if (!outcome.ok) throw outcome.error;
          return {
            family,
            lifecycle,
            required,
            waiting,
            acquired: outcome.acquired,
            lifecycleAvailable,
          };
        }

        const inverted = await witness();
        expect(inverted.lifecycleAvailable).toBe(false);
        expect(
          inverted.waiting
            .filter((row) => row.granted)
            .map((row) => row.key)
            .sort(),
        ).toEqual(required.filter((key) => key !== family));
        expect(inverted.acquired).toEqual(required);
        await holder.unsafe(repair); // The actual guarded forward artifact, unmodified.
        const after = (await holder.unsafe<Metadata[]>(metadata))[0];
        expect(preserved(after)).toEqual(preserved(before));
        expect(after.digest).toBe("7b5513a541129182dbe44058b0cc314c");
        const fixed = await witness();
        expect(fixed.waiting).toEqual([{ key: family, granted: false }]);
        expect(fixed.lifecycleAvailable).toBe(true);
        expect(fixed.acquired).toEqual(required);
        expect(
          (
            await waiter`SELECT count(*)::int AS n FROM pg_locks WHERE pid=pg_backend_pid() AND locktype='advisory'`
          )[0].n,
        ).toBe(0);
      } finally {
        try {
          if (installed) {
            if (previous) await holder.unsafe(previous.definition);
            else await holder.unsafe("DROP FUNCTION billing.commercial_lock(uuid)");
          }
        } finally {
          await Promise.all([holder.end({ timeout: 1 }), waiter.end({ timeout: 1 })]);
        }
      }
    }, 30000);
  },
);
