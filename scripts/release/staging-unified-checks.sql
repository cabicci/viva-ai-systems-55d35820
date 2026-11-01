-- Append ONLY inside the reviewed migration rehearsal transaction; always ROLLBACK.
-- Synthetic SQL roles/metadata/vector values. This is NOT a JWT, embedding/model,
-- complete corpus admission, signed learner session, or real-user access certificate.
SELECT set_config('request.jwt.claim.role','service_role',true),
 set_config('request.jwt.claims','{"role":"service_role"}',true);

DO $staging_checks$
DECLARE vector_value extensions.vector(1536); source_payload jsonb:='{"title":"Synthetic staging fixture"}';
 rows jsonb; revisions jsonb; material text; job text; request_id uuid:=gen_random_uuid();
 claim jsonb; next_claim jsonb; second_request uuid:=gen_random_uuid(); next_job text; receipt jsonb:='{"synthetic":true,"providerCalls":0}';
BEGIN
 IF EXISTS(SELECT 1 FROM public.technical_lesson_content WHERE lesson_id='M99-L99')
 THEN RAISE EXCEPTION 'STAGING_SYNTHETIC_SCOPE_COLLISION'; END IF;
 SELECT ('['||string_agg('0.25',',')||']')::extensions.vector(1536) INTO vector_value FROM generate_series(1,1536);
 INSERT INTO public.card_assistant_policy(area,card_id) VALUES('technical','staging-proof');
 INSERT INTO public.card_assistant_steps(area,card_id,step_id,station_id,source_key,preview,technical_lesson)
 VALUES('technical','staging-proof','M99-L99','M99','M99-L99',false,'M99-L99');
 INSERT INTO public.technical_lesson_content(lesson_id,locale,kind,payload,video_guid,source_sha256)
 VALUES('M99-L99','en','lesson',source_payload,gen_random_uuid(),repeat('a',64));
 rows:=jsonb_build_array(jsonb_build_object('area','technical','cardId','staging-proof','stepId','M99-L99','locale','en',
   'chunkId','synthetic-section','title','Synthetic fixture','sourceSha256',repeat('a',64),'payloadSha256',repeat('b',64),
   'contentSha256',encode(extensions.digest(convert_to('Synthetic fixture passage','UTF8'),'sha256'),'hex'),
   'content','Synthetic fixture passage','embedding',vector_value::text,'embeddingModel','text-embedding-3-small','embeddingDimensions',1536));
 IF public.card_assistant_sync_source('technical','staging-proof','M99-L99','en',repeat('a',64),repeat('b',64),source_payload,rows)<>1
 THEN RAISE EXCEPTION 'STAGING_VECTOR_SYNC_FAILED'; END IF;
 UPDATE public.card_assistant_policy SET runtime_enabled=true WHERE area='technical' AND card_id='staging-proof';
 IF jsonb_array_length(public.card_assistant_match('technical','staging-proof','en',vector_value,6))<>1
 THEN RAISE EXCEPTION 'STAGING_REAL_VECTOR_MATCH_FAILED'; END IF;
 IF jsonb_array_length(public.card_assistant_match('technical','staging-proof','ar-EG',vector_value,6))<>0
 THEN RAISE EXCEPTION 'STAGING_LOCALE_LEAK'; END IF;
 revisions:=public.assistant_auto_source_revisions('[{"area":"technical","id":"staging-proof","steps":[{"source":{"lessonId":"M99-L99"}}]}]');
 material:=jsonb_build_object('schemaVersion','assistant-auto-v1','area','technical','cardId','staging-proof',
  'sourceRevision',revisions->>'technical:staging-proof','scopeCount',1,'scopes','[]'::jsonb)::text;
 job:=encode(extensions.digest(convert_to(material,'UTF8'),'sha256'),'hex');
 PERFORM public.assistant_auto_register(jsonb_build_array(jsonb_build_object('key',job,'material',material)),'[]');
 PERFORM public.assistant_auto_link_sources(jsonb_build_array(job));
 UPDATE public.assistant_auto_policy SET enabled=true;
 claim:=public.assistant_auto_claim(jsonb_build_array(job),request_id);
 IF claim->>'claimed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'STAGING_QUEUE_CLAIM_FAILED'; END IF;
 IF public.assistant_auto_claim(jsonb_build_array(job),gen_random_uuid())->>'busy' IS DISTINCT FROM 'true'
 THEN RAISE EXCEPTION 'STAGING_QUEUE_DOUBLE_CLAIM'; END IF;
 UPDATE public.technical_lesson_content SET source_sha256=repeat('c',64) WHERE lesson_id='M99-L99' AND locale='en';
 IF public.assistant_auto_check(job,request_id,(claim->>'leaseToken')::uuid)
 THEN RAISE EXCEPTION 'STAGING_STALE_SOURCE_LEASE_ACCEPTED'; END IF;
 IF EXISTS(SELECT 1 FROM public.card_assistant_policy WHERE area='technical' AND card_id='staging-proof' AND runtime_enabled)
 THEN RAISE EXCEPTION 'STAGING_SOURCE_CHANGE_DID_NOT_CLOSE_RUNTIME'; END IF;
 UPDATE public.card_assistant_policy SET runtime_enabled=true WHERE area='technical' AND card_id='staging-proof';
 IF jsonb_array_length(public.card_assistant_match('technical','staging-proof','en',vector_value,6))<>0
 THEN RAISE EXCEPTION 'STAGING_STALE_VECTOR_RETURNED'; END IF;
 BEGIN
  PERFORM public.assistant_auto_finish(job,request_id,(claim->>'leaseToken')::uuid,true,receipt);
  RAISE EXCEPTION 'STAGING_STALE_FINISH_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM<>'AUTOMATION_RECEIPT_INVALID' THEN RAISE; END IF;
 END;
 PERFORM public.assistant_auto_hold(job,request_id,(claim->>'leaseToken')::uuid,'AUTOMATION_SOURCE_CHANGED');
 revisions:=public.assistant_auto_source_revisions('[{"area":"technical","id":"staging-proof","steps":[{"source":{"lessonId":"M99-L99"}}]}]');
 material:=jsonb_build_object('schemaVersion','assistant-auto-v1','area','technical','cardId','staging-proof',
  'sourceRevision',revisions->>'technical:staging-proof','scopeCount',1,'scopes','[]'::jsonb)::text;
 next_job:=encode(extensions.digest(convert_to(material,'UTF8'),'sha256'),'hex');
 IF next_job=job THEN RAISE EXCEPTION 'STAGING_SOURCE_REVISION_NOT_DISTINCT'; END IF;
 PERFORM public.assistant_auto_register(jsonb_build_array(jsonb_build_object('key',next_job,'material',material)),'[]');
 PERFORM public.assistant_auto_link_sources(jsonb_build_array(next_job));
 next_claim:=public.assistant_auto_claim(jsonb_build_array(next_job),second_request);
 IF next_claim->>'claimed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'STAGING_FRESH_SOURCE_CLAIM_FAILED'; END IF;
 IF NOT public.assistant_auto_finish(next_job,second_request,(next_claim->>'leaseToken')::uuid,true,receipt)
 THEN RAISE EXCEPTION 'STAGING_FINISH_FAILED'; END IF;
 -- A subsequent read uses a fresh command snapshot, like the actual HTTP RPC
 -- readback. A STABLE receipt read in the mutating expression sees its old snapshot.
 IF NOT public.assistant_auto_receipt(next_job,second_request,0,receipt)
 OR public.assistant_auto_receipt(next_job,second_request,0,'{"wrong":true}')
 THEN RAISE EXCEPTION 'STAGING_FINISH_ACK_RECONCILIATION_FAILED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.assistant_auto_intake_status WHERE source_key='M99-L99' AND state='succeeded')
 THEN RAISE EXCEPTION 'STAGING_INTAKE_STATUS_NOT_TRUTHFUL'; END IF;
 DELETE FROM public.technical_lesson_content WHERE lesson_id='M99-L99' AND locale='en';
 IF jsonb_array_length(public.card_assistant_match('technical','staging-proof','en',vector_value,6))<>0
 OR NOT EXISTS(SELECT 1 FROM public.assistant_auto_intake_status WHERE source_key='M99-L99' AND withdrawn AND state='pending')
 THEN RAISE EXCEPTION 'STAGING_WITHDRAWAL_FAILED'; END IF;
 IF EXISTS(SELECT 1 FROM public.assistant_auto_jobs WHERE provider_calls<>0)
 THEN RAISE EXCEPTION 'STAGING_PROVIDER_CALL_UNEXPECTED'; END IF;
END $staging_checks$;

SET LOCAL ROLE authenticated;
DO $denied$ BEGIN
 BEGIN
  PERFORM public.assistant_auto_source_revisions('[]');
  RAISE EXCEPTION 'STAGING_LEARNER_QUEUE_EXECUTE_ACCEPTED';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $denied$;
RESET ROLE;
