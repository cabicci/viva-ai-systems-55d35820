-- Campaign limits are independent of paid credit and reuse the question ledger.
ALTER TABLE billing.free_access_windows
 ADD COLUMN assistant_questions integer NOT NULL DEFAULT 0 CHECK (assistant_questions BETWEEN 0 AND 1000),
 ADD COLUMN email_notices boolean NOT NULL DEFAULT false,
 ADD COLUMN mail_approved_at timestamptz;
--> statement-breakpoint

CREATE FUNCTION billing.free_access_mail_approval() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.enabled AND NEW.email_notices THEN
  NEW.mail_approved_at:=coalesce(NEW.mail_approved_at,clock_timestamp());
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.free_access_mail_approval() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER free_access_mail_approval BEFORE INSERT OR UPDATE
 ON billing.free_access_windows FOR EACH ROW EXECUTE FUNCTION billing.free_access_mail_approval();
--> statement-breakpoint

-- Stable campaign keys retain the same spent units after an edit or pause.
CREATE FUNCTION billing.free_access_question_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT 'free-window:'||w.id,w.created_at,w.ends_at,w.assistant_questions,false,NULL::integer
 FROM billing.free_access_windows w
 WHERE w.enabled AND w.assistant_questions>0 AND w.starts_at<=p_at AND p_at<w.ends_at
 AND billing.commercial_account_allowed(p_user)
 AND (CASE p_area
  WHEN 'ai' THEN p_course='ai' AND EXISTS(SELECT 1 FROM unnest(w.targets) t WHERE t='ai' OR t LIKE 'ai:%')
  WHEN 'kids' THEN p_course='kids' AND 'kids'=ANY(w.targets)
    AND EXISTS(SELECT 1 FROM public.kids_profiles k WHERE k.id=p_child AND k.parent_id=p_user)
  WHEN 'academic' THEN w.targets&&ARRAY['academic:'||p_course,'curriculum:academic:'||p_course]
  WHEN 'technical' THEN w.targets&&ARRAY['technical:'||p_course,'curriculum:technical:'||p_course]
  ELSE false END)
$$;
REVOKE ALL ON FUNCTION billing.free_access_question_specs(uuid,text,text,uuid,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

DO $patch$
DECLARE definition text; marker text;
BEGIN
 definition:=replace(pg_get_functiondef('billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)'::regprocedure),chr(13)||chr(10),chr(10));
 marker:='BEGIN'||chr(10)||' IF NOT EXISTS(SELECT 1 FROM curriculum_private.courses';
 IF array_length(string_to_array(definition,marker),1)<>2 OR position('curriculum_private.previous_assistant_source_specs' IN definition)=0
 THEN RAISE EXCEPTION 'FREE_ACCESS_QUESTION_SOURCES_CHANGED'; END IF;
 EXECUTE replace(definition,marker,'BEGIN'||chr(10)||
  ' RETURN QUERY SELECT * FROM billing.free_access_question_specs(p_user,p_area,p_course,p_child,p_at);'||chr(10)||
  ' IF NOT EXISTS(SELECT 1 FROM curriculum_private.courses');

 definition:=pg_get_functiondef('billing.assistant_sync_periods(uuid,text,text,uuid)'::regprocedure);
 marker:='ON CONFLICT(user_id,source_key,starts_at) DO NOTHING RETURNING id INTO inserted;';
 IF array_length(string_to_array(definition,marker),1)<>2 THEN RAISE EXCEPTION 'FREE_ACCESS_QUESTION_CLOCK_CHANGED'; END IF;
 EXECUTE replace(definition,marker,
  'ON CONFLICT(user_id,source_key,starts_at) DO UPDATE SET unit_limit=excluded.unit_limit,ends_at=excluded.ends_at
   WHERE excluded.source_key LIKE ''free-window:%'' AND
    (billing.assistant_allowance_periods.unit_limit,billing.assistant_allowance_periods.ends_at)
     IS DISTINCT FROM (excluded.unit_limit,excluded.ends_at) RETURNING id INTO inserted;');

 definition:=pg_get_functiondef('billing.assistant_source_permits(text,text)'::regprocedure);
 marker:=' IF p_key LIKE ''free:%'' THEN';
 IF array_length(string_to_array(definition,marker),1)<>2 THEN RAISE EXCEPTION 'FREE_ACCESS_QUESTION_SCOPE_CHANGED'; END IF;
 EXECUTE replace(definition,marker,$scope$
 IF p_key LIKE 'free-window:%' THEN
  RETURN EXISTS(SELECT 1 FROM billing.free_access_windows w WHERE w.id=substr(p_key,13)::uuid
   AND w.enabled AND w.starts_at<=now() AND now()<w.ends_at AND w.assistant_questions>0
   AND (p_lesson IS NULL OR p_lesson='__course__'
    OR NOT EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog WHERE lesson_id=p_lesson)
    OR 'ai'=ANY(w.targets)
    OR EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog c
      WHERE c.lesson_id=p_lesson AND ('ai:'||c.path_id)=ANY(w.targets))));
 END IF;
$scope$||marker);

 definition:=pg_get_functiondef('public.reserve_assistant_question(uuid,text,text,text,text,uuid,uuid,text)'::regprocedure);
 marker:='ORDER BY p.ends_at,p.source_key FOR UPDATE OF p LOOP';
 IF array_length(string_to_array(definition,marker),1)<>2 THEN RAISE EXCEPTION 'FREE_ACCESS_QUESTION_RESERVATION_CHANGED'; END IF;
 EXECUTE replace(definition,marker,
  'ORDER BY (p.source_key NOT LIKE ''free-window:%''),p.ends_at,p.source_key FOR UPDATE OF p LOOP');

 definition:=pg_get_functiondef('public.settle_assistant_question(uuid,uuid,text,text,jsonb)'::regprocedure);
 marker:='SELECT source_key INTO source FROM billing.assistant_allowance_periods WHERE id=r.allowance_id;';
 IF array_length(string_to_array(definition,marker),1)<>2 THEN RAISE EXCEPTION 'FREE_ACCESS_QUESTION_SETTLEMENT_CHANGED'; END IF;
 EXECUTE replace(definition,marker,marker||$settle$
   IF source LIKE 'free-window:%' AND NOT EXISTS(
    SELECT 1 FROM billing.free_access_question_specs(p_user_id,r.area,r.course,r.child_id,now()) s
    WHERE s.source_key=source)
   THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_SOURCE_EXPIRED'; END IF;
$settle$);
END $patch$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.free_access_window_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); w billing.free_access_windows%ROWTYPE; old jsonb; params jsonb;
 prior billing.free_access_window_requests%ROWTYPE; v_targets text[]; start_time timestamptz; end_time timestamptz;
 request_key uuid; result jsonb; v_questions integer; v_mail boolean;
