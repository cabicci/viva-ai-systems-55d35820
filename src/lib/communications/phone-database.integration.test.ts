// @vitest-environment node
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accountDeletionTestDb } from "../__tests__/fixtures/account-deletion-db";

const admin = "11111111-1111-4111-8111-111111111111";
const learner = "22222222-2222-4222-8222-222222222222";
const upgrade = () =>
  readFileSync("drizzle/migrations/0048_account_phone_verification.sql", "utf8");
const administration = () =>
  readFileSync("drizzle/migrations/0049_phone_administration.sql", "utf8");
const setup = async (existing: boolean) => {
  const db = await accountDeletionTestDb(true);
  await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ('${admin}','admin@example.test',now()),('${learner}','learner@example.test',now());
    INSERT INTO public.user_roles VALUES ('${admin}','admin');
    SET request.jwt.claim.role='service_role';`);
  if (existing) {
    await db.exec(readFileSync("tests/fixtures/phone-upgrade-baseline.sql", "utf8").replace(/\r\n/g, "\n"));
    await db.exec(`UPDATE communications_private.phone_control SET enabled=true,test_users=ARRAY['${learner}'::uuid],daily_cap=31;
      INSERT INTO communications_private.verified_phones(actor,phone) VALUES ('${learner}','+201012345678');`);
  }
  return db;
};
let db: PGlite;
beforeAll(async () => {
  db = await setup(false);
  await db.exec(upgrade());
  await db.exec(administration());
}, 30000);
afterAll(async () => db?.close());
const command = (action: string, data: object = {}, actor = admin) =>
  db.query<{ value: Record<string, unknown> }>(
    "SELECT public.admin_account_phone_command($1,$2,$3::jsonb) AS value",
    [actor, action, JSON.stringify(data)],
  );
describe("phone database integration", () => {
  it("installs disabled and exposes only service commands", async () => {
    expect((await command("status")).rows[0].value).toMatchObject({
      enabled: false,
      dailyCap: 20,
      revision: 0,
      sentToday: 0,
    });
    for (const signature of [
      "public.account_phone_command(uuid,text,jsonb)",
      "public.admin_account_phone_command(uuid,text,jsonb)",
    ])
      for (const role of ["anon", "authenticated", "service_role"]) {
        const result = await db.query<{ allowed: boolean }>(
          "SELECT has_function_privilege($1,$2,'EXECUTE') AS allowed",
          [role, signature],
        );
        expect(result.rows[0].allowed).toBe(role === "service_role");
      }
  });
  it("rejects a learner asking for administrator controls", async () => {
    await expect(command("status", {}, learner)).rejects.toThrow("PHONE_ADMIN_FORBIDDEN");
  });
  it("keeps phone optional and applies selected-channel settings with optimistic locking", async () => {
    const settings = {
      enabled: true,
      revision: 0,
      channels: ["sms", "whatsapp"],
      dailyCap: 25,
      testUsers: [learner],
    };
    expect((await command("configure", settings)).rows[0].value).toMatchObject({
      enabled: true,
      revision: 1,
      dailyCap: 25,
    });
    await expect(command("configure", { ...settings, dailyCap: 99 })).rejects.toThrow(
      "PHONE_CONTROL_CONFLICT",
    );
    expect((await command("status")).rows[0].value.dailyCap).toBe(25);
    const result = await db.query<{ value: { phone: null; enabled: boolean } }>(
      "SELECT public.account_phone_command($1,'status','{}') AS value",
      [learner],
    );
    expect(result.rows[0].value).toMatchObject({ phone: null, enabled: true });
  });
  it("rejects invalid configuration through the database boundary", async () => {
    for (const change of [
      { channels: [] },
      { channels: ["sms", "sms"] },
      { dailyCap: 0 },
      { testUsers: [learner, learner] },
    ]) {
      await expect(
        command("configure", {
          enabled: true,
          revision: 1,
          channels: ["sms"],
          dailyCap: 20,
          testUsers: [],
          ...change,
        }),
      ).rejects.toThrow("PHONE_CONTROL_INVALID");
    }
  });
  it("upgrades an already installed phone schema without losing settings or verified numbers", async () => {
    const existing = await setup(true);
    try {
      await existing.exec(upgrade());
      await existing.exec(administration());
      const control = await existing.query<{ enabled: boolean; daily_cap: number }>(
        "SELECT enabled,daily_cap FROM communications_private.phone_control",
      );
      expect(control.rows[0]).toEqual({ enabled: true, daily_cap: 31 });
      expect(
        (await existing.query("SELECT actor FROM communications_private.verified_phones")).rows,
      ).toHaveLength(1);
      const saved = await existing.query<{ definition: string }>(
        "SELECT pg_get_functiondef('communications_private.pre_upgrade_advance_deletion(uuid,uuid,text)'::regprocedure) AS definition",
      );
      expect(saved.rows[0].definition).toContain(
        "communications_private.previous_advance_deletion",
      );
    } finally {
      await existing.close();
    }
  }, 30000);
  it("keeps installed phone data and settings during application rollback", async () => {
    const existing = await setup(true);
    try {
      await existing.exec(upgrade());
      await existing.exec(administration());
      await existing.exec(
        readFileSync("docs/communications/phone-verification.rollback.sql", "utf8"),
      );
      expect(
        (await existing.query("SELECT actor FROM communications_private.verified_phones")).rows,
      ).toHaveLength(1);
      const control = await existing.query<{ enabled: boolean; daily_cap: number }>(
        "SELECT enabled,daily_cap FROM communications_private.phone_control",
      );
      expect(control.rows[0]).toEqual({ enabled: true, daily_cap: 31 });
      const current = await existing.query<{ definition: string }>(
        "SELECT pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure) AS definition",
      );
      expect(current.rows[0].definition).toContain(
        "communications_private.pre_upgrade_advance_deletion",
      );
      expect(current.rows[0].definition).toContain(
        "DELETE FROM communications_private.verified_phones",
      );
    } finally {
      await existing.close();
    }
  }, 30000);
  it("rejects an unexpected existing phone function before replacing anything", async () => {
    const existing = await setup(true);
    try {
      await existing.exec(
        "CREATE OR REPLACE FUNCTION communications_private.phone_command(p_actor uuid,p_action text,p_data jsonb) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;",
      );
      await expect(existing.exec(upgrade())).rejects.toThrow("PHONE_EXISTING_CONTRACT_CHANGED");
      await existing.exec("ROLLBACK");
      expect(
        (await existing.query("SELECT actor FROM communications_private.verified_phones")).rows,
      ).toHaveLength(1);
    } finally {
      await existing.close();
    }
  }, 30000);
});
