"""Offline-only staging/join helpers. No network or provider calls. Preserve original audio once."""
from pathlib import Path
import hashlib,json,shutil
BULKY=('voice.wav','provider-audio.original.bin','tts-response.raw.json')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):
    p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
    with p.open('x',encoding='utf-8',newline='\n')as f:json.dump(d,f,ensure_ascii=False,indent=2);f.write('\n')
def pin(p):return {'sha256':sha(p),'bytes':Path(p).stat().st_size}
def stage_unit(source,target,*,unit,request_sha,worker_sha,run_id,commit):
    source,target=Path(source),Path(target);assert not target.exists();target.mkdir(parents=True)
    # Preserve even a partial or failed attempt. Never pretend missing audio is complete.
    for p in source.rglob('*'):
        assert not p.is_symlink()
        if p.is_file()and p.name not in BULKY:
            dest=target/p.relative_to(source);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
    upload=source/'audio-upload-receipt.json';attempt=source/'tts-attempt.json'
    ready=upload.exists()and attempt.exists()and all((source/n).is_file()for n in BULKY)
    ref={'schema':'immutable-audio-reference-v1','unitId':unit,'requestSha256':request_sha,'workerSha256':worker_sha,'githubRunId':str(run_id),'commit':commit,'originalsIncludedInThisArtifact':False,'state':'AUDIO_NOT_COMPLETED_OR_NOT_UPLOADED'}
    if ready:
        receipt,state=read(upload),read(attempt)
        assert(state['unitId'],state['requestSha256'],state['workerSha256'],str(state['githubRunId']))==(unit,request_sha,worker_sha,str(run_id))
        assert receipt['audioSha256']==state['sha256']==sha(source/'voice.wav')
        assert str(receipt['githubRunId'])==str(run_id)
        assert receipt['artifactId']and receipt['artifactDigest']
        assert state['state']=='GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW'
        ref.update(state='REFERENCE_REQUIRES_VERIFIED_ORIGINAL_ARTIFACT',audioArtifactId=str(receipt['artifactId']),audioArtifactDigest=receipt['artifactDigest'],files={n:pin(source/n)for n in BULKY})
    write(target/'immutable-audio-reference.json',ref)
    return ref
def stage_complete(source,target,*,units,request_sha,worker_sha,run_id,commit):
    source,target=Path(source),Path(target);assert not target.exists();target.mkdir(parents=True)
    for p in source.iterdir():
        assert not p.is_symlink()
        if p.is_file():shutil.copyfile(p,target/p.name)
    refs=[]
    for unit in units:
        if(source/unit).exists():refs.append(stage_unit(source/unit,target/unit,unit=unit,request_sha=request_sha,worker_sha=worker_sha,run_id=run_id,commit=commit))
        else:refs.append({'unitId':unit,'state':'AUDIO_NOT_STARTED','originalsIncludedInThisArtifact':False})
    write(target/'bundle-completeness.json',{'schema':'thin-bundle-v1','requestSha256':request_sha,'workerSha256':worker_sha,'githubRunId':str(run_id),'commit':commit,'references':refs,'state':'DIAGNOSTICS_BUNDLE_NOT_SELF_CONTAINED_AUDIO','actualAudioReceived':False})
def join_unit(original,diagnostics,target,*,original_receipt,diagnostics_receipt,unit,request_sha,worker_sha,run_id,commit):
    """Only durably ZIP-digest verified inputs may be joined. Missing/incorrect reference fails closed."""
    original,diagnostics,target=map(Path,[original,diagnostics,target]);assert not target.exists()
    ref=read(diagnostics/'immutable-audio-reference.json')
    assert ref['state']=='REFERENCE_REQUIRES_VERIFIED_ORIGINAL_ARTIFACT'
    assert(ref['unitId'],ref['requestSha256'],ref['workerSha256'],str(ref['githubRunId']),ref['commit'])==(unit,request_sha,worker_sha,str(run_id),commit)
    receipt=original_receipt
    assert str(receipt['artifactId'])==ref['audioArtifactId']and receipt['apiDigest']==ref['audioArtifactDigest']
    assert receipt['apiDigest'].removeprefix('sha256:')==receipt['zipSHA256']
    assert(receipt['requestSha256'],receipt['workerSha256'],str(receipt['runId']),receipt['commit'])==(request_sha,worker_sha,str(run_id),commit)
    dr=diagnostics_receipt
    assert dr['apiDigest'].removeprefix('sha256:')==dr['zipSHA256']
    assert(dr['requestSha256'],dr['workerSha256'],str(dr['runId']),dr['commit'])==(request_sha,worker_sha,str(run_id),commit)
    for p in diagnostics.rglob('*'):
        assert not p.is_symlink()
        if p.is_file():
            matches=[f for f in dr['files']if f['unitRelativePath']==p.relative_to(diagnostics).as_posix()]
            assert len(matches)==1 and matches[0]['sha256']==sha(p)and matches[0]['bytes']==p.stat().st_size
    assert set(ref['files'])==set(BULKY)
    for n in BULKY:
        assert pin(original/n)==ref['files'][n]
        matches=[f for f in receipt['files']if Path(f['path']).name==n]
        assert len(matches)==1 and matches[0]['sha256']==ref['files'][n]['sha256']and matches[0]['bytes']==ref['files'][n]['bytes']
    attempt=read(diagnostics/'tts-attempt.json');upload=read(diagnostics/'audio-upload-receipt.json')
    assert(attempt['unitId'],attempt['requestSha256'],attempt['workerSha256'],str(attempt['githubRunId']))==(unit,request_sha,worker_sha,str(run_id))
    assert attempt['sha256']==upload['audioSha256']==ref['files']['voice.wav']['sha256']
    assert str(upload['artifactId'])==ref['audioArtifactId']and upload['artifactDigest']==ref['audioArtifactDigest']
    # Re-check diagnostic evidence already bound by worker to this exact WAV.
    for n in ['blind-review.json','asr-word-timestamps.json','reference-comparison.json']:
        p=diagnostics/n
        if p.exists():
            d=read(p)
            assert d['audioSha256']==ref['files']['voice.wav']['sha256']
    target.mkdir(parents=True)
    for p in diagnostics.rglob('*'):
        if p.is_file():dest=target/p.relative_to(diagnostics);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
    for n in BULKY:shutil.copyfile(original/n,target/n)
    write(target/'join-verification.json',{'state':'ORIGINALS_AND_DIAGNOSTICS_JOINED_EXACT_HASHES','unitId':unit,'referenceSha256':sha(diagnostics/'immutable-audio-reference.json'),'audioArtifactId':ref['audioArtifactId'],'requestSha256':request_sha,'workerSha256':worker_sha,'runId':str(run_id),'commit':commit,'allRequiredOriginalsPresent':True,'actualAudioQAAccepted':False,'newProviderCalls':0})
