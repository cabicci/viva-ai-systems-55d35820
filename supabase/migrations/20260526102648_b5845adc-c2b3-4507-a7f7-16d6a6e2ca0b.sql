-- 1. Lock down user_subscriptions: drop self-insert and self-update
DROP POLICY IF EXISTS us_insert_own ON public.user_subscriptions;
DROP POLICY IF EXISTS us_update_own ON public.user_subscriptions;

-- 2. lesson_progress: replace public-role policies with authenticated-only
DROP POLICY IF EXISTS "Users view own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users insert own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users update own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users delete own progress" ON public.lesson_progress;

CREATE POLICY "Users view own progress" ON public.lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.lesson_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. lesson_notes: replace public-role policies with authenticated-only
DROP POLICY IF EXISTS "Users view own notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Users insert own notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Users update own notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Users delete own notes" ON public.lesson_notes;

CREATE POLICY "Users view own notes" ON public.lesson_notes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notes" ON public.lesson_notes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notes" ON public.lesson_notes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notes" ON public.lesson_notes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);