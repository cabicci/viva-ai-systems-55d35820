"""Offline mock-only checks. Real network and provider invocation are forbidden."""
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
def denied(*args, **kwargs): raise AssertionError('Real network is forbidden during offline tests')
socket.create_connection = denied
socket.socket.connect = denied
urllib.request.urlopen = denied
spec = importlib.util.spec_from_file_location('blind_worker_offline', HERE / 'worker.py')
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)
request, runtime = a.validate()
checks = ['Exact four requested WAV byte/PCM hashes and frozen public owner authority verified',
          'Only Argon4/high, four reviews, one per clip, one metadata GET, zero TTS/ASR/retries']
def rejects(fn):
    try: fn()
    except (AssertionError, RuntimeError, FileExistsError, FileNotFoundError): return
    raise ValueError('Unsafe or repeated operation was not rejected')

folder = Path(tempfile.mkdtemp(prefix='offline-test-', dir=HERE))
old_out, old_gate, old_key, old_urlopen, old_read = a.OUT, a.require_actions, a.provider_key, a.urlopen, a.read
mock_secret = 'OFFLINE_DUMMY_SECRET_DO_NOT_SERIALIZE'
calls, metadata_calls = [], []
class Response:
    def __init__(self, raw): self.raw = raw
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def read(self): return self.raw
def fake_urlopen(req, timeout):
    if req.get_method() == 'GET':
        metadata_calls.append(req.full_url)
        assert a.read(a.OUT / 'model-preflight-attempt.json')['callsStarted'] == 1
        assert req.full_url == runtime['modelMetadataEndpoint']
        return Response(json.dumps({'name': 'models/gemini-4-argon', 'version': 'MOCK', 'supportedGenerationMethods': ['generateContent']}).encode())
    payload = json.loads(req.data)
    assert req.full_url == runtime['endpoint'] and timeout == 900
    assert payload['model'] == 'gemini-4-argon'
    assert payload['generation_config'] == {'thinking_level': 'high', 'max_output_tokens': 32768}
    assert payload['response_format'] == {'type': 'text', 'mime_type': 'application/json'}
    assert len(payload['input']) == 2 and payload['input'][0]['type'] == 'text' and payload['input'][1]['type'] == 'audio'
    assert payload['input'][1]['mime_type'] == 'audio/wav'
    audio_sha = hashlib.sha256(base64.b64decode(payload['input'][1]['data'])).hexdigest()
    unit = next(u for u in request['units'] if u['audioSha256'] == audio_sha)
    prompt = payload['input'][0]['text']
    assert prompt == (HERE / unit['promptPath']).read_text(encoding='utf-8')
    for forbidden in ['comunicazioni inadeguate', 'unzureichende Kommunikation', 'Anpassungsüberprüfung', 'Empfang', 'Empfangen']:
        assert forbidden not in prompt
    state = a.read(a.OUT / unit['id'] / 'blind-review-attempt.json')
    assert state['state'] == 'PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN' and state['providerCallsStarted'] == 1
    assert a.read(a.OUT / unit['id'] / 'audio-upload-receipt.json')['beforeBlindReview'] is True
    calls.append(unit['id'])
    if unit['id'] == a.IDS[0]:
        raise urllib.error.HTTPError(req.full_url, 500, mock_secret, {}, io.BytesIO(mock_secret.encode()))
    if unit['id'] == a.IDS[1]:
        return Response(b'RAW_MALFORMED_MOCK_RESPONSE_RETAIN_ME')
    findings = [{'startSeconds': -1, 'endSeconds': 2, 'heardText': 'MOCK ONLY'}] if unit['id'] == a.IDS[2] else []
    result = {'transcript': 'MOCK ONLY NOT ACTUAL AUDIO TRANSCRIPTION', 'focusWindowTranscript': 'MOCK ONLY',
              'uncertainWords': [], 'findings': findings, 'overall': 'uncertain', 'limitations': 'Offline fake result.'}
    return Response(json.dumps({'model': 'gemini-4-argon', 'steps': [{'type': 'model_output', 'content': [{'type': 'text', 'text': json.dumps(result)}]}], 'usage': {'MOCK': True}}).encode())

