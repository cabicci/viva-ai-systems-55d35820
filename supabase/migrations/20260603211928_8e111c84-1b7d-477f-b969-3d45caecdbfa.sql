-- Atomic submit: increment attempt_count + flip to 'submitted' in one statement.
-- Prevents TOCTOU race when two requests submit the same draft simultaneously.
CREATE OR REPLACE FUNCTION public.submit_mission_for_evaluation(p_submission_id uuid)
RETURNS public.mission_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.mission_submissions;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.mission_submissions
    SET status = 'submitted',
        submitted_at = now(),
        attempt_count = COALESCE(attempt_count, 0) + 1,
        updated_at = now()
  WHERE id = p_submission_id
    AND user_id = v_user
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or not owned by caller';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) TO authenticated;

-- Skip mission: marks the user's latest draft (or creates one) as passed with
-- skipped=true metadata. Idempotent: re-skip just updates timestamps.
CREATE OR REPLACE FUNCTION public.skip_mission_for_user(
  p_mission_id text,
  p_lesson_id text
)
RETURNS public.mission_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.mission_submissions;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_mission_id IS NULL OR length(p_mission_id) = 0 THEN
    RAISE EXCEPTION 'Invalid mission_id';
  END IF;

  -- Try to find latest existing submission for this mission.
  SELECT * INTO v_row
  FROM public.mission_submissions
  WHERE user_id = v_user AND mission_id = p_mission_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.mission_submissions
      SET status = 'passed',
          score = 0,
          feedback = 'تم تخطّي المهمة — تقدر ترجعلها وقت ما تحب.',
          evaluated_at = now(),
          submission_metadata = COALESCE(submission_metadata, '{}'::jsonb)
                                 || jsonb_build_object('skipped', true),
          updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.mission_submissions (
      user_id, mission_id, lesson_id, status, score,
      feedback, evaluated_at, submission_metadata
    ) VALUES (
      v_user, p_mission_id, p_lesson_id, 'passed', 0,
      'تم تخطّي المهمة — تقدر ترجعلها وقت ما تحب.',
      now(), jsonb_build_object('skipped', true)
    )
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.skip_mission_for_user(text, text) TO authenticated;