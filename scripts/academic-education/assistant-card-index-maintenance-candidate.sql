-- REVIEW ONLY. Apply with the matching application-server revision through the
-- existing central integration process. This file has not been executed.
-- Runtime, review, purchase and per-card entitlement gates are unchanged.
-- Legacy vectors have no model provenance: refresh them once before enabling
-- retrieval under this contract. Later runs embed changed section text only.
BEGIN;

ALTER TABLE public.academic_rag_chunks
 ADD COLUMN embedding_model text,
 ADD COLUMN embedding_dimensions smallint,
 ADD CONSTRAINT academic_embedding_contract CHECK (
  (embedding_model IS NULL AND embedding_dimensions IS NULL) OR
  (embedding_model IS NOT NULL AND embedding_dimensions IS NOT NULL AND
   embedding_model='text-embedding-3-small' AND embedding_dimensions=1536)
 );

-- The original FK prevents removing a lesson while its index exists. Replace only
-- that exact FK with a cascade so a real lesson deletion also removes its index.
DO $academic_index_fk$
DECLARE existing_name text; existing_count integer;
BEGIN
 SELECT min(conname),count(*) INTO existing_name,existing_count FROM pg_constraint
  WHERE conrelid='public.academic_rag_chunks'::regclass AND contype='f'
   AND confrelid='public.academic_lesson_content'::regclass
   AND conkey=ARRAY[
    (SELECT attnum FROM pg_attribute WHERE attrelid='public.academic_rag_chunks'::regclass AND attname='course_id'),
    (SELECT attnum FROM pg_attribute WHERE attrelid='public.academic_rag_chunks'::regclass AND attname='lesson_id'),
    (SELECT attnum FROM pg_attribute WHERE attrelid='public.academic_rag_chunks'::regclass AND attname='locale')
   ]::smallint[];
 IF existing_count<>1 THEN RAISE EXCEPTION 'ACADEMIC_INDEX_FK_CHANGED'; END IF;
 EXECUTE format('ALTER TABLE public.academic_rag_chunks DROP CONSTRAINT %I',existing_name);
 ALTER TABLE public.academic_rag_chunks ADD CONSTRAINT academic_rag_current_lesson_fk
  FOREIGN KEY(course_id,lesson_id,locale)
  REFERENCES public.academic_lesson_content(course_id,lesson_id,locale) ON DELETE CASCADE;
END $academic_index_fk$;

