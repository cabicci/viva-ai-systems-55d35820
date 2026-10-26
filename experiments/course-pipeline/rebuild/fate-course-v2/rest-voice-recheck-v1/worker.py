"""Actions-only bounded actual-audio rechecks; no synthesis or implicit acceptance."""
from pathlib import Path
import os,sys,json,hashlib,subprocess,wave,base64,datetime,urllib.request,urllib.error
R=Path(__file__).parent;O=R/'output';O.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,x):
 with (O/n).open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(c for c in M['parts'] if c['id']==sys.argv[1])
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']
assert sha(R/'worker.py')==M['workerSHA256'] and sha(R/'adjudicator.py')==M['adjudicatorSHA256']
assert M['newSpeechCalls']==M['newImageCalls']==M['automaticRetries']==0 and M['maxAnalysisCalls']==15 and M['reservationUSD']==M['reviewCeilingUSD']==.70
cache={}
def get(ref):
 key=(ref['run'],ref['artifact'])
 if key not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True)
  subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);cache[key]=d
 p=cache[key]/ref['file'];assert sha(p)==ref['sha256'];return p
run=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/runs/'+str(M['sourceRun'])]));assert run['head_sha']==M['sourceHead']
a=get(C['audio']);rv=get(C['referenceVoice'])
def verify(p,pin,voice,original=False):
 vf=p.parent/'verification.json';assert sha(vf)==pin;v=json.loads(vf.read_text())
 assert v['wavSHA256']==sha(p) and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['voice']==voice
 with wave.open(str(p),'rb') as w:
  assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
  assert w.getnframes()==v['frames'];pcm=w.readframes(w.getnframes())
 assert hashlib.sha256(pcm).hexdigest()==v['pcmSHA256']
 if original:
  assert v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256'] and sha(p)==C['sourceAudioSHA256'] and v['pcmSHA256']==C['sourcePCM_SHA256']
  assert hashlib.sha256(C['spokenText'].encode()).hexdigest()==C['textSHA256']
  attempt=json.loads((p.parent/'attempt.json').read_text());assert str(attempt['runID'])==str(M['sourceRun']) and attempt['commit']==M['sourceHead']
 return v
v=verify(a,C['sourceVerificationSHA256'],C['voice'],True);verify(rv,C['referenceVerificationSHA256'],C['voice'])
prior={}
for ref in C['priorEvidence']:
 p=get(ref);x=json.loads(p.read_text(encoding='utf8'));prior[ref['file']]=x;save('preserved-'+ref['file'],{'source':ref,'originalResult':x})
save('source-and-voice.en.json',{'target':C['audio'],'referenceVoice':C['referenceVoice'],'verification':v,'originalFilesUnchanged':True})
if C['mode']=='targeted_adjudication':
 part=dict(C,audio=dict(C['audio'],localFile=a.relative_to(R).as_posix()),referenceVoice=dict(C['referenceVoice'],localFile=rv.relative_to(R).as_posix()),checks=['blind','reference'],retainedPasses={},previousAllegations=[{'id':'rain-vs-string','start':36.69,'end':37.09,'heard':'وتر','expected':'مطر','reason':'Prior blind transcript also wrote وتر. Invalid reference alleges word substitution; assess actual sound, not spelling alone.'},{'id':'invalid-start-omission','start':0,'end':0,'heard':'','expected':'في','reason':'Invalid zero-length omission claim at recording start. Check only actual audible context.'}],targetedQuestions=['Does the actual coherent final sentence audibly say مطر (rain), وتر (string), or something genuinely uncertain? Identify actual consonants/vowels and meaningful impact. Do not infer from the expected context.'],priorEvidence=C['priorEvidence'])
 req=dict(M,parts=[part],maxAnalysisCalls=2,artifactPrefix='fate-v2-rest-voice-recheck-')
 with (R/'adjudication-request.json').open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(req,ensure_ascii=False,indent=2)+'\n')
 env=dict(os.environ,REVIEW_REQUEST_FILE='adjudication-request.json',EXPECTED_REQUEST_SHA256=sha(R/'adjudication-request.json'))
 raise SystemExit(subprocess.run([sys.executable,str(R/'adjudicator.py'),C['id']],env=env).returncode)
