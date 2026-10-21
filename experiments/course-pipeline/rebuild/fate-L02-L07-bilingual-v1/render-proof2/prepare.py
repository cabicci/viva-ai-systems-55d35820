from pathlib import Path
import os,json,hashlib,subprocess,shutil,sys,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(s for s in M['scenes'] if s['id']==sys.argv[1]);O=R/'public';O.mkdir(exist_ok=True);Q=R/'output';Q.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and M['ownerAuthorizedFullScope'] and M['newSpeechCalls']==0

def get(ref,folder):
 folder.mkdir(parents=True,exist_ok=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(folder)],check=True,capture_output=True);f=folder/ref['file'];assert sha(f)==ref['sha256'];return f
alignment=get(C['alignment'],R/'downloads/alignment');T=json.loads(alignment.read_text());V=json.loads((alignment.parent/'verification.json').read_text());assert V['readyForRenderReview'] and V['audioSHA256']==C['audio']['sha256'] and V['textSHA256']==C['textSHA256'] and V['deliverySHA256']==C['deliverySHA256'] and V['model']==M['speechModel'] and V['voice']==C['voice'];assert not V['timingProblems']
audio=get(C['audio'],R/'downloads/audio');image=get(C['image'],R/'downloads/image');assert C['imageDisposition']['status']=='usable_background'
with wave.open(str(audio),'rb') as f:assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000);assert f.getnframes()==C['audioFrames']
shutil.copyfile(audio,O/audio.name);shutil.copyfile(image,O/image.name)
repo=Path(os.environ['GITHUB_WORKSPACE'])
for a in M['brandAssets']:
 f=repo/a['path'];assert sha(f)==a['sha256'];shutil.copyfile(f,O/a['name'])
byid={x['id']:x for x in T['actions']};actions=[dict(a,**{k:v for k,v in byid[a['id']].items() if k!='id'}) for a in C['actions']]
s=dict(C,actions=actions,audio=audio.name,image=image.name,frames=C['globalEndVideoFrame']-C['globalStartVideoFrame'],timeOffsetSeconds=C['globalStartVideoFrame']/30-C['globalStartAudioFrame']/24000,captions=T['captions'],wordTimings=T['words'],audioSHA256=C['audio']['sha256'],fullRenderAllowed=True)
(R/'render-data.json').write_text(json.dumps({'scenes':[s]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'timing-and-inputs.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'gate-result.json').write_text(json.dumps({'allowed':True,'exactAudioSHA256':s['audioSHA256'],'review':'Actual-audio checks and acoustic timing validated; human approval applies to delivery method, not every new recording.','speechModel':M['speechModel'],'voice':C['voice']},indent=2)+'\n');(Q/'assets.json').write_text(json.dumps([{'file':f.name,'sha256':sha(f)} for f in O.iterdir()],indent=2)+'\n')
