-- Separate Live lifecycle contracts. Existing Test workers remain Test-only.
-- The LC09 tombstone, leases and financial retention deadline remain authoritative.
DO $m17_preservation$
BEGIN
 IF md5(pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure))<>'dd421c3aa7f0beb2e1273ae2c8f56fbc'
 OR md5(pg_get_functiondef('public.lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure))<>'4994e45c9d3eb5964b2f0e9920489a1c'
 OR md5(pg_get_functiondef('public.commerce_previous_lc09_advance_deletion(uuid,uuid,text)'::regprocedure))<>'023565eab976c7d97a58f701812bf75d'
 OR md5(pg_get_functiondef('public.lc09_claim_financial_purge(uuid)'::regprocedure))<>'c5516db9d06c110620f335d444379ede'
 THEN RAISE EXCEPTION 'M17_REVIEWED_DEFINITION_MISMATCH'; END IF;
END $m17_preservation$;
CREATE FUNCTION billing.lc09_requires_live_reconciliation(p_user_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=p_user_id AND metadata->>'mode'='live')
 OR EXISTS(SELECT 1 FROM billing.account_checkout_attempts a WHERE a.user_id=p_user_id
   AND (a.checkout_environment='live' OR billing.scoped_checkout_scope(a.user_id,a.idempotency_key) IS NOT NULL))
 OR EXISTS(SELECT 1 FROM billing.commercial_purchases WHERE user_id=p_user_id AND payment_rail='stripe')
 OR EXISTS(SELECT 1 FROM public.stripe_live_offer_reservations WHERE user_id=p_user_id)
$$;

CREATE FUNCTION billing.lc09_live_financial_holds(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 SELECT coalesce(jsonb_agg(jsonb_build_object('reason',reason,'id',id)),'[]') INTO result FROM (
  SELECT 'customer_mode'::text reason,gateway_customer_id id FROM billing.gateway_customers
   WHERE user_id=p_user_id AND (gateway_code<>'stripe_us_live' OR (metadata->>'mode') IS DISTINCT FROM 'live' OR stripe_environment IS DISTINCT FROM 'live')
  UNION ALL SELECT 'checkout_unresolved',id::text FROM billing.account_checkout_attempts a WHERE user_id=p_user_id
   AND (a.resolved_at IS NULL OR a.scoped_resolution IS NULL)
  UNION ALL SELECT 'core_checkout_pending',id::text FROM billing.subscriptions WHERE user_id=p_user_id AND billing_state='checkout_pending'
  UNION ALL SELECT 'commercial_pending',id::text FROM billing.commercial_purchases WHERE user_id=p_user_id AND payment_rail='stripe'
   AND (state='pending' OR (state='expired' AND payment_id IS NOT NULL) OR (state='held' AND hold_reason IS DISTINCT FROM 'account_deletion'))
  UNION ALL SELECT 'commercial_risk',h.event_id FROM billing.commercial_payment_holds h
   WHERE EXISTS(SELECT 1 FROM billing.commercial_purchases p WHERE p.user_id=p_user_id
    AND (p.session_id=h.session_id OR p.payment_id=h.payment_id))
  UNION ALL SELECT 'subscription_risk',gateway_event_id FROM billing.webhook_events
   WHERE retention_user_id=p_user_id AND live_risk_hold AND gateway_code='stripe_us_live' AND stripe_environment='live'
  UNION ALL SELECT 'refund_pending',f.id::text FROM billing.refunds f JOIN billing.payment_transactions t ON t.id=f.payment_transaction_id
   WHERE t.user_id=p_user_id AND f.status IN ('pending','approved','processing')
  UNION ALL SELECT 'payment_pending',id::text FROM billing.payment_transactions WHERE user_id=p_user_id AND status IN ('pending','processing')
  UNION ALL SELECT 'kids_refund_pending',refund_id FROM public.kids_stripe_refunds WHERE parent_id=p_user_id AND status IN ('pending','requires_action')
  UNION ALL SELECT 'offer_unknown',id::text FROM public.stripe_live_offer_reservations WHERE user_id=p_user_id AND session_id IS NULL
 ) holds;
 RETURN result;
END $$;

CREATE FUNCTION public.lc09_claim_live_deletion(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; lease billing.account_deletion_lifecycle%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 result:=public.lc09_claim_deletion(p_user_id);
 IF result->>'stage'='complete' THEN RETURN result; END IF;
 SELECT * INTO lease FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
 IF lease.lease_token IS NULL OR lease.lease_until IS NULL OR lease.lease_until<=clock_timestamp()
  OR lease.lease_token::text IS DISTINCT FROM result->>'lease_token' THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
 RETURN result||jsonb_build_object('lease_until',lease.lease_until,'server_time',clock_timestamp(),
  'holds',billing.lc09_live_financial_holds(p_user_id),
  'checkout_attempts',coalesce((SELECT jsonb_agg(jsonb_build_object(
   'id',id,'key',idempotency_key,'parameters',parameters,'session_id',session_id,'created_at',created_at,'state',state,
   'scope',coalesce(checkout_scope,billing.scoped_checkout_scope(user_id,idempotency_key)),
   'environment',checkout_environment,'selection_parameters',selection_parameters,'session_expires_at',session_expires_at,
   'create_started_at',create_started_at,'scoped_resolution',scoped_resolution,'resolved_at',resolved_at) ORDER BY id)
   FROM billing.account_checkout_attempts WHERE user_id=p_user_id),'[]'),
  'core_checkouts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'generation',checkout_generation,
   'session_id',checkout_session_id,'started_at',checkout_started_at,'state',billing_state) ORDER BY id)
   FROM billing.subscriptions WHERE user_id=p_user_id AND checkout_generation IS NOT NULL),'[]'),
  'commercial_checkouts',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM billing.commercial_purchases p
   WHERE user_id=p_user_id AND payment_rail='stripe'),'[]'),
  'offer_reservations',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'session_id',session_id,'customer_id',customer_id,
   'subscription_id',subscription_id,'consumed_invoice_id',consumed_invoice_id,'expires_at',expires_at) ORDER BY id)
   FROM public.stripe_live_offer_reservations WHERE user_id=p_user_id),'[]'));
