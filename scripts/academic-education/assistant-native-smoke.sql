-- Append inside the candidate transaction and ROLLBACK. No sends/provider calls.
CREATE TEMP TABLE academic_native_checks(name text PRIMARY KEY,passed boolean NOT NULL);
CREATE FUNCTION pg_temp.academic_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION 'ACADEMIC_TEST_FAILED:%',label; END IF;
INSERT INTO academic_native_checks VALUES(label,true); END $$;
CREATE FUNCTION pg_temp.academic_caller(id uuid,role_name text DEFAULT 'authenticated') RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 PERFORM set_config('request.jwt.claim.sub',id::text,true);
 PERFORM set_config('request.jwt.claim.role',role_name,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',id,'role',role_name)::text,true);
END $$;
DO $checks$
DECLARE a uuid; u uuid; mail text; q jsonb; base jsonb; data jsonb; ord jsonb; ent uuid; req uuid; result jsonb;
 ids text[]; i integer; j integer; expected integer; region text; span text; old_end timestamptz; old_start timestamptz;
BEGIN
 SELECT user_id INTO a FROM public.user_roles WHERE role='admin' AND billing.commerce_account_allowed(user_id) LIMIT 1;
 SELECT id,lower(email) INTO u,mail FROM auth.users au WHERE email_confirmed_at IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=au.id AND role='admin')
 AND billing.commerce_account_allowed(id)
 AND NOT EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=au.id AND access_state='suspended')
 LIMIT 1;
 IF a IS NULL OR u IS NULL THEN RAISE EXCEPTION 'ACADEMIC_TEST_IDENTITY_MISSING'; END IF;
 SELECT array_agg(lesson_id ORDER BY position) INTO ids FROM public.academic_lesson_content WHERE course_id='AC-BUS' AND locale='en' AND approved;
 PERFORM pg_temp.academic_assert(cardinality(ids)=40,'approved_40_english_lessons');
 UPDATE public.academic_assistant_policy SET runtime_enabled=true,sales_enabled=true WHERE course_id='AC-BUS';
 UPDATE public.academic_courses SET review_enabled=true,assistant_review_enabled=true,assistant_enabled=true WHERE id='AC-BUS';
 UPDATE billing.commerce_control SET enabled=true,access_enabled=true;
 UPDATE billing.commerce_methods SET enabled=true,destination='ROLLBACK TEST ONLY',instructions='ROLLBACK TEST ONLY',currencies=ARRAY['EGP'] WHERE code='instapay';
 PERFORM pg_temp.academic_caller(u);
 FOREACH region IN ARRAY ARRAY['EG','INTL'] LOOP
  FOREACH span IN ARRAY ARRAY['month','year'] LOOP
   base:=billing.academic_checkout_quote('academic',region,span,'',mail,false,false);
   q:=billing.academic_checkout_quote('academic',region,span,'',mail,false,true);
   expected:=CASE WHEN region='EG' THEN CASE WHEN span='month' THEN 5000 ELSE 60000 END ELSE CASE WHEN span='month' THEN 100 ELSE 1200 END END;
   PERFORM pg_temp.academic_assert((q->>'final_minor')::bigint-(base->>'final_minor')::bigint=expected,'surcharge_'||region||'_'||span);
  END LOOP;
 END LOOP;
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-BUS',ids[1],'en')='none','no_addon_no_access');
 data:=jsonb_build_object('package','academic','market','EG','billing_interval','month','code','','renewal',false,'method','instapay','key',gen_random_uuid()::text,'academicAssistant',true);
 ord:=public.commerce_command('create_order',data);
 PERFORM pg_temp.academic_assert(EXISTS(SELECT 1 FROM public.academic_assistant_purchases WHERE order_id=(ord->>'id')::uuid AND surcharge_minor=5000),'order_records_paid_addon');
 result:=public.commerce_command('create_order',data);
 PERFORM pg_temp.academic_assert(result->>'id'=ord->>'id','order_retry_idempotent');
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-BUS',ids[1],'en')='none','unpaid_addon_no_access');
 PERFORM pg_temp.academic_caller(a);
 PERFORM public.commerce_command('confirm',jsonb_build_object('key',gen_random_uuid()::text,'method','instapay','currency','EGP','amount_minor',(ord->>'final_minor')::bigint,
 'transaction_reference','rollback-academic-'||gen_random_uuid()::text,'received_at',now(),'funds_verified',true,
 'allocations',jsonb_build_array(jsonb_build_object('order_id',ord->>'id','amount_minor',(ord->>'final_minor')::bigint))));
 SELECT id,ends_at,starts_at INTO ent,old_end,old_start FROM billing.commerce_entitlements WHERE order_id=(ord->>'id')::uuid;
 PERFORM pg_temp.academic_assert(ent IS NOT NULL AND EXISTS(SELECT 1 FROM public.academic_content_course_grants b
 JOIN public.academic_assistant_course_grants x USING(entitlement_id,course_id) WHERE b.entitlement_id=ent AND b.course_id='AC-BUS'),'atomic_base_and_addon_binding');
 PERFORM pg_temp.academic_caller(u);
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-BUS',ids[2],'en')='learner','paid_addon_whole_course_access');
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-OTHER',ids[2],'en')='none'
 AND public.academic_assistant_access('AC-BUS',ids[2],'invalid')='none','cross_course_invalid_locale_denied');
 req:=gen_random_uuid();
 result:=public.academic_assistant_take_question('AC-BUS',ids[1],'en',req);
 PERFORM pg_temp.academic_assert((result->>'allowed')::boolean,'first_question');
 result:=public.academic_assistant_take_question('AC-BUS',ids[1],'en',req);
 PERFORM pg_temp.academic_assert(NOT (result->>'allowed')::boolean AND result->>'reason'='duplicate','duplicate_not_double_charged');
 FOR i IN 2..6 LOOP PERFORM public.academic_assistant_take_question('AC-BUS',ids[1],'en',gen_random_uuid()); END LOOP;
 result:=public.academic_assistant_take_question('AC-BUS',ids[1],'en',gen_random_uuid());
 PERFORM pg_temp.academic_assert(NOT (result->>'allowed')::boolean,'six_per_lesson_limit');
 FOR i IN 2..25 LOOP
  FOR j IN 1..6 LOOP
   result:=public.academic_assistant_take_question('AC-BUS',ids[i],'en',gen_random_uuid());
   IF NOT (result->>'allowed')::boolean THEN RAISE EXCEPTION 'MONTH_QUOTA_PREMATURE'; END IF;
  END LOOP;
 END LOOP;
 result:=public.academic_assistant_take_question('AC-BUS',ids[26],'en',gen_random_uuid());
 PERFORM pg_temp.academic_assert(NOT (result->>'allowed')::boolean
 AND (SELECT count(*) FROM public.academic_assistant_questions WHERE user_id=u)=150,'150_monthly_limit');
 UPDATE public.academic_assistant_questions SET period_key=to_char((now() AT TIME ZONE 'UTC')-interval '1 month','YYYY-MM') WHERE user_id=u;
 result:=public.academic_assistant_take_question('AC-BUS',ids[1],'en',gen_random_uuid());
 PERFORM pg_temp.academic_assert((result->>'allowed')::boolean,'calendar_month_reset');
 UPDATE billing.commerce_entitlements SET revoked_at=now() WHERE id=ent;
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-BUS',ids[1],'en')='none','entitlement_revocation');
 UPDATE billing.commerce_entitlements SET revoked_at=NULL,starts_at=now()-interval '2 months',ends_at=now()-interval '1 second' WHERE id=ent;
 PERFORM pg_temp.academic_assert(public.academic_assistant_access('AC-BUS',ids[1],'en')='none','entitlement_expiry');
 UPDATE billing.commerce_entitlements SET starts_at=old_start,ends_at=old_end WHERE id=ent;
 PERFORM pg_temp.academic_caller(a);
 FOR i IN 1..10 LOOP
  result:=public.academic_assistant_take_question('AC-BUS',ids[1],'en',gen_random_uuid());
  IF NOT (result->>'allowed')::boolean OR result->>'mode'<>'admin' THEN RAISE EXCEPTION 'ADMIN_QUOTA'; END IF;
 END LOOP;
 PERFORM pg_temp.academic_assert(NOT EXISTS(SELECT 1 FROM public.academic_assistant_questions WHERE user_id=a),'admin_unlimited_no_learner_counter');
END $checks$;
SELECT * FROM academic_native_checks ORDER BY name;

