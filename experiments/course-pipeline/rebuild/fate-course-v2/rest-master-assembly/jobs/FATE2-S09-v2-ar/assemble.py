from pathlib import Path
import json,hashlib,subprocess,os,sys,wave,array,math,datetime,shutil
from selection_contract import artifact_ref,review_gate,scene_bindings,step_id,LOCALES
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));locale=sys.argv[1];step=step_id(M['step']);C=M['locales'][locale];O=R/'output';O.mkdir();sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert locale in LOCALES and M['newProviderCalls']==0 and len(C)==M['sceneCount'] and len(C) in [5,6]
assert sha(R/'assemble.py')==M['implementationSHA256'] and sha(R/'selection_contract.py')==M['selectionContractSHA256']
assert sha(R/'method-approval.en.json')==M['methodApprovalCopySHA256']
approval=json.loads((R/'method-approval.en.json').read_text());assert approval['ownerAnswer']=='اعتمد العربي والإنجليزي وكمّل'
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
cache={}
def get(ref):
 artifact_ref(ref);key=(ref['run'],ref['artifact'])
 if key not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True)
  checkpoint={'stage':'download_actual_source','run':ref['run'],'artifact':ref['artifact'],'utc':datetime.datetime.now(datetime.timezone.utc).isoformat()};save('assembly-attempt.en.json',checkpoint);print(json.dumps(checkpoint),flush=True)
  subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True,timeout=120);cache[key]=d
 f=(cache[key]/ref['file']).resolve();assert f.is_relative_to(cache[key].resolve()) and sha(f)==ref['sha256'];return f
FFMPEG=os.environ['MASAARAT_FFMPEG_ABSOLUTE'];FFPROBE=os.environ['MASAARAT_FFPROBE_ABSOLUTE']
bootstrap=json.loads((R/'media-bootstrap-receipt.en.json').read_text(encoding='utf8'))
assert bootstrap['state']=='EXACT_COMPANION_VERIFIED_JOB_PATH_READY' and bootstrap['version']=='4.0.466' and bootstrap['aptCalls']==0
for executable,name in [(FFMPEG,'ffmpeg'),(FFPROBE,'ffprobe')]:
 assert Path(executable).resolve()==(Path(bootstrap['installedDirectory'])/name).resolve() and sha(executable)==bootstrap['files'][name]
shutil.copyfile(R/'media-bootstrap-receipt.en.json',O/'media-bootstrap-receipt.en.json')
def media_run(args,label,timeout=180):
 result=subprocess.run(args,capture_output=True,timeout=timeout)
 (O/(label+'.stdout.txt')).write_bytes(result.stdout);(O/(label+'.stderr.txt')).write_bytes(result.stderr)
 if result.returncode or result.stderr.strip():raise RuntimeError(label+' failed: nonzero exit or error stderr; exact logs preserved; no re-encode/retry')
 return result.stdout.decode('utf8')
