
CREATE OR REPLACE FUNCTION public.protect_mission_submission_admin_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    -- Hard-block writes to truly admin-only columns.
    IF NEW.score IS DISTINCT FROM OLD.score
       OR NEW.feedback IS DISTINCT FROM OLD.feedback
       OR NEW.evaluated_at IS DISTINCT FROM OLD.evaluated_at THEN
      RAISE EXCEPTION 'Not allowed to modify admin-controlled columns (score/feedback/evaluated_at)';
    END IF;
    -- Status: users can only move between draft and submitted.
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('draft', 'submitted') THEN
      RAISE EXCEPTION 'Not allowed to set status to %', NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- INSERT: keep score/feedback/evaluated_at empty, allow status draft or submitted.
CREATE OR REPLACE FUNCTION public.protect_mission_submission_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.score := NULL;
    NEW.feedback := NULL;
    NEW.evaluated_at := NULL;
    IF NEW.status IS NULL OR NEW.status NOT IN ('draft', 'submitted') THEN
      NEW.status := 'draft';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
