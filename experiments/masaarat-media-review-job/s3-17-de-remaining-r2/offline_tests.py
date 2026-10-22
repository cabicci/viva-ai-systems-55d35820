from pathlib import Path
import json,hashlib,datetime,importlib.util,copy,os,tempfile,yaml
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('bounded_de',HERE/'worker.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
tests=[]
def test(name,fn):
 try:fn();tests.append({'name':name,'pass':True})
 except Exception as e:tests.append({'name':name,'pass':False,'errorType':type(e).__name__,'reason':str(e)})
def rejects(fn):
 try:fn()
 except(AssertionError,KeyError,FileExistsError,ValueError,FileNotFoundError):return
 raise AssertionError('Unexpectedly allowed')
req,runtime=w.validate();ids=[u['id']for u in req['units']];test('Exact seven source-complete unchanged German unit objects and fingerprints validate',lambda:None)
prior=HERE.parent/'narration-r2';old=w.read(prior/'request.json');selected=[u for u in old['units']if u['id']in ids]
assert selected==req['units'];test('Seven complete unit objects byte-canonical equal frozen r2, including voice/delivery/quantities/conditions/negations',lambda:None)
pres=w.read(HERE/'prior-run-preservation.private.json')
for path,digest in pres['frozenOriginalPins'].items():assert w.sha(path)==digest
for uid,pin in pres['existingWavs'].items():assert uid not in ids and w.sha(pin['path'])==pin['sha256']
assert len(pres['existingWavs'])==61;test('All61 existing WAV originals and frozen r2 preimages preserved, DE010 excluded',lambda:None)
for uid in ['S3-17-de-r1-010','S3-17-de-r1-001','S3-17-en-r1-011','S3-17-ar-EG-r1-011','S3-17-it-r1-011']:test('Reject nonremaining unit '+uid,lambda uid=uid:rejects(lambda:w.selected(uid)))
read=w.read

def wrong(key,value):
 bad=copy.deepcopy(req);bad[key]=value;w.read=lambda path:bad if Path(path)==HERE/'request.json'else read(path)
 try:rejects(w.validate)
 finally:w.read=read
for key,value in [('maximumTTSCalls',8),('maximumBlindAudioReviewCalls',8),('maximumASRInvocations',8),('maximumMetadataGETs',3),('automaticRetries',1),('model','gemini-2.5-flash-preview-tts'),('quizSolutionsIncludedBeforeAttempt',True),('units',req['units']+[old['units'][0]])]:test('Reject changed request '+key,lambda key=key,value=value:wrong(key,value))
for i,u in enumerate(req['units']):
 bad=copy.deepcopy(req);bad['units'][i]['spokenText']+=' Changed condition.'
 def check(bad=bad):
  w.read=lambda path:bad if Path(path)==HERE/'request.json'else read(path)
  try:rejects(w.validate)
  finally:w.read=read
 test('Reject changed full unit object '+u['id'],check)
event={'ref':w.EXPECTED_REF,'created':True,'deleted':False,'forced':False,'before':'0'*40,'after':'a'*40,'repository':{'full_name':w.EXPECTED_REPOSITORY,'id':w.EXPECTED_REPOSITORY_ID,'private':False,'fork':False}}
env={'GITHUB_ACTIONS':'true','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'push','GITHUB_REPOSITORY':w.EXPECTED_REPOSITORY,'GITHUB_REPOSITORY_ID':str(w.EXPECTED_REPOSITORY_ID),'GITHUB_REF':w.EXPECTED_REF,'GITHUB_REF_TYPE':'branch','GITHUB_SHA':'a'*40}
test('Exact synthetic first creation push allowed without running provider',lambda:w.validate_trigger(event,env))
for key,value in [('GITHUB_ACTIONS','false'),('GITHUB_RUN_ATTEMPT','2'),('GITHUB_EVENT_NAME','workflow_dispatch'),('GITHUB_REPOSITORY','other/repo'),('GITHUB_REPOSITORY_ID','0'),('GITHUB_REF','refs/heads/main'),('GITHUB_REF_TYPE','tag'),('GITHUB_SHA','b'*40)]:
 bad={**env,key:value};test('Reject trigger '+key,lambda bad=bad:rejects(lambda:w.validate_trigger(event,bad)))
for key,value in [('created',False),('deleted',True),('forced',True),('before','b'*40),('after','b'*40),('ref','refs/heads/main')]:
 bad={**event,key:value};test('Reject event '+key,lambda bad=bad:rejects(lambda:w.validate_trigger(bad,env)))
fixtures=HERE/'offline-fixtures';fixtures.mkdir(exist_ok=True);fixtures=Path('\\\\?\\'+str(fixtures.resolve()))if os.name=='nt'else fixtures
with tempfile.TemporaryDirectory(dir=fixtures)as td:
 saved=w.OUT;w.OUT=Path(td)
 try:
  for kind in['tts','blind-review','asr']:
   for uid in ids:
    p,entry=w.reserve(uid,kind);assert entry['callsReserved']==1 and entry['maximumCallsForBatch']==7
   test('Exhausted synthetic '+kind+' budget denies more reservation',lambda kind=kind:rejects(lambda:w.reserve(ids[0],kind)))
 finally:w.OUT=saved
forbid={'quiz','writtenTasks','answers','answerIndex','correctAnswer','feedback','passChecks','rubric','privateAssessment'}
def inspect(v):
 if isinstance(v,dict):assert not(set(v)&forbid);[inspect(x)for x in v.values()]
 elif isinstance(v,list):[inspect(x)for x in v]
 elif isinstance(v,str):assert'D:\\Masaarat'not in v and'C:\\Users'not in v
for rel in w.read(HERE/'freeze.json')['sha256']:
 if rel.endswith('.json'):inspect(w.read(HERE/rel))
test('Safe teaching projections exclude private assessment bodies and workstation paths',lambda:None)
y=yaml.load((HERE/'s3-17-de-remaining-r2.yml').read_text('utf-8'),Loader=yaml.BaseLoader);assert list(y['on'])==['push']and y['on']['push']['branches']==['work/soil-s317-de-remaining-20261022-r2'];steps=y['jobs']['narration']['steps'];producers=[s for s in steps if s.get('name','').startswith('One TTS attempt')];assert len(producers)==7 and all(uid in str(s)for uid,s in zip(ids,producers));assert all('produce --unit '+uid not in(HERE/'s3-17-de-remaining-r2.yml').read_text()for uid in w.read(HERE/'subset-provenance.json')['excludedPreviouslyGeneratedUnitIds']);test('Workflow produces only seven missing IDs, no prior61 unit dispatch',lambda:None)
assert y['env']['REQUEST_SHA']==w.sha(HERE/'request.json')and y['env']['WORKER_SHA']==w.sha(HERE/'worker.py')and y['env']['FREEZE_SHA']==w.sha(HERE/'freeze.json');test('Workflow exact request/worker/freeze hashes match',lambda:None)
# TTS/upload phase order is a production requirement, not just a naming assertion.
tts_indexes=[i for i,s in enumerate(steps)if s.get('name','').startswith('One TTS attempt')];diag_indexes=[i for i,s in enumerate(steps)if s.get('name','').startswith('Independent actual-audio diagnostics')]
assert len(tts_indexes)==len(diag_indexes)==7 and max(tts_indexes)<min(diag_indexes)
for i in tts_indexes:
 assert steps[i+1]['name'].startswith('Immediate audio upload')and steps[i+2]['name'].startswith('Bind audio transfer')
 assert steps[i].get('continue-on-error')=='true'and 'always()'in steps[i]['if']and"steps.preflight.outcome == 'success'"in steps[i]['if']
for i in diag_indexes:assert steps[i].get('continue-on-error')=='true'and'always()'in steps[i]['if']
assert steps[-2]['run'].endswith('python worker.py inventory\n')and steps[-1]['if']=='always()'
test('All7 independent TTS and immediate uploads precede isolated diagnostics; final explicit failure inventory always runs',lambda:None)
with tempfile.TemporaryDirectory(dir=fixtures)as td:
 saved=w.OUT;w.OUT=Path(td)
 try:
  test('Final inventory without outputs fails explicitly and makes no provider call',lambda:rejects(w.final_inventory))
  inventory=w.read(w.OUT/'completion-inventory.json');assert inventory['missingOrIncompleteUnits']==ids and inventory['newProviderCallsByInventory']==0 and len(inventory['units'])==7
  test('Final missing-diagnostic inventory enumerates all incomplete units without replacing61 existing WAVs',lambda:None)
 finally:w.OUT=saved
for rel,digest in w.read(HERE/'r1-preservation.private.json')['files'].items():assert w.sha(HERE.parent/'narration-de-remaining-r1'/rel)==digest
test('Unlaunched additive parentr1 files preserved exactly',lambda:None)
report={'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS_LOCAL_OFFLINE_SEVEN_ONLY_SCOPE_SOURCE_BINDING_PRIOR_AUDIO_PRESERVATION_PRIVACY_AND_GUARDS'if all(t['pass']for t in tests)else'FAILED_PRESERVED','tests':tests,'testCount':len(tests),'selectedUnitIds':ids,'unchangedFullUnitObjects':7,'priorAudioOriginalsRehashed':61,'sourceBindingsVerified':sum(len(u['sourceBindings'])for u in req['units']),'syntheticReservationsOnlyNoProviders':True,'providerCalls':0,'remoteMutations':0,'humanListeningClaimed':False,'ownerAccepted':False};w.write(HERE/'offline-verification.json',report);print(json.dumps({'status':report['status'],'tests':len(tests),'failures':[t for t in tests if not t['pass']]}));assert all(t['pass']for t in tests)