BEGIN
 PERFORM billing.commerce_assert_identity(actor);
 IF NOT coalesce(public.has_role(actor,'admin'::public.app_role),false) THEN RAISE EXCEPTION 'FREE_ACCESS_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 IF p_action='list' THEN
  IF p_data<>'{}' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  RETURN jsonb_build_object('server_time',now(),'targets',billing.free_access_targets(),
   'windows',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.starts_at DESC,v.id) FROM (
    SELECT x.id,x.title,x.targets,x.starts_at,x.ends_at,x.enabled,x.version,x.assistant_questions,x.email_notices,
      CASE WHEN NOT x.enabled THEN 'paused' WHEN now()<x.starts_at THEN 'scheduled'
        WHEN now()>=x.ends_at THEN 'expired' ELSE 'active' END AS status
    FROM billing.free_access_windows x) v),'[]'::jsonb),
   'audit',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC) FROM (
      SELECT window_id,action,created_at FROM billing.free_access_window_audit ORDER BY created_at DESC LIMIT 200) a),'[]'::jsonb));
 END IF;
 IF p_action NOT IN ('create','update') OR p_data-ARRAY['id','expected_version','title','targets','starts_at','ends_at','enabled','key','assistant_questions','email_notices']<>'{}'
 OR jsonb_typeof(p_data->'title') IS DISTINCT FROM 'string'
 OR length(btrim(p_data->>'title')) NOT BETWEEN 1 AND 160
 OR jsonb_typeof(p_data->'targets') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_data->'enabled') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_data->'starts_at') IS DISTINCT FROM 'string' OR jsonb_typeof(p_data->'ends_at') IS DISTINCT FROM 'string'
 OR (p_data->>'starts_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (p_data->>'ends_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 IF p_data ? 'assistant_questions' AND (jsonb_typeof(p_data->'assistant_questions') IS DISTINCT FROM 'number'
  OR coalesce(p_data->>'assistant_questions','') !~ '^(0|[1-9][0-9]{0,2}|1000)$')
 OR p_data ? 'email_notices' AND jsonb_typeof(p_data->'email_notices') IS DISTINCT FROM 'boolean'
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 v_questions:=(p_data->>'assistant_questions')::integer;
 v_mail:=(p_data->>'email_notices')::boolean;
 SELECT array_agg(x ORDER BY x) INTO v_targets FROM jsonb_array_elements_text(p_data->'targets') x;
 IF coalesce(cardinality(v_targets),0) NOT BETWEEN 1 AND 100
 OR cardinality(v_targets)<>(SELECT count(DISTINCT x) FROM unnest(v_targets) x)
 OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE t IS NULL OR NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(billing.free_access_targets()) c WHERE c->>'id'=t))
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_TARGET'; END IF;
 BEGIN
  start_time:=(p_data->>'starts_at')::timestamptz;end_time:=(p_data->>'ends_at')::timestamptz;
  request_key:=(p_data->>'key')::uuid;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END;
 IF request_key IS NULL OR start_time IS NULL OR end_time IS NULL OR NOT isfinite(start_time) OR NOT isfinite(end_time) OR start_time>=end_time THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 params:=jsonb_build_object('action',p_action,'data',p_data);
 PERFORM pg_advisory_xact_lock(hashtextextended(request_key::text,837));
 SELECT * INTO prior FROM billing.free_access_window_requests WHERE key=request_key;
 IF FOUND THEN
  IF prior.actor<>actor OR prior.parameters<>params THEN RAISE EXCEPTION 'FREE_ACCESS_RETRY_MISMATCH'; END IF;
  RETURN prior.response;
 END IF;
 IF p_action='create' THEN
  IF p_data ?| ARRAY['id','expected_version'] THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  INSERT INTO billing.free_access_windows(title,targets,starts_at,ends_at,enabled,created_by,assistant_questions,email_notices)
    VALUES(btrim(p_data->>'title'),v_targets,start_time,end_time,(p_data->>'enabled')::boolean,actor,coalesce(v_questions,0),coalesce(v_mail,false)) RETURNING * INTO w;
 ELSE
  IF jsonb_typeof(p_data->'expected_version') IS DISTINCT FROM 'number'
    OR (p_data->>'expected_version') !~ '^[1-9][0-9]{0,8}$' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  SELECT * INTO w FROM billing.free_access_windows WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR w.version<>(p_data->>'expected_version')::integer THEN RAISE EXCEPTION 'FREE_ACCESS_CONFLICT'; END IF;
  old:=to_jsonb(w)-'created_by';
  UPDATE billing.free_access_windows x SET title=btrim(p_data->>'title'),targets=v_targets,starts_at=start_time,ends_at=end_time,
    enabled=(p_data->>'enabled')::boolean,version=x.version+1,updated_at=now(),assistant_questions=coalesce(v_questions,x.assistant_questions),email_notices=coalesce(v_mail,x.email_notices) WHERE x.id=w.id RETURNING x.* INTO w;
 END IF;
 result:=jsonb_build_object('id',w.id,'version',w.version);
 INSERT INTO billing.free_access_window_audit(window_id,actor,action,details)
 VALUES(w.id,actor,p_action,jsonb_build_object('before',old,'after',to_jsonb(w)-'created_by'));
 INSERT INTO billing.free_access_window_requests VALUES(request_key,actor,params,result);
 RETURN result;
