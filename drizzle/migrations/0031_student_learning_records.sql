-- Additive learning records; existing product tables remain authoritative.
-- Applied only by the native Drizzle runner after release review.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint

ALTER TABLE public.lesson_quiz_attempts ADD COLUMN locale text,
 ADD COLUMN content_version text, ADD COLUMN source_snapshot jsonb;
--> statement-breakpoint

CREATE SCHEMA IF NOT EXISTS learning_private;
--> statement-breakpoint

-- Existing kids_journey is an explicitly granted invoker bridge in this
-- schema. Preserve its authenticated USAGE and EXECUTE grants.
REVOKE ALL ON SCHEMA learning_private FROM PUBLIC,anon;
--> statement-breakpoint


-- The record is shared; learning/assessment contracts belong to each course.
-- Publishing a different model creates a new version, preserving old rules.
CREATE TABLE learning_private.course_models (
 area text NOT NULL CHECK(area IN ('ai','academic','technical','kids')),
 course text NOT NULL, version text NOT NULL,
 activities text[] NOT NULL CHECK(activities <@ ARRAY['reading','notes','mission','questions','exam','practice']),
 completion jsonb NOT NULL CHECK(jsonb_typeof(completion)='object'),
 is_current boolean NOT NULL DEFAULT true,
 PRIMARY KEY(area,course,version)
);
--> statement-breakpoint

CREATE UNIQUE INDEX learning_current_model ON learning_private.course_models(area,course) WHERE is_current;
--> statement-breakpoint

INSERT INTO learning_private.course_models VALUES
 ('ai','ai','initial-1',ARRAY['reading','notes','mission','questions'],'{"authority":"lesson_progress","required":["explicit_lesson_completion"],"optional":["notes","mission","questions"]}',true),
 ('technical','furniture','initial-1',ARRAY['reading','questions','practice'],'{"authority":"technical_command","required":["read","quiz_passed","practice_reviewed"]}',true),
 ('kids','level-1','initial-1',ARRAY['reading','questions','practice'],'{"authority":"complete_kids_step","required":["explicit_activity_completion"],"mastery_inferred":false}',true),
 ('kids','level-2','initial-1',ARRAY['reading','questions','practice'],'{"authority":"complete_kids_step","required":["explicit_activity_completion"],"mastery_inferred":false}',true),
 ('kids','level-3','initial-1',ARRAY['reading','questions','practice'],'{"authority":"complete_kids_step","required":["explicit_activity_completion"],"mastery_inferred":false}',true);
--> statement-breakpoint

INSERT INTO learning_private.course_models(area,course,version,activities,completion)
 SELECT 'academic',id,'initial-1',ARRAY['reading','questions','practice'],
 '{"authority":"academic_command","required":["read","quiz_passed","practice_submitted"]}'::jsonb FROM public.academic_courses;
--> statement-breakpoint


CREATE TABLE learning_private.courses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 subject_id uuid NOT NULL,
 profile_id uuid REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
 area text NOT NULL CHECK(area IN ('ai','academic','technical','kids')),
 course text NOT NULL CHECK(length(course) BETWEEN 1 AND 160),
 first_recorded_at timestamptz NOT NULL DEFAULT now(),
 last_recorded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(account_id,subject_id,area,course),
 CHECK((area='kids' AND profile_id IS NOT NULL AND profile_id=subject_id) OR (area<>'kids' AND profile_id IS NULL AND subject_id=account_id))
);
--> statement-breakpoint

CREATE TABLE learning_private.events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 lesson text NOT NULL, locale text,
 kind text NOT NULL, origin text NOT NULL,
 actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
 content_version text,
 model_version text,
 evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='object'),
 recorded_at timestamptz NOT NULL DEFAULT now(),
 CHECK(locale IS NULL OR locale IN ('ar-EG','ar-MSA','ar-Gulf','en'))
);
--> statement-breakpoint

CREATE INDEX learning_events_record_time ON learning_private.events(record_id,recorded_at DESC,id);
--> statement-breakpoint

CREATE TABLE learning_private.notes (
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 lesson text NOT NULL, content text NOT NULL CHECK(length(content)<=5000),
 revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,lesson)
);
--> statement-breakpoint

CREATE TABLE learning_private.content_versions (
 area text NOT NULL, course text NOT NULL, lesson text NOT NULL, locale text NOT NULL,
 version text NOT NULL, payload jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(area,course,lesson,locale,version)
);
--> statement-breakpoint

CREATE TABLE learning_private.positions (
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 lesson text NOT NULL, locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 ratio numeric NOT NULL CHECK(ratio BETWEEN 0 AND 1), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,lesson,locale)
);
--> statement-breakpoint

CREATE TABLE learning_private.note_revisions (
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 lesson text NOT NULL, revision integer NOT NULL, content text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,lesson,revision)
);
--> statement-breakpoint

CREATE TABLE learning_private.enrollments (
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 source_key text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
 first_observed_at timestamptz NOT NULL DEFAULT now(), last_observed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,source_key,starts_at)
);
--> statement-breakpoint

-- Optimistic concurrency + command identity survive a lost HTTP acknowledgement.
CREATE TABLE learning_private.commands (
 account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 request_id uuid NOT NULL, fingerprint jsonb NOT NULL, result jsonb NOT NULL,
 record_id uuid REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 PRIMARY KEY(account_id,request_id)
);
--> statement-breakpoint

