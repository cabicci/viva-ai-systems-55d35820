"""Read-only provider availability check. Never generates media or substitutes a model."""
import json,os,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
root=Path(__file__).resolve().parent
request=json.loads((root/'model-preflight.json').read_text())
assert request['lessonId']=='SOIL-REBUILD-S1-01' and request['action']=='model-preflight-only'
assert request['generate'] is False and request['publish'] is False
key=next((os.environ.get(n) for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3'] if os.environ.get(n)),None)
out={'checkedAt':datetime.now(timezone.utc).isoformat(),'lessonId':request['lessonId'],'credentialPresent':bool(key),'generationCalls':0,'models':{},'availableRelatedModels':[]}
def get(path):
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/'+path,headers={'x-goog-api-key':key})
 with urllib.request.urlopen(req,timeout=60) as response:return json.load(response)
if key:
 for role,name in request['models'].items():
  try:
   model=get('models/'+name)
   out['models'][role]={'requested':name,'available':'generateContent' in model.get('supportedGenerationMethods',[]),'reportedName':model.get('name')}
  except urllib.error.HTTPError as e:out['models'][role]={'requested':name,'available':False,'httpStatus':e.code}
  except Exception as e:out['models'][role]={'requested':name,'available':False,'errorType':type(e).__name__}
 if not all(x['available'] for x in out['models'].values()):
  try:out['availableRelatedModels']=[m['name'] for m in get('models?pageSize=1000').get('models',[]) if any(s in m.get('name','').lower() for s in ['tts','image','banana'])]
  except Exception as e:out['listErrorType']=type(e).__name__
out['allRequestedAvailable']=bool(key) and len(out['models'])==2 and all(x['available'] for x in out['models'].values())
(root/'preflight-output').mkdir(exist_ok=True)
(root/'preflight-output/result.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out))
if not out['allRequestedAvailable']:raise SystemExit(1)
