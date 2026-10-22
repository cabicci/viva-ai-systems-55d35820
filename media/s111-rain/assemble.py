"""One reviewed EN008 clip; original PCM; qualified preinstalled codecs; Actions only."""
from pathlib import Path
import datetime,hashlib,importlib.util,json,math,os,struct,subprocess,sys,wave
HERE=Path(__file__).resolve().parent
REPOSITORY='cabicci/viva-ai-systems-55d35820';REPOSITORY_ID='1272666418';BRANCH='refs/heads/work/soil-s111-rain-assembly-20261022-r1'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p):return json.loads(Path(p).read_text('utf8'))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def write(p,d):
    with Path(p).open('x',encoding='utf8',newline='\n')as f:json.dump(d,f,ensure_ascii=False,indent=2);f.write('\n')
def frozen():
    freeze=read(HERE/'freeze.json')
    for rel,digest in freeze['sha256'].items():
        p=HERE/rel;assert p.resolve().is_relative_to(HERE.resolve())and p.is_file()and not p.is_symlink()and sha(p)==digest,rel
def production_gate():
    assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_EVENT_NAME')=='push'
    assert os.environ.get('GITHUB_REPOSITORY')==REPOSITORY and os.environ.get('GITHUB_REPOSITORY_ID')==REPOSITORY_ID
    assert os.environ.get('GITHUB_REF')==BRANCH and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
    event=read(os.environ['GITHUB_EVENT_PATH'])
    assert event['created']is True and event['before']=='0'*40 and event['ref']==BRANCH and event.get('deleted',False)is False
    assert event['after']==os.environ['GITHUB_SHA']and len(event['after'])==40 and all(c in '0123456789abcdef'for c in event['after'])
    assert event['repository']['full_name']==REPOSITORY and str(event['repository']['id'])==REPOSITORY_ID
    for env,name in [('MANIFEST_SHA','manifest.json'),('WORKER_SHA','assemble.py'),('RUNTIME_SHA','runtime-preflight.py'),('FREEZE_SHA','freeze.json')]:assert os.environ.get(env)==sha(HERE/name)
    frozen()