END $$;

CREATE FUNCTION public.lc09_renew_live_lifecycle_lease(p_user_id uuid,p_lease_token uuid,p_phase text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.account_deletion_lifecycle%ROWTYPE; at_time timestamptz; expiry timestamptz;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_lease_token IS NULL OR p_phase IS NULL OR p_phase NOT IN ('deletion','financial') THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO r FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
 at_time:=clock_timestamp(); expiry:=at_time+interval '5 minutes';
 IF NOT FOUND THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
 IF p_phase='deletion' THEN
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE enabled) THEN RAISE EXCEPTION 'LC09_DISABLED'; END IF;
  IF r.stage NOT IN ('blocked','provider_reconciled','learner_erased') OR r.lease_token IS NULL OR r.lease_until IS NULL
   OR r.lease_token IS DISTINCT FROM p_lease_token OR r.lease_until<=at_time THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
  UPDATE billing.account_deletion_lifecycle SET lease_until=expiry WHERE user_id=p_user_id;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE financial_purge_enabled) THEN RAISE EXCEPTION 'LC09_FINANCIAL_PURGE_DISABLED'; END IF;
  IF r.stage<>'complete' OR r.financial_purged_at IS NOT NULL OR r.financial_due_at IS NULL OR r.financial_due_at>at_time
   OR EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) OR r.financial_lease_token IS NULL OR r.financial_lease_until IS NULL
   OR r.financial_lease_token IS DISTINCT FROM p_lease_token OR r.financial_lease_until<=at_time THEN RAISE EXCEPTION 'LC09_FINANCIAL_LEASE_LOST'; END IF;
  UPDATE billing.account_deletion_lifecycle SET financial_lease_until=expiry WHERE user_id=p_user_id;
 END IF;
 RETURN jsonb_build_object('user_id',p_user_id,'lease_token',p_lease_token,'lease_until',expiry,'phase',p_phase,'stage',r.stage,'server_time',at_time,
  'holds',billing.lc09_live_financial_holds(p_user_id));
END $$;

-- Preserve every existing outer cleanup wrapper. Guard the public old-call seam.
ALTER FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RENAME TO m17_previous_advance_deletion;
CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r billing.account_deletion_lifecycle%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO r FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR p_lease_token IS NULL OR r.lease_token IS NULL OR r.lease_until IS NULL
  OR r.lease_token IS DISTINCT FROM p_lease_token OR r.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
 IF p_next_stage IN ('provider_reconciled','learner_erased','complete') AND billing.lc09_requires_live_reconciliation(p_user_id)
  AND jsonb_array_length(billing.lc09_live_financial_holds(p_user_id))>0 THEN RAISE EXCEPTION 'LC09_LIVE_RECONCILIATION_PENDING'; END IF;
 RETURN public.m17_previous_advance_deletion(p_user_id,p_lease_token,p_next_stage);
END $$;

