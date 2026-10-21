-- ACTIVATE ONLY after preparation and complete provenance refresh.
-- No content, vectors, access policy or commercial quota is changed here.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Keep source edits and concurrent index refreshes out of the readiness check
-- and RPC replacement; a changed snapshot must not slip between those steps.
LOCK TABLE public.academic_courses, public.academic_lesson_content,
 public.academic_rag_chunks IN SHARE ROW EXCLUSIVE MODE;
DO $academic_activation$
BEGIN
 IF EXISTS(SELECT 1 FROM public.academic_courses c
  WHERE ((c.enabled AND c.assistant_enabled) OR c.assistant_review_enabled)
   AND NOT EXISTS(SELECT 1 FROM public.academic_lesson_content l
    WHERE l.course_id=c.id AND l.approved)) THEN
  RAISE EXCEPTION 'ACADEMIC_ACTIVATION_CORPUS_EMPTY';
 END IF;
 IF EXISTS(SELECT 1 FROM public.academic_courses c
  JOIN (SELECT DISTINCT course_id,lesson_id FROM public.academic_lesson_content WHERE approved) ids
   ON ids.course_id=c.id
  CROSS JOIN (VALUES('ar-EG'),('ar-MSA'),('ar-Gulf'),('en')) locales(locale)
  WHERE ((c.enabled AND c.assistant_enabled) OR c.assistant_review_enabled)
   AND NOT EXISTS(SELECT 1 FROM public.academic_lesson_content l
    WHERE l.course_id=ids.course_id AND l.lesson_id=ids.lesson_id
     AND l.locale=locales.locale AND l.approved)) THEN
  RAISE EXCEPTION 'ACADEMIC_ACTIVATION_LOCALE_INCOMPLETE';
 END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l
  JOIN public.academic_courses c ON c.id=l.course_id
  WHERE l.approved AND ((c.enabled AND c.assistant_enabled) OR c.assistant_review_enabled)
   AND CASE WHEN jsonb_typeof(l.payload->'sections') IS DISTINCT FROM 'array' THEN true
    ELSE jsonb_array_length(l.payload->'sections')=0 END) THEN
  RAISE EXCEPTION 'ACADEMIC_ACTIVATION_SOURCE_INVALID';
 END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l
  JOIN public.academic_courses c ON c.id=l.course_id
  CROSS JOIN LATERAL jsonb_array_elements(l.payload->'sections') s
  WHERE l.approved AND ((c.enabled AND c.assistant_enabled) OR c.assistant_review_enabled)
   AND NOT EXISTS(SELECT 1 FROM public.academic_rag_chunks r
    WHERE r.course_id=l.course_id AND r.lesson_id=l.lesson_id AND r.locale=l.locale
     AND r.section_id=s->>'id' AND r.source_sha256=l.source_sha256
     AND r.content_version=coalesce(l.payload->>'version','1.0.0-pilot')
     AND r.content=(s->>'title')||E'\n'||(s->>'text')
     AND r.content_sha256=encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex')
     AND r.embedding_model='text-embedding-3-small' AND r.embedding_dimensions=1536
     AND extensions.vector_dims(r.embedding)=1536
     AND abs(r.embedding OPERATOR(extensions.<=>) r.embedding)<=0.000001)) THEN
  RAISE EXCEPTION 'ACADEMIC_ACTIVATION_INDEX_INCOMPLETE';
 END IF;
END $academic_activation$;

-- Retire the unused legacy importer; no CASCADE, so unexpected dependents stop
-- this change. Historical migration text is retained as an audit record.
DROP FUNCTION public.academic_import_chunks(jsonb);

CREATE OR REPLACE FUNCTION public.academic_rag_match(
 p_course text,p_locale text,p_embedding extensions.vector,p_limit integer DEFAULT 6
) RETURNS TABLE(course_id text,lesson_id text,locale text,section_id text,content text,similarity double precision)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT r.course_id,r.lesson_id,r.locale,r.section_id,r.content,
  (1-(r.embedding OPERATOR(extensions.<=>) p_embedding))::double precision
 FROM public.academic_rag_chunks r
 JOIN public.academic_lesson_content l ON l.course_id=r.course_id AND l.lesson_id=r.lesson_id
  AND l.locale=r.locale AND l.approved AND l.source_sha256=r.source_sha256
  AND coalesce(l.payload->>'version','1.0.0-pilot')=r.content_version
 JOIN public.academic_courses c ON c.id=r.course_id AND
  ((c.enabled AND c.assistant_enabled) OR c.assistant_review_enabled)
 WHERE r.course_id=p_course AND r.locale=p_locale
  AND p_course IS NOT NULL AND p_locale IN ('ar-EG','ar-MSA','ar-Gulf','en') AND p_limit BETWEEN 1 AND 8
  AND r.embedding_model='text-embedding-3-small' AND r.embedding_dimensions=1536
  AND r.content_sha256=encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex')
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(l.payload->'sections') s
   WHERE s->>'id'=r.section_id AND (s->>'title')||E'\n'||(s->>'text')=r.content)
  AND 1-(r.embedding OPERATOR(extensions.<=>) p_embedding)>=0.35
 ORDER BY r.embedding OPERATOR(extensions.<=>) p_embedding ASC LIMIT least(p_limit,8);
$$;
REVOKE ALL ON FUNCTION public.academic_rag_match(text,text,extensions.vector,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.academic_rag_match(text,text,extensions.vector,integer) TO service_role;
COMMIT;
