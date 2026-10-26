from pathlib import Path
import json,sys,os,hashlib,subprocess,shutil,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(x for x in M['parts'] if x['id']==sys.argv[1]);O=R/'output';O.mkdir();P=R/'public';P.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert M['newSpeechCalls']==M['newImageCalls']==M['newAnalysisCalls']==0
assert sha(R/'sync-acceptance.en.json')==M['syncAcceptanceSHA256']
def get(ref,name):
 d=R/'downloads'/name;d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);f=d/ref['file'];assert sha(f)==ref['sha256'];return f
t=get(C['timing'],'timing');s=json.loads(t.read_text());assert s['audio']['sha256']==C['audio']['sha256'] and s['textSHA256']==C['textSHA256'] and s['deliverySHA256']==C['deliverySHA256']
a=get(C['audio'],'audio');im=get(C['image'],'image');v=json.loads((a.parent/'verification.json').read_text());assert v['model']==v['returnedModelVersion']==M['speechModel'] and v['voice']==C['voice']
with wave.open(str(a),'rb') as w:assert w.getnframes()==s['audioFrames'] and (w.getframerate(),w.getnchannels(),w.getsampwidth())==(24000,1,2)
for f in [a,im]:shutil.copyfile(f,P/f.name)
for x in M['brandAssets']:
 f=Path(os.environ['GITHUB_WORKSPACE'])/x['path'];assert sha(f)==x['sha256'];shutil.copyfile(f,P/x['name'])
shutil.copyfile(t,R/'render-data.json');shutil.copyfile(t,O/'timing-and-inputs.en.json')
(O/'repair.en.json').write_text(json.dumps({'scope':M['reason'],'timingSHA256':sha(t),'audioSHA256':sha(a),'newProviderCalls':0,'originalTimingPreserved':True},indent=2))
