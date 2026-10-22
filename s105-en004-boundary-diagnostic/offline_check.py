from pathlib import Path
import ast,base64,copy,hashlib,importlib.util,json,os,shutil,socket,tempfile,urllib.request
import yaml
P=Path(__file__).resolve().parent
if os.name=='nt':P=Path(chr(92)*2+'?'+chr(92)+str(P).removeprefix(chr(92)*2+'?'+chr(92)))
def deny(*a,**k):raise AssertionError('Offline network denied')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('boundary_worker',P/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w);r,t,pcm=w.validate();checks=[]
def ck(n,c=True):assert c,n;checks.append(n)
def reject(n,fn):
 try:fn()
 except (AssertionError,RuntimeError,FileExistsError,FileNotFoundError,KeyError,ValueError):checks.append(n);return
 raise AssertionError('Invalid accepted '+n)
ck('Exact original frozen2295360PCM and explicit23–27s sample interval',len(pcm)==4590720 and r['firstSample']==552000 and r['endSampleExclusive']==648000)
ck('No expected words or RMS/ASR timing fed model',all(x not in (P/r['promptPath']).read_text('utf-8') for x in ['matter','Ten points','24.96','24.78']))
for kind in ['budget','firstSample','endSampleExclusive','model','sourceHash']:
 alt=copy.deepcopy(r)
 if kind=='budget':alt['maximumReviewCalls']=2
 if kind=='firstSample':alt['firstSample']=552001
 if kind=='endSampleExclusive':alt['endSampleExclusive']=648001
 if kind=='model':alt['model']='fallback'
 if kind=='sourceHash':alt['originalWavSha256']='0'*64
 saved=w.read;w.read=lambda p,alt=alt:saved(p)if Path(p).name!='request.json'else alt;reject('Reject altered '+kind,w.validate);w.read=saved
