BEGIN;
-- Isolated unified external-payments feature. Prepared only; no production apply.
-- All external commerce writes enter through authenticated RPCs. Stripe tables,
-- provider events, customer creation and the legacy 72h coupon policy are untouched.
CREATE TABLE billing.commerce_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  enabled boolean NOT NULL DEFAULT false,
  access_enabled boolean NOT NULL DEFAULT true,
  invitations_enabled boolean NOT NULL DEFAULT false
);
INSERT INTO billing.commerce_control(singleton) VALUES(true);
CREATE TABLE billing.commerce_methods (
  code text PRIMARY KEY CHECK(code IN ('instapay','wallet','bank','admin','stripe','paymob')),
  enabled boolean NOT NULL DEFAULT false,
  instructions text NOT NULL DEFAULT '' CHECK(length(instructions)<=4000),
  destination text NOT NULL DEFAULT '' CHECK(length(destination)<=1000),
  qr_url text CHECK(qr_url IS NULL OR qr_url ~ '^https://'),
  currencies text[] NOT NULL DEFAULT ARRAY['EGP'],
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(code<>'paymob' OR NOT enabled)
);
INSERT INTO billing.commerce_methods(code,enabled,currencies) VALUES
 ('instapay',false,ARRAY['EGP']),('wallet',false,ARRAY['EGP']),('bank',false,ARRAY['EGP','USD']),
 ('admin',true,ARRAY['EGP','USD']),('stripe',true,ARRAY['EGP','USD']),('paymob',false,ARRAY['EGP']);
CREATE TABLE billing.commerce_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  send_state text NOT NULL DEFAULT 'paused' CHECK(send_state IN ('paused','ready')),
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(code ~ '^[A-Z0-9_-]{3,64}$'),
  campaign text NOT NULL CHECK(length(campaign) BETWEEN 1 AND 120),
  package text NOT NULL CHECK(package IN ('pro','pro_plus','kids')),
  kind text NOT NULL CHECK(kind IN ('complimentary','percent','fixed')),
  value_minor bigint NOT NULL DEFAULT 0 CHECK(value_minor>=0),
  currency text NOT NULL CHECK(currency IN ('EGP','USD')),
  email text CHECK(email IS NULL OR email=lower(btrim(email))),
  duration_days integer NOT NULL CHECK(duration_days BETWEEN 1 AND 1095),
  eligibility text NOT NULL DEFAULT 'all' CHECK(eligibility IN ('all','new_customer')),
  renewals boolean NOT NULL DEFAULT false,
  valid_from timestamptz NOT NULL DEFAULT now(), valid_until timestamptz NOT NULL,
  max_redemptions integer NOT NULL CHECK(max_redemptions BETWEEN 1 AND 100000),
  consumed_count integer NOT NULL DEFAULT 0 CHECK(consumed_count>=0),
  per_email_limit integer NOT NULL DEFAULT 1 CHECK(per_email_limit BETWEEN 1 AND 100),
  enabled boolean NOT NULL DEFAULT true, created_by uuid,
  CHECK(valid_until>valid_from), CHECK(kind<>'percent' OR value_minor BETWEEN 1 AND 100),
  CHECK(kind<>'fixed' OR value_minor>0)
);
CREATE TABLE billing.commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text NOT NULL UNIQUE DEFAULT ('MS-'||replace(gen_random_uuid()::text,'-','')),
  user_id uuid, recipient_email text NOT NULL CHECK(recipient_email=lower(btrim(recipient_email))),
  package text NOT NULL CHECK(package IN ('pro','pro_plus','kids')),
  billing_interval text NOT NULL CHECK(billing_interval IN ('month','year','custom')),
  duration_days integer CHECK(duration_days BETWEEN 1 AND 1095),
  start_rule text NOT NULL DEFAULT 'confirmation' CHECK(start_rule IN ('confirmation','acceptance','date','after_expiry')),
  requested_start timestamptz, original_minor bigint NOT NULL CHECK(original_minor>=0),
  final_minor bigint NOT NULL CHECK(final_minor>=0 AND final_minor<=original_minor),
  currency text NOT NULL CHECK(currency IN ('EGP','USD')),
  method text NOT NULL REFERENCES billing.commerce_methods(code),
  instructions_snapshot jsonb NOT NULL DEFAULT '{}',
  review_status text NOT NULL DEFAULT 'awaiting_receipt' CHECK(review_status IN ('awaiting_receipt','pending','more_info','rejected','confirmed','cancelled','expired','refunded')),
  review_reason text CHECK(length(review_reason)<=2000),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '48 hours',
  offer_id uuid REFERENCES billing.commerce_offers(id),
  offer_consumed boolean NOT NULL DEFAULT false,
  group_id uuid REFERENCES billing.commerce_groups(id),
  request_key text NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 8 AND 160),
  parameters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), confirmed_at timestamptz,
  CHECK(start_rule<>'date' OR requested_start IS NOT NULL),
  CHECK(method NOT IN ('stripe','paymob'))
);
CREATE INDEX commerce_order_owner ON billing.commerce_orders(user_id);
-- Anonymous campaign total survives required financial erasure. It contains
-- no recipient identity; refunds and revocations never reset campaign limits.
CREATE FUNCTION billing.commerce_count_consumption() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,pg_temp AS $$ BEGIN
 IF NEW.offer_consumed AND NOT OLD.offer_consumed AND NEW.offer_id IS NOT NULL THEN
  UPDATE billing.commerce_offers SET consumed_count=consumed_count+1 WHERE id=NEW.offer_id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_count_consumption() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commerce_offer_consumption AFTER UPDATE OF offer_consumed ON billing.commerce_orders
