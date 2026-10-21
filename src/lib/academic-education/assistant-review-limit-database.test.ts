// @vitest-environment node
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
let db: PGlite;
beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`CREATE SCHEMA auth; CREATE SCHEMA billing;
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    GRANT USAGE ON SCHEMA public,auth,billing TO authenticated,anon,service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('test.uid',true),'')::uuid$$;
    CREATE FUNCTION public.academic_assistant_access(text,text,text) RETURNS text LANGUAGE sql STABLE AS $$SELECT current_setting('test.mode',true)$$;
    CREATE TABLE public.academic_assistant_questions(user_id uuid,course_id text,request_id uuid,lesson_id text,locale text,period_key text,created_at timestamptz DEFAULT now(),PRIMARY KEY(user_id,course_id,request_id));
    ALTER TABLE public.academic_assistant_questions ENABLE ROW LEVEL SECURITY;
    CREATE TABLE billing.entitlement_policy_versions(policy_key text,status text,effective_from timestamptz,effective_to timestamptz,assistant_runtime_general_monthly_quota int,assistant_runtime_per_lesson_quota int);
    INSERT INTO billing.entitlement_policy_versions VALUES('pro_plus','published',now()-interval '1 day',NULL,100,10);`);
  await db.exec(readFileSync(new URL("../../../scripts/academic-education/assistant-review-safety-candidate.sql", import.meta.url), "utf8"));
}, 30000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec("RESET ROLE; TRUNCATE public.academic_assistant_questions;");
  await db.query("SELECT set_config('test.uid',$1,false),set_config('test.mode','admin',false)", ["00000000-0000-0000-0000-000000000001"]);
});
const id = (n: number) => `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
async function take(n: number, course = "AC-NEW") {
  return (await db.query<{ result: { allowed: boolean; reason?: string; remaining_lesson?: number } }>(
    "SELECT public.academic_assistant_take_question($1,$2,'en',$3) AS result", [course, `${course}-M01-L01`, id(n)])).rows[0].result;
}
it("allows authorized review but rejects replay before any additional ledger entry", async () => {
  await db.exec("SET ROLE authenticated");
  expect(await take(1)).toMatchObject({ allowed: true });
  expect(await take(1)).toEqual({ allowed: false, reason: "duplicate" });
  await db.exec("RESET ROLE");
  expect((await db.query("SELECT count(*)::integer AS n FROM public.academic_assistant_questions")).rows[0]).toEqual({ n: 1 });
});
it("enforces the independent review ceiling across cards", async () => {
  for (let n = 1; n <= 30; n++) expect((await take(n, n % 2 ? "AC-NEW" : "AC-OTHER")).allowed).toBe(true);
  expect(await take(31)).toEqual({ allowed: false, reason: "review_rate" });
});
it("keeps review requests out of purchased learner quotas", async () => {
  await take(1);
  await db.query("SELECT set_config('test.mode','learner',false)");
  expect(await take(2)).toMatchObject({ allowed: true, remaining_lesson: 9 });
  expect(await take(2)).toEqual({ allowed: false, reason: "duplicate" });
});
it("rejects missing users, revoked access and unprivileged callers", async () => {
  await db.query("SELECT set_config('test.mode','none',false)");
  expect(await take(1)).toEqual({ allowed: false, reason: "access" });
  await db.query("SELECT set_config('test.mode','admin',false),set_config('test.uid','',false)");
  expect(await take(1)).toEqual({ allowed: false, reason: "access" });
  for (const role of ["anon", "service_role"]) {
    await db.exec(`SET ROLE ${role}`);
    await expect(take(1)).rejects.toThrow(/permission denied/);
    await db.exec("RESET ROLE");
  }
});
