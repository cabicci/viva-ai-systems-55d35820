-- ============================================================
-- Spaced Repetition Engine (FSRS-lite / SM-2 inspired)
-- ============================================================

CREATE TABLE public.lesson_review_schedule (
  user_id          UUID NOT NULL,
  lesson_id        TEXT NOT NULL,
  interval_days    INTEGER NOT NULL DEFAULT 1,
  ease             REAL NOT NULL DEFAULT 2.5,
  lapses           INTEGER NOT NULL DEFAULT 0,
  reviews          INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 day'),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX idx_review_schedule_due
  ON public.lesson_review_schedule (user_id, next_review_at);

GRANT SELECT ON public.lesson_review_schedule TO authenticated;
GRANT ALL    ON public.lesson_review_schedule TO service_role;

ALTER TABLE public.lesson_review_schedule ENABLE ROW LEVEL SECURITY;

-- Users can read their own schedule; writes happen via SECURITY DEFINER trigger only.
CREATE POLICY lrs_select_own
  ON public.lesson_review_schedule
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_lesson_review_schedule_updated_at
  BEFORE UPDATE ON public.lesson_review_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Core scheduling function (SM-2 lite)
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_review_outcome(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_passed    BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTEGER;
  v_ease     REAL;
  v_lapses   INTEGER;
  v_reviews  INTEGER;
  v_new_interval INTEGER;
  v_new_ease     REAL;
BEGIN
  IF p_user_id IS NULL OR p_lesson_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.lesson_review_schedule (user_id, lesson_id)
  VALUES (p_user_id, p_lesson_id)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  SELECT interval_days, ease, lapses, reviews
    INTO v_interval, v_ease, v_lapses, v_reviews
  FROM public.lesson_review_schedule
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
  FOR UPDATE;

  IF p_passed THEN
    -- Standard ladder: 1 → 3 → 7 → round(interval * ease)
    IF v_reviews = 0 THEN
      v_new_interval := 1;
    ELSIF v_reviews = 1 THEN
      v_new_interval := 3;
    ELSIF v_reviews = 2 THEN
      v_new_interval := 7;
    ELSE
      v_new_interval := GREATEST(1, LEAST(180, ROUND(v_interval * v_ease)::INT));
    END IF;
    v_new_ease := LEAST(3.0, v_ease + 0.05);

    UPDATE public.lesson_review_schedule
      SET interval_days    = v_new_interval,
          ease             = v_new_ease,
          reviews          = v_reviews + 1,
          last_reviewed_at = now(),
          next_review_at   = now() + make_interval(days => v_new_interval),
          updated_at       = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
  ELSE
    -- Lapse: reset interval, drop ease (min 1.3), increment lapse counter
    v_new_ease := GREATEST(1.3, v_ease - 0.2);
    UPDATE public.lesson_review_schedule
      SET interval_days    = 1,
          ease             = v_new_ease,
          lapses           = v_lapses + 1,
          last_reviewed_at = now(),
          next_review_at   = now() + INTERVAL '1 day',
          updated_at       = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
  END IF;
END;
$$;

-- ============================================================
-- Trigger on quiz attempts:
-- After each insert, look at all attempts in the last 10 minutes
-- on the same (user, lesson). If ≥70% correct → passed, else lapse.
-- Only fires on the FIRST attempt of each "session" to avoid
-- repeated rescheduling within a single review sitting.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_quiz_attempt_for_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total   INT;
  v_correct INT;
  v_window  TIMESTAMPTZ := now() - INTERVAL '10 minutes';
  v_last_scheduled TIMESTAMPTZ;
BEGIN
  -- Debounce: skip if we already rescheduled in the last 10 minutes for this lesson.
  SELECT last_reviewed_at INTO v_last_scheduled
  FROM public.lesson_review_schedule
  WHERE user_id = NEW.user_id AND lesson_id = NEW.lesson_id;

  IF v_last_scheduled IS NOT NULL AND v_last_scheduled > v_window THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct)
    INTO v_total, v_correct
  FROM public.lesson_quiz_attempts
  WHERE user_id = NEW.user_id
    AND lesson_id = NEW.lesson_id
    AND attempted_at >= v_window;

  IF v_total = 0 THEN RETURN NEW; END IF;

  PERFORM public.apply_review_outcome(
    NEW.user_id,
    NEW.lesson_id,
    (v_correct::float / v_total) >= 0.7
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quiz_attempt_review
  AFTER INSERT ON public.lesson_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.process_quiz_attempt_for_review();
