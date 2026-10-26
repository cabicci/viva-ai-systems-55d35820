from pathlib import Path
import json,sys,os,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(p for p in M['parts'] if p['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['newSpeechCalls']==0 and M['automaticRetries']==0 and M['maxAnalysisCalls']==len(M['parts'])==7
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'];assert not (O/'attempt.json').exists()
source=O/'source';source.mkdir();subprocess.run(['gh','run','download',str(C['audio']['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',C['audio']['artifact'],'--dir',str(source)],check=True,capture_output=True);audio=(source/C['audio']['file']).read_bytes();assert sha(audio)==C['audio']['sha256']
state={'id':C['id'],'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'mode':C['mode'],'audioSHA256':sha(audio),'model':M['model'],'newSpeechCalls':0};save('attempt.json',state)
def api(payload=None):
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload else ''),data=json.dumps(payload,ensure_ascii=False).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
try:
 info=api();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 prompt='Listen to this actual '+C['locale']+' university recording, exact duration '+str(C['durationSeconds'])+' seconds. Transcribe actual sounds. Judge number/unit/negation, omissions/repetitions, pronunciation and obvious signal/join defects. For Arabic target natural Egyptian; no mandatory pronounced /t/ for ta-marbuta, qaf may be glottal and g Egyptian. Do not demand MSA spelling pronunciations. Timestamps must be actual seconds from sound, not text fractions. Return JSON {status: clear|repair|uncertain,transcript,dispositions:[{priorIssue,decision:confirmed|dismissed|uncertain,acousticReason}],actualIssues:[{start,end,heard,expected,heardPhonetics,category,severity,acousticEvidence}],notes}. No issues is valid. Do not fabricate human listening acceptance. For a confirmed pronunciation issue give heard syllables, otherwise uncertainty.'
 if C['mode']=='reference':prompt+=' Exact reference: '+C['spokenText']+' Context: '+C['concerns']
 else:prompt+=' No reference is provided for this blind pass. Do not guess intended words or silently correct speech.'
 cfg={'temperature':0,'responseMimeType':'application/json','maxOutputTokens':4096,'thinkingConfig':{'thinkingBudget':0}}
 save('provider-request.en.json',{'prompt':prompt,'audioSHA256':sha(audio),'generationConfig':cfg});state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',analysisCalls=1);save('attempt.json',state)
 res=api({'contents':[{'parts':[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(audio).decode()}}]}],'generationConfig':cfg});save('response.json',res)
 assert res['candidates'][0].get('finishReason')=='STOP','Incomplete diagnostic output, preserve audio'
 a=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));assert a['status'] in ['clear','repair','uncertain'] and isinstance(a['actualIssues'],list) and isinstance(a['transcript'],str)
 for x in a['actualIssues']:assert 0<=x['start']<x['end']<=C['durationSeconds']+.1
 if a['status']=='clear' and a['actualIssues']:a['status']='uncertain'
 a.update(audioSHA256=sha(audio),humanListeningApproved=False,method='One bounded actual-audio diagnostic repair, not speech regeneration');save('review-disposition.en.json',a);state.update(status='DIAGNOSTIC_PRESERVED',result=a['status'],finishedUTC=now());save('attempt.json',state);print(json.dumps({'id':C['id'],'status':a['status']}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('attempt.json',state);raise
