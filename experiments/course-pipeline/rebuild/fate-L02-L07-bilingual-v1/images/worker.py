from pathlib import Path
import json,hashlib,base64,os,sys,urllib.request,urllib.error,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());sid=sys.argv[1];mode=sys.argv[2];C=next(x for x in M['scenes'] if x['id']==sid);O=R/'output';O.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'];assert M['automaticRetries']==0 and len(M['scenes'])==43
model=M['imageModel'] if mode=='generate' else M['reviewModel'];record=mode+'-attempt.json';assert not (O/record).exists()
state={'scene':sid,'mode':mode,'model':model,'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'run':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA']};save(record,state)
def api(payload=None):
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+model+(':generateContent' if payload else ''),data=json.dumps(payload).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=240) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
try:
 info=api();save(mode+'-availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 if mode=='generate':
  prompt=M['style']+'\nEducational scene: '+C['title']['en']+'\nScientific meaning: '+C['meaning']+'\nFull scene contract for context (ALL writing, diagrams, arrows, charts, mathematical marks and motion will be separate editable overlays; do NOT bake any into the image): '+C['visualContract']+'\nCreate only a realistic, sophisticated material/subject illustration for this scene. Objects spaced clearly with room for later overlays. Never use panels of written text. No text, no letters, no numbers, no captions, no logos, no arrows, no faux writing. Do not depict molecular structures or invented experimental results. Keep the right 35 percent restrained and uncluttered for editable explanation. Make subject scientifically plausible, distinctive and directly relevant; this is a conceptual illustration, not photographic evidence.'
  payload={'contents':[{'parts':[{'text':prompt}]}],'generationConfig':{'responseModalities':['TEXT','IMAGE'],'imageConfig':{'aspectRatio':'16:9','imageSize':'2K'}}};save('provider-request.json',payload)
 else:
  v=json.loads((O/'image.json').read_text());image=(O/v['file']).read_bytes();assert sha(image)==v['sha256'];prompt='Review this actual generated university illustration against the subject contract. Return JSON {status: usable|reject|uncertain, issues:[{category,observation,severity}], scientificLimits, textPresent:boolean}. Reject invented results, misleading quantities, impossible biology/equipment, cartoon childish imagery or baked readable labels/words/numbers/arrows. Missing editable labels/arrows is intentional; they will be animated separately. Do not invent defects. Intended meaning: '+C['meaning']+' Contract: '+C['visualContract'];payload={'contents':[{'parts':[{'text':prompt},{'inlineData':{'mimeType':v['mimeType'],'data':base64.b64encode(image).decode()}}]}],'generationConfig':{'temperature':0,'responseMimeType':'application/json'}};save('review-request.json',{'prompt':prompt,'imageSHA256':v['sha256'],'model':model})
 state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN');save(record,state);res=api(payload);parts=res['candidates'][0]['content']['parts']
 if mode=='generate':
  inline=next(p['inlineData'] for p in parts if not p.get('thought') and p.get('inlineData',{}).get('mimeType','').startswith('image/'));raw=base64.b64decode(inline['data'],validate=True);ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'}[inline['mimeType']];filename=sid+ext;(O/filename).write_bytes(raw);save('image.json',{'scene':sid,'file':filename,'mimeType':inline['mimeType'],'sha256':sha(raw),'promptSHA256':sha(prompt.encode()),'model':model,'returnedModelVersion':res.get('modelVersion'),'status':'GENERATED_UNREVIEWED','native3D':False});save('provider-metadata.json',{k:v for k,v in res.items() if k!='candidates'})
 else:
  save('review-response.json',res);result=json.loads(''.join(p.get('text','') for p in parts if not p.get('thought')));assert result['status'] in ['usable','reject','uncertain'];result.update(imageSHA256=v['sha256'],humanReviewed=False);save('review.json',result)
 state.update(status='PRESERVED',finishedUTC=now());save(record,state)
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save(record,state);raise
