from pathlib import Path
import os,sys,json,hashlib,subprocess,wave,time,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(c for c in M['parts'] if c['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and sha(R/'generation-request.json')==M['sourceGenerationRequestSHA256']
assert M['newSpeechCalls']==M['newImageCalls']==0 and M['maxAnalysisCalls']==2*len(M['parts'])==184 and M['reservationUSD']==M['reviewCeilingUSD']==6
source=json.loads((R/'generation-request.json').read_text(encoding='utf8'));expected=next(c for c in source['segments'] if c['id']==C['id']);assert all(C[k]==expected[k] for k in ['spokenText','textSHA256','deliverySHA256','voice','locale','referenceVoice'])
assert hashlib.sha256(C['spokenText'].encode()).hexdigest()==C['textSHA256']
run=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/runs/'+str(M['sourceRun'])]));assert run['head_sha']==M['sourceHead']
state={'id':C['id'],'sourceRun':M['sourceRun'],'sourceHead':M['sourceHead'],'status':'WAITING_FOR_ORIGINAL_ARTIFACT','providerCalls':0,'downloadAttempts':[],'startedUTC':now()};save(O/'preparation.en.json',state)
artifact=M['sourceArtifactPrefix']+C['id'];source_dir=None
for i in range(20):
 d=R/'downloads'/('source-attempt-'+str(i));d.mkdir(parents=True)
 r=subprocess.run(['gh','run','download',str(M['sourceRun']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',artifact,'--dir',str(d)],capture_output=True)
 state['downloadAttempts'].append({'attempt':i+1,'status':'received' if r.returncode==0 else 'not_available_or_read_failed','utc':now()});save(O/'preparation.en.json',state)
 if r.returncode==0:source_dir=d;break
 time.sleep(30)
assert source_dir is not None,'Original artifact unavailable within bounded read-only waiting window; no provider request made'
a=source_dir/(C['id']+'.wav');v=json.loads((source_dir/'verification.json').read_text());attempt=json.loads((source_dir/'attempt.json').read_text());assert str(attempt['runID'])==str(M['sourceRun']) and attempt['commit']==M['sourceHead']
assert sha(a)==v['wavSHA256'] and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['voice']==C['voice'] and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256']
with wave.open(str(a),'rb') as w:assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000);assert w.getnframes()==v['frames'];pcm=w.readframes(w.getnframes())
assert hashlib.sha256(pcm).hexdigest()==v['pcmSHA256']
ref={'run':M['sourceRun'],'artifact':artifact,'file':a.name,'sha256':sha(a),'localFile':a.relative_to(R).as_posix()};part=dict(C,audio=ref)
review={'id':M['id']+'-'+C['id'],'model':M['model'],'newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':2,'reservationUSD':M['reservationUSD'],'reviewCeilingUSD':M['reviewCeilingUSD'],'artifactPrefix':'fate-v2-rest-review-','parts':[part]};save(R/'runtime-review-request.json',review)
clock={'id':M['id']+'-clock-'+C['id'],'newProviderCalls':0,'parts':[part]};save(R/'clock-request.json',clock)
state.update(status='EXACT_ORIGINAL_VERIFIED_BEFORE_ANY_ANALYSIS',wavSHA256=sha(a),pcmSHA256=v['pcmSHA256'],sourceAudioFrames=v['frames'],durationSeconds=v['durationSeconds'],runtimeReviewSHA256=sha(R/'runtime-review-request.json'),clockRequestSHA256=sha(R/'clock-request.json'),finishedUTC=now());save(O/'preparation.en.json',state)
print(json.dumps({'id':C['id'],'status':state['status'],'seconds':v['durationSeconds']}))
