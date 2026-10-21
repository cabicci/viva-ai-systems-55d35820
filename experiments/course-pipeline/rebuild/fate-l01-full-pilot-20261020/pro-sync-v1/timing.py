from pathlib import Path
import json,os,sys,hashlib,subprocess,wave,io,base64,urllib.request,urllib.error,datetime,math,copy
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));C=next(s for s in M['scenes'] if s['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);D=R/'downloads/audio';D.mkdir(parents=True,exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat();save=lambda n,v:(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'];assert M['maxSpeechCalls']==0
subprocess.run(['gh','run','download',str(M['source']['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',M['source']['artifact'],'--dir',str(D)],check=True)
full=D/M['source']['file'];audio=D/(C['id']+'.wav');assert sha(full.read_bytes())==M['source']['sha256'] and sha(audio.read_bytes())==C['audioSHA256']
with wave.open(str(full),'rb') as w:w.setpos(C['globalStartFrame']);portion=w.readframes(C['globalEndFrame']-C['globalStartFrame'])
with wave.open(str(audio),'rb') as w:assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000);actual=w.getnframes()/24000;assert w.readframes(w.getnframes())==portion
assert abs(actual-C['durationSeconds'])<1e-6
for f,k in [('owner-acceptance.json','approvalSHA256'),('pronunciation-gate.json','gateSHA256'),('review-evidence.json','reviewEvidenceSHA256')]:assert sha((R/f).read_bytes())==M[k]
# Exercise the existing gate for this exact approved scene before any render.
r=subprocess.run([sys.executable,str(R/'pronunciation-gate.py'),'--report',str(R/'pronunciation-gate.json'),'--audio',str(audio),'--manifest',str(R/'manifest.json'),'--scene',C['id']],capture_output=True,text=True);assert r.returncode==0,r.stdout+r.stderr;save('gate-result.json',json.loads(r.stdout))
import importlib.util
sp=importlib.util.spec_from_file_location('audio_gate',R/'pronunciation-gate.py');g=importlib.util.module_from_spec(sp);sp.loader.exec_module(g);report=json.loads((R/'pronunciation-gate.json').read_text(encoding='utf-8'));assert not g.evaluate(report,C['id'],'0'*64,C['textSHA256'],C['deliverySHA256'],'gemini-2.5-pro-preview-tts',C['voice'])['allowed'];missing=copy.deepcopy(report);next(x for x in missing['scenes'] if x['id']==C['id'])['listeningApproval']={};assert not g.evaluate(missing,C['id'],C['audioSHA256'],C['textSHA256'],C['deliverySHA256'],'gemini-2.5-pro-preview-tts',C['voice'])['allowed']
state={'scene':C['id'],'audioSHA256':C['audioSHA256'],'durationSeconds':actual,'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'status':'TIMING_STARTED','speechCalls':0,'attempts':[]};save('attempts.json',state)
def api(payload=None):
 u='https://generativelanguage.googleapis.com/v1beta/models/'+M['analysisModel']+(':generateContent' if payload is not None else '');req=urllib.request.Request(u,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as resp:return json.load(resp)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError(type(e).__name__) from None
info=api();save('availability.json',info);assert 'generateContent' in info['supportedGenerationMethods']
common='Analyze the supplied ACTUAL recording, Egyptian Arabic. Do not generate speech. All times must come from the sound, not text-length ratios or uniform spacing. Recording duration is '+str(actual)+' seconds; timestamps are seconds relative to its start. No invented words, timestamps or precision guarantees. Preserve numbers, units and negation. The spoken reference is context, not a replacement for listening: '+C['spokenText']+'\nVisual cue phrases (each id must appear once, first occurrence unless the phrase specifies more context): '+json.dumps(C['cues'],ensure_ascii=False)
results=[]
for mode in ['words','cues']:
 prompt=common+('\nReturn JSON: {transcript,words:[{word,start,end}],anchors:[{id,heard,start,end}],uncertainties:[{reason}]}. Provide one timestamp per actually spoken word or spoken numeric token, and exact audible onset/end of each requested cue phrase. Listen to actual audio boundaries. Keep words in temporal order; no captions are needed.' if mode=='words' else '\nIndependently listen to the ACTUAL recording and locate only these cue phrases. No earlier timing estimates are supplied. Return JSON: {anchors:[{id,heard,start,end}],uncertainties:[{id,reason}]}. Mark the audible onset of the requested phrase, not a later word or a silent pause. Keep each timestamp within the actual recording. If no confident acoustic location can be found, record uncertainty rather than inventing it.')
 payload={'contents':[{'parts':[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(audio.read_bytes()).decode()}}]}],'generationConfig':{'responseMimeType':'application/json','temperature':0}}
 save(mode+'-request.json',{'model':M['analysisModel'],'prompt':prompt,'audioSHA256':C['audioSHA256']});attempt={'mode':mode,'status':'REQUEST_STARTED_OUTCOME_UNKNOWN','startedUTC':now()};state['attempts'].append(attempt);save('attempts.json',state)
 try:
  res=api(payload);save(mode+'-response.json',res);obj=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));save(mode+'-analysis.json',obj);ids=[str(x['id']) for x in obj['anchors']];assert sorted(ids)==sorted(c['id'] for c in C['cues'])
  for x in obj['anchors']+obj.get('words',[]):assert 0<=x['start']<x['end']<=actual+.05
  attempt.update(status='COMPLETE',finishedUTC=now(),returnedModelVersion=res.get('modelVersion'));results.append(obj);save('attempts.json',state)
 except Exception as e:attempt.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e));state['status']='TIMING_HOLD';save('attempts.json',state);raise
