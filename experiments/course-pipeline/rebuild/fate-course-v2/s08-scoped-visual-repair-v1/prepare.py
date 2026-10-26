from pathlib import Path
import os,sys,json,hashlib,subprocess,shutil,wave,math
from selection_contract import review_gate
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(x for x in M['parts'] if x['id']==sys.argv[1]);O=R/'output';O.mkdir();P=R/'public';P.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
canon=lambda v:hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']
assert M['newProviderCalls']==M['newSpeechCalls']==M['newImageCalls']==M['maxSemanticCalls']==0
cache={}
def get(ref):
 k=(ref['run'],ref['artifact'])
 if k not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True,timeout=120);cache[k]=d
 f=cache[k]/ref['file'];assert sha(f)==ref['sha256'];return f
source=get(C['sourceTiming']);data=json.loads(source.read_text());shutil.copyfile(source,O/'preserved-timing-and-inputs.en.json')
audio=get(C['audio']);image=get(C['image']);gateFile=get(C['review']);clockFile=get(C['clock']);gate=json.loads(gateFile.read_text());clock=json.loads(clockFile.read_text());v=json.loads((audio.parent/'verification.json').read_text())
assert data['step']==C['step'] and data['sceneIndex']==C['sceneIndex'] and data['sectionID']==C['sectionID'] and data['locale']==C['locale']
assert data['audio']==C['audio'] and data['image']==C['image'] and data['audioGate']==gate and data['audioGateSHA256']==sha(gateFile)
assert data['textSHA256']==C['originalTextSHA256']==v['textSHA256'] and data['deliverySHA256']==C['originalDeliverySHA256']==v['deliverySHA256']
assert v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['voice']==data['voice']
with wave.open(str(audio),'rb') as f:
 assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);n=f.getnframes();pcm=hashlib.sha256(f.readframes(n)).hexdigest()
review_gate(gate,dict(data,audio=C['audio']),pcm)
assert sha(audio)==v['wavSHA256']==clock['sourceAudioSHA256'] and pcm==v['pcmSHA256'] and n==v['frames']==data['audioFrames']==C['originalAudioFrames']==clock['audioFrames']
assert data['frames']==C['originalFrames']==math.ceil(n/800) and canon(data['actions'])==C['originalActionsSHA256'] and canon(data['captions'])==C['originalCaptionsSHA256']
# Original caption identity was verified above. Edit only explicit display spelling.
for edit in C['captionTextEdits']:
 q=data['captions'][edit['captionIndex']];assert q['text']==edit['before'];q['text']=edit['after']
assert canon(data['captions'])==C['correctedDisplayCaptionsSHA256']
data['scopedCaptionDisplayRepair']={'edits':C['captionTextEdits'],'captionTimesAndIndicesUnchanged':True,'sourceSpokenTextAndRecordingUnchanged':True}
assert sha(R/'contracts.json')==M['contractsSHA256']
oldID=data['id'];data['id']='FateV2-'+C['id'];data['visualRecovery']={'sourceTiming':C['sourceTiming'],'originalID':oldID,'newProviderCalls':0,'actionsFramesAndSpeechUnchanged':True,'captionTimesAndIndicesUnchanged':True,'captionTextEdits':C['captionTextEdits'],'targetedDisplayChanges':M['targetedDisplayChanges']}
for f in [audio,image]:shutil.copyfile(f,P/f.name)
assert data['audioFile']==audio.name and data['imageFile']==image.name
for asset in M['brandAssets']:
 f=Path(os.environ['GITHUB_WORKSPACE'])/asset['path'];assert sha(f)==asset['sha256'];shutil.copyfile(f,P/asset['name'])
(R/'render-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');save('timing-and-inputs.en.json',data);shutil.copyfile(gateFile,O/'audio-gate.en.json');save('visual-recovery-preparation.en.json',{'id':C['id'],'status':'ACTUAL_TIMING_AND_ORIGINAL_SPEECH_REUSED_FOR_DISPLAY_ONLY_REPAIR','sourceTiming':C['sourceTiming'],'newProviderCalls':0,'originalPCM_SHA256':pcm,'actionsSHA256':canon(data['actions']),'captionsSHA256':canon(data['captions']),'sourceFrames':n,'videoFrames':data['frames']})
