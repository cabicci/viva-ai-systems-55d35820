-- Existing installations: rehearse and apply through Lovable only.
-- Preserve the installed deletion chain, leases, provider checks and ACLs.
BEGIN;
DO $academic_deletion_inventory$
DECLARE
  v_targets oid[];
  v_definition text;
  v_old text := 'c.table_name NOT IN (''lesson_progress''';
  v_new text := 'c.table_name NOT IN (''academic_assistant_questions'',''lesson_progress''';
BEGIN
  IF to_regclass('public.academic_assistant_questions') IS NULL THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_QUESTIONS_TABLE_MISSING';
  END IF;
  SELECT array_agg(p.oid) INTO v_targets
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.pronargs=3
    AND p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%';
  IF coalesce(cardinality(v_targets),0) <> 1 THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_INVENTORY_TARGET_MISMATCH';
  END IF;
  v_definition := pg_get_functiondef(v_targets[1]);
  -- Idempotent reapplication; unknown installed definitions still fail closed.
  IF strpos(v_definition,v_new) > 0 THEN RETURN; END IF;
  IF (length(v_definition)-length(replace(v_definition,v_old,'')))/length(v_old) <> 1 THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_INVENTORY_DEFINITION_MISMATCH';
  END IF;
  EXECUTE replace(v_definition,v_old,v_new);
END;
$academic_deletion_inventory$;
COMMIT;
