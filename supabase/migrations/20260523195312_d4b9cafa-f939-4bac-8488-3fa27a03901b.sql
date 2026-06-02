
CREATE TABLE public.user_active_device (
  user_id UUID PRIMARY KEY,
  device_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_active_device ENABLE ROW LEVEL SECURITY;

CREATE POLICY uad_select_own ON public.user_active_device
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY uad_insert_own ON public.user_active_device
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY uad_update_own ON public.user_active_device
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_active_device REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_active_device;

CREATE OR REPLACE FUNCTION public.claim_active_device(p_device_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_device_id IS NULL OR length(p_device_id) < 8 OR length(p_device_id) > 128 THEN
    RAISE EXCEPTION 'Invalid device id';
  END IF;
  INSERT INTO public.user_active_device (user_id, device_id, updated_at)
  VALUES (v_user, p_device_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET device_id = EXCLUDED.device_id, updated_at = now();
  RETURN p_device_id;
END;
$$;
