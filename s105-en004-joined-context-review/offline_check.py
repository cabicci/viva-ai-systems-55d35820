from pathlib import Path
import base64,copy,importlib.util,json,os,shutil,socket,tempfile,urllib.request,urllib.error
import yaml
P=Path(__file__).resolve().parent
if os.name=='nt':P=Path(chr(92)*2+'?'+chr(92)+str(P).removeprefix(chr(92)*2+'?'+chr(92)))
def deny(*a,**k):raise AssertionError('Offline network denied')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('joined_worker',P/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w);r,t=w.validate();checks=[]
def ck(n,c=True):assert c,n;checks.append(n)
def reject(n,fn):
 try:fn()
 except(AssertionError,RuntimeError,FileExistsError,FileNotFoundError,KeyError,ValueError):checks.append(n);return
 raise AssertionError('Invalidfixtureaccepted '+n)
ck('AutomaticHTTPredirect disabled prevents extraPOSTorGET',w.NoRedirect().redirect_request(None,None,307,'',{},'https://example.invalid')is None)
ck('Exactly3existing7second contexts finite3POST0GET0TTS0ASR0retry',len(r['units'])==3 and r['maximumReviewPOSTCalls']==3)
ck('Prompt no expected source or allegeddefect guesses',all(x not in(P/r['promptPath']).read_text('utf-8')for x in ['matter','Ten points','Sampling bias','fertilizer','chuckle','25.05']))
for kind in ['budget','extra-unit','model','join','duration','candidate','wavhash','samplebounds']:
 alt=copy.deepcopy(r)
 if kind=='budget':alt['maximumReviewPOSTCalls']=4
 if kind=='extra-unit':alt['units'].append(copy.deepcopy(alt['units'][0]))
 if kind=='model':alt['model']='fallback'
 if kind=='join':alt['units'][0]['joinLocalSample']=72001
 if kind=='duration':alt['units'][0]['durationSeconds']=7.1
 if kind=='candidate':alt['candidateFullPcmSha256']='0'*64
 if kind=='wavhash':alt['units'][0]['wavSha256']='0'*64
 if kind=='samplebounds':alt['units'][0]['candidateSampleBounds'][0]+=1
 old=w.read;w.read=lambda p,alt=alt:old(p)if Path(p).name!='request.json'else alt;reject('Reject mutated '+kind,w.validate);w.read=old
