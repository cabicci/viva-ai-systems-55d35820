-- REVIEW ONLY. Requires the installed assistant-native contract. No new user
-- tables or commercial quota changes. Review periods are separate ledger keys.
BEGIN;
CREATE OR REPLACE FUNCTION public.academic_assistant_take_question(p_course text,p_lesson text,p_locale text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mode text; period text:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM'); total_limit integer;
 lesson_limit integer; count_total integer; count_lesson integer; policies integer;
BEGIN
 IF auth.uid() IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','access'); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||auth.uid()::text,0));
 mode:=public.academic_assistant_access(p_course,p_lesson,p_locale);
 IF mode IS NULL OR mode NOT IN ('admin','learner') OR p_request IS NULL THEN
  RETURN jsonb_build_object('allowed',false,'reason','access');
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('academic-questions:'||auth.uid()::text||':'||p_course,0));
 IF EXISTS(SELECT 1 FROM public.academic_assistant_questions WHERE user_id=auth.uid() AND course_id=p_course AND request_id=p_request) THEN
  RETURN jsonb_build_object('allowed',false,'reason','duplicate');
 END IF;
 IF mode='admin' THEN
  -- Account lifecycle lock serializes review requests across every card. The
  -- operational ceiling is independent of all purchased/learner quota periods.
  SELECT count(*) INTO count_total FROM public.academic_assistant_questions
   WHERE user_id=auth.uid() AND period_key LIKE 'review:%' AND created_at>now()-interval '1 hour';
  IF count_total>=30 THEN RETURN jsonb_build_object('allowed',false,'reason','review_rate'); END IF;
  INSERT INTO public.academic_assistant_questions(user_id,course_id,request_id,lesson_id,locale,period_key)
   VALUES(auth.uid(),p_course,p_request,p_lesson,p_locale,'review:'||period);
  RETURN jsonb_build_object('allowed',true,'mode','admin');
 END IF;
 SELECT count(*),min(assistant_runtime_general_monthly_quota),min(assistant_runtime_per_lesson_quota)
 INTO policies,total_limit,lesson_limit FROM billing.entitlement_policy_versions
 WHERE policy_key='pro_plus' AND status='published' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now());
 IF policies<>1 OR coalesce(total_limit,0)<=0 OR coalesce(lesson_limit,0)<=0 THEN RAISE EXCEPTION 'ACADEMIC_QUOTA_POLICY_UNAVAILABLE'; END IF;
 SELECT count(*),count(*) FILTER(WHERE lesson_id=p_lesson) INTO count_total,count_lesson
 FROM public.academic_assistant_questions WHERE user_id=auth.uid() AND course_id=p_course AND period_key=period;
 IF count_total>=total_limit OR count_lesson>=lesson_limit THEN RETURN jsonb_build_object('allowed',false,'reason','quota'); END IF;
 INSERT INTO public.academic_assistant_questions(user_id,course_id,request_id,lesson_id,locale,period_key)
 VALUES(auth.uid(),p_course,p_request,p_lesson,p_locale,period);
 RETURN jsonb_build_object('allowed',true,'mode','learner','remaining_month',total_limit-count_total-1,'remaining_lesson',lesson_limit-count_lesson-1);
END $$;
REVOKE ALL ON FUNCTION public.academic_assistant_take_question(text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_assistant_take_question(text,text,text,uuid) TO authenticated;
COMMIT;
