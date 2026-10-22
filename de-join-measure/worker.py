"""One numeric DE measurement/proposal pass. No network, ASR, TTS or audio output."""
from pathlib import Path
import argparse,array,datetime,hashlib,json,math,os,platform,re,statistics,sys,time,wave
HERE=Path(__file__).resolve().parent;OUT=HERE/'output'
REPO='cabicci/viva-ai-systems-55d35820';REF='refs/heads/work/soil-s101-de-join-measure-20261022-r1'
FROZEN=['worker.py','request.json','owner-authority.json','correction-plan.NOT-SELECTED.json','offline_check.py','freeze_package.py','README.en.txt','.gitignore','provenance/actual-join-review.snapshot.json','provenance/actual-join-review.raw.snapshot.json','provenance/prior-splice-ledger.snapshot.json','provenance/join-receiving-review.snapshot.json']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');tmp.replace(p)
def exclusive(p,d):
    p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('x',encoding='utf-8',newline='\n') as f:f.write(json.dumps(d,ensure_ascii=False,indent=2)+'\n');f.flush();os.fsync(f.fileno())
def local(rel):
    p=(HERE/rel).resolve();assert p.is_relative_to(HERE.resolve()) and not Path(rel).is_absolute() and '..' not in Path(rel).parts and p.is_file();return p
def load(p):
    assert sys.byteorder=='little'
    with wave.open(str(p),'rb') as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE');data=w.readframes(w.getnframes());assert len(data)==2*w.getnframes()
    values=array.array('h');values.frombytes(data);return data,values
def validate():
    req,freeze=read(HERE/'request.json'),read(HERE/'freeze.json');assert set(freeze['sha256'])==set(FROZEN)
    for n,h in freeze['sha256'].items():assert sha(local(n))==h
    assert req['scope']=='S1_01_DE_TWO_PICKUP_NUMERIC_GAIN_AND_BOUNDARY_MEASUREMENT_ONLY' and req['repository']==REPO and req['branch']==REF
    assert req['ttsCalls']==req['asrCalls']==req['modelReviewCalls']==req['networkCallsByWorker']==req['automaticRetries']==req['automaticReruns']==0
    assert req['maximumMeasurementPasses']==req['maximumProposalPasses']==1
    assert not req['audioOutputAllowed'] and not req['originalPcmChangesAllowed'] and not req['rawCandidateChangesAllowed'] and req['rootAcousticDecisionRequiredBeforeAnyCorrectedAudition']
    assert [i['id'] for i in req['inputs']]==['original','candidate-1','candidate-2'] and [c['id'] for c in req['candidates']]==['candidate-1','candidate-2']
    assert {p.relative_to(HERE).as_posix() for p in (HERE/'inputs').glob('*') if p.is_file()}=={i['path'] for i in req['inputs']}
    for i in req['inputs']:
        p=local(i['path']);data,values=load(p);assert sha(p)==i['sha256'] and hashlib.sha256(data).hexdigest()==i['pcmSha256'] and len(values)==i['sampleCount']
    policy=req['measurementPolicy'];assert policy['sampleRate']==24000 and policy['frameSamples']==480 and policy['hopSamples']==240 and policy['maximumAbsoluteProposedGainDb']==6 and policy['peakHeadroomDbfs']==-1
    for c in req['candidates']:
        assert c['gainDbSelected'] is None and c['cutSamplesSelected'] is None and len(c['matchingLexicalWordPairs'])>=10
        for pair in c['matchingLexicalWordPairs']:
            def norm(t):return ''.join(re.findall(r'\w+',t.casefold()))
            assert norm(pair['originalWord']['word'])==norm(pair['candidateWord']['word'])==pair['sameNormalizedLexicalValue']
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req
def require_actions():
    assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_REF')==REF and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    for n,e in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/n)==os.environ[e]
