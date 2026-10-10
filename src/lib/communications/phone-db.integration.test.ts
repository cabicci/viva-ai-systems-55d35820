// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  accountDeletionTestDb,
  accountDeletionSchemaSql,
} from "../__tests__/fixtures/account-deletion-db";
const migration = readFileSync(
  "supabase/migrations/20261008115718_account_phone_verification.sql",
  "utf8",
);
type TestDb = Pick<PGlite, "exec" | "query" | "close">;
let db: TestDb;
const nativeUrl = process.env.PHONE_NATIVE_DATABASE_URL;
let native: ReturnType<typeof postgres> | undefined;
let originalDeletion: string;
const rollback = readFileSync("docs/communications/phone-verification.rollback.sql", "utf8")
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const actor = randomUUID(),
  other = randomUUID(),
  serviceSid = `VA${"b".repeat(32)}`,
  verificationSid = `VE${"c".repeat(32)}`;
const phone = "+201012345678";
const call = async <T = Record<string, unknown>>(action: string, data = {}, user = actor) =>
  (
    await db.query<{ value: T }>("SELECT public.account_phone_command($1,$2,$3::jsonb) value", [
      user,
      action,
      JSON.stringify(data),
    ])
  ).rows[0].value;
async function denied(fn: () => Promise<unknown>, pattern: RegExp) {
  await db.exec("SAVEPOINT denied");
  try {
    await expect(fn()).rejects.toThrow(pattern);
  } finally {
    await db.exec("ROLLBACK TO SAVEPOINT denied; RELEASE SAVEPOINT denied");
  }
}
const reserve = (number = phone, user = actor) =>
  call<{ challengeId: string; expiresAt: string }>(
    "reserve",
    { phone: number, country: "EG", serviceSid, channel: "sms" },
    user,
  );
const enable = () =>
  db.exec(
    `UPDATE communications_private.phone_control SET enabled=true,test_users=ARRAY['${actor}'::uuid,'${other}'::uuid]`,
  );