END $$;

--> statement-breakpoint
ALTER TABLE billing.commerce_mail_preferences ADD COLUMN campaign_opted_in_at timestamptz;
CREATE TABLE billing.access_notice_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('campaign_start','campaign_signup','campaign_end','coupon','grant')),
 source_id uuid NOT NULL,
 recipient text NOT NULL CHECK(length(recipient) BETWEEN 3 AND 254 AND recipient=lower(btrim(recipient))),
 account_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 created_at timestamptz NOT NULL DEFAULT now(),
 payload jsonb,
 lease uuid,
 lease_until timestamptz,
 authorized boolean NOT NULL DEFAULT false,
 first_attempt_at timestamptz,
 attempts integer NOT NULL DEFAULT 0,
 stopped text CHECK(stopped IN ('failed','suppressed','unknown','expired')),
 provider_id text UNIQUE,
 receipt text,
 receipt_at timestamptz,
 UNIQUE (kind,source_id,recipient)
);
CREATE INDEX access_notice_ready ON billing.access_notice_outbox(created_at,id)
 WHERE provider_id IS NULL AND stopped IS NULL;
CREATE INDEX access_notice_account ON billing.access_notice_outbox(account_id);
CREATE TABLE billing.access_public_coupon_mail (
 offer_id uuid PRIMARY KEY REFERENCES billing.commerce_offers(id),
 approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE billing.access_notice_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.access_public_coupon_mail ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.access_notice_outbox,billing.access_public_coupon_mail FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION billing.access_notice_locale(p_locale text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_locale IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN p_locale ELSE 'ar-EG' END
$$;
REVOKE ALL ON FUNCTION billing.access_notice_locale(text) FROM PUBLIC,anon,authenticated,service_role;

-- A coupon assigned to specific addresses uses the stored commerce audience.
CREATE FUNCTION billing.queue_assigned_coupon_notice() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.enabled AND NEW.delivery_mode='coupon' AND cardinality(NEW.audience_emails)>0 THEN
  INSERT INTO billing.access_notice_outbox(kind,source_id,recipient,account_id,locale)
  SELECT 'coupon',NEW.id,e.email,u.id,billing.access_notice_locale(coalesce(u.raw_user_meta_data->>'preferred_locale',NEW.parameters->>'locale'))
  FROM (SELECT DISTINCT lower(btrim(value)) AS email FROM unnest(NEW.audience_emails) AS value) e
  LEFT JOIN LATERAL (
   SELECT a.id,a.raw_user_meta_data FROM auth.users a
   WHERE lower(btrim(a.email))=e.email AND a.email_confirmed_at IS NOT NULL ORDER BY a.id LIMIT 1
  ) u ON true
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.queue_assigned_coupon_notice() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER queue_assigned_coupon_notice AFTER INSERT OR UPDATE OF delivery_mode
 ON billing.commerce_offers FOR EACH ROW EXECUTE FUNCTION billing.queue_assigned_coupon_notice();

-- Canonical invitations that already request an email retain their original delivery.
-- The new stream covers grants that previously had no notification.
CREATE FUNCTION billing.queue_access_grant_notice() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.parameters->'invitation'='false'::jsonb THEN
  INSERT INTO billing.access_notice_outbox(kind,source_id,recipient,account_id,locale)
  SELECT 'grant',NEW.id,NEW.recipient_email,u.id,
   billing.access_notice_locale(coalesce(u.raw_user_meta_data->>'preferred_locale',NEW.parameters->>'locale'))
  FROM (SELECT 1) source LEFT JOIN LATERAL (
   SELECT a.id,a.raw_user_meta_data FROM auth.users a WHERE lower(btrim(a.email))=NEW.recipient_email
   AND a.email_confirmed_at IS NOT NULL ORDER BY a.id LIMIT 1
  ) u ON true
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION billing.queue_access_grant_notice() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER queue_access_grant_notice AFTER INSERT
 ON billing.email_access_grants FOR EACH ROW EXECUTE FUNCTION billing.queue_access_grant_notice();
--> statement-breakpoint

CREATE FUNCTION billing.access_notice_allowed(p_recipient text,p_marketing boolean,p_opt_in boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.lc09_contact_recipient_active(p_recipient)
 AND NOT EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p WHERE p.email=p_recipient
   AND (p.suppressed OR (p_marketing AND p.marketing_opt_out)))
 AND (NOT p_opt_in OR EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p
   WHERE p.email=p_recipient AND p.campaign_opted_in_at IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM public.contact_acknowledgement_outbox c
   JOIN public.contact_mail_receipts r ON r.outbox_id=c.id WHERE lower(c.recipient)=p_recipient
   AND r.event_type IN ('email.bounced','email.failed','email.complained','email.suppressed'))
$$;
REVOKE ALL ON FUNCTION billing.access_notice_allowed(text,boolean,boolean) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.access_notice_control(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); recipient_email text; offer_id uuid;
BEGIN
 recipient_email:=billing.commerce_assert_identity(actor);
 IF p_action='preferences' THEN
  IF p_data<>'{}' THEN
   IF jsonb_typeof(p_data->'opted_in') IS DISTINCT FROM 'boolean' OR p_data-'opted_in'<>'{}'
   THEN RAISE EXCEPTION 'ACCESS_NOTICE_INVALID'; END IF;
   INSERT INTO billing.commerce_mail_preferences AS p(email,marketing_opt_out,campaign_opted_in_at)
   VALUES(recipient_email,NOT (p_data->>'opted_in')::boolean,CASE WHEN (p_data->>'opted_in')::boolean THEN now() END)
   ON CONFLICT(email) DO UPDATE SET marketing_opt_out=excluded.marketing_opt_out,updated_at=now(),
    campaign_opted_in_at=CASE WHEN excluded.campaign_opted_in_at IS NOT NULL THEN coalesce(p.campaign_opted_in_at,now()) END;
  END IF;
  RETURN jsonb_build_object('opted_in',EXISTS(SELECT 1 FROM billing.commerce_mail_preferences p
   WHERE p.email=recipient_email AND p.campaign_opted_in_at IS NOT NULL AND NOT p.marketing_opt_out AND NOT p.suppressed));
 END IF;
 IF NOT coalesce(public.has_role(actor,'admin'::public.app_role),false)
 THEN RAISE EXCEPTION 'ACCESS_NOTICE_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_action='queue_public_coupon' THEN
  offer_id:=(p_data->>'id')::uuid;
  IF p_data-'id'<>'{}' OR NOT EXISTS(SELECT 1 FROM billing.commerce_offers c
   WHERE c.id=offer_id AND c.delivery_mode='coupon' AND c.enabled
   AND coalesce(cardinality(c.audience_emails),0)=0 AND c.email IS NULL
   AND (c.valid_until IS NULL OR now()<c.valid_until))
  THEN RAISE EXCEPTION 'ACCESS_NOTICE_INVALID_COUPON'; END IF;
  INSERT INTO billing.access_public_coupon_mail(offer_id) VALUES(offer_id) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('queued',true);
 END IF;
 IF p_action='status' THEN
  IF p_data-'source_id'<>'{}' THEN RAISE EXCEPTION 'ACCESS_NOTICE_INVALID'; END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.created_at DESC) FROM (
   SELECT n.kind,n.recipient,n.created_at,coalesce(n.receipt,n.stopped,
    CASE WHEN n.provider_id IS NOT NULL THEN 'accepted'
     WHEN n.lease_until>now() AND n.lease IS NOT NULL THEN 'sending'
     WHEN billing.access_notice_payload(n) IS NULL THEN 'held' ELSE 'pending' END) AS status
   FROM billing.access_notice_outbox n WHERE n.source_id=(p_data->>'source_id')::uuid
   ORDER BY created_at DESC,id DESC LIMIT 100) rows),'[]'::jsonb);
 END IF;
 RAISE EXCEPTION 'ACCESS_NOTICE_INVALID';
