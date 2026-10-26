"""Review-only actual-audio checks. No synthesis, silent retries or native acceptance."""
from pathlib import Path
import os,sys,json,hashlib,subprocess,urllib.request,urllib.error,base64,wave,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(x for x in M['parts'] if x['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']
assert M['model']=='gemini-2.5-flash' and M['newSpeechCalls']==M['newImageCalls']==M['automaticRetries']==0
assert sum(len(x['checks']) for x in M['parts'])<=M['maxAnalysisCalls'] and 0<M['reservationUSD']<=M['reviewCeilingUSD']<=25
cache={}
def get(ref):
 key=(ref['run'],ref['artifact'])
 if key not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);cache[key]=d
 f=cache[key]/ref['file'];assert sha(f)==ref['sha256'];return f
a=get(C['audio']);v=json.loads((a.parent/'verification.json').read_text());assert v['wavSHA256']==C['audio']['sha256'] and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['voice']==C['voice'] and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256']
assert hashlib.sha256(C['spokenText'].encode()).hexdigest()==C['textSHA256']
with wave.open(str(a),'rb') as f:assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000);duration=f.getnframes()/24000;assert f.getnframes()==v['frames']
voice=get(C['referenceVoice']);save('source-and-voice.en.json',{'target':C['audio'],'referenceVoice':C['referenceVoice'],'targetDurationSeconds':duration,'voice':C['voice'],'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'speechChanged':False})
retained={}
for mode,ref in C['retainedPasses'].items():
 f=get(ref);x=json.loads(f.read_text());assert x['validation']['validForReview'];retained[mode]={'source':ref,'result':x,'reused':True};save('retained-'+mode+'.en.json',retained[mode])
schema={'type':'OBJECT','properties':{
 'transcript':{'type':'STRING'},
 'findings':{'type':'ARRAY','items':{'type':'OBJECT','properties':{
  'start':{'type':'NUMBER','nullable':True},'end':{'type':'NUMBER','nullable':True},
  'category':{'type':'STRING','enum':['number_unit','negation','omission','substitution','repetition','distortion','intelligibility','voice_mismatch']},
  'heard':{'type':'STRING'},'expected':{'type':'STRING'},'acousticEvidence':{'type':'STRING'},'impact':{'type':'STRING'},
  'severity':{'type':'STRING','enum':['critical','major','minor','uncertain']},'certainty':{'type':'STRING','enum':['clear','possible','uncertain']}},'required':['start','end','category','heard','expected','acousticEvidence','impact','severity','certainty']}},
 'uncertainties':{'type':'ARRAY','items':{'type':'STRING'}},
 'voiceObservation':{'type':'OBJECT','properties':{'comparison':{'type':'STRING','enum':['not_compared','consistent','uncertain','clear_mismatch']},'detail':{'type':'STRING'}},'required':['comparison','detail']},
 'previousAllegationReview':{'type':'ARRAY','items':{'type':'OBJECT','properties':{'id':{'type':'STRING'},'disposition':{'type':'STRING','enum':['confirmed','unsupported','uncertain']},'reason':{'type':'STRING'}},'required':['id','disposition','reason']}},
 'reviewNotes':{'type':'STRING'}},'required':['transcript','findings','uncertainties','voiceObservation','previousAllegationReview','reviewNotes']}
base='''Review ONLY the actual FIRST audio recording. It is university narration, not a language-exam word list. Never generate speech or invent a native/human approval. First transcribe what is actually heard, preserving numbers, units, negation and repetitions rather than silently rewriting it. Return findings ONLY for a demonstrated word/meaning/number/unit change, clear unintelligibility, audible clipping/distortion, an omission bounded by actual speech on both sides, or a clear voice mismatch. Empty findings is normal. Do not populate findings with praise, correct pronunciations, stylistic preference or every sentence pause. Standard English variants, Q pronounced /kju:/, A pronounced /ei/, residue with or without /j/, and sensible clause pauses are NOT defects. Egyptian Arabic is intentionally colloquial: Egyptian G, qaf-to-hamza where natural, ordinary connected variants and absence of formal case endings/tanwin are NOT defects. Written shadda is guidance, not evidence that an audible error occurred. A correctly transcribed word can still be poorly pronounced, but an allegation then needs a concrete heard syllable/phonetic difference and a meaningful intelligibility impact. Do not infer a defect just from an ASR spelling difference. Never flag silence before the recording's first word as an omission or join fault. A single original passage has no edited clip joins. Use acoustic times only; if a credible finding cannot be located, use null times and state uncertainty instead of inventing timestamps. Keep findings to meaningful errors, at most8; concise evidence, not a quota. Explanations in English, target transcript in its actual language. All times relative to FIRST audio and within its measured duration. No added content from the second audio belongs in the target transcript. The second audio, when supplied, is an unrelated owner-approved SAME-VOICE delivery exemplar only: compare voice/timbre cautiously, do not compare its different words to the target. A consistency observation is machine evidence, not native accent acceptance.
'''
state={'id':C['id'],'status':'VERIFYING_AVAILABILITY','model':M['model'],'sourceAudioSHA256':sha(a),'newSpeechCalls':0,'analysisCalls':0,'attempts':[],'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'startedUTC':now()};save('attempt.en.json',state)
def api(payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as f:return json.load(f)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
results={};failures=[]
if C['checks']:
 info=api();save('availability.en.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
for mode in C['checks']:
 prompt=base+'\nActual target locale: '+C['locale']+'; exact first-recording duration: '+str(duration)+' seconds. '
 if mode=='blind':prompt+='No expected script is supplied. Transcribe actual sound. voiceObservation.comparison must be not_compared; previousAllegationReview must be empty.'
 else:
  prompt+='Expected FIRST recording meaning/text (not the second exemplar): '+C['spokenText']+'\nAssess each previous allegation by its unique id: confirmed only if actual sound substantiates a meaningful defect, unsupported for incorrect criteria/ordinary variants/positive notes, or uncertain. Do not rubber-stamp a previous report. Give one concise disposition per supplied id. Previous allegations: '+json.dumps(C['previousAllegations'],ensure_ascii=False)
  if C.get('targetedQuestions'):prompt+='\nBounded questions requiring actual acoustic judgment, not an assumed answer: '+json.dumps(C['targetedQuestions'],ensure_ascii=False)
 assert len(prompt.encode())<=40000,'Prompt reservation bound exceeded'
 cfg={'temperature':0,'responseMimeType':'application/json','responseSchema':schema,'maxOutputTokens':8192,'thinkingConfig':{'thinkingBudget':0}}
 parts=[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(a.read_bytes()).decode()}}]
 if mode!='blind':parts.append({'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(voice.read_bytes()).decode()}})
 save(mode+'-request.en.json',{'prompt':prompt,'generationConfig':cfg,'targetAudioSHA256':sha(a),'referenceVoiceSHA256':sha(voice) if mode!='blind' else None})
 attempt={'mode':mode,'status':'REQUEST_STARTED_OUTCOME_UNKNOWN','startedUTC':now()};state['attempts'].append(attempt);state['analysisCalls']+=1;state['status']='REVIEW_RUNNING';save('attempt.en.json',state)
 try:
  response=api({'contents':[{'role':'user','parts':parts}],'generationConfig':cfg});save(mode+'-response.en.json',response)
  assert response.get('modelVersion')==M['model'] and response['candidates'][0].get('finishReason')=='STOP','Incomplete or changed-model diagnostic'
  obj=json.loads(''.join(p.get('text','') for p in response['candidates'][0]['content']['parts'] if not p.get('thought')))
  assert isinstance(obj['transcript'],str) and obj['transcript'].strip() and isinstance(obj['findings'],list) and isinstance(obj['uncertainties'],list)
  for f in obj['findings']:
   assert f['heard'] or f['expected'];assert f['acousticEvidence'] and f['impact']
   if f['start'] is None or f['end'] is None:assert f['certainty']!='clear','Unlocated allegation cannot be clear'
   else:assert 0<=f['start']<f['end']<=duration+.05,'Invalid actual-audio range'
  expected_ids={a['id'] for a in C['previousAllegations']} if mode!='blind' else set();actual_ids=[x['id'] for x in obj['previousAllegationReview']];assert len(actual_ids)==len(set(actual_ids)) and set(actual_ids)==expected_ids,'Allegation coverage mismatch'
  if mode=='blind':assert obj['voiceObservation']['comparison']=='not_compared'
  else:assert obj['voiceObservation']['comparison']!='not_compared'
  obj['validation']={'validForReview':True,'targetAudioSHA256':sha(a),'referenceVoiceSHA256':sha(voice) if mode!='blind' else None};save(mode+'-analysis.en.json',obj);results[mode]=obj;attempt.update(status='VALIDATED',finishedUTC=now(),returnedModelVersion=response['modelVersion'])
 except Exception as e:attempt.update(status='INVALID_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());failures.append(mode+': '+str(e))
 save('attempt.en.json',state)
blind=results.get('blind') or retained.get('blind',{}).get('result');reference=results.get('reference') or retained.get('reference',{}).get('result')
assert blind is not None and reference is not None or failures,'Missing blind/reference evidence'
# An adjudicating reference may explicitly reject findings in a retained blind pass.
old_unresolved=[]
if C['checks'] and 'reference' in results:
 old_unresolved=[x for x in results['reference']['previousAllegationReview'] if x['disposition']!='unsupported']
findings=[f for mode,obj in results.items() for f in obj['findings']];uncertainties=[u for obj in results.values() for u in obj['uncertainties']]
if not C['checks']:
 assert not blind['findings'] and not blind.get('uncertainSpans') and not reference['findings'] and not reference.get('uncertainSpans')
voice_obs=reference.get('voiceObservation') if reference else None
if not voice_obs:uncertainties.append('Same-voice observation is not documented in the structured reference result; no consistency conclusion is inferred.')
if voice_obs and voice_obs['comparison'] in ['uncertain','clear_mismatch']:uncertainties.append('Actual same-voice comparison: '+voice_obs['detail'])
status='clear' if not failures and not findings and not uncertainties and not old_unresolved else 'invalid_diagnostic_hold' if failures else 'needs_adjudication'
new_refs=[{'run':int(os.environ['GITHUB_RUN_ID']),'artifact':M.get('artifactPrefix','fate-v2-audio-review-v3-')+C['id'],'file':mode+'-analysis.en.json','sha256':sha(O/(mode+'-analysis.en.json'))} for mode in results]
summary={'id':C['id'],'status':'clear' if status=='clear' else 'hold','diagnosticStatus':status,'sourceAudioSHA256':sha(a),'sourcePCM_SHA256':v['pcmSHA256'],'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'voice':C['voice'],'model':v['model'],'durationSeconds':duration,'newSpeechCalls':0,'analysisCalls':state['analysisCalls'],'retainedPasses':{k:v['source'] for k,v in retained.items()},'priorEvidence':C.get('priorEvidence',[]),'newEvidence':new_refs,'findings':findings,'uncertainties':uncertainties,'previousUnresolved':old_unresolved,'voiceObservation':voice_obs,'failures':failures,'humanListeningApproved':False,'methodAlreadyOwnerAccepted':True,'limits':'Actual-audio machine qualification, not human/native certification. Unknown/invalid checks never justify speech regeneration by themselves.'}
save('review-disposition.en.json',summary);state.update(status=status,finishedUTC=now());save('attempt.en.json',state);print(json.dumps({'id':C['id'],'status':status,'calls':state['analysisCalls']}));raise SystemExit(0 if status=='clear' else 2)
