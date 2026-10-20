from pathlib import Path
import os,json,hashlib,subprocess,io,wave,datetime,array,math
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));O=R/'assembled';O.mkdir(exist_ok=True);I=R/'received';I.mkdir(exist_ok=True);repo=os.environ['GITHUB_REPOSITORY'];run=os.environ['GITHUB_RUN_ID']
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
def receive(r,a,d):
 d.mkdir(parents=True,exist_ok=True);subprocess.run(['gh','run','download',str(r),'--repo',repo,'--name',a,'--dir',str(d)],check=True)
def readpcm(p):
 with wave.open(str(p),'rb') as w:
  assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000)
  return w.readframes(w.getnframes())
def writewav(name,raw):
 with wave.open(str(O/name),'wb') as w:w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(raw)
 return {'file':name,'sha256':sha((O/name).read_bytes()),'pcmSHA256':sha(raw),'durationSeconds':len(raw)/48000,'frames':len(raw)//2}
parts={};records={}
for c in M['reuse']:
 d=I/c['id'];receive(c['run'],c['artifact'],d);paths=list(d.rglob(c['file']));assert len(paths)==1 and sha(paths[0].read_bytes())==c['sha256'];parts[c['id']]=readpcm(paths[0]);records[c['id']]={'id':c['id'],'sourceRun':c['run'],'wavSHA256':c['sha256'],'ownerAccepted':bool(c.get('ownerAccepted',False)),'reusedUnchanged':True}
for c in M['segments']+M['retained']:
 sid=c['id'];d=I/sid;receive(run,'fate-l01-connected-v7-'+sid,d);v=json.loads((d/'verification.json').read_text(encoding='utf-8'));p=d/(sid+'.wav');assert sha(p.read_bytes())==v['wavSHA256'];parts[sid]=readpcm(p);records[sid]={'id':sid,'sourceRun':run,'wavSHA256':v['wavSHA256'],'ownerAccepted':False,'reusedUnchanged':v.get('reusedUnchanged',False),'voice':c['voice']}
def edge_silence(raw,tail=False):
 a=array.array('h',raw);size=240;frames=0
 chunks=[a[i:i+size] for i in range(0,len(a),size)]
 if tail:chunks.reverse()
 for ch in chunks:
  if math.sqrt(sum(x*x for x in ch)/len(ch))>120:break
  frames+=len(ch)
 return frames
def join_gap(left,right,target):
 l=edge_silence(left,True);r=edge_silence(right);added=max(0,round(target*24000)-l-r)
 return added,{'leftTrailingLowEnergyFrames':l,'rightLeadingLowEnergyFrames':r,'addedSilenceFrames':added,'combinedLowEnergySeconds':(l+r+added)/24000}
sceneReports=[];allraw=b'';timeline=[];joins=[];boundaries=[]
for si,s in enumerate(M['scenes']):
 raw=b'';unitRecords=[];sceneStart=len(allraw)//2
 for pi,pid in enumerate(s['parts']):
  before=len(raw)//2;raw+=parts[pid];after=len(raw)//2
  assert raw[before*2:after*2]==parts[pid]
  unitRecords.append(dict(records[pid],sceneStartFrame=before,sceneEndFrame=after,globalStartFrame=sceneStart+before,globalEndFrame=sceneStart+after,pcmSHA256=sha(parts[pid]),durationSeconds=len(parts[pid])/48000))
  if pi<len(s['parts'])-1:
   nextid=s['parts'][pi+1];gap,metrics=join_gap(parts[pid],parts[nextid],.22);jstart=len(raw)//2;raw+=b'\0\0'*gap
   clip=parts[pid][-24000*2*4:]+b'\0\0'*gap+parts[nextid][:24000*2*4];clipname='join-'+str(len(joins))+'.wav';writewav(clipname,clip)
   joins.append(dict(metrics,left=pid,right=nextid,scene=s['id'],sceneBoundaryFrame=jstart,reviewClip=clipname))
 rec=writewav(s['id']+'.wav',raw);rec.update(id=s['id'],title=s['title'],voice=s['voice'],startSeconds=sceneStart/24000,endSeconds=(sceneStart+len(raw)//2)/24000,parts=unitRecords);sceneReports.append(rec);allraw+=raw;timeline.extend(unitRecords)
 if si<len(M['scenes'])-1:
  nextpart=M['scenes'][si+1]['parts'][0];gap,metrics=join_gap(raw,parts[nextpart],.32);boundaries.append(dict(metrics,left=s['id'],right=M['scenes'][si+1]['id']));allraw+=b'\0\0'*gap
full=writewav('L01-ar-connected-v7.wav',allraw)
for p in timeline:assert allraw[p['globalStartFrame']*2:p['globalEndFrame']*2]==parts[p['id']]
rep={'status':'FULL_ARABIC_AUDIO_CANDIDATE_PENDING_TRIAGE_AND_OWNER_LISTENING','runID':run,'commit':os.environ['GITHUB_SHA'],'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'output':full,'scenes':sceneReports,'internalJoins':joins,'sceneBoundaries':boundaries,'allSourcePCMPreservedExactly':True,'acceptedPCMUnchanged':True,'sampleRate':24000,'channels':1,'newSpeechCalls':M['maxSpeechCalls'],'retainedSceneCount':len(M['retained']),'humanListeningApproved':False,'renderAllowed':False,'fullVideoChanged':False,'wordTiming':'No word timestamps estimated. Only exact PCM-derived part and scene boundaries.','processing':'PCM concatenation and explicit sentence/scene silence only; no resampling, normalization, crossfade or rate change.'}
(O/'verification.json').write_text(json.dumps(rep,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Compact navigation companion; segment timing is measured, not inferred from text.
(O/'chapters.json').write_text(json.dumps([{'id':s['id'],'title':s['title'],'start':s['startSeconds'],'end':s['endSeconds']} for s in sceneReports],ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'durationSeconds':full['durationSeconds'],'sha256':full['sha256'],'acceptedPCMUnchanged':True}))
