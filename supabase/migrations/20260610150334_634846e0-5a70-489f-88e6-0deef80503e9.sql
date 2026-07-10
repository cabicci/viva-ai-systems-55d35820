DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    REVOKE DELETE ON public.knowledge_chunks FROM sandbox_exec;
  END IF;
END
$$;