-- This exact statement is the sole earlier erasure of the existing attempt ledger.
-- Preserve Live account proof in the already-declared financial-owned inventory.
DO $preserve_live_attempts$
DECLARE body text; needle constant text:='DELETE FROM billing.account_checkout_attempts WHERE user_id=p_user_id;';
BEGIN
 body:=pg_get_functiondef('public.commerce_previous_lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 IF (length(body)-length(replace(body,needle,'')))/length(needle)<>1 THEN RAISE EXCEPTION 'M17_ERASURE_ANCHOR_MISMATCH'; END IF;
 body:=replace(body,needle,'IF NOT billing.lc09_requires_live_reconciliation(p_user_id) THEN '||needle||' END IF;');
 EXECUTE body;
END $preserve_live_attempts$;

ALTER FUNCTION public.lc09_complete_financial_purge(uuid,uuid,boolean) RENAME TO m17_previous_complete_financial_purge;
CREATE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF p_release IS NULL THEN RAISE EXCEPTION 'LC09_FINANCIAL_LEASE_LOST'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 IF NOT p_release AND billing.lc09_requires_live_reconciliation(p_user_id)
  AND jsonb_array_length(billing.lc09_live_financial_holds(p_user_id))>0 THEN RAISE EXCEPTION 'LC09_LIVE_RECONCILIATION_PENDING'; END IF;
 RETURN public.m17_previous_complete_financial_purge(p_user_id,p_lease_token,p_release);
END $$;

ALTER FUNCTION public.lc09_claim_financial_purge(uuid) RENAME TO m17_previous_claim_financial_purge;
CREATE FUNCTION public.lc09_claim_financial_purge(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 IF billing.lc09_requires_live_reconciliation(p_user_id)
  AND jsonb_array_length(billing.lc09_live_financial_holds(p_user_id))>0 THEN RAISE EXCEPTION 'LC09_LIVE_RECONCILIATION_PENDING'; END IF;
 RETURN public.m17_previous_claim_financial_purge(p_user_id);
END $$;

CREATE FUNCTION public.lc09_claim_live_financial_purge(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; r billing.account_deletion_lifecycle%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 result:=public.lc09_claim_financial_purge(p_user_id);
 IF result->>'stage'='financial_purged' THEN RETURN result; END IF;
 SELECT * INTO r FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
 RETURN result||jsonb_build_object('lease_until',r.financial_lease_until,'server_time',clock_timestamp(),
  'holds',billing.lc09_live_financial_holds(p_user_id));
END $$;

REVOKE ALL ON FUNCTION billing.lc09_requires_live_reconciliation(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION billing.lc09_live_financial_holds(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lc09_claim_live_deletion(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lc09_claim_live_financial_purge(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lc09_renew_live_lifecycle_lease(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lc09_complete_financial_purge(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.m17_previous_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.m17_previous_complete_financial_purge(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.m17_previous_claim_financial_purge(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.lc09_claim_financial_purge(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_claim_live_deletion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lc09_claim_live_financial_purge(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.lc09_renew_live_lifecycle_lease(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lc09_complete_financial_purge(uuid,uuid,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.lc09_claim_financial_purge(uuid) TO service_role;

-- Accepted identity proof only; never an entitlement grant or erasure permit.
CREATE FUNCTION public.lc09_record_live_checkout_proof(
 p_user_id uuid,p_lease_token uuid,p_kind text,p_intent_id uuid,p_session_id text,p_customer_id text,
 p_disposition text,p_subscription_id text DEFAULT NULL,p_payment_id text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE l billing.account_deletion_lifecycle%ROWTYPE; s billing.subscriptions%ROWTYPE;
 p billing.commercial_purchases%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() OR p_user_id IS NULL THEN RAISE EXCEPTION 'LC09_SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO l FROM billing.account_deletion_lifecycle WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND OR p_lease_token IS NULL OR l.lease_token IS NULL OR l.lease_until IS NULL
  OR l.lease_token IS DISTINCT FROM p_lease_token OR l.lease_until<=clock_timestamp()
  OR l.stage NOT IN ('blocked','provider_reconciled','learner_erased')
  OR NOT billing.account_deletion_blocked(p_user_id)
  OR NOT EXISTS(SELECT 1 FROM billing.account_deletion_control WHERE enabled)
 THEN RAISE EXCEPTION 'LC09_LEASE_LOST'; END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('core','commercial') OR p_intent_id IS NULL
  OR p_disposition IS NULL OR p_disposition NOT IN ('observed','expired','completed_terminal')
  OR p_session_id IS NULL OR p_session_id !~ '^cs_(live_)?[A-Za-z0-9]+$'
  OR p_customer_id IS NULL OR p_customer_id !~ '^cus_[A-Za-z0-9]+$'
  OR (p_subscription_id IS NOT NULL AND p_subscription_id !~ '^sub_[A-Za-z0-9]+$')
  OR (p_payment_id IS NOT NULL AND p_payment_id !~ '^pi_[A-Za-z0-9]+$')
  OR (p_kind='commercial' AND (p_disposition='completed_terminal' OR p_subscription_id IS NOT NULL))
  OR (p_kind='core' AND p_payment_id IS NOT NULL)
  OR (p_disposition='expired' AND (p_subscription_id IS NOT NULL OR p_payment_id IS NOT NULL))
  OR (p_kind='core' AND p_disposition='observed' AND p_subscription_id IS NOT NULL)
  OR (p_kind='core' AND p_disposition='completed_terminal' AND p_subscription_id IS NULL)
 THEN RAISE EXCEPTION 'LC09_LIVE_PROOF_INVALID'; END IF;
 IF NOT EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=p_user_id AND gateway_code='stripe_us_live'
   AND gateway_customer_id=p_customer_id AND metadata->>'mode'='live' AND stripe_environment='live')
 THEN RAISE EXCEPTION 'LC09_LIVE_PROOF_CUSTOMER'; END IF;
 IF p_kind='core' THEN
  SELECT * INTO s FROM billing.subscriptions WHERE user_id=p_user_id AND checkout_generation=p_intent_id FOR UPDATE;
  IF NOT FOUND OR (s.checkout_session_id IS NOT NULL AND s.checkout_session_id<>p_session_id)
   OR EXISTS(SELECT 1 FROM billing.subscriptions WHERE checkout_session_id=p_session_id AND id<>s.id)
  THEN RAISE EXCEPTION 'LC09_LIVE_PROOF_BINDING'; END IF;
  IF s.checkout_session_id IS NULL THEN
   PERFORM public.record_stripe_checkout_session(p_user_id,p_intent_id,p_session_id);
   SELECT * INTO s FROM billing.subscriptions WHERE id=s.id;
   IF s.checkout_session_id IS DISTINCT FROM p_session_id THEN RAISE EXCEPTION 'LC09_LIVE_PROOF_NOT_RECORDED'; END IF;
  END IF;
  IF p_disposition='expired' THEN
   PERFORM public.close_stripe_checkout_intent(p_user_id,p_intent_id,p_session_id);
   RETURN EXISTS(SELECT 1 FROM billing.subscriptions WHERE id=s.id AND checkout_generation=p_intent_id
    AND checkout_session_id=p_session_id AND billing_state='checkout_expired');
  ELSIF p_disposition='completed_terminal' THEN
   -- Adapter supplies positive canceled-provider proof; native risk remains held.
   UPDATE billing.subscriptions SET billing_state='canceled',updated_at=now()
    WHERE id=s.id AND checkout_generation=p_intent_id AND checkout_session_id=p_session_id
     AND billing_state IN ('checkout_pending','canceled');
   RETURN FOUND;
  END IF;
 ELSE
  SELECT * INTO p FROM billing.commercial_purchases WHERE id=p_intent_id AND user_id=p_user_id AND payment_rail='stripe' FOR UPDATE;
  IF NOT FOUND OR (p.customer_id IS NOT NULL AND p.customer_id<>p_customer_id)
   OR (p.session_id IS NOT NULL AND p.session_id<>p_session_id)
   OR (p.payment_id IS NOT NULL AND p_payment_id IS NOT NULL AND p.payment_id<>p_payment_id)
  THEN RAISE EXCEPTION 'LC09_LIVE_PROOF_BINDING'; END IF;
  UPDATE billing.commercial_purchases SET customer_id=p_customer_id,session_id=p_session_id,
   payment_id=coalesce(payment_id,p_payment_id) WHERE id=p.id;
  IF p_disposition='expired' THEN
   -- Ordinary inability to close must not roll back newly captured identity.
   IF p.payment_id IS NOT NULL OR p.state NOT IN ('pending','expired') THEN RETURN false; END IF;
   PERFORM public.close_commercial_purchase_session(p.id,p_session_id,p_customer_id,'expired','unpaid',NULL);
   RETURN EXISTS(SELECT 1 FROM billing.commercial_purchases WHERE id=p.id AND state='expired' AND payment_id IS NULL);
  END IF;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.lc09_record_live_checkout_proof(uuid,uuid,text,uuid,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_record_live_checkout_proof(uuid,uuid,text,uuid,text,text,text,text,text) TO service_role;

-- Existing base cleanup remains owned by postgres on the reviewed schema.
GRANT EXECUTE ON FUNCTION billing.lc09_requires_live_reconciliation(uuid) TO postgres;
