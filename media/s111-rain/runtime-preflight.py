"""Bounded preinstalled-codec qualification; synthetic fixtures only, no installer/network."""
from pathlib import Path
import datetime,hashlib,json,shutil,subprocess,sys
HERE=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def write(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def qualify(out,ffmpeg=None,ffprobe=None):
    out=Path(out);out.mkdir(exist_ok=False);calls=[]
    write(out/'attempt.json',{'atUTC':now(),'status':'STARTED_SYNTHETIC_ONLY_NO_RETRY','maximumSubprocesses':8,'maximumTotalSubprocessTimeoutSeconds':90,'realCourseMediaOpened':False})
    def call(label,argv,timeout):
        assert len(calls)<8 and timeout<=20
        record={'label':label,'argv':list(map(str,argv)),'timeoutSeconds':timeout};calls.append(record)
        p=subprocess.run(argv,capture_output=True,timeout=timeout);(out/(label+'.stdout')).write_bytes(p.stdout);(out/(label+'.stderr')).write_bytes(p.stderr);record.update(returncode=p.returncode,stdoutSha256=sha(out/(label+'.stdout')),stderrSha256=sha(out/(label+'.stderr')))
        if p.returncode:raise RuntimeError('Codec preflight command failed: '+label)
        return p.stdout.decode('utf8',errors='replace')
    try:
        ffmpeg=Path(ffmpeg or shutil.which('ffmpeg') or '').resolve();ffprobe=Path(ffprobe or shutil.which('ffprobe') or '').resolve()
        if not ffmpeg.is_file()or not ffprobe.is_file():raise RuntimeError('Preinstalled ffmpeg/ffprobe unavailable; no installer or fallback')
        version=call('ffmpeg-version',[str(ffmpeg),'-version'],5);probeversion=call('ffprobe-version',[str(ffprobe),'-version'],5)
        decoders=call('decoders',[str(ffmpeg),'-hide_banner','-decoders'],10);encoders=call('encoders',[str(ffmpeg),'-hide_banner','-encoders'],10)
        names=lambda s:{line.split()[1]for line in s.splitlines()if len(line.split())>=2 and len(line.split()[0])==6}
        if 'libvpx-vp9'not in names(decoders)or not {'libx264','aac'}.issubset(names(encoders)):raise RuntimeError('Exact libvpx-vp9 decoder/libx264 encoder/aac encoder absent; real media conversion prohibited')
        fixture=HERE/'runtime-fixtures';pins=json.loads((fixture/'pins.json').read_text('utf8'))
        for name,digest in pins['sha256'].items():
            p=fixture/name;assert p.resolve().is_relative_to(fixture.resolve())and sha(p)==digest
        target=out/'synthetic-capability-test.mp4'
        call('synthetic-convert',[str(ffmpeg),'-nostdin','-n','-v','error','-xerror','-err_detect','explode','-c:v','libvpx-vp9','-i',str(fixture/'tiny-vp9.ivf'),'-i',str(fixture/'tiny-pcm.wav'),'-map','0:v:0','-map','1:a:0','-frames:v','3','-c:v','libx264','-preset','ultrafast','-crf','23','-bf','0','-pix_fmt','yuv420p','-video_track_timescale','30000','-c:a','aac','-b:a','64k','-movflags','+faststart',str(target)],20)
        probe=json.loads(call('synthetic-probe',[str(ffprobe),'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(target)],10))
        videos=[s for s in probe['streams']if s['codec_type']=='video'];audios=[s for s in probe['streams']if s['codec_type']=='audio']
        assert len(videos)==len(audios)==1 and videos[0]['codec_name']=='h264'and audios[0]['codec_name']=='aac'
        assert (videos[0]['width'],videos[0]['height'],int(videos[0]['nb_read_frames']),videos[0]['r_frame_rate'],videos[0]['time_base'])==(64,64,3,'30/1','1/30000')
        assert int(audios[0]['sample_rate'])==24000 and audios[0]['channels']==1
        call('synthetic-full-decode',[str(ffmpeg),'-nostdin','-v','error','-xerror','-err_detect','explode','-i',str(target),'-f','null','-'],10)
        packets=json.loads(call('synthetic-packet-grid',[str(ffprobe),'-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts,dts,duration','-of','json',str(target)],10))['packets']
        assert len(packets)==3 and all((int(p['pts']),int(p['dts']),int(p['duration']))==(i*1000,i*1000,1000)for i,p in enumerate(packets))
        result={'status':'PREINSTALLED_EXACT_CODECS_AND_TINY_SYNTHETIC_TEST_PASS','atUTC':now(),'ffmpeg':{'path':str(ffmpeg),'sha256':sha(ffmpeg),'version':version.splitlines()[0]},'ffprobe':{'path':str(ffprobe),'sha256':sha(ffprobe),'version':probeversion.splitlines()[0]},'requiredCapabilities':['libvpx-vp9 decode','libx264 encode','aac encode'],'syntheticFrames':3,'syntheticSampleCount':2400,'syntheticSha256':sha(target),'allSyntheticVideoPacketsExact30fpsGrid':True,'fixturePinsSha256':sha(fixture/'pins.json'),'calls':calls,'maximumCalls':8,'totalTimeoutBudgetSeconds':90,'installerCalls':0,'networkCalls':0,'fallbacks':0,'automaticRetries':0,'realCourseMediaOpened':False}
        write(out/'qualification.json',result);return result
    except BaseException as error:
        write(out/'failure.json',{'atUTC':now(),'error':str(error),'calls':calls,'noInstallerFallbackRetry':True,'realCourseMediaOpened':False});raise
if __name__=='__main__':
    if len(sys.argv)not in [2,4]:raise SystemExit('runtime-preflight.py OUTPUT [FFMPEG FFPROBE]')
    r=qualify(sys.argv[1],*(sys.argv[2:]));print(json.dumps({'status':r['status'],'calls':len(r['calls']),'ffmpeg':r['ffmpeg'],'ffprobe':r['ffprobe'],'realCourseMediaOpened':False}))
