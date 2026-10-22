"""S1-05 first-push-only execution r2, with all40 frozen r1 content identities unchanged. Offline validate is safe; production is Actions only, no retries."""
from __future__ import annotations
import argparse
import base64
import datetime
import difflib
import hashlib
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import time
import urllib.request
import wave

HERE = Path(__file__).resolve().parent
OUT = HERE / 'output'
IDS = tuple(u['id'] for u in json.loads((HERE / 'request.json').read_text(encoding='utf-8'))['units'])
PROMPT = '''Listen to ALL attached audio without any reference transcript. Transcribe only what you actually hear; retain uncertain words. This is vocational soil-sampling-plan narration in the explicitly indicated language. For Egyptian Arabic accept natural Cairo connected speech; other locales must remain their requested native language. Inspect consonants, vowels, gemination, stress, natural Egyptian wording, pacing, clipping, repetitions and dropped/unfinished speech. Technical Arabic need not sound colloquial to be correct. Do not infer missing words from subject knowledge. For each alleged defect report approximate startSeconds/endSeconds, heard text, issueType, observation and certainty; do not invent scores or demand formal case endings. Return JSON with transcript, uncertainWords, findings (array), overall (needs_review/uncertain/no_defect_detected), limitations. Report uncertainty honestly. Correct ASR is not proof of pronunciation. No human listening approval or voice-identity certification is available. Do not generate audio.'''

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

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

