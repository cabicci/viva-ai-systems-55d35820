from pathlib import Path
import os,json,hashlib,subprocess,shutil,math
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));C=next(c for c in M['scenes'] if c['id']==M['sampleScene']);O=R/'public';O.mkdir(exist_ok=True);Q=R/'proof';Q.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest()
assert M['fullRenderAllowed'] is False and C['id']=='L01-S07';assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
def get(run,artifact,d):
 d.mkdir(parents=True,exist_ok=True);subprocess.run(['gh','run','download',str(run),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',artifact,'--dir',str(d)],check=True)
get(M['timingSourceRun'],'fate-l01-pro-sync-v1-timing-'+C['id'],R/'downloads/timing');T=json.loads((R/'downloads/timing/timing.json').read_text(encoding='utf-8'));assert T['audioSHA256']==C['audioSHA256'] and T['sourceListeningApproved'] and T['sourcePCMExact'] and not T['uncertainties']
get(M['source']['run'],M['source']['artifact'],R/'downloads/audio');audio=R/'downloads/audio'/(C['id']+'.wav');assert sha(audio.read_bytes())==C['audioSHA256'];shutil.copyfile(audio,O/(C['id']+'.wav'))
get(M['imageSource']['run'],M['imageSource']['artifact'],R/'downloads/images');im=R/'downloads/images'/M['imageSource']['file'];assert sha(im.read_bytes())==M['imageSource']['sha256'];shutil.copyfile(im,O/im.name)
old=R.parent/'render/inputs'
for name in ['Cairo.ttf','masaarat-logo-lockup.png']:shutil.copyfile(old/name,O/name)
scene={'id':'ar-'+C['id'],'locale':'ar','index':C['index'],'title':C['title'],'audio':C['id']+'.wav','image':im.name,'frames':math.ceil(C['durationSeconds']*30),'durationSeconds':C['durationSeconds'],'anchors':T['anchors'],'captions':T['captions'],'wordTimings':T['words'],'audioSHA256':C['audioSHA256'],'timingMethod':T['method'],'fullRenderAllowed':False}
(R/'render-data.json').write_text(json.dumps({'scenes':[scene]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'timing-and-inputs.json').write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(Q/'assets.json').write_text(json.dumps([{'file':p.name,'sha256':sha(p.read_bytes())} for p in O.iterdir()],indent=2)+'\n');print('Prepared one 1080p sample, exact accepted audio, current actual-audio timings.')