END $$;
REVOKE ALL ON FUNCTION public.access_notice_control(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.access_notice_control(text,jsonb) TO authenticated;
--> statement-breakpoint

-- Work in bounded batches and record each campaign event once per recipient.
CREATE FUNCTION billing.prepare_access_notices() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 WITH candidates AS (
  SELECT w.id AS source_id,u.id AS account_id,lower(btrim(u.email)) AS recipient,
   billing.access_notice_locale(u.raw_user_meta_data->>'preferred_locale') AS locale,
   CASE WHEN u.created_at>=w.starts_at THEN 'campaign_signup' ELSE 'campaign_start' END AS kind
  FROM billing.free_access_windows w
  JOIN auth.users u ON u.email_confirmed_at IS NOT NULL AND u.email_confirmed_at<w.ends_at
   AND u.email IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
  WHERE w.enabled AND w.email_notices AND w.mail_approved_at IS NOT NULL AND now()<w.ends_at
  AND (
   (u.created_at>=w.starts_at AND u.created_at<w.ends_at AND now()>=w.starts_at)
   OR (u.created_at<w.starts_at AND billing.access_notice_allowed(lower(btrim(u.email)),true,true))
  )
  AND billing.access_notice_allowed(lower(btrim(u.email)),false,false)
  AND NOT EXISTS(SELECT 1 FROM billing.access_notice_outbox o WHERE o.source_id=w.id
    AND o.kind IN ('campaign_start','campaign_signup') AND (o.account_id=u.id OR o.recipient=lower(btrim(u.email))))
  ORDER BY (u.created_at>=w.starts_at) DESC,w.mail_approved_at,u.id LIMIT 60
 )
 INSERT INTO billing.access_notice_outbox(kind,source_id,recipient,account_id,locale)
 SELECT kind,source_id,recipient,account_id,locale FROM candidates ON CONFLICT DO NOTHING;

 INSERT INTO billing.access_notice_outbox(kind,source_id,recipient,account_id,locale)
 SELECT 'campaign_end',w.id,o.recipient,o.account_id,o.locale
 FROM billing.free_access_windows w JOIN billing.access_notice_outbox o ON o.source_id=w.id
 WHERE w.enabled AND w.email_notices AND w.starts_at<=now() AND now()<w.ends_at
 AND w.ends_at-interval '24 hours'<=now()
 AND o.kind IN ('campaign_start','campaign_signup') AND o.provider_id IS NOT NULL
 AND o.first_attempt_at<w.ends_at-interval '24 hours'
 AND NOT EXISTS(SELECT 1 FROM billing.access_notice_outbox e WHERE e.kind='campaign_end' AND e.source_id=w.id AND e.recipient=o.recipient)
 ORDER BY w.ends_at,o.id LIMIT 60 ON CONFLICT DO NOTHING;

 INSERT INTO billing.access_notice_outbox(kind,source_id,recipient,account_id,locale)
 SELECT 'coupon',p.offer_id,lower(btrim(u.email)),u.id,billing.access_notice_locale(u.raw_user_meta_data->>'preferred_locale')
 FROM billing.access_public_coupon_mail p JOIN billing.commerce_offers c ON c.id=p.offer_id
 JOIN auth.users u ON u.email_confirmed_at<=p.approved_at AND u.email IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
 WHERE c.enabled AND c.delivery_mode='coupon' AND c.email IS NULL AND coalesce(cardinality(c.audience_emails),0)=0
 AND (c.valid_until IS NULL OR now()<c.valid_until)
 AND billing.access_notice_allowed(lower(btrim(u.email)),true,true)
 AND NOT EXISTS(SELECT 1 FROM billing.access_notice_outbox o WHERE o.kind='coupon' AND o.source_id=p.offer_id AND o.recipient=lower(btrim(u.email)))
 ORDER BY p.approved_at,u.id LIMIT 60 ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION billing.prepare_access_notices() FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

-- The first claim freezes the content for the provider idempotency window.
-- Eligibility and the deadline are checked again immediately before sending.
CREATE FUNCTION billing.access_notice_payload(o billing.access_notice_outbox) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE w billing.free_access_windows%ROWTYPE; c billing.commerce_offers%ROWTYPE; g billing.email_access_grants%ROWTYPE;
 requires_opt_in boolean; catalogues jsonb;
BEGIN
 IF o.account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=o.account_id
  AND lower(btrim(u.email))=o.recipient AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false))
 THEN RETURN NULL; END IF;
 IF o.kind LIKE 'campaign_%' THEN
  SELECT * INTO w FROM billing.free_access_windows WHERE id=o.source_id;
  IF NOT FOUND OR NOT w.enabled OR NOT w.email_notices OR now()>=w.ends_at
   OR (o.kind='campaign_signup' AND now()<w.starts_at)
   OR (o.kind='campaign_end' AND now()<greatest(w.starts_at,w.ends_at-interval '24 hours'))
  THEN RETURN NULL; END IF;
  requires_opt_in:=o.kind='campaign_start' OR (o.kind='campaign_end' AND EXISTS(
   SELECT 1 FROM billing.access_notice_outbox s WHERE s.kind='campaign_start' AND s.source_id=o.source_id AND s.recipient=o.recipient));
  IF NOT billing.access_notice_allowed(o.recipient,requires_opt_in,requires_opt_in) THEN RETURN NULL; END IF;
  SELECT coalesce(jsonb_agg(coalesce(t->'titles'->>o.locale,t->>'title',t->>'id') ORDER BY t->>'id'),'[]'::jsonb) INTO catalogues
  FROM jsonb_array_elements(billing.free_access_targets()) t
  WHERE (t->>'id')=ANY(w.targets) AND (t->>'published')::boolean;
  IF catalogues='[]'::jsonb THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('kind',o.kind,'title',w.title,'starts_at',w.starts_at,'ends_at',w.ends_at,
   'catalogues',catalogues,'questions',w.assistant_questions,'revision',w.version,'marketing',requires_opt_in);
 ELSIF o.kind='coupon' THEN
  SELECT * INTO c FROM billing.commerce_offers WHERE id=o.source_id;
  IF NOT FOUND OR NOT c.enabled OR c.delivery_mode IS DISTINCT FROM 'coupon'
   OR (c.valid_until IS NOT NULL AND now()>=c.valid_until) THEN RETURN NULL; END IF;
  requires_opt_in:=coalesce(cardinality(c.audience_emails),0)=0;
  IF (requires_opt_in AND (c.email IS NOT NULL OR NOT EXISTS(SELECT 1 FROM billing.access_public_coupon_mail p WHERE p.offer_id=c.id)))
   OR (NOT requires_opt_in AND NOT o.recipient=ANY(c.audience_emails))
   OR NOT billing.access_notice_allowed(o.recipient,true,requires_opt_in) THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('kind',o.kind,'code',c.code,'package',c.package,'discount_kind',c.kind,
   'discount_value',c.value_minor,'currency',c.currency,'starts_at',c.valid_from,'ends_at',c.valid_until,'marketing',true);
 END IF;
 SELECT * INTO g FROM billing.email_access_grants WHERE id=o.source_id;
 IF NOT FOUND OR g.recipient_email<>o.recipient OR g.revoked_at IS NOT NULL
  OR (g.ends_at IS NOT NULL AND g.ends_at<=now()) OR NOT billing.access_notice_allowed(o.recipient,false,false)
 THEN RETURN NULL; END IF;
 SELECT coalesce(jsonb_agg(coalesce(t->'titles'->>o.locale,t->>'title',t->>'id') ORDER BY t->>'id'),'[]'::jsonb) INTO catalogues
 FROM jsonb_array_elements(billing.email_access_catalogues()) t WHERE (t->>'id')=ANY(g.catalogues);
 RETURN jsonb_build_object('kind',o.kind,'catalogues',catalogues,'catalogue_keys',g.catalogues,
  'scope_mode',g.scope_mode,'ends_at',g.ends_at,
  'duration_days',g.duration_days,'active',g.user_id IS NOT NULL AND g.activated_at IS NOT NULL,
  'acceptance_required',g.acceptance_required);
