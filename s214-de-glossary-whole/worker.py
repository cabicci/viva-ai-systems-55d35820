"""One original-PCM diagnostic. Actions-only single POST, no TTS/ASR/GET/retry/adoption."""
from pathlib import Path
import argparse,base64,datetime,hashlib,json,math,os,re,urllib.request,wave
HERE=Path(__file__).resolve().parent;OUT=HERE/'output';REPO='cabicci/viva-ai-systems-55d35820';BRANCH='refs/heads/work/soil-s214-de-glossary-whole-20261023-r1'
FROZEN=['README.en.txt', 'request.json', 'runtime.json', 'attempt-ledger.json', 'owner-authority.json', 'prompts/blind.txt', 'provenance/model-availability.json', 'provenance/context-proof.json', 'worker.py', 'offline_check.py', 'freeze_package.py', 'inputs/C01.wav']
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,msg,headers,newurl):return None
urlopen=urllib.request.build_opener(NoRedirect()).open
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8');tmp.replace(p)
def exclusive(p,d):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('x',encoding='utf-8')as f:f.write(json.dumps(d,ensure_ascii=False,indent=2)+'\n');f.flush();os.fsync(f.fileno())
def validate():
 r,t,f=(read(HERE/p)for p in ['request.json','runtime.json','freeze.json']);assert set(f['sha256'])==set(FROZEN)and len(FROZEN)==12
 for p,h in f['sha256'].items():assert(HERE/p).resolve().is_relative_to(HERE.resolve())and sha(HERE/p)==h
 assert r['scope']=='S214_DE_GLOSSARY_ONE_FIRST_WHOLE_CANDIDATE_UNHINTED_REVIEW'and r['repository']==REPO and r['repositoryId']==1272666418 and r['branch']==BRANCH
 assert(r['maximumReviewCalls'],r['ttsCalls'],r['asrCalls'],r['metadataGETCalls'],r['automaticRetries'],r['automaticReruns'])==(1,0,0,0,0,0)
 assert r['model']==t['model']=='gemini-4-argon'and t['endpoint']=='https://generativelanguage.googleapis.com/v1beta/interactions'and t['timeoutSeconds']==900
 assert r['promptPath']=='prompts/blind.txt'and sha(HERE/r['promptPath'])==r['promptSHA256']
 assert not any(r[k]for k in ['sourceTranscriptSuppliedToModel','allegedWordOrDefectSuppliedToModel','originalAudioModified','splicePerformed','automaticAdoption'])
 assert [c['id']for c in r['clips']]==['C01']
 for c in r['clips']:
  assert c['inputPath']=='inputs/'+c['id']+'.wav'and sha(HERE/c['inputPath'])==c['contextWavSHA256']
  with wave.open(str(HERE/c['inputPath']),'rb')as w:assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(1,2,24000,c['frames']);pcm=w.readframes(w.getnframes())
  assert hashlib.sha256(pcm).hexdigest()==c['contextPCMSHA256']and c['frames']==c['sourceEndSampleExclusive']-c['sourceFirstSample']and c['durationSeconds']==c['frames']/24000
  assert c['maximumAdditionalReviewCalls']==1 and c['priorIdenticalContextCalls']==0 and c['endsAtOriginalRecordingEnd']==(c['sourceEndSampleExclusive']==c['originalFrames'])
 assert sha(HERE/'provenance/model-availability.json')==t['priorAvailabilitySHA256'];m=read(HERE/'provenance/model-availability.json');assert m['name']=='models/gemini-4-argon'and m['supportedGenerationMethods']
 ledger=read(HERE/'attempt-ledger.json');assert all(c['priorIdenticalContextCalls']==c['newCallsStarted']==0 for c in ledger['clips'].values())and ledger['maximumReviewCalls']==1
 return r,t

def require_actions():
 assert os.environ.get('GITHUB_ACTIONS')=='true'and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'and os.environ.get('GITHUB_EVENT_NAME')=='push'and os.environ.get('BRANCH_CREATED')=='true'
 assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418'and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'and os.environ.get('GITHUB_REF')==BRANCH
 e=read(os.environ['GITHUB_EVENT_PATH']);assert e['created']is True and e['before']=='0'*40 and e['after']==os.environ['GITHUB_SHA']and e['ref']==BRANCH and e['repository']['id']==1272666418 and e['repository']['full_name']==REPO and e['repository']['private']is False
 for p,k in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/p)==os.environ[k]
def uploaded(aid,digest):
 require_actions();r,_=validate();assert re.fullmatch('[1-9][0-9]*',aid)and re.fullmatch('(?:sha256:)?[0-9a-fA-F]{64}',digest)
 exclusive(OUT/'audio-upload-receipt.json',{'artifactId':aid,'artifactDigest':digest,'audioSHA256ByClip':{c['id']:c['contextWavSHA256']for c in r['clips']},'run':os.environ['GITHUB_RUN_ID'],'beforeReview':True})

