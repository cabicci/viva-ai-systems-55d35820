from pathlib import Path
import os,sys,json,hashlib,base64,urllib.request,urllib.error,subprocess,datetime,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
def analyze(ident,candidate,reference,mode,out):
 out.mkdir(parents=True,exist_ok=True);state={'id':ident,'mode':mode,'model':M['analysisModel'],'candidateSHA256':sha(candidate.read_bytes()),'referenceSHA256':sha(reference.read_bytes()) if reference else None,'startedUTC':now(),'status':'REQUEST_STARTED_OUTCOME_UNKNOWN','humanApproved':False}
 assert not (out/'attempt.json').exists();save=lambda n,v:(out/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');save('attempt.json',state)
 with wave.open(str(candidate),'rb') as w:duration=w.getnframes()/w.getframerate()
 instruction=('Analyze actual audio only. Do not generate speech. Egyptian Arabic university narration. '+('First audio is the OWNER-ACCEPTED voice reference. Second audio is a NEW candidate using the same configured voice. Compare audible timbre, register, vocal weight, speaking style and within-candidate consistency. Different words and emotional content can affect pitch without changing identity. Flag only material audible departures or unnatural chopped delivery. Do not require exact pitch matching. Do not treat configured voice name as proof of identity. ' if mode=='voice' else 'The audio spans a real splice between complete narration scenes, normally at 4 seconds into the excerpt. A voice change between Charon and Kore at a scene boundary is intentional; do not flag that alone. Excerpt start/end are artificial review cuts, not production cuts. Listen for clipped consonants/vowels, missing endings, interrupted words, repeated fragments, unnatural extended silence, abrupt pitch/timbre or loudness jumps. Natural pauses at full sentence boundaries are allowed. ')+f'Candidate duration {duration:.6f}s. Return JSON with status one of no_alert/concern/uncertain; issues list of {{start,end,category,observation,certainty}} relative ONLY to candidate audio; notes. Distinguish human-perceived uncertainty; do not certify human acceptance, exact identity or natural accent. Be honest if unable to compare. Do not report ordinary Egyptian sounds as errors for differing from MSA.')
 parts=[{'text':instruction}]
 for p in ([reference,candidate] if reference else [candidate]):parts.append({'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(p.read_bytes()).decode()}})
 save('request.json',dict(state,prompt=instruction,durationSeconds=duration));payload={'contents':[{'parts':parts}],'generationConfig':{'temperature':0.0,'responseMimeType':'application/json'}}
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+M['analysisModel']+':generateContent',data=json.dumps(payload).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as response:res=json.load(response)
  save('response.json',res);a=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));assert a['status'] in ['no_alert','concern','uncertain'] and isinstance(a['issues'],list)
  for x in a['issues']:assert 0<=x['start']<x['end']<=duration+.15
  save('analysis.json',a);state.update(status='COMPLETE',result=a['status'],finishedUTC=now());save('attempt.json',state)
 except Exception as e:
  state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=type(e).__name__,finishedUTC=now());save('attempt.json',state);raise RuntimeError(type(e).__name__) from None
if __name__=='__main__':
 if sys.argv[1]=='joins':
  joins=json.loads((R/'assembled/verification.json').read_text(encoding='utf-8'))['internalJoins']
  for i,j in enumerate(joins):
   if i in M['joinReviewIndices']:analyze('join-'+str(i),R/'assembled'/j['reviewClip'],None,'join',R/'assembled/join-reviews'/str(i))
 else:
  sid=sys.argv[1];c=next(s for s in M['segments'] if s['id']==sid);ref=M['voiceReferences'][c['voice']];d=R/'reference';d.mkdir(exist_ok=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True)
  matches=list(d.rglob(ref['file']));assert len(matches)==1 and sha(matches[0].read_bytes())==ref['sha256'];analyze(sid,R/'output'/(sid+'.wav'),matches[0],'voice',R/'output/continuity')
