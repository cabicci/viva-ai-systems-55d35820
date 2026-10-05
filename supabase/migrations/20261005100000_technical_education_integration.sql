BEGIN;
-- Furniture is one vocational path. AI/Kids entitlements stay independent.
CREATE TABLE public.technical_release_control(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.technical_release_control(singleton) VALUES(true);
CREATE TABLE public.technical_lesson_content(
 lesson_id text NOT NULL CHECK(lesson_id ~ '^M[0-9]{2}-L[0-9]{2}$'),
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 kind text NOT NULL CHECK(kind IN ('lesson','cabinet')), payload jsonb NOT NULL,
 video_guid uuid NOT NULL, source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 PRIMARY KEY(lesson_id,locale));
CREATE TABLE public.technical_progress(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 lesson_id text NOT NULL, read boolean NOT NULL DEFAULT false, quiz_passed boolean NOT NULL DEFAULT false,
 practice_reviewed boolean NOT NULL DEFAULT false, drafts jsonb NOT NULL DEFAULT '{}',
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,lesson_id));
CREATE TABLE public.technical_asset_manifest(
 path text PRIMARY KEY, lesson_id text NOT NULL, locale text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('workbook','worksheet','cut-list','drawings')),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'), UNIQUE(lesson_id,locale,kind));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['technical_release_control','technical_lesson_content','technical_progress','technical_asset_manifest'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
-- The import script creates the private bucket through the Storage API.

-- Extend the installed command implementations, preserving their wrappers,
-- receipt notifications, offer rules, activation and deletion protections.
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT oid FROM pg_proc WHERE oid IN (
  'billing.commerce_price(text,text,text,uuid)'::regprocedure,
  'billing.commerce_validate_recipient(jsonb)'::regprocedure,
  'billing.commerce_previous_simple_command(text,jsonb)'::regprocedure,
  'public.commerce_command(text,jsonb)'::regprocedure)
 LOOP
  d:=pg_get_functiondef(r.oid);
  d:=replace(d,'''pro'',''pro_plus'',''kids''','''pro'',''pro_plus'',''kids'',''technical''');
  IF r.oid='billing.commerce_price(text,text,text,uuid)'::regprocedure THEN
   d:=replace(d,'pc.plan_key=p_package','pc.plan_key=CASE WHEN p_package=''technical'' THEN ''pro_plus'' ELSE p_package END');
  END IF;
  EXECUTE d;
 END LOOP;
 FOR r IN SELECT conname,conrelid::regclass AS tbl FROM pg_constraint
  WHERE contype='c' AND conrelid IN ('billing.commerce_offers'::regclass,'billing.commerce_orders'::regclass,
  'billing.commerce_invitations'::regclass,'billing.commerce_grants'::regclass,'billing.commerce_entitlements'::regclass)
  AND conname LIKE '%package_check'
 LOOP
  EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.tbl,r.conname);
  EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK(package IN (''pro'',''pro_plus'',''kids'',''technical''))',r.tbl,r.conname);
 END LOOP;
END $$;

CREATE TABLE billing.technical_stripe_prices(
 market_code text NOT NULL CHECK(market_code IN ('EG','INTL')), billing_interval text NOT NULL CHECK(billing_interval IN ('month','year')),
 amount_minor bigint NOT NULL CHECK(amount_minor>0), currency_code text NOT NULL CHECK(currency_code IN ('egp','usd')),
 gateway_product_id text NOT NULL, gateway_price_id text NOT NULL UNIQUE,
 PRIMARY KEY(market_code,billing_interval,amount_minor));
CREATE TABLE billing.technical_stripe_subscriptions(
 user_id uuid NOT NULL, subscription_id text PRIMARY KEY, customer_id text NOT NULL, price_id text NOT NULL,
 status text NOT NULL, last_event_at timestamptz NOT NULL, paid_invoice_id text,
 starts_at timestamptz, ends_at timestamptz, refunded boolean NOT NULL DEFAULT false);
CREATE TABLE billing.technical_stripe_events(event_id text PRIMARY KEY,user_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL DEFAULT '{}');
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['technical_stripe_prices','technical_stripe_subscriptions','technical_stripe_events'] LOOP
  EXECUTE format('ALTER TABLE billing.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON billing.%I FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION public.technical_can_access(p_lesson text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND billing.commerce_account_allowed(auth.uid())
 AND EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled)
 AND EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=p_lesson)
 AND (p_lesson='M01-L01' OR public.has_role(auth.uid(),'admin'::public.app_role)
 OR EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.user_id=auth.uid() AND e.package='technical'
  AND e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
  AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled))
 OR EXISTS(SELECT 1 FROM billing.technical_stripe_subscriptions s WHERE s.user_id=auth.uid()
  AND s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=now() AND s.ends_at>now()));
