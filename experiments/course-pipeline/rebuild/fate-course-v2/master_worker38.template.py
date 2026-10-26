from pathlib import Path
import json,hashlib,subprocess,os,sys,wave,array,math,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());locale=sys.argv[1];C=M['locales'][locale];O=R/'output';O.mkdir();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert M['newProviderCalls']==0 and len(C)==6
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
cache={}
def get(ref):
 key=(ref['run'],ref['artifact'])
 if key not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);cache[key]=d
 f=cache[key]/ref['file'];assert sha(f)==ref['sha256'];return f
def probe(f):return json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(f)]))
def quiet(pcm):
 samples=array.array('h',pcm)
 if sys.byteorder!='little':samples.byteswap()
 bins=[math.sqrt(sum(x*x for x in samples[i:i+240])/len(samples[i:i+240])) for i in range(0,len(samples),240)]
 leading=next((i for i,x in enumerate(bins) if x>=180),len(bins))*.01
 trailing=next((i for i,x in enumerate(reversed(bins)) if x>=180),len(bins))*.01
 return {'thresholdRMS':180,'windowSeconds':.01,'leadingQuietSeconds':leading,'trailingQuietSeconds':trailing,'limit':'Thresholded quiet, not a native acoustic or syllable-boundary judgment.'}
pcm_parts=[];visuals=[];timeline=[];captions=[];frameOffset=0;audioOffset=0;signatures=[]
for i,part in enumerate(C):
 assert part['sceneIndex']==i+1
 vis=get(part['visual']);rend=get(part['render']);tim=get(part['timing']);audio=get(part['audio']);r=json.loads(rend.read_text());t=json.loads(tim.read_text())
 assert r['sourceAudioSHA256']==part['audio']['sha256']==t['audio']['sha256'] and r['frames']==t['frames']
 with wave.open(str(audio),'rb') as w:
  assert (w.getframerate(),w.getnchannels(),w.getsampwidth())==(24000,1,2);n=w.getnframes();pcm=w.readframes(n)
 assert n==r['sourceAudioFrames']==t['audioFrames'];frames=r['frames'];padding=frames*800-n;assert 0<=padding<800
 p=probe(vis);v=next(x for x in p['streams'] if x['codec_type']=='video');assert len(p['streams'])==1 and v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='30/1' and int(v['nb_read_frames'])==frames
 signatures.append({k:v.get(k) for k in ['codec_name','profile','level','pix_fmt','width','height','r_frame_rate','time_base']})
 assert signatures[-1]==signatures[0]
 item={'sceneIndex':i+1,'id':t['id'],'title':part['title'],'voice':part['voice'],'startFrame':frameOffset,'videoFrames':frames,'startSeconds':frameOffset/30,'endSeconds':(frameOffset+frames)/30,'sourceAudioFrames':n,'sourceAudioSHA256':sha(audio),'sourcePCM_SHA256':hashlib.sha256(pcm).hexdigest(),'paddedZeroFrames':padding,'sourcePCMStartFrame':audioOffset,'visualSHA256':sha(vis),'timingSHA256':sha(tim),'quiet':quiet(pcm)}
 assert audioOffset==frameOffset*800
 timeline.append(item);pcm_parts.append(pcm+b'\0\0'*padding);visuals.append(vis)
 for cue in t['captions']:
  assert 0<=cue['start']<cue['end']<=n/24000+.05
  captions.append({'sceneIndex':i+1,'text':cue['text'],'start':frameOffset/30+cue['start'],'end':frameOffset/30+cue['end']})
 frameOffset+=frames;audioOffset+=n+padding
assert all(captions[i]['start']>=captions[i-1]['end']-.05 for i in range(1,len(captions)))
wav=O/('FATE2-S01-'+locale+'-original-speech-assembled.wav')
with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b''.join(pcm_parts))
with wave.open(str(wav),'rb') as w:
 assert w.getnframes()==frameOffset*800
 for item,part in zip(timeline,C):
  source=get(part['audio'])
  with wave.open(str(source),'rb') as s:original=s.readframes(s.getnframes())
  w.setpos(item['sourcePCMStartFrame']);assert w.readframes(item['sourceAudioFrames'])==original
  assert w.readframes(item['paddedZeroFrames'])==b'\0\0'*item['paddedZeroFrames']