CREATE FUNCTION public.academic_sync_chunks(p_course text,p_scopes jsonb,p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE scope jsonb; r jsonb; source public.academic_lesson_content%ROWTYPE;
 section jsonb; n integer:=0;
BEGIN
 IF NOT billing.is_service_role_caller() THEN
  RAISE EXCEPTION 'SERVICE_ONLY' USING ERRCODE='42501';
 END IF;
 IF p_course IS NULL OR NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE id=p_course) THEN
  RAISE EXCEPTION 'ACADEMIC_IMPORT_COURSE';
 END IF;
 IF jsonb_typeof(p_scopes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_scopes) NOT BETWEEN 1 AND 4
  OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows)>80 THEN
  RAISE EXCEPTION 'ACADEMIC_IMPORT_SIZE';
 END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p_scopes)) <>
    (SELECT count(DISTINCT (value->>'lesson_id',value->>'locale')) FROM jsonb_array_elements(p_scopes)) THEN
  RAISE EXCEPTION 'ACADEMIC_IMPORT_DUPLICATE_SCOPE';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('academic-index:'||p_course,0));

 -- Lock and verify the exact snapshots before any mutation. A concurrent content
 -- edit causes rollback; an older request cannot overwrite or prune a newer one.
 FOR scope IN SELECT value FROM jsonb_array_elements(p_scopes) LOOP
  SELECT * INTO source FROM public.academic_lesson_content
   WHERE course_id=p_course AND lesson_id=scope->>'lesson_id' AND locale=scope->>'locale' FOR SHARE;
  IF NOT FOUND OR source.source_sha256 IS DISTINCT FROM scope->>'source_sha256'
   OR to_jsonb(source.approved) IS DISTINCT FROM scope->'approved' THEN
   RAISE EXCEPTION 'ACADEMIC_IMPORT_SOURCE_CHANGED';
  END IF;
 END LOOP;

 FOR r IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  IF r->>'course_id' IS DISTINCT FROM p_course OR
   NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_scopes) s
    WHERE s->>'lesson_id'=r->>'lesson_id' AND s->>'locale'=r->>'locale') THEN
   RAISE EXCEPTION 'ACADEMIC_IMPORT_SCOPE';
  END IF;
  SELECT * INTO source FROM public.academic_lesson_content
   WHERE course_id=p_course AND lesson_id=r->>'lesson_id' AND locale=r->>'locale' AND approved;
  IF NOT FOUND OR source.source_sha256 IS DISTINCT FROM r->>'source_sha256' THEN
   RAISE EXCEPTION 'ACADEMIC_IMPORT_SOURCE';
  END IF;
  SELECT value INTO section FROM jsonb_array_elements(source.payload->'sections')
   WHERE value->>'id'=r->>'section_id';
  IF section IS NULL OR (section->>'title')||E'\n'||(section->>'text') IS DISTINCT FROM r->>'content'
   OR coalesce(source.payload->>'version','1.0.0-pilot') IS DISTINCT FROM r->>'content_version'
   OR encode(extensions.digest(convert_to(r->>'content','UTF8'),'sha256'),'hex') IS DISTINCT FROM r->>'content_sha256'
   OR r->>'embedding_model' IS DISTINCT FROM 'text-embedding-3-small'
   OR r->>'embedding_dimensions' IS DISTINCT FROM '1536'
   OR extensions.vector_dims((r->>'embedding')::extensions.vector)<>1536 THEN
   RAISE EXCEPTION 'ACADEMIC_IMPORT_SECTION';
  END IF;
  INSERT INTO public.academic_rag_chunks(course_id,lesson_id,locale,section_id,content_version,
   source_sha256,content_sha256,content,embedding,embedding_model,embedding_dimensions)
  VALUES(p_course,r->>'lesson_id',r->>'locale',r->>'section_id',r->>'content_version',
   r->>'source_sha256',r->>'content_sha256',r->>'content',(r->>'embedding')::extensions.vector,
   'text-embedding-3-small',1536)
  ON CONFLICT(course_id,lesson_id,locale,section_id,content_version) DO UPDATE SET
   source_sha256=EXCLUDED.source_sha256,content_sha256=EXCLUDED.content_sha256,
   content=EXCLUDED.content,embedding=EXCLUDED.embedding,embedding_model=EXCLUDED.embedding_model,
   embedding_dimensions=EXCLUDED.embedding_dimensions;
  n:=n+1;
 END LOOP;

 -- Require a complete replacement for each approved lesson/locale before pruning.
 -- Unchanged sections may already exist; metadata-only refreshes reuse their vector.
 FOR scope IN SELECT value FROM jsonb_array_elements(p_scopes) LOOP
  SELECT * INTO source FROM public.academic_lesson_content
   WHERE course_id=p_course AND lesson_id=scope->>'lesson_id' AND locale=scope->>'locale';
  IF source.approved AND EXISTS(SELECT 1 FROM jsonb_array_elements(source.payload->'sections') s
   WHERE NOT EXISTS(SELECT 1 FROM public.academic_rag_chunks c
    WHERE c.course_id=p_course AND c.lesson_id=source.lesson_id AND c.locale=source.locale
     AND c.section_id=s->>'id' AND c.source_sha256=source.source_sha256
     AND c.content_version=coalesce(source.payload->>'version','1.0.0-pilot')
     AND c.content=(s->>'title')||E'\n'||(s->>'text')
     AND c.content_sha256=encode(extensions.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')
     AND c.embedding_model='text-embedding-3-small' AND c.embedding_dimensions=1536)) THEN
   RAISE EXCEPTION 'ACADEMIC_INDEX_REPLACEMENT_INCOMPLETE';
  END IF;
  DELETE FROM public.academic_rag_chunks c
   WHERE c.course_id=p_course AND c.lesson_id=source.lesson_id AND c.locale=source.locale
    AND NOT (source.approved AND c.source_sha256=source.source_sha256
     AND c.content_version=coalesce(source.payload->>'version','1.0.0-pilot')
     AND c.embedding_model IS NOT DISTINCT FROM 'text-embedding-3-small'
     AND c.embedding_dimensions IS NOT DISTINCT FROM 1536
     AND c.content_sha256=encode(extensions.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')
     AND EXISTS(SELECT 1 FROM jsonb_array_elements(source.payload->'sections') s
      WHERE s->>'id'=c.section_id AND (s->>'title')||E'\n'||(s->>'text')=c.content));
 END LOOP;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.academic_sync_chunks(text,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.academic_sync_chunks(text,jsonb,jsonb) TO service_role;

COMMIT;
