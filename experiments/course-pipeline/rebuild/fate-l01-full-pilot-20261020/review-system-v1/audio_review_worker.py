"""Bounded actual-rendered-audio review. Never synthesize or certify human accent approval."""
from pathlib import Path
import os,sys,json,hashlib,subprocess,wave,io,math,array,base64,urllib.request,urllib.error,datetime
R=Path(__file__).parent;M=json.loads((R/'review-request.json').read_text(encoding='utf-8'));sid=sys.argv[1];C=next(x for x in M['scenes'] if x['id']==sid);O=R/'output'/'flash';O.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['automaticRetries']==0 and M['speechCalls']==0 and M['model']=='gemini-2.5-flash'
assert sha((R/'review-request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
assert not (O/'review.json').exists(),'No repeated ambiguous requests'
scene=O/(sid+'.wav')
if M.get('sourceMode','rendered_video')=='generated_wav':
 source=R/'source'/(sid+'.wav');assert sha(source.read_bytes())==C['sourceAudioSHA256']
 scene.write_bytes(source.read_bytes())
else:
 video=R/'source'/M['sourceFile'];assert sha(video.read_bytes())==M['sourceSHA256']
 subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vn','-af',f"atrim=start={C['start']}:duration={C['duration']},asetpts=PTS-STARTPTS",'-ar','24000','-ac','1','-c:a','pcm_s16le',str(scene)],check=True)
with wave.open(str(scene),'rb') as f:params=f.getparams();raw=f.readframes(f.getnframes());duration=f.getnframes()/f.getframerate()
assert abs(duration-C['duration'])<.025
rate=24000;width=2
samples=array.array('h',raw)
if sys.byteorder!='little':samples.byteswap()
energies=[math.sqrt(sum(x*x for x in samples[i:i+480])/len(samples[i:i+480])) for i in range(0,len(samples),480)]
pauses=[];a=None
for i,e in enumerate(energies+[9999]):
 if e<180 and a is None:a=i
 if e>=180 and a is not None:
  if (i-a)*.02>=1.2:pauses.append({'start':a*.02,'end':min(duration,i*.02),'kind':'low_energy_window_for_review_not_automatic_error'})
  a=None
state={'schemaVersion':1,'scene':sid,'voice':C['voice'],'sourceVideoSHA256':M['sourceSHA256'],'sceneAudioSHA256':sha(scene.read_bytes()),'durationSeconds':duration,'globalStart':C['start'],'scriptSHA256':sha(C['text'].encode()),'model':M['model'],'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'startedUTC':now(),'status':'RUNNING','humanListeningApproved':False,'attempts':[],'chunks':[],'signal':{'peak':max(abs(x) for x in samples),'clippedFraction':sum(abs(x)>=32767 for x in samples)/len(samples),'lowEnergyWindows':pauses},'limitations':['Same automated model in two separate prompts; not independent human reviewers','Timestamps are approximate audio-derived observations','Spelling normalization or fluent ASR does not prove correct pronunciation','No voice or full course acceptance can be inferred']};save('review.json',state)
def api(payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
info=api();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
common='''Analyze ONLY the supplied actual Egyptian Arabic audio. Never generate speech. This is a university explanation. Natural Egyptian pronunciation is the target; ordinary Egyptian variants are not mistakes. Do not demand MSA case endings, /q/ where Egyptians use glottal stop, or /dzh/ instead of Egyptian /g/. Distinguish a phonetic defect from literal written spelling, colloquial inflection and an ASR uncertainty. Do not silently correct what you hear. For a pronunciation allegation give an approximate heard syllable rendering or IPA based on acoustics, not just the correctly spelled word. If uncertain say so. All times are seconds relative to THIS audio clip and derived from its sound, never text length. Return only JSON. Write explanation, suggested corrections and notes in Egyptian Arabic; retain the actual heard transcript in Arabic. Do not claim manual human review or an accent PASS.
Schema: {"transcript":"actual words heard, preserving numbers, negation, omissions and repetitions", "uncertainSpans":[{"start":0.0,"end":1.0,"text":"...","reason":"..."}], "findings":[{"start":0.0,"end":1.0,"category":"pronunciation|omission|substitution|repetition|number_unit|pause_join|delivery|uncertain", "heard":"...", "expected":"... or empty if unknown", "heardPhonetics":"... or explicitly uncertain", "suggestion":"...", "reason":"...", "severity":"critical|major|minor|uncertain", "certainty":"clear|possible|uncertain"}], "reviewNotes":"..."}.
Only assert omission when audible words on both sides establish its location inside this clip; do not report words outside its edges as omitted. Do not diagnose every pause or short clip boundary as a defect. No findings is acceptable; never invent an issue to fill a quota.
'''
failures=[]
for k in range(C['chunks']):
 core_a=k*M['coreSeconds'];core_b=min(duration,core_a+M['coreSeconds']);a=max(0,core_a-M['contextSeconds']);b=min(duration,core_b+M['contextSeconds']);buf=io.BytesIO()
 with wave.open(buf,'wb') as f:f.setparams(params);f.writeframes(raw[round(a*rate)*width:round(b*rate)*width])
 clip=buf.getvalue();filename=f'{sid}-chunk-{k:02d}.wav';(O/filename).write_bytes(clip)
 chunk={'index':k,'file':filename,'sha256':sha(clip),'start':a,'end':b,'coreStart':core_a,'coreEnd':core_b,'globalStart':C['start']+a,'passes':{}};state['chunks'].append(chunk);save('review.json',state)
 for mode in M['analysisPasses']:
  ident=f'{sid}-{k:02d}-{mode}';instruction=common+f'\nExact clip duration: {b-a:.6f}s. '
  if mode=='blind':instruction+='No reference script is provided. Transcribe actual sounds first and flag only acoustically supportable issues; do not guess an intended technical term from a missing script.'
  else:instruction+='The following is the FULL SCENE reference, which is longer than this clip. Use only the portion actually covered by the audio. Focus on audible vowel/stress/consonant errors, misplaced shadda, missing/doubled syllables, false starts, disrupted joins, wrong numbers/units and omissions bounded within this clip. A correctly recognized written word can still have incorrect pronunciation. Do not report standard Egyptian speech as wrong because the reference has written diacritics. Reference: \n'+C['text']
  save(ident+'.request.json',{'model':M['model'],'prompt':instruction,'clipFile':filename,'clipSHA256':sha(clip),'clipDuration':b-a,'referenceIncluded':mode=='reference','generationConfig':{'responseMimeType':'application/json','temperature':0.0}})
  attempt={'id':ident,'mode':mode,'chunk':k,'startedUTC':now(),'status':'REQUEST_STARTED_OUTCOME_UNKNOWN'};state['attempts'].append(attempt);save('review.json',state)
  try:
   payload={'contents':[{'parts':[{'text':instruction},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(clip).decode()}}]}],'generationConfig':{'responseMimeType':'application/json','temperature':0.0}}
   res=api(payload);save(ident+'.response.json',res);obj=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')))
   assert isinstance(obj.get('transcript'),str) and isinstance(obj.get('findings'),list)
   invalid=[]
   for x in obj.get('findings',[])+obj.get('uncertainSpans',[]):
    if not (isinstance(x.get('start'),(int,float)) and isinstance(x.get('end'),(int,float)) and 0<=x['start']<x['end']<=b-a+.15):invalid.append(x)
   obj['validation']={'invalidTimestampCount':len(invalid),'validForReview':not invalid};save(ident+'.analysis.json',obj);chunk['passes'][mode]={'file':ident+'.analysis.json','status':'COMPLETE' if not invalid else 'TIMESTAMP_VALIDATION_FAILED'};attempt.update(status=chunk['passes'][mode]['status'],finishedUTC=now(),returnedModelVersion=res.get('modelVersion'))
   if invalid:failures.append(ident+' timestamps')
  except Exception as e:
   attempt.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',finishedUTC=now(),error=str(e));chunk['passes'][mode]={'status':attempt['status']};failures.append(ident)
  save('review.json',state)
state.update(status='COMPLETE_AUTOMATED_REVIEW_REQUIRES_TRIAGE' if not failures else 'PARTIAL_REVIEW_WITH_GAPS',failures=failures,finishedUTC=now(),coverageSeconds=duration if not failures else None);save('review.json',state)
print(json.dumps({'scene':sid,'status':state['status'],'attempts':len(state['attempts']),'failures':failures}))
raise SystemExit(1 if failures else 0)