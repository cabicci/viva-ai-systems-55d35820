-- Display-only projection. The native migration runner owns the transaction.
-- Existing commerce commands retain their exact cumulative body and ownership.
SET LOCAL lock_timeout = '5s';
DO $preconditions$
DECLARE item record;
BEGIN
 IF to_regprocedure('public.commerce_command(text,jsonb)') IS NULL
 OR to_regprocedure('billing.subscription_display_previous_command(text,jsonb)') IS NOT NULL
 OR to_regprocedure('billing.commerce_assert_identity(uuid)') IS NULL
 OR to_regprocedure('billing.commerce_account_allowed(uuid)') IS NULL
 OR to_regprocedure('public.get_stripe_portal_environment(uuid,text)') IS NULL THEN
  RAISE EXCEPTION 'SUBSCRIPTION_DISPLAY_PREREQUISITE_MISSING';
 END IF;
 FOR item IN SELECT * FROM (VALUES
  ('billing','academic_stripe_prices','course_id'),('billing','academic_stripe_prices','includes_assistant'),
  ('public','academic_content_course_grants','entitlement_id'),('public','academic_content_course_grants','course_id'),
  ('billing','email_access_grants','acceptance_required'),('billing','email_access_grants','grant_kind'),
  ('billing','commercial_purchases','payment_rail'),('billing','gateway_subscriptions','stripe_environment'),
  ('billing','academic_stripe_subscriptions','stripe_environment'),('billing','technical_stripe_subscriptions','stripe_environment'),
  ('public','kids_stripe_subscriptions','stripe_environment'),('billing','admin_access_grants','expires_at'),
  ('billing','commercial_legacy_terms','first_new_period_at'),('billing','webhook_events','live_risk_hold')
 ) x(s,t,c) LOOP
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=item.s AND table_name=item.t AND column_name=item.c)
  THEN RAISE EXCEPTION 'SUBSCRIPTION_DISPLAY_COLUMN_MISSING: %.%.%',item.s,item.t,item.c; END IF;
 END LOOP;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.commerce_command(text,jsonb)'::regprocedure
  AND prosecdef AND prorettype='jsonb'::regtype AND prosrc LIKE '%billing.commerce_before_one_time_command%'
  AND prosrc LIKE '%billing.commercial_lock%') THEN RAISE EXCEPTION 'SUBSCRIPTION_DISPLAY_COMMAND_CHANGED'; END IF;
