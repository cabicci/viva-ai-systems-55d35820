-- Launch Blockers Batch A: extend GDPR account wipe to all user-owned public tables.
CREATE OR REPLACE FUNCTION public.delete_my_account_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.user_subscriptions WHERE user_id = v_user;
  DELETE FROM public.lesson_progress WHERE user_id = v_user;
  DELETE FROM public.user_lesson_status WHERE user_id = v_user;
  DELETE FROM public.user_mission_state WHERE user_id = v_user;
  DELETE FROM public.mission_submissions WHERE user_id = v_user;
  DELETE FROM public.lesson_notes WHERE user_id = v_user;
  DELETE FROM public.lesson_quiz_attempts WHERE user_id = v_user;
  DELETE FROM public.build_logs WHERE user_id = v_user;
  DELETE FROM public.user_streaks WHERE user_id = v_user;
  DELETE FROM public.user_activity_time WHERE user_id = v_user;
  DELETE FROM public.user_active_device WHERE user_id = v_user;

  -- Added in Batch A (were missing from the original wipe RPC).
  DELETE FROM public.learner_events WHERE user_id = v_user;
  DELETE FROM public.learner_triage WHERE user_id = v_user;
  DELETE FROM public.lesson_feedback WHERE user_id = v_user;
  DELETE FROM public.lesson_review_schedule WHERE user_id = v_user;
  DELETE FROM public.rate_limit_buckets WHERE user_id = v_user;
  DELETE FROM public.shadow_watchlist WHERE user_id = v_user;
  DELETE FROM public.user_shadow_events WHERE user_id = v_user;
  DELETE FROM public.user_validation_sessions WHERE user_id = v_user;
  DELETE FROM public.client_error_logs WHERE user_id = v_user;
  DELETE FROM public.user_roles WHERE user_id = v_user;
  DELETE FROM public.v9_apply_decisions WHERE decided_by = v_user;
END;
$$;
