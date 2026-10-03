// @vitest-environment node
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it } from "vitest";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";
let db: PGlite;
const user = "00000000-0000-4000-8000-000000000101";
const other = "00000000-0000-4000-8000-000000000102";
const claim = (id = user) =>
  db.query<{ user_id: string; claim_token: string }>(
    "SELECT * FROM public.claim_account_welcome_email($1)",
    [id],
  );
describe("immediate welcome migration with installed lifecycle", () => {
  beforeAll(async () => {
    db = await accountDeletionTestDb();
    await db.exec(
      readFileSync(
        "supabase/migrations/20261003100000_account_welcome_immediate_claim.sql",
        "utf8",
      ),
    );
  }, 30_000);
  afterAll(async () => db?.close());
  beforeEach(async () => {
    await db.exec(`BEGIN; INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
      ('${user}','confirmed@example.test',now(),'{"full_name":"Saved Name","preferred_locale":"en"}'),
      ('${other}','other@example.test',now(),'{}');`);
  });
  afterEach(async () => db.exec("ROLLBACK"));
  it("exposes the new claim only to service_role", async () => {
    const result = await db.query<{ role: string; allowed: boolean }>(
      `SELECT r AS role, has_function_privilege(r,'public.claim_account_welcome_email(uuid)','EXECUTE') AS allowed FROM unnest(ARRAY['anon','authenticated','service_role']) r`,
    );
    expect(result.rows).toEqual([
      { role: "anon", allowed: false },
      { role: "authenticated", allowed: false },
      { role: "service_role", allowed: true },
    ]);
    await db.exec("SET LOCAL ROLE service_role");
    expect((await claim()).rows.map((r) => r.user_id)).toEqual([user]);
  });
  it("claims only its confirmed account and leaves the other account for the batch", async () => {
    const row = (await claim()).rows[0];
    expect(row.user_id).toBe(user);
    expect(row).toMatchObject({
      recipient: "confirmed@example.test",
      display_name: "Saved Name",
      preferred_locale: "en",
      template_version: 2,
    });
    expect((await claim()).rows).toEqual([]);
    expect(
      (
        await db.query<{ user_id: string }>(
          "SELECT * FROM public.claim_account_welcome_emails_v2()",
        )
      ).rows.map((r) => r.user_id),
    ).toEqual([other]);
  });
  it("does not contend with an existing batch lease or resend a completed row", async () => {
    const batch = await db.query<{ user_id: string; claim_token: string }>(
      "SELECT * FROM public.claim_account_welcome_emails_v2()",
    );
    expect((await claim()).rows).toEqual([]);
    const own = batch.rows.find((r) => r.user_id === user)!;
    await db.query("SELECT public.complete_account_welcome_email($1,$2,'provider-id',false)", [
      user,
      own.claim_token,
    ]);
    await db.exec("UPDATE public.account_welcome_outbox SET lease_until=now()-interval '1 minute'");
    expect((await claim()).rows).toEqual([]);
  });
  it("retains the 23-hour retry window and expires the prior lease", async () => {
    const first = (await claim()).rows[0];
    await db.exec("UPDATE public.account_welcome_outbox SET lease_until=now()-interval '1 minute'");
    expect((await claim()).rows[0].claim_token).not.toBe(first.claim_token);
    await db.exec(
      "UPDATE public.account_welcome_outbox SET first_attempt_at=now()-interval '24 hours',lease_until=NULL",
    );
    expect((await claim()).rows).toEqual([]);
  });
  it("cannot send with an unconfirmed/changed/deleted Auth identity", async () => {
    await db.exec(`UPDATE auth.users SET email_confirmed_at=NULL WHERE id='${user}'`);
    expect((await claim()).rows).toEqual([]);
    await db.exec(
      `UPDATE auth.users SET email_confirmed_at=now(),email='changed@example.test' WHERE id='${user}'`,
    );
    expect((await claim()).rows).toEqual([]);
    await db.exec(`DELETE FROM auth.users WHERE id='${user}'`);
    expect((await claim()).rows).toEqual([]);
  });
  it("blocks a deleting account while preserving another family's mail", async () => {
    await db.exec(`INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');
      INSERT INTO billing.account_deletion_lifecycle(user_id,stage,financial_retention_reference,crm_retention_reference,release_reference)
      VALUES('${user}','blocked','synthetic-finance','synthetic-crm','synthetic-release');`);
    expect((await claim()).rows).toEqual([]);
    expect((await claim(other)).rows.map((r) => r.user_id)).toEqual([other]);
  });
});