def db(amplitude):return 20*math.log10(max(float(amplitude),32768*1e-6)/32768)
def frame_stats(values,start,end,policy):
    rows=[];size=policy['frameSamples'];hop=policy['hopSamples']
    for a in range(max(0,start),min(len(values),end)-size+1,hop):
        chunk=values[a:a+size];rms=math.sqrt(sum(v*v for v in chunk)/len(chunk));peak=max(abs(v) for v in chunk)
        rows.append({'startSample':a,'endSample':a+size,'rmsDbfs':db(rms),'peakDbfs':db(peak),'rmsAmplitude':rms,'peakAmplitude':peak})
    return rows
def percentile(values,fraction):
    if not values:return None
    rows=sorted(values);return rows[round((len(rows)-1)*fraction)]
def analyze_candidate(original,candidate,record,policy):
    pairrows=[];allold=[];allnew=[];deltas=[]
    for pair in record['matchingLexicalWordPairs']:
        streams=[]
        for name,values in [('originalWord',original),('candidateWord',candidate)]:
            word=pair[name];trim=policy['wordEdgeTrimSamples']
            a=int(word['start']*24000)+trim;b=int(word['end']*24000)-trim
            assert 0<=a<b<=len(values)
            frames=frame_stats(values,a,b,policy);selected=[f['rmsDbfs'] for f in frames if f['rmsDbfs']>=policy['speechEnergyGateDbfs']]
            streams.append({'word':word,'analysisSampleRange':[a,b],'frames':frames,'higherEnergyFrameCount':len(selected),'medianHigherEnergyDbfs':statistics.median(selected) if selected else None})
        old,new=streams;od=old['medianHigherEnergyDbfs'];nd=new['medianHigherEnergyDbfs'];delta=od-nd if od is not None and nd is not None else None
        if delta is not None:deltas.append(delta)
        allold += [f['rmsDbfs'] for f in old['frames'] if f['rmsDbfs']>=policy['speechEnergyGateDbfs']]
        allnew += [f['rmsDbfs'] for f in new['frames'] if f['rmsDbfs']>=policy['speechEnergyGateDbfs']]
        pairrows.append({'sameLexicalValue':pair['sameNormalizedLexicalValue'],'original':old,'candidate':new,'pairedMedianDeltaDb':delta})
    boundaries=[]
    for edge,gap in record['originalBoundaryGapsSeconds'].items():
        a,b=[int(t*24000) for t in gap];assert 0<=a<b<=len(original)
        frames=frame_stats(original,a,b,policy);floor=percentile([f['rmsDbfs'] for f in frames],.2)
        boundaries.append({'edge':edge,'originalASRGapSeconds':gap,'gapSamples':[a,b],'contextBoundaryNotVerifiedNonspeech':True,'frames':frames,'rmsP20Dbfs':floor,
          'previousCutSample':record['previousOriginalCutSamples'][0 if edge=='start' else 1],'rootBreathContinuityReviewRequired':True})
    peak=max(abs(v) for v in candidate)
    return {'candidateId':record['id'],'wordPairMeasurements':pairrows,'validPairedWordCount':len(deltas),'pairedMedianDeltasDb':deltas,
        'originalHigherEnergyFrameCount':len(allold),'candidateHigherEnergyFrameCount':len(allnew),
        'originalFrameRmsSummaryDbfs':{'p25':percentile(allold,.25),'median':statistics.median(allold) if allold else None,'p75':percentile(allold,.75)},
        'candidateFrameRmsSummaryDbfs':{'p25':percentile(allnew,.25),'median':statistics.median(allnew) if allnew else None,'p75':percentile(allnew,.75)},
        'candidateWholePcmPeakDbfs':db(peak),'candidateWholePcmPeakAmplitude':peak,'boundaryMeasurements':boundaries,
        'analysisIsNotPhoneticOrNonSpeechCertification':True}