def validate():
    req = read(HERE / 'request.json')
    runtime = read(HERE / 'runtime.json')
    freeze = read(HERE / 'freeze.json')
    for path, expected in freeze['sha256'].items():
        assert sha(HERE / path) == expected, 'Frozen file mismatch'
    assert req['model'] == 'gemini-3.8-flash-tts'
    assert (req['maximumTTSCalls'], req['maximumBlindAudioReviewCalls'], req['maximumASRInvocations'], req['automaticRetries']) == (40, 40, 40, 0)
    assert req['maximumMetadataGETs'] == 2 and req['quizSolutionsIncludedBeforeAttempt'] is False
    assert len(IDS) == len(set(IDS)) == 40
    preserved = read(HERE / 'r1-preservation.json')
    unit_bytes = json.dumps(req['units'], ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
    assert hashlib.sha256(unit_bytes).hexdigest() == preserved['unitsCanonicalSHA256'], 'Frozen r1 narration identities changed'
    target = req['deploymentTarget']
    assert target['repository'] == EXPECTED_REPOSITORY and target['repositoryId'] == EXPECTED_REPOSITORY_ID
    assert target['ref'] == EXPECTED_REF and target['branch'] == EXPECTED_REF.removeprefix('refs/heads/')
    assert target['packagePath'] == 'experiments/masaarat-media-review-job/s1-05-narration-r2'
    sources = {loc: read(HERE / 'inputs' / ('source-' + loc + '.json')) for loc in ('en', 'ar-EG', 'it', 'de')}
    for script in req['sourceScripts']:
        assert sha(HERE / script['sourcePath']) == script['sourceSHA256']
    for loc in sources:
        projection = sources[loc]
        assert 'quiz' not in projection and 'writtenTasks' not in projection, 'Assessment must not enter runnable/public input'
        assert set(projection) == {'stepId','stepNumber','locale','title','intro','goals','trainingCard','reading','examples','planningTask','glossary','studentDownloads','selfReflection','practical','projectionDisclosure'}, 'Unknown source projection surface'
        original = next(p for p in req['sourceAuthority']['originalSources'] if p['locale'] == loc)
        assert projection['projectionDisclosure']['originalSourceSHA256'] == original['currentSourceSHA256']
        assert sha(HERE / original['projectionPath']) == original['projectionSHA256']
        selected = [u for u in req['units'] if u['locale'] == loc]
        script = read(HERE / ('narration-' + loc + '.json'))
        assert script['coherentParts'] == selected, 'Request no longer equals frozen complete coherent scripts'
        expected_groups = ['opening','R01','R02','R03','R04','R05','E01','E02','E03','guided-planning-and-trainer-boundary']
        assert [u['semanticGroup'] for u in selected] == expected_groups
        needed = {f'/reading/{i}/paragraphs/{j}' for i, block in enumerate(projection['reading']) for j in range(len(block['paragraphs']))}
        needed |= {f'/examples/{i}/situation' for i in range(3)} | {f'/examples/{i}/takeaway' for i in range(3)}
        needed |= {f'/examples/{i}/reasoning/{j}' for i in range(3) for j in range(len(projection['examples'][i]['reasoning']))}
        needed |= {f'/glossary/{i}/{j}' for i in range(6) for j in [0,1]}
        needed |= {'/intro','/trainingCard/purpose','/trainingCard/boundary','/trainingCard/zoneCountOnPracticeMap','/trainingCard/laterSubmission','/practical/safety','/planningTask/passRule','/selfReflection/question','/selfReflection/note'}
        needed |= {f'/goals/{i}' for i in range(3)} | {f'/planningTask/steps/{i}' for i in range(6)}
        present = {b['pointer'] for u in selected for b in u['sourceBindings']}
        assert present == needed, 'Missing or extra explanatory source binding'
        assert projection['trainingCard']['subsampleCountPerAssignedZone'] == 10
        assert projection['trainingCard']['depthCm'] == {'from':0,'to':15}
        assert projection['trainingCard']['pointIds'] == ['P' + str(i).zfill(2) for i in range(1,11)]
        assert projection['practical']['steps'] == projection['planningTask']['steps'] == projection['practical']['evidence']
        assert projection['practical']['passRule'] == projection['planningTask']['passRule']
        assert len(selected) == 10
        for index, unit in enumerate(selected):
            assert unit['id'] == 'S1-05-' + loc + '-r1-' + str(index + 1).zfill(3)
            assert (unit['speakerId'], unit['voice']) == (('A', 'Charon') if index % 2 == 0 else ('B', 'Kore'))
            assert unit['maximumProviderCalls'] == 1 and unit['estimatedDuration'] is None
            assert unit['sourceFileSHA256'] == sha(HERE / 'inputs' / ('source-' + loc + '.json'))
            assert unit['sourceOriginalFileSHA256'] == original['currentSourceSHA256']
            assert hashlib.sha256(unit['delivery'].encode()).hexdigest() == unit['deliverySha256']
            expected_spoken = unit['originalText']
            for change in unit['spokenAdaptationChanges']:
                expected_spoken = expected_spoken.replace(change['written'], change['spoken'])
            assert ''.join(expected_spoken.split()) == ''.join(unit['spokenText'].split()), 'Unrecorded spoken change or dropped source meaning'
            assert hashlib.sha256(unit['spokenText'].encode()).hexdigest() == unit['spokenTextSha256']
            for binding in unit['sourceBindings']:
                pointer = binding['pointer']
                assert not pointer.startswith(('/quiz', '/writtenTasks')) and 'feedback' not in pointer and 'reviewPoints' not in pointer
                value = sources[loc]
                for key in pointer.lstrip('/').split('/'):
                    value = value[int(key)] if isinstance(value, list) else value[key]
                assert value == binding['text'] and hashlib.sha256(value.encode()).hexdigest() == binding['sha256']
            raw = '\n\n'.join(binding['text'] for binding in unit['sourceBindings'])
            # Original groups use spaces within opening/examples/practice and blank lines between paragraphs.
            assert ''.join(raw.split()) == ''.join(unit['originalText'].split())
            assert unit['displayText'] == unit['captionText'] == unit['originalText']
            body = {'model': req['model'], 'locale': loc, 'voice': unit['voice'], 'spokenText': unit['spokenText'], 'delivery': unit['delivery'], 'format': 'pcm-s16le-24000-mono-v1'}
            assert hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest() == unit['requestFingerprintSha256']
            if loc == 'ar-EG':
                assert hashlib.sha256(unit['delivery'].encode()).hexdigest() == req['sourceAuthority']['latestEgyptianDeliverySha256']
    assert runtime['reviewModel'] == 'gemini-4-argon'
    assert runtime['maximumReviewCallsPerUnit'] == 1 and runtime['maximumReviewCallsForBatch'] == 40
    assert runtime['asr']['maximumInvocationsPerUnit'] == 1 and runtime['asr']['maximumInvocationsForBatch'] == 40
    assert runtime['asr']['languageByLocale'] == {'en': 'en', 'ar-EG': 'ar', 'it': 'it', 'de': 'de'}
    assert runtime['asr']['packageVersion'] == '1.2.1'
    assert runtime['asr']['modelRevision'] == '536b0662742c02347bc0e980a01041f333bce120'
    if os.environ.get('GITHUB_ACTIONS') == 'true':
        assert sha(HERE / 'request.json') == os.environ['REQUEST_SHA']
        assert sha(HERE / 'worker.py') == os.environ['WORKER_SHA']
        assert sha(HERE / 'freeze.json') == os.environ['FREEZE_SHA']
        assert os.environ['GITHUB_RUN_ATTEMPT'] == '1'
        validate_trigger()
    return req, runtime


EXPECTED_REPOSITORY = 'cabicci/viva-ai-systems-55d35820'
EXPECTED_REPOSITORY_ID = 1272666418
EXPECTED_REF = 'refs/heads/work/soil-s105-narration-20261022-r2'

def validate_trigger(event=None, environ=None):
    env = os.environ if environ is None else environ
    assert env.get('GITHUB_ACTIONS') == 'true', 'Production is Actions only'
    assert env.get('GITHUB_RUN_ATTEMPT') == '1', 'No reruns'
    assert env.get('GITHUB_EVENT_NAME') == 'push', 'No manual or non-push event'
    assert env.get('GITHUB_REPOSITORY') == EXPECTED_REPOSITORY, 'Wrong repository'
    assert env.get('GITHUB_REPOSITORY_ID') == str(EXPECTED_REPOSITORY_ID), 'Wrong repository identity'
    assert env.get('GITHUB_REF') == EXPECTED_REF and env.get('GITHUB_REF_TYPE') == 'branch', 'Wrong ref'
    commit = env.get('GITHUB_SHA', '')
    assert len(commit) == 40 and all(c in '0123456789abcdef' for c in commit) and commit != '0' * 40, 'Exact commit required'
    payload = read(env['GITHUB_EVENT_PATH']) if event is None else event
    assert payload.get('ref') == EXPECTED_REF
    assert payload.get('created') is True and payload.get('deleted') is False and payload.get('forced') is False
    assert payload.get('before') == '0' * 40, 'Only first push creating fresh ref'
    assert payload.get('after') == commit, 'Event/runner commit mismatch'
    repo = payload.get('repository', {})
    assert repo.get('full_name') == EXPECTED_REPOSITORY and type(repo.get('id')) is int and repo['id'] == EXPECTED_REPOSITORY_ID
    assert repo.get('private') is False and repo.get('fork') is False, 'Exact original public repository required'
    return {'repository': EXPECTED_REPOSITORY, 'repositoryId': EXPECTED_REPOSITORY_ID, 'ref': EXPECTED_REF, 'created': True,
            'before': payload['before'], 'after': commit, 'runAttempt': 1, 'policy': 'FIRST_PUSH_ONLY_NO_MANUAL_LATER_PUSH_OR_RERUN'}

def require_actions():
    return validate_trigger()


def provider_key():
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('Required server credential unavailable; zero calls')
    return key

def selected(unit_id):
    req, runtime = validate()
    assert unit_id in IDS
    return req, runtime, next(u for u in req['units'] if u['id'] == unit_id)

def folder(unit_id):
    assert unit_id in IDS
    return OUT / unit_id

def reserve(unit_id, kind, audio_sha=None):
    assert kind in ('tts', 'blind-review', 'asr')
    p = folder(unit_id) / (kind + '-attempt.json')
    count = len(list(OUT.glob('*/' + kind + '-attempt.json')))
    budget = {'tts': 40, 'blind-review': 40, 'asr': 40}[kind]
    assert count < budget, 'Finite S1-05 batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': budget,
             'requestSha256': sha(HERE / 'request.json'), 'workerSha256': sha(HERE / 'worker.py'),
             'audioSha256': audio_sha, 'humanListeningApproved': False,
             'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'githubRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT')}
    exclusive(p, entry)
    return p, entry

def load_engine():
    spec = importlib.util.spec_from_file_location('frozen_audio_engine', HERE / 'vendor/pipeline-engine.py')
    engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(engine)
    return engine

def audio_info(path):
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 24000)
        assert wav.getnframes() >= 24000
        pcm = wav.readframes(wav.getnframes())
        assert len(pcm) == wav.getnframes() * 2
        return {'channels': 1, 'sampleWidthBytes': 2, 'sampleRate': 24000,
                'frames': wav.getnframes(), 'durationSeconds': wav.getnframes() / 24000,
                'pcmSha256': hashlib.sha256(pcm).hexdigest()}

