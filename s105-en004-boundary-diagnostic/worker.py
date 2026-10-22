"""One focused existing-audio boundary question. Standard-library Actions worker; no TTS/ASR/GET/retry."""
from pathlib import Path
import argparse,base64,datetime,hashlib,json,math,os,re,urllib.request,wave
HERE=Path(__file__).resolve().parent
if os.name=='nt':HERE=Path(chr(92)*2+'?'+chr(92)+str(HERE).removeprefix(chr(92)*2+'?'+chr(92)))
OUT=HERE/'output';REPO='cabicci/viva-ai-systems-55d35820';BRANCH='refs/heads/work/soil-s105-en004-boundary-diagnostic-20261022-r1'
FROZEN=['README.en.txt','request.json','runtime.json','owner-authority.json','expected-criteria.NOT-FOR-MODEL.json','provenance/prior-model-availability.json','provenance/prior-call-ledger.json','prompts/boundary.txt','inputs/original.wav','worker.py','offline_check.py','freeze_package.py']
urlopen=urllib.request.urlopen
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(p)
def exclusive(p,d):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('x',encoding='utf-8')as f:f.write(json.dumps(d,ensure_ascii=False,indent=2)+'\n');f.flush();os.fsync(f.fileno())
def validate():
 r,t,f=(read(HERE/n)for n in ['request.json','runtime.json','freeze.json']);assert set(f['sha256'])==set(FROZEN)
 for n,h in f['sha256'].items():
  p=(HERE/n).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozen preimage mismatch'
 assert r['scope']=='S105_EN004_ONE_EXISTING_CONTEXT_BOUNDARY_DIAGNOSTIC_ONLY'and r['repository']==REPO and r['repositoryId']==1272666418 and r['branch']==BRANCH
 assert(r['maximumReviewCalls'],r['maximumMetadataGETCalls'],r['ttsCalls'],r['asrCalls'],r['automaticRetries'],r['automaticReruns'])==(1,0,0,0,0,0)
 assert r['model']==t['model']=='gemini-4-argon'and r['thinkingLevel']==t['thinkingLevel']=='high'and t['endpoint']=='https://generativelanguage.googleapis.com/v1beta/interactions'
 assert r['inputPath']=='inputs/original.wav'and r['promptPath']=='prompts/boundary.txt'and sha(HERE/r['promptPath'])==r['promptSha256']
 assert r['originalWavSha256']=='4f3dc37ec63d818b543c43664413efd1afb7990065ae33e92b5a896d4204130a'and sha(HERE/r['inputPath'])==r['originalWavSha256']
 assert(r['originalSamples'],r['firstSample'],r['endSampleExclusive'],r['excerptSamples'],r['sampleRate'])==(2295360,552000,648000,96000,24000)and r['originalContextSeconds']==[23,27]and r['excerptDurationSeconds']==4.0
 assert not r['sourceTranscriptSuppliedToModel']and not r['splicePerformed']and not r['cutsApproved']
 assert t['metadataGETCalls']==0 and t['priorExactModelAvailabilityRun']==39816051691 and sha(HERE/'provenance/prior-model-availability.json')==t['priorAvailabilitySha256']
 meta=read(HERE/'provenance/prior-model-availability.json');assert meta['name']=='models/gemini-4-argon'and meta['supportedGenerationMethods']
 with wave.open(str(HERE/r['inputPath']),'rb')as w:
  assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(1,2,24000,2295360);pcm=w.readframes(w.getnframes())
 assert hashlib.sha256(pcm).hexdigest()==r['originalPcmSha256']=='79714fcbd13501eec3357c9eced58ce6865584c85af1e08df50b5c257bbc2cc7'
 return r,t,pcm

