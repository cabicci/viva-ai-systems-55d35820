// Synthetic identities and isolated SQL dependencies; never a production connection.
import { readFileSync } from "node:fs";
export const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
export const child = "33333333-3333-4333-8333-333333333333",
  child2 = "44444444-4444-4444-8444-444444444444";
export const fixture = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA billing; CREATE SCHEMA learning_private;
GRANT USAGE ON SCHEMA learning_private TO authenticated;
CREATE FUNCTION learning_private.kids_journey(uuid,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$SELECT '{"completed":[1]}'::jsonb$$;
REVOKE ALL ON FUNCTION learning_private.kids_journey(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION learning_private.kids_journey(uuid,text) TO authenticated;
CREATE FUNCTION public.kids_journey(uuid,text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER AS $$SELECT learning_private.kids_journey($1,$2)$$;
CREATE TABLE auth.users(id uuid primary key);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated,service_role;
CREATE TABLE public.kids_profiles(id uuid primary key,parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,level_id text);
CREATE TABLE public.lesson_progress(user_id uuid,lesson_id text,status text);
CREATE TABLE public.lesson_notes(user_id uuid,lesson_id text,content text);
CREATE TABLE public.lesson_quiz_attempts(id uuid primary key default gen_random_uuid(),user_id uuid,lesson_id text,question_id text,selected_index int,is_correct boolean,bloom_level text);
CREATE TABLE public.mission_submissions(id uuid default gen_random_uuid(),user_id uuid,lesson_id text,mission_id text,submission_text text,score int,status text);
CREATE TABLE public.academic_progress(user_id uuid,course_id text,lesson_id text,read boolean,quiz_passed boolean,drafts jsonb);
CREATE TABLE public.academic_courses(id text,titles jsonb);
CREATE TABLE public.technical_progress(user_id uuid,lesson_id text,read boolean,quiz_passed boolean,drafts jsonb);
CREATE TABLE public.kids_lesson_progress(profile_id uuid REFERENCES kids_profiles(id) ON DELETE CASCADE,level_id text,lesson_number int,locale text);
CREATE TABLE public.journey_visits(user_id uuid,line text,course_id text,profile_id uuid,lesson_id text,locale text);
CREATE TABLE public.user_mission_state(user_id uuid,mission_id text,state text);
CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,source_sha256 text,payload jsonb);
CREATE TABLE public.technical_lesson_content(lesson_id text,locale text,source_sha256 text,payload jsonb);
CREATE TABLE billing.commercial_purchases(id uuid,user_id uuid,state text,kind text,area text,course text,child_id uuid,paid_at timestamptz);
CREATE FUNCTION billing.commercial_account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.blocked',true),'no')<>'yes'$$;
CREATE FUNCTION billing.commercial_lock(uuid) RETURNS void LANGUAGE plpgsql AS $$BEGIN PERFORM pg_advisory_xact_lock(hashtext($1::text)); END$$;
CREATE FUNCTION billing.commercial_require_service() RETURNS void LANGUAGE plpgsql AS $$BEGIN IF coalesce(current_setting('test.service',true),'no')<>'yes' THEN RAISE EXCEPTION 'SERVICE_ONLY'; END IF; END$$;
CREATE FUNCTION public.kids_parent_can_manage_profiles() RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
CREATE FUNCTION public.kids_profile_has_consent(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.consent',true),'yes')='yes'$$;
CREATE FUNCTION public.kids_can_access_lesson(uuid,text,int,text) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.access',true),'yes')='yes' AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=$1 AND parent_id=auth.uid())$$;
CREATE FUNCTION billing.assistant_content_allowed(uuid,text,text,text,text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.access',true),'yes')='yes'$$;
CREATE TABLE billing.test_sources(user_id uuid,area text,course text,child_id uuid,source_key text,anchor timestamptz,valid_until timestamptz);
CREATE FUNCTION billing.assistant_source_specs(uuid,text,text,uuid,timestamptz) RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units int,recurring boolean,per_lesson int) LANGUAGE sql AS $$SELECT source_key,anchor,valid_until,100,true,NULL::int FROM billing.test_sources WHERE user_id=$1 AND area=$2 AND course=$3 AND child_id IS NOT DISTINCT FROM $4 AND (valid_until IS NULL OR valid_until>$5)$$;
CREATE FUNCTION public.academic_command(text,text DEFAULT NULL,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',coalesce(current_setting('test.access',true),'yes')='yes','score',1,'total',2)$$;
CREATE FUNCTION public.technical_command(text,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',coalesce(current_setting('test.access',true),'yes')='yes','score',1,'total',2)$$;
INSERT INTO auth.users VALUES('${a}'),('${b}');
INSERT INTO kids_profiles VALUES('${child}','${a}','level-1'),('${child2}','${a}','level-2');
INSERT INTO lesson_notes VALUES('${a}','L1','existing personal note');
INSERT INTO lesson_progress VALUES('${a}','L1','completed');`;
export const month = readFileSync("drizzle/migrations/0027_commercial_policy_20261102.sql", "utf8");
export const monthFunction = month.slice(
  month.indexOf("CREATE FUNCTION billing.assistant_month_window("),
  month.indexOf(
    "--> statement-breakpoint",
    month.indexOf("CREATE FUNCTION billing.assistant_month_window("),
  ),
);
