from pathlib import Path
import os,json,hashlib,subprocess,shutil,sys,wave,math
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));sid='L01-S09-connected-v6';c=next(x for x in M['reuse'] if x['id']==sid);Q=R/'diagnostic';(Q/'source').mkdir(parents=True,exist_ok=True);I=R/'diag-received';I.mkdir(exist_ok=True)
assert hashlib.sha256((R/'request.json').read_bytes()).hexdigest()==os.environ['EXPECTED_REQUEST_SHA256']
subprocess.run(['gh','run','download',str(c['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',c['artifact'],'--dir',str(I)],check=True);f=I/c['file'];assert hashlib.sha256(f.read_bytes()).hexdigest()==c['sha256'];shutil.copyfile(f,Q/'source'/c['file']);shutil.copyfile(R/'audio_review_worker.py',Q/'audio_review_worker.py')
with wave.open(str(f),'rb') as w:duration=w.getnframes()/w.getframerate()
chunks=math.ceil(duration/30);assert chunks<=3
m={'id':'S09-short-window-diagnostic','sourceMode':'generated_wav','sourceSHA256':c['sha256'],'model':M['analysisModel'],'automaticRetries':0,'speechCalls':0,'coreSeconds':30,'contextSeconds':2,'analysisPasses':['blind'],'maxAnalysisCalls':chunks,'scenes':[{'id':sid,'voice':'Kore','start':0,'duration':duration,'text':'','chunks':chunks,'sourceAudioSHA256':c['sha256']}]}
p=Q/'review-request.json';p.write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8');env=dict(os.environ,EXPECTED_REQUEST_SHA256=hashlib.sha256(p.read_bytes()).hexdigest());subprocess.run([sys.executable,str(Q/'audio_review_worker.py'),sid],env=env,check=True)
