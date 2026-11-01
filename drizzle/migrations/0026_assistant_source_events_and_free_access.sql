-- Assembled by scripts/release/assemble-unified-assistant-migration.mjs.
-- Requires the reviewed cumulative commerce/email-access and native Academic
-- baseline. Drizzle journal owns execution; never run both migration systems.
-- Installs disabled preparation, metadata capture and EMPTY free-access tables.
-- Does not approve sources, embed, activate runtime, enable worker or create an offer.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='60s';
DO $unified_preflight$ BEGIN
 IF to_regclass('billing.email_access_grants') IS NULL
   OR to_regclass('public.academic_assistant_policy') IS NULL
   OR to_regclass('public.rag_index_versions') IS NULL
   OR to_regprocedure('public.rag_require_service_role()') IS NULL
   OR to_regprocedure('public.lc09_advance_deletion(uuid,uuid,text)') IS NULL
 THEN RAISE EXCEPTION 'UNIFIED_BASELINE_PREREQUISITES_MISSING'; END IF;
 IF to_regclass('public.card_assistant_policy') IS NOT NULL
   OR to_regclass('public.rag_current_releases') IS NOT NULL
   OR to_regclass('public.assistant_auto_jobs') IS NOT NULL
   OR to_regclass('billing.free_access_windows') IS NOT NULL
   OR EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
     AND table_name='academic_rag_chunks' AND column_name='embedding_model')
 THEN RAISE EXCEPTION 'UNIFIED_PARTIAL_INSTALL_REQUIRES_REVIEW'; END IF;
END $unified_preflight$;

-- Source: scripts/card-assistant/assistant-candidate.sql
-- LF SHA256: 27fb91a1d301c6469c9e0acab8a5c60714020677c01b7713cf0d29e80062eb70
-- REVIEW CANDIDATE ONLY. Not executed. Requires installed Kids/Technical gates
-- and pgvector in extensions. No billing debit, adult AI gate, or native unlock.

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
DECLARE targets oid[]; definition text;
 old_prefix text:='c.table_name NOT IN (''academic_assistant_questions'',''lesson_progress''';
 new_prefix text:='c.table_name NOT IN (''card_assistant_question_windows'',''academic_assistant_questions'',''lesson_progress''';
BEGIN
 SELECT array_agg(p.oid) INTO targets FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.pronargs=3 AND p.prosrc LIKE '%LC09_UNCLASSIFIED_USER_TABLE%';
 IF coalesce(cardinality(targets),0)<>1 THEN RAISE EXCEPTION 'CARD_DELETION_INVENTORY_TARGET_MISMATCH'; END IF;
 definition:=pg_get_functiondef(targets[1]);
 IF strpos(definition,'''card_assistant_question_windows''')>0 THEN RETURN; END IF;
 IF (length(definition)-length(replace(definition,old_prefix,'')))/length(old_prefix)<>1
 THEN RAISE EXCEPTION 'CARD_DELETION_INVENTORY_DEFINITION_MISMATCH'; END IF;
 -- Pin the reviewed public user inventory, not the separate Kids family
 -- inventory in the same installed function. Any changed anchor fails closed.
 EXECUTE replace(definition,old_prefix,new_prefix);
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


-- Source: scripts/card-assistant/assistant-registry-seed.sql
-- LF SHA256: 8077c012a88e7bdb2e44cb85073e67bbd291ff9ad54d60e9dc537651b3088f27
-- REVIEW CANDIDATE ONLY. Generated from Kids catalogue and Technical catalogue. Policies stay disabled.

INSERT INTO public.card_assistant_policy(area,card_id) VALUES ('kids','level-1'),('kids','level-2'),('kids','level-3'),('technical','furniture');
INSERT INTO public.card_assistant_steps(area,card_id,step_id,station_id,source_key,preview,kids_level,kids_lesson,technical_lesson) VALUES
('kids','level-1','1','level-1','level-1:1',true,'level-1',1,NULL),
('kids','level-1','2','level-1','level-1:2',true,'level-1',2,NULL),
('kids','level-1','3','level-1','level-1:3',false,'level-1',3,NULL),
('kids','level-1','4','level-1','level-1:4',false,'level-1',4,NULL),
('kids','level-1','5','level-1','level-1:5',false,'level-1',5,NULL),
('kids','level-1','6','level-1','level-1:6',false,'level-1',6,NULL),
('kids','level-1','7','level-1','level-1:7',false,'level-1',7,NULL),
('kids','level-1','8','level-1','level-1:8',false,'level-1',8,NULL),
('kids','level-1','9','level-1','level-1:9',false,'level-1',9,NULL),
('kids','level-1','10','level-1','level-1:10',false,'level-1',10,NULL),
('kids','level-1','11','level-1','level-1:11',false,'level-1',11,NULL),
('kids','level-1','12','level-1','level-1:12',false,'level-1',12,NULL),
('kids','level-2','1','level-2','level-2:1',true,'level-2',1,NULL),
('kids','level-2','2','level-2','level-2:2',true,'level-2',2,NULL),
('kids','level-2','3','level-2','level-2:3',false,'level-2',3,NULL),
('kids','level-2','4','level-2','level-2:4',false,'level-2',4,NULL),
('kids','level-2','5','level-2','level-2:5',false,'level-2',5,NULL),
('kids','level-2','6','level-2','level-2:6',false,'level-2',6,NULL),
('kids','level-2','7','level-2','level-2:7',false,'level-2',7,NULL),
('kids','level-2','8','level-2','level-2:8',false,'level-2',8,NULL),
('kids','level-2','9','level-2','level-2:9',false,'level-2',9,NULL),
('kids','level-2','10','level-2','level-2:10',false,'level-2',10,NULL),
('kids','level-2','11','level-2','level-2:11',false,'level-2',11,NULL),
('kids','level-2','12','level-2','level-2:12',false,'level-2',12,NULL),
('kids','level-3','1','level-3','level-3:1',true,'level-3',1,NULL),
('kids','level-3','2','level-3','level-3:2',true,'level-3',2,NULL),
('kids','level-3','3','level-3','level-3:3',false,'level-3',3,NULL),
('kids','level-3','4','level-3','level-3:4',false,'level-3',4,NULL),
('kids','level-3','5','level-3','level-3:5',false,'level-3',5,NULL),
('kids','level-3','6','level-3','level-3:6',false,'level-3',6,NULL),
('kids','level-3','7','level-3','level-3:7',false,'level-3',7,NULL),
('kids','level-3','8','level-3','level-3:8',false,'level-3',8,NULL),
('kids','level-3','9','level-3','level-3:9',false,'level-3',9,NULL),
('kids','level-3','10','level-3','level-3:10',false,'level-3',10,NULL),
('kids','level-3','11','level-3','level-3:11',false,'level-3',11,NULL),
('kids','level-3','12','level-3','level-3:12',false,'level-3',12,NULL),
('technical','furniture','M01-L01','M01','M01-L01',true,NULL,NULL,'M01-L01'),
('technical','furniture','M01-L02','M01','M01-L02',false,NULL,NULL,'M01-L02'),
('technical','furniture','M01-L03','M01','M01-L03',false,NULL,NULL,'M01-L03'),
('technical','furniture','M01-L04','M01','M01-L04',false,NULL,NULL,'M01-L04'),
('technical','furniture','M02-L01','M02','M02-L01',false,NULL,NULL,'M02-L01'),
('technical','furniture','M02-L02','M02','M02-L02',false,NULL,NULL,'M02-L02'),
('technical','furniture','M02-L03','M02','M02-L03',false,NULL,NULL,'M02-L03'),
('technical','furniture','M02-L04','M02','M02-L04',false,NULL,NULL,'M02-L04'),
('technical','furniture','M03-L01','M03','M03-L01',false,NULL,NULL,'M03-L01'),
('technical','furniture','M03-L02','M03','M03-L02',false,NULL,NULL,'M03-L02'),
('technical','furniture','M03-L03','M03','M03-L03',false,NULL,NULL,'M03-L03'),
('technical','furniture','M03-L04','M03','M03-L04',false,NULL,NULL,'M03-L04'),
('technical','furniture','M04-L01','M04','M04-L01',false,NULL,NULL,'M04-L01'),
('technical','furniture','M04-L02','M04','M04-L02',false,NULL,NULL,'M04-L02'),
('technical','furniture','M04-L03','M04','M04-L03',false,NULL,NULL,'M04-L03'),
('technical','furniture','M04-L04','M04','M04-L04',false,NULL,NULL,'M04-L04'),
('technical','furniture','M05-L01','M05','M05-L01',false,NULL,NULL,'M05-L01'),
('technical','furniture','M05-L02','M05','M05-L02',false,NULL,NULL,'M05-L02'),
('technical','furniture','M05-L03','M05','M05-L03',false,NULL,NULL,'M05-L03'),
('technical','furniture','M05-L04','M05','M05-L04',false,NULL,NULL,'M05-L04'),
('technical','furniture','M06-L01','M06','M06-L01',false,NULL,NULL,'M06-L01'),
('technical','furniture','M06-L02','M06','M06-L02',false,NULL,NULL,'M06-L02'),
('technical','furniture','M06-L03','M06','M06-L03',false,NULL,NULL,'M06-L03'),
('technical','furniture','M06-L04','M06','M06-L04',false,NULL,NULL,'M06-L04'),
('technical','furniture','M07-L01','M07','M07-L01',false,NULL,NULL,'M07-L01'),
('technical','furniture','M07-L02','M07','M07-L02',false,NULL,NULL,'M07-L02'),
('technical','furniture','M07-L03','M07','M07-L03',false,NULL,NULL,'M07-L03'),
('technical','furniture','M07-L04','M07','M07-L04',false,NULL,NULL,'M07-L04'),
('technical','furniture','M08-L01','M08','M08-L01',false,NULL,NULL,'M08-L01'),
('technical','furniture','M08-L02','M08','M08-L02',false,NULL,NULL,'M08-L02'),
('technical','furniture','M08-L03','M08','M08-L03',false,NULL,NULL,'M08-L03'),
('technical','furniture','M09-L01','M09','M09-L01',false,NULL,NULL,'M09-L01'),
('technical','furniture','M09-L02','M09','M09-L02',false,NULL,NULL,'M09-L02'),
('technical','furniture','M09-L03','M09','M09-L03',false,NULL,NULL,'M09-L03'),
('technical','furniture','M09-L04','M09','M09-L04',false,NULL,NULL,'M09-L04'),
('technical','furniture','M10-L01','M10','M10-L01',false,NULL,NULL,'M10-L01'),
('technical','furniture','M10-L02','M10','M10-L02',false,NULL,NULL,'M10-L02'),
('technical','furniture','M10-L03','M10','M10-L03',false,NULL,NULL,'M10-L03'),
('technical','furniture','M11-L01','M11','M11-L01',false,NULL,NULL,'M11-L01'),
('technical','furniture','M11-L02','M11','M11-L02',false,NULL,NULL,'M11-L02'),
('technical','furniture','M11-L03','M11','M11-L03',false,NULL,NULL,'M11-L03'),
('technical','furniture','M11-L04','M11','M11-L04',false,NULL,NULL,'M11-L04'),
('technical','furniture','M12-L01','M12','M12-L01',false,NULL,NULL,'M12-L01'),
('technical','furniture','M12-L02','M12','M12-L02',false,NULL,NULL,'M12-L02'),
('technical','furniture','M12-L03','M12','M12-L03',false,NULL,NULL,'M12-L03'),
('technical','furniture','M12-L04','M12','M12-L04',false,NULL,NULL,'M12-L04'),
('technical','furniture','M13-L01','M13','M13-L01',false,NULL,NULL,'M13-L01'),
('technical','furniture','M13-L02','M13','M13-L02',false,NULL,NULL,'M13-L02'),
('technical','furniture','M13-L03','M13','M13-L03',false,NULL,NULL,'M13-L03'),
('technical','furniture','M13-L04','M13','M13-L04',false,NULL,NULL,'M13-L04'),
('technical','furniture','M14-L01','M14','M14-L01',false,NULL,NULL,'M14-L01'),
('technical','furniture','M14-L02','M14','M14-L02',false,NULL,NULL,'M14-L02'),
('technical','furniture','M14-L03','M14','M14-L03',false,NULL,NULL,'M14-L03'),
('technical','furniture','M14-L04','M14','M14-L04',false,NULL,NULL,'M14-L04'),
('technical','furniture','M15-L01','M15','M15-L01',false,NULL,NULL,'M15-L01'),
('technical','furniture','M15-L02','M15','M15-L02',false,NULL,NULL,'M15-L02'),
('technical','furniture','M15-L03','M15','M15-L03',false,NULL,NULL,'M15-L03'),
('technical','furniture','M15-L04','M15','M15-L04',false,NULL,NULL,'M15-L04'),
('technical','furniture','M16-L01','M16','M16-L01',false,NULL,NULL,'M16-L01'),
('technical','furniture','M16-L02','M16','M16-L02',false,NULL,NULL,'M16-L02'),
('technical','furniture','M16-L03','M16','M16-L03',false,NULL,NULL,'M16-L03'),
('technical','furniture','M16-L04','M16','M16-L04',false,NULL,NULL,'M16-L04'),
('technical','furniture','M17-L01','M17','M17-L01',false,NULL,NULL,'M17-L01'),
('technical','furniture','M17-L02','M17','M17-L02',false,NULL,NULL,'M17-L02'),
('technical','furniture','M17-L03','M17','M17-L03',false,NULL,NULL,'M17-L03'),
('technical','furniture','M17-L04','M17','M17-L04',false,NULL,NULL,'M17-L04'),
('technical','furniture','M17-L05','M17','M17-L05',false,NULL,NULL,'M17-L05'),
('technical','furniture','M18-L01','M18','M18-L01',false,NULL,NULL,'M18-L01'),
('technical','furniture','M18-L02','M18','M18-L02',false,NULL,NULL,'M18-L02'),
('technical','furniture','M18-L03','M18','M18-L03',false,NULL,NULL,'M18-L03'),
('technical','furniture','M19-L01','M19','M19-L01',false,NULL,NULL,'M19-L01'),
('technical','furniture','M19-L02','M19','M19-L02',false,NULL,NULL,'M19-L02'),
('technical','furniture','M19-L03','M19','M19-L03',false,NULL,NULL,'M19-L03'),
('technical','furniture','M20-L01','M20','M20-L01',false,NULL,NULL,'M20-L01'),
('technical','furniture','M20-L02','M20','M20-L02',false,NULL,NULL,'M20-L02'),
('technical','furniture','M20-L03','M20','M20-L03',false,NULL,NULL,'M20-L03'),
('technical','furniture','M20-L04','M20','M20-L04',false,NULL,NULL,'M20-L04'),
('technical','furniture','M21-L01','M21','M21-L01',false,NULL,NULL,'M21-L01'),
('technical','furniture','M21-L02','M21','M21-L02',false,NULL,NULL,'M21-L02'),
('technical','furniture','M21-L03','M21','M21-L03',false,NULL,NULL,'M21-L03');


