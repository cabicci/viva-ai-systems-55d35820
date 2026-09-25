import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const pg = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rows = async (sql, args=[]) => (await pg.query(sql,args)).rows;
try {
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE SCHEMA billing;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
    CREATE TABLE billing.plan_catalog(id uuid PRIMARY KEY,plan_key text);
    CREATE TABLE billing.plan_versions(id uuid PRIMARY KEY,plan_id uuid);
    CREATE TABLE billing.subscriptions(id uuid PRIMARY KEY,user_id uuid,plan_version_id uuid,access_state text);
    CREATE TABLE billing.subscription_events(id uuid PRIMARY KEY,subscription_id uuid,event_type text,source text,processing_status text,to_access_state text,from_access_state text);
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
    INSERT INTO auth.users VALUES('${id(1)}','old@example.test',now(),'{}');`);
  await pg.exec(readFileSync('supabase/migrations/20260925220000_account_welcome_email.sql','utf8'));
  await pg.exec(`INSERT INTO public.account_welcome_outbox(user_id,recipient) VALUES ('${id(1)}','old@example.test');`);
  await pg.exec(readFileSync('supabase/migrations/20260925230000_branded_account_mail.sql','utf8'));
  assert.equal((await rows(`SELECT template_version FROM public.account_welcome_outbox WHERE user_id='${id(1)}'`))[0].template_version,1);
  await pg.query(`INSERT INTO auth.users VALUES($1,'new@example.test',now(),$2)`,[id(2),{full_name:'خليل',preferred_locale:'ar-MSA'}]);
  const [branded] = await rows(`SELECT * FROM public.account_welcome_outbox WHERE user_id='${id(2)}'`);
  assert.equal(branded.template_version,2);
  assert.equal(branded.display_name,'خليل');
  assert.equal(branded.preferred_locale,'ar-MSA');
  for (const role of ['anon','authenticated']) {
    await pg.exec(`SET ROLE ${role}`);
    await assert.rejects(pg.query('SELECT * FROM public.subscription_mail_outbox'));
    await assert.rejects(pg.query('SELECT * FROM public.claim_subscription_mail()'));
    await pg.exec('RESET ROLE');
  }
  await pg.exec(`INSERT INTO billing.plan_catalog VALUES ('${id(10)}','pro_plus');
    INSERT INTO billing.plan_versions VALUES ('${id(11)}','${id(10)}');
    INSERT INTO billing.subscriptions VALUES ('${id(12)}','${id(2)}','${id(11)}','paid_active');
    INSERT INTO billing.subscription_events VALUES ('${id(20)}','${id(12)}','payment_succeeded','gateway_webhook','stale','paid_active','free_active');
    INSERT INTO billing.subscription_events VALUES ('${id(21)}','${id(12)}','payment_succeeded','gateway_webhook','applied','paid_active','free_active');
    INSERT INTO billing.subscription_events VALUES ('${id(22)}','${id(12)}','payment_succeeded','gateway_webhook','applied','paid_active','paid_active');`);
  assert.deepEqual((await rows('SELECT kind FROM public.subscription_mail_outbox ORDER BY event_id')).map(r=>r.kind),['activated','renewed']);
  await pg.exec('SET ROLE service_role');
  const claims=await rows('SELECT * FROM public.claim_subscription_mail()');
  assert.equal(claims.length,2);
  assert.equal(claims[0].plan_key,'pro_plus');
  assert.equal((await rows('SELECT * FROM public.claim_subscription_mail()')).length,0);
  assert.equal((await rows('SELECT public.complete_subscription_mail($1,$2,$3,false) AS ok',[claims[0].event_id,claims[1].claim_token,'provider']))[0].ok,false);
  assert.equal((await rows('SELECT public.complete_subscription_mail($1,$2,$3,false) AS ok',[claims[0].event_id,claims[0].claim_token,'provider']))[0].ok,true);
  console.log('PASS: legacy v1 stable, v2 personalized, only applied payments, renewed vs activated, RLS, lease and completion token');
} finally { await pg.close(); }
