-- Requires the canonical learning-record wrapper, commands ledger and lifecycle
-- lock already installed. No alternative authority or historical backfill.
DO $$ BEGIN
 IF to_regclass('learning_private.commands') IS NULL
 OR to_regprocedure('billing.commercial_lock(uuid)') IS NULL
 OR to_regprocedure('public.learning_previous_technical_command(text,text,text,jsonb)') IS NULL
 OR to_regprocedure('billing.free_window_previous_technical_command(text,text,text,jsonb)') IS NULL
 OR to_regprocedure('public.technical_command_before_quiz_ordering(text,text,text,jsonb)') IS NOT NULL THEN
  RAISE EXCEPTION 'TECHNICAL_COMMAND_MIGRATION_PREREQUISITE';
 END IF;
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='billing.free_window_previous_technical_command(text,text,text,jsonb)'::regprocedure)
     IS DISTINCT FROM 'c7799bf6aa1043a0345e9775046d2583' THEN
  RAISE EXCEPTION 'TECHNICAL_COMMAND_BASE_DEFINITION_CHANGED';
 END IF;
END $$;
ALTER TABLE public.technical_progress ADD COLUMN quiz_revision bigint NOT NULL DEFAULT 0
 CHECK(quiz_revision BETWEEN 0 AND 9007199254740991);

-- Preserve the original grading/access logic. Only status exposes the revision,
-- and the existing quiz/reset UPDATE advances it in the same source mutation.
CREATE OR REPLACE FUNCTION billing.free_window_previous_technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); c public.technical_lesson_content%ROWTYPE; q jsonb; stripped jsonb; results jsonb:='[]';
 score integer:=0; total integer:=0; selected integer; correct integer; passed boolean; v_drafts jsonb; v_files jsonb;
