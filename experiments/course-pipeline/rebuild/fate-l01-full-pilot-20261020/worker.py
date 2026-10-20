"""Bounded L01 production. No retries or provider fallback. Preserve all successful originals."""
from pathlib import Path
import os,sys,json,hashlib,base64,urllib.request,urllib.error,datetime,io,wave,array,math
R=Path(__file__).parent;M=json.loads((R/'manifest.json').read_text(encoding='utf-8-sig'));MODE=sys.argv[1];O=R/'output'/MODE;O.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(name,v):
 p=O/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def call(model,payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+model+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
assert sha((R/'manifest.json').read_bytes())==os.environ['EXPECTED_MANIFEST_SHA256'],'Manifest changed'
assert M['ttsModel']=='gemini-2.5-flash-preview-tts' and M['voices']=={'A':'Charon','B':'Kore'}
assert M['automaticRetries']==0 and MODE in ['ar','en','images']
assert not (O/'attempts.json').exists(),'Existing attempts: never automatically rerun'
state={'mode':MODE,'startedUTC':now(),'status':'RUNNING','attempts':[],'manifestSHA256':sha((R/'manifest.json').read_bytes()),'humanListeningReviewed':False}
save('attempts.json',state)
def request(kind,identity,model,payload):
 item={'id':identity,'kind':kind,'model':model,'status':'REQUEST_STARTED_OUTCOME_UNKNOWN','startedUTC':now()};state['attempts'].append(item)
 raw=json.dumps(payload,ensure_ascii=False,indent=2).encode();save(identity+'.request.json',payload);item['payloadSHA256']=sha(raw);save('attempts.json',state)
 try:
  response=call(model,payload);item.update(status='RESPONSE_RECEIVED',finishedUTC=now(),returnedModelVersion=response.get('modelVersion'));save('attempts.json',state);return response,item
 except Exception as e:
  item.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',finishedUTC=now(),error=str(e));save('attempts.json',state);raise
models=[M['imageModel']] if MODE=='images' else [M['ttsModel'],M['analysisModel']]
for model in models:
 info=call(model);save(model+'.availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[]),model+' unavailable'
def parts(response):return response.get('candidates',[{}])[0].get('content',{}).get('parts',[])
def response_meta(r):return {**{k:v for k,v in r.items() if k!='candidates'},'candidateMetadata':[{k:v for k,v in c.items() if k!='content'} for c in r.get('candidates',[])]}
def wav(raw,mime):
 if raw.startswith(b'RIFF') and raw[8:12]==b'WAVE':return raw
 assert mime.lower().startswith('audio/l16') and 'rate=24000' in mime.lower() and len(raw)%2==0,'Unsupported audio format'
 b=io.BytesIO()
 with wave.open(b,'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(raw)
 return b.getvalue()
def pcm(b):
 with wave.open(io.BytesIO(b),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000)
  return f.readframes(f.getnframes())
def signal(raw):
 samples=array.array('h',raw)
 if sys.byteorder!='little':samples.byteswap()
 assert samples,'Empty audio'
 energies=[math.sqrt(sum(x*x for x in samples[i:i+240])/len(samples[i:i+240])) for i in range(0,len(samples),240)]
 runs=[];start=None
 for i,v in enumerate(energies+[999]):
  if v<200 and start is None:start=i
  if v>=200 and start is not None:
   if i-start>=12:runs.append({'start':start/100,'end':i/100})
   start=None
 return {'durationSeconds':len(samples)/24000,'peak':max(abs(x) for x in samples),'clippedFraction':sum(abs(x)>=32767 for x in samples)/len(samples),'silenceWindows':runs,'silenceMethod':'Actual PCM RMS, 10ms windows, <200/32768, >=120ms; not phonetic forced alignment'}
errors=[];outputs=[]
if MODE=='images':
 assert len(M['images'])==M['maxImageCalls']==4
 for asset in M['images']:
  try:
   ident=asset['id'];payload={'contents':[{'parts':[{'text':M['imageStyle']+'\n\n'+asset['subject']}]}],'generationConfig':{'responseModalities':['TEXT','IMAGE'],'imageConfig':{'aspectRatio':'16:9','imageSize':'2K'}}}
   res,attempt=request('image',ident,M['imageModel'],payload)
   inline=next(p['inlineData'] for p in parts(res) if not p.get('thought') and p.get('inlineData',{}).get('mimeType','').startswith('image/'))
   raw=base64.b64decode(inline['data']);ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'}[inline['mimeType']];(O/(ident+ext)).write_bytes(raw)
   meta=response_meta(res);meta.update(file=ident+ext,sha256=sha(raw),mimeType=inline['mimeType']);save(ident+'.response.json',meta);attempt.update(status='PRESERVED_UNREVIEWED',sha256=sha(raw));outputs.append(meta);save('attempts.json',state);print(ident+' preserved',flush=True)
  except Exception as e:errors.append({'id':asset['id'],'error':type(e).__name__+': '+str(e)[:160]})
else:
 assert len(M['locales'][MODE])==10
 for scene in M['locales'][MODE]:
  ident=scene['id'];segments=[];offset=0
  try:
   assert sha(scene['text'].encode())==scene['textSHA256']
   for part in scene['parts']:
    pid=ident+'-'+part['id']
    if 'reuse' in part:
     w=(R/part['reuse']).read_bytes();assert sha(w)==part['sha256'];(O/(pid+'.wav')).write_bytes(w)
     meta={'status':'REUSED_OWNER_ACCEPTED_UNCHANGED','file':pid+'.wav','wavSHA256':sha(w),'source':'../../../audio-proof-v3/output/voice-B.wav','text':part['text']}
    else:
     payload={'contents':[{'parts':[{'text':M['delivery'][MODE]+'\n\n'+part['text']}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':scene['voiceName']}}}}}
     res,attempt=request('speech',pid,M['ttsModel'],payload);inline=next(p['inlineData'] for p in parts(res) if 'inlineData' in p and not p.get('thought'))
     raw=base64.b64decode(inline['data'],validate=True);(O/(pid+'.provider.bin')).write_bytes(raw);w=wav(raw,inline['mimeType']);(O/(pid+'.wav')).write_bytes(w)
     meta=response_meta(res);meta.update(file=pid+'.wav',wavSHA256=sha(w),originalSHA256=sha(raw),providerMimeType=inline['mimeType'],text=part['text'],voice=scene['voiceName'],model=M['ttsModel'],deliverySHA256=sha(M['delivery'][MODE].encode()))
     attempt.update(status='PRESERVED_AWAITING_REVIEW',wavSHA256=sha(w));save('attempts.json',state)
    raw=pcm(w);sg=signal(raw);meta.update(offsetSeconds=offset,**sg);save(pid+'.metadata.json',meta);segments.append((raw,meta));offset+=sg['durationSeconds']
   joined=b''.join(x[0] for x in segments);w=wav(joined,'audio/L16;rate=24000');(O/(ident+'.wav')).write_bytes(w)
   meta={'id':ident,'voice':scene['voiceName'],'textSHA256':scene['textSHA256'],'wavSHA256':sha(w),'parts':[x[1] for x in segments],**signal(joined)};save(ident+'.audio.json',meta)
   instruction='Analyze the actual attached audio recording. Do NOT generate speech. Return JSON with keys transcript (verbatim actually heard, including omissions or deviations), words (array of {word,start,end} in seconds, each actually spoken word), captions (array of {text,start,end}, consecutive short lines maximum 10 words drawn from actual speech), issues (array of detected discrepancies versus reference), method. Derive ALL timestamps from listening to the actual audio; NEVER distribute by word counts or text length. Do not claim manual human listening or forced alignment. Keep timestamps inside '+str(offset)+' seconds. Preserve Arabic script for Arabic audio; preserve negation and scientific quantities. Here is the expected reference, NOT a substitute for listening:\n'+scene['text']
   payload={'contents':[{'parts':[{'text':instruction},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(w).decode()}}]}],'generationConfig':{'responseMimeType':'application/json','temperature':0.0}}
   res,attempt=request('audio_analysis',ident+'-timing',M['analysisModel'],payload);save(ident+'.timing-response.json',res)
   text=''.join(p.get('text','') for p in parts(res) if not p.get('thought'));timing=json.loads(text)
   issues=[]
   for key in ['words','captions']:
    assert timing.get(key),'Missing '+key
    prev=-1
    for x in timing[key]:
     assert isinstance(x['start'],(float,int)) and isinstance(x['end'],(float,int))
     if not (0<=x['start']<x['end']<=offset+.2):issues.append(key+' out of duration')
     if x['start']<prev-.1:issues.append(key+' out of sequence')
     prev=x['start']
   timing['provenance']={'actualAudioSHA256':sha(w),'durationSeconds':offset,'method':'Automated Gemini analysis of actual recording; PCM silence windows retained independently','wordAccuracy':'Approximate estimates; no guaranteed phonetic forced alignment and no human accent certification','structuralIssues':issues}
   save(ident+'.timing.json',timing);attempt.update(status='PRESERVED_ESTIMATES_REQUIRE_REVIEW');save('attempts.json',state)
   outputs.append(meta);print(MODE+' '+ident+' audio and timing preserved',flush=True)
  except Exception as e:errors.append({'id':ident,'error':type(e).__name__+': '+str(e)[:160]});print(MODE+' '+ident+' stopped: '+type(e).__name__,flush=True)
state.update(status='COMPLETE_GENERATED_UNREVIEWED' if not errors else 'PARTIAL_FAILURE_NO_RETRY',finishedUTC=now(),errors=errors,outputs=outputs);save('attempts.json',state)
raise SystemExit(1 if errors else 0)
