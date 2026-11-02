import { readFileSync } from "node:fs";
const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const child = "33333333-3333-4333-8333-333333333333";
const child2 = "44444444-4444-4444-8444-444444444444";
const admin = "99999999-9999-4999-8999-999999999999";
const emailAccessSql = readFileSync(
  "scripts/email-access/email-access-candidate.sql",
  "utf8",
).replaceAll("\r\n", "\n");
const installedEmailFunction = (start: string, end: string) =>
  emailAccessSql.slice(
    emailAccessSql.indexOf(start),
    emailAccessSql.indexOf(end, emailAccessSql.indexOf(start)),
  );
export const commercialPolicyBaseline = `
 CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA auth; CREATE SCHEMA billing;
 CREATE TYPE public.app_role AS ENUM ('admin');
 CREATE TABLE auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,created_at timestamptz default now(),blocked boolean default false);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS $$SELECT $1='${admin}'::uuid$$;
 CREATE FUNCTION billing.is_service_role_caller() RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('fixture.service',true),'yes')='yes'$$;
 CREATE FUNCTION billing.commerce_account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=$1 AND NOT blocked)$$;
 CREATE FUNCTION billing.commerce_assert_identity(uuid) RETURNS text LANGUAGE plpgsql AS $$DECLARE e text; BEGIN SELECT email INTO e FROM auth.users WHERE id=$1 AND email_confirmed_at IS NOT NULL AND NOT blocked; IF e IS NULL THEN RAISE EXCEPTION 'IDENTITY'; END IF; RETURN e; END$$;
 CREATE TABLE billing.plan_catalog(id uuid primary key,plan_key text);
 CREATE TABLE billing.plan_versions(id uuid primary key,plan_id uuid);
 CREATE TABLE billing.subscriptions(id uuid primary key,user_id uuid,plan_version_id uuid,market_price_id uuid,access_state text,current_period_start timestamptz,current_period_end timestamptz,paid_activation_at timestamptz);
 CREATE FUNCTION billing.resolve_ai_assistant_limits(uuid) RETURNS TABLE(general_monthly_limit int,per_lesson_limit int) LANGUAGE sql AS $$SELECT 50,3$$;
 CREATE TABLE billing.academic_stripe_subscriptions(subscription_id text primary key,user_id uuid,price_id text,starts_at timestamptz,ends_at timestamptz,status text,refunded boolean default false);
 CREATE TABLE billing.academic_stripe_prices(gateway_price_id text primary key,course_id text,includes_assistant boolean);
 CREATE TABLE billing.entitlement_policy_versions(policy_key text,status text,effective_from timestamptz,effective_to timestamptz,assistant_runtime_general_monthly_quota int,assistant_runtime_per_lesson_quota int);
 INSERT INTO billing.entitlement_policy_versions VALUES('pro','published',now()-interval '1 year',NULL,50,3),('pro_plus','published',now()-interval '1 year',NULL,150,6);
 CREATE TABLE billing.technical_stripe_subscriptions(LIKE billing.academic_stripe_subscriptions INCLUDING ALL);
 CREATE TABLE public.kids_family_entitlements(parent_id uuid primary key,active_from timestamptz,active_until timestamptz);
 CREATE TABLE billing.gateway_customers(user_id uuid,stripe_environment text,gateway_code text,gateway_customer_id text);
 CREATE FUNCTION billing.stripe_gateway_code() RETURNS text LANGUAGE sql AS $$SELECT 'stripe_us_live'$$;
 CREATE TABLE billing.entitlement_usage(user_id uuid,usage_category text,period_start timestamptz,period_end timestamptz,used_count int,reserved_count int,lesson_id text);
 CREATE TABLE billing.ai_topup_purchases(id uuid,expires_at timestamptz NOT NULL);
 CREATE TABLE billing.ai_credit_ledger(id uuid default gen_random_uuid(),user_id uuid,entry_type text,credit_units int,balance_after int,source_type text,source_id uuid,expires_at timestamptz,idempotency_key text unique,occurred_at timestamptz,metadata jsonb default '{}');
 CREATE TABLE billing.commerce_lesson_catalog(lesson_id text primary key,path_id text);
 INSERT INTO billing.commerce_lesson_catalog VALUES('intro-m1-l1-what-is-ai','intro'),('business-m1-l2-paid','business');
 CREATE TABLE billing.commerce_control(access_enabled boolean); INSERT INTO billing.commerce_control VALUES(true);
 CREATE FUNCTION billing.commerce_quote(text,text,text,text,text,boolean DEFAULT false) RETURNS jsonb LANGUAGE sql AS $$SELECT '{"original_minor":30900,"final_minor":30900}'::jsonb$$;
 CREATE TABLE billing.commerce_entitlements(id uuid primary key,user_id uuid,package text,starts_at timestamptz,ends_at timestamptz,revoked_at timestamptz);
 CREATE TABLE public.kids_release_control(singleton boolean,lesson_access_enabled boolean,accepts_child_data boolean); INSERT INTO public.kids_release_control VALUES(true,true,true);
 CREATE TABLE public.kids_content_approvals(level_id text,lesson_number int,locale text);
 INSERT INTO public.kids_content_approvals VALUES('level-1',3,'ar-EG');
 CREATE TABLE public.kids_profiles(id uuid primary key,parent_id uuid,level_id text,display_name text);
 CREATE FUNCTION public.kids_parent_can_manage_profiles() RETURNS boolean LANGUAGE sql AS $$SELECT auth.uid() IS NOT NULL$$;
 CREATE FUNCTION public.kids_profile_has_consent(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=$1 AND parent_id=auth.uid())$$;
 CREATE TABLE public.technical_release_control(enabled boolean); INSERT INTO public.technical_release_control VALUES(true);
 CREATE TABLE public.technical_lesson_content(lesson_id text,locale text); INSERT INTO public.technical_lesson_content VALUES('M01-L02','ar-EG');
 CREATE TABLE public.academic_courses(id text primary key,titles jsonb,enabled boolean,assistant_enabled boolean,assistant_review_enabled boolean default false);
 INSERT INTO public.academic_courses(id,titles,enabled,assistant_enabled) VALUES('AC-BUS','{"en":"Business"}',true,true),('AC-OTHER','{"en":"Other"}',true,true);
 CREATE TABLE public.academic_assistant_policy(course_id text,runtime_enabled boolean);
 INSERT INTO public.academic_assistant_policy VALUES('AC-BUS',true),('AC-OTHER',true);
 CREATE FUNCTION public.academic_review_allowed(text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;
 CREATE FUNCTION public.assistant_card_content_access(uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('card_id',$2,'admin_review',false,'lessons','{}'::jsonb)$$;
 CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,approved boolean,introductory boolean);
 CREATE TABLE public.academic_content_course_grants(entitlement_id uuid,course_id text);
 CREATE TABLE public.academic_assistant_course_grants(entitlement_id uuid,course_id text);
 CREATE TABLE public.academic_assistant_questions(user_id uuid,course_id text,lesson_id text,created_at timestamptz);
 INSERT INTO public.academic_lesson_content VALUES('AC-BUS','L1','ar-EG',true,false),('AC-OTHER','L1','ar-EG',true,false);
 CREATE TABLE public.card_assistant_policy(area text,card_id text,questions_per_hour int,runtime_enabled boolean default true);
 INSERT INTO public.card_assistant_policy(area,card_id,questions_per_hour) VALUES('kids','level-1',20),('technical','furniture',20);
 CREATE TABLE public.card_assistant_steps(area text,card_id text,step_id text,source_key text,kids_level text,kids_lesson int,technical_lesson text);
 INSERT INTO public.card_assistant_steps VALUES('kids','level-1','3','level-1:3','level-1',3,NULL),('technical','furniture','step','M01-L02',NULL,NULL,'M01-L02');
 CREATE TABLE billing.email_access_grants(id uuid primary key default gen_random_uuid(),recipient_email text,scope_mode text,catalogues text[],duration_days int,user_id uuid,activated_at timestamptz,ends_at timestamptz,revoked_at timestamptz,created_at timestamptz default now(),created_by uuid,request_key uuid unique default gen_random_uuid(),parameters jsonb default '{}');
 CREATE TABLE billing.email_access_audit(id uuid primary key default gen_random_uuid(),grant_id uuid,actor uuid,action text,request_key uuid unique,details jsonb default '{}',created_at timestamptz default now());
 CREATE TABLE billing.email_access_mail(id uuid primary key,locale text,status text default 'pending',claim_token uuid,lease_until timestamptz,first_attempt_at timestamptz,attempts int default 0,provider_id text,created_at timestamptz default now());
 CREATE FUNCTION billing.email_access_catalogues() RETURNS jsonb LANGUAGE sql AS $$SELECT '[{"id":"ai:pro","title":"AI Pro","titles":{"ar-EG":"الذكاء الاصطناعي"}},{"id":"ai:pro_plus","title":"AI"},{"id":"academic:AC-BUS","title":"Business"},{"id":"academic:AC-OTHER","title":"Other"},{"id":"technical:furniture","title":"Technical"},{"id":"kids","title":"Kids"}]'::jsonb$$;
 ${installedEmailFunction("CREATE FUNCTION billing.email_access_has(", "CREATE FUNCTION billing.email_access_activate(")}
 CREATE FUNCTION billing.email_access_activate(p_user uuid) RETURNS integer LANGUAGE plpgsql AS $$DECLARE v_email text; g record; BEGIN SELECT email INTO v_email FROM auth.users WHERE id=p_user; FOR g IN SELECT * FROM billing.email_access_grants WHERE recipient_email=v_email AND user_id IS NULL AND revoked_at IS NULL ORDER BY id FOR UPDATE LOOP UPDATE billing.email_access_grants SET user_id=p_user,activated_at=now() WHERE id=g.id; END LOOP; RETURN 0; END$$;
 CREATE FUNCTION billing.evaluate_access(p_user_id uuid,p_resource_type text,p_resource_id text) RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',billing.commerce_account_allowed(p_user_id) AND (p_resource_id='intro-m1-l1-what-is-ai' OR EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=p_user_id AND current_period_end>now()) OR EXISTS(SELECT 1 FROM billing.email_access_grants WHERE user_id=p_user_id AND activated_at<=now() AND (ends_at IS NULL OR ends_at>now()) AND revoked_at IS NULL)))$$;
 CREATE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean LANGUAGE sql AS $$SELECT billing.commerce_account_allowed(auth.uid()) AND (EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions WHERE user_id=auth.uid() AND ends_at>now() AND NOT refunded) OR EXISTS(SELECT 1 FROM billing.email_access_grants WHERE user_id=auth.uid() AND activated_at<=now() AND (ends_at IS NULL OR ends_at>now()) AND revoked_at IS NULL AND (scope_mode='all_published' OR ('academic:'||p_course)=ANY(catalogues))))$$;
 CREATE FUNCTION public.technical_can_access(text) RETURNS boolean LANGUAGE sql AS $$SELECT billing.email_access_has(auth.uid(),'technical:furniture') OR EXISTS(SELECT 1 FROM billing.technical_stripe_subscriptions WHERE user_id=auth.uid() AND ends_at>now() AND NOT refunded)$$;
 CREATE FUNCTION public.kids_can_access_lesson(uuid,text,int,text) RETURNS boolean LANGUAGE sql AS $$SELECT public.kids_profile_has_consent($1) AND (billing.email_access_has(auth.uid(),'kids') OR EXISTS(SELECT 1 FROM public.kids_family_entitlements WHERE parent_id=auth.uid() AND active_until>now()))$$;
 ${installedEmailFunction("CREATE FUNCTION public.email_access_command(", "-- Compose with each existing access authority;")}
 ${installedEmailFunction("CREATE FUNCTION public.email_access_mail(", "CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(")}
 CREATE FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
 CREATE FUNCTION public.lc09_complete_financial_purge(uuid,uuid,boolean DEFAULT false) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${user}','one@example.invalid',now()-interval '5 days'),('${other}','two@example.invalid',now()),('${admin}','admin@example.invalid',now());
 INSERT INTO public.kids_profiles VALUES('${child}','${user}','level-1','Child one'),('${child2}','${user}','level-1','Child two');
 INSERT INTO billing.plan_catalog VALUES('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pro');
 INSERT INTO billing.plan_versions VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
`;
