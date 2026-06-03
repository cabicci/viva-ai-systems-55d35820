-- v9 apply decisions
CREATE TABLE public.v9_apply_decisions (
  lesson_id text PRIMARY KEY,
  decision text NOT NULL CHECK (decision IN ('approve','edit','reject')),
  new_order jsonb,
  notes text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.v9_apply_decisions TO authenticated;
GRANT ALL ON public.v9_apply_decisions TO service_role;

ALTER TABLE public.v9_apply_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "v9_decisions_admin_select" ON public.v9_apply_decisions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "v9_decisions_admin_insert" ON public.v9_apply_decisions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "v9_decisions_admin_update" ON public.v9_apply_decisions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "v9_decisions_admin_delete" ON public.v9_apply_decisions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- User validation sessions (15-user wow-moment tracking)
CREATE TABLE public.user_validation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_label text,
  started_at timestamptz NOT NULL DEFAULT now(),
  wow_moment_at timestamptz,
  first_3_lessons_completed boolean NOT NULL DEFAULT false,
  reached_wow_within_7min boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_validation_sessions TO authenticated;
GRANT ALL ON public.user_validation_sessions TO service_role;

ALTER TABLE public.user_validation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uvs_admin_all" ON public.user_validation_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_uvs_updated_at
  BEFORE UPDATE ON public.user_validation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();