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
spec=importlib.util.spec_from_file_location('s317_actual_worker',HERE/'worker.py')
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
    check('reject_extra_call_budget',lambda:bad_request(lambda r:r.update(maximumTTSCalls=69)))
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
    check('reject_extra_review_budget',lambda:bad_runtime(lambda r:r.update(maximumReviewCallsForBatch=69)))
    check('reject_extra_asr_budget',lambda:bad_runtime(lambda r:r['asr'].update(maximumInvocationsForBatch=69)))
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
        for i in range(67):
            d=root/('fixture-'+str(i));d.mkdir();(d/'tts-attempt.json').write_text('{}','utf-8')
        with mock.patch.object(worker,'OUT',root):
            attempt,state=worker.reserve(worker.IDS[0],'tts')
            assert state['maximumCallsForBatch']==68 and state['maximumCallsForUnit']==1 and attempt.exists()
            try:worker.reserve(worker.IDS[1],'tts')
            except AssertionError:pass
            else:raise AssertionError('69th call reserved')
        duplicate=HERE/'offline-fixtures'/('d-'+datetime.datetime.now(datetime.timezone.utc).strftime('%M%S%f'))
        duplicate.mkdir(parents=True)
        with mock.patch.object(worker,'OUT',duplicate):
            worker.reserve(worker.IDS[0],'tts')
            try:worker.reserve(worker.IDS[0],'tts')
            except FileExistsError:pass
            else:raise AssertionError('Duplicate call attempt overwrote existing receipt')
    check('actual_reserve_allows68_rejects69_and_duplicate',budget)
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
        flow=(HERE/'s3-17-narration-r2.yml').read_text('utf-8')
        assert 'on:\n  push:' in flow and 'schedule:' not in flow and 'workflow_dispatch:' not in flow
        assert 'work/soil-s317-narration-20261022-r2' in flow and 'github.event.created == true' in flow
        assert 'github.event.before' in flow and 'github.event.after == github.sha' in flow
        assert 'github.repository' in flow and 'github.ref' in flow and 'github.event.repository.id == 1272666418' in flow
        assert flow.count('python worker.py produce --unit ')==68
        assert flow.count('python worker.py blind-review --unit ')==68
        assert flow.count('python worker.py asr --unit ')==68
        assert flow.count('python worker.py uploaded --unit ')==68
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
    check('workflow_all68_once_fresh_push_run1_and_upload_before_diagnostics',workflow_order)
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
    check('reject_wrong_r0_runner_ref',lambda:trigger_negative(lambda e:e.update(GITHUB_REF='refs/heads/work/soil-s317-narration-20261022-r0')))
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
    def bad_scientific(change):
        data=worker.read(HERE/'scientific-contract.json');change(data);original_read=worker.read
        def routed(path):return data if Path(path).name=='scientific-contract.json' else original_read(path)
        with mock.patch.object(worker,'read',side_effect=routed):
            try:worker.validate()
            except AssertionError:return
        raise AssertionError('Invalid scientific/assessment state accepted')
    check('reject_nonblank_initial_own_record_claim',lambda:bad_scientific(lambda d:d.update(ownPlotCDataStartsBlank=False)))
    check('reject_changed_supplied68_case_value',lambda:bad_scientific(lambda d:d['suppliedModels'][0].update(pH=6.9)))
    check('reject_wrong_half_inch_ribbon_conversion',lambda:bad_scientific(lambda d:d['suppliedModels'][1].update(exactRibbonConversionMillimetres=13)))
    check('reject_crop_pair_conflation_between_cases',lambda:bad_scientific(lambda d:d['suppliedModels'][1].update(cropCandidates=['tomatoes','corn'])))
    check('reject_49_final_task_omission',lambda:bad_scientific(lambda d:d['finalTaskCounts'].update(total=48)))
    check('reject_ph_only_lime_dose_claim',lambda:bad_scientific(lambda d:d.update(limeDoseEstablished=True)))
    check('reject_universal65_target_claim',lambda:bad_scientific(lambda d:d.update(universalTargetEstablished=True)))
    check('reject_private_assessment_answer_release_flag',lambda:bad_scientific(lambda d:d.update(assessmentAnswersIncluded=True)))
    check('reject_invented_fourlocale49_review_claim',lambda:bad_scientific(lambda d:d.update(fourLocaleFinal49AssessmentReviewComplete=True)))
    check('reject_fabricated_learner_observation',lambda:bad_scientific(lambda d:d['initialAssessment'].update(learnerObserved=True)))
    check('reject_fabricated_trainer_signature',lambda:bad_scientific(lambda d:d['initialAssessment'].update(trainerSignature='default')))
    check('reject_fabricated_physical_pass',lambda:bad_scientific(lambda d:d['initialAssessment'].update(physicalPass=True)))
    check('reject_fabricated_report_approval',lambda:bad_scientific(lambda d:d['initialAssessment'].update(reportApproved=True)))
    check('reject_fabricated_course_completion',lambda:bad_scientific(lambda d:d['initialAssessment'].update(courseCompleted=True)))
    def nested_projection(change):
        original_read=worker.read
        def routed(path):
            data=original_read(path)
            if Path(path).name=='source-en.json':change(data)
            return data
        with mock.patch.object(worker,'read',side_effect=routed):
            try:worker.validate()
            except AssertionError:return
        raise AssertionError('Nested private answer surface accepted')
    check('reject_evidence_type_key_in_nested_public_ui',lambda:nested_projection(lambda d:d['finalCourseReport']['ui'].update(evidenceChoices=['private key'])))
    check('reject_private_passchecks_in_public_report',lambda:nested_projection(lambda d:d['finalCourseReport'].update(passChecks=['private rubric'])))
    def actual_produce_later_push_guard():
        env,event=good_trigger();event.update(created=False,before='b'*40);original_read=worker.read
        def routed(path):return event if str(path)==env['GITHUB_EVENT_PATH'] else original_read(path)
        with mock.patch.dict(os.environ,env),mock.patch.object(worker,'read',side_effect=routed):
            try:worker.produce(worker.IDS[0])
            except AssertionError:return
        raise AssertionError('Actual production accepted later push')
    check('actual_produce_rejects_later_push_before_provider_or_attempt',actual_produce_later_push_guard)
    check('reject_previous_r1_branch_for_r2',lambda:trigger_negative(lambda e:e.update(GITHUB_REF='refs/heads/work/soil-s317-narration-20261022-r1')))
    check('r2_has_exactly_five_spoken_delta_parts',lambda:assertion(len(worker.read(HERE/'spoken-deltas.json')['deltas'])==5))
    check('r2_preserves63_entire_unit_hashes',lambda:assertion(sum(not u['changed']and u['r1UnitCanonicalSHA256']==u['r2UnitCanonicalSHA256']for u in worker.read(HERE/'r2-derivation.json')['units'])==63))
    check('r2_retains_written_display_caption_all68',lambda:assertion(all(u['originalText']==u['displayText']==u['captionText']for u in req['units'])))
    check('r2_arabic_intervals_clear_and_unchanged_quantity',lambda:assertion(all('كل سنة أو سنتين'in u['spokenText']and 'كل سنة لسنتين'not in u['spokenText']for u in req['units']if u['id']in['S3-17-ar-EG-r1-004','S3-17-ar-EG-r1-008'])))
    check('r2_arabic_final49_noun_phrase_natural',lambda:assertion('كل بند من التسعة وأربعين بند في التقييم النهائي'in next(u for u in req['units']if u['id']=='S3-17-ar-EG-r1-001')['spokenText']))
    check('r2_english_attributive_unit_singular',lambda:assertion(all('five hundred grams'not in u['spokenText']and 'five kilograms'not in u['spokenText']and 'five hundred gram'in u['spokenText']and 'five kilogram'in u['spokenText']for u in req['units']if u['id']in['S3-17-en-r1-006','S3-17-en-r1-014'])))
    check('network_calls_remain_zero',lambda:assertion(not network_attempts))

