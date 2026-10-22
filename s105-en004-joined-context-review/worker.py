"""Exactly3existing joined-context actualaudio reviews;0TTS0ASR0GET0retry. Production invocation is Actions only."""
from pathlib import Path
import argparse,base64,datetime,hashlib,json,math,os,re,urllib.request,urllib.error,wave
HERE=Path(__file__).resolve().parent
if os.name=='nt':HERE=Path(chr(92)*2+'?'+chr(92)+str(HERE).removeprefix(chr(92)*2+'?'+chr(92)))
OUT=HERE/'output';REPO='cabicci/viva-ai-systems-55d35820';BRANCH='refs/heads/work/soil-s105-en004-joined-context-review-20261022-r1';IDS=('S1-05-en004-junction-r1-01','S1-05-en004-junction-r1-02','S1-05-en004-junction-r1-03')
FROZEN=['README.en.txt','request.json','runtime.json','owner-authority.json','prompts/blind-context.txt','expected-criteria.NOT-FOR-MODEL.json','provenance/prior-model-availability.json','provenance/pcm-source-map.json','provenance/cumulative-call-ledger.json','inputs/context-01.wav','inputs/context-02.wav','inputs/context-03.wav','worker.py','offline_check.py','freeze_package.py','cache-live-audit.json']
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,msg,headers,newurl):return None
urlopen=urllib.request.build_opener(NoRedirect()).open
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_bytes((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode());tmp.replace(p)
def exclusive(p,d):
 p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('xb')as f:f.write((json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode());f.flush();os.fsync(f.fileno())
def pcm_info(p):
 with wave.open(str(p),'rb')as w:assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes())==(1,2,24000,168000);pcm=w.readframes(w.getnframes());assert len(pcm)==336000
 return pcm

def validate():
 r,t,f=(read(HERE/n)for n in ['request.json','runtime.json','freeze.json']);assert set(f['sha256'])==set(FROZEN)and len(FROZEN)==16
 for n,h in f['sha256'].items():
  p=(HERE/n).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozenpreimage mismatch'
 assert r['scope']=='S105_EN004_EXACT_THREE_JOINED_CONTEXTS_BLIND_ACTUAL_AUDIO_ONLY'and(r['repository'],r['repositoryId'],r['branch'])==(REPO,1272666418,BRANCH)
 assert(r['maximumReviewPOSTCalls'],r['maximumMetadataGETCalls'],r['ttsCalls'],r['asrCalls'],r['automaticRetries'],r['automaticReruns'])==(3,0,0,0,0,0)
 assert r['model']==t['model']=='gemini-4-argon'and r['thinkingLevel']==t['thinkingLevel']=='high'and t['endpoint']=='https://generativelanguage.googleapis.com/v1beta/interactions'
 assert t['maximumReviewPOSTCalls']==3 and t['maximumMetadataGETCalls']==0 and t['automaticRetries']==0 and not t['silentFallbackAllowed']and t['noFreshAvailabilityClaim']
 assert r['candidateFullWavSha256']=='fb838ce45702a52724ad05c7174d686419ed65f2bd00bda6b718cc633a3073bc'and r['candidateFullPcmSha256']=='e4851837c2ca6b79859164f79687d36f50175acd277933335483d225b1abdca9'and r['candidateSamples']==2302440
 assert r['sampleRate']==24000 and r['promptPath']=='prompts/blind-context.txt'and sha(HERE/r['promptPath'])==r['promptSha256']and not r['expectedTranscriptSuppliedToModel']and not r['adoptionApproved']
 assert sha(HERE/'provenance/prior-model-availability.json')==t['priorAvailabilitySha256'];meta=read(HERE/'provenance/prior-model-availability.json');assert meta['name']=='models/gemini-4-argon'and meta['supportedGenerationMethods']
 assert tuple(u['id']for u in r['units'])==IDS and len(r['units'])==3
 assert r['sourceMap']=='provenance/pcm-source-map.json'and sha(HERE/r['sourceMap'])==r['sourceMapSha256'];m=read(HERE/r['sourceMap']);assert m['candidateWavSha256']==r['candidateFullWavSha256']and m['candidatePcmSha256']==r['candidateFullPcmSha256']and m['originalWavSha256']=='4f3dc37ec63d818b543c43664413efd1afb7990065ae33e92b5a896d4204130a'
 hashes=['a90d4b29526dc5591dfde79c98de4f7ed44afb0b4afcad1efef29986fbaafdd2','739543aa18936a25c3afd7d9fa939e612455a2e2361153b57655303504f8752a','729991dfdeafec2890c02428b405f97c662a492280713cd3ed7d48972cabb8f6']
 for i,u in enumerate(r['units']):
  assert u['path']==f'inputs/context-{i+1:02d}.wav'and u['wavSha256']==sha(HERE/u['path'])==hashes[i]
  assert(u['samples'],u['durationSeconds'],u['joinLocalSample'],u['joinLocalSeconds'],u['maximumReviewPOSTCalls'])==(168000,7.0,72000,3.0,1)
  pcm=pcm_info(HERE/u['path']);assert hashlib.sha256(pcm).hexdigest()==u['pcmSha256'];mapping=next(x for x in m['contextMaps']if x['unitId']==u['id']);assert mapping['wavSha256']==u['wavSha256']and mapping['pcmSha256']==u['pcmSha256']and mapping['candidateSampleBounds']==u['candidateSampleBounds']and mapping['contextLocalJoinSample']==72000
  cursor=0
  for part in mapping['parts']:
   start,end=part['contextLocalSampleBounds'];assert start==cursor and start<end<=168000;assert hashlib.sha256(pcm[start*2:end*2]).hexdigest()==part['pcmSha256'];cursor=end
  assert cursor==168000
 assert sorted(p.relative_to(HERE).as_posix()for p in(HERE/'inputs').glob('*.wav'))==sorted(u['path']for u in r['units'])
 if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
 return r,t

def require_actions():
 assert os.environ.get('GITHUB_ACTIONS')=='true'and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'and os.environ.get('GITHUB_EVENT_NAME')=='push'and os.environ.get('BRANCH_CREATED')=='true'
 assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418'and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'and os.environ.get('GITHUB_REF')==BRANCH
 e=read(os.environ['GITHUB_EVENT_PATH']);assert e['created']is True and e['before']=='0'*40 and e['after']==os.environ['GITHUB_SHA']and e['ref']==BRANCH and e['repository']['id']==1272666418 and e['repository']['full_name']==REPO and e['repository']['private']is False
 for n,k in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/n)==os.environ[k]

