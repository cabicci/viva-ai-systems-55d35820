"""One explicitly owner-authorized new-edition collection, on Actions only."""
from pathlib import Path
import argparse,json,os,re,subprocess,urllib.parse,uuid
from bunny_adapter import api,save,load,sha,now,durable,PROJECT,LIBRARY,COLLECTION_NAME
INTENT_ARTIFACT='bunny-v2-collection-82922e08-create-intent'
def meta(v):
 assert str(v['videoLibraryId'])==LIBRARY and re.fullmatch(r'[0-9a-f-]{36}',v['guid'])
 return {k:v.get(k) for k in ['videoLibraryId','guid','name','videoCount','liveStreamCount','totalSize']}
def discover():
 candidates=[];pages=[]
 for n in range(1,4):
  q='?'+urllib.parse.urlencode({'search':COLLECTION_NAME,'page':n,'itemsPerPage':100,'includeThumbnails':'false'})
  x=api('GET',q,resource='collections');assert x['currentPage']==n and x['totalItems']<=300,'Collection inventory incomplete; no create'
  candidates.extend(meta(v) for v in (x.get('items') or []));pages.append({'page':n,'totalItems':x['totalItems'],'itemsPerPage':x['itemsPerPage'],'returnedItems':len(x.get('items') or [])})
  if n*int(x['itemsPerPage'])>=int(x['totalItems']):break
 else:raise RuntimeError('Incomplete bounded collection inventory')
 exact=[v for v in candidates if v['name']==COLLECTION_NAME]
 # Name alone cannot prove project ownership, even for a single match.
 return {'schema':'masaarat.bunny.collection-inventory.v1','utc':now(),'projectID':PROJECT,'edition':'rebuild-v2','libraryID':LIBRARY,'name':COLLECTION_NAME,'runID':int(os.environ['GITHUB_RUN_ID']),'pages':pages,'exactMatches':exact,'similarNameCandidates':[v for v in candidates if v['name']!=COLLECTION_NAME],'decision':'NO_EXACT_MATCH_OBSERVED' if not exact else 'EXACT_NAME_PRESENT_OWNERSHIP_UNPROVEN_HOLD','mutatingCalls':0}
def main():
 p=argparse.ArgumentParser();p.add_argument('phase',choices=['discover','intent','create','verify','reconcile']);p.add_argument('--request',default='collection-request.json');p.add_argument('--journal',default='collection-journal');a=p.parse_args()
 assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
 f=Path(a.request);M=load(f);assert sha(f)==os.environ['EXPECTED_COLLECTION_REQUEST_SHA256']
 assert M['projectID']==PROJECT and M['edition']=='rebuild-v2' and M['libraryID']==LIBRARY and M['name']==COLLECTION_NAME and M['maxCreateCalls']==1 and M['automaticRetries']==0 and M['maxUpdateCalls']==M['maxDeleteCalls']==0
 D=Path(a.journal);D.mkdir(parents=True,exist_ok=True);receipt=D/'collection-receipt.en.json'
 if a.phase=='discover':save(D/'collection-inventory.en.json',discover());return
 if a.phase=='intent':
  assert M['createEnabled'] is True and not receipt.exists(),'Creation not enabled or prior journal exists: reconcile only'
  ref=M['observedInventory'];d=D/'prior-inventory';d.mkdir(exist_ok=True)
  subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True)
  oldfile=(d/ref['file']).resolve();assert d.resolve() in oldfile.parents and sha(oldfile)==ref['sha256'];old=load(oldfile)
  assert old['projectID']==PROJECT and old['libraryID']==LIBRARY and old['name']==COLLECTION_NAME and old['decision']=='NO_EXACT_MATCH_OBSERVED' and not old['exactMatches'],'Observed inventory does not authorize one new target'
  assert not old['similarNameCandidates'] or M['similarNameDecision']=='root_reviewed_distinct_new_name','Similar-name ownership unresolved'
  assert M['priorReceiptLedgerReviewed'] is True and M['priorReceiptLedgerEvidence'],'Permanent on-drive intent history must be checked, including expired CI receipts'
  history=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/artifacts?'+urllib.parse.urlencode({'name':INTENT_ARTIFACT,'per_page':100})]));assert history['total_count']==0 and not history.get('artifacts'),'Prior durable intent exists; restore its receipt and reconcile only'
  fresh=discover();save(D/'precreate-inventory.en.json',fresh);assert not fresh['exactMatches'],'Exact-name collection appeared; ownership hold'
  j={'schema':'masaarat.bunny.collection-receipt.v1','projectID':PROJECT,'edition':'rebuild-v2','libraryID':LIBRARY,'name':COLLECTION_NAME,'state':'COLLECTION_CREATE_INTENT_PENDING_DURABLE_ARTIFACT','createCalls':0,'updateCalls':0,'deleteCalls':0,'requestSHA256':sha(f),'observedInventory':ref,'intentID':str(uuid.uuid4()),'runID':int(os.environ['GITHUB_RUN_ID']),'utc':now()};save(receipt,j);return
 j=load(receipt);assert j['projectID']==PROJECT and j['edition']=='rebuild-v2' and j['libraryID']==LIBRARY and j['name']==COLLECTION_NAME
 if a.phase=='create':
  assert M['createEnabled'] is True and j['state']=='COLLECTION_CREATE_INTENT_PENDING_DURABLE_ARTIFACT' and j['createCalls']==0
  ack=durable('DURABLE_COLLECTION_INTENT_ARTIFACT_ID');fresh=discover();save(D/'last-precreate-inventory.en.json',fresh);assert not fresh['exactMatches'],'A collection appeared: no create or rename'
  j.update(state='COLLECTION_CREATE_STARTED_OUTCOME_UNKNOWN',createCalls=1,durableCreateIntentArtifactID=ack);save(receipt,j)
  try:
   v=meta(api('POST',body={'name':COLLECTION_NAME},resource='collections'));assert v['name']==COLLECTION_NAME
   j.update(state='COLLECTION_GUID_PENDING_DURABLE_ARTIFACT',guid=v['guid'],createResponse=v);save(receipt,j)
  except Exception:save(receipt,j);raise
 elif a.phase=='verify':
  assert j['state']=='COLLECTION_GUID_PENDING_DURABLE_ARTIFACT' and j['createCalls']==1
  ack=durable('DURABLE_COLLECTION_GUID_ARTIFACT_ID');v=meta(api('GET','/'+j['guid'],resource='collections'));assert v['guid']==j['guid'] and v['name']==COLLECTION_NAME
  j.update(state='COLLECTION_VERIFIED_AFTER_DURABLE_GUID',durableGUIDArtifactID=ack,verifiedMetadata=v,verifiedUTC=now());save(receipt,j)
 elif a.phase=='reconcile':
  if j.get('guid'):
   v=meta(api('GET','/'+j['guid'],resource='collections'));assert v['name']==COLLECTION_NAME;j['lastObservedMetadata']=v
   j['reconciliation']='SAVED_GUID_MATCHES_EXPECTED_NAME_LIBRARY; durable receipt evidence still required before upload binding'
  else:
   x=discover();save(D/'reconciliation-inventory.en.json',x)
   j['reconciliation']='UNKNOWN_CREATE_READ_ONLY_HOLD: exact name alone does not prove ownership; never repeat POST'
  j['lastReadUTC']=now();save(receipt,j)
if __name__=='__main__':main()
