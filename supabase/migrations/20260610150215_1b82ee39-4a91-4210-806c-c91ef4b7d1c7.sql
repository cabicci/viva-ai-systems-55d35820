DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    GRANT DELETE ON public.knowledge_chunks TO sandbox_exec;
  END IF;
END
$$;
