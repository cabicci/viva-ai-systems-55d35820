from pathlib import Path
import os, sys, json, hashlib, subprocess, wave, array, math, io, base64, urllib.request, urllib.error, datetime
R=Path(__file__).parent; M=json.loads((R/'request.json').read_text()); Q=R/'final'; Q.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
save=lambda n,x:(Q/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']
assert M['newSpeechCalls']==0 and M['maxJoinReviewCalls']==0
def get(ref,folder):
    folder.mkdir(parents=True,exist_ok=True)
    subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(folder)],check=True,capture_output=True)
    f=folder/ref['file'];assert sha(f)==ref['sha256'];return f
def load(p):
    with wave.open(str(p),'rb') as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE')
        return w.readframes(w.getnframes())
def wav(p,pcm):
    with wave.open(str(p),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
parts=[];frames=0;videoend=0;captions=[];words=[];actions=[];visuals=[];timeline=[]
for c in M['scenes']:
    d=R/'downloads'/c['id']; visual=get(c['render'],d/'render'); meta=json.loads((visual.parent/'render.json').read_text())
    assert meta['audioSHA256']==c['audio']['sha256'] and meta['silentVisualSHA256']==sha(visual)
    assert meta['globalStartVideoFrame']==videoend and meta['globalStartVideoFrame']==round(frames/24000*30)
    av=json.loads((visual.parent/'soundtrack-verification.json').read_text());assert av['passed'] and av['sourceSHA256']==c['audio']['sha256']
    a=get(c['audio'],d/'audio');pcm=load(a);count=len(pcm)//2;assert count==c['audioFrames'];videoend=meta['globalEndVideoFrame'];assert videoend==round((frames+count)/24000*30)
    inputs=json.loads((visual.parent/'timing-and-inputs.json').read_text());assert inputs['audioSHA256']==sha(a)
    for source,dest in [('captions',captions),('wordTimings',words),('actions',actions)]:
        for x in inputs[source]:dest.append(dict(x,start=x['start']+frames/24000,end=x['end']+frames/24000,scene=c['id']))
    timeline.append(dict(c,globalStartFrame=frames,globalEndFrame=frames+count,startSeconds=frames/24000,endSeconds=(frames+count)/24000,videoFrames=meta['frames']))
    (Q/'final-frames').mkdir(exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-ss',str(max(0,meta['frames']/30-.25)),'-i',str(visual),'-frames:v','1',str(Q/'final-frames'/(c['id']+'.png'))],check=True)
    parts.append((c,a,pcm));visuals.append(visual);frames+=count
master=Q/(M['id']+'.wav');wav(master,b''.join(p[2] for p in parts));reuse=[]
for (c,a,pcm),t in zip(parts,timeline):
    result=json.loads(subprocess.check_output([sys.executable,str(R/'verify_reuse.py'),'--assembled',str(master),'--source',str(a),'--start-frame',str(t['globalStartFrame'])],text=True));assert result['identicalPCM'];reuse.append(dict(id=c['id'],**result))
save('pcm-reuse.json',reuse);save('timeline.json',{'scenes':timeline,'words':words,'actions':actions,'sourceMethod':'Actual recording-derived approximate acoustic timings; no text-length timing.','audioFrames':frames})
def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d}.{ms%1000:03d}'
(Q/(M['id']+'.vtt')).write_text('WEBVTT\n\n'+''.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n\n' for i,c in enumerate(captions)),encoding='utf-8')
def edge_silence(pcm,reverse=False):
    samples=array.array('h',pcm);windows=[samples[i:i+240] for i in range(0,len(samples),240)]
    if reverse:windows.reverse()
    count=0
    for w in windows:
        if not w:continue
        rms=math.sqrt(sum(v*v for v in w)/len(w))/32768
        if rms>10**(-45/20):break
        count+=len(w)
    return count/24000
joins=[];reel=b''
for i in range(1,len(parts)):
    left=parts[i-1][2];right=parts[i][2];tail=edge_silence(left,True);lead=edge_silence(right)
    clip=left[-3*24000*2:]+right[:3*24000*2];start=len(reel)/48000;reel+=clip
    joins.append({'id':i,'left':parts[i-1][0]['id'],'right':parts[i][0]['id'],'reelStart':start,'boundary':start+min(3,len(left)/48000),'reelEnd':len(reel)/48000,'trailingLowEnergySeconds':tail,'leadingLowEnergySeconds':lead,'combinedLowEnergySeconds':tail+lead,'insertedMasterSilenceSeconds':0})
    reel+=b'\0\0'*12000
alljoins=joins[:];prior=None
if M.get('resolvePrior'):
    ref=M['resolvePrior'];old=get(ref,R/'prior');prior=json.loads(old.read_text());assert prior['status']!='clear'
    assert sha(master)==ref['masterWavSHA256'],'Adjudication requires exactly the prior master'
    flagged={x['id'] for x in prior['joins'] if x['status']!='clear'};assert flagged==set(ref['joins'])
    save('prior-join-review.json',prior);reel=b'';joins=[]
    for j in alljoins:
        if j['id'] not in flagged:continue
        i=j['id'];left=parts[i-1][2];right=parts[i][2];start=len(reel)/48000
        reel+=left+right;joins.append(dict(j,reelStart=start,boundary=start+len(left)/48000,reelEnd=len(reel)/48000));reel+=b'\0\0'*12000
wav(Q/'join-review-reel.wav',reel);save('joins.json',alljoins);save('review-positions.json',joins)
ref=M['reuseJoinReview'];returned=get(ref,R/'verified-review');raw=json.loads(returned.read_text());assert sha(master)==ref['masterWavSHA256'];assert sha(Q/'join-review-reel.wav')==ref['reelSHA256']==sha(returned.parent/'join-review-reel.wav');assert sha(returned.parent/'join-review-request.json')==ref['requestSHA256']
request=json.loads((returned.parent/'join-review-request.json').read_text());assert request['model']=='gemini-2.5-pro' and request['audioSHA256']==ref['reelSHA256']
flagged={j['id'] for j in joins};returnedIds=[j['id'] for j in raw['joins']];assert len(set(returnedIds))==len(returnedIds);assert flagged.issubset(returnedIds) and set(returnedIds).issubset(j['id'] for j in prior['joins'])
review={'status':raw['status'],'joins':[j for j in raw['joins'] if j['id'] in flagged],'notes':'Only requested join 5 accepted from preserved full-context response; unsolicited extra IDs excluded and earlier clear reviews retained.'};save('join-review.json',review);save('preserved-full-context-response.json',raw);save('review-reuse.json',{'newProviderCalls':0,'ref':ref,'masterUnchanged':True,'reelUnchanged':True})
assert review['status']=='clear' and all(j['status']=='clear' for j in review['joins']),'Join listening review requires targeted resolution; unchanged master and sources preserved.'
if prior:
    corrected={j['id']:j for j in review['joins']};save('effective-join-review.json',{'status':'clear','joins':[corrected.get(j['id'],j) for j in prior['joins']],'method':'One bounded full-context adjudication of concrete flagged joins, exact unchanged master and prior clear results preserved.'})
(R/'concat.txt').write_text(''.join("file '"+str(p.resolve())+"'\n" for p in visuals))
video=Q/(M['id']+'.mp4');subprocess.run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(R/'concat.txt'),'-i',str(master),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(video)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-count_frames','-of','json',str(video)]));v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio');assert int(v['nb_read_frames'])==videoend==round(frames/24000*30);assert abs(float(a['duration'])-frames/24000)<.1;save('probe.json',probe)
decoded=Q/'decoded-soundtrack.wav';subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vn','-ac','1','-ar','24000','-c:a','pcm_s16le',str(decoded)],check=True)
a=array.array('h',load(master));b=array.array('h',load(decoded));indices=list(range(24000,min(len(a),len(b))-24000,480));x=[a[i] for i in indices];xx=sum(v*v for v in x)
def corr(offset):
    y=[b[i+offset] for i in indices];return sum(u*v for u,v in zip(x,y))/math.sqrt(xx*sum(v*v for v in y))
best=max(range(-1200,1201,16),key=corr);best=max(range(best-16,best+17),key=corr);score=corr(best);assert score>.95 and abs(best)/24000<.05;checks=[]
for c in timeline:
    ix=list(range(c['globalStartFrame']+24000,c['globalEndFrame']-24000,240));score2=sum(a[i]*b[i+best] for i in ix)/math.sqrt(sum(a[i]**2 for i in ix)*sum(b[i+best]**2 for i in ix));assert score2>.95;checks.append({'id':c['id'],'correlation':score2})
save('soundtrack-verification.json',{'passed':True,'correlation':score,'offsetSeconds':best/24000,'perSceneWindows':checks,'sourceSHA256':sha(master),'decodedSHA256':sha(decoded),'method':'Deterministic waveform comparison after one continuous AAC encode; WAV source reuse separately byte verified.'})
save('assembly.json',{'id':M['id'],'videoSHA256':sha(video),'masterWavSHA256':sha(master),'frames':videoend,'audioFrames':frames,'durationSeconds':frames/24000,'scenes':len(parts),'run':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'method':'Original PCM concatenated without trims, gaps, speed or pitch changes; one AAC encode for full master. Silent visual streams concatenate at rounded global frame boundaries.','humanPlaybackVerified':False,'joinReview':'Automated actual-audio review; not human pronunciation approval.'})
print(json.dumps({'id':M['id'],'assembled':True,'durationSeconds':frames/24000}))