words=results[0]['words'];assert len(words)>=35 and all(words[i]['start']<=words[i+1]['start'] for i in range(len(words)-1));assert actual-words[-1]['end']<3,'Unexplained trailing coverage gap'
anchors=[];disagreements=[]
for cue in C['cues']:
 a=next(x for x in results[0]['anchors'] if str(x['id'])==cue['id']);b=next(x for x in results[1]['anchors'] if str(x['id'])==cue['id']);delta=abs(a['start']-b['start']);anchors.append({'id':cue['id'],'cue':cue['phrase'],'matchedText':b['heard'],'time':b['start'],'end':b['end'],'firstPassTime':a['start'],'differenceSeconds':delta,'method':'Two actual-recording model passes; approximate acoustic timings, not forced alignment'})
 if delta>1.0:disagreements.append({'id':cue['id'],'delta':delta})
assert not disagreements,disagreements
caps=[];group=[]
for i,w in enumerate(words):
 group.append(w)
 if len(group)>=8 or i==len(words)-1 or (len(group)>=4 and str(w['word']).endswith(('.','؟','!'))):caps.append({'text':' '.join(str(x['word']) for x in group),'start':group[0]['start'],'end':group[-1]['end']});group=[]
result={'id':C['id'],'index':C['index'],'title':C['title'],'audioSHA256':C['audioSHA256'],'durationSeconds':actual,'model':M['analysisModel'],'words':words,'captions':caps,'anchors':anchors,'uncertainties':results[0].get('uncertainties',[])+results[1].get('uncertainties',[]),'method':'Actual-audio word estimates plus separately prompted acoustic cue location. Not phonetic forced alignment or manual listening.','twoPassMaxDifferenceSeconds':max(a['differenceSeconds'] for a in anchors),'globalStartFrame':C['globalStartFrame'],'sourcePCMExact':True,'sourceListeningApproved':True,'fullRenderAllowed':False}
assert not result['uncertainties'],result['uncertainties'];save('timing.json',result);state['status']='TIMING_READY_FOR_VISUAL_SAMPLE';save('attempts.json',state);print(json.dumps({'scene':C['id'],'words':len(words),'anchors':len(anchors),'maxDifference':result['twoPassMaxDifferenceSeconds']}))
