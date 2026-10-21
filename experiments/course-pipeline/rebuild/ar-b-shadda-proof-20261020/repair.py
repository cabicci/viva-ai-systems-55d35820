"""One owner-authorized B/Kore shadda repair, no alternate provider or retry."""
from pathlib import Path
import sys,os,json,hashlib,datetime,importlib.util,wave,time,importlib.metadata
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[3]
OUT=HERE/'output'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,x):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_bytes((json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode())
req=read(HERE/'request.json')
assert sha(HERE/'request.json')==os.environ.get('REQUEST_SHA'),'Exact LF request mismatch'
assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1','Only run_attempt1 permitted'
for p in req['sourcePins']:assert sha(REPO/p['path'])==p['sha256'],'Frozen source differs'
source=read(REPO/req['sourceRequestPath']);originalB=next(x for x in source['segments']if x['speakerId']=='B')
assert len(req['segments'])==1 and req['segments'][0]['speakerId']=='B'and req['segments'][0]['existingVoiceCandidate']=='Kore'
assert req['segments'][0]['text']==originalB['text'].replace('واتبع','واتَّبع')
assert req['maximumProviderCalls']==req['maxAttempts']==req['transportAttempts']==1
def validate():
 write(HERE/'offline-validation.private.json',{'atUTC':now(),'status':'SINGLE_B_TARGETED_DIACRITIC_VALIDATED_NO_PROVIDER_CALL','sourcePins':req['sourcePins'],'requestSha256':sha(HERE/'request.json'),'model':req['model'],'voice':'Kore','maximumProviderCalls':1,'regenerateA':False,'ownerListeningApproved':False})
def produce():
 validate();OUT.mkdir(exist_ok=True);statefile=OUT/'attempt-state.private.json';target=OUT/'B-shadda-candidate.wav'
 if statefile.exists()or target.exists():raise RuntimeError('Existing attempt/output; refuse second provider call')
 key=next((os.environ.get(n)for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3']if os.environ.get(n)),None)
 if not key:raise RuntimeError('Server Gemini credential missing; zero provider calls')
 spec=importlib.util.spec_from_file_location('frozen_voice_engine',REPO/req['enginePath']);pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
 media={**read(REPO/req['mediaPath']),'maxAttempts':1,'transportAttempts':1}
 assert media['provider']=='gemini'and media['model']==req['model']and media['voices']['B']=='Kore'
 pipeline.STYLE={**pipeline.STYLE,'ar-EG':req['voiceDelivery']}
 scene={'id':'B-shadda-only','speakerId':'B','narration':req['segments'][0]['text']}
 state={'atUTC':now(),'state':'ATTEMPT_RESERVED_BEFORE_REQUEST','requestSha256':sha(HERE/'request.json'),'engineSha256':sha(REPO/req['enginePath']),'speakerId':'B','voice':'Kore','model':media['model'],'providerCalls':0,'maximumProviderCalls':1,'humanListeningApproved':False}
 write(statefile,state)
 original_request=pipeline.request_json
 def tracked(url,key,payload=None,max_attempts=1):
  assert state['providerCalls']==0 and max_attempts==1
  state.update(state='PROVIDER_REQUEST_STARTED_OUTCOME_UNKNOWN',providerCalls=1,requestStartedUTC=now());write(statefile,state)
  return original_request(url,key,payload,max_attempts=1)
 pipeline.request_json=tracked
 try:
  pipeline.synthesize(scene,'ar-EG',media,key,target)
  with wave.open(str(target),'rb')as wav:
   props={'channels':wav.getnchannels(),'sampleWidthBytes':wav.getsampwidth(),'sampleRate':wav.getframerate(),'frames':wav.getnframes(),'durationSeconds':wav.getnframes()/wav.getframerate()}
  assert props['channels']==1 and props['sampleWidthBytes']==2 and props['sampleRate']==24000 and props['frames']>24000
  state.update(state='GENERATED_B_CANDIDATE_NOT_OWNER_LISTENED',file=target.name,sha256=sha(target),audio=props,finishedUTC=now());write(statefile,state)
 except Exception as e:
  state.update(state='FAILED_NO_AUTOMATIC_RETRY',errorType=type(e).__name__,failedUTC=now());write(statefile,state)
  raise SystemExit('Single B attempt failed; no automatic repeat')from None
def verify_wheel():
 w=list((HERE/'wheels').glob('faster_whisper-1.2.1-*.whl'));assert len(w)==1 and sha(w[0])==req['asr']['wheelSha256']
 write(HERE/'asr-output/package-wheel.private.json',{'atUTC':now(),'version':'1.2.1','sha256':sha(w[0])})
def asr():
 from faster_whisper import WhisperModel
 from huggingface_hub import snapshot_download
 assert importlib.metadata.version('faster-whisper')=='1.2.1'
 inp=HERE/'voice-input';states=list(inp.rglob('attempt-state.private.json'));assert len(states)==1,'Expected one candidate ledger'
 state=read(states[0]);audio=states[0].parent/state['file']
 timing=read(HERE/'timing-request.json');assert sha(HERE/'timing-request.json')==os.environ.get('TIMING_REQUEST_SHA')
 assert sha(audio)==timing['expectedWavSha256'],'Exact new B waveform differs'
 assert state['requestSha256']==sha(HERE/'request.json')and state['state']=='GENERATED_B_CANDIDATE_NOT_OWNER_LISTENED'and state['providerCalls']==1 and sha(audio)==state['sha256']
 cfg=req['asr'];modelpath=Path(snapshot_download(repo_id=cfg['modelRepo'],revision=cfg['modelRevision'],cache_dir=str(HERE/'model-cache'),allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']))
 out=HERE/'asr-output';write(out/'resolved-runtime-model.private.json',{'atUTC':now(),'packageVersions':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'modelRepo':cfg['modelRepo'],'modelRevision':cfg['modelRevision'],'files':[{'name':str(p.relative_to(modelpath)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(modelpath.rglob('*'))if p.is_file()],'method':'ASR_ESTIMATES_NOT_FORCED_ALIGNMENT_OR_HUMAN_LISTENING'})
 model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True);started=time.monotonic()
 segs,info=model.transcribe(str(audio),language='ar',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=False)
 rows=[];words=[]
 for s in segs:
  ws=[{'segmentId':s.id,'wordIndex':i,'word':w.word,'start':float(w.start),'end':float(w.end),'probability':float(w.probability)}for i,w in enumerate(s.words or[])]
  words.extend(ws);rows.append({'id':s.id,'start':s.start,'end':s.end,'text':s.text,'avgLogprob':s.avg_logprob,'noSpeechProbability':s.no_speech_prob,'words':ws})
 write(out/'B-word-timestamps.json',{'atUTC':now(),'clipId':'B-shadda-candidate','audioSha256':sha(audio),'audio':state['audio'],'settings':cfg,'segments':rows,'words':words,'wordCount':len(words),'elapsedASRSeconds':time.monotonic()-started,'language':info.language,'method':'ASR_ESTIMATES_NOT_GUARANTEED_FORCED_ALIGNMENT','humanListeningApproved':False,'shaddaConfirmedByASR':False,'noAReprocessing':True,'noInventedAnchors':True})
if __name__=='__main__':
 try:{'validate':validate,'produce':produce,'verify-wheel':verify_wheel,'asr':asr}[sys.argv[1]]()
 except Exception as e:
  write(HERE/'failure.private.json',{'atUTC':now(),'errorType':type(e).__name__,'status':'FAILED_NO_AUTOMATIC_RETRY','message':str(e)[:350]if not os.environ.get('GEMINI_API_KEY')else'Generation/setup failure; inspect attempt state without credential logging'})
  raise
