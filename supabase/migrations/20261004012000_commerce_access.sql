BEGIN;
CREATE TABLE billing.commerce_lesson_catalog(lesson_id text PRIMARY KEY,path_id text NOT NULL);
ALTER TABLE billing.commerce_lesson_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.commerce_lesson_catalog FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO billing.commerce_lesson_catalog(lesson_id,path_id) VALUES
 ('intro-m1-l1-what-is-ai','intro'),
 ('intro-m1-l2-first-prompt','intro'),
 ('intro-m1-l3-setup-your-ai','intro'),
 ('intro-m1-l4-ai-can-cannot','intro'),
 ('intro-m1-l5-ai-vs-software','intro'),
 ('intro-m1-l6-learn-without-fear','intro'),
 ('intro-m1-l7-choose-your-path','intro'),
 ('business-m1-l1-from-decisions-to-leadership','business'),
 ('business-m1-l2-reactive-vs-proactive','business'),
 ('business-m2-l1-customer-lifecycle','business'),
 ('business-m2-l2-build-your-offer','business'),
 ('business-m2-l2-retention-flow','business'),
 ('business-m2-l3-readiness-signals','business'),
 ('business-m3-l1-delegate-or-automate','business'),
 ('business-m3-l2-strategic-operational-admin','business'),
 ('business-m3-l3-system-then-people','business'),
 ('business-m4-l1-premature-scaling','business'),
 ('business-m4-l2-reactive-relapse','business'),
 ('business-m4-l3-weekly-rhythm','business'),
 ('business-m4-l4-full-ecosystem','business'),
 ('creator-m1-l1-why-content','creator'),
 ('creator-m1-l2-attention-economy','creator'),
 ('creator-m2-l1-know-audience','creator'),
 ('creator-m2-l2-content-pillars','creator'),
 ('creator-m3-l1-hook','creator'),
 ('creator-m3-l2-script-structure','creator'),
 ('creator-m3-l3-cta','creator'),
 ('creator-m4-l1-reality-check','creator'),
 ('creator-m4-l2-mobile-shooting','creator'),
 ('creator-m4-l3-ai-writing','creator'),
 ('creator-m5-l1-editing','creator'),
 ('creator-m4-repurposing','creator'),
 ('creator-m5-l2-thumbnails-captions','creator'),
 ('creator-m6-l1-platforms','creator'),
 ('creator-m6-l2-scheduling','creator'),
 ('creator-m6-l3-analytics','creator'),
 ('creator-m6-l4-leads','creator'),
 ('creator-m7-l1-brand-basics','creator'),
 ('creator-m7-l2-grid-consistency','creator'),
 ('analyst-m1-l1-from-automation-to-insight','analyst'),
 ('analyst-m2-l1-feeling-to-question','analyst'),
 ('analyst-m2-l2-right-question-rule','analyst'),
 ('analyst-m3-l1-three-sources','analyst'),
 ('analyst-m3-l2-ai-summarization','analyst'),
 ('analyst-m4-l1-pattern-vs-outlier','analyst'),
 ('analyst-m4-l2-decision-rule','analyst'),
 ('analyst-m5-l1-four-numbers-dashboard','analyst'),
 ('analyst-m4-automated-dashboard','analyst'),
 ('analyst-m5-l2-weekly-review-ritual','analyst'),
 ('analyst-m6-l1-question-mistakes','analyst'),
 ('analyst-m5-ab-testing','analyst'),
 ('analyst-m6-l2-interpretation-mistakes','analyst'),
 ('analyst-m7-l1-from-decisions-to-business','analyst'),
 ('automator-m1-l1-where-you-are','automator'),
 ('automator-m2-l1-systems-view','automator'),
 ('automator-m2-l2-spot-patterns','automator'),
 ('automator-m2-l3-decide-what-to-automate','automator'),
 ('automator-m3-l1-tools-landscape','automator'),
 ('automator-m3-l2-triggers-actions','automator'),
 ('automator-m3-l3-filters-routers','automator'),
 ('automator-m4-l1-connect-database','automator'),
 ('automator-m4-l2-webhooks-api','automator'),
 ('automator-m4-l3-error-handling','automator'),
 ('automator-m3-testing-automation','automator'),
 ('automator-m5-l1-llm-in-flow','automator'),
 ('automator-m5-l2-rag-in-n8n','automator'),
 ('automator-m5-l3-agents','automator'),
 ('automator-m6-l1-lead-capture','automator'),
 ('automator-m6-l2-whatsapp-flow','automator'),
 ('automator-m6-l3-follow-up','automator'),
 ('automator-m7-l1-closing-loop','automator'),
 ('builder-m1-l1-what-is-llm','builder'),
 ('builder-m1-l2-tokens-training','builder'),
 ('builder-m2-l1-prompt-layer','builder'),
 ('builder-m2-l2-instructions-examples','builder'),
 ('builder-m2-l3-style-control','builder'),
 ('builder-m3-l1-context-layer','builder'),
 ('builder-m3-l2-memory-limits','builder'),
 ('builder-m4-l1-parameters','builder'),
 ('builder-m5-l1-transition','builder'),
 ('builder-m5-l2-frontend','builder'),
 ('builder-m5-l3-backend-api','builder'),
 ('builder-m5-l4-database-intro','builder'),
 ('builder-m5-l5-mini-win','builder'),
 ('builder-m6-l1-idea-to-page','builder'),
 ('builder-m6-l2-wireframe','builder'),
 ('builder-m6-l3-first-prompt-to-lovable','builder'),
 ('builder-m6-l4-components-routes','builder'),
 ('builder-m6-l5-iteration','builder'),
 ('builder-m6-l6-debugging','builder'),
 ('builder-m7-l1-tables-columns','builder'),
 ('builder-m7-l2-relations','builder'),
 ('builder-m7-l3-queries','builder'),
 ('builder-m8-l1-sessions-jwt','builder'),
 ('builder-m8-l2-rls','builder'),
 ('builder-m9-l1-rag','builder'),
 ('builder-m9-l2-embeddings','builder'),
 ('builder-m9-l3-agents','builder'),
 ('builder-m10-l1-deploy-domain','builder'),
 ('builder-m10-l2-first-users','builder');
