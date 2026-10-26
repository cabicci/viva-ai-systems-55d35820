from pathlib import Path
import json,sys,os,hashlib,subprocess,wave,array,math,base64,urllib.request,urllib.error,datetime,re
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(x for x in M['parts'] if x['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);P=R/'public';P.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert M['newSpeechCalls']==M['newImageCalls']==0 and M['maxSemanticTimingCalls']==len(M['parts'])==10 and C['audioReview']['status']=='clear'
assert sha((R/'sync-acceptance.en.json').read_bytes())==M['syncAcceptanceSHA256']
def get(ref,name):
 d=R/'downloads'/name;d.mkdir(exist_ok=False,parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);f=d/ref['file'];assert sha(f.read_bytes())==ref['sha256'];return f
source=get(C['audio'],'audio');image=get(C['image'],'image')
V=json.loads((source.parent/'verification.json').read_text());assert V['model']==V['returnedModelVersion']==M['speechModel'] and V['voice']==C['voice'] and V['textSHA256']==C['textSHA256'] and V['deliverySHA256']==C['deliverySHA256']
with wave.open(str(source),'rb') as f:
 assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);frames=f.getnframes();duration=frames/24000;samples=array.array('h',f.readframes(frames))
assert frames==V['frames'] and abs(duration-C['durationSeconds'])<.0001
if sys.byteorder!='little':samples.byteswap()
model_id='Systran/faster-whisper-small.en' if C['locale']=='en' else 'Systran/faster-whisper-small'
revision='d1d751a5f8271d482d14ca55d9e2deeebbae577f' if C['locale']=='en' else '536b0662742c02347bc0e980a01041f333bce120'
model_path=snapshot_download(model_id,revision=revision,allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json'])
engine=WhisperModel(model_path,device='cpu',compute_type='int8',cpu_threads=2)
segments,info=engine.transcribe(str(source),language=C['locale'],beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for s in segments for w in s.words]
assert words;refinements=[];onset_only=[]
for i,w in enumerate(words):
 assert 0<=w['start']<=w['end']<=duration+.05
 if w['start']!=w['end']:continue
 if 0<i<len(words)-1:
  a=words[i-1]['end'];b=words[i+1]['start'];quiet=[];q=None
  if b==w['end'] and .2<b-a<2.5:
   for j in range(round(a*24000),round(b*24000)+240,240):
    chunk=samples[j:min(j+240,round(b*24000))];rms=math.sqrt(sum(x*x for x in chunk)/len(chunk)) if chunk else 999999;x=j/24000
    if rms<180 and q is None:q=x
    if rms>=180 and q is not None:
     if x-q>=.12 and b-x>=.08:quiet.append((q,x))
     q=None
   if quiet:
    q0,onset=max(quiet,key=lambda z:z[1]-z[0]);refinements.append({'index':i,'word':w['word'],'original':dict(w),'measuredQuiet':[q0,onset],'onset':onset});w['start']=onset;w['onsetMethod']='actual-waveform-after-sentence-pause'
 if w['start']==w['end']:w['intervalKind']='onset_only_duration_unresolved';onset_only.append(i)
assert all(words[i]['start']>=words[i-1]['start']-.05 for i in range(1,len(words)))
save('asr-original-clock.en.json',{'model':model_id,'revision':revision,'words':words,'refinements':refinements,'onsetOnlyIndices':onset_only,'durationSeconds':duration,'sourceAudioSHA256':sha(source.read_bytes()),'limits':'ASR units, including grouped numerals; approximate word intervals, not phoneme forced alignment. Point intervals are explicit and cannot be used for karaoke-duration claims.'})
state={'id':C['id'],'model':M['analysisModel'],'startedUTC':now(),'status':'VERIFYING_AVAILABILITY','newSpeechCalls':0,'newImageCalls':0,'audioSHA256':sha(source.read_bytes())};save('timing-attempt.en.json',state)
def api(payload=None):
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+M['analysisModel']+(':generateContent' if payload else ''),data=json.dumps(payload,ensure_ascii=False).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
try:
 availability=api();save('timing-availability.en.json',availability);assert 'generateContent' in availability.get('supportedGenerationMethods',[])
 prompt='Listen to this actual '+C['locale']+' university recording. Map explanatory actions to the provided ASR UNIT INDICES; NEVER supply invented timestamps or distribute time by text length. The ASR clock is actual-audio-derived. Arabic target is Egyptian, with legitimate colloquial variants. The exact approved reference preserves scientific numbers,units,negation,assumptions. Fix display-caption ASR spelling only when actual sound and reference support it; a correction is not a speech repair. Captions use clean writing, no pronunciation cues; write a short scalar text for each span, max9 displayed words. Return JSON {actions:[{id,startWordIndex,endWordIndex,heardAnchor,uncertaintySeconds}],captions:[{text,startWordIndex,endWordIndex}],captionCorrections:[{asrIndex,from,to,acousticReason}],unresolved:[]}. Every action ID exactly once. Caption indices ordered and covering the spoken recording; no invented silence text. An ASR numeral may represent several spoken words; never invent subword timing. If an action cannot be grounded, return it in unresolved. Exact reference: '+C['spokenText']+' Required actions: '+json.dumps(C['actions'],ensure_ascii=False)+' ASR units: '+json.dumps([{'index':i,'word':w['word']} for i,w in enumerate(words)],ensure_ascii=False)
 cfg={'temperature':0,'responseMimeType':'application/json','maxOutputTokens':8192,'thinkingConfig':{'thinkingBudget':0}};save('semantic-index-request.en.json',{'prompt':prompt,'generationConfig':cfg,'audioSHA256':sha(source.read_bytes())});state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',semanticCalls=1);save('timing-attempt.en.json',state)
 res=api({'contents':[{'parts':[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(source.read_bytes()).decode()}}]}],'generationConfig':cfg});save('semantic-index-response.en.json',res);assert res['candidates'][0].get('finishReason')=='STOP'
 result=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));save('semantic-index-result.en.json',result)
 assert not result.get('unresolved');assert {a['id'] for a in result['actions']}=={a['id'] for a in C['actions']}
 def interval(a):
  i,j=a['startWordIndex'],a['endWordIndex'];assert type(i)==type(j)==int and 0<=i<=j<len(words);start,end=words[i]['start'],words[j]['end'];assert 0<=start<end<=duration+.05;return start,end
 actions=[]
 for a in result['actions']:
  start,end=interval(a);assert a.get('heardAnchor') and 0<=a.get('uncertaintySeconds',99)<=1;meta=next(x for x in C['actions'] if x['id']==a['id']);actions.append(dict(meta,**a,start=start,end=end))
 captions=[];prev=-1;nextIndex=0
 for c in result['captions']:
  start,end=interval(c);assert c['startWordIndex']==nextIndex and start>=prev-.05 and isinstance(c['text'],str) and c['text'].strip();nextIndex=c['endWordIndex']+1;prev=end;captions.append(dict(c,start=start,end=end,text=re.sub('[\u064b-\u065f\u0670]','',c['text'])))
 assert captions and nextIndex==len(words)
 for f in [source,image]:__import__('shutil').copyfile(f,P/f.name)
 for asset in M['brandAssets']:
  f=Path(os.environ['GITHUB_WORKSPACE'])/asset['path'];assert sha(f.read_bytes())==asset['sha256'];__import__('shutil').copyfile(f,P/asset['name'])
 data=dict(C,id='FateV2-'+C['id'],audioFile=source.name,imageFile=image.name,audioFrames=frames,frames=math.ceil(frames/800),durationSeconds=duration,actions={a['id']:a for a in actions},captions=captions,wordTimings=words,timingMethod='Actual ASR clock; semantic index mapping, waveform refinement where supported; no model-generated clock or text-duration estimation.',onsetOnlyWordIntervals=onset_only)
 (R/'render-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');save('timing-and-inputs.en.json',data);save('assets.en.json',[{'file':f.name,'sha256':sha(f.read_bytes())} for f in P.iterdir()]);state.update(status='VALIDATED_FOR_SCENE_RENDER',finishedUTC=now());save('timing-attempt.en.json',state);print(json.dumps({'id':C['id'],'duration':duration,'ASRunits':len(words),'onsetOnly':onset_only}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('timing-attempt.en.json',state);raise
