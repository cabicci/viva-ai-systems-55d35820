"""Two full-scene PCM audition previews. Zero TTS, no retries, no accepted-audio adoption."""
from pathlib import Path
import argparse,base64,datetime,hashlib,importlib.metadata,json,math,os,re,time,urllib.request,wave
HERE=Path(__file__).resolve().parent;OUT=HERE/'output'
IDS=('en-s101-checklist','de-s101-limits')
REPO='cabicci/viva-ai-systems-55d35820';REF='refs/heads/work/soil-s101-repair-join-audition-20261022-r1';MODEL='gemini-4-argon'
FROZEN=['worker.py','request.json','runtime.json','owner-authority.json','boundary-proposals.NOT-APPROVED.json','remaining-uncertainty-proposal.json','offline_check.py','freeze_package.py','README.en.txt','.gitignore','provenance/repair-request.snapshot.json','provenance/repair-worker.snapshot.py','provenance/repair-result-review.snapshot.json','provenance/original-quiet-analysis.snapshot.json']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def digest(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);t=p.with_suffix(p.suffix+'.tmp');t.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');t.replace(p)
def exclusive(p,d):
    p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('x',encoding='utf-8',newline='\n') as stream:stream.write(json.dumps(d,ensure_ascii=False,indent=2)+'\n');stream.flush();os.fsync(stream.fileno())
def local(rel):
    p=(HERE/rel).resolve();assert p.is_relative_to(HERE.resolve()) and not Path(rel).is_absolute() and '..' not in Path(rel).parts and p.is_file();return p
def pcm(p):
    with wave.open(str(p),'rb') as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE')
        data=w.readframes(w.getnframes());assert len(data)==2*w.getnframes()>0
        return data
