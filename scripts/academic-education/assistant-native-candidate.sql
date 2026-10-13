-- Academic assistant on the existing application server. Apply through Lovable only.
BEGIN;
CREATE TABLE public.academic_assistant_policy (
 course_id text PRIMARY KEY REFERENCES public.academic_courses(id),
 runtime_enabled boolean NOT NULL DEFAULT false,
 sales_enabled boolean NOT NULL DEFAULT false,
 eg_month_minor integer NOT NULL CHECK(eg_month_minor>0),
 eg_year_minor integer NOT NULL CHECK(eg_year_minor>0),
 usd_month_minor integer NOT NULL CHECK(usd_month_minor>0),
 usd_year_minor integer NOT NULL CHECK(usd_year_minor>0)
);
INSERT INTO public.academic_assistant_policy VALUES('AC-BUS',false,false,5000,60000,100,1200);
ALTER TABLE public.academic_assistant_policy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_assistant_policy FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.academic_assistant_policy TO service_role;

CREATE TABLE public.academic_assistant_purchases (
 order_id uuid PRIMARY KEY REFERENCES billing.commerce_orders(id) ON DELETE CASCADE,
 course_id text NOT NULL REFERENCES public.academic_courses(id),
 surcharge_minor integer NOT NULL CHECK(surcharge_minor>0)
);
ALTER TABLE public.academic_assistant_purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_assistant_purchases FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.academic_assistant_purchases TO service_role;

CREATE TABLE public.academic_assistant_questions (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 course_id text NOT NULL REFERENCES public.academic_courses(id),
 request_id uuid NOT NULL,
 lesson_id text NOT NULL,
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 period_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,course_id,request_id)
);
CREATE INDEX academic_assistant_questions_month ON public.academic_assistant_questions(user_id,course_id,period_key,lesson_id);
ALTER TABLE public.academic_assistant_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_assistant_questions FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.academic_assistant_questions TO service_role;

ALTER TABLE billing.academic_stripe_prices ADD COLUMN includes_assistant boolean NOT NULL DEFAULT false;
ALTER TABLE billing.academic_stripe_prices ADD COLUMN course_id text NOT NULL DEFAULT 'AC-BUS' REFERENCES public.academic_courses(id);

CREATE FUNCTION billing.academic_addon_amount(p_course text,p_market text,p_interval text)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.academic_assistant_policy%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.academic_assistant_policy WHERE course_id=p_course AND sales_enabled;
 IF NOT FOUND OR p_market NOT IN ('EG','INTL') OR p_interval NOT IN ('month','year') THEN
  RAISE EXCEPTION 'ACADEMIC_ADDON_UNAVAILABLE';
 END IF;
 RETURN CASE WHEN p_market='EG' THEN CASE WHEN p_interval='month' THEN p.eg_month_minor ELSE p.eg_year_minor END
 ELSE CASE WHEN p_interval='month' THEN p.usd_month_minor ELSE p.usd_year_minor END END;
