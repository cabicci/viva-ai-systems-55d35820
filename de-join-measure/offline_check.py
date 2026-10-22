"""Network-denied numeric tests on synthetic PCM only; no real audio measurement."""
from pathlib import Path
import copy,hashlib,importlib.util,json,math,os,shutil,socket,struct,tempfile,urllib.request,wave
HERE=Path(__file__).resolve().parent
def deny(*a,**k):raise AssertionError('Offline network forbidden')
socket.create_connection=deny;socket.socket.connect=deny;urllib.request.urlopen=deny
sp=importlib.util.spec_from_file_location('numeric_worker_test',HERE/'worker.py');w=importlib.util.module_from_spec(sp);sp.loader.exec_module(w)
req=w.validate();checks=[]
def check(n,ok):assert ok,n;checks.append(n)
def rejects(fn):
    try:fn()
    except (AssertionError,RuntimeError,FileExistsError,FileNotFoundError):return
    raise AssertionError('Unsafe condition accepted')
check('three exact immutable source/candidate WAV and PCM pins',len(req['inputs'])==3)
realread=w.read
for mutation in ['wrong_sha','wrong_count','raise_measure_passes','enable_tts','allow_original_change','allow_audio_output']:
    bad=copy.deepcopy(req)
    if mutation=='wrong_sha':bad['inputs'][0]['sha256']='0'*64
    if mutation=='wrong_count':bad['inputs'][0]['sampleCount']+=1
    if mutation=='raise_measure_passes':bad['maximumMeasurementPasses']=2
    if mutation=='enable_tts':bad['ttsCalls']=1
    if mutation=='allow_original_change':bad['originalPcmChangesAllowed']=True
    if mutation=='allow_audio_output':bad['audioOutputAllowed']=True
    w.read=lambda p,bad=bad:bad if Path(p)==HERE/'request.json' else realread(p)
    rejects(w.validate);checks.append('reject '+mutation)
w.read=realread
policy=req['measurementPolicy'];expected=20*math.log10(2000/3000)
row={'pairedMedianDeltasDb':[expected]*10,'validPairedWordCount':10,'originalHigherEnergyFrameCount':100,'candidateHigherEnergyFrameCount':100,'candidateWholePcmPeakDbfs':w.db(3000)}
gain=w.gain_proposal(row,policy)
check('known synthetic amplitude ratio produces exact paired dB gain',abs(gain['conditionalCandidateOnlyGainDb']-expected)<1e-9)
for mutation in ['too_few_words','too_few_frames','outside_gain_bound','insufficient_headroom','inconsistent_word_levels']:
    bad=copy.deepcopy(row)
    if mutation=='too_few_words':bad['validPairedWordCount']=9
    if mutation=='too_few_frames':bad['candidateHigherEnergyFrameCount']=19
    if mutation=='outside_gain_bound':bad['pairedMedianDeltasDb']=[7]*10
    if mutation=='insufficient_headroom':bad['candidateWholePcmPeakDbfs']=-.3;bad['pairedMedianDeltasDb']=[2]*10
    if mutation=='inconsistent_word_levels':bad['pairedMedianDeltasDb']=[-6,0]*5
    check('gain unresolved: '+mutation,w.gain_proposal(bad,policy)['conditionalCandidateOnlyGainDb'] is None)
