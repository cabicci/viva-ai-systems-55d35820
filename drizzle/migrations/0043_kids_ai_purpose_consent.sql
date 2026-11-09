-- M08: isolated reviewed consent/question/erasure implementation.
-- No real policy notice is seeded. Not releasable until app/UI and remaining gates pass.
-- Source: consent-engine.sql
-- M08 isolated implementation candidate. No notice/policy row is seeded.
-- This is not integrated into the application or an approved publication.
--> statement-breakpoint
CREATE TABLE public.kids_ai_consent_notices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 country_code text NOT NULL REFERENCES public.kids_market_release(country_code),
 version text NOT NULL CHECK (length(btrim(version)) BETWEEN 1 AND 80),
 texts jsonb NOT NULL,
 text_hashes jsonb NOT NULL DEFAULT '{}',
 review_reference text,
 enabled boolean NOT NULL DEFAULT false,
 published_at timestamptz,
 CHECK (NOT enabled OR (nullif(btrim(review_reference),'') IS NOT NULL AND published_at IS NOT NULL)),
 UNIQUE(country_code,version)
);
--> statement-breakpoint
CREATE UNIQUE INDEX kids_ai_one_enabled_notice ON public.kids_ai_consent_notices(country_code) WHERE enabled;

--> statement-breakpoint
CREATE FUNCTION billing.kids_ai_notice_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE locale text; hashes jsonb := '{}';
BEGIN
 IF TG_OP='UPDATE' THEN
  IF (to_jsonb(NEW)-'enabled'-'published_at') IS DISTINCT FROM (to_jsonb(OLD)-'enabled'-'published_at')
   OR (OLD.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM OLD.published_at)
  THEN RAISE EXCEPTION 'KIDS_AI_NOTICE_IMMUTABLE'; END IF;
  RETURN NEW;
 END IF;
 IF jsonb_typeof(NEW.texts) IS DISTINCT FROM 'object'
  OR (SELECT count(*) FROM jsonb_object_keys(NEW.texts))<>4
 THEN RAISE EXCEPTION 'KIDS_AI_NOTICE_LOCALES_REQUIRED'; END IF;
 FOREACH locale IN ARRAY ARRAY['ar-EG','ar-MSA','ar-Gulf','en'] LOOP
  IF jsonb_typeof(NEW.texts->locale) IS DISTINCT FROM 'string' OR nullif(btrim(NEW.texts->>locale),'') IS NULL
   OR octet_length(NEW.texts->>locale)>80000 THEN RAISE EXCEPTION 'KIDS_AI_NOTICE_LOCALES_REQUIRED'; END IF;
  hashes:=hashes||jsonb_build_object(locale,encode(sha256(convert_to(NEW.texts->>locale,'UTF8')),'hex'));
 END LOOP;
 NEW.text_hashes:=hashes;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER kids_ai_notice_immutable BEFORE INSERT OR UPDATE ON public.kids_ai_consent_notices
FOR EACH ROW EXECUTE FUNCTION billing.kids_ai_notice_immutable();
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.kids_ai_notice_immutable() FROM PUBLIC,anon,authenticated,service_role;

