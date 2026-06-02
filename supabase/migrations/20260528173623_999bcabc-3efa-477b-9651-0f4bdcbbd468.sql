
-- Rate limiting buckets (per user + endpoint key)
CREATE TABLE public.rate_limit_buckets (
  user_id UUID NOT NULL,
  bucket_key TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bucket_key)
);

-- No anon, no authenticated grants — only service_role writes via the
-- security-definer function below. RLS enabled with no policies = locked.
GRANT ALL ON public.rate_limit_buckets TO service_role;

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Atomic check-and-increment. Returns (allowed, remaining, reset_at).
-- If the existing window has expired, it resets to a new window starting now.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_user_id UUID,
  p_bucket_key TEXT,
  p_max_calls INTEGER,
  p_window_seconds INTEGER
) RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_bucket_key IS NULL
     OR p_max_calls <= 0 OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit arguments';
  END IF;

  INSERT INTO public.rate_limit_buckets (user_id, bucket_key, window_started_at, count, updated_at)
  VALUES (p_user_id, p_bucket_key, v_now, 0, v_now)
  ON CONFLICT (user_id, bucket_key) DO NOTHING;

  SELECT window_started_at, count
    INTO v_window_start, v_count
  FROM public.rate_limit_buckets
  WHERE user_id = p_user_id AND bucket_key = p_bucket_key
  FOR UPDATE;

  -- Reset window if expired
  IF v_window_start + make_interval(secs => p_window_seconds) <= v_now THEN
    v_window_start := v_now;
    v_count := 0;
  END IF;

  IF v_count >= p_max_calls THEN
    UPDATE public.rate_limit_buckets
      SET window_started_at = v_window_start,
          count = v_count,
          updated_at = v_now
      WHERE user_id = p_user_id AND bucket_key = p_bucket_key;
    RETURN QUERY SELECT FALSE, 0, v_window_start + make_interval(secs => p_window_seconds);
    RETURN;
  END IF;

  v_count := v_count + 1;
  UPDATE public.rate_limit_buckets
    SET window_started_at = v_window_start,
        count = v_count,
        updated_at = v_now
    WHERE user_id = p_user_id AND bucket_key = p_bucket_key;

  RETURN QUERY SELECT TRUE, (p_max_calls - v_count), v_window_start + make_interval(secs => p_window_seconds);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO service_role;
