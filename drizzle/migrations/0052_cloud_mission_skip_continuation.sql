-- Intentional continuation is separate from educational assessment.
-- Existing protected-column triggers and caller permissions remain authoritative.
CREATE OR REPLACE FUNCTION public.skip_mission_for_user(p_mission_id text,p_lesson_id text)
RETURNS public.mission_submissions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid:=auth.uid(); v_row public.mission_submissions;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 IF p_mission_id IS NULL OR length(btrim(p_mission_id))=0 OR length(p_mission_id)>200
 OR p_lesson_id IS NULL OR length(btrim(p_lesson_id))=0 OR length(p_lesson_id)>200 THEN RAISE EXCEPTION 'Invalid mission/lesson'; END IF;
 -- Serializes only repeated skip RPCs; no evaluation-row mutation or claim lock.
 PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array('mission-skip',v_user,p_mission_id,p_lesson_id)::text,0));
 SELECT * INTO v_row FROM public.mission_submissions
 WHERE user_id=v_user AND mission_id=p_mission_id AND lesson_id=p_lesson_id
 AND status='passed' AND NOT (submission_metadata @> '{"skipped":true}'::jsonb)
 ORDER BY created_at DESC,id DESC LIMIT 1;
 IF FOUND THEN RETURN v_row; END IF;
 SELECT * INTO v_row FROM public.mission_submissions
 WHERE user_id=v_user AND mission_id=p_mission_id AND lesson_id=p_lesson_id
 AND submission_metadata @> '{"skipped":true}'::jsonb
 ORDER BY created_at DESC,id DESC LIMIT 1;
 IF FOUND THEN RETURN v_row; END IF;
 INSERT INTO public.mission_submissions(user_id,mission_id,lesson_id,submission_metadata)
 VALUES(v_user,p_mission_id,p_lesson_id,'{"skipped":true}'::jsonb) RETURNING * INTO v_row;
 RETURN v_row;
END $$;
REVOKE EXECUTE ON FUNCTION public.skip_mission_for_user(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.skip_mission_for_user(text,text) TO authenticated;

-- A continuation marker is never an attempt to submit or grade.
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
    AND NOT (submission_metadata @> '{"skipped":true}'::jsonb)
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or not owned by caller';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_mission_for_evaluation(uuid) TO authenticated;
