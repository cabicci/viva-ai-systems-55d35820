"""Single measured S105 EN001 clip. No provider calls, voice conversion or retries."""
from pathlib import Path
import datetime,hashlib,json,math,struct,subprocess,sys,wave,os
HERE=Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p): return json.loads(Path(p).read_text('utf-8'))
def write(p,d): Path(p).write_text(json.dumps(d,indent=2)+'\n','utf-8')
def validate():
    m=read(HERE/'manifest.json')
    assert m['scope']=='S1-05_EN001_OPENING_ONLY' and m['unitId']=='S1-05-en-r1-001'
    assert m['fps']==30 and m['sourceFrameQA']=='ROOT_VISUAL_QA_PASS'
    assert m['providerCalls']==0 and m['automaticRetries']==0
    for name in ['voice.wav','video.ivf']:
        assert sha(HERE/'inputs'/name)==m['inputs'][name]['sha256'],name
    with wave.open(str(HERE/'inputs/voice.wav'),'rb') as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE')
        n=w.getnframes();pcm=w.readframes(n);assert len(pcm)==n*2
    assert hashlib.sha256(pcm).hexdigest()==m['sourcePcmSha256']
    assert n==m['sampleCount'] and n/24000==51.84
    frames=math.ceil(n/800);assert frames==1556==m['frames']
    data=(HERE/'inputs/video.ivf').read_bytes();head=struct.unpack('<4sHH4sHHIIII',data[:32])
    assert head[:6]==(b'DKIF',0,32,b'VP90',1920,1080) and head[6:9]==(30,1,frames)
    offset=32;i=0
    while offset<len(data):
        size,pts=struct.unpack('<IQ',data[offset:offset+12]);assert size>0 and pts==i and offset+12+size<=len(data)
        offset+=12+size;i+=1
    assert i==frames and offset==len(data)
    return m,pcm,n,frames
def run():
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s105-opening-assembly-20261022-r2'
    m,pcm,n,frames=validate();out=HERE/'output';out.mkdir(exist_ok=False)
    write(out/'attempt.json',{'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'STARTED_NO_RETRY','workerSha256':sha(__file__),'manifestSha256':sha(HERE/'manifest.json')})
    extra=frames*800-n;assert 0<=extra<800
    with wave.open(str(out/'preserved-source-pcm.wav'),'wb') as w:
        w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(pcm+b'\0'*(extra*2))
    with wave.open(str(out/'preserved-source-pcm.wav'),'rb') as w:
        got=w.readframes(w.getnframes());assert got[:len(pcm)]==pcm and got[len(pcm):]==b'\0'*(extra*2)
    target=out/'S1-05-en-opening-r1.mp4'
    cmd=['ffmpeg','-nostdin','-n','-v','error','-i',str(HERE/'inputs/video.ivf'),'-i',str(out/'preserved-source-pcm.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(target)]
    subprocess.run(cmd,check=True,timeout=900)
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(target)]));write(out/'probe.json',probe)
    v=[s for s in probe['streams'] if s['codec_type']=='video'];a=[s for s in probe['streams'] if s['codec_type']=='audio']
    assert len(v)==len(a)==1 and v[0]['codec_name']=='h264' and a[0]['codec_name']=='aac'
    assert (v[0]['width'],v[0]['height'],v[0]['r_frame_rate'],int(v[0]['nb_read_frames']))==(1920,1080,'30/1',frames)
    assert abs(float(probe['format']['duration'])-frames/30)<0.06
    subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(target),'-f','null','-'],check=True,timeout=300)
    times=[0,5.08,6.26,7.26,8.3,14.2,17.4,18.15,19,31.99,34.41,39.0,45.0,51.8]
    for i,t in enumerate(times):
        subprocess.run(['ffmpeg','-nostdin','-n','-v','error','-ss',str(t),'-i',str(target),'-frames:v','1',str(out/f'frame-{i:02d}.png')],check=True,timeout=90)
    validate() # Exact source inputs must remain unchanged throughout.
    write(out/'verification.json',{'status':'CODEC_PCM_AND_DECODE_PASS_PENDING_ROOT_ACTUAL_ENCODED_FRAME_PLAYBACK_QA','atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'unitId':m['unitId'],'manifestSha256':sha(HERE/'manifest.json'),'workerSha256':sha(__file__),'sourceSampleCount':n,'retainedSourcePcmSha256':hashlib.sha256(got[:len(pcm)]).hexdigest(),'originalPcmExactAtOffset':0,'explicitTrailingSilenceSamples':extra,'frameCount':frames,'fps':30,'duration':frames/30,'mp4Sha256':sha(target),'pcmArchiveSha256':sha(out/'preserved-source-pcm.wav'),'mp4AudioLossyAAC':True,'sourcePcmArchiveLossless':True,'times':times,'frameHashes':{p.name:sha(p) for p in sorted(out.glob('frame-*.png'))},'providerCalls':0,'automaticRetries':0,'completeLesson':False,'publishedPlatform':False})
if __name__=='__main__':
    if sys.argv[-1]=='validate':
        validate();print('Exact IVF/PCM/manifest validation passed; no rendering/provider call')
    elif sys.argv[-1]=='run':run()
    else:raise SystemExit('validate or run required')