-- Add external entitlements to existing authorization without mutating any
-- Stripe subscription. Clone installed guarded functions before composing.
DO $$ DECLARE r record; v_oid oid; v_definition text; BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('billing','get_entitlement_snapshot','uuid'),('billing','resolve_ai_assistant_limits','uuid'),
 ('public','get_my_billing_access_tier',''),('public','get_my_kids_access_status','')) x(s,n,args)
 LOOP
  v_oid:=to_regprocedure(format('%I.%I(%s)',r.s,r.n,r.args));
  IF v_oid IS NULL THEN RAISE EXCEPTION 'COMMERCE_REQUIRED_ACCESS_FUNCTION_MISSING: %',r.n; END IF;
  v_definition:=pg_get_functiondef(v_oid);
  EXECUTE replace(v_definition,'FUNCTION '||r.s||'.'||r.n||'(','FUNCTION '||r.s||'.commerce_previous_'||r.n||'(');
  EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC,anon,authenticated,service_role',r.s,'commerce_previous_'||r.n,r.args);
 END LOOP;
END $$;
CREATE FUNCTION billing.commerce_account_allowed(p_user uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
 -- Verified identity is enforced when NEW orders/grants/invitations are issued.
 -- Preserve the installed reader's eligibility for pre-existing paid sources.
 IF billing.account_deletion_blocked(p_user)
   OR EXISTS(SELECT 1 FROM billing.subscriptions WHERE user_id=p_user AND access_state='suspended') THEN RETURN false; END IF;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.get_my_billing_access_tier() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_existing text; v_external text; BEGIN
 IF NOT billing.commerce_account_allowed(auth.uid()) THEN RETURN 'free'; END IF;
 v_existing:=public.commerce_previous_get_my_billing_access_tier();
 v_external:=billing.commerce_external_package(auth.uid());
 RETURN CASE WHEN v_existing='pro_plus' OR v_external='pro_plus' THEN 'pro_plus'
   WHEN v_existing='pro' OR v_external='pro' THEN 'pro' ELSE 'free' END;
END $$;
CREATE OR REPLACE FUNCTION billing.get_entitlement_snapshot(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_existing jsonb; v_package text; v_policy billing.entitlement_policy_versions%ROWTYPE;
 v_lessons text[]; v_expiry timestamptz; v_count integer; BEGIN
 -- Delegate identity/ownership and previous snapshot validity checks first.
 v_existing:=billing.commerce_previous_get_entitlement_snapshot(p_user_id);
 IF NOT billing.commerce_account_allowed(p_user_id) THEN RETURN jsonb_build_object('paid_content_entitled',false,'denial_reason_code','SUSPENDED'); END IF;
 v_package:=billing.commerce_external_package(p_user_id);
 IF v_package IS NULL THEN RETURN v_existing; END IF;
 IF coalesce((v_existing->>'paid_content_entitled')::boolean,false) AND
   (v_existing->>'plan_key'='pro_plus' OR (v_package='pro' AND coalesce((v_existing->>'builder_access')::boolean,false))) THEN RETURN v_existing; END IF;
 SELECT count(*) INTO v_count FROM billing.entitlement_policy_versions WHERE policy_key=v_package AND status='published' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now());
 IF v_count<>1 THEN RAISE EXCEPTION 'COMMERCE_ACCESS_POLICY_UNAVAILABLE'; END IF;
 SELECT * INTO v_policy FROM billing.entitlement_policy_versions WHERE policy_key=v_package AND status='published' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now());
 SELECT array_agg(lesson_id ORDER BY lesson_id) INTO v_lessons FROM billing.commerce_lesson_catalog WHERE v_package='pro_plus' OR path_id<>'builder';
 IF cardinality(v_lessons) IS DISTINCT FROM (CASE v_package WHEN 'pro' THEN 71 ELSE 100 END) THEN RAISE EXCEPTION 'COMMERCE_LESSON_CONTRACT_MISMATCH'; END IF;
 SELECT max(ends_at) INTO v_expiry FROM billing.commerce_entitlements WHERE user_id=p_user_id AND package=v_package AND revoked_at IS NULL AND starts_at<=now() AND ends_at>now();
 RETURN jsonb_build_object('user_id',p_user_id,'plan_key',v_package,'access_state','paid_active','paid_content_entitled',true,'denial_reason_code',NULL,
  'builder_access',v_package='pro_plus' AND v_policy.builder_access,'video_access',v_policy.video_access,
  'rag_enabled',v_policy.rag_enabled,'mission_evaluation_eligible',v_policy.mission_evaluation_enabled,'reveal_answer_eligible',v_policy.reveal_answer_enabled,'wow_path_eligible',v_policy.wow_path_enabled,
  'lessons',jsonb_build_object('entitled_lesson_ids',to_jsonb(v_lessons),'entitled_lesson_count',cardinality(v_lessons),'mode','explicit_list'),
  'assistant_runtime',jsonb_build_object('general_monthly_quota',v_policy.assistant_runtime_general_monthly_quota,'per_lesson_quota',v_policy.assistant_runtime_per_lesson_quota),
  'expires_at',least(v_expiry,now()+interval '60 seconds'),'generated_at',now(),'source','external');
