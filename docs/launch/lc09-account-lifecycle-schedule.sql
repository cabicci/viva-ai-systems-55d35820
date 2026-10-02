-- Apply only after separate production confirmation, the reviewed migration,
-- deployed account-deletion-job/webhook, and protected Vault/environment binding.
-- No secret values, owner account IDs, or email addresses belong in this file.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='masaarat_account_lifecycle_job_secret'
    AND length(decrypted_secret)>=32) THEN RAISE EXCEPTION 'LC09_PROTECTED_JOB_BINDING_REQUIRED'; END IF;
  IF to_regprocedure('public.lc09_financial_purge_candidates(integer)') IS NULL
    THEN RAISE EXCEPTION 'LC09_FINANCIAL_MIGRATION_REQUIRED'; END IF;
END $$;
SELECT cron.schedule('masaarat-account-lifecycle-v1','* * * * *',$job$
  SELECT net.http_post(
    url:='https://abyqqeboyrkkwhjpwmtd.supabase.co/functions/v1/account-deletion-job',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='masaarat_account_lifecycle_job_secret')),
    body:='{"action":"run_batch"}'::jsonb,timeout_milliseconds:=100000);
$job$);
COMMIT;
-- Financial switch: account_deletion_control.financial_purge_enabled plus
-- ACCOUNT_FINANCIAL_PURGE_ENABLED. Account deletion has its own two switches.
-- Do not touch masaarat-account-welcome-v1 or any contact mail schedule.
-- Inspect job_run_details AND the protected HTTP result, including deferred.
-- Cron success alone proves only submission, not erasure or provider success.