zero=w.array.array('h',[0]*24000);frames=w.frame_stats(zero,2400,9600,policy)
quiet=w.boundary_proposal({'frames':frames,'gapSamples':[2400,9600],'rmsP20Dbfs':-120,'previousCutSample':6000,'edge':'start'},policy)
check('quiet synthetic interval only a hypothesis, never a selected cut',quiet['candidateIntervals'] and quiet['verifiedOrSelectedCutSample'] is None)
saved={n:getattr(w,n) for n in ['HERE','OUT','validate','require_actions']}
temp=Path(tempfile.mkdtemp(prefix='offline-fixture-',dir=HERE))
if os.name=='nt':temp=Path('\\\\?\\'+str(temp.resolve()))
try:
    fixture=temp/'package';fixture.mkdir();(fixture/'inputs').mkdir()
    synthetic=copy.deepcopy(req)
    for item in synthetic['inputs']:
        value=2000 if item['id']=='original' else 3000;data=struct.pack('<h',value)*24000;p=fixture/item['path']
        with wave.open(str(p),'wb') as wav:wav.setparams((1,2,24000,0,'NONE','not compressed'));wav.writeframes(data)
        item.update(sha256=w.sha(p),pcmSha256=hashlib.sha256(data).hexdigest(),sampleCount=24000)
    for c in synthetic['candidates']:
        c['matchingLexicalWordPairs']=[{'originalWord':{'word':' shared','start':.2,'end':.7},'candidateWord':{'word':' shared','start':.2,'end':.7},'sameNormalizedLexicalValue':'shared'} for _ in range(10)]
        c['originalBoundaryGapsSeconds']={'start':[.1,.2],'end':[.8,.9]};c['previousOriginalCutSamples']=[3600,20400]
    (fixture/'request.json').write_text(json.dumps(synthetic),encoding='utf-8');(fixture/'worker.py').write_bytes((HERE/'worker.py').read_bytes())
    w.HERE=fixture;w.OUT=fixture/'output';w.validate=lambda:synthetic;w.require_actions=lambda:None
    w.measure();measurement=w.read(w.OUT/'measurements.json')
    check('measurement ledger reserved once before complete synthetic pass',w.read(w.OUT/'measurement-attempt.json')['passesStarted']==1)
    rejects(w.measure);checks.append('duplicate measurement refused')
    rejects(w.propose);checks.append('proposal blocked until measurements uploaded')
    w.uploaded('123','sha256:'+'a'*64);w.propose();proposal=w.read(w.OUT/'correction-proposal.json')
    check('measured synthetic gain exactly matches known PCM ratio',all(abs(c['gain']['conditionalCandidateOnlyGainDb']-expected)<1e-9 for c in proposal['candidates']))
    check('all proposed boundary cuts remain null',all(b['verifiedOrSelectedCutSample'] is None for c in proposal['candidates'] for b in c['boundaries']))
    check('zero audio output and all input PCM unchanged',not list(w.OUT.rglob('*.wav')) and all(w.sha(fixture/i['path'])==i['sha256'] for i in synthetic['inputs']))
    rejects(w.propose);checks.append('duplicate proposal refused')
    w.require_actions=saved['require_actions'];rejects(w.measure);checks.append('local production measurement refused')
finally:
    for n,v in saved.items():setattr(w,n,v)
    assert str(temp.parent).removeprefix('\\\\?\\')==str(HERE.resolve()) and temp.name.startswith('offline-fixture-');shutil.rmtree(temp)
import yaml
wf=(HERE/'de-join-measure.yml').read_text('utf-8');parsed=yaml.load(wf,Loader=yaml.BaseLoader)
check('exact fresh public branch first-push run1 only',set(parsed['on'])=={'push'} and parsed['on']['push']['branches']==['work/soil-s101-de-join-measure-20261022-r1'] and 'github.run_attempt == 1' in wf and 'github.event.created == true' in wf)
sequence=[wf.index('worker.py measure'),wf.index('name: s101-de-join-numeric-measurements'),wf.index('worker.py uploaded'),wf.index('worker.py propose')]
check('measurement upload receipt strictly precedes numeric proposal',sequence==sorted(sequence))
source=(HERE/'worker.py').read_text('utf-8')
check('worker has no provider network or ASR/voice route',all(x not in source for x in ['urlopen','GEMINI_API_KEY','transcribe(','subprocess','requests.']))
check('workflow contains no secrets or additional model calls','secrets.' not in wf and 'worker.py blind-review' not in wf and 'worker.py asr' not in wf)
report={'count':len(checks),'checks':checks,'networkDenied':True,'realProviderCalls':0,'realMetadataGETs':0,'realASRInvocations':0,'realAudioMeasurementByOfflineTests':0,'syntheticPCMOnly':True,'requestSha256':w.sha(HERE/'request.json'),'workerSha256':w.sha(HERE/'worker.py'),'freezeSha256':w.sha(HERE/'freeze.json'),'workflowSha256':w.sha(HERE/'de-join-measure.yml'),'cutsOrGainsSelectedOnRealAudio':False}
w.write(HERE/'offline-verification.json',report);print(json.dumps(report,indent=2))