END $$;
REVOKE ALL ON FUNCTION billing.access_notice_payload(billing.access_notice_outbox) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.access_notice_mail(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o billing.access_notice_outbox%ROWTYPE; body jsonb; output jsonb:='[]';
 claim_id uuid; target_id uuid; target_email text; message_id text;
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'ACCESS_NOTICE_SERVER_ONLY' USING ERRCODE='42501'; END IF;
 IF p_action='claim' THEN
  IF NOT billing.communications_starts_open() THEN RETURN '[]'::jsonb; END IF;
  -- Serialize campaign fan-out but let the provider work proceed outside the transaction.
  IF NOT pg_try_advisory_xact_lock(hashtextextended('access-notice-fanout',0)) THEN RETURN '[]'::jsonb; END IF;
  PERFORM billing.prepare_access_notices();
  UPDATE billing.access_notice_outbox SET stopped=CASE WHEN first_attempt_at IS NULL THEN 'expired' ELSE 'unknown' END,
   lease=NULL,lease_until=NULL
  WHERE stopped IS NULL AND provider_id IS NULL AND (lease_until IS NULL OR lease_until<=now())
  AND (first_attempt_at<=now()-interval '23 hours' OR (attempts>=3 AND lease IS NOT NULL) OR created_at<=now()-interval '30 days');
  FOR o IN SELECT n.* FROM billing.access_notice_outbox n
   WHERE n.stopped IS NULL AND n.provider_id IS NULL AND n.attempts<3 AND (n.lease_until IS NULL OR n.lease_until<=now())
   AND billing.access_notice_payload(n) IS NOT NULL
   ORDER BY (n.kind='campaign_signup') DESC,n.created_at,n.id LIMIT 20 FOR UPDATE OF n SKIP LOCKED
  LOOP
   body:=CASE WHEN o.first_attempt_at IS NOT NULL THEN o.payload ELSE billing.access_notice_payload(o) END;
   IF body IS NULL THEN CONTINUE; END IF;
   UPDATE billing.access_notice_outbox SET lease=gen_random_uuid(),lease_until=now()+interval '10 minutes',payload=body,authorized=false
    WHERE id=o.id RETURNING * INTO o;
   output:=output||jsonb_build_array(jsonb_build_object('id',o.id,'lease',o.lease,'recipient',o.recipient,'locale',o.locale,'payload',body));
  END LOOP;
  RETURN output;
 END IF;
 claim_id:=(p_data->>'lease')::uuid;
 target_id:=(p_data->>'id')::uuid;
 IF p_action='authorize' AND NOT billing.communications_starts_open() THEN RETURN 'false'; END IF;
 IF p_action='authorize' THEN
  SELECT recipient INTO target_email FROM billing.access_notice_outbox WHERE id=target_id;
  IF NOT FOUND THEN RETURN 'false'; END IF;
  PERFORM billing.lock_contact_accounts(ARRAY[target_email]);
 END IF;
 SELECT * INTO o FROM billing.access_notice_outbox WHERE id=target_id FOR UPDATE;
 IF NOT FOUND OR claim_id IS NULL OR o.lease IS DISTINCT FROM claim_id OR o.lease_until<=now()
  OR o.provider_id IS NOT NULL OR o.stopped IS NOT NULL THEN RETURN 'false'; END IF;
 IF p_action='authorize' THEN
  IF o.authorized THEN RETURN 'false'; END IF;
  body:=billing.access_notice_payload(o);
  IF body IS NULL OR body IS DISTINCT FROM o.payload THEN
   UPDATE billing.access_notice_outbox SET lease=NULL,lease_until=NULL,
    payload=CASE WHEN o.first_attempt_at IS NULL THEN NULL ELSE o.payload END,
    stopped=CASE WHEN o.first_attempt_at IS NOT NULL AND body IS DISTINCT FROM o.payload THEN 'unknown' END
   WHERE id=o.id;
   RETURN 'false';
  END IF;
  UPDATE billing.access_notice_outbox SET attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),authorized=true WHERE id=o.id;
  RETURN 'true';
 ELSIF p_action='result' THEN
  message_id:=p_data->>'provider_id';
  IF NOT o.authorized OR (message_id IS NOT NULL AND message_id !~ '^[A-Za-z0-9_-]{1,200}$') THEN RETURN 'false'; END IF;
  UPDATE billing.access_notice_outbox SET provider_id=message_id,lease=NULL,authorized=false,
   lease_until=CASE WHEN message_id IS NULL AND (p_data->>'retryable')::boolean AND o.attempts<3 THEN now()+interval '5 minutes' END,
   stopped=CASE WHEN message_id IS NOT NULL THEN NULL WHEN (p_data->>'retryable')::boolean
    THEN CASE WHEN o.attempts>=3 THEN 'unknown' END ELSE 'failed' END
  WHERE id=o.id;
  RETURN 'true';
 END IF;
 RAISE EXCEPTION 'ACCESS_NOTICE_INVALID';
