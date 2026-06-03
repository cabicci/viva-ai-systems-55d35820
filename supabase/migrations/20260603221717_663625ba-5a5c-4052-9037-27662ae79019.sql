
-- 1) has_role: prevent admin enumeration
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow checking your own role, unless caller is admin (or service role / trigger context with no auth.uid()).
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> _user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role = 'admin'::app_role
     )
  THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

-- 2) submit_mission_for_evaluation: status guard
CREATE OR REPLACE FUNCTION public.submit_mission_for_evaluation(p_submission_id uuid)
RETURNS mission_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_row public.mission_submissions;
  v_status mission_submission_status;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status INTO v_status
  FROM public.mission_submissions
  WHERE id = p_submission_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or not owned by caller';
  END IF;

  IF v_status NOT IN ('draft', 'needs_revision', 'failed') THEN
    RAISE EXCEPTION 'Cannot submit: current status is %', v_status;
  END IF;

  UPDATE public.mission_submissions
    SET status = 'submitted',
        submitted_at = now(),
        attempt_count = COALESCE(attempt_count, 0) + 1,
        updated_at = now()
  WHERE id = p_submission_id
    AND user_id = v_user
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

-- 3) Revoke unneeded SELECT grant on client_error_logs from authenticated
REVOKE SELECT ON public.client_error_logs FROM authenticated;