FOR EACH ROW EXECUTE FUNCTION billing.commerce_count_consumption();
CREATE TABLE billing.commerce_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid REFERENCES billing.commerce_groups(id),
  email text NOT NULL CHECK(email=lower(btrim(email))), name text CHECK(length(name)<=80),
  locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
  package text NOT NULL CHECK(package IN ('pro','pro_plus','kids')),
  access_kind text NOT NULL CHECK(access_kind IN ('complimentary','external')),
  duration_days integer NOT NULL CHECK(duration_days BETWEEN 1 AND 1095),
  start_rule text NOT NULL DEFAULT 'acceptance' CHECK(start_rule IN ('acceptance','date','after_expiry')),
  requested_start timestamptz, deadline timestamptz NOT NULL,
  order_id uuid UNIQUE REFERENCES billing.commerce_orders(id),
  accepted_by uuid, accepted_at timestamptz, revoked_at timestamptz,
  source_key text NOT NULL UNIQUE CHECK(length(source_key) BETWEEN 8 AND 160),
  parameters jsonb NOT NULL, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id,email), CHECK(access_kind<>'external' OR order_id IS NOT NULL),
  CHECK(start_rule<>'date' OR requested_start IS NOT NULL)
);
CREATE TABLE billing.commerce_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid,
  group_id uuid REFERENCES billing.commerce_groups(id),
  method text NOT NULL REFERENCES billing.commerce_methods(code),
  currency text NOT NULL CHECK(currency IN ('EGP','USD')),
  amount_minor bigint NOT NULL CHECK(amount_minor>0),
  transaction_reference text NOT NULL CHECK(length(transaction_reference) BETWEEN 3 AND 200),
  received_at timestamptz NOT NULL, confirmed_by uuid,
  request_key text NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 8 AND 160),
  parameters jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(method,transaction_reference)
);
-- Provider notification references are independent of funds and access.
-- No Stripe records are backfilled or fabricated by this feature.
CREATE TABLE billing.commerce_provider_references(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
 payment_id uuid REFERENCES billing.commerce_payments(id) ON DELETE CASCADE,
 provider text NOT NULL CHECK(provider IN ('manual','stripe','paymob')),
 reference text NOT NULL,state text NOT NULL,event_id text,verified_at timestamptz,
 UNIQUE(provider,reference),CHECK(order_id IS NOT NULL OR payment_id IS NOT NULL));
