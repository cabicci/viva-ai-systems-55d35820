-- REVIEW CANDIDATE ONLY. Not executed. Requires installed Kids/Technical gates
-- and pgvector in extensions. No billing debit, adult AI gate, or native unlock.
BEGIN;
CREATE TABLE public.card_assistant_policy (
 area text NOT NULL CHECK(area IN ('kids','technical')), card_id text NOT NULL,
 runtime_enabled boolean NOT NULL DEFAULT false,
 questions_per_hour integer NOT NULL DEFAULT 20 CHECK(questions_per_hour BETWEEN 1 AND 1000),
 PRIMARY KEY(area,card_id));
CREATE TABLE public.card_assistant_steps (
 area text NOT NULL, card_id text NOT NULL, step_id text NOT NULL, station_id text NOT NULL,
 source_key text NOT NULL, preview boolean NOT NULL,
 kids_level text, kids_lesson integer, technical_lesson text,
 PRIMARY KEY(area,card_id,step_id), UNIQUE(area,source_key),
 FOREIGN KEY(area,card_id) REFERENCES public.card_assistant_policy(area,card_id),
 CHECK((area='kids' AND kids_level IS NOT NULL AND kids_lesson IS NOT NULL
   AND kids_level IN ('level-1','level-2','level-3') AND kids_lesson BETWEEN 1 AND 12
   AND technical_lesson IS NULL AND source_key=kids_level||':'||kids_lesson::text)
  OR (area='technical' AND technical_lesson IS NOT NULL AND technical_lesson ~ '^M[0-9]{2}-L[0-9]{2}$'
   AND kids_level IS NULL AND kids_lesson IS NULL AND source_key=technical_lesson)));
CREATE TABLE public.card_assistant_chunks (
 area text NOT NULL, card_id text NOT NULL, step_id text NOT NULL,
 locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 chunk_id text NOT NULL, title text NOT NULL, source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 content_sha256 text NOT NULL CHECK(content_sha256 ~ '^[a-f0-9]{64}$'), content text NOT NULL CHECK(length(content) BETWEEN 1 AND 3500),
 embedding extensions.vector(1536) NOT NULL,
 embedding_model text NOT NULL CHECK(embedding_model='text-embedding-3-small'),
 embedding_dimensions integer NOT NULL CHECK(embedding_dimensions=1536),
 PRIMARY KEY(area,card_id,step_id,locale,chunk_id),
 FOREIGN KEY(area,card_id,step_id) REFERENCES public.card_assistant_steps(area,card_id,step_id) ON DELETE CASCADE);
-- No prompts, answers, child profile IDs or provider data are retained here.
CREATE TABLE public.card_assistant_question_windows (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 area text NOT NULL, card_id text NOT NULL, window_start timestamptz NOT NULL,
 request_ids uuid[] NOT NULL DEFAULT '{}',
 PRIMARY KEY(user_id,area,card_id),
 FOREIGN KEY(area,card_id) REFERENCES public.card_assistant_policy(area,card_id));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['card_assistant_policy','card_assistant_steps','card_assistant_chunks','card_assistant_question_windows'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION public.card_assistant_review_allowed() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND billing.commerce_account_allowed(auth.uid())
 AND public.has_role(auth.uid(),'admin'::public.app_role)
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL);
$$;

CREATE FUNCTION public.card_assistant_access(p_area text,p_card text,p_step text,p_locale text,p_profile uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.card_assistant_steps%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.card_assistant_policy WHERE area=p_area AND card_id=p_card AND runtime_enabled) THEN RETURN false; END IF;
 SELECT * INTO s FROM public.card_assistant_steps WHERE area=p_area AND card_id=p_card AND step_id=p_step;
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_area='kids' THEN
  -- Delegates the exact parent ownership/consent/market/subscription checks,
  -- including the installed admin exception only when p_profile=auth.uid().
  RETURN p_profile IS NOT NULL
   AND public.kids_can_access_lesson(p_profile,s.kids_level,s.kids_lesson,p_locale)
   AND EXISTS(SELECT 1 FROM public.card_assistant_steps paid WHERE paid.area=p_area AND paid.card_id=p_card AND NOT paid.preview
     AND public.kids_can_access_lesson(p_profile,paid.kids_level,paid.kids_lesson,p_locale));
 ELSIF p_area='technical' THEN
  RETURN p_profile IS NULL AND public.technical_can_access(s.technical_lesson)
   AND EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id=s.technical_lesson AND locale=p_locale)
   AND EXISTS(SELECT 1 FROM public.card_assistant_steps paid WHERE paid.area=p_area AND paid.card_id=p_card AND NOT paid.preview
     AND public.technical_can_access(paid.technical_lesson));
 END IF;
 RETURN false;