-- Source: scripts/rag/incremental-embedding-reuse-candidate.sql
-- LF SHA256: 9bd1942885376ab75b56525c602fa60c47550fcc6c27123d89146962534eaa7f
-- REVIEW ONLY. Ship with the native executor change; no provider or activation calls.
-- Completed historical import sessions and their frozen limits remain untouched.

CREATE FUNCTION public.rag_reusable_embeddings(p_requests jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_requests IS NULL OR jsonb_typeof(p_requests)<>'array' THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 IF jsonb_array_length(p_requests)<1 OR jsonb_array_length(p_requests)>64 THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_requests) r WHERE
   jsonb_typeof(r)<>'object' OR
   jsonb_typeof(r->'chunkId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'pathId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'lessonId') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'locale') IS DISTINCT FROM 'string' OR
   jsonb_typeof(r->'checksum') IS DISTINCT FROM 'string' OR
   coalesce(r->>'chunkId','')='' OR length(r->>'chunkId')>500 OR
   coalesce(r->>'pathId','')!~'^[a-z0-9-]{1,80}$' OR
   coalesce(r->>'lessonId','')!~'^[a-z0-9-]{1,160}$' OR
   coalesce(r->>'locale','') NOT IN ('ar-EG','ar-MSA','ar-Gulf','en') OR
   coalesce(r->>'checksum','')!~'^[a-f0-9]{64}$') THEN
  RAISE EXCEPTION 'INVALID_REUSE_REQUEST';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
   'chunkId',requested->>'chunkId','pathId',kc.path_id,'lessonId',kc.lesson_id,
   'content',kc.content,'chunkChecksum',kc.chunk_checksum,'embedding',kc.embedding::text,
   'locale',kc.locale,'model',v.embedding_model,'dimensions',extensions.vector_dims(kc.embedding),
   'sourceSha',kc.source_sha,'registrySourceSha',v.source_sha,
   'indexState',kc.index_state,'versionStatus',v.status,'indexingFailed',kc.indexing_failed
  )), '[]'::jsonb) INTO result
 FROM jsonb_array_elements(p_requests) requested
 JOIN public.knowledge_chunks kc ON kc.path_id=requested->>'pathId'
  AND kc.lesson_id=requested->>'lessonId' AND kc.locale=requested->>'locale'
  AND kc.chunk_checksum=requested->>'checksum'
 JOIN public.rag_index_versions v ON v.version_key=kc.index_version
 WHERE kc.source_type='locale_lesson' AND kc.index_state='active' AND v.status='active'
  AND kc.indexing_failed=false AND kc.source_sha=v.source_sha
  AND kc.embedding IS NOT NULL AND extensions.vector_dims(kc.embedding)=1536
  AND v.embedding_model='text-embedding-3-small';
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.rag_reusable_embeddings(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rag_reusable_embeddings(jsonb) TO service_role;


-- Source: scripts/rag/current-release-candidate.sql
-- LF SHA256: eab702eebc2dd2d70758bc923fb8300be32f1825972769c3432b1963cf6ca9c4
-- Candidate only: apply with the matching server/runtime release after review.
-- Historical import sessions, locked snapshots, and previous vectors are retained.

CREATE TABLE public.rag_current_releases (
 release_id text PRIMARY KEY CHECK(release_id ~ '^[a-f0-9]{64}$'),
 execution_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 material text NOT NULL, approval jsonb NOT NULL, previous_version text,
 provider_attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rag_current_batches (
 release_id text NOT NULL REFERENCES public.rag_current_releases, ordinal integer NOT NULL,
 chunk_ids jsonb NOT NULL, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','inflight','done')),
 lease_token uuid, lease_until timestamptz, request_id uuid, provider_reserved boolean NOT NULL DEFAULT false,
 PRIMARY KEY(release_id,ordinal)
);
CREATE TABLE public.rag_current_requests (
 request_id uuid PRIMARY KEY, release_id text NOT NULL REFERENCES public.rag_current_releases,
 operation text NOT NULL, result jsonb NOT NULL
);
ALTER TABLE public.rag_current_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_current_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_current_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rag_current_releases, public.rag_current_batches, public.rag_current_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.rag_current_releases, public.rag_current_batches, public.rag_current_requests TO service_role;

CREATE FUNCTION public.rag_current_status(p_release_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; v text; active text; completed integer; total integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 SELECT count(*),count(*) FILTER(WHERE state='done') INTO total,completed FROM public.rag_current_batches WHERE release_id=p_release_id;
 SELECT status INTO v FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||p_release_id;
 RETURN jsonb_build_object('releaseId',p_release_id,'executionId',r.execution_id,'state',v,
  'completedBatches',completed,'totalBatches',total,'providerAttempts',r.provider_attempts,
  'currentActiveVersion',active,'previousVersion',r.previous_version);
END $$;

CREATE FUNCTION public.rag_current_initialize(p_release_id text,p_material text,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a jsonb; result jsonb; n integer;
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM pg_advisory_xact_lock(hashtextextended('rag-current-register',0));
 IF p_request_id IS NULL OR p_release_id IS NULL OR p_material IS NULL OR octet_length(p_material)>30000000 OR
  encode(extensions.digest(convert_to(p_material,'UTF8'),'sha256'),'hex') IS DISTINCT FROM p_release_id THEN
  RAISE EXCEPTION 'CURRENT_RELEASE_DIGEST_MISMATCH'; END IF;
 a:=p_material::jsonb;
 IF a->>'schemaVersion' IS DISTINCT FROM 'current-ai-corpus-v1' OR a->>'embeddingModel' IS DISTINCT FROM 'text-embedding-3-small' OR
  a->>'embeddingDimensions' IS DISTINCT FROM '1536' OR jsonb_typeof(a->'packages') IS DISTINCT FROM 'object' OR
  jsonb_typeof(a->'chunks') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CURRENT_RELEASE_INVALID'; END IF;
 SELECT count(*) INTO n FROM jsonb_object_keys(a->'chunks');
 IF n<1 OR n>100000 OR EXISTS(SELECT 1 FROM jsonb_each(a->'chunks') c WHERE
  c.key !~ '^[!-~]+$' OR a->'packages'->(c.value->>'packageKey') IS NULL OR c.value->>'textChecksum' !~ '^[a-f0-9]{64}$')
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INVALID'; END IF;
 IF EXISTS(SELECT 1 FROM public.rag_current_releases WHERE release_id=p_release_id AND material<>p_material)
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.rag_current_requests WHERE request_id=p_request_id AND (release_id<>p_release_id OR operation<>'initialize'))
  THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rag_current_releases WHERE release_id=p_release_id) THEN
  INSERT INTO public.rag_index_versions(version_key,source_sha,status,package_count,chunk_count,chunk_manifest_checksum,embedding_model)
   VALUES('rag-current-v1-'||p_release_id,p_release_id,'staging',
    (SELECT count(*) FROM jsonb_object_keys(a->'packages')),n,p_release_id,'text-embedding-3-small');
  INSERT INTO public.rag_current_releases(release_id,material,approval) VALUES(p_release_id,p_material,a);
  INSERT INTO public.rag_current_batches(release_id,ordinal,chunk_ids)
   SELECT p_release_id,((i-1)/64)::integer,jsonb_agg(key ORDER BY key COLLATE "C") FROM
    (SELECT key,row_number() OVER(ORDER BY key COLLATE "C") i FROM jsonb_object_keys(a->'chunks') key) x GROUP BY (i-1)/64;
 END IF;
 result:=public.rag_current_status(p_release_id);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'initialize',result) ON CONFLICT DO NOTHING;
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_claim(p_release_id text,p_execution_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; old public.rag_current_requests; result jsonb;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL
  THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'batch' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rag_index_versions WHERE version_key='rag-current-v1-'||p_release_id AND status='staging')
  THEN RAISE EXCEPTION 'CURRENT_NOT_STAGING'; END IF;
 -- Never skip an unexpired lease: one writer/provider request at a time per release.
 IF EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release_id AND state='inflight' AND lease_until>now())
  THEN RAISE EXCEPTION 'CURRENT_BATCH_BUSY'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND state<>'done' ORDER BY ordinal LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('done',true); END IF;
 UPDATE public.rag_current_batches SET state='inflight',lease_token=gen_random_uuid(),lease_until=now()+interval '15 minutes',
  request_id=p_request_id,provider_reserved=false WHERE release_id=p_release_id AND ordinal=b.ordinal RETURNING * INTO b;
 result:=jsonb_build_object('leaseToken',b.lease_token,'chunkIds',b.chunk_ids,'ordinal',b.ordinal);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'batch',result);
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_reserve_provider(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; budget integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND lease_token=p_lease_token AND request_id=p_request_id FOR UPDATE;
 IF b.state IS DISTINCT FROM 'inflight' OR b.lease_until<=now() OR b.provider_reserved
  THEN RAISE EXCEPTION 'CURRENT_LEASE_INVALID'; END IF;
 SELECT count(*)+8 INTO budget FROM public.rag_current_batches WHERE release_id=p_release_id;
 IF r.provider_attempts>=budget THEN RAISE EXCEPTION 'CURRENT_PROVIDER_BUDGET'; END IF;
 UPDATE public.rag_current_releases SET provider_attempts=provider_attempts+1 WHERE release_id=p_release_id;
 UPDATE public.rag_current_batches SET provider_reserved=true WHERE release_id=p_release_id AND ordinal=b.ordinal;
 RETURN jsonb_build_object('reserved',true);
END $$;

-- Check the actual stored row, including content bytes and server-owned provenance.
CREATE FUNCTION public.rag_current_row_valid(k public.knowledge_chunks,a jsonb,p_id text) RETURNS boolean
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH expected AS(SELECT a->'chunks'->p_id c), pkg AS(SELECT c,a->'packages'->(c->>'packageKey') p FROM expected)
 SELECT coalesce(k.source_type='locale_lesson' AND k.source_id=p_id AND NOT k.indexing_failed AND
  k.path_id=p->>'trackId' AND k.module_id=p->>'moduleId' AND k.lesson_id=p->>'lessonId' AND k.locale=p->>'locale' AND
  k.package_path=p->>'packagePath' AND k.package_checksum=p->>'packageChecksum' AND
  k.content_version IS NOT DISTINCT FROM p->>'canonicalVersion' AND k.production_route IS NOT DISTINCT FROM p->>'productionRoute' AND
  k.chunk_checksum=c->>'textChecksum' AND k.title=c->>'sectionHeading' AND
  k.section_index=(c->>'sectionIndex')::integer AND k.section_role=c->>'sectionRole' AND
  k.chunk_position=(c->>'chunkIndex')::integer AND k.content_type=c->>'contentType' AND
  encode(extensions.digest(convert_to(k.content,'UTF8'),'sha256'),'hex')=c->>'textChecksum' AND
  k.embedding IS NOT NULL AND extensions.vector_dims(k.embedding)=1536 AND extensions.vector_norm(k.embedding)>0,false) FROM pkg;
$$;

CREATE FUNCTION public.rag_current_commit(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid,p_rows jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; b public.rag_current_batches; item jsonb; c jsonb; p jsonb; result jsonb; v text;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO b FROM public.rag_current_batches WHERE release_id=p_release_id AND lease_token=p_lease_token AND request_id=p_request_id FOR UPDATE;
 IF b.state='done' THEN RETURN jsonb_build_object('done',true,'replayed',true); END IF;
 IF b.state IS DISTINCT FROM 'inflight' OR b.lease_until<=now() OR NOT EXISTS(SELECT 1 FROM public.rag_index_versions
  WHERE version_key='rag-current-v1-'||p_release_id AND status='staging') THEN RAISE EXCEPTION 'CURRENT_LEASE_INVALID'; END IF;
 IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows)<>jsonb_array_length(b.chunk_ids) OR
  (SELECT jsonb_agg(x->>'chunkId' ORDER BY x->>'chunkId' COLLATE "C") FROM jsonb_array_elements(p_rows) x) IS DISTINCT FROM b.chunk_ids
  THEN RAISE EXCEPTION 'CURRENT_BATCH_CONTENT_MISMATCH'; END IF;
 v:='rag-current-v1-'||p_release_id;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  c:=r.approval->'chunks'->(item->>'chunkId'); p:=r.approval->'packages'->(c->>'packageKey');
  INSERT INTO public.knowledge_chunks(source_type,source_id,path_id,module_id,lesson_id,title,content,metadata,embedding,
   locale,package_path,source_sha,package_checksum,chunk_checksum,content_version,index_version,index_state,
   section_index,section_role,chunk_position,content_type,production_route,indexing_failed)
  VALUES('locale_lesson',item->>'chunkId',p->>'trackId',p->>'moduleId',p->>'lessonId',c->>'sectionHeading',item->>'content',
   jsonb_build_object('currentReleaseId',p_release_id),(item->'embedding')::text::extensions.vector,
   p->>'locale',p->>'packagePath',p_release_id,p->>'packageChecksum',c->>'textChecksum',p->>'canonicalVersion',v,'staging',
   (c->>'sectionIndex')::integer,c->>'sectionRole',(c->>'chunkIndex')::integer,c->>'contentType',p->>'productionRoute',false);
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=v AND k.source_id IN(SELECT jsonb_array_elements_text(b.chunk_ids))
  AND NOT public.rag_current_row_valid(k,r.approval,k.source_id)) THEN RAISE EXCEPTION 'CURRENT_STORED_CONTENT_INVALID'; END IF;
 UPDATE public.rag_current_batches SET state='done' WHERE release_id=p_release_id AND ordinal=b.ordinal;
 result:=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows));
 UPDATE public.rag_current_requests SET result=jsonb_build_object('committed',true,'ordinal',b.ordinal,'acceptedRows',jsonb_array_length(p_rows),'done',true) WHERE request_id=p_request_id;
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_fail(p_release_id text,p_execution_id uuid,p_request_id uuid,p_lease_token uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM 1 FROM public.rag_current_releases WHERE release_id=p_release_id AND execution_id=p_execution_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 UPDATE public.rag_current_batches SET state='pending',lease_until=NULL WHERE release_id=p_release_id AND request_id=p_request_id
  AND lease_token=p_lease_token AND state='inflight';
 -- Keep the request permanently consumed even if the provider response was lost.
 RETURN jsonb_build_object('recorded',true);
END $$;

CREATE FUNCTION public.rag_current_activate(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; v text; active text; target public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 -- Share a table lock with all historical activation/rollback implementations.
 LOCK TABLE public.rag_index_versions IN EXCLUSIVE MODE;
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'activate' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 IF active IS DISTINCT FROM p_expected_active THEN RAISE EXCEPTION 'CURRENT_ACTIVE_CHANGED'; END IF;
 v:='rag-current-v1-'||p_release_id;
 SELECT * INTO target FROM public.rag_index_versions WHERE version_key=v;
 IF target.status NOT IN('staging','superseded') OR target.status IS NULL OR active=v OR target.source_sha<>p_release_id OR
  target.chunk_manifest_checksum<>p_release_id OR target.embedding_model<>'text-embedding-3-small' OR
  target.package_count<>(SELECT count(*) FROM jsonb_object_keys(r.approval->'packages')) OR
  target.chunk_count<>(SELECT count(*) FROM jsonb_object_keys(r.approval->'chunks')) OR
  EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release_id AND state<>'done') OR
  (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=v)<>target.chunk_count OR
  EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=v AND
   (k.source_sha IS DISTINCT FROM p_release_id OR k.index_state IS DISTINCT FROM target.status OR NOT public.rag_current_row_valid(k,r.approval,k.source_id)))
  THEN RAISE EXCEPTION 'CURRENT_RELEASE_INCOMPLETE'; END IF;
 UPDATE public.rag_current_releases SET previous_version=active WHERE release_id=p_release_id;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=v;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=v AND source_type='locale_lesson';
 result:=jsonb_build_object('activated',true,'version',v,'previousVersion',active);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'activate',result);
 RETURN result;
