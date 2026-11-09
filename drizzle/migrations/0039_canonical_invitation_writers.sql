-- Fresh free access uses email_access_command and explicit recipient acceptance.
-- Existing rights, paid orders, coupon redemption and exact completed retries stay intact.
DO $preserve$
DECLARE definition text; owner_id oid; owner_name text; prefix text; alias_id oid; grantee record;
BEGIN
 IF to_regprocedure('public.commerce_command(text,jsonb)') IS NULL
 OR to_regprocedure('billing.canonical_invitation_previous_command(text,jsonb)') IS NOT NULL
 OR to_regprocedure('public.email_access_command(text,jsonb)') IS NULL
 OR to_regprocedure('public.accept_commercial_invitation(uuid)') IS NULL THEN
  RAISE EXCEPTION 'CANONICAL_INVITATION_BASELINE_MISSING';
 END IF;
 SELECT pg_get_functiondef(oid),proowner INTO definition,owner_id
 FROM pg_proc WHERE oid='public.commerce_command(text,jsonb)'::regprocedure;
 owner_name:=pg_get_userbyid(owner_id);
 prefix:='CREATE OR REPLACE FUNCTION public.commerce_command(';
 IF left(definition,length(prefix))<>prefix
 OR position('account_subscription_display' IN definition)=0
 OR position('admin_subscription_display' IN definition)=0
 OR position('billing.subscription_display_previous_command' IN definition)=0
 OR owner_name IN ('anon','authenticated','service_role') THEN
  RAISE EXCEPTION 'CANONICAL_INVITATION_BASELINE_CHANGED';
 END IF;
 EXECUTE 'CREATE FUNCTION billing.canonical_invitation_previous_command('
  ||substr(definition,length(prefix)+1);
 EXECUTE format('ALTER FUNCTION billing.canonical_invitation_previous_command(text,jsonb) OWNER TO %I',owner_name);
 REVOKE ALL ON FUNCTION billing.canonical_invitation_previous_command(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
 alias_id:='billing.canonical_invitation_previous_command(text,jsonb)'::regprocedure;
 FOR grantee IN SELECT DISTINCT r.rolname FROM pg_proc p
  CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  JOIN pg_roles r ON r.oid=a.grantee WHERE p.oid=alias_id AND a.grantee<>owner_id
 LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION billing.canonical_invitation_previous_command(text,jsonb) FROM %I',grantee.rolname);
 END LOOP;
END $preserve$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $command$
DECLARE actor uuid:=auth.uid(); row_data jsonb; group_id uuid; v_source_key text;
 grant_row billing.commerce_grants%ROWTYPE; invite_row billing.commerce_invitations%ROWTYPE;
 entitlement billing.commerce_entitlements%ROWTYPE; offer_row billing.commerce_offers%ROWTYPE;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('grant','import','preview_import','simple_offer','manage_access') THEN
  RETURN billing.canonical_invitation_previous_command(p_action,p_data);
 END IF;
 PERFORM billing.commerce_assert_identity(actor);
 IF NOT coalesce(billing.commerce_is_admin(),false) THEN
  RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE singleton AND enabled) THEN
  RAISE EXCEPTION 'COMMERCE_DISABLED';
 END IF;
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'COMMERCE_INVALID_INPUT'; END IF;

 IF p_action='grant' THEN
  -- The original handler rechecks target identity and exact parameters on replay.
  v_source_key:='grant:'||(p_data->>'key');
  PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_source_key,0));
  SELECT * INTO grant_row FROM billing.commerce_grants WHERE request_key=v_source_key;
  IF grant_row.id IS NULL THEN RAISE EXCEPTION 'CANONICAL_INVITATION_REQUIRED'; END IF;
  IF grant_row.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
 ELSIF p_action IN ('import','preview_import') THEN
  group_id:=(p_data->>'group_id')::uuid;
  IF jsonb_typeof(p_data->'rows') IS DISTINCT FROM 'array'
   OR jsonb_array_length(p_data->'rows') NOT BETWEEN 1 AND 1000 THEN
   RAISE EXCEPTION 'COMMERCE_INVALID_IMPORT';
  END IF;
  -- Serialize against existing imports. Validate the whole batch before delegation;
  -- a rejected complimentary row must not leave a partial paid import behind.
  PERFORM 1 FROM billing.commerce_groups WHERE id=group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'COMMERCE_INVALID_IMPORT'; END IF;
  FOR row_data IN SELECT value FROM jsonb_array_elements(p_data->'rows') LOOP
   IF row_data->>'access_kind'='complimentary' THEN
    v_source_key:=group_id::text||':'||lower(btrim(row_data->>'email'));
    SELECT * INTO invite_row FROM billing.commerce_invitations WHERE commerce_invitations.source_key=v_source_key;
    IF invite_row.id IS NULL THEN RAISE EXCEPTION 'CANONICAL_INVITATION_REQUIRED'; END IF;
    IF invite_row.parameters IS DISTINCT FROM row_data THEN RAISE EXCEPTION 'COMMERCE_IMPORT_CONFLICT'; END IF;
   END IF;
  END LOOP;
 ELSIF p_action='simple_offer' AND p_data->>'delivery'='invitation'
  AND (p_data->>'percent')::numeric=100 THEN
  -- This branch imports through an inner private command, not public import.
  PERFORM pg_advisory_xact_lock(hashtextextended('simple-offer:'||(p_data->>'key'),0));
  SELECT * INTO offer_row FROM billing.commerce_offers WHERE request_key=p_data->>'key';
  IF offer_row.id IS NULL THEN RAISE EXCEPTION 'CANONICAL_INVITATION_REQUIRED'; END IF;
  IF offer_row.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
 ELSIF p_action='manage_access' AND p_data->>'operation'='extend' THEN
  SELECT * INTO entitlement FROM billing.commerce_entitlements WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF entitlement.id IS NULL THEN RAISE EXCEPTION 'COMMERCE_ACCESS_NOT_FOUND'; END IF;
  PERFORM billing.commerce_assert_identity(entitlement.user_id);
  IF entitlement.grant_id IS NOT NULL THEN
   SELECT * INTO grant_row FROM billing.commerce_grants WHERE id=entitlement.grant_id;
   -- A coupon-backed grant belongs to the commercial order/discount lifecycle.
   -- It is not a manually issued complimentary invitation.
   IF NOT EXISTS(SELECT 1 FROM billing.commerce_orders o
    WHERE o.id=grant_row.offer_order_id AND o.user_id=entitlement.user_id
     AND grant_row.user_id=entitlement.user_id AND o.offer_id IS NOT NULL
     AND o.final_minor=0 AND o.confirmed_at IS NOT NULL) THEN
    v_source_key:='extend:'||(p_data->>'key');
    IF NOT EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_source_key
     AND target_id=entitlement.id AND details=p_data) THEN
     IF EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_source_key) THEN
      RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT';
     END IF;
     RAISE EXCEPTION 'CANONICAL_INVITATION_REQUIRED';
    END IF;
   END IF;
  END IF;
 END IF;
 RETURN billing.canonical_invitation_previous_command(p_action,p_data);
END $command$;
-- CREATE OR REPLACE retains the public entry's owner/OID/ACL. No table writes,
-- quota changes, role changes or rewrites of historical sources occur here.
