"""Network-denied synthetic tests; no real recording analysis/provider/ASR."""
from pathlib import Path
import ast,base64,copy,hashlib,importlib.util,io,json,os,shutil,socket,sys,tempfile,types,urllib.request,wave
P=Path(__file__).resolve().parent
def denied(*a,**k):raise AssertionError('Offline network forbidden')
socket.create_connection=denied;socket.socket.connect=denied;urllib.request.urlopen=denied
sp=importlib.util.spec_from_file_location('coherent_worker',P/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
req,runtime=w.validate();uid=w.IDS[0];checks=[];calls={'tts':0,'review':0,'asr':0,'get':0}
def check(name,ok):assert ok,name;checks.append(name)
def rejects(fn):
    try:fn()
    except (AssertionError,RuntimeError,FileNotFoundError,FileExistsError,KeyError):return True
    return False
check('Exactly one held German scene, assigned B/Kore and 1/1/1 new finite scope',len(req['units'])==1 and req['units'][0]['locale']=='de' and req['units'][0]['voice']=='Kore')
check('Exact full narration, complete canonical three paragraphs, separate pronunciation delivery',req['units'][0]['spokenText']==req['units'][0]['displayText'] and 'Aussprachehinweise' not in req['units'][0]['spokenText'])
check('Prior scopes remain terminal; cumulative known counts and unknown historic counts explicit',w.read(P/'cumulative-attempt-ledger.json')['priorBudgetReused'] is False)
check('No assembly, other German scenes, adoption or human approval in scope',not req['assemblyAllowed'] and not req['otherNineGermanScenesInScope'] and not req['humanListeningApproved'])
ast.parse((P/'worker.py').read_text('utf-8'))
check('Production rejected outside Actions',rejects(lambda:w.produce(uid)))
temp=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=P))
if os.name=='nt':temp=Path(chr(92)*2+'?'+chr(92)+str(temp.resolve()))
saved={n:getattr(w,n) for n in ['OUT','require_actions','provider_key','load_engine','verify_wheel']};realversion=w.importlib.metadata.version
memory=io.BytesIO()
with wave.open(memory,'wb') as wav:wav.setparams((1,2,24000,0,'NONE','not compressed'));wav.writeframes(b'\0\0'*24000)
fakewav=memory.getvalue()
class Response:
    def __init__(self,data):self.data=data
    def __enter__(self):return self
    def __exit__(self,*a):pass
    def read(self):return self.data