END $preconditions$;
--> statement-breakpoint
-- Private SELECT-only source rows. Eligibility describes this source, never a
-- permission to open a lesson. Existing lesson/consent/release gates still apply.
CREATE FUNCTION billing.subscription_display_sources(p_owner uuid)
RETURNS TABLE(owner_id uuid, item jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $sources$
WITH owners AS MATERIALIZED (
 SELECT u.id,u.email,u.email_confirmed_at,
  NOT EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle d WHERE d.user_id=u.id)
  AND NOT EXISTS(SELECT 1 FROM billing.webhook_events w WHERE w.retention_user_id=u.id AND w.live_risk_hold)
  AND NOT EXISTS(SELECT 1 FROM billing.subscriptions s WHERE s.user_id=u.id AND s.access_state='suspended') AS allowed
 FROM auth.users u WHERE p_owner IS NULL OR u.id=p_owner
), sources AS (
 SELECT s.user_id AS owner_id,'core_subscription'::text AS kind,'ai'::text AS area,
  'ai:'||s.id AS identity,coalesce(c.plan_key,'unknown') AS product,ARRAY['ai']::text[] AS targets,
  NULL::text AS beneficiary,s.access_state AS raw_status,
  s.current_period_start AS starts_at,s.current_period_end AS ends_at,
  c.plan_key IN ('pro','pro_plus') AND s.access_state IN ('paid_active','canceled_at_period_end') AND s.current_period_end>now()
    AND (s.current_period_start IS NULL OR s.current_period_start<=now()) AS valid,
  true AS paid,false AS lifetime,
  s.cancel_at_period_end OR s.access_state='canceled_at_period_end' AS cancel_end,
  CASE WHEN g.n=1 THEN g.method END AS method,
  CASE WHEN g.n=1 AND g.method IN ('stripe_us','stripe_us_live') THEN g.environment END AS environment,
  CASE WHEN g.n=1 AND g.method IN ('stripe_us','stripe_us_live') AND g.environment='live' THEN 'core' END AS portal,
  'ai:'||s.id AS terms_key,false AS verified_required
 FROM billing.subscriptions s JOIN owners u ON u.id=s.user_id
 LEFT JOIN billing.plan_versions v ON v.id=s.plan_version_id LEFT JOIN billing.plan_catalog c ON c.id=v.plan_id
 LEFT JOIN LATERAL (SELECT count(*) AS n,min(gateway_code) AS method,min(stripe_environment) AS environment
  FROM billing.gateway_subscriptions WHERE subscription_id=s.id AND status IN ('active','trialing','past_due','unpaid','incomplete','paused')) g ON true
 WHERE c.plan_key IN ('pro','pro_plus') OR s.access_state IN ('paid_active','canceled_at_period_end','paid_scheduled','past_due','refund_pending','refunded','suspended')
 UNION ALL
 SELECT s.user_id,'academic_subscription','academic','academic:'||s.subscription_id||':'||s.stripe_environment,
  'academic',CASE WHEN p.course_id IS NULL THEN ARRAY[]::text[] ELSE ARRAY[p.course_id] END,NULL,s.status,s.starts_at,s.ends_at,
  p.course_id IS NOT NULL AND s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=now() AND s.ends_at>now(),
  true,false,NULL,'stripe',s.stripe_environment,NULL,'academic:'||s.subscription_id,false
 FROM billing.academic_stripe_subscriptions s JOIN owners u ON u.id=s.user_id
 LEFT JOIN billing.academic_stripe_prices p ON p.gateway_price_id=s.price_id AND p.stripe_environment=s.stripe_environment
 UNION ALL
 SELECT s.user_id,'technical_subscription','technical','technical:'||s.subscription_id||':'||s.stripe_environment,
  'technical',ARRAY['technical:furniture'],NULL,s.status,s.starts_at,s.ends_at,
  s.status IN ('active','trialing') AND NOT s.refunded AND s.starts_at<=now() AND s.ends_at>now(),
  true,false,NULL,'stripe',s.stripe_environment,NULL,'technical:'||s.subscription_id,false
 FROM billing.technical_stripe_subscriptions s JOIN owners u ON u.id=s.user_id
 UNION ALL
 SELECT s.parent_id,'kids_subscription','kids','kids-stripe:'||s.gateway_subscription_id||':'||s.stripe_environment,
  'kids',ARRAY['kids'],NULL,s.status,e.active_from,coalesce(e.active_until,s.paid_through),
  e.active_from<=now() AND e.active_until>now(),true,false,NULL,'stripe',s.stripe_environment,
  CASE WHEN s.stripe_environment='live' AND s.status IN ('active','trialing','past_due','unpaid','incomplete','paused') THEN 'kids' END,
  'kids:'||s.parent_id,false
 FROM public.kids_stripe_subscriptions s JOIN owners u ON u.id=s.parent_id
 LEFT JOIN public.kids_family_entitlements e ON e.parent_id=s.parent_id
  AND e.entitlement_reference='stripe-'||s.stripe_environment||':'||s.gateway_subscription_id
 UNION ALL
 SELECT e.parent_id,'family_grant','kids','kids-family:'||e.parent_id,'kids',ARRAY['kids'],NULL,
  'granted',e.active_from,e.active_until,e.active_from<=now() AND e.active_until>now(),
  false,false,NULL,NULL,NULL,NULL,'kids:'||e.parent_id,false
 FROM public.kids_family_entitlements e JOIN owners u ON u.id=e.parent_id
 WHERE NOT EXISTS(SELECT 1 FROM public.kids_stripe_subscriptions s WHERE s.parent_id=e.parent_id
  AND e.entitlement_reference='stripe-'||s.stripe_environment||':'||s.gateway_subscription_id)
 UNION ALL
 SELECT e.user_id,CASE WHEN e.grant_id IS NOT NULL THEN 'complimentary' ELSE 'manual_subscription' END,
  CASE WHEN e.package IN ('pro','pro_plus') THEN 'ai' ELSE e.package END,'commerce:'||e.id,e.package,
  CASE WHEN e.package='academic' THEN ARRAY(SELECT course_id FROM public.academic_content_course_grants WHERE entitlement_id=e.id ORDER BY course_id)
   ELSE ARRAY[CASE WHEN e.package IN ('pro','pro_plus') THEN 'ai' WHEN e.package='technical' THEN 'technical:furniture' ELSE e.package END] END,
  NULL,CASE WHEN e.revoked_at IS NOT NULL THEN 'revoked' ELSE coalesce(o.review_status,'granted') END,
  e.starts_at,e.ends_at,e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
   AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled)
   AND (e.package<>'academic' OR EXISTS(SELECT 1 FROM public.academic_content_course_grants WHERE entitlement_id=e.id)),
  e.order_id IS NOT NULL AND o.final_minor>0,false,NULL,o.method,NULL,NULL,'commerce:'||e.id,false
 FROM billing.commerce_entitlements e JOIN owners u ON u.id=e.user_id
 LEFT JOIN billing.commerce_orders o ON o.id=e.order_id AND o.user_id=e.user_id
 UNION ALL
 SELECT u.id,'invitation','multiple','invitation:'||g.id,g.grant_kind,
  CASE WHEN g.scope_mode='all_published' THEN ARRAY['all_published'] ELSE g.catalogues END,NULL,
  CASE WHEN g.revoked_at IS NOT NULL THEN 'revoked' WHEN g.activated_at IS NULL THEN 'pending_acceptance' ELSE 'accepted' END,
  g.activated_at,g.ends_at,g.user_id=u.id AND g.activated_at<=now() AND g.revoked_at IS NULL
   AND (g.ends_at IS NULL OR g.ends_at>now()) AND lower(btrim(u.email))=g.recipient_email,
  false,false,NULL,NULL,NULL,NULL,NULL,true
 FROM billing.email_access_grants g JOIN owners u ON (g.user_id=u.id OR (g.user_id IS NULL AND g.recipient_email=lower(btrim(u.email))))
 UNION ALL
 SELECT p.user_id,CASE WHEN p.kind='lifetime_course' THEN 'lifetime' ELSE 'topup' END,
  coalesce(p.area,'multiple'),'purchase:'||p.id,p.kind,
  CASE WHEN p.course IS NULL THEN ARRAY[]::text[] ELSE ARRAY[p.area||':'||p.course] END,
  child.display_name,p.state,p.paid_at,NULL,
  p.state='fulfilled' AND p.paid_at<=now() AND (p.child_id IS NULL OR child.id IS NOT NULL),
  p.kind='lifetime_course',p.kind='lifetime_course',NULL,p.payment_rail,NULL,NULL,'lifetime:'||p.id,true
 FROM billing.commercial_purchases p JOIN owners u ON u.id=p.user_id
 LEFT JOIN public.kids_profiles child ON child.id=p.child_id AND child.parent_id=p.user_id
 UNION ALL
 SELECT g.user_id,'temporary_grant','ai','admin-grant:'||g.id,'admin_grant',ARRAY['ai'],NULL,g.status,
  g.starts_at,g.expires_at,g.status='active' AND g.revoked_at IS NULL AND g.starts_at<=now() AND g.expires_at>now(),
  false,false,NULL,NULL,NULL,NULL,NULL,false
 FROM billing.admin_access_grants g JOIN owners u ON u.id=g.user_id
 UNION ALL
 SELECT u.id,'free_window','multiple','free-window:'||w.id,'free_access',w.targets,NULL,'enabled',
  w.starts_at,w.ends_at,true,false,false,NULL,NULL,NULL,NULL,NULL,true
 FROM owners u CROSS JOIN billing.free_access_windows w
 WHERE p_owner IS NOT NULL AND w.enabled AND w.starts_at<=now() AND w.ends_at>now()
)
SELECT s.owner_id,jsonb_build_object(
 'sourceKey',md5(s.owner_id::text||':'||s.identity),'kind',s.kind,'area',s.area,'product',s.product,
 'targets',to_jsonb(s.targets),'beneficiary',s.beneficiary,'sourceStatus',s.raw_status,
 'startsAt',s.starts_at,'accessUntil',s.ends_at,'isLifetime',s.lifetime,'paid',coalesce(s.paid,false),
 'eligible',coalesce(s.valid,false) AND u.allowed AND (NOT s.verified_required OR u.email_confirmed_at IS NOT NULL),
 'cancelAtPeriodEnd',s.cancel_end,'paymentMethod',s.method,'paymentEnvironment',s.environment,
 'portalScope',CASE WHEN u.allowed AND EXISTS(SELECT 1 FROM billing.stripe_live_control WHERE live_enabled) THEN s.portal END,
 'termsUntil',(SELECT first_new_period_at FROM billing.commercial_legacy_terms WHERE source_key=s.terms_key AND now()<first_new_period_at)
)
FROM sources s JOIN owners u ON u.id=s.owner_id;
$sources$;
REVOKE ALL ON FUNCTION billing.subscription_display_sources(uuid) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint
DO $preserve$
DECLARE definition text; original_owner text;
BEGIN
 SELECT pg_get_functiondef(oid),pg_get_userbyid(proowner) INTO definition,original_owner
 FROM pg_proc WHERE oid='public.commerce_command(text,jsonb)'::regprocedure;
 EXECUTE replace(definition,'FUNCTION public.commerce_command(','FUNCTION billing.subscription_display_previous_command(');
 EXECUTE format('ALTER FUNCTION billing.subscription_display_previous_command(text,jsonb) OWNER TO %I',original_owner);
 EXECUTE format('ALTER FUNCTION billing.subscription_display_sources(uuid) OWNER TO %I',original_owner);
 REVOKE ALL ON FUNCTION billing.subscription_display_previous_command(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
END $preserve$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.commerce_command(p_action text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $command$
DECLARE actor uuid:=auth.uid(); rows jsonb; summary jsonb;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('account_subscription_display','admin_subscription_display') THEN
  RETURN billing.subscription_display_previous_command(p_action,p_data);
 END IF;
 PERFORM billing.commerce_assert_identity(actor);
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR p_data<>'{}'::jsonb THEN
  RAISE EXCEPTION 'SUBSCRIPTION_DISPLAY_INVALID_INPUT';
 END IF;
 IF p_action='admin_subscription_display' THEN
  IF NOT coalesce(public.has_role(actor,'admin'::public.app_role),false) THEN
   RAISE EXCEPTION 'SUBSCRIPTION_DISPLAY_ADMIN_REQUIRED' USING ERRCODE='42501';
  END IF;
  WITH src AS MATERIALIZED (SELECT owner_id,item FROM billing.subscription_display_sources(NULL)),
  active AS (SELECT * FROM src WHERE (item->>'eligible')::boolean),
  areas AS (SELECT item->>'area' AS area,count(DISTINCT owner_id) AS accounts,count(*) AS sources
   FROM active WHERE (item->>'paid')::boolean GROUP BY item->>'area'),
  kinds AS (SELECT item->>'kind' AS kind,count(*) AS sources FROM active GROUP BY item->>'kind')
  SELECT jsonb_build_object('activePaidAccounts',(SELECT count(DISTINCT owner_id) FROM active WHERE (item->>'paid')::boolean),
   'activePaidSources',(SELECT count(*) FROM active WHERE (item->>'paid')::boolean),
   'activeInvitationSources',(SELECT count(*) FROM active WHERE item->>'kind'='invitation'),
   'activeGrantSources',(SELECT count(*) FROM active WHERE item->>'kind' IN ('complimentary','family_grant','temporary_grant')),
   'activeLifetimeSources',(SELECT count(*) FROM active WHERE item->>'kind'='lifetime'),
   'byArea',coalesce((SELECT jsonb_object_agg(area,jsonb_build_object('accounts',accounts,'sources',sources)) FROM areas),'{}'),
   'byKind',coalesce((SELECT jsonb_object_agg(kind,sources) FROM kinds),'{}')) INTO summary;
  RETURN jsonb_build_object('actorUserId',actor,'serverTime',now(),'summary',summary);
 END IF;
 SELECT coalesce(jsonb_agg(item ORDER BY item->>'kind',item->>'sourceKey'),'[]') INTO rows
 FROM billing.subscription_display_sources(actor);
 RETURN jsonb_build_object('actorUserId',actor,'serverTime',now(),'sources',rows);
END $command$;
-- CREATE OR REPLACE preserves original owner and ACL. Only authenticated is
-- intended as the public caller; private aliases stay unavailable to all roles.
REVOKE ALL ON FUNCTION public.commerce_command(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.commerce_command(text,jsonb) TO authenticated;
