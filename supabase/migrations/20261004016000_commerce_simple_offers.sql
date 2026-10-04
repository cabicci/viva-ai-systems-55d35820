BEGIN;
-- Additive owner-requested coupon/invitation workflow. Existing records remain valid.
ALTER TABLE billing.commerce_offers ALTER COLUMN valid_until DROP NOT NULL,
 ALTER COLUMN max_redemptions DROP NOT NULL,
 ADD COLUMN audience_emails text[],
 ADD COLUMN billing_interval text CHECK(billing_interval IN ('month','year')),
 ADD COLUMN require_phone boolean NOT NULL DEFAULT false,
 ADD COLUMN request_key text UNIQUE,
 ADD COLUMN parameters jsonb NOT NULL DEFAULT '{}',
 ADD COLUMN group_id uuid REFERENCES billing.commerce_groups(id),
 ADD COLUMN delivery_mode text CHECK(delivery_mode IN ('coupon','invitation'));
ALTER TABLE billing.commerce_orders ADD COLUMN redemption_phone text;
ALTER TABLE billing.commerce_invitations ADD COLUMN offer_id uuid REFERENCES billing.commerce_offers(id), ADD COLUMN redemption_phone text;
CREATE INDEX commerce_offer_phone ON billing.commerce_orders(offer_id,redemption_phone);
CREATE INDEX commerce_invitation_phone ON billing.commerce_invitations(offer_id,redemption_phone);
-- Clone the existing boundaries, preserving all previous payment/guardian checks.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.commerce_command(text,jsonb)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.commerce_command(','FUNCTION billing.commerce_previous_simple_command(');
 d:=pg_get_functiondef('billing.commerce_quote(text,text,text,text,text,boolean)'::regprocedure);
 EXECUTE replace(d,'FUNCTION billing.commerce_quote(','FUNCTION billing.commerce_previous_simple_quote(');
END $$;
REVOKE ALL ON FUNCTION billing.commerce_previous_simple_command(text,jsonb),billing.commerce_previous_simple_quote(text,text,text,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION billing.commerce_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE o billing.commerce_offers%ROWTYPE; q jsonb; BEGIN
 IF nullif(btrim(p_code),'') IS NOT NULL THEN
  SELECT * INTO o FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
  IF o.id IS NOT NULL AND ((o.billing_interval IS NOT NULL AND o.billing_interval<>p_interval)
   OR (o.audience_emails IS NOT NULL AND NOT(p_email=ANY(o.audience_emails))) OR o.delivery_mode='invitation')
   THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
 END IF;
 q:=billing.commerce_previous_simple_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal);
 RETURN q||jsonb_build_object('phone_required',coalesce(o.require_phone,false),'billing_interval',p_interval);
END $$;
-- Both email and phone are checked under the same offer lock. Unverified phone
-- is a deduplication input, never proof of ownership or an authentication factor.
CREATE FUNCTION billing.commerce_assert_offer_phone(p_offer uuid,p_phone text,p_email text,p_user uuid,p_order uuid DEFAULT NULL,p_invitation uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM billing.commerce_offers WHERE id=p_offer FOR UPDATE;
 IF p_phone IS NULL OR p_phone !~ '^\+[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'COMMERCE_PHONE_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM billing.commerce_orders o WHERE o.offer_id=p_offer AND o.id IS DISTINCT FROM p_order
    AND (o.recipient_email=p_email OR o.redemption_phone=p_phone OR o.user_id=p_user)
    AND (o.offer_consumed OR (o.expires_at>now() AND o.review_status IN ('awaiting_receipt','pending','more_info','rejected'))))
 OR EXISTS(SELECT 1 FROM billing.commerce_invitations i WHERE i.offer_id=p_offer AND i.id IS DISTINCT FROM p_invitation
    AND (i.email=p_email OR i.redemption_phone=p_phone OR i.accepted_by=p_user) AND i.accepted_at IS NOT NULL)
 THEN RAISE EXCEPTION 'COMMERCE_OFFER_ALREADY_USED'; END IF;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_assert_offer_phone(uuid,text,text,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Calendar month/year, measured from activation, including 100% coupon grants.
CREATE FUNCTION billing.commerce_simple_duration() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_interval text; BEGIN
 SELECT f.billing_interval INTO v_interval FROM billing.commerce_offers f WHERE f.id=coalesce(
   (SELECT offer_id FROM billing.commerce_orders WHERE id=NEW.order_id),
   (SELECT coalesce(o.offer_id,i.offer_id) FROM billing.commerce_grants g LEFT JOIN billing.commerce_orders o ON o.id=g.offer_order_id LEFT JOIN billing.commerce_invitations i ON i.id=g.invitation_id WHERE g.id=NEW.grant_id));
 IF v_interval IS NOT NULL THEN NEW.ends_at:=NEW.starts_at+CASE WHEN v_interval='year' THEN interval '1 year' ELSE interval '1 month' END; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_simple_duration() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_simple_duration BEFORE INSERT ON billing.commerce_entitlements FOR EACH ROW EXECUTE FUNCTION billing.commerce_simple_duration();
CREATE OR REPLACE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_uid uuid:=auth.uid(); v_email text; v_result jsonb; f billing.commerce_offers%ROWTYPE; i billing.commerce_invitations%ROWTYPE;
 o billing.commerce_orders%ROWTYPE; v_price jsonb; v_group uuid; v_id uuid; v_key text; v_mode text; v_audience text;
 v_emails text[]; v_rows jsonb:='[]'; r record; v_percent integer; v_expiry timestamptz; v_limit integer; v_method text;
BEGIN
 v_email:=billing.commerce_assert_identity(v_uid);
 IF p_action IN ('offer_catalogue','simple_offer','send_offer_invitations') THEN
  IF NOT billing.commerce_is_admin() THEN RAISE EXCEPTION 'COMMERCE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled) THEN RAISE EXCEPTION 'COMMERCE_DISABLED'; END IF;
 END IF;
 IF p_action='offer_catalogue' THEN
  FOR r IN SELECT p,m,b FROM unnest(ARRAY['pro','pro_plus','kids']) p CROSS JOIN unnest(ARRAY['EG','INTL']) m CROSS JOIN unnest(ARRAY['month','year']) b LOOP
   v_rows:=v_rows||jsonb_build_array(billing.commerce_price(r.p,r.m,r.b)||jsonb_build_object('market',r.m));
  END LOOP;
  RETURN v_rows;
 ELSIF p_action='simple_offer' THEN
  v_key:=p_data->>'key';
  IF v_key IS NULL OR length(v_key) NOT BETWEEN 8 AND 100 THEN RAISE EXCEPTION 'COMMERCE_INVALID_KEY'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('simple-offer:'||v_key,0));
  SELECT * INTO f FROM billing.commerce_offers WHERE request_key=v_key;
  IF FOUND THEN
   IF f.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
   RETURN to_jsonb(f);
  END IF;
  v_mode:=p_data->>'delivery'; v_audience:=p_data->>'audience'; v_percent:=(p_data->>'percent')::integer;
  IF v_mode IS NULL OR v_mode NOT IN ('coupon','invitation') OR v_audience IS NULL OR v_audience NOT IN ('individual','group','public')
   OR v_percent IS NULL OR v_percent NOT BETWEEN 1 AND 100 OR p_data->>'locale' IS NULL OR p_data->>'locale' NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
   OR (v_audience='public' AND v_mode<>'coupon') THEN RAISE EXCEPTION 'COMMERCE_INVALID_OFFER'; END IF;
  SELECT coalesce(array_agg(DISTINCT lower(btrim(value))),'{}') INTO v_emails FROM jsonb_array_elements_text(coalesce(p_data->'emails','[]'));
  IF (v_audience='individual' AND cardinality(v_emails)<>1) OR (v_audience='group' AND cardinality(v_emails) NOT BETWEEN 1 AND 1000)
   OR (v_audience='public' AND cardinality(v_emails)<>0) OR EXISTS(SELECT 1 FROM unnest(v_emails) e WHERE length(e)>120 OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'COMMERCE_INVALID_EMAIL'; END IF;
  IF p_data->>'package' IS NULL OR p_data->>'package' NOT IN ('pro','pro_plus','kids') OR p_data->>'market' IS NULL OR p_data->>'market' NOT IN ('EG','INTL') OR p_data->>'billing_interval' IS NULL OR p_data->>'billing_interval' NOT IN ('month','year') THEN RAISE EXCEPTION 'COMMERCE_INVALID_SELECTION'; END IF;
  v_price:=billing.commerce_price(p_data->>'package',p_data->>'market',p_data->>'billing_interval');
  IF (p_data->>'expected_price_minor')::bigint IS DISTINCT FROM (v_price->>'original_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_PRICE_CHANGED'; END IF;
  IF v_audience='public' THEN
   IF p_data->>'limit_mode'='time' THEN
    v_expiry:=(p_data->>'valid_until')::timestamptz; v_limit:=NULL;
    IF v_expiry IS NULL OR v_expiry<=now() THEN RAISE EXCEPTION 'COMMERCE_INVALID_EXPIRY'; END IF;
   ELSIF p_data->>'limit_mode'='count' THEN
    v_expiry:=NULL; v_limit:=(p_data->>'max_redemptions')::integer;
    IF v_limit IS NULL OR v_limit NOT BETWEEN 1 AND 100000 THEN RAISE EXCEPTION 'COMMERCE_INVALID_LIMIT'; END IF;
   ELSE RAISE EXCEPTION 'COMMERCE_INVALID_LIMIT'; END IF;
  ELSE
   v_expiry:=now()+interval '15 days'; v_limit:=cardinality(v_emails);
   INSERT INTO billing.commerce_groups(name,created_by) VALUES(coalesce(nullif(btrim(p_data->>'group_name'),''),CASE WHEN v_audience='individual' THEN v_emails[1] ELSE 'Group '||to_char(now(),'YYYY-MM-DD HH24:MI') END),v_uid) RETURNING id INTO v_group;
  END IF;
  INSERT INTO billing.commerce_offers(code,campaign,package,kind,value_minor,currency,duration_days,renewals,valid_from,valid_until,max_redemptions,per_email_limit,audience_emails,billing_interval,require_phone,request_key,parameters,group_id,delivery_mode,created_by)
  VALUES(upper(btrim(p_data->>'code')),coalesce(nullif(btrim(p_data->>'group_name'),''),upper(btrim(p_data->>'code'))),p_data->>'package','percent',v_percent,v_price->>'currency',CASE WHEN p_data->>'billing_interval'='year' THEN 365 ELSE 30 END,true,now(),v_expiry,v_limit,1,CASE WHEN v_audience='public' THEN NULL ELSE v_emails END,p_data->>'billing_interval',true,v_key,p_data,v_group,'coupon',v_uid) RETURNING * INTO f;
  IF v_mode='invitation' THEN
   SELECT code INTO v_method FROM billing.commerce_methods WHERE code IN ('instapay','wallet','bank') AND enabled AND destination<>'' AND instructions<>'' AND f.currency=ANY(currencies) ORDER BY CASE code WHEN 'instapay' THEN 1 WHEN 'wallet' THEN 2 ELSE 3 END LIMIT 1;
   IF v_percent<100 AND v_method IS NULL THEN RAISE EXCEPTION 'COMMERCE_METHOD_UNAVAILABLE'; END IF;
   FOR r IN SELECT unnest(v_emails) email LOOP
    v_rows:=v_rows||jsonb_build_array(jsonb_build_object('email',r.email,'name','','locale',p_data->>'locale','package',f.package,'access_kind',CASE WHEN v_percent=100 THEN 'complimentary' ELSE 'external' END,'duration_days',f.duration_days,'start_rule','acceptance','deadline',v_expiry,'market',p_data->>'market','billing_interval',f.billing_interval,'currency',f.currency,'method',coalesce(v_method,'instapay'))||CASE WHEN v_percent=100 THEN '{}'::jsonb ELSE jsonb_build_object('code',f.code,'original_minor',(v_price->>'original_minor')::bigint) END);
   END LOOP;
   v_result:=billing.commerce_previous_simple_command('import',jsonb_build_object('group_id',v_group,'rows',v_rows));
   UPDATE billing.commerce_invitations SET offer_id=f.id WHERE group_id=v_group;
   -- Paid invitations reserve one use each; phone is bound at acceptance.
   UPDATE billing.commerce_orders SET offer_id=f.id,duration_days=NULL WHERE group_id=v_group;
  END IF;
  UPDATE billing.commerce_offers SET delivery_mode=v_mode WHERE id=f.id RETURNING * INTO f;
  INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(v_uid,'simple_offer',f.id,jsonb_build_object('audience',v_audience,'delivery',v_mode,'percent',v_percent));
  RETURN to_jsonb(f);
 ELSIF p_action='send_offer_invitations' THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR f.delivery_mode IS DISTINCT FROM 'invitation' OR NOT f.enabled OR f.valid_until<=now() THEN RAISE EXCEPTION 'COMMERCE_INVITATION_EXPIRED'; END IF;
  PERFORM billing.commerce_previous_simple_command('group_state',jsonb_build_object('id',f.group_id,'state','ready'));
  SELECT jsonb_agg(id) INTO v_result FROM billing.commerce_invitations WHERE offer_id=f.id AND accepted_at IS NULL AND revoked_at IS NULL AND deadline>now();
  IF v_result IS NOT NULL THEN PERFORM billing.commerce_previous_simple_command('queue',jsonb_build_object('ids',v_result)); END IF;
  RETURN jsonb_build_object('group_id',f.group_id);
 ELSIF p_action='create_order' THEN
  SELECT * INTO f FROM billing.commerce_offers WHERE code=upper(btrim(p_data->>'code')) FOR UPDATE;
  IF f.require_phone THEN
   SELECT * INTO o FROM billing.commerce_orders WHERE request_key=v_uid::text||':'||(p_data->>'key');
   IF o.id IS NOT NULL AND o.redemption_phone IS DISTINCT FROM p_data->>'phone' THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
   PERFORM billing.commerce_assert_offer_phone(f.id,p_data->>'phone',v_email,v_uid,o.id);
  END IF;
  v_result:=billing.commerce_previous_simple_command(p_action,(p_data-'phone')||CASE WHEN f.require_phone THEN jsonb_build_object('renewal',false) ELSE '{}'::jsonb END);
  IF f.require_phone THEN UPDATE billing.commerce_orders SET redemption_phone=p_data->>'phone' WHERE id=(v_result->>'id')::uuid; END IF;
  RETURN v_result;
 ELSIF p_action='accept' THEN
  -- Lock offer before invitation, keeping a consistent order across redeemers.
  SELECT offer_id INTO v_id FROM billing.commerce_invitations WHERE id=(p_data->>'id')::uuid AND email=v_email;
  IF v_id IS NOT NULL THEN
   SELECT * INTO f FROM billing.commerce_offers WHERE id=v_id FOR UPDATE;
   SELECT * INTO i FROM billing.commerce_invitations WHERE id=(p_data->>'id')::uuid FOR UPDATE;
   IF NOT f.enabled THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
   IF i.accepted_at IS NULL THEN
    PERFORM billing.commerce_assert_offer_phone(f.id,p_data->>'phone',v_email,v_uid,i.order_id,i.id);
   ELSIF i.redemption_phone IS DISTINCT FROM p_data->>'phone' THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
  END IF;
  v_result:=billing.commerce_previous_simple_command(p_action,p_data-'phone');
  IF v_id IS NOT NULL THEN
   IF i.accepted_at IS NULL AND i.order_id IS NULL THEN UPDATE billing.commerce_offers SET consumed_count=consumed_count+1 WHERE id=f.id; END IF;
   UPDATE billing.commerce_invitations SET redemption_phone=p_data->>'phone' WHERE id=i.id;
   UPDATE billing.commerce_orders SET redemption_phone=p_data->>'phone' WHERE id=i.order_id;
  END IF;
  RETURN v_result;
 END IF;
 RETURN billing.commerce_previous_simple_command(p_action,p_data);
END $$;
REVOKE ALL ON FUNCTION public.commerce_command(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.commerce_command(text,jsonb) TO authenticated;
-- Erase newly introduced identifiers at the existing learner-erasure stage.
DO $$ DECLARE d text; BEGIN
 d:=pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 EXECUTE replace(d,'FUNCTION public.lc09_advance_deletion(','FUNCTION billing.commerce_simple_previous_deletion(');
END $$;
REVOKE ALL ON FUNCTION billing.commerce_simple_previous_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_email text; v_result jsonb; BEGIN
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=p_user_id;
 v_result:=billing.commerce_simple_previous_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN
  UPDATE billing.commerce_orders SET redemption_phone=NULL WHERE user_id=p_user_id;
  UPDATE billing.commerce_groups SET name='Group' WHERE name=v_email AND id IN (SELECT group_id FROM billing.commerce_offers WHERE require_phone);
  UPDATE billing.commerce_offers SET audience_emails=array_remove(audience_emails,v_email),parameters='{}' WHERE v_email=ANY(audience_emails);
 END IF;
 RETURN v_result;
END $$;
COMMIT;
