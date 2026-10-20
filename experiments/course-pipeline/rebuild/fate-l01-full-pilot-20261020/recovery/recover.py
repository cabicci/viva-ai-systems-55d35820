"""Manually reviewed recovery: preserve S06 audio, retry its timed analysis once; one new S09 speech attempt."""
from pathlib import Path
import json,sys,os,base64,urllib.request,urllib.error,hashlib,io,wave,datetime,shutil
R=Path(__file__).parent;D=R/'base';O=R/'output';O.mkdir(exist_ok=True);scene='L01-S'+sys.argv[1];assert scene in ['L01-S06','L01-S09'];M=json.loads((R/'manifest.json').read_text(encoding='utf-8-sig'));row=next(x for x in M['locales']['ar'] if x['id']==scene)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
state={'scope':scene,'status':'STARTING','reviewedFailure':'S06 timing timed out; exact valid audio is preserved. S09 original speech request returned HTTP 400 with no audio. One explicit recovery attempt, no automatic retries.','attempts':[]};save('recovery.json',state)
def call(model,payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+model+(':generateContent' if payload else '')
 req=urllib.request.Request(url,data=json.dumps(payload,ensure_ascii=False).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=300) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  raw=e.read().decode(errors='replace').replace(os.environ['GEMINI_API_KEY'],'[redacted]');raise RuntimeError('HTTP '+str(e.code)+' '+raw[:1500]) from None
 except Exception as e:raise RuntimeError(type(e).__name__) from None
try:
 for model in ['gemini-2.5-flash-preview-tts','gemini-2.5-flash']:
  a=call(model);save(model+'.availability.json',a);assert 'generateContent' in a.get('supportedGenerationMethods',[])
 if scene=='L01-S06':
  w=(D/(scene+'.wav')).read_bytes();meta=json.loads((D/(scene+'.audio.json')).read_text());assert sha(w)==meta['wavSHA256'];state['preservedAudioSHA256']=sha(w)
 else:
  payload=json.loads((D/(scene+'-whole.request.json')).read_text());save(scene+'-recovery-speech.request.json',payload)
  state['attempts'].append({'kind':'speech','status':'STARTED_OUTCOME_UNKNOWN','payloadSHA256':sha(json.dumps(payload,ensure_ascii=False).encode())});save('recovery.json',state)
  res=call('gemini-2.5-flash-preview-tts',payload);parts=res['candidates'][0]['content']['parts'];inline=next(p['inlineData'] for p in parts if 'inlineData'in p and not p.get('thought'));raw=base64.b64decode(inline['data']);(O/(scene+'-whole.provider.bin')).write_bytes(raw)
  if raw.startswith(b'RIFF'):w=raw
  else:
   assert inline['mimeType'].lower().startswith('audio/l16') and 'rate=24000'in inline['mimeType'].lower();b=io.BytesIO()
   with wave.open(b,'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(raw)
   w=b.getvalue()
  (O/(scene+'.wav')).write_bytes(w);(O/(scene+'-whole.wav')).write_bytes(w)
  with wave.open(io.BytesIO(w),'rb') as f:duration=f.getnframes()/f.getframerate()
  meta={'id':scene,'voice':row['voiceName'],'textSHA256':row['textSHA256'],'wavSHA256':sha(w),'durationSeconds':duration,'originalSHA256':sha(raw),'model':'gemini-2.5-flash-preview-tts','returnedModelVersion':res.get('modelVersion'),'parts':[{'file':scene+'-whole.wav','offsetSeconds':0,'durationSeconds':duration,'wavSHA256':sha(w)}]};save(scene+'.audio.json',meta);save(scene+'-whole.metadata.json',meta);state['attempts'][-1]['status']='PRESERVED';save('recovery.json',state)
 if scene=='L01-S06':payload=json.loads((D/(scene+'-timing.request.json')).read_text())
 else:
  instruction='Analyze actual attached audio, not reference length. Return JSON: transcript (actually heard), words [{word,start,end}] in seconds for every spoken word, captions [{text,start,end}] short lines up to 10 words, issues [discrepancies]. No human review or forced alignment claims. All timestamps must be within '+str(meta['durationSeconds'])+' seconds. Expected reference, not a substitute for listening: '+row['text']
  payload={'contents':[{'parts':[{'text':instruction},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(w).decode()}}]}],'generationConfig':{'responseMimeType':'application/json','temperature':0.0}}
 save(scene+'-recovery-timing.request.json',payload);state['attempts'].append({'kind':'timing','status':'STARTED_OUTCOME_UNKNOWN','audioSHA256':sha(w)});save('recovery.json',state)
 res=call('gemini-2.5-flash',payload);save(scene+'.timing-response.json',res);t=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));errors=[]
 for key in ['words','captions']:
  assert t.get(key);prev=-1
  for x in t[key]:
   if not 0<=x['start']<x['end']<=meta['durationSeconds']+.2:errors.append(key+' out of duration')
   if x['start']<prev-.1:errors.append(key+' out of sequence')
   prev=x['start']
 t['provenance']={'actualAudioSHA256':sha(w),'durationSeconds':meta['durationSeconds'],'method':'Automated analysis of actual audio; manually reviewed recovery after recorded failure','wordAccuracy':'Approximate; not phonetic forced alignment or human accent review','structuralIssues':errors};save(scene+'.timing.json',t);state['attempts'][-1]['status']='PRESERVED';state['status']='RECOVERED_UNREVIEWED';save('recovery.json',state)
except Exception as e:state.update(status='RECOVERY_FAILED_NO_AUTOMATIC_RETRY',error=str(e));save('recovery.json',state);raise
