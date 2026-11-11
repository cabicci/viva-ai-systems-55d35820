-- Freeze the paid clock during a free-access window. Keep historical awards
-- and Stripe's already reviewed schedule/settlement mechanics intact.
ALTER TABLE billing.campaign_manual_time_awards
 ADD COLUMN freeze_from timestamptz,
 ADD COLUMN freeze_until timestamptz,
 ADD COLUMN frozen_end timestamptz,
 ADD COLUMN frozen_entitlement_id uuid REFERENCES billing.commerce_entitlements(id) ON DELETE CASCADE;
ALTER TABLE billing.campaign_stripe_renewals ADD COLUMN freeze_from timestamptz;
CREATE INDEX campaign_manual_frozen_term ON billing.campaign_manual_time_awards(user_id,frozen_entitlement_id);
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.award_campaign_manual_time() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidate record; window_row billing.free_access_windows%ROWTYPE; term_ids uuid[];
 first_term uuid; last_term uuid; frozen_from timestamptz; first_end timestamptz; original_end timestamptz;
 paused_for interval; awarded integer:=0;
BEGIN
 PERFORM billing.commercial_require_service();
 IF NOT pg_try_advisory_xact_lock(hashtextextended('campaign-manual-time',0)) THEN
  RETURN jsonb_build_object('awarded',0);
 END IF;
 FOR candidate IN
  SELECT DISTINCT w.id AS window_id,e.user_id,e.package
  FROM billing.free_access_windows w
  JOIN billing.commerce_entitlements e ON e.starts_at<w.ends_at AND e.ends_at>w.starts_at
   AND e.starts_at<=now() AND e.ends_at>now() AND e.revoked_at IS NULL
  JOIN billing.commerce_orders o ON o.id=e.order_id AND o.user_id=e.user_id
  WHERE w.enabled AND w.stripe_renewal_eligible AND w.starts_at<=now()
   AND o.confirmed_at IS NOT NULL AND o.confirmed_at<w.ends_at AND o.review_status='confirmed' AND o.final_minor>0
   AND billing.commercial_account_allowed(e.user_id)
   AND NOT EXISTS(SELECT 1 FROM billing.campaign_manual_time_awards a
    WHERE a.user_id=e.user_id AND a.package=e.package AND (a.window_id=w.id
     OR (a.freeze_from<w.ends_at AND w.starts_at<a.freeze_until)))
  ORDER BY e.user_id,e.package,w.id LIMIT 40
 LOOP
  PERFORM billing.commercial_lock(candidate.user_id);
  SELECT * INTO window_row FROM billing.free_access_windows WHERE id=candidate.window_id FOR SHARE;
  IF NOT FOUND OR NOT window_row.enabled OR NOT window_row.stripe_renewal_eligible OR now()<window_row.starts_at
   OR NOT billing.commercial_account_allowed(candidate.user_id)
   OR EXISTS(SELECT 1 FROM billing.campaign_manual_time_awards a WHERE a.user_id=candidate.user_id
    AND a.package=candidate.package AND (a.window_id=window_row.id
      OR (a.freeze_from<window_row.ends_at AND window_row.starts_at<a.freeze_until)))
  THEN CONTINUE; END IF;
  -- Move the boundaries between already paid contiguous terms as well as the
  -- final expiry, keeping each term's purchased days and its content grants.
  WITH RECURSIVE paid AS (
   SELECT e.id,e.starts_at,e.ends_at,o.confirmed_at FROM billing.commerce_entitlements e
   JOIN billing.commerce_orders o ON o.id=e.order_id AND o.user_id=e.user_id
   WHERE e.user_id=candidate.user_id AND e.package=candidate.package AND e.revoked_at IS NULL
    AND o.confirmed_at IS NOT NULL AND o.review_status='confirmed' AND o.final_minor>0
  ), first AS (
   SELECT * FROM paid WHERE starts_at<=now() AND ends_at>now()
    AND greatest(window_row.starts_at,starts_at,confirmed_at)<least(window_row.ends_at,ends_at)
   ORDER BY starts_at,id LIMIT 1
  ), chain AS (
   SELECT id,starts_at,ends_at FROM first
   UNION
   SELECT p.id,p.starts_at,p.ends_at FROM chain c JOIN paid p ON p.starts_at=c.ends_at
  )
  SELECT ARRAY(SELECT id FROM chain ORDER BY starts_at,id),
   (SELECT id FROM first),
   (SELECT greatest(window_row.starts_at,starts_at,confirmed_at) FROM first),
   (SELECT ends_at FROM first),
   (SELECT id FROM chain ORDER BY ends_at DESC,id LIMIT 1),
   (SELECT max(ends_at) FROM chain)
   INTO term_ids,first_term,frozen_from,first_end,last_term,original_end;
  IF first_term IS NULL THEN CONTINUE; END IF;
  paused_for:=window_row.ends_at-frozen_from;
  INSERT INTO billing.campaign_manual_time_awards(
   window_id,entitlement_id,user_id,package,old_end,new_end,freeze_from,freeze_until,frozen_end,frozen_entitlement_id
  ) VALUES(window_row.id,last_term,candidate.user_id,candidate.package,original_end,
    original_end+paused_for,frozen_from,window_row.ends_at,first_end,first_term)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN CONTINUE; END IF;
  UPDATE billing.commerce_entitlements SET
   starts_at=CASE WHEN id=first_term THEN starts_at ELSE starts_at+paused_for END,
   ends_at=ends_at+paused_for
  WHERE id=ANY(term_ids);
  awarded:=awarded+1;
 END LOOP;
 RETURN jsonb_build_object('awarded',awarded);
