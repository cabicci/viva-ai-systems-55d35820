"""Bounded voice-only proof. Validation is offline; produce requires a new explicit request SHA."""
import argparse, datetime, hashlib, importlib.util, json, os, sys, wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
read = lambda p: json.loads(p.read_text(encoding='utf-8'))
def write(p, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

ap = argparse.ArgumentParser()
ap.add_argument('action', choices=['validate', 'produce'])
ap.add_argument('--repo', required=True)
ap.add_argument('--request-sha')
ap.add_argument('--engine-sha', required=True)
args = ap.parse_args()
repo = Path(args.repo).resolve()
engine = HERE/'vendor/pipeline-engine.py'
assert engine.is_file() and sha(engine) == args.engine_sha, 'Production engine differs from reviewed bytes'
request_file = HERE/'short-voice-proof-request.private.json'
request = read(request_file)
assert request['provider'] == 'Gemini via existing Actions convention; no substituted provider authorized'
assert [s['speakerId'] for s in request['segments']] == ['A', 'B']
assert len(request['segments']) == 2
media = {**read(HERE/'production-media.private.json'), 'maxAttempts': 1, 'transportAttempts': 1}
assert media['provider'] == 'gemini' and media['voices'] == {'A':'Charon', 'B':'Kore'}
assert media['model'] == 'gemini-2.5-flash-preview-tts', 'Unapproved model substitution'
assert all(s['existingVoiceCandidate'] == media['voices'][s['speakerId']] for s in request['segments'])
proof = {'atUTC':now(), 'status':'OFFLINE_VALIDATION_PASS_NO_PROVIDER_CALLS',
         'requestSHA256':sha(request_file), 'engineSHA256':sha(engine),
         'model':media['model'], 'voices':media['voices'], 'segments':2,
         'maximumGenerationCalls':2, 'automaticRepairs':0, 'networkCallsPerformed':0,
         'captionOrMotionTimingProduced':False, 'ownerListeningApproved':False}
if args.action == 'validate':
    write(HERE/'offline-validation.private.json', proof)
    print(json.dumps(proof)); sys.exit(0)
assert args.request_sha and args.request_sha == sha(request_file), 'Exact new bounded request authorization required'
# Never inspect local authentication stores: only the configured Actions environment.
key = next((os.environ.get(n) for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3'] if os.environ.get(n)), None)
assert key, 'Configured server-side Gemini credential is missing'
spec = importlib.util.spec_from_file_location('bounded_existing_course_engine', engine)
pipeline = importlib.util.module_from_spec(spec); spec.loader.exec_module(pipeline)
pipeline.STYLE = {**pipeline.STYLE, 'ar-EG':request['voiceDelivery']}
out = HERE/'output'; out.mkdir(exist_ok=True)
state_file = out/'attempt-state.private.json'
state = read(state_file) if state_file.exists() else {'requestSHA256':sha(request_file),'engineSHA256':sha(engine),'attempts':[]}
assert state['requestSHA256'] == sha(request_file) and state['engineSHA256'] == sha(engine), 'Prior attempt belongs to different inputs'
for i, segment in enumerate(request['segments'], 1):
    scene = {'id':'egyptian-proof-'+segment['speakerId'], 'speakerId':segment['speakerId'], 'narration':segment['text']}
    fingerprint = pipeline.audio_key(scene, 'ar-EG', media)
    target = out/(str(i)+'-'+segment['speakerId']+'-'+fingerprint+'.wav')
    previous = next((a for a in state['attempts'] if a['audioKey'] == fingerprint), None)
    if previous:
        assert previous.get('state') == 'GENERATED_NOT_OWNER_LISTENED' and target.is_file() and sha(target) == previous.get('sha256'), 'Previous attempt unresolved; no automatic repeat'
        continue
    assert len(state['attempts']) < 2, 'Two-call proof budget exhausted'
    attempt = {'speakerId':segment['speakerId'],'audioKey':fingerprint,'state':'REQUEST_STARTED_OUTCOME_NOT_YET_KNOWN','atUTC':now()}
    state['attempts'].append(attempt); write(state_file,state)
    try:
        pipeline.synthesize(scene, 'ar-EG', media, key, target)
        with wave.open(str(target),'rb') as audio:
            seconds = audio.getnframes()/audio.getframerate()
        attempt.update(state='GENERATED_NOT_OWNER_LISTENED',sha256=sha(target),seconds=seconds,file=target.name,finishedUTC=now())
        write(state_file,state)
    except Exception as exc:
        attempt.update(state='FAILED_NO_AUTOMATIC_RETRY',errorType=type(exc).__name__,finishedUTC=now())
        write(state_file,state)
        raise SystemExit('Bounded voice attempt failed; inspect retained state before another request') from None
state.update(status='TWO_CLIPS_READY_FOR_OWNER_LISTENING_NOT_APPROVED',finishedUTC=now(),newMotionRender=False)
write(state_file,state)
print(json.dumps({'status':state['status'],'clips':len(state['attempts'])}))
