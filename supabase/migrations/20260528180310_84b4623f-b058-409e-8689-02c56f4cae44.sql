-- 1. Mirror function: lesson_progress -> user_lesson_status
CREATE OR REPLACE FUNCTION public.sync_lesson_status_mirror()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_lesson_status (user_id, lesson_id, status, updated_at)
  VALUES (
    NEW.user_id,
    NEW.lesson_id,
    CASE NEW.status::text
      WHEN 'completed'   THEN 'completed'::lesson_status_v2
      WHEN 'in-progress' THEN 'in_progress'::lesson_status_v2
      ELSE 'available'::lesson_status_v2
    END,
    now()
  )
  ON CONFLICT (user_id, lesson_id) DO UPDATE
    SET status = EXCLUDED.status,
        updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Trigger: fire after every insert/update on lesson_progress
DROP TRIGGER IF EXISTS trg_sync_lesson_status_mirror ON public.lesson_progress;
CREATE TRIGGER trg_sync_lesson_status_mirror
AFTER INSERT OR UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.sync_lesson_status_mirror();

-- 3. Backfill: sync any existing drift
INSERT INTO public.user_lesson_status (user_id, lesson_id, status, updated_at)
SELECT
  lp.user_id,
  lp.lesson_id,
  CASE lp.status::text
    WHEN 'completed'   THEN 'completed'::lesson_status_v2
    WHEN 'in-progress' THEN 'in_progress'::lesson_status_v2
    ELSE 'available'::lesson_status_v2
  END,
  now()
FROM public.lesson_progress lp
ON CONFLICT (user_id, lesson_id) DO UPDATE
  SET status = EXCLUDED.status,
      updated_at = now();