BEGIN
 PERFORM billing.commerce_assert_identity(u);
 IF NOT EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) THEN RAISE EXCEPTION 'TECHNICAL_UNAVAILABLE'; END IF;
 IF p_action='status' THEN
  RETURN jsonb_build_object('paid',public.technical_can_access('M01-L02'),'stripe',EXISTS(SELECT 1 FROM billing.technical_stripe_subscriptions WHERE user_id=u AND status IN ('active','trialing','past_due','unpaid','paused')),'progress',coalesce((SELECT jsonb_object_agg(lesson_id,
    jsonb_build_object('read',read,'quizPassed',quiz_passed,'quizRevision',quiz_revision,'practiceReviewed',practice_reviewed,'drafts',drafts))
    FROM public.technical_progress WHERE user_id=u),'{}'::jsonb));
 END IF;
 IF p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LOCALE'; END IF;
 SELECT * INTO c FROM public.technical_lesson_content WHERE lesson_id=p_lesson AND locale=p_locale;
 IF NOT FOUND THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LESSON'; END IF;
 IF NOT public.technical_can_access(p_lesson) THEN RETURN jsonb_build_object('allowed',false); END IF;
 IF octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_INPUT'; END IF;
 IF p_action='lesson' THEN
  stripped:=c.payload;
   stripped:=jsonb_set(stripped,'{quiz}',coalesce((SELECT jsonb_agg(x-'correct'-'explanation') FROM jsonb_array_elements(c.payload->'quiz') x),'[]'));
  SELECT jsonb_agg(jsonb_build_object('kind',kind,'path',path)) INTO v_files FROM public.technical_asset_manifest WHERE lesson_id=p_lesson AND locale=p_locale;
  RETURN jsonb_build_object('allowed',true,'kind',c.kind,'lesson',stripped,'files',coalesce(v_files,'[]'),
   'video',format('https://iframe.mediadelivery.net/embed/670679/%s?autoplay=false&preload=true',c.video_guid));
 END IF;
 INSERT INTO public.technical_progress(user_id,lesson_id) VALUES(u,p_lesson) ON CONFLICT DO NOTHING;
 IF p_action='read' THEN
  UPDATE public.technical_progress SET read=true,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='reset_quiz' THEN
  UPDATE public.technical_progress SET quiz_passed=false,quiz_revision=quiz_revision+1,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='reset_practice' THEN
  UPDATE public.technical_progress SET practice_reviewed=false,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
 ELSIF p_action='quiz' THEN
  FOR q IN SELECT value FROM jsonb_array_elements(c.payload->'quiz') LOOP
   total:=total+1;
   IF jsonb_typeof(p_data->'answers'->(q->>'id')) IS DISTINCT FROM 'number'
    OR (p_data->'answers'->>(q->>'id')) !~ '^[0-9]+$' THEN RAISE EXCEPTION 'TECHNICAL_INCOMPLETE_QUIZ'; END IF;
   selected:=(p_data->'answers'->>(q->>'id'))::integer;
   IF selected NOT BETWEEN 0 AND jsonb_array_length(q->'options')-1 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ANSWER'; END IF;
   correct:=CASE WHEN c.kind='cabinet' THEN CASE q->>'id' WHEN 'width' THEN 1 WHEN 'depth' THEN 2 WHEN 'quantity' THEN 0 WHEN 'release' THEN 1 END ELSE (q->>'correct')::integer END;
   IF correct IS NULL THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ASSESSMENT'; END IF;
   IF selected=correct THEN score:=score+1; END IF;
   results:=results||jsonb_build_array(jsonb_build_object('id',q->>'id','correct',selected=correct,'explanation',q->>'explanation'));
  END LOOP;
  IF total=0 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_ASSESSMENT'; END IF;
  passed:=score=total;
  UPDATE public.technical_progress SET quiz_passed=passed,quiz_revision=quiz_revision+1,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
  RETURN jsonb_build_object('allowed',true,'score',score,'total',total,'passed',passed,'feedback',results);
 ELSIF p_action='practice' THEN
  IF c.kind='cabinet' THEN
   v_drafts:=p_data->'values';
   IF jsonb_typeof(v_drafts) IS DISTINCT FROM 'object' OR v_drafts-ARRAY['innerWidth','bodyDepth','opening']::text[] <> '{}' THEN RAISE EXCEPTION 'TECHNICAL_INVALID_PRACTICE'; END IF;
   passed:=coalesce(v_drafts->>'innerWidth','') ~ '^[0-9]+(\.[0-9]+)?$' AND coalesce(v_drafts->>'bodyDepth','') ~ '^[0-9]+(\.[0-9]+)?$' AND coalesce(v_drafts->>'opening','') ~ '^[0-9]+(\.[0-9]+)?$';
   IF passed THEN passed:=abs((v_drafts->>'innerWidth')::numeric-764)<=0.01 AND abs((v_drafts->>'bodyDepth')::numeric-344)<=0.01 AND abs((v_drafts->>'opening')::numeric-323)<=0.01; END IF;
  ELSE
   v_drafts:=p_data->'values';
   IF jsonb_typeof(v_drafts) IS DISTINCT FROM 'array' OR jsonb_array_length(v_drafts)<>jsonb_array_length(c.payload->'assignment'->'fields')
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(v_drafts) x WHERE jsonb_typeof(x)<>'string' OR length(x#>>'{}')>20000) THEN RAISE EXCEPTION 'TECHNICAL_INVALID_PRACTICE'; END IF;
   passed:=NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(v_drafts) x WHERE length(btrim(x))=0)
    AND p_data->'criteria'=to_jsonb(ARRAY[true,true,true]);
  END IF;
  UPDATE public.technical_progress SET drafts=jsonb_set(drafts,ARRAY[p_locale],v_drafts),practice_reviewed=passed,updated_at=now() WHERE user_id=u AND lesson_id=p_lesson;
  RETURN jsonb_build_object('allowed',true,'passed',passed);
 ELSE RAISE EXCEPTION 'TECHNICAL_INVALID_ACTION'; END IF;
 RETURN jsonb_build_object('allowed',true);
END $$;