def selected(uid):
 r,t=validate();assert uid in IDS;return r,t,next(u for u in r['units']if u['id']==uid)
def folder(uid):assert uid in IDS;return OUT/uid

def uploaded(uid,aid,digest):
 require_actions();_,_,u=selected(uid);assert re.fullmatch('[1-9][0-9]*',aid)and re.fullmatch('(?:sha256:)?[0-9a-f]{64}',digest)
 exclusive(folder(uid)/'upload-receipt.json',{'atUTC':now(),'artifactId':aid,'artifactDigest':digest,'audioSha256':u['wavSha256'],'githubRunId':os.environ['GITHUB_RUN_ID'],'beforeReview':True})

def validate_result(result):
 assert isinstance(result['transcript'],str)and result['transcript'].strip()and isinstance(result['uncertainWords'],list)and isinstance(result['findings'],list)
 assert result['overall']in['needs_review','uncertain','no_defect_detected']and'continuityObservations'in result and'limitations'in result
 invalid=[]
 for i,x in enumerate(result['findings']):
  try:
   a,b=float(x['startSeconds']),float(x['endSeconds']);assert math.isfinite(a)and math.isfinite(b)and 0<=a<b<=7
  except(KeyError,TypeError,ValueError,AssertionError):invalid.append(i)
 return invalid

