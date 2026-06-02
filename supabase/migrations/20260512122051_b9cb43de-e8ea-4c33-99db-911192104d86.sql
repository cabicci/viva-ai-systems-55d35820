-- Status enum
DO $$ BEGIN
  CREATE TYPE public.mission_submission_status AS ENUM (
    'draft', 'submitted', 'evaluating', 'needs_revision', 'passed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.mission_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id text NOT NULL,
  lesson_id text,
  submission_text text,
  submission_url text,
  submission_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.mission_submission_status NOT NULL DEFAULT 'draft',
  feedback text,
  score numeric,
  attempt_count integer NOT NULL DEFAULT 0,
  submitted_at timestamptz,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_submissions_user
  ON public.mission_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_user_mission
  ON public.mission_submissions(user_id, mission_id);

ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ms_select_own ON public.mission_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ms_insert_own ON public.mission_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ms_update_own ON public.mission_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ms_delete_own ON public.mission_submissions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_mission_submissions_updated_at
  BEFORE UPDATE ON public.mission_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();