ALTER TABLE public.lesson_feedback
ADD COLUMN IF NOT EXISTS momentum_score smallint
  CHECK (momentum_score IS NULL OR (momentum_score >= 1 AND momentum_score <= 10));