CREATE TABLE learning_private.reports (
 id uuid PRIMARY KEY,
 account_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 subject_id uuid NOT NULL,
 profile_id uuid REFERENCES public.kids_profiles(id) ON DELETE CASCADE,
 source_key text NOT NULL,
 period_start timestamptz NOT NULL, period_end timestamptz NOT NULL,
 state text NOT NULL CHECK(state IN ('generating','ready','failed')),
 claim_token uuid NOT NULL DEFAULT gen_random_uuid(),
 lease_until timestamptz NOT NULL,
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 snapshot jsonb NOT NULL, report jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 CHECK((profile_id IS NULL AND subject_id=account_id) OR (profile_id IS NOT NULL AND profile_id=subject_id))
);
--> statement-breakpoint

CREATE INDEX learning_reports_quota ON learning_private.reports(account_id,source_key,period_start,state);
--> statement-breakpoint

-- Future teacher/institution joins bind to course-record IDs. No global read
-- grant is created. Private notes are never included in a report snapshot.
CREATE TABLE learning_private.sharing (
 record_id uuid NOT NULL REFERENCES learning_private.courses(id) ON DELETE CASCADE,
 viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 institution_id text, expires_at timestamptz, revoked_at timestamptz,
 scope text NOT NULL CHECK(scope IN ('progress','assessments')),
 PRIMARY KEY(record_id,viewer_id,scope)
);
--> statement-breakpoint

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['courses','events','notes','commands','reports','sharing','content_versions','positions','note_revisions','enrollments','course_models'] LOOP
  EXECUTE format('ALTER TABLE learning_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON learning_private.%I FROM PUBLIC,anon,authenticated',t);
 END LOOP;
END $$;
--> statement-breakpoint

CREATE FUNCTION learning_private.model_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF (to_jsonb(NEW)-'is_current') IS DISTINCT FROM (to_jsonb(OLD)-'is_current') THEN RAISE EXCEPTION 'LEARNING_NEW_MODEL_VERSION_REQUIRED'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_model_immutable BEFORE UPDATE ON learning_private.course_models FOR EACH ROW EXECUTE FUNCTION learning_private.model_immutable();
--> statement-breakpoint

CREATE FUNCTION learning_private.event_model_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.kind<>'existing_fact' THEN
  SELECT m.version INTO NEW.model_version FROM learning_private.course_models m JOIN learning_private.courses c ON c.area=m.area AND c.course=m.course
   WHERE c.id=NEW.record_id AND m.is_current;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_event_model_version BEFORE INSERT ON learning_private.events FOR EACH ROW EXECUTE FUNCTION learning_private.event_model_version();
--> statement-breakpoint

CREATE FUNCTION learning_private.capture_note_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO learning_private.note_revisions(record_id,lesson,revision,content) VALUES(NEW.record_id,NEW.lesson,NEW.revision,NEW.content) ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_note_revision AFTER INSERT OR UPDATE ON learning_private.notes FOR EACH ROW EXECUTE FUNCTION learning_private.capture_note_revision();
--> statement-breakpoint

CREATE FUNCTION learning_private.require_owner() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid();
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'LEARNING_ACCOUNT_REQUIRED'; END IF;
 -- Share the lifecycle lock with existing deletion/payment writers.
 PERFORM billing.commercial_lock(u);
 IF NOT billing.commercial_account_allowed(u) THEN RAISE EXCEPTION 'LEARNING_ACCOUNT_REQUIRED'; END IF;
 RETURN u;
END $$;
--> statement-breakpoint


CREATE FUNCTION learning_private.record(p_account uuid,p_area text,p_course text,p_profile uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r uuid;
BEGIN
 IF p_account IS NULL OR NOT billing.commercial_account_allowed(p_account) THEN RAISE EXCEPTION 'LEARNING_ACCOUNT_REQUIRED'; END IF;
 IF p_area='kids' AND NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_profile AND parent_id=p_account) THEN
  RAISE EXCEPTION 'LEARNING_SUBJECT_REQUIRED';
 END IF;
 INSERT INTO learning_private.courses(account_id,subject_id,profile_id,area,course)
 VALUES(p_account,coalesce(p_profile,p_account),p_profile,p_area,p_course)
 ON CONFLICT(account_id,subject_id,area,course) DO UPDATE SET last_recorded_at=now()
 RETURNING id INTO r;
 RETURN r;
END $$;
--> statement-breakpoint


CREATE FUNCTION learning_private.capture() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d jsonb:=to_jsonb(NEW); u uuid; profile uuid; area text:='ai'; course text:='ai';
 lesson text; lang text; version text; rid uuid; evidence jsonb:=d;