END $$;
-- Keep the unmodified prior implementation for compatibility. Compose a
-- private reader that considers only presently valid paid Stripe periods.
DO $$ DECLARE v_definition text; BEGIN
 v_definition:=pg_get_functiondef('billing.commerce_previous_resolve_ai_assistant_limits(uuid)'::regprocedure);
 IF strpos(v_definition,'WHERE s.user_id = p_user_id')=0 THEN RAISE EXCEPTION 'COMMERCE_EXISTING_QUOTA_SOURCE_MISMATCH'; END IF;
 v_definition:=replace(v_definition,'FUNCTION billing.commerce_previous_resolve_ai_assistant_limits(','FUNCTION billing.commerce_valid_existing_ai_limits(');
 EXECUTE replace(v_definition,'WHERE s.user_id = p_user_id','WHERE s.user_id = p_user_id AND s.access_state IN (''paid_active'',''canceled_at_period_end'') AND s.current_period_end>now() AND (s.current_period_start IS NULL OR s.current_period_start<=now())');
END $$;
REVOKE ALL ON FUNCTION billing.commerce_valid_existing_ai_limits(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION billing.resolve_ai_assistant_limits(p_user_id uuid)
RETURNS TABLE(general_monthly_limit integer,per_lesson_limit integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
DECLARE v_package text; v_prior record; v_policy billing.entitlement_policy_versions%ROWTYPE; BEGIN
 IF NOT billing.commerce_account_allowed(p_user_id) THEN RETURN QUERY SELECT 0,NULL::integer; RETURN; END IF;
 v_package:=billing.commerce_external_package(p_user_id);
 IF v_package IS NULL THEN SELECT * INTO v_prior FROM billing.commerce_previous_resolve_ai_assistant_limits(p_user_id); RETURN QUERY SELECT v_prior.general_monthly_limit,v_prior.per_lesson_limit; RETURN; END IF;
 SELECT * INTO STRICT v_policy FROM billing.entitlement_policy_versions WHERE policy_key=v_package AND status='published' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now());
 SELECT * INTO v_prior FROM billing.commerce_valid_existing_ai_limits(p_user_id);
 -- Overlaps use the largest valid allowance, not a sum of purchases/grants.
 RETURN QUERY SELECT greatest(coalesce(v_prior.general_monthly_limit,0),coalesce(v_policy.assistant_runtime_general_monthly_quota,0)),
   CASE WHEN v_prior.general_monthly_limit>0 AND v_prior.per_lesson_limit IS NULL THEN NULL ELSE greatest(coalesce(v_prior.per_lesson_limit,0),coalesce(v_policy.assistant_runtime_per_lesson_quota,0)) END;
END $$;
-- Retain LC09 wrapper, identity checks and quota ledgers; extend only the gate
-- within the installed private implementation used by that wrapper.
DO $$ DECLARE v_definition text; v_old text:= 'IF NOT (v_paid OR v_admin_grant) THEN'; BEGIN
 v_definition:=pg_get_functiondef('billing.reserve_learner_ai_access(uuid,text,text,uuid,integer,text)'::regprocedure);
 IF strpos(v_definition,v_old)=0 THEN RAISE EXCEPTION 'COMMERCE_QUOTA_GATE_SOURCE_MISMATCH'; END IF;
 EXECUTE replace(v_definition,v_old,'IF NOT (v_paid OR v_admin_grant OR (billing.commerce_account_allowed(p_user_id) AND billing.commerce_external_package(p_user_id) IS NOT NULL)) THEN');
END $$;
CREATE OR REPLACE FUNCTION public.kids_can_access_lesson(requested_profile uuid,requested_level text,requested_lesson integer,requested_locale text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.commerce_account_allowed(auth.uid()) AND public.kids_parent_can_manage_profiles()
 AND public.kids_profile_has_consent(requested_profile)
 AND EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data AND lesson_access_enabled)
 AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=requested_profile AND parent_id=auth.uid() AND level_id=requested_level)
 AND EXISTS(SELECT 1 FROM public.kids_content_approvals WHERE level_id=requested_level AND lesson_number=requested_lesson AND locale=requested_locale)
 AND (requested_lesson BETWEEN 1 AND 2 OR EXISTS(SELECT 1 FROM public.kids_family_entitlements WHERE parent_id=auth.uid() AND active_from<=now() AND active_until>now())
   OR (EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled) AND EXISTS(SELECT 1 FROM billing.commerce_entitlements WHERE user_id=auth.uid() AND package='kids' AND starts_at<=now() AND ends_at>now() AND revoked_at IS NULL)));
$$;
CREATE OR REPLACE FUNCTION public.get_my_kids_access_status() RETURNS TABLE(access_source text,active_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=billing,public,pg_temp AS $$
BEGIN
 IF NOT billing.commerce_account_allowed(auth.uid()) THEN RETURN; END IF;
 RETURN QUERY SELECT sources.access_source,sources.active_until FROM (SELECT * FROM public.commerce_previous_get_my_kids_access_status() UNION ALL SELECT CASE WHEN e.grant_id IS NULL THEN 'external_payment' ELSE 'complimentary' END,e.ends_at FROM billing.commerce_entitlements e
 WHERE EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled) AND user_id=auth.uid() AND package='kids' AND starts_at<=now() AND ends_at>now() AND revoked_at IS NULL) sources ORDER BY sources.active_until DESC LIMIT 1;
END $$;
REVOKE ALL ON FUNCTION billing.commerce_account_allowed(uuid) FROM PUBLIC,anon,authenticated,service_role;

COMMIT;
