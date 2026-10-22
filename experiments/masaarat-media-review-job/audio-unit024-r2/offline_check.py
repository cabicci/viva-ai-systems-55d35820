"""Network-denied checks using synthetic audio and a fake provider only."""
import ast
import base64
import hashlib
import io
import importlib.util
import json
import os
from pathlib import Path
import shutil
import socket
import tempfile
import urllib.request
import wave

HERE = Path(__file__).resolve().parent
def denied(*args, **kwargs):
    raise AssertionError('Network access forbidden during offline verification')
socket.create_connection = denied
socket.socket.connect = denied
urllib.request.urlopen = denied
spec = importlib.util.spec_from_file_location('repair_worker_offline', HERE / 'worker.py')
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)
req, runtime = worker.validate()
checks = ['request, worker and frozen vendor hashes', 'exact one ID and spoken-text hashes', 'pinned voices/model and finite budgets']
ast.parse((HERE / 'worker.py').read_text('utf-8'))
engine = worker.load_engine()
calls = []
metadata_calls = []
testroot = Path(tempfile.mkdtemp(prefix='offline-test-', dir=HERE))
real_out = worker.OUT
real_actions = worker.require_actions
real_key = worker.provider_key
real_loader = worker.load_engine
real_preflight = worker.require_preflight
try:
    worker.OUT = testroot / 'output'
    worker.require_actions = lambda: None
    worker.provider_key = lambda: 'offline-placeholder-not-a-credential'
    worker.require_preflight = lambda req, runtime: None
    def fake_request(url, key, payload=None, max_attempts=1):
        assert max_attempts == 1
        if payload is None:
            metadata_calls.append(url.rsplit('/', 1)[-1])
            assert worker.read(worker.OUT / 'model-preflight-attempt.json')['callsStarted'] == len(metadata_calls)
            return {'name': 'models/' + metadata_calls[-1], 'supportedGenerationMethods': ['interactions'], 'version': 'offline-synthetic'}
        uid = worker.IDS[len(calls)]
        ledger = worker.read(worker.folder(uid) / 'tts-attempt.json')
        assert ledger['state'] == 'PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN' and ledger['providerCalls'] == 1
        calls.append(payload)
        memory = io.BytesIO()
        with wave.open(memory, 'wb') as wav:
            wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
            wav.writeframes(b'\x00\x00' * 24000)
        return {'model': req['model'], 'steps': [{'type': 'model_output', 'content': [{'type': 'audio',
            'mime_type': 'audio/wav', 'data': base64.b64encode(memory.getvalue()).decode('ascii')}]}]}
    def fake_engine():
        instance = real_loader()
        instance.request_json = fake_request
        return instance
    worker.load_engine = fake_engine
    worker.preflight()
    assert metadata_calls == [req['model'], runtime['reviewModel']]
    worker.require_preflight = real_preflight
    checks.append('two exact preferred-model metadata GETs guarded and recorded before generation')
    # Every call exercises the Interactions adapter and frozen WAV validator.
    for index, uid in enumerate(worker.IDS):
        worker.produce(uid)
        path = worker.folder(uid) / 'voice.wav'
        assert worker.audio_info(path)['frames'] == 24000
        assert worker.read(worker.folder(uid) / 'tts-attempt.json')['providerCalls'] == 1
        expected = req['units'][index]
        content = calls[index]['input'][0]['content'][0]
        assert content['text'] == expected['spokenText'] and content['annotations'][0]['style'] == expected['delivery']
        assert calls[index]['generation_config']['speech_config'][0]['voice'] == expected['voice']
        try:
            worker.produce(uid)
            raise AssertionError('Duplicate TTS unexpectedly allowed')
        except AssertionError as error:
            assert str(error) != 'Duplicate TTS unexpectedly allowed'
        try:
            worker.verified_audio(uid)
            raise AssertionError('Review before upload unexpectedly allowed')
        except FileNotFoundError:
            pass
        worker.uploaded(uid, str(1000 + index), 'sha256:offline-artifact-placeholder')
        worker.verified_audio(uid)
    assert len(calls) == 1
    checks.extend(['Interactions adapter decoded one fake WAV responses using frozen validator', 'exact delivery/text/voice request payloads',
                   'pre-invocation ledgers observed by fake provider', 'duplicate TTS attempts refused',
                   'actual WAV format and PCM hashes', 'review blocked until artifact upload receipt'])
    class FakeReviewResponse:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def read(self):
            return json.dumps({'model': runtime['reviewModel'], 'steps': [{'type': 'model_output', 'content': [
                {'type': 'text', 'text': json.dumps({'transcript': 'synthetic acoustic text', 'uncertainWords': [], 'findings': [], 'overall': 'uncertain', 'limitations': 'offline mock'})}]}]}).encode()
    def fake_review(request, timeout):
        body = json.loads(request.data)
        assert request.full_url == 'https://generativelanguage.googleapis.com/v1beta/interactions'
        assert timeout == 900 and body['model'] == runtime['reviewModel']
        assert body['input'][0] == {'type': 'text', 'text': worker.PROMPT}
        assert body['input'][1]['mime_type'] == 'audio/wav'
        assert len(body['input']) == 2 and body['generation_config']['thinking_level'] == 'high'
        assert body['response_format'] == {'type': 'text', 'mime_type': 'application/json'}
        attached = base64.b64decode(body['input'][1]['data'])
        assert hashlib.sha256(attached).hexdigest() == worker.sha(worker.folder(worker.IDS[0]) / 'voice.wav')
        assert worker.read(worker.folder(worker.IDS[0]) / 'blind-review-attempt.json')['providerCalls'] == 1
        return FakeReviewResponse()
    urllib.request.urlopen = fake_review
    worker.blind_review(worker.IDS[0])
    urllib.request.urlopen = denied
    checks.append('Argon inline actual-WAV-only payload, high reasoning, JSON parsing and pre-call ledger with fake response')
    for kind in ('blind-review', 'asr'):
        for uid in worker.IDS:
            if not (worker.folder(uid) / (kind + '-attempt.json')).exists():
                worker.reserve(uid, kind, 'synthetic-audio-sha')
            try:
                worker.reserve(uid, kind, 'synthetic-audio-sha')
                raise AssertionError('Duplicate diagnostic unexpectedly allowed')
            except (FileExistsError, AssertionError) as error:
                assert str(error) != 'Duplicate diagnostic unexpectedly allowed'
        assert len(list(worker.OUT.glob('*/' + kind + '-attempt.json'))) == 1
    checks.append('diagnostic ledger duplicate and global-one caps')
    worker.safe_failure(worker.OUT / 'sanitized.json', {}, RuntimeError('credential-must-not-be-written'))
    assert 'credential-must-not-be-written' not in (worker.OUT / 'sanitized.json').read_text()
    checks.append('failure evidence excludes exception message')
    assert 'spokenText' not in worker.PROMPT and 'النِّتريل' not in worker.PROMPT
    checks.append('blind acoustic prompt contains no unit script or repaired term')
    worker.require_actions = real_actions
    # Offline environment must never enter production.
    try:
        worker.produce(worker.IDS[0])
        raise AssertionError('Local production unexpectedly allowed')
    except AssertionError as error:
        assert str(error) != 'Local production unexpectedly allowed'
    checks.append('local provider execution refused')
