-- Forward-only repair of the observed family/lifecycle advisory-lock inversion.
-- Existing account-deletion and Kids readers acquire family BEFORE lifecycle.
-- Preserve every existing commercial lock, eligibility check and function ACL.
DO $commercial_family_lock_order$
DECLARE
 previous_definition text;
 corrected_definition text;
 previous_acl aclitem[];
 previous_owner oid;
 previous_config text[];
 previous_definer boolean;
BEGIN
 SELECT pg_get_functiondef(p.oid),p.proacl,p.proowner,p.proconfig,p.prosecdef
 INTO previous_definition,previous_acl,previous_owner,previous_config,previous_definer
 FROM pg_proc p WHERE p.oid='billing.commercial_lock(uuid)'::regprocedure;
 IF md5(previous_definition)<>'b8977340d404b1178c6d4a8daa047af2' THEN
  RAISE EXCEPTION 'COMMERCIAL_LOCK_PRECONDITION_CHANGED';
 END IF;
 corrected_definition:=replace(previous_definition,
  E'BEGIN\n -- Same lifecycle/checkout lock',
  E'BEGIN\n -- Match the existing Kids/profile and account-deletion lock order.\n PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,751603));\n -- Same lifecycle/checkout lock');
 IF corrected_definition=previous_definition THEN
  RAISE EXCEPTION 'COMMERCIAL_LOCK_INSERTION_MISSING';
 END IF;
 EXECUTE corrected_definition;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='billing.commercial_lock(uuid)'::regprocedure
  AND pg_get_functiondef(p.oid)=corrected_definition
  AND p.proacl IS NOT DISTINCT FROM previous_acl AND p.proowner=previous_owner
  AND p.proconfig IS NOT DISTINCT FROM previous_config AND p.prosecdef=previous_definer)
 OR has_function_privilege('anon','billing.commercial_lock(uuid)','EXECUTE')
 OR has_function_privilege('authenticated','billing.commercial_lock(uuid)','EXECUTE') THEN
  RAISE EXCEPTION 'COMMERCIAL_LOCK_POSTCONDITION_CHANGED';
 END IF;
END $commercial_family_lock_order$;
