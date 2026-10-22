"""Network-denied synthetic provider/ASR and freeze/terminal-state tests."""
from pathlib import Path
import ast,base64,copy,hashlib,importlib.util,io,json,os,shutil,socket,sys,tempfile,types,urllib.request,wave
HERE=Path(__file__).resolve().parent
def denied(*a,**k):raise AssertionError('Offline network forbidden')
socket.create_connection=denied;socket.socket.connect=denied;urllib.request.urlopen=denied
sp=importlib.util.spec_from_file_location('bounded_three_worker',HERE/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
req,runtime=w.validate();checks=[];calls={'tts':0,'review':0,'asr':0,'get':0}
def check(n,ok):assert ok,n;checks.append(n)
check('three exact source sentences original role B Kore and finite 3/3/3 zero retries',len(req['units'])==3 and all(u['voice']=='Kore' for u in req['units']))
check('two immutable original WAVs pinned with exact PCM and source bindings',len({u['originalPath'] for u in req['units']})==2)
ast.parse((HERE/'worker.py').read_text('utf-8'));engine=w.load_engine()
temp=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=HERE))
if os.name=='nt':temp=Path('\\\\?\\'+str(temp.resolve()))
saved={n:getattr(w,n) for n in ['OUT','require_actions','provider_key','load_engine','verify_wheel']}
real_version=w.importlib.metadata.version
memory=io.BytesIO()
with wave.open(memory,'wb') as wav:wav.setparams((1,2,24000,0,'NONE','not compressed'));wav.writeframes(b'\0\0'*24000)
fakewav=memory.getvalue()
try:
    w.OUT=temp/'success';w.require_actions=lambda:None;w.provider_key=lambda:'offline-placeholder'
    def fake_request(url,key,payload=None,max_attempts=1):
        assert max_attempts==1
        if payload is None:
            calls['get']+=1
            assert w.read(w.OUT/'model-preflight-attempt.json')['callsStarted']==calls['get']
            return {'name':'models/'+url.rsplit('/',1)[1],'supportedGenerationMethods':['interactions']}
        uid=w.IDS[calls['tts']];state=w.read(w.folder(uid)/'tts-attempt.json')
        assert state['providerCalls']==1 and state['state']=='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN'
        unit=req['units'][calls['tts']];content=payload['input'][0]['content'][0]
        assert content['text']==unit['spokenText'] and content['annotations'][0]['style']==unit['delivery']
        assert payload['generation_config']['speech_config']==[{'voice':'Kore'}]
        calls['tts']+=1
        return {'steps':[{'type':'model_output','content':[{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(fakewav).decode()}]}]}
    def fake_engine():
        e=saved['load_engine']();e.request_json=fake_request;return e
    w.load_engine=fake_engine;w.preflight()
    check('two metadata GETs have ledger before invocation',calls['get']==2)
    # Actual analysis command is Actions-only. Its offline test uses only synthetic PCM.
    original_validate=w.validate
    syntheticreq=copy.deepcopy(req)
    for i,u in enumerate(syntheticreq['units']):
        f=temp/('synthetic-original-'+str(i)+'.wav');f.write_bytes(fakewav)
        u['originalPath']=str(f);u['originalObservedGroupBoundsSeconds']=[.2,.8]
    w.validate=lambda:(syntheticreq,runtime)
    w.analyze_originals()
    analysis=w.read(w.OUT/'original-analysis.json')
    check('synthetic quiet PCM candidate analysis preserves no-cut null boundaries',all(b['verifiedSpliceSample'] is None and b['quiet40msWindows'] for r in analysis['rows'] for b in r['boundaries']))
    w.validate=original_validate
    w.write(w.OUT/'original-analysis.json',{'requestSha256':w.sha(HERE/'request.json'),'fixtureOnly':True})
    class Response:
        def __init__(self,data):self.data=data
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def read(self):return self.data
    invalid=False
    def review(request,timeout):
        body=json.loads(request.data);uid=w.IDS[min(calls['review'],2)];unit=req['units'][min(calls['review'],2)]
        assert body['input'][0]=={'type':'text','text':w.PROMPT} and len(body['input'])==3
        assert body['generation_config']['thinking_level']=='high'
        attached=[base64.b64decode(b['data']) for b in body['input'][1:]]
        assert attached[0]==fakewav and hashlib.sha256(attached[1]).hexdigest()==unit['originalWavSha256']
        assert not any(u['spokenText'] in body['input'][0]['text'] for u in req['units'])
        # Invalid fixture reuses the first unit and a separate output ledger.
        ledger=w.read(w.folder(w.IDS[0] if invalid else uid)/'blind-review-attempt.json')
        assert ledger['providerCalls']==1
        calls['review']+=1
        result={'transcript':'synthetic words','uncertainWords':[],'findings':([{'startSeconds':8,'endSeconds':9}] if invalid else []),'overall':'uncertain','voiceComparison':{'uncertainty':'synthetic'},'limitations':'offline'}
        return Response(json.dumps({'steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
    urllib.request.urlopen=review
    modelpath=temp/'model';modelpath.mkdir();(modelpath/'config.json').write_text('{}')
    sys.modules['huggingface_hub']=types.SimpleNamespace(snapshot_download=lambda **k:str(modelpath))
    class Model:
        def __init__(self,*a,**k):assert k['local_files_only'] is True
        def transcribe(self,path,**k):
            assert k['language'] in ['en','de'] and k['word_timestamps'] and k['temperature']==0 and not k['vad_filter'] and not k['condition_on_previous_text']
            assert 'initial_prompt' not in k and 'hotwords' not in k
            calls['asr']+=1
            word=types.SimpleNamespace(word=' synthetic',start=.1,end=.8,probability=.9)
            seg=types.SimpleNamespace(id=0,start=.1,end=.8,text='synthetic words',avg_logprob=-.1,no_speech_prob=.01,words=[word])
            return iter([seg]),types.SimpleNamespace(language=k['language'])
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=Model)
    w.importlib.metadata.version=lambda name:'1.2.1' if name=='faster-whisper' else real_version(name)
    w.verify_wheel=lambda:None
    for i,uid in enumerate(w.IDS):
        w.produce(uid)
        check(uid+' exact Interactions text delivery voice and pre-call ledger',w.read(w.folder(uid)/'tts-attempt.json')['providerCalls']==1)
        blocked=False
        try:w.verified_audio(uid)
        except FileNotFoundError:blocked=True
        check(uid+' review blocked before audio upload',blocked)
        w.uploaded(uid,str(1000+i),'sha256:'+'a'*64)
        w.blind_review(uid);w.asr(uid);w.compare(uid)
        check(uid+' actual new and original WAVs only, no reference script',not w.read(w.folder(uid)/'blind-review-prompt.json')['referenceTranscriptSupplied'])
        check(uid+' ASR no script and locale explicit',not w.read(w.folder(uid)/'asr-word-timestamps.json')['referenceTranscriptSupplied'])
        blocked=False
        try:w.produce(uid)
        except (AssertionError,FileExistsError):blocked=True
        check(uid+' duplicate generation refused',blocked)
    w.summarize()
    check('mocked production budget exactly three TTS three blind three ASR',calls['tts']==calls['review']==calls['asr']==3)
    check('successful candidate never auto-approved or assembled',w.read(w.OUT/'summary.json')['humanListeningApproved'] is False and w.read(w.OUT/'summary.json')['assemblyPerformed'] is False)
    success=w.OUT;w.OUT=temp/'invalid';uid=w.IDS[0];w.folder(uid).mkdir(parents=True)
    for name in ['voice.wav','tts-attempt.json','audio-upload-receipt.json']:(w.folder(uid)/name).write_bytes((success/uid/name).read_bytes())
    for name in ['model-preflight-attempt.json','model-preflight.json','original-analysis.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
    invalid=True
    # A new isolated mock invocation must attach first-unit original, not the previous last unit.
    old_calls=calls['review'];calls['review']=0
    blocked=False
    try:w.blind_review(uid)
    except RuntimeError:blocked=True
    check('invalid timestamps fail current call after raw and parsed evidence preserved',blocked and (w.folder(uid)/'blind-review-response.raw.json').exists() and w.read(w.folder(uid)/'blind-review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    blocked=False
    try:w.produce(w.IDS[1])
    except (AssertionError,FileNotFoundError):blocked=True
    check('failed prior diagnostic prevents later candidate TTS',blocked and calls['tts']==3)
    blocked=False
    try:w.summarize()
    except (AssertionError,FileNotFoundError):blocked=True
    check('terminal summary rejects invalid diagnostics',blocked)
    # Partial ASR runtime failure must never authorize generation of the next sentence.
    w.OUT=temp/'asr-failed';w.folder(uid).mkdir(parents=True)
    for name in ['voice.wav','tts-attempt.json','audio-upload-receipt.json','blind-review.json','blind-review-attempt.json']:(w.folder(uid)/name).write_bytes((success/uid/name).read_bytes())
    for name in ['model-preflight-attempt.json','model-preflight.json','original-analysis.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
    class FailedModel(Model):
        def transcribe(self,*a,**k):raise RuntimeError('DO_NOT_SERIALIZE_CREDENTIAL')
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=FailedModel)
    blocked=False
    try:w.asr(uid)
    except RuntimeError:blocked=True
    check('ASR invocation failure is terminal with finite reserved ledger',blocked and w.read(w.folder(uid)/'asr-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY' and w.read(w.folder(uid)/'asr-attempt.json')['asrInvocations']==1)
    blocked=False
    try:w.produce(w.IDS[1])
    except (AssertionError,FileNotFoundError):blocked=True
    check('failed ASR prevents every later TTS',blocked and calls['tts']==3)
    # Provider outcome without audio remains failed, raw-preserved and non-retriable.
    w.OUT=temp/'tts-empty';w.OUT.mkdir()
    for name in ['model-preflight-attempt.json','model-preflight.json','original-analysis.json']:(w.OUT/name).write_bytes((success/name).read_bytes())
    def empty_engine():
        e=saved['load_engine']();e.request_json=lambda *a,**k:{'steps':[]};return e
    w.load_engine=empty_engine;blocked=False
    try:w.produce(uid)
    except RuntimeError:blocked=True
    check('unknown provider audio response remains raw-preserved and terminal',blocked and (w.folder(uid)/'tts-response.raw.json').exists() and w.read(w.folder(uid)/'tts-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    blocked=False
    try:w.produce(w.IDS[1])
    except (AssertionError,FileNotFoundError):blocked=True
    check('unknown earlier TTS prevents later generation',blocked)
    # Exact preferred model availability is a gate, not a fallback request.
    w.OUT=temp/'metadata-wrong';blocked=False
    try:w.preflight()
    except RuntimeError:blocked=True
    check('wrong model metadata fails preflight without generation',blocked and w.read(w.OUT/'model-preflight-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    real_read=w.read
    def altered_request(path):
        value=real_read(path)
        if Path(path)==HERE/'request.json':value['maximumTTSCalls']=4
        return value
    w.read=altered_request;blocked=False
    try:w.validate()
    except AssertionError:blocked=True
    finally:w.read=real_read
    check('increased finite request budget rejected',blocked)
    w.safe_failure(temp/'safe-failure.json',{},RuntimeError('DO_NOT_SERIALIZE_CREDENTIAL'))
    check('error messages not serialized','DO_NOT_SERIALIZE_CREDENTIAL' not in (temp/'safe-failure.json').read_text())
    w.require_actions=saved['require_actions'];blocked=False
    try:w.produce(w.IDS[0])
    except AssertionError:blocked=True
    check('local production refused',blocked)
finally:
    w.importlib.metadata.version=real_version
    urllib.request.urlopen=denied
    for name,value in saved.items():setattr(w,name,value)
    assert str(temp.resolve().parent).removeprefix('\\\\?\\')==str(HERE.resolve()) and temp.name.startswith('offline-fixture-');shutil.rmtree(temp)
wf=(HERE/'targeted-repair.yml').read_text('utf-8')
import yaml
parsed=yaml.load(wf,Loader=yaml.BaseLoader)
check('only exact created-branch push trigger, no dispatch or repeat',set(parsed['on'])=={'push'} and parsed['on']['push']['branches']==['work/soil-s101-targeted-sentence-repair-20261022-r1'] and 'github.run_attempt == 1' in wf and 'github.event.created == true' in wf)
check('no continue-on-error allows downstream model calls','continue-on-error' not in wf)
check('three explicit produce review ASR calls',all(wf.count('worker.py '+x+' --unit')==3 for x in ['produce','blind-review','asr']))
for uid in w.IDS:
    positions=[wf.index('worker.py produce --unit '+uid),wf.index('name: s101-targeted-'+uid+'-audio'),wf.index('worker.py uploaded --unit '+uid),wf.index('worker.py blind-review --unit '+uid),wf.index('worker.py asr --unit '+uid),wf.index('worker.py compare --unit '+uid)]
    check(uid+' upload-before-review exact serial ordering',positions==sorted(positions))
report={'checks':checks,'count':len(checks),'networkDenied':True,'realProviderCalls':0,'realMetadataGETs':0,'realASRInvocations':0,'syntheticOnly':True,'requestSha256':w.sha(HERE/'request.json'),'workerSha256':w.sha(HERE/'worker.py'),'freezeSha256':w.sha(HERE/'freeze.json'),'workflowSha256':w.sha(HERE/'targeted-repair.yml'),'humanListeningApproved':False}
w.write(HERE/'offline-verification.json',report);print(json.dumps(report,indent=2))

