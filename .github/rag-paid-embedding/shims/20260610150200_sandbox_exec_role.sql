-- Validation shim: sandbox_exec is granted privileges before the role is created canonically.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    CREATE ROLE sandbox_exec NOLOGIN;
  END IF;
END $$;

GRANT service_role TO sandbox_exec;
