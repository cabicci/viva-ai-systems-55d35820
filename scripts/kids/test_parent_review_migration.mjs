import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const pg = new PGlite();
const parent = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
const base = readFileSync(
  "supabase/migrations/20260924190000_kids_parent_content_access_foundation.sql",
  "utf8",
);
const review = readFileSync(
  "supabase/migrations/20260925120000_kids_parent_access_review.sql",
  "utf8",
);
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
async function blocked(action, message) {
  let denied = false;
  try {
    await action();
  } catch {
    denied = true;
  }
  check(denied, message);
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
      ('${other}','other@example.test',null),
      ('${admin}','admin@example.test',now());
    CREATE TYPE public.app_role AS ENUM ('admin','user');
    CREATE TABLE public.user_roles(user_id uuid, role public.app_role);
    INSERT INTO public.user_roles VALUES ('${admin}','admin');
    CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
      AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles
                          WHERE user_id=_user_id AND role=_role); $$;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
  `);
  await pg.exec(base);
  await pg.exec(review);
  await blocked(
    () => asUser(parent, () => pg.query("SELECT public.kids_parent_request_review(false)")),
    "Acknowledgment required",
  );
  await blocked(
    () => asUser(other, () => pg.query("SELECT public.kids_parent_request_review(true)")),
    "Confirmed adult account email required",
  );
  await asUser(parent, async () => {
    const result = await pg.query("SELECT public.kids_parent_request_review(true) AS status");
    check(result.rows[0].status === "pending", "Request must stay pending");
    await blocked(
      () =>
        pg.query(`UPDATE public.kids_parent_access_requests
      SET status='approved' WHERE parent_id='${parent}'`),
      "Parent must not self-approve",
    );
    await blocked(
      () =>
        pg.query(`SELECT public.kids_admin_review_parent(
      '${parent}',true,'case-verified-1')`),
      "Non-admin cannot approve",
    );
    const own = await pg.query("SELECT parent_email FROM public.kids_parent_access_requests");
    check(
      own.rows.length === 1 && own.rows[0].parent_email === "parent@example.test",
      "Server must store verified email",
    );
  });
  await asUser(other, async () => {
    const visible = await pg.query("SELECT parent_id FROM public.kids_parent_access_requests");
    check(visible.rows.length === 0, "Other family request must be private");
  });
  await asUser(admin, async () => {
    const visible = await pg.query("SELECT parent_id FROM public.kids_parent_access_requests");
    check(visible.rows.length === 1, "Admin review queue must show adult request");
    const readiness = await pg.query("SELECT public.kids_admin_parent_review_ready() AS ready");
    check(readiness.rows[0].ready === false, "Child release must start closed");
    await blocked(
      () =>
        pg.query(`SELECT public.kids_admin_review_parent(
      '${parent}',true,'case-verified-1')`),
      "Approval before privacy release must fail",
    );
  });
  const pre = await asUser(parent, () =>
    pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed"),
  );
  check(pre.rows[0].allowed === false, "Request alone must not open profiles");
  await pg.exec("UPDATE public.kids_release_control SET accepts_child_data=true");
  await asUser(admin, async () => {
    const readiness = await pg.query("SELECT public.kids_admin_parent_review_ready() AS ready");
    check(readiness.rows[0].ready === true, "Review readiness should reflect release");
    await pg.query(`SELECT public.kids_admin_review_parent(
      '${parent}',true,'case-verified-1')`);
  });
  await asUser(parent, async () => {
    const canManage = await pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed");
    check(canManage.rows[0].allowed === true, "Reviewed parent should manage profiles");
    await pg.exec(`INSERT INTO public.kids_profiles(parent_id,display_name,level_id)
      VALUES ('${parent}','Child','level-1')`);
  });
  await asUser(other, async () => {
    const invisible = await pg.query("SELECT id FROM public.kids_profiles");
    check(invisible.rows.length === 0, "Other family cannot read child profiles");
  });
  await asUser(admin, () =>
    pg.query(`SELECT public.kids_admin_review_parent(
    '${parent}',false,'case-revoked-1')`),
  );
  const post = await asUser(parent, () =>
    pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed"),
  );
  check(post.rows[0].allowed === false, "Revocation must close profile management");
  console.log("Kids parent review SQL gates: PASS");
} finally {
  await pg.close();
}