const sent = async (user = actor, number = phone) => {
  const r = await reserve(number, user);
  await call("sent", { challengeId: r.challengeId, verificationSid }, user);
  return r;
};
beforeAll(async () => {
  if (nativeUrl) {
    const url = new URL(nativeUrl);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/phone_test")
      throw new Error("Disposable localhost phone_test database required");
    native = postgres(nativeUrl, { max: 1 });
    for (const sql of accountDeletionSchemaSql(true)) await native.unsafe(sql);
    db = {
      exec: async (sql: string) => native!.unsafe(sql),
      query: async <T>(sql: string, args: unknown[] = []) => ({
        rows: (await native!.unsafe(
          sql,
          args.map((v, i) =>
            i === 2 && typeof v === "string" ? native!.json(JSON.parse(v)) : v,
          ) as never,
        )) as unknown as T[],
      }),
      close: () => native!.end(),
    } as unknown as TestDb;
  } else db = await accountDeletionTestDb(true);
  originalDeletion = (
    await db.query<{ value: string }>(
      "SELECT pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure) value",
    )
  ).rows[0].value;
  await db.exec(migration);
}, 30000);
afterAll(async () => db?.close());
describe("account phone ownership with installed billing and LC09", () => {
  beforeEach(async () =>
    db.exec(`BEGIN;
    SELECT set_config('request.jwt.claim.role','service_role',false);
    INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${actor}','actor@example.test',now()),('${other}','other@example.test',now());`),
  );
  afterEach(async () => {
    await db.exec("ROLLBACK");
    await db.exec("RESET ROLE");
  });
  it("rolls back an unused schema and restores the exact original deletion function", async () => {
    await db.exec(rollback);
    expect(
      (
        await db.query<{ value: string }>(
          "SELECT pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure) value",
        )
      ).rows[0].value,
    ).toBe(originalDeletion);
    expect(
      (
        await db.query<{ absent: boolean }>(
          "SELECT to_regnamespace('communications_private') IS NULL absent",
        )
      ).rows[0].absent,
    ).toBe(true);
    expect(
      (
        await db.query<{ absent: boolean }>(
          "SELECT to_regprocedure('public.account_phone_command(uuid,text,jsonb)') IS NULL absent",
        )
      ).rows[0].absent,
    ).toBe(true);
  });
  it("refuses rollback once any challenge or ownership history exists", async () => {
    await enable();
    await reserve();
    await denied(() => db.exec(rollback), /PHONE_ROLLBACK_HAS_DATA/);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int n FROM communications_private.phone_challenges",
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("is off by default and pilot allowlist is required", async () => {
    expect(await call("status")).toEqual({
      enabled: false,
      channels: ["sms"],
      phone: null,
      verifiedAt: null,
    });
    await denied(() => reserve(), /PHONE_DISABLED/);
    await db.exec("UPDATE communications_private.phone_control SET enabled=true");
    await denied(() => reserve(), /PHONE_DISABLED/);
    await enable();
    expect((await call("status")).enabled).toBe(true);
  });
  it("denies direct learner, anonymous and admin verified-state writes", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await denied(() => call("checked", { approved: true }), /permission denied/);
      await denied(
        () => db.exec("SELECT * FROM communications_private.verified_phones"),
        /permission denied/,
      );
      await db.exec("RESET ROLE");
    }
    await db.exec(
      `INSERT INTO public.user_roles VALUES('${actor}','admin'); SET ROLE authenticated`,
    );
    await denied(() => call("reserve"), /permission denied/);
  });
  it("gates WhatsApp separately while sharing ownership, cooldown and budget with SMS", async () => {
    await enable();
    await denied(
      () => call("reserve", { phone, country: "EG", serviceSid, channel: "whatsapp" }),
      /PHONE_CHANNEL_UNAVAILABLE/,
    );
    await db.exec(
      "UPDATE communications_private.phone_control SET channels=ARRAY['whatsapp','sms']",
    );
    expect((await call("status")).channels).toEqual(["whatsapp", "sms"]);
    const r = await call<{ challengeId: string }>("reserve", {
      phone,
      country: "EG",
      serviceSid,
      channel: "whatsapp",
    });
    expect(
      (
        await db.query<{ channel: string }>(
          "SELECT channel FROM communications_private.phone_challenges WHERE id=$1",
          [r.challengeId],
        )
      ).rows[0].channel,
    ).toBe("whatsapp");
    await call("uncertain", { challengeId: r.challengeId });
    await denied(() => reserve(), /PHONE_COOLDOWN/);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT day_sends n FROM communications_private.phone_control",
        )
      ).rows[0].n,
    ).toBe(1);
    await denied(
      () => call("reserve", { phone, country: "EG", serviceSid, channel: "voice" }),
      /PHONE_CHANNEL_UNAVAILABLE/,
    );
  });
  it("accepts the server role, rejects claimed authenticated authority and current unconfirmed/deleted users", async () => {
    await enable();
    await db.exec("SET ROLE service_role");
    expect((await call("status")).enabled).toBe(true);
    await db.exec("SELECT set_config('request.jwt.claim.role','authenticated',false)");
    await denied(() => reserve(), /PHONE_SERVER_REQUIRED/);
    await db.exec("RESET ROLE; SELECT set_config('request.jwt.claim.role','service_role',false)");
    await db.exec(`UPDATE auth.users SET email_confirmed_at=NULL WHERE id='${actor}'`);
    await denied(() => reserve(), /EMAIL_CONFIRMATION_REQUIRED/);
    await denied(() => call("status", {}, randomUUID()), /PHONE_ACCOUNT_UNAVAILABLE/);
  });
  it("reserves before sending, refuses parallel duplicate or wrong account access, and bounds guessing", async () => {
    await enable();
    const r = await sent();
    await denied(() => reserve(), /PHONE_COOLDOWN/);
    await denied(
      () => call("claim_check", { challengeId: r.challengeId }, other),
      /PHONE_CHALLENGE/,
    );
    for (let i = 0; i < 5; i++) {
      const c = await call("claim_check", { challengeId: r.challengeId });
      await denied(
        () => call("claim_check", { challengeId: r.challengeId }),
        /PHONE_CHALLENGE_STATE/,
      );
      await denied(
        () => call("checked", { challengeId: r.challengeId, lease: randomUUID(), approved: true }),
        /PHONE_CHALLENGE_STATE/,
      );
      expect(
        await call("checked", { challengeId: r.challengeId, lease: c.lease, approved: false }),
      ).toEqual({ verified: false });
    }
    await denied(
      () => call("claim_check", { challengeId: r.challengeId }),
      /PHONE_CHALLENGE_STATE/,
    );
    expect((await call("status")).phone).toBeNull();
  });
  it("commits exact bound ownership once, preserves old phone on failure, and grants no access", async () => {
    await enable();
    const r = await sent();
    const c = await call("claim_check", { challengeId: r.challengeId });
    expect(
      await call("checked", { challengeId: r.challengeId, lease: c.lease, approved: true }),
    ).toEqual({ verified: true });
    expect((await call("status")).phone).toBe(phone);
    await denied(
      () => call("checked", { challengeId: r.challengeId, lease: c.lease, approved: true }),
      /PHONE_CHALLENGE_STATE/,
    );
    await denied(() => reserve(phone, other), /PHONE_INVALID/);
    const changed = await sent(actor, "+201112345678");
    const cc = await call("claim_check", { challengeId: changed.challengeId });
    await call("checked", { challengeId: changed.challengeId, lease: cc.lease, approved: false });
    expect((await call("status")).phone).toBe(phone);
    const count = (
      await db.query<{ n: number }>("SELECT count(*)::int n FROM billing.subscriptions")
    ).rows[0].n;
    expect(count).toBe(0);
    expect(
      (await db.query<{ n: number }>("SELECT count(*)::int n FROM public.user_roles")).rows[0].n,
    ).toBe(0);
  });
  it("keeps uncertain sends charged against quotas without an automatic resend", async () => {
    await enable();
    const r = await reserve();
    await call("uncertain", { challengeId: r.challengeId });
    await denied(
      () => call("claim_check", { challengeId: r.challengeId }),
      /PHONE_CHALLENGE_STATE/,
    );
    await denied(() => reserve(), /PHONE_COOLDOWN/);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT day_sends n FROM communications_private.phone_control",
        )
      ).rows[0].n,
    ).toBe(1);
    await db.exec("UPDATE communications_private.phone_control SET daily_cap=1");
    await denied(() => reserve("+201112345678", other), /PHONE_LIMIT/);
  });
  it("enforces per-account and per-number quotas and country selection", async () => {
    await enable();
    await denied(
      () => call("reserve", { phone: "+14155552671", country: "US", serviceSid, channel: "sms" }),
      /COUNTRY_UNAVAILABLE/,
    );
    for (let i = 0; i < 3; i++) {
      await reserve();
      await db.exec(
        "UPDATE communications_private.phone_challenges SET expires_at=now()-interval '1 second'",
      );
    }
    await denied(() => reserve("+201112345678"), /PHONE_LIMIT/);
    await denied(() => reserve(phone, other), /PHONE_LIMIT/);
  });
  it("does not accept expired receipt or check lease", async () => {
    await enable();
    const r = await sent();
    const c = await call("claim_check", { challengeId: r.challengeId });
    await db.exec(
      "UPDATE communications_private.phone_challenges SET lease_until=now()-interval '1 second'",
    );
    await denied(
      () => call("checked", { challengeId: r.challengeId, lease: c.lease, approved: true }),
      /PHONE_CHALLENGE_STATE/,
    );
    await db.exec(
      "UPDATE communications_private.phone_challenges SET expires_at=now()-interval '1 second'",
    );
    await denied(
      () => call("claim_check", { challengeId: r.challengeId }),
      /PHONE_CHALLENGE_EXPIRED/,
    );
  });
  it("fences in-flight attempts and erases phone data at the existing learner erasure stage", async () => {
    await enable();
    const r = await reserve();
    await db.exec(`INSERT INTO communications_private.verified_phones(actor,phone) VALUES('${actor}','${phone}');
      INSERT INTO billing.account_deletion_requests(user_id) VALUES('${actor}');
      UPDATE billing.account_deletion_control SET enabled=true,financial_retention_reference='synthetic-finance',
      crm_retention_reference='synthetic-crm',responder_reference='synthetic-owner',release_reference='synthetic-release';`);
    const lease = (
      await db.query<{ v: { lease_token: string } }>(
        `SELECT public.lc09_claim_deletion('${actor}') v`,
      )
    ).rows[0].v.lease_token;
    await denied(
      () => call("sent", { challengeId: r.challengeId, verificationSid }),
      /PHONE_ACCOUNT_UNAVAILABLE/,
    );
    await denied(
      () =>
        db.query(
          `SELECT public.lc09_advance_deletion('${actor}','${lease}','provider_reconciled')`,
        ),
      /LC09_PHONE_ATTEMPT_PENDING/,
    );
    await db.exec(
      "UPDATE communications_private.phone_challenges SET lease_until=now()-interval '1 second'",
    );
    await db.query(
      `SELECT public.lc09_advance_deletion('${actor}','${lease}','provider_reconciled')`,
    );
    await db.query(`SELECT public.lc09_advance_deletion('${actor}','${lease}','learner_erased')`);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int n FROM communications_private.verified_phones",
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int n FROM communications_private.phone_challenges",
        )
      ).rows[0].n,
    ).toBe(0);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT day_sends n FROM communications_private.phone_control",
        )
      ).rows[0].n,
    ).toBe(1);
  });
});