$$;
REVOKE ALL ON FUNCTION public.technical_can_access(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.technical_can_access(text) TO authenticated;
CREATE FUNCTION public.technical_storage_allowed(p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.technical_asset_manifest a WHERE a.path=p_path AND public.technical_can_access(a.lesson_id));
$$;
REVOKE ALL ON FUNCTION public.technical_storage_allowed(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.technical_storage_allowed(text) TO authenticated;
CREATE POLICY technical_authorized_download ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='technical-downloads' AND public.technical_storage_allowed(name));

CREATE FUNCTION public.technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); c public.technical_lesson_content%ROWTYPE; q jsonb; stripped jsonb; results jsonb:='[]';
 score integer:=0; total integer:=0; selected integer; correct integer; passed boolean; v_drafts jsonb; v_files jsonb;
BEGIN
 PERFORM billing.commerce_assert_identity(u);
 IF NOT EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) THEN RAISE EXCEPTION 'TECHNICAL_UNAVAILABLE'; END IF;
 IF p_action='status' THEN
  RETURN jsonb_build_object('paid',public.technical_can_access('M01-L02'),'stripe',EXISTS(SELECT 1 FROM billing.technical_stripe_subscriptions WHERE user_id=u AND status IN ('active','trialing','past_due','unpaid','paused')),'progress',coalesce((SELECT jsonb_object_agg(lesson_id,
    jsonb_build_object('read',read,'quizPassed',quiz_passed,'practiceReviewed',practice_reviewed,'drafts',drafts))
    FROM public.technical_progress WHERE user_id=u),'{}'::jsonb));
 END IF;
 IF p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LOCALE'; END IF;
 SELECT * INTO c FROM public.technical_lesson_content WHERE lesson_id=p_lesson AND locale=p_locale;
 IF NOT FOUND THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LESSON'; END IF;
 IF NOT public.technical_can_access(p_lesson) THEN RETURN jsonb_build_object('allowed',false); END IF;
 IF octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_INPUT'; END IF;
 IF p_action='lesson' THEN
  stripped:=c.payload;
   stripped:=jsonb_set(stripped,'{quiz}',coalesce((SELECT jsonb_agg(x-'correct'-'explanation') FROM jsonb_array_elements(c.payload->'quiz') x),'[]'));
  SELECT jsonb_agg(jsonb_build_object('kind',kind,'path',path)) INTO v_files FROM public.technical_asset_manifest WHERE lesson_id=p_lesson AND locale=p_locale;
  RETURN jsonb_build_object('allowed',true,'kind',c.kind,'lesson',stripped,'files',coalesce(v_files,'[]'),
   'video',format('https://iframe.mediadelivery.net/embed/670679/%s?autoplay=false&preload=true',c.video_guid));
 END IF;
 INSERT INTO public.technical_progress(user_id,lesson_id) VALUES(u,p_lesson) ON CONFLICT DO NOTHING;
 IF p_action='read' THEN
  UPDATE public.technical_progress SET read=true,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='reset_quiz' THEN
  UPDATE public.technical_progress SET quiz_passed=false,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='reset_practice' THEN
  UPDATE public.technical_progress SET practice_reviewed=false,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='quiz' THEN
  FOR q IN SELECT value FROM jsonb_array_elements(c.payload->'quiz') LOOP
   total:=total+1;
   IF jsonb_typeof(p_data->'answers'->(q->>'id')) IS DISTINCT FROM 'number'
    OR (p_data->'answers'->>(q->>'id')) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'TECHNICAL_INCOMPLETE_QUIZ'; END IF;
   selected:=(p_data->'answers'->>(q->>'id'))::integer;
   IF selected NOT BETWEEN 0 AND jsonb_array_length(q->'options')-1 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ANSWER'; END IF;
   correct:=CASE WHEN c.kind='cabinet' THEN CASE q->>'id' WHEN 'width' THEN 1 WHEN 'depth' THEN 2 WHEN 'quantity' THEN 0 WHEN 'release' THEN 1 END ELSE (q->>'correct')::integer END;
   IF correct IS NULL THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ASSESSMENT'; END IF;
   IF selected=correct THEN score:=score+1; END IF;
   results:=results||jsonb_build_array(jsonb_build_object('id',q->>'id','correct',selected=correct,'explanation',q->>'explanation'));
  END LOOP;
  IF total=0 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ASSESSMENT'; END IF;
  passed:=score=total;
  UPDATE public.technical_progress SET quiz_passed=passed,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
  RETURN jsonb_build_object('allowed',true,'score',score,'total',total,'passed',passed,'feedback',results);
 ELSIF p_action='practice' THEN
  IF c.kind='cabinet' THEN
   v_drafts:=p_data->'values';
   IF jsonb_typeof(v_drafts) IS DISTINCT FROM 'object' OR v_drafts-ARRAY['innerWidth','bodyDepth','opening']::text[] <> '{}' THEN RAISE EXCEPTION 'TECHNICAL_INVALID_PRACTICE'; END IF;
   passed:=coalesce(v_drafts->>'innerWidth','') ~ '^[0-9]+(\.[0-9]+)?$' AND coalesce(v_drafts->>'bodyDepth','') ~ '^[0-9]+(\.[0-9]+)?$' AND coalesce(v_drafts->>'opening','') ~ '^[0-9]+(\.[0-9]+)?$';
   IF passed THEN passed:=abs((v_drafts->>'innerWidth')::numeric-764)<=0.01 AND abs((v_drafts->>'bodyDepth')::numeric-344)<=0.01 AND abs((v_drafts->>'opening')::numeric-323)<=0.01; END IF;
  ELSE
   v_drafts:=p_data->'values';
   IF jsonb_typeof(v_drafts) IS DISTINCT FROM 'array' OR jsonb_array_length(v_drafts)<>jsonb_array_length(c.payload->'assignment'->'fields')
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(v_drafts) x WHERE jsonb_typeof(x)<>'string' OR length(x#>>'{}')>20000) THEN RAISE EXCEPTION 'TECHNICAL_INVALID_PRACTICE'; END IF;
   passed:=NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(v_drafts) x WHERE length(btrim(x))=0)
    AND p_data->'criteria'=to_jsonb(ARRAY[true,true,true]);
  END IF;
  UPDATE public.technical_progress SET drafts=jsonb_set(drafts,ARRAY[p_locale],v_drafts),practice_reviewed=passed,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
  RETURN jsonb_build_object('allowed',true,'passed',passed);
 ELSE RAISE EXCEPTION 'TECHNICAL_INVALID_ACTION'; END IF;
 RETURN jsonb_build_object('allowed',true);