END $$;

CREATE FUNCTION public.rag_current_rollback(p_release_id text,p_execution_id uuid,p_request_id uuid,p_expected_active text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.rag_current_releases; active text; prior public.rag_index_versions; result jsonb; old public.rag_current_requests;
BEGIN
 PERFORM public.rag_require_service_role();
 LOCK TABLE public.rag_index_versions IN EXCLUSIVE MODE;
 SELECT * INTO r FROM public.rag_current_releases WHERE release_id=p_release_id FOR UPDATE;
 IF p_request_id IS NULL OR r.execution_id IS DISTINCT FROM p_execution_id OR r.execution_id IS NULL THEN RAISE EXCEPTION 'CURRENT_EXECUTION_MISMATCH'; END IF;
 SELECT * INTO old FROM public.rag_current_requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF old.release_id<>p_release_id OR old.operation<>'rollback' THEN RAISE EXCEPTION 'CURRENT_REQUEST_CONFLICT'; END IF;
  RETURN old.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT version_key INTO active FROM public.rag_index_versions WHERE status='active';
 IF active IS DISTINCT FROM p_expected_active OR active IS DISTINCT FROM 'rag-current-v1-'||p_release_id THEN RAISE EXCEPTION 'CURRENT_ACTIVE_CHANGED'; END IF;
 SELECT * INTO prior FROM public.rag_index_versions WHERE version_key=r.previous_version;
 IF prior.status IS DISTINCT FROM 'superseded' OR prior.chunk_count<1 OR prior.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR
  (SELECT count(*) FROM public.knowledge_chunks WHERE index_version=prior.version_key AND source_type='locale_lesson')<>prior.chunk_count OR
  EXISTS(SELECT 1 FROM public.knowledge_chunks k WHERE k.index_version=prior.version_key AND
   (k.index_state IS DISTINCT FROM 'superseded' OR k.source_sha IS DISTINCT FROM prior.source_sha OR k.indexing_failed OR
    k.embedding IS NULL OR extensions.vector_dims(k.embedding)<>1536 OR extensions.vector_norm(k.embedding)<=0))
  THEN RAISE EXCEPTION 'CURRENT_ROLLBACK_UNAVAILABLE'; END IF;
 UPDATE public.rag_index_versions SET status='superseded',superseded_at=now() WHERE version_key=active;
 UPDATE public.knowledge_chunks SET index_state='superseded' WHERE index_version=active AND source_type='locale_lesson';
 UPDATE public.rag_index_versions SET status='active',activated_at=now() WHERE version_key=prior.version_key;
 UPDATE public.knowledge_chunks SET index_state='active' WHERE index_version=prior.version_key AND source_type='locale_lesson';
 result:=jsonb_build_object('rolledBack',true,'version',prior.version_key);
 INSERT INTO public.rag_current_requests VALUES(p_request_id,p_release_id,'rollback',result);
 RETURN result;
END $$;

-- Bounded owner operations can exceed the API role's default 8 seconds while
-- writing vectors or atomically validating/swapping complete index versions.
-- Keep the exception on these service-only functions; do not change role or
-- database timeouts, provider budgets, leases, or content/provenance checks.
ALTER FUNCTION public.rag_current_commit(text,uuid,uuid,uuid,jsonb) SET statement_timeout TO '60s';
ALTER FUNCTION public.rag_current_activate(text,uuid,uuid,text) SET statement_timeout TO '60s';
ALTER FUNCTION public.rag_current_rollback(text,uuid,uuid,text) SET statement_timeout TO '60s';

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname LIKE 'rag_current_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;


-- Source: scripts/academic-education/assistant-card-index-maintenance-candidate.sql
-- LF SHA256: 64f3f8b533d77b4b8054f68dfae5ee6ec31f6974d4734bed1bea1e84d525bb97
-- REVIEW ONLY. Apply with the matching application-server revision through the
-- existing central integration process. This file has not been executed.
-- Runtime, review, purchase and per-card entitlement gates are unchanged.
-- Legacy vectors have no model provenance: refresh them once before enabling
-- retrieval under this contract. Later runs embed changed section text only.


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


-- Source: scripts/assistant/automatic-indexing-candidate.sql
-- LF SHA256: 4860f9473f85c74ef2bcdf01219ee3d3a2f26db82ce2be3974a11d5b6844c09a
-- Reviewed installation candidate. Disabled until explicit owner activation.
-- No provider calls, content imports, subscription grants or learner writes.

CREATE TABLE public.assistant_auto_policy (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), enabled boolean NOT NULL DEFAULT false,
 excluded_cards jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(excluded_cards)='array'));
