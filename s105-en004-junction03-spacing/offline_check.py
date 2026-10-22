from pathlib import Path
import base64,copy,importlib.util,json,os,shutil,socket,tempfile,urllib.request,urllib.error,hashlib,wave
import yaml
P=Path(__file__).resolve().parent
if os.name=='nt':P=Path(chr(92)*2+'?'+chr(92)+str(P).removeprefix(chr(92)*2+'?'+chr(92)))
def deny(*a,**k):raise AssertionError('Offline network denied')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('spacing_worker',P/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w);r,t=w.validate();checks=[]
def ck(n,c=True):assert c,n;checks.append(n)
def reject(n,fn):
 try:fn()
 except(AssertionError,RuntimeError,FileExistsError,FileNotFoundError,KeyError,ValueError):checks.append(n);return
 raise AssertionError('Invalidfixtureaccepted '+n)
ck('Exactly1changed7.765scontext1POST0GET0TTS0ASR0retry',len(r['units'])==1 and r['maximumReviewPOSTCalls']==1)
ck('NoHTTPredirectorhiddencalls',w.NoRedirect().redirect_request(None,None,307,'',{},'https://example.invalid')is None)
ck('Neutralpromptnoreferencetranscriptorpriorallegation',all(s not in(P/r['promptPath']).read_text('utf-8')for s in ['change.','Sampling bias','slower','louder','765ms','needs_review:']))
proof=w.read(P/'candidate/pcm-proof.json')
with wave.open(proof['previousCandidatePath'],'rb')as f:old=f.readframes(f.getnframes())
with wave.open(proof['candidatePath'],'rb')as f:new=f.readframes(f.getnframes())
a=2090280*2;b=(2090280+18360)*2
ck('AllpreviousPCMbeforeinsertionbyteexact',new[:a]==old[:a]);ck('Exactly18360zeros',new[a:b]==bytes(36720));ck('AllpreviousPCMafterinsertionbyteexact',new[b:]==old[a:]);ck('Finalexact2320800samples',len(new)==4641600);ck('ContextexactchangedcandidatePCM',w.pcm_info(P/r['units'][0]['path'])==new[2018280*2:2204640*2])
for kind in ['budget','extra-unit','model','join','duration','candidate','wavhash','samplebounds','zeroscope']:
 alt=copy.deepcopy(r)
 if kind=='zeroscope':alt['units'][0]['explicitZeroLocalSampleBounds']=[72000,90361]
 if kind=='budget':alt['maximumReviewPOSTCalls']=2
 if kind=='extra-unit':alt['units'].append(copy.deepcopy(alt['units'][0]))
 if kind=='model':alt['model']='fallback'
 if kind=='join':alt['units'][0]['joinLocalSample']=90361
 if kind=='duration':alt['units'][0]['durationSeconds']=7.766
 if kind=='candidate':alt['candidateFullPcmSha256']='0'*64
 if kind=='wavhash':alt['units'][0]['wavSha256']='0'*64
 if kind=='samplebounds':alt['units'][0]['candidateSampleBounds'][0]+=1
 saved=w.read;w.read=lambda p,alt=alt:saved(p)if Path(p).name!='request.json'else alt;reject('Rejectmutated '+kind,w.validate);w.read=saved
