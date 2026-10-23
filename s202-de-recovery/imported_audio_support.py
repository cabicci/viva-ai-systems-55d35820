"""Narrow offline-proofed S202 DE recovery support; no network, provider or retry calls.

The original job and shared-provider-stop are immutable evidence. Only exact
R01--R03 original PCM may be imported, only for previously uncalled diagnostics.
This module does not authorize publication, generation or integration.
"""
from pathlib import Path,PurePosixPath
import base64,hashlib,io,json,os,shutil,stat,wave,zipfile
ORIGIN_RUN='39896591297'
ORIGIN_COMMIT='852116ad13bfd844551a4ae08c2ce96cd0f40512'
ORIGIN_REQUEST='62702a33718a205eb4cc6efa272b2d6750706f135f6f73a4160b089cdd358c5a'
ORIGIN_WORKER='3ab6a10181e6eae684bc4e392a332dbae7915ae7baac56464882aad6bf4ea901'
IMPORTED=('S2-02-de-R01-r1','S2-02-de-R02-r1','S2-02-de-R03-r1')
NEW=('S2-02-de-R05-r1','S2-02-de-R06-r1','S2-02-de-R07-r1')
FIELDS=('id','locale','voice','model','speakerId','sourceWholeFileSHA256','sourceBindings','spokenText','spokenTextSha256','delivery','deliverySha256','requestFingerprintSha256')

