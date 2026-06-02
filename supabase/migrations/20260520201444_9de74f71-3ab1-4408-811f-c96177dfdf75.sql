CREATE TABLE public.lesson_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  bloom_level TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_lqa_user_lesson ON public.lesson_quiz_attempts(user_id, lesson_id);

ALTER TABLE public.lesson_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lqa_select_own"
  ON public.lesson_quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "lqa_insert_own"
  ON public.lesson_quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lqa_update_own"
  ON public.lesson_quiz_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "lqa_delete_own"
  ON public.lesson_quiz_attempts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);