root=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=P));savedout=w.OUT;savedactions=w.require_actions;env=dict(os.environ);calls=[];mode={'value':'valid'};uid=w.IDS[0];valid={'transcript':'synthetic fixture only','uncertainWords':[],'findings':[],'overall':'uncertain','continuityObservations':'fixture','limitations':'nohumanapproval'}
class Response:
 def __init__(self,b):self.b=b
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return self.b
try:
 w.require_actions=lambda:None;os.environ['GITHUB_RUN_ID']='OFFLINE_ONLY';os.environ['GEMINI_API_KEY']='OFFLINE_SECRET_MUST_NOT_LOG';w.OUT=root/'success'
 def post(request,timeout):
  s=w.read(w.folder(uid)/'review-attempt.json');assert s['providerCallsStarted']==1 and s['state']=='ONLY_CONTEXT_POST_STARTED_OUTCOME_UNKNOWN';p=json.loads(request.data);assert set(p)=={'model','input','response_format','generation_config'}and len(p['input'])==2 and p['input'][0]['text']==(P/r['promptPath']).read_text('utf-8')and base64.b64decode(p['input'][1]['data'])==(P/r['units'][0]['path']).read_bytes()and p['model']=='gemini-4-argon'and p['generation_config']['thinking_level']=='high';calls.append(uid)
  if mode['value']=='http503':raise urllib.error.HTTPError('https://example.invalid',503,'OFFLINE_SECRET_MUST_NOT_LOG',None,None)
  if mode['value']=='empty':return Response(b'{"status":"completed","steps":[]}')
  result=copy.deepcopy(valid)
  if mode['value']=='invalid':result['findings']=[{'startSeconds':7.7,'endSeconds':7.8,'heardText':'fixture','observation':'fixture','certainty':'low'}]
  return Response(json.dumps({'model':'gemini-4-argon','steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
 w.urlopen=post;reject('Noreviewbeforeinputupload',lambda:w.review(uid));ck('ZeroPOSTbeforeupload',not calls);w.uploaded(uid,'1','a'*64);w.review(uid);reject('No repeatedPOSTsamecontext',lambda:w.review(uid));w.summarize();ck('Exactly1POSTuncertainresultretainednoadoption',len(calls)==1 and not w.read(w.OUT/'summary.json')['candidateAdopted'])
 for case in ['empty','invalid','http503']:
  w.OUT=root/case;mode['value']=case;w.uploaded(uid,'1','a'*64);before=len(calls);reject('Failedcurrentactionpreserved '+case,lambda:w.review(uid));reject('Failedsummarycannotpass '+case,w.summarize);reject('Failedrequestcannotretry '+case,lambda:w.review(uid));ck('Exactly1POSTconsumed '+case,len(calls)==before+1)
  if case in ['empty','invalid']:ck('Rawresponsepreserved '+case,(w.folder(uid)/'response.raw.json').exists())
  if case=='invalid':ck('Parsedinvalidreviewpreserved',w.read(w.folder(uid)/'review.json')['invalidTimestampFindingIndexes']==[0])
  if case=='http503':ck('Providerfailurestoprecordpreserved',(w.OUT/'shared-provider-stop.json').exists())
 ck('Sanitizederrorrecordsneverexposecredential',all('OFFLINE_SECRET_MUST_NOT_LOG'not in p.read_text('utf-8')for p in root.rglob('*.json')))
 w.require_actions=savedactions;event={'created':True,'before':'0'*40,'after':'a'*40,'ref':r['branch'],'repository':{'id':1272666418,'full_name':r['repository'],'private':False}};ep=root/'event.json';w.write(ep,event);ve={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','BRANCH_CREATED':'true','GITHUB_REPOSITORY':r['repository'],'GITHUB_REPOSITORY_ID':'1272666418','REPOSITORY_IS_PRIVATE':'false','GITHUB_REF':r['branch'],'GITHUB_EVENT_PATH':str(ep),'GITHUB_SHA':'a'*40,'REQUEST_SHA':w.sha(P/'request.json'),'WORKER_SHA':w.sha(P/'worker.py'),'FREEZE_SHA':w.sha(P/'freeze.json')};os.environ.update(ve);w.require_actions();ck('Exactfirstcreatedpushgate')
 for k,v in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_EVENT_NAME','workflow_dispatch'),('GITHUB_REF','refs/heads/main'),('BRANCH_CREATED','false'),('REQUEST_SHA','0'*64),('WORKER_SHA','0'*64),('FREEZE_SHA','0'*64),('GITHUB_REPOSITORY_ID','0'),('REPOSITORY_IS_PRIVATE','true')]:os.environ[k]=v;reject('Reject '+k,w.require_actions);os.environ[k]=ve[k]
 event['before']='b'*40;w.write(ep,event);reject('Rejectsubsequentpush',w.require_actions)
 y=yaml.load((P/'s105-en004-junction03-spacing.yml').read_text('utf-8'),Loader=yaml.BaseLoader);steps=y['jobs']['review']['steps'];ck('Workflowexactpins',all(y['env'][k]==w.sha(P/n)for k,n in [('REQUEST_SHA','request.json'),('WORKER_SHA','worker.py'),('FREEZE_SHA','freeze.json')]));ck('Onlyfirstpushroute',list(y['on'])==['push']);reviews=[i for i,s in enumerate(steps)if'worker.py review'in s.get('run','')];uploads=[i for i,s in enumerate(steps)if s.get('id','').startswith('context')];ck('OneuploadbeforeonePOST',len(reviews)==len(uploads)==1 and max(uploads)<min(reviews));ck('Terminalsummaryalways',next(s for s in steps if'worker.py summarize'in s.get('run',''))['if']=='always()');ck('Exactspacingr2artifactnames',all(s.get('with',{}).get('name','').startswith('s105-en004-spacing-r2-')for s in steps if'upload-artifact@'in s.get('uses','')))
finally:
 os.environ.clear();os.environ.update(env);w.OUT=savedout;w.require_actions=savedactions;assert root.resolve().is_relative_to(P.resolve())and root.name.startswith('offline-fixture-');shutil.rmtree(root)
w.write(P/'offline-verification.json',{'status':'PASS_OFFLINE_CHANGED_CONTEXT_PCM_FINITE_CALL_FIRSTPUSH_FAILURE_GATES','checks':checks,'testCount':len(checks),'networkDenied':True,'realProviderCalls':0,'productionLaunched':False});print(json.dumps({'tests':len(checks),'providerCalls':0}))