def safe_failure(attempt, state, error):
    # Never serialize str(error), response body, request headers or credential values.
    state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY', errorType=type(error).__name__,
                 httpStatus=getattr(error, 'code', getattr(error, 'status', None)), finishedUTC=now())
    write(attempt, state)

def preflight():
    require_actions()
    req, runtime = validate()
    trigger = validate_trigger()
    exclusive(OUT / 'first-push-trigger.json', {**trigger, 'atUTC': now(), 'eventSha256': sha(os.environ['GITHUB_EVENT_PATH']), 'githubRunId': os.environ.get('GITHUB_RUN_ID')})
    key = provider_key()
    engine = load_engine()
    attempt = OUT / 'model-preflight-attempt.json'
    state = {'atUTC': now(), 'state': 'METADATA_GET_RESERVED_NO_RETRY', 'maximumGETCalls': 2, 'callsStarted': 0}
    exclusive(attempt, state)
    models = []
    try:
        for model in (req['model'], runtime['reviewModel']):
            state.update(callsStarted=state['callsStarted'] + 1, lastModel=model)
            write(attempt, state)
            result = engine.request_json('https://generativelanguage.googleapis.com/v1beta/models/' + model, key, max_attempts=1)
            write(OUT / ('model-' + model + '.raw.json'), result)
            assert result.get('name') == 'models/' + model, 'Server model identity mismatch'
            methods = result.get('supportedGenerationMethods', [])
            assert isinstance(methods, list) and methods, 'Server supplied no supported methods; unresolved availability'
            models.append({'requestedModel': model, 'serverName': result['name'], 'version': result.get('version'),
                           'supportedGenerationMethods': methods, 'selectedEndpoint': '/v1beta/interactions',
                           'endpointEvidence': 'Frozen official API documentation references; metadata methods retained verbatim.'})
        write(OUT / 'model-preflight.json', {'atUTC': now(), 'requestSha256': sha(HERE / 'request.json'),
              'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'models': models, 'ttsCalls': 0,
              'noFallback': True, 'actualAudioOutputNotYetVerified': True})
        state.update(state='EXACT_MODELS_METADATA_AVAILABLE', finishedUTC=now())
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Preferred model unavailable or unresolved; no generation or fallback') from None