try:
    w.OUT=temp/'success';w.require_actions=lambda:None;w.provider_key=lambda:'offline-placeholder'
    def fake_request(url,key,payload=None,max_attempts=1):
        assert max_attempts==1
        if payload is None:
            calls['get']+=1;assert w.read(w.OUT/'model-preflight-attempt.json')['callsStarted']==calls['get']
            return {'name':'models/'+url.rsplit('/',1)[1],'supportedGenerationMethods':['interactions']}
        state=w.read(w.folder(uid)/'tts-attempt.json');assert state['providerCalls']==1
        content=payload['input'][0]['content'][0]
        assert content['text']==req['units'][0]['spokenText'] and content['annotations'][0]['style']==req['units'][0]['delivery']
        assert payload['generation_config']['speech_config']==[{'voice':'Kore'}]
        calls['tts']+=1
        return {'steps':[{'type':'model_output','content':[{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(fakewav).decode()}]}]}
    def engine():
        e=saved['load_engine']();e.request_json=fake_request;return e
    w.load_engine=engine;w.preflight()
    check('Exactly two metadata GETs ledgered before each invocation',calls['get']==2)
    check('Repeated metadata preflight rejected',rejects(w.preflight))
    w.produce(uid)
    check('Exactly one unary TTS with full unchanged text and separate delivery metadata',calls['tts']==1)
    check('Raw provider WAV is preserved byte for byte',(w.folder(uid)/'provider-audio.original.bin').read_bytes()==fakewav)
    check('Candidate original format and complete PCM receipt bound',w.read(w.folder(uid)/'tts-attempt.json')['audio']['frames']==24000)
    check('Review blocked before completed-WAV upload',rejects(lambda:w.blind_review(uid)))
    check('ASR blocked before completed-WAV upload',rejects(lambda:w.asr(uid)))
    w.uploaded(uid,'1234','sha256:'+'a'*64)
    check('Upload receipt binds exact WAV and artifact digest',w.read(w.folder(uid)/'audio-upload-receipt.json')['audioSha256']==hashlib.sha256(fakewav).hexdigest())
    check('Duplicate upload receipt rejected',rejects(lambda:w.uploaded(uid,'1234','sha256:'+'a'*64)))
    check('ASR blocked before terminal valid blind review',rejects(lambda:w.asr(uid)))
    invalid=False;missing_voice=False
    def review(request,timeout):
        body=json.loads(request.data);assert body['model']=='gemini-4-argon' and body['generation_config']['thinking_level']=='high'
        assert body['input'][0]=={'type':'text','text':w.PROMPT} and len(body['input'])==3
        assert base64.b64decode(body['input'][1]['data'])==fakewav
        assert hashlib.sha256(base64.b64decode(body['input'][2]['data'])).hexdigest()==req['units'][0]['originalWavSha256']
        assert req['units'][0]['spokenText'] not in w.PROMPT and 'Schwinge' not in w.PROMPT and 'Lies' not in w.PROMPT
        assert w.read(w.folder(uid)/'blind-review-attempt.json')['providerCalls']==1
        calls['review']+=1
        result={'transcript':'synthetic words','uncertainWords':[],'findings':[{'startSeconds':8,'endSeconds':9}] if invalid else [],'overall':'uncertain','voiceComparison':{'observations':'synthetic only','uncertainty':'offline fixture'},'limitations':'not human review'}
        if missing_voice:del result['voiceComparison']
        return Response(json.dumps({'steps':[{'type':'model_output','content':[{'type':'text','text':json.dumps(result)}]}]}).encode())
    urllib.request.urlopen=review;w.blind_review(uid)
    check('One high blind review attaches only exact NEW and original same-role actual WAVs',calls['review']==1)
    check('Expected scientific criteria and repair words never supplied to blind reviewer',not w.read(w.folder(uid)/'blind-review-prompt.json')['unitSpecificRepairTermsSupplied'])
    modelpath=temp/'model';modelpath.mkdir();(modelpath/'config.json').write_text('{}')
    sys.modules['huggingface_hub']=types.SimpleNamespace(snapshot_download=lambda **k:str(modelpath))
    class Model:
        def __init__(self,*a,**k):assert k['local_files_only'] is True
        def transcribe(self,path,**k):
            assert k['language']=='de' and k['word_timestamps'] and k['temperature']==0 and not k['vad_filter'] and not k['condition_on_previous_text']
            assert 'initial_prompt' not in k and 'hotwords' not in k
            assert w.read(w.folder(uid)/'asr-attempt.json')['asrInvocations']==1
            calls['asr']+=1
            word=types.SimpleNamespace(word=' synthetic',start=.1,end=.8,probability=.9)
            segment=types.SimpleNamespace(id=0,start=.1,end=.8,text='synthetic words',avg_logprob=-.1,no_speech_prob=.01,words=[word])
            return iter([segment]),types.SimpleNamespace(language='de')
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=Model)
    w.importlib.metadata.version=lambda name:'1.2.1' if name=='faster-whisper' else realversion(name);w.verify_wheel=lambda:None
    w.asr(uid);w.compare(uid);w.summarize()
    check('One pinned German actual-audio ASR with timestamps, no reference prompt',calls['asr']==1 and not w.read(w.folder(uid)/'asr-word-timestamps.json')['initialPromptSupplied'])
    check('Source comparison follows independent review and ASR',set(w.read(w.folder(uid)/'reference-comparison.json')['comparisons'])=={'asr','blindReview'})
    check('Successful diagnostics never imply automatic adoption or human certification',not w.read(w.OUT/'summary.json')['humanListeningApproved'] and not w.read(w.OUT/'summary.json')['assemblyPerformed'])
    for command in [w.produce,w.blind_review,w.asr]:check('Duplicate '+command.__name__+' rejected',rejects(lambda command=command:command(uid)))
    success=w.OUT
    def isolated(name,review_files=False):
        w.OUT=temp/name;w.folder(uid).mkdir(parents=True)
        names=['voice.wav','tts-attempt.json','audio-upload-receipt.json']
        if review_files:names+=['blind-review.json','blind-review-attempt.json']
        for n in names:(w.folder(uid)/n).write_bytes((success/uid/n).read_bytes())
        for n in ['model-preflight-attempt.json','model-preflight.json']:(w.OUT/n).write_bytes((success/n).read_bytes())
    isolated('invalid');invalid=True
    check('Invalid timestamp fails same review action with raw result preserved',rejects(lambda:w.blind_review(uid)) and (w.folder(uid)/'blind-review-response.raw.json').exists() and w.read(w.folder(uid)/'blind-review-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    check('Invalid terminal review prevents any later ASR',rejects(lambda:w.asr(uid)) and not (w.folder(uid)/'asr-attempt.json').exists())
    check('Summary rejects invalid or incomplete evidence',rejects(w.summarize))
    isolated('missing-voice');invalid=False;missing_voice=True
    check('Missing full-context voice comparison fails with parsed and raw evidence preserved',rejects(lambda:w.blind_review(uid)) and (w.folder(uid)/'blind-review-parsed-before-validation.json').exists())
    check('Missing voice comparison cannot authorize dependent ASR',rejects(lambda:w.asr(uid)) and not (w.folder(uid)/'asr-attempt.json').exists())
    missing_voice=False
    isolated('asr-failed',True)
    class FailedModel(Model):
        def transcribe(self,*a,**k):raise RuntimeError('DO_NOT_SERIALIZE_CREDENTIAL')
    sys.modules['faster_whisper']=types.SimpleNamespace(WhisperModel=FailedModel)
    check('ASR invocation failure is terminal and ledger-reserved',rejects(lambda:w.asr(uid)) and w.read(w.folder(uid)/'asr-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    check('Failed ASR prevents terminal success',rejects(w.summarize))
    w.OUT=temp/'tts-empty';w.OUT.mkdir()
    for n in ['model-preflight-attempt.json','model-preflight.json']:(w.OUT/n).write_bytes((success/n).read_bytes())
    def empty_engine():
        e=saved['load_engine']();e.request_json=lambda *a,**k:{'steps':[]};return e
    w.load_engine=empty_engine
    check('Unknown TTS outcome raw-preserved and terminal',rejects(lambda:w.produce(uid)) and (w.folder(uid)/'tts-response.raw.json').exists())
    check('Unknown TTS cannot be retried',rejects(lambda:w.produce(uid)))
    w.OUT=temp/'wrong-metadata'
    check('Unsupported model metadata stops without fallback',rejects(w.preflight) and w.read(w.OUT/'model-preflight-attempt.json')['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY')
    realread=w.read
    def altered(path):
        value=realread(path)
        if Path(path)==P/'request.json':value['maximumTTSCalls']=2
        return value
    w.read=altered;check('Raised request budget rejected',rejects(w.validate));w.read=realread
    w.safe_failure(temp/'safe.json',{},RuntimeError('DO_NOT_SERIALIZE_CREDENTIAL'))
    check('Exception text and secrets excluded from failure records','DO_NOT_SERIALIZE_CREDENTIAL' not in (temp/'safe.json').read_text())
finally:
    w.importlib.metadata.version=realversion;urllib.request.urlopen=denied
    for name,value in saved.items():setattr(w,name,value)
    assert str(temp.resolve().parent).removeprefix(chr(92)*2+'?'+chr(92))==str(P.resolve()) and temp.name.startswith('offline-fixture-');shutil.rmtree(temp)
import yaml
wf=(P/'coherent-repair.yml').read_text('utf-8');parsed=yaml.load(wf,Loader=yaml.BaseLoader)
check('Only fresh exact branch push attempt1; no dispatch or rerun',set(parsed['on'])=={'push'} and parsed['on']['push']['branches']==['work/soil-s101-de-limits-coherent-repair-20261022-r1'] and 'github.event.created == true' in wf and 'github.run_attempt == 1' in wf)
check('Exactly one workflow TTS, blind review and ASR step',all(wf.count('worker.py '+op+' --unit')==1 for op in ['produce','blind-review','asr']))
positions=[wf.index('worker.py produce --unit'),wf.index('name: s101-de-coherent-'+uid+'-audio'),wf.index('worker.py uploaded --unit'),wf.index('worker.py blind-review --unit'),wf.index('worker.py asr --unit')]
check('Finished WAV uploaded and receipt ledgered before diagnostics',positions==sorted(positions))
check('No continue-on-error, splice, EQ or boundary analysis routines','continue-on-error' not in wf and 'def analyze_originals' not in (P/'worker.py').read_text('utf-8'))
w.write(P/'offline-verification.json',{'count':len(checks),'checks':checks,'networkDenied':True,'realProviderCalls':0,'realMetadataGETs':0,'realASRInvocations':0,'syntheticOnly':True,'requestSha256':w.sha(P/'request.json'),'workerSha256':w.sha(P/'worker.py'),'freezeSha256':w.sha(P/'freeze.json'),'workflowSha256':w.sha(P/'coherent-repair.yml'),'humanListeningApproved':False})
print('PASS',len(checks),'offline checks; zero network/provider/ASR calls')