assert C['mode']=='voice_only'
old=prior['review-disposition.en.json'];blind=prior['blind-analysis.en.json'];response=prior['reference-response.en.json']
assert old['status']=='hold' and old['sourceAudioSHA256']==sha(a) and not old['findings']
assert blind['validation']['validForReview'] and blind['validation']['targetAudioSHA256']==sha(a) and not blind['findings'] and not blind['uncertainties']
assert response['modelVersion']==M['model'] and response['candidates'][0]['finishReason']=='STOP'
semantic=json.loads(''.join(p.get('text','') for p in response['candidates'][0]['content']['parts'] if not p.get('thought')))
assert semantic['transcript'].strip() and not semantic['findings'] and not semantic['uncertainties'] and not semantic['previousAllegationReview'] and semantic['voiceObservation']['comparison']=='not_compared'
schema={'type':'OBJECT','properties':{'comparison':{'type':'STRING','enum':['consistent','uncertain','clear_mismatch']},'targetObservation':{'type':'STRING'},'exemplarObservation':{'type':'STRING'},'comparisonEvidence':{'type':'STRING'},'bothAudioInputsAudible':{'type':'BOOLEAN'},'limits':{'type':'STRING'}},'required':['comparison','targetObservation','exemplarObservation','comparisonEvidence','bothAudioInputsAudible','limits']}
prompt='''Compare the ACTUAL TWO separately labelled audio recordings below for voice/timbre only. TARGET is new university narration; APPROVED SAME-VOICE EXEMPLAR is a different short passage. They intentionally have DIFFERENT WORDS AND LENGTHS. Both selected provider voices are %s. Do not infer similarity from the voice name, transcript, or file metadata: listen to BOTH. Describe distinct audible evidence about each input, then give a cautious comparison. Normal prosody variation across different words is not a mismatch. consistent means their speaker/timbre is plausibly consistent; uncertain if either input cannot be heard or comparison is unreliable; clear_mismatch only for concrete audible speaker/timbre difference. If only one recording seems available, bothAudioInputsAudible=false and comparison=uncertain; never invent a match. No transcript, pronunciation repair, accent certification or human approval. This check resolves only the previously undocumented comparison; existing independent semantic checks are preserved. Explain concisely in English.'''%C['voice']
cfg={'temperature':0,'responseMimeType':'application/json','responseSchema':schema,'maxOutputTokens':4096,'thinkingConfig':{'thinkingBudget':0}}
parts=[{'text':prompt},{'text':'AUDIO INPUT 1 — TARGET NEW NARRATION. Duration '+str(v['durationSeconds'])+' seconds. Listen to this FIRST clip.'},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(a.read_bytes()).decode()}},{'text':'AUDIO INPUT 2 — APPROVED SAME-VOICE EXEMPLAR. Different passage. Listen to this SECOND clip and compare its voice to INPUT 1.'},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(rv.read_bytes()).decode()}},{'text':'Both audio inputs have now been supplied, separately labelled. Return actual evidence for each; if either cannot be heard, state uncertain honestly.'}]
save('voice-request.en.json',{'prompt':prompt,'inputOrder':['target','approved_same_voice_exemplar'],'audioInputs':[C['audio'],C['referenceVoice']],'generationConfig':cfg})
attempt={'id':C['id'],'status':'REQUEST_STARTED_OUTCOME_UNKNOWN','runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'startedUTC':now(),'analysisCalls':1,'newSpeechCalls':0,'sourceAudioSHA256':sha(a)};save('attempt.en.json',attempt)
failure=None;obj=None
try:
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+':generateContent',data=json.dumps({'contents':[{'role':'user','parts':parts}],'generationConfig':cfg},ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=240) as f:res=json.load(f)
 save('voice-response.en.json',res);assert res['modelVersion']==M['model'] and res['candidates'][0]['finishReason']=='STOP','Incomplete or changed-model result'
 obj=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')))
 assert obj['comparison'] in ['consistent','uncertain','clear_mismatch'] and isinstance(obj['bothAudioInputsAudible'],bool)
 assert all(isinstance(obj[k],str) and obj[k].strip() for k in ['targetObservation','exemplarObservation','comparisonEvidence','limits'])
 assert obj['bothAudioInputsAudible'] or obj['comparison']=='uncertain','Absent audio cannot produce match'
 save('voice-analysis.en.json',dict(obj,validation={'validForReview':True,'targetAudioSHA256':sha(a),'referenceVoiceSHA256':sha(rv)}))
except Exception as e:failure=('Provider HTTP '+str(e.code)) if isinstance(e,urllib.error.HTTPError) else type(e).__name__+': '+str(e);save('failure.en.json',{'error':failure,'noRetry':True})
clear=not failure and obj['comparison']=='consistent' and obj['bothAudioInputsAudible']
summary=dict(old,status='clear' if clear else 'hold',diagnosticStatus='clear' if clear else 'voice_comparison_unresolved',diagnosticMethod='Preserved source-bound semantic observations plus explicit two-input actual-voice comparison',priorEvidence=C['priorEvidence'],newEvidence=([{'run':int(os.environ['GITHUB_RUN_ID']),'artifact':'fate-v2-rest-voice-recheck-'+C['id'],'file':'voice-analysis.en.json','sha256':sha(O/'voice-analysis.en.json')}] if not failure else []),findings=[],uncertainties=[] if clear else [failure or obj['comparisonEvidence']],failures=[] if not failure else [failure],analysisCalls=1,voiceObservation={'comparison':obj['comparison'],'detail':obj['comparisonEvidence']} if obj and not failure else None,humanListeningApproved=False,limits='Actual-audio machine comparison only; prior raw semantic observations and invalid comparison retained. No native listening or universal timbre guarantee.')
save('review-disposition.en.json',summary);attempt.update(status='clear' if clear else 'hold',finishedUTC=now());save('attempt.en.json',attempt)
print(json.dumps({'id':C['id'],'status':summary['status']}));raise SystemExit(0 if clear else 2)
