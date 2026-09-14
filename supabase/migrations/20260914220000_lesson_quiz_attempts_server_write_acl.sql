-- Trusted quiz grading writes through the existing service-role server function.
-- Learners retain owner-scoped reads under lqa_select_own.
REVOKE ALL PRIVILEGES ON TABLE public.lesson_quiz_attempts
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.lesson_quiz_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lesson_quiz_attempts TO service_role;

DROP POLICY IF EXISTS lqa_insert_own ON public.lesson_quiz_attempts;
DROP POLICY IF EXISTS lqa_update_own ON public.lesson_quiz_attempts;
DROP POLICY IF EXISTS lqa_delete_own ON public.lesson_quiz_attempts;