def require_preflight(req, runtime):
    receipt = read(OUT / 'model-preflight.json')
    assert receipt['requestSha256'] == sha(HERE / 'request.json')
    assert receipt['githubRunId'] == os.environ.get('GITHUB_RUN_ID')
    assert [m['requestedModel'] for m in receipt['models']] == [req['model'], runtime['reviewModel']]

def produce(unit_id):
    require_actions()
    req, runtime, unit = selected(unit_id)
    require_preflight(req, runtime)
    key = provider_key()
    target = folder(unit_id) / 'voice.wav'
    assert not target.exists(), 'Refuse existing media'
    engine = load_engine()
    payload = {'model': req['model'], 'input': [{'type': 'user_input', 'content': [{'type': 'text',
               'text': unit['spokenText'], 'annotations': [{'type': 'speech_metadata', 'style': unit['delivery']}]}]}],
               'response_format': {'type': 'audio', 'mime_type': 'audio/wav', 'sample_rate': 24000},
               'generation_config': {'speech_config': [{'voice': unit['voice']}]}}
    attempt, state = reserve(unit_id, 'tts')
    original_request = engine.request_json
    def tracked(url, credential, payload=None, max_attempts=1):
        assert max_attempts == 1 and state.get('providerCalls', 0) == 0
        assert payload['generation_config']['speech_config'][0]['voice'] == unit['voice']
        write(folder(unit_id) / 'tts-request.json', {'model': req['model'], 'locale': unit['locale'],
              'format': 'pcm-s16le-24000-mono-v1', 'body': payload})
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN', providerCalls=1, startedUTC=now())
        write(attempt, state)
        response = original_request(url, credential, payload, max_attempts=1)
        write(folder(unit_id) / 'tts-response.raw.json', response)
        return response
    engine.request_json = tracked
    try:
        response = tracked('https://generativelanguage.googleapis.com/v1beta/interactions', key, payload, max_attempts=1)
        blocks = [content for step in response.get('steps', []) if step.get('type') == 'model_output'
                  for content in step.get('content', []) if content.get('type') == 'audio']
        assert len(blocks) == 1, 'Expected exactly one complete audio block'
        block = blocks[0]
        data = base64.b64decode(block['data'], validate=True)
        (folder(unit_id) / 'provider-audio.original.bin').write_bytes(data)
        write(folder(unit_id) / 'provider-audio-format.json', {'mimeType': block.get('mime_type'),
              'sourceResponseSha256': sha(folder(unit_id) / 'tts-response.raw.json')})
        assert data.startswith(b'RIFF'), 'Expected complete unary WAV output'
        temporary = target.with_suffix('.partial.wav')
        temporary.write_bytes(data)
        assert engine.valid_wav(temporary), 'Invalid provider WAV'
        temporary.replace(target)
        assert state['providerCalls'] == 1
        state.update(state='GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW', file='voice.wav',
                     sha256=sha(target), audio=audio_info(target), finishedUTC=now(), ownerAccepted=False)
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single TTS attempt failed; no retry') from None

