// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";
let db: PGlite;
const user = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  child = "33333333-3333-4333-8333-333333333333",
  child2 = "44444444-4444-4444-8444-444444444444";
const caller = async (id = user) => {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("SET ROLE authenticated");
};
const visit = (line = "ai", subject = user, profile: string | null = null, lesson = "one") =>
  db.query(
    "INSERT INTO public.journey_visits(user_id,line,course_id,subject_id,profile_id,lesson_id,locale,visited_at) VALUES($1,$2,$3,$4,$5,$6,'en','2099-01-01') ON CONFLICT(user_id,line,course_id,subject_id) DO UPDATE SET lesson_id=excluded.lesson_id",
    [user, line, line === "kids" ? "level-1" : "ai", subject, profile, lesson],
  );
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); INSERT INTO auth.users VALUES('${user}'),('${other}');
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
 CREATE TABLE public.kids_profiles(id uuid PRIMARY KEY,parent_id uuid,level_id text); INSERT INTO kids_profiles VALUES('${child}','${user}','level-1'),('${child2}','${other}','level-1'); ALTER TABLE kids_profiles ENABLE ROW LEVEL SECURITY; GRANT SELECT ON kids_profiles TO authenticated; CREATE POLICY owner ON kids_profiles FOR SELECT TO authenticated USING(parent_id=auth.uid());
 CREATE FUNCTION public.kids_parent_can_manage_profiles() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('test.parent',true),'yes')='yes' $$;
 CREATE FUNCTION public.kids_can_access_lesson(uuid,text,integer,text) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('test.access',true),'yes')='yes' AND $3 BETWEEN 1 AND 12 AND $4 IN ('en','ar-EG','ar-MSA','ar-Gulf') $$;
 CREATE TABLE kids_lesson_progress(profile_id uuid REFERENCES kids_profiles(id) ON DELETE CASCADE,level_id text,lesson_number integer,locale text,recorded_at timestamptz DEFAULT now(),PRIMARY KEY(profile_id,level_id,lesson_number,locale));`);
  await db.exec(
    readFileSync("supabase/migrations/20261007072809_unified_learning_journey.sql", "utf8"),
  );
}, 30000);
afterAll(() => db.close());
beforeEach(async () => {
  await db.exec(
    "RESET ROLE; TRUNCATE journey_visits,kids_lesson_progress; SELECT set_config('test.parent','yes',false),set_config('test.access','yes',false)",
  );
  await caller();
});
it("persists across sign-out/sign-in, updates the bookmark and uses server time", async () => {
  await visit();
  await visit("ai", user, null, "two");
  await caller(other);
  expect((await db.query("SELECT * FROM journey_visits")).rows).toHaveLength(0);
  await caller();
  const rows = (
    await db.query<{ lesson_id: string; visited_at: Date }>("SELECT * FROM journey_visits")
  ).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].lesson_id).toBe("two");
  expect(new Date(rows[0].visited_at).getFullYear()).not.toBe(2099);
});
it("rejects cross-account writes and ownership reassignment", async () => {
  await caller(other);
  await expect(visit()).rejects.toThrow(/row-level security/);
  await caller();
  await visit();
  await expect(
    db.query("UPDATE journey_visits SET user_id=$1,subject_id=$1", [other]),
  ).rejects.toThrow(/row-level security/);
});
it("keeps child bookmarks separate, and rejects another parent's child", async () => {
  await visit("kids", child, child);
  await expect(visit("kids", child2, child2)).rejects.toThrow(/row-level security/);
  expect((await db.query("SELECT * FROM journey_visits")).rows).toHaveLength(1);
});
it("does not show child bookmarks after guardian approval is withdrawn", async () => {
  await visit("kids", child, child);
  await db.exec("SELECT set_config('test.parent','no',false)");
  expect((await db.query("SELECT * FROM journey_visits")).rows).toHaveLength(0);
});
it("saves explicit child completion idempotently and separately per locale", async () => {
  for (const locale of ["en", "en", "ar-EG"])
    await db.query("SELECT public.complete_kids_step($1,'level-1',2,$2)", [child, locale]);
  const { rows } = await db.query<{ v: { completed: number[] } }>(
    "SELECT public.kids_journey($1,'en') v",
    [child],
  );
  expect(rows[0].v.completed).toEqual([2]);
  await db.exec("RESET ROLE");
  expect((await db.query("SELECT * FROM kids_lesson_progress")).rows).toHaveLength(2);
});
it("refuses completion for another child, a denied lesson, and admin preview without a child", async () => {
  await expect(
    db.query("SELECT public.complete_kids_step($1,'level-1',2,'en')", [child2]),
  ).rejects.toThrow("KIDS_ACCESS_REQUIRED");
  await expect(
    db.query("SELECT public.complete_kids_step($1,'level-1',2,'en')", [user]),
  ).rejects.toThrow("KIDS_ACCESS_REQUIRED");
  await db.exec("SELECT set_config('test.access','no',false)");
  await expect(
    db.query("SELECT public.complete_kids_step($1,'level-1',2,'en')", [child]),
  ).rejects.toThrow("KIDS_ACCESS_REQUIRED");
});
it("denies anonymous table access and function execution", async () => {
  await db.exec("RESET ROLE; SET ROLE anon");
  await expect(db.query("SELECT * FROM journey_visits")).rejects.toThrow(/permission denied/);
  await expect(
    db.query("SELECT public.complete_kids_step($1,'level-1',1,'en')", [child]),
  ).rejects.toThrow(/permission denied/);
});
it("deletes bookmarks with the account/child, without touching other accounts", async () => {
  await visit();
  await visit("kids", child, child);
  await db.exec("RESET ROLE");
  await db.query("DELETE FROM kids_profiles WHERE id=$1", [child]);
  expect((await db.query("SELECT * FROM journey_visits")).rows).toHaveLength(1);
  await db.query("DELETE FROM auth.users WHERE id=$1", [user]);
  expect((await db.query("SELECT * FROM journey_visits")).rows).toHaveLength(0);
});
