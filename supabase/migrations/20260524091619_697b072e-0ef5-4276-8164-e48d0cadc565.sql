-- =====================================================
-- 1) user_subscriptions
-- =====================================================
CREATE TABLE public.user_subscriptions (
  user_id UUID PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
  status TEXT,
  current_period_end TIMESTAMPTZ,
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY us_select_own ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY us_insert_own ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY us_update_own ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_subscriptions_set_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2) user_streaks
-- =====================================================
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY ustk_select_own ON public.user_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ustk_insert_own ON public.user_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ustk_update_own ON public.user_streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_streaks_set_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3) record_user_activity() — atomic streak update
-- Returns: jsonb { current_streak, longest_streak, last_activity_date }
-- =====================================================
CREATE OR REPLACE FUNCTION public.record_user_activity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'UTC')::date;
  v_last DATE;
  v_cur INT;
  v_long INT;
  v_new_cur INT;
  v_new_long INT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT last_activity_date, current_streak, longest_streak
    INTO v_last, v_cur, v_long
  FROM public.user_streaks
  WHERE user_id = v_user;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks(user_id, current_streak, longest_streak, last_activity_date)
    VALUES (v_user, 1, 1, v_today);
    RETURN jsonb_build_object('current_streak', 1, 'longest_streak', 1, 'last_activity_date', v_today);
  END IF;

  IF v_last = v_today THEN
    v_new_cur := v_cur;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    v_new_cur := v_cur + 1;
  ELSE
    v_new_cur := 1;
  END IF;
  v_new_long := GREATEST(v_long, v_new_cur);

  UPDATE public.user_streaks
    SET current_streak = v_new_cur,
        longest_streak = v_new_long,
        last_activity_date = v_today,
        updated_at = now()
  WHERE user_id = v_user;

  RETURN jsonb_build_object('current_streak', v_new_cur, 'longest_streak', v_new_long, 'last_activity_date', v_today);
END;
$$;