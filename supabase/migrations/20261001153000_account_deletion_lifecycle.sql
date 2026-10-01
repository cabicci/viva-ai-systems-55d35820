-- LC-09 draft: policy-gated account and family finalization. Not authorized for production apply.
-- No policy, duration, activation, provider operation or account deletion is seeded.
BEGIN;

CREATE TABLE billing.account_deletion_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  financial_retention_reference text,
  crm_retention_reference text,
  responder_reference text,
  release_reference text,
  CHECK (NOT enabled OR (
    nullif(btrim(financial_retention_reference), '') IS NOT NULL AND
    nullif(btrim(crm_retention_reference), '') IS NOT NULL AND
    nullif(btrim(responder_reference), '') IS NOT NULL AND
    nullif(btrim(release_reference), '') IS NOT NULL
  ))
);
INSERT INTO billing.account_deletion_control(singleton) VALUES(true);

CREATE TABLE billing.account_deletion_lifecycle (
  user_id uuid PRIMARY KEY REFERENCES billing.account_deletion_requests(user_id),
  stage text NOT NULL CHECK(stage IN ('blocked','provider_reconciled','learner_erased','complete')),
  financial_retention_reference text NOT NULL,
  crm_retention_reference text NOT NULL,
  release_reference text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  provider_reconciled_at timestamptz,
  learner_erased_at timestamptz,
  completed_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  CHECK ((stage='complete') = (completed_at IS NOT NULL))
);

ALTER TABLE billing.account_deletion_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.account_deletion_lifecycle ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.account_deletion_control, billing.account_deletion_lifecycle
  FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON billing.account_deletion_control TO service_role;
GRANT SELECT ON billing.account_deletion_lifecycle TO service_role;

-- All entitlement/Checkout entrypoints take this lock before their existing locks.
-- A submitted request alone never blocks an account. A durable lifecycle does.
CREATE FUNCTION billing.account_deletion_blocked(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'ACCOUNT_USER_REQUIRED'; END IF;
  -- Respect the existing Kids family lock before acquiring the lifecycle lock.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,751603));
  PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||p_user_id::text,0));
  RETURN EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id);
