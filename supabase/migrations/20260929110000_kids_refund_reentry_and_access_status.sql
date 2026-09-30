-- A fully refunded Kids invoice revokes its test entitlement immediately and
-- lets the same parent start a new test subscription. Keep the refunded invoice
-- identifier so delayed webhook events cannot restore its access.
CREATE OR REPLACE FUNCTION public.apply_kids_stripe_refund(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_invoice_id text,p_refund_id text,p_refund_amount integer,p_invoice_amount integer,p_refund_status text,
  p_occurred_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row public.kids_stripe_subscriptions%ROWTYPE;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_invoice_id IS NULL OR p_refund_id IS NULL OR p_refund_id !~ '^re_[A-Za-z0-9_]+$'
    OR p_refund_status NOT IN ('pending','requires_action','succeeded','failed','canceled')
    OR p_refund_amount<=0 OR p_invoice_amount<=0 OR p_refund_amount>p_invoice_amount
    OR p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes'
  THEN RAISE EXCEPTION 'INVALID_KIDS_REFUND' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_row FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id FOR UPDATE;
  -- A replay of an old refund after a new subscription was bound is stale.
  IF v_row.parent_id IS NOT NULL AND v_row.gateway_subscription_id<>p_subscription_id
    AND EXISTS(SELECT 1 FROM public.kids_stripe_refunds
      WHERE refund_id=p_refund_id AND parent_id=p_parent_id AND invoice_id=p_invoice_id
        AND status='succeeded') THEN
    RETURN false;
  END IF;
  IF v_row.parent_id IS NULL OR v_row.gateway_subscription_id IS DISTINCT FROM p_subscription_id
    OR v_row.gateway_customer_id IS DISTINCT FROM p_customer_id
  THEN RAISE EXCEPTION 'KIDS_REFUND_SUBSCRIPTION_MISMATCH' USING ERRCODE='42501'; END IF;
  INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES(p_event_id,p_parent_id)
    ON CONFLICT DO NOTHING;
  -- The webhook retries cancellation after a failure between this transaction
  -- and the Stripe API call. Return true for the already applied same invoice.
  IF NOT FOUND THEN
    RETURN v_row.status='refunded' AND v_row.latest_paid_invoice_id=p_invoice_id;
  END IF;
  INSERT INTO public.kids_stripe_refunds(refund_id,parent_id,invoice_id,amount_minor,status)
    VALUES(p_refund_id,p_parent_id,p_invoice_id,p_refund_amount,p_refund_status)
    ON CONFLICT(refund_id) DO UPDATE SET status=CASE
      WHEN public.kids_stripe_refunds.status='succeeded' THEN 'succeeded'
      ELSE EXCLUDED.status END
      WHERE public.kids_stripe_refunds.parent_id=EXCLUDED.parent_id
        AND public.kids_stripe_refunds.invoice_id=EXCLUDED.invoice_id
        AND public.kids_stripe_refunds.amount_minor=EXCLUDED.amount_minor;
  IF NOT FOUND THEN RAISE EXCEPTION 'KIDS_REFUND_MISMATCH' USING ERRCODE='42501'; END IF;
  IF v_row.latest_paid_invoice_id=p_invoice_id AND (
    SELECT coalesce(sum(amount_minor),0) FROM public.kids_stripe_refunds
    WHERE parent_id=p_parent_id AND invoice_id=p_invoice_id AND status='succeeded'
  )>=p_invoice_amount AND v_row.status<>'refunded' THEN
    UPDATE public.kids_stripe_subscriptions SET status='refunded',paid_through=NULL,
      last_event_at=p_occurred_at,updated_at=now() WHERE parent_id=p_parent_id;
    DELETE FROM public.kids_family_entitlements
      WHERE parent_id=p_parent_id AND entitlement_reference='stripe-test:'||p_subscription_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_refund(text,uuid,text,text,text,text,integer,integer,text,timestamptz)
  TO service_role;

-- Preserve the terminal refund state when Stripe's cancellation webhook arrives.
-- The old subscription may be replaced after a full refund, but its invoice
-- must never regrant access through a delayed event.
CREATE OR REPLACE FUNCTION public.apply_kids_stripe_event(
  p_event_id text,p_parent_id uuid,p_subscription_id text,p_customer_id text,
  p_price_id text,p_status text,p_occurred_at timestamptz,p_paid boolean,
  p_paid_invoice_id text,p_period_start timestamptz,p_period_end timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row public.kids_stripe_subscriptions%ROWTYPE; v_customer text;
  v_ref text:='stripe-test:'||p_subscription_id;
BEGIN
  IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_subscription_id IS NULL OR p_subscription_id !~ '^sub_[A-Za-z0-9_]+$'
    OR p_status NOT IN ('active','trialing','past_due','unpaid','canceled','incomplete','paused')
    OR p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes'
    OR NOT EXISTS(SELECT 1 FROM public.kids_stripe_prices WHERE gateway_price_id=p_price_id)
  THEN RAISE EXCEPTION 'INVALID_KIDS_EVENT' USING ERRCODE='22023'; END IF;
  SELECT gateway_customer_id INTO v_customer FROM billing.gateway_customers
    WHERE user_id=p_parent_id AND gateway_code='stripe_us' AND status='active';
  IF v_customer IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'KIDS_CUSTOMER_MISMATCH' USING ERRCODE='42501'; END IF;
  INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES(p_event_id,p_parent_id)
    ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO v_row FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id FOR UPDATE;
  IF v_row.parent_id IS NOT NULL AND v_row.gateway_subscription_id<>p_subscription_id THEN
    -- Stripe may deliver the canceled old subscription after the new one.
    IF p_status IN ('canceled','unpaid') AND NOT p_paid THEN RETURN false; END IF;
    IF v_row.status NOT IN ('canceled','unpaid','refunded') OR v_row.paid_through>now() THEN
      RAISE EXCEPTION 'KIDS_SUBSCRIPTION_ALREADY_BOUND' USING ERRCODE='23505'; END IF;
    DELETE FROM public.kids_stripe_subscriptions WHERE parent_id=p_parent_id;
    v_row:=NULL;
  END IF;
  IF v_row.last_event_at IS NOT NULL AND p_occurred_at<v_row.last_event_at THEN RETURN false; END IF;
  IF v_row.status='refunded' THEN RETURN false; END IF;
  IF p_paid AND v_row.paid_through IS NOT NULL AND p_period_end<v_row.paid_through THEN
    RETURN false;
  END IF;
  IF p_paid AND (p_status<>'active' OR p_paid_invoice_id IS NULL
    OR p_paid_invoice_id !~ '^in_[A-Za-z0-9_]+$'
    OR p_period_start IS NULL OR p_period_end IS NULL
    OR p_period_end<=p_period_start OR p_period_end<=now()) THEN
    RAISE EXCEPTION 'INVALID_KIDS_PAYMENT' USING ERRCODE='22023'; END IF;
  INSERT INTO public.kids_stripe_subscriptions(parent_id,gateway_subscription_id,
    gateway_customer_id,gateway_price_id,status,latest_paid_invoice_id,paid_through,last_event_at)
  VALUES(p_parent_id,p_subscription_id,p_customer_id,p_price_id,p_status,
    CASE WHEN p_paid THEN p_paid_invoice_id END,CASE WHEN p_paid THEN p_period_end END,p_occurred_at)
  ON CONFLICT(parent_id) DO UPDATE SET status=EXCLUDED.status,
    gateway_price_id=EXCLUDED.gateway_price_id,last_event_at=EXCLUDED.last_event_at,updated_at=now(),
    latest_paid_invoice_id=coalesce(EXCLUDED.latest_paid_invoice_id,public.kids_stripe_subscriptions.latest_paid_invoice_id),
    paid_through=coalesce(EXCLUDED.paid_through,public.kids_stripe_subscriptions.paid_through);
  IF p_paid THEN
    INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference)
      VALUES(p_parent_id,p_period_start,p_period_end,v_ref)
      ON CONFLICT(parent_id) DO UPDATE SET active_from=EXCLUDED.active_from,
        active_until=EXCLUDED.active_until,entitlement_reference=EXCLUDED.entitlement_reference
      WHERE public.kids_family_entitlements.entitlement_reference LIKE 'stripe-test:%'
        OR public.kids_family_entitlements.active_until<=now();
  ELSIF p_status IN ('canceled','unpaid') THEN
    DELETE FROM public.kids_family_entitlements
      WHERE parent_id=p_parent_id AND entitlement_reference=v_ref;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_kids_stripe_event(text,uuid,text,text,text,text,timestamptz,boolean,text,timestamptz,timestamptz)
  TO service_role;

-- Older full refunds retained the former paid-through date. They have already
-- lost the matching Stripe entitlement; clear the stale date for re-entry.
UPDATE public.kids_stripe_subscriptions SET paid_through=NULL,updated_at=now()
  WHERE status='refunded' AND paid_through IS NOT NULL;

-- The account screen shows the effective lesson grant separately from the
-- payment history. Return only the caller's grant class, never its raw reference.
CREATE FUNCTION public.get_my_kids_access_status()
RETURNS TABLE(access_source text,active_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT CASE WHEN e.entitlement_reference LIKE 'stripe-test:%'
      THEN 'stripe_test' ELSE 'test_grant' END,e.active_until
  FROM public.kids_family_entitlements e
  WHERE e.parent_id=(SELECT auth.uid()) AND e.active_from<=now() AND e.active_until>now();
$$;
REVOKE ALL ON FUNCTION public.get_my_kids_access_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_kids_access_status() TO authenticated;