END $$;

CREATE FUNCTION public.card_assistant_take_question(p_area text,p_card text,p_step text,p_locale text,p_profile uuid,p_request uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE row public.card_assistant_question_windows%ROWTYPE; maximum integer;
BEGIN
 IF p_request IS NULL OR NOT public.card_assistant_access(p_area,p_card,p_step,p_locale,p_profile) THEN RETURN false; END IF;
 SELECT questions_per_hour INTO maximum FROM public.card_assistant_policy WHERE area=p_area AND card_id=p_card;
 INSERT INTO public.card_assistant_question_windows(user_id,area,card_id,window_start)
 VALUES(auth.uid(),p_area,p_card,date_trunc('hour',now())) ON CONFLICT DO NOTHING;
 SELECT * INTO row FROM public.card_assistant_question_windows WHERE user_id=auth.uid() AND area=p_area AND card_id=p_card FOR UPDATE;
 IF row.window_start<>date_trunc('hour',now()) THEN row.request_ids:='{}'; END IF;
 -- Replays never cause a second paid provider call.
 IF p_request=ANY(row.request_ids) OR cardinality(row.request_ids)>=maximum THEN RETURN false; END IF;
 UPDATE public.card_assistant_question_windows SET window_start=date_trunc('hour',now()),request_ids=array_append(row.request_ids,p_request)
 WHERE user_id=auth.uid() AND area=p_area AND card_id=p_card;
 RETURN true;
END $$;

CREATE FUNCTION public.card_assistant_chunk_json(c public.card_assistant_chunks) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('area',c.area,'cardId',c.card_id,'stepId',c.step_id,'locale',c.locale,
  'chunkId',c.chunk_id,'title',c.title,'sourceSha256',c.source_sha256,'payloadSha256',c.payload_sha256,
  'contentSha256',c.content_sha256,'content',c.content);
$$;
CREATE FUNCTION public.card_assistant_existing(p_area text,p_card text,p_step text,p_locale text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(public.card_assistant_chunk_json(c)||jsonb_build_object('embedding',c.embedding::text,
  'embeddingModel',c.embedding_model,'embeddingDimensions',c.embedding_dimensions)),'[]')
 FROM public.card_assistant_chunks c WHERE c.area=p_area AND c.card_id=p_card AND c.step_id=p_step AND c.locale=p_locale;
$$;
CREATE FUNCTION public.card_assistant_match(p_area text,p_card text,p_locale text,p_embedding extensions.vector(1536),p_limit integer DEFAULT 6)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(public.card_assistant_chunk_json(found)),'[]') FROM (
  SELECT c.* FROM public.card_assistant_chunks c JOIN public.card_assistant_steps s USING(area,card_id,step_id)
  WHERE c.area=p_area AND c.card_id=p_card AND c.locale=p_locale
   AND EXISTS(SELECT 1 FROM public.card_assistant_policy WHERE area=p_area AND card_id=p_card AND runtime_enabled)
   AND ((c.area='kids' AND EXISTS(SELECT 1 FROM public.kids_content_approvals a WHERE a.level_id=s.kids_level
     AND a.lesson_number=s.kids_lesson AND a.locale=c.locale AND a.approved_sha256=c.source_sha256))
    OR (c.area='technical' AND EXISTS(SELECT 1 FROM public.technical_lesson_content t WHERE t.lesson_id=s.technical_lesson
     AND t.locale=c.locale AND t.source_sha256=c.source_sha256)))
  ORDER BY c.embedding OPERATOR(extensions.<=>) p_embedding, c.step_id,c.chunk_id LIMIT greatest(1,least(p_limit,8))
 ) found;
$$;

