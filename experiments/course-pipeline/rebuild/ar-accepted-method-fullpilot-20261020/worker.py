"""Bounded S1-01 AR pilot speech worker. Preparation does not authorize execution."""
from pathlib import Path
import os,sys,json,hashlib,datetime,importlib.util,subprocess,wave
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[3]
OUT=HERE/'output'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def textsha(s):return hashlib.sha256(s.encode('utf-8')).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,x):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_bytes((json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode())
def request():return read(HERE/'request.private.json')
def units():return [u for u in request()['units']if u['generationDisposition']=='generate']
def validate():
 r=request();assert r['scope']=='S1-01_AR_FULL_PILOT_ONLY'
 assert r['voices']=={'A':'Charon','B':'Kore'}and r['ttsModel']=='gemini-2.5-flash-preview-tts'
 assert r['audioUnderstandingModel']=='gemini-2.5-flash'
 assert r['retries']==0 and not r['providerFallback']
 ids=[u['id']for u in r['units']];assert len(ids)==len(set(ids))
 for u in r['units']:
  assert u['speakerId']in r['voices']and u['generationDisposition']in['generate','reuse']
  assert u['spokenText']and textsha(u['spokenText'])==u['spokenTextSha256']
  assert textsha(u['displayText'])==u['displayTextSha256']
  assert u['sourceReferences'],'Every unit must retain source/text-review pointers'
  assert u['id'].replace('-','').replace('_','').isalnum(),'Safe unique filesystem ID required'
  if u['generationDisposition']=='reuse':assert u['reuse']['wavSha256']in r['acceptedReuseWavHashes']
 g=len(units());assert r['budget']=={'ttsRequests':g,'audioUnderstandingRequests':g,'asrInvocations':g,'maxAttemptsPerUnit':1}
 if r['status']=='FINAL_TEXT_FROZEN_AWAITING_ROOT_GO':
  assert g>0 and len([u for u in r['units']if u['generationDisposition']=='reuse'])==2
  assert sha(HERE/'source-inventory.private.json')==r['inventorySha256'],'Final reviewed inventory bytes must be pinned'
 for pin in r['sourcePins']:
  if os.environ.get('GITHUB_ACTIONS'):assert sha(REPO/pin['path'])==pin['sha256']
  else:assert hashlib.sha256(subprocess.check_output(['E:/DevTools/Git/cmd/git.exe','show','HEAD:'+pin['path']],cwd=REPO)).hexdigest()==pin['sha256']
 write(OUT/'offline-validation.private.json',{'atUTC':now(),'status':r['status'],'generationUnits':g,'reuseUnits':len(r['units'])-g,'requestSha256':sha(HERE/'request.private.json'),'providerCalls':0})
def authorized():
 validate();r=request();d=read(HERE/'dispatch.private.json')
 assert d['authorizedByRoot']is True and d['explicitGoRecorded']is True,'Prepared worker is not authorized'
 assert r['status']=='FINAL_TEXT_FROZEN_AWAITING_ROOT_GO'and len(units())>0
 assert d['requestSha256']==sha(HERE/'request.private.json')==os.environ['REQUEST_SHA']
 assert d['workerSha256']==sha(HERE/'worker.py')==os.environ['WORKER_SHA']
 assert d['auditSha256']==sha(HERE/'audio_audit.py')==os.environ['AUDIT_SHA']
 assert d['inventorySha256']==r['inventorySha256']and d['budget']==r['budget']
 assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1','No workflow rerun may make provider calls'
 return r
def key():
 k=next((os.environ.get(n)for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3']if os.environ.get(n)),None)
 if not k:raise RuntimeError('Missing configured server Gemini key; no alternate provider')
 return k
def audioinfo(p):
 with wave.open(str(p),'rb')as w:r={'channels':w.getnchannels(),'sampleWidthBytes':w.getsampwidth(),'sampleRate':w.getframerate(),'frames':w.getnframes(),'durationSeconds':w.getnframes()/w.getframerate()}
 assert r['channels']==1 and r['sampleWidthBytes']==2 and r['sampleRate']==24000 and r['frames']>0
 return r
def produce():
 r=authorized();k=key();spec=importlib.util.spec_from_file_location('frozen_engine',REPO/r['enginePath']);engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
 media={**read(REPO/r['mediaPath']),'maxAttempts':1,'transportAttempts':1}
 assert media['provider']=='gemini'and media['model']==r['ttsModel']and media['voices']==r['voices']
 original_request=engine.request_json
 for u in units():
  folder=OUT/u['id'];ledger=folder/'tts-attempt.private.json';target=folder/'voice.wav'
  if ledger.exists()or target.exists():raise RuntimeError('Existing per-unit attempt; refuse repeat')
  state={'atUTC':now(),'state':'RESERVED_BEFORE_REQUEST','unitId':u['id'],'spokenTextSha256':u['spokenTextSha256'],'speakerId':u['speakerId'],'voice':r['voices'][u['speakerId']],'model':r['ttsModel'],'providerCalls':0,'maximumProviderCalls':1,'ownerListeningAccepted':False};write(ledger,state)
  def tracked(url,credential,payload=None,max_attempts=1):
   assert state['providerCalls']==0 and max_attempts==1
   state.update(state='REQUEST_STARTED_OUTCOME_UNKNOWN',providerCalls=1,requestStartedUTC=now());write(ledger,state)
   return original_request(url,credential,payload,max_attempts=1)
  engine.request_json=tracked;engine.STYLE={**engine.STYLE,'ar-EG':r['voiceDelivery']+u.get('deliveryGuidance','')}
  try:
   engine.synthesize({'id':u['id'],'speakerId':u['speakerId'],'narration':u['spokenText']},'ar-EG',media,k,target)
   state.update(state='GENERATED_CANDIDATE_NOT_LISTENING_ACCEPTED',file='voice.wav',sha256=sha(target),audio=audioinfo(target),completedUTC=now());write(ledger,state)
  except Exception as e:state.update(state='FAILED_OR_UNKNOWN_NO_RETRY',errorType=type(e).__name__,failedUTC=now());write(ledger,state)
def generated():
 result=[]
 for u in units():
  ledger=OUT/u['id']/'tts-attempt.private.json'
  if not ledger.exists():continue
  s=read(ledger)
  if s['state']!='GENERATED_CANDIDATE_NOT_LISTENING_ACCEPTED':continue
  audio=ledger.parent/s['file'];assert sha(audio)==s['sha256']and s['providerCalls']==1
  result.append((u,s,audio))
 return result
def audit():
 r=authorized();key()
 for u,s,audio in generated():
  folder=OUT/u['id']/'audio-review';assert not folder.exists(),'Existing diagnostic directory; refuse repeat'
  req={'model':r['audioUnderstandingModel'],'maximumDiagnosticCallsPerClip':1,'maximumTotalDiagnosticCalls':1,'retries':0,'fallback':False,'clips':[{'id':u['id'],'text':u['spokenText'],'sha256':s['sha256'],'duration':s['audio']['durationSeconds'],'pronunciationFocus':u.get('pronunciationFocus',[])}]}
  write(folder/'request.json',req);write(folder/'output'/f"{u['id']}-input.private.json",{'relativeToPackage':'../voice.wav','sha256':s['sha256'],'audio':s['audio'],'exactGeneratedWaveformChecked':True})
  # The frozen review module uses its own isolated directory/ledger for this unit.
  spec=importlib.util.spec_from_file_location('audio_review_'+u['id'],HERE/'audio_audit.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  module.HERE=folder;module.OUT=folder/'output';module.req=req
  def validate_dynamic():
   assert read(folder/'request.json')==req and sha(audio)==s['sha256']and len(req['clips'])==1
  module.validate=validate_dynamic
  try:module.audit()
  except (Exception,SystemExit)as e:write(folder/'review-exception.private.json',{'atUTC':now(),'state':'REVIEW_FAILED_OR_UNCERTAIN_NO_RETRY','errorType':type(e).__name__})
def verify_wheel():
 r=authorized();ws=list((HERE/'wheels').glob('faster_whisper-1.2.1-*.whl'));assert len(ws)==1 and sha(ws[0])==r['asr']['wheelSha256'];write(OUT/'asr-wheel.private.json',{'version':'1.2.1','sha256':sha(ws[0])})
def asr():
 r=authorized()
 if not generated():return
 from faster_whisper import WhisperModel
 from huggingface_hub import snapshot_download
 import importlib.metadata
 assert importlib.metadata.version('faster-whisper')=='1.2.1'
 cfg=r['asr'];modelpath=Path(snapshot_download(repo_id=cfg['modelRepo'],revision=cfg['modelRevision'],cache_dir=str(HERE/'model-cache'),allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']))
 write(OUT/'asr-runtime-model.private.json',{'atUTC':now(),'packageVersions':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'modelRepo':cfg['modelRepo'],'modelRevision':cfg['modelRevision'],'files':[{'name':str(p.relative_to(modelpath)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(modelpath.rglob('*'))if p.is_file()],'method':'ASR_ESTIMATES_NOT_PHONETIC_CERTIFICATION_OR_FORCED_ALIGNMENT'})
 model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
 for u,s,audio in generated():
  folder=OUT/u['id']/'asr';ledger=folder/'attempt.private.json';assert not ledger.exists(),'ASR invocation already reserved'
  state={'atUTC':now(),'state':'ASR_INVOCATION_RESERVED','invocations':1,'audioSha256':s['sha256']};write(ledger,state)
  try:
   segs,info=model.transcribe(str(audio),language='ar',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=False)
   rows=[];words=[]
   for seg in segs:
    ws=[{'segmentId':seg.id,'wordIndex':i,'word':w.word,'start':float(w.start),'end':float(w.end),'probability':float(w.probability)}for i,w in enumerate(seg.words or[])];words.extend(ws);rows.append({'id':seg.id,'start':seg.start,'end':seg.end,'text':seg.text,'words':ws})
   errors=[w for w in words if not 0<=w['start']<=w['end']<=s['audio']['durationSeconds']]
   write(folder/'word-timestamps.json',{'atUTC':now(),'unitId':u['id'],'audioSha256':s['sha256'],'audio':s['audio'],'segments':rows,'words':words,'wordCount':len(words),'boundsErrors':errors,'method':'ACTUAL_AUDIO_ASR_ESTIMATES_NOT_GUARANTEED_ALIGNMENT_OR_PRONUNCIATION','settings':cfg,'ownerListeningAccepted':False})
   state.update(state='ASR_RETURNED_RAW_WORDS_NOT_CORRECTED',completedUTC=now(),wordCount=len(words),boundsErrors=len(errors));write(ledger,state)
  except Exception as e:state.update(state='ASR_FAILED_NO_RETRY',errorType=type(e).__name__);write(ledger,state)
def summarize():
 r=request();rows=[]
 for u in r['units']:
  if u['generationDisposition']=='reuse':rows.append({'unitId':u['id'],'state':'IMMUTABLE_ACCEPTED_REUSE_NO_CALLS','reuse':u['reuse']});continue
  folder=OUT/u['id'];paths=[p for p in folder.rglob('*')if p.is_file()]if folder.exists()else[]
  rows.append({'unitId':u['id'],'state':read(folder/'tts-attempt.private.json')['state']if(folder/'tts-attempt.private.json').exists()else'NOT_ATTEMPTED','files':[{'path':str(p.relative_to(OUT)),'sha256':sha(p),'bytes':p.stat().st_size}for p in sorted(paths)],'ownerListeningAccepted':False})
 write(OUT/'batch-summary.private.json',{'atUTC':now(),'scope':r['scope'],'status':'CANDIDATES_AND_EXCEPTIONS_REQUIRE_REVIEW','units':rows,'noAutomaticRepair':True,'noRolloutAcceptance':True})
if __name__=='__main__':
 try:{'validate':validate,'produce':produce,'audit':audit,'verify-wheel':verify_wheel,'asr':asr,'summarize':summarize}[sys.argv[1]]()
 except Exception as e:
  write(OUT/(sys.argv[1]+'-failure.private.json'),{'atUTC':now(),'errorType':type(e).__name__,'status':'FAILED_NO_AUTOMATIC_RETRY','noSecretPayloadLogged':True});raise SystemExit('Bounded pilot phase failed; retain all valid outputs')from None
