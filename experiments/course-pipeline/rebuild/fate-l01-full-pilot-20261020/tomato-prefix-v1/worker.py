from pathlib import Path
import os,json,hashlib,base64,urllib.request,urllib.error,datetime,io,wave,array,math,sys
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));O=R/'output';O.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
assert M['model']=='gemini-2.5-flash-preview-tts' and M['voice']=='Kore' and M['automaticRetries']==0 and M['maxSpeechCalls']==1
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert not (O/'attempt.json').exists()
state={'id':M['id'],'startedUTC':now(),'status':'VERIFYING_AVAILABILITY','requestSHA256':sha((R/'request.json').read_bytes()),'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'humanListeningApproved':False}
save('attempt.json',state)
def call(payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
try:
 info=call();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 payload={'contents':[{'parts':[{'text':M['delivery']+'\n\n'+M['text']}]}],'generationConfig':{'responseModalities':['AUDIO'],'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':M['voice']}}}}}
 save('provider-request.json',payload);state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',speechCalls=1,payloadSHA256=sha(json.dumps(payload,ensure_ascii=False).encode()));save('attempt.json',state)
 res=call(payload);parts=res.get('candidates',[{}])[0].get('content',{}).get('parts',[])
 inline=next(p['inlineData'] for p in parts if 'inlineData' in p and not p.get('thought'));raw=base64.b64decode(inline['data'],validate=True);(O/'original-provider.bin').write_bytes(raw)
 meta={k:v for k,v in res.items() if k!='candidates'};meta['candidateMetadata']=[{k:v for k,v in c.items() if k!='content'} for c in res.get('candidates',[])];meta['mimeType']=inline['mimeType'];save('response-metadata.json',meta)
 if raw.startswith(b'RIFF') and raw[8:12]==b'WAVE':w=raw
 else:
  assert inline['mimeType'].lower().startswith('audio/l16') and 'rate=24000' in inline['mimeType'].lower() and len(raw)%2==0
  b=io.BytesIO()
  with wave.open(b,'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(raw)
  w=b.getvalue()
 (O/'L01-S05-prefix-candidate.wav').write_bytes(w)
 with wave.open(io.BytesIO(w),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000)
  frames=f.getnframes();pcm=f.readframes(frames)
 a=array.array('h',pcm)
 if sys.byteorder!='little':a.byteswap()
 assert a and max(abs(x) for x in a)>100
 check={'wavSHA256':sha(w),'providerOriginalSHA256':sha(raw),'pcmSHA256':sha(pcm),'durationSeconds':frames/24000,'frames':frames,'channels':1,'sampleRate':24000,'bitsPerSample':16,'peak':max(abs(x) for x in a),'rms':math.sqrt(sum(x*x for x in a)/len(a)),'clippedFraction':sum(abs(x)>=32767 for x in a)/len(a),'model':M['model'],'voice':M['voice'],'returnedModelVersion':res.get('modelVersion'),'text':M['text'],'textSHA256':sha(M['text'].encode()),'deliverySHA256':sha(M['delivery'].encode()),'humanListeningApproved':False,'scope':'New sentence only. No old speech/image/video modified. No timing estimated from text.'}
 save('verification.json',check);state.update(status='PRESERVED_AWAITING_OWNER_LISTENING',finishedUTC=now(),wavSHA256=sha(w),durationSeconds=frames/24000);save('attempt.json',state);print(json.dumps({'status':state['status'],'durationSeconds':frames/24000,'wavSHA256':sha(w)}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',finishedUTC=now(),error=str(e));save('attempt.json',state);raise