def validate():
    frozen();m=read(HERE/'manifest.json')
    assert m['scope']=='S1-11_EN008_RAIN_CONTEXT_ONLY'and m['unitId']=='S1-11-en-r3-008'and m['locale']=='en'
    assert m['repository']==REPOSITORY and str(m['repositoryId'])==REPOSITORY_ID and 'refs/heads/'+m['branch']==BRANCH
    assert (m['frames'],m['fps'],m['sampleCount'],m['durationSeconds'],m['explicitTrailingSilenceSamples'])==(774,30,619200,25.8,0)
    assert m['providerCalls']==m['automaticRetries']==0 and m['usesOriginalPcm']is True and m['assessmentExcluded']is True
    assert not m['completeLesson']and not m['ownerVideoAccepted']and not m['sourceRecapture']and m['rootPackageReviewBeforeLaunchRequired']is True
    assert m['runtimePolicy']=={'source':'preinstalled-only','required':['libvpx-vp9 decode','libx264 encode','aac encode'],'syntheticCheckRequired':True,'maximumPreflightCalls':8,'maximumPreflightTimeoutSeconds':90,'installerCalls':0,'fallbacks':0,'retry':0}
    assert set(m['inputs'])=={'voice.wav','video.ivf','captions.json','encoding.json','root-qa.json','encoded-verification.json'}
    for name,pin in m['inputs'].items():
        p=HERE/'inputs'/name;assert p.stat().st_size==pin['bytes']and sha(p)==pin['sha256'],name
    with wave.open(str(HERE/'inputs/voice.wav'),'rb')as w:
        assert(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())==(1,2,24000,'NONE');n=w.getnframes();pcm=w.readframes(n)
    assert n==619200 and len(pcm)==1238400 and hashlib.sha256(pcm).hexdigest()==m['sourcePcmSha256']=='31a921cbf1b1ed137b0a20070ad9ba500c1de95c811d096adb7735c0a1d81eb9'
    assert sha(HERE/'inputs/voice.wav')=='cf4b4ed2eb55bb431073ced788f05410b3d0ba7903948f915ad73cc6931f0ea9'and math.ceil(n/800)==774 and 774*800-n==0
    enc=read(HERE/'inputs/encoding.json');rootqa=read(HERE/'inputs/root-qa.json');qa=read(HERE/'inputs/encoded-verification.json')
    assert enc['sourceEncodeReceiptSha256']==m['sourceEncodeReceiptSha256']=='fbe2dda8227199cbbfe547e9b62f5f875aee895b43ea933e95750123a5cc1a11'
    assert enc['audioSha256']==m['inputs']['voice.wav']['sha256']and enc['sha256']==m['inputs']['video.ivf']['sha256']and enc['frames']==774
    assert sha(HERE/'inputs/root-qa.json')==m['sourceRootEncodedQaSha256']=='6548d4dcc6bf8b402607eaf2611c64134e4221ab4fbfe7182de7731c3e066ef2'
    assert rootqa['status']=='ROOT_ACTUAL_ENCODED_IMAGE_REVIEW_PASS'and rootqa['actualFrames']==9 and rootqa['receiptSha256']==qa['sourceVerificationSha256']=='4bb93fc35b34289193b56bf81ff8abe707cce7c9d5100f69794113bfa2758054'
    assert qa['encodedSha256']==enc['sha256']and qa['sourceEncodeReceiptSha256']==m['sourceEncodeReceiptSha256']and qa['frames']==774 and qa['fullXerrorDecodePassed']is True
    count=0
    with(HERE/'inputs/video.ivf').open('rb')as f:
        assert struct.unpack('<4sHH4sHHIIII',f.read(32))==(b'DKIF',0,32,b'VP90',1920,1080,30,1,774,0)
        while head:=f.read(12):
            assert len(head)==12;size,t=struct.unpack('<IQ',head);payload=f.read(size);assert size>0 and len(payload)==size and t==count and hashlib.sha256(payload).hexdigest()==enc['packetPins'][count];count+=1
    assert count==len(enc['packetPins'])==774
    caps=read(HERE/'inputs/captions.json');assert caps['unitId']==m['unitId']and len(caps['captions'])==5
    assert caps['audioSha256']==m['inputs']['voice.wav']['sha256']and caps['pcmSha256']==m['sourcePcmSha256']and caps['sourceTimingSha256']==m['sourceTimingSha256']
    assert hashlib.sha256(caps['spokenText'].encode()).hexdigest()==caps['spokenTextSha256']=='7408eadb07978671dbf9bc98c0068f2b9effae9d10735d26e76a64c22453df01'
    assert ' '.join(c['spokenText']for c in caps['captions'])==caps['spokenText']
    assert [(c['startSeconds'],c['endSeconds'])for c in caps['captions']]==[(0,5.26),(5.94,9.08),(10,15.58),(16.44,20.7),(21.44,25.34)]
    assert caps['unresolvedIndividualWordTimings']==[{'wordIndex':29,'text':'and','startSeconds':None,'endSeconds':None}]
    assert len(m['encodedFrameRequests'])==9
    for row in m['encodedFrameRequests']:assert 0<=row['encodedFrameIndex']<774 and row['encodedFrameIndex']==round(row['encodedGridSeconds']*30)
    return m,pcm,n
def call(label,argv,out,timeout):
    assert 0<timeout<=180
    write(out/(label+'-attempt.json'),{'atUTC':now(),'argv':list(map(str,argv)),'timeoutSeconds':timeout,'noRetry':True})
    p=subprocess.run(argv,capture_output=True,timeout=timeout);(out/(label+'.stdout')).write_bytes(p.stdout);(out/(label+'.stderr')).write_bytes(p.stderr)
    if p.returncode:raise RuntimeError('Finite codec command failed: '+label)
    return p.stdout
