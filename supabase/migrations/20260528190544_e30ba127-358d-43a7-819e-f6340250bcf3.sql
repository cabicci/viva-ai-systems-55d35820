
-- 1) Mark already-done roadmap item
UPDATE public.roadmap_items
SET status = 'done', completed_at = now()
WHERE id = '0ecd94e1-0d72-40ec-ae03-50e4dd95fe31' AND status != 'done';

-- 2) learner_events table
CREATE TABLE IF NOT EXISTS public.learner_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  path_id     text,
  module_id   text,
  lesson_id   text,
  mission_id  text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learner_events_user_created_idx
  ON public.learner_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learner_events_type_idx
  ON public.learner_events (event_type);
CREATE INDEX IF NOT EXISTS learner_events_lesson_idx
  ON public.learner_events (lesson_id) WHERE lesson_id IS NOT NULL;

GRANT SELECT, INSERT ON public.learner_events TO authenticated;
GRANT ALL ON public.learner_events TO service_role;

ALTER TABLE public.learner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own learner events"
  ON public.learner_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own learner events"
  ON public.learner_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all learner events"
  ON public.learner_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