root=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=P));savedout=w.OUT;savedactions=w.require_actions;env=dict(os.environ);calls=[];mode={'value':'valid'};active={'uid':None};valid={'transcript':'synthetic actualaudio fixture','uncertainWords':[],'findings':[],'overall':'uncertain','continuityObservations':'fixtureonly','limitations':'not humanapproval'}
class Response:
 def __init__(self,b):self.b=b
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return self.b
try:
 w.require_actions=lambda:None;os.environ['GITHUB_RUN_ID']='OFFLINE_ONLY';os.environ['GEMINI_API_KEY']='OFFLINE_SECRET_MUST_NOT_LOG';w.OUT=root/'success'
 def post(request,timeout):
  uid=active['uid'];u=next(x for x in r['units']if x['id']==uid);s=w.read(w.folder(uid)/'review-attempt.json');assert s['providerCallsStarted']==1 and s['state']=='ONLY_CONTEXT_POST_STARTED_OUTCOME_UNKNOWN';p=json.loads(request.data);assert set(p)=={'model','input','response_format','generation_config'}and len(p['input'])==2 and p['input'][0]['text']==(P/r['promptPath']).read_text('utf-8')and base64.b64decode(p['input'][1]['data'])==(P/u['path']).read_bytes()and p['model']=='gemini-4-argon'and p['generation_config']['thinking_level']=='high';calls.append(uid)
  if mode['value']=='http503':raise urllib.error.HTTPError('https://example.invalid',503,'OFFLINE_SECRET_MUST_NOT_LOG',None,None)
  if mode['value']=='empty':return Response(b'{"status":"completed","steps":[]}')
  result=copy.deepcopy(valid)
  if mode['value']=='invalid':result['findings']=[{'startSeconds':6.9,'endSeconds':7.1,'heardText':'fixture','observation':'fixture','certainty':'low'}]
  return Response(json.dumps({'model':'gemini-4-argon','steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
 w.urlopen=post;active['uid']=w.IDS[0];reject('No review before exact inputupload',lambda:w.review(w.IDS[0]));ck('ZeroPOST before upload',len(calls)==0)
 for i,uid in enumerate(w.IDS):w.uploaded(uid,str(i+1),'sha256:'+'a'*64)
 for uid in w.IDS:active['uid']=uid;w.review(uid);reject('Samecontext no second POST '+uid,lambda uid=uid:w.review(uid))
 w.summarize();ck('Successfulmock exactly1POST/context3total',calls==list(w.IDS));ck('Uncertain modelresult retained without adoption',not w.read(w.OUT/'summary.json')['candidateAdopted']);success=w.OUT
 w.OUT=root/'contentless-first';shutil.copytree(success,w.OUT)
 for uid in w.IDS:
  for p in w.folder(uid).glob('*'):
   if p.name!='upload-receipt.json':p.unlink()
 before=len(calls)
 for i,uid in enumerate(w.IDS):
  active['uid']=uid;mode['value']='empty'if i==0 else'valid'
  if i==0:reject('Contentless first fails sameaction once',lambda uid=uid:w.review(uid));ck('Contentless raw preserved',(w.folder(uid)/'response.raw.json').exists())
  else:w.review(uid)
 ck('Firstparsefailure doesnotblock other2contexts',calls[before:]==list(w.IDS));reject('Partialsummary mustfail',w.summarize);ck('Partialsummary retains2complete outcomes',sum(x['completeDiagnostic']for x in w.read(w.OUT/'summary.json')['rows'])==2);reject('Contentless cannotretry',lambda:w.review(w.IDS[0]));ck('No fourthPOST after repeat',len(calls)==before+3)
 w.OUT=root/'invalid-last';shutil.copytree(success,w.OUT);uid=w.IDS[-1];active['uid']=uid
 for p in w.folder(uid).glob('*'):
  if p.name!='upload-receipt.json':p.unlink()
 mode['value']='invalid';reject('Invalidlast timestamp fails currentaction',lambda:w.review(uid));ck('Invalid raw parsed and review retained',all((w.folder(uid)/n).exists()for n in ['response.raw.json','parsed-before-validation.json','review.json'])and w.read(w.folder(uid)/'review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY');reject('Invalidlast cannotpasssummary',w.summarize)
 w.OUT=root/'provider-unavailable';uid=w.IDS[0];active['uid']=uid;mode['value']='http503';w.uploaded(uid,'1','a'*64);before=len(calls);reject('HTTP503 storedwithoutretry',lambda:w.review(uid));w.uploaded(w.IDS[1],'2','a'*64);reject('Confirmedproviderfailure blocksremainingPOST',lambda:w.review(w.IDS[1]));ck('Only1call spentfor confirmedproviderfailure',len(calls)==before+1 and(w.OUT/'shared-provider-stop.json').exists());ck('No secret exception/header/body serialized',all('OFFLINE_SECRET_MUST_NOT_LOG'not in p.read_text('utf-8')for p in root.rglob('*.json')))
 w.require_actions=savedactions;event={'created':True,'before':'0'*40,'after':'a'*40,'ref':r['branch'],'repository':{'id':1272666418,'full_name':r['repository'],'private':False}};ep=root/'event.json';w.write(ep,event);ve={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','BRANCH_CREATED':'true','GITHUB_REPOSITORY':r['repository'],'GITHUB_REPOSITORY_ID':'1272666418','REPOSITORY_IS_PRIVATE':'false','GITHUB_REF':r['branch'],'GITHUB_EVENT_PATH':str(ep),'GITHUB_SHA':'a'*40,'REQUEST_SHA':w.sha(P/'request.json'),'WORKER_SHA':w.sha(P/'worker.py'),'FREEZE_SHA':w.sha(P/'freeze.json')};os.environ.update(ve);w.require_actions();ck('Exactsyntheticfirstpushgate')
 for k,v in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_EVENT_NAME','workflow_dispatch'),('GITHUB_REF','refs/heads/main'),('BRANCH_CREATED','false'),('REQUEST_SHA','0'*64),('WORKER_SHA','0'*64),('FREEZE_SHA','0'*64),('GITHUB_REPOSITORY_ID','0'),('REPOSITORY_IS_PRIVATE','true')]:os.environ[k]=v;reject('Reject '+k,w.require_actions);os.environ[k]=ve[k]
 event['before']='b'*40;w.write(ep,event);reject('Rejectsubsequentpush',w.require_actions)
 y=yaml.load((P/'s105-en004-joined-context-review.yml').read_text('utf-8'),Loader=yaml.BaseLoader);steps=y['jobs']['review']['steps'];ck('Exactworkflowenvpins',all(y['env'][k]==w.sha(P/n)for k,n in [('REQUEST_SHA','request.json'),('WORKER_SHA','worker.py'),('FREEZE_SHA','freeze.json')]));ck('Onefirstcreatedpushroute only',list(y['on'])==['push']);reviews=[i for i,s in enumerate(steps)if 'worker.py review' in s.get('run','')];uploads=[i for i,s in enumerate(steps)if s.get('id','').startswith('context')];ck('All3contextuploads precede all3reviews',len(reviews)==len(uploads)==3 and max(uploads)<min(reviews))
 for i in range(1,4):
  s=next(x for x in steps if x.get('id')=='review'+str(i));assert s['continue-on-error']=='true'and s['if'].startswith('always()')and 'steps.review'not in s['if']
 ck('Workflow isolatespercontext diagnosticfailure');ck('Upload/receipterrors isolate contexts',all(next(x for x in steps if x.get('id')==prefix+str(i)).get('continue-on-error')=='true'and next(x for x in steps if x.get('id')==prefix+str(i))['if'].startswith('always()')for i in range(1,4)for prefix in ['context','receipt']));ck('Terminalsummary always cannotmaskfailure',next(s for s in steps if 'worker.py summarize'in s.get('run',''))['if']=='always()');ck('Artifactnames exactcurrentprefix',all(s.get('with',{}).get('name','').startswith('s105-en004-joined-r1-')for s in steps if 'upload-artifact@'in s.get('uses','')));ck('Only3authorizedWAVs preservedunchanged',all(w.sha(P/u['path'])==u['wavSha256']for u in r['units']))
finally:
 os.environ.clear();os.environ.update(env);w.OUT=savedout;w.require_actions=savedactions;assert root.resolve().is_relative_to(P.resolve())and root.name.startswith('offline-fixture-');shutil.rmtree(root)
w.write(P/'offline-verification.json',{'status':'PASS_OFFLINE_THREE_CONTEXT_PCM_MAP_FIRSTPUSH_FINITE_POST_FAILURE_ISOLATION_TESTS','checks':checks,'testCount':len(checks),'networkDenied':True,'realProviderCalls':0,'productionLaunched':False,'actualInputAudioChanged':False});print(json.dumps({'tests':len(checks),'providerCalls':0}))
