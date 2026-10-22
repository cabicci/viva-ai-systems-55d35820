"""Offline tests of the actual frozen worker. No production commands or providers."""
from pathlib import Path
import copy
import datetime
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
from unittest import mock
HERE=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('s215_actual_worker',HERE/'worker.py')
worker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
req=json.loads((HERE/'request.json').read_text('utf-8'))
runtime=json.loads((HERE/'runtime.json').read_text('utf-8'))
results=[]
def check(name,fn):
    fn()
    results.append({'name':name,'result':'PASS'})
def assertion(value):
    assert value

def bad_request(change):
    data=copy.deepcopy(req)
    change(data)
    original=worker.read
    def read(path):
        return data if Path(path).name=='request.json' else original(path)
    with mock.patch.object(worker,'read',side_effect=read):
        try:worker.validate()
        except AssertionError:return
    raise AssertionError('Worker accepted invalid request')

def bad_runtime(change):
    data=copy.deepcopy(runtime)
    change(data)
    original=worker.read
    def read(path):return data if Path(path).name=='runtime.json' else original(path)
    with mock.patch.object(worker,'read',side_effect=read):
        try:worker.validate()
        except AssertionError:return
    raise AssertionError('Worker accepted invalid runtime')

network_attempts=[]
def forbidden_network(*args,**kwargs):
    network_attempts.append(True)
    raise AssertionError('Network forbidden in offline tests')

