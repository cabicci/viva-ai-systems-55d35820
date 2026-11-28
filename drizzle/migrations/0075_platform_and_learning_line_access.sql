-- Keep campaign intent on the window. Resolve membership from the published
-- catalogue at read time so existing and future editions follow the same rule.
CREATE FUNCTION billing.campaign_target_line(target text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path='' AS $$
 SELECT CASE WHEN target LIKE 'curriculum:%' THEN split_part(target,':',2)
             ELSE split_part(target,':',1) END
$$;
--> statement-breakpoint
CREATE FUNCTION billing.campaign_matches(targets text[], target text) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT SET search_path='' AS $$
 SELECT target=ANY(targets) OR (
   billing.campaign_target_line(target) IN ('ai','academic','technical','kids')
   AND ('platform'=ANY(targets) OR ('line:'||billing.campaign_target_line(target))=ANY(targets)
        OR (billing.campaign_target_line(target)='ai' AND 'ai'=ANY(targets))))
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.campaign_target_line(text),billing.campaign_matches(text[],text) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
-- Keep the existing exact-course targets and add visible whole-line choices.
-- 'ai' already denotes the whole AI line and remains valid on older windows.
DO $catalogue$
DECLARE d text:=pg_get_functiondef('billing.free_access_targets()'::regprocedure);
 anchor text:='SELECT jsonb_build_array(jsonb_build_object(''id'',''ai'',';
 scopes text:=$choices$SELECT jsonb_build_array(
   jsonb_build_object('id','platform','title','Entire platform','published',true,
     'titles',jsonb_build_object('en','Entire platform','ar-EG','المنصة كلها','ar-MSA','المنصة كاملة','ar-Gulf','المنصة بالكامل')),
   jsonb_build_object('id','line:academic','title','All Academic courses','published',true,
     'titles',jsonb_build_object('en','All Academic courses','ar-EG','مسارات أكاديمي بالكامل','ar-MSA','جميع المناهج الأكاديمية','ar-Gulf','كل المناهج الأكاديمية')),
   jsonb_build_object('id','line:technical','title','All Technical courses','published',true,
     'titles',jsonb_build_object('en','All Technical courses','ar-EG','التعليم الفني بالكامل','ar-MSA','جميع مناهج التعليم الفني','ar-Gulf','كل مناهج التعليم الفني')),
   jsonb_build_object('id','line:kids','title','All Kids courses','published',true,
     'titles',jsonb_build_object('en','All Kids courses','ar-EG','مسارات كيدز بالكامل','ar-MSA','جميع مناهج الأطفال','ar-Gulf','كل مناهج الأطفال'))
 ) || jsonb_build_array(jsonb_build_object('id','ai',$choices$;
BEGIN
 IF strpos(d,anchor)=0 THEN RAISE EXCEPTION 'Free access catalogue definition changed'; END IF;
 EXECUTE replace(d,anchor,scopes);
END $catalogue$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION billing.free_access_has(p_user uuid,p_target text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND billing.commerce_account_allowed(p_user)
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM billing.free_access_windows w
   WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at AND billing.campaign_matches(w.targets,p_target))
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION billing.free_access_question_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT 'free-window:'||w.id,w.created_at,w.ends_at,w.assistant_questions,false,NULL::integer
 FROM billing.free_access_windows w
 WHERE w.enabled AND w.assistant_questions>0 AND w.starts_at<=p_at AND p_at<w.ends_at
 AND billing.commercial_account_allowed(p_user)
 AND CASE WHEN p_area='kids' THEN EXISTS(
   SELECT 1 FROM public.kids_profiles k WHERE k.id=p_child AND k.parent_id=p_user)
 ELSE p_child IS NULL END
 AND CASE
   WHEN p_area='ai' AND p_course='ai' THEN billing.campaign_matches(w.targets,'ai')
     OR EXISTS(SELECT 1 FROM unnest(w.targets) t WHERE t LIKE 'ai:%')
   WHEN p_area='kids' AND p_course='kids' THEN billing.campaign_matches(w.targets,'kids')
   WHEN p_area IN ('ai','academic','technical','kids') THEN
     ((p_area='technical' AND p_course='furniture' OR p_area='academic'
        AND EXISTS(SELECT 1 FROM public.academic_courses c WHERE c.id=p_course AND c.enabled))
       AND billing.campaign_matches(w.targets,p_area||':'||p_course))
     OR (billing.campaign_matches(w.targets,'curriculum:'||p_area||':'||p_course)
         AND EXISTS(SELECT 1 FROM curriculum_private.courses c
                    WHERE c.area=p_area AND c.id=p_course AND c.active_version IS NOT NULL))
   ELSE false END
$$;
--> statement-breakpoint
-- Share the same membership rules with existing session expiry, allowance,
-- Kids expiry and paid-time readers. Keep their identity and lifecycle checks.
DO $readers$
DECLARE r record; d text;
BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('billing.free_window_tag_delivery(jsonb,text)','p_target=ANY(targets)','billing.campaign_matches(targets,p_target)'),
 ('public.get_my_kids_access_status()', '''kids''=ANY(w.targets)','billing.campaign_matches(w.targets,''kids'')'),
 ('billing.assistant_source_permits(text,text)','''ai''=ANY(w.targets)','billing.campaign_matches(w.targets,''ai'')'),
 ('billing.assistant_source_permits(text,text)','(''ai:''||c.path_id)=ANY(w.targets)','billing.campaign_matches(w.targets,''ai:''||c.path_id)'),
 ('billing.campaign_paid_clock(uuid,text,timestamptz,text,text,timestamptz)','''ai''=ANY(w.targets)','billing.campaign_matches(w.targets,''ai'')'),
 ('billing.campaign_paid_clock(uuid,text,timestamptz,text,text,timestamptz)','''kids''=ANY(w.targets)','billing.campaign_matches(w.targets,''kids'')'),
 ('billing.campaign_paid_clock(uuid,text,timestamptz,text,text,timestamptz)','w.targets&&ARRAY[''academic:''||p_course,''curriculum:academic:''||p_course]','(billing.campaign_matches(w.targets,''academic:''||p_course) OR billing.campaign_matches(w.targets,''curriculum:academic:''||p_course))'),
 ('billing.campaign_paid_clock(uuid,text,timestamptz,text,text,timestamptz)','w.targets&&ARRAY[''technical:''||p_course,''curriculum:technical:''||p_course]','(billing.campaign_matches(w.targets,''technical:''||p_course) OR billing.campaign_matches(w.targets,''curriculum:technical:''||p_course))'),
 ('public.get_my_free_access()', 'CROSS JOIN LATERAL unnest(w.targets) t', $snapshot$CROSS JOIN LATERAL (
   SELECT unnest(w.targets) AS t UNION
   SELECT c->>'id' FROM jsonb_array_elements(billing.free_access_targets()) c
   WHERE (c->>'published')::boolean AND c->>'id'<>'platform' AND c->>'id' NOT LIKE 'line:%'
     AND billing.campaign_matches(w.targets,c->>'id')
 ) effective$snapshot$),
 ('curriculum_private.previous_assistant_source_specs(uuid,text,text,uuid,timestamptz)',
  'AND ap.course_id=p_course',$price$AND ap.stripe_environment=s.stripe_environment
    AND (ap.course_id=p_course OR (
      (s.stripe_environment='live' OR NOT EXISTS(SELECT 1 FROM billing.stripe_live_control WHERE singleton AND live_enabled))
      AND (EXISTS(SELECT 1 FROM public.academic_courses c WHERE c.id=p_course AND c.enabled)
        OR EXISTS(SELECT 1 FROM curriculum_private.courses c WHERE c.area='academic' AND c.id=p_course AND c.active_version IS NOT NULL))))$price$),
 ('curriculum_private.previous_assistant_source_specs(uuid,text,text,uuid,timestamptz)',
  'OR EXISTS(SELECT 1 FROM public.academic_content_course_grants g WHERE g.entitlement_id=e.id AND g.course_id=p_course)',
  'OR (e.order_id IS NOT NULL AND e.grant_id IS NULL AND EXISTS(SELECT 1 FROM public.academic_courses c WHERE c.id=p_course AND c.enabled)) OR EXISTS(SELECT 1 FROM public.academic_content_course_grants g WHERE g.entitlement_id=e.id AND g.course_id=p_course)')
 ) AS patches(signature,anchor,replacement) LOOP
  d:=pg_get_functiondef(r.signature::regprocedure);
  IF (length(d)-length(replace(d,r.anchor,'')))<>length(r.anchor) THEN
    RAISE EXCEPTION 'Expected one scope reader in % for %',r.signature,r.anchor;
  END IF;
  EXECUTE replace(d,r.anchor,r.replacement);
 END LOOP;
END $readers$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.get_free_access_announcement() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',w.id,'ends_at',w.ends_at,'server_time',now())
 FROM billing.free_access_windows w
 WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at AND
 ('platform'=ANY(w.targets) OR (billing.campaign_matches(w.targets,'ai') AND NOT EXISTS (
   SELECT 1 FROM jsonb_array_elements(billing.free_access_targets()) target
   WHERE target->'published'='true'::jsonb AND target->>'id'<>'platform'
     AND target->>'id' NOT LIKE 'line:%' AND NOT billing.campaign_matches(w.targets,target->>'id'))))
 ORDER BY w.ends_at DESC,w.id LIMIT 1
$$;
--> statement-breakpoint
-- Actual paid terms are distinct from an email invitation that presents the
-- same tier. Preserve all existing quota and payment records.
CREATE FUNCTION billing.paid_line_end(p_user uuid,p_area text,p_child uuid) RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT max(valid_until) FROM (
   SELECT s.current_period_end AS valid_until FROM billing.subscriptions s
   JOIN billing.plan_versions v ON v.id=s.plan_version_id JOIN billing.plan_catalog p ON p.id=v.plan_id
   WHERE p_area='ai' AND s.user_id=p_user AND s.access_state IN ('paid_active','canceled_at_period_end')
    AND p.plan_key IN ('pro','pro_plus') AND s.current_period_start<=now() AND now()<s.current_period_end
   UNION ALL
   SELECT s.ends_at FROM billing.academic_stripe_subscriptions s
   JOIN billing.academic_stripe_prices p ON p.gateway_price_id=s.price_id AND p.stripe_environment=s.stripe_environment
   WHERE p_area='academic' AND s.user_id=p_user AND s.status IN ('active','trialing')
    AND NOT s.refunded AND s.starts_at<=now() AND now()<s.ends_at
    AND (s.stripe_environment='live' OR NOT EXISTS(SELECT 1 FROM billing.stripe_live_control WHERE singleton AND live_enabled))
   UNION ALL
   SELECT s.ends_at FROM billing.technical_stripe_subscriptions s
   WHERE p_area='technical' AND s.user_id=p_user AND s.status IN ('active','trialing')
    AND NOT s.refunded AND s.starts_at<=now() AND now()<s.ends_at
    AND (s.stripe_environment='live' OR NOT EXISTS(SELECT 1 FROM billing.stripe_live_control WHERE singleton AND live_enabled))
   UNION ALL
   SELECT e.active_until FROM public.kids_family_entitlements e
   WHERE p_area='kids' AND e.parent_id=p_user AND e.active_from<=now() AND now()<e.active_until
   UNION ALL
   SELECT e.ends_at FROM billing.commerce_entitlements e
   WHERE e.user_id=p_user AND e.revoked_at IS NULL AND e.order_id IS NOT NULL AND e.grant_id IS NULL
    AND (e.package=p_area OR p_area='ai' AND e.package IN ('pro','pro_plus'))
    AND e.starts_at<=now() AND now()<e.ends_at AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled)
 ) paid WHERE p_area IN ('ai','academic','technical','kids') AND billing.commercial_account_allowed(p_user)
 AND CASE WHEN p_area='kids' THEN EXISTS(SELECT 1 FROM public.kids_profiles k WHERE k.id=p_child AND k.parent_id=p_user)
          ELSE p_child IS NULL END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION billing.paid_line_end(uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
DO $paid$
DECLARE d text; r record;
BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('billing.get_entitlement_snapshot(uuid)','DECLARE result jsonb; deadline timestamptz;', 'DECLARE result jsonb; deadline timestamptz; paid_until timestamptz; lesson_ids jsonb;'),
 ('billing.get_entitlement_snapshot(uuid)','RETURN result;', $snapshot$IF coalesce((result->>'paid_content_entitled')::boolean,false) THEN
   paid_until:=billing.paid_line_end(p_user_id,'ai',NULL);
   IF paid_until IS NOT NULL THEN
     SELECT coalesce(jsonb_agg(lesson_id ORDER BY lesson_id),'[]'::jsonb) INTO lesson_ids FROM (
       SELECT jsonb_array_elements_text(coalesce(result#>'{lessons,entitled_lesson_ids}','[]'::jsonb)) AS lesson_id
       UNION SELECT lesson_id FROM billing.commerce_lesson_catalog
     ) published;
     result:=result||jsonb_build_object('lessons',coalesce(result->'lessons','{}'::jsonb)||
       jsonb_build_object('entitled_lesson_ids',lesson_ids,'entitled_lesson_count',jsonb_array_length(lesson_ids)),
       'expires_at',least((result->>'expires_at')::timestamptz,paid_until));
   END IF;
 END IF;
 RETURN result;$snapshot$),
 ('public.assistant_card_content_access(uuid,text)','WHERE billing.assistant_free_lesson(lesson_id)',
 'WHERE billing.assistant_free_lesson(lesson_id) OR billing.free_access_ai_lesson(p_user_id,lesson_id)'),
 ('billing.assistant_source_permits(text,text)','AND c.plan_key=''pro_plus''','AND c.plan_key IN (''pro'',''pro_plus'')'),
 ('billing.assistant_source_permits(text,text)','AND package=''pro_plus''','AND (package=''pro_plus'' OR package=''pro'' AND order_id IS NOT NULL AND grant_id IS NULL)'),
 ('public.get_my_commercial_access()','ai boolean;', 'ai boolean; paid_until timestamptz;'),
 ('public.get_my_commercial_access()','ai:=billing.commercial_course_owned', 'paid_until:=billing.paid_line_end(u,''ai'',NULL); ai:=billing.commercial_course_owned'),
 ('public.get_my_commercial_access()', '''ai_lesson_ids'',CASE WHEN ai THEN','''ai_paid_line_access'',paid_until IS NOT NULL,''ai_lesson_ids'',CASE WHEN ai OR paid_until IS NOT NULL THEN'),
 ('public.get_my_commercial_access()', '''check_at'',now()+interval ''30 seconds''','''check_at'',least(paid_until,now()+interval ''30 seconds'')'),
 ('billing.evaluate_access(uuid,text,text)','IF p_resource_type=''lesson'' AND billing.commercial_account_allowed',
 $ai$IF p_resource_type IN ('lesson','video') AND billing.paid_line_end(p_user_id,'ai',NULL) IS NOT NULL
   AND coalesce((billing.get_entitlement_snapshot(p_user_id)->>'paid_content_entitled')::boolean,false)
   AND EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog WHERE lesson_id=p_resource_id) THEN
   RETURN jsonb_build_object('allowed',true,'denial_reason_code',NULL,'source','paid_ai_line');
 END IF;
 IF p_resource_type='lesson' AND billing.commercial_account_allowed$ai$),
 ('public.academic_can_access(text,text,text)','OR (billing.commercial_course_owned', $academic$OR (billing.commercial_account_allowed(auth.uid()) AND EXISTS(
   SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
   WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved)
   AND billing.paid_line_end(auth.uid(),'academic',NULL) IS NOT NULL)
 OR (billing.commercial_course_owned$academic$),
 ('curriculum_private.access(uuid,text,text,text,text,uuid)',
   'RETURN billing.commercial_course_owned(p_user,p_area,p_course,p_child)',
   'RETURN billing.paid_line_end(p_user,p_area,p_child) IS NOT NULL OR billing.commercial_course_owned(p_user,p_area,p_course,p_child)')
 ) AS patches(signature,anchor,replacement) LOOP
   d:=pg_get_functiondef(r.signature::regprocedure);
   IF (length(d)-length(replace(d,r.anchor,'')))<>length(r.anchor) THEN
     RAISE EXCEPTION 'Expected one paid reader in % for %',r.signature,r.anchor;
   END IF;
   EXECUTE replace(d,r.anchor,r.replacement);
 END LOOP;
END $paid$;
--> statement-breakpoint
-- This is the owner's existing offer, verified against its administration row.
-- Other installations and individually configured windows keep their scopes.
DO $current_offer$
DECLARE w billing.free_access_windows%ROWTYPE; original jsonb;
BEGIN
 SELECT * INTO w FROM billing.free_access_windows
 WHERE id='573a7817-3af3-40d3-991e-aecc940aad50' FOR UPDATE;
 IF NOT FOUND OR w.targets=ARRAY['platform'] THEN RETURN; END IF;
 IF w.version<>2 OR w.targets<>ARRAY['academic:AC-BUS','ai','curriculum:academic:AC-FATE','kids','technical:furniture']
    OR w.starts_at<>'2026-11-11 11:26:00+00' OR w.ends_at<>'2026-12-10 11:26:00+00' OR NOT w.enabled THEN
   RAISE EXCEPTION 'The commissioned campaign changed; reconcile its current version';
 END IF;
 original:=to_jsonb(w)-'created_by';
 UPDATE billing.free_access_windows SET targets=ARRAY['platform'],version=version+1,updated_at=now()
 WHERE id=w.id RETURNING * INTO w;
 INSERT INTO billing.free_access_window_audit(window_id,actor,action,details)
 VALUES(w.id,NULL,'update',jsonb_build_object('source','0075_platform_and_learning_line_access',
   'before',original,'after',to_jsonb(w)-'created_by'));
END $current_offer$;
