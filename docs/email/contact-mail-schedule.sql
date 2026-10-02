-- Prepared only; apply after separate production activation confirmation.
-- The contact migrations/worker/webhook already exist. Do not recreate them.
-- Preserve masaarat-account-welcome-v1 and its current schedule.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets
    WHERE name='masaarat_contact_mail_job_secret' AND length(decrypted_secret)>=32)
    THEN RAISE EXCEPTION 'CONTACT_PROTECTED_JOB_BINDING_REQUIRED'; END IF;
  IF to_regprocedure('public.claim_contact_acknowledgements()') IS NULL
    THEN RAISE EXCEPTION 'CONTACT_MAIL_MIGRATION_REQUIRED'; END IF;
END $$;
SELECT cron.schedule('masaarat-contact-mail-v1','* * * * *',$job$
  SELECT net.http_post(
    url:='https://abyqqeboyrkkwhjpwmtd.supabase.co/functions/v1/contact-mail-job',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='masaarat_contact_mail_job_secret')),
    body:='{}'::jsonb,timeout_milliseconds:=100000);
$job$);
COMMIT;
-- Enable CONTACT_MAIL_ENABLED on both the reviewed app and worker only after
-- the protected webhook binding is accepted. No historic contacts are queued.
-- Verify protected HTTP responses, including retries; cron success is submission.
-- Pause both flags first, then unschedule only masaarat-contact-mail-v1.