END $$;
REVOKE ALL ON FUNCTION public.access_notice_mail(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.access_notice_mail(text,jsonb) TO service_role;

--> statement-breakpoint
CREATE TABLE billing.access_notice_receipts (
 event_id text PRIMARY KEY CHECK(length(event_id) BETWEEN 1 AND 200),
 notice_id uuid NOT NULL REFERENCES billing.access_notice_outbox(id) ON DELETE CASCADE,
 kind text NOT NULL,
 occurred_at timestamptz NOT NULL
);
ALTER TABLE billing.access_notice_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.access_notice_receipts FROM PUBLIC,anon,authenticated,service_role;

-- Preserve the full original receipt chain and its ACL; the existing signed
-- webhook needs no endpoint, secret or configuration change.
DO $preserve$
DECLARE d text; prefix text:='CREATE OR REPLACE FUNCTION public.record_contact_mail_receipt(';
BEGIN
 d:=pg_get_functiondef('public.record_contact_mail_receipt(text,text,text,text,timestamptz)'::regprocedure);
 IF left(d,length(prefix))<>prefix THEN RAISE EXCEPTION 'ACCESS_NOTICE_RECEIPT_BASELINE_CHANGED'; END IF;
 EXECUTE 'CREATE FUNCTION billing.access_notice_previous_receipt('||substr(d,length(prefix)+1);
END $preserve$;
REVOKE ALL ON FUNCTION billing.access_notice_previous_receipt(text,text,text,text,timestamptz) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.record_contact_mail_receipt(
 p_event text,p_email_id text,p_recipient text,p_type text,p_at timestamptz
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE notice_id uuid; previous_result text; canonical_email text:=lower(btrim(p_recipient));
BEGIN
 IF NOT billing.is_service_role_caller() THEN RAISE EXCEPTION 'ACCESS_NOTICE_SERVER_ONLY'; END IF;
 SELECT id INTO notice_id FROM billing.access_notice_outbox
 WHERE provider_id=p_email_id AND recipient=canonical_email FOR UPDATE;
 IF notice_id IS NULL THEN
  previous_result:=billing.access_notice_previous_receipt(p_event,p_email_id,p_recipient,p_type,p_at);
  IF previous_result='ignored' AND EXISTS(SELECT 1 FROM billing.access_notice_outbox
   WHERE recipient=canonical_email AND provider_id IS NULL AND first_attempt_at>now()-interval '23 hours'
    AND (stopped IS NULL OR stopped='unknown')) THEN RETURN 'pending'; END IF;
  RETURN previous_result;
 END IF;
 IF p_at IS NULL OR p_type NOT IN ('email.delivered','email.delivery_delayed','email.bounced',
  'email.failed','email.complained','email.suppressed') THEN RETURN 'ignored'; END IF;
 INSERT INTO billing.access_notice_receipts VALUES(p_event,notice_id,p_type,p_at) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN 'recorded'; END IF;
 UPDATE billing.access_notice_outbox SET receipt=p_type,receipt_at=greatest(receipt_at,p_at)
 WHERE id=notice_id AND coalesce(receipt,'') NOT IN ('email.bounced','email.complained','email.suppressed','email.failed')
 AND (receipt_at IS NULL OR receipt_at<=p_at OR p_type IN ('email.bounced','email.complained','email.suppressed','email.failed'));
 IF p_type IN ('email.bounced','email.complained','email.suppressed') THEN
  INSERT INTO billing.commerce_mail_preferences(email,suppressed) VALUES(canonical_email,true)
  ON CONFLICT(email) DO UPDATE SET suppressed=true,updated_at=now();
 END IF;
 RETURN 'recorded';
END $$;
