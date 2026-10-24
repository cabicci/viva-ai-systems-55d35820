import os,json,hashlib,sys
from pathlib import Path
from worker_proposal import validate_manifest,Worker,Files,RealTransportProposal
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert os.environ['GITHUB_REPOSITORY']=='cabicci/viva-ai-systems-55d35820'
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert sha('worker_proposal.py')==os.environ['WORKER_SHA']
assert sha('runner.py')==os.environ['RUNNER_SHA']
assert sha('manifest.json')==os.environ['MANIFEST_SHA']
m=json.loads(Path('manifest.json').read_text('utf-8'));validate_manifest(m)
assert os.environ['GITHUB_REF_NAME']==m['executionBranch']
assert len(m['entries'])==1 and m['maximumCaptionPOSTs']==1
assert m['entries'][0]['videoGuid']=='be942b2a-2ae0-40b1-886c-507be1f715f1'
assert os.environ['BUNNY_STREAM_LIBRARY_ID'].strip()=='670679'
out=Path('output');out.mkdir(exist_ok=False)
(out/'aggregate-intent.json').write_text(json.dumps({'identities':1,'maximumPOSTs':1,'automaticRetries':0,'videoCreateDeletePUTCalls':0,'manifestSHA256':sha('manifest.json')},indent=2)+'\n','utf-8')
class ObservedTransport(RealTransportProposal):
 def __init__(self,*args):
  super().__init__(*args);self.n=0
  base=self._opener
  class VersionedOpener:
   def open(self,req,timeout):
    if req.full_url.startswith('https://api.github.com/'):
     req.add_header('X-GitHub-Api-Version','2022-11-28')
    return base.open(req,timeout=timeout)
  self._opener=VersionedOpener()
 def request(self,method,url,body,auth):
  result=super().request(method,url,body,auth);self.n+=1
  from urllib.parse import urlsplit,urlunsplit
  p=urlsplit(url);safe=urlunsplit((p.scheme,p.netloc,p.path,'',''))
  data={'method':method,'urlWithoutQuery':safe,'HTTPStatus':result[0],'responseBytes':len(result[1]),'responseSHA256':hashlib.sha256(result[1]).hexdigest(),'contentType':next((v for k,v in result[2].items()if k.lower()=='content-type'),None),'credentialClassOnly':auth}
  (out/('transport-response-%02d.json'%self.n)).write_text(json.dumps(data,indent=2)+'\n','utf-8')
  return result
transport=ObservedTransport(os.environ['BUNNY_STREAM_API_KEY'],os.environ['GH_TOKEN'])
state=Worker(transport,Files(out/'v001')).run(m['entries'][0])
(out/'aggregate-outcome.json').write_text(json.dumps({'identities':1,'outcomes':[state],'videoCreateDeletePUTCalls':0,'automaticRetries':0},ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'metadataReady':state['metadataReady'],'captionACK':state['captionACK'],'remoteVTTActualMatch':state['remoteVTTActualMatch'],'result':state['result'],'reason':state.get('reason'),'videoCreateDeletePUTCalls':0}))
sys.exit(0 if state['remoteVTTActualMatch'] else 2)
