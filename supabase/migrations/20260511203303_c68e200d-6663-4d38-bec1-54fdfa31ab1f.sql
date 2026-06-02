
-- Enums
DO $$ BEGIN
  CREATE TYPE public.lesson_status_v2 AS ENUM ('locked','available','in_progress','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.mission_state AS ENUM ('locked','available','started','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.build_log_type AS ENUM ('mission_started','mission_completed','lesson_completed','milestone','runtime_realization');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_lesson_status
CREATE TABLE IF NOT EXISTS public.user_lesson_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  status public.lesson_status_v2 NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.user_lesson_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uls_select_own" ON public.user_lesson_status
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "uls_insert_own" ON public.user_lesson_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uls_update_own" ON public.user_lesson_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "uls_delete_own" ON public.user_lesson_status
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_uls_updated_at BEFORE UPDATE ON public.user_lesson_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_mission_state
CREATE TABLE IF NOT EXISTS public.user_mission_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id text NOT NULL,
  state public.mission_state NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id)
);
ALTER TABLE public.user_mission_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ums_select_own" ON public.user_mission_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ums_insert_own" ON public.user_mission_state
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ums_update_own" ON public.user_mission_state
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ums_delete_own" ON public.user_mission_state
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_ums_updated_at BEFORE UPDATE ON public.user_mission_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- build_logs
CREATE TABLE IF NOT EXISTS public.build_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.build_log_type NOT NULL,
  lesson_id text,
  mission_id text,
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.build_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bl_select_own" ON public.build_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bl_insert_own" ON public.build_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bl_update_own" ON public.build_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bl_delete_own" ON public.build_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_build_logs_user_created ON public.build_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uls_user ON public.user_lesson_status (user_id);
CREATE INDEX IF NOT EXISTS idx_ums_user ON public.user_mission_state (user_id);
