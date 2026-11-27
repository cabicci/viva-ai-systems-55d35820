-- Exercise prompts often repeat the learner's question verbatim. Use the
-- authored explanations and first worked example for the reserved lesson slots.
DO $migration$
DECLARE
  definition text := pg_get_functiondef('public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text)'::regprocedure);
  original text := $old$SELECT ranked.* FROM (
    SELECT ch.area,ch.course,ch.version,ch.lesson,ch.locale,ch.id,ch.content,ch.source_sha,ch.content_sha,
      ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector AS distance,
      row_number() OVER (PARTITION BY (ch.lesson=p_lesson)
        ORDER BY ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector,ch.lesson,ch.id) AS scope_rank
    FROM curriculum_private.chunks ch
    WHERE ch.area=p_area AND ch.course=p_course AND ch.version=ver AND ch.locale=p_locale
  ) ranked
  ORDER BY CASE WHEN ranked.lesson=p_lesson AND ranked.scope_rank<=3 THEN 0 ELSE 1 END,
    ranked.distance,ranked.lesson,ranked.id LIMIT 6$old$;
  updated text := $new$WITH lesson_sections AS (
    SELECT section->>'id'||'-part-1' AS chunk_id,section->>'kind' AS kind,
      row_number() OVER (PARTITION BY section->>'kind' ORDER BY position) AS kind_rank
    FROM curriculum_private.lessons l
    CROSS JOIN LATERAL jsonb_array_elements(l.payload->'sections') WITH ORDINALITY AS authored(section,position)
    WHERE (l.area,l.course,l.version,l.lesson,l.locale)=(p_area,p_course,ver,p_lesson,p_locale)
      AND section->>'kind' IN ('explanation','example') AND jsonb_array_length(section->'paragraphs')>0
  ), anchors AS (
    SELECT chunk_id FROM lesson_sections
    WHERE (kind='explanation' AND kind_rank<=2) OR (kind='example' AND kind_rank=1)
  )
  SELECT ranked.* FROM (
    SELECT ch.area,ch.course,ch.version,ch.lesson,ch.locale,ch.id,ch.content,ch.source_sha,ch.content_sha,
      ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector AS distance,
      row_number() OVER (PARTITION BY (ch.lesson=p_lesson)
        ORDER BY (anchor.chunk_id IS NULL),ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector,ch.lesson,ch.id) AS scope_rank
    FROM curriculum_private.chunks ch
    LEFT JOIN anchors anchor ON ch.lesson=p_lesson AND ch.id=anchor.chunk_id
    WHERE ch.area=p_area AND ch.course=p_course AND ch.version=ver AND ch.locale=p_locale
  ) ranked
  ORDER BY CASE WHEN ranked.lesson=p_lesson AND ranked.scope_rank<=3 THEN 0 ELSE 1 END,
    ranked.distance,ranked.lesson,ranked.id LIMIT 6$new$;
BEGIN
  IF strpos(definition,updated)>0 THEN RETURN; END IF;
  IF array_length(string_to_array(definition,original),1)<>2 THEN
    RAISE EXCEPTION 'Unexpected current-lesson retrieval definition';
  END IF;
  EXECUTE replace(definition,original,updated);
END
$migration$;