root=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=P));savedout=w.OUT;savedactions=w.require_actions;realenv=dict(os.environ);calls=[];responseMode={'kind':'valid'};w.require_actions=lambda:None
valid={'transcript':'previous utterance. next sentence','boundaryResolved':True,'previousUtteranceEndSeconds':1.7,'nextUtteranceStartSeconds':2.8,'plausibleQuietIntervalSeconds':[1.8,2.5],'observations':'offline fixture','uncertainty':'approximate','findings':[],'limitations':'not sample-perfect'}
class Response:
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return self.data
try:
 os.environ['GITHUB_RUN_ID']='OFFLINE_ONLY';os.environ['GEMINI_API_KEY']='OFFLINE_SECRET_MUST_NOT_LOG';w.OUT=root/'success';w.prepare();context,proof=w.checked_context();ck('Fixture derivedPCM exactslice and originalPCM unmodified',proof['excerptSamples']==96000 and proof['excerptPcmSha256']==hashlib.sha256(pcm[552000*2:648000*2]).hexdigest());reject('Prepare duplicate cannot overwrite',w.prepare);reject('No review before exact audio upload',w.review)
 def post(request,timeout):
  state=w.read(w.OUT/'review-attempt.json');assert state['providerCallsStarted']==1 and state['state']=='ONLY_REVIEW_STARTED_OUTCOME_UNKNOWN';body=json.loads(request.data);assert len(body['input'])==2 and body['input'][0]['text']==(P/r['promptPath']).read_text('utf-8');assert base64.b64decode(body['input'][1]['data'])==context.read_bytes();assert body['model']=='gemini-4-argon'and body['generation_config']['thinking_level']=='high';calls.append(1)
  if responseMode['kind']=='empty':return Response(b'{"steps":[]}')
  result=copy.deepcopy(valid)
  if responseMode['kind']=='invalid':result['nextUtteranceStartSeconds']=9
  if responseMode['kind']=='unresolved':result.update(boundaryResolved=False,previousUtteranceEndSeconds=None,nextUtteranceStartSeconds=None,plausibleQuietIntervalSeconds=None)
  return Response(json.dumps({'model':'gemini-4-argon','steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
 w.urlopen=post;w.uploaded('1234','sha256:'+'a'*64);w.review();w.summarize();ck('Only one POST ledgered and exact actualcontext attached',len(calls)==1);reject('Same operation cannot retry',w.review);ck('No second call after repeat',len(calls)==1)
 for mode in ['invalid','empty','unresolved']:
  responseMode['kind']=mode;w.OUT=root/mode;w.prepare();context,proof=w.checked_context();w.uploaded('1234','a'*64)
  if mode=='unresolved':w.review();w.summarize();ck('Unresolved boundary retained asnull, no selectedcut',w.read(w.OUT/'review.json')['selectedSpliceSample']is None and w.read(w.OUT/'review.json')['result']['boundaryResolved']is False)
  else:
   reject(mode+' currentreview fails',w.review);ck(mode+' raw retained and sanitized terminalfailure',(w.OUT/'response.raw.json').exists()and w.read(w.OUT/'review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY');reject(mode+' cannot passsummary',w.summarize);reject(mode+' cannotrepeat',w.review)
 ck('No credential text serialized',all('OFFLINE_SECRET_MUST_NOT_LOG'not in p.read_text('utf-8')for p in root.rglob('*.json')))
 w.require_actions=savedactions;event={'created':True,'before':'0'*40,'after':'a'*40,'ref':r['branch'],'repository':{'id':1272666418,'full_name':r['repository'],'private':False}};ep=root/'event.json';w.write(ep,event);env={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','BRANCH_CREATED':'true','GITHUB_REPOSITORY':r['repository'],'GITHUB_REPOSITORY_ID':'1272666418','REPOSITORY_IS_PRIVATE':'false','GITHUB_REF':r['branch'],'GITHUB_EVENT_PATH':str(ep),'GITHUB_SHA':'a'*40,'REQUEST_SHA':w.sha(P/'request.json'),'WORKER_SHA':w.sha(P/'worker.py'),'FREEZE_SHA':w.sha(P/'freeze.json')};os.environ.update(env);w.require_actions();ck('Exact syntheticfirstpushgate passes')
 for k,v in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_EVENT_NAME','workflow_dispatch'),('GITHUB_REF','refs/heads/main'),('REQUEST_SHA','0'*64),('WORKER_SHA','0'*64),('FREEZE_SHA','0'*64),('GITHUB_REPOSITORY_ID','0'),('REPOSITORY_IS_PRIVATE','true')]:os.environ[k]=v;reject('Reject '+k,w.require_actions);os.environ[k]=env[k]
 event['before']='b'*40;w.write(ep,event);reject('Reject subsequentbranchpush',w.require_actions)
 y=yaml.load((P/'s105-en004-boundary-diagnostic.yml').read_text('utf-8'),Loader=yaml.BaseLoader);steps=y['jobs']['review']['steps'];ck('Exact workflow request/worker/freeze pins',all(y['env'][k]==w.sha(P/n)for k,n in [('REQUEST_SHA','request.json'),('WORKER_SHA','worker.py'),('FREEZE_SHA','freeze.json')]));ck('Only one firstcreatedpush route',list(y['on'])==['push']);ck('One actualreview step and no generation/ASR',sum('worker.py review' in x.get('run','')for x in steps)==1 and not any('worker.py produce' in x.get('run','')or'worker.py asr' in x.get('run','')for x in steps));ck('Upload derivedcontext before model',next(i for i,x in enumerate(steps)if x.get('id')=='context')<next(i for i,x in enumerate(steps)if 'worker.py review' in x.get('run','')));ck('Summary alwaysfails invalid/missingoutcome',next(x for x in steps if 'worker.py summarize' in x.get('run',''))['if']=='always()')
finally:
 os.environ.clear();os.environ.update(realenv);w.OUT=savedout;w.require_actions=savedactions;assert root.resolve().is_relative_to(P.resolve())and root.name.startswith('offline-fixture-');shutil.rmtree(root)
w.write(P/'offline-verification.json',{'status':'PASS_OFFLINE_EXACT_PCM_CROP_FIRST_PUSH_ONE_REVIEW_AND_UNCERTAINTY_FAILURE_TESTS','checks':checks,'testCount':len(checks),'networkDenied':True,'realProviderCalls':0,'productionExcerptCreated':False,'productionLaunched':False});print(json.dumps({'tests':len(checks),'providerCalls':0}))
