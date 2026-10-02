-- OWNER-FINANCIAL-15D-01. Additive candidate; production activation is separate.
-- Fifteen elapsed days from verified Auth/account deletion, never from request.
BEGIN;

ALTER TABLE billing.account_deletion_control
  ADD COLUMN financial_purge_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE billing.account_deletion_lifecycle
  ADD COLUMN financial_due_at timestamptz,
  ADD COLUMN financial_purged_at timestamptz,
  ADD COLUMN financial_lease_token uuid,
  ADD COLUMN financial_lease_until timestamptz;
UPDATE billing.account_deletion_lifecycle
  SET financial_due_at=completed_at+interval '360 hours' WHERE stage='complete';
ALTER TABLE billing.account_deletion_lifecycle ADD CONSTRAINT lc09_financial_deadline
  CHECK ((stage='complete')=(financial_due_at IS NOT NULL)
    AND (financial_due_at IS NULL OR financial_due_at=completed_at+interval '360 hours')
    AND (financial_purged_at IS NULL OR financial_purged_at>=financial_due_at));

CREATE FUNCTION billing.lc09_set_financial_deadline() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  NEW.financial_due_at:=CASE WHEN NEW.stage='complete'
    THEN NEW.completed_at+interval '360 hours' ELSE NULL END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_set_financial_deadline() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER lc09_financial_deadline BEFORE INSERT OR UPDATE OF stage,completed_at
  ON billing.account_deletion_lifecycle FOR EACH ROW EXECUTE FUNCTION billing.lc09_set_financial_deadline();

