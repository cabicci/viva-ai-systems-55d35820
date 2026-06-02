CREATE OR REPLACE FUNCTION public.increment_user_activity_time(p_seconds INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER
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