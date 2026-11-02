-- Real forward correction for the empty, not-yet-released admission system.
-- Preserve applied 0034 and all existing learner/commerce/index data.
DO $child_receipt_erasure$
DECLARE definition text; old_acl aclitem[];
 old_insert text:='INSERT INTO curriculum_private.commands(account_id,request_id,parameters,result) VALUES(u,req,';
 new_insert text:='INSERT INTO curriculum_private.commands(account_id,request_id,record_id,parameters,result) VALUES(u,req,rid,';
BEGIN
 PERFORM set_config('lock_timeout','3s',true);
 IF NOT EXISTS(SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at=1793658835471
  AND hash='7f236e5d7428a37e608f86eb144e3c0b47ab259c78e1256e6d77f748b060f60d') THEN RAISE EXCEPTION 'CURRICULUM_ERASURE_BASE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='curriculum_private' AND table_name='commands' AND column_name='record_id') THEN RAISE EXCEPTION 'CURRICULUM_ERASURE_ALREADY_APPLIED'; END IF;
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='public.curriculum_command(text,jsonb)'::regprocedure)
  IS DISTINCT FROM '99cb4f2aeb4eb6a8639699fd361a0798' THEN RAISE EXCEPTION 'CURRICULUM_COMMAND_SOURCE_CHANGED'; END IF;
 LOCK TABLE curriculum_private.courses IN SHARE MODE;
 LOCK TABLE curriculum_private.commands IN ACCESS EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM curriculum_private.courses) OR EXISTS(SELECT 1 FROM curriculum_private.commands) THEN RAISE EXCEPTION 'CURRICULUM_ERASURE_EMPTY_RELEASE_REQUIRED'; END IF;
 SELECT pg_get_functiondef(oid),proacl INTO definition,old_acl FROM pg_proc WHERE oid='public.curriculum_command(text,jsonb)'::regprocedure;
 IF position(old_insert IN definition)=0 THEN RAISE EXCEPTION 'CURRICULUM_COMMAND_INSERT_CHANGED'; END IF;
 ALTER TABLE curriculum_private.commands ADD COLUMN record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE;
 CREATE INDEX curriculum_command_record ON curriculum_private.commands(record_id);
 EXECUTE replace(definition,old_insert,new_insert);
 IF (SELECT proacl FROM pg_proc WHERE oid='public.curriculum_command(text,jsonb)'::regprocedure) IS DISTINCT FROM old_acl
  OR md5(pg_get_functiondef('billing.commercial_lock(uuid)'::regprocedure)) IS DISTINCT FROM '7b5513a541129182dbe44058b0cc314c' THEN RAISE EXCEPTION 'CURRICULUM_ERASURE_AUTHORITY_CHANGED'; END IF;
END $child_receipt_erasure$;
