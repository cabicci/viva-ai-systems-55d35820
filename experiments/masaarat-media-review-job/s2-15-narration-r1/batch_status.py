"""Measure completed artifacts only; never infer acceptance or retry a provider."""
import json,hashlib,wave
from pathlib import Path
HERE=Path(__file__).resolve().parent
def inventory(req,root):
    assert len(req['units'])==64
    rows=[]
    for unit in req['units']:
        folder=root/unit['id'];wav=folder/'voice.wav'
        row={'unitId':unit['id'],'candidateWavValid':False,'uploadedBeforeDiagnostics':False,'diagnosticsComplete':False,'humanListeningApproved':False,'durationSeconds':None}
        try:
            with wave.open(str(wav),'rb') as w:
                assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
                frames=w.getnframes();pcm=w.readframes(frames);assert frames>=24000 and len(pcm)==frames*2
            row.update(candidateWavValid=True,wavSHA256=hashlib.sha256(wav.read_bytes()).hexdigest(),pcmSHA256=hashlib.sha256(pcm).hexdigest(),durationSeconds=frames/24000)
            receipt=json.loads((folder/'audio-upload-receipt.json').read_text('utf8'))
            row['uploadedBeforeDiagnostics']=receipt['audioSha256']==row['wavSHA256'] and receipt['beforeReviewAndASR'] is True and bool(receipt['artifactId']) and bool(receipt['artifactDigest'])
            for name in ['blind-review.json','asr-word-timestamps.json','reference-comparison.json']:
                result=json.loads((folder/name).read_text('utf8'));assert result['audioSha256']==row['wavSHA256']
            assert json.loads((folder/'blind-review-attempt.json').read_text('utf8'))['state']=='MODEL_DIAGNOSTIC_ONLY'
            assert json.loads((folder/'asr-attempt.json').read_text('utf8'))['state']=='ASR_DIAGNOSTIC_ONLY'
            row['diagnosticsComplete']=True
        except (OSError,KeyError,ValueError,AssertionError,wave.Error):pass
        row['diagnosticFilesPresent']={name:(folder/name).exists() for name in ['blind-review.json','asr-word-timestamps.json','reference-comparison.json']}
        rows.append(row)
    return {'status':'CANDIDATE_AUDIO_AND_DIAGNOSTIC_INVENTORY_ONLY','requiredUnits':64,'validCandidateWavs':sum(r['candidateWavValid'] for r in rows),'uploadedWavs':sum(r['uploadedBeforeDiagnostics'] for r in rows),'completedDiagnostics':sum(r['diagnosticsComplete'] for r in rows),'all64Required':True,'humanListeningApproved':False,'assemblyPerformed':False,'units':rows}
if __name__=='__main__':
    req=json.loads((HERE/'request.json').read_text('utf8'));report=inventory(req,HERE/'output')
    (HERE/'output').mkdir(exist_ok=True)
    (HERE/'output/batch-status.json').write_text(json.dumps(report,indent=2)+'\n','utf8')
    print(json.dumps({k:v for k,v in report.items() if k!='units'},indent=2))
    raise SystemExit(0 if report['validCandidateWavs']==report['uploadedWavs']==report['completedDiagnostics']==64 else 1)
