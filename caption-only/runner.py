"""Bounded existing-GUID captions only; final playback is a separate browser stage."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,wait,FIRST_COMPLETED
import datetime,hashlib,json,os,sys,threading
from worker_ack_only_proposal import Worker,Files,RealTransportProposal,validate_manifest

def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(p,value):
 with Path(p).open('x',encoding='utf-8')as f:json.dump(value,f,ensure_ascii=False,indent=2);f.write('\n')

def run_entries(entries,transport_factory,out,worker_class=Worker):
 """No mutation retries; drain the already-running sibling after an unknown POST."""
 out=Path(out);out.mkdir(exist_ok=False,parents=True)
 save(out/'aggregate-intent.json',{'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entries':len(entries),'maximumParallel':2,'maximumCaptionPOSTs':len(entries),'automaticMutationRetries':0,'videoCreateDeletePUTCalls':0})
 results={};pending={};next_index=0;stop=False
 def one(i,e):
  folder=out/(f'v{i+1:03d}-'+e['sourceSHA256'][:12])
  return worker_class(transport_factory(),Files(folder)).run(e)
 with ThreadPoolExecutor(max_workers=2)as pool:
  while next_index<len(entries)and len(pending)<2:
   pending[pool.submit(one,next_index,entries[next_index])]=next_index;next_index+=1
  while pending:
   done,_=wait(pending,return_when=FIRST_COMPLETED)
   for future in done:
    i=pending.pop(future)
    try:state=future.result()
    except Exception as exc:
     state={'identity':entries[i]['identity'],'videoGuid':entries[i]['videoGuid'],'result':'AGGREGATE_EXCEPTION_UNKNOWN_NO_RETRY','errorClass':type(exc).__name__,'captionPOSTAttempted':None,'captionACK':False}
     stop=True
    results[i]=state
    if state.get('captionPOSTAttempted')and not state.get('captionACK'):stop=True
   while not stop and next_index<len(entries)and len(pending)<2:
    pending[pool.submit(one,next_index,entries[next_index])]=next_index;next_index+=1
 for i in range(next_index,len(entries)):
  results[i]={'identity':entries[i]['identity'],'videoGuid':entries[i]['videoGuid'],'result':'NOT_ATTEMPTED_AFTER_UNKNOWN_MUTATION','captionPOSTAttempted':False,'captionACK':False,'metadataReady':False,'automaticRetries':0}
 ordered=[results[i]for i in range(len(entries))]
 summary={'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'identities':len(entries),'maximumParallel':2,'POSTAttempts':sum(x.get('captionPOSTAttempted')is True for x in ordered),'captionACKs':sum(x.get('captionACK')is True for x in ordered),'existingTrackNoPOST':sum(x.get('result')=='EXISTING_TRACK_NO_POST_BROWSER_EXACT_CUE_CHECK_PENDING'for x in ordered),'metadataReady':sum(x.get('metadataReady')is True for x in ordered),'newMutationsStoppedAfterUnknownPOST':stop,'automaticMutationRetries':0,'videoCreateDeletePUTCalls':0,'remoteCaptionAndPlaybackStillRequireActualBrowserQA':True,'outcomes':ordered}
 save(out/'aggregate-outcome.json',summary)
 return summary

def main():
 assert os.environ['GITHUB_REPOSITORY']=='cabicci/viva-ai-systems-55d35820'
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
 assert digest('worker_ack_only_proposal.py')==os.environ['WORKER_SHA']
 assert digest('runner.py')==os.environ['RUNNER_SHA']
 assert digest('manifest.json')==os.environ['MANIFEST_SHA']
 m=json.loads(Path('manifest.json').read_text('utf-8'));validate_manifest(m)
 assert os.environ['GITHUB_REF_NAME']==m['executionBranch']
 assert os.environ['BUNNY_STREAM_LIBRARY_ID'].strip()=='670679'
 assert len(m['entries'])==22 and m['maximumCaptionPOSTs']==22
 # Credentials remain only in the worker transport, never in source or receipts.
 factory=lambda:RealTransportProposal(os.environ['BUNNY_STREAM_API_KEY'],os.environ['GH_TOKEN'])
 result=run_entries(m['entries'],factory,'output')
 print(json.dumps({k:v for k,v in result.items()if k!='outcomes'}))
 ok=result['captionACKs']+result['existingTrackNoPOST']==22 and not result['newMutationsStoppedAfterUnknownPOST']
 return 0 if ok else 2

if __name__=='__main__':sys.exit(main())
