-- REVIEW ONLY. Execute only on a disposable copy under a reviewed rollback.
-- Never re-enable authenticated EXECUTE on delete_my_account_data().
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM billing.account_deletion_requests) THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_REQUESTS_PENDING: preserve the queue';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.request_account_deletion();
DROP TABLE billing.account_deletion_requests;
-- The previous destructive RPC remains denied even after this rollback.
REVOKE ALL ON FUNCTION public.delete_my_account_data() FROM PUBLIC, anon, authenticated;
COMMIT;