# Exercise the actual CLI, not a validator reimplementation.
env=dict(os.environ)
for key in ['GITHUB_ACTIONS','GEMINI_API_KEY','REQUEST_SHA','WORKER_SHA','FREEZE_SHA','GITHUB_EVENT_NAME','GITHUB_EVENT_PATH','GITHUB_REPOSITORY','GITHUB_REPOSITORY_ID','GITHUB_REF','GITHUB_REF_TYPE','GITHUB_SHA']:
    env.pop(key,None)
cli=subprocess.run([sys.executable,str(HERE/'worker.py'),'validate'],cwd=HERE,env=env,capture_output=True,text=True,encoding='utf-8')
assert cli.returncode==0,cli.stdout+' '+cli.stderr
results.append({'name':'actual_worker_cli_validate','result':'PASS','exitCode':cli.returncode,'stdout':cli.stdout.strip()})
assert not (HERE/'output').exists(),'Production output unexpectedly created'
report={'schema':'masaarat.S3-17.actual-worker-offline-verification.v1','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_OFFLINE_ACTUAL_WORKER','requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'freezeSha256':sha(HERE/'freeze.json'),'workflowSha256':sha(HERE/'s3-17-narration-r2.yml'),'testScriptSha256':sha(HERE/'offline_tests.py'),'tests':results,'testCount':len(results),'providerCalls':0,'networkCalls':len(network_attempts),'productionOutputCreated':False,'finiteScope':{'locales':4,'partsPerLocale':17,'TTS':68,'blindArgonReviews':68,'ASR':68,'metadataGETs':2,'automaticRetries':0},'limits':['No provider metadata/TTS/audio-review/ASR production invocation ran.','Availability and actual audio quality are untested for this new batch.','Offline fixture reservations are synthetic tests, kept separately from production output.','Frozen manifest and workflow must be rederived if any frozen input changes.']}
(HERE/'offline-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'status':report['status'],'tests':len(results),'providerCalls':0,'requestSha256':report['requestSha256'],'workerSha256':report['workerSha256'],'freezeSha256':report['freezeSha256'],'workflowSha256':report['workflowSha256']},indent=2))
