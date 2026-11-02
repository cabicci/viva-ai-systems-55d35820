-- Reviewed forward candidate. The native Drizzle runner owns the transaction.
-- Existing orders, Stripe provenance, catalogue, access and indexing are preserved.
SET LOCAL lock_timeout = '5s';

-- The existing Live offer retention triggers classify reservations as financial
-- evidence and already anonymize them at learner erasure / purge after retention.
-- Complete that installed contract: the generic public inventory must recognize
-- this table and must not delete its retained evidence during learner erasure.
DO $manual_ledger_retention$
DECLARE targets oid[]; definition text;
 old_inventory text:='c.table_name NOT IN (''card_assistant_question_windows'',''academic_assistant_questions'',''lesson_progress''';
 owner_filter text:='WHERE c.table_schema=''public'' AND c.column_name=''user_id'' AND c.udt_name=''uuid'' AND t.table_type=''BASE TABLE''';
BEGIN
 SELECT array_agg(p.oid) INTO targets FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.pronargs=3 AND p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%';
 IF coalesce(cardinality(targets),0)<>1 THEN RAISE EXCEPTION 'MANUAL_RETENTION_INVENTORY_MISMATCH'; END IF;
 definition:=replace(pg_get_functiondef(targets[1]),E'\r\n',E'\n');
 IF (length(definition)-length(replace(definition,old_inventory,'')))/length(old_inventory)<>1
 OR (length(definition)-length(replace(definition,owner_filter,'')))/length(owner_filter)<>3
 OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.stripe_live_offer_account_retention()'::regprocedure
  AND prosrc LIKE '%NEW.financial_purged_at IS NOT NULL%' AND prosrc LIKE '%recipient_email=''''%')
 THEN RAISE EXCEPTION 'MANUAL_RETENTION_DEFINITION_MISMATCH'; END IF;
 definition:=replace(definition,old_inventory,replace(old_inventory,'NOT IN (','NOT IN (''stripe_live_offer_reservations'','));
 definition:=replace(definition,owner_filter,owner_filter||' AND c.table_name<>''stripe_live_offer_reservations''');
 EXECUTE definition;
END $manual_ledger_retention$;

-- Existing coupon terms are anonymized by the installed 0028 erasure wrapper
-- and purged with their first order. Include that order-owned financial table
-- in the same explicit inventory as commerce_orders; no new retention policy.
DO $manual_discount_retention$
DECLARE targets oid[]; definition text;
 needle text:='ARRAY[''account_deletion_requests'',''account_deletion_lifecycle''';
BEGIN
 SELECT array_agg(p.oid) INTO targets FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosrc LIKE '%LC09_UNCLASSIFIED_FINANCIAL_TABLE%';
 IF coalesce(cardinality(targets),0)<>1 THEN RAISE EXCEPTION 'MANUAL_DISCOUNT_INVENTORY_MISMATCH'; END IF;
 definition:=pg_get_functiondef(targets[1]);
 IF (length(definition)-length(replace(definition,needle,'')))/length(needle)<>1
 OR strpos(definition,'''commerce_discount_terms''')>0
 OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='billing.commerce_discount_terms'::regclass
  AND confrelid='billing.commerce_orders'::regclass AND contype='f' AND confdeltype='c')
 THEN RAISE EXCEPTION 'MANUAL_DISCOUNT_RETENTION_MISMATCH'; END IF;
 EXECUTE replace(definition,needle,needle||',''commerce_discount_terms''');
END $manual_discount_retention$;

ALTER TABLE billing.commercial_purchases
 ADD COLUMN payment_rail text NOT NULL DEFAULT 'stripe'
 CHECK(payment_rail IN ('stripe','instapay','wallet','bank')),
 ADD CONSTRAINT commercial_manual_no_stripe_identity CHECK(payment_rail='stripe' OR
  (session_id IS NULL AND customer_id IS NULL AND price_id IS NULL AND product_id IS NULL
   AND payment_id IS NULL AND provider_event_id IS NULL));

ALTER TABLE billing.commerce_orders DROP CONSTRAINT commerce_orders_package_check;
ALTER TABLE billing.commerce_orders ADD CONSTRAINT commerce_orders_package_check
 CHECK(package IN ('pro','pro_plus','kids','technical','academic','lifetime_course','question_topup'));