def verified_audio(unit_id):
    state = read(folder(unit_id) / 'tts-attempt.json')
    path = folder(unit_id) / 'voice.wav'
    assert state['state'] == 'GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW'
    assert sha(path) == state['sha256'] and audio_info(path) == state['audio']
    upload = read(folder(unit_id) / 'audio-upload-receipt.json')
    assert upload['audioSha256'] == state['sha256'] and upload['artifactId'] and upload['artifactDigest']
    return path, state

def uploaded(unit_id, artifact_id, artifact_digest):
    require_actions()
    selected(unit_id)
    path = folder(unit_id) / 'voice.wav'
    state = read(folder(unit_id) / 'tts-attempt.json')
    assert artifact_id.isdigit() and artifact_digest
    assert sha(path) == state['sha256']
    exclusive(folder(unit_id) / 'audio-upload-receipt.json', {'atUTC': now(), 'artifactId': artifact_id,
              'artifactDigest': artifact_digest, 'audioSha256': sha(path), 'beforeReviewAndASR': True})

def blind_review(unit_id):
    require_actions()
    req, runtime, unit = selected(unit_id)
    require_preflight(req, runtime)
    path, voice = verified_audio(unit_id)
    key = provider_key()
    payload = {'model': runtime['reviewModel'], 'input': [{'type': 'text', 'text': PROMPT + ' Requested locale: ' + unit['locale']},
        {'type': 'audio', 'mime_type': 'audio/wav', 'data': base64.b64encode(path.read_bytes()).decode('ascii')}],
        'response_format': {'type': 'text', 'mime_type': 'application/json'},
        'generation_config': {'thinking_level': 'high', 'max_output_tokens': 32768}}
    assert len(json.dumps(payload).encode('utf-8')) < 20000000, 'Inline audio request too large'
    write(folder(unit_id) / 'blind-review-prompt.json', {'model': runtime['reviewModel'], 'prompt': PROMPT + ' Requested locale: ' + unit['locale'],
          'referenceTranscriptSupplied': False, 'unitSpecificRepairTermsSupplied': False, 'audioSha256': sha(path)})
    attempt, state = reserve(unit_id, 'blind-review', sha(path))
    try:
        request = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/interactions',
                  data=json.dumps(payload).encode('utf-8'), headers={'x-goog-api-key': key, 'Content-Type': 'application/json'}, method='POST')
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN', providerCalls=1, startedUTC=now())
        write(attempt, state)
        with urllib.request.urlopen(request, timeout=900) as response:
            raw_bytes = response.read()
        (folder(unit_id) / 'blind-review-response.raw.json').write_bytes(raw_bytes)
        raw = json.loads(raw_bytes)
        text = '\n'.join(p.get('text', '') for step in raw.get('steps', []) if step.get('type') == 'model_output'
                         for p in step.get('content', []) if p.get('type') == 'text')
        result = json.loads(text)
        assert isinstance(result['transcript'], str) and isinstance(result['findings'], list)
        invalid = []
        for index, finding in enumerate(result['findings']):
            try:
                assert 0 <= float(finding['startSeconds']) < float(finding['endSeconds']) <= voice['audio']['durationSeconds'] + 0.25
            except (KeyError, TypeError, ValueError, AssertionError):
                invalid.append(index)
        write(folder(unit_id) / 'blind-review.json', {'audioSha256': sha(path), 'result': result,
              'invalidTimestampFindingIndexes': invalid, 'humanListeningApproved': False,
              'reviewLimitations': 'Model diagnostic only; invalid timing is a review defect, not evidence of defective speech.'})
        state.update(state='MODEL_DIAGNOSTIC_ONLY', finishedUTC=now(), invalidTimestampFindingIndexes=invalid,
                     modelVersion=raw.get('model'), usage=raw.get('usage'))
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single blind review failed; no retry') from None