END;
$$;
REVOKE ALL ON FUNCTION billing.account_deletion_blocked(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION billing.lc09_owned_storage(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_owner text; v_objects jsonb;
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN RETURN '[]'::jsonb; END IF;
  SELECT column_name INTO v_owner FROM information_schema.columns
    WHERE table_schema='storage' AND table_name='objects' AND column_name IN ('owner_id','owner')
    ORDER BY CASE WHEN column_name='owner_id' THEN 0 ELSE 1 END LIMIT 1;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'LC09_STORAGE_OWNER_UNKNOWN'; END IF;
  EXECUTE format('SELECT coalesce(jsonb_agg(jsonb_build_object(''bucket'',bucket_id,''name'',name)),''[]''::jsonb) FROM storage.objects WHERE %I::text=$1::text',v_owner)
    INTO v_objects USING p_user_id;
  RETURN v_objects;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_owned_storage(uuid) FROM PUBLIC,anon,authenticated,service_role;

-- Restrictive policies preserve existing owner/admin policies while preventing
-- a stale JWT from reading retained account/family receipts after blocking.
CREATE FUNCTION public.lc09_account_active() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND NOT billing.account_deletion_blocked(auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.lc09_account_active() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lc09_account_active() TO authenticated,service_role;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT c.table_schema,c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING(table_schema,table_name)
    WHERE c.table_schema IN ('public','billing') AND c.column_name IN ('user_id','parent_id','profile_id')
      AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
  LOOP EXECUTE format('CREATE POLICY lc09_active_account ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.lc09_account_active()) WITH CHECK(public.lc09_account_active())',r.table_schema,r.table_name); END LOOP;
END $$;
DO $$ BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    CREATE POLICY lc09_active_account ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
      USING(public.lc09_account_active()) WITH CHECK(public.lc09_account_active());
  END IF;
END $$;

-- Persist session parameters before the Kids provider call. A lost response is
-- recovered with the same Stripe idempotency key, then expired by the job.
CREATE TABLE billing.account_checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  parameters text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','recorded','reconciled')),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE billing.account_checkout_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.account_checkout_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON billing.account_checkout_attempts TO service_role;
CREATE FUNCTION public.lc09_begin_kids_checkout(p_user_id uuid,p_key text,p_parameters text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_row billing.account_checkout_attempts%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF billing.account_deletion_blocked(p_user_id) THEN RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING'; END IF;
  IF p_key IS NULL OR length(p_key)>200 OR p_parameters IS NULL OR length(p_parameters)>8000 THEN RAISE EXCEPTION 'LC09_INVALID_CHECKOUT'; END IF;
  INSERT INTO billing.account_checkout_attempts(user_id,idempotency_key,parameters)
    VALUES(p_user_id,p_key,p_parameters) ON CONFLICT(idempotency_key) DO NOTHING;
  SELECT * INTO v_row FROM billing.account_checkout_attempts WHERE idempotency_key=p_key;
  IF v_row.user_id IS DISTINCT FROM p_user_id OR v_row.parameters IS DISTINCT FROM p_parameters OR v_row.state='reconciled'
    THEN RAISE EXCEPTION 'LC09_CHECKOUT_ATTEMPT_MISMATCH'; END IF;
  RETURN jsonb_build_object('attempt_id',v_row.id,'idempotency_key',v_row.idempotency_key);
END;
$$;
CREATE FUNCTION public.lc09_record_kids_checkout(p_user_id uuid,p_attempt uuid,p_session text,p_expired boolean DEFAULT false) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_blocked boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  v_blocked:=billing.account_deletion_blocked(p_user_id);
  IF p_session IS NULL OR p_session !~ '^cs_[A-Za-z0-9_]+$' THEN RAISE EXCEPTION 'LC09_INVALID_SESSION'; END IF;
  UPDATE billing.account_checkout_attempts SET session_id=p_session,
    state=CASE WHEN p_expired THEN 'reconciled' ELSE 'recorded' END
    WHERE id=p_attempt AND user_id=p_user_id AND (session_id IS NULL OR session_id=p_session);
  IF NOT FOUND THEN RAISE EXCEPTION 'LC09_CHECKOUT_ATTEMPT_MISMATCH'; END IF;
  RETURN NOT v_blocked;
END;
$$;
REVOKE ALL ON FUNCTION public.lc09_begin_kids_checkout(uuid,text,text),public.lc09_record_kids_checkout(uuid,uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_begin_kids_checkout(uuid,text,text),public.lc09_record_kids_checkout(uuid,uuid,text,boolean) TO service_role;

-- Preserve the effective installed functions, including approved later patches.
-- Old implementations are owner-only: callers cannot bypass the new boundary.
DO $wrap$
DECLARE
  r record; v_oid oid; v_args text; v_identity text; v_result text; v_call text;
  v_before text; v_return text; v_body text;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('billing','get_entitlement_snapshot','uuid','p_user_id','snapshot',true),
    ('billing','evaluate_access','uuid,text,text','p_user_id','access',true),
    ('billing','reserve_ai_quota','uuid,text,text,uuid,integer,text','p_user_id','raise',true),
    ('billing','register_provider_attempt','uuid,text,text,text','(SELECT user_id FROM billing.ai_usage_ledger WHERE id=p_reservation_id)','raise',true),
    ('billing','redeem_admin_access_coupon','text,text','auth.uid()','redeem',true),
    ('public','has_role','uuid,app_role','_user_id','role',true),
    ('public','get_stripe_checkout_context','uuid,text,text,text','p_user_id','raise',true),
    ('public','prepare_stripe_checkout','uuid,uuid,uuid,text,text,text,text,text','p_user_id','raise',true),
    ('public','confirm_stripe_checkout_generation','uuid,uuid','p_user_id','false',false),
    ('public','record_stripe_checkout_session','uuid,uuid,text','p_user_id','attach',false),
    ('public','get_my_billing_access_tier','','auth.uid()','free',true)
    ,('public','register_kids_stripe_customer','uuid,text','p_user_id','raise',true)
    ,('public','get_kids_stripe_checkout_context','uuid,text,text','p_user_id','raise',true)
    ,('public','kids_parent_can_manage_profiles','','auth.uid()','self_false',true)
    ,('public','get_my_kids_subscription','','auth.uid()','empty',true)
    ,('public','get_my_kids_access_status','','auth.uid()','empty',true)
    ,('public','kids_parent_privacy_record','','auth.uid()','empty',true)
  ) AS x(schema_name,function_name,signature,user_expression,denial,required)
  LOOP
    v_oid:=to_regprocedure(format('%I.%I(%s)',r.schema_name,r.function_name,r.signature));
    IF v_oid IS NULL THEN
      IF r.required THEN RAISE EXCEPTION 'LC09_REQUIRED_FUNCTION_MISSING: %',r.function_name; END IF;
      CONTINUE;
    END IF;
    v_args:=pg_get_function_arguments(v_oid);
    v_identity:=pg_get_function_identity_arguments(v_oid);
    v_result:=pg_get_function_result(v_oid);
    SELECT string_agg(quote_ident(name),',' ORDER BY ordinal) INTO v_call
      FROM pg_proc p, unnest(p.proargnames) WITH ORDINALITY AS a(name,ordinal)
      WHERE p.oid=v_oid AND ordinal<=p.pronargs;
    v_call:=coalesce(v_call,'');
    v_before:='IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION ''LC09_SERVICE_ONLY'' USING ERRCODE=''42501''; END IF;';
    IF r.denial='snapshot' THEN
      v_before:='IF NOT billing.is_service_role_caller() AND (auth.uid() IS NULL OR (auth.uid() IS DISTINCT FROM p_user_id AND NOT public.has_role(auth.uid(),''admin''::app_role))) THEN RAISE EXCEPTION ''ENTITLEMENT_FORBIDDEN'' USING ERRCODE=''42501''; END IF;';
    ELSIF r.denial='free' THEN
      v_before:='IF auth.uid() IS NULL THEN RAISE EXCEPTION ''ACCOUNT_UNAUTHENTICATED'' USING ERRCODE=''42501''; END IF;';
    ELSIF r.denial='redeem' THEN
      v_before:='IF auth.uid() IS NULL THEN RAISE EXCEPTION ''ACCOUNT_UNAUTHENTICATED'' USING ERRCODE=''42501''; END IF;';
    ELSIF r.denial='role' THEN
      v_before:='IF _user_id IS NULL THEN RETURN false; END IF; IF EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle WHERE user_id=auth.uid()) THEN RETURN false; END IF;';
    ELSIF r.denial='self_false' THEN
      v_before:='IF auth.uid() IS NULL THEN RETURN false; END IF;';
    ELSIF r.denial='empty' THEN
      v_before:='IF auth.uid() IS NULL THEN RETURN; END IF;';
    END IF;
    v_return:=CASE r.denial
      WHEN 'snapshot' THEN 'RETURN jsonb_build_object(''paid_content_entitled'',false,''denial_reason_code'',''ACCOUNT_DELETION_PENDING'');'
      WHEN 'access' THEN 'RETURN jsonb_build_object(''allowed'',false,''denial_reason_code'',''ACCOUNT_DELETION_PENDING'');'
      WHEN 'false' THEN 'RETURN false;'
      WHEN 'role' THEN 'RETURN false;'
      WHEN 'self_false' THEN 'RETURN false;'
      WHEN 'empty' THEN 'RETURN;'
      WHEN 'free' THEN 'RETURN ''free'';'
      WHEN 'attach' THEN format('PERFORM %I.%I(%s); RETURN false;',r.schema_name,'lc09_previous_'||r.function_name,v_call)
      ELSE 'RAISE EXCEPTION ''ACCOUNT_DELETION_PENDING'' USING ERRCODE=''42501'';'
    END;
    -- Copy the old body, then replace the original in place. Renaming the
    -- original would leave RLS policies bound to the bypass implementation OID.
    EXECUTE replace(pg_get_functiondef(v_oid),
      format('FUNCTION %I.%I(',r.schema_name,r.function_name),
      format('FUNCTION %I.%I(',r.schema_name,'lc09_previous_'||r.function_name));
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC,anon,authenticated,service_role',r.schema_name,'lc09_previous_'||r.function_name,v_identity);
    IF v_result LIKE 'TABLE(%' THEN
      v_body:=format('BEGIN %s IF billing.account_deletion_blocked(%s) THEN %s END IF; RETURN QUERY SELECT * FROM %I.%I(%s); END;',v_before,r.user_expression,v_return,r.schema_name,'lc09_previous_'||r.function_name,v_call);
    ELSE
      v_body:=format('BEGIN %s IF billing.account_deletion_blocked(%s) THEN %s END IF; RETURN %I.%I(%s); END;',v_before,r.user_expression,v_return,r.schema_name,'lc09_previous_'||r.function_name,v_call);
    END IF;
    EXECUTE format('CREATE OR REPLACE FUNCTION %I.%I(%s) RETURNS %s LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS %L',r.schema_name,r.function_name,v_args,v_result,v_body);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC,anon,authenticated,service_role',r.schema_name,r.function_name,v_identity);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',r.schema_name,r.function_name,v_identity);
    IF r.denial IN ('snapshot','free','redeem','role','self_false','empty') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',r.schema_name,r.function_name,v_identity);
    END IF;
  END LOOP;
END;
$wrap$;

DO $$ BEGIN
  EXECUTE replace(pg_get_functiondef('billing.apply_subscription_event(uuid,text,text,timestamptz,bigint,text,jsonb,text)'::regprocedure),
    'FUNCTION billing.apply_subscription_event(', 'FUNCTION billing.lc09_previous_apply_subscription_event(');
END $$;

-- Financial/processor evidence must survive parent Auth deletion. Former UUIDs
-- remain restricted pseudonymous correlation keys under the approved schedule.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT con.conrelid::regclass AS relation,con.conname
    FROM pg_constraint con JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=ANY(con.conkey)
    WHERE con.contype='f' AND con.confrelid='auth.users'::regclass AND a.attname='parent_id'
      AND con.conrelid IN ('public.kids_stripe_subscriptions'::regclass,'public.kids_stripe_events'::regclass,
        'public.kids_stripe_refunds'::regclass,'public.kids_retention_notices'::regclass)
  LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.relation,r.conname); END LOOP;
END $$;
ALTER TABLE public.kids_retention_notices ALTER COLUMN recipient_email DROP NOT NULL;

CREATE FUNCTION billing.lc09_block_family_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_parent uuid;
BEGIN
  IF to_jsonb(NEW)?'parent_id' THEN v_parent:=(to_jsonb(NEW)->>'parent_id')::uuid;
  ELSE SELECT parent_id INTO v_parent FROM public.kids_profiles WHERE id=(to_jsonb(NEW)->>'profile_id')::uuid; END IF;
  IF v_parent IS NOT NULL AND billing.account_deletion_blocked(v_parent) THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_block_family_write() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING(table_schema,table_name)
    WHERE c.table_schema='public' AND c.table_name LIKE 'kids\_%' ESCAPE '\'
      AND c.column_name IN ('parent_id','profile_id') AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
      AND c.table_name NOT IN ('kids_stripe_subscriptions','kids_stripe_events','kids_stripe_refunds','kids_retention_notices')
  LOOP EXECUTE format('CREATE TRIGGER a_lc09_parent_write BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_family_write()',r.table_name); END LOOP;
END $$;

DO $$ BEGIN
  EXECUTE replace(pg_get_functiondef('public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz)'::regprocedure),
    'FUNCTION public.apply_kids_stripe_event(', 'FUNCTION public.lc09_previous_apply_kids_stripe_event(');
END $$;
REVOKE ALL ON FUNCTION public.lc09_previous_apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.apply_kids_stripe_event(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_price_id text,p_status text,p_occurred_at timestamptz,p_paid boolean,
  p_paid_invoice_id text,p_period_start timestamptz,p_period_end timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF NOT billing.account_deletion_blocked(p_parent_id) THEN
    RETURN public.lc09_previous_apply_kids_stripe_event(p_event_id,p_parent_id,p_subscription_id,p_customer_id,
      p_price_id,p_status,p_occurred_at,p_paid,p_paid_invoice_id,p_period_start,p_period_end);
  END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9_]+$' OR NOT EXISTS(
    SELECT 1 FROM billing.gateway_customers WHERE user_id=p_parent_id
      AND gateway_code='stripe_us' AND gateway_customer_id=p_customer_id)
    THEN RAISE EXCEPTION 'LC09_KIDS_PROVIDER_MISMATCH'; END IF;
  INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES(p_event_id,p_parent_id) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO billing.webhook_events(gateway_code,gateway_event_id,event_type,status,signature_valid,received_at,processed_at,idempotency_key,payload_minimized)
    VALUES('stripe_us',p_event_id,'kids.subscription_update','processed',true,now(),now(),'stripe:webhook:'||p_event_id,
      jsonb_build_object('product_scope','kids','invoice_id',p_paid_invoice_id,'subscription_id',p_subscription_id,'paid',p_paid,'access_suppressed','account_deletion'))
    ON CONFLICT(gateway_code,gateway_event_id) DO NOTHING;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION billing.lc09_previous_apply_subscription_event(uuid,text,text,timestamptz,bigint,text,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION billing.apply_subscription_event(
  p_subscription_id uuid,p_provider text,p_provider_event_id text,p_effective_at timestamptz,
  p_provider_sequence bigint,p_event_type text,p_payload jsonb,p_idempotency_key text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_user uuid; v_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  SELECT user_id INTO v_user FROM billing.subscriptions WHERE id=p_subscription_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND'; END IF;
  IF NOT billing.account_deletion_blocked(v_user) THEN
    RETURN billing.lc09_previous_apply_subscription_event(p_subscription_id,p_provider,p_provider_event_id,
      p_effective_at,p_provider_sequence,p_event_type,p_payload,p_idempotency_key);
  END IF;
  INSERT INTO billing.subscription_events(subscription_id,event_type,payload,idempotency_key,occurred_at,
    source,provider,provider_event_id,effective_at,provider_sequence,processing_status)
  VALUES(p_subscription_id,p_event_type,coalesce(p_payload,'{}'),p_idempotency_key,
    coalesce(p_effective_at,now()),CASE WHEN p_provider IS NULL THEN 'system' ELSE 'gateway_webhook' END,
    p_provider,p_provider_event_id,p_effective_at,p_provider_sequence,'rejected')
  ON CONFLICT(idempotency_key) DO NOTHING RETURNING id INTO v_id;
  RETURN jsonb_build_object('event_id',v_id,'processing_status','rejected','reason','ACCOUNT_DELETION_PENDING','idempotent_replay',v_id IS NULL);
END;
$$;
REVOKE ALL ON FUNCTION billing.apply_subscription_event(uuid,text,text,timestamptz,bigint,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION billing.apply_subscription_event(uuid,text,text,timestamptz,bigint,text,jsonb,text) TO service_role;

-- Refund settlement remains possible after deletion, with the same family-first
-- locking order and the original ownership/idempotency checks.
DO $$ BEGIN
  EXECUTE replace(pg_get_functiondef('public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz)'::regprocedure),
    'FUNCTION public.apply_kids_stripe_refund(', 'FUNCTION public.lc09_previous_apply_kids_stripe_refund(');
END $$;
REVOKE ALL ON FUNCTION public.lc09_previous_apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.apply_kids_stripe_refund(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_invoice_id text,p_refund_id text,p_refund_amount integer,p_invoice_amount integer,p_refund_status text,p_occurred_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  PERFORM billing.account_deletion_blocked(p_parent_id);
  RETURN public.lc09_previous_apply_kids_stripe_refund(p_event_id,p_parent_id,p_subscription_id,p_customer_id,
    p_invoice_id,p_refund_id,p_refund_amount,p_invoice_amount,p_refund_status,p_occurred_at);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz) TO service_role;

-- A trusted late Stripe event keeps its audit and transaction receipt, without
-- entering any access-producing transition. No financial evidence is cascaded.
DO $$ BEGIN
  EXECUTE replace(pg_get_functiondef('public.apply_stripe_webhook_event(text,text,timestamptz,text,uuid,uuid,uuid,uuid,text,text,text,timestamptz,timestamptz,boolean,text,bigint,text,jsonb)'::regprocedure),
    'FUNCTION public.apply_stripe_webhook_event(', 'FUNCTION public.lc09_previous_apply_stripe_webhook_event(');
END $$;
REVOKE ALL ON FUNCTION public.lc09_previous_apply_stripe_webhook_event(text,text,timestamptz,text,uuid,uuid,uuid,uuid,text,text,text,timestamptz,timestamptz,boolean,text,bigint,text,jsonb)
  FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.apply_stripe_webhook_event(
  p_gateway_event_id text,p_event_type text,p_effective_at timestamptz,p_transition text,
  p_subscription_id uuid,p_user_id uuid,p_plan_version_id uuid,p_market_price_id uuid,
  p_gateway_customer_id text,p_gateway_subscription_id text,p_gateway_status text,
  p_period_start timestamptz,p_period_end timestamptz,p_cancel_at_period_end boolean,
  p_gateway_transaction_id text DEFAULT NULL,p_amount_minor bigint DEFAULT NULL,
  p_currency_code text DEFAULT NULL,p_payload_minimized jsonb DEFAULT '{}'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'STRIPE_WEBHOOK_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF NOT billing.account_deletion_blocked(p_user_id) THEN
    RETURN public.lc09_previous_apply_stripe_webhook_event(
      p_gateway_event_id,p_event_type,p_effective_at,p_transition,p_subscription_id,p_user_id,
      p_plan_version_id,p_market_price_id,p_gateway_customer_id,p_gateway_subscription_id,
      p_gateway_status,p_period_start,p_period_end,p_cancel_at_period_end,
      p_gateway_transaction_id,p_amount_minor,p_currency_code,p_payload_minimized);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.subscriptions WHERE id=p_subscription_id AND user_id=p_user_id)
    OR NOT EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=p_user_id AND gateway_code='stripe_us' AND gateway_customer_id=p_gateway_customer_id)
  THEN RAISE EXCEPTION 'STRIPE_SUBSCRIPTION_OWNERSHIP_MISMATCH'; END IF;
  INSERT INTO billing.webhook_events(gateway_code,gateway_event_id,event_type,status,signature_valid,received_at,processed_at,idempotency_key,payload_minimized)
    VALUES('stripe_us',p_gateway_event_id,p_event_type,'processed',true,now(),now(),'stripe:webhook:'||p_gateway_event_id,
      coalesce(p_payload_minimized,'{}')||jsonb_build_object('access_suppressed','account_deletion'))
    ON CONFLICT(gateway_code,gateway_event_id) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN jsonb_build_object('duplicate',true,'processed',true,'access_suppressed',true); END IF;
  IF p_gateway_transaction_id IS NOT NULL AND p_amount_minor>=0 AND p_currency_code IS NOT NULL THEN
    INSERT INTO billing.payment_transactions(subscription_id,user_id,gateway_code,gateway_transaction_id,
      transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at,succeeded_at,metadata)
    VALUES(p_subscription_id,p_user_id,'stripe_us',p_gateway_transaction_id,
      CASE WHEN p_event_type='checkout.session.completed' THEN 'checkout' ELSE 'renewal' END,
      'succeeded',p_amount_minor,upper(p_currency_code),'stripe:transaction:'||p_gateway_transaction_id,
      coalesce(p_effective_at,now()),coalesce(p_effective_at,now()),jsonb_build_object('stripe_event_id',p_gateway_event_id,'mode','test'))
    ON CONFLICT(gateway_code,gateway_transaction_id) DO NOTHING;
  END IF;
  RETURN jsonb_build_object('duplicate',false,'processed',true,'access_suppressed',true);
END;
$$;
REVOKE ALL ON FUNCTION public.apply_stripe_webhook_event(text,text,timestamptz,text,uuid,uuid,uuid,uuid,text,text,text,timestamptz,timestamptz,boolean,text,bigint,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_event(text,text,timestamptz,text,uuid,uuid,uuid,uuid,text,text,text,timestamptz,timestamptz,boolean,text,bigint,text,jsonb) TO service_role;

-- Catch direct privileged writes and non-Stripe transitions too. Reads above
-- consult the same tombstone even if a stale cache or legacy grant exists.
CREATE FUNCTION billing.lc09_block_access_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF billing.account_deletion_blocked(NEW.user_id) THEN
    CASE TG_TABLE_NAME
      WHEN 'subscriptions' THEN NEW.access_state:='suspended';
      WHEN 'user_entitlement_snapshots' THEN
        NEW.entitlement_json:=jsonb_build_object('paid_content_entitled',false,'denial_reason_code','ACCOUNT_DELETION_PENDING');
        NEW.invalidation_reason:='account_deletion'; NEW.expires_at:=now();
      WHEN 'admin_access_grants' THEN NEW.status:='revoked'; NEW.expires_at:=now();
      WHEN 'admin_user_grant_state' THEN NEW.expires_at:=now();
      WHEN 'user_subscriptions' THEN NEW.tier:='free'; NEW.status:='canceled'; NEW.current_period_end:=now();
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_block_access_write() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT * FROM (VALUES('billing','subscriptions'),('billing','user_entitlement_snapshots'),
    ('billing','admin_access_grants'),('billing','admin_user_grant_state'),('public','user_subscriptions')) x(s,t)
  LOOP
    EXECUTE format('CREATE TRIGGER lc09_access_write BEFORE INSERT OR UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_access_write()',r.s,r.t);
  END LOOP;
END $$;

-- A stale JWT must not recreate learner state after Auth removal. Server mail
-- delivery receipts are operational, and are separately checked at completion.
CREATE FUNCTION billing.lc09_block_learner_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND billing.account_deletion_blocked(NEW.user_id) THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_PENDING' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_block_learner_write() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING(table_schema,table_name)
    WHERE c.table_schema='public' AND c.column_name='user_id' AND c.udt_name='uuid'
      AND t.table_type='BASE TABLE' AND c.table_name NOT IN ('user_subscriptions','subscription_mail_outbox','account_welcome_outbox')
  LOOP
    EXECUTE format('CREATE TRIGGER lc09_learner_write BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_learner_write()',r.table_name);
  END LOOP;
END $$;

CREATE FUNCTION public.lc09_claim_deletion(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_control billing.account_deletion_control%ROWTYPE; v_row billing.account_deletion_lifecycle%ROWTYPE; r record; v_has boolean;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_control FROM billing.account_deletion_control WHERE singleton;
  IF NOT coalesce(v_control.enabled,false) THEN RAISE EXCEPTION 'LC09_DISABLED'; END IF;
  PERFORM billing.account_deletion_blocked(p_user_id);
  PERFORM pg_advisory_xact_lock(hashtextextended('stripe-checkout:'||p_user_id::text,0));
  SELECT * INTO v_row FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_requests WHERE user_id=p_user_id)
      OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'LC09_REQUEST_OR_IDENTITY_MISSING'; END IF;
    INSERT INTO billing.account_deletion_lifecycle(user_id,stage,financial_retention_reference,crm_retention_reference,release_reference)
      VALUES(p_user_id,'blocked',v_control.financial_retention_reference,v_control.crm_retention_reference,v_control.release_reference);
    UPDATE billing.subscriptions SET access_state='suspended' WHERE user_id=p_user_id;
    UPDATE billing.user_entitlement_snapshots SET invalidation_reason='account_deletion',expires_at=now() WHERE user_id=p_user_id;
  END IF;
  SELECT * INTO v_row FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
  IF v_row.stage='complete' THEN RETURN jsonb_build_object('stage','complete'); END IF;
  IF v_row.lease_until>now() THEN RAISE EXCEPTION 'LC09_WORKER_BUSY'; END IF;
  UPDATE billing.account_deletion_lifecycle SET lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes'
    WHERE user_id=p_user_id RETURNING * INTO v_row;
  RETURN jsonb_build_object('stage',v_row.stage,'lease_token',v_row.lease_token,'user_id',p_user_id,
    'storage_objects',billing.lc09_owned_storage(p_user_id),
    'checkout_attempts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'key',idempotency_key,'parameters',parameters)) FROM billing.account_checkout_attempts WHERE user_id=p_user_id AND state='pending'),'[]'),
    'customers',coalesce((SELECT jsonb_agg(jsonb_build_object('id',gateway_customer_id,'gateway',gateway_code,'mode',metadata->>'mode')) FROM billing.gateway_customers WHERE user_id=p_user_id),'[]'),
    'checkout_in_flight',EXISTS(SELECT 1 FROM billing.subscriptions s WHERE s.user_id=p_user_id AND s.billing_state='checkout_pending' AND to_jsonb(s)->>'checkout_session_id' IS NULL));
END;
$$;

CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_row billing.account_deletion_lifecycle%ROWTYPE; r record; v_count integer;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE enabled) THEN RAISE EXCEPTION 'LC09_DISABLED'; END IF;
  PERFORM billing.account_deletion_blocked(p_user_id);
  SELECT * INTO v_row FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_row.lease_token IS DISTINCT FROM p_lease_token OR v_row.lease_until<=now() THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
  IF p_next_stage='release' THEN
    UPDATE billing.account_deletion_lifecycle SET lease_token=NULL,lease_until=NULL WHERE user_id=p_user_id;
    RETURN jsonb_build_object('stage',v_row.stage);
  END IF;
  IF (v_row.stage,p_next_stage) NOT IN (('blocked','provider_reconciled'),('provider_reconciled','learner_erased'),('learner_erased','complete')) THEN RAISE EXCEPTION 'LC09_INVALID_STAGE'; END IF;
  IF p_next_stage='provider_reconciled' THEN
    IF EXISTS(SELECT 1 FROM billing.refunds f JOIN billing.payment_transactions t ON t.id=f.payment_transaction_id WHERE t.user_id=p_user_id AND f.status IN ('pending','approved','processing'))
      OR EXISTS(SELECT 1 FROM billing.payment_transactions WHERE user_id=p_user_id AND status IN ('pending','processing'))
      OR EXISTS(SELECT 1 FROM billing.ai_usage_ledger WHERE user_id=p_user_id AND (status='reserved' OR attempt_status='started'))
      OR EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE user_id=p_user_id AND state='pending')
      OR EXISTS(SELECT 1 FROM public.kids_stripe_refunds WHERE parent_id=p_user_id AND status IN ('pending','requires_action'))
      OR EXISTS(SELECT 1 FROM billing.subscriptions s WHERE s.user_id=p_user_id AND s.billing_state='checkout_pending' AND to_jsonb(s)->>'checkout_session_id' IS NULL)
    THEN RAISE EXCEPTION 'LC09_FINANCIAL_RECONCILIATION_PENDING'; END IF;
  ELSIF p_next_stage='learner_erased' THEN
    FOR r IN SELECT DISTINCT c.table_name FROM information_schema.columns c
      JOIN information_schema.tables t USING(table_schema,table_name)
      WHERE c.table_schema='public' AND c.table_name LIKE 'kids\_%' ESCAPE '\'
        AND c.column_name IN ('parent_id','profile_id') AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
        AND c.table_name NOT IN ('kids_profiles','kids_lesson_progress','kids_profile_consents','kids_family_entitlements',
          'kids_parent_attestations','kids_parent_verifications','kids_parent_access_requests','kids_stripe_subscriptions',
          'kids_stripe_events','kids_stripe_refunds','kids_retention_notices')
    LOOP RAISE EXCEPTION 'LC09_UNCLASSIFIED_FAMILY_TABLE: %',r.table_name; END LOOP;
    -- Explicit public inventory. Newly introduced UUID ownership columns fail
    -- closed instead of silently reporting an incomplete deletion.
    FOR r IN SELECT c.table_name FROM information_schema.columns c
      JOIN information_schema.tables t USING(table_schema,table_name)
      WHERE c.table_schema='public' AND c.column_name='user_id' AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
        AND c.table_name NOT IN ('lesson_progress','user_lesson_status','user_mission_state','mission_submissions',
          'lesson_notes','lesson_quiz_attempts','build_logs','user_streaks','user_activity_time','user_active_device',
          'learner_events','learner_triage','lesson_feedback','lesson_review_schedule','rate_limit_buckets',
          'shadow_watchlist','user_shadow_events','user_validation_sessions','client_error_logs','user_roles',
          'user_subscriptions','account_welcome_outbox','subscription_mail_outbox')
    LOOP RAISE EXCEPTION 'LC09_UNCLASSIFIED_USER_TABLE: %',r.table_name; END LOOP;
    FOR r IN SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t USING(table_schema,table_name)
      WHERE c.table_schema='public' AND c.column_name='user_id' AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
    LOOP EXECUTE format('DELETE FROM public.%I WHERE user_id=$1',r.table_name) USING p_user_id; END LOOP;
    IF to_regclass('public.v9_apply_decisions') IS NOT NULL THEN
      -- Keep shared editorial decisions, remove this operator's attribution.
      UPDATE public.v9_apply_decisions SET decided_by=NULL WHERE decided_by=p_user_id;
    END IF;
    DELETE FROM billing.user_entitlement_snapshots WHERE user_id=p_user_id;
    DELETE FROM billing.entitlement_usage WHERE user_id=p_user_id;
    DELETE FROM billing.account_checkout_attempts WHERE user_id=p_user_id;
    UPDATE billing.ai_usage_ledger SET lesson_id=NULL,metadata='{}'::jsonb WHERE user_id=p_user_id;
    -- Explicit account erasure is distinct from subscription-expiry deletion.
    -- Keep processor receipts, cancel pending notices, remove recipients and
    -- child identifiers, and erase only this parent's family records.
    UPDATE public.kids_retention_notices SET state='cancelled',recipient_email=NULL,profile_ids='{}',
      claim_token=NULL,lease_until=NULL WHERE parent_id=p_user_id;
    UPDATE public.kids_parent_access_requests SET reviewed_by=NULL WHERE reviewed_by=p_user_id AND parent_id IS DISTINCT FROM p_user_id;
    DELETE FROM public.kids_profile_consents WHERE parent_id=p_user_id;
    DELETE FROM public.kids_profiles WHERE parent_id=p_user_id;
    DELETE FROM public.kids_family_entitlements WHERE parent_id=p_user_id;
    DELETE FROM public.kids_parent_attestations WHERE parent_id=p_user_id;
    DELETE FROM public.kids_parent_verifications WHERE parent_id=p_user_id;
    DELETE FROM public.kids_parent_access_requests WHERE parent_id=p_user_id;
    UPDATE public.kids_stripe_subscriptions SET status='canceled',paid_through=NULL WHERE parent_id=p_user_id;
    -- Cost/credit/coupon ledgers are retained under the approved financial
    -- schedule, never treated as anonymous or deleted through a blanket CASCADE.
  ELSIF p_next_stage='complete' THEN
    IF EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'LC09_AUTH_IDENTITY_STILL_EXISTS'; END IF;
    IF jsonb_array_length(billing.lc09_owned_storage(p_user_id))>0 THEN RAISE EXCEPTION 'LC09_STORAGE_OBJECTS_REMAIN'; END IF;
    IF EXISTS(SELECT 1 FROM public.kids_profiles WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_profile_consents WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_parent_attestations WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_parent_verifications WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_parent_access_requests WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_family_entitlements WHERE parent_id=p_user_id)
      OR EXISTS(SELECT 1 FROM public.kids_retention_notices WHERE parent_id=p_user_id AND (recipient_email IS NOT NULL OR cardinality(profile_ids)>0))
      THEN RAISE EXCEPTION 'LC09_FAMILY_DATA_REMAINS'; END IF;
    FOR r IN SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t USING(table_schema,table_name)
      WHERE c.table_schema='public' AND c.column_name='user_id' AND c.udt_name='uuid' AND t.table_type='BASE TABLE'
    LOOP
      EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id=$1',r.table_name) INTO v_count USING p_user_id;
      IF v_count>0 THEN RAISE EXCEPTION 'LC09_LEARNER_ROWS_REMAIN: %',r.table_name; END IF;
    END LOOP;
  END IF;
  UPDATE billing.account_deletion_lifecycle SET stage=p_next_stage,
    provider_reconciled_at=CASE WHEN p_next_stage='provider_reconciled' THEN now() ELSE provider_reconciled_at END,
    learner_erased_at=CASE WHEN p_next_stage='learner_erased' THEN now() ELSE learner_erased_at END,
    completed_at=CASE WHEN p_next_stage='complete' THEN now() ELSE completed_at END,
    lease_token=CASE WHEN p_next_stage='complete' THEN NULL ELSE lease_token END,
    lease_until=CASE WHEN p_next_stage='complete' THEN NULL ELSE now()+interval '5 minutes' END WHERE user_id=p_user_id;
  RETURN jsonb_build_object('stage',p_next_stage);
END;
$$;
REVOKE ALL ON FUNCTION public.lc09_claim_deletion(uuid),public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_claim_deletion(uuid),public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
COMMIT;
