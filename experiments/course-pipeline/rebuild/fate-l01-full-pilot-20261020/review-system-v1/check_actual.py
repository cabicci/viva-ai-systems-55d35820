import json,subprocess,sys,hashlib
from pathlib import Path
R=Path(__file__).parent;report=json.loads((R/'report.json').read_text(encoding='utf-8'));out=R/'output';out.mkdir(exist_ok=True);decisions=[]
for s in report['scenes']:
 wav=R/'audio'/(s['id']+'.wav');assert hashlib.sha256(wav.read_bytes()).hexdigest()==s['audioSHA256']
 r=subprocess.run([sys.executable,'-B',str(R/'gate.py'),'--report',str(R/'report.json'),'--audio',str(wav),'--manifest',str(R/'manifest.json'),'--scene',s['id']],capture_output=True,text=True)
 decision=json.loads(r.stdout);assert r.returncode==2 and decision['allowed'] is False,'Current unapproved audio must be blocked'
 decisions.append(decision)
result={'status':'GUARD_VERIFIED_CURRENT_AUDIO_BLOCKED','renderStarted':False,'speechGenerated':False,'scenes':decisions,'assertion':'All ten actual source WAV hashes verified; gate exits 2 before rendering; current full audio has no fabricated listening approval.'}
(out/'gate-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'blockedScenes':len(decisions),'renderStarted':False}))