def verify_wheel():
    _, runtime = validate()
    wheels = list((HERE / 'wheels').glob('faster_whisper-1.2.1-*.whl'))
    assert len(wheels) == 1 and sha(wheels[0]) == runtime['asr']['wheelSha256']
    write(OUT / 'asr-wheel-verification.json', {'sha256': sha(wheels[0]), 'version': '1.2.1'})

def asr(unit_id):
    require_actions()
    _, runtime, unit = selected(unit_id)
    path, voice = verified_audio(unit_id)
    from faster_whisper import WhisperModel
    from huggingface_hub import snapshot_download
    cfg = runtime['asr']
    assert importlib.metadata.version('faster-whisper') == cfg['packageVersion']
    verify_wheel()
    modelpath = Path(snapshot_download(repo_id=cfg['modelRepo'], revision=cfg['modelRevision'], cache_dir=str(HERE / 'model-cache'),
                     allow_patterns=['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.*', 'preprocessor_config.json']))
    write(OUT / 'asr-resolved-runtime.json', {'packageVersions': {d.metadata['Name']: d.version for d in importlib.metadata.distributions()},
          'modelRepo': cfg['modelRepo'], 'modelRevision': cfg['modelRevision'],
          'files': [{'name': p.relative_to(modelpath).as_posix(), 'sha256': sha(p), 'bytes': p.stat().st_size} for p in sorted(modelpath.rglob('*')) if p.is_file()]})
    model = WhisperModel(str(modelpath), device='cpu', compute_type='int8', cpu_threads=2, num_workers=1, local_files_only=True)
    attempt, state = reserve(unit_id, 'asr', sha(path))
    try:
        started = time.monotonic()
        segments, info = model.transcribe(str(path), language=cfg['languageByLocale'][unit['locale']], word_timestamps=True, beam_size=5,
                                         vad_filter=False, condition_on_previous_text=False)
        rows, words = [], []
        for segment in segments:
            ws = [{'segmentId': segment.id, 'wordIndex': i, 'word': word.word, 'start': float(word.start),
                   'end': float(word.end), 'probability': float(word.probability)} for i, word in enumerate(segment.words or [])]
            words.extend(ws)
            rows.append({'id': segment.id, 'start': segment.start, 'end': segment.end, 'text': segment.text,
                         'avgLogprob': segment.avg_logprob, 'noSpeechProbability': segment.no_speech_prob, 'words': ws})
        write(folder(unit_id) / 'asr-word-timestamps.json', {'atUTC': now(), 'audioSha256': sha(path), 'audio': voice['audio'],
              'settings': cfg, 'segments': rows, 'words': words, 'elapsedASRSeconds': time.monotonic() - started,
              'language': info.language, 'initialPromptSupplied': False, 'referenceTranscriptSupplied': False,
              'method': 'ASR_ESTIMATES_NOT_FORCED_ALIGNMENT_OR_PRONUNCIATION_APPROVAL', 'humanListeningApproved': False})
        state.update(state='ASR_DIAGNOSTIC_ONLY', finishedUTC=now(), wordCount=len(words))
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single ASR invocation failed; no retry') from None

