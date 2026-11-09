-- Admitted curricula: an explicit read model, version-bound positions and disjoint free targets.
-- Existing rows remain unknown-version; never infer a version from their timestamp.
ALTER TABLE learning_private.positions ADD COLUMN content_version text;

CREATE FUNCTION curriculum_private.position_version(r learning_private.courses, lesson_id text, lang text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN learning_private.can_write(r,lesson_id,lang) THEN
   coalesce((SELECT x.version FROM curriculum_private.attempts x
     WHERE x.account_id=r.account_id AND x.profile_id IS NOT DISTINCT FROM r.profile_id
       AND x.area=r.area AND x.course=r.course AND x.lesson=lesson_id AND x.locale=lang
       AND x.result IS NULL AND x.expires_at>now() ORDER BY x.started_at LIMIT 1),c.active_version)
 END
 FROM curriculum_private.courses c WHERE c.area=r.area AND c.id=r.course;
$$;

-- STABLE fixes all nested catalogue/progress/attempt/position reads to the caller's
-- statement snapshot. The caller additionally holds FOR SHARE on the course row,
-- which conflicts with publication UPDATE/DELETE (unlike the account lifecycle lock).
CREATE FUNCTION curriculum_private.journey_snapshot(u uuid, d jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a text:=d->>'area'; cid text:=d->>'course'; lang text:=d->>'locale';
 child uuid:=(d->>'profileId')::uuid; ver text; cat jsonb; r learning_private.courses;
 states jsonb; prog jsonb:='[]'; resume jsonb; review boolean:=false; accessible boolean;
BEGIN
 SELECT active_version INTO ver FROM curriculum_private.courses WHERE area=a AND id=cid;
 IF ver IS NULL OR ver IS DISTINCT FROM d->>'version' THEN RAISE EXCEPTION 'CURRICULUM_CONTENT_CHANGED'; END IF;
 SELECT item INTO cat FROM jsonb_array_elements(public.curriculum_catalogue(a,lang)) item WHERE item->>'id'=cid;
 IF cat IS NULL THEN RAISE EXCEPTION 'CURRICULUM_ACCESS_REQUIRED' USING ERRCODE='42501'; END IF;
 review:=a='kids' AND child=u AND billing.commercial_admin(u);
 IF a='kids' AND NOT review THEN
   IF child IS NULL OR NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=child AND parent_id=u)
     OR NOT curriculum_private.child_allowed(u,child) THEN RAISE EXCEPTION 'LEARNING_SUBJECT_REQUIRED'; END IF;
 ELSIF a<>'kids' AND child IS NOT NULL THEN RAISE EXCEPTION 'LEARNING_SUBJECT_REQUIRED'; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(cat->'stations') s,
   jsonb_array_elements(s->'steps') st WHERE curriculum_private.access(u,a,cid,st->>'id',lang,child)) INTO accessible;
 IF NOT review AND accessible THEN
   SELECT * INTO r FROM learning_private.courses WHERE account_id=u AND subject_id=coalesce(child,u)
     AND profile_id IS NOT DISTINCT FROM child AND area=a AND course=cid;
   IF r.id IS NOT NULL THEN prog:=curriculum_private.progress(r.id,a,cid,ver,lang); END IF;
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('lesson',st->>'id',
   'available',curriculum_private.access(u,a,cid,st->>'id',lang,child),
   'required',coalesce((p->>'required')::integer,0), 'completed',coalesce((p->>'completed')::integer,0),
   'done',coalesce((p->>'done')::boolean,false),
   'deliveryVersion',CASE WHEN r.id IS NULL THEN ver ELSE coalesce(curriculum_private.position_version(r,st->>'id',lang),ver) END)
   ORDER BY si,ti),'[]') INTO states
 FROM jsonb_array_elements(cat->'stations') WITH ORDINALITY station(s,si)
 CROSS JOIN LATERAL jsonb_array_elements(s->'steps') WITH ORDINALITY step(st,ti)
 LEFT JOIN LATERAL (SELECT value p FROM jsonb_array_elements(prog) WHERE value->>'lesson'=st->>'id') completion ON true;
 IF r.id IS NOT NULL THEN
   SELECT jsonb_build_object('lesson',pos.lesson,'ratio',pos.ratio,'contentVersion',pos.content_version,'savedAt',pos.updated_at)
   INTO resume FROM learning_private.positions pos JOIN jsonb_array_elements(states) WITH ORDINALITY state(s,n)
     ON s->>'lesson'=pos.lesson AND s->>'available'='true' AND s->>'deliveryVersion'=ver
   WHERE pos.record_id=r.id AND pos.locale=lang AND pos.content_version=ver
   ORDER BY pos.updated_at DESC,n LIMIT 1;
 END IF;
 RETURN jsonb_build_object('area',a,'course',cid,'locale',lang,'profileId',child,'activeVersion',ver,
   'recordId',r.id,'reviewOnly',review,'lessons',states,'resume',resume);