def review(clip_id):
 assert not(OUT/'shared-provider-stop.json').exists(),'Confirmed shared provider failure; no later context calls'
 require_actions();req,t=validate();assert clip_id in['C01'];r={**req,**next(c for c in req['clips']if c['id']==clip_id)};part=OUT/clip_id;upload=read(OUT/'audio-upload-receipt.json');assert upload['audioSHA256ByClip'][clip_id]==r['contextWavSHA256']and upload['run']==os.environ['GITHUB_RUN_ID']and upload['beforeReview']
 key=os.environ.get('GEMINI_API_KEY');assert key
 attempt=part/'review-attempt.json';state={'atUTC':now(),'state':'RESERVED_BEFORE_ONLY_CONTEXT_REVIEW_NO_RETRY','providerCallsStarted':0,'maximumReviewCalls':1,'maximumBatchReviewCalls':1,'TTS':0,'ASR':0,'GET':0,'requestSHA256':sha(HERE/'request.json'),'workerSHA256':sha(HERE/'worker.py'),'audioSHA256':r['contextWavSHA256'],'run':os.environ['GITHUB_RUN_ID']};exclusive(attempt,state)
 try:
  prompt=(HERE/r['promptPath']).read_text('utf-8')+' '+r['boundaryFact'];payload={'model':r['model'],'input':[{'type':'text','text':prompt},{'type':'audio','mime_type':'audio/wav','data':base64.b64encode((HERE/r['inputPath']).read_bytes()).decode('ascii')}],'response_format':{'type':'text','mime_type':'application/json'},'generation_config':{'thinking_level':'high','max_output_tokens':32768}}
  write(part/'prompt-receipt.json',{'prompt':prompt,'promptSHA256':hashlib.sha256(prompt.encode()).hexdigest(),'basePromptSHA256':r['promptSHA256'],'boundaryFact':r['boundaryFact'],'sourceTranscriptSupplied':False,'allegationSupplied':False,'audioSHA256':r['contextWavSHA256']})
  request=urllib.request.Request(t['endpoint'],data=json.dumps(payload).encode(),headers={'x-goog-api-key':key,'Content-Type':'application/json'},method='POST');state.update(state='ONLY_CONTEXT_REVIEW_STARTED_OUTCOME_UNKNOWN',providerCallsStarted=1,startedUTC=now());write(attempt,state)
  with urlopen(request,timeout=900)as response:raw=response.read()
  (part/'response.raw.json').write_bytes(raw);body=json.loads(raw);assert body['status']=='completed'and body['model']==r['model'];text='\n'.join(c.get('text','')for s in body.get('steps',[])if s.get('type')=='model_output'for c in s.get('content',[])if c.get('type')=='text');result=json.loads(text);write(part/'parsed-before-validation.json',result)
  assert isinstance(result['transcript'],str)and result['transcript'].strip()and isinstance(result['findings'],list)and result['overall']in['no_defect_detected','uncertain','needs_review']
  invalid=[i for i,finding in enumerate(result['findings'])if not(all(type(finding.get(k))in[int,float]and math.isfinite(finding[k])for k in ['startSeconds','endSeconds'])and 0<=finding['startSeconds']<finding['endSeconds']<=r['durationSeconds'])]
  write(part/'review.json',{'audioSHA256':r['contextWavSHA256'],'originalWavSHA256':r['originalWavSHA256'],'sourceOffsetSeconds':r['sourceOffsetSeconds'],'durationSeconds':r['durationSeconds'],'invalidTimestampFindingIndexes':invalid,'result':result,'allModelTimesApproximate':True,'humanListeningApproved':False,'diagnosticSourceUnmodified':True,'sourceOriginalFilesUnmodified':True,'sourceAudioKind':r['sourceAudioKind'],'repairOrAdoption':False});state.update(state='ACTUAL_CONTEXT_DIAGNOSTIC_ONLY_ROOT_INTERPRETATION_REQUIRED',finishedUTC=now(),returnedModel=body['model'],usage=body.get('usage'));write(attempt,state)
 except Exception as e:
  status=getattr(e,'code',None);state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY',finishedUTC=now(),errorType=type(e).__name__,httpStatus=status);write(attempt,state)
  if status in[301,302,303,307,308,401,403,404,429,500,502,503,504]:write(OUT/'shared-provider-stop.json',{'httpStatus':status,'scope':'No later context call after confirmed shared provider failure'})
  raise RuntimeError('Only context review failed; preserve raw evidence, no retry')from None
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('command',choices=['validate','uploaded','review']);p.add_argument('--clip',choices=['C01']);p.add_argument('--artifact-id');p.add_argument('--artifact-digest');a=p.parse_args()
 try:
  if a.command=='validate':validate();print('Exactsixcontexts/sourcefreeze/budget PASS;zero calls')
  elif a.command=='uploaded':uploaded(a.artifact_id,a.artifact_digest)
  else:review(a.clip)
 except Exception as e:
  if a.command!='validate':write(OUT/(a.clip or 'shared')/('failure-'+a.command+'.json'),{'atUTC':now(),'operation':a.command,'errorType':type(e).__name__,'noRetry':True,'secretPayloadLogged':False})
  raise SystemExit('Bounded diagnostic failed; inspect sanitized evidence; no retry')from None
