-- Staging large, fully localized packages hashes and verifies the whole edition
-- in one transaction. PostgREST applies this limit only to the admin RPC.
ALTER FUNCTION public.curriculum_admin(uuid,text,jsonb) SET statement_timeout = '30s';
--> statement-breakpoint
NOTIFY pgrst, 'reload schema';