def compare(unit_id):
    _, _, unit = selected(unit_id)
    path, _ = verified_audio(unit_id)
    reference = unit['spokenText']
    comparisons = {}
    for name, filename, extract in [('asr', 'asr-word-timestamps.json', lambda r: ''.join(s['text'] for s in r['segments'])),
                                    ('blindReview', 'blind-review.json', lambda r: r['result']['transcript'])]:
        source = folder(unit_id) / filename
        if source.exists():
            result = read(source)
            assert result['audioSha256'] == sha(path)
            heard = extract(result)
            comparisons[name] = {'transcript': heard, 'sequenceSimilarityDiagnosticOnly': difflib.SequenceMatcher(None, reference, heard).ratio(),
                                 'wordDiffDiagnosticOnly': list(difflib.ndiff(reference.split(), heard.split()))}
    write(folder(unit_id) / 'reference-comparison.json', {'audioSha256': sha(path), 'referenceTextNotSentToReviewers': reference,
          'comparisons': comparisons, 'humanListeningApproved': False, 'ownerAccepted': False,
          'limitations': 'Offline text comparison after independent actual-audio reviews. Similarity is not a pass criterion or acoustic proof. Review repaired words, negations, conditions, uncertainty and voice continuity before assembly.'})
    assert set(comparisons) == {'asr', 'blindReview'}, 'Incomplete diagnostics; stop dependent production'
    assert read(folder(unit_id) / 'blind-review-attempt.json')['state'] == 'MODEL_DIAGNOSTIC_ONLY'
    assert read(folder(unit_id) / 'asr-attempt.json')['state'] == 'ASR_DIAGNOSTIC_ONLY'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['validate', 'preflight', 'produce', 'uploaded', 'blind-review', 'verify-wheel', 'asr', 'compare'])
    parser.add_argument('--unit', choices=IDS)
    parser.add_argument('--artifact-id')
    parser.add_argument('--artifact-digest')
    args = parser.parse_args()
    try:
        if args.command == 'validate':
            validate()
            print('Frozen S1-05 first-push r2 package and unchanged40 r1 narration identities verified; zero provider calls.')
        elif args.command == 'verify-wheel':
            verify_wheel()
        elif args.command == 'preflight':
            preflight()
        elif args.command == 'uploaded':
            uploaded(args.unit, args.artifact_id, args.artifact_digest)
        else:
            assert args.unit
            {'produce': produce, 'blind-review': blind_review, 'asr': asr, 'compare': compare}[args.command](args.unit)
    except Exception as error:
        write(OUT / 'failure.json', {'atUTC': now(), 'operation': args.command, 'unitId': args.unit,
              'errorType': type(error).__name__, 'noRetry': True, 'secretPayloadLogged': False})
        raise SystemExit('Bounded operation failed; inspect sanitized evidence. No automatic retry.') from None

if __name__ == '__main__':
    main()
