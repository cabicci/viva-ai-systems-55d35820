"""Offline mock-only verification of the new six-question finite scope."""
from pathlib import Path
import base64
import copy
import hashlib
import importlib.util
import io
import json
import os
import shutil
import socket
import tempfile
import urllib.error
import urllib.request
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
def denied(*args, **kwargs): raise AssertionError('No real network during offline verification')
socket.create_connection = denied
socket.socket.connect = denied
urllib.request.urlopen = denied
spec = importlib.util.spec_from_file_location('focused_offline_worker', HERE / 'worker.py')
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)
request, runtime = a.validate()
checks = ['Six exact accepted WAV byte/PCM identities verified under new frozen scope',
    'New six-call scope is distinct from exhausted prior four-call budget; zero TTS/ASR/retries',
    'Source criteria and prior receipts frozen separately from all blind model prompts']
criteria = a.read(HERE / 'expected-criteria.NOT-FOR-MODEL.json')['criteria']
def rejects(fn):
    try: fn()
    except (AssertionError, RuntimeError, FileExistsError, FileNotFoundError, KeyError): return
    raise AssertionError('Unsafe, unfrozen or repeated operation accepted')

scratch = Path(tempfile.mkdtemp(prefix='offline-test-', dir=HERE))
saved = {key:getattr(a,key) for key in ['OUT','require_actions','provider_key','urlopen','read']}
DUMMY = 'OFFLINE_ONLY_DUMMY_CREDENTIAL_NEVER_SAVE'
calls, gets = [], []
mode = 'success'
class Response:
    def __init__(self, raw): self.raw=raw
    def __enter__(self): return self
    def __exit__(self,*args): return False
    def read(self): return self.raw
