"""Assemble existing S105 EN002 native-motion frames and unchanged original PCM on Actions only."""
from pathlib import Path
import datetime,hashlib,json,math,struct,subprocess,sys,wave,os
HERE=Path(__file__).resolve().parent
REPOSITORY='cabicci/viva-ai-systems-55d35820'
REPOSITORY_ID='1272666418'
BRANCH='refs/heads/work/soil-s105-zones-assembly-20261022-r1'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf-8'))
def write(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n','utf-8')
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def frozen():
    for rel,digest in read(HERE/'freeze.json')['sha256'].items():
        p=HERE/rel;assert p.resolve().is_relative_to(HERE.resolve()) and sha(p)==digest,rel

def production_gate():
    assert os.environ.get('GITHUB_ACTIONS')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')==REPOSITORY and os.environ.get('GITHUB_REPOSITORY_ID')==REPOSITORY_ID
    assert os.environ.get('GITHUB_REF')==BRANCH and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
    assert os.environ.get('GITHUB_EVENT_NAME')=='push'
    event=read(os.environ['GITHUB_EVENT_PATH'])
    assert event['created'] is True and event['before']=='0'*40 and event['ref']==BRANCH
    assert event['after']==os.environ['GITHUB_SHA'] and len(event['after'])==40
    assert event['repository']['full_name']==REPOSITORY and str(event['repository']['id'])==REPOSITORY_ID
    for env,name in [('MANIFEST_SHA','manifest.json'),('WORKER_SHA','assemble.py'),('FREEZE_SHA','freeze.json')]:assert os.environ.get(env)==sha(HERE/name)
    frozen()

def validate():
    frozen();m=read(HERE/'manifest.json')
    assert m['schemaVersion']==1 and m['scope']=='S1-05_EN002_MANAGEMENT_ZONES_ONLY' and m['unitId']=='S1-05-en-r1-002' and m['locale']=='en'
    assert m['repository']==REPOSITORY and str(m['repositoryId'])==REPOSITORY_ID and 'refs/heads/'+m['branch']==BRANCH
    assert m['fps']==30 and m['frames']==2525 and m['sampleCount']==2019840
    assert m['durationSeconds']==84.16 and m['frameDurationSeconds']==2525/30 and m['explicitTrailingSilenceSamples']==160
    assert m['sourceFrameQA']=='ROOT_ACTUAL_ENCODED_IVF_QA_PASS_PENDING_MUX_OUTPUT_QA'
    assert m['providerCalls']==m['automaticRetries']==0 and m['usesOriginalPcm']is True
    assert not m['completeLesson']and not m['ownerVideoAccepted']and not m['sourceRecapture']and m['rootPackageReviewBeforeLaunchRequired']is True
    assert set(m['inputs'])=={'voice.wav','video.ivf','captions.json','encoding.json','root-qa.json','encoded-verification.json'}
    for name,pin in m['inputs'].items():
        p=HERE/'inputs'/name;assert p.stat().st_size==pin['bytes']and sha(p)==pin['sha256'],name
    with wave.open(str(HERE/'inputs/voice.wav'),'rb')as w:
        assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE')
        n=w.getnframes();pcm=w.readframes(n)
    assert n==m['sampleCount']and len(pcm)==2*n and hashlib.sha256(pcm).hexdigest()==m['sourcePcmSha256']
    assert math.ceil(n/800)==m['frames']and m['frames']*800-n==160
    enc=read(HERE/'inputs/encoding.json');assert enc['sourceEncodeReceiptSha256']==m['sourceEncodeReceiptSha256'] and enc['sourceVisualReviewSha256']==m['sourceVisualReceiptSha256']
    assert enc['audioSha256']==m['inputs']['voice.wav']['sha256']and enc['sha256']==m['inputs']['video.ivf']['sha256']and enc['frames']==2525
    rootqa=read(HERE/'inputs/root-qa.json');encodedqa=read(HERE/'inputs/encoded-verification.json')
    assert rootqa['verificationSha256']==sha(HERE/'inputs/encoded-verification.json') and sha(HERE/'inputs/root-qa.json')==m['sourceRootEncodedQaSha256']
    assert rootqa['status']=='ROOT_ACTUAL_ENCODED_EVENT_FRAME_REVIEW_PASS' and rootqa['encodedFramesViewed']==20
    assert encodedqa['videoSha256']==m['inputs']['video.ivf']['sha256'] and encodedqa['sourceReceiptSha256']==m['sourceEncodeReceiptSha256'] and encodedqa['frames']==2525
    data=(HERE/'inputs/video.ivf').read_bytes();assert len(data)>=32
    head=struct.unpack('<4sHH4sHHIIII',data[:32]);assert head[:9]==(b'DKIF',0,32,b'VP90',1920,1080,30,1,2525)
    offset=32;i=0
    while offset<len(data):
        assert offset+12<=len(data);size,pts=struct.unpack('<IQ',data[offset:offset+12])
        assert size>0 and pts==i and offset+12+size<=len(data)
        assert hashlib.sha256(data[offset+12:offset+12+size]).hexdigest()==enc['packetPins'][i],i
        offset+=12+size;i+=1
    assert i==2525==len(enc['packetPins'])and offset==len(data)
    captions=read(HERE/'inputs/captions.json');assert captions['unitId']==m['unitId'] and len(captions['captions'])==20
    assert captions['audioSha256']==m['inputs']['voice.wav']['sha256']and captions['pcmSha256']==m['sourcePcmSha256']and captions['sourceTimingSha256']==m['sourceTimingSha256']
    assert hashlib.sha256(captions['spokenText'].encode()).hexdigest()==captions['spokenTextSha256']
    assert ' '.join(' '.join(c['spokenText'].split())for c in captions['captions'])==' '.join(captions['spokenText'].split())
    assert len(m['encodedFrameRequests'])==51
    for row in m['encodedFrameRequests']:
        assert 0<=row['encodedFrameIndex']<2525 and row['encodedFrameIndex']==min(2524,int(row['requestedSeconds']*30))
    return m,pcm,n,2525

def call(command,timeout=900):subprocess.run(command,check=True,timeout=timeout)
def run():
    production_gate();m,pcm,n,frames=validate();out=HERE/'output';out.mkdir(exist_ok=False)
    write(out/'attempt.json',{'atUTC':now(),'status':'STARTED_NO_RETRY','workerSha256':sha(__file__),'manifestSha256':sha(HERE/'manifest.json'),'runId':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA']})
    extra=160
    with wave.open(str(out/'preserved-source-pcm.wav'),'wb')as w:w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(pcm+b'\0'*(extra*2))
    with wave.open(str(out/'preserved-source-pcm.wav'),'rb')as w:
        assert w.getnframes()==2020000;got=w.readframes(w.getnframes());assert got[:len(pcm)]==pcm and got[len(pcm):]==b'\0'*(extra*2)
    # Both real source and final output are decoded with fail-on-error. No scene rendering or TTS.
    call(['ffmpeg','-nostdin','-v','error','-xerror','-err_detect','explode','-i',str(HERE/'inputs/video.ivf'),'-f','null','-'],300)
    target=out/'S1-05-en-zones-r1.mp4'
    call(['ffmpeg','-nostdin','-n','-v','error','-xerror','-i',str(HERE/'inputs/video.ivf'),'-i',str(out/'preserved-source-pcm.wav'),'-map','0:v:0','-map','1:a:0','-frames:v',str(frames),'-c:v','libx264','-preset','medium','-crf','18','-bf','0','-pix_fmt','yuv420p','-video_track_timescale','30000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(target)])
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(target)]));write(out/'probe.json',probe)
    v=[s for s in probe['streams']if s['codec_type']=='video'];a=[s for s in probe['streams']if s['codec_type']=='audio']
    assert len(v)==len(a)==1 and v[0]['codec_name']=='h264'and a[0]['codec_name']=='aac'
    assert(v[0]['width'],v[0]['height'],v[0]['r_frame_rate'],int(v[0]['nb_read_frames']))==(1920,1080,'30/1',frames)
    assert abs(float(probe['format']['duration'])-frames/30)<0.06
    packets=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts,dts,duration','-of','json',str(target)]))['packets'];assert len(packets)==frames
    assert v[0]['time_base']=='1/30000'
    for i,p in enumerate(packets):assert(int(p['pts']),int(p['dts']),int(p['duration']))==(i*1000,i*1000,1000)
    write(out/'video-packet-grid.json',{'timeBase':'1/30000','frameCount':frames,'allPtsDtsDurationExact':True,'packets':packets})
    call(['ffmpeg','-nostdin','-v','error','-xerror','-err_detect','explode','-i',str(target),'-f','null','-'],300)
    frameproof=[]
    for i,row in enumerate(m['encodedFrameRequests']):
        dest=out/f'frame-{i:02d}.png';index=row['encodedFrameIndex']
        call(['ffmpeg','-nostdin','-n','-v','error','-xerror','-i',str(target),'-vf',f'select=eq(n\\,{index})','-fps_mode','vfr','-frames:v','1',str(dest)],90)
        frameproof.append({**row,'actualEncodedGridSeconds':index/30,'file':dest.name,'sha256':sha(dest)})
    validate()
    write(out/'verification.json',{'status':'CODEC_PCM_PACKET_GRID_AND_FULL_DECODE_PASS_PENDING_ROOT_ACTUAL_ENCODED_FRAME_PLAYBACK_QA','atUTC':now(),'unitId':m['unitId'],'manifestSha256':sha(HERE/'manifest.json'),'workerSha256':sha(__file__),'freezeSha256':sha(HERE/'freeze.json'),'sourceEncodeReceiptSha256':m['sourceEncodeReceiptSha256'],'sourceVisualReceiptSha256':m['sourceVisualReceiptSha256'],'sourceSampleCount':n,'retainedSourcePcmSha256':hashlib.sha256(got[:len(pcm)]).hexdigest(),'originalPcmExactAtOffset':0,'explicitTrailingSilenceSamples':extra,'frameCount':frames,'fps':30,'duration':frames/30,'mp4Sha256':sha(target),'pcmArchiveSha256':sha(out/'preserved-source-pcm.wav'),'mp4AudioLossyAAC':True,'sourcePcmArchiveLossless':True,'actualEncodedFrameRequests':frameproof,'allPacketsGridExact':True,'fullSourceAndOutputDecodeXerrorPassed':True,'providerCalls':0,'automaticRetries':0,'sourceRecaptured':False,'completeLesson':False,'ownerAccepted':False,'publishedPlatform':False,'humanListeningClaimed':False})
if __name__=='__main__':
    if sys.argv[-1]=='validate':validate();print('Exact2525 IVF packets/original2019840 PCM samples/20 source clauses pass; no codecs/render/providers invoked')
    elif sys.argv[-1]=='run':run()
    else:raise SystemExit('validate or run required')
