CREATE TABLE public.user_activity_time (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_seconds BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uat_select_own" ON public.user_activity_time
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "uat_insert_own" ON public.user_activity_time
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uat_update_own" ON public.user_activity_time
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_activity_time_updated_at
  BEFORE UPDATE ON public.user_activity_time
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic increment helper so concurrent tabs don't clobber each other
CREATE OR REPLACE FUNCTION public.increment_user_activity_time(p_seconds INTEGER)
RETURNS BIGINT
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