def fake(req, timeout):
    if req.get_method() == 'GET':
        gets.append(req.full_url)
        assert req.full_url == runtime['modelMetadataEndpoint']
        assert a.read(a.OUT/'model-preflight-attempt.json')['callsStarted'] == 1
        if mode == 'metadata-failure': raise RuntimeError(DUMMY)
        return Response(json.dumps({'name':'models/gemini-4-argon','supportedGenerationMethods':['generateContent'],'version':'MOCK'}).encode())
    data=json.loads(req.data)
    digest=hashlib.sha256(base64.b64decode(data['input'][1]['data'])).hexdigest()
    unit=next(u for u in request['units'] if u['audioSha256']==digest)
    assert data['model']=='gemini-4-argon' and data['generation_config']=={'thinking_level':'high','max_output_tokens':32768}
    assert data['response_format']=={'type':'text','mime_type':'application/json'}
    assert req.full_url==runtime['endpoint'] and timeout==900 and len(data['input'])==2
    assert data['input'][0]['type']=='text' and data['input'][1]['type']=='audio' and data['input'][1]['mime_type']=='audio/wav'
    prompt=data['input'][0]['text']
    assert prompt==(HERE/unit['promptPath']).read_text(encoding='utf-8')
    expected=next(c for c in criteria if c['clipId']==unit['id'])
    assert all(word not in prompt for word in expected['expectedOrPreviouslyAllegedWordsNotForModel'])
    assert a.read(a.OUT/unit['id']/'blind-review-attempt.json')['providerCallsStarted']==1
    assert a.read(a.OUT/unit['id']/'audio-upload-receipt.json')['beforeBlindReview']
    calls.append({'fixture':a.OUT.name,'unit':unit['id']})
    if mode=='http-failure': raise urllib.error.HTTPError(req.full_url,503,DUMMY,{},io.BytesIO(DUMMY.encode()))
    if mode=='malformed': return Response(b'RAW_MALFORMED_OFFLINE_EVIDENCE')
    result={'transcript':'OFFLINE MOCK NOT REAL SPEECH','focusWindowTranscript':'OFFLINE MOCK',
        'uncertainWords':[],'findings':[{'startSeconds':-1,'endSeconds':2}] if mode=='invalid-times' else [],
        'overall':'uncertain','limitations':'Offline fake result only.'}
    return Response(json.dumps({'model':'gemini-4-argon','steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
def fixture(name):
    a.OUT=scratch/name
    a.preflight()
def upload(unit): a.uploaded(unit,'123','a'*64)

try:
    a.require_actions=lambda:None
    a.provider_key=lambda:DUMMY
    a.urlopen=fake
    fixture('success')
    before=len(gets);rejects(a.preflight);assert len(gets)==before
    rejects(lambda:a.blind_review(a.IDS[0]));assert not calls
    upload(a.IDS[1]);rejects(lambda:a.blind_review(a.IDS[1]));assert not calls
    rejects(lambda:a.uploaded(a.IDS[0],'2','invalid'))
    checks += ['Source artifact receipt required before any model invocation',
        'Out-of-order unit and duplicate metadata preflight rejected before network',
        'Malformed artifact digest rejected']
    for unit in a.IDS:
        if unit!=a.IDS[1]: upload(unit)
        a.blind_review(unit)
        rejects(lambda unit=unit:a.blind_review(unit))
    assert [c['unit'] for c in calls]==list(a.IDS)
    a.summarize()
    assert a.read(a.OUT/'summary.json')['callsStarted']==6
    last_path=a.OUT/a.IDS[-1]/'blind-review-attempt.json'
    last=a.read(last_path);mutated=copy.deepcopy(last)
    mutated['invalidTimestampFindingIndexes']=[0]
    a.write(last_path,mutated)
    rejects(a.summarize)
    assert a.read(a.OUT/'summary.json')['units'][-1]['invalidTimestampFindingIndexes']==[0]
    a.write(last_path,last)
    a.summarize()
    checks.append('Even a final-unit success-state receipt with invalid findings cannot yield successful summary')
    checks += ['Exactly six successful mock generations in fixed order; every duplicate terminal',
        'Ledger and exact source upload are observed before every provider invocation',
        'Only frozen focused prompt and exact audio enter payload; source and prior findings never fed']
    for scenario in ['http-failure','malformed','invalid-times']:
        mode=scenario;fixture(scenario);upload(a.IDS[0]);start=len(calls)
        rejects(lambda:a.blind_review(a.IDS[0]))
        upload(a.IDS[1]);rejects(lambda:a.blind_review(a.IDS[1]));rejects(lambda:a.blind_review(a.IDS[0]))
        assert len(calls)==start+1
        if scenario=='malformed': assert (a.OUT/a.IDS[0]/'blind-review-response.raw.json').read_bytes()==b'RAW_MALFORMED_OFFLINE_EVIDENCE'
        if scenario=='invalid-times':
            assert a.read(a.OUT/a.IDS[0]/'blind-review.json')['invalidTimestampFindingIndexes']==[0]
            assert a.read(a.OUT/a.IDS[0]/'blind-review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY'
            assert (a.OUT/a.IDS[0]/'blind-review-response.raw.json').is_file()
        rejects(a.summarize)
        assert a.read(a.OUT/'summary.json')['callsStarted']==1
        checks.append('Failure/unknown/invalid outcome stops every later call and repeat: '+scenario)
    mode='metadata-failure';a.OUT=scratch/'failed-preflight';before=len(calls);g=len(gets)
    rejects(a.preflight);rejects(a.preflight);rejects(lambda:a.blind_review(a.IDS[0]))
    assert len(calls)==before and len(gets)==g+1
    checks.append('Failed model availability blocks all generations and duplicate GET')
    mode='success';fixture('missing-key');upload(a.IDS[0])
    def missing(): raise RuntimeError(DUMMY)
    a.provider_key=missing;before=len(calls)
    rejects(lambda:a.blind_review(a.IDS[0]));rejects(lambda:a.blind_review(a.IDS[0]));rejects(lambda:a.blind_review(a.IDS[1]))
    assert len(calls)==before and a.read(a.OUT/a.IDS[0]/'blind-review-attempt.json')['providerCallsStarted']==0
    checks.append('Missing credential reserves terminal zero-call failure, blocks later units, never retries')
    assert all(DUMMY not in p.read_text(encoding='utf-8') for p in scratch.rglob('*') if p.is_file())
    checks.append('Sanitized HTTP/failure state never serializes dummy key, error text, body or headers')
    wrong=copy.deepcopy(request['units'][0]);wrong['audioSha256']='0'*64
    rejects(lambda:a.checked_audio(wrong))
    def altered(path):
        value=saved['read'](path)
        if Path(path).name=='freeze.json': value['sha256']['request.json']='0'*64
        return value
    a.read=altered;rejects(a.validate);a.read=saved['read']
    checks.append('Changed WAV or frozen request hash rejected before invocation')
    a.require_actions=saved['require_actions']
    env={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_REPOSITORY':a.REPOSITORY,
        'GITHUB_REF':a.BRANCH,'REPOSITORY_IS_PRIVATE':'false','GITHUB_EVENT_NAME':'push','BRANCH_CREATED':'true',
        'REQUEST_SHA':a.sha(HERE/'request.json'),'WORKER_SHA':a.sha(HERE/'worker.py'),'FREEZE_SHA':a.sha(HERE/'freeze.json')}
    with patch.dict(os.environ,env):
        a.require_actions()
        for key,value in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_REPOSITORY','other/repo'),('GITHUB_EVENT_NAME','workflow_dispatch'),
            ('BRANCH_CREATED','false'),('REPOSITORY_IS_PRIVATE','true'),('GITHUB_REF','refs/heads/main')]:
            with patch.dict(os.environ,{key:value}): rejects(a.require_actions)
    checks.append('Exact fresh public branch creation push only; no rerun/manual/private/later-push route')
finally:
    for key,value in saved.items():setattr(a,key,value)
    assert scratch.resolve().parent==HERE.resolve() and scratch.name.startswith('offline-test-')
    shutil.rmtree(scratch)

workflow=(HERE/'s101-locale-focused-review.yml').read_text(encoding='utf-8')
assert 'continue-on-error' not in workflow and 'workflow_dispatch:' not in workflow
assert workflow.count('worker.py blind-review --unit ')==6
assert workflow.count('GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}')==7
for unit in a.IDS:
    assert workflow.index('name: s101-focused-source-'+unit)<workflow.index('worker.py uploaded --unit '+unit)<workflow.index('worker.py blind-review --unit '+unit)<workflow.index('name: s101-focused-result-'+unit)
checks.append('Fail-stop workflow transfers each original before review and raw evidence before later unit')
try:
    import yaml
    parsed=yaml.load(workflow,Loader=yaml.BaseLoader)
    assert list(parsed['on'])==['push'] and len(parsed['jobs']['review']['steps'])==30
    checks.append('Workflow YAML parses with one launch route and30 finite steps')
except ModuleNotFoundError: pass
report={'status':'OFFLINE_VALIDATED_PREPARATION_ONLY_NO_PROVIDER_EXECUTION','checks':checks,'count':len(checks),
    'realProviderCalls':0,'realMetadataGETs':0,'mockGenerationCallsAcrossIsolatedFixtures':len(calls),
    'newRealCallMaximum':6,'ttsCalls':0,'asrCalls':0,'automaticRetries':0,'networkDenied':True,
    'requestSha256':a.sha(HERE/'request.json'),'workerSha256':a.sha(HERE/'worker.py'),
    'freezeSha256':a.sha(HERE/'freeze.json'),'workflowSha256':a.sha(HERE/'s101-locale-focused-review.yml')}
a.write(HERE/'offline-verification.json',report)
print(json.dumps(report,indent=2))