def require_actions():
 assert os.environ.get('GITHUB_ACTIONS')=='true'and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'and os.environ.get('GITHUB_EVENT_NAME')=='push'and os.environ.get('BRANCH_CREATED')=='true'
 assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418'and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'and os.environ.get('GITHUB_REF')==BRANCH
 e=read(os.environ['GITHUB_EVENT_PATH']);assert e['created']is True and e['before']=='0'*40 and e['after']==os.environ['GITHUB_SHA']and e['ref']==BRANCH and e['repository']['id']==1272666418 and e['repository']['full_name']==REPO and e['repository']['private']is False
 for n,k in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/n)==os.environ[k]

def prepare():
 require_actions();r,_,pcm=validate();exclusive(OUT/'prepare-attempt.json',{'state':'RESERVED_EXACT_PCM_CONTEXT_EXTRACTION_ONLY','atUTC':now(),'providerCalls':0});target=OUT/'context.wav';assert not target.exists();subset=pcm[r['firstSample']*2:r['endSampleExclusive']*2];assert len(subset)==192000
 with wave.open(str(target),'wb')as w:w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(subset)
 with wave.open(str(target),'rb')as w:assert w.getnframes()==96000 and w.readframes(w.getnframes())==subset
 exclusive(OUT/'context-proof.json',{'originalWavSha256':r['originalWavSha256'],'originalPcmSha256':r['originalPcmSha256'],'firstSourceSample':552000,'endSourceSampleExclusive':648000,'excerptSamples':96000,'durationSeconds':4.0,'excerptWavSha256':sha(target),'excerptPcmSha256':hashlib.sha256(subset).hexdigest(),'noOriginalAudioChanged':True,'noSpliceOrProcessing':True,'requestSha256':sha(HERE/'request.json')})
def checked_context():
 r,_,pcm=validate();p=OUT/'context.wav';proof=read(OUT/'context-proof.json');assert proof['requestSha256']==sha(HERE/'request.json')and proof['excerptWavSha256']==sha(p)
 with wave.open(str(p),'rb')as w:assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(1,2,24000,96000);assert w.readframes(w.getnframes())==pcm[552000*2:648000*2]
 return p,proof

def uploaded(aid,digest):
 require_actions();p,proof=checked_context();assert re.fullmatch('[1-9][0-9]*',aid)and re.fullmatch('(?:sha256:)?[0-9a-f]{64}',digest)
 exclusive(OUT/'audio-upload-receipt.json',{'artifactId':aid,'artifactDigest':digest,'audioSha256':sha(p),'githubRunId':os.environ['GITHUB_RUN_ID'],'beforeOnlyReview':True})

def validate_result(result):
 assert isinstance(result['transcript'],str)and result['transcript'].strip()and type(result['boundaryResolved'])is bool and isinstance(result['findings'],list)
 for k in ['previousUtteranceEndSeconds','nextUtteranceStartSeconds']:
  v=result[k];assert v is None or(type(v)in[int,float]and math.isfinite(v)and 0<=v<=4)
 a,b=result['previousUtteranceEndSeconds'],result['nextUtteranceStartSeconds'];interval=result['plausibleQuietIntervalSeconds']
 if result['boundaryResolved']:assert a is not None and b is not None and a<=b
 if interval is not None:
  assert isinstance(interval,list)and len(interval)==2 and all(type(v)in[int,float]and math.isfinite(v)for v in interval)and 0<=interval[0]<interval[1]<=4
  if result['boundaryResolved']:assert a<=interval[0]<interval[1]<=b
 for x in result['findings']:assert 0<=float(x['startSeconds'])<float(x['endSeconds'])<=4 and math.isfinite(float(x['startSeconds']))and math.isfinite(float(x['endSeconds']))
 for k in ['observations','uncertainty','limitations']:assert k in result

