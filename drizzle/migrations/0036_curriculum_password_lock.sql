CREATE TABLE curriculum_private.password_locks(
 area text NOT NULL,
 course text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(area,course)
);
CREATE TABLE curriculum_private.password_unlocks(
 account_id uuid NOT NULL,
 area text NOT NULL,
 course text NOT NULL,
 unlocked_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,area,course),
 FOREIGN KEY(area,course) REFERENCES curriculum_private.password_locks(area,course) ON DELETE CASCADE
);
CREATE TABLE curriculum_private.password_attempts(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 account_id uuid NOT NULL,
 area text NOT NULL,
 course text NOT NULL,
 ok boolean NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX curriculum_password_attempts_recent ON curriculum_private.password_attempts(account_id,area,course,created_at DESC);
ALTER TABLE curriculum_private.password_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_private.password_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_private.password_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON curriculum_private.password_locks,curriculum_private.password_unlocks,curriculum_private.password_attempts FROM PUBLIC,anon,authenticated;

INSERT INTO curriculum_private.password_locks(area,course) VALUES('academic','AC-FATE');

CREATE OR REPLACE FUNCTION curriculum_private.access(p_user uuid, p_area text, p_course text, p_lesson text, p_locale text, p_child uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE c curriculum_private.courses;
BEGIN
 IF NOT billing.commercial_account_allowed(p_user) OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM curriculum_private.password_locks k WHERE k.area=p_area AND k.course=p_course)
  AND NOT EXISTS(SELECT 1 FROM curriculum_private.password_unlocks x WHERE x.account_id=p_user AND x.area=p_area AND x.course=p_course) THEN RETURN false; END IF;
 SELECT * INTO c FROM curriculum_private.courses WHERE area=p_area AND id=p_course;
 IF c.active_version IS NULL OR NOT EXISTS(SELECT 1 FROM curriculum_private.lessons WHERE area=p_area AND course=p_course AND version=c.active_version AND lesson=p_lesson AND locale=p_locale) THEN RETURN false; END IF;
 IF billing.commercial_admin(p_user) AND ((p_area='kids' AND p_child=p_user) OR (p_area<>'kids' AND p_child IS NULL)) THEN RETURN true; END IF;
 IF p_area='technical' AND NOT EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) THEN RETURN false; END IF;
 IF p_area='kids' THEN
  IF p_child IS NULL OR NOT curriculum_private.child_allowed(p_user,p_child) THEN RETURN false; END IF;
 ELSIF p_child IS NOT NULL THEN RETURN false;
 END IF;
 IF billing.commercial_admin(p_user) THEN RETURN true; END IF;
 RETURN billing.commercial_course_owned(p_user,p_area,p_course,p_child)
  OR EXISTS(SELECT 1 FROM billing.assistant_source_specs(p_user,p_area,p_course,p_child,now()) WHERE source_key NOT LIKE 'lifetime:%');
END $function$;

CREATE FUNCTION public.curriculum_password_state(p_area text, p_course text) RETURNS jsonb
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object(
  'locked', EXISTS(SELECT 1 FROM curriculum_private.password_locks k WHERE k.area=p_area AND k.course=p_course),
  'unlocked', auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM curriculum_private.password_unlocks x WHERE x.account_id=auth.uid() AND x.area=p_area AND x.course=p_course));
$$;
REVOKE ALL ON FUNCTION public.curriculum_password_state(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.curriculum_password_state(text,text) TO anon,authenticated,service_role;

CREATE FUNCTION public.curriculum_password_attempt(p_user uuid, p_area text, p_course text, p_ok boolean) RETURNS text
 LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE failures integer;
BEGIN
 IF p_user IS NULL OR NOT EXISTS(SELECT 1 FROM curriculum_private.password_locks k WHERE k.area=p_area AND k.course=p_course) THEN RETURN 'not_locked'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('curriculum_password:'||p_user::text||':'||p_area||':'||p_course,0));
 IF EXISTS(SELECT 1 FROM curriculum_private.password_unlocks x WHERE x.account_id=p_user AND x.area=p_area AND x.course=p_course) THEN RETURN 'unlocked'; END IF;
 SELECT count(*) INTO failures FROM curriculum_private.password_attempts a
  WHERE a.account_id=p_user AND a.area=p_area AND a.course=p_course AND NOT a.ok AND a.created_at > now()-interval '15 minutes';
 IF failures >= 5 THEN RETURN 'limited'; END IF;
 INSERT INTO curriculum_private.password_attempts(account_id,area,course,ok) VALUES(p_user,p_area,p_course,p_ok);
 IF p_ok THEN
  INSERT INTO curriculum_private.password_unlocks(account_id,area,course) VALUES(p_user,p_area,p_course) ON CONFLICT DO NOTHING;
  RETURN 'unlocked';
 END IF;
 RETURN 'wrong';
END $$;
REVOKE ALL ON FUNCTION public.curriculum_password_attempt(uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.curriculum_password_attempt(uuid,text,text,boolean) TO service_role;