--> statement-breakpoint
CREATE TABLE public.kids_ai_consent_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sequence bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
 parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 profile_id uuid NOT NULL REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
 notice_id uuid NOT NULL REFERENCES public.kids_ai_consent_notices(id),
 locale text NOT NULL CHECK (locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 text_hash text NOT NULL CHECK (text_hash ~ '^[a-f0-9]{64}$'),
 action text NOT NULL CHECK (action IN ('accept','withdraw')),
 request_id uuid NOT NULL,
 target_event_id uuid REFERENCES public.kids_ai_consent_events(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK ((action='accept' AND target_event_id IS NULL) OR (action='withdraw' AND target_event_id IS NOT NULL)),
 UNIQUE(parent_id,request_id)
);
--> statement-breakpoint
CREATE INDEX kids_ai_consent_latest ON public.kids_ai_consent_events(profile_id,sequence DESC);
--> statement-breakpoint
ALTER TABLE public.kids_ai_consent_notices ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.kids_ai_consent_events ENABLE ROW LEVEL SECURITY;
-- Authenticated callers use the owner-scoped functions; no direct event writer.
--> statement-breakpoint
REVOKE ALL ON public.kids_ai_consent_notices,public.kids_ai_consent_events FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
REVOKE ALL ON SEQUENCE public.kids_ai_consent_events_sequence_seq FROM PUBLIC,anon,authenticated,service_role;

--> statement-breakpoint
CREATE FUNCTION billing.kids_ai_consent_state(p_parent uuid,p_profile uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE profile public.kids_profiles%ROWTYPE; event public.kids_ai_consent_events%ROWTYPE;
 notice public.kids_ai_consent_notices%ROWTYPE; country text; eligible boolean;
BEGIN
 IF p_parent IS NULL OR p_profile IS NULL THEN RAISE EXCEPTION 'KIDS_AI_PROFILE_UNAVAILABLE'; END IF;
 PERFORM billing.commercial_lock(p_parent);
 -- A concurrent profile deletion must serialize before authorization completes.
 SELECT * INTO profile FROM public.kids_profiles WHERE id=p_profile AND parent_id=p_parent FOR SHARE;
 IF NOT FOUND OR billing.account_deletion_blocked(p_parent) THEN RAISE EXCEPTION 'KIDS_AI_PROFILE_UNAVAILABLE'; END IF;
 SELECT country_code INTO country FROM public.kids_parent_access_requests WHERE parent_id=p_parent;
 SELECT * INTO notice FROM public.kids_ai_consent_notices WHERE country_code=country AND enabled;
 SELECT * INTO event FROM public.kids_ai_consent_events WHERE profile_id=p_profile AND parent_id=p_parent ORDER BY sequence DESC LIMIT 1;
 eligible:=curriculum_private.child_allowed(p_parent,p_profile);
 RETURN jsonb_build_object(
  'profile_id',profile.id,'current_event_id',event.id,
  'event',CASE WHEN event.id IS NULL THEN NULL ELSE jsonb_build_object('id',event.id,'action',event.action,
   'notice_id',event.notice_id,'locale',event.locale,'text_hash',event.text_hash,'created_at',event.created_at) END,
  'accepted_notice',CASE WHEN event.id IS NULL THEN NULL ELSE (
   SELECT jsonb_build_object('id',n.id,'version',n.version,'text',n.texts->>event.locale,'text_hash',n.text_hashes->>event.locale)
   FROM public.kids_ai_consent_notices n WHERE n.id=event.notice_id) END,
  'notice',CASE WHEN notice.id IS NULL THEN NULL ELSE jsonb_build_object('id',notice.id,'version',notice.version,
   'texts',notice.texts,'text_hashes',notice.text_hashes,'country_code',notice.country_code) END,
  'eligible',coalesce(eligible,false),
  'allowed',coalesce(eligible AND event.action='accept' AND event.notice_id=notice.id,false));
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.kids_ai_consent_state(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

--> statement-breakpoint
CREATE FUNCTION public.kids_ai_consent_state(p_profile uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'KIDS_AI_AUTH_REQUIRED'; END IF;
 RETURN billing.kids_ai_consent_state(auth.uid(),p_profile);
END $$;

--> statement-breakpoint
CREATE FUNCTION public.kids_parent_accept_ai_consent(p_profile uuid,p_notice uuid,p_locale text,p_hash text,
 p_request_id uuid,p_accepted boolean,p_expected_event_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); state jsonb; notice jsonb; prior public.kids_ai_consent_events%ROWTYPE; event uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'KIDS_AI_AUTH_REQUIRED'; END IF;
 state:=billing.kids_ai_consent_state(actor,p_profile);
 IF p_request_id IS NULL OR p_accepted IS DISTINCT FROM true THEN RAISE EXCEPTION 'KIDS_AI_EXPLICIT_ACCEPTANCE_REQUIRED'; END IF;
 SELECT * INTO prior FROM public.kids_ai_consent_events WHERE parent_id=actor AND request_id=p_request_id;
 IF FOUND THEN
  IF prior.action<>'accept' OR prior.profile_id<>p_profile OR prior.notice_id IS DISTINCT FROM p_notice
   OR prior.locale IS DISTINCT FROM p_locale OR prior.text_hash IS DISTINCT FROM p_hash
  THEN RAISE EXCEPTION 'KIDS_AI_REQUEST_CONFLICT'; END IF;
  -- A historical retry reports the receipt and current state; never reactivates it.
  RETURN state||jsonb_build_object('recorded_event_id',prior.id,'replay',true);
 END IF;
 IF (state->>'current_event_id')::uuid IS DISTINCT FROM p_expected_event_id THEN RAISE EXCEPTION 'KIDS_AI_STATE_CHANGED'; END IF;
 notice:=state->'notice';
 IF state->>'eligible' IS DISTINCT FROM 'true' OR notice->>'id' IS DISTINCT FROM p_notice::text
  OR p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
  OR (notice->'text_hashes'->>p_locale) IS DISTINCT FROM p_hash OR p_hash IS NULL
 THEN RAISE EXCEPTION 'KIDS_AI_CURRENT_NOTICE_REQUIRED'; END IF;
 INSERT INTO public.kids_ai_consent_events(parent_id,profile_id,notice_id,locale,text_hash,action,request_id)
 VALUES(actor,p_profile,p_notice,p_locale,p_hash,'accept',p_request_id) RETURNING id INTO event;
 RETURN billing.kids_ai_consent_state(actor,p_profile)||jsonb_build_object('recorded_event_id',event,'replay',false);
END $$;

--> statement-breakpoint
CREATE FUNCTION public.kids_parent_withdraw_ai_consent(p_profile uuid,p_expected_event_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); state jsonb; prior public.kids_ai_consent_events%ROWTYPE;
 accepted public.kids_ai_consent_events%ROWTYPE; event uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'KIDS_AI_AUTH_REQUIRED'; END IF;
 state:=billing.kids_ai_consent_state(actor,p_profile);
 IF p_request_id IS NULL THEN RAISE EXCEPTION 'KIDS_AI_REQUEST_REQUIRED'; END IF;
 SELECT * INTO prior FROM public.kids_ai_consent_events WHERE parent_id=actor AND request_id=p_request_id;
 IF FOUND THEN
  IF prior.action<>'withdraw' OR prior.profile_id<>p_profile OR prior.target_event_id IS DISTINCT FROM p_expected_event_id
  THEN RAISE EXCEPTION 'KIDS_AI_REQUEST_CONFLICT'; END IF;
  RETURN state||jsonb_build_object('recorded_event_id',prior.id,'replay',true);
 END IF;
 IF (state->>'current_event_id')::uuid IS DISTINCT FROM p_expected_event_id THEN RAISE EXCEPTION 'KIDS_AI_STATE_CHANGED'; END IF;
 IF state->'event'->>'action' IS DISTINCT FROM 'accept' THEN RETURN state||jsonb_build_object('unchanged',true); END IF;
 -- Withdrawal does not depend on a paid subscription, enabled notice or current lesson eligibility.
 SELECT * INTO accepted FROM public.kids_ai_consent_events WHERE id=p_expected_event_id AND parent_id=actor AND profile_id=p_profile;
 INSERT INTO public.kids_ai_consent_events(parent_id,profile_id,notice_id,locale,text_hash,action,request_id,target_event_id)
 VALUES(actor,p_profile,accepted.notice_id,accepted.locale,accepted.text_hash,'withdraw',p_request_id,accepted.id) RETURNING id INTO event;
 RETURN billing.kids_ai_consent_state(actor,p_profile)||jsonb_build_object('recorded_event_id',event,'replay',false);
END $$;

--> statement-breakpoint
CREATE FUNCTION public.kids_ai_consent_context(p_user uuid,p_profile uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb;
BEGIN
 PERFORM billing.commercial_require_service();
 -- Existing adult preview remains separate; actual child checks still compose content access elsewhere.
 IF p_profile=p_user AND billing.commercial_admin(p_user) THEN
  IF NOT billing.commercial_account_allowed(p_user) THEN RAISE EXCEPTION 'KIDS_AI_PROFILE_UNAVAILABLE'; END IF;
  RETURN jsonb_build_object('allowed',true,'mode','adult_preview','event_id',NULL,'notice_id',NULL);
 END IF;
 state:=billing.kids_ai_consent_state(p_user,p_profile);
 RETURN jsonb_build_object('allowed',state->'allowed','mode','child','event_id',state->>'current_event_id',
  'notice_id',state->'event'->>'notice_id');
END $$;

--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_ai_consent_state(uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_parent_accept_ai_consent(uuid,uuid,text,text,uuid,boolean,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_parent_withdraw_ai_consent(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_ai_consent_context(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_ai_consent_state(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_parent_accept_ai_consent(uuid,uuid,text,text,uuid,boolean,uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_parent_withdraw_ai_consent(uuid,uuid,uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_ai_consent_context(uuid,uuid) TO service_role;
-- Erasure inventory, metering binding and application UI are mandatory before integration.

-- Source: consent-metering.sql
-- Proposed actual extension of the existing ledger, never a parallel question ledger.
-- Apply only after consent-engine.sql; no notice row or deployment is authorized.
--> statement-breakpoint
ALTER TABLE public.kids_ai_consent_events ADD CONSTRAINT kids_ai_event_notice_identity UNIQUE(id,notice_id);
--> statement-breakpoint
ALTER TABLE billing.assistant_requests
 ADD COLUMN ai_consent_event_id uuid,
 ADD COLUMN ai_consent_notice_id uuid,
 ADD CONSTRAINT assistant_question_ai_grant FOREIGN KEY(ai_consent_event_id,ai_consent_notice_id)
  REFERENCES public.kids_ai_consent_events(id,notice_id) ON DELETE SET NULL,
 ADD CONSTRAINT assistant_question_ai_grant_pair CHECK ((ai_consent_event_id IS NULL)=(ai_consent_notice_id IS NULL));

--> statement-breakpoint
CREATE FUNCTION billing.kids_ai_question_context(p_user uuid,p_profile uuid,p_request uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE context jsonb; request billing.assistant_requests%ROWTYPE;
BEGIN
 -- The existing commercial lock order is shared with accept/withdraw/deletion.
 PERFORM billing.commercial_lock(p_user);
 BEGIN context:=public.kids_ai_consent_context(p_user,p_profile);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='KIDS_AI_PROFILE_UNAVAILABLE' THEN RAISE EXCEPTION 'ASSISTANT_AI_CONSENT_REQUIRED'; END IF;
  RAISE;
 END;
 IF context->>'allowed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'ASSISTANT_AI_CONSENT_REQUIRED'; END IF;
 IF p_request IS NOT NULL THEN
  SELECT * INTO request FROM billing.assistant_requests WHERE user_id=p_user AND request_id=p_request;
  IF NOT FOUND OR request.area<>'kids' OR request.child_id IS DISTINCT FROM p_profile
   OR request.ai_consent_event_id IS DISTINCT FROM (context->>'event_id')::uuid
   OR request.ai_consent_notice_id IS DISTINCT FROM (context->>'notice_id')::uuid
  THEN RAISE EXCEPTION 'ASSISTANT_AI_CONSENT_CHANGED'; END IF;
 END IF;
 RETURN context;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.kids_ai_question_context(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

-- Existing SECURITY DEFINER routines can have a different owner from the
-- migration role. Grant only those exact trusted owners access to this private
-- helper, never an API caller role; otherwise the real native call fails.
--> statement-breakpoint
DO $existing_definer_owners$
DECLARE owner_name text;
BEGIN
 FOR owner_name IN SELECT DISTINCT pg_get_userbyid(proowner) FROM pg_proc WHERE oid IN (
  'public.reserve_assistant_question(uuid,text,text,text,text,uuid,uuid,text)'::regprocedure,
  'public.assistant_question_provider_attempt(uuid,uuid,text,text,uuid,text)'::regprocedure,
  'public.settle_assistant_question(uuid,uuid,text,text,jsonb)'::regprocedure)
 LOOP
  IF owner_name IN ('anon','authenticated','service_role') THEN RAISE EXCEPTION 'M08_UNEXPECTED_DEFINER_OWNER'; END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION billing.kids_ai_question_context(uuid,uuid,uuid) TO %I',owner_name);
 END LOOP;
END $existing_definer_owners$;

-- Exact anchors fail closed if the underlying, previously reviewed contract changed.
--> statement-breakpoint
DO $bind_native_question$
DECLARE body text; old text; replacement text; function_name text; anchor text;
BEGIN
 body:=pg_get_functiondef('public.reserve_assistant_question(uuid,text,text,text,text,uuid,uuid,text)'::regprocedure);
 old:='DECLARE r billing.assistant_requests%ROWTYPE;';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_RESERVE_DECLARE_ANCHOR'; END IF;
 body:=replace(body,old,'DECLARE v_ai_context jsonb; r billing.assistant_requests%ROWTYPE;');
 old:=' PERFORM billing.assistant_expire_requests(p_user_id);';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_RESERVE_GUARD_ANCHOR'; END IF;
 body:=replace(body,old,E' IF p_area=\'kids\' THEN v_ai_context:=billing.kids_ai_question_context(p_user_id,p_child_id); END IF;\n'||old);
 old:='  RETURN jsonb_build_object(''reservation_id'',r.id,''allowed'',false,''replay'',r.state=''settled'',';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_RESERVE_REPLAY_ANCHOR'; END IF;
 body:=replace(body,old,E'  IF p_area=\'kids\' THEN PERFORM billing.kids_ai_question_context(p_user_id,p_child_id,p_request_id); END IF;\n'||old);
 old:='INSERT INTO billing.assistant_requests(user_id,request_id,fingerprint,area,course,lesson,locale,child_id,wallet_scope,allowance_id,funding)';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_RESERVE_COLUMNS_ANCHOR'; END IF;
 body:=replace(body,old,'INSERT INTO billing.assistant_requests(user_id,request_id,fingerprint,area,course,lesson,locale,child_id,wallet_scope,allowance_id,funding,ai_consent_event_id,ai_consent_notice_id)');
 old:='VALUES(p_user_id,p_request_id,p_fingerprint,p_area,p_course,coalesce(p_lesson,''__course__''),p_locale,p_child_id,scope,period.id,v_funding) RETURNING * INTO r;';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_RESERVE_VALUES_ANCHOR'; END IF;
 body:=replace(body,old,'VALUES(p_user_id,p_request_id,p_fingerprint,p_area,p_course,coalesce(p_lesson,''__course__''),p_locale,p_child_id,scope,period.id,v_funding,(v_ai_context->>''event_id'')::uuid,(v_ai_context->>''notice_id'')::uuid) RETURNING * INTO r;');
 EXECUTE body;

 body:=pg_get_functiondef('public.assistant_question_provider_attempt(uuid,uuid,text,text,uuid,text)'::regprocedure);
 old:=' IF p_model IS NULL OR length(p_model)>100';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_ATTEMPT_ANCHOR'; END IF;
 body:=replace(body,old,E' IF r.area=\'kids\' AND p_status=\'started\' THEN PERFORM billing.kids_ai_question_context(p_user_id,r.child_id,p_request_id); END IF;\n'||old);
 -- Existing terminal attempt recording is deliberately not contingent on current AI consent.
 EXECUTE body;

 body:=pg_get_functiondef('public.settle_assistant_question(uuid,uuid,text,text,jsonb)'::regprocedure);
 old:=' IF r.state=''settled'' THEN';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_SETTLE_REPLAY_ANCHOR'; END IF;
 body:=replace(body,old,old||E'\n  IF r.area=\'kids\' THEN PERFORM billing.kids_ai_question_context(p_user_id,r.child_id,p_request_id); END IF;');
 old:=' IF r.funding=''review'' AND p_outcome<>''system_failure''';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_SETTLE_GRANT_ANCHOR'; END IF;
 body:=replace(body,old,E' IF r.area=\'kids\' AND p_outcome<>\'system_failure\' THEN PERFORM billing.kids_ai_question_context(p_user_id,r.child_id,p_request_id); END IF;\n'||old);
 EXECUTE body;
END $bind_native_question$;

--> statement-breakpoint
CREATE FUNCTION public.assistant_question_delivery(p_user_id uuid,p_request_id uuid,p_fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request billing.assistant_requests%ROWTYPE;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user_id);
 SELECT * INTO request FROM billing.assistant_requests WHERE user_id=p_user_id AND request_id=p_request_id;
 IF NOT FOUND OR request.fingerprint IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_CONFLICT'; END IF;
 IF request.state<>'settled' OR request.response IS NULL THEN RAISE EXCEPTION 'ASSISTANT_REQUEST_EXPIRED'; END IF;
 IF request.area='kids' THEN PERFORM billing.kids_ai_question_context(p_user_id,request.child_id,p_request_id); END IF;
 IF NOT billing.assistant_content_allowed(p_user_id,request.area,request.course,request.lesson,request.locale,request.child_id)
 THEN RAISE EXCEPTION 'ASSISTANT_ACCESS_DENIED'; END IF;
 RETURN jsonb_build_object('status','settled','response',request.response,'charged_units',request.charged_units,
  'balance',billing.assistant_balance(p_user_id,request.area,request.course,request.child_id));
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.assistant_question_delivery(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.assistant_question_delivery(uuid,uuid,text) TO service_role;

-- Existing general-consent withdrawal shares the same short authorization order.
--> statement-breakpoint
DO $order_general_withdrawal$
DECLARE body text; old constant text:='  UPDATE public.kids_profile_consents SET withdrawn_at=coalesce(withdrawn_at,now())';
BEGIN
 body:=pg_get_functiondef('public.kids_parent_withdraw_consent(uuid)'::regprocedure);
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_GENERAL_WITHDRAWAL_ANCHOR'; END IF;
 body:=replace(body,old,E'  PERFORM billing.commercial_lock(auth.uid());\n'||old);
 EXECUTE body;
END $order_general_withdrawal$;

-- Source: assistant-access-erasure.sql
-- Compose AI purpose checks at assistant-only boundaries. General lesson,
-- authored-help and personal-history predicates are deliberately unchanged.
--> statement-breakpoint
CREATE FUNCTION billing.kids_ai_child_allowed(p_user uuid,p_profile uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb;
BEGIN
 BEGIN state:=billing.kids_ai_consent_state(p_user,p_profile);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='KIDS_AI_PROFILE_UNAVAILABLE' THEN RETURN false; END IF;
  RAISE;
 END;
 RETURN coalesce((state->>'allowed')::boolean,false);
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.kids_ai_child_allowed(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
DO $assistant_definers$
DECLARE owner_name text;
BEGIN
 FOR owner_name IN SELECT DISTINCT pg_get_userbyid(proowner) FROM pg_proc WHERE oid IN (
  'public.card_assistant_access(text,text,text,text,uuid)'::regprocedure,
  'public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text)'::regprocedure)
 LOOP
  IF owner_name IN ('anon','authenticated','service_role') THEN RAISE EXCEPTION 'M08_UNEXPECTED_ASSISTANT_OWNER'; END IF;
  EXECUTE format('GRANT EXECUTE ON FUNCTION billing.kids_ai_child_allowed(uuid,uuid) TO %I',owner_name);
  EXECUTE format('GRANT EXECUTE ON FUNCTION billing.kids_ai_question_context(uuid,uuid,uuid) TO %I',owner_name);
 END LOOP;
END $assistant_definers$;

--> statement-breakpoint
DO $assistant_purpose_guards$
DECLARE body text; old text;
BEGIN
 body:=pg_get_functiondef('public.card_assistant_access(text,text,text,text,uuid)'::regprocedure);
 old:=E' IF p_area=\'kids\' THEN\n  RETURN p_profile IS NOT NULL';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_CARD_ACCESS_ANCHOR'; END IF;
 body:=replace(body,old,E' IF p_area=\'kids\' THEN\n  IF p_profile IS NULL OR NOT billing.kids_ai_child_allowed(auth.uid(),p_profile) THEN RETURN false; END IF;\n  RETURN p_profile IS NOT NULL');
 EXECUTE body;
 -- The helper takes short authorization locks, so the wrapper is not STABLE.
 ALTER FUNCTION public.card_assistant_access(text,text,text,text,uuid) VOLATILE;
 body:=pg_get_functiondef('public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text)'::regprocedure);
 old:=' PERFORM billing.commercial_require_service();';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_CURRICULUM_SOURCE_ANCHOR'; END IF;
 body:=replace(body,old,old||E'\n IF p_area=\'kids\' THEN PERFORM billing.kids_ai_question_context(p_user,p_child); END IF;');
 EXECUTE body;
END $assistant_purpose_guards$;

-- The actual erasure inventory fails closed for unclassified Kids UUID tables.
-- Classify only this concrete new table, delete its subject rows explicitly,
-- and add the same table to the existing completion proof. Keep all financial
-- and unknown-table guards, ownership and retention rules otherwise intact.
--> statement-breakpoint
DO $consent_erasure_inventory$
DECLARE body text; old text;
BEGIN
 body:=pg_get_functiondef('public.commerce_previous_lc09_advance_deletion(uuid,uuid,text)'::regprocedure);
 old:='''kids_profiles'',''kids_lesson_progress'',''kids_profile_consents'',''kids_family_entitlements'',';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_ERASURE_CLASSIFICATION_ANCHOR'; END IF;
 body:=replace(body,old,'''kids_ai_consent_events'','||old);
 old:='    DELETE FROM public.kids_profile_consents WHERE parent_id=p_user_id;';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_ERASURE_DELETE_ANCHOR'; END IF;
 body:=replace(body,old,E'    DELETE FROM public.kids_ai_consent_events WHERE parent_id=p_user_id;\n'||old);
 old:='    IF EXISTS(SELECT 1 FROM public.kids_profiles WHERE parent_id=p_user_id)';
 IF (length(body)-length(replace(body,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'M08_ERASURE_PROOF_ANCHOR'; END IF;
 body:=replace(body,old,E'    IF EXISTS(SELECT 1 FROM public.kids_ai_consent_events WHERE parent_id=p_user_id)\n      OR EXISTS(SELECT 1 FROM public.kids_profiles WHERE parent_id=p_user_id)');
 EXECUTE body;
END $consent_erasure_inventory$;

-- Parent-only profile/history read endpoints.
-- Owner-only metadata/history reads; no AI processing or acceptance side effect.
--> statement-breakpoint
CREATE FUNCTION public.kids_ai_consent_profiles(p_after uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'KIDS_AI_AUTH_REQUIRED'; END IF;
 IF billing.account_deletion_blocked(actor) THEN RAISE EXCEPTION 'KIDS_AI_PROFILE_UNAVAILABLE'; END IF;
 WITH page AS (
  SELECT id,display_name FROM public.kids_profiles WHERE parent_id=actor AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT 51
 ), shown AS (SELECT * FROM page ORDER BY id LIMIT 50)
 SELECT jsonb_build_object('profiles',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'display_name',display_name) ORDER BY id) FROM shown),'[]'),
  'next_cursor',CASE WHEN (SELECT count(*) FROM page)>50 THEN (SELECT id::text FROM shown ORDER BY id DESC LIMIT 1) ELSE NULL END) INTO result;
 RETURN result;
END $$;

--> statement-breakpoint
CREATE FUNCTION public.kids_ai_consent_history(p_profile uuid,p_before bigint DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); result jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'KIDS_AI_AUTH_REQUIRED'; END IF;
 PERFORM billing.commercial_lock(actor);
 PERFORM 1 FROM public.kids_profiles WHERE id=p_profile AND parent_id=actor FOR SHARE;
 IF NOT FOUND OR billing.account_deletion_blocked(actor) THEN RAISE EXCEPTION 'KIDS_AI_PROFILE_UNAVAILABLE'; END IF;
 WITH page AS (
  SELECT * FROM public.kids_ai_consent_events WHERE parent_id=actor AND profile_id=p_profile
   AND (p_before IS NULL OR sequence<p_before) ORDER BY sequence DESC LIMIT 11
 ), shown AS (SELECT * FROM page ORDER BY sequence DESC LIMIT 10)
 SELECT jsonb_build_object('profile_id',p_profile,'items',coalesce((
  SELECT jsonb_agg(jsonb_build_object('id',e.id,'sequence',e.sequence::text,'action',e.action,
   'notice_id',e.notice_id,'locale',e.locale,'text_hash',e.text_hash,'created_at',e.created_at,'target_event_id',e.target_event_id,
   'version',n.version,'text',n.texts->>e.locale) ORDER BY e.sequence DESC)
  FROM shown e JOIN public.kids_ai_consent_notices n ON n.id=e.notice_id),'[]'),
  'next_cursor',CASE WHEN (SELECT count(*) FROM page)>10 THEN (SELECT min(sequence)::text FROM shown) ELSE NULL END) INTO result;
 RETURN result;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_ai_consent_profiles(uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.kids_ai_consent_history(uuid,bigint) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_ai_consent_profiles(uuid) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.kids_ai_consent_history(uuid,bigint) TO authenticated;