END $$;
REVOKE ALL ON FUNCTION billing.academic_addon_amount(text,text,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION billing.academic_checkout_quote(p_package text,p_market text,p_interval text,p_code text,p_email text,p_renewal boolean,p_assistant boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; extra integer;
BEGIN
 q:=billing.commerce_quote(p_package,p_market,p_interval,p_code,p_email,p_renewal);
 IF NOT coalesce(p_assistant,false) THEN RETURN q; END IF;
 IF p_package IS DISTINCT FROM 'academic' THEN RAISE EXCEPTION 'ACADEMIC_ADDON_WRONG_PACKAGE'; END IF;
 extra:=billing.academic_addon_amount('AC-BUS',p_market,p_interval);
 IF q->>'offer_kind'='complimentary' AND (q->>'offer_duration_days')::integer IS DISTINCT FROM (CASE WHEN p_interval='month' THEN 30 ELSE 365 END) THEN
  RAISE EXCEPTION 'ACADEMIC_ADDON_OFFER_DURATION_UNSUPPORTED';
 END IF;
 RETURN q||jsonb_build_object('original_minor',(q->>'original_minor')::bigint+extra,
 'final_minor',(q->>'final_minor')::bigint+extra,'academic_assistant',true,'assistant_surcharge_minor',extra,
 'offer_kind',CASE WHEN q->>'offer_kind'='complimentary' THEN 'academic_bundle' ELSE q->>'offer_kind' END);
END $$;
REVOKE ALL ON FUNCTION billing.academic_checkout_quote(text,text,text,text,text,boolean,boolean) FROM PUBLIC,anon,authenticated;

-- Change only the two self-service quote calls; preserve every existing wrapper.
DO $patch$
DECLARE d text; needle text:=$n$billing.commerce_quote(p_data->>'package',p_data->>'market',p_data->>'billing_interval',p_data->>'code',v_email,coalesce((p_data->>'renewal')::boolean,false))$n$;
 replacement text:=$n$billing.academic_checkout_quote(p_data->>'package',p_data->>'market',p_data->>'billing_interval',p_data->>'code',v_email,coalesce((p_data->>'renewal')::boolean,false),coalesce((p_data->>'academicAssistant')::boolean,false))$n$;
BEGIN
 d:=pg_get_functiondef('billing.commerce_previous_simple_command(text,jsonb)'::regprocedure);
 IF (length(d)-length(replace(d,needle,'')))/length(needle)<>2 THEN RAISE EXCEPTION 'ACADEMIC_COMMAND_SOURCE_CHANGED'; END IF;
 d:=replace(d,needle,replacement);
 IF position($n$CASE WHEN v_price->>'offer_kind'='complimentary' THEN (v_price->>'offer_duration_days')::integer END$n$ IN d)=0 THEN RAISE EXCEPTION 'ACADEMIC_OFFER_DURATION_SOURCE_CHANGED'; END IF;
 d:=replace(d,$n$CASE WHEN v_price->>'offer_kind'='complimentary' THEN (v_price->>'offer_duration_days')::integer END$n$,
 $n$CASE WHEN v_price->>'offer_kind' IN ('complimentary','academic_bundle') THEN (v_price->>'offer_duration_days')::integer END$n$);
 EXECUTE d;
END $patch$;

CREATE FUNCTION billing.academic_record_addon_purchase() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE extra integer;
BEGIN
 IF coalesce((NEW.parameters->>'academicAssistant')::boolean,false) THEN
  IF NEW.package IS DISTINCT FROM 'academic' THEN RAISE EXCEPTION 'ACADEMIC_ADDON_WRONG_PACKAGE'; END IF;
  extra:=billing.academic_addon_amount('AC-BUS',NEW.parameters->>'market',NEW.billing_interval);
  IF NEW.final_minor<extra THEN RAISE EXCEPTION 'ACADEMIC_ADDON_PRICE_MISMATCH'; END IF;
  INSERT INTO public.academic_assistant_purchases VALUES(NEW.id,'AC-BUS',extra);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.academic_record_addon_purchase() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER academic_record_addon_purchase AFTER INSERT ON billing.commerce_orders
FOR EACH ROW EXECUTE FUNCTION billing.academic_record_addon_purchase();

CREATE FUNCTION billing.academic_bind_entitlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c text;
BEGIN
 IF NEW.package='academic' THEN
  SELECT course_id INTO c FROM public.academic_assistant_purchases WHERE order_id=NEW.order_id;
  c:=coalesce(c,'AC-BUS');
  INSERT INTO public.academic_content_course_grants VALUES(NEW.id,c) ON CONFLICT DO NOTHING;
  IF EXISTS(SELECT 1 FROM public.academic_assistant_purchases WHERE order_id=NEW.order_id AND course_id=c) THEN
   INSERT INTO public.academic_assistant_course_grants VALUES(NEW.id,c) ON CONFLICT DO NOTHING;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.academic_bind_entitlement() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER academic_bind_entitlement AFTER INSERT ON billing.commerce_entitlements
FOR EACH ROW EXECUTE FUNCTION billing.academic_bind_entitlement();
INSERT INTO public.academic_content_course_grants
 SELECT id,'AC-BUS' FROM billing.commerce_entitlements WHERE package='academic' ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.academic_assistant_access(p_course text,p_lesson text,p_locale text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN NOT coalesce(public.academic_can_access(p_course,p_lesson,p_locale),false)
 OR NOT EXISTS(SELECT 1 FROM public.academic_lesson_content WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale AND approved)
 THEN 'none'
 WHEN EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course AND assistant_review_enabled AND public.academic_review_allowed(p_course)) THEN 'admin'
 WHEN EXISTS(SELECT 1 FROM public.academic_courses c JOIN public.academic_assistant_policy p ON p.course_id=c.id
  WHERE c.id=p_course AND c.enabled AND c.assistant_enabled AND p.runtime_enabled)
 AND (
 EXISTS(SELECT 1 FROM billing.commerce_entitlements e
 JOIN public.academic_content_course_grants b ON b.entitlement_id=e.id AND b.course_id=p_course
 JOIN public.academic_assistant_course_grants a ON a.entitlement_id=e.id AND a.course_id=p_course
 WHERE e.user_id=auth.uid() AND e.package='academic' AND e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
 AND NOT EXISTS(SELECT 1 FROM billing.commerce_orders o WHERE o.id=e.order_id
  AND coalesce((SELECT sum(r.amount_minor) FROM billing.commerce_refunds r WHERE r.order_id=o.id),0)>=o.final_minor)
 AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled))
 OR EXISTS(SELECT 1 FROM billing.academic_stripe_subscriptions s JOIN billing.academic_stripe_prices p ON p.gateway_price_id=s.price_id
 WHERE s.user_id=auth.uid() AND p.course_id=p_course AND p.includes_assistant AND s.status IN ('active','trialing')
 AND NOT s.refunded AND s.starts_at<=now() AND s.ends_at>now()))
 THEN 'learner' ELSE 'none' END;
$$;
REVOKE ALL ON FUNCTION public.academic_assistant_access(text,text,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_assistant_access(text,text,text) TO authenticated;

CREATE FUNCTION public.academic_assistant_take_question(p_course text,p_lesson text,p_locale text,p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE mode text; period text:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM'); total_limit integer; lesson_limit integer; count_total integer; count_lesson integer; policies integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('account-lifecycle:'||auth.uid()::text,0));
 mode:=public.academic_assistant_access(p_course,p_lesson,p_locale);
 IF mode='none' OR p_request IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','access'); END IF;
 IF mode='admin' THEN RETURN jsonb_build_object('allowed',true,'mode','admin'); END IF;
 SELECT count(*),min(assistant_runtime_general_monthly_quota),min(assistant_runtime_per_lesson_quota)
 INTO policies,total_limit,lesson_limit FROM billing.entitlement_policy_versions
 WHERE policy_key='pro_plus' AND status='published' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now());
 IF policies<>1 OR coalesce(total_limit,0)<=0 OR coalesce(lesson_limit,0)<=0 THEN RAISE EXCEPTION 'ACADEMIC_QUOTA_POLICY_UNAVAILABLE'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('academic-questions:'||auth.uid()::text||':'||p_course,0));
 IF EXISTS(SELECT 1 FROM public.academic_assistant_questions WHERE user_id=auth.uid() AND course_id=p_course AND request_id=p_request) THEN
  RETURN jsonb_build_object('allowed',false,'reason','duplicate');
 END IF;
 SELECT count(*),count(*) FILTER(WHERE lesson_id=p_lesson) INTO count_total,count_lesson
 FROM public.academic_assistant_questions WHERE user_id=auth.uid() AND course_id=p_course AND period_key=period;
 IF count_total>=total_limit OR count_lesson>=lesson_limit THEN RETURN jsonb_build_object('allowed',false,'reason','quota'); END IF;
 INSERT INTO public.academic_assistant_questions(user_id,course_id,request_id,lesson_id,locale,period_key)
 VALUES(auth.uid(),p_course,p_request,p_lesson,p_locale,period);
 RETURN jsonb_build_object('allowed',true,'mode','learner','remaining_month',total_limit-count_total-1,'remaining_lesson',lesson_limit-count_lesson-1);
END $$;
REVOKE ALL ON FUNCTION public.academic_assistant_take_question(text,text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_assistant_take_question(text,text,text,uuid) TO authenticated;

CREATE FUNCTION public.get_academic_assistant_stripe_checkout_context(p_user_id uuid,p_market_code text,p_billing_interval text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q jsonb; p billing.academic_stripe_prices%ROWTYPE; extra integer;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 q:=public.get_academic_stripe_checkout_context(p_user_id,p_market_code,p_billing_interval);
 extra:=billing.academic_addon_amount('AC-BUS',p_market_code,p_billing_interval);
 SELECT * INTO p FROM billing.academic_stripe_prices
 WHERE market_code=p_market_code AND billing_interval=p_billing_interval AND amount_minor=(q->>'amount_minor')::bigint+extra
 AND includes_assistant AND course_id='AC-BUS';
 RETURN q||jsonb_build_object('amount_minor',(q->>'amount_minor')::bigint+extra,'includes_assistant',true,
 'course_id','AC-BUS','assistant_surcharge_minor',extra,'gateway_price_id',p.gateway_price_id,'gateway_product_id',p.gateway_product_id);
END $$;
CREATE FUNCTION public.register_academic_assistant_stripe_price(p_market_code text,p_billing_interval text,p_discounted boolean,p_currency_code text,p_amount_minor integer,p_product_id text,p_price_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE base jsonb; extra integer; r billing.academic_stripe_prices%ROWTYPE;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 base:=billing.commerce_price('academic',p_market_code,p_billing_interval);
 extra:=billing.academic_addon_amount('AC-BUS',p_market_code,p_billing_interval);
 IF p_discounted IS DISTINCT FROM false OR p_amount_minor IS DISTINCT FROM (base->>'original_minor')::integer+extra
 OR p_currency_code IS DISTINCT FROM lower(base->>'currency') OR p_product_id !~ '^prod_[A-Za-z0-9]+$' OR p_price_id !~ '^price_[A-Za-z0-9]+$'
 THEN RAISE EXCEPTION 'ACADEMIC_PRICE_MISMATCH'; END IF;
 SELECT * INTO r FROM billing.academic_stripe_prices WHERE market_code=p_market_code AND billing_interval=p_billing_interval AND amount_minor=p_amount_minor;
 IF FOUND THEN
  IF NOT r.includes_assistant OR r.course_id<>'AC-BUS' THEN RAISE EXCEPTION 'ACADEMIC_PRICE_COLLISION'; END IF;
  RETURN r.gateway_price_id;
 END IF;
 INSERT INTO billing.academic_stripe_prices(market_code,billing_interval,amount_minor,currency_code,gateway_product_id,gateway_price_id,includes_assistant,course_id)
 VALUES(p_market_code,p_billing_interval,p_amount_minor,p_currency_code,p_product_id,p_price_id,true,'AC-BUS');
 RETURN p_price_id;
END $$;
REVOKE ALL ON FUNCTION public.get_academic_assistant_stripe_checkout_context(uuid,text,text),public.register_academic_assistant_stripe_price(text,text,boolean,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_academic_assistant_stripe_checkout_context(uuid,text,text),public.register_academic_assistant_stripe_price(text,text,boolean,text,integer,text,text) TO service_role;

CREATE FUNCTION public.academic_import_chunks(p_rows jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r jsonb; source jsonb; source_hash text; section jsonb; n integer:=0;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'ACADEMIC_IMPORT_SIZE'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  IF r->>'course_id'<>'AC-BUS' THEN RAISE EXCEPTION 'ACADEMIC_IMPORT_COURSE'; END IF;
  SELECT payload,source_sha256 INTO source,source_hash FROM public.academic_lesson_content
  WHERE course_id=r->>'course_id' AND lesson_id=r->>'lesson_id' AND locale=r->>'locale' AND approved FOR SHARE;
  IF NOT FOUND OR source_hash IS DISTINCT FROM r->>'source_sha256' THEN RAISE EXCEPTION 'ACADEMIC_IMPORT_SOURCE'; END IF;
  SELECT value INTO section FROM jsonb_array_elements(source->'sections') WHERE value->>'id'=r->>'section_id';
  IF section IS NULL OR (section->>'title')||E'\n'||(section->>'text') IS DISTINCT FROM r->>'content'
   OR coalesce(source->>'version','1.0.0-pilot') IS DISTINCT FROM r->>'content_version'
   OR encode(extensions.digest(convert_to(r->>'content','UTF8'),'sha256'),'hex') IS DISTINCT FROM r->>'content_sha256'
  THEN RAISE EXCEPTION 'ACADEMIC_IMPORT_SECTION'; END IF;
  INSERT INTO public.academic_rag_chunks(course_id,lesson_id,locale,section_id,content_version,source_sha256,content_sha256,content,embedding)
  VALUES(r->>'course_id',r->>'lesson_id',r->>'locale',r->>'section_id',r->>'content_version',r->>'source_sha256',r->>'content_sha256',r->>'content',(r->>'embedding')::extensions.vector)
  ON CONFLICT(course_id,lesson_id,locale,section_id,content_version) DO UPDATE
  SET source_sha256=EXCLUDED.source_sha256,content_sha256=EXCLUDED.content_sha256,content=EXCLUDED.content,embedding=EXCLUDED.embedding;
  n:=n+1;
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.academic_import_chunks(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.academic_import_chunks(jsonb) TO service_role;

-- Classify the new user-owned question ledger before the existing inventory runs.
DO $academic_deletion_inventory$
DECLARE
  v_targets oid[];
  v_definition text;
  v_old text := 'c.table_name NOT IN (''lesson_progress''';
  v_new text := 'c.table_name NOT IN (''academic_assistant_questions'',''lesson_progress''';
BEGIN
  IF to_regclass('public.academic_assistant_questions') IS NULL THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_QUESTIONS_TABLE_MISSING';
  END IF;
  SELECT array_agg(p.oid) INTO v_targets
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.pronargs=3
    AND p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%';
  IF coalesce(cardinality(v_targets),0) <> 1 THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_INVENTORY_TARGET_MISMATCH';
  END IF;
  v_definition := pg_get_functiondef(v_targets[1]);
  -- Idempotent reapplication; unknown installed definitions still fail closed.
  IF strpos(v_definition,v_new) > 0 THEN RETURN; END IF;
  IF (length(v_definition)-length(replace(v_definition,v_old,'')))/length(v_old) <> 1 THEN
    RAISE EXCEPTION 'ACADEMIC_DELETION_INVENTORY_DEFINITION_MISMATCH';
  END IF;
  EXECUTE replace(v_definition,v_old,v_new);
END;
$academic_deletion_inventory$;

-- Retain the existing complete deletion chain and its authorization/lease checks.
ALTER FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RENAME TO academic_assistant_previous_advance;
REVOKE ALL ON FUNCTION public.academic_assistant_previous_advance(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 result:=public.academic_assistant_previous_advance(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN DELETE FROM public.academic_assistant_questions WHERE user_id=p_user_id; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;
COMMIT;


