// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, beforeEach, afterEach, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";
let db: PGlite;
const actor = randomUUID(),
  admin = randomUUID();
beforeAll(async () => {
  db = await accountDeletionTestDb(true);
  for (const name of [
    "0048_account_phone_verification",
    "0049_phone_administration",
    "0050_contact_automation",
    "0051_communications_drain_gate",
  ])
    await db.exec(readFileSync(`drizzle/migrations/${name}.sql`, "utf8"));
}, 30000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec("BEGIN; SET request.jwt.claim.role='service_role'");
  await db.query(
    "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,'actor@example.test',now()),($2,'admin@example.test',now())",
    [actor, admin],
  );
  await db.query("INSERT INTO public.user_roles VALUES($1,'admin')", [admin]);
  await db.query(
    "UPDATE communications_private.phone_control SET enabled=true,test_users=ARRAY[$1::uuid],daily_cap=100",
    [actor],
  );
});
afterEach(async () => db.exec("ROLLBACK"));
async function pause(value: boolean) {
  await db.query("SELECT public.set_communications_starts_paused($1,$2)", [admin, value]);
}
async function reserve(id: string) {
  const rows = await db.query<{ result: { state: string; claim?: string } }>(
    "SELECT public.reserve_contact_intake($1,'actor@example.test','en','support','ACK','text','html',true,'Review','body','html',$2,$3) AS result",
    [id, "d".repeat(64), "e".repeat(64)],
  );
  return rows.rows[0].result;
}
it("stops public and internal phone admission while preserving current results", async () => {
  const input = {
    phone: "+201112345678",
    country: "EG",
    serviceSid: "VA" + "b".repeat(32),
    channel: "sms",
  };
  const start = await db.query<{ result: { challengeId: string } }>(
    "SELECT public.account_phone_command($1,'reserve',$2) AS result",
    [actor, input],
  );
  await pause(true);
  for (const target of ["public.account_phone_command", "communications_private.phone_command"]) {
    await db.exec("SAVEPOINT denial");
    await expect(db.query(`SELECT ${target}($1,'reserve',$2)`, [actor, input])).rejects.toThrow(
      "COMMUNICATIONS_STARTS_PAUSED",
    );
    await db.exec("ROLLBACK TO SAVEPOINT denial");
  }
  await db.query("SELECT public.account_phone_command($1,'sent',$2)", [
    actor,
    { challengeId: start.rows[0].result.challengeId, verificationSid: "VE" + "c".repeat(32) },
  ]);
  const status = await db.query<{ result: { enabled: boolean } }>(
    "SELECT public.account_phone_command($1,'status') AS result",
    [actor],
  );
  expect(status.rows[0].result.enabled).toBe(false);
});
it("resumes an unstarted contact through normal reservation with a fresh claim", async () => {
  const id = randomUUID();
  const first = await reserve(id);
  await pause(true);
  expect(
    (
      await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
        id,
        first.claim,
      ])
    ).rows[0].ok,
  ).toBe(false);
  await pause(false);
  const resumed = await reserve(id);
  expect(resumed.state).toBe("dispatch");
  expect(resumed.claim).not.toBe(first.claim);
  expect(
    (
      await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
        id,
        first.claim,
      ])
    ).rows[0].ok,
  ).toBe(false);
  expect(
    (
      await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
        id,
        resumed.claim,
      ])
    ).rows[0].ok,
  ).toBe(true);
});
it("settles an already started contact while rejecting all fresh admission", async () => {
  const id = randomUUID();
  const first = await reserve(id);
  await db.query("SELECT public.begin_contact_intake($1,$2)", [id, first.claim]);
  await pause(true);
  await db.exec("SAVEPOINT denial");
  await expect(reserve(randomUUID())).rejects.toThrow("COMMUNICATIONS_STARTS_PAUSED");
  await db.exec("ROLLBACK TO SAVEPOINT denial");
  expect(
    (
      await db.query<{ ok: boolean }>("SELECT public.complete_contact_intake($1,$2,true) AS ok", [
        id,
        first.claim,
      ])
    ).rows[0].ok,
  ).toBe(true);
  expect((await reserve(id)).state).toBe("accepted");
  expect(
    (await db.query("SELECT * FROM public.claim_contact_automation(NULL,NULL)")).rows,
  ).toHaveLength(0);
});