CREATE TABLE billing.commerce_allocations (
  payment_id uuid REFERENCES billing.commerce_payments(id) ON DELETE CASCADE,
  order_id uuid REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK(amount_minor>0), PRIMARY KEY(payment_id,order_id)
);
CREATE TABLE billing.commerce_receipts (
  id uuid PRIMARY KEY, order_id uuid NOT NULL REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
  user_id uuid, storage_path text NOT NULL UNIQUE,
  mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','application/pdf')),
  size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
  digest text NOT NULL CHECK(digest ~ '^[a-f0-9]{64}$'),
  suspected_reuse boolean NOT NULL DEFAULT false,
  attached_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  package text NOT NULL CHECK(package IN ('pro','pro_plus','kids')),
  invitation_id uuid UNIQUE REFERENCES billing.commerce_invitations(id) ON DELETE CASCADE,
  offer_order_id uuid UNIQUE REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 2000), created_by uuid,
  request_key text NOT NULL UNIQUE, parameters jsonb NOT NULL DEFAULT '{}', revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  package text NOT NULL CHECK(package IN ('pro','pro_plus','kids')),
  order_id uuid UNIQUE REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
  grant_id uuid UNIQUE REFERENCES billing.commerce_grants(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at>starts_at), CHECK((order_id IS NULL)<>(grant_id IS NULL))
);
CREATE INDEX commerce_active_access ON billing.commerce_entitlements(user_id,package,ends_at) WHERE revoked_at IS NULL;
CREATE TABLE billing.commerce_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL REFERENCES billing.commerce_payments(id) ON DELETE CASCADE,
  order_id uuid REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
  amount_minor bigint NOT NULL CHECK(amount_minor>0), reference text NOT NULL,
  reason text NOT NULL, revoke_access boolean NOT NULL, recorded_by uuid,
  request_key text NOT NULL UNIQUE, parameters jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor uuid, user_id uuid,
  action text NOT NULL, target_id uuid, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_mail_preferences (
  email text PRIMARY KEY, marketing_opt_out boolean NOT NULL DEFAULT false,
  suppressed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.commerce_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invitation_id uuid NOT NULL UNIQUE REFERENCES billing.commerce_invitations(id) ON DELETE CASCADE,
  recipient text NOT NULL, payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','unknown','suppressed')),
  provider_email_id text UNIQUE, delivery text NOT NULL DEFAULT 'not_sent',
  first_attempt_at timestamptz, lease_until timestamptz, attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No table writes are exposed through PostgREST, including to service_role.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema='billing' AND table_name LIKE 'commerce\_%' ESCAPE '\'
 LOOP EXECUTE format('ALTER TABLE billing.%I ENABLE ROW LEVEL SECURITY',r.table_name);
   EXECUTE format('REVOKE ALL ON billing.%I FROM PUBLIC,anon,authenticated,service_role',r.table_name);
 END LOOP;
END $$;

CREATE FUNCTION billing.commerce_assert_identity(p_user uuid DEFAULT auth.uid()) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_email text; BEGIN
 IF p_user IS NULL OR billing.account_deletion_blocked(p_user) THEN RAISE EXCEPTION 'COMMERCE_ACCOUNT_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL OR EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=p_user AND access_state='suspended') THEN
   RAISE EXCEPTION 'COMMERCE_IDENTITY_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 RETURN v_email;
END $$;
CREATE FUNCTION billing.commerce_is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'::public.app_role);
$$;
CREATE FUNCTION billing.commerce_external_package(p_user uuid) RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT e.package FROM billing.commerce_entitlements e
 WHERE EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled)
 AND e.user_id=p_user AND e.package IN ('pro','pro_plus') AND e.revoked_at IS NULL
 AND e.starts_at<=now() AND e.ends_at>now()
 ORDER BY CASE e.package WHEN 'pro_plus' THEN 2 ELSE 1 END DESC,e.ends_at DESC LIMIT 1;