def review():
 require_actions();r,t,_=validate();p,proof=checked_context();upload=read(OUT/'audio-upload-receipt.json');assert upload['audioSha256']==sha(p)and upload['githubRunId']==os.environ['GITHUB_RUN_ID']and upload['beforeOnlyReview']
 attempt=OUT/'review-attempt.json';state={'state':'RESERVED_BEFORE_ONLY_REVIEW_NO_RETRY','atUTC':now(),'maximumReviewCalls':1,'providerCallsStarted':0,'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'audioSha256':sha(p),'githubRunId':os.environ['GITHUB_RUN_ID'],'ttsCalls':0,'asrCalls':0,'metadataGETCalls':0};exclusive(attempt,state)
 try:
  key=os.environ.get('GEMINI_API_KEY');assert key,'Required server credential unavailable';prompt=(HERE/r['promptPath']).read_text('utf-8');payload={'model':r['model'],'input':[{'type':'text','text':prompt},{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(p.read_bytes()).decode('ascii')}],'response_format':{'type':'text','mime_type':'application/json'},'generation_config':{'thinking_level':'high','max_output_tokens':32768}}
  write(OUT/'prompt-receipt.json',{'prompt':prompt,'promptSha256':r['promptSha256'],'audioSha256':sha(p),'originalContextSeconds':[23,27],'referenceTranscriptSupplied':False,'ASROrRMSExpectedCriteriaSupplied':False})
  data=json.dumps(payload).encode();assert len(data)<20000000;request=urllib.request.Request(t['endpoint'],data=data,headers={'x-goog-api-key':key,'Content-Type':'application/json'},method='POST');state.update(state='ONLY_REVIEW_STARTED_OUTCOME_UNKNOWN',providerCallsStarted=1,startedUTC=now());write(attempt,state)
  with urlopen(request,timeout=t['timeoutSeconds'])as response:raw=response.read()
  (OUT/'response.raw.json').write_bytes(raw);body=json.loads(raw);text='\n'.join(c.get('text','')for s in body.get('steps',[])if s.get('type')=='model_output'for c in s.get('content',[])if c.get('type')=='text');result=json.loads(text);write(OUT/'parsed-before-validation.json',result);validate_result(result)
  write(OUT/'review.json',{'audioSha256':sha(p),'originalWavSha256':r['originalWavSha256'],'sourceOffsetSeconds':23,'result':result,'allModelTimesApproximate':True,'selectedSpliceSample':None,'samplePerfectBoundaryCertified':False,'humanListeningApproved':False,'noOriginalAudioChanged':True});state.update(state='MODEL_BOUNDARY_DIAGNOSTIC_ONLY_ROOT_INTERPRETATION_REQUIRED',finishedUTC=now(),modelVersion=body.get('model'),usage=body.get('usage'));write(attempt,state)
 except Exception as e:
  state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY',errorType=type(e).__name__,httpStatus=getattr(e,'code',None),finishedUTC=now());write(attempt,state);raise RuntimeError('Only boundary review failed; raw evidence preserved, no retry')from None

def summarize():
 require_actions();validate();p=OUT/'review-attempt.json';state=read(p)if p.exists()else{'state':'NOT_INVOKED','providerCallsStarted':0};write(OUT/'summary.json',{'state':state['state'],'callsStarted':state['providerCallsStarted'],'maximumReviews':1,'ttsCalls':0,'asrCalls':0,'metadataGETCalls':0,'retries':0,'noCutChosen':True,'humanListeningApproved':False});assert state['state']=='MODEL_BOUNDARY_DIAGNOSTIC_ONLY_ROOT_INTERPRETATION_REQUIRED';validate_result(read(OUT/'review.json')['result'])
def main():
 p=argparse.ArgumentParser();p.add_argument('command',choices=['validate','prepare','uploaded','review','summarize']);p.add_argument('--artifact-id');p.add_argument('--artifact-digest');a=p.parse_args()
 try:
  if a.command=='validate':validate();print('Exact focused context source/freeze/budget PASS; zero provider calls')
  elif a.command=='uploaded':uploaded(a.artifact_id,a.artifact_digest)
  else:globals()[a.command]()
 except Exception as e:write(OUT/('failure-'+a.command+'.json'),{'operation':a.command,'errorType':type(e).__name__,'noAutomaticRetry':True,'secretBodyLogged':False});raise SystemExit('Bounded diagnostic failed; inspect preserved sanitized evidence; no retry')from None
if __name__=='__main__':main()
