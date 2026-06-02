
-- Triage answers: AI level, goal, time per user
CREATE TYPE public.learner_level AS ENUM ('zero','casual','advanced');
CREATE TYPE public.learner_goal  AS ENUM ('career','money','curiosity','skill','business');
CREATE TYPE public.learner_time  AS ENUM ('5min','15min','60min');
CREATE TYPE public.learner_track AS ENUM ('beginner','builder','money','explorer');

CREATE TABLE public.learner_triage (
  user_id     UUID PRIMARY KEY,
  level       public.learner_level NOT NULL,
  goal        public.learner_goal  NOT NULL,
  time_avail  public.learner_time  NOT NULL,
  track       public.learner_track NOT NULL,
  entry_lesson_id TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.learner_triage TO authenticated;
GRANT ALL ON public.learner_triage TO service_role;

ALTER TABLE public.learner_triage ENABLE ROW LEVEL SECURITY;

CREATE POLICY lt_select_own ON public.learner_triage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY lt_insert_own ON public.learner_triage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY lt_update_own ON public.learner_triage FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY lt_select_admin ON public.learner_triage FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_learner_triage_updated
BEFORE UPDATE ON public.learner_triage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