$$;
CREATE FUNCTION billing.commerce_price(p_package text,p_market text,p_interval text,p_user uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_amount bigint; v_currency text; v_count integer; BEGIN
 IF p_package NOT IN ('pro','pro_plus','kids') OR p_market NOT IN ('EG','INTL') OR p_interval NOT IN ('month','year') THEN RAISE EXCEPTION 'COMMERCE_INVALID_SELECTION'; END IF;
 v_currency:=CASE WHEN p_market='EG' THEN 'EGP' ELSE 'USD' END;
 IF p_package='kids' THEN
   -- Mirror the installed Kids catalogue; the quote applies eligible offers once.
   -- Catalogue amounts stay explicit on every order.
   v_amount:=CASE WHEN p_market='EG' THEN CASE WHEN p_interval='month' THEN 19900 ELSE 199000 END
     ELSE CASE WHEN p_interval='month' THEN 799 ELSE 7990 END END;
 ELSE
   SELECT count(*),min(mp.amount_minor) INTO v_count,v_amount
   FROM billing.market_prices mp JOIN billing.plan_versions pv ON pv.id=mp.plan_version_id
   JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE pc.plan_key=p_package AND pc.is_active
   AND pv.status='published' AND pv.billing_interval=p_interval AND mp.market_code=p_market
   AND upper(mp.currency_code)=v_currency AND mp.status='active'
   AND pv.effective_from<=now() AND (pv.effective_to IS NULL OR pv.effective_to>now())
   AND mp.effective_from<=now() AND (mp.effective_to IS NULL OR mp.effective_to>now());
   IF v_count<>1 OR v_amount IS NULL THEN RAISE EXCEPTION 'COMMERCE_CATALOGUE_UNAVAILABLE'; END IF;
 END IF;
 RETURN jsonb_build_object('original_minor',v_amount,'currency',v_currency,'package',p_package,'billing_interval',p_interval);
END $$;
CREATE FUNCTION billing.commerce_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_price jsonb; v_offer billing.commerce_offers%ROWTYPE; v_final bigint; v_used integer; v_user uuid; v_adult boolean; BEGIN
 v_price:=billing.commerce_price(p_package,p_market,p_interval);
 v_final:=(v_price->>'original_minor')::bigint;
 SELECT id INTO v_user FROM auth.users WHERE lower(email)=p_email AND email_confirmed_at IS NOT NULL;
 -- Existing Kids subscriber benefit is one automatic offer. An explicit code
 -- replaces it; no discount is stacked and adult access never includes Kids.
 IF p_package='kids' AND nullif(btrim(p_code),'') IS NULL AND v_user IS NOT NULL THEN
   v_adult:=billing.commerce_external_package(v_user) IS NOT NULL OR EXISTS(SELECT 1 FROM billing.subscriptions s JOIN billing.plan_versions pv ON pv.id=s.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
     WHERE s.user_id=v_user AND pc.plan_key IN ('pro','pro_plus') AND s.access_state IN ('paid_active','canceled_at_period_end') AND s.current_period_end>now());
   IF v_adult THEN v_final:=(v_final*90+50)/100; END IF;
 END IF;
 IF nullif(btrim(p_code),'') IS NOT NULL THEN
  SELECT * INTO v_offer FROM billing.commerce_offers WHERE code=upper(btrim(p_code)) FOR UPDATE;
  IF NOT FOUND OR NOT v_offer.enabled OR v_offer.package<>p_package OR v_offer.currency<>v_price->>'currency'
    OR now()<v_offer.valid_from OR now()>=v_offer.valid_until OR (v_offer.email IS NOT NULL AND v_offer.email<>p_email)
    OR ((p_renewal OR EXISTS(SELECT 1 FROM billing.commerce_orders WHERE recipient_email=p_email AND package=p_package AND confirmed_at IS NOT NULL)
       OR EXISTS(SELECT 1 FROM billing.subscriptions s JOIN auth.users u ON u.id=s.user_id JOIN billing.plan_versions pv ON pv.id=s.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE lower(u.email)=p_email AND pc.plan_key=p_package AND s.current_period_end IS NOT NULL)
       OR (p_package='kids' AND EXISTS(SELECT 1 FROM public.kids_stripe_subscriptions k JOIN auth.users u ON u.id=k.parent_id WHERE lower(u.email)=p_email AND k.latest_paid_invoice_id IS NOT NULL))) AND NOT v_offer.renewals) THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
  IF v_offer.eligibility='new_customer' AND (EXISTS(SELECT 1 FROM billing.commerce_orders WHERE recipient_email=p_email AND confirmed_at IS NOT NULL) OR EXISTS(SELECT 1 FROM billing.subscriptions s JOIN auth.users u ON u.id=s.user_id WHERE lower(u.email)=p_email))
    THEN RAISE EXCEPTION 'COMMERCE_OFFER_INELIGIBLE'; END IF;
  SELECT v_offer.consumed_count+count(*) INTO v_used FROM billing.commerce_orders WHERE offer_id=v_offer.id AND
    NOT offer_consumed AND expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected');
  IF v_used>=v_offer.max_redemptions OR (SELECT count(*) FROM billing.commerce_orders WHERE offer_id=v_offer.id AND recipient_email=p_email AND
    (offer_consumed OR (expires_at>now() AND review_status IN ('awaiting_receipt','pending','more_info','rejected'))))>=v_offer.per_email_limit
    THEN RAISE EXCEPTION 'COMMERCE_OFFER_LIMIT'; END IF;
  v_final:=CASE v_offer.kind WHEN 'complimentary' THEN 0 WHEN 'percent' THEN v_final-(v_final*v_offer.value_minor/100) ELSE greatest(0,v_final-v_offer.value_minor) END;
 END IF;
 RETURN v_price||jsonb_build_object('final_minor',v_final,'offer_id',v_offer.id,'offer_kind',CASE WHEN v_final=0 AND v_offer.id IS NOT NULL THEN 'complimentary' ELSE v_offer.kind END,'offer_duration_days',v_offer.duration_days);
END $$;
-- Reuse the installed guardian gate with an explicit subject; consent records
-- and released-market requirements are identical to the existing flow.
CREATE FUNCTION billing.commerce_kids_parent(p_user uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data)
 AND EXISTS(SELECT 1 FROM public.kids_parent_access_requests r JOIN public.kids_market_release m USING(country_code)
 JOIN auth.users a ON a.id=r.parent_id WHERE r.parent_id=p_user AND r.status='approved' AND r.adult_confirmed
 AND m.accepts_child_data AND a.email_confirmed_at IS NOT NULL AND a.email=r.parent_email
 AND EXISTS(SELECT 1 FROM public.kids_parent_attestations t JOIN public.kids_consent_policies p ON p.id=t.policy_id
 WHERE t.parent_id=r.parent_id AND t.country_code=r.country_code AND p.enabled AND p.country_code=r.country_code));
$$;
CREATE FUNCTION billing.commerce_next_start(p_user uuid,p_package text,p_start timestamptz) RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT greatest(p_start,
   coalesce((SELECT max(ends_at) FROM billing.commerce_entitlements WHERE user_id=p_user AND package=p_package AND revoked_at IS NULL),p_start),
   coalesce((SELECT max(active_until) FROM public.kids_family_entitlements WHERE parent_id=p_user AND p_package='kids'),p_start),
   coalesce((SELECT max(s.current_period_end) FROM billing.subscriptions s JOIN billing.plan_versions pv ON pv.id=s.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
   WHERE s.user_id=p_user AND pc.plan_key=p_package AND s.access_state IN ('paid_active','canceled_at_period_end')),p_start));
$$;
CREATE FUNCTION billing.commerce_validate_recipient(p_row jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_price jsonb; v_final bigint; m billing.commerce_methods%ROWTYPE; BEGIN
 IF p_row->>'email' IS NULL OR p_row->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 OR length(p_row->>'email')>254 OR p_row->>'package' IS NULL OR p_row->>'package' NOT IN ('pro','pro_plus','kids')
 OR p_row->>'access_kind' IS NULL OR p_row->>'access_kind' NOT IN ('complimentary','external')
 OR p_row->>'locale' IS NULL OR p_row->>'locale' NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
 OR p_row->>'duration_days' IS NULL OR (p_row->>'duration_days')::integer NOT BETWEEN 1 AND 1095
 OR p_row->>'deadline' IS NULL OR (p_row->>'deadline')::timestamptz<=now()
 OR p_row->>'start_rule' IS NULL OR p_row->>'start_rule' NOT IN ('acceptance','date','after_expiry')
 OR (p_row->>'start_rule'='date' AND nullif(p_row->>'requested_start','') IS NULL) THEN RAISE EXCEPTION 'COMMERCE_INVALID_RECIPIENT'; END IF;
 IF p_row->>'access_kind'='complimentary' THEN
   IF nullif(p_row->>'code','') IS NOT NULL OR coalesce((p_row->>'final_minor')::bigint,0)<>0 THEN RAISE EXCEPTION 'COMMERCE_CONFLICTING_COMPLIMENTARY_OFFER'; END IF;
   RETURN jsonb_build_object('original_minor',0,'final_minor',0,'currency',p_row->>'currency');
 END IF;
 v_price:=billing.commerce_quote(p_row->>'package',p_row->>'market',p_row->>'billing_interval',p_row->>'code',lower(btrim(p_row->>'email')),false);
 SELECT * INTO m FROM billing.commerce_methods WHERE code=p_row->>'method';
 IF NOT coalesce(m.enabled,false) OR m.code NOT IN ('instapay','wallet','bank') OR m.destination='' OR m.instructions='' OR NOT(v_price->>'currency'=ANY(m.currencies)) THEN RAISE EXCEPTION 'COMMERCE_METHOD_UNAVAILABLE'; END IF;
 v_final:=coalesce(nullif(p_row->>'final_minor','')::bigint,(v_price->>'final_minor')::bigint);
 IF nullif(p_row->>'original_minor','') IS NOT NULL AND (p_row->>'original_minor')::bigint<>(v_price->>'original_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_ORIGINAL_PRICE_MISMATCH'; END IF;
 IF v_final<=0 OR v_final>(v_price->>'final_minor')::bigint OR (p_row->>'currency') IS DISTINCT FROM v_price->>'currency' THEN RAISE EXCEPTION 'COMMERCE_IMPORT_PRICE_MISMATCH'; END IF;
 IF v_price->>'offer_id' IS NOT NULL AND v_final<>(v_price->>'final_minor')::bigint THEN RAISE EXCEPTION 'COMMERCE_OFFER_STACKING_FORBIDDEN'; END IF;
 RETURN v_price||jsonb_build_object('final_minor',v_final);
END $$;
CREATE FUNCTION billing.commerce_activate(p_order uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE o billing.commerce_orders%ROWTYPE; i billing.commerce_invitations%ROWTYPE; v_start timestamptz; v_end timestamptz; v_id uuid; BEGIN
 SELECT * INTO o FROM billing.commerce_orders WHERE id=p_order FOR UPDATE;
 IF o.user_id IS NULL OR o.review_status<>'confirmed' THEN RETURN NULL; END IF;
 PERFORM billing.commerce_assert_identity(o.user_id);
 SELECT * INTO i FROM billing.commerce_invitations WHERE order_id=o.id;
 IF i.id IS NOT NULL AND (i.accepted_by IS DISTINCT FROM o.user_id OR i.accepted_at IS NULL OR i.revoked_at IS NOT NULL) THEN RETURN NULL; END IF;
 SELECT id INTO v_id FROM billing.commerce_entitlements WHERE order_id=o.id;
 IF FOUND THEN RETURN v_id; END IF;
 IF o.package='kids' AND NOT billing.commerce_kids_parent(o.user_id)
   THEN RETURN NULL; END IF;
 v_start:=CASE o.start_rule WHEN 'date' THEN greatest(o.requested_start,now()) ELSE now() END;
 IF o.start_rule='after_expiry' THEN
   SELECT greatest(v_start,coalesce(max(ends_at),v_start)) INTO v_start FROM billing.commerce_entitlements
   WHERE user_id=o.user_id AND package=o.package AND revoked_at IS NULL;
   IF o.package='kids' THEN SELECT greatest(v_start,coalesce(max(active_until),v_start)) INTO v_start FROM public.kids_family_entitlements WHERE parent_id=o.user_id;
   ELSE SELECT greatest(v_start,coalesce(max(s.current_period_end),v_start)) INTO v_start FROM billing.subscriptions s
     JOIN billing.plan_versions pv ON pv.id=s.plan_version_id JOIN billing.plan_catalog pc ON pc.id=pv.plan_id
     WHERE s.user_id=o.user_id AND pc.plan_key=o.package AND s.access_state IN ('paid_active','canceled_at_period_end'); END IF;
 END IF;
 v_end:=v_start+CASE WHEN o.duration_days IS NOT NULL THEN make_interval(days=>o.duration_days)
   WHEN o.billing_interval='year' THEN interval '1 year' ELSE interval '1 month' END;
 INSERT INTO billing.commerce_entitlements(user_id,package,order_id,starts_at,ends_at) VALUES(o.user_id,o.package,o.id,v_start,v_end) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
-- Private helpers are intentionally not callable by client/service identities.
REVOKE ALL ON FUNCTION billing.commerce_assert_identity(uuid),billing.commerce_is_admin(),billing.commerce_external_package(uuid),
 billing.commerce_price(text,text,text,uuid),billing.commerce_quote(text,text,text,text,text,boolean),billing.commerce_activate(uuid)
 FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION billing.commerce_kids_parent(uuid),billing.commerce_validate_recipient(jsonb) FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION billing.commerce_next_start(uuid,text,timestamptz) FROM PUBLIC,anon,authenticated,service_role;

COMMIT;
