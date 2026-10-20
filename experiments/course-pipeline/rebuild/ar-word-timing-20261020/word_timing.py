"""One bounded ASR-only run. Input artifact is data, never supplied executable code."""
from pathlib import Path
import hashlib,json,os,sys,datetime,urllib.request,urllib.error,zipfile,io,wave,importlib.metadata,platform,time,math
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'output'
def dump(name,x):
 OUT.mkdir(exist_ok=True)
 (OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest(path):
 h=hashlib.sha256()
 with path.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
req=json.loads((ROOT/'request.json').read_text(encoding='utf-8'))
if digest(ROOT/'request.json')!=os.environ.get('REQUEST_SHA'):raise SystemExit('Exact request hash mismatch')
if os.environ.get('GITHUB_RUN_ATTEMPT')!='1':raise SystemExit('Run attempt must be1')
def package_phase():
 wheels=list((ROOT/'wheels').glob('faster_whisper-1.2.1-*.whl'))
 if len(wheels)!=1 or digest(wheels[0])!=req['asr']['wheelSha256']:raise RuntimeError('Pinned wheel hash mismatch')
 dump('package-wheel.private.json',{'atUTC':now(),'name':wheels[0].name,'sha256':digest(wheels[0]),'version':req['asr']['version'],'primarySources':req['provenance']})
def api(path):
 token=os.environ.get('GH_TOKEN')
 if not token:raise RuntimeError('Required GitHub artifact token missing')
 r=urllib.request.Request('https://api.github.com/repos/'+req['source']['repository']+path,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 with urllib.request.urlopen(r,timeout=90)as p:return json.load(p)
def fetch_artifact():
 src=req['source'];run=api('/actions/runs/'+str(src['runId']))
 if run['head_sha']!=src['headSha']or run['run_attempt']!=src['expectedRunAttempt']or run['conclusion']!='success':raise RuntimeError('Source run provenance mismatch')
 listing=api('/actions/runs/'+str(src['runId'])+'/artifacts?per_page=100')
 artifacts=[a for a in listing['artifacts']if a['name']==src['artifactName']and not a['expired']]
 if len(artifacts)!=1:raise RuntimeError('Exact artifact missing/ambiguous/expired')
 art=artifacts[0]
 class NoRedirect(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,req,fp,code,msg,headers,newurl):return None
 headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
 download=urllib.request.Request(art['archive_download_url'],headers=headers)
 try:
  with urllib.request.build_opener(NoRedirect()).open(download,timeout=90)as response:blob=response.read(64*1024*1024+1)
 except urllib.error.HTTPError as e:
  if e.code not in(301,302,303,307,308):raise RuntimeError('Artifact downloadHTTP'+str(e.code))from None
  location=e.headers.get('Location','')
  if not location.startswith('https://'):raise RuntimeError('Artifact redirect notHTTPS')
  # Do not forward Authorization to signed blob host.
  with urllib.request.urlopen(urllib.request.Request(location),timeout=90)as response:blob=response.read(64*1024*1024+1)
 if len(blob)>64*1024*1024:raise RuntimeError('Artifact size exceeded')
 original=ROOT/'input';original.mkdir(exist_ok=True);matched={}
 with zipfile.ZipFile(io.BytesIO(blob))as z:
  for member in z.infolist():
   if member.is_dir()or not member.filename.lower().endswith('.wav'):continue
   if member.file_size>8*1024*1024:raise RuntimeError('Unexpected WAV size')
   raw=z.read(member);h=hashlib.sha256(raw).hexdigest()
   for clip in req['clips']:
    if h!=clip['sha256']:continue
    if clip['id']in matched:raise RuntimeError('Duplicate matchingWAV')
    dest=original/(clip['id']+'.wav');dest.write_bytes(raw)
    with wave.open(str(dest),'rb')as wav:
     duration=wav.getnframes()/wav.getframerate();meta={'sampleRate':wav.getframerate(),'frames':wav.getnframes(),'channels':wav.getnchannels(),'sampleWidthBytes':wav.getsampwidth()}
    if abs(duration-clip['durationSeconds'])>.002:raise RuntimeError('WAV duration differs')
    matched[clip['id']]={'artifactMember':member.filename,'sha256':h,'durationSeconds':duration,**meta}
 if set(matched)!={c['id']for c in req['clips']}:raise RuntimeError('Exact twoWAVhashes missing')
 dump('input-provenance.private.json',{'atUTC':now(),'sourceRun':{k:run[k]for k in ['id','head_sha','head_branch','run_attempt','conclusion']},'artifact':{k:art.get(k)for k in ['id','name','size_in_bytes','digest','created_at']},'zipSha256':hashlib.sha256(blob).hexdigest(),'clips':matched,'authorizationLogged':False})
 return original,matched
def transcribe():
 from faster_whisper import WhisperModel
 from huggingface_hub import HfApi,snapshot_download
 if importlib.metadata.version('faster-whisper')!=req['asr']['version']:raise RuntimeError('Installed version differs')
 original,matched=fetch_artifact();asr=req['asr'];modelinfo=HfApi().model_info(asr['modelRepo']);revision=modelinfo.sha
 if not revision or len(revision)!=40:raise RuntimeError('Model revision unresolved')
 modelpath=Path(snapshot_download(repo_id=asr['modelRepo'],revision=revision,cache_dir=str(ROOT/'model-cache'),allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']))
 files=[{'name':str(p.relative_to(modelpath)),'bytes':p.stat().st_size,'sha256':digest(p)}for p in sorted(modelpath.rglob('*'))if p.is_file()]
 if not any(p['name']=='model.bin'for p in files):raise RuntimeError('Smallmodel weights missing')
 dump('resolved-runtime-model.private.json',{'atUTC':now(),'packageVersions':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'python':sys.version,'platform':platform.platform(),'model':{'repository':asr['modelRepo'],'resolvedRevision':revision,'files':files,'multilingualSmall':True},'actualSettings':asr,'timingMethod':'ASR_ESTIMATED_NOT_GUARANTEED_FORCED_ALIGNMENT','humanListening':False,'workflow':{'runId':os.environ.get('GITHUB_RUN_ID'),'runAttempt':os.environ.get('GITHUB_RUN_ATTEMPT'),'headSha':os.environ.get('GITHUB_SHA')}})
 model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True);results=[]
 for clip in req['clips']:
  start=time.monotonic()
  segments,info=model.transcribe(str(original/(clip['id']+'.wav')),language='ar',word_timestamps=True,beam_size=5,vad_filter=False,condition_on_previous_text=False)
  rows=[];words=[]
  for s in segments:
   ws=[{'segmentId':s.id,'wordIndexInSegment':j,'word':w.word,'start':float(w.start),'end':float(w.end),'probability':float(w.probability)}for j,w in enumerate(s.words or[])]
   words.extend(ws);rows.append({'id':s.id,'start':float(s.start),'end':float(s.end),'text':s.text,'avgLogprob':s.avg_logprob,'noSpeechProbability':s.no_speech_prob,'words':ws})
  issues=[{'wordIndex':i,'issue':'nonfinite/negative/reversed/outsideWAV timestamp'}for i,w in enumerate(words)if not(math.isfinite(w['start'])and math.isfinite(w['end'])and 0<=w['start']<=w['end']<=matched[clip['id']]['durationSeconds']+.1)]
  dump(clip['id']+'-word-timestamps.json',{'clipId':clip['id'],'audio':matched[clip['id']],'atUTC':now(),'elapsedASRSeconds':time.monotonic()-start,'language':info.language,'languageProbability':info.language_probability,'method':'ASR_ESTIMATED_NOT_HUMAN_OR_GUARANTEED_FORCED_ALIGNMENT','settings':asr,'segments':rows,'words':words,'wordCount':len(words),'timestampIssues':issues,'unresolvedAnchorPolicy':'No fabricated/reallocated/proportional timing. Missing/mistranscribed anchors require review.','humanListening':False})
  results.append({'clipId':clip['id'],'wordCount':len(words),'timestampIssues':issues,'status':'ASR_WORDS_ESTIMATED_REVIEW_REQUIRED'if words else'NO_WORDS_UNRESOLVED'})
 dump('summary.private.json',{'atUTC':now(),'status':'ASR_ONLY_COMPLETE_REVIEW_REQUIRED','clips':results,'newSpeechCalls':0,'newImageCalls':0,'fullVideoRenders':0,'attempts':1,'notForcedAlignment':True,'noInventedAnchors':True})
if __name__=='__main__':
 try:
  if sys.argv[1]=='verify-wheel':package_phase()
  elif sys.argv[1]=='transcribe':transcribe()
  else:raise RuntimeError('Unknown action')
 except Exception as e:
  dump('failure.private.json',{'atUTC':now(),'status':'FAILED_NO_RETRY_NO_INVENTED_TIMING','type':type(e).__name__,'message':str(e)[:1200],'newSpeechCalls':0,'newImageCalls':0,'fullVideoRenders':0});raise