def audio_info(p):
    data=pcm(p);return {'channels':1,'sampleWidthBytes':2,'sampleRate':24000,'frames':len(data)//2,'durationSeconds':len(data)/48000,'pcmSha256':digest(data)}
def validate():
    req,runtime,freeze=(read(HERE/n) for n in ['request.json','runtime.json','freeze.json'])
    assert set(freeze['sha256'])==set(FROZEN)
    for n,h in freeze['sha256'].items():assert sha(local(n))==h,'Frozen input mismatch'
    assert req['scope']=='S1_01_TWO_FULL_SCENE_JOIN_AUDITION_PREVIEWS_ONLY'
    assert req['repository']==REPO and req['branch']==REF and tuple(s['id'] for s in req['scenes'])==IDS
    assert (req['maximumBlindReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['ttsCalls'],req['automaticRetries'],req['automaticReruns'])==(2,2,1,0,0,0)
    assert not req['adoptionAllowed'] and not req['acceptedAudioOverwriteAllowed'] and not req['sourceCriteriaSuppliedToModel']
    assert runtime['reviewModel']==MODEL and runtime['thinkingLevel']=='high'
    assert runtime['asr']['packageVersion']=='1.2.1' and runtime['asr']['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    inputs={u['id']:u for u in req['inputs']};assert len(inputs)==len(req['inputs'])==5
    assert len({u['path'] for u in inputs.values()})==5
    assert {p.relative_to(HERE).as_posix() for p in (HERE/'inputs').rglob('*') if p.is_file()}=={u['path'] for u in inputs.values()}
    for u in inputs.values():
        p=local(u['path']);info=audio_info(p)
        assert sha(p)==u['sha256'] and info['pcmSha256']==u['pcmSha256'] and info['frames']==u['sampleCount']
    for scene in req['scenes']:
        assert scene['locale'] in ('en','de') and scene['rootAdoptionAllowed'] is False
        original=inputs[scene['originalInputId']];end=0
        for r in scene['replacements']:
            assert r['boundaryStatus']=='UNRESOLVED_AUDITION_HYPOTHESIS_NOT_VERIFIED_SAFE_CUT' and r['verifiedSpliceSample'] is None and r['allNewCandidatePcmMustBePreserved']
            a,b=r['proposedOriginalCutSamples'];assert isinstance(a,int) and isinstance(b,int) and end<a<b<original['sampleCount'];end=b
            for index,edge in [(a,'leftBoundaryEvidence'),(b,'rightBoundaryEvidence')]:
                gap=r[edge]['gapSeconds'];assert gap[0]*24000<index<gap[1]*24000
            assert inputs[r['candidateId']]['locale']==scene['locale'] and r['sourceSentence'] in scene['completeExpectedSpokenText']
    assert sum(len(s['replacements']) for s in req['scenes'])==3
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req,runtime
def require_actions():
    assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
    assert os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_REF')==REF and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    for n,e in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/n)==os.environ[e]
def provider_key():
    key=os.environ.get('GEMINI_API_KEY')
    if not key:raise RuntimeError('Required provider credential unavailable')
    return key
def selected(uid):
    req,runtime=validate();assert uid in IDS
    return req,runtime,next(s for s in req['scenes'] if s['id']==uid)
def folder(uid):assert uid in IDS;return OUT/uid
def failure(path,state,error):
    state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY',errorType=type(error).__name__,httpStatus=getattr(error,'code',None),finishedUTC=now());write(path,state)
def reserve(uid,kind,audio_sha):
    assert kind in ('blind-review','asr') and len(list(OUT.glob('*/'+kind+'-attempt.json')))<2
    p=folder(uid)/(kind+'-attempt.json')
    state={'atUTC':now(),'state':'RESERVED_BEFORE_INVOCATION_NO_RETRY','unitId':uid,'kind':kind,'callsReserved':1,'maximumPerUnit':1,'maximumForBatch':2,
      'providerCallsStarted':0,'asrInvocations':0,'audioSha256':audio_sha,'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'humanListeningApproved':False,'ttsCalls':0}
    exclusive(p,state);return p,state
def assemble(uid):
    require_actions();req,_,scene=selected(uid);inputs={i['id']:i for i in req['inputs']}
    path=folder(uid)/'audition.wav';assert not path.exists()
    attempt=folder(uid)/'assembly-attempt.json';state={'atUTC':now(),'state':'AUDITION_ASSEMBLY_RESERVED','unitId':uid,'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'adoptionAllowed':False}
    exclusive(attempt,state)
    try:
        original=inputs[scene['originalInputId']];old=pcm(local(original['path']));pieces=[];cursor=0;outpos=0;joins=[]
        for r in scene['replacements']:
            a,b=r['proposedOriginalCutSamples']
            block=old[cursor*2:a*2]
            pieces.append({'kind':'retained_original','inputId':original['id'],'inputSampleRange':[cursor,a],'outputSampleRange':[outpos,outpos+len(block)//2],'pcmSha256':digest(block),'data':block});outpos+=len(block)//2
            candidate=inputs[r['candidateId']];block=pcm(local(candidate['path']));assert len(block)//2==candidate['sampleCount']
            joins.append({'side':'original_to_candidate','candidateId':r['candidateId'],'outputSample':outpos,'timeSeconds':outpos/24000,'originalCutSample':a,'boundarySafeCutApproved':False})
            pieces.append({'kind':'complete_new_candidate','inputId':candidate['id'],'inputSampleRange':[0,candidate['sampleCount']],'outputSampleRange':[outpos,outpos+len(block)//2],'pcmSha256':digest(block),'data':block});outpos+=len(block)//2
            joins.append({'side':'candidate_to_original','candidateId':r['candidateId'],'outputSample':outpos,'timeSeconds':outpos/24000,'originalCutSample':b,'boundarySafeCutApproved':False});cursor=b
        block=old[cursor*2:];pieces.append({'kind':'retained_original','inputId':original['id'],'inputSampleRange':[cursor,original['sampleCount']],'outputSampleRange':[outpos,outpos+len(block)//2],'pcmSha256':digest(block),'data':block})
        combined=b''.join(p['data'] for p in pieces)
        path.parent.mkdir(parents=True,exist_ok=True)
        with wave.open(str(path),'wb') as wav:wav.setparams((1,2,24000,0,'NONE','not compressed'));wav.writeframes(combined)
        actual=pcm(path);assert actual==combined
        for piece in pieces:
            a,b=piece['outputSampleRange'];assert actual[a*2:b*2]==piece['data'] and digest(actual[a*2:b*2])==piece['pcmSha256']
        expected=original['sampleCount']+sum(inputs[r['candidateId']]['sampleCount']-(r['proposedOriginalCutSamples'][1]-r['proposedOriginalCutSamples'][0]) for r in scene['replacements'])
        assert len(actual)//2==expected
        write(folder(uid)/'splice-ledger.json',{'unitId':uid,'originalInputId':original['id'],'inputWavHashes':{i['id']:i['sha256'] for i in inputs.values() if i['id']==original['id'] or i['id'] in [r['candidateId'] for r in scene['replacements']]},
            'pieces':[{k:v for k,v in p.items() if k!='data'} for p in pieces],'joins':joins,'originalDeletedSampleRanges':[r['proposedOriginalCutSamples'] for r in scene['replacements']],
            'outputWavSha256':sha(path),'outputPcmSha256':digest(actual),'outputSamples':len(actual)//2,'allOutsideOriginalPcmVerified':True,'allNewCandidatePcmVerified':True,
            'addedPaddingSamples':0,'normalizationTimeStretchCrossfadeOrGain':False,'safeCutApproval':False,'acceptedOriginalFilesModified':False,'rootAcousticJoinReviewStillRequired':True})
        state.update(state='ASSEMBLED_AUDITION_PREVIEW_NOT_ADOPTED',finishedUTC=now(),audioSha256=sha(path),audio=audio_info(path),allPiecesByteVerified=True)
        write(attempt,state)
    except Exception as error:failure(attempt,state,error);raise RuntimeError('Audition assembly failed; preserve evidence, no retry') from None
def uploaded(uid,artifact_id,artifact_digest):
    require_actions();selected(uid);path=folder(uid)/'audition.wav';state=read(folder(uid)/'assembly-attempt.json')
    assert state['state']=='ASSEMBLED_AUDITION_PREVIEW_NOT_ADOPTED' and sha(path)==state['audioSha256']
    assert re.fullmatch('[1-9][0-9]*',artifact_id) and re.fullmatch(r'(?:sha256:)?[0-9a-fA-F]{64}',artifact_digest)
    exclusive(folder(uid)/'upload-receipt.json',{'atUTC':now(),'artifactId':artifact_id,'artifactDigest':artifact_digest,'audioSha256':sha(path),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'beforeDiagnostics':True})
def verified_audio(uid):
    path=folder(uid)/'audition.wav';state=read(folder(uid)/'assembly-attempt.json');upload=read(folder(uid)/'upload-receipt.json')
    assert state['state']=='ASSEMBLED_AUDITION_PREVIEW_NOT_ADOPTED' and state['audioSha256']==sha(path)==upload['audioSha256']
    assert state['audio']==audio_info(path) and upload['beforeDiagnostics'] and upload['githubRunId']==os.environ.get('GITHUB_RUN_ID')
    ledger=read(folder(uid)/'splice-ledger.json');assert ledger['outputWavSha256']==sha(path) and ledger['allOutsideOriginalPcmVerified'] and ledger['allNewCandidatePcmVerified'] and not ledger['safeCutApproval']
    return path,state
def preflight():
    require_actions();validate();p=OUT/'model-preflight-attempt.json';state={'atUTC':now(),'state':'METADATA_GET_RESERVED_NO_RETRY','callsStarted':0,'maximumCalls':1};exclusive(p,state)
    try:
        key=provider_key();request=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+MODEL,headers={'x-goog-api-key':key},method='GET')
        state.update(state='METADATA_GET_STARTED_OUTCOME_UNKNOWN',callsStarted=1);write(p,state)
        with urllib.request.urlopen(request,timeout=60) as response:raw=response.read()
        (OUT/'model-availability.raw.json').write_bytes(raw);data=json.loads(raw)
        assert data['name']=='models/'+MODEL and isinstance(data['supportedGenerationMethods'],list) and data['supportedGenerationMethods']
        write(OUT/'model-preflight.json',{'model':MODEL,'serverName':data['name'],'supportedGenerationMethods':data['supportedGenerationMethods'],'requestSha256':sha(HERE/'request.json'),'workerSha256':sha(HERE/'worker.py'),'githubRunId':os.environ.get('GITHUB_RUN_ID'),'fallback':False})
        state.update(state='EXACT_MODEL_AVAILABLE',finishedUTC=now());write(p,state)
    except Exception as error:failure(p,state,error);raise RuntimeError('Preferred model unresolved; no review or fallback') from None
def require_preflight():
    r=read(OUT/'model-preflight.json');assert read(OUT/'model-preflight-attempt.json')['state']=='EXACT_MODEL_AVAILABLE'
    assert r['model']==MODEL and r['requestSha256']==sha(HERE/'request.json') and r['workerSha256']==sha(HERE/'worker.py') and r['githubRunId']==os.environ.get('GITHUB_RUN_ID')
def prior_complete(uid):
    for previous in IDS[:IDS.index(uid)]:compare(previous)
def blind_review(uid):
    require_actions();req,_,scene=selected(uid);require_preflight();prior_complete(uid);path,voice=verified_audio(uid)
    joins=read(folder(uid)/'splice-ledger.json')['joins'];points=[j['timeSeconds'] for j in joins]
    prompt=('Listen to the complete FIRST attached WAV, a candidate full-scene audition, especially the exact splice points '+json.dumps(points)+' seconds. The SECOND WAV is the unchanged original scene for acoustic context/voice comparison. At each splice inspect the previous and following complete utterance, clipped initial/final syllables, repetitions, double pauses or unnatural gaps, abrupt level/timbre/prosody changes, and intelligibility. Transcribe the FIRST recording exactly as heard and each +/-2 second join window without inferring expected words from the original. Return JSON: transcript, joinWindowTranscripts, findings(array with startSeconds/endSeconds on FIRST timeline, heardText, issueType, observation, certainty), overall(needs_review/uncertain/no_defect_detected), voiceContinuity, limitations. No script is supplied. Do not approve a cut merely because energy is low. Retain any uncertainty and do not claim human listening or speaker certification. Do not generate audio.')
    prompt+=' Include mandatory joinAssessments: exactly one entry per supplied splice point, in the same order. Each entry must have joinTimeSeconds (copy the supplied point), status (needs_review/uncertain/no_defect_detected), observations, leftSpeechIntact (true/false/null), rightSpeechIntact (true/false/null), pauseAndVoice. If a transition cannot be judged, mark it uncertain rather than omit it.'
    original=next(i for i in req['inputs'] if i['id']==scene['originalInputId'])
    payload={'model':MODEL,'input':[{'type':'text','text':prompt},{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(path.read_bytes()).decode()},{'type':'audio','mime_type':'audio/wav','data':base64.b64encode(local(original['path']).read_bytes()).decode()}],
       'response_format':{'type':'text','mime_type':'application/json'},'generation_config':{'thinking_level':'high','max_output_tokens':32768}}
    data=json.dumps(payload).encode();assert len(data)<20000000
    write(folder(uid)/'blind-review-prompt.json',{'prompt':prompt,'audioSha256':sha(path),'originalComparisonWavSha256':original['sha256'],'joinPointsSeconds':points,'sourceScriptOrCriteriaSupplied':False})
    p,state=reserve(uid,'blind-review',sha(path))
    try:
        key=provider_key();request=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/interactions',data=data,headers={'x-goog-api-key':key,'Content-Type':'application/json'},method='POST')
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN',providerCallsStarted=1,startedUTC=now());write(p,state)
        with urllib.request.urlopen(request,timeout=900) as response:raw=response.read()
        (folder(uid)/'blind-review-response.raw.json').write_bytes(raw);parsed=json.loads(raw)
        text='\n'.join(c.get('text','') for s in parsed.get('steps',[]) if s.get('type')=='model_output' for c in s.get('content',[]) if c.get('type')=='text')
        result=json.loads(text)
        write(folder(uid)/'blind-review.parsed-unvalidated.json',result)
        assert isinstance(result['transcript'],str) and isinstance(result['findings'],list) and result['overall'] in ('needs_review','uncertain','no_defect_detected')
        assessments=result['joinAssessments'];assert isinstance(assessments,list) and len(assessments)==len(points)
        for point,assessment in zip(points,assessments):
            assert math.isfinite(float(assessment['joinTimeSeconds'])) and abs(float(assessment['joinTimeSeconds'])-point)<.02
            assert assessment['status'] in ('needs_review','uncertain','no_defect_detected') and isinstance(assessment['observations'],str) and isinstance(assessment['pauseAndVoice'],str)
            assert assessment['leftSpeechIntact'] in (True,False,None) and assessment['rightSpeechIntact'] in (True,False,None)
        invalid=[]
        for i,f in enumerate(result['findings']):
            try:
                a,b=float(f['startSeconds']),float(f['endSeconds']);assert math.isfinite(a) and math.isfinite(b) and 0<=a<b<=voice['audio']['durationSeconds']+.25
            except (KeyError,TypeError,ValueError,AssertionError):invalid.append(i)
        write(folder(uid)/'blind-review.json',{'audioSha256':sha(path),'result':result,'invalidTimestampFindingIndexes':invalid,'humanListeningApproved':False,'rootAdoptionApproved':False,'actualJoinedAudioSupplied':True})
        state.update(state='MODEL_JOIN_DIAGNOSTIC_ONLY',finishedUTC=now(),invalidTimestampFindingIndexes=invalid);write(p,state)
        if invalid:raise RuntimeError('Invalid timestamps; raw preserved and later calls blocked')
    except Exception as error:failure(p,state,error);raise RuntimeError('Single join diagnostic failed; no retry') from None
def verify_wheel():
    _,runtime=validate();wheels=list((HERE/'wheels').glob('faster_whisper-1.2.1-*.whl'));assert len(wheels)==1 and sha(wheels[0])==runtime['asr']['wheelSha256']
    write(OUT/'wheel-verification.json',{'sha256':sha(wheels[0]),'version':'1.2.1'})
def asr(uid):
    require_actions();_,runtime,scene=selected(uid);path,voice=verified_audio(uid)
    from faster_whisper import WhisperModel
    from huggingface_hub import snapshot_download
    cfg=runtime['asr'];assert importlib.metadata.version('faster-whisper')==cfg['packageVersion'];verify_wheel()
    modelpath=Path(snapshot_download(repo_id=cfg['modelRepo'],revision=cfg['modelRevision'],cache_dir=str(HERE/'model-cache'),allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']))
    write(folder(uid)/'asr-resolved-runtime.json',{'modelRepo':cfg['modelRepo'],'modelRevision':cfg['modelRevision'],'packageVersions':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'files':[{'name':p.relative_to(modelpath).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(modelpath.rglob('*')) if p.is_file()]})
    model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
    p,state=reserve(uid,'asr',sha(path))
    try:
        state.update(state='ASR_INVOCATION_STARTED_OUTCOME_UNKNOWN',asrInvocations=1,startedUTC=now());write(p,state)
        segments,info=model.transcribe(str(path),language=scene['locale'],word_timestamps=True,beam_size=5,temperature=0,vad_filter=False,condition_on_previous_text=False)
        rows=[];words=[];issues=[]
        for s in segments:
            ws=[]
            for i,w in enumerate(s.words or []):
                word={'actualWordIndex':len(words),'segmentId':s.id,'wordIndex':i,'word':w.word,'start':float(w.start),'end':float(w.end),'probability':float(w.probability)}
                if not(math.isfinite(word['start']) and math.isfinite(word['end']) and 0<=word['start']<=word['end']<=voice['audio']['durationSeconds']+.25):issues.append({'actualWordIndex':len(words),'kind':'INVALID_TIMESTAMP'})
                elif word['start']==word['end']:issues.append({'actualWordIndex':len(words),'kind':'ZERO_DURATION_REQUIRES_GROUP_REVIEW'})
                words.append(word);ws.append(word)
            rows.append({'id':s.id,'text':s.text,'start':s.start,'end':s.end,'words':ws})
        write(folder(uid)/'asr-word-timestamps.json',{'audioSha256':sha(path),'audio':voice['audio'],'language':info.language,'segments':rows,'words':words,'wordCount':len(words),'timingIssues':issues,'settings':cfg,'initialPromptSupplied':False,'referenceTranscriptSupplied':False,'resolvedRuntimeSha256':sha(folder(uid)/'asr-resolved-runtime.json'),'humanListeningApproved':False})
        assert words and not any(i['kind']=='INVALID_TIMESTAMP' for i in issues),'Empty/invalid ASR, no later calls'
        state.update(state='ASR_DIAGNOSTIC_ONLY',finishedUTC=now(),wordCount=len(words));write(p,state)
    except Exception as error:failure(p,state,error);raise RuntimeError('Single actual audition ASR failed; no retry') from None
def compare(uid):
    _,_,scene=selected(uid);path,_=verified_audio(uid);blind=read(folder(uid)/'blind-review.json');asr=read(folder(uid)/'asr-word-timestamps.json')
    assert blind['audioSha256']==asr['audioSha256']==sha(path) and not blind['invalidTimestampFindingIndexes']
    assert read(folder(uid)/'blind-review-attempt.json')['state']=='MODEL_JOIN_DIAGNOSTIC_ONLY' and read(folder(uid)/'asr-attempt.json')['state']=='ASR_DIAGNOSTIC_ONLY'
    import difflib
    heard=''.join(s['text'] for s in asr['segments'])
    write(folder(uid)/'reference-comparison.json',{'audioSha256':sha(path),'expectedTextNotSuppliedToReviewers':scene['completeExpectedSpokenText'],'asrTranscript':heard,'blindTranscript':blind['result']['transcript'],'asrWordDiffDiagnosticOnly':list(difflib.ndiff(scene['completeExpectedSpokenText'].split(),heard.split())),'humanListeningApproved':False,'rootSafeCutApproval':False,'adoptionAllowed':False,'rootReviewsActualJoinEvidenceBeforeAdoption':True})
def summarize():
    require_actions();req,_=validate()
    for s in req['scenes']:compare(s['id'])
    write(OUT/'summary.json',{'sceneIds':list(IDS),'maximumBlindReviews':2,'maximumASRInvocations':2,'ttsCalls':0,'automaticRetries':0,'auditionPreviewsAssembled':True,'acceptedAudioModified':False,'humanListeningApproved':False,'rootAdoptionAllowed':False})
def main():
    p=argparse.ArgumentParser();p.add_argument('command',choices=['validate','assemble','uploaded','preflight','verify-wheel','blind-review','asr','compare','summarize']);p.add_argument('--unit',choices=IDS);p.add_argument('--artifact-id');p.add_argument('--artifact-digest');a=p.parse_args()
    try:
        if a.command=='validate':validate()
        elif a.command=='preflight':preflight()
        elif a.command=='verify-wheel':verify_wheel()
        elif a.command=='summarize':summarize()
        elif a.command=='uploaded':uploaded(a.unit,a.artifact_id,a.artifact_digest)
        else:{'assemble':assemble,'blind-review':blind_review,'asr':asr,'compare':compare}[a.command](a.unit)
    except Exception as error:
        exclusive(OUT/(a.unit or 'preflight')/('failure-'+str(time.time_ns())+'.json'),{'atUTC':now(),'operation':a.command,'errorType':type(error).__name__,'httpStatus':getattr(error,'code',None),'noRetry':True,'secretPayloadLogged':False})
        raise SystemExit('Bounded audition operation failed. Evidence preserved; no retry.') from None
if __name__=='__main__':main()

