from pathlib import Path
import os,sys,json,subprocess,hashlib,wave,shutil
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));sid=sys.argv[1]
assert hashlib.sha256((R/'request.json').read_bytes()).hexdigest()==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
if any(x['id']==sid for x in M['segments']):
 subprocess.run([sys.executable,str(R/'generate.py'),sid],check=True);raise SystemExit()
C=next(x for x in M['retained'] if x['id']==sid);I=R/'received';I.mkdir(exist_ok=True);O=R/'output';O.mkdir(exist_ok=True)
subprocess.run(['gh','run','download',str(C['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',C['artifact'],'--dir',str(I)],check=True)
matches=list(I.rglob(C['file']));assert len(matches)==1;b=matches[0].read_bytes();assert hashlib.sha256(b).hexdigest()==C['sha256'];f=O/(sid+'.wav');f.write_bytes(b)
with wave.open(str(f),'rb') as w:
 assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
 raw=w.readframes(w.getnframes());frames=w.getnframes()
v={'wavSHA256':C['sha256'],'pcmSHA256':hashlib.sha256(raw).hexdigest(),'durationSeconds':frames/24000,'frames':frames,'model':M['model'],'voice':C['voice'],'text':C['text'],'reusedUnchanged':True,'speechCalls':0,'sourceRun':C['run'],'sourceArtifact':C['artifact'],'humanListeningApproved':False}
(O/'verification.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'id':sid,'reused':True,'durationSeconds':v['durationSeconds']}))
