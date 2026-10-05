-- Central-integration review candidate. Not in auto-applied migrations.
-- Reuses the installed identity and commerce entitlement authorities.
-- No billing, gateway, mail, coupon or invitation implementation is replaced.
BEGIN;
CREATE TABLE public.academic_courses (
 id text PRIMARY KEY CHECK(id ~ '^AC-[A-Z0-9]+$'),
 enabled boolean NOT NULL DEFAULT false,
 assistant_enabled boolean NOT NULL DEFAULT false
);
INSERT INTO public.academic_courses(id) VALUES('AC-BUS');
CREATE TABLE public.academic_lesson_content (
 course_id text NOT NULL REFERENCES public.academic_courses(id),
 lesson_id text NOT NULL CHECK(lesson_id ~ '^AC-[A-Z0-9]+-M[0-9]{2}-L[0-9]{2}$'),
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 position integer NOT NULL CHECK(position>0),
 introductory boolean NOT NULL DEFAULT false,
 approved boolean NOT NULL DEFAULT false,
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 video_guid uuid, video_ready boolean NOT NULL DEFAULT false,
 PRIMARY KEY(course_id,lesson_id,locale), UNIQUE(course_id,position,locale),
 CHECK(NOT video_ready OR video_guid IS NOT NULL)
);
CREATE TABLE public.academic_progress (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 course_id text NOT NULL REFERENCES public.academic_courses(id), lesson_id text NOT NULL,
 read boolean NOT NULL DEFAULT false, quiz_passed boolean NOT NULL DEFAULT false,
 practice_submitted boolean NOT NULL DEFAULT false,
 drafts jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,course_id,lesson_id)
);
CREATE TABLE public.academic_asset_manifest (
 path text PRIMARY KEY, course_id text NOT NULL, lesson_id text NOT NULL, locale text NOT NULL,
 kind text NOT NULL CHECK(kind='workbook'), sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 FOREIGN KEY(course_id,lesson_id,locale) REFERENCES public.academic_lesson_content(course_id,lesson_id,locale),
 UNIQUE(course_id,lesson_id,locale,kind)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['academic_courses','academic_lesson_content','academic_progress','academic_asset_manifest'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
CREATE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND billing.commerce_account_allowed(auth.uid())
 AND EXISTS(SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
 WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved
 AND (l.introductory OR public.has_role(auth.uid(),'admin'::public.app_role)
 OR EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.user_id=auth.uid() AND e.package='academic'
 AND e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
 AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled))));
$$;
CREATE FUNCTION public.academic_assistant_allowed(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.academic_can_access(p_course,p_lesson,p_locale)
 AND EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course AND assistant_enabled)
 AND EXISTS(SELECT 1 FROM billing.commerce_entitlements e WHERE e.user_id=auth.uid() AND e.package='academic_assistant'
 AND e.revoked_at IS NULL AND e.starts_at<=now() AND e.ends_at>now()
 AND EXISTS(SELECT 1 FROM billing.commerce_control WHERE access_enabled));
$$;
CREATE FUNCTION public.academic_storage_allowed(p_path text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.academic_asset_manifest a WHERE a.path=p_path
 AND public.academic_can_access(a.course_id,a.lesson_id,a.locale));
$$;
CREATE POLICY academic_authorized_download ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='academic-downloads' AND public.academic_storage_allowed(name));
CREATE FUNCTION public.academic_command(p_action text,p_course text DEFAULT NULL,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); c public.academic_lesson_content%ROWTYPE; q jsonb; answer jsonb; score integer:=0;
 total integer; payload jsonb; feedback jsonb:='[]'; values_json jsonb; files jsonb; correct boolean;