-- Keep the canonical learning-event wrapper as the one delegated writer.
ALTER FUNCTION public.technical_command(text,text,text,jsonb) RENAME TO technical_command_before_quiz_ordering;
REVOKE ALL ON FUNCTION public.technical_command_before_quiz_ordering(text,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.learning_previous_technical_command(text,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION billing.free_window_previous_technical_command(text,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 u uuid:=auth.uid(); command jsonb; req uuid; expected_actor uuid; expected_revision bigint;
 current_revision bigint; applied_revision bigint; prior learning_private.commands;
 fp jsonb; result jsonb; rid uuid;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('quiz','reset_quiz') THEN
  RETURN public.technical_command_before_quiz_ordering(p_action,p_lesson,p_locale,p_data);
 END IF;
 -- Preserve the published client until this learner and lesson use a versioned command.
 -- Both paths take the existing account lock before choosing or changing progress.
 IF jsonb_typeof(p_data) = 'object' AND NOT (p_data ? '_technicalCommand') THEN
  IF u IS NULL THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_ACTOR_MISMATCH'; END IF;
  PERFORM billing.commercial_lock(u);
  PERFORM billing.commerce_assert_identity(u);
  IF EXISTS (
   SELECT 1 FROM learning_private.commands
   WHERE account_id=u
   AND fingerprint @> jsonb_build_object('namespace','technical-quiz-v1','lesson',p_lesson)
  ) THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_REQUIRED'; END IF;
  RETURN public.technical_command_before_quiz_ordering(p_action,p_lesson,p_locale,p_data);
 END IF;
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object'
 OR jsonb_typeof(p_data->'_technicalCommand') IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'TECHNICAL_COMMAND_REQUIRED';
 END IF;
 command:=p_data->'_technicalCommand';
 IF command-ARRAY['requestId','actorId','expectedRevision']::text[] <> '{}'::jsonb
 OR jsonb_typeof(command->'requestId') IS DISTINCT FROM 'string'
 OR jsonb_typeof(command->'actorId') IS DISTINCT FROM 'string'
 OR jsonb_typeof(command->'expectedRevision') IS DISTINCT FROM 'number'
 OR (command->>'expectedRevision') !~ '^(0|[1-9][0-9]*)$' THEN
  RAISE EXCEPTION 'TECHNICAL_COMMAND_INVALID';
 END IF;
 BEGIN
  req:=(command->>'requestId')::uuid;
  expected_actor:=(command->>'actorId')::uuid;
  expected_revision:=(command->>'expectedRevision')::bigint;
 EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RAISE EXCEPTION 'TECHNICAL_COMMAND_INVALID';
 END;
 IF expected_revision>9007199254740991 THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_INVALID'; END IF;
 IF u IS NULL OR expected_actor IS DISTINCT FROM u THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_ACTOR_MISMATCH'; END IF;

 -- Match the established account lifecycle lock order before request, progress
 -- or courses rows; this also serializes the absent initial progress row.
 PERFORM billing.commercial_lock(u);
 PERFORM billing.commerce_assert_identity(u);
 IF NOT billing.commercial_account_allowed(u) THEN RAISE EXCEPTION 'COMMERCE_ACCOUNT_UNAVAILABLE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) THEN RAISE EXCEPTION 'TECHNICAL_UNAVAILABLE'; END IF;
 IF p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LOCALE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=p_lesson AND locale=p_locale) THEN RAISE EXCEPTION 'TECHNICAL_INVALID_LESSON'; END IF;
 IF NOT public.technical_can_access(p_lesson) THEN RETURN jsonb_build_object('allowed',false); END IF;
 IF octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'TECHNICAL_INVALID_INPUT'; END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array('learning-command',u,req)::text,0));
 SELECT quiz_revision INTO current_revision FROM public.technical_progress WHERE user_id=u AND lesson_id=p_lesson FOR UPDATE;
 IF NOT FOUND THEN current_revision:=0; END IF;
 fp:=jsonb_build_object('namespace','technical-quiz-v1','actor',u,'action',p_action,'lesson',p_lesson,'locale',p_locale,
                       'expectedRevision',expected_revision,'data',p_data-'_technicalCommand');
 SELECT * INTO prior FROM learning_private.commands WHERE account_id=u AND request_id=req;
 IF FOUND THEN
  IF prior.fingerprint IS DISTINCT FROM fp THEN RAISE EXCEPTION 'LEARNING_REQUEST_MISMATCH'; END IF;
  applied_revision:=(prior.result#>>'{command,appliedRevision}')::bigint;
  IF applied_revision IS NULL THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_RESULT_INVALID'; END IF;
  -- Historical command success is explicitly distinct from current progress.
  RETURN prior.result||jsonb_build_object('command',jsonb_build_object('requestId',req,
      'appliedRevision',applied_revision,'currentRevision',current_revision,'replayed',true));
 END IF;
 IF current_revision IS DISTINCT FROM expected_revision THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_CONFLICT'; END IF;
 result:=public.technical_command_before_quiz_ordering(p_action,p_lesson,p_locale,p_data-'_technicalCommand');
 IF jsonb_typeof(result) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_RESULT_INVALID'; END IF;
 IF (result->>'allowed')::boolean IS DISTINCT FROM true THEN RETURN result; END IF;
 SELECT quiz_revision INTO applied_revision FROM public.technical_progress WHERE user_id=u AND lesson_id=p_lesson;
 IF applied_revision IS DISTINCT FROM current_revision+1 THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_RESULT_INVALID'; END IF;
 SELECT id INTO rid FROM learning_private.courses WHERE account_id=u AND subject_id=u AND area='technical' AND course='furniture';
 IF rid IS NULL THEN RAISE EXCEPTION 'TECHNICAL_COMMAND_RECORD_UNAVAILABLE'; END IF;
 result:=result||jsonb_build_object('command',jsonb_build_object('requestId',req,
       'appliedRevision',applied_revision,'currentRevision',applied_revision,'replayed',false));
 INSERT INTO learning_private.commands(account_id,request_id,fingerprint,result,record_id) VALUES(u,req,fp,result,rid);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.technical_command(text,text,text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.technical_command(text,text,text,jsonb) TO authenticated;