try:
    a.OUT = folder / 'success-and-failure'
    a.require_actions = lambda: None
    a.provider_key = lambda: mock_secret
    a.urlopen = fake_urlopen
    a.preflight()
    assert len(metadata_calls) == 1
    rejects(a.preflight)
    assert len(metadata_calls) == 1
    checks.append('One exclusive preflight metadata GET; duplicate preflight cannot call again')
    rejects(lambda: a.blind_review(a.IDS[0]))
    assert len(calls) == 0
    checks.append('Missing source-upload receipt blocks review before provider invocation')
    rejects(lambda: a.uploaded(a.IDS[0], '1', 'invalid-digest'))
    for index, unit_id in enumerate(a.IDS):
        a.uploaded(unit_id, str(index + 1), 'a' * 64)
        if index < 2: rejects(lambda unit_id=unit_id: a.blind_review(unit_id))
        else: a.blind_review(unit_id)
        rejects(lambda unit_id=unit_id: a.blind_review(unit_id))
    assert calls == list(a.IDS)
    checks.append('Exactly four mocked generation calls; all duplicate/failure/unknown outcomes terminal')
    checks.append('Mock observes exclusive ledger and exact upload receipt before every invocation')
    checks.append('Only frozen blind prompt and exact WAV enter payload; expected criteria never supplied')
    for unit_id in a.IDS[:2]:
        state = a.read(a.OUT / unit_id / 'blind-review-attempt.json')
        assert state['state'] == 'FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY' and state['providerCallsStarted'] == 1
    assert (a.OUT / a.IDS[1] / 'blind-review-response.raw.json').read_bytes() == b'RAW_MALFORMED_MOCK_RESPONSE_RETAIN_ME'
    checks.append('HTTP failure is terminal and malformed successful response remains raw before parse failure')
    assert a.read(a.OUT / a.IDS[2] / 'blind-review.json')['invalidTimestampFindingIndexes'] == [0]
    assert a.read(a.OUT / a.IDS[3] / 'blind-review.json')['humanListeningApproved'] is False
    checks.append('Invalid model timestamps remain diagnostic flags, never speech-defect or human approval claims')
    rejects(a.summarize)
    assert a.read(a.OUT / 'summary.json')['callsStarted'] == 4
    checks.append('Finite four-call summary preserves two failures and two diagnostics without rerunning')
    assert all(mock_secret not in p.read_text(encoding='utf-8') for p in a.OUT.rglob('*') if p.is_file())
    checks.append('Sanitized error state never serializes exception text, error body, headers or dummy credential')

    # Failed shared preflight must never allow a subsequent generation call.
    a.OUT = folder / 'failed-preflight'
    failed_gets = []
    def fail_metadata(req, timeout):
        failed_gets.append(req.get_method())
        raise RuntimeError(mock_secret)
    a.urlopen = fail_metadata
    rejects(a.preflight)
    rejects(lambda: a.blind_review(a.IDS[0]))
    rejects(a.preflight)
    assert failed_gets == ['GET'] and len(calls) == 4
    checks.append('Failed model preflight blocks all review calls and any second metadata attempt')

    for scenario, metadata in [('wrong-model', {'name': 'models/other', 'supportedGenerationMethods': ['generateContent']}),
                               ('no-methods', {'name': 'models/gemini-4-argon', 'supportedGenerationMethods': []})]:
        a.OUT = folder / scenario
        a.urlopen = lambda req, timeout, metadata=metadata: Response(json.dumps(metadata).encode())
        rejects(a.preflight)
        rejects(lambda: a.blind_review(a.IDS[0]))
        assert not (a.OUT / 'model-preflight.json').exists() and len(calls) == 4
    checks.append('Wrong server model or absent supported methods stops without review or fallback')

    a.OUT = folder / 'c0'
    a.urlopen = fake_urlopen
    a.preflight()
    a.uploaded(a.IDS[0], '9', 'b' * 64)
    def missing_key(): raise RuntimeError(mock_secret)
    a.provider_key = missing_key
    rejects(lambda: a.blind_review(a.IDS[0]))
    rejects(lambda: a.blind_review(a.IDS[0]))
    failed = a.read(a.OUT / a.IDS[0] / 'blind-review-attempt.json')
    assert failed['state'] == 'FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY' and failed['providerCallsStarted'] == 0 and len(calls) == 4
    assert all(mock_secret not in p.read_text(encoding='utf-8') for p in a.OUT.rglob('*') if p.is_file())
    checks.append('Lost credential produces a terminal reserved zero-call failure, never a retry or secret log')

    # Freeze and source mismatch checks without modifying package source files.
    wrong = copy.deepcopy(request['units'][0]); wrong['audioSha256'] = '0' * 64
    rejects(lambda: a.checked_audio(wrong))
    checks.append('Wrong WAV SHA rejected before provider invocation')
    def incomplete_freeze(path):
        value = old_read(path)
        if Path(path).name == 'freeze.json': value['sha256'].pop('request.json')
        return value
    a.read = incomplete_freeze; rejects(a.validate); a.read = old_read
    def bad_pin(path):
        value = old_read(path)
        if Path(path).name == 'freeze.json': value['sha256']['request.json'] = '0' * 64
        return value
    a.read = bad_pin; rejects(a.validate); a.read = old_read
    checks.append('Required freeze inventory and exact request byte pin cannot be removed or changed')

    a.require_actions = old_gate
    env = {'GITHUB_ACTIONS': 'true', 'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_REPOSITORY': a.REPOSITORY,
           'GITHUB_REF': a.BRANCH, 'REPOSITORY_IS_PRIVATE': 'false', 'GITHUB_EVENT_NAME': 'push', 'BRANCH_CREATED': 'true',
           'REQUEST_SHA': a.sha(HERE / 'request.json'), 'WORKER_SHA': a.sha(HERE / 'worker.py'), 'FREEZE_SHA': a.sha(HERE / 'freeze.json')}
    with patch.dict(os.environ, env):
        a.require_actions()
        for key, invalid in [('GITHUB_RUN_ATTEMPT', '2'), ('BRANCH_CREATED', 'false'), ('REPOSITORY_IS_PRIVATE', 'true'),
                             ('GITHUB_REPOSITORY', 'other/repo'), ('GITHUB_REF', 'refs/heads/main'), ('GITHUB_EVENT_NAME', 'workflow_dispatch')]:
            with patch.dict(os.environ, {key: invalid}): rejects(a.require_actions)
    checks.append('Exact public fresh-branch push only; later pushes, private state, manual events and reruns rejected')
