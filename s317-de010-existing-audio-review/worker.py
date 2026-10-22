"""One existing-WAV missing-output recovery diagnostic in a new bounded budget. Standard library; no TTS/ASR/retry route."""
from __future__ import annotations
import argparse
import base64
import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import time
import urllib.request
import wave

HERE = Path(__file__).resolve().parent
OUT = HERE / 'output'
IDS = ('S3-17-de-r1-010',)
REPOSITORY = 'cabicci/viva-ai-systems-55d35820'
BRANCH = 'refs/heads/work/soil-s317-de010-existing-audio-review-20261022-r1'
MODEL = 'gemini-4-argon'
FROZEN = {'.gitignore', 'provenance/audio-upload-receipt.json', 'provenance/blind-review-attempt.json', 'freeze_package.py', 'README.en.txt', 'prompts/S3-17-de-r1-010.txt', 'owner-authority.json', 'provenance/reference-comparison.json', 'provenance/previous-focused-worker.snapshot.py', 'runtime.json', 'provenance/complete-archive-de010-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/blind-review-response.raw.json', 'provenance/asr-attempt.json', 'request.json', 'provenance/tts-attempt.json', 'provenance/failed-run-request-unit.json', 'provenance/asr-word-timestamps.json', 'provenance/original-unit-report.json', 'worker.py', 'offline_check.py'}
urlopen = urllib.request.urlopen

def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def read(path): return json.loads(Path(path).read_text(encoding='utf-8'))
def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(path)
def exclusive(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
        stream.flush()
        os.fsync(stream.fileno())
def local_path(relative):
    path = Path(relative)
    assert not path.is_absolute() and '..' not in path.parts
    target = (HERE / path).resolve()
    assert target.is_relative_to(HERE.resolve()) and target.is_file()
    return target
def audio_info(path):
    digest, count = hashlib.sha256(), 0
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getcomptype()) == (1, 2, 24000, 'NONE')
        frames = wav.getnframes()
        for block in iter(lambda: wav.readframes(65536), b''):
            assert len(block) % 2 == 0
            count += len(block) // 2
            digest.update(block)
        assert frames == count > 0
    return {'sampleRate': 24000, 'channels': 1, 'sampleWidthBytes': 2, 'sampleCount': count,
            'durationSeconds': count / 24000, 'pcmSha256': digest.hexdigest()}
def checked_audio(unit):
    path = local_path(unit['path'])
    assert sha(path) == unit['audioSha256'] and path.stat().st_size == unit['bytes']
    assert audio_info(path) == unit['audio']
    return path
def validate():
    req, runtime, freeze = (read(HERE / name) for name in ['request.json', 'runtime.json', 'freeze.json'])
    assert set(freeze['sha256']) == FROZEN
    for path, expected in freeze['sha256'].items():
        assert sha(local_path(path)) == expected, 'Frozen file mismatch'
    assert req['scope'] == 'S3_17_ONE_EXISTING_DE010_MISSING_DIAGNOSTIC_OUTPUT_ONLY'
    assert (req['repository'], req['repositoryVisibility'], req['branch']) == (REPOSITORY, 'public', BRANCH)
    assert (req['maximumBlindReviewCalls'], req['maximumPerUnit'], req['maximumMetadataGETCalls']) == (1, 1, 1)
    assert (req['ttsCalls'], req['asrCalls'], req['automaticRetries'], req['automaticReruns']) == (0, 0, 0, 0)
    assert req['model'] == runtime['model'] == MODEL and req['thinkingLevel'] == runtime['thinkingLevel'] == 'high'
    assert runtime['endpoint'] == 'https://generativelanguage.googleapis.com/v1beta/interactions'
    assert runtime['modelMetadataEndpoint'] == 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL
    assert runtime['automaticRetries'] == 0 and runtime['silentFallbackAllowed'] is False
    assert runtime['maxOutputTokens'] == 32768 and runtime['maxInlineRequestBytes'] == 20000000
    assert tuple(u['id'] for u in req['units']) == IDS
    authority = read(local_path(req['authorityPath']))
    assert authority['publicExistingWavUseExplicitlyAuthorized'] is True
    assert authority['repository'] == REPOSITORY and authority['repositoryVisibility'] == 'public'
    assert authority['latestOwnerInstructionVerbatim'] == 'يا عم اشتغل علي العام والغي البرايفت ده خالص'
    for unit in req['units']:
        assert unit['maximumBlindReviewInvocations'] == 1 and unit['referenceTranscriptSuppliedToModel'] is False
        assert unit['path'] == f'inputs/{unit["id"]}.wav'
        assert unit['promptPath'] == f'prompts/{unit["id"]}.txt'
        assert sha(local_path(unit['promptPath'])) == unit['promptSha256']
        assert unit['locale'] in ('en', 'it', 'de')
        assert 0 <= unit['focusWindowSeconds'][0] < unit['focusWindowSeconds'][1] <= unit['audio']['durationSeconds']
        assert unit['focusWindowsSeconds'] and all(0 <= a < b <= unit['audio']['durationSeconds'] for a, b in unit['focusWindowsSeconds'])
        checked_audio(unit)
    staged = sorted(p.relative_to(HERE).as_posix() for p in (HERE / 'inputs').rglob('*') if p.is_file())
    assert staged == sorted(u['path'] for u in req['units'])
    return req, runtime