CREATE FUNCTION billing.lc09_financial_expired(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  PERFORM billing.account_deletion_blocked(p_user_id);
  RETURN EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle
    WHERE user_id=p_user_id AND stage='complete' AND financial_due_at<=statement_timestamp());
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_financial_expired(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.lc09_financial_expired(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  RETURN billing.lc09_financial_expired(p_user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.lc09_financial_expired(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_financial_expired(uuid) TO service_role;

-- Ownership on new delivery receipts makes even payload-free events erasable.
ALTER TABLE billing.webhook_events ADD COLUMN retention_user_id uuid;
CREATE INDEX lc09_webhook_retention_owner ON billing.webhook_events(retention_user_id);
-- Preserve coupons belonging to other people after their creator is erased.
ALTER TABLE billing.admin_access_coupons ALTER COLUMN created_by_admin_id DROP NOT NULL;

-- Keep installed RPC OIDs/ACLs, and their current ownership/money checks.
-- Stop recording late events at the deadline even if the purge job is paused.
DO $wrap$ DECLARE r record; v_oid oid; v_definition text; v_args text; v_identity text;
  v_result text; v_call text; v_event text; v_owner text; v_body text;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('public','apply_stripe_webhook_event','p_user_id','p_gateway_event_id',
      'RETURN jsonb_build_object(''processed'',true,''access_suppressed'',true,''financial_erased'',true);'),
    ('public','apply_kids_stripe_event','p_parent_id','p_event_id','RETURN false;'),
    ('public','apply_kids_stripe_refund','p_parent_id','p_event_id','RETURN false;')
  ) AS x(s,n,u,e,denial)
  LOOP
    v_oid:=format('%I.%I',r.s,r.n)::regproc;
    v_definition:=pg_get_functiondef(v_oid);
    v_args:=pg_get_function_arguments(v_oid);
    v_identity:=pg_get_function_identity_arguments(v_oid);
    v_result:=pg_get_function_result(v_oid);
    SELECT string_agg(quote_ident(x),',' ORDER BY ord) INTO v_call
      FROM pg_proc p CROSS JOIN LATERAL unnest(p.proargnames) WITH ORDINALITY a(x,ord)
      WHERE p.oid=v_oid;
    EXECUTE replace(v_definition,'FUNCTION '||r.s||'.'||r.n||'(',
      'FUNCTION '||r.s||'.lc09_retained_'||r.n||'(');
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC,anon,authenticated,service_role',
      r.s,'lc09_retained_'||r.n,v_identity);
    v_body:=format('DECLARE v_result %s; BEGIN
      IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION ''LC09_SERVICE_ONLY'' USING ERRCODE=''42501''; END IF;
      IF billing.lc09_financial_expired(%s) THEN %s END IF;
      v_result:=%I.%I(%s);
      UPDATE billing.webhook_events SET retention_user_id=%s WHERE gateway_code=''stripe_us'' AND gateway_event_id=%s
        AND (retention_user_id IS NULL OR retention_user_id=%s);
      RETURN v_result; END;',v_result,r.u,r.denial,r.s,'lc09_retained_'||r.n,v_call,r.u,r.e,r.u);
    EXECUTE format('CREATE OR REPLACE FUNCTION %I.%I(%s) RETURNS %s LANGUAGE plpgsql SECURITY DEFINER
      SET search_path=billing,public,pg_temp AS %L',r.s,r.n,v_args,v_result,v_body);
  END LOOP;
END $wrap$;

-- Tag a receipt in the same transaction as its verified writer. OLD and NEW
-- function bodies remain available only to their owners, as before.
CREATE FUNCTION billing.lc09_tag_webhook_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_user uuid;
BEGIN
  IF NEW.retention_user_id IS NULL THEN
    SELECT s.user_id INTO v_user FROM billing.subscription_events e
      JOIN billing.subscriptions s ON s.id=e.subscription_id
      WHERE e.provider_event_id=NEW.gateway_event_id LIMIT 1;
    IF v_user IS NULL THEN SELECT p.user_id INTO v_user FROM billing.payment_transactions p
      WHERE p.metadata->>'stripe_event_id'=NEW.gateway_event_id LIMIT 1; END IF;
    IF v_user IS NULL THEN SELECT e.parent_id INTO v_user FROM public.kids_stripe_events e
      WHERE e.event_id=NEW.gateway_event_id; END IF;
    IF v_user IS NULL THEN SELECT p.user_id INTO v_user FROM billing.refunds f
      JOIN billing.payment_transactions p ON p.id=f.payment_transaction_id
      WHERE f.gateway_refund_id=NEW.payload_minimized->>'refund_id' LIMIT 1; END IF;
    NEW.retention_user_id:=v_user;
  END IF;
  IF NEW.retention_user_id IS NOT NULL AND billing.lc09_financial_expired(NEW.retention_user_id)
    THEN RAISE EXCEPTION 'LC09_FINANCIAL_RETENTION_EXPIRED' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_tag_webhook_owner() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER lc09_webhook_owner BEFORE INSERT OR UPDATE ON billing.webhook_events
  FOR EACH ROW EXECUTE FUNCTION billing.lc09_tag_webhook_owner();

CREATE FUNCTION billing.lc09_expired_financial_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_user uuid;
BEGIN
  v_user:=coalesce(to_jsonb(NEW)->>'user_id',to_jsonb(NEW)->>'parent_id',
    to_jsonb(NEW)->>'intended_user_id')::uuid;
  IF v_user IS NOT NULL AND billing.lc09_financial_expired(v_user)
    THEN RAISE EXCEPTION 'LC09_FINANCIAL_RETENTION_EXPIRED' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION billing.lc09_expired_financial_write() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT table_schema,table_name FROM information_schema.columns
    WHERE (table_schema='billing' AND column_name IN ('user_id','intended_user_id')
      AND table_name NOT IN ('account_deletion_requests','account_deletion_lifecycle'))
      OR (table_schema='public' AND table_name IN ('kids_stripe_subscriptions','kids_stripe_events','kids_stripe_refunds')
        AND column_name='parent_id')
  LOOP EXECUTE format('CREATE TRIGGER lc09_expired_financial_write BEFORE INSERT OR UPDATE ON %I.%I
    FOR EACH ROW EXECUTE FUNCTION billing.lc09_expired_financial_write()',r.table_schema,r.table_name); END LOOP;
END $$;

-- Owner-only helper: match complete identifier tokens, never a customer prefix.
CREATE FUNCTION billing.lc09_json_mentions(p_value jsonb,p_keys text[]) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM jsonb_path_query(p_value,'$.** ? (@.type() == "string")') j(value),
    unnest(p_keys) k(value) WHERE j.value#>>'{}'=k.value OR
      j.value#>>'{}' ~ ('(^|[^A-Za-z0-9_-])'||k.value||'([^A-Za-z0-9_-]|$)'))
$$;
REVOKE ALL ON FUNCTION billing.lc09_json_mentions(jsonb,text[]) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.lc09_financial_purge_candidates(p_limit integer DEFAULT 5) RETURNS SETOF uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_limit<1 OR p_limit>25 THEN RAISE EXCEPTION 'LC09_INVALID_BATCH'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE financial_purge_enabled) THEN RETURN; END IF;
  RETURN QUERY SELECT user_id FROM billing.account_deletion_lifecycle
    WHERE stage='complete' AND financial_due_at<=statement_timestamp() AND financial_purged_at IS NULL
      AND (financial_lease_until IS NULL OR financial_lease_until<=statement_timestamp())
    ORDER BY financial_due_at,user_id LIMIT p_limit;
END;
$$;

CREATE FUNCTION public.lc09_deletion_candidates(p_limit integer DEFAULT 2) RETURNS SETOF uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_limit<1 OR p_limit>25 THEN RAISE EXCEPTION 'LC09_INVALID_BATCH'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE enabled) THEN RETURN; END IF;
  RETURN QUERY SELECT r.user_id FROM billing.account_deletion_requests r
    LEFT JOIN billing.account_deletion_lifecycle l USING(user_id)
    WHERE (l.user_id IS NULL AND EXISTS(SELECT 1 FROM auth.users a WHERE a.id=r.user_id))
      OR (l.stage<>'complete' AND (l.lease_until IS NULL OR l.lease_until<=statement_timestamp()))
    ORDER BY r.requested_at,r.user_id LIMIT p_limit;
END;
$$;

CREATE FUNCTION public.lc09_claim_financial_purge(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_row billing.account_deletion_lifecycle%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE financial_purge_enabled) THEN RAISE EXCEPTION 'LC09_FINANCIAL_PURGE_DISABLED'; END IF;
  IF NOT billing.lc09_financial_expired(p_user_id) THEN RAISE EXCEPTION 'LC09_FINANCIAL_NOT_DUE'; END IF;
  SELECT * INTO v_row FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
  IF v_row.financial_purged_at IS NOT NULL THEN RETURN jsonb_build_object('stage','financial_purged'); END IF;
  IF v_row.financial_lease_until>statement_timestamp() THEN RAISE EXCEPTION 'LC09_FINANCIAL_WORKER_BUSY'; END IF;
  IF EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'LC09_AUTH_IDENTITY_STILL_EXISTS'; END IF;
  UPDATE billing.account_deletion_lifecycle SET financial_lease_token=gen_random_uuid(),
    financial_lease_until=statement_timestamp()+interval '5 minutes' WHERE user_id=p_user_id RETURNING * INTO v_row;
  RETURN jsonb_build_object('stage','financial_due','user_id',p_user_id,'lease_token',v_row.financial_lease_token,
    'customers',coalesce((SELECT jsonb_agg(jsonb_build_object('id',gateway_customer_id,'gateway',gateway_code,'mode',metadata->>'mode'))
      FROM billing.gateway_customers WHERE user_id=p_user_id),'[]'));
END;
$$;

CREATE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_row billing.account_deletion_lifecycle%ROWTYPE; r record; v_keys text[]:=ARRAY[p_user_id::text];
  v_more text[]; v_subs uuid[]; v_payments uuid[]; v_coupons uuid[]; v_admin_coupons uuid[];
  v_pass integer; v_n integer; v_previous integer;
  v_owned constant text[]:=ARRAY['subscriptions','gateway_customers','payment_transactions','coupon_assignments',
    'ai_usage_ledger','ai_credit_ledger','ai_topup_purchases','monetary_credit_ledger','monetary_credit_allocations',
    'purchase_coupon_reservations','admin_access_grants','admin_user_grant_state','account_checkout_attempts',
    'user_entitlement_snapshots','entitlement_usage'];
  v_linked constant text[]:=ARRAY['subscription_events','gateway_subscriptions','refunds','tax_records',
    'webhook_events','billing_audit_log','outbox_events','job_executions','dead_letter_events',
    'reconciliation_findings','legacy_subscription_import_audit','admin_access_coupons'];
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE financial_purge_enabled) THEN RAISE EXCEPTION 'LC09_FINANCIAL_PURGE_DISABLED'; END IF;
  IF NOT billing.lc09_financial_expired(p_user_id) THEN RAISE EXCEPTION 'LC09_FINANCIAL_NOT_DUE'; END IF;
  SELECT * INTO v_row FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
  IF v_row.financial_purged_at IS NOT NULL THEN RETURN jsonb_build_object('stage','financial_purged'); END IF;
  IF p_lease_token IS NULL OR v_row.financial_lease_token IS NULL OR v_row.financial_lease_until IS NULL
    OR v_row.financial_lease_token IS DISTINCT FROM p_lease_token OR v_row.financial_lease_until<=statement_timestamp()
    THEN RAISE EXCEPTION 'LC09_FINANCIAL_LEASE_LOST'; END IF;
  IF p_release THEN
    UPDATE billing.account_deletion_lifecycle SET financial_lease_token=NULL,financial_lease_until=NULL WHERE user_id=p_user_id;
    RETURN jsonb_build_object('stage','financial_due');
  END IF;
  IF EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'LC09_AUTH_IDENTITY_STILL_EXISTS'; END IF;
  -- The inventory is closed: new ownership tables need a reviewed erasure rule.
  FOR r IN SELECT DISTINCT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t USING(table_schema,table_name)
    WHERE c.table_schema='billing' AND t.table_type='BASE TABLE' AND c.column_name IN ('user_id','legacy_user_id','intended_user_id','parent_id')
      AND NOT c.table_name=ANY(v_owned||v_linked||ARRAY['account_deletion_requests','account_deletion_lifecycle'])
  LOOP RAISE EXCEPTION 'LC09_UNCLASSIFIED_FINANCIAL_TABLE: %',r.table_name; END LOOP;
  SELECT coalesce(array_agg(id),'{}') INTO v_subs FROM billing.subscriptions WHERE user_id=p_user_id;
  SELECT coalesce(array_agg(id),'{}') INTO v_payments FROM billing.payment_transactions WHERE user_id=p_user_id;
  SELECT coalesce(array_agg(id),'{}') INTO v_coupons FROM billing.coupon_assignments WHERE user_id=p_user_id;
  SELECT coalesce(array_agg(id),'{}') INTO v_admin_coupons FROM billing.admin_access_coupons WHERE intended_user_id=p_user_id;
  -- Attribution is not ownership. Unlink this administrator from other users'
  -- grants/coupons and shared published configuration without deleting them.
  FOR r IN SELECT table_name,column_name FROM information_schema.columns
    WHERE table_schema='billing' AND udt_name='uuid' AND column_name IN
      ('created_by_admin_id','granted_by_admin_id','revoked_by','reactivation_approved_by','approved_by','published_by')
  LOOP EXECUTE format('UPDATE billing.%I x SET %I=NULL WHERE %I=$1 AND
    coalesce(to_jsonb(x)->>''user_id'',to_jsonb(x)->>''intended_user_id'') IS DISTINCT FROM $1::text',
    r.table_name,r.column_name,r.column_name) USING p_user_id; END LOOP;
  -- Discover receipt/correlation identifiers before deleting any dependencies.
  -- Shared price/policy/package identifiers are deliberately excluded.
  FOR v_pass IN 1..16 LOOP
    v_previous:=cardinality(v_keys);
    FOR r IN SELECT 'billing' AS s,unnest(v_owned||v_linked) AS t UNION ALL
      SELECT 'public',unnest(ARRAY['kids_stripe_subscriptions','kids_stripe_events','kids_stripe_refunds','kids_retention_notices'])
    LOOP
      EXECUTE format('SELECT coalesce(array_agg(DISTINCT j.value),''{}'') FROM %I.%I x CROSS JOIN LATERAL jsonb_path_query(to_jsonb(x),''$.** ? (@.type() == "object")'') objects(value) CROSS JOIN LATERAL jsonb_each_text(objects.value) j WHERE billing.lc09_json_mentions(to_jsonb(x),$1) AND (coalesce(to_jsonb(x)->>''user_id'',to_jsonb(x)->>''parent_id'',to_jsonb(x)->>''intended_user_id'',to_jsonb(x)->>''retention_user_id'') IS NULL OR coalesce(to_jsonb(x)->>''user_id'',to_jsonb(x)->>''parent_id'',to_jsonb(x)->>''intended_user_id'',to_jsonb(x)->>''retention_user_id'')=$2::text) AND j.key IN (''id'',''event_id'',''gateway_event_id'',''provider_event_id'',''stripe_event_id'',''last_applied_event_id'',''gateway_customer_id'',''gateway_subscription_id'',''legacy_provider_subscription_id'',''gateway_transaction_id'',''gateway_refund_id'',''refund_id'',''invoice_id'',''latest_paid_invoice_id'',''provider_email_id'',''checkout_generation'',''verified_email_hash'',''verified_phone_hash'') AND j.value ~ ''^[A-Za-z0-9_-]{8,}$''',r.s,r.t) INTO v_more USING v_keys,p_user_id;
      SELECT array_agg(DISTINCT x) INTO v_keys FROM unnest(v_keys||v_more) x;
    END LOOP;
    EXIT WHEN cardinality(v_keys)=v_previous;
    IF v_pass=16 THEN RAISE EXCEPTION 'LC09_FINANCIAL_LINK_REVIEW_REQUIRED'; END IF;
  END LOOP;
  -- No account row owned by a different person may reference our deletable
  -- coupon/payment/subscription. Refuse partial erasure rather than CASCADE.
  IF EXISTS(SELECT 1 FROM billing.payment_transactions WHERE user_id<>p_user_id AND
      (subscription_id=ANY(v_subs) OR coupon_assignment_id=ANY(v_coupons)))
    OR EXISTS(SELECT 1 FROM billing.admin_access_grants WHERE user_id<>p_user_id AND source_coupon_id=ANY(v_admin_coupons))
    OR EXISTS(SELECT 1 FROM billing.monetary_credit_allocations WHERE user_id<>p_user_id AND source_payment_transaction_id=ANY(v_payments))
    THEN RAISE EXCEPTION 'LC09_SHARED_FINANCIAL_REFERENCE'; END IF;
  -- Remove receipts and their retry/dead-letter containers before FK parents.
  FOR r IN SELECT 'billing' AS s,unnest(ARRAY['dead_letter_events','reconciliation_findings','job_executions',
    'outbox_events','billing_audit_log','webhook_events','legacy_subscription_import_audit']) AS t
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I x WHERE billing.lc09_json_mentions(to_jsonb(x),$1)
      AND EXISTS(SELECT 1 FROM jsonb_path_query(to_jsonb(x),''$.** ? (@.type() == "object")'') o(value),
      LATERAL jsonb_each_text(o.value) j WHERE j.key IN (''user_id'',''parent_id'',''intended_user_id'',''retention_user_id'')
      AND j.value IS NOT NULL AND j.value<>$2::text)',r.s,r.t) INTO v_n USING v_keys,p_user_id;
    IF v_n>0 THEN RAISE EXCEPTION 'LC09_SHARED_FINANCIAL_RECORD: %.%',r.s,r.t; END IF;
    EXECUTE format('DELETE FROM %I.%I x WHERE billing.lc09_json_mentions(to_jsonb(x),$1)',r.s,r.t) USING v_keys;
  END LOOP;
  DELETE FROM billing.tax_records WHERE payment_transaction_id=ANY(v_payments);
  DELETE FROM billing.ai_topup_purchases WHERE user_id=p_user_id;
  DELETE FROM billing.monetary_credit_allocations WHERE user_id=p_user_id;
  DELETE FROM billing.refunds WHERE payment_transaction_id=ANY(v_payments);
  DELETE FROM billing.payment_transactions WHERE user_id=p_user_id;
  DELETE FROM billing.gateway_subscriptions WHERE subscription_id=ANY(v_subs);
  DELETE FROM billing.subscription_events WHERE subscription_id=ANY(v_subs);
  DELETE FROM billing.user_entitlement_snapshots WHERE user_id=p_user_id;
  DELETE FROM billing.entitlement_usage WHERE user_id=p_user_id;
  DELETE FROM billing.subscriptions WHERE user_id=p_user_id;
  DELETE FROM billing.gateway_customers WHERE user_id=p_user_id;
  DELETE FROM billing.admin_access_grants WHERE user_id=p_user_id;
  DELETE FROM billing.admin_user_grant_state WHERE user_id=p_user_id;
  DELETE FROM billing.admin_access_coupons WHERE intended_user_id=p_user_id;
  DELETE FROM billing.coupon_assignments WHERE user_id=p_user_id;
  DELETE FROM billing.purchase_coupon_reservations WHERE user_id=p_user_id;
  DELETE FROM billing.ai_usage_ledger WHERE user_id=p_user_id;
  DELETE FROM billing.ai_credit_ledger WHERE user_id=p_user_id;
  DELETE FROM billing.monetary_credit_ledger WHERE user_id=p_user_id;
  DELETE FROM billing.account_checkout_attempts WHERE user_id=p_user_id;
  DELETE FROM public.kids_retention_notices WHERE parent_id=p_user_id;
  DELETE FROM public.kids_stripe_refunds WHERE parent_id=p_user_id;
  DELETE FROM public.kids_stripe_events WHERE parent_id=p_user_id;
  DELETE FROM public.kids_stripe_subscriptions WHERE parent_id=p_user_id;
  -- Global reconciliation runs keep their counters and other users' findings;
  -- a target-bearing aggregate needs an explicit field rule before erasure.
  IF EXISTS(SELECT 1 FROM billing.reconciliation_runs x WHERE billing.lc09_json_mentions(to_jsonb(x),v_keys))
    THEN RAISE EXCEPTION 'LC09_SHARED_RECONCILIATION_REVIEW_REQUIRED'; END IF;
  -- Verify the entire declared inventory before the completion receipt commits.
  FOR r IN SELECT 'billing' AS s,unnest(v_owned||v_linked) AS t UNION ALL
    SELECT 'public',unnest(ARRAY['kids_stripe_subscriptions','kids_stripe_events','kids_stripe_refunds','kids_retention_notices','kids_retention_delivery_events'])
  LOOP
    EXECUTE format('SELECT count(*) FROM %I.%I x WHERE billing.lc09_json_mentions(to_jsonb(x),$1)',r.s,r.t) INTO v_n USING v_keys;
    IF v_n<>0 THEN RAISE EXCEPTION 'LC09_FINANCIAL_ROWS_REMAIN: %.%',r.s,r.t; END IF;
  END LOOP;
  UPDATE billing.account_deletion_lifecycle SET financial_purged_at=statement_timestamp(),
    financial_lease_token=NULL,financial_lease_until=NULL WHERE user_id=p_user_id;
  RETURN jsonb_build_object('stage','financial_purged');
END;
$$;
REVOKE ALL ON FUNCTION public.lc09_financial_purge_candidates(integer),public.lc09_claim_financial_purge(uuid),
  public.lc09_complete_financial_purge(uuid,uuid,boolean),public.lc09_deletion_candidates(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_financial_purge_candidates(integer),public.lc09_claim_financial_purge(uuid),
  public.lc09_complete_financial_purge(uuid,uuid,boolean),public.lc09_deletion_candidates(integer) TO service_role;
COMMIT;
