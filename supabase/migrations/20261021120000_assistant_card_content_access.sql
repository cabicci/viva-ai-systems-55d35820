-- Deploy together with the assistant runtime card-access gate.
-- Content review uses the existing admin corpus policy. AI grant/quota billing
-- remains a separate mandatory reservation in assistant-runtime.
BEGIN;

CREATE FUNCTION public.assistant_card_content_access(p_user_id uuid, p_card_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  IF p_user_id IS NULL OR p_card_id IS NULL OR p_card_id = ''
    OR p_card_id <> btrim(p_card_id) OR char_length(p_card_id) > 128 THEN
    RAISE EXCEPTION 'ASSISTANT_INVALID_CARD_ACCESS_SCOPE';
  END IF;

  -- Same account suspension/deletion guard as the existing commerce readers.
  IF NOT coalesce(billing.commerce_account_allowed(p_user_id), false) THEN
    RETURN jsonb_build_object('card_id', p_card_id, 'admin_review', false,
      'lessons', jsonb_build_object('entitled_lesson_ids', '[]'::jsonb));
  END IF;

  -- The caller supplies only the JWT-verified subject. No browser role flag is
  -- accepted. The runtime still admits only the current approved card's corpus.
  IF coalesce(public.has_role(p_user_id, 'admin'::public.app_role), false) THEN
    RETURN jsonb_build_object('card_id', p_card_id, 'admin_review', true,
      'lessons', jsonb_build_object('entitled_lesson_ids', '[]'::jsonb));
  END IF;

  -- Preserve existing paid/preview content policy and its validity checks.
  -- This gateway never grants plan access or increases any AI quota.
  v_snapshot := billing.get_entitlement_snapshot(p_user_id);
  RETURN jsonb_build_object('card_id', p_card_id, 'admin_review', false,
    'lessons', coalesce(v_snapshot -> 'lessons', '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_card_content_access(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_card_content_access(uuid, text) TO service_role;

COMMIT;