ALTER TABLE billing.commerce_orders DROP CONSTRAINT commerce_orders_billing_interval_check;
ALTER TABLE billing.commerce_orders ADD CONSTRAINT commerce_orders_billing_interval_check
 CHECK(billing_interval IN ('month','year','custom','one_time'));
ALTER TABLE billing.commerce_orders ADD COLUMN commercial_purchase_id uuid UNIQUE
 REFERENCES billing.commercial_purchases(id) ON DELETE CASCADE;
ALTER TABLE billing.commerce_orders ADD CONSTRAINT commerce_one_time_binding CHECK(
 (package IN ('lifetime_course','question_topup') AND billing_interval='one_time'
  AND commercial_purchase_id IS NOT NULL AND group_id IS NULL AND duration_days IS NULL
  AND currency='EGP' AND method IN ('instapay','wallet','bank') AND final_minor>0)
 OR (package NOT IN ('lifetime_course','question_topup') AND billing_interval<>'one_time'
  AND commercial_purchase_id IS NULL));

CREATE FUNCTION billing.commercial_preserve_rail() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NEW.payment_rail IS DISTINCT FROM OLD.payment_rail THEN
  RAISE EXCEPTION 'COMMERCIAL_PAYMENT_RAIL_IMMUTABLE';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commercial_preserve_rail() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commercial_payment_rail_immutable BEFORE UPDATE ON billing.commercial_purchases
 FOR EACH ROW EXECUTE FUNCTION billing.commercial_preserve_rail();

CREATE FUNCTION billing.commercial_manual_quote(p_user uuid,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_kind text:=p_data->>'kind'; v_area text:=nullif(p_data->>'area',''); v_course text:=nullif(p_data->>'course','');
 child uuid:=nullif(p_data->>'child_id','')::uuid; scope text:=p_data->>'wallet_scope';
 code text:=upper(btrim(coalesce(p_data->>'code',''))); email text; q jsonb;
BEGIN
 email:=billing.commerce_assert_identity(p_user);
 IF NOT billing.commercial_account_allowed(p_user)
 OR NOT EXISTS(SELECT 1 FROM billing.commerce_control WHERE enabled)
 THEN RAISE EXCEPTION 'COMMERCIAL_ACCOUNT_DENIED'; END IF;
 IF v_kind IS NULL OR v_kind NOT IN ('lifetime_course','question_topup') OR scope IS NULL OR scope NOT IN ('account','family')
 OR (v_kind='lifetime_course' AND (code<>'' OR NOT billing.commercial_selection_valid(p_user,v_area,v_course,child)
   OR scope<>CASE WHEN v_area='kids' THEN 'family' ELSE 'account' END))
 OR (v_kind='question_topup' AND (v_area IS NOT NULL OR v_course IS NOT NULL OR child IS NOT NULL))
 OR (scope='family' AND NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE parent_id=p_user))
 THEN RAISE EXCEPTION 'COMMERCIAL_INVALID_SELECTION'; END IF;
 IF v_kind='lifetime_course' THEN
  SELECT jsonb_build_object('original_minor',amount_minor,'final_minor',amount_minor,'currency',currency)
   INTO STRICT q FROM billing.commercial_catalogue WHERE kind='lifetime_course';
 ELSE
  q:=billing.commerce_quote('question_topup','EG','one_time',code,email,false);
 END IF;
 IF q->>'currency' IS DISTINCT FROM 'EGP' OR coalesce((q->>'final_minor')::integer,0)<=0
 THEN RAISE EXCEPTION 'COMMERCIAL_INVALID_QUOTE'; END IF;
 RETURN q||jsonb_build_object('billing_interval','one_time','kind',v_kind);
