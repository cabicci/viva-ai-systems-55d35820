from pathlib import Path
import os,json,hashlib,subprocess,shutil,math,sys,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));O=R/'public';O.mkdir(exist_ok=True);Q=R/'output';Q.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert M['fullRenderAllowed'] is True and M['maxSpeechCalls']==0 and M['maxAnalysisCalls']==0
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']
assert M['sampleApproval']['sampleSHA256']=='b892f3797887f0aeac9f446187021ef20ed2237ea58095786017efefd54c731f'
def get(run,artifact,d):
 d.mkdir(parents=True,exist_ok=True);subprocess.run(['gh','run','download',str(run),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',artifact,'--dir',str(d)],check=True)
get(M['source']['run'],M['source']['artifact'],R/'downloads/audio');full=R/'downloads/audio'/M['source']['file'];assert sha(full)==M['source']['sha256'];shutil.copyfile(full,O/full.name)
if sys.argv[1]=='full':sys.exit(0)
i=int(sys.argv[1])-1;C=M['scenes'][i]
get(M['timingSourceRun'],'fate-l01-pro-sync-v1-timing-'+C['id'],R/'downloads/timing');tf=R/'downloads/timing/timing.json';assert sha(tf)==C['timingSHA256'];T=json.loads(tf.read_text(encoding='utf-8'));assert T['audioSHA256']==C['audioSHA256'] and T['sourceListeningApproved'] and T['sourcePCMExact'] and not T['uncertainties']
audio=R/'downloads/audio'/(C['id']+'.wav');assert sha(audio)==C['audioSHA256'];shutil.copyfile(audio,O/audio.name)
with wave.open(str(full),'rb') as f,wave.open(str(audio),'rb') as a:
 f.setpos(C['globalStartFrame']);assert a.getframerate()==f.getframerate()==24000;assert a.readframes(a.getnframes())==f.readframes(C['globalEndFrame']-C['globalStartFrame'])
get(M['imageSource']['run'],M['imageSource']['artifact'],R/'downloads/images');old=R.parent/'render/inputs'
for name in ['Cairo.ttf','masaarat-logo-lockup.png']:shutil.copyfile(old/name,O/name)
im=R/'downloads/images'/C['image'];im=im if im.exists() else old/C['image'];assert sha(im)==M['imageFiles'][C['image']];shutil.copyfile(im,O/im.name)
start=round(C['globalStartFrame']/24000*30);end=round((M['scenes'][i+1]['globalStartFrame'] if i<9 else M['fullAudioFrames'])/24000*30)
scene={'id':'ar-'+C['id'],'locale':'ar','index':i,'title':C['title'],'audio':audio.name,'image':im.name,'frames':end-start,'durationSeconds':C['durationSeconds'],'globalStartVideoFrame':start,'globalEndVideoFrame':end,'timeOffsetSeconds':start/30-C['globalStartFrame']/24000,'anchors':T['anchors'],'captions':T['captions'],'wordTimings':T['words'],'audioSHA256':C['audioSHA256'],'timingMethod':T['method'],'fullRenderAllowed':True}
(R/'render-data.json').write_text(json.dumps({'scenes':[scene]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'timing-and-inputs.json').write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'assets.json').write_text(json.dumps([{'file':p.name,'sha256':sha(p)} for p in O.iterdir()],indent=2)+'\n')
print('Verified exact accepted source PCM, scene timings and image:',C['id'])