BEGIN
 -- Only rows accepted by the existing source writers reach this trigger.
 u:=nullif(d->>'user_id','')::uuid; lesson:=coalesce(d->>'lesson_id',d->>'mission_id');
 lang:=d->>'locale';
 IF TG_TABLE_NAME='academic_progress' THEN area:='academic'; course:=d->>'course_id';
 ELSIF TG_TABLE_NAME='technical_progress' THEN area:='technical'; course:='furniture';
 ELSIF TG_TABLE_NAME='kids_lesson_progress' THEN
  area:='kids'; profile:=(d->>'profile_id')::uuid; course:=d->>'level_id'; lesson:=d->>'lesson_number';
  SELECT parent_id INTO u FROM public.kids_profiles WHERE id=profile;
 ELSIF TG_TABLE_NAME='journey_visits' THEN
  area:=d->>'line'; course:=d->>'course_id'; profile:=nullif(d->>'profile_id','')::uuid;
 END IF;
 IF u IS NULL OR lesson IS NULL THEN RETURN NEW; END IF;
 -- Existing historical rows without a source version stay explicitly unknown.
 IF area='academic' AND lang IS NOT NULL THEN SELECT source_sha256 INTO version FROM public.academic_lesson_content WHERE course_id=course AND lesson_id=lesson AND locale=lang;
 ELSIF area='technical' AND lang IS NOT NULL THEN SELECT source_sha256 INTO version FROM public.technical_lesson_content WHERE lesson_id=lesson AND locale=lang;
 ELSE version:=d->>'content_version'; END IF;
 rid:=learning_private.record(u,area,course,profile);
 IF TG_TABLE_NAME='lesson_notes' THEN
  -- An older open tab may still write the original public table. It cannot
  -- silently replace a newer canonical note that it never loaded.
  IF EXISTS(SELECT 1 FROM learning_private.notes n WHERE n.record_id=rid AND n.lesson=(d->>'lesson_id') AND n.content<>coalesce(d->>'content','')
    AND (TG_OP='INSERT' OR n.content IS DISTINCT FROM (to_jsonb(OLD)->>'content'))) THEN
   RAISE EXCEPTION 'LEARNING_NOTE_CONFLICT';
  END IF;
  INSERT INTO learning_private.notes(record_id,lesson,content) VALUES(rid,lesson,coalesce(d->>'content',''))
  ON CONFLICT(record_id,lesson) DO UPDATE SET content=excluded.content,revision=learning_private.notes.revision+1,updated_at=now();
  evidence:=jsonb_build_object('private_note_changed',true); -- no note text in timeline/report
 END IF;
 IF TG_OP='UPDATE' AND to_jsonb(OLD)=d THEN RETURN NEW; END IF;
 INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence)
 VALUES(rid,lesson,lang,CASE WHEN TG_TABLE_NAME='journey_visits' THEN 'visited' ELSE 'state_recorded' END,TG_TABLE_NAME,version,
  evidence-'user_id'-'profile_id'-'source_snapshot');
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE FUNCTION learning_private.keep_mission_completed() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF OLD.state='completed' AND NEW.state='started' THEN NEW.state:=OLD.state; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_mission_monotonic BEFORE UPDATE ON public.user_mission_state FOR EACH ROW EXECUTE FUNCTION learning_private.keep_mission_completed();
--> statement-breakpoint

CREATE FUNCTION learning_private.capture_content() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d jsonb; area text:=CASE WHEN TG_TABLE_NAME='academic_lesson_content' THEN 'academic' ELSE 'technical' END;
BEGIN
 FOR d IN SELECT to_jsonb(NEW) UNION ALL SELECT to_jsonb(OLD) WHERE TG_OP='UPDATE' LOOP
  IF d IS NOT NULL THEN
   INSERT INTO learning_private.content_versions(area,course,lesson,locale,version,payload)
   VALUES(area,coalesce(d->>'course_id','furniture'),d->>'lesson_id',d->>'locale',d->>'source_sha256',d->'payload') ON CONFLICT DO NOTHING;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_content_versions AFTER INSERT OR UPDATE ON public.academic_lesson_content FOR EACH ROW EXECUTE FUNCTION learning_private.capture_content();
--> statement-breakpoint

CREATE TRIGGER learning_content_versions AFTER INSERT OR UPDATE ON public.technical_lesson_content FOR EACH ROW EXECUTE FUNCTION learning_private.capture_content();
--> statement-breakpoint

INSERT INTO learning_private.content_versions(area,course,lesson,locale,version,payload)
 SELECT 'academic',course_id,lesson_id,locale,source_sha256,payload FROM public.academic_lesson_content
 UNION ALL SELECT 'technical','furniture',lesson_id,locale,source_sha256,payload FROM public.technical_lesson_content;
--> statement-breakpoint


DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['lesson_progress','lesson_notes','lesson_quiz_attempts','mission_submissions','academic_progress','technical_progress','kids_lesson_progress','journey_visits'] LOOP
  EXECUTE format('CREATE TRIGGER learning_record_capture AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION learning_private.capture()',t);
 END LOOP;
END $$;
--> statement-breakpoint