BEGIN
 PERFORM billing.commerce_assert_identity(u);
 IF p_course IS NULL OR NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course AND enabled)
 THEN RAISE EXCEPTION 'ACADEMIC_UNAVAILABLE'; END IF;
 IF p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'ACADEMIC_INVALID_LOCALE'; END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'ACADEMIC_INVALID_INPUT'; END IF;
 IF p_action='status' THEN
  RETURN jsonb_build_object('progress',coalesce((SELECT jsonb_object_agg(p.lesson_id,
   jsonb_build_object('read',p.read,'quizPassed',p.quiz_passed,'practiceSubmitted',p.practice_submitted,'drafts',p.drafts))
   FROM public.academic_progress p WHERE p.user_id=u AND p.course_id=p_course
   AND public.academic_can_access(p.course_id,p.lesson_id,p_locale)),'{}'::jsonb));
 END IF;
 SELECT * INTO c FROM public.academic_lesson_content WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale AND approved;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACADEMIC_INVALID_LESSON'; END IF;
 IF NOT public.academic_can_access(p_course,p_lesson,p_locale) THEN RETURN jsonb_build_object('allowed',false); END IF;
 IF p_action='lesson' THEN
  -- Whitelist learner fields; provenance, keys, hidden rubrics and future fields never leak.
  SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO payload FROM jsonb_each(c.payload)
   WHERE key IN ('id','locale','title','intro','goals','sections','example','assignment','faq','summary','readingVisuals');
  payload:=jsonb_set(payload,'{assignment}',coalesce(payload->'assignment','{}')-'privateRubric'-'modelAnswer');
  payload:=payload||jsonb_build_object('quiz',(SELECT jsonb_agg(jsonb_build_object('id',x->'id','question',x->'question','options',x->'options')) FROM jsonb_array_elements(c.payload->'quiz') x));
  SELECT coalesce(jsonb_agg(jsonb_build_object('kind',kind,'path',path)),'[]') INTO files
   FROM public.academic_asset_manifest WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale;
  RETURN jsonb_build_object('allowed',true,'lesson',payload,'files',files,
   'assistantAllowed',public.academic_assistant_allowed(p_course,p_lesson,p_locale),
   'video',CASE WHEN c.video_ready THEN format('https://iframe.mediadelivery.net/embed/670679/%s?autoplay=false&preload=false',c.video_guid) ELSE NULL END);
 END IF;
 IF p_action NOT IN ('read','quiz','practice','reset_quiz') THEN RAISE EXCEPTION 'ACADEMIC_INVALID_ACTION'; END IF;
 INSERT INTO public.academic_progress(user_id,course_id,lesson_id) VALUES(u,p_course,p_lesson) ON CONFLICT DO NOTHING;
 IF p_action='read' THEN
  UPDATE public.academic_progress SET read=true,updated_at=now() WHERE user_id=u AND course_id=p_course AND lesson_id=p_lesson;
 ELSIF p_action='reset_quiz' THEN
  UPDATE public.academic_progress SET quiz_passed=false,updated_at=now() WHERE user_id=u AND course_id=p_course AND lesson_id=p_lesson;
 ELSIF p_action='quiz' THEN
  total:=jsonb_array_length(c.payload->'quiz');
  IF total<1 OR jsonb_typeof(p_data->'answers') IS DISTINCT FROM 'object' OR p_data-'answers'<>'{}'
  THEN RAISE EXCEPTION 'ACADEMIC_INVALID_ANSWERS'; END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(p_data->'answers'))<>total THEN RAISE EXCEPTION 'ACADEMIC_INVALID_ANSWERS'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(c.payload->'quiz') LOOP
   answer:=p_data->'answers'->(q->>'id');
   IF answer IS NULL OR jsonb_typeof(answer)<>'number' OR (answer#>>'{}') !~ '^[0-9]+$'
    OR (answer#>>'{}')::integer>=jsonb_array_length(q->'options') THEN RAISE EXCEPTION 'ACADEMIC_INVALID_ANSWERS'; END IF;
   correct:=(answer#>>'{}')::integer=(q->>'correct')::integer;
   IF correct THEN score:=score+1; END IF;
   feedback:=feedback||jsonb_build_array(jsonb_build_object('id',q->>'id','correct',correct,'explanation',q->>'explanation'));
  END LOOP;
  UPDATE public.academic_progress SET quiz_passed=score=total,updated_at=now() WHERE user_id=u AND course_id=p_course AND lesson_id=p_lesson;
  RETURN jsonb_build_object('allowed',true,'score',score,'total',total,'passed',score=total,'feedback',feedback);
 ELSIF p_action='practice' THEN
  values_json:=p_data->'values';
  IF p_data-'values'<>'{}' OR jsonb_typeof(values_json) IS DISTINCT FROM 'array'
   OR jsonb_array_length(values_json)<>jsonb_array_length(c.payload->'assignment'->'fields')
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(values_json) x WHERE jsonb_typeof(x)<>'string' OR length(btrim(x#>>'{}'))=0 OR length(x#>>'{}')>5000)
  THEN RAISE EXCEPTION 'ACADEMIC_INVALID_PRACTICE'; END IF;
  -- Submission is not academic grading. Never accept a browser-supplied score/pass flag.
  UPDATE public.academic_progress SET drafts=jsonb_set(drafts,ARRAY[p_locale],values_json),practice_submitted=true,updated_at=now()
   WHERE user_id=u AND course_id=p_course AND lesson_id=p_lesson;
 END IF;
 RETURN jsonb_build_object('allowed',true);
END $$;
REVOKE ALL ON FUNCTION public.academic_can_access(text,text,text),public.academic_assistant_allowed(text,text,text),public.academic_storage_allowed(text),public.academic_command(text,text,text,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.academic_can_access(text,text,text),public.academic_assistant_allowed(text,text,text),public.academic_storage_allowed(text),public.academic_command(text,text,text,text,jsonb) TO authenticated;
COMMIT;
