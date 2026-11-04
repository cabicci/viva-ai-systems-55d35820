"""Actual-WAV Gemini understanding audit; one request per A/B, no synthesis."""
from pathlib import Path
import os,sys,json,hashlib,datetime,subprocess,wave,base64,urllib.request
HERE=Path(__file__).resolve().parent
OUT=HERE/'output'
REPO='cabicci/viva-ai-systems-55d35820'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def write(p,x):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_bytes((json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
req=read(HERE/'request.json')
def validate():
 assert sha(HERE/'request.json')==os.environ['REQUEST_SHA']
 assert sha(HERE/'audit.py')==os.environ['SCRIPT_SHA']
 assert req['maximumDiagnosticCallsPerClip']==1 and req['maximumTotalDiagnosticCalls']==1 and req['retries']==0 and not req['fallback']
 assert [c['id']for c in req['clips']]==['B']
 if os.environ.get('GITHUB_ACTIONS'):assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
 write(OUT/'validation.private.json',{'atUTC':now(),'status':'EXACT_SOURCE_AND_BUDGET_VALIDATED','requestSha256':sha(HERE/'request.json'),'scriptSha256':sha(HERE/'audit.py'),'speechGenerationCalls':0})
def prepare():
 validate()
 for c in req['clips']:
  info=json.loads(subprocess.check_output(['gh','run','view',str(c['sourceRun']),'--repo',REPO,'--json','headSha,jobs,status,conclusion'],text=True))
  assert info['headSha']==c['sourceCommit']and info['status']=='completed'
  if c.get('requiredSuccessfulJob'):assert any(j['name']==c['requiredSuccessfulJob']and j['conclusion']=='success'for j in info['jobs'])
  else:assert info['conclusion']=='success'
  write(OUT/(c['id']+'-source-run.private.json'),info)
  target=HERE/('input-'+c['id']);assert not target.exists()
  subprocess.run(['gh','run','download',str(c['sourceRun']),'--repo',REPO,'--name',c['artifact'],'--dir',str(target)],check=True)
  matches=[p for p in target.rglob('*.wav')if sha(p)==c['sha256']]
  assert len(matches)==1,'Expected one exact hash-matching waveform'
  p=matches[0]
  with wave.open(str(p),'rb')as w:props={'sampleRate':w.getframerate(),'channels':w.getnchannels(),'sampleWidthBytes':w.getsampwidth(),'frames':w.getnframes(),'duration':w.getnframes()/w.getframerate()}
  assert props['sampleRate']==24000 and props['channels']==1 and props['sampleWidthBytes']==2 and abs(props['duration']-c['duration'])<1e-6
  assert p.stat().st_size<20000000
  write(OUT/(c['id']+'-input.private.json'),{'atUTC':now(),'relativeToPackage':str(p.relative_to(HERE)),'sha256':sha(p),'bytes':p.stat().st_size,'audio':props,'artifactNestingValidated':True})
def api(key,method,body=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+req['model']+method
 request=urllib.request.Request(url,data=None if body is None else json.dumps(body,ensure_ascii=False).encode(),headers={'x-goog-api-key':key,'Content-Type':'application/json'},method='GET'if body is None else'POST')
 with urllib.request.urlopen(request,timeout=180)as response:return json.loads(response.read())
def audit():
 validate()
 key=next((os.environ.get(n)for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3']if os.environ.get(n)),None)
 if not key:raise RuntimeError('No configured server Gemini credential; zero diagnostic calls')
 metadata=api(key,'');write(OUT/'model-metadata.private.json',metadata)
 assert metadata['name']=='models/'+req['model']and'generateContent'in metadata.get('supportedGenerationMethods',[])
 failures=[]
 for c in req['clips']:
  ledger=OUT/(c['id']+'-attempt.private.json');assert not ledger.exists(),'Existing reserved attempt; refuse repeat'
  inp=read(OUT/(c['id']+'-input.private.json'));audio=HERE/inp['relativeToPackage'];assert sha(audio)==c['sha256']
  prompt="""Audit the ACTUAL ATTACHED WAV, not text alone. Listen to the entire clip. Audience: Egyptian agricultural vocational students. Target: natural educated Cairo/Egyptian Arabic, calm clear trainer, not formal recitation or Gulf accent. No audio generation. Do not assume pass/fail or infer an audible error from ASR spelling or written diacritics. Compare every spoken word and continuous delivery with the intended script; distinguish missing/added/changed/cut-off speech, actually audible consonant/vowel/gemination/stress/accent/rhythm issues, and uncertain or harmless variation. Independently check all words including المدرّب, demonstratives/pronoun suffixes and, if present, واتَّبع (owner requests doubled ت) and ورّاهالك. Do not force an error for focus words or guess the owner's ambiguous correction. Do not infer missing consonant doubling from unvowelled transcription. An unmarked Arabic letter is not acoustic evidence. Base each claim on what is actually audible, independently of script marks. If a vowel or consonant duration cannot be distinguished acoustically, mark uncertain; never force a pass or fail. Never invent transcript-confidence numbers. If you cannot hear a feature, state uncertainty. Approximate timestamps must be relative to actual audio; they are model estimates, not forced alignment. Return JSON: clipId; observedSpokenText; wholeClipAssessment {status:usable/needs_review/uncertain,reasons}; allAudibleIssues array {startSeconds,endSeconds,heardForm,intendedWordOrPhrase,issueType,audibleObservation,confidence:high/medium/low,uncertainty,safetyMeaningAffected,suggestedNaturalCairoRealization}; focusWords array {word,approximateStartSeconds,approximateEndSeconds,whatActuallyHeard,assessment,uncertainty}; safetyMeaningAssessment; holisticSpokenScriptSuggestion (whole sentence, text suggestion only, preserve all safety meaning and explain changes); limitations. Review the entire clip, not only the focus list. Do not claim human certification or guarantee vowels. Intended script:\n"""+c['text']+'\nClip '+c['id']+'; duration '+str(c['duration'])+' seconds.'
  write(OUT/(c['id']+'-prompt.private.json'),{'prompt':prompt,'audioSha256':c['sha256'],'mimeType':'audio/wav','method':'ACTUAL_AUDIO_UNDERSTANDING_NOT_ASR_OR_TTS'})
  state={'atUTC':now(),'state':'DIAGNOSTIC_CALL_RESERVED_BEFORE_REQUEST','clipId':c['id'],'audioSha256':c['sha256'],'model':req['model'],'diagnosticCalls':1,'maxDiagnosticCalls':1,'ttsCalls':0,'retries':0,'acceptance':'UNREVIEWED_DIAGNOSTIC_ONLY'};write(ledger,state)
  payload={'contents':[{'role':'user','parts':[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(audio.read_bytes()).decode('ascii')}}]}],'generationConfig':{'temperature':0,'maxOutputTokens':10000,'responseMimeType':'application/json'}}
  try:
   response=api(key,':generateContent',payload);write(OUT/(c['id']+'-raw-response.private.json'),response)
   texts=[p.get('text','')for cand in response.get('candidates',[])for p in cand.get('content',{}).get('parts',[])if not p.get('thought')]
   result=json.loads('\n'.join(texts));write(OUT/(c['id']+'-audio-audit.private.json'),result)
   state.update(state='DIAGNOSTIC_RETURNED_NOT_HUMAN_CERTIFIED',completedUTC=now(),actualModelVersion=response.get('modelVersion'),finishReasons=[x.get('finishReason')for x in response.get('candidates',[])],usageMetadata=response.get('usageMetadata'));write(ledger,state)
  except Exception as e:
   state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY',failedUTC=now(),errorType=type(e).__name__,httpStatus=getattr(e,'code',None));write(ledger,state);failures.append(c['id'])
 write(OUT/'completion.private.json',{'atUTC':now(),'state':'DIAGNOSTIC_COMPLETE'if not failures else'DIAGNOSTIC_PARTIAL_OR_FAILED_NO_RETRY','failedClips':failures,'maximumCalls':1,'ttsCalls':0,'asrCalls':0,'renderCalls':0,'limitations':'Model listening diagnostic, not expert human certification, forced alignment, or production approval.'})
 if failures:raise SystemExit('Diagnostic failure; no automatic retry')
if __name__=='__main__':
 try:{'validate':validate,'prepare':prepare,'audit':audit}[sys.argv[1]]()
 except Exception as e:
  write(OUT/'failure.private.json',{'atUTC':now(),'errorType':type(e).__name__,'httpStatus':getattr(e,'code',None),'state':'FAILED_NO_RETRY','noSecretOrExceptionPayloadLogged':True});raise SystemExit('Audio diagnostic failed; see scoped redacted receipt')from None
