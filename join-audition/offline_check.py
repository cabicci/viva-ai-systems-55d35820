"""Network denied: synthetic PCM preservation, provider/ASR mocks and failure gates."""
from pathlib import Path
import ast,base64,copy,hashlib,importlib.util,io,json,os,shutil,socket,struct,sys,tempfile,types,urllib.request,wave
HERE=Path(__file__).resolve().parent
def deny(*a,**k):raise AssertionError('Offline network forbidden')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('audition_worker_test',HERE/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
req,runtime=w.validate();checks=[]
def check(n,ok):assert ok,n;checks.append(n)
def rejects(fn):
    try:fn()
    except (AssertionError,RuntimeError,FileExistsError,FileNotFoundError):return
    raise AssertionError('Unsafe condition accepted')
check('five exact source/candidate WAV and PCM hashes pinned; two scenes, zero TTS',len(req['inputs'])==5 and len(req['scenes'])==2 and req['ttsCalls']==0)
real_read=w.read
for mutation in ['wrong_sha','sample_count','overlap','cut_inside_word','extra_input','raise_calls','adoption']:
    changed=copy.deepcopy(req)
    if mutation=='wrong_sha':changed['inputs'][0]['sha256']='0'*64
    if mutation=='sample_count':changed['inputs'][0]['sampleCount']+=1
    if mutation=='overlap':changed['scenes'][1]['replacements'][1]['proposedOriginalCutSamples'][0]=1
    if mutation=='cut_inside_word':changed['scenes'][0]['replacements'][0]['proposedOriginalCutSamples'][0]+=24000
    if mutation=='extra_input':changed['inputs'].append(copy.deepcopy(changed['inputs'][0]))
    if mutation=='raise_calls':changed['maximumBlindReviewCalls']=3
    if mutation=='adoption':changed['adoptionAllowed']=True
    w.read=lambda p,c=changed:c if Path(p)==HERE/'request.json' else real_read(p)
    rejects(w.validate);checks.append('reject request mutation '+mutation)
w.read=real_read
saved={n:getattr(w,n) for n in ['HERE','OUT','validate','require_actions','verify_wheel']}
original_version=w.importlib.metadata.version
temp=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=HERE))
if os.name=='nt':temp=Path('\\\\?\\'+str(temp.resolve()))
try:
    fixture=temp/'package';fixture.mkdir();(fixture/'request.json').write_bytes((HERE/'request.json').read_bytes());(fixture/'worker.py').write_bytes((HERE/'worker.py').read_bytes())
    synthetic=copy.deepcopy(req);(fixture/'inputs').mkdir()
    for i,item in enumerate(synthetic['inputs']):
        count=24000 if item['role']=='preserved_original_full_scene' else 1000
        data=b''.join(struct.pack('<h',((j+i*997)%20000)-10000) for j in range(count))
        path=fixture/item['path']
        with wave.open(str(path),'wb') as wav:wav.setparams((1,2,24000,0,'NONE','not compressed'));wav.writeframes(data)
        item.update(sha256=w.sha(path),pcmSha256=w.digest(data),sampleCount=count)
    for scene in synthetic['scenes']:
        for i,r in enumerate(scene['replacements']):r['proposedOriginalCutSamples']=[6000+i*8000,9000+i*8000]
    w.HERE=fixture;w.OUT=fixture/'output';w.validate=lambda:(synthetic,runtime);w.require_actions=lambda:None;w.verify_wheel=lambda:None
    for scene in synthetic['scenes']:
        uid=scene['id'];w.assemble(uid);ledger=w.read(w.folder(uid)/'splice-ledger.json');data=w.pcm(w.folder(uid)/'audition.wav')
        for piece in ledger['pieces']:
            item=next(i for i in synthetic['inputs'] if i['id']==piece['inputId']);source=w.pcm(fixture/item['path'])
            a,b=piece['inputSampleRange'];x,y=piece['outputSampleRange'];assert data[x*2:y*2]==source[a*2:b*2]
        check(uid+' every retained original and complete candidate PCM at exact offset',ledger['allOutsideOriginalPcmVerified'] and ledger['allNewCandidatePcmVerified'])
        check(uid+' no padding/fade/gain/stretch or safe-cut approval',ledger['addedPaddingSamples']==0 and not ledger['normalizationTimeStretchCrossfadeOrGain'] and not ledger['safeCutApproval'])
        rejects(lambda uid=uid:w.assemble(uid));checks.append(uid+' duplicate assembly refused')
        rejects(lambda uid=uid:w.verified_audio(uid));checks.append(uid+' diagnostics blocked before upload receipt')
        w.uploaded(uid,str(100+len(checks)),'sha256:'+'a'*64)
    api_calls={'get':0,'review':0,'asr':0};invalid=False
    class Response:
        def __init__(self,v):self.v=v
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def read(self):return json.dumps(self.v).encode()
    def fake_url(request,timeout):
        if request.method=='GET':
            api_calls['get']+=1;assert w.read(w.OUT/'model-preflight-attempt.json')['callsStarted']==1
            return Response({'name':'models/gemini-4-argon','supportedGenerationMethods':['interactions']})
        scene=synthetic['scenes'][0 if invalid else api_calls['review']]
        attempt=w.read(w.folder(scene['id'])/'blind-review-attempt.json');assert attempt['providerCallsStarted']==1
        body=json.loads(request.data)
        assert body['model']=='gemini-4-argon' and body['generation_config']['thinking_level']=='high' and len(body['input'])==3
        assert base64.b64decode(body['input'][1]['data'])==(w.folder(scene['id'])/'audition.wav').read_bytes()
        original=next(i for i in synthetic['inputs'] if i['id']==scene['originalInputId'])
        assert base64.b64decode(body['input'][2]['data'])==(fixture/original['path']).read_bytes()
        assert scene['completeExpectedSpokenText'] not in body['input'][0]['text'] and 'splice points' in body['input'][0]['text']
        api_calls['review']+=1
        joins=w.read(w.folder(scene['id'])/'splice-ledger.json')['joins']
        assessments=[{'joinTimeSeconds':j['timeSeconds'],'status':'uncertain','observations':'synthetic','leftSpeechIntact':None,'rightSpeechIntact':None,'pauseAndVoice':'synthetic'} for j in joins]
        result={'transcript':'synthetic words','joinWindowTranscripts':[],'joinAssessments':assessments,'findings':([{'startSeconds':999,'endSeconds':1000}] if invalid else []),'overall':'uncertain','voiceContinuity':'synthetic','limitations':'offline'}
        return Response({'steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]})
    w.provider_key=lambda:'offline-placeholder';urllib.request.urlopen=fake_url;w.preflight()
    modelpath=temp/'model';modelpath.mkdir();(modelpath/'config.json').write_text('{}')
    sys.modules['huggingface_hub']=types.SimpleNamespace(snapshot_download=lambda **k:str(modelpath))
    class Model:
        def __init__(self,*a,**k):assert k['local_files_only']
        def transcribe(self,path,**k):
            assert k['language'] in ('en','de') and k['word_timestamps'] and k['temperature']==0 and not k['vad_filter']
            assert 'initial_prompt' not in k and 'hotwords' not in k;api_calls['asr']+=1
            word=types.SimpleNamespace(word=' synthetic',start=.1,end=.7,probability=.9)
            segment=types.SimpleNamespace(id=1,start=.1,end=.7,text='synthetic words',words=[word])
            return iter([segment]),types.SimpleNamespace(language=k['language'])
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=Model)
    w.importlib.metadata.version=lambda n:'1.2.1' if n=='faster-whisper' else original_version(n)
    for uid in w.IDS:
        w.blind_review(uid);w.asr(uid);w.compare(uid)
        check(uid+' one actual joined/original audio review plus no-script ASR',w.read(w.folder(uid)/'blind-review.json')['actualJoinedAudioSupplied'] and not w.read(w.folder(uid)/'asr-word-timestamps.json')['referenceTranscriptSupplied'])
    w.summarize();check('finite one GET two join reviews two ASR no TTS',api_calls=={'get':1,'review':2,'asr':2} and w.read(w.OUT/'summary.json')['ttsCalls']==0)
    check('audition never auto-adopts source or certifies listening',w.read(w.OUT/'summary.json')['rootAdoptionAllowed'] is False and not w.read(w.OUT/'summary.json')['humanListeningApproved'])
    uid=w.IDS[0];voice=w.folder(uid)/'audition.wav';originalbytes=voice.read_bytes();changed=bytearray(originalbytes);changed[-1]^=1;voice.write_bytes(changed)
    rejects(lambda:w.verified_audio(uid));checks.append('one-byte audition PCM mutation rejected before review')
    voice.write_bytes(originalbytes)
    success=w.OUT;w.OUT=fixture/'invalid'
    uid=w.IDS[0];w.folder(uid).mkdir(parents=True)
    for name in ['audition.wav','assembly-attempt.json','splice-ledger.json','upload-receipt.json']:(w.folder(uid)/name).write_bytes((success/uid/name).read_bytes())
    for name in ['model-preflight.json','model-preflight-attempt.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
    invalid=True
    rejects(lambda:w.blind_review(uid))
    check('invalid join timestamp stops same action after preserving raw and parsed',w.read(w.folder(uid)/'blind-review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY' and (w.folder(uid)/'blind-review-response.raw.json').exists())
    rejects(lambda:w.blind_review(w.IDS[1]));checks.append('failed previous scene blocks later paid review')
    rejects(w.summarize);checks.append('invalid final diagnostic cannot produce successful summary')
    w.OUT=fixture/'asr-failed';w.folder(uid).mkdir(parents=True)
    for name in ['audition.wav','assembly-attempt.json','splice-ledger.json','upload-receipt.json','blind-review.json','blind-review-attempt.json']:(w.folder(uid)/name).write_bytes((success/uid/name).read_bytes())
    for name in ['model-preflight.json','model-preflight-attempt.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
    class FailedModel(Model):
        def transcribe(self,*a,**k):raise RuntimeError('NO_SECRET_LOG')
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=FailedModel)
    rejects(lambda:w.asr(uid))
    check('partial ASR failure preserves one invocation terminal ledger',w.read(w.folder(uid)/'asr-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY' and w.read(w.folder(uid)/'asr-attempt.json')['asrInvocations']==1)
    rejects(lambda:w.blind_review(w.IDS[1]));checks.append('partial ASR failure blocks next paid join review')
    w.failure(temp/'sanitized.json',{},RuntimeError('SECRET_MUST_NOT_APPEAR'));check('sanitized failure omits secret message','SECRET_MUST_NOT_APPEAR' not in (temp/'sanitized.json').read_text())
    w.require_actions=saved['require_actions'];rejects(lambda:w.assemble(w.IDS[0]));checks.append('local production refused')
finally:
    w.importlib.metadata.version=original_version;urllib.request.urlopen=deny
    for n,v in saved.items():setattr(w,n,v)
    assert str(temp.parent).removeprefix('\\\\?\\')==str(HERE.resolve()) and temp.name.startswith('offline-fixture-');shutil.rmtree(temp)
import yaml
wf=(HERE/'join-audition.yml').read_text('utf-8');parsed=yaml.load(wf,Loader=yaml.BaseLoader)
check('exact fresh branch push only, no dispatch/repeat',set(parsed['on'])=={'push'} and parsed['on']['push']['branches']==['work/soil-s101-repair-join-audition-20261022-r1'] and 'github.run_attempt == 1' in wf and 'github.event.created == true' in wf)
check('no TTS route and zero silent failure continuation','worker.py produce' not in wf and 'continue-on-error' not in wf and "'produce'" not in (HERE/'worker.py').read_text('utf-8'))
check('two explicit review and ASR commands',wf.count('worker.py blind-review --unit')==wf.count('worker.py asr --unit')==2)
for uid in w.IDS:
    positions=[wf.index('worker.py assemble --unit '+uid),wf.index('name: s101-join-'+uid+'-audio'),wf.index('worker.py uploaded --unit '+uid),wf.index('worker.py blind-review --unit '+uid),wf.index('worker.py asr --unit '+uid),wf.index('worker.py compare --unit '+uid)]
    check(uid+' byte-verified preview upload before diagnostics',positions==sorted(positions))
report={'count':len(checks),'checks':checks,'networkDenied':True,'realProviderCalls':0,'realMetadataGETs':0,'realASRInvocations':0,'syntheticPCMOnly':True,'requestSha256':w.sha(HERE/'request.json'),'workerSha256':w.sha(HERE/'worker.py'),'freezeSha256':w.sha(HERE/'freeze.json'),'workflowSha256':w.sha(HERE/'join-audition.yml'),'adoptionApproved':False}
w.write(HERE/'offline-verification.json',report);print(json.dumps(report,indent=2))

