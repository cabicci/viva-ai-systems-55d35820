from pathlib import Path
import json,sys,os,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave,array,math
R=Path(__file__).parent;M=json.loads((R/(sys.argv[1]+'.json')).read_text());sid=sys.argv[2];C=next(x for x in M['parts'] if x['id']==sid);O=R/'output';O.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha((R/(sys.argv[1]+'.json')).read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
def download(ref,folder):
 folder.mkdir(exist_ok=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(folder)],check=True,capture_output=True);f=folder/ref['file'];assert sha(f.read_bytes())==ref['sha256'];return f
source=download(C['audio'],O/'source');data=source.read_bytes()
with wave.open(str(source),'rb') as f:duration=f.getnframes()/f.getframerate()
assert abs(duration-C['durationSeconds'])<.001
save('input.json',dict(C,actualDuration=duration))
def call(ident,model,prompt,audios):
 assert not (O/(ident+'-attempt.json')).exists();attempt={'id':ident,'model':model,'status':'CHECKING_AVAILABILITY','audioSHA256':sha(data),'startedUTC':now(),'run':os.environ['GITHUB_RUN_ID']};save(ident+'-attempt.json',attempt)
 def api(payload=None):
  req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+model+(':generateContent' if payload else ''),data=json.dumps(payload).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=240) as r:return json.load(r)
  except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
  except Exception as e:raise RuntimeError(type(e).__name__) from None
 try:
  info=api();save(ident+'-availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
  save(ident+'-request.json',{'model':model,'prompt':prompt,'audioHashes':[sha(a) for a in audios]});attempt.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN');save(ident+'-attempt.json',attempt)
  payload={'contents':[{'parts':[{'text':prompt}]+[{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(a).decode()}} for a in audios]}],'generationConfig':{'temperature':0,'responseMimeType':'application/json','maxOutputTokens':8192,'thinkingConfig':{'thinkingBudget':0}}};res=api(payload);save(ident+'-response.json',res);x=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));save(ident+'.json',x);attempt.update(status='RESPONSE_PRESERVED',finishedUTC=now());save(ident+'-attempt.json',attempt);return x
 except Exception as e:
  attempt.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e));save(ident+'-attempt.json',attempt);raise
review={'status':'clear','basis':'Completed blind and reference actual-audio review plus same-voice comparison with no alerts','humanListeningApproval':False}
if C['reviewConcerns']:
 ref=download(C['voiceReference'],O/'reference')
 prompt='Listen to the actual audio. First clip is the owner-accepted SAME-VOICE reference, second is the candidate to judge. Candidate language '+C['locale']+'. Duration '+str(duration)+' seconds. Resolve specific prior automated alerts; they can be false. First listen to the complete candidate independently, then compare its exact scientific reference. Natural Egyptian speech is intended for Arabic: no required MSA endings, no mandatory pronounced ta in ta marbuta, glottal qaf and Egyptian g are normal. Do not infer a shadda error from spelling. Voice identity permits normal prosody variation. Do not flag ordinary sentence pauses as chopping. Prior timestamps sometimes wrongly use fractions such as .25 for 25 seconds: do not trust or rescale them blindly. Locate any real defect from the actual recording. Return JSON {status: clear|repair|uncertain, dispositions:[{priorIssue,decision:confirmed|dismissed|uncertain,acousticReason}], actualIssues:[{start,end,heard,expected,category,severity,acousticEvidence}], notes}. If confirmed phonetic issue, give heard syllables/IPA with actual seconds. If just a reviewer timestamp defect and no audible candidate defect, dismiss it explicitly. Do not certify native/human acceptance. Reference transcript: '+C['spokenText']+' Prior alerts: '+json.dumps(C['reviewConcerns'],ensure_ascii=False)
 review=call('adjudication',M['adjudicationModel'],prompt,[ref.read_bytes(),data]);assert review['status'] in ['clear','repair','uncertain'];assert isinstance(review['actualIssues'],list)
 for i in review['actualIssues']:assert 0<=i['start']<i['end']<=duration+.15
 if review['actualIssues'] and review['status']=='clear':review['status']='uncertain'
save('review-disposition.json',review)
prompt='Listen to this actual '+C['locale']+' recording, duration '+str(duration)+' seconds. Extract acoustic timing, never distribute time by text length or equal scene fractions. Return JSON {words:[{word,start,end}],captions:[{text,start,end}],actions:[{id,start,end,heardAnchor,uncertaintySeconds}],issues:[],method}. Every spoken word, including numbers and negations, needs approximate start/end derived from sound. Captions max 9 words per span, clean display text with no director cues. For each required action below locate the corresponding spoken idea, and quote its actual heard phrase in heardAnchor. Use null start/end if there is no corresponding idea; never fabricate an anchor. Keep all times in actual seconds, not normalized fractions. Actions may share an onset if their meanings are discussed together. Spoken reference: '+C['spokenText']+' Actions: '+json.dumps(C['actions'],ensure_ascii=False)
t=call('timing',M['timingModel'],prompt,[data]);problems=[]
for field in ['words','captions']:
 prev=-1
 assert t.get(field),field
 for x in t[field]:
  if not isinstance(x.get('start'),(int,float)) or not isinstance(x.get('end'),(int,float)) or not 0<=x['start']<x['end']<=duration+.15:problems.append(field+' invalid time')
  elif x['start']<prev-.15:problems.append(field+' unordered')
  prev=x.get('start',-1) or -1
if set(x['id'] for x in t['actions'])!=set(x['id'] for x in C['actions']):problems.append('action IDs differ')
for x in t['actions']:
 if not isinstance(x.get('start'),(int,float)) or not isinstance(x.get('end'),(int,float)) or not 0<=x['start']<x['end']<=duration+.15 or not x.get('heardAnchor'):problems.append('unresolved action anchor '+x['id'])
 if x.get('uncertaintySeconds',99)>1:problems.append('uncertain action '+x['id'])
if t.get('issues'):problems.append('timing model reported issues')
# Reject fraction-normalised or badly truncated cue clocks against actual acoustic support.
with wave.open(str(source),'rb') as af:
 rate=af.getframerate();samples=array.array('h',af.readframes(af.getnframes()))
if sys.byteorder!='little':samples.byteswap()
last=0.0
for i in range(0,len(samples),480):
 block=samples[i:i+480]
 if block and math.sqrt(sum(x*x for x in block)/len(block))>180:last=min(duration,(i+len(block))/rate)
ends=[x.get('end',0) for x in t.get('words',[]) if isinstance(x.get('end'),(int,float))]
if not ends or max(ends)<last-2:problems.append('word clock ends before measured voiced support')
save('acoustic-clock-check.json',{'measuredDuration':duration,'lastAboveThresholdWindowEnd':last,'thresholdRMS':180,'windowFrames':480,'wordClockEnd':max(ends) if ends else None,'limits':'Energy check rejects obvious normalised clocks; it is not phoneme alignment.'})
report={'id':sid,'audioSHA256':sha(data),'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'model':C['model'],'voice':C['voice'],'durationSeconds':duration,'reviewStatus':review['status'],'timingProblems':problems,'readyForRenderReview':review['status']=='clear' and not problems,'humanListenedToThisRecording':False,'method':'Actual-audio model-derived approximate timing; not phonetic forced alignment. No text-length estimates.'};save('verification.json',report);print(json.dumps(report))