CREATE FUNCTION learning_private.can_write(p_record learning_private.courses,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_record.area='kids' THEN
  RETURN p_lesson ~ '^[0-9]{1,2}$' AND public.kids_can_access_lesson(p_record.profile_id,p_record.course,p_lesson::integer,p_locale);
 END IF;
 RETURN billing.assistant_content_allowed(p_record.account_id,p_record.area,p_record.course,p_lesson,p_locale,NULL);
END $$;
--> statement-breakpoint


CREATE FUNCTION public.learning_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=learning_private.require_owner(); r learning_private.courses; n learning_private.notes;
 req uuid; prior learning_private.commands; response jsonb; expected integer; txt text;
BEGIN
 IF p_action='records' THEN
  -- Observe existing access provenance, never create access from a learning row.
  -- Missing historical enrollment evidence is left unknown.
  INSERT INTO learning_private.enrollments(record_id,source_key,starts_at,ends_at)
   SELECT DISTINCT record_id,source_key,anchor,valid_until FROM learning_private.report_sources(u)
   ON CONFLICT(record_id,source_key,starts_at) DO UPDATE SET ends_at=excluded.ends_at,last_observed_at=now();
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('learning_model',
   (SELECT jsonb_build_object('version',m.version,'activities',m.activities,'completion',m.completion) FROM learning_private.course_models m WHERE m.area=c.area AND m.course=c.course AND m.is_current),
   'title',CASE WHEN c.area='academic' THEN
   (SELECT ac.titles->>coalesce(p_data->>'locale','ar-EG') FROM public.academic_courses ac WHERE ac.id=c.course) END) ORDER BY c.last_recorded_at DESC) FROM learning_private.courses c WHERE account_id=u),'[]');
 END IF;
 SELECT * INTO r FROM learning_private.courses WHERE id=(p_data->>'recordId')::uuid AND account_id=u;
 IF NOT FOUND THEN RAISE EXCEPTION 'LEARNING_RECORD_REQUIRED'; END IF;
 IF r.profile_id IS NOT NULL AND NOT public.kids_parent_can_manage_profiles() THEN RAISE EXCEPTION 'LEARNING_PARENT_REQUIRED'; END IF;
 IF p_action='detail' OR p_action='export' THEN
  SELECT jsonb_build_object('record',to_jsonb(r),'events',coalesce(jsonb_agg(to_jsonb(e)||jsonb_build_object('lessonTitle',
    (SELECT v.payload->>'title' FROM learning_private.content_versions v WHERE v.area=r.area AND v.course=r.course AND v.lesson=e.lesson
      AND v.locale=coalesce(e.locale,p_data->>'locale','ar-EG') AND (e.content_version IS NULL OR v.version=e.content_version) ORDER BY v.recorded_at DESC LIMIT 1)) ORDER BY e.recorded_at DESC,e.id),'[]'),
   'hasMore',(SELECT count(*) FROM learning_private.events WHERE record_id=r.id)>CASE WHEN p_action='export' THEN 5000 ELSE 200 END)
  INTO response FROM (SELECT * FROM learning_private.events WHERE record_id=r.id ORDER BY recorded_at DESC,id LIMIT CASE WHEN p_action='export' THEN 5000 ELSE 200 END) e;
  RETURN response||jsonb_build_object('enrollments',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY starts_at DESC) FROM learning_private.enrollments x WHERE record_id=r.id),'[]'),
   'notes',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM learning_private.notes x WHERE record_id=r.id),'[]'),
   'noteVersions',CASE WHEN p_action='export' THEN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM learning_private.note_revisions x WHERE record_id=r.id),'[]') ELSE '[]'::jsonb END);
 ELSIF p_action='note' THEN
  SELECT * INTO n FROM learning_private.notes WHERE record_id=r.id AND lesson=p_data->>'lesson';
  RETURN jsonb_build_object('content',coalesce(n.content,''),'revision',coalesce(n.revision,0));
 ELSIF p_action='position' THEN
  RETURN coalesce((SELECT jsonb_build_object('ratio',ratio) FROM learning_private.positions WHERE record_id=r.id AND lesson=p_data->>'lesson' AND locale=p_data->>'locale'),'{}');
 ELSIF p_action='save_position' THEN
  IF NOT learning_private.can_write(r,p_data->>'lesson',p_data->>'locale') THEN RAISE EXCEPTION 'LEARNING_ACCESS_REQUIRED'; END IF;
  INSERT INTO learning_private.positions(record_id,lesson,locale,ratio) VALUES(r.id,p_data->>'lesson',p_data->>'locale',(p_data->>'ratio')::numeric)
  ON CONFLICT(record_id,lesson,locale) DO UPDATE SET ratio=excluded.ratio,updated_at=now();
  RETURN '{}'::jsonb;
 ELSIF p_action='save_note' THEN
  req:=(p_data->>'requestId')::uuid;
  IF req IS NULL THEN RAISE EXCEPTION 'LEARNING_REQUEST_REQUIRED'; END IF;
  SELECT * INTO prior FROM learning_private.commands WHERE account_id=u AND request_id=req;
  IF FOUND THEN
   IF prior.fingerprint<>p_data-'locale' THEN RAISE EXCEPTION 'LEARNING_REQUEST_MISMATCH'; END IF;
   RETURN prior.result;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM learning_private.course_models m WHERE m.area=r.area AND m.course=r.course AND m.is_current AND 'notes'=ANY(m.activities)) THEN
   RAISE EXCEPTION 'LEARNING_ACTIVITY_NOT_ENABLED';
  END IF;
  IF length(coalesce(p_data->>'lesson','')) NOT BETWEEN 1 AND 160 OR NOT learning_private.can_write(r,p_data->>'lesson',p_data->>'locale') THEN RAISE EXCEPTION 'LEARNING_ACCESS_REQUIRED'; END IF;
  expected:=(p_data->>'revision')::integer; txt:=p_data->>'content';
  IF expected IS NULL OR txt IS NULL OR length(txt)>5000 THEN RAISE EXCEPTION 'LEARNING_NOTE_INVALID'; END IF;
  SELECT * INTO n FROM learning_private.notes WHERE record_id=r.id AND lesson=p_data->>'lesson' FOR UPDATE;
  IF coalesce(n.revision,0)<>expected THEN RAISE EXCEPTION 'LEARNING_NOTE_CONFLICT'; END IF;
  INSERT INTO learning_private.notes(record_id,lesson,content,revision) VALUES(r.id,p_data->>'lesson',txt,1)
  ON CONFLICT(record_id,lesson) DO UPDATE SET content=excluded.content,revision=learning_private.notes.revision+1,updated_at=now()
  RETURNING * INTO n;
  INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,evidence)
  VALUES(r.id,n.lesson,p_data->>'locale','note_saved','learning_command',jsonb_build_object('revision',n.revision));
  response:=jsonb_build_object('content',n.content,'revision',n.revision);
  INSERT INTO learning_private.commands VALUES(u,req,p_data-'locale',response,r.id);
  RETURN response;
 END IF;
 RAISE EXCEPTION 'LEARNING_ACTION_INVALID';
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.learning_command(text,jsonb) FROM PUBLIC,anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.learning_command(text,jsonb) TO authenticated;
--> statement-breakpoint

