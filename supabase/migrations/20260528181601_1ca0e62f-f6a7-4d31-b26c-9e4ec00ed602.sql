
-- =====================================================
-- Admin Stats: SQL-side aggregation RPCs
-- =====================================================

-- ---------- get_admin_insights ----------
CREATE OR REPLACE FUNCTION public.get_admin_insights()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path_distribution jsonb;
  v_drop_off jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.active_users DESC), '[]'::jsonb)
    INTO v_path_distribution
  FROM (
    SELECT
      COALESCE(split_part(lesson_id, '-', 1), 'unknown') AS path_id,
      COUNT(*) FILTER (WHERE status = 'completed')        AS completed_lessons,
      COUNT(DISTINCT user_id)                             AS active_users
    FROM public.user_lesson_status
    GROUP BY 1
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.started_count DESC), '[]'::jsonb)
    INTO v_drop_off
  FROM (
    SELECT
      lesson_id,
      COUNT(*) AS started_count
    FROM public.user_lesson_status
    WHERE status <> 'completed'
    GROUP BY lesson_id
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) d;

  RETURN jsonb_build_object(
    'path_distribution', v_path_distribution,
    'drop_off_lessons',  v_drop_off
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_insights() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_admin_insights() TO authenticated;

-- ---------- get_admin_overview ----------
CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users        bigint;
  v_new_users_7d       bigint;
  v_active_today       bigint;
  v_lessons_completed  bigint;
  v_missions_submitted bigint;
  v_pro_users          bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM auth.users;

  SELECT COUNT(*) INTO v_new_users_7d
    FROM auth.users
    WHERE created_at >= now() - interval '7 days';

  SELECT COUNT(*) INTO v_active_today
    FROM public.user_streaks
    WHERE last_activity_date = (now() AT TIME ZONE 'UTC')::date;

  SELECT COUNT(*) INTO v_lessons_completed
    FROM public.user_lesson_status
    WHERE status = 'completed';

  SELECT COUNT(*) INTO v_missions_submitted
    FROM public.mission_submissions
    WHERE status IN ('submitted','evaluating','passed','failed','needs_revision');

  SELECT COUNT(*) INTO v_pro_users
    FROM public.user_subscriptions
    WHERE tier = 'pro';

  RETURN jsonb_build_object(
    'total_users',        v_total_users,
    'new_users_7d',       v_new_users_7d,
    'active_today',       v_active_today,
    'lessons_completed',  v_lessons_completed,
    'missions_submitted', v_missions_submitted,
    'pro_users',          v_pro_users
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_overview() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_admin_overview() TO authenticated;
