-- Reserve evidence from the lesson the learner has open. Fill the other slots
-- with the closest verified passages in the same edition and language.
DO $migration$
DECLARE
  definition text := pg_get_functiondef('public.curriculum_assistant_source(uuid,text,text,text,text,uuid,text)'::regprocedure);
  original text := $old$SELECT * FROM curriculum_private.chunks WHERE area=p_area AND course=p_course AND version=ver AND locale=p_locale
  ORDER BY embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector LIMIT 6$old$;
  updated text := $new$SELECT ranked.* FROM (
    SELECT ch.area,ch.course,ch.version,ch.lesson,ch.locale,ch.id,ch.content,ch.source_sha,ch.content_sha,
      ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector AS distance,
      row_number() OVER (PARTITION BY (ch.lesson=p_lesson)
        ORDER BY ch.embedding OPERATOR(extensions.<=>) p_embedding::extensions.vector,ch.lesson,ch.id) AS scope_rank
    FROM curriculum_private.chunks ch
    WHERE ch.area=p_area AND ch.course=p_course AND ch.version=ver AND ch.locale=p_locale
  ) ranked
  ORDER BY CASE WHEN ranked.lesson=p_lesson AND ranked.scope_rank<=3 THEN 0 ELSE 1 END,
    ranked.distance,ranked.lesson,ranked.id LIMIT 6$new$;
BEGIN
  IF strpos(definition,updated)>0 THEN RETURN; END IF;
  IF array_length(string_to_array(definition,original),1)<>2 THEN
    RAISE EXCEPTION 'Unexpected admitted lesson evidence query';
  END IF;
  EXECUTE replace(definition,original,updated);
END
$migration$;
