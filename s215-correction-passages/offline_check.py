"""Offline finite-provider, partial-failure, source and first-push tests. No network."""
from pathlib import Path
import ast,base64,copy,hashlib,importlib.util,io,json,os,shutil,socket,sys,tempfile,types,urllib.request,wave
import yaml
P=Path(__file__).resolve().parent
def deny(*a,**k):raise AssertionError('Offline network forbidden')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('correction_worker',P/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
req,rt=w.validate();checks=[];actualOriginal={u['originalPath']:w.sha(P/u['originalPath']) for u in req['units']}
def check(name,condition=True):assert condition,name;checks.append(name)
def reject(name,fn):
 try:fn()
 except (AssertionError,FileExistsError,FileNotFoundError,RuntimeError,KeyError,ValueError):checks.append(name);return
 raise AssertionError('Invalid fixture accepted: '+name)
check('Exactly001/006/009 original roles Charon/Kore/Charon; finite3/3/3/2GET zero retry',len(req['units'])==3)
u=req['units'][1];check('Only approved N spoken expansion; visible source paragraph unchanged',u['spokenText']==u['sourcePassageBeforeCorrection'].replace('عن إن','عن عنصر النيتروجين') and u['displayText']==u['sourceBindings'][0]['text'])
check('001 exact36char sentence;009 complete203char source and quantities unchanged',len(req['units'][0]['spokenText'])==36 and len(req['units'][2]['spokenText'])==203)
check('No worked mean or assessment solution inserted in finite repair request','6.24' not in (P/'request.json').read_text('utf-8') and all(not u['assessmentSolutionsIncluded'] for u in req['units']))
check('Blind prompt has no expected repaired terms or numeric answers',not any(term in w.PROMPT for term in ['ثقتك','نيتروجين','اتنين','2.1','25','180']))
for mutation in ['voice','budget','scope','extra-unit','N-source-change','001-register-change','original-pcm']:
 altered=copy.deepcopy(req)
 if mutation=='voice':altered['units'][0]['voice']='Kore'
 if mutation=='budget':altered['maximumTTSCalls']=4
 if mutation=='scope':altered['scope']='ALL_COURSES'
 if mutation=='extra-unit':altered['units'].append(copy.deepcopy(altered['units'][0]))
 if mutation=='N-source-change':altered['units'][1]['displayText']='changed visible source'
 if mutation=='001-register-change':altered['units'][0]['spokenText']='different sentence'
 if mutation=='original-pcm':altered['units'][0]['originalAudio']['pcmSha256']='0'*64
 savedRead=w.read;w.read=lambda p,altered=altered:savedRead(p) if Path(p).name!='request.json' else altered
 reject('Reject altered '+mutation,w.validate);w.read=savedRead
ast.parse((P/'worker.py').read_text('utf-8'))
temp=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=P))
if os.name=='nt':temp=Path(chr(92)*2+'?'+chr(92)+str(temp.resolve()))
saved={n:getattr(w,n) for n in ['OUT','require_actions','provider_key','load_engine','verify_wheel']};version=w.importlib.metadata.version
memory=io.BytesIO()
with wave.open(memory,'wb') as f:f.setparams((1,2,24000,0,'NONE',''));f.writeframes(b'\0\0'*24000)
fakewav=memory.getvalue();calls={'tts':0,'review':0,'asr':0,'get':0};active={'unit':None,'invalidReview':False,'emptyReview':False,'failTTS':False}
class Response:
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return self.data
try:
 w.OUT=temp/'success';w.require_actions=lambda:None;w.provider_key=lambda:'OFFLINE_SECRET_MUST_NEVER_LOG'
 def request(url,key,payload=None,max_attempts=1):
  assert max_attempts==1
  if payload is None:
   calls['get']+=1;assert w.read(w.OUT/'model-preflight-attempt.json')['callsStarted'] in [1,2]
   return {'name':'models/'+url.rsplit('/',1)[1],'supportedGenerationMethods':['interactions']}
  uid=active['unit'];u=next(u for u in req['units'] if u['id']==uid);ledger=w.read(w.folder(uid)/'tts-attempt.json')
  assert ledger['state']=='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN' and ledger['providerCalls']==1
  assert payload['input'][0]['content'][0]=={'type':'text','text':u['spokenText'],'annotations':[{'type':'speech_metadata','style':u['delivery']}]}
  assert payload['generation_config']['speech_config']==[{'voice':u['voice']}]
  calls['tts']+=1
  if active['failTTS']:raise RuntimeError('OFFLINE_SECRET_MUST_NEVER_LOG')
  return {'steps':[{'type':'model_output','content':[{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(fakewav).decode()}]}]}
 def engine():
  e=saved['load_engine']();e.request_json=request;return e
 w.load_engine=engine;w.preflight();check('Two metadata GET calls have pre-invocation ledger and no fallback',calls['get']==2)
 w.analyze_originals();check('Original analysis is exact PCM bytes only; no invented quiet cut',all(x['approvedSpliceSampleBounds'] is None for x in w.read(w.OUT/'original-analysis.json')['rows']))
 active['unit']=w.IDS[0];reject('Missing preloaded ASR runtime stops first TTS before any provider',lambda:w.produce(w.IDS[0]));check('No TTS spent before runtime',calls['tts']==0)
 modelpath=temp/'pinned-model';modelpath.mkdir();(modelpath/'config.json').write_text('{}');(modelpath/'model.bin').write_bytes(b'offline-fixture-not-a-real-model')
 sys.modules['huggingface_hub']=types.SimpleNamespace(snapshot_download=lambda **k:str(modelpath))
 class Model:
  def __init__(self,*a,**k):assert k['local_files_only'] is True
  def transcribe(self,path,**k):
   assert k['language']=='ar' and k['word_timestamps'] and k['temperature']==0 and not k['vad_filter'] and not k['condition_on_previous_text'] and 'initial_prompt' not in k and 'hotwords' not in k
   uid=active['unit'];assert w.read(w.folder(uid)/'asr-attempt.json')['asrInvocations']==1;calls['asr']+=1
   word=types.SimpleNamespace(word=' synthetic',start=.1,end=.8,probability=.9);seg=types.SimpleNamespace(id=0,start=.1,end=.8,text='synthetic fixture',avg_logprob=-.1,no_speech_prob=.01,words=[word])
   return iter([seg]),types.SimpleNamespace(language='ar')
 sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=Model);w.importlib.metadata.version=lambda n:'1.2.1' if n=='faster-whisper' else version(n);w.verify_wheel=lambda:None
 w.prepare_asr_runtime();check('Pinned model loaded and hashed before TTS without speech ASR',calls['asr']==0 and w.read(w.OUT/'runtime-ready.json')['asrInvocations']==0)
 def review(request,timeout):
  body=json.loads(request.data);uid=active['unit'];u=next(u for u in req['units'] if u['id']==uid)
  assert body['input'][0]=={'type':'text','text':w.PROMPT} and len(body['input'])==3 and body['generation_config']['thinking_level']=='high'
  attached=[base64.b64decode(x['data']) for x in body['input'][1:]]
  assert attached[0]==fakewav and hashlib.sha256(attached[1]).hexdigest()==u['originalWavSha256']
  assert not any(x['spokenText'] in w.PROMPT for x in req['units'])
  assert w.read(w.folder(uid)/'blind-review-attempt.json')['providerCalls']==1;calls['review']+=1
  if active['emptyReview']:return Response(b'{"status":"completed","steps":[]}')
  result={'transcript':'synthetic fixture','uncertainWords':[],'findings':([{'startSeconds':8,'endSeconds':9}] if active['invalidReview'] else []),'overall':'uncertain','voiceComparison':{'uncertainty':'offline'},'limitations':'offline'}
  return Response(json.dumps({'model':'gemini-4-argon','steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
 urllib.request.urlopen=review
 for i,uid in enumerate(w.IDS):
  active['unit']=uid;w.produce(uid);reject(uid+' no diagnostics before WAV upload',lambda uid=uid:w.verified_audio(uid));w.uploaded(uid,str(1000+i),'sha256:'+'a'*64)
  reject(uid+' duplicate TTS has no second invocation',lambda uid=uid:w.produce(uid))
 check('All3 audio and immediate upload receipts exist before first review',calls['tts']==3 and calls['review']==calls['asr']==0 and all((w.folder(uid)/'voice.wav').exists() and (w.folder(uid)/'audio-upload-receipt.json').exists() for uid in w.IDS))
 for uid in w.IDS:
  active['unit']=uid;w.blind_review(uid);w.asr(uid);w.compare(uid)
  check(uid+' one actualNEW+ORIGINAL blind and independent unprompted Arabic ASR',w.read(w.folder(uid)/'asr-attempt.json')['asrInvocations']==1)
 w.summarize();check('Successful finite path is exactly3TTS3blind3ASR and2GET',calls=={'tts':3,'review':3,'asr':3,'get':2})
 check('No automatic integration, source PCM mutation or human approval',w.read(w.OUT/'summary.json')['assemblyPerformed'] is False and w.read(w.OUT/'summary.json')['humanListeningApproved'] is False)
 success=w.OUT
 def clone_without_review(name,uid):
  w.OUT=temp/name;shutil.copytree(success,w.OUT)
  for item in w.folder(uid).glob('*'):
   if item.name.startswith(('blind-review','asr','reference-comparison')):item.unlink()
 # Last-unit invalid review must fail CURRENT action and terminal summary, not pass after no later unit.
 uid=w.IDS[-1];active['unit']=uid;clone_without_review('invalid-last',uid);active['invalidReview']=True;before=calls.copy()
 reject('Last invalid timestamp stops current review',lambda:w.blind_review(uid));check('Invalid raw+parsed evidence preserved and attempt FAILED', (w.folder(uid)/'blind-review-response.raw.json').exists() and (w.folder(uid)/'blind-review.json').exists() and w.read(w.folder(uid)/'blind-review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
 w.asr(uid);check('One independent ASR remains available after failed review',calls['asr']==before['asr']+1 and calls['tts']==before['tts']);reject('Invalid last review prevents successful summary',w.summarize);check('Failed partial terminal summary is preserved',w.read(w.OUT/'summary.json')['status']=='FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY')
 active['invalidReview']=False;w.OUT=temp/'isolated-first-failure';shutil.copytree(success,w.OUT)
 for uid in w.IDS:
  for item in w.folder(uid).glob('*'):
   if item.name.startswith(('blind-review','asr','reference-comparison')):item.unlink()
 before=calls.copy()
 for i,uid in enumerate(w.IDS):
  active['unit']=uid;active['emptyReview']=i==0
  if i==0:reject('First completed review without content fails once and preserves raw',lambda uid=uid:w.blind_review(uid))
  else:w.blind_review(uid)
  w.asr(uid)
  if i==0:reject('First incomplete source comparison is preserved failed',lambda uid=uid:w.compare(uid))
  else:w.compare(uid)
 check('First review failure still permits other2 reviews and all3 independent ASRs exactly once',calls['review']-before['review']==3 and calls['asr']-before['asr']==3 and calls['tts']==before['tts'])
 check('All3 generated WAVs and initial upload receipts remain preserved after partial diagnostic failure',all((w.folder(uid)/'voice.wav').read_bytes()==fakewav and (w.folder(uid)/'audio-upload-receipt.json').exists() for uid in w.IDS))
 active['unit']=w.IDS[0];reject('Failed review same-unit operation cannot retry',lambda:w.blind_review(w.IDS[0]));check('No fourth review call after attempted same-operation repeat',calls['review']-before['review']==3)
 reject('Partial final diagnostic summary never passes or adopts',w.summarize);summary=w.read(w.OUT/'summary.json');check('Partial summary retains2complete units and first failed unit',sum(u['completeDiagnostics'] for u in summary['units'])==2 and all(u['audioPreserved'] for u in summary['units']) and summary['humanListeningApproved'] is False)
 active['emptyReview']=False;w.OUT=temp/'tts-failure';w.OUT.mkdir()
 for name in ['model-preflight-attempt.json','model-preflight.json','original-analysis.json','runtime-ready.json','runtime-setup-attempt.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
 active['failTTS']=True;active['unit']=w.IDS[0];reject('Provider exception is one failed TTS with no retry',lambda:w.produce(w.IDS[0]));reject('Unknown same-unit TTS cannot retry',lambda:w.produce(w.IDS[0]));active['failTTS']=False;active['unit']=w.IDS[1];w.produce(w.IDS[1]);check('Independent next TTS remains bounded and available after another unit failure',(w.folder(w.IDS[1])/'voice.wav').exists());reject('Failed unit has no review call without valid uploaded audio',lambda:w.blind_review(w.IDS[0]))
 check('Credential and exception text never serialized',all('OFFLINE_SECRET_MUST_NEVER_LOG' not in p.read_text('utf-8') for p in w.OUT.rglob('*.json')))
 w.OUT=temp/'runtime-failure';w.OUT.mkdir();active['failTTS']=False;w.importlib.metadata.version=lambda n:'0.0.0' if n=='faster-whisper' else version(n);before=calls.copy()
 reject('Unavailable pinned ASR package fails before any TTS',w.prepare_asr_runtime)
 check('Runtime setup failure preserves terminal FAILED state',w.read(w.OUT/'runtime-setup-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
 reject('Runtime failure blocks later direct provider reservation',lambda:w.reserve(w.IDS[0],'tts'))
 check('Runtime failure spends zero TTS review or ASR calls',calls==before)
 w.importlib.metadata.version=lambda n:'1.2.1' if n=='faster-whisper' else version(n)
 w.require_actions=saved['require_actions']
 event={'created':True,'before':'0'*40,'after':'a'*40,'ref':req['branch'],'repository':{'full_name':req['repository'],'id':req['repositoryId'],'private':False}};ep=temp/'event.json';w.write(ep,event);env=dict(os.environ)
 valid={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','BRANCH_CREATED':'true','GITHUB_REPOSITORY':req['repository'],'GITHUB_REPOSITORY_ID':'1272666418','REPOSITORY_IS_PRIVATE':'false','GITHUB_REF':req['branch'],'GITHUB_EVENT_PATH':str(ep),'GITHUB_SHA':'a'*40,'REQUEST_SHA':w.sha(P/'request.json'),'WORKER_SHA':w.sha(P/'worker.py'),'FREEZE_SHA':w.sha(P/'freeze.json')}
 try:
  os.environ.update(valid);w.require_actions();check('Exact synthetic first-created push passes gate only')
  for key,value in [('GITHUB_RUN_ATTEMPT','2'),('GITHUB_EVENT_NAME','workflow_dispatch'),('BRANCH_CREATED','false'),('GITHUB_REPOSITORY','wrong/repo'),('GITHUB_REPOSITORY_ID','0'),('REPOSITORY_IS_PRIVATE','true'),('GITHUB_REF','refs/heads/main'),('REQUEST_SHA','0'*64),('WORKER_SHA','0'*64),('FREEZE_SHA','0'*64)]:
   os.environ[key]=value;reject('Reject production '+key,w.require_actions);os.environ[key]=valid[key]
  bad=copy.deepcopy(event);bad['before']='b'*40;w.write(ep,bad);reject('Reject later branch push before field',w.require_actions);w.write(ep,event)
 finally:os.environ.clear();os.environ.update(env)
 y=yaml.load((P/'s215-correction-passages.yml').read_text('utf-8'),Loader=yaml.BaseLoader);check('Workflow has one first-push route only',list(y['on'])==['push'] and y['on']['push']['branches']==[req['branch'].removeprefix('refs/heads/')])
 steps=y['jobs']['repair']['steps'];tts=[i for i,s in enumerate(steps) if 'worker.py produce' in s.get('run','')];check('Exactly three TTS workflow steps',len(tts)==3)
 ready=next(i for i,s in enumerate(steps) if 'prepare-asr-runtime' in s.get('run',''));check('Runtime preparation precedes first paid TTS',ready<tts[0])
 reviews=[i for i,s in enumerate(steps) if 'worker.py blind-review' in s.get('run','')];check('All3 TTS steps precede every diagnostic review',max(tts)<min(reviews))
 for i in range(1,4):
  t=next(x for x in steps if x.get('id')=='tts'+str(i));r=next(x for x in steps if x.get('id')=='review'+str(i));a=next(x for x in steps if x.get('id')=='asr'+str(i))
  assert t['continue-on-error']==r['continue-on-error']==a['continue-on-error']=='true' and 'steps.review' not in a['if'] and r['if'].startswith('always()')
 check('Workflow isolates review/ASR errors by unit and operation')
 summaryStep=next(x for x in steps if 'python worker.py summarize' in x.get('run',''));check('Final summary always runs and cannot mask partial failure',summaryStep['if']=='always()' and 'continue-on-error' not in summaryStep)
 for uid in w.IDS:
  upload=next(i for i,s in enumerate(steps) if s.get('with',{}).get('name')=='s215-correction-r1-'+uid+'-audio');review=next(i for i,s in enumerate(steps) if 'worker.py blind-review --unit '+uid in s.get('run',''));check(uid+' exact Arabic artifact upload precedes blind/ASR',upload<review)
 names=[s.get('with',{}).get('name') for s in steps if 'upload-artifact@' in s.get('uses','')]
 check('Artifact names exact S215 correction prefix; no staleS101/foreign labels',all(n.startswith('s215-correction-r1-') for n in names) and 's215-correction-r1-complete-evidence' in names and 's101' not in (P/'s215-correction-passages.yml').read_text('utf-8'))
 check('Workflow request/worker/freeze env pins match exact package',all(y['env'][n]==w.sha(P/f) for n,f in [('REQUEST_SHA','request.json'),('WORKER_SHA','worker.py'),('FREEZE_SHA','freeze.json')]))
 for step in steps:
  if 'upload-artifact@' not in step.get('uses',''):continue
  for line in step['with']['path'].splitlines():
   rel=line.replace('${{ env.PACKAGE }}/','')
   if not rel.startswith('output/'):assert (P/rel).exists(),rel
 check('All declared static artifact paths exist and no quiet-window claim is inherited','quiet-window' not in (P/'s215-correction-passages.yml').read_text('utf-8'))
 check('Original three actual WAVs byte-identical after all offline mocks',all(w.sha(P/p)==h for p,h in actualOriginal.items()))
finally:
 for n,v in saved.items():setattr(w,n,v)
 w.importlib.metadata.version=version;urllib.request.urlopen=deny
 taskTemp=os.path.normcase(str(temp.resolve())).removeprefix(chr(92)*2+'?'+chr(92));taskBase=os.path.normcase(str(P.resolve())).removeprefix(chr(92)*2+'?'+chr(92))
 assert taskTemp.startswith(taskBase+os.sep) and temp.name.startswith('offline-fixture-');shutil.rmtree(temp)
report={'status':'PASS_OFFLINE_SOURCE_FREEZE_BUDGET_PARTIAL_FAILURE_AND_MOCKED_PROVIDER_TESTS','checks':checks,'testCount':len(checks),'networkDenied':True,'realProviderCalls':0,'actualOriginalPcmEdited':False,'productionLaunched':False,'successfulMockPath':{'tts':3,'blind':3,'asr':3,'metadataGET':2},'failureFixturesSeparateNoProductionBudgetSpent':True}
w.write(P/'offline-verification.json',report);print(json.dumps({'status':report['status'],'tests':len(checks),'realProviderCalls':0}))

