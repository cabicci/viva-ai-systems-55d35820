from pathlib import Path
import json,os,subprocess,hashlib,shutil,wave,math,re
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=M['scene'];O=R/'output';O.mkdir(exist_ok=True);P=R/'public';P.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and M['sampleAuthorized'] and not M['fullLessonRenderAllowed'] and M['newSpeechCalls']==0 and C['sceneIndex']==1
def get(ref,name):
 d=R/'downloads'/name;d.mkdir(exist_ok=False,parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);f=d/ref['file'];assert sha(f)==ref['sha256'];return f
a=get(C['audio'],'audio');image=get(C['image'],'image');alignmentRef=dict(C['alignment']);alignmentRef.update(run=int(os.environ['GITHUB_RUN_ID']),sha256=os.environ['EXPECTED_TIMING_SHA256']);assert re.fullmatch('[0-9a-f]{64}',alignmentRef['sha256']);timing=get(alignmentRef,'timing');V=json.loads((timing.parent/'verification.json').read_text());assert V['readyForRenderReview'] and not V['timingProblems'] and V['audioSHA256']==C['audio']['sha256'] and V['textSHA256']==C['textSHA256'] and V['deliverySHA256']==C['deliverySHA256'] and V['model']=='gemini-3.8-flash-tts'
with wave.open(str(a),'rb') as f:
 assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000) and f.getnframes()==C['audioFrames'];duration=f.getnframes()/f.getframerate()
for f in [a,image]:shutil.copyfile(f,P/f.name)
for asset in M['brandAssets']:
 f=Path(os.environ['GITHUB_WORKSPACE'])/asset['path'];assert sha(f)==asset['sha256'];shutil.copyfile(f,P/asset['name'])
t=json.loads(timing.read_text()); actions={x['id']:x for x in t['actions']};assert set(actions)=={'sample-result','exposure','risk-evidence'}
for x in t['captions']:x['text']=re.sub('[\u064b-\u065f\u0670]','',x['text'])
data=dict(C,audioFile=a.name,imageFile=image.name,durationSeconds=duration,frames=math.ceil(duration*30),actions=actions,captions=t['captions'],wordTimings=t['words'])
(R/'render-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');(O/'timing-and-inputs.en.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');(O/'assets.en.json').write_text(json.dumps([{'file':f.name,'sha256':sha(f)} for f in P.iterdir()],indent=2)+'\n')