-- Capture future canonical command attempts after the original authorization,
-- grading and transaction succeeded. Preserve original product contracts.
ALTER FUNCTION public.academic_command(text,text,text,text,jsonb) RENAME TO learning_previous_academic_command;
--> statement-breakpoint

CREATE FUNCTION public.academic_command(p_action text,p_course text DEFAULT NULL,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; rid uuid; version text;
BEGIN
 result:=public.learning_previous_academic_command(p_action,p_course,p_lesson,p_locale,p_data);
 IF p_action IN ('read','quiz','practice','reset_quiz') AND (result->>'allowed')::boolean IS TRUE THEN
  rid:=learning_private.record(auth.uid(),'academic',p_course);
  SELECT source_sha256 INTO version FROM public.academic_lesson_content WHERE course_id=p_course AND lesson_id=p_lesson AND locale=p_locale;
  INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence)
  VALUES(rid,p_lesson,p_locale,p_action,'academic_command',version,jsonb_build_object('submission',p_data,'outcome',result));
 END IF;
 RETURN result;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.learning_previous_academic_command(text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.academic_command(text,text,text,text,jsonb) FROM PUBLIC,anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.academic_command(text,text,text,text,jsonb) TO authenticated;
--> statement-breakpoint


ALTER FUNCTION public.technical_command(text,text,text,jsonb) RENAME TO learning_previous_technical_command;
--> statement-breakpoint

CREATE FUNCTION public.technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; rid uuid; version text;
BEGIN
 result:=public.learning_previous_technical_command(p_action,p_lesson,p_locale,p_data);
 IF p_action IN ('read','quiz','practice','reset_quiz') AND (result->>'allowed')::boolean IS TRUE THEN
  rid:=learning_private.record(auth.uid(),'technical','furniture');
  SELECT source_sha256 INTO version FROM public.technical_lesson_content WHERE lesson_id=p_lesson AND locale=p_locale;
  INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence)
  VALUES(rid,p_lesson,p_locale,p_action,'technical_command',version,jsonb_build_object('submission',p_data,'outcome',result));
 END IF;
 RETURN result;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.learning_previous_technical_command(text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.technical_command(text,text,text,jsonb) FROM PUBLIC,anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.technical_command(text,text,text,jsonb) TO authenticated;
--> statement-breakpoint

-- Reconstruct only known current facts. Do not invent historical attempts,
-- enrollment dates, content versions, grades or unknown legacy local owners.
DO $$ DECLARE t text; d jsonb; u uuid; profile uuid; area text; course text; lesson text; rid uuid; BEGIN
 FOREACH t IN ARRAY ARRAY['lesson_progress','lesson_notes','lesson_quiz_attempts','mission_submissions','academic_progress','technical_progress','kids_lesson_progress','journey_visits'] LOOP
  FOR d IN EXECUTE format('SELECT to_jsonb(x) FROM public.%I x',t) LOOP
   profile:=NULL; u:=nullif(d->>'user_id','')::uuid; area:='ai'; course:='ai'; lesson:=coalesce(d->>'lesson_id',d->>'mission_id');
   IF t='academic_progress' THEN area:='academic'; course:=d->>'course_id';
   ELSIF t='technical_progress' THEN area:='technical'; course:='furniture';
   ELSIF t='kids_lesson_progress' THEN area:='kids'; profile:=(d->>'profile_id')::uuid; course:=d->>'level_id'; lesson:=d->>'lesson_number'; SELECT parent_id INTO u FROM public.kids_profiles WHERE id=profile;
   ELSIF t='journey_visits' THEN area:=d->>'line'; course:=d->>'course_id'; profile:=nullif(d->>'profile_id','')::uuid; END IF;
   IF u IS NULL OR lesson IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u) OR NOT billing.commercial_account_allowed(u) THEN CONTINUE; END IF;
   rid:=learning_private.record(u,area,course,profile);
   IF t='lesson_notes' THEN INSERT INTO learning_private.notes(record_id,lesson,content) VALUES(rid,lesson,coalesce(d->>'content','')) ON CONFLICT DO NOTHING;
   ELSE INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence,recorded_at)
    VALUES(rid,lesson,d->>'locale','existing_fact',t,d->>'content_version',d-'user_id'-'profile_id'-'source_snapshot',
     coalesce(nullif(d->>'attempted_at','')::timestamptz,nullif(d->>'updated_at','')::timestamptz,nullif(d->>'recorded_at','')::timestamptz,nullif(d->>'visited_at','')::timestamptz,nullif(d->>'created_at','')::timestamptz,now())); END IF;
  END LOOP;
 END LOOP;
