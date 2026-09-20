-- Stripe TEST refund reconciliation. Deploy this before the webhook source.
BEGIN;
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.apply_stripe_refund_event(
  p_gateway_event_id text, p_event_type text, p_effective_at timestamptz,
  p_gateway_refund_id text, p_gateway_invoice_id text, p_status text,
  p_amount_minor bigint, p_currency_code text, p_gateway_subscription_id text,
  p_gateway_customer_id text, p_checkout_generation uuid, p_is_latest_invoice boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO billing, public, pg_temp AS $refund$
DECLARE
  v_pt billing.payment_transactions%ROWTYPE;
  v_sub billing.subscriptions%ROWTYPE;
  v_existing billing.refunds%ROWTYPE;
  v_receipt billing.webhook_events%ROWTYPE;
  v_refund_id uuid;
  v_status text;
  v_total bigint;
  v_held bigint;
  v_gross bigint;
  v_tax bigint;
  v_current boolean := false;
  v_duplicate boolean := false;
  v_stale boolean := false;
  v_target text;
BEGIN
  IF NOT billing.is_service_role_caller() THEN
    RAISE EXCEPTION 'STRIPE_REFUND_SERVICE_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_gateway_event_id IS NULL OR p_gateway_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_gateway_refund_id IS NULL OR p_gateway_refund_id !~ '^re_[A-Za-z0-9_]+$'
    OR p_gateway_invoice_id IS NULL OR p_gateway_invoice_id !~ '^in_[A-Za-z0-9_]+$'
    OR p_event_type IS NULL OR p_event_type NOT IN ('refund.created','refund.updated','refund.failed')
    OR p_status IS NULL OR p_status NOT IN ('pending','requires_action','succeeded','failed','canceled')
    OR p_effective_at IS NULL OR p_amount_minor IS NULL OR p_amount_minor <= 0
    OR p_currency_code IS NULL OR p_gateway_subscription_id IS NULL OR p_gateway_customer_id IS NULL THEN
    RAISE EXCEPTION 'STRIPE_REFUND_INVALID_INPUT' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_pt FROM billing.payment_transactions
    WHERE gateway_code='stripe_us' AND gateway_transaction_id=p_gateway_invoice_id;
  IF NOT FOUND THEN
    -- Roll back the receipt too: refund delivery may precede invoice.paid.
    RAISE EXCEPTION 'STRIPE_REFUND_PAYMENT_NOT_READY' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_sub FROM billing.subscriptions WHERE id=v_pt.subscription_id FOR UPDATE;
  IF NOT FOUND OR v_sub.user_id IS DISTINCT FROM v_pt.user_id THEN
    RAISE EXCEPTION 'STRIPE_REFUND_SUBSCRIPTION_MISMATCH';
  END IF;
  SELECT * INTO v_pt FROM billing.payment_transactions WHERE id=v_pt.id FOR UPDATE;
  v_gross := COALESCE(v_pt.gross_minor,v_pt.amount_minor);
  v_tax := COALESCE(v_pt.tax_minor,v_pt.tax_amount_minor,0);
  IF v_pt.status <> 'succeeded' OR v_pt.metadata->>'mode' IS DISTINCT FROM 'test'
    OR v_pt.currency_code IS DISTINCT FROM upper(p_currency_code) OR p_amount_minor > v_gross
    OR v_gross <= 0 OR v_tax < 0 OR v_tax > v_gross THEN
    RAISE EXCEPTION 'STRIPE_REFUND_PAYMENT_MISMATCH';
  END IF;
  -- The historical invoice ledger is valid even after repurchase. Only the exact
  -- current provider subscription/generation/latest invoice may affect access.
  v_current := COALESCE(p_is_latest_invoice,false)
    AND v_sub.checkout_generation IS NOT DISTINCT FROM p_checkout_generation
    AND EXISTS (SELECT 1 FROM billing.gateway_subscriptions gs
      WHERE gs.subscription_id=v_sub.id AND gs.gateway_code='stripe_us'
        AND gs.gateway_subscription_id=p_gateway_subscription_id
        AND gs.gateway_customer_id=p_gateway_customer_id);

  SELECT * INTO v_receipt FROM billing.webhook_events
    WHERE gateway_code='stripe_us' AND gateway_event_id=p_gateway_event_id;
  IF FOUND THEN
    IF v_receipt.event_type IS DISTINCT FROM p_event_type
      OR v_receipt.payload_minimized->>'refund_id' IS DISTINCT FROM p_gateway_refund_id
      OR v_receipt.payload_minimized->>'invoice_id' IS DISTINCT FROM p_gateway_invoice_id THEN
      RAISE EXCEPTION 'STRIPE_REFUND_EVENT_COLLISION';
    END IF;
    v_duplicate := true;
  END IF;
  SELECT * INTO v_existing FROM billing.refunds
    WHERE gateway_code='stripe_us' AND gateway_refund_id=p_gateway_refund_id;
  IF FOUND THEN
    IF v_existing.payment_transaction_id IS DISTINCT FROM v_pt.id
      OR v_existing.amount_minor IS DISTINCT FROM p_amount_minor
      OR v_existing.currency_code IS DISTINCT FROM upper(p_currency_code) THEN
      RAISE EXCEPTION 'STRIPE_REFUND_ID_COLLISION';
    END IF;
    v_refund_id := v_existing.id;
    v_stale := p_effective_at < (v_existing.metadata->>'stripe_effective_at')::timestamptz
      OR (p_effective_at = (v_existing.metadata->>'stripe_effective_at')::timestamptz
        AND v_existing.status IN ('succeeded','failed','canceled')
        AND p_status IN ('pending','requires_action'));
  END IF;
  v_status := CASE WHEN p_status='requires_action' THEN 'pending' ELSE p_status END;
  IF NOT v_duplicate AND NOT COALESCE(v_stale,false) THEN
    IF v_refund_id IS NULL THEN
      INSERT INTO billing.refunds (
        payment_transaction_id,refund_type,status,amount_minor,currency_code,
        reason_code,gateway_code,gateway_refund_id,idempotency_key,requested_at,metadata
      ) VALUES (
        v_pt.id,'subscription',v_status,p_amount_minor,upper(p_currency_code),
        'stripe_provider_refund','stripe_us',p_gateway_refund_id,
        'stripe:refund:'||p_gateway_refund_id,p_effective_at,'{}'::jsonb
      ) RETURNING id INTO v_refund_id;
    END IF;
    UPDATE billing.refunds SET status=v_status,
      executed_at=CASE WHEN v_status='succeeded' THEN COALESCE(executed_at,now()) ELSE executed_at END,
      failed_at=CASE WHEN v_status IN ('failed','canceled') THEN now() ELSE failed_at END,
      metadata=metadata||jsonb_build_object('mode','test','stripe_status',p_status,
        'stripe_effective_at',p_effective_at,'stripe_event_id',p_gateway_event_id)
      WHERE id=v_refund_id;
  END IF;
  SELECT COALESCE(sum(amount_minor) FILTER (WHERE status='succeeded'),0),
    COALESCE(sum(amount_minor) FILTER (WHERE status IN ('pending','processing','succeeded')),0)
    INTO v_total,v_held FROM billing.refunds WHERE payment_transaction_id=v_pt.id;
  IF v_held > v_gross THEN RAISE EXCEPTION 'STRIPE_REFUND_EXCEEDS_CAPTURED'; END IF;

  -- Reallocate integer tax deterministically, including failed/canceled release.
  WITH allocations AS (
    SELECT id,amount_minor,status,
      sum(amount_minor) FILTER (WHERE status IN ('pending','processing','succeeded'))
        OVER (ORDER BY requested_at,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running,
      COALESCE(sum(floor(v_tax::numeric*amount_minor/v_gross)::bigint)
        FILTER (WHERE status IN ('pending','processing','succeeded'))
        OVER (ORDER BY requested_at,id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) AS prior_tax
    FROM billing.refunds WHERE payment_transaction_id=v_pt.id
  ) UPDATE billing.refunds r SET metadata=r.metadata||jsonb_build_object(
    'gross_minor',v_gross,'is_full_refund',a.running=v_gross AND a.status IN ('pending','processing','succeeded'),
    'tax_allocated_minor',CASE WHEN a.status NOT IN ('pending','processing','succeeded') THEN 0
      WHEN a.running=v_gross THEN v_tax-a.prior_tax
      ELSE floor(v_tax::numeric*a.amount_minor/v_gross)::bigint END)
    FROM allocations a WHERE r.id=a.id;

  IF v_current THEN
    v_target := CASE WHEN v_total=v_gross THEN 'refunded'
      WHEN v_held=v_gross THEN 'refund_pending' ELSE NULL END;
    IF v_target IS NOT NULL AND v_sub.access_state IN
      ('paid_active','past_due','canceled_at_period_end','suspended','refund_pending')
      AND v_sub.access_state IS DISTINCT FROM v_target THEN
      UPDATE billing.subscriptions SET access_state=v_target,updated_at=now()
        WHERE id=v_sub.id;
      INSERT INTO billing.subscription_events (
        subscription_id,event_type,from_access_state,to_access_state,payload,
        idempotency_key,occurred_at,source,provider,provider_event_id,effective_at,processing_status
      ) VALUES (v_sub.id,v_target,v_sub.access_state,v_target,
        jsonb_build_object('refund_id',p_gateway_refund_id,'invoice_id',p_gateway_invoice_id),
        'stripe:refund-access:'||p_gateway_event_id,now(),'gateway_webhook','stripe_us',
        p_gateway_event_id,p_effective_at,'applied');
    END IF;
  END IF;
  IF NOT v_duplicate THEN
    INSERT INTO billing.webhook_events (
      gateway_code,gateway_event_id,event_type,status,payload_minimized,
      signature_valid,received_at,processed_at,idempotency_key
    ) VALUES ('stripe_us',p_gateway_event_id,p_event_type,'processed',
      jsonb_build_object('refund_id',p_gateway_refund_id,'invoice_id',p_gateway_invoice_id,
        'livemode',false,'stale',COALESCE(v_stale,false)),true,now(),now(),
      'stripe:webhook:'||p_gateway_event_id);
  END IF;
  RETURN jsonb_build_object('processed',true,'duplicate',v_duplicate,
    'stale',COALESCE(v_stale,false),'refund_id',v_refund_id,
    'refunded_minor',v_total,'held_minor',v_held,
    'cancel_subscription',v_current AND v_total=v_gross,
    'manual_review_required',v_current AND v_sub.access_state IN ('refund_pending','refunded') AND v_total<v_gross AND v_held<v_gross);
END;
$refund$;
REVOKE ALL ON FUNCTION public.apply_stripe_refund_event(text,text,timestamptz,text,text,text,bigint,text,text,text,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_refund_event(text,text,timestamptz,text,text,text,bigint,text,text,text,uuid,boolean) TO service_role;

-- Cancellation after a full refund records provider closure without erasing the
-- terminal refund state or granting access. Fail closed if baseline has drifted.
DO $guard$
DECLARE v_body text;
BEGIN
  SELECT prosrc INTO v_body FROM pg_proc WHERE oid='billing.subscription_next_access_state(text,text)'::regprocedure;
  IF position('WHEN p_event_type = ''canceled'' AND p_from IN (''refunded'', ''refund_pending'')' IN v_body)>0 THEN
    RETURN;
  END IF;
  IF position('WHEN p_event_type = ''payment_failed''' IN v_body)=0
    OR position('''paid_active'', ''paid_scheduled'', ''past_due''' IN v_body)=0 THEN
    RAISE EXCEPTION 'STRIPE_REFUND_STATE_BASELINE_MISMATCH';
  END IF;
  v_body := replace(v_body,'SELECT CASE',
    'SELECT CASE WHEN p_event_type = ''canceled'' AND p_from IN (''refunded'', ''refund_pending'') THEN p_from');
  EXECUTE format('CREATE OR REPLACE FUNCTION billing.subscription_next_access_state(p_from text,p_event_type text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO billing,public,pg_temp AS %L',v_body);
END;
$guard$;
COMMIT;