END $$;
REVOKE ALL ON FUNCTION billing.commercial_manual_quote(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;

ALTER FUNCTION public.commerce_command(text,jsonb) RENAME TO commerce_before_one_time_command;
ALTER FUNCTION public.commerce_before_one_time_command(text,jsonb) SET SCHEMA billing;
REVOKE ALL ON FUNCTION billing.commerce_before_one_time_command(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION billing.commercial_order_view(p_order jsonb) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce((SELECT p_order||jsonb_build_object('commercial_purchase',jsonb_build_object(
  'state',cp.state,'kind',cp.kind,'area',cp.area,'course',cp.course,'child_id',cp.child_id,'wallet_scope',cp.wallet_scope))
  FROM billing.commerce_orders co JOIN billing.commercial_purchases cp ON cp.id=co.commercial_purchase_id
  WHERE co.id=(p_order->>'id')::uuid),p_order);
$$;
REVOKE ALL ON FUNCTION billing.commercial_order_view(jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); email text; q jsonb; params jsonb; k uuid;
 o billing.commerce_orders%ROWTYPE; p billing.commercial_purchases%ROWTYPE; m billing.commerce_methods%ROWTYPE;
 lock_user record;
BEGIN
 IF p_action NOT IN ('one_time_quote','create_one_time_order') THEN
  IF p_action IN ('create_order','quote','import','preview_import')
   AND p_data->>'package' IN ('lifetime_course','question_topup')
  THEN RAISE EXCEPTION 'COMMERCIAL_BOUND_ORDER_REQUIRED'; END IF;
  -- Join the existing checkout/deletion lock order BEFORE the legacy ledger
  -- takes order/payment row locks. Never grant an unprivileged caller access
  -- to another account's locks or payment data.
  IF p_action IN ('confirm','allocate','refund') AND billing.commerce_is_admin() THEN
   PERFORM billing.commerce_assert_identity(u);
   FOR lock_user IN SELECT DISTINCT co.user_id FROM billing.commerce_orders co
    WHERE co.commercial_purchase_id IS NOT NULL AND co.user_id IS NOT NULL
     AND ((p_action='refund' AND co.id=nullif(p_data->>'order_id','')::uuid)
      OR (p_action IN ('confirm','allocate') AND co.id IN
       (SELECT (x->>'order_id')::uuid FROM jsonb_array_elements(p_data->'allocations') x)))
    ORDER BY co.user_id
   LOOP PERFORM billing.commercial_lock(lock_user.user_id); END LOOP;
  END IF;
  q:=billing.commerce_before_one_time_command(p_action,p_data);
  IF p_action='order' THEN RETURN billing.commercial_order_view(q); END IF;
  IF p_action IN ('my_list','admin_list') THEN
   q:=jsonb_set(q,'{orders}',coalesce((SELECT jsonb_agg(billing.commercial_order_view(item) ORDER BY ordinal)
    FROM jsonb_array_elements(q->'orders') WITH ORDINALITY rows(item,ordinal)),'[]'::jsonb));
  END IF;
  RETURN q;
 END IF;
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR
  p_data-ARRAY['kind','area','course','child_id','wallet_scope','code','phone','method','key']<>'{}'::jsonb
 THEN RAISE EXCEPTION 'COMMERCIAL_INVALID_SELECTION'; END IF;
 PERFORM billing.commercial_lock(u);
 email:=billing.commerce_assert_identity(u);
 IF p_action='one_time_quote' THEN RETURN billing.commercial_manual_quote(u,p_data); END IF;
 k:=(p_data->>'key')::uuid;
 IF k IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_REQUEST_ID_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('commerce-key:'||u::text||':'||k::text,0));
 SELECT * INTO o FROM billing.commerce_orders WHERE request_key=u::text||':'||k::text FOR UPDATE;
 IF FOUND THEN
  IF o.parameters IS DISTINCT FROM p_data THEN RAISE EXCEPTION 'COMMERCE_RETRY_CONFLICT'; END IF;
  IF NOT billing.commercial_account_allowed(u) THEN RAISE EXCEPTION 'COMMERCIAL_ACCOUNT_DENIED'; END IF;
  RETURN to_jsonb(o);
 END IF;
 q:=billing.commercial_manual_quote(u,p_data);
 SELECT * INTO m FROM billing.commerce_methods WHERE code=p_data->>'method' FOR SHARE;
 IF m.code IS NULL OR m.code NOT IN ('instapay','wallet','bank') OR NOT m.enabled
  OR nullif(btrim(m.destination),'') IS NULL OR nullif(btrim(m.instructions),'') IS NULL
  OR NOT ('EGP'=ANY(m.currencies)) THEN RAISE EXCEPTION 'COMMERCE_METHOD_UNAVAILABLE'; END IF;
 -- Expired manual intents may no longer block a later purchase. A live Stripe
 -- intent is never expired or relabelled by the manual rail.
 UPDATE billing.commercial_purchases pending_purchase SET state='expired'
  FROM billing.commerce_orders expired WHERE expired.commercial_purchase_id=pending_purchase.id AND pending_purchase.user_id=u
  AND pending_purchase.state='pending' AND pending_purchase.payment_rail<>'stripe' AND expired.expires_at<=now();
 IF p_data->>'kind'='lifetime_course' AND EXISTS(SELECT 1 FROM billing.commercial_purchases
  WHERE user_id=u AND kind='lifetime_course' AND area=p_data->>'area' AND course=p_data->>'course'
   AND child_id IS NOT DISTINCT FROM nullif(p_data->>'child_id','')::uuid AND state IN ('pending','fulfilled'))
 THEN RAISE EXCEPTION 'COMMERCIAL_CURRICULUM_OWNED_OR_PENDING'; END IF;
 params:=p_data||jsonb_build_object('manual',true,'quote',q);
 INSERT INTO billing.commercial_purchases(user_id,kind,area,course,child_id,wallet_scope,amount_minor,currency,
  request_id,parameters,payment_rail)
 VALUES(u,p_data->>'kind',nullif(p_data->>'area',''),nullif(p_data->>'course',''),
  nullif(p_data->>'child_id','')::uuid,p_data->>'wallet_scope',(q->>'final_minor')::integer,'EGP',k,params,m.code)
 RETURNING * INTO p;
 INSERT INTO billing.commerce_orders(user_id,recipient_email,package,billing_interval,start_rule,
  original_minor,final_minor,currency,method,instructions_snapshot,offer_id,request_key,parameters,commercial_purchase_id)
 VALUES(u,email,p.kind,'one_time','confirmation',(q->>'original_minor')::bigint,p.amount_minor,'EGP',m.code,
  to_jsonb(m),nullif(q->>'offer_id','')::uuid,u::text||':'||k::text,p_data,p.id) RETURNING * INTO o;
 IF o.offer_id IS NOT NULL THEN
  IF q->>'phone_required'='true' THEN
   PERFORM billing.commerce_assert_offer_phone(o.offer_id,p_data->>'phone',email,u,o.id,NULL);
   UPDATE billing.commerce_orders SET redemption_phone=p_data->>'phone' WHERE id=o.id;
  END IF;
  UPDATE billing.commerce_orders SET expires_at=least(expires_at,(SELECT valid_until FROM billing.commerce_offers WHERE id=o.offer_id)) WHERE id=o.id RETURNING * INTO o;
 END IF;
 INSERT INTO billing.commerce_audit(actor,action,target_id,details) VALUES(u,'create_one_time_order',o.id,
  jsonb_build_object('kind',p.kind,'method',m.code,'purchase_id',p.id));
 RETURN to_jsonb(o);
END $$;
REVOKE ALL ON FUNCTION public.commerce_command(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.commerce_command(text,jsonb) TO authenticated;

ALTER FUNCTION billing.commerce_activate(uuid) RENAME TO commerce_subscription_activate;
REVOKE ALL ON FUNCTION billing.commerce_subscription_activate(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION billing.commerce_activate(p_order uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o billing.commerce_orders%ROWTYPE; p billing.commercial_purchases%ROWTYPE;
BEGIN
 SELECT * INTO o FROM billing.commerce_orders WHERE id=p_order FOR UPDATE;
 IF o.commercial_purchase_id IS NULL THEN RETURN billing.commerce_subscription_activate(p_order); END IF;
 IF o.user_id IS NULL OR o.review_status<>'confirmed' THEN RETURN NULL; END IF;
 PERFORM billing.commerce_assert_identity(o.user_id); PERFORM billing.commercial_lock(o.user_id);
 SELECT * INTO STRICT p FROM billing.commercial_purchases WHERE id=o.commercial_purchase_id FOR UPDATE;
 IF p.user_id IS DISTINCT FROM o.user_id OR p.payment_rail IS DISTINCT FROM o.method
  OR p.kind IS DISTINCT FROM o.package OR p.amount_minor IS DISTINCT FROM o.final_minor
  OR p.currency IS DISTINCT FROM o.currency OR p.state IN ('held','expired')
  OR NOT billing.commercial_account_allowed(o.user_id) OR o.expires_at<=now()
  OR (SELECT coalesce(sum(a.amount_minor),0) FROM billing.commerce_allocations a WHERE a.order_id=o.id)<>o.final_minor
  OR EXISTS(SELECT 1 FROM billing.commerce_allocations a JOIN billing.commerce_payments funds ON funds.id=a.payment_id
   WHERE a.order_id=o.id AND (funds.user_id IS DISTINCT FROM o.user_id OR funds.group_id IS NOT NULL
    OR funds.method IS DISTINCT FROM o.method OR funds.currency IS DISTINCT FROM o.currency OR funds.confirmed_by IS NULL))
 THEN RAISE EXCEPTION 'COMMERCIAL_MANUAL_PAYMENT_MISMATCH'; END IF;
 IF p.state='fulfilled' THEN RETURN p.id; END IF;
 IF p.kind='lifetime_course' AND NOT billing.commercial_selection_valid(p.user_id,p.area,p.course,p.child_id)
 THEN RAISE EXCEPTION 'COMMERCIAL_SELECTION_CHANGED'; END IF;
 UPDATE billing.commercial_purchases SET state='fulfilled',paid_at=now() WHERE id=p.id;
 IF p.kind='question_topup' THEN
  INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,expires_at,idempotency_key,occurred_at,metadata)
  VALUES(p.user_id,'grant',p.quantity,billing.assistant_wallet_units(p.user_id,p.wallet_scope)+p.quantity,
   'commercial_purchase',p.id,NULL,'commercial:purchase:'||p.id,now(),jsonb_build_object('wallet_scope',p.wallet_scope,'payment_method',p.payment_rail));
 END IF;
 PERFORM billing.queue_commerce_payment_mail(o.id);
 RETURN p.id;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_activate(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION billing.commercial_manual_order_state() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NEW.commercial_purchase_id IS NOT NULL AND NEW.review_status IN ('cancelled','expired') THEN
  UPDATE billing.commercial_purchases SET state='expired' WHERE id=NEW.commercial_purchase_id AND state='pending';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commercial_manual_order_state() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commercial_manual_terminal_order AFTER UPDATE OF review_status ON billing.commerce_orders
 FOR EACH ROW EXECUTE FUNCTION billing.commercial_manual_order_state();

CREATE FUNCTION billing.commercial_manual_refund() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p billing.commercial_purchases%ROWTYPE; o billing.commerce_orders%ROWTYPE;
BEGIN
 IF NOT NEW.revoke_access THEN RETURN NEW; END IF;
 SELECT * INTO o FROM billing.commerce_orders WHERE id=NEW.order_id;
 IF o.commercial_purchase_id IS NULL THEN RETURN NEW; END IF;
 PERFORM billing.commercial_lock(o.user_id);
 SELECT * INTO STRICT p FROM billing.commercial_purchases WHERE id=o.commercial_purchase_id FOR UPDATE;
 -- Refund evidence belongs to the manual payment ledger, never a fabricated
 -- Stripe event. Explicit access revocation cannot be undone by confirmation.
 IF p.state<>'held' THEN
  IF p.state='fulfilled' AND p.kind='question_topup' THEN
   INSERT INTO billing.ai_credit_ledger(user_id,entry_type,credit_units,balance_after,source_type,source_id,idempotency_key,occurred_at,metadata)
   VALUES(p.user_id,'refund',-p.quantity,billing.assistant_wallet_units(p.user_id,p.wallet_scope)-p.quantity,
    'commercial_purchase_hold',p.id,'commercial:hold:'||p.id,now(),jsonb_build_object('wallet_scope',p.wallet_scope,'payment_method',p.payment_rail));
  END IF;
  UPDATE billing.commercial_purchases SET state='held',held_at=now(),hold_reason='manual_payment_refund' WHERE id=p.id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.commercial_manual_refund() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER commercial_manual_refund_hold AFTER INSERT ON billing.commerce_refunds
 FOR EACH ROW EXECUTE FUNCTION billing.commercial_manual_refund();

CREATE OR REPLACE FUNCTION billing.queue_commerce_payment_mail(p_order uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_id uuid; BEGIN
 INSERT INTO billing.commerce_outbox(order_id,recipient,payload)
 SELECT o.id,lower(u.email),jsonb_build_object('name',left(u.raw_user_meta_data->>'full_name',80),
   'locale',u.raw_user_meta_data->>'preferred_locale','package',o.package,'reference',o.reference,
   'amount_minor',o.final_minor,'currency',o.currency,'order_id',o.id)
 FROM billing.commerce_orders o JOIN auth.users u ON u.id=o.user_id
 WHERE o.id=p_order AND o.review_status='confirmed' AND o.confirmed_at IS NOT NULL
   AND (EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.order_id=o.id AND e.revoked_at IS NULL AND e.ends_at>now()) OR EXISTS(SELECT 1 FROM billing.commercial_purchases cp WHERE cp.id=o.commercial_purchase_id AND cp.user_id=o.user_id AND cp.payment_rail=o.method AND cp.state='fulfilled'))
   AND u.email_confirmed_at IS NOT NULL AND lower(u.email)=o.recipient_email
   AND NOT billing.account_deletion_blocked(u.id)
 ON CONFLICT(order_id) DO NOTHING;
 SELECT id INTO v_id FROM billing.commerce_outbox WHERE order_id=p_order;
 RETURN v_id;
END $function$;


CREATE OR REPLACE FUNCTION billing.commerce_payment_mail_allowed(p_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_outbox m
 LEFT JOIN billing.commerce_receipts r ON r.id=m.receipt_id
 JOIN billing.commerce_orders o ON o.id=coalesce(m.order_id,r.order_id)
 JOIN auth.users u ON u.id=o.user_id AND u.email_confirmed_at IS NOT NULL
 WHERE m.id=p_id AND (
   (m.order_id IS NOT NULL AND lower(u.email)=m.recipient AND o.review_status='confirmed'
     AND (EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.order_id=o.id AND e.revoked_at IS NULL AND e.ends_at>now()) OR EXISTS(SELECT 1 FROM billing.commercial_purchases cp WHERE cp.id=o.commercial_purchase_id AND cp.user_id=o.user_id AND cp.payment_rail=o.method AND cp.state='fulfilled')))
   OR (m.receipt_id IS NOT NULL AND m.recipient='sales@masaarat.ai'
     AND EXISTS(SELECT 1 FROM storage.objects s WHERE s.bucket_id='commerce-receipts' AND s.name=r.storage_path)))
   AND NOT billing.account_deletion_blocked(u.id) AND billing.lc09_contact_recipient_active(m.recipient)
   AND NOT EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p WHERE p.email=m.recipient AND p.suppressed)
   AND NOT EXISTS(SELECT 1 FROM public.contact_mail_receipts c JOIN public.contact_acknowledgement_outbox a ON a.id=c.outbox_id WHERE a.recipient=m.recipient AND c.event_type IN ('email.bounced','email.failed','email.complained','email.suppressed')));
$function$;

DO $manual_purchase_postconditions$
DECLARE fn record;
BEGIN
 IF NOT has_function_privilege('authenticated','public.commerce_command(text,jsonb)','EXECUTE')
 OR has_function_privilege('anon','public.commerce_command(text,jsonb)','EXECUTE')
 OR has_function_privilege('service_role','public.commerce_command(text,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'MANUAL_COMMAND_ACL_MISMATCH'; END IF;
 FOR fn IN SELECT p.oid FROM pg_proc p WHERE pronamespace='billing'::regnamespace
 AND proname IN ('commercial_manual_quote','commercial_order_view','commerce_before_one_time_command',
  'commerce_subscription_activate','commerce_activate','commercial_manual_order_state','commercial_manual_refund','commercial_preserve_rail')
 LOOP
  IF has_function_privilege('anon',fn.oid,'EXECUTE') OR has_function_privilege('authenticated',fn.oid,'EXECUTE')
   OR has_function_privilege('service_role',fn.oid,'EXECUTE') THEN RAISE EXCEPTION 'MANUAL_PRIVATE_ACL_MISMATCH'; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='billing.commerce_orders'::regclass
  AND confrelid='billing.commercial_purchases'::regclass AND contype='f' AND confdeltype='c')
 THEN RAISE EXCEPTION 'MANUAL_PURCHASE_BINDING_MISSING'; END IF;
END $manual_purchase_postconditions$;

