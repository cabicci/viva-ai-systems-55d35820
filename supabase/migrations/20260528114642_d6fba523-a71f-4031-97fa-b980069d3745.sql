CREATE OR REPLACE FUNCTION public.mark_roadmap_done(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can mark roadmap items done';
  END IF;
  UPDATE public.roadmap_items
    SET status = 'done'::roadmap_status,
        completed_at = now(),
        updated_at = now()
  WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_roadmap_done(uuid) TO authenticated;