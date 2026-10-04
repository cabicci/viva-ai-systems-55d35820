BEGIN;
-- Transactional command boundary. Caller identity is always auth.uid(), never
-- an administrator-supplied password or client role. No email is sent here.
CREATE FUNCTION billing.commerce_allocate_existing(p_payment uuid,p_allocations jsonb,p_reuse_review text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE p billing.commerce_payments%ROWTYPE; o billing.commerce_orders%ROWTYPE;r record;v_total bigint;v_amount bigint;v_used bigint; BEGIN
 SELECT * INTO p FROM billing.commerce_payments WHERE id=p_payment FOR UPDATE;
 IF NOT FOUND OR jsonb_array_length(p_allocations) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'COMMERCE_ALLOCATIONS_REQUIRED'; END IF;
 IF (SELECT count(DISTINCT x->>'order_id') FROM jsonb_array_elements(p_allocations) x)<>jsonb_array_length(p_allocations) THEN RAISE EXCEPTION 'COMMERCE_DUPLICATE_ALLOCATION'; END IF;
 SELECT coalesce(sum(amount_minor),0) INTO v_used FROM billing.commerce_allocations WHERE payment_id=p.id;
 SELECT coalesce(sum((x->>'amount_minor')::bigint),0) INTO v_total FROM jsonb_array_elements(p_allocations) x;
 IF v_total+v_used+coalesce((SELECT sum(amount_minor) FROM billing.commerce_refunds WHERE payment_id=p.id AND order_id IS NULL),0)>p.amount_minor THEN RAISE EXCEPTION 'COMMERCE_ALLOCATION_MISMATCH'; END IF;
 FOR r IN SELECT DISTINCT user_id FROM billing.commerce_orders WHERE id IN (SELECT (x->>'order_id')::uuid FROM jsonb_array_elements(p_allocations) x) AND user_id IS NOT NULL ORDER BY user_id LOOP PERFORM billing.commerce_assert_identity(r.user_id); END LOOP;
 FOR r IN SELECT value FROM jsonb_array_elements(p_allocations) ORDER BY value->>'order_id' LOOP
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(r.value->>'order_id')::uuid FOR UPDATE;
   IF NOT FOUND OR o.method<>p.method OR o.currency<>p.currency OR o.group_id IS DISTINCT FROM p.group_id OR (p.group_id IS NULL AND o.user_id IS DISTINCT FROM p.user_id)
     OR o.review_status IN ('confirmed','cancelled','expired','refunded','rejected') OR o.expires_at<=now() THEN RAISE EXCEPTION 'COMMERCE_ORDER_NOT_CONFIRMABLE'; END IF;
   v_amount:=(r.value->>'amount_minor')::bigint;
   SELECT coalesce(sum(amount_minor),0) INTO v_used FROM billing.commerce_allocations WHERE order_id=o.id;
   IF v_amount<=0 OR v_used+v_amount>o.final_minor THEN RAISE EXCEPTION 'COMMERCE_ALLOCATION_MISMATCH'; END IF;
   IF EXISTS(SELECT 1 FROM billing.commerce_receipts WHERE order_id=o.id AND suspected_reuse) AND length(btrim(coalesce(p_reuse_review,'')))=0 THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_REUSE_REVIEW'; END IF;
   INSERT INTO billing.commerce_allocations(payment_id,order_id,amount_minor) VALUES(p.id,o.id,v_amount)
     ON CONFLICT(payment_id,order_id) DO UPDATE SET amount_minor=billing.commerce_allocations.amount_minor+EXCLUDED.amount_minor;
   IF v_used+v_amount=o.final_minor THEN
     PERFORM 1 FROM billing.commerce_offers WHERE id=o.offer_id FOR UPDATE;
     UPDATE billing.commerce_orders SET review_status='confirmed',confirmed_at=now(),offer_consumed=offer_id IS NOT NULL WHERE id=o.id;
     PERFORM billing.commerce_activate(o.id);
   ELSE UPDATE billing.commerce_orders SET review_status='pending' WHERE id=o.id; END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_allocate_existing(uuid,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_uid uuid:=auth.uid(); v_email text; v_admin boolean; v_price jsonb;
 v_method billing.commerce_methods%ROWTYPE; o billing.commerce_orders%ROWTYPE;
 i billing.commerce_invitations%ROWTYPE; g billing.commerce_grants%ROWTYPE;
 p billing.commerce_payments%ROWTYPE; r record; v_id uuid; v_group uuid; v_order uuid;
 v_key text; v_start timestamptz; v_final bigint; v_sum bigint; v_allocated bigint; v_amount bigint;
 v_rows jsonb:='[]'; v_parameters jsonb; v_offer billing.commerce_offers%ROWTYPE; v_preview_counts jsonb:='{}'; v_preview_key text; v_preview_count integer;
BEGIN
 v_email:=billing.commerce_assert_identity(v_uid); v_admin:=billing.commerce_is_admin();
 IF p_action='status' THEN RETURN jsonb_build_object('enabled',(SELECT enabled FROM billing.commerce_control WHERE singleton),'admin',v_admin); END IF;
 IF p_action NOT IN ('methods','admin_list','my_list','order','invitation','my_mail_preferences','configure_method','mail_preferences') AND NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE singleton AND enabled) THEN RAISE EXCEPTION 'COMMERCE_DISABLED'; END IF;
 IF p_action IN ('configure_method','create_group','import','create_offer','review','confirm','grant','manage_access','refund','group_state','queue','mail_preferences','admin_list','preview_import','revoke_invitation','offer_state','reconcile_mail','allocate')
   AND NOT v_admin THEN RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_action='methods' THEN
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(m)||jsonb_build_object('enabled',m.enabled AND (m.code IN ('stripe','paymob') OR EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled)))) FROM billing.commerce_methods m WHERE code<>'admin'),'[]');
 ELSIF p_action='quote' THEN
   RETURN billing.commerce_quote(p_data->>'package',p_data->>'market',p_data->>'billing_interval',p_data->>'code',v_email,coalesce((p_data->>'renewal')::boolean,false));
 ELSIF p_action='configure_method' THEN
   IF p_data->>'code' NOT IN ('instapay','wallet','bank') THEN RAISE EXCEPTION 'COMMERCE_METHOD_NOT_CONFIGURABLE'; END IF;
   IF p_data ? 'instructions_localized' THEN
     IF jsonb_typeof(p_data->'instructions_localized')<>'object' THEN RAISE EXCEPTION 'COMMERCE_INVALID_LOCALIZED_INSTRUCTIONS'; END IF;
     IF EXISTS(SELECT 1 FROM jsonb_each(p_data->'instructions_localized') x
       WHERE x.key NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') OR jsonb_typeof(x.value)<>'string'
       OR length(btrim(x.value#>>'{}')) NOT BETWEEN 1 AND 4000)
       THEN RAISE EXCEPTION 'COMMERCE_INVALID_LOCALIZED_INSTRUCTIONS'; END IF;
   END IF;
   IF coalesce((p_data->>'enabled')::boolean,false) AND (length(btrim(coalesce(p_data->>'destination','')))=0 OR length(btrim(coalesce(p_data->>'instructions','')))=0)
      THEN RAISE EXCEPTION 'COMMERCE_DESTINATION_REQUIRED'; END IF;
   UPDATE billing.commerce_methods SET enabled=(p_data->>'enabled')::boolean,
     destination=p_data->>'destination',instructions=p_data->>'instructions',qr_url=nullif(p_data->>'qr_url',''),
     instructions_localized=coalesce(p_data->'instructions_localized',instructions_localized),
     currencies=ARRAY(SELECT jsonb_array_elements_text(p_data->'currencies')),updated_at=now() WHERE code=p_data->>'code';
   v_id:=NULL;
 ELSIF p_action='create_order' THEN
   v_key:=v_uid::text||':'||(p_data->>'key');
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_key,0));
   SELECT * INTO o FROM billing.commerce_orders WHERE request_key=v_key;
   IF FOUND THEN
     IF o.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
     RETURN to_jsonb(o);
   END IF;
   v_price:=billing.commerce_quote(p_data->>'package',p_data->>'market',p_data->>'billing_interval',p_data->>'code',v_email,coalesce((p_data->>'renewal')::boolean,false));
   SELECT * INTO v_method FROM billing.commerce_methods WHERE code=p_data->>'method' FOR SHARE;
   IF (v_price->>'offer_kind')='complimentary' THEN
     v_method.code:='admin';
   ELSIF v_method.code IS NULL OR v_method.code NOT IN ('instapay','wallet','bank') OR NOT v_method.enabled
     OR v_method.destination='' OR v_method.instructions='' OR NOT (v_price->>'currency'=ANY(v_method.currencies)) THEN RAISE EXCEPTION 'COMMERCE_METHOD_UNAVAILABLE'; END IF;
   IF p_data->>'package'='kids' THEN
     IF NOT public.kids_parent_can_manage_profiles() THEN RAISE EXCEPTION 'COMMERCE_PARENT_REQUIRED'; END IF;
     IF (EXISTS(SELECT 1 FROM public.kids_parent_access_requests WHERE parent_id=v_uid AND country_code='EG')) IS DISTINCT FROM (p_data->>'market'='EG') THEN RAISE EXCEPTION 'COMMERCE_KIDS_MARKET_MISMATCH'; END IF;
   END IF;
   INSERT INTO billing.commerce_orders(user_id,recipient_email,package,billing_interval,start_rule,original_minor,final_minor,currency,method,instructions_snapshot,offer_id,request_key,parameters,duration_days)
   VALUES(v_uid,v_email,p_data->>'package',p_data->>'billing_interval',CASE WHEN coalesce((p_data->>'renewal')::boolean,false) THEN 'after_expiry' ELSE 'confirmation' END,
     (v_price->>'original_minor')::bigint,(v_price->>'final_minor')::bigint,v_price->>'currency',v_method.code,
     to_jsonb(v_method),nullif(v_price->>'offer_id','')::uuid,v_key,p_data,
     CASE WHEN v_price->>'offer_kind'='complimentary' THEN (v_price->>'offer_duration_days')::integer END) RETURNING * INTO o;
   IF o.offer_id IS NOT NULL THEN UPDATE billing.commerce_orders SET expires_at=least(expires_at,(SELECT valid_until FROM billing.commerce_offers WHERE id=o.offer_id)) WHERE id=o.id; END IF;
   IF v_price->>'offer_kind'='complimentary' THEN
     UPDATE billing.commerce_orders SET review_status='confirmed',confirmed_at=now(),offer_consumed=true WHERE id=o.id;
     INSERT INTO billing.commerce_grants(user_id,package,offer_order_id,reason,request_key) VALUES(v_uid,o.package,o.id,'Offer redemption',v_key) RETURNING id INTO v_id;
     INSERT INTO billing.commerce_entitlements(user_id,package,grant_id,starts_at,ends_at) VALUES(v_uid,o.package,v_id,now(),now()+make_interval(days=>o.duration_days));
   END IF;
   RETURN (SELECT to_jsonb(x) FROM billing.commerce_orders x WHERE id=o.id);
 ELSIF p_action='my_list' THEN
   -- Attempt eligible, confirmed pending Kids activation after the existing
   -- guardian flow completes. This never grants profiles or writes consent.
   FOR o IN SELECT * FROM billing.commerce_orders WHERE user_id=v_uid AND review_status='confirmed' AND package='kids' LOOP PERFORM billing.commerce_activate(o.id); END LOOP;
   RETURN jsonb_build_object('orders',coalesce((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('entitlement',
     (SELECT to_jsonb(e) FROM billing.commerce_entitlements e WHERE e.order_id=x.id OR e.grant_id=(SELECT id FROM billing.commerce_grants WHERE offer_order_id=x.id))))
     FROM (SELECT * FROM billing.commerce_orders WHERE user_id=v_uid ORDER BY created_at DESC LIMIT 200) x),'[]'),
     'entitlements',coalesce((SELECT jsonb_agg(to_jsonb(e)) FROM billing.commerce_entitlements e WHERE user_id=v_uid),'[]'));
 ELSIF p_action='order' THEN
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(p_data->>'id')::uuid;
   IF NOT FOUND OR NOT (v_admin OR o.user_id=v_uid) THEN RAISE EXCEPTION 'COMMERCE_ORDER_FORBIDDEN' USING ERRCODE='42501'; END IF;
   RETURN to_jsonb(o)||jsonb_build_object('receipts',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_receipts x WHERE order_id=o.id),'[]'));
 ELSIF p_action='cancel_order' THEN
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF NOT FOUND OR NOT (v_admin OR o.user_id=v_uid) THEN RAISE EXCEPTION 'COMMERCE_ORDER_FORBIDDEN'; END IF;
   IF o.review_status IN ('confirmed','refunded') OR EXISTS(SELECT 1 FROM billing.commerce_allocations WHERE order_id=o.id) THEN RAISE EXCEPTION 'COMMERCE_CANCEL_PAID_ORDER'; END IF;
   UPDATE billing.commerce_orders SET review_status='cancelled' WHERE id=o.id; v_id:=o.id;
 ELSIF p_action='review' THEN
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF NOT FOUND OR o.review_status IN ('confirmed','cancelled','expired','refunded') OR p_data->>'status' NOT IN ('rejected','more_info') OR length(btrim(coalesce(p_data->>'reason','')))=0 THEN RAISE EXCEPTION 'COMMERCE_INVALID_REVIEW'; END IF;
   UPDATE billing.commerce_orders SET review_status=p_data->>'status',review_reason=p_data->>'reason' WHERE id=o.id; v_id:=o.id;
 ELSIF p_action='confirm' THEN
   -- Single payment record, with explicit allocations. A shared receipt is
   -- never multiplied into revenue. Lock order IDs in a deterministic order.
   v_key:='payment:'||(p_data->>'key');
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_key,0));
   SELECT * INTO p FROM billing.commerce_payments WHERE request_key=v_key;
   IF FOUND THEN IF p.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF; RETURN to_jsonb(p); END IF;
   IF jsonb_array_length(p_data->'allocations') NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'COMMERCE_ALLOCATIONS_REQUIRED'; END IF;
   IF (SELECT count(DISTINCT x->>'order_id') FROM jsonb_array_elements(p_data->'allocations') x)<>jsonb_array_length(p_data->'allocations') THEN RAISE EXCEPTION 'COMMERCE_DUPLICATE_ALLOCATION'; END IF;
   IF NOT coalesce((p_data->>'funds_verified')::boolean,false) THEN RAISE EXCEPTION 'COMMERCE_FUNDS_NOT_VERIFIED'; END IF;
   IF EXISTS(SELECT 1 FROM billing.commerce_payments WHERE method=p_data->>'method' AND transaction_reference=lower(btrim(p_data->>'transaction_reference'))) THEN RAISE EXCEPTION 'COMMERCE_TRANSACTION_REFERENCE_REUSED_REVIEW_REQUIRED'; END IF;
   IF EXISTS(SELECT 1 FROM billing.commerce_payments WHERE transaction_reference=lower(btrim(p_data->>'transaction_reference'))) AND length(btrim(coalesce(p_data->>'reuse_review','')))=0 THEN RAISE EXCEPTION 'COMMERCE_TRANSACTION_REFERENCE_REUSE_REVIEW'; END IF;
   v_sum:=0;
   FOR r IN SELECT DISTINCT user_id FROM billing.commerce_orders WHERE id IN (SELECT (x->>'order_id')::uuid FROM jsonb_array_elements(p_data->'allocations') x) AND user_id IS NOT NULL ORDER BY user_id LOOP PERFORM billing.commerce_assert_identity(r.user_id); END LOOP;
   FOR r IN SELECT value FROM jsonb_array_elements(p_data->'allocations') ORDER BY value->>'order_id' LOOP
     SELECT * INTO o FROM billing.commerce_orders WHERE id=(r.value->>'order_id')::uuid FOR UPDATE;
     IF NOT FOUND OR o.method NOT IN ('instapay','wallet','bank') OR o.method<>p_data->>'method' OR o.currency<>p_data->>'currency'
       OR o.review_status IN ('confirmed','cancelled','expired','refunded','rejected') OR o.expires_at<=now() THEN RAISE EXCEPTION 'COMMERCE_ORDER_NOT_CONFIRMABLE'; END IF;
     IF o.user_id IS NOT NULL THEN PERFORM billing.commerce_assert_identity(o.user_id); END IF;
     IF (p_data->>'group_id') IS NULL AND jsonb_array_length(p_data->'allocations')>1 THEN RAISE EXCEPTION 'COMMERCE_GROUP_REQUIRED'; END IF;
     IF (p_data->>'group_id') IS NOT NULL AND o.group_id IS DISTINCT FROM (p_data->>'group_id')::uuid THEN RAISE EXCEPTION 'COMMERCE_GROUP_MISMATCH'; END IF;
     v_amount:=(r.value->>'amount_minor')::bigint;
     SELECT coalesce(sum(a.amount_minor),0) INTO v_allocated FROM billing.commerce_allocations a WHERE a.order_id=o.id;
     IF v_amount<=0 OR v_allocated+v_amount>o.final_minor THEN RAISE EXCEPTION 'COMMERCE_ALLOCATION_MISMATCH'; END IF;
     IF EXISTS(SELECT 1 FROM billing.commerce_receipts WHERE order_id=o.id AND suspected_reuse) AND length(btrim(coalesce(p_data->>'reuse_review','')))=0 THEN RAISE EXCEPTION 'COMMERCE_RECEIPT_REUSE_REVIEW'; END IF;
     v_sum:=v_sum+v_amount;
   END LOOP;
   IF v_sum>(p_data->>'amount_minor')::bigint OR (p_data->>'amount_minor')::bigint<=0 OR (p_data->>'received_at')::timestamptz>now()+interval '5 minutes' THEN RAISE EXCEPTION 'COMMERCE_PAYMENT_AMOUNT_MISMATCH'; END IF;
   INSERT INTO billing.commerce_payments(user_id,group_id,method,currency,amount_minor,transaction_reference,received_at,confirmed_by,request_key,parameters)
   VALUES(CASE WHEN p_data->>'group_id' IS NULL THEN o.user_id END,nullif(p_data->>'group_id','')::uuid,p_data->>'method',p_data->>'currency',(p_data->>'amount_minor')::bigint,
     lower(btrim(p_data->>'transaction_reference')),(p_data->>'received_at')::timestamptz,v_uid,v_key,p_data) RETURNING * INTO p;
   INSERT INTO billing.commerce_provider_references(payment_id,provider,reference,state,verified_at) VALUES(p.id,'manual',p.method||':'||p.transaction_reference,'confirmed',now());
   FOR r IN SELECT value FROM jsonb_array_elements(p_data->'allocations') ORDER BY value->>'order_id' LOOP
     v_order:=(r.value->>'order_id')::uuid;
     INSERT INTO billing.commerce_allocations(payment_id,order_id,amount_minor) VALUES(p.id,v_order,(r.value->>'amount_minor')::bigint);
     SELECT * INTO o FROM billing.commerce_orders WHERE id=v_order;
     IF (SELECT sum(amount_minor) FROM billing.commerce_allocations WHERE order_id=v_order)=o.final_minor THEN
       -- Lock the offer before consuming its reservation. Expired reservations
       -- cannot be revived by late manual confirmation.
       IF o.offer_id IS NOT NULL THEN SELECT * INTO v_offer FROM billing.commerce_offers WHERE id=o.offer_id FOR UPDATE; END IF;
       UPDATE billing.commerce_orders SET review_status='confirmed',confirmed_at=now(),offer_consumed=offer_id IS NOT NULL WHERE id=v_order;
       PERFORM billing.commerce_activate(v_order);
     ELSE UPDATE billing.commerce_orders SET review_status='pending' WHERE id=v_order; END IF;
   END LOOP;
   INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(v_uid,'confirm',p.id,p_data-'key');
   RETURN to_jsonb(p);
 ELSIF p_action='create_group' THEN
   INSERT INTO billing.commerce_groups(name,created_by) VALUES(p_data->>'name',v_uid) RETURNING id INTO v_id;
 ELSIF p_action='group_state' THEN
   UPDATE billing.commerce_groups SET send_state=p_data->>'state' WHERE id=(p_data->>'id')::uuid RETURNING id INTO v_id;
 ELSIF p_action='create_offer' THEN
   INSERT INTO billing.commerce_offers(code,campaign,package,kind,value_minor,currency,email,duration_days,eligibility,renewals,valid_from,valid_until,max_redemptions,per_email_limit,enabled,created_by)
   VALUES(upper(btrim(p_data->>'code')),p_data->>'campaign',p_data->>'package',p_data->>'kind',(p_data->>'value_minor')::bigint,p_data->>'currency',nullif(lower(btrim(p_data->>'email')),''),
     (p_data->>'duration_days')::integer,coalesce(p_data->>'eligibility','all'),coalesce((p_data->>'renewals')::boolean,false),(p_data->>'valid_from')::timestamptz,(p_data->>'valid_until')::timestamptz,
     (p_data->>'max_redemptions')::integer,coalesce((p_data->>'per_email_limit')::integer,1),coalesce((p_data->>'enabled')::boolean,true),v_uid) RETURNING id INTO v_id;
 ELSIF p_action='preview_import' THEN
   FOR r IN SELECT value FROM jsonb_array_elements(p_data->'rows') LOOP
     BEGIN v_price:=billing.commerce_validate_recipient(r.value);
     IF v_price->>'offer_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM billing.commerce_invitations WHERE group_id=(p_data->>'group_id')::uuid AND email=lower(r.value->>'email')) THEN
       v_preview_key:=v_price->>'offer_id';
       SELECT * INTO v_offer FROM billing.commerce_offers WHERE id=v_preview_key::uuid;
       SELECT v_offer.consumed_count+count(*) INTO v_preview_count FROM billing.commerce_orders WHERE offer_id=v_offer.id AND NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected');
       IF v_preview_count+coalesce((v_preview_counts->>v_preview_key)::integer,0)>=v_offer.max_redemptions THEN RAISE EXCEPTION 'COMMERCE_OFFER_LIMIT'; END IF;
       v_preview_counts:=jsonb_set(v_preview_counts,ARRAY[v_preview_key],to_jsonb(coalesce((v_preview_counts->>v_preview_key)::integer,0)+1));
     END IF;
     v_rows:=v_rows||jsonb_build_array(jsonb_build_object('email',r.value->>'email','quote',v_price,
       'existing',EXISTS(SELECT 1 FROM billing.commerce_entitlements e JOIN auth.users u ON u.id=e.user_id WHERE lower(u.email)=lower(r.value->>'email') AND e.revoked_at IS NULL AND e.ends_at>now())
          OR EXISTS(SELECT 1 FROM billing.subscriptions x JOIN auth.users u ON u.id=x.user_id WHERE lower(u.email)=lower(r.value->>'email') AND x.access_state IN ('paid_active','canceled_at_period_end') AND x.current_period_end>now()),
       'imported',EXISTS(SELECT 1 FROM billing.commerce_invitations WHERE group_id=(p_data->>'group_id')::uuid AND email=lower(r.value->>'email'))));
     EXCEPTION WHEN OTHERS THEN v_rows:=v_rows||jsonb_build_array(jsonb_build_object('email',r.value->>'email','error',SQLERRM)); END;
   END LOOP;
   RETURN v_rows;
 ELSIF p_action='revoke_invitation' THEN
   SELECT * INTO i FROM billing.commerce_invitations WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF i.id IS NULL THEN RAISE EXCEPTION 'COMMERCE_INVITATION_FORBIDDEN'; END IF;
   UPDATE billing.commerce_invitations SET revoked_at=coalesce(revoked_at,now()) WHERE id=i.id;
   UPDATE billing.commerce_outbox SET status='suppressed' WHERE invitation_id=i.id AND status='pending';
   UPDATE billing.commerce_entitlements SET revoked_at=coalesce(revoked_at,now()) WHERE order_id=i.order_id OR grant_id IN (SELECT id FROM billing.commerce_grants WHERE invitation_id=i.id);
   UPDATE billing.commerce_grants SET revoked_at=coalesce(revoked_at,now()) WHERE invitation_id=i.id;
   v_id:=i.id;
 ELSIF p_action='offer_state' THEN
   UPDATE billing.commerce_offers SET enabled=(p_data->>'enabled')::boolean WHERE id=(p_data->>'id')::uuid RETURNING id INTO v_id;
 ELSIF p_action='reconcile_mail' THEN
   -- An uncertain send cannot be reset automatically after provider dedup expires.
   -- An administrator supplies the actual provider ID after checking provider logs.
   UPDATE billing.commerce_outbox SET provider_email_id=p_data->>'provider_id',status='sent',lease_until=NULL
     WHERE invitation_id=(p_data->>'id')::uuid AND status IN ('unknown','failed') AND provider_email_id IS NULL RETURNING id INTO v_id;
   IF v_id IS NULL THEN RAISE EXCEPTION 'COMMERCE_MAIL_NOT_RECONCILABLE'; END IF;
 ELSIF p_action='my_mail_preferences' THEN
   IF p_data ? 'marketing_opt_out' THEN
     INSERT INTO billing.commerce_mail_preferences(email,marketing_opt_out) VALUES(v_email,(p_data->>'marketing_opt_out')::boolean)
     ON CONFLICT(email) DO UPDATE SET marketing_opt_out=EXCLUDED.marketing_opt_out,updated_at=now();
   END IF;
   RETURN jsonb_build_object('marketing_opt_out',coalesce((SELECT marketing_opt_out FROM billing.commerce_mail_preferences WHERE email=v_email),false));
 ELSIF p_action='import' THEN
   v_group:=(p_data->>'group_id')::uuid;
   PERFORM 1 FROM billing.commerce_groups WHERE id=v_group FOR UPDATE;
   IF NOT FOUND OR jsonb_array_length(p_data->'rows') NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'COMMERCE_INVALID_IMPORT'; END IF;
   FOR r IN SELECT value FROM jsonb_array_elements(p_data->'rows') LOOP
     v_parameters:=r.value; v_key:=v_group::text||':'||lower(btrim(r.value->>'email'));
     IF length(v_key)>160 OR r.value->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'COMMERCE_INVALID_EMAIL'; END IF;
     SELECT * INTO i FROM billing.commerce_invitations WHERE source_key=v_key;
     IF FOUND THEN
       IF i.parameters IS DISTINCT FROM r.value THEN RAISE EXCEPTION 'COMMERCE_IMPORT_CONFLICT'; END IF;
       v_rows:=v_rows||jsonb_build_array(to_jsonb(i)); CONTINUE;
     END IF;
     PERFORM billing.commerce_validate_recipient(r.value);
     IF (r.value->>'deadline')::timestamptz<=now() THEN RAISE EXCEPTION 'COMMERCE_INVITATION_EXPIRED'; END IF;
     v_order:=NULL;
     IF r.value->>'access_kind'='external' THEN
       SELECT * INTO v_method FROM billing.commerce_methods WHERE code=r.value->>'method' FOR SHARE;
       v_price:=billing.commerce_quote(r.value->>'package',r.value->>'market',r.value->>'billing_interval',r.value->>'code',lower(btrim(r.value->>'email')),false);
       IF NOT coalesce(v_method.enabled,false) OR v_method.code NOT IN ('instapay','wallet','bank') OR v_method.destination='' OR v_method.instructions='' OR NOT(v_price->>'currency'=ANY(v_method.currencies)) THEN RAISE EXCEPTION 'COMMERCE_METHOD_UNAVAILABLE'; END IF;
       v_final:=coalesce(nullif(r.value->>'final_minor','')::bigint,(v_price->>'final_minor')::bigint);
       IF nullif(r.value->>'original_minor','') IS NOT NULL AND (r.value->>'original_minor')::bigint<>(v_price->>'original_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_ORIGINAL_PRICE_MISMATCH'; END IF;
       IF v_final<=0 OR v_final>(v_price->>'final_minor')::bigint OR (r.value->>'currency') IS DISTINCT FROM v_price->>'currency' THEN RAISE EXCEPTION 'COMMERCE_IMPORT_PRICE_MISMATCH'; END IF;
       IF v_price->>'offer_id' IS NOT NULL AND v_final<>(v_price->>'final_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_OFFER_STACKING_FORBIDDEN'; END IF;
       INSERT INTO billing.commerce_orders(recipient_email,package,billing_interval,duration_days,start_rule,requested_start,original_minor,final_minor,currency,method,instructions_snapshot,offer_id,group_id,request_key,parameters,expires_at)
       VALUES(lower(btrim(r.value->>'email')),r.value->>'package',r.value->>'billing_interval',(r.value->>'duration_days')::integer,r.value->>'start_rule',nullif(r.value->>'requested_start','')::timestamptz,
         (v_price->>'original_minor')::bigint,v_final,v_price->>'currency',v_method.code,to_jsonb(v_method),nullif(v_price->>'offer_id','')::uuid,v_group,v_key,r.value,least((r.value->>'deadline')::timestamptz,coalesce((SELECT valid_until FROM billing.commerce_offers WHERE id=nullif(v_price->>'offer_id','')::uuid),'infinity'::timestamptz))) RETURNING id INTO v_order;
     END IF;
     INSERT INTO billing.commerce_invitations(group_id,email,name,locale,package,access_kind,duration_days,start_rule,requested_start,deadline,order_id,source_key,parameters,created_by)
     VALUES(v_group,lower(btrim(r.value->>'email')),nullif(r.value->>'name',''),r.value->>'locale',r.value->>'package',r.value->>'access_kind',(r.value->>'duration_days')::integer,
       r.value->>'start_rule',nullif(r.value->>'requested_start','')::timestamptz,(r.value->>'deadline')::timestamptz,v_order,v_key,r.value,v_uid) RETURNING * INTO i;
     v_rows:=v_rows||jsonb_build_array(to_jsonb(i));
   END LOOP;
   INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(v_uid,'import',v_group,jsonb_build_object('rows',jsonb_array_length(v_rows)));
   RETURN v_rows;
 ELSIF p_action IN ('invitation','accept') THEN
   SELECT * INTO i FROM billing.commerce_invitations WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF NOT FOUND OR i.email<>v_email OR i.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'COMMERCE_INVITATION_FORBIDDEN' USING ERRCODE='42501'; END IF;
   IF i.accepted_at IS NULL AND i.deadline<=now() THEN RAISE EXCEPTION 'COMMERCE_INVITATION_EXPIRED'; END IF;
   IF p_action='invitation' THEN RETURN to_jsonb(i); END IF;
   IF i.package='kids' THEN
     IF NOT public.kids_parent_can_manage_profiles() THEN RAISE EXCEPTION 'COMMERCE_PARENT_REQUIRED'; END IF;
     IF (EXISTS(SELECT 1 FROM public.kids_parent_access_requests WHERE parent_id=v_uid AND country_code='EG')) IS DISTINCT FROM (i.parameters->>'market'='EG') THEN RAISE EXCEPTION 'COMMERCE_KIDS_MARKET_MISMATCH'; END IF;
   END IF;
   IF i.accepted_by IS NOT NULL AND i.accepted_by<>v_uid THEN RAISE EXCEPTION 'COMMERCE_INVITATION_ALREADY_BOUND'; END IF;
   UPDATE billing.commerce_invitations SET accepted_by=v_uid,accepted_at=coalesce(accepted_at,now()) WHERE id=i.id;
   IF i.order_id IS NOT NULL THEN
     UPDATE billing.commerce_orders SET user_id=v_uid WHERE id=i.order_id AND (user_id IS NULL OR user_id=v_uid);
     UPDATE billing.commerce_receipts SET user_id=v_uid WHERE order_id=i.order_id;
     PERFORM billing.commerce_activate(i.order_id);
   ELSE
     SELECT * INTO g FROM billing.commerce_grants WHERE invitation_id=i.id;
     IF NOT FOUND THEN
       INSERT INTO billing.commerce_grants(user_id,package,invitation_id,reason,created_by,request_key) VALUES(v_uid,i.package,i.id,'Complimentary invitation',i.created_by,i.source_key) RETURNING * INTO g;
       v_start:=CASE i.start_rule WHEN 'date' THEN greatest(i.requested_start,now()) ELSE now() END;
       IF i.start_rule='after_expiry' THEN v_start:=billing.commerce_next_start(v_uid,i.package,v_start); END IF;
       INSERT INTO billing.commerce_entitlements(user_id,package,grant_id,starts_at,ends_at) VALUES(v_uid,i.package,g.id,v_start,v_start+make_interval(days=>i.duration_days));
     END IF;
   END IF;
   RETURN (SELECT to_jsonb(x) FROM billing.commerce_invitations x WHERE id=i.id);
 ELSIF p_action='grant' THEN
   PERFORM billing.commerce_assert_identity((p_data->>'user_id')::uuid);
   IF p_data->>'package'='kids' AND NOT billing.commerce_kids_parent((p_data->>'user_id')::uuid) THEN RAISE EXCEPTION 'COMMERCE_PARENT_REQUIRED'; END IF;
   v_key:='grant:'||(p_data->>'key');
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_key,0));
   SELECT * INTO g FROM billing.commerce_grants WHERE request_key=v_key;
   IF FOUND THEN IF g.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF; RETURN to_jsonb(g); END IF;
   IF (p_data->>'duration_days')::integer NOT BETWEEN 1 AND 1095 THEN RAISE EXCEPTION 'COMMERCE_INVALID_DURATION'; END IF;
   INSERT INTO billing.commerce_grants(user_id,package,reason,created_by,request_key,parameters) VALUES((p_data->>'user_id')::uuid,p_data->>'package',p_data->>'reason',v_uid,v_key,p_data) RETURNING * INTO g;
   v_start:=coalesce(nullif(p_data->>'starts_at','')::timestamptz,now());
   INSERT INTO billing.commerce_entitlements(user_id,package,grant_id,starts_at,ends_at) VALUES(g.user_id,g.package,g.id,v_start,v_start+make_interval(days=>(p_data->>'duration_days')::integer));
   v_id:=g.id;
 ELSIF p_action='manage_access' THEN
   SELECT * INTO r FROM billing.commerce_entitlements WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'COMMERCE_ACCESS_NOT_FOUND'; END IF;
   PERFORM billing.commerce_assert_identity(r.user_id);
   IF p_data->>'operation'='revoke' THEN UPDATE billing.commerce_entitlements SET revoked_at=coalesce(revoked_at,now()) WHERE id=r.id; UPDATE billing.commerce_grants SET revoked_at=coalesce(revoked_at,now()) WHERE id=r.grant_id;
   ELSIF p_data->>'operation'='extend' AND r.grant_id IS NOT NULL AND r.revoked_at IS NULL THEN
     v_key:='extend:'||(p_data->>'key');
     IF EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_key) THEN
       IF NOT EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_key AND target_id=r.id AND details=p_data) THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
       RETURN jsonb_build_object('id',r.id);
     END IF;
     IF (p_data->>'duration_days')::integer NOT BETWEEN 1 AND 1095 OR length(btrim(coalesce(p_data->>'reason','')))=0 THEN RAISE EXCEPTION 'COMMERCE_EXTENSION_REASON_REQUIRED'; END IF;
     UPDATE billing.commerce_entitlements SET ends_at=greatest(ends_at,now())+make_interval(days=>(p_data->>'duration_days')::integer) WHERE id=r.id;
     INSERT INTO billing.commerce_audit(actor,user_id,action,target_id,details) VALUES(v_uid,r.user_id,v_key,r.id,p_data);
   ELSE RAISE EXCEPTION 'COMMERCE_PAID_RENEWAL_REQUIRES_NEW_ORDER'; END IF;
   v_id:=r.id;
 ELSIF p_action='allocate' THEN
   v_key:='allocate:'||(p_data->>'key');
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_key,0));
   IF EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_key) THEN
     IF NOT EXISTS(SELECT 1 FROM billing.commerce_audit WHERE action=v_key AND details=p_data) THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
     RETURN jsonb_build_object('ok',true);
   END IF;
   PERFORM billing.commerce_allocate_existing((p_data->>'payment_id')::uuid,p_data->'allocations',p_data->>'reuse_review');
   INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(v_uid,v_key,(p_data->>'payment_id')::uuid,p_data);
   RETURN jsonb_build_object('ok',true);
 ELSIF p_action='refund' THEN
   v_key:='refund:'||(p_data->>'key');
   PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||v_key,0));
   SELECT * INTO r FROM billing.commerce_refunds WHERE request_key=v_key;
   IF FOUND THEN IF r.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF; RETURN to_jsonb(r); END IF;
   SELECT * INTO p FROM billing.commerce_payments WHERE id=(p_data->>'payment_id')::uuid FOR UPDATE;
   SELECT * INTO o FROM billing.commerce_orders WHERE id=(p_data->>'order_id')::uuid FOR UPDATE;
   IF p.id IS NULL OR (p_data->>'order_id' IS NOT NULL AND o.id IS NULL) THEN RAISE EXCEPTION 'COMMERCE_REFUND_NOT_FOUND'; END IF;
   IF o.id IS NULL THEN
     IF coalesce((p_data->>'revoke_access')::boolean,false) THEN RAISE EXCEPTION 'COMMERCE_REFUND_NOT_FOUND'; END IF;
     SELECT p.amount_minor-coalesce(sum(amount_minor),0) INTO v_allocated FROM billing.commerce_allocations WHERE payment_id=p.id;
   ELSE SELECT amount_minor INTO v_allocated FROM billing.commerce_allocations WHERE payment_id=p.id AND order_id=o.id; END IF;
   SELECT coalesce(sum(amount_minor),0) INTO v_sum FROM billing.commerce_refunds WHERE payment_id=p.id AND order_id IS NOT DISTINCT FROM o.id;
   IF v_allocated IS NULL OR (p_data->>'amount_minor')::bigint<=0 OR v_sum+(p_data->>'amount_minor')::bigint>v_allocated OR NOT coalesce((p_data->>'funds_verified')::boolean,false) THEN RAISE EXCEPTION 'COMMERCE_REFUND_AMOUNT_MISMATCH'; END IF;
   INSERT INTO billing.commerce_refunds(payment_id,order_id,amount_minor,reference,reason,revoke_access,recorded_by,request_key,parameters) VALUES(p.id,o.id,(p_data->>'amount_minor')::bigint,p_data->>'reference',p_data->>'reason',(p_data->>'revoke_access')::boolean,v_uid,v_key,p_data) RETURNING id INTO v_id;
   IF (p_data->>'revoke_access')::boolean THEN UPDATE billing.commerce_entitlements SET revoked_at=coalesce(revoked_at,now()) WHERE order_id=o.id; END IF;
   UPDATE billing.commerce_orders SET review_status='refunded' WHERE id=o.id;
 ELSIF p_action='mail_preferences' THEN
   INSERT INTO billing.commerce_mail_preferences(email,marketing_opt_out,suppressed) VALUES(lower(btrim(p_data->>'email')),(p_data->>'marketing_opt_out')::boolean,(p_data->>'suppressed')::boolean)
   ON CONFLICT(email) DO UPDATE SET marketing_opt_out=EXCLUDED.marketing_opt_out,suppressed=EXCLUDED.suppressed,updated_at=now();
 ELSIF p_action='queue' THEN
   FOR r IN SELECT jsonb_array_elements_text(p_data->'ids') AS id LOOP
     SELECT * INTO i FROM billing.commerce_invitations WHERE id=r.id::uuid;
     IF i.id IS NULL OR i.revoked_at IS NOT NULL OR i.accepted_at IS NOT NULL OR i.deadline<=now() THEN CONTINUE; END IF;
     INSERT INTO billing.commerce_outbox(invitation_id,recipient,payload) VALUES(i.id,i.email,jsonb_build_object('name',i.name,'locale',i.locale,'package',i.package,'duration_days',i.duration_days,'deadline',i.deadline,'access_kind',i.access_kind)) ON CONFLICT(invitation_id) DO NOTHING;
   END LOOP;
 ELSIF p_action='admin_list' THEN
   RETURN jsonb_build_object('groups',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_groups x),'[]'),
     'invitations',coalesce((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('delivery',(SELECT delivery FROM billing.commerce_outbox WHERE invitation_id=x.id),'send_status',(SELECT status FROM billing.commerce_outbox WHERE invitation_id=x.id))) FROM billing.commerce_invitations x),'[]'),
     'orders',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_orders x),'[]'),
     'payments',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_payments x),'[]'),
     'grants',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_grants x),'[]'),
     'entitlements',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_entitlements x),'[]'),
     'offers',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_offers x),'[]'),
     'refunds',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_refunds x),'[]'),
     'allocations',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_allocations x),'[]'),
     'audit',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM billing.commerce_audit x),'[]'),
     'methods',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM billing.commerce_methods x),'[]'));
 ELSE RAISE EXCEPTION 'COMMERCE_UNKNOWN_ACTION'; END IF;
 INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(v_uid,p_action,v_id,p_data-'rows');
 RETURN jsonb_build_object('id',v_id,'ok',true);
END $$;
REVOKE ALL ON FUNCTION public.commerce_command(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.commerce_command(text,jsonb) TO authenticated;

COMMIT;
