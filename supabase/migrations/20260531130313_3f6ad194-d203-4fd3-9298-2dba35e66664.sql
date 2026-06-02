
-- C4: Lock roadmap_items to admin reads only
DROP POLICY IF EXISTS "roadmap_select_authenticated" ON public.roadmap_items;
CREATE POLICY "roadmap_select_admin"
  ON public.roadmap_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- C3/M8: client_error_logs — restrict inserts + add length constraints
DROP POLICY IF EXISTS "anyone can insert error logs" ON public.client_error_logs;

CREATE POLICY "anon can insert anonymous error logs"
  ON public.client_error_logs FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "authenticated can insert own error logs"
  ON public.client_error_logs FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

ALTER TABLE public.client_error_logs
  DROP CONSTRAINT IF EXISTS client_error_logs_message_len_chk;
ALTER TABLE public.client_error_logs
  ADD CONSTRAINT client_error_logs_message_len_chk
  CHECK (char_length(message) <= 2000);

ALTER TABLE public.client_error_logs
  DROP CONSTRAINT IF EXISTS client_error_logs_stack_len_chk;
ALTER TABLE public.client_error_logs
  ADD CONSTRAINT client_error_logs_stack_len_chk
  CHECK (stack IS NULL OR char_length(stack) <= 10000);

ALTER TABLE public.client_error_logs
  DROP CONSTRAINT IF EXISTS client_error_logs_url_len_chk;
ALTER TABLE public.client_error_logs
  ADD CONSTRAINT client_error_logs_url_len_chk
  CHECK (url IS NULL OR char_length(url) <= 2000);

ALTER TABLE public.client_error_logs
  DROP CONSTRAINT IF EXISTS client_error_logs_scope_len_chk;
ALTER TABLE public.client_error_logs
  ADD CONSTRAINT client_error_logs_scope_len_chk
  CHECK (char_length(scope) <= 120);