with mock.patch('urllib.request.urlopen',side_effect=forbidden_network):
    check('actual_worker_validate',lambda: assertion(worker.validate()[0]['model']=='gemini-3.8-flash-tts'))
    check('reject_old_tts_model',lambda:bad_request(lambda r:r.update(model='gemini-2.5-flash-preview-tts')))
    check('reject_extra_call_budget',lambda:bad_request(lambda r:r.update(maximumTTSCalls=65)))
    check('reject_automatic_retry',lambda:bad_request(lambda r:r.update(automaticRetries=1)))
    check('reject_missing_required_part',lambda:bad_request(lambda r:r['units'].pop()))
    check('reject_extra_part',lambda:bad_request(lambda r:r['units'].append(copy.deepcopy(r['units'][0]))))
    check('reject_wrong_voice',lambda:bad_request(lambda r:r['units'][0].update(voice='Kore')))
    check('reject_wrong_speaker',lambda:bad_request(lambda r:r['units'][0].update(speakerId='B')))
    check('reject_unit_id_outside_scope',lambda:bad_request(lambda r:r['units'][0].update(id='S1-01-ar-024')))
    check('reject_source_file_hash_change',lambda:bad_request(lambda r:r['units'][0].update(sourceFileSHA256='0'*64)))
    check('reject_spoken_hash_change',lambda:bad_request(lambda r:r['units'][0].update(spokenTextSha256='0'*64)))
    check('reject_unrecorded_spoken_omission',lambda:bad_request(lambda r:r['units'][0].update(spokenText=r['units'][0]['spokenText'][:-12],spokenTextSha256=hashlib.sha256(r['units'][0]['spokenText'][:-12].encode()).hexdigest())))
    check('reject_display_or_caption_change',lambda:bad_request(lambda r:r['units'][0].update(captionText='shortened')))
    check('reject_invented_duration',lambda:bad_request(lambda r:r['units'][0].update(estimatedDuration=30)))
    check('reject_quiz_pre_attempt_release',lambda:bad_request(lambda r:r['units'][0]['sourceBindings'][0].update(pointer='/quiz/0/question')))
    check('reject_rubric_pre_attempt_release',lambda:bad_request(lambda r:r['units'][0]['sourceBindings'][0].update(pointer='/writtenTasks/0/reviewPoints/0')))
    check('reject_feedback_pre_attempt_release',lambda:bad_request(lambda r:r['units'][0]['sourceBindings'][0].update(pointer='/guidedPractice/feedback')))
    check('reject_false_quiz_release_flag',lambda:bad_request(lambda r:r.update(quizSolutionsIncludedBeforeAttempt=True)))
    check('reject_changed_binding_text',lambda:bad_request(lambda r:r['units'][0]['sourceBindings'][0].update(text='invented observation')))
    check('reject_request_fingerprint_change',lambda:bad_request(lambda r:r['units'][0].update(requestFingerprintSha256='0'*64)))
    check('reject_missing_explanatory_binding',lambda:bad_request(lambda r:r['units'][1]['sourceBindings'].pop()))
    check('reject_changed_group_order',lambda:bad_request(lambda r:r['units'][1].update(semanticGroup='R05')))
    check('reject_source_original_lineage_change',lambda:bad_request(lambda r:r['units'][0].update(sourceOriginalFileSHA256='0'*64)))
    check('reject_delivery_hash_change',lambda:bad_request(lambda r:r['units'][0].update(deliverySha256='0'*64)))
    check('reject_wrong_argon_model',lambda:bad_runtime(lambda r:r.update(reviewModel='other-model')))
    check('reject_asr_locale_fallback',lambda:bad_runtime(lambda r:r['asr']['languageByLocale'].update(de='ar')))
    check('reject_extra_review_budget',lambda:bad_runtime(lambda r:r.update(maximumReviewCallsForBatch=65)))
    check('reject_extra_asr_budget',lambda:bad_runtime(lambda r:r['asr'].update(maximumInvocationsForBatch=65)))
    def local_guard():
        with mock.patch.dict(os.environ,{'GITHUB_ACTIONS':'false','GITHUB_RUN_ATTEMPT':'1'}):
            try:worker.produce(worker.IDS[0])
            except AssertionError:return
        raise AssertionError('Local production was not blocked')
    check('actual_produce_rejects_local_execution_before_provider',local_guard)
    def rerun_guard():
        with mock.patch.dict(os.environ,{'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'2'}):
            try:worker.require_actions()
            except AssertionError:return
        raise AssertionError('Run attempt2 accepted')
    check('reject_actions_rerun_attempt2',rerun_guard)
    def unknown_unit():
        try:worker.folder('S1-01-ar-024')
        except AssertionError:return
        raise AssertionError('Other lesson unit accepted')
    check('reject_other_lesson_output_unit',unknown_unit)
    def budget():
        root=HERE/'offline-fixtures'/('b-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'))
        root.mkdir(parents=True)
        for i in range(63):
            d=root/('fixture-'+str(i));d.mkdir();(d/'tts-attempt.json').write_text('{}','utf-8')
        with mock.patch.object(worker,'OUT',root):
            attempt,state=worker.reserve(worker.IDS[0],'tts')
            assert state['maximumCallsForBatch']==64 and state['maximumCallsForUnit']==1 and attempt.exists()
            try:worker.reserve(worker.IDS[1],'tts')
            except AssertionError:pass
            else:raise AssertionError('65th call reserved')
        duplicate=HERE/'offline-fixtures'/('d-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'))
        duplicate.mkdir(parents=True)
        with mock.patch.object(worker,'OUT',duplicate):
            worker.reserve(worker.IDS[0],'tts')
            try:worker.reserve(worker.IDS[0],'tts')
            except FileExistsError:pass
            else:raise AssertionError('Duplicate call attempt overwrote existing receipt')
    check('actual_reserve_allows64_rejects65_and_duplicate',budget)
    check('frozen_vendor_engine_imports_without_provider',lambda:assertion(callable(worker.load_engine().request_json)))
    def projection_guard(extra_key):
        original_read = worker.read
        def intercepted(path):
            value = original_read(path)
            if Path(path).name == 'source-en.json':
                value = copy.deepcopy(value)
                value[extra_key] = [{'notForLearner':True}]
            return value
        with mock.patch.object(worker,'read',side_effect=intercepted):
            try:worker.validate()
            except AssertionError:return
        raise AssertionError('Unsafe projection accepted')
    check('reject_quiz_in_public_projection',lambda:projection_guard('quiz'))
    check('reject_private_written_review_in_public_projection',lambda:projection_guard('writtenTasks'))
    check('reject_unknown_public_projection_field',lambda:projection_guard('instructorAnswerBank'))
    def workflow_order():
        flow=(HERE/'s2-15-narration-r1.yml').read_text('utf-8')
        assert 'on:\n  push:' in flow and 'schedule:' not in flow and 'workflow_dispatch:' not in flow
        assert 'work/soil-s215-narration-20261022-r1' in flow and 'github.event.created == true' in flow
        assert 'github.event.before' in flow and 'github.event.after == github.sha' in flow
        assert 'github.repository' in flow and 'github.ref' in flow and 'github.event.repository.id == 1272666418' in flow
        assert flow.count('python worker.py produce --unit ')==64
        assert flow.count('python worker.py blind-review --unit ')==64
        assert flow.count('python worker.py asr --unit ')==64
        assert flow.count('python worker.py uploaded --unit ')==64
        assert 'github.run_attempt == 1' in flow and "github.event_name == 'push'" in flow
        assert "github.event.deleted == false" in flow and "github.event.forced == false" in flow
        for unit in req['units']:
            uid=unit['id']
            first=flow.index('python worker.py produce --unit '+uid)
            upload=flow.index('python worker.py uploaded --unit '+uid)
            blind=flow.index('python worker.py blind-review --unit '+uid)
            asr=flow.index('python worker.py asr --unit '+uid)
            compare=flow.index('python worker.py compare --unit '+uid)
            assert first < upload < blind < asr < compare
    check('workflow_all64_once_fresh_push_run1_and_upload_before_diagnostics',workflow_order)
    def good_trigger():
        env={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','GITHUB_REPOSITORY':worker.EXPECTED_REPOSITORY,
             'GITHUB_REPOSITORY_ID':str(worker.EXPECTED_REPOSITORY_ID),'GITHUB_REF':worker.EXPECTED_REF,'GITHUB_REF_TYPE':'branch',
             'GITHUB_SHA':'a'*40,'GITHUB_EVENT_PATH':str(HERE/'offline-fixtures/push-event.json'),
             'REQUEST_SHA':sha(HERE/'request.json'),'WORKER_SHA':sha(HERE/'worker.py'),'FREEZE_SHA':sha(HERE/'freeze.json')}
        event={'ref':worker.EXPECTED_REF,'created':True,'deleted':False,'forced':False,'before':'0'*40,'after':'a'*40,
               'repository':{'full_name':worker.EXPECTED_REPOSITORY,'id':worker.EXPECTED_REPOSITORY_ID,'private':False,'fork':False}}
        return env,event
    def trigger_negative(env_change=None,event_change=None):
        env,event=good_trigger()
        if env_change:env_change(env)
        if event_change:event_change(event)
        try:worker.validate_trigger(event,env)
        except (AssertionError,KeyError):return
        raise AssertionError('Invalid event accepted')
    check('accept_exact_original_public_first_push_only',lambda:assertion(worker.validate_trigger(good_trigger()[1],good_trigger()[0])['created'] is True))
    check('reject_workflow_dispatch_event',lambda:trigger_negative(lambda e:e.update(GITHUB_EVENT_NAME='workflow_dispatch')))
    check('reject_repository_dispatch_event',lambda:trigger_negative(lambda e:e.update(GITHUB_EVENT_NAME='repository_dispatch')))
    check('reject_schedule_event',lambda:trigger_negative(lambda e:e.update(GITHUB_EVENT_NAME='schedule')))
    check('reject_later_push_created_false',lambda:trigger_negative(event_change=lambda e:e.update(created=False,before='b'*40)))
    check('reject_created_string_true',lambda:trigger_negative(event_change=lambda e:e.update(created='true')))
    check('reject_nonzero_before_even_when_created_true',lambda:trigger_negative(event_change=lambda e:e.update(before='b'*40)))
    check('reject_branch_deletion',lambda:trigger_negative(event_change=lambda e:e.update(deleted=True)))
    check('reject_force_push',lambda:trigger_negative(event_change=lambda e:e.update(forced=True)))
    check('reject_runner_rerun2',lambda:trigger_negative(lambda e:e.update(GITHUB_RUN_ATTEMPT='2')))
    check('reject_wrong_runner_repository',lambda:trigger_negative(lambda e:e.update(GITHUB_REPOSITORY='someone/fork')))
    check('reject_wrong_runner_repository_id',lambda:trigger_negative(lambda e:e.update(GITHUB_REPOSITORY_ID='1')))
    check('reject_main_runner_ref',lambda:trigger_negative(lambda e:e.update(GITHUB_REF='refs/heads/main')))
    check('reject_main_event_ref',lambda:trigger_negative(event_change=lambda e:e.update(ref='refs/heads/main')))
    check('reject_wrong_r1_runner_ref',lambda:trigger_negative(lambda e:e.update(GITHUB_REF='refs/heads/work/soil-s215-narration-20261022-r2')))
    check('reject_tag_runner_ref_type',lambda:trigger_negative(lambda e:e.update(GITHUB_REF_TYPE='tag')))
    check('reject_zero_runner_commit',lambda:trigger_negative(lambda e:e.update(GITHUB_SHA='0'*40)))
    check('reject_event_commit_mismatch',lambda:trigger_negative(event_change=lambda e:e.update(after='b'*40)))
    check('reject_payload_repository_name',lambda:trigger_negative(event_change=lambda e:e['repository'].update(full_name='someone/fork')))
    check('reject_payload_repository_id',lambda:trigger_negative(event_change=lambda e:e['repository'].update(id=1)))
    check('reject_private_repo_payload',lambda:trigger_negative(event_change=lambda e:e['repository'].update(private=True)))
    check('reject_fork_repo_payload',lambda:trigger_negative(event_change=lambda e:e['repository'].update(fork=True)))
    def actual_guard_path():
        env,event=good_trigger();original_read=worker.read
        def routed(path):return event if str(path)==env['GITHUB_EVENT_PATH'] else original_read(path)
        with mock.patch.dict(os.environ,env),mock.patch.object(worker,'read',side_effect=routed):
            assert worker.require_actions()['ref']==worker.EXPECTED_REF
            assert worker.validate()[0]['model']=='gemini-3.8-flash-tts'
    check('actual_worker_requires_same_first_push_guard_in_production_and_validate',actual_guard_path)
    check('reject_removed_post_attempt_gate',lambda:bad_request(lambda r:r['units'][11]['releaseGate'].update(kind='TEACHING_OR_CASE_PROMPT_ONLY')))
    check('reject_opening_goal_with_result_reintroduced',lambda:bad_request(lambda r:r['units'][0].update(displayText=r['units'][0]['originalText'])))
    check('reject_invented_laterB_organic_matter',lambda:bad_request(lambda r:r['units'][13].update(originalText=r['units'][13]['originalText']+' OM 1%')))
    def unicode_token_boundaries():
        german='\n'.join(u['spokenText'] for u in req['units'] if u['locale']=='de')
        assert 'Enährstoff' not in german and 'Nährstoff' in german and 'Bodenwiderstand' in german
        english=next(u['spokenText'] for u in req['units'] if u['id']=='S2-15-en-r1-014')
        assert 'phosphorus High' in english and 'P High' not in english
        arabic=next(u['spokenText'] for u in req['units'] if u['id']=='S2-15-ar-EG-r1-007')
        assert 'خمس دقايق' in arabic and 'خمسة دقائق' not in arabic
    check('unicode_scientific_token_boundaries_preserve_native_words_and_targeted_Egyptian_phrases',unicode_token_boundaries)
    def audio_info_checks():
        import wave
        root=HERE/'offline-fixtures'/('w-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'));root.mkdir(parents=True)
        pcm=b'\x00\x00'*24000
        with wave.open(str(root/'valid.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
        info=worker.audio_info(root/'valid.wav');assert info['durationSeconds']==1 and info['pcmSha256']==hashlib.sha256(pcm).hexdigest()
        with wave.open(str(root/'wrong.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(22050);w.writeframes(pcm)
        try:worker.audio_info(root/'wrong.wav')
        except AssertionError:return
        raise AssertionError('Wrong audio format accepted')
    check('actual_audio_header_pcm_duration_accepts_exact24k_and_rejects_wrong_rate',audio_info_checks)
    def privacy_failure():
        root=HERE/'offline-fixtures'/('f-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'));root.mkdir(parents=True)
        state={};worker.safe_failure(root/'failure.json',state,RuntimeError('PRIVATE_TEST_SECRET_MUST_NOT_LOG'))
        assert 'PRIVATE_TEST_SECRET' not in (root/'failure.json').read_text('utf8')
        assert state['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY'
    check('actual_failure_hygiene_never_serializes_error_string_or_secret',privacy_failure)
    def playback_disclosure():
        spec=importlib.util.spec_from_file_location('s215_playback_gate',HERE/'playback_gate.py');g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
        result_words={'en':('six point two four','thirty-one point two'),'ar-EG':('ستة فاصلة اتنين أربعة','واحد وتلاتين فاصلة اتنين'),'it':('sei virgola due quattro','trentuno virgola due'),'de':('sechs Komma zwei vier','einunddreißig Komma zwei')}
        for loc in ['en','ar-EG','it','de']:
            before=g.select_for_playback(req,loc,None)
            assert len(before)==15 and before[0]['id'].endswith('001') and not any(u['id'].endswith('012') for u in before)
            text='\n'.join(u['displayText']+'\n'+u['captionText']+'\n'+u['spokenText'] for u in before)
            assert '6.24' not in text and '31.2' not in text and not any(x in text for x in result_words[loc])
            assert len(g.select_for_playback(req,loc,{'caseId':'S2-15-E04','locale':'wrong','response':'my calculation'}))==15
            assert len(g.select_for_playback(req,loc,{'caseId':'S2-15-E04','locale':loc,'response':'   '}))==15
            after=g.select_for_playback(req,loc,{'caseId':'S2-15-E04','locale':loc,'response':'my calculation'});assert len(after)==16
            comparison=next(u for u in after if u['id'].endswith('012'))
            assert '6.24' in comparison['displayText'] and '31.2' in comparison['displayText']
            assert all(x in comparison['spokenText'] for x in result_words[loc])
            assert 'originalText' not in before[0] and 'sourceBindings' not in before[0]
        assert g.select_for_playback(req,'unknown',None)==[]
    check('actual_playback_gate_fourlocales_pre_audio_display_noanswer_post_exact_result_unknown_date_nopooled',playback_disclosure)
    def staged_workflow():
        flow=(HERE/'s2-15-narration-r1.yml').read_text('utf8')
        assert max(flow.index('python worker.py uploaded --unit '+u['id']) for u in req['units'])<min(flow.index('python worker.py blind-review --unit '+u['id']) for u in req['units'])
        assert flow.count('continue-on-error: true')==192
        assert 'python batch_status.py' in flow and 'python -m pip install' in flow
        assert flow.index('python -m pip install')>max(flow.index('python worker.py uploaded --unit '+u['id']) for u in req['units'])
    check('all64_finite_audio_uploads_precede_any_diagnostics_and_dependencies_can_fail_independently',staged_workflow)
    def batch_inventory():
        import wave
        spec=importlib.util.spec_from_file_location('actual_batch_inventory',HERE/'batch_status.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
        root=HERE/'offline-fixtures'/('i-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'));root.mkdir(parents=True)
        folder=root/req['units'][0]['id'];folder.mkdir()
        with wave.open(str(folder/'voice.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b'\0\0'*24000)
        audio=sha(folder/'voice.wav')
        (folder/'audio-upload-receipt.json').write_text(json.dumps({'audioSha256':audio,'beforeReviewAndASR':True,'artifactId':'123','artifactDigest':'fixture'}),'utf8')
        report=b.inventory(req,root);assert report['validCandidateWavs']==report['uploadedWavs']==1 and report['completedDiagnostics']==0
        for name in ['blind-review.json','asr-word-timestamps.json','reference-comparison.json']:(folder/name).write_text(json.dumps({'audioSha256':audio}),'utf8')
        for name,state in [('blind-review-attempt.json','MODEL_DIAGNOSTIC_ONLY'),('asr-attempt.json','ASR_DIAGNOSTIC_ONLY')]:(folder/name).write_text(json.dumps({'state':state}),'utf8')
        report=b.inventory(req,root);assert report['completedDiagnostics']==1 and report['humanListeningApproved'] is False and report['requiredUnits']==64
    check('actual_batch_inventory_reports_partial_audio_and_missing_diagnostics_without_acceptance',batch_inventory)
    def frozen_path_escape():
        original=worker.read
        def read(path):
            value=original(path)
            if Path(path).name=='freeze.json':value=copy.deepcopy(value);value['sha256']['../outside']='0'*64
            return value
        with mock.patch.object(worker,'read',side_effect=read):
            try:worker.validate()
            except AssertionError:return
        raise AssertionError('Frozen path escape accepted')
    check('actual_worker_rejects_frozen_path_escape',frozen_path_escape)

    check('network_calls_remain_zero',lambda:assertion(not network_attempts))

# Exercise the actual CLI, not a validator reimplementation.
env=dict(os.environ)
for key in ['GITHUB_ACTIONS','GEMINI_API_KEY','REQUEST_SHA','WORKER_SHA','FREEZE_SHA','GITHUB_EVENT_NAME','GITHUB_EVENT_PATH','GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_REF','GITHUB_REF_TYPE','GITHUB_SHA']:
    env.pop(key,None)
cli=subprocess.run([sys.executable,str(HERE/'worker.py'),'validate'],cwd=HERE,env=env,capture_output=True,text=True,encoding='utf-8')
assert cli.returncode==0,cli.stdout+' '+cli.stderr
results.append({'name':'actual_worker_cli_validate','result':'PASS','exitCode':cli.returncode,'stdout':cli.stdout.strip()})
assert not (HERE/'output').exists(),'Production output unexpectedly created'
report={'schema':'masaarat.S2-15.actual-worker-offline-verification.v1','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_OFFLINE_ACTUAL_WORKER','requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'freezeSha256':sha(HERE/'freeze.json'),'workflowSha256':sha(HERE/'s2-15-narration-r1.yml'),'testScriptSha256':sha(HERE/'offline_tests.py'),'tests':results,'testCount':len(results),'providerCalls':0,'networkCalls':len(network_attempts),'productionOutputCreated':False,'finiteScope':{'locales':4,'partsPerLocale':16,'TTS':64,'blindArgonReviews':64,'ASR':64,'metadataGETs':2,'automaticRetries':0},'limits':['No provider metadata/TTS/audio-review/ASR production invocation ran.','Availability and actual audio quality are untested for this new batch.','Offline fixture reservations are synthetic tests, kept separately from production output.','Frozen manifest and workflow must be rederived if any frozen input changes.']}
(HERE/'offline-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'status':report['status'],'tests':len(results),'providerCalls':0,'requestSha256':report['requestSha256'],'workerSha256':report['workerSha256'],'freezeSha256':report['freezeSha256'],'workflowSha256':report['workflowSha256']},indent=2))
