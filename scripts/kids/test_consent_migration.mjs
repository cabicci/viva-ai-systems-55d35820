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
    "20260925210000_kids_profile_consent.sql",
  ])
    await pg.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  const policy = "66666666-6666-4666-8666-666666666666";
  const foreignPolicy = "77777777-7777-4777-8777-777777777777";
  for (const id of [parent, other])
    await asUser(id, () => pg.query("SELECT public.kids_parent_request_review(true,'EG',true)"));
  const create = (id, accepted = true, selected = policy) =>
    asUser(id, () =>
      pg.query(
        `SELECT public.kids_parent_create_consented_profile('Learner','level-1','${selected}',${accepted}) AS id`,
      ),
    );
  await denied(() => create(parent), "Closed release cannot collect a child");
  await pg.exec(
    "UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true",
  );
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='synthetic-policy' WHERE country_code='EG'",
  );
  await denied(() => create(parent), "Adult declaration is not guardian verification");
  for (const id of [parent, other])
    await asUser(admin, () =>
      pg.query(`SELECT public.kids_admin_review_parent('${id}',true,'synthetic-guardian')`),
    );
  await denied(() => create(parent), "Missing policy must fail");
  await pg.exec(`INSERT INTO public.kids_consent_policies
    (id,country_code,version,locale,notice_text,consent_text,review_reference,enabled) VALUES
    ('${policy}','EG','synthetic-v1','en',repeat('Synthetic notice only. ',5),
      'Synthetic explicit consent for this test.','synthetic-review',true),
    ('${foreignPolicy}','SA','synthetic-v1','en',repeat('Synthetic notice only. ',5),
      'Synthetic explicit consent for this test.','synthetic-review',true)`);
  await denied(() => create(parent, false), "Unchecked consent must fail");
  await denied(() => create(parent, true, foreignPolicy), "Foreign policy must fail");
  await denied(
    () =>
      asUser(parent, () =>
        pg.query(`INSERT INTO public.kids_profiles
    (parent_id,display_name,level_id) VALUES('${parent}','Bypass','level-1')`),
      ),
    "Direct profile insert bypass must fail",
  );
  const id = (await create(parent)).rows[0].id;
  const receipt = await asUser(parent, () =>
    pg.query("SELECT * FROM public.kids_profile_consents"),
  );
  check(
    receipt.rows.length === 1 &&
      receipt.rows[0].profile_id === id &&
      receipt.rows[0].parent_id === parent &&
      receipt.rows[0].guardian_reference === "synthetic-guardian",
    "Receipt must bind server identity, child, policy and guardian reference",
  );
  check(
    (await asUser(other, () => pg.query("SELECT * FROM public.kids_profile_consents"))).rows
      .length === 0,
    "Another family cannot read consent receipt",
  );
  await denied(
    () =>
      asUser(parent, () => pg.query("UPDATE public.kids_profile_consents SET withdrawn_at=null")),
    "Parents cannot modify or fake receipts",
  );
  await denied(
    () => pg.query("UPDATE public.kids_consent_policies SET notice_text=repeat('Changed',20)"),
    "Published text is immutable",
  );
  await pg.exec(
    "INSERT INTO public.kids_content_approvals VALUES ('level-1',1,'en',now(),'synthetic-content')",
  );
  async function lesson(expected) {
    const result = await asUser(parent, () =>
      pg.query(`SELECT public.kids_can_access_lesson('${id}','level-1',1,'en') AS allowed`),
    );
    check(result.rows[0].allowed === expected, `Lesson must be ${expected}`);
  }
  await lesson(true);
  await pg.exec(`UPDATE public.kids_consent_policies SET enabled=false WHERE id='${policy}'`);
  await lesson(false);
  await denied(() => create(parent), "Retired policy cannot create profile");
  await pg.exec(`UPDATE public.kids_consent_policies SET enabled=true WHERE id='${policy}'`);
  await create(parent);
  await create(parent);
  await denied(() => create(parent), "Consent RPC must retain max-three rule");
  await denied(
    () => asUser(other, () => pg.query(`SELECT public.kids_parent_withdraw_consent('${id}')`)),
    "Other family cannot withdraw consent",
  );
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=false WHERE country_code='EG'",
  );
  await asUser(parent, () => pg.query(`SELECT public.kids_parent_withdraw_consent('${id}')`));
  const before = (
    await pg.query(`SELECT withdrawn_at FROM public.kids_profile_consents WHERE profile_id='${id}'`)
  ).rows[0].withdrawn_at;
  await asUser(parent, () => pg.query(`SELECT public.kids_parent_withdraw_consent('${id}')`));
  const after = (
    await pg.query(`SELECT withdrawn_at FROM public.kids_profile_consents WHERE profile_id='${id}'`)
  ).rows[0].withdrawn_at;
  check(String(before) === String(after), "Repeated withdrawal preserves original timestamp");
  await pg.exec(
    "UPDATE public.kids_market_release SET accepts_child_data=true WHERE country_code='EG'",
  );
  await lesson(false);
  await denied(
    () =>
      asUser(parent, () =>
        pg.query(`UPDATE public.kids_profiles SET display_name='Changed' WHERE id='${id}'`),
      ),
    "Withdrawn profile cannot be updated",
  );
  await asUser(parent, () => pg.query(`DELETE FROM public.kids_profiles WHERE id='${id}'`));
  check(
    (await pg.query(`SELECT * FROM public.kids_profile_consents WHERE profile_id='${id}'`)).rows
      .length === 0,
    "Profile erasure cascades its child consent record",
  );
  console.log(
    "PASS: consent creation, immutable policy, guardian/country gates, isolation, limit, withdrawal and erasure",
  );
} finally {
  await pg.close();
}
