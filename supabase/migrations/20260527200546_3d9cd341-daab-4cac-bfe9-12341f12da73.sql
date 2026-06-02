
CREATE TABLE public.learner_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  path_id TEXT,
  module_id TEXT,
  lesson_id TEXT,
  mission_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_learner_events_user_created ON public.learner_events(user_id, created_at DESC);
CREATE INDEX idx_learner_events_type_created ON public.learner_events(event_type, created_at DESC);
CREATE INDEX idx_learner_events_lesson ON public.learner_events(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_learner_events_session ON public.learner_events(session_id) WHERE session_id IS NOT NULL;

GRANT SELECT, INSERT ON public.learner_events TO authenticated;
GRANT ALL ON public.learner_events TO service_role;

ALTER TABLE public.learner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_insert_own"
ON public.learner_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "le_select_own"
ON public.learner_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "le_select_admin"
ON public.learner_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