END $$;
--> statement-breakpoint

-- A Stripe phase still moves the next charge by the exact paused duration.
-- The platform uses the campaign interval, independently of the provider phase.
DO $stripe$
DECLARE d text; old text;
BEGIN
 d:=pg_get_functiondef('public.claim_campaign_stripe_renewals()'::regprocedure);
 old:='invoice_id,campaign_end,paid_end,gift_end)';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_CLAIM_COLUMNS'; END IF;
 d:=replace(d,old,'invoice_id,campaign_end,paid_end,gift_end,freeze_from,paid_start)');
 old:='date_trunc(''second'',p.paid_end+(w.ends_at-w.starts_at))';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_CLAIM_DATES'; END IF;
 d:=replace(d,old,'date_trunc(''second'',p.paid_end+(w.ends_at-greatest(w.starts_at,p.period_start))), greatest(w.starts_at,p.period_start),p.period_start');
 old:='win.ends_at-win.starts_at>=interval ''1 second''';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_MINIMUM_DATE'; END IF;
 EXECUTE replace(d,old,'win.ends_at-greatest(win.starts_at,p.period_start)>=interval ''1 second''');
 d:=pg_get_functiondef('public.step_campaign_stripe_renewal(uuid,uuid,text,text,text,bigint,text)'::regprocedure);
 old:='date_trunc(''second'',a.paid_end+(w.ends_at-w.starts_at))=a.gift_end';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_STEP_DATES'; END IF;
 d:=replace(d,old,'date_trunc(''second'',a.paid_end+(w.ends_at-coalesce(a.freeze_from,w.starts_at)))=a.gift_end');
 old:='AND p.invoice_id=a.invoice_id AND p.paid_end=a.paid_end)';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_STEP_EVIDENCE'; END IF;
 d:=replace(d,old,'AND p.invoice_id=a.invoice_id AND p.paid_end=a.paid_end AND (a.freeze_from IS NULL OR (p.period_start=a.paid_start AND a.freeze_from=greatest(p.period_start,(SELECT starts_at FROM billing.free_access_windows WHERE id=a.window_id)))))');
 old:='OR (a.schedule_id IS NOT NULL AND (a.schedule_id,a.price_id,a.paid_start)';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_BIND_TERM'; END IF;
 EXECUTE replace(d,old,'OR (a.freeze_from IS NOT NULL AND to_timestamp(p_start) IS DISTINCT FROM a.paid_start)
   OR (a.schedule_id IS NOT NULL AND (a.schedule_id,a.price_id,a.paid_start)');
END $stripe$;
--> statement-breakpoint

-- Source keys preserve the original allowance identity. A fixed or monthly
-- allowance advances by paid time, while independent top-ups stay independent.
CREATE FUNCTION billing.campaign_paid_clock(
 p_user uuid,p_source text,p_anchor timestamptz,p_area text,p_course text,p_at timestamptz
) RETURNS TABLE(paused boolean,elapsed interval,stripe_until timestamptz,paid_until timestamptz,stripe_paid_end timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH windows AS (
  SELECT w.*,CASE p_area
   WHEN 'ai' THEN 'ai'=ANY(w.targets)
   WHEN 'kids' THEN 'kids'=ANY(w.targets)
   WHEN 'academic' THEN w.targets&&ARRAY['academic:'||p_course,'curriculum:academic:'||p_course]
   WHEN 'technical' THEN w.targets&&ARRAY['technical:'||p_course,'curriculum:technical:'||p_course]
   ELSE false END AS covers_paid_scope
  FROM billing.free_access_windows w
 ), terms AS (
  SELECT a.window_id,a.freeze_from,a.freeze_until AS until_at,NULL::timestamptz AS stripe_until,
   a.frozen_end AS original_end,true AS booked
  FROM billing.campaign_manual_time_awards a
  JOIN billing.commerce_entitlements e ON e.id=a.frozen_entitlement_id AND e.user_id=a.user_id
  WHERE a.user_id=p_user AND a.freeze_from IS NOT NULL AND p_anchor=e.starts_at
   AND split_part(p_source,':',1)='commerce' AND split_part(p_source,':',2)=e.id::text
  UNION ALL
  SELECT a.window_id,a.freeze_from,a.campaign_end,a.gift_end,a.paid_end,a.state='scheduled'
  FROM billing.campaign_stripe_renewals a
  WHERE a.user_id=p_user AND a.freeze_from IS NOT NULL AND a.paid_start=p_anchor
   AND a.state IN ('pending','scheduled')
   AND CASE a.scope
    WHEN 'core' THEN p_source='ai:'||a.internal_id
    WHEN 'kids' THEN split_part(p_source,':',1)='kids' AND split_part(p_source,':',2)=p_user::text
      AND EXISTS(SELECT 1 FROM public.kids_family_entitlements e WHERE e.parent_id=p_user
       AND e.entitlement_reference='stripe-live:'||a.subscription_id)
    ELSE split_part(p_source,':',1)=a.scope AND split_part(p_source,':',2)=a.subscription_id END
 ), bounds AS (
  SELECT t.*,CASE WHEN w.covers_paid_scope THEN
   least(t.until_at,w.ends_at,stop.ended_at,CASE WHEN NOT w.enabled THEN w.updated_at END) ELSE t.freeze_from END AS resume_at
  FROM terms t JOIN windows w ON w.id=t.window_id
  LEFT JOIN LATERAL (
   SELECT min(a.created_at) AS ended_at
   FROM billing.free_access_window_audit a WHERE a.window_id=t.window_id AND a.created_at>=t.freeze_from
    AND (a.details->'after'->>'enabled'='false'
      OR ((a.details->'after'->>'ends_at')::timestamptz<t.until_at AND (a.details->'after'->>'ends_at')::timestamptz<=a.created_at))
  ) stop ON true
 ), prebooking AS (
  -- Protect the paid balance immediately, even between the start and the next
  -- five-minute worker tick. Only a booked interval shifts the later clock.
  SELECT 1 FROM windows w
  WHERE w.covers_paid_scope AND w.enabled AND w.stripe_renewal_eligible AND w.starts_at<=p_at AND p_at<w.ends_at
   AND NOT EXISTS(SELECT 1 FROM terms t WHERE t.window_id=w.id)
   AND (
    (split_part(p_source,':',1)='commerce' AND EXISTS(
      SELECT 1 FROM billing.commerce_entitlements e JOIN billing.commerce_orders o ON o.id=e.order_id AND o.user_id=e.user_id
      WHERE e.user_id=p_user AND e.id::text=split_part(p_source,':',2) AND e.starts_at=p_anchor
       AND e.revoked_at IS NULL AND e.starts_at<=p_at AND e.ends_at>p_at
       AND o.confirmed_at<=p_at AND o.review_status='confirmed' AND o.final_minor>0
       AND NOT EXISTS(SELECT 1 FROM billing.campaign_manual_time_awards a
        WHERE a.window_id=w.id AND a.user_id=e.user_id AND a.package=e.package)
    ))
    OR (split_part(p_source,':',1) IN ('ai','kids','academic','technical') AND billing.stripe_live_enabled() AND EXISTS(
      SELECT 1 FROM billing.campaign_stripe_paid p
      WHERE p.user_id=p_user AND p.period_start=p_anchor AND p.paid_end>p_at
       AND p.invoice_id IS NOT NULL AND NOT billing.stripe_live_hold_exists(p.subscription_id,p_user)
       AND NOT EXISTS(SELECT 1 FROM billing.campaign_stripe_renewals a WHERE a.subscription_id=p.subscription_id
        AND (a.window_id=w.id OR (a.state IN ('pending','scheduled') AND a.gift_end>p_at)))
       AND CASE p.scope WHEN 'core' THEN p_source='ai:'||p.internal_id
        WHEN 'kids' THEN split_part(p_source,':',1)='kids' AND split_part(p_source,':',2)=p_user::text
        ELSE split_part(p_source,':',1)=p.scope AND split_part(p_source,':',2)=p.subscription_id END
    ))
   )
  LIMIT 1
 ), accumulated AS (
  SELECT coalesce(bool_or(p_at>=b.freeze_from AND p_at<b.resume_at),false) AS paused,
   coalesce(sum(greatest(interval '0',least(p_at,b.resume_at)-b.freeze_from))
     FILTER(WHERE b.booked AND p_at>=b.resume_at),interval '0') AS elapsed,
   max(b.stripe_until) FILTER(WHERE b.booked) AS stripe_until,
   min(b.original_end) FILTER(WHERE b.booked) AS original_end,
   min(b.original_end) FILTER(WHERE b.booked AND b.stripe_until IS NOT NULL) AS stripe_paid_end
  FROM bounds b
 )
 SELECT a.paused OR EXISTS(SELECT 1 FROM prebooking),a.elapsed,a.stripe_until,
  a.original_end+a.elapsed,a.stripe_paid_end
 FROM accumulated a
$$;

REVOKE ALL ON FUNCTION billing.campaign_paid_clock(uuid,text,timestamptz,text,text,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION billing.assistant_source_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.source_key,s.anchor,least(greatest(s.valid_until,c.stripe_until),c.paid_until,m.old_end,g.paid_end),s.units,
   CASE WHEN g.paid_end IS NOT NULL THEN g.paid_end-s.anchor>interval '32 days'
        WHEN c.stripe_paid_end IS NOT NULL THEN c.stripe_paid_end-s.anchor>interval '32 days'
        ELSE s.recurring END,s.per_lesson
 FROM billing.campaign_prior_assistant_sources(p_user,p_area,p_course,p_child,p_at) s
 CROSS JOIN LATERAL billing.campaign_paid_clock(p_user,s.source_key,s.anchor,p_area,p_course,p_at) c
 LEFT JOIN LATERAL (
  SELECT min(a.old_end) AS old_end FROM billing.campaign_manual_time_awards a WHERE a.user_id=p_user
   AND a.freeze_from IS NULL AND split_part(s.source_key,':',1)='commerce' AND a.entitlement_id::text=split_part(s.source_key,':',2)
 ) m ON true
 LEFT JOIN LATERAL (
  SELECT a.paid_end FROM billing.campaign_stripe_renewals a
  WHERE a.user_id=p_user AND a.freeze_from IS NULL AND a.activated_at IS NOT NULL AND a.gift_end=s.valid_until AND a.paid_start=s.anchor
   AND s.source_key=CASE a.scope WHEN 'core' THEN 'ai:'||a.internal_id WHEN 'kids' THEN 'kids:'||p_user||':'||p_child
    ELSE a.scope||':'||a.subscription_id||':'||p_course END LIMIT 1
 ) g ON true
 WHERE NOT c.paused AND (c.paid_until IS NULL OR p_at<c.paid_until) AND (m.old_end IS NULL OR p_at<m.old_end) AND (g.paid_end IS NULL OR p_at<g.paid_end)
$$;
--> statement-breakpoint

-- Preserve used/reserved counts and use the same paid time in balance,
-- reservation and fallback settlement. Only the end of the existing row moves.
DO $ledger$
DECLARE d text; old text; replacement text; r record;
BEGIN
 d:=pg_get_functiondef('billing.assistant_sync_periods(uuid,text,text,uuid)'::regprocedure);
 old:='w record; imported integer;';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_SYNC_DECLARATION'; END IF;
 d:=replace(d,old,'w record; paid_elapsed interval; imported integer;');
 old:='IF s.recurring THEN SELECT * INTO w FROM billing.assistant_month_window(s.anchor,now());';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_SYNC_WINDOW'; END IF;
 d:=replace(d,old,'SELECT elapsed INTO paid_elapsed FROM billing.campaign_paid_clock(p_user,s.source_key,s.anchor,p_area,p_course,now());
  IF s.recurring THEN SELECT starts_at,ends_at+paid_elapsed AS ends_at INTO w FROM billing.assistant_month_window(s.anchor,now()-paid_elapsed);');
 old:='RETURNING id INTO inserted;';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_SYNC_UPSERT'; END IF;
 d:=replace(d,old,old||$shift$
  IF paid_elapsed>interval '0' THEN
   UPDATE billing.assistant_allowance_periods SET ends_at=least(w.ends_at,s.valid_until)
   WHERE user_id=p_user AND source_key=s.source_key AND starts_at=w.starts_at
    AND ends_at IS DISTINCT FROM least(w.ends_at,s.valid_until);
  END IF;
$shift$);
 EXECUTE d;
 old:='billing.assistant_period_start(s.anchor,s.recurring,now())';
 FOR r IN SELECT * FROM (VALUES
  ('billing.assistant_balance(uuid,text,text,uuid)','p_user','p_area','p_course'),
  ('public.reserve_assistant_question(uuid,text,text,text,text,uuid,uuid,text)','p_user_id','p_area','p_course'),
  ('public.settle_assistant_question(uuid,uuid,text,text,jsonb)','p_user_id','r.area','r.course')
 ) AS x(signature,actor,area,course) LOOP
  d:=pg_get_functiondef(r.signature::regprocedure);
  IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_LEDGER_MATCH: %',r.signature; END IF;
  replacement:='billing.assistant_period_start(s.anchor,s.recurring,now()-(SELECT elapsed FROM billing.campaign_paid_clock('||r.actor||',s.source_key,s.anchor,'||r.area||','||r.course||',now())))';
  EXECUTE replace(d,old,replacement);
 END LOOP;
 d:=pg_get_functiondef('public.settle_assistant_question(uuid,uuid,text,text,jsonb)'::regprocedure);
 old:='SELECT source_key INTO source FROM billing.assistant_allowance_periods WHERE id=r.allowance_id;';
 IF (length(d)-length(replace(d,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'CAMPAIGN_FREEZE_SETTLEMENT_SOURCE'; END IF;
 EXECUTE replace(d,old,old||$settle$
   IF EXISTS(
    SELECT 1 FROM billing.campaign_prior_assistant_sources(p_user_id,r.area,r.course,r.child_id,now()) s
    CROSS JOIN LATERAL billing.campaign_paid_clock(p_user_id,s.source_key,s.anchor,r.area,r.course,now()) c
    WHERE s.source_key=source AND c.paused
   ) THEN RAISE EXCEPTION 'ASSISTANT_QUOTA_SOURCE_EXPIRED'; END IF;
$settle$);
END $ledger$;
