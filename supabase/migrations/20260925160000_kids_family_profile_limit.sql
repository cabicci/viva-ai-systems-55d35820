-- Prepared only; inherits the Kids privacy/editorial/deployment rollout gates.
-- Serialize inserts per family so concurrent requests cannot exceed three profiles.
CREATE FUNCTION public.kids_enforce_family_profile_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
      RAISE EXCEPTION 'Kids profile ownership cannot be transferred' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  -- A retained transaction snapshot could undercount after waiting for the lock.
  IF pg_catalog.current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'Kids profile creation requires read committed isolation' USING ERRCODE = '25001';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.parent_id::text, 751603));
  IF (SELECT count(*) FROM public.kids_profiles WHERE parent_id = NEW.parent_id) >= 3 THEN
    RAISE EXCEPTION 'Kids family profile limit reached' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.kids_enforce_family_profile_limit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER kids_family_profile_limit
  BEFORE INSERT OR UPDATE OF parent_id ON public.kids_profiles
  FOR EACH ROW EXECUTE FUNCTION public.kids_enforce_family_profile_limit();