END $$;
--> statement-breakpoint


-- Private tables have account/child cascading foreign keys. Erasure must remove
-- them before releasing the owner's lifecycle lock, alongside existing data.
CREATE FUNCTION learning_private.erase_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 DELETE FROM learning_private.sharing WHERE viewer_id=OLD.id OR granted_by=OLD.id;
 DELETE FROM learning_private.commands WHERE account_id=OLD.id;
 DELETE FROM learning_private.reports WHERE account_id=OLD.id;
 DELETE FROM learning_private.courses WHERE account_id=OLD.id;
 RETURN OLD;
END $$;
--> statement-breakpoint

CREATE TRIGGER learning_account_erasure BEFORE DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION learning_private.erase_account();
--> statement-breakpoint

CREATE FUNCTION public.store_learning_content_version(p_user uuid,p_lesson text,p_locale text,p_version text,p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user);
 IF NOT billing.commercial_account_allowed(p_user) OR NOT billing.assistant_content_allowed(p_user,'ai','ai',p_lesson,p_locale,NULL)
  OR p_version !~ '^[a-f0-9]{64}$' OR p_payload IS NULL THEN RAISE EXCEPTION 'LEARNING_ACCESS_REQUIRED'; END IF;
 INSERT INTO learning_private.content_versions(area,course,lesson,locale,version,payload) VALUES('ai','ai',p_lesson,p_locale,p_version,p_payload) ON CONFLICT DO NOTHING;
 RETURN true;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.store_learning_content_version(uuid,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.store_learning_content_version(uuid,text,text,text,jsonb) TO service_role;
--> statement-breakpoint

-- The Kids endpoint grades the exact hash-verified private source. Only the
-- service may append its receipt; the browser cannot submit its own grade.
CREATE FUNCTION public.record_learning_assessment(p_user uuid,p_request uuid,p_profile uuid,p_area text,p_course text,p_lesson text,p_locale text,p_version text,p_source jsonb,p_submission jsonb,p_result jsonb,p_kind text DEFAULT 'quiz')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rid uuid; fp jsonb; prior learning_private.commands; old_sub text:=current_setting('request.jwt.claim.sub',true); allowed boolean;
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user);
 IF p_request IS NULL OR NOT billing.commercial_account_allowed(p_user) OR p_area NOT IN ('ai','academic','technical','kids')
 OR p_kind NOT IN ('quiz','questions','exam','practice','mission')
 OR p_version !~ '^[a-f0-9]{64}$' OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'LEARNING_ASSESSMENT_INVALID'; END IF;
 IF (p_area='kids' AND (p_profile IS NULL OR p_lesson !~ '^[0-9]{1,2}$' OR NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_profile AND parent_id=p_user)))
 OR (p_area<>'kids' AND p_profile IS NOT NULL) THEN RAISE EXCEPTION 'LEARNING_SUBJECT_REQUIRED'; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
 allowed:=CASE WHEN p_area='kids' THEN public.kids_can_access_lesson(p_profile,p_course,p_lesson::integer,p_locale)
  ELSE billing.assistant_content_allowed(p_user,p_area,p_course,p_lesson,p_locale,NULL) END;
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);
 IF NOT allowed THEN RAISE EXCEPTION 'LEARNING_ACCESS_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM learning_private.course_models m WHERE m.area=p_area AND m.course=p_course AND m.is_current
   AND (CASE WHEN p_kind='quiz' THEN 'questions' ELSE p_kind END)=ANY(m.activities)) THEN RAISE EXCEPTION 'LEARNING_ACTIVITY_NOT_ENABLED'; END IF;
 fp:=jsonb_build_object('profile',p_profile,'area',p_area,'course',p_course,'lesson',p_lesson,'locale',p_locale,'kind',p_kind,'submission',p_submission);
 SELECT * INTO prior FROM learning_private.commands WHERE account_id=p_user AND request_id=p_request;
 IF FOUND THEN
  IF fp<>prior.fingerprint THEN RAISE EXCEPTION 'LEARNING_REQUEST_MISMATCH'; END IF;
  RETURN prior.result;
 END IF;
 rid:=learning_private.record(p_user,p_area,p_course,p_profile);
 INSERT INTO learning_private.content_versions(area,course,lesson,locale,version,payload)
 VALUES(p_area,p_course,p_lesson,p_locale,p_version,p_source) ON CONFLICT DO NOTHING;
 INSERT INTO learning_private.events(record_id,lesson,locale,kind,origin,content_version,evidence)
 VALUES(rid,p_lesson,p_locale,p_kind,CASE WHEN p_area='kids' THEN 'kids_quiz' ELSE 'canonical_assessment' END,p_version,jsonb_build_object('submission',p_submission,'outcome',p_result));
 INSERT INTO learning_private.commands VALUES(p_user,p_request,fp,p_result,rid);
 RETURN p_result;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.record_learning_assessment(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.record_learning_assessment(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,jsonb,text) TO service_role;
--> statement-breakpoint

-- Report funding reuses existing paid/manual/invitation sources, independent of
-- question usage. Normalize course/child suffixes: TWO per package, not per course.
CREATE FUNCTION learning_private.child_consented(p_user uuid,p_profile uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prior_sub text:=current_setting('request.jwt.claim.sub',true); result boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=p_profile AND parent_id=p_user) THEN RETURN false; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
 result:=public.kids_profile_has_consent(p_profile);
 PERFORM set_config('request.jwt.claim.sub',coalesce(prior_sub,''),true);
 RETURN coalesce(result,false);
END $$;
--> statement-breakpoint


CREATE FUNCTION learning_private.report_sources(p_user uuid,p_at timestamptz DEFAULT now())
RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,record_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r learning_private.courses; s record; k text;
BEGIN
 FOR r IN SELECT * FROM learning_private.courses WHERE account_id=p_user LOOP
  IF r.profile_id IS NOT NULL AND NOT learning_private.child_consented(p_user,r.profile_id) THEN CONTINUE; END IF;
  FOR s IN SELECT * FROM billing.assistant_source_specs(p_user,r.area,CASE WHEN r.area='kids' THEN 'kids' ELSE r.course END,r.profile_id,p_at) LOOP
   k:=s.source_key;
   IF k LIKE 'lifetime:%' THEN CONTINUE; END IF;
   IF r.area='kids' AND k LIKE 'kids:%' THEN k:='kids:'||p_user;
   ELSIF k LIKE 'commerce:%' THEN k:=split_part(k,':',1)||':'||split_part(k,':',2);
   ELSIF r.area IN ('academic','technical') AND k LIKE r.area||':%' THEN k:=split_part(k,':',1)||':'||split_part(k,':',2); END IF;
   RETURN QUERY SELECT k,s.anchor,s.valid_until,r.id;
  END LOOP;
  -- Lifetime course report entitlement continues with lifetime course access,
  -- independently of its first-month-only question bonus.
  RETURN QUERY SELECT 'lifetime:'||p.id,p.paid_at,NULL::timestamptz,r.id FROM billing.commercial_purchases p
   WHERE p.user_id=p_user AND p.state='fulfilled' AND p.kind='lifetime_course' AND p.area=r.area AND p.course=CASE WHEN r.area='kids' THEN 'kids' ELSE r.course END
    AND p.child_id IS NOT DISTINCT FROM r.profile_id AND p.paid_at<=p_at;
 END LOOP;
END $$;
--> statement-breakpoint


CREATE FUNCTION public.learning_reports(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=learning_private.require_owner(); req uuid; rep learning_private.reports; start_at timestamptz; end_at timestamptz;
 source text:=p_data->>'sourceKey'; subject uuid:=coalesce(nullif(p_data->>'subjectId','')::uuid,u); sources jsonb; snap jsonb; token uuid;
BEGIN
 IF subject<>u AND (NOT public.kids_parent_can_manage_profiles() OR NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=subject AND parent_id=u)) THEN RAISE EXCEPTION 'LEARNING_SUBJECT_REQUIRED'; END IF;
 IF p_action='list' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('sourceKey',s.source_key,'startsAt',w.starts_at,'endsAt',least(w.ends_at,s.valid_until),'limit',2,
   'used',(SELECT count(*) FROM learning_private.reports x WHERE x.account_id=u AND x.source_key=s.source_key AND x.period_start=w.starts_at AND (x.state='ready' OR (x.state='generating' AND x.lease_until>now()))))),'[]')
  INTO sources FROM (SELECT s.source_key,min(s.anchor) anchor,min(s.valid_until) valid_until FROM learning_private.report_sources(u) s JOIN learning_private.courses c ON c.id=s.record_id WHERE c.subject_id=subject GROUP BY s.source_key) s
  CROSS JOIN LATERAL billing.assistant_month_window(s.anchor,now()) w;
  RETURN jsonb_build_object('sources',sources,'reports',coalesce((SELECT jsonb_agg(to_jsonb(x)-'claim_token'-'snapshot' ORDER BY created_at DESC) FROM
   (SELECT * FROM learning_private.reports WHERE account_id=u AND subject_id=subject ORDER BY created_at DESC LIMIT 50) x),'[]'));
 ELSIF p_action='reserve' THEN
  IF subject<>u AND NOT learning_private.child_consented(u,subject) THEN RAISE EXCEPTION 'LEARNING_CHILD_CONSENT_REQUIRED'; END IF;
  req:=(p_data->>'requestId')::uuid;
  IF req IS NULL OR p_data->>'locale' NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'LEARNING_REPORT_INVALID'; END IF;
  SELECT * INTO rep FROM learning_private.reports WHERE id=req FOR UPDATE;
  IF FOUND THEN
   IF rep.account_id<>u OR rep.subject_id<>subject OR rep.source_key<>source OR rep.locale<>p_data->>'locale' THEN RAISE EXCEPTION 'LEARNING_REQUEST_MISMATCH'; END IF;
   IF rep.state='ready' THEN RETURN jsonb_build_object('state','ready','report',rep.report); END IF;
   IF rep.state='generating' AND rep.lease_until>now() THEN RETURN jsonb_build_object('state','pending'); END IF;
  END IF;
  SELECT w.starts_at,least(w.ends_at,s.valid_until) INTO start_at,end_at FROM learning_private.report_sources(u) s
   CROSS JOIN LATERAL billing.assistant_month_window(s.anchor,now()) w JOIN learning_private.courses c ON c.id=s.record_id
   WHERE s.source_key=source AND c.subject_id=subject ORDER BY s.anchor LIMIT 1;
  IF start_at IS NULL OR end_at<=now() THEN RAISE EXCEPTION 'LEARNING_REPORT_PACKAGE_REQUIRED'; END IF;
  IF (SELECT count(*) FROM learning_private.reports x WHERE x.account_id=u AND x.source_key=source AND x.period_start=start_at
   AND x.id<>req AND (x.state='ready' OR (x.state='generating' AND x.lease_until>now())))>=2 THEN RAISE EXCEPTION 'LEARNING_REPORT_LIMIT'; END IF;
  SELECT jsonb_build_object('subjectId',subject,'asOf',now(),'records',coalesce(jsonb_agg(jsonb_build_object('id',c.id,'area',c.area,'course',c.course,
   'learningModel',(SELECT jsonb_build_object('version',m.version,'activities',m.activities,'completion',m.completion) FROM learning_private.course_models m WHERE m.area=c.area AND m.course=c.course AND m.is_current),
   'totalFacts',(SELECT count(*) FROM learning_private.events WHERE record_id=c.id AND kind<>'note_saved' AND origin<>'lesson_notes'),
   'factsLimit',250,
   'facts',coalesce((SELECT jsonb_agg(jsonb_build_object('lesson',e.lesson,'locale',e.locale,'kind',e.kind,'origin',e.origin,'contentVersion',e.content_version,'modelVersion',e.model_version,
    'evidence',jsonb_strip_nulls(jsonb_build_object('status',e.evidence->'status','score',e.evidence->'score',
      'read',e.evidence->'read','quizPassed',e.evidence->'quiz_passed','practiceSubmitted',e.evidence->'practice_submitted',
      'practiceReviewed',e.evidence->'practice_reviewed','isCorrect',e.evidence->'is_correct','bloomLevel',e.evidence->'bloom_level',
      'outcome',(e.evidence->'outcome')-'feedback'-'explanation')),'recordedAt',e.recorded_at)) FROM
     (SELECT * FROM learning_private.events WHERE record_id=c.id AND kind<>'note_saved' AND origin<>'lesson_notes' ORDER BY recorded_at DESC,id LIMIT 250) e),'[]'))),'[]')) INTO snap
   FROM learning_private.courses c WHERE c.account_id=u AND c.subject_id=subject AND c.id IN (SELECT record_id FROM learning_private.report_sources(u) WHERE source_key=source);
  token:=gen_random_uuid();
  INSERT INTO learning_private.reports(id,account_id,subject_id,profile_id,source_key,period_start,period_end,state,claim_token,lease_until,locale,snapshot)
  VALUES(req,u,subject,CASE WHEN subject<>u THEN subject END,source,start_at,end_at,'generating',token,now()+interval '3 minutes',p_data->>'locale',snap)
  ON CONFLICT(id) DO UPDATE SET state='generating',claim_token=token,lease_until=now()+interval '3 minutes',snapshot=snap,period_start=start_at,period_end=end_at;
  RETURN jsonb_build_object('state','claimed','claimToken',token,'snapshot',snap);
 END IF;
 RAISE EXCEPTION 'LEARNING_REPORT_ACTION_INVALID';
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.learning_reports(text,jsonb) FROM PUBLIC,anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.learning_reports(text,jsonb) TO authenticated;
--> statement-breakpoint


CREATE FUNCTION public.finish_learning_report(p_user uuid,p_request uuid,p_token uuid,p_report jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM billing.commercial_require_service(); PERFORM billing.commercial_lock(p_user);
 IF NOT billing.commercial_account_allowed(p_user) THEN RAISE EXCEPTION 'LEARNING_ACCOUNT_REQUIRED'; END IF;
 UPDATE learning_private.reports SET state=CASE WHEN p_report IS NULL THEN 'failed' ELSE 'ready' END,
  report=p_report,completed_at=now(),lease_until=now()
 WHERE id=p_request AND account_id=p_user AND claim_token=p_token AND state='generating' AND lease_until>now()
  AND (p_report IS NULL OR profile_id IS NULL OR learning_private.child_consented(p_user,profile_id));
 RETURN FOUND;
END $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.finish_learning_report(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.finish_learning_report(uuid,uuid,uuid,jsonb) TO service_role;
--> statement-breakpoint

DO $$ DECLARE f regprocedure; BEGIN
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='learning_private'
  AND p.proname IN ('require_owner','record','capture','keep_mission_completed','capture_content','capture_note_revision','model_immutable','event_model_version','can_write','erase_account','child_consented','report_sources') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f);
 END LOOP;
END $$;