finally:
    worker.OUT = real_out
    worker.require_actions = real_actions
    worker.provider_key = real_key
    worker.load_engine = real_loader
    worker.require_preflight = real_preflight
    assert testroot.resolve().parent == HERE.resolve() and testroot.name.startswith('offline-test-')
    shutil.rmtree(testroot)

workflow = HERE / 'audio-unit024-r2.yml'
wf = workflow.read_text('utf-8')
try:
    import yaml
    parsed = yaml.load(wf, Loader=yaml.BaseLoader)
    assert set(parsed['on']) == {'workflow_dispatch', 'push'}
    assert parsed['on']['push']['branches'] == ['work/soil-s101-unit024-r2-20261022']
    assert len(parsed['jobs']['repair']['steps']) == 13
    checks.append('YAML parse and exact scoped triggers/13 serial steps')
except ModuleNotFoundError:
    pass
assert 'workflow_dispatch:' in wf and 'github.run_attempt == 1' in wf
assert 'branches: [work/soil-s101-unit024-r2-20261022]' in wf
assert 'audio-unit024-r2/request.json' in wf
for forbidden in ('  pull_request:', '  schedule:', '  workflow_run:', 'GEMINI_API_KEY_1', 'curl ', 'workflow run'):
    assert forbidden not in wf
assert wf.count('worker.py produce --unit') == 1
assert wf.count('worker.py blind-review --unit') == 1
assert wf.count('worker.py asr --unit') == 1
for uid in worker.IDS:
    sequence = [wf.index('worker.py produce --unit ' + uid), wf.index('name: s101-unit024-r2-repair-' + uid + '-audio'),
                wf.index('worker.py uploaded --unit ' + uid), wf.index('worker.py blind-review --unit ' + uid),
                wf.index('worker.py asr --unit ' + uid), wf.index('name: s101-unit024-r2-repair-' + uid + '-review')]
    assert sequence == sorted(sequence)
checks.append('workflow dispatch/run-attempt gate, one explicit call and upload-before-review ordering')
report = {'checks': checks, 'count': len(checks), 'networkDenied': True, 'realProviderCalls': 0,
          'realASRInvocations': 0, 'realAudioReviews': 0, 'syntheticPCMOnly': True,
          'requestSha256': worker.sha(HERE / 'request.json'), 'workerSha256': worker.sha(HERE / 'worker.py'),
          'freezeSha256': worker.sha(HERE / 'freeze.json'), 'workflowSha256': worker.sha(workflow),
          'humanListeningApproved': False}
worker.write(HERE / 'offline-verification.json', report)
print(json.dumps(report, indent=2))
