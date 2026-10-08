-- Operator rollback only, through Lovable. Refuse to erase any ownership/history.
BEGIN;
LOCK TABLE communications_private.phone_control IN ACCESS EXCLUSIVE MODE;
LOCK TABLE communications_private.phone_challenges IN ACCESS EXCLUSIVE MODE;
LOCK TABLE communications_private.verified_phones IN ACCESS EXCLUSIVE MODE;
DO $$ DECLARE d text; BEGIN
 IF EXISTS(SELECT 1 FROM communications_private.phone_challenges)
   OR EXISTS(SELECT 1 FROM communications_private.verified_phones)
   THEN RAISE EXCEPTION 'PHONE_ROLLBACK_HAS_DATA'; END IF;
 d:=pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 IF position('communications_private.previous_advance_deletion' IN d)=0
   THEN RAISE EXCEPTION 'PHONE_ROLLBACK_CHAIN_CHANGED'; END IF;
 d:=pg_get_functiondef('communications_private.previous_advance_deletion(uuid,uuid,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION communications_private.previous_advance_deletion(',
   'FUNCTION public.lc09_advance_deletion(');
END $$;
REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
DROP FUNCTION public.account_phone_command(uuid,text,jsonb);
DROP SCHEMA communications_private CASCADE;
COMMIT;
