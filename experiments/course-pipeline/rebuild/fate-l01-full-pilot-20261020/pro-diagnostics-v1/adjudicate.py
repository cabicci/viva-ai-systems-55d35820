from pathlib import Path
import os,sys,json,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));c=next(c for c in M['targets'] if c['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'];assert M['model']=='gemini-2.5-pro' and M['automaticRetries']==0
save=lambda n,v:(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
paths=[]
for i,src in enumerate(c['sources']):
 d=R/('source'+str(i));subprocess.run(['gh','run','download',str(src['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',src['artifact'],'--dir',str(d)],check=True);matches=list(d.rglob(src['file']));assert len(matches)==1 and sha(matches[0].read_bytes())==src['sha256'];paths.append(matches[0])
state={'id':c['id'],'model':M['model'],'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'sourceHashes':[sha(p.read_bytes()) for p in paths],'humanListeningApproved':False};save('attempt.json',state)
def api(payload=None):
 u='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '');req=urllib.request.Request(u,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as response:return json.load(response)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError(type(e).__name__) from None
try:
 info=api();save('availability.json',info);assert 'generateContent' in info['supportedGenerationMethods']
 prompt='Analyze the actual audio only; never synthesize. Resolve this specific disputed observation without accepting the earlier model claim as true. Egyptian Arabic university narration; ordinary Egyptian connected speech and natural prosody are correct. Do not require MSA pronunciation. Do not certify native accent or owner acceptance. '+c['question']+' Return JSON with status no_material_issue/confirmed_issue/uncertain, actualHeardTranscript, observations [{start,end,heard,reason,certainty}], and notes. Timestamps relative to the candidate audio, approximate from actual sound. Do not invent a defect to fill a quota.'
 parts=[{'text':prompt}]+[{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(p.read_bytes()).decode()}} for p in paths];save('request.json',{'prompt':prompt,'sourceHashes':state['sourceHashes'],'model':M['model']});state['status']='REQUEST_STARTED_OUTCOME_UNKNOWN';save('attempt.json',state)
 res=api({'contents':[{'parts':parts}],'generationConfig':{'temperature':0,'responseMimeType':'application/json'}});save('response.json',res);a=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));assert a['status'] in ['no_material_issue','confirmed_issue','uncertain'];save('analysis.json',a);state.update(status='COMPLETE',result=a['status'],finishedUTC=now());save('attempt.json',state)
except Exception as e:state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('attempt.json',state);raise
