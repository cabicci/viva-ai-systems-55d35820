-- Additive database state remains during an application rollback.
-- Quiesce provider work using the reviewed application procedure first.
-- Do not rerun 0048/0049/0050 or delete their journal entries.
BEGIN;
DO $$
BEGIN
 IF to_regprocedure('public.admin_account_phone_command(uuid,text,jsonb)') IS NULL THEN
   RAISE EXCEPTION 'PHONE_ADMINISTRATION_NOT_INSTALLED';
 END IF;
 IF to_regprocedure('communications_private.pre_upgrade_advance_deletion(uuid,uuid,text)') IS NULL THEN
   RAISE EXCEPTION 'PHONE_DELETION_PROTECTION_NOT_INSTALLED';
 END IF;
END;
$$;
-- Keep the administration function, phone records, revision and deletion chain.
COMMIT;
