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
spec=importlib.util.spec_from_file_location('s111_actual_worker',HERE/'worker.py')
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
    check('reject_extra_call_budget',lambda:bad_request(lambda r:r.update(maximumTTSCalls=41)))
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
    check('reject_extra_review_budget',lambda:bad_runtime(lambda r:r.update(maximumReviewCallsForBatch=41)))
    check('reject_extra_asr_budget',lambda:bad_runtime(lambda r:r['asr'].update(maximumInvocationsForBatch=41)))
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
        for i in range(39):
            d=root/('fixture-'+str(i));d.mkdir();(d/'tts-attempt.json').write_text('{}','utf-8')
        with mock.patch.object(worker,'OUT',root):
            attempt,state=worker.reserve(worker.IDS[0],'tts')
            assert state['maximumCallsForBatch']==40 and state['maximumCallsForUnit']==1 and attempt.exists()
            try:worker.reserve(worker.IDS[1],'tts')
            except AssertionError:pass
            else:raise AssertionError('41st call reserved')
        duplicate=HERE/'offline-fixtures'/('d-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'))
        duplicate.mkdir(parents=True)
        with mock.patch.object(worker,'OUT',duplicate):
            worker.reserve(worker.IDS[0],'tts')
            try:worker.reserve(worker.IDS[0],'tts')
            except FileExistsError:pass
            else:raise AssertionError('Duplicate call attempt overwrote existing receipt')
    check('actual_reserve_allows40_rejects41_and_duplicate',budget)
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
    def fresh_event_fixture():
        root=HERE/'offline-fixtures'/('event-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'))
        root.mkdir(parents=True)
        path=root/'event.json'
        event={'ref':'refs/heads/work/soil-s111-narration-20261022-r3','created':True,'deleted':False,'repository':{'full_name':'cabicci/viva-ai-systems-55d35820'},'after':'a'*40}
        path.write_text(json.dumps(event),'utf-8')
        env={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_REPOSITORY':'cabicci/viva-ai-systems-55d35820','GITHUB_REF':event['ref'],'GITHUB_EVENT_NAME':'push','GITHUB_EVENT_PATH':str(path),'GITHUB_SHA':'a'*40,'REQUEST_SHA':sha(HERE/'request.json'),'WORKER_SHA':sha(HERE/'worker.py'),'FREEZE_SHA':sha(HERE/'freeze.json')}
        return path,event,env
    def event_guard(env_change=None,event_change=None,accept=False):
        path,event,env=fresh_event_fixture()
        if env_change:env.update(env_change)
        if event_change:event.update(event_change)
        path.write_text(json.dumps(event),'utf-8')
        with mock.patch.dict(os.environ,env):
            if accept:
                worker.require_actions()
                worker.validate()
                return
            try:worker.require_actions()
            except (AssertionError,KeyError):return
        raise AssertionError('Out-of-scope event accepted')
    check('exact_fresh_branch_push_run1_scope_passes_actual_worker',lambda:event_guard(accept=True))
    check('reject_later_push_created_false',lambda:event_guard(event_change={'created':False}))
    check('reject_missing_created_flag',lambda:event_guard(event_change={'created':None}))
    check('reject_string_created_true',lambda:event_guard(event_change={'created':'true'}))
    check('reject_deleted_branch_event',lambda:event_guard(event_change={'deleted':True}))
    check('reject_wrong_repository',lambda:event_guard(env_change={'GITHUB_REPOSITORY':'cabicci/other'}))
    check('reject_main_branch',lambda:event_guard(env_change={'GITHUB_REF':'refs/heads/main'}))
    check('reject_different_scoped_branch',lambda:event_guard(env_change={'GITHUB_REF':'refs/heads/work/soil-s111-narration-20261022-r2'}))
    check('reject_workflow_dispatch_event',lambda:event_guard(env_change={'GITHUB_EVENT_NAME':'workflow_dispatch'}))
    check('reject_fresh_push_rerun_attempt2',lambda:event_guard(env_change={'GITHUB_RUN_ATTEMPT':'2'}))
    check('reject_event_repository_mismatch',lambda:event_guard(event_change={'repository':{'full_name':'cabicci/other'}}))
    check('reject_event_ref_mismatch',lambda:event_guard(event_change={'ref':'refs/heads/main'}))
    check('reject_event_after_commit_mismatch',lambda:event_guard(event_change={'after':'b'*40}))
    check('reject_deployment_target_change',lambda:bad_request(lambda r:r['deploymentTarget'].update(branch='main')))
    def workflow_order():
        flow=(HERE/'s1-11-narration-r3.yml').read_text('utf-8')
        assert 'on:\n  push:\n    branches:\n      - work/soil-s111-narration-20261022-r3' in flow
        assert 'workflow_dispatch:' not in flow and 'schedule:' not in flow
        assert 'github.repository' in flow and 'github.ref' in flow and 'github.event.created == true' in flow and 'github.event.deleted == false' in flow and 'github.run_attempt == 1' in flow
        assert flow.count('python worker.py produce --unit ')==40
        assert flow.count('python worker.py blind-review --unit ')==40
        assert flow.count('python worker.py asr --unit ')==40
        assert flow.count('python worker.py uploaded --unit ')==40
        for unit in req['units']:
            uid=unit['id']
            assert flow.index('python worker.py produce --unit '+uid) < flow.index('python worker.py uploaded --unit '+uid) < flow.index('python worker.py blind-review --unit '+uid) < flow.index('python worker.py asr --unit '+uid) < flow.index('python worker.py compare --unit '+uid)
    check('workflow_exact_first_push_all40_once_and_upload_before_diagnostics',workflow_order)
    check('network_calls_remain_zero',lambda:assertion(not network_attempts))

# Exercise the actual CLI, not a validator reimplementation.
env=dict(os.environ)
for key in ['GITHUB_ACTIONS','GEMINI_API_KEY','REQUEST_SHA','WORKER_SHA','FREEZE_SHA']:
    env.pop(key,None)
cli=subprocess.run([sys.executable,str(HERE/'worker.py'),'validate'],cwd=HERE,env=env,capture_output=True,text=True,encoding='utf-8')
assert cli.returncode==0,cli.stdout+' '+cli.stderr
results.append({'name':'actual_worker_cli_validate','result':'PASS','exitCode':cli.returncode,'stdout':cli.stdout.strip()})
assert not (HERE/'output').exists(),'Production output unexpectedly created'
report={'schema':'masaarat.S1-11.actual-worker-offline-verification.v1','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_OFFLINE_ACTUAL_WORKER','requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'freezeSha256':sha(HERE/'freeze.json'),'workflowSha256':sha(HERE/'s1-11-narration-r3.yml'),'testScriptSha256':sha(HERE/'offline_tests.py'),'tests':results,'testCount':len(results),'providerCalls':0,'networkCalls':len(network_attempts),'productionOutputCreated':False,'finiteScope':{'locales':4,'partsPerLocale':10,'TTS':40,'blindArgonReviews':40,'ASR':40,'metadataGETs':2,'automaticRetries':0},'limits':['No provider metadata/TTS/audio-review/ASR production invocation ran.','Availability and actual audio quality are untested for this new batch.','Offline fixture reservations are synthetic tests, kept separately from production output.','Frozen manifest and workflow must be rederived if any frozen input changes.']}
(HERE/'offline-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'status':report['status'],'tests':len(results),'providerCalls':0,'requestSha256':report['requestSha256'],'workerSha256':report['workerSha256'],'freezeSha256':report['freezeSha256'],'workflowSha256':report['workflowSha256']},indent=2))
