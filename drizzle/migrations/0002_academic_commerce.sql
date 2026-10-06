-- Apply only with central integration, after reviewing installed function definitions.
-- Preserve the existing wrappers, side effects and payment paths. No provider settings.
BEGIN;
DO $$ DECLARE r record; d text; old_list text:='''pro'',''pro_plus'',''kids'',''technical'''; new_list text:='''pro'',''pro_plus'',''kids'',''technical'',''academic'''; BEGIN
 FOR r IN SELECT oid FROM pg_proc WHERE oid IN (
  'billing.commerce_price(text,text,text,uuid)'::regprocedure,
  'billing.commerce_validate_recipient(jsonb)'::regprocedure,
  'public.commerce_command(text,jsonb)'::regprocedure)
 LOOP
  d:=pg_get_functiondef(r.oid);
  IF position(old_list IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_CENTRAL_DEFINITION_CHANGED:%',r.oid::regprocedure; END IF;
  d:=replace(d,old_list,new_list);
  IF r.oid='billing.commerce_price(text,text,text,uuid)'::regprocedure THEN
   IF position('CASE WHEN p_package=''technical'' THEN ''pro_plus'' ELSE p_package END' IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_PRICE_DEFINITION_CHANGED'; END IF;
   d:=replace(d,'CASE WHEN p_package=''technical'' THEN ''pro_plus'' ELSE p_package END','CASE WHEN p_package IN (''technical'',''academic'') THEN ''pro_plus'' ELSE p_package END');
  END IF;
  EXECUTE d;
 END LOOP;
 FOR r IN SELECT conname,conrelid::regclass AS tbl FROM pg_constraint WHERE contype='c'
 AND conrelid IN ('billing.commerce_offers'::regclass,'billing.commerce_orders'::regclass,'billing.commerce_invitations'::regclass,'billing.commerce_grants'::regclass,'billing.commerce_entitlements'::regclass)
 AND conname LIKE '%package_check' LOOP
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.tbl,r.conname);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK(package IN (''pro'',''pro_plus'',''kids'',''technical'',''academic''))',r.tbl,r.conname);
 END LOOP;
END $$;
-- Deliberately no academic_assistant commerce product until its separate price/quota is approved.
COMMIT;