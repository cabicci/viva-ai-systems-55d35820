from pathlib import Path
import os,json,hashlib,subprocess,io,wave,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));O=R/'assembled';O.mkdir(exist_ok=True);I=R/'received';I.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
def receive(run,artifact,target):
 target.mkdir(parents=True,exist_ok=True)
 subprocess.run(['gh','run','download',str(run),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',artifact,'--dir',str(target)],check=True)
def pcm(path,expected=None):
 b=path.read_bytes()
 if expected:assert sha(b)==expected
 with wave.open(io.BytesIO(b),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000)
  raw=f.readframes(f.getnframes())
 return raw,sha(b)
def wav(name,data):
 with wave.open(str(O/name),'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(data)
 return {'file':name,'sha256':sha((O/name).read_bytes()),'pcmSHA256':sha(data),'durationSeconds':len(data)/48000}
segments=[];records=[]
for c in M['reuse']:
 d=I/c['id'];receive(c['run'],c['artifact'],d);matches=list(d.rglob(c['file']));assert len(matches)==1
 raw,h=pcm(matches[0],c['sha256']);segments.append(raw);records.append(dict(c,wavSHA256=h,pcmSHA256=sha(raw),frames=len(raw)//2,durationSeconds=len(raw)/48000,sourceRun=c['run']))
for c in M['segments']:
 d=I/c['id'];receive(os.environ['GITHUB_RUN_ID'],'fate-l01-listening-v2-'+c['id'],d);matches=list(d.rglob(c['id']+'.wav'));matches=[p for p in matches if p.parent==d];assert len(matches)==1
 v=json.loads((d/'verification.json').read_text());raw,h=pcm(matches[0],v['wavSHA256']);segments.append(raw);records.append({'id':c['id'],'voice':c['voice'],'text':c['spokenText'],'wavSHA256':h,'pcmSHA256':sha(raw),'frames':len(raw)//2,'durationSeconds':len(raw)/48000,'ownerAccepted':False,'sourceRun':os.environ['GITHUB_RUN_ID']})
# Add only explicit silence at complete-sentence boundaries; preserve every input PCM sample.
gaps=[.18,.45,.18,.18];data=b'';timeline=[]
for i,(raw,rec) in enumerate(zip(segments,records)):
 start=len(data)//2;data+=raw;end=len(data)//2
 timeline.append(dict(rec,startFrame=start,endFrame=end,startSeconds=start/24000,endSeconds=end/24000))
 if i<len(gaps):data+=b'\0\0'*round(gaps[i]*24000)
outputs=[wav('tomato-calculation-sample.wav',data),wav('voice-B-tomato-concentration.wav',segments[0]+b'\0\0'*round(gaps[0]*24000)+segments[1]),wav('voice-A-calculation.wav',segments[2]+b'\0\0'*round(gaps[2]*24000)+segments[3]+b'\0\0'*round(gaps[3]*24000)+segments[4])]
for x,raw in zip(timeline,segments):assert data[x['startFrame']*2:x['endFrame']*2]==raw
report={'status':'LISTENING_SAMPLE_ONLY_PENDING_OWNER_APPROVAL','createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'outputs':outputs,'segments':timeline,'reusedPCMPreservedExactly':True,'acceptedBPCMPreservedExactly':True,'crossfade':False,'resampling':False,'speechRateChange':False,'newSpeechCalls':3,'analysisCallsBudget':6,'humanListeningApproved':False,'renderAllowed':False,'fullLessonChanged':False,'wordTimings':'Not produced before listening approval. Segment boundaries measured from PCM frame counts, not text.'}
(O/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(O/'spoken-script.txt').write_text('\n\n'.join(x['text'] for x in records)+'\n',encoding='utf-8');print(json.dumps({'status':report['status'],'durationSeconds':outputs[0]['durationSeconds']}))
