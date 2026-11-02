-- Reviewed verification for the existing Lovable native Drizzle runner.
-- No transaction envelope, feature reimplementation, grants or learner writes.
-- The tool requires one new entry; 0031 runs first and these checks run after
-- it in the SAME native transaction. Any failure rolls both entries back.
DO $student_learning_native_postcondition$
DECLARE relation_name text; relation_oid oid; routine_name text; expected_facts bigint; actual_facts bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM drizzle.__drizzle_migrations WHERE id=41 AND created_at=1793637445947
  AND hash='d314396b20c29c3e356cc0cade7fdf4ed84f59dffb7d2f37a6f9958a3bc97110')
 OR (SELECT count(*) FROM drizzle.__drizzle_migrations WHERE created_at=1793650000000
  AND hash='a29fb5acb60633abdb4ba6b28bf91ea2c0e9f1ed7b0db9e83bb381c33725cc3d')<>1 THEN
  RAISE EXCEPTION 'LEARNING_NATIVE_JOURNAL_MISMATCH';
 END IF;
 FOREACH relation_name IN ARRAY ARRAY['courses','events','notes','content_versions','positions','note_revisions','enrollments','commands','reports','sharing','course_models'] LOOP
  relation_oid:=to_regclass('learning_private.'||relation_name);
  IF relation_oid IS NULL OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid=relation_oid AND relrowsecurity)
   OR has_table_privilege('anon',relation_oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   OR has_table_privilege('authenticated',relation_oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
   RAISE EXCEPTION 'LEARNING_PRIVATE_TABLE_ACL_MISMATCH: %',relation_name;
  END IF;
 END LOOP;
 FOREACH routine_name IN ARRAY ARRAY['public.learning_command(text,jsonb)','public.learning_reports(text,jsonb)'] LOOP
  IF to_regprocedure(routine_name) IS NULL OR NOT has_function_privilege('authenticated',routine_name,'EXECUTE')
   OR has_function_privilege('anon',routine_name,'EXECUTE') THEN RAISE EXCEPTION 'LEARNING_OWNER_RPC_ACL_MISMATCH: %',routine_name; END IF;
 END LOOP;
 FOREACH routine_name IN ARRAY ARRAY['public.finish_learning_report(uuid,uuid,uuid,jsonb)',
  'public.store_learning_content_version(uuid,text,text,text,jsonb)',
  'public.record_learning_assessment(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,jsonb,text)'] LOOP
  IF to_regprocedure(routine_name) IS NULL OR NOT has_function_privilege('service_role',routine_name,'EXECUTE')
   OR has_function_privilege('anon',routine_name,'EXECUTE') OR has_function_privilege('authenticated',routine_name,'EXECUTE') THEN
   RAISE EXCEPTION 'LEARNING_SERVICE_RPC_ACL_MISMATCH: %',routine_name;
  END IF;
 END LOOP;
 IF NOT has_schema_privilege('authenticated','learning_private','USAGE')
 OR NOT has_function_privilege('authenticated','learning_private.kids_journey(uuid,text)','EXECUTE') THEN
  RAISE EXCEPTION 'LEARNING_EXISTING_KIDS_BRIDGE_CHANGED';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='learning_private'
   AND p.proname IN ('require_owner','record','capture','keep_mission_completed','capture_content','capture_note_revision','model_immutable','event_model_version','can_write','erase_account','child_consented','report_sources')
   AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN
  RAISE EXCEPTION 'LEARNING_PRIVATE_ROUTINE_EXPOSED';
 END IF;
 IF EXISTS(SELECT 1 FROM learning_private.courses c LEFT JOIN auth.users u ON u.id=c.account_id
  LEFT JOIN public.kids_profiles p ON p.id=c.profile_id WHERE u.id IS NULL OR
  (c.area='kids' AND (c.profile_id IS NULL OR p.parent_id<>c.account_id OR c.subject_id<>c.profile_id))) THEN
  RAISE EXCEPTION 'LEARNING_RECORD_OWNER_MISMATCH';
 END IF;
 FOREACH relation_name IN ARRAY ARRAY['courses','commands','reports'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint x WHERE x.conrelid=to_regclass('learning_private.'||relation_name)
    AND x.confrelid='auth.users'::regclass AND x.contype='f' AND x.confdeltype='c') THEN
   RAISE EXCEPTION 'LEARNING_ERASURE_CASCADE_MISSING: %',relation_name;
  END IF;
 END LOOP;
 FOREACH relation_name IN ARRAY ARRAY['events','notes','note_revisions','positions','enrollments','sharing'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint x WHERE x.conrelid=to_regclass('learning_private.'||relation_name)
    AND x.confrelid='learning_private.courses'::regclass AND x.contype='f' AND x.confdeltype='c') THEN
   RAISE EXCEPTION 'LEARNING_COURSE_CASCADE_MISSING: %',relation_name;
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.lesson_notes x JOIN auth.users u ON u.id=x.user_id
  WHERE billing.commercial_account_allowed(u.id) AND NOT EXISTS(SELECT 1 FROM learning_private.courses c JOIN learning_private.notes n ON n.record_id=c.id
   WHERE c.account_id=x.user_id AND c.area='ai' AND c.course='ai' AND n.lesson=x.lesson_id AND n.content=x.content)) THEN
  RAISE EXCEPTION 'LEARNING_EXISTING_NOTE_NOT_PRESERVED';
 END IF;
 SELECT sum(n) INTO expected_facts FROM (
  SELECT count(*) n FROM public.lesson_progress x JOIN auth.users u ON u.id=x.user_id WHERE x.lesson_id IS NOT NULL AND billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.lesson_quiz_attempts x JOIN auth.users u ON u.id=x.user_id WHERE x.lesson_id IS NOT NULL AND billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.mission_submissions x JOIN auth.users u ON u.id=x.user_id WHERE coalesce(x.lesson_id,x.mission_id) IS NOT NULL AND billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.academic_progress x JOIN auth.users u ON u.id=x.user_id WHERE x.lesson_id IS NOT NULL AND billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.technical_progress x JOIN auth.users u ON u.id=x.user_id WHERE x.lesson_id IS NOT NULL AND billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.kids_lesson_progress x JOIN public.kids_profiles p ON p.id=x.profile_id JOIN auth.users u ON u.id=p.parent_id WHERE billing.commercial_account_allowed(u.id)
  UNION ALL SELECT count(*) FROM public.journey_visits x JOIN auth.users u ON u.id=x.user_id WHERE x.lesson_id IS NOT NULL AND billing.commercial_account_allowed(u.id)
 ) counts;
 SELECT count(*) INTO actual_facts FROM learning_private.events WHERE kind='existing_fact';
 IF expected_facts<>actual_facts THEN RAISE EXCEPTION 'LEARNING_EXISTING_FACT_COUNT_MISMATCH: expected %, actual %',expected_facts,actual_facts; END IF;
 IF NOT EXISTS(SELECT 1 FROM learning_private.course_models WHERE area='ai' AND course='ai' AND is_current AND 'notes'=ANY(activities) AND 'mission'=ANY(activities))
 OR EXISTS(SELECT 1 FROM public.academic_courses a WHERE NOT EXISTS(SELECT 1 FROM learning_private.course_models m WHERE m.area='academic' AND m.course=a.id AND m.is_current)) THEN
  RAISE EXCEPTION 'LEARNING_COURSE_MODELS_MISSING';
 END IF;
END $student_learning_native_postcondition$;