finally:
    a.OUT, a.require_actions, a.provider_key, a.urlopen, a.read = old_out, old_gate, old_key, old_urlopen, old_read
    assert folder.resolve().parent == HERE.resolve() and folder.name.startswith('offline-test-')
    shutil.rmtree(folder)

workflow = (HERE / 's101-locale-blind-review.yml').read_text(encoding='utf-8')
assert 'workflow_dispatch:' not in workflow and 'github.event.created == true' in workflow
assert 'github.event.repository.private == false' in workflow and 'github.run_attempt == 1' in workflow
assert workflow.count('worker.py blind-review --unit ') == 4
assert workflow.count('name: s101-blind-source-') == 4 and workflow.count('name: s101-blind-result-') == 4
assert workflow.count('GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}') == 5
for unit_id in a.IDS:
    assert workflow.index('name: s101-blind-source-' + unit_id) < workflow.index('worker.py uploaded --unit ' + unit_id) < workflow.index('worker.py blind-review --unit ' + unit_id) < workflow.index('name: s101-blind-result-' + unit_id)
checks.append('Workflow uploads each source before review and finished evidence before the next clip')
try:
    import yaml
    data = yaml.load(workflow, Loader=yaml.BaseLoader)
    assert list(data['on']) == ['push'] and len(data['jobs']['review']['steps']) == 22
    checks.append('Generated workflow YAML parses with22 bounded steps and one launch route')
except ModuleNotFoundError:
    pass
report = {'status': 'OFFLINE_VALIDATED_NO_PROVIDER_EXECUTION', 'checks': checks, 'count': len(checks),
          'wavCount': 4, 'mockGenerationCalls': len(calls), 'realMetadataGETs': 0, 'realProviderCalls': 0,
          'ttsCalls': 0, 'asrCalls': 0, 'networkDenied': True,
          'requestSha256': a.sha(HERE / 'request.json'), 'workerSha256': a.sha(HERE / 'worker.py'),
          'freezeSha256': a.sha(HERE / 'freeze.json'), 'workflowSha256': a.sha(HERE / 's101-locale-blind-review.yml')}
a.write(HERE / 'offline-verification.json', report)
print(json.dumps(report, indent=2))
