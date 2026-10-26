"""Finite Actions-only Bunny Stream phases. Proposal: never dispatches itself.

No captions, deletion, library changes, platform writes, credentials in files, or
automatic mutation retry. Separate durable artifacts between every write phase.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,os,re,subprocess,time,urllib.request,urllib.error,urllib.parse,uuid
PROJECT='82922e08-4caf-48f5-b72e-ab2e6a87c51c';LIBRARY='670679'
COLLECTION_NAME='مصير المبيدات في البيئة — نسخة v2'
BASE='https://video.bunnycdn.com/library/'+LIBRARY+'/videos'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(p,x):
 p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix(p.suffix+'.tmp')
 with tmp.open('w',encoding='utf8',newline='\n') as f:json.dump(x,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
 os.replace(tmp,p)
def load(p):return json.loads(p.read_text(encoding='utf8'))
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('Redirect denied; no credential forwarding')
def api(method,suffix='',body=None,binary=None,resource='videos'):
 assert os.environ.get('GITHUB_ACTIONS')=='true','All remote calls must run on Actions'
 assert os.environ.get('BUNNY_STREAM_LIBRARY_ID')==LIBRARY,'Configured library differs; do not use another account/library'
 assert method in ['GET','POST','PUT'] and not ('://' in suffix or '..' in suffix)
 assert resource in ['videos','collections']
 if resource=='collections':
  assert method in ['GET','POST']
  if method=='POST':assert body=={'name':COLLECTION_NAME}
 if method=='POST':assert not suffix,'Only a new video POST is supported'
 if method=='PUT':assert re.fullmatch(r'/[0-9a-f-]{36}\?transcribeEnabled=false&generateTitle=false&generateDescription=false&generateChapters=false&generateMoments=false',suffix)
 headers={'AccessKey':os.environ['BUNNY_STREAM_API_KEY'],'Accept':'application/json'}
 if binary is not None:headers.update({'Content-Type':'application/octet-stream','Content-Length':str(binary.stat().st_size)})
 elif body is not None:headers['Content-Type']='application/json'
 opener=urllib.request.build_opener(NoRedirect)
 endpoint=BASE if resource=='videos' else 'https://video.bunnycdn.com/library/'+LIBRARY+'/collections'
 try:
  if binary is not None:
   with binary.open('rb') as f:
    req=urllib.request.Request(endpoint+suffix,data=f,headers=headers,method=method)
    with opener.open(req,timeout=600) as res:return json.load(res)
  req=urllib.request.Request(endpoint+suffix,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
  with opener.open(req,timeout=60) as res:return json.load(res)
 except urllib.error.HTTPError as e:raise RuntimeError('Bunny HTTP '+str(e.code)+'; no response body or secret logged') from None
 except Exception as e:raise RuntimeError('Bunny '+method+' outcome unresolved: '+type(e).__name__+'; no automatic retry') from None
def metadata(x,title=None,collectionID=None):
 assert str(x['videoLibraryId'])==LIBRARY and re.fullmatch(r'[0-9a-f-]{36}',x['guid'])
 if title is not None:assert x['title']==title,'Remote ownership title differs'
 if collectionID is not None:assert x.get('collectionId')==collectionID,'Video belongs to another or missing collection; no upload/move/overwrite'
 return {k:x.get(k) for k in ['videoLibraryId','guid','title','collectionId','status','originalHash','hasOriginal','length','width','height','encodeProgress','availableResolutions','isPublic']}
def exact_find(title,collectionID=None):
 found=[]
 for page in range(1,4):
  x=api('GET','?'+urllib.parse.urlencode({'search':title,'page':page,'itemsPerPage':100}))
  assert int(x['currentPage'])==page and int(x['totalItems'])<=300,'Bounded search incomplete; no mutation allowed'
  found.extend(metadata(v,title,collectionID) for v in (x.get('items') or []) if v['title']==title)
  if page*int(x['itemsPerPage'])>=int(x['totalItems']):break
 else:raise RuntimeError('Bounded title reconciliation incomplete')
 assert len(found)<=1,'Duplicate exact titles; ownership ambiguous, preserve all'
 return found[0] if found else None
def durable(name):
 # Supplied only from a successfully completed upload-artifact step. Keep its ID.
 value=os.environ.get(name,'');assert value.isdigit() and int(value)>0,'Required prior durable artifact acknowledgment missing'
 return value
def source(m,e,root):
 assert m['projectID']==PROJECT and m['edition']=='rebuild-v2' and m['libraryID']==LIBRARY
 assert m['uploadEnabled'] is True and 1<=len(m['entries'])<=22
 assert m['maxCreateCalls']==m['maxPutCalls']==len(m['entries']) and m['maxCaptionCalls']==0 and m['automaticRetries']==0
 col=m['collection'];assert col['name']==COLLECTION_NAME and col['libraryID']==LIBRARY and re.fullmatch(r'[0-9a-f-]{36}',col['id'])
 proof=col['receipt'];pd=root/'collection-proof';pd.mkdir(exist_ok=True)
 subprocess.run(['gh','run','download',str(proof['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',proof['artifact'],'--dir',str(pd)],check=True,capture_output=True)
 pp=(pd/proof['file']).resolve();assert pd.resolve() in pp.parents and sha(pp)==proof['sha256'];receipt=load(pp)
 assert receipt['projectID']==PROJECT and receipt['edition']=='rebuild-v2' and receipt['libraryID']==LIBRARY and receipt['name']==COLLECTION_NAME and receipt['guid']==col['id'] and receipt['state']=='COLLECTION_VERIFIED_AFTER_DURABLE_GUID' and receipt['createCalls']==1 and receipt['durableCreateIntentArtifactID'] and receipt['durableGUIDArtifactID']
 actual=api('GET','/'+col['id'],resource='collections');assert str(actual['videoLibraryId'])==LIBRARY and actual['guid']==col['id'] and actual['name']==COLLECTION_NAME
 assert re.fullmatch(r'FATE2-S(?:0[1-9]|1[01])',e['stepID']) and e['locale'] in ['ar-EG','en'] and e['role']=='full_step_master'
 s=e['source'];assert re.fullmatch(r'[0-9a-f]{64}',s['sha256']) and s['file']==e['stepID']+'-'+e['locale']+'.mp4'
 assert s['artifact'] and not any(x in s['artifact'].lower() for x in ['legacy','bilingual-v1'])
 d=root/'source';d.mkdir(exist_ok=True)
 run=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/runs/'+str(s['run'])]));assert run['head_sha']==s['head']
 subprocess.run(['gh','run','download',str(s['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',s['artifact'],'--dir',str(d)],check=True,capture_output=True)
 p=(d/s['file']).resolve();assert d.resolve() in p.parents and sha(p)==s['sha256'] and 0<p.stat().st_size<2_000_000_000,'Missing/excessive source; review TUS separately if2GB+'
 a=(d/e['assemblyFile']).resolve();assert d.resolve() in a.parents and sha(a)==e['assemblySHA256'];assembly=load(a);assert assembly['videoSHA256']==s['sha256'] and assembly['locale']==e['locale']
 assert isinstance(e['expectedSceneCount'],int) and 1<=e['expectedSceneCount']<=20 and assembly['sceneCount']==e['expectedSceneCount'],'Not the exact reviewed complete step master; never assume S01 count'
 review=e['hostingQualification'];assert review['sourceVideoSHA256']==s['sha256'] and review['stepID']==e['stepID'] and review['locale']==e['locale'] and review['state']=='qualified_for_hosting' and review['evidenceRefs']
 assert 1<=len(review['evidenceRefs'])<=6
 for i,r in enumerate(review['evidenceRefs']):
  assert re.fullmatch(r'[0-9a-f]{64}',r['sha256']) and r['file'] and r['run']
  eroot=root/'review-evidence'/str(i);eroot.mkdir(parents=True,exist_ok=True)
  subprocess.run(['gh','run','download',str(r['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',r['artifact'],'--dir',str(eroot)],check=True,capture_output=True)
  ep=(eroot/r['file']).resolve();assert eroot.resolve() in ep.parents and sha(ep)==r['sha256'],'Actual hosting review evidence differs'
  if r['file']=='qualified-for-hosting.en.json':
   q=load(ep);qe=next(x for x in q['entries'] if x['id']==e['id']);assert q['projectID']==PROJECT and q['edition']=='rebuild-v2' and q['libraryID']==LIBRARY and qe['state']=='qualified_for_hosting' and qe['sourceVideoSHA256']==s['sha256'] and qe['source']==s and qe['assemblySHA256']==e['assemblySHA256']
  elif r['file']=='FATE2-S01-media-review.en.json':
   assert load(ep)['identities'][e['locale']]['videoSHA256']==s['sha256']
 assert isinstance(e['title'],str) and 1<=len(e['title'])<=180 and not any(ord(c)<32 for c in e['title'])
 return p,e['title']
def main():
 ap=argparse.ArgumentParser();ap.add_argument('phase',choices=['probe','intent','create','upload-intent','upload','status','reconcile']);ap.add_argument('--manifest',default='manifest.json');ap.add_argument('--entry');ap.add_argument('--journal',default='journal');args=ap.parse_args()
 assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_RUN_ATTEMPT')=='1','Reruns forbidden; use explicit read-only reconciliation workflow'
 root=Path(args.journal);root.mkdir(parents=True,exist_ok=True)
 if args.phase=='probe':
  # Only the verified library, project prefix search, no account/library enumeration.
  x=api('GET','?'+urllib.parse.urlencode({'search':'masaarat-'+PROJECT+'-rebuild-v2-','page':1,'itemsPerPage':10}))
  items=[metadata(v) for v in x.get('items') or []]
  save(root/'probe.en.json',{'utc':now(),'libraryID':LIBRARY,'authenticatedReadSucceeded':True,'matchingProjectItems':len(items),'totalMatchingProjectItems':x.get('totalItems'),'mutatingCalls':0,'limits':'Read access to exact configured library; no billing/organization ownership claim, no video playback or upload proof.'});return
 path=Path(args.manifest);m=load(path);assert sha(path)==os.environ['EXPECTED_MANIFEST_SHA256'];e=next(e for e in m['entries'] if e['id']==args.entry)
 jpath=root/'receipt.en.json';j=load(jpath) if jpath.exists() else None
 if args.phase=='intent':
  assert j is None,'Prior journal exists. Reconcile it, never replay blindly'
  artifactBase='bunny-v2-'+e['id']+'-'+e['source']['sha256']
  # Across-run fence: a prior durable intent for this exact source always holds
  # a fresh operation, including a lost POST acknowledgment or incomplete PUT.
  query='/actions/artifacts?'+urllib.parse.urlencode({'name':artifactBase+'-create-intent','per_page':100})
  history=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+query]))
  assert history['total_count']<=100,'Intent history incomplete'
  assert not history.get('artifacts'),'Prior durable intent exists: restore its journal and run read-only reconcile; never create/upload blindly'
  assert e['priorReceiptLedgerReviewed'] is True and e['priorReceiptLedgerEvidence'],'Root must reconcile permanent on-drive receipt history, including expired CI artifacts'
  p,title=source(m,e,root);remote=exact_find(title,m['collection']['id'])
  j={'schema':'masaarat.bunny.receipt.v1','projectID':PROJECT,'edition':'rebuild-v2','stepID':e['stepID'],'locale':e['locale'],'libraryID':LIBRARY,'collectionID':m['collection']['id'],'collectionName':COLLECTION_NAME,'sourceVideoSHA256':e['source']['sha256'],'source':e['source'],'title':title,'intentID':str(uuid.uuid4()),'runID':os.environ['GITHUB_RUN_ID'],'createdUTC':now(),'state':'CREATE_INTENT_PENDING_DURABLE_ARTIFACT','createCalls':0,'putCalls':0,'captionCalls':0,'nativePlaybackVerified':False,'platformMappingChanged':False}
  if remote:
   assert (remote.get('originalHash') or '').lower()==e['source']['sha256'],'Existing exact title has no matching original-source hash; ownership ambiguous'
   j.update(state='EXISTING_SOURCE_PROVEN_NO_MUTATION',guid=remote['guid'],remote=remote)
  save(jpath,j)
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('receiptArtifactBase='+artifactBase+'\n')
  return
 assert j and j['projectID']==PROJECT and j['sourceVideoSHA256']==e['source']['sha256'] and j['title']==e['title']
 assert j['collectionID']==m['collection']['id'] and j['collectionName']==COLLECTION_NAME
 if args.phase=='create':
  if j['state']=='EXISTING_SOURCE_PROVEN_NO_MUTATION':return
  assert j['state']=='CREATE_INTENT_PENDING_DURABLE_ARTIFACT' and j['createCalls']==0
  ack=durable('DURABLE_CREATE_INTENT_ARTIFACT_ID');assert exact_find(j['title'],j['collectionID']) is None,'Title appeared after intent; reconcile, do not duplicate'
  j.update(state='CREATE_REQUEST_STARTED_OUTCOME_UNKNOWN',createCalls=1,durableCreateIntentArtifactID=ack);save(jpath,j)
  try:
   r=metadata(api('POST',body={'title':j['title'],'collectionId':j['collectionID']}),j['title'],j['collectionID']);j.update(state='CREATED_GUID_PENDING_DURABLE_ARTIFACT',guid=r['guid'],remote=r);save(jpath,j)
  except Exception:save(jpath,j);raise
 elif args.phase=='upload-intent':
  if j['state']=='EXISTING_SOURCE_PROVEN_NO_MUTATION':return
  assert j['state']=='CREATED_GUID_PENDING_DURABLE_ARTIFACT' and j['putCalls']==0
  ack=durable('DURABLE_GUID_ARTIFACT_ID');r=metadata(api('GET','/'+j['guid']),j['title'],j['collectionID']);assert not r.get('hasOriginal') and not r.get('originalHash'),'Remote already has an original; reconcile only'
  j.update(state='UPLOAD_INTENT_PENDING_DURABLE_ARTIFACT',durableGUIDArtifactID=ack);save(jpath,j)
 elif args.phase=='upload':
  if j['state']=='EXISTING_SOURCE_PROVEN_NO_MUTATION':return
  assert j['state']=='UPLOAD_INTENT_PENDING_DURABLE_ARTIFACT' and j['putCalls']==0 and j['createCalls']==1
  ack=durable('DURABLE_UPLOAD_INTENT_ARTIFACT_ID');p=(root/'source'/e['source']['file']).resolve();assert sha(p)==e['source']['sha256']
  r=metadata(api('GET','/'+j['guid']),j['title'],j['collectionID']);assert not r.get('hasOriginal') and not r.get('originalHash'),'An original appeared; no repeated PUT'
  j.update(state='UPLOAD_REQUEST_STARTED_OUTCOME_UNKNOWN',putCalls=1,durableUploadIntentArtifactID=ack);save(jpath,j)
  try:
   suffix='/'+j['guid']+'?transcribeEnabled=false&generateTitle=false&generateDescription=false&generateChapters=false&generateMoments=false'
   r=api('PUT',suffix,binary=p);assert r.get('success') is True;j.update(state='UPLOAD_ACKNOWLEDGED_PROCESSING_PENDING',uploadAcknowledgedUTC=now());save(jpath,j)
  except Exception:save(jpath,j);raise
 elif args.phase in ['status','reconcile']:
  observations=j.setdefault('processingObservations',[])
  for attempt in range(1,13):
   r=metadata(api('GET','/'+j['guid']),j['title'],j['collectionID']) if j.get('guid') else exact_find(j['title'],j['collectionID'])
   observed={'utc':now(),'poll':attempt,'remote':r};observations.append(observed)
   save(root/'status-observations'/('poll-%02d.en.json'%attempt),observed)
   j['lastReadUTC']=observed['utc'];j['reconciliationRemote']=r
   if r:
    h=(r.get('originalHash') or '').lower()
    if h and h!=e['source']['sha256']:
     j['reconciliation']='SOURCE_MISMATCH_HOLD';save(jpath,j);break
    elif h==e['source']['sha256']:
     j.update(guid=r['guid'],reconciliation='EXACT_ORIGINAL_SHA256_PROVEN')
     j['processingMetadataComplete']=bool(r.get('encodeProgress')==100 and r.get('length',0)>0 and r.get('availableResolutions'))
     j['embedURL']='https://iframe.mediadelivery.net/embed/'+LIBRARY+'/'+r['guid']+'?autoplay=false&preload=false'
    else:j['reconciliation']='SOURCE_NOT_YET_PROVEN_HOLD_NO_WRITE_RETRY'
   else:j['reconciliation']='NO_EXACT_TITLE_VISIBLE_UNKNOWN_OUTCOME_HOLD_NO_CREATE_RETRY'
   save(jpath,j)
   if j.get('processingMetadataComplete') or attempt==12 or not j.get('guid'):break
   time.sleep(10)

if __name__=='__main__':main()