CREATE FUNCTION public.card_assistant_sync_source(p_area text,p_card text,p_step text,p_locale text,
 p_source_sha text,p_payload_sha text,p_payload jsonb,p_rows jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.card_assistant_steps%ROWTYPE; current_sha text; current_payload jsonb; item jsonb; count_rows integer:=0;
BEGIN
 SELECT * INTO s FROM public.card_assistant_steps WHERE area=p_area AND card_id=p_card AND step_id=p_step FOR UPDATE;
 IF NOT FOUND OR p_locale IS NULL OR p_locale NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') OR p_rows IS NULL
  OR jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)>80
 THEN RAISE EXCEPTION 'CARD_SYNC_INVALID'; END IF;
 IF p_area='kids' THEN
  SELECT approved_sha256 INTO current_sha FROM public.kids_content_approvals WHERE level_id=s.kids_level
   AND lesson_number=s.kids_lesson AND locale=p_locale FOR SHARE;
 ELSE
  SELECT source_sha256,payload INTO current_sha,current_payload FROM public.technical_lesson_content
   WHERE lesson_id=s.technical_lesson AND locale=p_locale FOR SHARE;
 END IF;
 IF current_sha IS DISTINCT FROM p_source_sha OR (p_area='technical' AND current_payload IS DISTINCT FROM p_payload)
  OR (current_sha IS NULL AND jsonb_array_length(p_rows)>0)
  OR (current_sha IS NOT NULL AND (p_payload_sha IS NULL OR jsonb_array_length(p_rows)=0)) THEN RAISE EXCEPTION 'CARD_SOURCE_CHANGED'; END IF;
 DELETE FROM public.card_assistant_chunks WHERE area=p_area AND card_id=p_card AND step_id=p_step AND locale=p_locale;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  IF item->>'area' IS DISTINCT FROM p_area OR item->>'cardId' IS DISTINCT FROM p_card OR item->>'stepId' IS DISTINCT FROM p_step
   OR item->>'locale' IS DISTINCT FROM p_locale OR item->>'sourceSha256' IS DISTINCT FROM p_source_sha
   OR item->>'payloadSha256' IS DISTINCT FROM p_payload_sha THEN RAISE EXCEPTION 'CARD_SYNC_SCOPE_MISMATCH'; END IF;
  INSERT INTO public.card_assistant_chunks(area,card_id,step_id,locale,chunk_id,title,source_sha256,payload_sha256,
   content_sha256,content,embedding,embedding_model,embedding_dimensions)
  VALUES(p_area,p_card,p_step,p_locale,item->>'chunkId',item->>'title',p_source_sha,p_payload_sha,
   item->>'contentSha256',item->>'content',(item->>'embedding')::extensions.vector(1536),item->>'embeddingModel',(item->>'embeddingDimensions')::integer);
  count_rows:=count_rows+1;
 END LOOP;
 RETURN count_rows;
END $$;

REVOKE ALL ON FUNCTION public.card_assistant_review_allowed(),public.card_assistant_access(text,text,text,text,uuid),
 public.card_assistant_take_question(text,text,text,text,uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.card_assistant_review_allowed(),public.card_assistant_access(text,text,text,text,uuid),
 public.card_assistant_take_question(text,text,text,text,uuid,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.card_assistant_chunk_json(public.card_assistant_chunks),public.card_assistant_existing(text,text,text,text),
 public.card_assistant_match(text,text,text,extensions.vector,integer),public.card_assistant_sync_source(text,text,text,text,text,text,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.card_assistant_chunk_json(public.card_assistant_chunks),public.card_assistant_existing(text,text,text,text),
 public.card_assistant_match(text,text,text,extensions.vector,integer),public.card_assistant_sync_source(text,text,text,text,text,text,jsonb,jsonb) TO service_role;

-- Classify the operational user-owned window before the installed LC09 inventory
-- runs. Preserve the existing classifications. Academic's historical native
-- candidate, if needed for this deployment, is a prerequisite and runs first.
DO $card_deletion_inventory$
DECLARE targets oid[]; definition text; old_prefix text:='c.table_name NOT IN (';
BEGIN
 SELECT array_agg(p.oid) INTO targets FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.pronargs=3 AND p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%';
 IF coalesce(cardinality(targets),0)<>1 THEN RAISE EXCEPTION 'CARD_DELETION_INVENTORY_TARGET_MISMATCH'; END IF;
 definition:=pg_get_functiondef(targets[1]);
 IF strpos(definition,'''card_assistant_question_windows''')>0 THEN RETURN; END IF;
 IF (length(definition)-length(replace(definition,old_prefix,'')))/length(old_prefix)<>1
 THEN RAISE EXCEPTION 'CARD_DELETION_INVENTORY_DEFINITION_MISMATCH'; END IF;
 EXECUTE replace(definition,old_prefix,old_prefix||'''card_assistant_question_windows'',');
END $card_deletion_inventory$;
ALTER FUNCTION public.lc09_advance_deletion(uuid,uuid,text) RENAME TO card_assistant_previous_advance;
REVOKE ALL ON FUNCTION public.card_assistant_previous_advance(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.lc09_advance_deletion(p_user_id uuid,p_lease_token uuid,p_next_stage text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 result:=public.card_assistant_previous_advance(p_user_id,p_lease_token,p_next_stage);
 IF p_next_stage='learner_erased' THEN DELETE FROM public.card_assistant_question_windows WHERE user_id=p_user_id; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lc09_advance_deletion(uuid,uuid,text) TO service_role;

-- Add the generated registry seed in assistant-registry-seed.sql in the same
-- reviewed release. All policies remain disabled until corpus verification.
COMMIT;
