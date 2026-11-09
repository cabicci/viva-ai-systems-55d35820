-- Preserve the existing retention timing, delivered notice, snapshot, identity
-- and family-lock guards. A lapsed family subscription does not erase a child
-- with a current lifetime purchase or an unresolved payment for that child.
DO $kids_retention_commercial_rights$
DECLARE
 previous_definition text;
 corrected_definition text;
 previous_acl aclitem[];
 previous_owner oid;
 previous_config text[];
 previous_definer boolean;
 old_delete text := 'DELETE FROM public.kids_profiles WHERE parent_id=v_parent AND id=ANY(n.profile_ids) AND created_at<=n.created_at;';
 new_delete text := 'DELETE FROM public.kids_profiles p
  WHERE p.parent_id=v_parent AND p.id=ANY(n.profile_ids) AND p.created_at<=n.created_at
    AND NOT EXISTS (
      SELECT 1 FROM billing.commercial_purchases cp
      WHERE cp.user_id=v_parent AND cp.child_id=p.id
        AND cp.kind=''lifetime_course'' AND cp.area=''kids''
        AND cp.state IN (''pending'',''fulfilled'',''held'')
    );';
BEGIN
 -- Migration0033 established family751603 BEFORE commercial/lifecycle locks.
 -- Retention already holds that same family lock before inspecting/deleting.
 -- Do not apply against an unknown lock implementation or mutate its order.
 IF md5(pg_get_functiondef('billing.commercial_lock(uuid)'::regprocedure))
   IS DISTINCT FROM '7b5513a541129182dbe44058b0cc314c' THEN
   RAISE EXCEPTION 'KIDS_RETENTION_COMMERCIAL_LOCK_CHANGED';
 END IF;
 SELECT pg_get_functiondef(p.oid),p.proacl,p.proowner,p.proconfig,p.prosecdef
 INTO previous_definition,previous_acl,previous_owner,previous_config,previous_definer
 FROM pg_proc p WHERE p.oid='public.kids_delete_expired_profiles(uuid)'::regprocedure;
 IF NOT previous_definer OR
   position('pg_catalog.hashtextextended(v_parent::text,751603)' IN previous_definition)=0 OR
   position(old_delete IN previous_definition)=0 OR
   length(previous_definition)-length(replace(previous_definition,old_delete,''))<>length(old_delete) THEN
   RAISE EXCEPTION 'KIDS_RETENTION_DELETION_PRECONDITION_CHANGED';
 END IF;
 corrected_definition:=replace(previous_definition,old_delete,new_delete);
 EXECUTE corrected_definition;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
   WHERE p.oid='public.kids_delete_expired_profiles(uuid)'::regprocedure
     AND pg_get_functiondef(p.oid)=corrected_definition
     AND p.proacl IS NOT DISTINCT FROM previous_acl AND p.proowner=previous_owner
     AND p.proconfig IS NOT DISTINCT FROM previous_config AND p.prosecdef=previous_definer)
   OR has_function_privilege('anon','public.kids_delete_expired_profiles(uuid)','EXECUTE')
   OR has_function_privilege('authenticated','public.kids_delete_expired_profiles(uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'KIDS_RETENTION_DELETION_AUTHORITY_CHANGED';
 END IF;
END $kids_retention_commercial_rights$;
