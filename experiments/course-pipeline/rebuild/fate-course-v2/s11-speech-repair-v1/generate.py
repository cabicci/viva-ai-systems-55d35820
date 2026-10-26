from pathlib import Path
import os,sys,json,hashlib,base64,urllib.request,urllib.error,datetime,wave,io,array
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));sid=sys.argv[1];C=next(p for p in M['segments'] if p['id']==sid);O=R/'output';O.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['model']=='gemini-3.8-flash-tts' and M['automaticRetries']==0 and M['maxSpeechCalls']==len(M['segments'])==1
assert C['voice'] in ['Charon','Kore'] and not (O/'attempt.json').exists()
assert sha(C['spokenText'].encode())==C['textSHA256'] and sha(C['delivery'].encode())==C['deliverySHA256']
assert sha((R/'method-approval.en.json').read_bytes())==M['methodApprovalSHA256']
assert M['maxSpeechOutputTokens']==4096 and sha((R/'budget-authorization.en.json').read_bytes())==M['budgetAuthorizationSHA256']
state={'id':sid,'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'model':M['model'],'voice':C['voice'],'requestSHA256':sha((R/'request.json').read_bytes()),'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'speechCalls':0,'ownerListeningApproved':False};save('attempt.json',state)
def api(payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  try:save('provider-error.json',json.loads(e.read()))
  except Exception:pass
  raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
try:
 info=api();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 payload={'contents':[{'role':'user','parts':[{'text':C['spokenText'],'speech_metadata':{'style':C['delivery']}}]}],'generationConfig':{'responseModalities':['AUDIO'],'maxOutputTokens':M['maxSpeechOutputTokens'],'speechConfig':{'voiceConfig':{'voice':C['voice']}}}}
 save('provider-request.json',payload);state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',speechCalls=1);save('attempt.json',state)
 result=api(payload);part=next(p['inlineData'] for p in result['candidates'][0]['content']['parts'] if p.get('inlineData',{}).get('mimeType','').startswith('audio/') and not p.get('thought'));raw=base64.b64decode(part['data'],validate=True);(O/'original-provider.bin').write_bytes(raw);save('response-metadata.json',{k:v for k,v in result.items() if k!='candidates'})
 assert result.get('modelVersion')==M['model'], 'Unexpected returned model'
 assert result['candidates'][0].get('finishReason')=='STOP', 'Incomplete generation retained, no retry'
 if raw.startswith(b'RIFF') and raw[8:12]==b'WAVE':wav=raw
 else:
  assert part['mimeType'].lower().startswith('audio/l16') and 'rate=24000' in part['mimeType'].lower() and len(raw)%2==0
  b=io.BytesIO()
  with wave.open(b,'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(raw)
  wav=b.getvalue()
 (O/(sid+'.wav')).write_bytes(wav)
 with wave.open(io.BytesIO(wav),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000)
  frames=f.getnframes();pcm=f.readframes(frames)
 a=array.array('h',pcm)
 if sys.byteorder!='little':a.byteswap()
 assert a and max(abs(x) for x in a)>100
 check={'wavSHA256':sha(wav),'providerOriginalSHA256':sha(raw),'pcmSHA256':sha(pcm),'durationSeconds':frames/24000,'frames':frames,'sampleRate':24000,'channels':1,'bitsPerSample':16,'peak':max(abs(x) for x in a),'clippedFraction':sum(abs(x)>=32767 for x in a)/len(a),'model':M['model'],'voice':C['voice'],'returnedModelVersion':result.get('modelVersion'),'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'humanListeningApproved':False};save('verification.json',check);state.update(status='ORIGINAL_PRESERVED_METHOD_ALREADY_ACCEPTED_NEW_CLIP_REVIEW_PENDING',finishedUTC=now(),durationSeconds=frames/24000,wavSHA256=sha(wav));save('attempt.json',state);print(json.dumps({'id':sid,'status':state['status'],'seconds':frames/24000}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('attempt.json',state);raise