def require_actions():
    assert os.environ.get('GITHUB_ACTIONS') == 'true', 'Execution requires Actions'
    assert os.environ.get('GITHUB_RUN_ATTEMPT') == '1'
    assert os.environ.get('GITHUB_REPOSITORY') == REPOSITORY and os.environ.get('GITHUB_REF') == BRANCH
    assert os.environ.get('REPOSITORY_IS_PRIVATE') == 'false'
    assert os.environ.get('GITHUB_EVENT_NAME') == 'push' and os.environ.get('BRANCH_CREATED') == 'true'
    for filename, env in [('request.json', 'REQUEST_SHA'), ('worker.py', 'WORKER_SHA'), ('freeze.json', 'FREEZE_SHA')]:
        assert sha(HERE / filename) == os.environ[env]
def provider_key():
    key = os.environ.get('GEMINI_API_KEY')
    if not key: raise RuntimeError('Required provider credential unavailable')
    return key
def safe_failure(path, state, error):
    # No error strings, response-error bodies, headers, request payload or key.
    state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY', errorType=type(error).__name__,
                 httpStatus=getattr(error, 'code', None), finishedUTC=now())
    write(path, state)
def preflight():
    require_actions()
    _, runtime = validate()
    attempt = OUT / 'model-preflight-attempt.json'
    state = {'state': 'METADATA_GET_RESERVED_NO_RETRY', 'atUTC': now(), 'maximumGETCalls': 1, 'callsStarted': 0}
    exclusive(attempt, state)
    try:
        key = provider_key()
        request = urllib.request.Request(runtime['modelMetadataEndpoint'], headers={'x-goog-api-key': key}, method='GET')
        state.update(state='METADATA_GET_STARTED_OUTCOME_UNKNOWN', callsStarted=1)
        write(attempt, state)
        with urlopen(request, timeout=60) as response: raw = response.read()
        (OUT / 'model-availability.raw.json').write_bytes(raw)
        metadata = json.loads(raw)
        assert metadata.get('name') == 'models/' + MODEL
        methods = metadata.get('supportedGenerationMethods')
        assert isinstance(methods, list) and methods
        write(OUT / 'model-preflight.json', {'atUTC': now(), 'requestedModel': MODEL, 'serverName': metadata['name'],
            'version': metadata.get('version'), 'supportedGenerationMethods': methods, 'selectedEndpoint': runtime['endpoint'],
            'endpointProtocolEvidence': 'Frozen successful existing Interactions blind-review worker schema; metadata methods retained verbatim.',
            'requestSha256': sha(HERE / 'request.json'), 'workerSha256': sha(HERE / 'worker.py'),
            'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'modelFallback': False, 'generationCalls': 0})
        state.update(state='EXACT_MODEL_METADATA_AVAILABLE', finishedUTC=now())
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Preferred model unavailable or unresolved; no review or fallback') from None
def require_preflight():
    receipt = read(OUT / 'model-preflight.json')
    assert read(OUT / 'model-preflight-attempt.json')['state'] == 'EXACT_MODEL_METADATA_AVAILABLE'
    assert receipt['requestedModel'] == MODEL and receipt['serverName'] == 'models/' + MODEL
    assert receipt['requestSha256'] == sha(HERE / 'request.json') and receipt['workerSha256'] == sha(HERE / 'worker.py')
    assert receipt['githubRunId'] == os.environ.get('GITHUB_RUN_ID')
def selected(unit_id):
    req, runtime = validate()
    assert unit_id in IDS
    return req, runtime, next(u for u in req['units'] if u['id'] == unit_id)
def uploaded(unit_id, artifact_id, artifact_digest):
    require_actions()
    _, _, unit = selected(unit_id)
    path = checked_audio(unit)
    assert re.fullmatch(r'[1-9][0-9]*', artifact_id)
    assert re.fullmatch(r'(?:sha256:)?[0-9a-fA-F]{64}', artifact_digest)
    exclusive(OUT / unit_id / 'audio-upload-receipt.json', {'atUTC': now(), 'artifactId': artifact_id,
        'artifactDigest': artifact_digest, 'audioSha256': sha(path), 'githubRunId': os.environ.get('GITHUB_RUN_ID'),
        'beforeBlindReview': True})
def reserve(unit_id, audio_sha):
    assert unit_id in IDS and len(list(OUT.glob('*/blind-review-attempt.json'))) < 1
    path = OUT / unit_id / 'blind-review-attempt.json'
    state = {'atUTC': now(), 'state': 'RESERVED_BEFORE_PROVIDER_INVOCATION_NO_RETRY', 'unitId': unit_id,
        'callsReserved': 1, 'providerCallsStarted': 0, 'maximumPerUnit': 1, 'maximumForBatch': 1,
        'audioSha256': audio_sha, 'requestSha256': sha(HERE / 'request.json'), 'workerSha256': sha(HERE / 'worker.py'),
        'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'humanListeningApproved': False, 'ttsCalls': 0, 'asrCalls': 0}
    exclusive(path, state)
    return path, state
def blind_review(unit_id):
    require_actions()
    _, runtime, unit = selected(unit_id)
    require_preflight()
    for previous_id in IDS[:IDS.index(unit_id)]:
        previous = read(OUT / previous_id / 'blind-review-attempt.json')
        assert previous['state'] == 'MODEL_DIAGNOSTIC_ONLY' and not previous.get('invalidTimestampFindingIndexes'), 'Prior unit failed, unresolved or was not invoked; no later call'
    path = checked_audio(unit)
    uploaded_record = read(OUT / unit_id / 'audio-upload-receipt.json')
    assert uploaded_record['audioSha256'] == sha(path) and uploaded_record['beforeBlindReview'] is True
    assert uploaded_record['githubRunId'] == os.environ.get('GITHUB_RUN_ID')
    attempt, state = reserve(unit_id, sha(path))
    try:
        key = provider_key()
        prompt = local_path(unit['promptPath']).read_text(encoding='utf-8')
        payload = {'model': MODEL, 'input': [{'type': 'text', 'text': prompt},
            {'type': 'audio', 'mime_type': 'audio/wav', 'data': base64.b64encode(path.read_bytes()).decode('ascii')}],
            'response_format': {'type': 'text', 'mime_type': 'application/json'},
            'generation_config': {'thinking_level': 'high', 'max_output_tokens': 32768}}
        data = json.dumps(payload).encode('utf-8')
        assert len(data) < runtime['maxInlineRequestBytes']
        write(OUT / unit_id / 'blind-review-prompt.json', {'model': MODEL, 'prompt': prompt,
            'audioSha256': sha(path), 'referenceTranscriptSupplied': False, 'expectedCriteriaSupplied': False})
        request = urllib.request.Request(runtime['endpoint'], data=data,
            headers={'x-goog-api-key': key, 'Content-Type': 'application/json'}, method='POST')
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN', providerCallsStarted=1, startedUTC=now())
        write(attempt, state)
        with urlopen(request, timeout=runtime['timeoutSeconds']) as response: raw = response.read()
        (OUT / unit_id / 'blind-review-response.raw.json').write_bytes(raw)
        response_json = json.loads(raw)
        text = '\n'.join(c.get('text', '') for step in response_json.get('steps', []) if step.get('type') == 'model_output'
                         for c in step.get('content', []) if c.get('type') == 'text')
        result = json.loads(text)
        write(OUT / unit_id / 'blind-review-parsed-before-validation.json', result)
        assert isinstance(result['transcript'], str) and isinstance(result['findings'], list)
        assert result['overall'] in ('needs_review', 'uncertain', 'no_defect_detected')
        invalid = []
        for index, finding in enumerate(result['findings']):
            try:
                a, b = float(finding['startSeconds']), float(finding['endSeconds'])
                assert math.isfinite(a) and math.isfinite(b) and 0 <= a < b <= unit['audio']['durationSeconds'] + .25
            except (KeyError, TypeError, ValueError, AssertionError): invalid.append(index)
        write(OUT / unit_id / 'blind-review.json', {'audioSha256': sha(path), 'result': result,
            'invalidTimestampFindingIndexes': invalid, 'humanListeningApproved': False,
            'sourceCriteriaSuppliedToModel': False, 'originalAudioUnchanged': sha(path) == unit['audioSha256'],
            'reviewLimitations': 'Model diagnostic only. Invalid finding times or uncertain wording are not proof of defective speech. No automatic repair, phonetic or human-listening certification.'})
        state.update(state='MODEL_DIAGNOSTIC_ONLY', finishedUTC=now(), invalidTimestampFindingIndexes=invalid,
            modelVersion=response_json.get('model'), usage=response_json.get('usage'))
        write(attempt, state)
        if invalid:
            raise RuntimeError('Invalid model finding timestamps; raw and parsed diagnostics preserved, no later calls')
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single blind review failed; evidence preserved and no retry') from None
def summarize():
    require_actions()
    validate()
    units = []
    for unit_id in IDS:
        path = OUT / unit_id / 'blind-review-attempt.json'
        state = read(path) if path.exists() else {'state': 'NOT_INVOKED', 'providerCallsStarted': 0}
        units.append({'unitId': unit_id, 'state': state['state'], 'providerCallsStarted': state['providerCallsStarted'],
            'invalidTimestampFindingIndexes': state.get('invalidTimestampFindingIndexes', [])})
    write(OUT / 'summary.json', {'units': units, 'maximumReviews': 1,
        'callsStarted': sum(u['providerCallsStarted'] for u in units), 'ttsCalls': 0, 'asrCalls': 0,
        'automaticRetries': 0, 'humanListeningApproved': False})
    assert all(u['state'] == 'MODEL_DIAGNOSTIC_ONLY' and not u['invalidTimestampFindingIndexes'] for u in units), 'Some bounded diagnostics failed, invalid or were not invoked'
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['validate', 'preflight', 'uploaded', 'blind-review', 'summarize'])
    parser.add_argument('--unit', choices=IDS)
    parser.add_argument('--artifact-id')
    parser.add_argument('--artifact-digest')
    args = parser.parse_args()
    try:
        if args.command == 'validate': validate()
        elif args.command == 'preflight': preflight()
        elif args.command == 'uploaded': uploaded(args.unit, args.artifact_id, args.artifact_digest)
        elif args.command == 'blind-review': blind_review(args.unit)
        elif args.command == 'summarize': summarize()
    except Exception as error:
        exclusive(OUT / (args.unit or 'preflight') / f'failure-{time.time_ns()}.json',
            {'atUTC': now(), 'operation': args.command, 'errorType': type(error).__name__,
             'httpStatus': getattr(error, 'code', None), 'automaticRetry': False, 'secretPayloadLogged': False})
        raise SystemExit('Bounded diagnostic failed. Evidence preserved; no retry.') from None
if __name__ == '__main__': main()
