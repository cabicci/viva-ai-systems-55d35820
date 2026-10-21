// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(import.meta.dirname, "../../..");
const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA billing; CREATE TYPE public.app_role AS ENUM('admin');
    CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
    CREATE TABLE billing.subscriptions(user_id uuid,access_state text);
    CREATE TABLE billing.deletion_blocks(user_id uuid);
    CREATE TABLE billing.snapshots(user_id uuid,payload jsonb);
    CREATE FUNCTION billing.account_deletion_blocked(p_user uuid) RETURNS boolean LANGUAGE sql AS $$
      SELECT EXISTS(SELECT 1 FROM billing.deletion_blocks WHERE user_id=p_user) $$;
    CREATE FUNCTION public.has_role(p_user uuid,p_role public.app_role) RETURNS boolean LANGUAGE sql AS $$
      SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role=p_role) $$;
    CREATE FUNCTION billing.get_entitlement_snapshot(p_user uuid) RETURNS jsonb LANGUAGE sql AS $$
      SELECT payload FROM billing.snapshots WHERE user_id=p_user $$;`);
  const source = fs.readFileSync(path.join(root, "supabase/migrations/20261004012000_commerce_access.sql"), "utf8");
  const eligibility = source.match(/CREATE FUNCTION billing\.commerce_account_allowed\(p_user uuid\)[\s\S]*?END \$\$;/)?.[0];
  if (!eligibility) throw new Error("Missing installed commerce eligibility fixture");
  await db.exec(eligibility);
  await db.exec(fs.readFileSync(path.join(root, "supabase/migrations/20261021120000_assistant_card_content_access.sql"), "utf8"));
}, 60000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await db.exec("RESET ROLE; TRUNCATE user_roles,billing.subscriptions,billing.deletion_blocks,billing.snapshots"); });
async function access(subject: string | null = user, card: string | null = "analyst", role = "service_role") {
  await db.exec(`SET ROLE ${role}`);
  try { return (await db.query<{ result: { card_id: string; admin_review: boolean; lessons: Record<string, unknown> } }>("SELECT public.assistant_card_content_access($1,$2) result", [subject, card])).rows[0].result; }
  finally { await db.exec("RESET ROLE"); }
}

describe("AI card content gateway executed only in isolated PGlite", () => {
  it("preserves the exact learner snapshot allowlist including preview-only access", async () => {
    const lessons = { entitled_lesson_ids: ["analyst-preview"], mode: "explicit_list" };
    await db.query("INSERT INTO billing.snapshots VALUES($1,$2)", [user, { lessons }]);
    expect(await access()).toEqual({ card_id: "analyst", admin_review: false, lessons });
    expect(await access(other)).toEqual({ card_id: "analyst", admin_review: false, lessons: {} });
  });

  it("recognizes server-owned admin review without requiring a paid snapshot or changing a grant", async () => {
    await db.query("INSERT INTO user_roles VALUES($1,'admin')", [user]);
    expect(await access()).toEqual({ card_id: "analyst", admin_review: true, lessons: { entitled_lesson_ids: [] } });
    expect((await access(other)).admin_review).toBe(false);
    expect((await db.query("SELECT * FROM billing.subscriptions")).rows).toEqual([]);
    expect((await db.query("SELECT * FROM billing.snapshots")).rows).toEqual([]);
  });

  it.each(["suspension", "deletion"])("blocks admin review and existing paid snapshots during %s", async (reason) => {
    await db.query("INSERT INTO user_roles VALUES($1,'admin')", [user]);
    await db.query("INSERT INTO billing.snapshots VALUES($1,$2)", [user, { lessons: { entitled_lesson_ids: ["paid-step"] } }]);
    if (reason === "suspension") await db.query("INSERT INTO billing.subscriptions VALUES($1,'suspended')", [user]);
    else await db.query("INSERT INTO billing.deletion_blocks VALUES($1)", [user]);
    expect(await access()).toEqual({ card_id: "analyst", admin_review: false, lessons: { entitled_lesson_ids: [] } });
  });

  it.each([null, "", " analyst", "analyst ", "x".repeat(129)])("rejects malformed explicit card %j", async (card) => {
    await expect(access(user, card)).rejects.toThrow("ASSISTANT_INVALID_CARD_ACCESS_SCOPE");
  });

  it("requires a user subject and denies direct browser roles", async () => {
    await expect(access(null)).rejects.toThrow("ASSISTANT_INVALID_CARD_ACCESS_SCOPE");
    for (const role of ["anon", "authenticated"]) await expect(access(user, "analyst", role)).rejects.toThrow(/permission denied/);
    const result = await db.query<{ allowed: boolean }>("SELECT has_function_privilege('service_role','public.assistant_card_content_access(uuid,text)','EXECUTE') allowed");
    expect(result.rows[0].allowed).toBe(true);
  });
});
