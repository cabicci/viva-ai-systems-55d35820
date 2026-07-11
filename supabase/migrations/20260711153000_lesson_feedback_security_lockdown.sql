-- Lock down public.lesson_feedback to backend-only service_role access.
-- Preserve existing schema, constraints, and account-deletion RPC behavior.

ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lesson_feedback FROM PUBLIC;
REVOKE ALL ON TABLE public.lesson_feedback FROM anon;
REVOKE ALL ON TABLE public.lesson_feedback FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lesson_feedback TO service_role;
