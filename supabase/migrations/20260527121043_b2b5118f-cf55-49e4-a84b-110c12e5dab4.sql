CREATE TABLE IF NOT EXISTS public.client_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  scope text NOT NULL DEFAULT 'unknown',
  message text NOT NULL,
  stack text,
  url text,
  user_agent text,
  release text,
  extra jsonb
);

CREATE INDEX IF NOT EXISTS client_error_logs_created_at_idx
  ON public.client_error_logs (created_at DESC);

GRANT INSERT ON public.client_error_logs TO anon, authenticated;
GRANT SELECT ON public.client_error_logs TO authenticated;
GRANT ALL ON public.client_error_logs TO service_role;

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert error logs"
  ON public.client_error_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admins can read error logs"
  ON public.client_error_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));