INSERT INTO public.assistant_auto_policy(singleton) VALUES(true);
CREATE TABLE public.assistant_auto_jobs (
 job_id text PRIMARY KEY CHECK(job_id ~ '^[a-f0-9]{64}$'), area text NOT NULL CHECK(area IN ('ai','kids','technical','academic')),
 card_id text NOT NULL, material text NOT NULL, manifest jsonb NOT NULL,
 scope_count integer NOT NULL CHECK(scope_count BETWEEN 1 AND 20001), next_offset integer NOT NULL DEFAULT 0,
 state text NOT NULL CHECK(state IN ('queued','running','complete','held')),
 request_id uuid,lease_token uuid,lease_until timestamptz, provider_calls integer NOT NULL DEFAULT 0,
 error_code text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.assistant_auto_attempts (
 request_id uuid PRIMARY KEY,job_id text NOT NULL REFERENCES public.assistant_auto_jobs,
 scope_offset integer NOT NULL, state text NOT NULL CHECK(state IN ('running','done','held')),
 provider_reserved boolean NOT NULL DEFAULT false,receipt jsonb,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX assistant_auto_done_scope ON public.assistant_auto_attempts(job_id,scope_offset) WHERE state='done';
CREATE INDEX assistant_auto_pending ON public.assistant_auto_jobs(created_at,job_id) WHERE state='queued';
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['assistant_auto_policy','assistant_auto_jobs','assistant_auto_attempts'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;

CREATE FUNCTION public.assistant_auto_register(p_jobs jsonb,p_registry jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item jsonb; card jsonb; step jsonb; m jsonb; s public.card_assistant_steps;
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_jobs) IS DISTINCT FROM 'array' OR jsonb_array_length(p_jobs)>200
  OR jsonb_typeof(p_registry) IS DISTINCT FROM 'array' OR jsonb_array_length(p_registry)>200 THEN
  RAISE EXCEPTION 'AUTOMATION_SCOPE_LIMIT'; END IF;
 -- Registration is derived from deployed source code, never request-body cards.
 FOR card IN SELECT value FROM jsonb_array_elements(p_registry) LOOP
  IF card->>'area' NOT IN ('kids','technical') OR card->>'id' !~ '^[a-z0-9-]{1,80}$'
   OR jsonb_typeof(card->'steps') IS DISTINCT FROM 'array' OR jsonb_array_length(card->'steps') NOT BETWEEN 1 AND 1000
   THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_INVALID'; END IF;
  INSERT INTO public.card_assistant_policy(area,card_id) VALUES(card->>'area',card->>'id') ON CONFLICT DO NOTHING;
  FOR step IN SELECT value FROM jsonb_array_elements(card->'steps') LOOP
   INSERT INTO public.card_assistant_steps(area,card_id,step_id,station_id,source_key,preview,kids_level,kids_lesson,technical_lesson)
   VALUES(card->>'area',card->>'id',step->>'id',step->>'stationId',
    CASE WHEN card->>'area'='kids' THEN step->'source'->>'levelId'||':'||(step->'source'->>'lessonNumber') ELSE step->'source'->>'lessonId' END,
    (step->>'preview')::boolean,step->'source'->>'levelId',(step->'source'->>'lessonNumber')::integer,step->'source'->>'lessonId')
   ON CONFLICT(area,card_id,step_id) DO NOTHING;
   SELECT * INTO s FROM public.card_assistant_steps WHERE area=card->>'area' AND card_id=card->>'id' AND step_id=step->>'id';
   IF s.station_id IS DISTINCT FROM step->>'stationId' OR s.preview IS DISTINCT FROM (step->>'preview')::boolean
    OR s.kids_level IS DISTINCT FROM step->'source'->>'levelId' OR s.kids_lesson IS DISTINCT FROM (step->'source'->>'lessonNumber')::integer
    OR s.technical_lesson IS DISTINCT FROM step->'source'->>'lessonId' THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_CHANGED'; END IF;
  END LOOP;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
  IF octet_length(item->>'material')>3000000 OR encode(extensions.digest(convert_to(item->>'material','UTF8'),'sha256'),'hex') IS DISTINCT FROM item->>'key'
   THEN RAISE EXCEPTION 'AUTOMATION_MANIFEST_INVALID'; END IF;
  m:=(item->>'material')::jsonb;
  IF m->>'schemaVersion' IS DISTINCT FROM 'assistant-auto-v1' OR m->>'area' NOT IN ('ai','kids','technical','academic')
   OR m->>'cardId' !~ '^[A-Za-z0-9-]{1,80}$' OR (m->>'scopeCount')::integer NOT BETWEEN 1 AND 20001
   OR jsonb_typeof(m->'scopes') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'AUTOMATION_MANIFEST_INVALID'; END IF;
  INSERT INTO public.assistant_auto_jobs(job_id,area,card_id,material,manifest,scope_count,state,error_code)
  VALUES(item->>'key',m->>'area',m->>'cardId',item->>'material',m,(m->>'scopeCount')::integer,
   CASE WHEN m->>'issue' IS NULL THEN 'queued' ELSE 'held' END,m->>'issue') ON CONFLICT DO NOTHING;
 END LOOP;
 RETURN jsonb_build_object('registered',jsonb_array_length(p_jobs));
END $$;

CREATE FUNCTION public.assistant_auto_check(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN EXISTS(SELECT 1 FROM public.assistant_auto_jobs j CROSS JOIN public.assistant_auto_policy p WHERE p.enabled
  AND NOT(p.excluded_cards ? (j.area||':'||j.card_id)) AND j.job_id=p_job AND j.state='running'
  AND j.request_id=p_request AND j.lease_token=p_lease AND j.lease_until>now());
END $$;

CREATE FUNCTION public.assistant_auto_claim(p_keys jsonb,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; old public.assistant_auto_attempts;
BEGIN
 PERFORM public.rag_require_service_role();
 IF p_request IS NULL OR jsonb_typeof(p_keys) IS DISTINCT FROM 'array' OR jsonb_array_length(p_keys)>200 THEN RAISE EXCEPTION 'AUTOMATION_REQUEST_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('assistant-auto-one-worker',0));
 IF NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy WHERE enabled) THEN RETURN jsonb_build_object('disabled',true); END IF;
 SELECT * INTO old FROM public.assistant_auto_attempts WHERE request_id=p_request;
 IF FOUND THEN RETURN jsonb_build_object('replayed',true,'state',old.state); END IF;
 -- Never replay expired/uncertain paid attempts. A later scheduled run holds them.
 UPDATE public.assistant_auto_attempts a SET state='held' FROM public.assistant_auto_jobs queued
  WHERE a.request_id=queued.request_id AND queued.state='running' AND queued.lease_until<=now();
 UPDATE public.assistant_auto_jobs SET state='held',error_code='AUTOMATION_UNCERTAIN_REQUEST' WHERE state='running' AND lease_until<=now();
 -- A source/build revision must not evade an uncertain paid request on this
 -- card. Preserve that hold across manifest revisions until operator review.
 UPDATE public.assistant_auto_jobs candidate SET state='held',error_code='AUTOMATION_PRIOR_REQUEST_NEEDS_REVIEW'
  WHERE candidate.state='queued' AND candidate.job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND EXISTS(SELECT 1 FROM public.assistant_auto_jobs prior JOIN public.assistant_auto_attempts a ON a.request_id=prior.request_id
   WHERE prior.area=candidate.area AND prior.card_id=candidate.card_id AND prior.state='held' AND a.provider_reserved);
 IF EXISTS(SELECT 1 FROM public.assistant_auto_jobs queued LEFT JOIN public.assistant_auto_attempts a ON a.request_id=queued.request_id
  WHERE queued.lease_until>now() AND (queued.state='running' OR (queued.state='held' AND a.provider_reserved)))
  OR EXISTS(SELECT 1 FROM public.rag_current_batches WHERE state='inflight' AND lease_until>now())
  THEN RETURN jsonb_build_object('busy',true); END IF;
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE state='queued' AND job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy p WHERE p.excluded_cards ? (area||':'||card_id)) ORDER BY created_at,job_id LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('done',true,'held',(SELECT count(*) FROM public.assistant_auto_jobs WHERE state='held' AND job_id IN(SELECT jsonb_array_elements_text(p_keys)))); END IF;
 UPDATE public.assistant_auto_jobs SET state='running',request_id=p_request,lease_token=gen_random_uuid(),lease_until=now()+interval '15 minutes'
  WHERE job_id=j.job_id RETURNING * INTO j;
 INSERT INTO public.assistant_auto_attempts(request_id,job_id,scope_offset,state) VALUES(p_request,j.job_id,j.next_offset,'running');
 RETURN jsonb_build_object('claimed',true,'jobId',j.job_id,'requestId',p_request,'leaseToken',j.lease_token,'offset',j.next_offset,'manifest',j.manifest);
END $$;

CREATE FUNCTION public.assistant_auto_reserve(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 PERFORM 1 FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) THEN RAISE EXCEPTION 'AUTOMATION_LEASE_UNAVAILABLE'; END IF;
 IF EXISTS(SELECT 1 FROM public.assistant_auto_jobs WHERE job_id=p_job AND provider_calls>=scope_count) THEN RAISE EXCEPTION 'AUTOMATION_PROVIDER_BUDGET'; END IF;
 UPDATE public.assistant_auto_attempts SET provider_reserved=true WHERE request_id=p_request AND job_id=p_job AND state='running' AND NOT provider_reserved;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_PROVIDER_ALREADY_RESERVED'; END IF;
 UPDATE public.assistant_auto_jobs SET provider_calls=provider_calls+1 WHERE job_id=p_job;
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_finish(p_job text,p_request uuid,p_lease uuid,p_done boolean,p_receipt jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR p_done IS DISTINCT FROM (j.next_offset+1=j.scope_count)
  OR jsonb_typeof(p_receipt) IS DISTINCT FROM 'object' OR octet_length(p_receipt::text)>100000 THEN RAISE EXCEPTION 'AUTOMATION_RECEIPT_INVALID'; END IF;
 UPDATE public.assistant_auto_attempts SET state='done',receipt=p_receipt WHERE request_id=p_request AND job_id=p_job AND state='running';
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_REQUEST_INVALID'; END IF;
 UPDATE public.assistant_auto_jobs SET next_offset=next_offset+1,state=CASE WHEN p_done THEN 'complete' ELSE 'queued' END,lease_until=NULL WHERE job_id=p_job;
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_hold(p_job text,p_request uuid,p_lease uuid,p_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 UPDATE public.assistant_auto_jobs SET state='held',error_code=CASE WHEN p_code ~ '^AUTOMATION_[A-Z0-9_]{1,64}$' THEN p_code ELSE 'AUTOMATION_OPERATION_UNAVAILABLE' END
  WHERE job_id=p_job AND request_id=p_request AND lease_token=p_lease AND state='running';
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE public.assistant_auto_attempts SET state='held' WHERE request_id=p_request AND job_id=p_job AND state='running';
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_status() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN jsonb_build_object('schemaVersion','assistant-auto-v1','enabled',(SELECT enabled FROM public.assistant_auto_policy));
END $$;

CREATE FUNCTION public.assistant_auto_ai_clear(p_release text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 RETURN NOT EXISTS(SELECT 1 FROM public.rag_current_batches WHERE release_id=p_release AND state<>'done'
  AND (state='inflight' OR provider_reserved));
END $$;

DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname LIKE 'assistant_auto_%' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;


-- Source: scripts/assistant/automatic-publication-candidate.sql
-- LF SHA256: 4073bb75beaaa55dc2e91ceae5f4cfbda8072ae1916f5aced9d0b581840b0eda
-- Install after automatic-indexing-candidate.sql and the reviewed native /
-- Academic provenance migrations. Does not itself enable any card or worker.

CREATE FUNCTION public.assistant_auto_publish_card(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' SET lock_timeout='3s' AS $$
DECLARE j public.assistant_auto_jobs; expected_count integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR j.area NOT IN('kids','technical') OR j.next_offset<>j.scope_count-1
  OR jsonb_array_length(j.manifest->'scopes')<>j.next_offset THEN RAISE EXCEPTION 'AUTOMATION_NOT_READY'; END IF;
 LOCK TABLE public.card_assistant_policy,public.card_assistant_steps,public.card_assistant_chunks,
  public.kids_content_approvals,public.technical_lesson_content IN SHARE ROW EXCLUSIVE MODE;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(j.manifest->'scopes') WITH ORDINALITY s(scope,ordinal)
  LEFT JOIN public.assistant_auto_attempts a ON a.job_id=j.job_id AND a.scope_offset=s.ordinal-1 AND a.state='done'
  LEFT JOIN public.card_assistant_steps st ON st.area=j.area AND st.card_id=j.card_id AND st.step_id=s.scope->>'stepId'
  WHERE a.request_id IS NULL OR jsonb_array_length(a.receipt->'proofs') IS DISTINCT FROM 1
   OR a.receipt->'proofs'->0->>'stepId' IS DISTINCT FROM s.scope->>'stepId'
   OR a.receipt->'proofs'->0->>'locale' IS DISTINCT FROM s.scope->>'locale'
   OR a.receipt->'proofs'->0->>'sourceSha' IS DISTINCT FROM s.scope->>'sourceSha'
   OR jsonb_array_length(a.receipt->'proofs'->0->'chunks') NOT BETWEEN 1 AND 80 OR st.step_id IS NULL
   OR NOT ((j.area='kids' AND EXISTS(SELECT 1 FROM public.kids_content_approvals k WHERE k.level_id=st.kids_level
    AND k.lesson_number=st.kids_lesson AND k.locale=s.scope->>'locale' AND k.approved_sha256=s.scope->>'sourceSha'))
    OR (j.area='technical' AND EXISTS(SELECT 1 FROM public.technical_lesson_content t WHERE t.lesson_id=st.technical_lesson
     AND t.locale=s.scope->>'locale' AND t.source_sha256=s.scope->>'sourceSha')))) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF (SELECT count(*)*4 FROM public.card_assistant_steps WHERE area=j.area AND card_id=j.card_id)<>j.next_offset
  OR (SELECT count(DISTINCT (s->>'stepId',s->>'locale')) FROM jsonb_array_elements(j.manifest->'scopes') s)<>j.next_offset
  THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_CHANGED'; END IF;
 WITH expected AS (
  SELECT a.receipt->'proofs'->0 p,c FROM public.assistant_auto_attempts a
   CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done'
 ) SELECT count(*) INTO expected_count FROM expected;
 IF expected_count<>(SELECT count(DISTINCT(a.receipt->'proofs'->0->>'stepId',a.receipt->'proofs'->0->>'locale',c->>'id'))
  FROM public.assistant_auto_attempts a CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done') THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF expected_count<1 OR (SELECT count(*) FROM public.card_assistant_chunks WHERE area=j.area AND card_id=j.card_id)<>expected_count
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF EXISTS(WITH expected AS (
  SELECT a.receipt->'proofs'->0 p,c FROM public.assistant_auto_attempts a
   CROSS JOIN LATERAL jsonb_array_elements(a.receipt->'proofs'->0->'chunks') c
  WHERE a.job_id=j.job_id AND a.scope_offset<j.next_offset AND a.state='done'
 ) SELECT 1 FROM expected e LEFT JOIN public.card_assistant_chunks c ON c.area=j.area AND c.card_id=j.card_id
  AND c.step_id=e.p->>'stepId' AND c.locale=e.p->>'locale' AND c.chunk_id=e.c->>'id'
 WHERE c.chunk_id IS NULL OR c.source_sha256 IS DISTINCT FROM e.p->>'sourceSha' OR c.payload_sha256 IS DISTINCT FROM e.c->>'payloadSha'
  OR c.content_sha256 IS DISTINCT FROM e.c->>'contentSha' OR c.content_sha256 IS DISTINCT FROM encode(extensions.digest(convert_to(c.content,'UTF8'),'sha256'),'hex')
  OR c.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR c.embedding_dimensions IS DISTINCT FROM 1536
  OR c.embedding IS NULL OR extensions.vector_dims(c.embedding) IS DISTINCT FROM 1536
  OR (extensions.vector_norm(c.embedding) BETWEEN 0.00000000000000000001 AND 10000000000) IS DISTINCT FROM true)
 THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 UPDATE public.card_assistant_policy SET runtime_enabled=true WHERE area=j.area AND card_id=j.card_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_POLICY_MISSING'; END IF;
 RETURN true;
END $$;

CREATE FUNCTION public.assistant_auto_publish_academic(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='60s' SET lock_timeout='3s' AS $$
DECLARE j public.assistant_auto_jobs; expected_count integer;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job FOR UPDATE;
 IF NOT public.assistant_auto_check(p_job,p_request,p_lease) OR j.area<>'academic' OR j.next_offset<>j.scope_count-1
  OR jsonb_array_length(j.manifest->'scopes')<>j.next_offset THEN RAISE EXCEPTION 'AUTOMATION_NOT_READY'; END IF;
 LOCK TABLE public.academic_courses,public.academic_lesson_content,public.academic_rag_chunks,public.academic_assistant_policy IN SHARE ROW EXCLUSIVE MODE;
 IF NOT EXISTS(SELECT 1 FROM public.academic_courses WHERE id=j.card_id AND ((enabled AND assistant_enabled) OR assistant_review_enabled))
  OR (SELECT count(*) FROM public.academic_lesson_content WHERE course_id=j.card_id)<>j.next_offset
  OR (SELECT count(DISTINCT (s->>'stepId',s->>'locale')) FROM jsonb_array_elements(j.manifest->'scopes') s)<>j.next_offset
  THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(j.manifest->'scopes') WITH ORDINALITY s(scope,ordinal)
  LEFT JOIN public.assistant_auto_attempts a ON a.job_id=j.job_id AND a.scope_offset=s.ordinal-1 AND a.state='done'
  LEFT JOIN public.academic_lesson_content l ON l.course_id=j.card_id AND l.lesson_id=s.scope->>'stepId' AND l.locale=s.scope->>'locale'
  WHERE a.request_id IS NULL OR NOT coalesce(l.approved,false) OR l.source_sha256 IS DISTINCT FROM s.scope->>'sourceSha'
   OR jsonb_array_length(a.receipt->'proofs') IS DISTINCT FROM 1
   OR a.receipt->'proofs'->0->>'stepId' IS DISTINCT FROM l.lesson_id OR a.receipt->'proofs'->0->>'locale' IS DISTINCT FROM l.locale
   OR a.receipt->'proofs'->0->>'sourceSha' IS DISTINCT FROM l.source_sha256
   OR jsonb_array_length(l.payload->'sections') IS DISTINCT FROM jsonb_array_length(a.receipt->'proofs'->0->'chunks'))
  THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_CHANGED'; END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l CROSS JOIN (VALUES('ar-EG'),('ar-MSA'),('ar-Gulf'),('en')) lang(locale)
  WHERE l.course_id=j.card_id AND NOT EXISTS(SELECT 1 FROM public.academic_lesson_content other WHERE other.course_id=l.course_id
   AND other.lesson_id=l.lesson_id AND other.locale=lang.locale AND other.approved)) THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_UNAPPROVED'; END IF;
 SELECT sum(jsonb_array_length(payload->'sections')) INTO expected_count FROM public.academic_lesson_content WHERE course_id=j.card_id AND approved;
 IF expected_count<1 OR (SELECT count(*) FROM public.academic_rag_chunks WHERE course_id=j.card_id)<>expected_count
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 IF EXISTS(SELECT 1 FROM public.academic_lesson_content l CROSS JOIN LATERAL jsonb_array_elements(l.payload->'sections') s
  LEFT JOIN public.academic_rag_chunks r ON r.course_id=l.course_id AND r.lesson_id=l.lesson_id AND r.locale=l.locale AND r.section_id=s->>'id'
  WHERE l.course_id=j.card_id AND (r.section_id IS NULL OR r.source_sha256 IS DISTINCT FROM l.source_sha256
   OR r.content_version IS DISTINCT FROM coalesce(l.payload->>'version','1.0.0-pilot') OR r.content IS DISTINCT FROM (s->>'title')||E'\n'||(s->>'text')
   OR r.content_sha256 IS DISTINCT FROM encode(extensions.digest(convert_to(r.content,'UTF8'),'sha256'),'hex')
   OR r.embedding_model IS DISTINCT FROM 'text-embedding-3-small' OR r.embedding_dimensions IS DISTINCT FROM 1536
   OR r.embedding IS NULL OR extensions.vector_dims(r.embedding) IS DISTINCT FROM 1536
   OR (extensions.vector_norm(r.embedding) BETWEEN 0.00000000000000000001 AND 10000000000) IS DISTINCT FROM true))
  THEN RAISE EXCEPTION 'AUTOMATION_INDEX_INCOMPLETE'; END IF;
 UPDATE public.academic_assistant_policy SET runtime_enabled=true WHERE course_id=j.card_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'AUTOMATION_POLICY_MISSING'; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.assistant_auto_publish_card(text,uuid,uuid),public.assistant_auto_publish_academic(text,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_auto_publish_card(text,uuid,uuid),public.assistant_auto_publish_academic(text,uuid,uuid) TO service_role;


-- Source: scripts/assistant/automatic-source-events-candidate.sql
-- LF SHA256: a7700348715ede28c7b58dc68087701be5b4d326846012455f0c5e33602d7757
-- Additive, nonproduction installation candidate. Install AFTER the existing
-- automatic indexing/publication candidates. No worker/policy is enabled here.
-- This is a metadata outbox into the EXISTING queue, not another index engine.

CREATE TABLE public.assistant_auto_source_events (
 event_id bigserial PRIMARY KEY,
 area text NOT NULL CHECK(area IN ('kids','technical','academic')),
 source_key text NOT NULL, locale text NOT NULL,
 source_sha text, withdrawn boolean NOT NULL,
 job_id text REFERENCES public.assistant_auto_jobs(job_id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_auto_unlinked_source ON public.assistant_auto_source_events(event_id) WHERE job_id IS NULL;
ALTER TABLE public.assistant_auto_source_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assistant_auto_source_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.assistant_auto_source_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.assistant_auto_source_events_event_id_seq TO service_role;

CREATE FUNCTION public.assistant_auto_capture_source() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous jsonb; nextrow jsonb; rowdata jsonb; a text; k text; loc text; sha text; gone boolean;
BEGIN
 previous:=CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END;
 nextrow:=CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END;
 IF TG_OP='UPDATE' AND previous=nextrow THEN RETURN NEW; END IF;
 -- A moved source emits withdrawal of its old identity and admission of its new
 -- identity. Source approval itself remains with the pre-existing source writer.
 FOR rowdata IN SELECT value FROM jsonb_array_elements(
   CASE WHEN previous IS NULL THEN jsonb_build_array(nextrow)
        WHEN nextrow IS NULL THEN jsonb_build_array(previous)
        ELSE jsonb_build_array(previous,nextrow) END) LOOP
  gone:=nextrow IS NULL OR (previous IS NOT NULL AND rowdata=previous);
  IF TG_TABLE_NAME='kids_content_approvals' THEN
   a:='kids';k:=rowdata->>'level_id'||':'||(rowdata->>'lesson_number');loc:=rowdata->>'locale';sha:=rowdata->>'approved_sha256';
  ELSIF TG_TABLE_NAME='technical_lesson_content' THEN
   a:='technical';k:=rowdata->>'lesson_id';loc:=rowdata->>'locale';sha:=rowdata->>'source_sha256';
  ELSIF TG_TABLE_NAME='academic_lesson_content' THEN
   a:='academic';k:=rowdata->>'course_id'||':'||(rowdata->>'lesson_id');loc:=rowdata->>'locale';sha:=rowdata->>'source_sha256';
   gone:=gone OR (rowdata->>'approved')::boolean IS DISTINCT FROM true;
  ELSIF TG_TABLE_NAME='academic_courses' THEN
   a:='academic';k:=rowdata->>'id';loc:='*';sha:=NULL;
  ELSE RAISE EXCEPTION 'AUTOMATION_SOURCE_TABLE_INVALID'; END IF;
  IF k IS NULL OR loc IS NULL THEN RAISE EXCEPTION 'AUTOMATION_SOURCE_IDENTITY_INVALID'; END IF;
  IF sha IS NOT NULL AND sha !~ '^[a-f0-9]{64}$' THEN gone:=true; END IF;
  INSERT INTO public.assistant_auto_source_events(area,source_key,locale,source_sha,withdrawn)
   VALUES(a,k,loc,CASE WHEN gone THEN NULL ELSE sha END,gone);
  -- Never serve an old index while its source approval/content is changing.
  -- Existing runtime source/access checks remain mandatory as well.
  IF a='academic' THEN
   UPDATE public.academic_assistant_policy SET runtime_enabled=false
    WHERE course_id=split_part(k,':',1);
  ELSE
   UPDATE public.card_assistant_policy p SET runtime_enabled=false
    WHERE p.area=a AND EXISTS(SELECT 1 FROM public.card_assistant_steps s
      WHERE s.area=p.area AND s.card_id=p.card_id AND s.source_key=k);
  END IF;
 END LOOP;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION public.assistant_auto_capture_source() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER assistant_auto_kids_source AFTER INSERT OR UPDATE OR DELETE ON public.kids_content_approvals
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_technical_source AFTER INSERT OR UPDATE OR DELETE ON public.technical_lesson_content
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_academic_source AFTER INSERT OR UPDATE OR DELETE ON public.academic_lesson_content
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();
CREATE TRIGGER assistant_auto_academic_policy AFTER INSERT OR UPDATE OR DELETE ON public.academic_courses
 FOR EACH ROW EXECUTE FUNCTION public.assistant_auto_capture_source();

-- A repeated source digest after withdrawal must create a NEW queue identity;
-- otherwise a previously complete job would leave the republished card disabled.
CREATE FUNCTION public.assistant_auto_source_revisions(p_registry jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; card jsonb; n bigint;
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_registry) IS DISTINCT FROM 'array' OR jsonb_array_length(p_registry)>200
  THEN RAISE EXCEPTION 'AUTOMATION_REGISTRATION_INVALID'; END IF;
 result:='{}';
 FOR card IN SELECT value FROM jsonb_array_elements(p_registry) LOOP
  SELECT coalesce(max(e.event_id),0) INTO n FROM public.assistant_auto_source_events e
   WHERE e.area=card->>'area' AND EXISTS(SELECT 1 FROM jsonb_array_elements(card->'steps') s
    WHERE e.source_key=CASE WHEN e.area='kids' THEN s->'source'->>'levelId'||':'||(s->'source'->>'lessonNumber')
      ELSE s->'source'->>'lessonId' END);
  result:=result||jsonb_build_object((card->>'area')||':'||(card->>'id'),n::text);
 END LOOP;
 SELECT result||coalesce(jsonb_object_agg('academic:'||revisions.course,revisions.n::text),'{}') INTO result
  FROM (SELECT split_part(source_key,':',1) course,max(event_id) n FROM public.assistant_auto_source_events
   WHERE area='academic' GROUP BY 1) revisions;
 RETURN result;
END $$;

-- Same existing lease guard, now also fenced by its own card's source epoch.
-- Changes in an unrelated course never invalidate this lease.
CREATE OR REPLACE FUNCTION public.assistant_auto_check(p_job text,p_request uuid,p_lease uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.assistant_auto_jobs; latest bigint;
BEGIN
 PERFORM public.rag_require_service_role();
 SELECT * INTO j FROM public.assistant_auto_jobs WHERE job_id=p_job;
 IF NOT FOUND OR j.state<>'running' OR j.request_id IS DISTINCT FROM p_request
  OR j.lease_token IS DISTINCT FROM p_lease OR j.lease_until IS NULL OR j.lease_until<=now()
  OR NOT EXISTS(SELECT 1 FROM public.assistant_auto_policy p WHERE p.enabled AND NOT(p.excluded_cards ? (j.area||':'||j.card_id)))
  THEN RETURN false; END IF;
 SELECT coalesce(max(e.event_id),0) INTO latest FROM public.assistant_auto_source_events e
 WHERE e.area=j.area AND ((e.area='academic' AND split_part(e.source_key,':',1)=j.card_id)
  OR EXISTS(SELECT 1 FROM public.card_assistant_steps s WHERE s.area=j.area AND s.card_id=j.card_id AND s.source_key=e.source_key));
 RETURN latest=0 OR (j.manifest->>'sourceRevision') IS NOT DISTINCT FROM latest::text;
END $$;

CREATE FUNCTION public.assistant_auto_link_sources(p_keys jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_keys) IS DISTINCT FROM 'array' OR jsonb_array_length(p_keys)>200
  THEN RAISE EXCEPTION 'AUTOMATION_SCOPE_LIMIT'; END IF;
 UPDATE public.assistant_auto_source_events e SET job_id=j.job_id
 FROM public.assistant_auto_jobs j
 WHERE e.job_id IS NULL AND j.job_id IN(SELECT jsonb_array_elements_text(p_keys))
  AND j.area=e.area AND j.manifest->>'sourceRevision' ~ '^[0-9]{1,20}$'
  AND e.event_id<=(j.manifest->>'sourceRevision')::numeric
  AND ((e.area='academic' AND split_part(e.source_key,':',1)=j.card_id)
   OR EXISTS(SELECT 1 FROM public.card_assistant_steps s
    WHERE s.area=j.area AND s.card_id=j.card_id AND s.source_key=e.source_key));
 RETURN true;
END $$;

-- Read-only reconciliation after a LOST finish response. Matching exact
-- request, job, offset and JSON receipt is required; an unrelated job or newer
-- lease cannot be mistaken for this operation's completion.
CREATE FUNCTION public.assistant_auto_receipt(p_job text,p_request uuid,p_offset integer,p_receipt jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM public.rag_require_service_role();
 IF jsonb_typeof(p_receipt) IS DISTINCT FROM 'object' OR octet_length(p_receipt::text)>100000
  THEN RAISE EXCEPTION 'AUTOMATION_RECEIPT_INVALID'; END IF;
 RETURN EXISTS(SELECT 1 FROM public.assistant_auto_attempts a JOIN public.assistant_auto_jobs j USING(job_id)
  WHERE a.job_id=p_job AND a.request_id=p_request AND a.scope_offset=p_offset
   AND a.state='done' AND a.receipt=p_receipt AND j.next_offset>p_offset);
END $$;

CREATE VIEW public.assistant_auto_intake_status WITH(security_invoker=true) AS
 SELECT e.event_id,e.area,e.source_key,e.locale,e.source_sha,e.withdrawn,e.job_id,
  CASE WHEN EXISTS(SELECT 1 FROM public.assistant_auto_source_events newer
   WHERE newer.area=e.area AND newer.source_key=e.source_key AND newer.locale=e.locale AND newer.event_id>e.event_id)
   THEN 'superseded' ELSE CASE j.state WHEN 'running' THEN 'working' WHEN 'complete' THEN 'succeeded'
   WHEN 'held' THEN 'failed' ELSE 'pending' END END AS state,
  j.error_code,j.next_offset,j.scope_count,e.created_at
 FROM public.assistant_auto_source_events e LEFT JOIN public.assistant_auto_jobs j USING(job_id);
REVOKE ALL ON public.assistant_auto_intake_status FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.assistant_auto_intake_status TO service_role;
REVOKE ALL ON FUNCTION public.assistant_auto_source_revisions(jsonb),public.assistant_auto_link_sources(jsonb),
 public.assistant_auto_receipt(text,uuid,integer,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_auto_source_revisions(jsonb),public.assistant_auto_link_sources(jsonb),
 public.assistant_auto_receipt(text,uuid,integer,jsonb) TO service_role;


-- Source: scripts/free-access/free-access-candidate.sql
-- LF SHA256: 9a30f203d8e5b9f5fe47954493bb9cc672c415ca2512eab93bbf1e72459e9bc8
-- Review/rehearsal candidate, applied only to disposable test databases here.
-- No automatic trial, per-user grant, plan upgrade, cron or payment mutation.

CREATE TABLE billing.free_access_windows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 160),
 targets text[] NOT NULL CHECK(cardinality(targets) BETWEEN 1 AND 100 AND array_position(targets,NULL) IS NULL),
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 enabled boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX free_access_window_clock ON billing.free_access_windows(starts_at,ends_at) WHERE enabled;
CREATE TABLE billing.free_access_window_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), window_id uuid NOT NULL REFERENCES billing.free_access_windows(id),
 actor uuid REFERENCES auth.users(id) ON DELETE SET NULL, action text NOT NULL,
 details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing.free_access_window_requests (
 key uuid PRIMARY KEY, actor uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 parameters jsonb NOT NULL, response jsonb NOT NULL
);
ALTER TABLE billing.free_access_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.free_access_window_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.free_access_window_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing.free_access_windows,billing.free_access_window_audit,billing.free_access_window_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON billing.free_access_windows,billing.free_access_window_audit,billing.free_access_window_requests TO service_role;

-- Discover every current curriculum record, including newly registered drafts.
-- Selecting a draft never publishes it or bypasses its normal release checks.
CREATE FUNCTION billing.free_access_targets() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_array(jsonb_build_object('id','ai','title','Artificial intelligence — all paths','published',true))
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','ai:'||path_id,'title','AI — '||path_id,'published',true) ORDER BY path_id)
    FROM (SELECT DISTINCT path_id FROM billing.commerce_lesson_catalog) p),'[]'::jsonb)
 || jsonb_build_array(jsonb_build_object('id','technical:furniture','title','Technical — furniture','published',
    EXISTS(SELECT 1 FROM public.technical_release_control WHERE enabled) AND EXISTS(SELECT 1 FROM public.technical_lesson_content)),
    jsonb_build_object('id','kids','title','Kids','published',
    EXISTS(SELECT 1 FROM public.kids_release_control WHERE singleton AND accepts_child_data AND lesson_access_enabled)))
 || coalesce((SELECT jsonb_agg(jsonb_build_object('id','academic:'||id,'title',coalesce(titles->>'en',id),
    'titles',titles,'published',enabled AND EXISTS(SELECT 1 FROM public.academic_lesson_content l WHERE l.course_id=c.id AND l.approved)) ORDER BY id)
    FROM public.academic_courses c),'[]'::jsonb);
$$;
CREATE FUNCTION billing.free_access_has(p_user uuid,p_target text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND billing.commerce_account_allowed(p_user)
 AND EXISTS(SELECT 1 FROM auth.users WHERE id=p_user AND email_confirmed_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM billing.free_access_windows w
   WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at AND p_target=ANY(w.targets));
$$;
CREATE FUNCTION billing.free_access_ai_lesson(p_user uuid,p_lesson text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM billing.commerce_lesson_catalog l WHERE l.lesson_id=p_lesson
 AND (billing.free_access_has(p_user,'ai') OR billing.free_access_has(p_user,'ai:'||l.path_id)));
$$;

CREATE FUNCTION public.free_access_window_command(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); w billing.free_access_windows%ROWTYPE; old jsonb; params jsonb;
 prior billing.free_access_window_requests%ROWTYPE; v_targets text[]; start_time timestamptz; end_time timestamptz;
 request_key uuid; result jsonb;
BEGIN
 PERFORM billing.commerce_assert_identity(actor);
 IF NOT coalesce(public.has_role(actor,'admin'::public.app_role),false) THEN RAISE EXCEPTION 'FREE_ACCESS_ADMIN_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>65536 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 IF p_action='list' THEN
  IF p_data<>'{}' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  RETURN jsonb_build_object('server_time',now(),'targets',billing.free_access_targets(),
   'windows',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.starts_at DESC,v.id) FROM (
    SELECT x.id,x.title,x.targets,x.starts_at,x.ends_at,x.enabled,x.version,
      CASE WHEN NOT x.enabled THEN 'paused' WHEN now()<x.starts_at THEN 'scheduled'
        WHEN now()>=x.ends_at THEN 'expired' ELSE 'active' END AS status
    FROM billing.free_access_windows x) v),'[]'::jsonb),
   'audit',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC) FROM (
      SELECT window_id,action,created_at FROM billing.free_access_window_audit ORDER BY created_at DESC LIMIT 200) a),'[]'::jsonb));
 END IF;
 IF p_action NOT IN ('create','update') OR p_data-ARRAY['id','expected_version','title','targets','starts_at','ends_at','enabled','key']<>'{}'
 OR jsonb_typeof(p_data->'title') IS DISTINCT FROM 'string'
 OR length(btrim(p_data->>'title')) NOT BETWEEN 1 AND 160
 OR jsonb_typeof(p_data->'targets') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_data->'enabled') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p_data->'starts_at') IS DISTINCT FROM 'string' OR jsonb_typeof(p_data->'ends_at') IS DISTINCT FROM 'string'
 OR (p_data->>'starts_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$' OR (p_data->>'ends_at') !~ '(Z|[+-][0-9]{2}:[0-9]{2})$'
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 SELECT array_agg(x ORDER BY x) INTO v_targets FROM jsonb_array_elements_text(p_data->'targets') x;
 IF coalesce(cardinality(v_targets),0) NOT BETWEEN 1 AND 100
 OR cardinality(v_targets)<>(SELECT count(DISTINCT x) FROM unnest(v_targets) x)
 OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE t IS NULL OR NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(billing.free_access_targets()) c WHERE c->>'id'=t))
 THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_TARGET'; END IF;
 BEGIN
  start_time:=(p_data->>'starts_at')::timestamptz;end_time:=(p_data->>'ends_at')::timestamptz;
  request_key:=(p_data->>'key')::uuid;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END;
 IF request_key IS NULL OR start_time IS NULL OR end_time IS NULL OR NOT isfinite(start_time) OR NOT isfinite(end_time) OR start_time>=end_time THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
 params:=jsonb_build_object('action',p_action,'data',p_data);
 PERFORM pg_advisory_xact_lock(hashtextextended(request_key::text,837));
 SELECT * INTO prior FROM billing.free_access_window_requests WHERE key=request_key;
 IF FOUND THEN
  IF prior.actor<>actor OR prior.parameters<>params THEN RAISE EXCEPTION 'FREE_ACCESS_RETRY_MISMATCH'; END IF;
  RETURN prior.response;
 END IF;
 IF p_action='create' THEN
  IF p_data ?| ARRAY['id','expected_version'] THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  INSERT INTO billing.free_access_windows(title,targets,starts_at,ends_at,enabled,created_by)
    VALUES(btrim(p_data->>'title'),v_targets,start_time,end_time,(p_data->>'enabled')::boolean,actor) RETURNING * INTO w;
 ELSE
  IF jsonb_typeof(p_data->'expected_version') IS DISTINCT FROM 'number'
    OR (p_data->>'expected_version') !~ '^[1-9][0-9]{0,8}$' THEN RAISE EXCEPTION 'FREE_ACCESS_INVALID_INPUT'; END IF;
  SELECT * INTO w FROM billing.free_access_windows WHERE id=(p_data->>'id')::uuid FOR UPDATE;
  IF NOT FOUND OR w.version<>(p_data->>'expected_version')::integer THEN RAISE EXCEPTION 'FREE_ACCESS_CONFLICT'; END IF;
  old:=to_jsonb(w)-'created_by';
  UPDATE billing.free_access_windows x SET title=btrim(p_data->>'title'),targets=v_targets,starts_at=start_time,ends_at=end_time,
    enabled=(p_data->>'enabled')::boolean,version=x.version+1,updated_at=now() WHERE x.id=w.id RETURNING x.* INTO w;
 END IF;
 result:=jsonb_build_object('id',w.id,'version',w.version);
 INSERT INTO billing.free_access_window_audit(window_id,actor,action,details)
 VALUES(w.id,actor,p_action,jsonb_build_object('before',old,'after',to_jsonb(w)-'created_by'));
 INSERT INTO billing.free_access_window_requests VALUES(request_key,actor,params,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.free_access_window_command(text,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.free_access_window_command(text,jsonb) TO authenticated;

CREATE FUNCTION public.get_my_free_access() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); active_targets text[]:='{}'; lesson_ids text[]:='{}'; deadline timestamptz;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'FREE_ACCESS_AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
 IF billing.commerce_account_allowed(u) AND EXISTS(SELECT 1 FROM auth.users WHERE id=u AND email_confirmed_at IS NOT NULL) THEN
  SELECT coalesce(array_agg(DISTINCT t ORDER BY t),'{}') INTO active_targets
  FROM billing.free_access_windows w CROSS JOIN LATERAL unnest(w.targets) t WHERE w.enabled AND w.starts_at<=now() AND now()<w.ends_at;
  SELECT coalesce(array_agg(lesson_id ORDER BY lesson_id),'{}') INTO lesson_ids FROM billing.commerce_lesson_catalog
    WHERE 'ai'=ANY(active_targets) OR ('ai:'||path_id)=ANY(active_targets);
 END IF;
 SELECT least(now()+interval '30 seconds',min(boundary)) INTO deadline FROM (
   SELECT starts_at AS boundary FROM billing.free_access_windows WHERE enabled AND starts_at>now()
   UNION ALL SELECT ends_at FROM billing.free_access_windows WHERE enabled AND ends_at>now()) b;
 RETURN jsonb_build_object('server_time',now(),'valid_until',coalesce(deadline,now()+interval '30 seconds'),
   'targets',to_jsonb(active_targets),'lesson_ids',to_jsonb(lesson_ids));
END $$;
REVOKE ALL ON FUNCTION public.get_my_free_access() FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.get_my_free_access() TO authenticated;

-- Preserve every installed identity/release/consent gate: extend only the commercial alternatives.
DO $$ DECLARE d text; needle text; target regprocedure; BEGIN
 target:=coalesce(to_regprocedure('billing.kids_previous_admin_lesson_access(uuid,text,integer,text)'),to_regprocedure('public.kids_can_access_lesson(uuid,text,integer,text)'));
 d:=pg_get_functiondef(target);needle:='requested_lesson BETWEEN 1 AND 2 OR';
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'FREE_ACCESS_KIDS_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,needle||' billing.free_access_has(auth.uid(),''kids'') OR');
 d:=pg_get_functiondef('public.technical_can_access(text)'::regprocedure);needle:='p_lesson=''M01-L01'' OR';
 EXECUTE replace(d,'FUNCTION public.technical_can_access(', 'FUNCTION billing.free_window_previous_technical_access(');
 IF position(needle IN d)=0 THEN RAISE EXCEPTION 'FREE_ACCESS_TECHNICAL_DEFINITION_CHANGED'; END IF;
 EXECUTE replace(d,needle,needle||' billing.free_access_has(auth.uid(),''technical:furniture'') OR');
 EXECUTE replace(pg_get_functiondef('public.academic_can_access(text,text,text)'::regprocedure),
   'FUNCTION public.academic_can_access(', 'FUNCTION billing.free_window_previous_academic_access(');
 EXECUTE replace(pg_get_functiondef('billing.evaluate_access(uuid,text,text)'::regprocedure),
   'FUNCTION billing.evaluate_access(', 'FUNCTION billing.free_window_previous_evaluate_access(');
 EXECUTE replace(pg_get_functiondef('public.academic_command(text,text,text,text,jsonb)'::regprocedure),
   'FUNCTION public.academic_command(', 'FUNCTION billing.free_window_previous_academic_command(');
 EXECUTE replace(pg_get_functiondef('public.technical_command(text,text,text,jsonb)'::regprocedure),
   'FUNCTION public.technical_command(', 'FUNCTION billing.free_window_previous_technical_command(');
 EXECUTE replace(pg_get_functiondef('public.get_my_kids_access_status()'::regprocedure),
   'FUNCTION public.get_my_kids_access_status(', 'FUNCTION billing.free_window_previous_kids_status(');
END $$;
CREATE OR REPLACE FUNCTION public.academic_can_access(p_course text,p_lesson text,p_locale text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT billing.free_window_previous_academic_access(p_course,p_lesson,p_locale)
 OR (billing.free_access_has(auth.uid(),'academic:'||p_course) AND EXISTS(
   SELECT 1 FROM public.academic_courses c JOIN public.academic_lesson_content l ON l.course_id=c.id
   WHERE c.id=p_course AND c.enabled AND l.lesson_id=p_lesson AND l.locale=p_locale AND l.approved));
$$;
CREATE OR REPLACE FUNCTION billing.evaluate_access(p_user_id uuid,p_resource_type text,p_resource_id text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE prior jsonb;BEGIN
 -- Call the existing service/subject authorization first, even for an active window.
 prior:=billing.free_window_previous_evaluate_access(p_user_id,p_resource_type,p_resource_id);
 IF coalesce((prior->>'allowed')::boolean,false) THEN RETURN prior; END IF;
 IF p_resource_type IN ('lesson','video') AND billing.free_access_ai_lesson(p_user_id,p_resource_id) THEN
   RETURN jsonb_build_object('allowed',true,'denial_reason_code',NULL,'source','scheduled_free_access');
 END IF;
 RETURN prior;
END $$;
-- Deliberately no snapshot/tier/paid flag/AI quota override. A path window is not Pro/ProPlus.
CREATE FUNCTION billing.free_window_tag_delivery(p_result jsonb,p_target text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE deadline timestamptz;BEGIN
 IF NOT coalesce((p_result->>'allowed')::boolean,false) THEN RETURN p_result; END IF;
 SELECT max(ends_at) INTO deadline FROM billing.free_access_windows
   WHERE enabled AND starts_at<=now() AND now()<ends_at AND p_target=ANY(targets);
 RETURN CASE WHEN deadline IS NULL THEN p_result ELSE p_result||jsonb_build_object(
   'free_access_server_time',now(),'free_access_check_at',least(deadline,now()+interval '30 seconds')) END;
END $$;
CREATE OR REPLACE FUNCTION public.academic_command(p_action text,p_course text DEFAULT NULL,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;BEGIN
 result:=billing.free_window_previous_academic_command(p_action,p_course,p_lesson,p_locale,p_data);
 IF p_action='lesson' AND NOT billing.free_window_previous_academic_access(p_course,p_lesson,p_locale) THEN
   RETURN billing.free_window_tag_delivery(result,'academic:'||p_course);
 END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.technical_command(p_action text,p_lesson text DEFAULT NULL,p_locale text DEFAULT NULL,p_data jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;BEGIN
 result:=billing.free_window_previous_technical_command(p_action,p_lesson,p_locale,p_data);
 IF p_action='lesson' AND NOT billing.free_window_previous_technical_access(p_lesson) THEN
   RETURN billing.free_window_tag_delivery(result,'technical:furniture'); END IF;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.get_my_kids_access_status() RETURNS TABLE(access_source text,active_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 RETURN QUERY SELECT s.access_source,s.active_until FROM (
   SELECT * FROM billing.free_window_previous_kids_status()
   UNION ALL SELECT 'scheduled_free_access'::text,max(w.ends_at) FROM billing.free_access_windows w
     WHERE billing.free_access_has(auth.uid(),'kids') AND w.enabled AND 'kids'=ANY(w.targets)
       AND w.starts_at<=now() AND now()<w.ends_at HAVING count(*)>0) s ORDER BY s.active_until DESC LIMIT 1;
END $$;
REVOKE ALL ON FUNCTION billing.free_access_targets(),billing.free_access_has(uuid,text),billing.free_access_ai_lesson(uuid,text),
 billing.free_window_previous_academic_access(text,text,text),billing.free_window_previous_evaluate_access(uuid,text,text),
 billing.free_window_previous_technical_access(text),
 billing.free_window_previous_academic_command(text,text,text,text,jsonb),billing.free_window_previous_technical_command(text,text,text,jsonb),
 billing.free_window_previous_kids_status(),billing.free_window_tag_delivery(jsonb,text) FROM PUBLIC,anon,authenticated,service_role;

COMMIT;