def review(uid):
 require_actions();r,t,u=selected(uid);assert not(OUT/'shared-provider-stop.json').exists(),'Confirmed shared provider/config failure; no further authorized POST'
 upload=read(folder(uid)/'upload-receipt.json');assert upload['audioSha256']==u['wavSha256']and upload['githubRunId']==os.environ['GITHUB_RUN_ID']and upload['beforeReview']
 assert len(list(OUT.glob('*/review-attempt.json')))<3,'Maximum3contextPOST reservations';attempt=folder(uid)/'review-attempt.json';state={'state':'RESERVED_BEFORE_ONLY_CONTEXT_POST_NO_RETRY','atUTC':now(),'maximumForUnit':1,'maximumForBatch':3,'providerCallsStarted':0,'unitId':uid,'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'audioSha256':u['wavSha256'],'githubRunId':os.environ['GITHUB_RUN_ID'],'ttsCalls':0,'asrCalls':0,'metadataGETCalls':0};exclusive(attempt,state)
 try:
  key=os.environ.get('GEMINI_API_KEY')
  if not key:write(OUT/'shared-provider-stop.json',{'state':'REQUIRED_CREDENTIAL_UNAVAILABLE_ZERO_POST','unitId':uid});raise RuntimeError('Required credential unavailable')
  prompt=(HERE/r['promptPath']).read_text('utf-8');payload={'model':r['model'],'input':[{'type':'text','text':prompt},{'type':'audio','mime_type':'audio/wav','data':base64.b64encode((HERE/u['path']).read_bytes()).decode('ascii')}],'response_format':{'type':'text','mime_type':'application/json'},'generation_config':{'thinking_level':'high','max_output_tokens':32768}}
  write(folder(uid)/'prompt-receipt.json',{'prompt':prompt,'promptSha256':r['promptSha256'],'audioSha256':u['wavSha256'],'joinLocalSeconds':3.0,'referenceTranscriptSupplied':False,'sourceMapOrExpectedCriteriaSupplied':False})
  data=json.dumps(payload).encode();assert len(data)<20000000;request=urllib.request.Request(t['endpoint'],data=data,headers={'x-goog-api-key':key,'Content-Type':'application/json'},method='POST');state.update(state='ONLY_CONTEXT_POST_STARTED_OUTCOME_UNKNOWN',providerCallsStarted=1,startedUTC=now());write(attempt,state)
  with urlopen(request,timeout=t['timeoutSeconds'])as response:raw=response.read()
  (folder(uid)/'response.raw.json').write_bytes(raw);body=json.loads(raw);text='\n'.join(c.get('text','')for s in body.get('steps',[])if s.get('type')=='model_output'for c in s.get('content',[])if c.get('type')=='text');result=json.loads(text);write(folder(uid)/'parsed-before-validation.json',result);invalid=validate_result(result)
  write(folder(uid)/'review.json',{'audioSha256':u['wavSha256'],'candidateFullWavSha256':r['candidateFullWavSha256'],'candidateSampleBounds':u['candidateSampleBounds'],'result':result,'invalidTimestampFindingIndexes':invalid,'modelTimingApproximate':True,'humanListeningApproved':False,'integrationApproved':False,'noAudioChanged':True});assert not invalid,'Invalid finding times preserved; currentaction fails'
  state.update(state='ACTUAL_CONTEXT_DIAGNOSTIC_ONLY_ROOT_REVIEW_REQUIRED',finishedUTC=now(),modelVersion=body.get('model'),usage=body.get('usage'));write(attempt,state)
 except Exception as e:
  code=getattr(e,'code',None)
  if code in[301,302,303,307,308,401,403,404,429,500,502,503,504]:write(OUT/'shared-provider-stop.json',{'state':'CONFIRMED_PROVIDER_HTTP_FAILURE_STOP_REMAINING_CONTEXTS','httpStatus':code,'unitId':uid})
  state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY',errorType=type(e).__name__,httpStatus=code,finishedUTC=now());write(attempt,state);raise RuntimeError('Only contextreview failed; preservedevidence, no retry')from None

def summarize():
 require_actions();validate();rows=[];failed=False
 for uid in IDS:
  p=folder(uid)/'review-attempt.json';s=read(p)if p.exists()else{'state':'NOT_INVOKED','providerCallsStarted':0};row={'unitId':uid,'state':s['state'],'providerCallsStarted':s['providerCallsStarted'],'completeDiagnostic':False}
  try:
   result=read(folder(uid)/'review.json');assert s['state']=='ACTUAL_CONTEXT_DIAGNOSTIC_ONLY_ROOT_REVIEW_REQUIRED'and not validate_result(result['result'])and not result['invalidTimestampFindingIndexes'];row['completeDiagnostic']=True
  except(Exception):failed=True
  rows.append(row)
 calls=sum(x['providerCallsStarted']for x in rows);assert calls<=3;write(OUT/'summary.json',{'state':'FAILED_OR_PARTIAL_CONTEXTS_PRESERVED_NO_RETRY'if failed else'ALL_THREE_ACTUAL_CONTEXT_DIAGNOSTICS_COMPLETE_NOT_ADOPTED','rows':rows,'callsStarted':calls,'maximumPOST':3,'ttsCalls':0,'asrCalls':0,'metadataGETCalls':0,'retries':0,'candidateAdopted':False,'humanListeningApproved':False});assert not failed,'Missing/failed/invalid diagnostic cannot yield successfulsummary'

def main():
 p=argparse.ArgumentParser();p.add_argument('command',choices=['validate','uploaded','review','summarize']);p.add_argument('--unit',choices=IDS);p.add_argument('--artifact-id');p.add_argument('--artifact-digest');a=p.parse_args()
 try:
  if a.command=='validate':validate();print('Exactly3frozenactualcontextWAVs/sourcePCMmaps/finitePOSTbudget PASS;0calls')
  elif a.command=='uploaded':uploaded(a.unit,a.artifact_id,a.artifact_digest)
  elif a.command=='review':review(a.unit)
  else:summarize()
 except Exception as e:write((folder(a.unit)if a.unit else OUT)/('failure-'+a.command+'.json'),{'operation':a.command,'unitId':a.unit,'errorType':type(e).__name__,'noRetry':True,'secretPayloadLogged':False});raise SystemExit('Bounded actualcontextreview failed; inspect preservedsanitized evidence; no retry')from None
if __name__=='__main__':main()