def measure():
    require_actions();req=validate();p=OUT/'measurement-attempt.json';state={'atUTC':now(),'state':'RESERVED_BEFORE_SINGLE_NUMERIC_ANALYSIS','requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'passesStarted':0};exclusive(p,state)
    try:
        state.update(state='NUMERIC_ANALYSIS_STARTED',passesStarted=1);write(p,state)
        loaded={i['id']:load(local(i['path']))[1] for i in req['inputs']}
        rows=[analyze_candidate(loaded['original'],loaded[c['id']],c,req['measurementPolicy']) for c in req['candidates']]
        write(OUT/'measurements.json',{'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'pythonVersion':sys.version,'platform':platform.platform(),'inputs':req['inputs'],'measurementPolicy':req['measurementPolicy'],'candidates':rows,'gainOrCutSelected':False,'audioFilesWritten':False,'providerCalls':0,'asrCalls':0,'ttsCalls':0})
        assert all(sha(local(i['path']))==i['sha256'] for i in req['inputs'])
        state.update(state='MEASUREMENTS_COMPLETE_NO_AUDIO_CHANGED',finishedUTC=now(),measurementsSha256=sha(OUT/'measurements.json'));write(p,state)
    except Exception as error:state.update(state='FAILED_NO_RETRY',errorType=type(error).__name__,finishedUTC=now());write(p,state);raise RuntimeError('Numeric analysis failed, preserve evidence; no retry') from None
def uploaded(artifact_id,artifact_digest):
    require_actions();validate();state=read(OUT/'measurement-attempt.json')
    assert state['state']=='MEASUREMENTS_COMPLETE_NO_AUDIO_CHANGED' and sha(OUT/'measurements.json')==state['measurementsSha256']
    assert re.fullmatch('[1-9][0-9]*',artifact_id) and re.fullmatch(r'(?:sha256:)?[0-9a-fA-F]{64}',artifact_digest)
    exclusive(OUT/'measurement-upload-receipt.json',{'atUTC':now(),'artifactId':artifact_id,'artifactDigest':artifact_digest,'measurementsSha256':sha(OUT/'measurements.json'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'beforeGainAndCutProposal':True})
def gain_proposal(row,policy):
    deltas=row['pairedMedianDeltasDb'];reason=[];raw=statistics.median(deltas) if deltas else None
    if row['validPairedWordCount']<policy['minimumMatchingWordPairs']:reason.append('INSUFFICIENT_SHARED_WORDS')
    if min(row['originalHigherEnergyFrameCount'],row['candidateHigherEnergyFrameCount'])<policy['minimumSpeechFrames']:reason.append('INSUFFICIENT_SPEECH_FRAMES')
    if raw is None or abs(raw)>policy['maximumAbsoluteProposedGainDb']:reason.append('GAIN_OUTSIDE_BOUNDED_RANGE')
    headroom=policy['peakHeadroomDbfs']-row['candidateWholePcmPeakDbfs']
    if raw is not None and raw>headroom:reason.append('MATCHING_GAIN_WOULD_VIOLATE_PEAK_HEADROOM')
    iqr=percentile(deltas,.75)-percentile(deltas,.25) if deltas else None
    if iqr is not None and iqr>3:reason.append('PAIRED_WORD_GAIN_VARIABILITY_REQUIRES_REVIEW')
    return {'rawMedianPairedGainDb':raw,'pairedGainIqrDb':iqr,'maximumGainForPeakHeadroomDb':headroom,'conditionalCandidateOnlyGainDb':raw if not reason else None,
       'status':'NUMERIC_GAIN_CANDIDATE_ROOT_ACOUSTIC_REVIEW_REQUIRED' if not reason else 'GAIN_UNRESOLVED_DO_NOT_APPLY','unresolvedReasons':reason,
       'originalGainDb':0,'rawCandidateWavMustRemainUnmodified':True,'gainApplied':False,'timbreBrightnessOrProsodyMatchNotEstablishedByRms':True}
def boundary_proposal(boundary,policy):
    frames=boundary['frames'];margin=policy['requiredOriginalGapMarginSamples'];a,b=boundary['gapSamples'];lo,hi=a+margin,b-margin
    floor=boundary['rmsP20Dbfs'];ceiling=min(policy['boundaryQuietRmsCeilingDbfs'],floor+6) if floor is not None else -120
    eligible=[f for f in frames if lo<=f['startSample'] and f['endSample']<=hi and f['rmsDbfs']<=ceiling and f['peakDbfs']<=policy['boundaryPeakCeilingDbfs']]
    groups=[]
    for f in eligible:
        if groups and f['startSample']<=groups[-1][-1]['endSample']:groups[-1].append(f)
        else:groups.append([f])
    candidates=[]
    for group in groups:
        x,y=group[0]['startSample'],group[-1]['endSample']
        if y-x>=policy['minimumBoundaryPlateauSamples']:
            candidates.append({'sampleInterval':[x,y],'secondsInterval':[x/24000,y/24000],'medianRmsDbfs':statistics.median(f['rmsDbfs'] for f in group),'maxPeakDbfs':max(f['peakDbfs'] for f in group),'previousCutInside':x<=boundary['previousCutSample']<=y,
               'status':'LOW_ENERGY_ASR_GAP_INTERVAL_ONLY_NOT_VERIFIED_NON_SPEECH_OR_BREATH_SAFE'})
    return {'edge':boundary['edge'],'wholeGapSamples':[a,b],'protectedGapInteriorSamples':[lo,hi],'rmsThresholdDbfs':ceiling,'peakThresholdDbfs':policy['boundaryPeakCeilingDbfs'],'candidateIntervals':candidates,'verifiedOrSelectedCutSample':None,
      'ifNone':'Keep boundary unresolved; do not widen into accepted speech or assume silence.','rootAuditoryContextAndBreathContinuityRequired':True}
def propose():
    require_actions();req=validate();measurement=read(OUT/'measurements.json');state=read(OUT/'measurement-attempt.json');upload=read(OUT/'measurement-upload-receipt.json')
    assert state['state']=='MEASUREMENTS_COMPLETE_NO_AUDIO_CHANGED' and state['measurementsSha256']==sha(OUT/'measurements.json')==upload['measurementsSha256']
    assert measurement['requestSha256']==sha(HERE/'request.json') and measurement['workerSha256']==sha(HERE/'worker.py') and measurement['githubRunId']==upload['githubRunId']==os.environ.get('GITHUB_RUN_ID')
    p=OUT/'proposal-attempt.json';attempt={'atUTC':now(),'state':'RESERVED_BEFORE_SINGLE_NUMERIC_PROPOSAL','passesStarted':1,'measurementsSha256':sha(OUT/'measurements.json')};exclusive(p,attempt)
    rows=[{'candidateId':row['candidateId'],'gain':gain_proposal(row,req['measurementPolicy']),'boundaries':[boundary_proposal(b,req['measurementPolicy']) for b in row['boundaryMeasurements']]} for row in measurement['candidates']]
    write(OUT/'correction-proposal.json',{'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'measurementsSha256':sha(OUT/'measurements.json'),'candidates':rows,'onlyConditionalCandidateGainAndOriginalPauseBoundariesProposed':True,'cutSamplesSelected':False,'anyGainApplied':False,'audioFilesWritten':False,'rootReviewBeforeCorrectedAuditionRequired':True,'actualCorrectedJoinsNotYetEvaluated':True,'providerCalls':0,'ttsCalls':0,'asrCalls':0})
    assert all(sha(local(i['path']))==i['sha256'] for i in req['inputs'])
    attempt.update(state='PROPOSAL_COMPLETE_NO_AUDIO_CHANGED',finishedUTC=now(),proposalSha256=sha(OUT/'correction-proposal.json'));write(p,attempt)
def main():
    p=argparse.ArgumentParser();p.add_argument('command',choices=['validate','measure','uploaded','propose']);p.add_argument('--artifact-id');p.add_argument('--artifact-digest');a=p.parse_args()
    try:
        if a.command=='validate':validate()
        elif a.command=='measure':measure()
        elif a.command=='uploaded':uploaded(a.artifact_id,a.artifact_digest)
        else:propose()
    except Exception as error:
        exclusive(OUT/('failure-'+str(time.time_ns())+'.json'),{'atUTC':now(),'operation':a.command,'errorType':type(error).__name__,'noRetry':True,'secretPayloadLogged':False})
        raise SystemExit('Bounded numeric correction preparation failed. Preserve evidence; no retry.') from None
if __name__=='__main__':main()