def runtime_tools():
    out=HERE/'output';r=read(out/'runtime/qualification.json');bound=read(out/'preflight-completion.json')
    assert r['status']=='PREINSTALLED_EXACT_CODECS_AND_TINY_SYNTHETIC_TEST_PASS'and r['realCourseMediaOpened']is False
    assert r['installerCalls']==r['networkCalls']==r['fallbacks']==r['automaticRetries']==0 and len(r['calls'])==8
    assert bound['runtimeModuleSha256']==sha(HERE/'runtime-preflight.py')and bound['qualificationSha256']==sha(out/'runtime/qualification.json')
    assert r['fixturePinsSha256']==sha(HERE/'runtime-fixtures/pins.json')
    for tool in ['ffmpeg','ffprobe']:assert Path(r[tool]['path']).is_file()and sha(r[tool]['path'])==r[tool]['sha256']
    return r['ffmpeg']['path'],r['ffprobe']['path'],r
def preflight():
    production_gate();validate();out=HERE/'output';out.mkdir(exist_ok=False)
    write(out/'preflight-attempt.json',{'atUTC':now(),'status':'PREFLIGHT_ONLY_NO_REAL_MEDIA_CONVERSION','workerSha256':sha(__file__),'runId':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA']})
    spec=importlib.util.spec_from_file_location('bounded_runtime',HERE/'runtime-preflight.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    r=module.qualify(out/'runtime');write(out/'preflight-completion.json',{'status':r['status'],'runtimeModuleSha256':sha(HERE/'runtime-preflight.py'),'qualificationSha256':sha(out/'runtime/qualification.json'),'realMediaConversionStarted':False})
def assemble():
    production_gate();m,pcm,n=validate();ff,probe,runtime=runtime_tools();out=HERE/'output'
    write(out/'assemble-attempt.json',{'atUTC':now(),'status':'STARTED_ONCE_NO_RETRY','preflightSha256':sha(out/'preflight-completion.json'),'frames':774,'sampleCount':619200})
    archive=out/'preserved-source-pcm.wav'
    with archive.open('xb')as f:f.write((HERE/'inputs/voice.wav').read_bytes())
    assert sha(archive)==m['inputs']['voice.wav']['sha256']
    call('source-full-decode',[ff,'-nostdin','-v','error','-xerror','-err_detect','explode','-c:v','libvpx-vp9','-i',str(HERE/'inputs/video.ivf'),'-f','null','-'],out,90)
    target=out/'S1-11-en008-rain-r1.mp4'
    call('mux',[ff,'-nostdin','-n','-v','error','-xerror','-err_detect','explode','-c:v','libvpx-vp9','-i',str(HERE/'inputs/video.ivf'),'-i',str(archive),'-map','0:v:0','-map','1:a:0','-frames:v','774','-c:v','libx264','-preset','medium','-crf','18','-bf','0','-threads','2','-pix_fmt','yuv420p','-video_track_timescale','30000','-c:a','aac','-b:a','192k','-movflags','+faststart',str(target)],out,180)
    validate();runtime_tools()
    write(out/'assembly-completion.json',{'status':'ASSEMBLED_UPLOAD_BEFORE_DIAGNOSTICS','atUTC':now(),'mp4Sha256':sha(target),'pcmArchiveSha256':sha(archive),'sourcePcmSha256':hashlib.sha256(pcm).hexdigest(),'originalPcmExactAtOffset':0,'sampleCount':n,'explicitTrailingSilenceSamples':0,'frames':774,'durationSeconds':25.8,'runtimeQualificationSha256':sha(out/'runtime/qualification.json'),'manifestSha256':sha(HERE/'manifest.json'),'workerSha256':sha(__file__),'providerCalls':0,'automaticRetries':0,'finalQaPending':True})
def verify():
    production_gate();m,pcm,n=validate();ff,fp,runtime=runtime_tools();out=HERE/'output';complete=read(out/'assembly-completion.json');target=out/'S1-11-en008-rain-r1.mp4';archive=out/'preserved-source-pcm.wav'
    assert sha(target)==complete['mp4Sha256']and sha(archive)==complete['pcmArchiveSha256']==m['inputs']['voice.wav']['sha256']
    write(out/'verify-attempt.json',{'atUTC':now(),'status':'STARTED_FINITE_DIAGNOSTICS_NO_RETRY','mp4Sha256':sha(target)})
    with wave.open(str(archive),'rb')as w:assert w.getnframes()==619200 and w.readframes(619200)==pcm
    probe=json.loads(call('final-probe',[fp,'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(target)],out,30));write(out/'probe.json',probe)
    v=[s for s in probe['streams']if s['codec_type']=='video'];a=[s for s in probe['streams']if s['codec_type']=='audio']
    assert len(v)==len(a)==1 and v[0]['codec_name']=='h264'and a[0]['codec_name']=='aac'
    assert(v[0]['width'],v[0]['height'],v[0]['r_frame_rate'],int(v[0]['nb_read_frames']),v[0]['time_base'])==(1920,1080,'30/1',774,'1/30000')
    assert int(a[0]['sample_rate'])==24000 and a[0]['channels']==1 and abs(float(probe['format']['duration'])-25.8)<.06
    packets=json.loads(call('final-packets',[fp,'-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts,dts,duration','-of','json',str(target)],out,30))['packets']
    assert len(packets)==774 and all((int(p['pts']),int(p['dts']),int(p['duration']))==(i*1000,i*1000,1000)for i,p in enumerate(packets))
    write(out/'video-packet-grid.json',{'timeBase':'1/30000','frames':774,'allPtsDtsDurationExact':True,'packets':packets})
    call('final-full-decode',[ff,'-nostdin','-v','error','-xerror','-err_detect','explode','-i',str(target),'-f','null','-'],out,60)
    selected=sorted({r['encodedFrameIndex']for r in m['encodedFrameRequests']});expr='+'.join(f'eq(n\\,{n})'for n in selected)
    call('final-frame-select',[ff,'-nostdin','-n','-v','error','-xerror','-i',str(target),'-vf','select='+expr,'-fps_mode','vfr',str(out/'frame-%03d.png')],out,60)
    images=sorted(out.glob('frame-*.png'));assert len(images)==len(selected)==9
    frameproof=[{'frame':frame,'timeSeconds':frame/30,'file':p.name,'sha256':sha(p)}for frame,p in zip(selected,images)]
    validate();runtime_tools()
    write(out/'verification.json',{'status':'CODEC_ORIGINAL_PCM_PACKET_GRID_FULL_DECODE_PASS_PENDING_ROOT_MP4_FRAME_AND_PLAYBACK_QA','atUTC':now(),'unitId':m['unitId'],'mp4Sha256':sha(target),'manifestSha256':sha(HERE/'manifest.json'),'workerSha256':sha(__file__),'freezeSha256':sha(HERE/'freeze.json'),'sourceEncodeReceiptSha256':m['sourceEncodeReceiptSha256'],'sourceRootEncodedQaSha256':m['sourceRootEncodedQaSha256'],'sourceSampleCount':n,'retainedSourcePcmSha256':hashlib.sha256(pcm).hexdigest(),'originalPcmExactAtOffset':0,'explicitTrailingSilenceSamples':0,'frames':774,'fps':30,'durationSeconds':25.8,'pcmArchiveSha256':sha(archive),'mp4AudioLossyAAC':True,'sourcePcmArchiveLossless':True,'actualEncodedFrames':frameproof,'allVideoPacketsGridExact':True,'fullSourceAndOutputXerrorDecodePassed':True,'runtimeQualificationSha256':sha(out/'runtime/qualification.json'),'preinstalledFfmpeg':runtime['ffmpeg'],'preinstalledFfprobe':runtime['ffprobe'],'providerCalls':0,'automaticRetries':0,'sourceRecaptured':False,'completeLesson':False,'ownerAccepted':False,'publishedPlatform':False,'humanListeningClaimed':False})
if __name__=='__main__':
    if len(sys.argv)!=2 or sys.argv[1]not in ['validate','preflight','assemble','verify']:raise SystemExit('validate/preflight/assemble/verify required')
    mode=sys.argv[1]
    try:
        if mode=='validate':validate();print('Exact774 packets/original619200 PCM samples/five source clauses pass; no codecs/browser/provider invoked')
        else:globals()[mode]()
    except BaseException as error:
        out=HERE/'output'
        if mode!='validate'and out.exists():
            path=out/(mode+'-failure.json')
            if not path.exists():write(path,{'atUTC':now(),'error':str(error),'phase':mode,'noAutomaticRetry':True,'partialOutputsPreserved':True})
        raise
