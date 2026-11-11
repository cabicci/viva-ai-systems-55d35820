-- Append campaign days to confirmed, externally paid manual subscriptions once.
CREATE TABLE billing.campaign_manual_time_awards (
 window_id uuid NOT NULL REFERENCES billing.free_access_windows(id),
 entitlement_id uuid NOT NULL REFERENCES billing.commerce_entitlements(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 package text NOT NULL,
 old_end timestamptz NOT NULL,
 new_end timestamptz NOT NULL CHECK(new_end>old_end),
 awarded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (window_id,user_id,package)
);
ALTER TABLE billing.campaign_manual_time_awards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.campaign_manual_time_awards FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX campaign_manual_time_entitlement ON billing.campaign_manual_time_awards(entitlement_id,old_end);
--> statement-breakpoint

CREATE FUNCTION public.award_campaign_manual_time() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidate record; window_row billing.free_access_windows%ROWTYPE;
 paid_entitlement billing.commerce_entitlements%ROWTYPE;
 v_end timestamptz; awarded integer:=0;
BEGIN
 PERFORM billing.commercial_require_service();
 -- Preserve the lock order across calls; one worker handles one bounded batch.
 IF NOT pg_try_advisory_xact_lock(hashtextextended('campaign-manual-time',0)) THEN
  RETURN jsonb_build_object('awarded',0);
 END IF;
 FOR candidate IN
  SELECT DISTINCT w.id AS window_id,e.user_id,e.package
  FROM billing.free_access_windows w
  JOIN billing.commerce_entitlements e ON e.starts_at<w.ends_at AND e.ends_at>w.starts_at
   AND e.starts_at<=now() AND e.ends_at>now() AND e.revoked_at IS NULL
  JOIN billing.commerce_orders o ON o.id=e.order_id AND o.user_id=e.user_id
  WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at
   AND o.confirmed_at IS NOT NULL AND o.review_status='confirmed' AND o.final_minor>0
   AND billing.commercial_account_allowed(e.user_id)
   AND NOT EXISTS(SELECT 1 FROM billing.campaign_manual_time_awards a
    WHERE a.window_id=w.id AND a.user_id=e.user_id AND a.package=e.package)
  ORDER BY e.user_id,e.package,w.id LIMIT 40
 LOOP
  PERFORM billing.commercial_lock(candidate.user_id);
  SELECT * INTO window_row FROM billing.free_access_windows WHERE id=candidate.window_id FOR SHARE;
  IF NOT window_row.enabled OR now()<window_row.starts_at OR now()>=window_row.ends_at
   OR NOT billing.commercial_account_allowed(candidate.user_id) THEN CONTINUE; END IF;
  -- Start with a confirmed paid entitlement covering now. A prepaid extension
  -- that follows it keeps its own paid days; append the bonus after the chain.
  WITH RECURSIVE paid AS (
   SELECT a.id,a.starts_at,a.ends_at FROM billing.commerce_entitlements a
   JOIN billing.commerce_orders o ON o.id=a.order_id AND o.user_id=a.user_id
   WHERE a.user_id=candidate.user_id AND a.package=candidate.package AND a.revoked_at IS NULL
   AND o.confirmed_at IS NOT NULL AND o.review_status='confirmed' AND o.final_minor>0
  ), contiguous AS (
   SELECT * FROM paid WHERE starts_at<=now() AND ends_at>now()
   UNION
   SELECT p.* FROM contiguous c JOIN paid p ON p.starts_at<=c.ends_at AND p.ends_at>c.ends_at
  )
  SELECT a.* INTO paid_entitlement FROM billing.commerce_entitlements a JOIN contiguous c USING(id)
  ORDER BY c.ends_at DESC,c.id LIMIT 1 FOR UPDATE OF a;
  IF NOT FOUND THEN CONTINUE; END IF;
  v_end:=paid_entitlement.ends_at+(window_row.ends_at-window_row.starts_at);
  INSERT INTO billing.campaign_manual_time_awards(window_id,entitlement_id,user_id,package,old_end,new_end)
  VALUES(window_row.id,paid_entitlement.id,paid_entitlement.user_id,paid_entitlement.package,paid_entitlement.ends_at,v_end)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN CONTINUE; END IF;
  UPDATE billing.commerce_entitlements SET ends_at=v_end WHERE id=paid_entitlement.id;
  awarded:=awarded+1;
 END LOOP;
 RETURN jsonb_build_object('awarded',awarded);
END $$;
REVOKE ALL ON FUNCTION public.award_campaign_manual_time() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.award_campaign_manual_time() TO service_role;
--> statement-breakpoint

-- Gift days extend access without creating another monthly question renewal.
DO $preserve$
DECLARE definition text; prefix text:='CREATE OR REPLACE FUNCTION billing.assistant_source_specs(';
BEGIN
 definition:=pg_get_functiondef('billing.assistant_source_specs(uuid,text,text,uuid,timestamptz)'::regprocedure);
 IF left(definition,length(prefix))<>prefix OR position('billing.free_access_question_specs' IN definition)=0
 THEN RAISE EXCEPTION 'CAMPAIGN_MANUAL_QUESTION_BASELINE_CHANGED'; END IF;
 EXECUTE 'CREATE FUNCTION billing.campaign_prior_assistant_sources('||substr(definition,length(prefix)+1);
END $preserve$;
REVOKE ALL ON FUNCTION billing.campaign_prior_assistant_sources(uuid,text,text,uuid,timestamptz)
 FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION billing.assistant_source_specs(p_user uuid,p_area text,p_course text,p_child uuid,p_at timestamptz)
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units integer,recurring boolean,per_lesson integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.source_key,s.anchor,least(s.valid_until,paid.original_end),s.units,s.recurring,s.per_lesson
 FROM billing.campaign_prior_assistant_sources(p_user,p_area,p_course,p_child,p_at) s
 LEFT JOIN LATERAL (
  SELECT min(a.old_end) AS original_end FROM billing.campaign_manual_time_awards a
  WHERE a.user_id=p_user AND a.entitlement_id=CASE WHEN s.source_key LIKE 'commerce:%'
   THEN split_part(s.source_key,':',2)::uuid END
 ) paid ON true
 WHERE paid.original_end IS NULL OR p_at<paid.original_end
$$;