def sha_bytes(b):return hashlib.sha256(b).hexdigest()
def sha(p):return sha_bytes(Path(p).read_bytes())
def read(p):return json.loads(Path(p).read_text('utf-8'))
def pin(p):return {'sha256':sha(p),'bytes':Path(p).stat().st_size}
def exact_pcm(b):
 with wave.open(io.BytesIO(b),'rb')as w:
  assert(w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
  return w.readframes(w.getnframes())

def zip_members(base,entry):
 p=base/entry['path'];assert p.resolve().is_relative_to(base.resolve())and not p.is_symlink();assert pin(p)==entry['pin']
 assert str(entry['artifactId']).isdigit()and entry['apiDigest'].removeprefix('sha256:')==entry['pin']['sha256']
 assert(str(entry['runId']),entry['commit'])==(ORIGIN_RUN,ORIGIN_COMMIT)
 z=zipfile.ZipFile(io.BytesIO(p.read_bytes()));infos=z.infolist();assert 0<len(infos)<1500 and sum(x.file_size for x in infos)<1_000_000_000
 assert len({x.filename for x in infos})==len(infos)
 result={}
 for x in infos:
  q=PurePosixPath(x.filename);assert not q.is_absolute()and '..'not in q.parts and '\\'not in x.filename and not stat.S_ISLNK(x.external_attr>>16)
  if not x.is_dir():result[x.filename]=z.read(x)
 assert set(result)==set(entry['files'])
 for name,b in result.items():assert {'sha256':sha_bytes(b),'bytes':len(b)}==entry['files'][name]
 return result

def verify_imports(base,request):
 base=Path(base);manifest=read(base/'import-plan.json')
 assert manifest['originalRunId']==ORIGIN_RUN and manifest['originalCommit']==ORIGIN_COMMIT
 assert tuple(request['importedOriginalUnitIds'])==IMPORTED and tuple(request['newGenerationUnitIds'])==NEW
 assert set(u['id']for u in request['units'])==set(IMPORTED+NEW)
 assert(request['maximumTTSCalls'],request['maximumBlindAudioReviewCalls'],request['maximumASRInvocations'],request['maximumMetadataGETCalls'],request['automaticRetries'])==(3,6,6,2,0)
 oldfile=base/'original-request.json';assert sha(oldfile)==ORIGIN_REQUEST;old=read(oldfile)
 assert sha(base/'original-worker.py')==ORIGIN_WORKER
 complete=zip_members(base,manifest['completeEvidence'])
 stop=[b for n,b in complete.items()if n.endswith('/shared-provider-stop.json')];assert len(stop)==1 and json.loads(stop[0])=={'state':'CONFIRMED_PROVIDER_HTTP_FAILURE_STOP_REMAINING_CALLS','httpStatus':503}
 result={}
 for uid in IMPORTED+NEW:
  unit=next(u for u in request['units']if u['id']==uid);original=next(u for u in old['units']if u['id']==uid)
  for key in FIELDS:assert unit[key]==original[key],f'Current source/voice/spoken identity mismatch: {uid}/{key}'
  assert unit['locale']=='de'and unit['model']=='gemini-3.8-flash-tts'
  # Actual immutable ZIP member absence, not a boolean assertion in the proposal.
  assert not any(n.endswith('/'+uid+'/'+k+'-attempt.json')for n in complete for k in ['blind-review','asr'])
  if uid in NEW:
   assert not any(n.endswith('/'+uid+'/'+name)for n in complete for name in ['tts-attempt.json','tts-request.json','voice.wav','provider-audio.original.bin','tts-response.raw.json'])
   continue
  entry=next(x for x in manifest['originalAudio']if x['unitId']==uid);files=zip_members(base,entry)
  def member(name):
   matches=[b for n,b in files.items()if n==name or n.endswith('/'+uid+'/'+name)];assert len(matches)==1;return matches[0]
  state=json.loads(member('tts-attempt.json'));tts=json.loads(member('tts-request.json'));response=member('tts-response.raw.json');body=json.loads(response)
  assert(state['unitId'],state['requestSha256'],state['workerSha256'],str(state['githubRunId']))==(uid,ORIGIN_REQUEST,ORIGIN_WORKER,ORIGIN_RUN)
  assert state['state']=='GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW'and state['providerCalls']==1
  assert tts['model']==tts['body']['model']==unit['model']
  assert tts['body']['generation_config']['speech_config']==[{'voice':unit['voice']}]
  content=tts['body']['input'][0]['content'][0];assert content['text']==unit['spokenText']and content['annotations']==[{'type':'speech_metadata','style':unit['delivery']}]
  wav=member('voice.wav');provider=member('provider-audio.original.bin');pcm=exact_pcm(wav)
  assert wav==provider and sha_bytes(wav)==state['sha256']and sha_bytes(pcm)==state['audio']['pcmSha256']
  assert(body['model'],body['status'])==(unit['model'],'completed')
  blocks=[c for s in body.get('steps',[])if s.get('type')=='model_output'for c in s.get('content',[])if c.get('type')=='audio']
  assert len(blocks)==1 and base64.b64decode(blocks[0]['data'],validate=True)==wav
  result[uid]={'voice.wav':wav,'provider-audio.original.bin':provider,'tts-response.raw.json':response,'original-tts-attempt.json':member('tts-attempt.json'),'original-tts-request.json':member('tts-request.json'),'original-provider-audio-format.json':member('provider-audio-format.json'),'state':state,'sourceAudioArtifactId':str(entry['artifactId']),'sourceAudioArtifactDigest':entry['apiDigest'],'sourceCompleteArtifactId':str(manifest['completeEvidence']['artifactId'])}
 # The failed R04 remains charged and excluded; it is not an eligible new operation.
 r04=[json.loads(b)for n,b in complete.items()if n.endswith('/S2-02-de-R04-r1/tts-attempt.json')]
 assert len(r04)==1 and r04[0]['providerCalls']==1 and r04[0]['httpStatus']==503 and r04[0]['state']=='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY'
 return result

def reject_imported_tts(unit_id):
 assert unit_id not in IMPORTED,'Imported original is diagnostic-only: TTS is prohibited'

def current_pins(base,request,request_sha,worker_sha):
 base=Path(base)
 for n,p in [('request.json',request_sha),('worker.py',worker_sha)]:assert not(base/n).is_symlink()and sha(base/n)==p
 assert read(base/'request.json')==request

def import_original(base,out,request,unit_id,current_request_sha,current_worker_sha,current_run):
 assert unit_id in IMPORTED and str(current_run)!=ORIGIN_RUN
 current_pins(base,request,current_request_sha,current_worker_sha)
 data=verify_imports(base,request)[unit_id];folder=Path(out)/unit_id;assert not folder.exists();folder.mkdir(parents=True)
 for name,b in data.items():
  if isinstance(b,bytes):(folder/name).write_bytes(b)
 receipt={'operation':'IMPORT_EXISTING_ORIGINAL_ZERO_TTS','unitId':unit_id,'requestSha256':current_request_sha,'workerSha256':current_worker_sha,'githubRunId':str(current_run),'originalRunId':ORIGIN_RUN,'originalCommit':ORIGIN_COMMIT,'originalRequestSHA256':ORIGIN_REQUEST,'originalWorkerSHA256':ORIGIN_WORKER,'wavSHA256':sha(folder/'voice.wav'),'originalPCMSHA256':data['state']['audio']['pcmSha256'],'originalProviderCalls':1,'newProviderCalls':0,'priorBlindCalls':0,'priorASRCalls':0,'sourceAudioArtifactId':data['sourceAudioArtifactId'],'sourceAudioArtifactDigest':data['sourceAudioArtifactDigest'],'sourceCompleteArtifactId':data['sourceCompleteArtifactId'],'originalSourceOverwritten':False,'automaticAdoption':False}
 with(folder/'import-receipt.json').open('x',encoding='utf-8')as f:json.dump(receipt,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
 return receipt

def verified_imported_audio(base,out,request,unit_id,current_request_sha,current_worker_sha,current_run):
 current_pins(base,request,current_request_sha,current_worker_sha)
 assert unit_id in IMPORTED;data=verify_imports(base,request)[unit_id];folder=Path(out)/unit_id;r=read(folder/'import-receipt.json')
 assert(r['unitId'],r['requestSha256'],r['workerSha256'],r['githubRunId'])==(unit_id,current_request_sha,current_worker_sha,str(current_run))
 assert(r['newProviderCalls'],r['priorBlindCalls'],r['priorASRCalls'])==(0,0,0)
 for name,b in data.items():
  if isinstance(b,bytes):assert not(folder/name).is_symlink()and(folder/name).read_bytes()==b
 assert r['wavSHA256']==sha(folder/'voice.wav')and r['originalPCMSHA256']==sha_bytes(exact_pcm((folder/'voice.wav').read_bytes()))
 return folder/'voice.wav',data['state']

def stage_imported_diagnostics(base,out,target,request,unit_id,request_sha,worker_sha,run_id,commit):
 """Distinct reference schema; an imported original is never a new TTS attempt."""
 audio,state=verified_imported_audio(base,out,request,unit_id,request_sha,worker_sha,run_id)
 source=audio.parent;target=Path(target);assert not target.exists();target.mkdir(parents=True)
 bulky={'voice.wav','provider-audio.original.bin','tts-response.raw.json'}
 for p in source.rglob('*'):
  assert not p.is_symlink()
  if p.is_file()and p.name not in bulky:
   dest=target/p.relative_to(source);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
 assert not(source/'tts-attempt.json').exists(),'No invented fresh generation record for imports'
 imported=read(source/'import-receipt.json')
 reference={'schema':'imported-original-diagnostic-reference-v1','unitId':unit_id,'requestSha256':request_sha,'workerSha256':worker_sha,'githubRunId':str(run_id),'commit':commit,'originalRunId':ORIGIN_RUN,'originalCommit':ORIGIN_COMMIT,'originalRequestSHA256':ORIGIN_REQUEST,'originalWorkerSHA256':ORIGIN_WORKER,'oldAudioArtifactId':imported['sourceAudioArtifactId'],'oldAudioArtifactDigest':imported['sourceAudioArtifactDigest'],'oldCompleteArtifactId':imported['sourceCompleteArtifactId'],'originalFiles':{n:pin(source/n)for n in bulky},'importReceiptSHA256':sha(source/'import-receipt.json'),'newTTSCalls':0,'originalSourceOverwritten':False,'fullyReceivedOrQAAccepted':False}
 with(target/'imported-original-reference.json').open('x',encoding='utf-8')as f:json.dump(reference,f,indent=2);f.write('\n')
 return reference

def join_imported_diagnostics(base,request,artifact_dir,diagnostics,target,*,unit_id,request_sha,worker_sha,run_id,commit):
 """Join old immutable originals to current diagnostics only after both proofs.

    artifact_dir contains the received ZIP, its API-digest receipt and files/.
    All file receipt paths are relative to artifact_dir.parent (the current run).
 """
 base,artifact_dir,diagnostics,target=map(Path,[base,artifact_dir,diagnostics,target]);assert unit_id in IMPORTED and not target.exists()
 current_pins(base,request,request_sha,worker_sha)
 assert not artifact_dir.is_symlink()and not diagnostics.is_symlink()and diagnostics.resolve().is_relative_to((artifact_dir/'files').resolve())
 receipt=read(artifact_dir/'transfer-receipt.json');assert str(receipt['artifactId'])==artifact_dir.name
 assert(receipt['repository'],str(receipt['runId']),receipt['commit'])==('cabicci/viva-ai-systems-55d35820',str(run_id),commit)
 assert receipt['zipSHA256']==receipt['apiDigest'].removeprefix('sha256:')==sha(artifact_dir/'artifact.zip')
 for f in receipt['files']:
  p=artifact_dir.parent/f['path'];assert not p.is_symlink()and p.resolve().is_relative_to((artifact_dir/'files').resolve());assert pin(p)=={'sha256':f['sha256'],'bytes':f['bytes']}
 for p in diagnostics.rglob('*'):
  assert not p.is_symlink()
  if p.is_file():assert sum((artifact_dir.parent/f['path']).resolve()==p.resolve()for f in receipt['files'])==1
 ref=read(diagnostics/'imported-original-reference.json');assert ref['schema']=='imported-original-diagnostic-reference-v1'
 assert(ref['unitId'],ref['requestSha256'],ref['workerSha256'],ref['githubRunId'],ref['commit'])==(unit_id,request_sha,worker_sha,str(run_id),commit)
 assert(ref['originalRunId'],ref['originalCommit'],ref['originalRequestSHA256'],ref['originalWorkerSHA256'])==(ORIGIN_RUN,ORIGIN_COMMIT,ORIGIN_REQUEST,ORIGIN_WORKER)
 data=verify_imports(base,request)[unit_id]
 assert ref['oldAudioArtifactId']==data['sourceAudioArtifactId']and ref['oldAudioArtifactDigest']==data['sourceAudioArtifactDigest']and ref['oldCompleteArtifactId']==data['sourceCompleteArtifactId']
 assert ref['newTTSCalls']==0 and ref['originalSourceOverwritten']is False
 assert set(ref['originalFiles'])=={'voice.wav','provider-audio.original.bin','tts-response.raw.json'}
 for n,f in ref['originalFiles'].items():assert f=={'sha256':sha_bytes(data[n]),'bytes':len(data[n])}
 ir=read(diagnostics/'import-receipt.json');assert sha(diagnostics/'import-receipt.json')==ref['importReceiptSHA256']
 assert(ir['unitId'],ir['requestSha256'],ir['workerSha256'],ir['githubRunId'],ir['newProviderCalls'])==(unit_id,request_sha,worker_sha,str(run_id),0)
 assert ir['originalRunId']==ORIGIN_RUN and ir['wavSHA256']==ref['originalFiles']['voice.wav']['sha256']
 assert not(diagnostics/'tts-attempt.json').exists()
 for n in ['blind-review','asr']:
  p=diagnostics/(n+'-attempt.json')
  if p.exists():
   a=read(p);assert(a['unitId'],a['requestSha256'],a['workerSha256'],str(a['githubRunId']),a['audioSha256'])==(unit_id,request_sha,worker_sha,str(run_id),ir['wavSHA256'])
   assert a.get('providerCalls',0)<=1 and a.get('asrInvocations',0)<=1
 diagnostics_present={}
 for n in ['blind-review.json','asr-word-timestamps.json','reference-comparison.json']:
  p=diagnostics/n;diagnostics_present[n]=p.exists()
  if p.exists():assert read(p)['audioSha256']==ir['wavSHA256']
 if diagnostics_present['blind-review.json']:assert read(diagnostics/'blind-review-attempt.json').get('providerCalls')==1
 if diagnostics_present['asr-word-timestamps.json']:assert read(diagnostics/'asr-attempt.json').get('asrInvocations')==1
 target.mkdir(parents=True)
 for p in diagnostics.rglob('*'):
  if p.is_file():dest=target/p.relative_to(diagnostics);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
 for n in ref['originalFiles']:(target/n).write_bytes(data[n])
 result={'schema':'imported-original-current-diagnostics-join-v1','unitId':unit_id,'currentRequestSHA256':request_sha,'currentWorkerSHA256':worker_sha,'currentRunId':str(run_id),'currentCommit':commit,'originalRunId':ORIGIN_RUN,'oldAudioArtifactId':ref['oldAudioArtifactId'],'oldAudioArtifactDigest':ref['oldAudioArtifactDigest'],'wavSHA256':ir['wavSHA256'],'allRequiredOriginalsPresent':True,'allThreeDiagnosticFilesPresent':all(diagnostics_present.values()),'diagnostics':diagnostics_present,'newTTSCalls':0,'originalPCMChanged':False,'semanticOrAcousticQAAccepted':False}
 with(target/'imported-join-verification.json').open('x',encoding='utf-8')as f:json.dump(result,f,indent=2);f.write('\n')
 return result