save('timeline.en.json',{'locale':locale,'fps':30,'sampleRate':24000,'frames':frameOffset,'durationSeconds':frameOffset/30,'parts':timeline,'sourceReuse':'Every original PCM interval byte-verified at the exact assembled position. Only sub-frame zero tail padding, no speech crop, fade, time stretch or regeneration.','wavSHA256':sha(wav)})
save('captions.en.json',captions)
def stamp(s):
 ms=round(s*1000);return f'{ms//3600000:02}:{(ms//60000)%60:02}:{(ms//1000)%60:02}.{ms%1000:03}'
(O/('FATE2-S01-'+locale+'.vtt')).write_text('WEBVTT\n\n'+'\n\n'.join(f'{i+1}\n{stamp(x["start"])} --> {stamp(x["end"])}\n{x["text"]}' for i,x in enumerate(captions))+'\n',encoding='utf8')
lst=R/'concat.txt';lst.write_text('\n'.join("file '"+str(p)+"'" for p in visuals)+'\n')
silent=R/'visual-master.mp4';subprocess.run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(lst),'-map','0:v:0','-c:v','copy',str(silent)],check=True)
out=O/('FATE2-S01-'+locale+'.mp4')
subprocess.run(['ffmpeg','-v','error','-i',str(silent),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
p=probe(out);v=next(x for x in p['streams'] if x['codec_type']=='video');a=next(x for x in p['streams'] if x['codec_type']=='audio')
assert int(v['nb_read_frames'])==frameOffset and v['width']==1920 and v['height']==1080 and v['r_frame_rate']=='30/1' and int(a['sample_rate'])==24000 and a['channels']==1
assert abs(float(p['format']['duration'])-frameOffset/30)<.1 and abs(float(a['start_time']))<.001 and abs(float(v['start_time']))<.001
save('probe.en.json',p)
frames_to_check=[]
for item,part in zip(timeline,C):
 t=json.loads(get(part['timing']).read_text());actions=t['actions'];acts=list(actions.values()) if isinstance(actions,dict) else actions
 starts=[x['start'] for x in acts]
 f=item['startFrame']+min(item['videoFrames']-1,round((starts[-1]+.8)*30));frames_to_check.append((f,f'scene-{item["sceneIndex"]:02}-final.png'))
 if item['sceneIndex']>1:
  frames_to_check.extend([(item['startFrame']-1,f'join-{item["sceneIndex"]:02}-before.png'),(item['startFrame']+3,f'join-{item["sceneIndex"]:02}-after.png')])
for f,n in frames_to_check:subprocess.run(['ffmpeg','-v','error','-i',str(out),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(O/n)],check=True)
save('encoded-frame-checkpoints.en.json',[{'frame':f,'file':n,'sha256':sha(O/n)} for f,n in frames_to_check])
save('assembly.en.json',{'status':'ENCODED_AND_ORIGINAL_PCM_REUSE_VERIFIED','runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'locale':locale,'videoSHA256':sha(out),'originalSpeechWAV_SHA256':sha(wav),'frames':frameOffset,'durationSeconds':frameOffset/30,'sceneCount':6,'sourceAudioSeconds':sum(x['sourceAudioFrames'] for x in timeline)/24000,'zeroTailPaddingSeconds':sum(x['paddedZeroFrames'] for x in timeline)/24000,'newProviderCalls':0,'ownerAcceptedStyleAndFirstScene':True,'humanFullMasterPlaybackVerified':False,'limits':['Actual encoded frames provided for visual review.','Existing actual-audio machine reviews retained. Full-master native listening and full native playback are not certified.','AAC delivery audio is lossy; the accompanying assembled WAV retains every original speech PCM interval exactly.','Burned captions are present; optional VTT is supplied separately and must not be simultaneously enabled as duplicate CC.'],'finishedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()})
print(json.dumps({'locale':locale,'frames':frameOffset,'seconds':frameOffset/30,'videoSHA256':sha(out)}))
