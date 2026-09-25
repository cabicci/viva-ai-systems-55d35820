import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const pg = new PGlite();
const parent = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
const unconfirmed = "44444444-4444-4444-8444-444444444444";
const profile = "55555555-5555-4555-8555-555555555555";
const check = (ok, message) => {
  if (!ok) throw Error(message);
};
async function asUser(id, action) {
  await pg.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${id}'`);
  try {
    return await action();
  } finally {
    await pg.exec("RESET ROLE; RESET request.jwt.claim.sub");
  }
}
async function denied(action, message) {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  check(rejected, message);
}
async function allowed(id, lesson, expected) {
  const result = await asUser(id, () =>
    pg.query(
      `SELECT public.kids_can_access_lesson('${profile}','level-1',${lesson},'ar-EG') AS allowed`,
    ),
  );
  check(result.rows[0].allowed === expected, `Lesson ${lesson} access must be ${expected}`);
}
try {
  await pg.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN;
    GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    INSERT INTO auth.users VALUES
      ('${parent}','parent@example.test',now()),
      ('${other}','other@example.test',now()),
      ('${admin}','admin@example.test',now()),
      ('${unconfirmed}','unconfirmed@example.test',null);
    CREATE TYPE public.app_role AS ENUM ('admin','user');
    CREATE TABLE public.user_roles(user_id uuid, role public.app_role);
    INSERT INTO public.user_roles VALUES ('${admin}','admin');
    CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
      AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles
                          WHERE user_id=_user_id AND role=_role); $$;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
  `);
  for (const migration of [
    "20260924190000_kids_parent_content_access_foundation.sql",
    "20260925120000_kids_parent_access_review.sql",
    "20260925140000_kids_market_release_gates.sql",
    "20260925160000_kids_family_profile_limit.sql",
  ])
    await pg.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  const markets = await pg.query(
    "SELECT country_code,accepts_child_data FROM public.kids_market_release",
  );
  check(
    markets.rows.length === 22 && markets.rows.every((r) => !r.accepts_child_data),
    "All 22 markets must start closed",
  );
  for (const args of [
    "true",
    "false,'EG',true",
    "true,'EG',false",
    "true,null,true",
    "true,'US',true",
  ]) {
    await denied(
      () => asUser(parent, () => pg.query(`SELECT public.kids_parent_request_review(${args})`)),
      `Invalid or stale request ${args} must fail`,
    );
  }
  await denied(
    () =>
      asUser(unconfirmed, () =>
        pg.query("SELECT public.kids_parent_request_review(true,'EG',true)"),
      ),
    "Unconfirmed email must fail",
  );
  await denied(
    () => pg.exec("SET ROLE anon; SELECT public.kids_parent_request_review(true,'EG',true)"),
    "Anonymous RPC must fail",
  );
  await pg.exec("RESET ROLE");
  for (const [id, country] of [
    [parent, "EG"],
    [other, "SA"],
  ]) {
    await asUser(id, async () => {
      const request = await pg.query(
        `SELECT public.kids_parent_request_review(true,'${country}',true) AS status`,
      );
      check(request.rows[0].status === "pending", "Request must remain pending");
      const visible = await pg.query(
        "SELECT parent_id,parent_email,country_code FROM public.kids_parent_access_requests",
      );
      check(
        visible.rows.length === 1 && visible.rows[0].parent_id === id,
        "Request isolation must hold",
      );
      check(visible.rows[0].country_code === country, "Residence must be stored");
      if (id === parent)
        check(
          visible.rows[0].parent_email === "parent@example.test",
          "Email must come from verified auth record",
        );
      await denied(
        () => pg.query("UPDATE public.kids_market_release SET accepts_child_data=true"),
        "Parent cannot open a market",
      );
      await denied(
        () =>
          pg.query(
            `UPDATE public.kids_parent_access_requests SET status='approved' WHERE parent_id='${id}'`,
          ),
        "Parent cannot self-approve",
      );
      await denied(
        () => pg.query(`SELECT public.kids_admin_review_parent('${id}',true,'review-test-1')`),
        "Non-admin review must fail",
      );
    });
  }
  await denied(
    () =>
      asUser(parent, () => pg.query("SELECT public.kids_parent_request_review(true,'SA',true)")),
    "Residence cannot silently change",
  );
  const approve = (id) =>
    asUser(admin, () =>
      pg.query(`SELECT public.kids_admin_review_parent('${id}',true,'review-test-1')`),
    );
  await denied(() => approve(parent), "Global release closed must block approval");
  await pg.exec(
    "UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true",
  );
  await denied(() => approve(parent), "Global release alone must not open a country");
  await denied(
    () =>
      pg.exec(
        "UPDATE public.kids_market_release SET accepts_child_data=true WHERE country_code='EG'",
      ),
    "Opening a country needs a review receipt",
  );
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='policy-test-1' WHERE country_code='EG'",
  );
  await approve(parent);
  await denied(() => approve(other), "Egypt approval must not open Saudi Arabia");
  await asUser(parent, () =>
    pg.exec(`INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id)
    VALUES ('${profile}','${parent}','Learner','level-1')`),
  );
  await asUser(other, async () => {
    const rows = await pg.query("SELECT id FROM public.kids_profiles");
    check(rows.rows.length === 0, "Other family cannot read a profile");
    await denied(
      () =>
        pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${other}','Learner','level-1')`),
      "Closed-country parent cannot create a profile",
    );
  });
  await allowed(parent, 1, false);
  await pg.exec(
    "INSERT INTO public.kids_content_approvals VALUES ('level-1',1,'ar-EG',now(),'content-test'),('level-1',3,'ar-EG',now(),'content-test')",
  );
  await allowed(parent, 1, true);
  await allowed(parent, 3, false);
  await allowed(other, 1, false);
  await pg.exec(
    `INSERT INTO public.kids_family_entitlements VALUES ('${parent}',now()-interval '1 hour',now()+interval '1 hour','entitlement-test')`,
  );
  await allowed(parent, 3, true);
  await asUser(parent, async () => {
    await pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parent}','Second','level-2'),('${parent}','Third','level-3')`);
    await denied(
      () =>
        pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
        VALUES ('${parent}','Fourth','level-1')`),
      "Direct client insert must not create a fourth child",
    );
    await pg.exec(`UPDATE public.kids_profiles SET display_name='Updated' WHERE id='${profile}'`);
    await pg.exec(`DELETE FROM public.kids_profiles WHERE display_name='Third'`);
    await pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parent}','Replacement','level-3')`);
  });
  await denied(
    () => pg.exec(`UPDATE public.kids_profiles SET parent_id='${other}' WHERE id='${profile}'`),
    "Even a privileged writer cannot transfer profile ownership",
  );
  // A multi-row insert is atomic; no partial fourth/fifth family member remains.
  await pg.exec(`DELETE FROM public.kids_profiles WHERE display_name='Replacement'`);
  await denied(
    () =>
      pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parent}','Fourth','level-1'),('${parent}','Fifth','level-2')`),
    "Bulk inserts cannot bypass the family cap",
  );
  const count = await pg.query(
    `SELECT count(*)::int AS n FROM public.kids_profiles WHERE parent_id='${parent}'`,
  );
  check(count.rows[0].n === 2, "Rejected bulk insert must roll back all its rows");
  await pg.exec("BEGIN ISOLATION LEVEL REPEATABLE READ");
  await denied(
    () =>
      pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parent}','Stale snapshot','level-1')`),
    "Retained transaction snapshots must not bypass the serialized count",
  );
  await pg.exec("ROLLBACK");
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=false WHERE country_code='EG'",
  );
  await allowed(parent, 1, false);
  await allowed(parent, 3, false);
  await denied(
    () =>
      asUser(parent, () =>
        pg.exec(`UPDATE public.kids_profiles SET display_name='Changed' WHERE id='${profile}'`),
      ),
    "Country closure must stop profile edits",
  );
  await asUser(admin, () =>
    pg.query(`SELECT public.kids_admin_review_parent('${parent}',false,'revoked-test-1')`),
  );
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=true WHERE country_code='EG'",
  );
  await allowed(parent, 1, false);
  const retry = await asUser(parent, () =>
    pg.query("SELECT public.kids_parent_request_review(true,'EG',true) AS status"),
  );
  check(retry.rows[0].status === "rejected", "Resubmission cannot restore revoked approval");
  console.log(
    "Kids SQL gates: PASS (22 closed countries; identity, authorization, isolation, independent entitlement, three-profile cap, atomic bulk rejection and revocation)",
  );
} finally {
  await pg.close();
}
