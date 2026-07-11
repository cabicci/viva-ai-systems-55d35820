-- lesson_feedback existed in deployed databases before migration history captured it.
-- Establish the base table so replay can add momentum_score safely.
CREATE TABLE IF NOT EXISTS public.lesson_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  boring BOOLEAN,
  confusing BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_feedback
ADD COLUMN IF NOT EXISTS momentum_score smallint
  CHECK (momentum_score IS NULL OR (momentum_score >= 1 AND momentum_score <= 10));
