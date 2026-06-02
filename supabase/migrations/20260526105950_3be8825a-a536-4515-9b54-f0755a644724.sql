
-- ============================================================
-- 1. mission_submissions: lock admin-only columns via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_mission_submission_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Only block when invoked by a regular authenticated user.
  -- service_role bypasses RLS and is used for admin evaluation.
  IF auth.role() = 'authenticated' THEN
    IF NEW.score IS DISTINCT FROM OLD.score
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.evaluated_at IS DISTINCT FROM OLD.evaluated_at
       OR NEW.attempt_count IS DISTINCT FROM OLD.attempt_count THEN
      RAISE EXCEPTION 'Not allowed to modify admin-controlled columns';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_mission_submission_admin_cols ON public.mission_submissions;
CREATE TRIGGER trg_protect_mission_submission_admin_cols
BEFORE UPDATE ON public.mission_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_mission_submission_admin_columns();

-- Also block INSERT with pre-set score/status/feedback from the client.
CREATE OR REPLACE FUNCTION public.protect_mission_submission_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.score := NULL;
    NEW.feedback := NULL;
    NEW.status := 'draft';
    NEW.evaluated_at := NULL;
    NEW.attempt_count := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_mission_submission_insert ON public.mission_submissions;
CREATE TRIGGER trg_protect_mission_submission_insert
BEFORE INSERT ON public.mission_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_mission_submission_insert();

-- ============================================================
-- 2. user_streaks: remove client writes (record_user_activity handles it)
-- ============================================================
DROP POLICY IF EXISTS ustk_insert_own ON public.user_streaks;
DROP POLICY IF EXISTS ustk_update_own ON public.user_streaks;

-- ============================================================
-- 3. user_activity_time: remove client writes (RPC handles it)
-- ============================================================
DROP POLICY IF EXISTS uat_insert_own ON public.user_activity_time;
DROP POLICY IF EXISTS uat_update_own ON public.user_activity_time;

-- Make sure increment_user_activity_time runs as definer.
CREATE OR REPLACE FUNCTION public.increment_user_activity_time(p_seconds integer)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_seconds IS NULL OR p_seconds <= 0 OR p_seconds > 3600 THEN
    RAISE EXCEPTION 'Invalid seconds value';
  END IF;

  INSERT INTO public.user_activity_time (user_id, total_seconds)
  VALUES (v_user_id, p_seconds)
  ON CONFLICT (user_id)
  DO UPDATE SET total_seconds = public.user_activity_time.total_seconds + EXCLUDED.total_seconds,
                updated_at = now()
  RETURNING total_seconds INTO v_total;

  RETURN v_total;
END;
$$;

-- ============================================================
-- 4. lesson_progress + user_lesson_status: remove DELETE policies
-- ============================================================
DROP POLICY IF EXISTS "Users delete own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS uls_delete_own ON public.user_lesson_status;

-- Account-wipe RPC so the account page can still let users delete their data.
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
END;
$$;

-- ============================================================
-- 5. audio-assets storage bucket: restrict writes to admins
-- ============================================================
DROP POLICY IF EXISTS "audio_assets_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "audio_assets_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "audio_assets_admin_delete" ON storage.objects;

CREATE POLICY "audio_assets_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "audio_assets_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'audio-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "audio_assets_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-assets' AND public.has_role(auth.uid(), 'admin'));