def probe(f):
 # Decode/count every available stream through EOF; no null output encoder.
 return json.loads(media_run([FFPROBE,'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(f)],'probe-'+sha(f)[:16]))
def presentation_timestamps(f,expected_frames):
 data=json.loads(media_run([FFPROBE,'-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',str(f)],'actual-master-frame-timestamps'))
 pts=[float(x['best_effort_timestamp_time']) for x in data['frames']]
 if len(pts)!=expected_frames or any(not math.isfinite(x) for x in pts) or any(pts[i]<=pts[i-1] for i in range(1,len(pts))):raise ValueError('Every actual frame needs a finite strictly increasing presentation timestamp')
 return pts
def extract_checkpoint(movie,frame,pts,target,label):
 if type(frame)!=int or not 0<=frame<len(pts):raise ValueError('Requested frame lies outside actual encoded timestamps')
 seek=0.0 if frame==0 else (pts[frame-1]+pts[frame])/2
 args=[FFMPEG,'-nostdin','-v','error']
 if frame:args+=['-accurate_seek','-seek_timestamp','1','-ss',format(seek,'.9f')]
 args+=['-i',str(movie),'-map','0:v:0','-an','-frames:v','1','-c:v','png','-f','image2',str(target)]
 media_run(args,label)
 if not target.is_file() or target.read_bytes()[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Actual encoded checkpoint missing or invalid PNG')
 return {'actualPresentationTimestampSeconds':pts[frame],'accurateSeekThresholdSeconds':seek,'method':'First decoded presentation frame after actual previous/current PTS midpoint; frame0 decoded directly; no select filter or movie re-encoding'}
def quiet(pcm):
 samples=array.array('h',pcm)
 if sys.byteorder!='little':samples.byteswap()
 bins=[math.sqrt(sum(x*x for x in samples[i:i+240])/len(samples[i:i+240])) for i in range(0,len(samples),240)]
 return {'thresholdRMS':180,'windowSeconds':.01,'leadingQuietSeconds':next((i for i,x in enumerate(bins) if x>=180),len(bins))*.01,'trailingQuietSeconds':next((i for i,x in enumerate(reversed(bins)) if x>=180),len(bins))*.01,'limit':'Measured thresholded quiet, not native acoustic or phoneme-boundary certification.'}
pcm_parts=[];visuals=[];timeline=[];captions=[];frameOffset=0;audioOffset=0;signatures=[];evidence=[]
for i,part in enumerate(C):
 print(json.dumps({'stage':'verify_scene','sceneIndex':i+1,'step':step,'locale':locale}),flush=True)
 assert part['sceneIndex']==i+1 and part['voice']==('Charon' if i%2==0 else 'Kore')
 proof=next(p for p in approval['files'] if p['id']==('AR' if locale=='ar-EG' else 'EN')+'-'+part['voice']);assert proof['deliverySHA256']==part['deliverySHA256']
 vis=get(part['visual']);rend=get(part['render']);tim=get(part['timing']);audio=get(part['audio']);encoded=get(part['selectedVideo']);gateFile=get(part['audioGate']);r=json.loads(rend.read_text());t=json.loads(tim.read_text());gate=json.loads(gateFile.read_text())
 scene_bindings(part,t,r);review_gate(gate,part)
 verification=json.loads((audio.parent/'verification.json').read_text());assert verification['model']==verification['returnedModelVersion']=='gemini-3.8-flash-tts' and verification['voice']==part['voice'] and verification['textSHA256']==part['textSHA256'] and verification['deliverySHA256']==part['deliverySHA256']
 with wave.open(str(audio),'rb') as w:
  assert (w.getframerate(),w.getnchannels(),w.getsampwidth())==(24000,1,2);n=w.getnframes();pcm=w.readframes(n)
 pcm_sha=hashlib.sha256(pcm).hexdigest();review_gate(gate,part,pcm_sha)
 assert verification['wavSHA256']==sha(audio) and verification['pcmSHA256']==pcm_sha and n==r['sourceAudioFrames']==t['audioFrames'];frames=r['frames'];padding=frames*800-n;assert 0<=padding<800
 p=probe(vis);v=next(x for x in p['streams'] if x['codec_type']=='video');assert len(p['streams'])==1 and v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='30/1' and int(v['nb_read_frames'])==frames
 signatures.append({k:v.get(k) for k in ['codec_name','profile','level','pix_fmt','width','height','r_frame_rate','time_base']});assert signatures[-1]==signatures[0]
 item={'sceneIndex':i+1,'id':t['id'],'sectionID':part['sectionID'],'title':part['title'],'voice':part['voice'],'startFrame':frameOffset,'videoFrames':frames,'startSeconds':frameOffset/30,'endSeconds':(frameOffset+frames)/30,'sourceAudioFrames':n,'sourceAudioSHA256':sha(audio),'sourcePCM_SHA256':pcm_sha,'paddedZeroFrames':padding,'sourcePCMStartFrame':audioOffset,'visualSHA256':sha(vis),'selectedSceneVideoSHA256':sha(encoded),'timingSHA256':sha(tim),'audioGateSHA256':sha(gateFile),'quiet':quiet(pcm)}
 assert audioOffset==frameOffset*800
 timeline.append(item);pcm_parts.append(pcm+b'\0\0'*padding);visuals.append(vis);evidence.append({'sceneIndex':i+1,'audioGate':part['audioGate'],'selectedSceneVideo':part['selectedVideo'],'textSHA256':part['textSHA256'],'deliverySHA256':part['deliverySHA256']})
 for cue in t['captions']:captions.append({'sceneIndex':i+1,'text':cue['text'],'start':frameOffset/30+cue['start'],'end':frameOffset/30+cue['end']})
 frameOffset+=frames;audioOffset+=n+padding
assert all(captions[i]['start']>=captions[i-1]['end']-.05 for i in range(1,len(captions)))
wav=O/(step+'-'+locale+'-original-speech-assembled.wav')
with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b''.join(pcm_parts))
with wave.open(str(wav),'rb') as w:
 assert w.getnframes()==frameOffset*800
 for item,part in zip(timeline,C):
  source=get(part['audio'])
  with wave.open(str(source),'rb') as s:original=s.readframes(s.getnframes())
  w.setpos(item['sourcePCMStartFrame']);assert w.readframes(item['sourceAudioFrames'])==original;assert w.readframes(item['paddedZeroFrames'])==b'\0\0'*item['paddedZeroFrames']
save('timeline.en.json',{'step':step,'locale':locale,'fps':30,'sampleRate':24000,'frames':frameOffset,'durationSeconds':frameOffset/30,'parts':timeline,'sourceReuse':'Every selected qualified original PCM interval byte-verified at exact assembled position. Only sub-frame zero tail padding; no speech crop, fade, time stretch or regeneration.','wavSHA256':sha(wav)})
save('captions.en.json',captions);save('selected-evidence.en.json',evidence)
def stamp(s):
 ms=round(s*1000);return f'{ms//3600000:02}:{(ms//60000)%60:02}:{(ms//1000)%60:02}.{ms%1000:03}'
(O/(step+'-'+locale+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{stamp(x["start"])} --> {stamp(x["end"])}\n{x["text"]}' for i,x in enumerate(captions))+'\n',encoding='utf8')
lst=R/'concat.txt';lst.write_text('\n'.join("file '"+str(p)+"'" for p in visuals)+'\n')
print(json.dumps({'stage':'concat_verified_visuals','step':step,'locale':locale}),flush=True)
silent=R/'visual-master.mp4';media_run([FFMPEG,'-nostdin','-v','error','-f','concat','-safe','0','-i',str(lst),'-map','0:v:0','-c:v','copy',str(silent)],'concat-source-visuals',timeout=120)
out=O/(step+'-'+locale+'.mp4');media_run([FFMPEG,'-nostdin','-v','error','-i',str(silent),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)],'mux-original-assembled-speech',timeout=120)
print(json.dumps({'stage':'decode_actual_master','step':step,'locale':locale}),flush=True)
p=probe(out);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
assert int(v['nb_read_frames'])==frameOffset and v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='30/1' and int(a['sample_rate'])==24000 and a['channels']==1 and int(a['nb_read_frames'])>0 and len(p['streams'])==2
assert abs(float(p['format']['duration'])-frameOffset/30)<.1 and abs(float(a['start_time']))<.001 and abs(float(v['start_time']))<.001;save('probe.en.json',p)
checkpoints=[]
for item,part in zip(timeline,C):
 t=json.loads(get(part['timing']).read_text());actions=t['actions'];acts=list(actions.values()) if isinstance(actions,dict) else actions;f=item['startFrame']+min(item['videoFrames']-1,round((max(x['start'] for x in acts)+.8)*30));checkpoints.append((f,f'scene-{item["sceneIndex"]:02}-final.png'))
 if item['sceneIndex']>1:checkpoints.extend([(item['startFrame']-1,f'join-{item["sceneIndex"]:02}-before.png'),(item['startFrame']+min(3,item['videoFrames']-1),f'join-{item["sceneIndex"]:02}-after.png')])
ordered=sorted({f for f,n in checkpoints});pts=presentation_timestamps(out,frameOffset);extracted={}
print(json.dumps({'stage':'extract_actual_join_and_scene_checkpoints','step':step,'locale':locale}),flush=True)
for index,f in enumerate(ordered):extracted[f]=extract_checkpoint(out,f,pts,O/f'decoded-{index:04}.png',f'extract-actual-master-frame-{f:06}')
for index,f in enumerate(ordered):
 source=O/f'decoded-{index:04}.png';assert source.is_file()
 names=[n for frame,n in checkpoints if frame==f]
 for n in names:shutil.copyfile(source,O/n)
save('decoded-verification.en.json',{'status':'clear','method':'All-stream ffprobe -count_frames through EOF; strict zero error stderr; no output encoder','videoFramesDecoded':int(v['nb_read_frames']),'audioFramesDecoded':int(a['nb_read_frames']),'videoSHA256':sha(out),'humanPlaybackVerified':False})
save('encoded-frame-checkpoints.en.json',[{'frame':f,'file':n,'sha256':sha(O/n),**extracted[f]} for f,n in checkpoints])
save('assembly.en.json',{'status':'ENCODED_AND_ORIGINAL_PCM_REUSE_VERIFIED','step':step,'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'locale':locale,'videoSHA256':sha(out),'originalSpeechWAV_SHA256':sha(wav),'frames':frameOffset,'durationSeconds':frameOffset/30,'sceneCount':len(C),'sourceAudioSeconds':sum(x['sourceAudioFrames'] for x in timeline)/24000,'zeroTailPaddingSeconds':sum(x['paddedZeroFrames'] for x in timeline)/24000,'newProviderCalls':0,'allSourceAudioGatesClear':True,'selectedEvidenceSHA256':sha(O/'selected-evidence.en.json'),'ownerSpeechMethodPreviouslyAccepted':True,'humanFullMasterPlaybackVerified':False,'limits':['Actual encoded checkpoints provided; renderer success is not full visual/scientific/native acceptance.','Every source recording has an exact clear actual-audio machine gate; this is not native/human listening.','AAC delivery audio is lossy; accompanying WAV byte-preserves every original speech interval.','Captions are burned in. Separate VTT must not be enabled as an unintended duplicate layer.'],'finishedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()})
print(json.dumps({'step':step,'locale':locale,'frames':frameOffset,'seconds':frameOffset/30,'videoSHA256':sha(out)}))
