import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const pg = new PGlite();
const parent = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const unconfirmed = "33333333-3333-4333-8333-333333333333";
async function asUser(id, action) {
  await pg.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${id}'`);
  try { return await action(); }
  finally { await pg.exec("RESET ROLE; RESET request.jwt.claim.sub"); }
}
async function denied(action, reason) {
  try { await action(); } catch { return; }
  throw new Error(reason);
}
function check(condition, reason) { if (!condition) throw new Error(reason); }
try {
  await pg.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN;
    GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
    INSERT INTO auth.users VALUES
      ('${parent}','parent@example.test',now()),
      ('${other}','other@example.test',now()),
      ('${unconfirmed}','unconfirmed@example.test',null);
    CREATE TYPE public.app_role AS ENUM ('admin','user');
    CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
    CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
      AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles
        WHERE user_id=_user_id AND role=_role); $$;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
  `);
  for (const name of [
    "20260924190000_kids_parent_content_access_foundation.sql",
    "20260925120000_kids_parent_access_review.sql",
    "20260925140000_kids_market_release_gates.sql",
    "20260925160000_kids_family_profile_limit.sql",
    "20260925210000_kids_profile_consent.sql",
    "20260926130000_kids_public_launch_status.sql",
    "20260927110000_kids_parent_self_attestation.sql",
  ]) await pg.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));

  await denied(() => asUser(unconfirmed, () =>
    pg.query("SELECT public.kids_parent_request_review(true,'EG',true)")),
  "Unconfirmed account cannot start");
  await asUser(parent, () => pg.query("SELECT public.kids_parent_request_review(true,'EG',true)"));
  await denied(() => asUser(parent, () =>
    pg.query("SELECT public.kids_parent_confirm_privacy(null,true)")),
  "A policy must be specified");
  check((await asUser(parent, () => pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed"))).rows[0].allowed === false,
    "Closed service denies access");

  await pg.exec(readFileSync("supabase/migrations/20260927111000_kids_shared_parent_policy.sql", "utf8"));
  const count = (await pg.query("SELECT count(*)::int AS count FROM public.kids_consent_policies WHERE enabled")).rows[0].count;
  check(count === 88, "One common policy in four locales for 22 countries");
  const rows = (await pg.query("SELECT id,country_code,locale,notice_text FROM public.kids_consent_policies WHERE country_code IN ('EG','SA')")).rows;
  const eg = rows.find(row => row.country_code === "EG" && row.locale === "ar-EG").id;
  const sa = rows.find(row => row.country_code === "SA" && row.locale === "ar-EG").id;
  await denied(() => asUser(parent, () =>
    pg.query(`SELECT public.kids_parent_confirm_privacy('${eg}',false)`)),
  "Unchecked consent cannot activate");
  await denied(() => asUser(parent, () =>
    pg.query(`SELECT public.kids_parent_confirm_privacy('${sa}',true)`)),
  "Other country's policy cannot activate");
  await asUser(parent, () => pg.query(`SELECT public.kids_parent_confirm_privacy('${eg}',true)`));
  const attestation = (await pg.query(`SELECT policy_id,country_code FROM public.kids_parent_attestations WHERE parent_id='${parent}'`)).rows[0];
  check(attestation.policy_id === eg && attestation.country_code === "EG", "Attestation bound to parent, version and country");
  check((await asUser(parent, () => pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed"))).rows[0].allowed,
    "Parent can manage profiles after consent");
  await denied(() => asUser(other, () =>
    pg.query(`SELECT public.kids_parent_create_consented_profile('Other child','level-1','${eg}',true)`)),
  "Another parent cannot create without consent");
  await denied(() => asUser(parent, () =>
    pg.query(`SELECT public.kids_parent_create_consented_profile('Child','level-1','${sa}',true)`)),
  "Foreign policy cannot create profile");
  const created = await asUser(parent, () =>
    pg.query(`SELECT public.kids_parent_create_consented_profile('Child','level-1','${eg}',true) AS id`));
  const id = created.rows[0].id;
  const receipt = (await pg.query(`SELECT * FROM public.kids_profile_consents WHERE profile_id='${id}'`)).rows[0];
  check(receipt.policy_id === eg && receipt.guardian_reference === `self-attestation:${eg}`,
    "Child receipt binds initial parent consent");
  await pg.exec("INSERT INTO public.kids_content_approvals VALUES ('level-1',1,'ar-EG',now(),'test-content')");
  check((await asUser(parent, () => pg.query(`SELECT public.kids_can_access_lesson('${id}','level-1',1,'ar-EG') AS allowed`))).rows[0].allowed,
    "Free lesson opens after consent");
  await asUser(parent, () => pg.query(`SELECT public.kids_parent_withdraw_consent('${id}')`));
  check(!(await asUser(parent, () => pg.query(`SELECT public.kids_can_access_lesson('${id}','level-1',1,'ar-EG') AS allowed`))).rows[0].allowed,
    "Withdrawal closes child lessons");
  await pg.exec(`UPDATE public.kids_consent_policies SET enabled=false WHERE id='${eg}'`);
  check(!(await asUser(parent, () => pg.query("SELECT public.kids_parent_can_manage_profiles() AS allowed"))).rows[0].allowed,
    "Retired policy requires renewed parent consent");
  console.log("PASS: one parent checkbox, common policy, profile receipt, isolation, free lesson and withdrawal");
} finally { await pg.close(); }
