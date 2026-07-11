-- Validation shim: lesson_feedback is altered before any canonical migration creates it.
CREATE TABLE IF NOT EXISTS public.lesson_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  boring boolean,
  confusing boolean,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;