END;
$$;

CREATE FUNCTION curriculum_private.journey_read(u uuid, d jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF jsonb_typeof(d) IS DISTINCT FROM 'object' OR octet_length(d::text)>2000
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(d) k WHERE k NOT IN ('area','course','locale','profileId','version'))
  OR jsonb_typeof(d->'area') IS DISTINCT FROM 'string' OR d->>'area' NOT IN ('ai','academic','technical','kids')
  OR jsonb_typeof(d->'course') IS DISTINCT FROM 'string' OR d->>'course' !~ '^[A-Za-z0-9][A-Za-z0-9-]{0,79}$'
  OR jsonb_typeof(d->'locale') IS DISTINCT FROM 'string' OR d->>'locale' NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
  OR jsonb_typeof(d->'version') IS DISTINCT FROM 'string' OR d->>'version' !~ '^[a-f0-9]{64}$'
  OR (d ? 'profileId' AND (jsonb_typeof(d->'profileId') IS DISTINCT FROM 'string'
       OR d->>'profileId' !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'))
 THEN RAISE EXCEPTION 'CURRICULUM_COMMAND_INVALID'; END IF;
 PERFORM 1 FROM curriculum_private.courses WHERE area=d->>'area' AND id=d->>'course' FOR SHARE;
 RETURN curriculum_private.journey_snapshot(u,d);
END;
$$;

CREATE FUNCTION curriculum_private.versioned_position(action text, d jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=learning_private.require_owner(); r learning_private.courses; result jsonb;
BEGIN
 IF action NOT IN ('position','save_position') OR jsonb_typeof(d) IS DISTINCT FROM 'object' OR octet_length(d::text)>2000
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(d) k WHERE k NOT IN ('recordId','lesson','locale','contentVersion','ratio'))
  OR jsonb_typeof(d->'recordId') IS DISTINCT FROM 'string'
  OR jsonb_typeof(d->'lesson') IS DISTINCT FROM 'string' OR length(d->>'lesson') NOT BETWEEN 1 AND 80
  OR jsonb_typeof(d->'locale') IS DISTINCT FROM 'string' OR d->>'locale' NOT IN ('ar-EG','ar-MSA','ar-Gulf','en')
  OR jsonb_typeof(d->'contentVersion') IS DISTINCT FROM 'string' OR d->>'contentVersion' !~ '^[a-f0-9]{64}$'
  OR (action='position' AND d ? 'ratio')
  OR (action='save_position' AND (jsonb_typeof(d->'ratio') IS DISTINCT FROM 'number'
       OR (d->>'ratio')::numeric NOT BETWEEN 0 AND 1))
 THEN RAISE EXCEPTION 'CURRICULUM_POSITION_INVALID'; END IF;
 SELECT * INTO r FROM learning_private.courses WHERE id=(d->>'recordId')::uuid AND account_id=u;
 IF r.id IS NULL THEN RAISE EXCEPTION 'LEARNING_RECORD_REQUIRED'; END IF;
 IF r.profile_id IS NOT NULL AND (NOT public.kids_parent_can_manage_profiles()
   OR NOT EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=r.profile_id AND parent_id=u))
 THEN RAISE EXCEPTION 'LEARNING_PARENT_REQUIRED'; END IF;
 PERFORM 1 FROM curriculum_private.courses WHERE area=r.area AND id=r.course FOR SHARE;
 -- Permission, effective-version, payload existence and the read/write share ONE
 -- SQL statement snapshot. Attempt changes after it cannot relabel this request.
 IF action='position' THEN
   SELECT jsonb_build_object('allowed',curriculum_private.position_version(r,d->>'lesson',d->>'locale')=d->>'contentVersion'
       AND EXISTS(SELECT 1 FROM curriculum_private.lessons WHERE area=r.area AND course=r.course
         AND lesson=d->>'lesson' AND locale=d->>'locale' AND version=d->>'contentVersion'),
     'position',coalesce((SELECT jsonb_build_object('ratio',ratio,'contentVersion',content_version)
       FROM learning_private.positions WHERE record_id=r.id AND lesson=d->>'lesson' AND locale=d->>'locale'
         AND content_version=d->>'contentVersion'),'{}')) INTO result;
   IF result->>'allowed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'CURRICULUM_CONTENT_CHANGED'; END IF;
   RETURN result->'position';
 END IF;
 INSERT INTO learning_private.positions(record_id,lesson,locale,ratio,content_version)
 SELECT r.id,d->>'lesson',d->>'locale',(d->>'ratio')::numeric,d->>'contentVersion'
 WHERE curriculum_private.position_version(r,d->>'lesson',d->>'locale')=d->>'contentVersion'
   AND EXISTS(SELECT 1 FROM curriculum_private.lessons WHERE area=r.area AND course=r.course
     AND lesson=d->>'lesson' AND locale=d->>'locale' AND version=d->>'contentVersion')
 ON CONFLICT(record_id,lesson,locale) DO UPDATE SET ratio=excluded.ratio,
   content_version=excluded.content_version,updated_at=now();
 IF NOT FOUND THEN RAISE EXCEPTION 'CURRICULUM_CONTENT_CHANGED'; END IF;
 RETURN '{}'::jsonb;
END;
$$;

-- Preserve original operations byte-for-byte around checked, unique insertion
-- points. Never reconstruct human copy from a redacted metadata receipt.
DO $patch$
DECLARE original text; anchor text; addition text;
BEGIN
 original:=pg_get_functiondef('public.curriculum_command(text,jsonb)'::regprocedure);
 anchor:=E'BEGIN\n IF p_action NOT IN';
 IF array_length(string_to_array(original,anchor),1)<>2 THEN RAISE EXCEPTION 'M14_CURRICULUM_ANCHOR_CHANGED'; END IF;
 EXECUTE replace(original,anchor,E'BEGIN\n IF p_action=''journey'' THEN RETURN curriculum_private.journey_read(u,p_data); END IF;\n IF p_action NOT IN');

 -- Legacy clients retain their original write path. An unversioned overwrite
 -- cannot keep the provenance of a versioned position it replaced.
 original:=pg_get_functiondef('curriculum_private.previous_learning_command(text,jsonb)'::regprocedure);
 anchor:='ON CONFLICT(record_id,lesson,locale) DO UPDATE SET ratio=excluded.ratio,updated_at=now();';
 IF array_length(string_to_array(original,anchor),1)<>2 THEN RAISE EXCEPTION 'M14_LEGACY_POSITION_ANCHOR_CHANGED'; END IF;
 EXECUTE replace(original,anchor,'ON CONFLICT(record_id,lesson,locale) DO UPDATE SET ratio=excluded.ratio,updated_at=now(),content_version=NULL;');

 original:=pg_get_functiondef('public.learning_command(text,jsonb)'::regprocedure);
 anchor:=' result:=curriculum_private.previous_learning_command(p_action,p_data);';
 IF array_length(string_to_array(original,anchor),1)<>2 THEN RAISE EXCEPTION 'M14_LEARNING_ANCHOR_CHANGED'; END IF;
 addition:=$body$
 IF p_action IN ('position','save_position') AND p_data ? 'contentVersion' AND EXISTS(
   SELECT 1 FROM learning_private.courses r JOIN curriculum_private.courses c ON c.area=r.area AND c.id=r.course
   WHERE r.id=(p_data->>'recordId')::uuid AND r.account_id=auth.uid()) THEN
   RETURN curriculum_private.versioned_position(p_action,p_data);
 END IF;
$body$;
 EXECUTE replace(original,anchor,addition||anchor);

 original:=pg_get_functiondef('curriculum_private.access(uuid,text,text,text,text,uuid)'::regprocedure);
 anchor:=' RETURN billing.commercial_course_owned(p_user,p_area,p_course,p_child)';
 IF array_length(string_to_array(original,anchor),1)<>2 THEN RAISE EXCEPTION 'M14_ACCESS_ANCHOR_CHANGED'; END IF;
 EXECUTE replace(original,anchor,anchor||E'\n  OR billing.free_access_has(p_user,''curriculum:''||p_area||'':''||p_course)');

 original:=pg_get_functiondef('billing.free_access_targets()'::regprocedure);
 IF md5(original)<>'4cbfe78e0ad627232091ec7b58393576' THEN RAISE EXCEPTION 'M14_TARGET_DEFINITION_CHANGED'; END IF;
 anchor:='FROM public.academic_courses c),''[]''::jsonb);';
 IF array_length(string_to_array(original,anchor),1)<>2 THEN RAISE EXCEPTION 'M14_TARGET_ANCHOR_CHANGED'; END IF;
 addition:=$body$FROM public.academic_courses c),'[]'::jsonb)
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','curriculum:'||c.area||':'||c.id,
   'title',coalesce(c.titles->>'en',c.titles->>c.locales[1],c.id),'titles',c.titles,'published',true)
   ORDER BY c.area,c.id) FROM curriculum_private.courses c JOIN curriculum_private.versions v
   ON v.area=c.area AND v.course=c.id AND v.version=c.active_version),'[]'::jsonb);$body$;
 EXECUTE replace(original,anchor,addition);
END;
$patch$;

ALTER FUNCTION curriculum_private.position_version(learning_private.courses,text,text) OWNER TO postgres;
ALTER FUNCTION curriculum_private.journey_snapshot(uuid,jsonb) OWNER TO postgres;
ALTER FUNCTION curriculum_private.journey_read(uuid,jsonb) OWNER TO postgres;
ALTER FUNCTION curriculum_private.versioned_position(text,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION curriculum_private.position_version(learning_private.courses,text,text),
 curriculum_private.journey_snapshot(uuid,jsonb),curriculum_private.journey_read(uuid,jsonb),
 curriculum_private.versioned_position(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
