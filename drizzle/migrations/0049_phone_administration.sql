
CREATE FUNCTION public.admin_account_phone_command(p_actor uuid, p_action text, p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  control communications_private.phone_control%ROWTYPE;
  selected_users uuid[];
  selected_channels text[];
  selected_actor uuid;
  result jsonb;
BEGIN
  IF coalesce(auth.jwt()->>'role', '') <> 'service_role'
     OR NOT public.has_role(p_actor, 'admin'::public.app_role)
     OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_actor) THEN
    RAISE EXCEPTION 'PHONE_ADMIN_FORBIDDEN';
  END IF;

  IF p_action = 'configure' THEN
    IF jsonb_typeof(p_data->'enabled') IS DISTINCT FROM 'boolean'
       OR jsonb_typeof(p_data->'revision') IS DISTINCT FROM 'number'
       OR jsonb_typeof(p_data->'dailyCap') IS DISTINCT FROM 'number'
       OR jsonb_typeof(p_data->'testUsers') IS DISTINCT FROM 'array'
       OR jsonb_typeof(p_data->'channels') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'PHONE_CONTROL_INVALID';
    END IF;
    SELECT coalesce(array_agg(value::uuid), '{}') INTO selected_users
      FROM jsonb_array_elements_text(p_data->'testUsers');
    SELECT coalesce(array_agg(value), '{}') INTO selected_channels
      FROM jsonb_array_elements_text(p_data->'channels');
    IF cardinality(selected_users) > 100
       OR cardinality(selected_channels) NOT BETWEEN 1 AND 2
       OR NOT selected_channels <@ ARRAY['sms','whatsapp']::text[]
       OR (p_data->>'dailyCap')::integer NOT BETWEEN 1 AND 100
       OR (SELECT count(DISTINCT value) FROM unnest(selected_users) value) <> cardinality(selected_users)
       OR (SELECT count(DISTINCT value) FROM unnest(selected_channels) value) <> cardinality(selected_channels)
       OR (SELECT count(*) FROM auth.users WHERE id = ANY(selected_users)) <> cardinality(selected_users) THEN
      RAISE EXCEPTION 'PHONE_CONTROL_INVALID';
    END IF;
    -- Acquire lifecycle locks in stable account order before the control row.
    -- Deletion increments the same revision when removing a selected account.
    FOR selected_actor IN SELECT DISTINCT value
      FROM unnest(selected_users || ARRAY[p_actor]) AS value ORDER BY value LOOP
      IF billing.account_deletion_blocked(selected_actor)
         OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id=selected_actor) THEN
        RAISE EXCEPTION 'PHONE_CONTROL_INVALID';
      END IF;
    END LOOP;
    UPDATE communications_private.phone_control
      SET enabled = (p_data->>'enabled')::boolean,
          channels = selected_channels,
          test_users = selected_users,
          daily_cap = (p_data->>'dailyCap')::integer,
          revision = revision + 1
      WHERE singleton AND revision = (p_data->>'revision')::integer;
    IF NOT FOUND THEN RAISE EXCEPTION 'PHONE_CONTROL_CONFLICT'; END IF;
  ELSIF p_action IS DISTINCT FROM 'status' THEN
    RAISE EXCEPTION 'PHONE_CONTROL_INVALID';
  ELSIF billing.account_deletion_blocked(p_actor) THEN
    RAISE EXCEPTION 'PHONE_ADMIN_FORBIDDEN';
  END IF;

  SELECT * INTO STRICT control FROM communications_private.phone_control WHERE singleton;
  SELECT jsonb_build_object(
    'revision', control.revision,
    'enabled', control.enabled,
    'channels', to_jsonb(control.channels),
    'dailyCap', control.daily_cap,
    'testUsers', to_jsonb(control.test_users),
    'sentToday', CASE WHEN control.budget_day = (now() AT TIME ZONE 'UTC')::date THEN control.day_sends ELSE 0 END,
    'verifiedAccounts', (SELECT count(*) FROM communications_private.verified_phones),
    'recent', coalesce((SELECT jsonb_agg(item ORDER BY created_at DESC, id DESC) FROM (
      SELECT id, created_at, jsonb_build_object(
        'id', id, 'createdAt', created_at, 'channel', channel,
        'phoneTail', right(phone, 4), 'state', state
      ) item FROM communications_private.phone_challenges
      ORDER BY created_at DESC, id DESC LIMIT 20
    ) recent), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.admin_account_phone_command(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_account_phone_command(uuid,text,jsonb) TO service_role;
