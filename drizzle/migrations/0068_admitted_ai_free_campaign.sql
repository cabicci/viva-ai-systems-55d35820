-- An AI-wide campaign covers published admitted AI lessons as well as native paths.
-- Keep the existing active-edition, password, account and child checks ahead of this grant.
DO $migration$
DECLARE
  definition text;
  original text := 'OR billing.free_access_has(p_user,''curriculum:''||p_area||'':''||p_course)';
  updated text := original || chr(10) || '  OR (p_area=''ai'' AND billing.free_access_has(p_user,''ai''))';
  ai_questions text := 'p_course=''ai'' AND EXISTS(SELECT 1 FROM unnest(w.targets) t WHERE t=''ai'' OR t LIKE ''ai:%'')';
  updated_questions text := '(' || ai_questions || $new$)
    OR (p_course <> 'ai'
      AND (w.targets && ARRAY['ai','curriculum:ai:' || p_course])
      AND EXISTS (SELECT 1 FROM curriculum_private.courses c WHERE c.area='ai' AND c.id=p_course AND c.active_version IS NOT NULL)
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id=p_user AND u.email_confirmed_at IS NOT NULL))$new$;
BEGIN
  definition := pg_get_functiondef('curriculum_private.access(uuid,text,text,text,text,uuid)'::regprocedure);
  IF strpos(definition,updated)=0 THEN
    IF array_length(string_to_array(definition,original),1)<>2 THEN
      RAISE EXCEPTION 'Unexpected curriculum access definition';
    END IF;
    EXECUTE replace(definition,original,updated);
  END IF;

  definition := pg_get_functiondef('billing.free_access_question_specs(uuid,text,text,uuid,timestamptz)'::regprocedure);
  IF strpos(definition,updated_questions)=0 THEN
    IF array_length(string_to_array(definition,ai_questions),1)<>2 THEN
      RAISE EXCEPTION 'Unexpected free campaign question definition';
    END IF;
    EXECUTE replace(definition,ai_questions,updated_questions);
  END IF;
END
$migration$;