describe.skipIf(!nativeUrl)("physical PostgreSQL verification concurrency", () => {
  const racers: ReturnType<typeof postgres>[] = [];
  beforeAll(async () => {
    await db.exec("SELECT set_config('request.jwt.claim.role','service_role',false)");
    for (let i = 0; i < 2; i++) racers.push(postgres(nativeUrl!, { max: 1 }));
  });
  afterAll(async () => {
    await Promise.all(racers.map((c) => c.end()));
  });
  it("allows only one reservation when the same actor submits simultaneously", async () => {
    await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${actor}','actor@example.test',now()),('${other}','other@example.test',now());
      UPDATE communications_private.phone_control SET enabled=true,test_users=ARRAY['${actor}'::uuid,'${other}'::uuid];`);
    const input = { phone, country: "EG", serviceSid, channel: "sms" };
    await Promise.all(
      racers.map((c) => c`SELECT set_config('request.jwt.claim.role','service_role',false)`),
    );
    const results = await Promise.allSettled(
      racers.map(
        (c) =>
          c`SELECT public.account_phone_command(${actor}::uuid,'reserve',${c.json(input)}::jsonb)`,
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(String(rejected.reason)).toContain("PHONE_COOLDOWN");
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT day_sends n FROM communications_private.phone_control",
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("allows only one owner for simultaneous approvals of the same phone", async () => {
    await db.exec(
      "DELETE FROM communications_private.phone_challenges; UPDATE communications_private.phone_control SET day_sends=0",
    );
    const first = await sent(actor),
      second = await sent(other);
    const leases = await Promise.all([
      call("claim_check", { challengeId: first.challengeId }, actor),
      call("claim_check", { challengeId: second.challengeId }, other),
    ]);
    const results = await Promise.allSettled(
      racers.map(
        (c, i) =>
          c`SELECT public.account_phone_command(${i === 0 ? actor : other}::uuid,'checked',${c.json({ challengeId: i === 0 ? first.challengeId : second.challengeId, lease: String(leases[i].lease), approved: true })}::jsonb)`,
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(
      (
        await db.query<{ n: number }>(
          "SELECT count(*)::int n FROM communications_private.verified_phones",
        )
      ).rows[0].n,
    ).toBe(1);
  });
});