END $$;
REVOKE ALL ON FUNCTION public.technical_command(text,text,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.technical_command(text,text,text,jsonb) TO authenticated;

-- Classify these owned records in the installed erasure inventories.
DO $$ DECLARE r record; d text; BEGIN
 FOR r IN SELECT oid FROM pg_proc WHERE pronamespace='public'::regnamespace
 AND proname IN ('commerce_previous_lc09_advance_deletion','commerce_previous_lc09_complete_financial_purge') LOOP
  d:=pg_get_functiondef(r.oid);
  IF position('advance_deletion' in d)>0 THEN
   d:=replace(d,'''user_subscriptions'',''account_welcome_outbox'',''subscription_mail_outbox''','''user_subscriptions'',''account_welcome_outbox'',''subscription_mail_outbox'',''technical_progress'',''technical_mail_outbox''');
  ELSE
   d:=replace(d,'''account_deletion_requests'',''account_deletion_lifecycle''','''account_deletion_requests'',''account_deletion_lifecycle'',''technical_stripe_subscriptions'',''technical_stripe_events''');
  END IF;
  EXECUTE d;
 END LOOP;
END $$;
CREATE TRIGGER lc09_technical_write BEFORE INSERT OR UPDATE ON public.technical_progress FOR EACH ROW EXECUTE FUNCTION billing.lc09_block_learner_write();
-- Preserve the installed 15-day financial erasure and all existing LC09 guards.
DO $$ BEGIN
 EXECUTE replace(pg_get_functiondef('public.lc09_advance_deletion(uuid,uuid,text)'::regprocedure),'FUNCTION public.lc09_advance_deletion(','FUNCTION billing.technical_previous_deletion(');
 EXECUTE replace(pg_get_functiondef('public.lc09_complete_financial_purge(uuid,uuid,boolean)'::regprocedure),'FUNCTION public.lc09_complete_financial_purge(','FUNCTION billing.technical_previous_financial_purge(');
END $$;
REVOKE ALL ON FUNCTION billing.technical_previous_deletion(uuid,uuid,text),billing.technical_previous_financial_purge(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE r jsonb; BEGIN
 r:=billing.technical_previous_deletion(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN DELETE FROM public.technical_progress WHERE user_id=p_user_id; END IF;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.lc09_complete_financial_purge(p_user_id uuid,p_lease_token uuid,p_release boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE r jsonb; BEGIN
 r:=billing.technical_previous_financial_purge(p_user_id,p_lease_token,p_release);
 IF NOT p_release THEN DELETE FROM billing.technical_stripe_subscriptions WHERE user_id=p_user_id; DELETE FROM billing.technical_stripe_events WHERE user_id=p_user_id; END IF;
 RETURN r;
END $$;
COMMIT;
