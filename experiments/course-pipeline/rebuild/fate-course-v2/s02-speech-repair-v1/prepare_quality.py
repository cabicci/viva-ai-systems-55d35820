from pathlib import Path
import os,json,sys,hashlib,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=M['segments'][0];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and len(M['segments'])==M['maxSpeechCalls']==1
source=R/'output'/(C['id']+'.wav');v=json.loads((source.parent/'verification.json').read_text());assert sha(source)==v['wavSHA256'] and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256'] and v['voice']=='Kore' and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts'
with wave.open(str(source),'rb') as f:assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);assert f.getnframes()==v['frames']
ref={'run':int(os.environ['GITHUB_RUN_ID']),'artifact':'fate-v2-s02-repair-original-'+C['id'],'file':source.name,'sha256':sha(source),'localFile':source.relative_to(R).as_posix()};part=dict(C,audio=ref,checks=['blind','reference'],retainedPasses={},previousAllegations=[],priorEvidence=M['repairEvidence'])
review={'id':M['id']+'-review','model':M['analysisModel'],'newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':2,'reservationUSD':.20,'reviewCeilingUSD':.20,'artifactPrefix':'fate-v2-s02-repair-review-','parts':[part]}
clock={'id':M['id']+'-clock','newProviderCalls':0,'parts':[part]}
for n,x in [('runtime-review-request.json',review),('clock-request.json',clock)]: (R/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(R/'output/quality-binding.en.json').write_text(json.dumps({'audio':ref,'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'reviewRequestSHA256':sha(R/'runtime-review-request.json'),'clockRequestSHA256':sha(R/'clock-request.json')},indent=2))
