from pathlib import Path
import json,sys,os,subprocess,hashlib,wave,array,math,datetime
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download
R=Path(__file__).parent;M=json.loads((R/'clock-request.json').read_text());C=next(x for x in M['parts'] if x['id']==sys.argv[1]);O=R/'clock-output';O.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha(R/'clock-request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['newProviderCalls']==0
ref=C['audio'];source=(R/ref['localFile']).resolve();assert R.resolve() in source.parents and sha(source)==ref['sha256'];D=source.parent
v=json.loads((D/'verification.json').read_text());assert v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256'] and v['voice']==C['voice']
with wave.open(str(source),'rb') as f:
 assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);frames=f.getnframes();samples=array.array('h',f.readframes(frames))
if sys.byteorder!='little':samples.byteswap()
duration=frames/24000
locale='en' if C['locale']=='en' else 'ar';mid='Systran/faster-whisper-small.en' if locale=='en' else 'Systran/faster-whisper-small';rev='d1d751a5f8271d482d14ca55d9e2deeebbae577f' if locale=='en' else '536b0662742c02347bc0e980a01041f333bce120'
model_path=snapshot_download(mid,revision=rev,allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']);engine=WhisperModel(model_path,device='cpu',compute_type='int8',cpu_threads=2)
segments,info=engine.transcribe(str(source),language=locale,beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for s in segments for w in s.words];assert words
rawWords=[dict(w) for w in words];refinements=[];point=[]
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
    q0,onset=max(quiet,key=lambda z:z[1]-z[0]);refinements.append({'index':i,'word':w['word'],'before':dict(w),'measuredQuiet':[q0,onset]});w['start']=onset;w['onsetMethod']='actual-waveform-after-sentence-pause'
 if w['start']==w['end']:w['intervalKind']='onset_only_duration_unresolved';point.append(i)
assert all(words[i]['start']>=words[i-1]['start']-.05 for i in range(1,len(words)))
save('actual-word-clock.en.json',{'id':C['id'],'status':'OBSERVATIONAL_CLOCK_ONLY_NOT_AUDIO_OR_RENDER_ACCEPTANCE','audio':ref,'sourceAudioSHA256':sha(source),'voice':C['voice'],'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'model':mid,'modelRevision':rev,'audioFrames':frames,'durationSeconds':duration,'rawASRWords':rawWords,'words':words,'waveformRefinements':refinements,'onsetOnlyIndices':point,'limits':'Actual-recording approximate ASR intervals, not native pronunciation approval or phoneme forced alignment. Any later speech repair invalidates this clock; no time rescaling or text-length estimates.','newProviderCalls':0,'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()})
print(json.dumps({'id':C['id'],'durationSeconds':duration,'ASRunits':len(words),'onsetOnly':point}))
