from pathlib import Path
import sys,os,json,hashlib,subprocess,shutil
P=Path(__file__).parent;O=P/'output';O.mkdir(exist_ok=True)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def run(args,label,strict=True,limit=120):
 print('Stage:',label,flush=True)
 x=subprocess.run(args,capture_output=True,timeout=limit)
 (O/(label+'.stdout.txt')).write_bytes(x.stdout);(O/(label+'.stderr.txt')).write_bytes(x.stderr)
 if x.returncode or (strict and x.stderr.strip()):raise RuntimeError(label+' failed; preserved stdout/stderr; no re-encode permitted')
 return x.stdout.decode('utf8')
enc=run(['ffmpeg','-hide_banner','-encoders'],'actual-encoders',False,20)
dec=run(['ffmpeg','-hide_banner','-decoders'],'actual-decoders',False,20)
names=[line.split()[1] for line in enc.splitlines() if len(line.split())>=2 and len(line.split()[0])==6 and line.split()[0][0] in 'VAS']
save('capabilities.en.json',{'encoders':names,'pngAvailable':'png' in names,'defaultNullEncoderAvoided':True,'noMovieEncodingPerformed':True})
if sys.argv[1]=='preflight':sys.exit(0)
m=json.loads((P/'request.json').read_text());q=next(v for v in m['parts'] if v['id']==sys.argv[1]);d=P/'received';d.mkdir(exist_ok=False)
run(['gh','run','download',str(m['sourceRun']),'--repo',m['repository'],'--name',q['artifact']['name'],'--dir',str(d)],'download-existing-encoded-artifact',False)
for name,h in q['sourceFiles'].items():
 f=d/name
 if not f.is_file() or sha(f)!=h:raise RuntimeError('Existing artifact source mismatch: '+name)
for f in d.iterdir():
 if f.is_file():shutil.copyfile(f,O/f.name)
s=json.loads((d/'timing-and-inputs.en.json').read_text());gate=json.loads((d/'audio-gate.en.json').read_text())
if s['audioGate']['status']!='clear' or s['audioGate']['sourceAudioSHA256']!=s['audio']['sha256']:raise RuntimeError('Exact source audio gate required')
if gate['status']!='clear' or gate['sourceAudioSHA256']!=s['audio']['sha256']:raise RuntimeError('Retained gate binding changed')
c=next(v for v in json.loads((P/'contracts.json').read_text())['scenes'] if v['step']==s['step'] and v['sectionID']==s['sectionID'])
if not isinstance(s['frames'],int) or s['frames']!=(s['audioFrames']+799)//800:raise RuntimeError('Exact unchanged source frames required')
for a in c['actions']:
 cue=s['actions'][a['id']]
 if not 0<=cue['start']<cue['end']<=s['durationSeconds']+.05:raise RuntimeError('Original action cue invalid')
movie=O/q['movie'];visual=O/'visual.mp4'
save('rescue-source-binding.en.json',{'sourceRun':m['sourceRun'],'sourceHead':m['sourceHead'],'artifact':q['artifact'],'actualSourceFiles':{f.name:sha(f) for f in d.iterdir() if f.is_file()},'sourceAudioSHA256':s['audio']['sha256'],'sourceClock':s['sourceClock'],'audioGateSource':s['audioGateSource'],'noRerender':True,'noRemux':True,'sourceTimingUnchanged':True})
# Count_frames invokes the actual decoder for both streams through EOF. There is
# no interval limit and no select_streams filter. Strict stderr rejects errors.
p=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(movie)],'full-stream-decoded-frame-count'))
v=[x for x in p['streams'] if x['codec_type']=='video'];a=[x for x in p['streams'] if x['codec_type']=='audio']
if len(v)!=1 or len(a)!=1:raise RuntimeError('Expected exactly one actual video and audio stream')
v,a=v[0],a[0]
if v['width']!=1920 or v['height']!=1080 or int(v['nb_read_frames'])!=s['frames'] or v['r_frame_rate']!='30/1' or int(a['sample_rate'])!=24000 or a['channels']!=1 or int(a['nb_read_frames'])<=0 or abs(float(p['format']['duration'])-s['durationSeconds'])>.15:raise RuntimeError('Actual decoded stream checks failed')
save('probe.json',p)
save('decoded-verification.en.json',{'status':'clear','method':'ffprobe -count_frames, all audio/video streams through EOF, strict zero error stderr, exact authored video frame count; no output encoder used','videoFramesDecoded':int(v['nb_read_frames']),'audioFramesDecoded':int(a['nb_read_frames']),'videoSHA256':sha(movie),'sourceAudioSHA256':s['audio']['sha256'],'humanPlaybackVerified':False,'officialEvidence':['https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/ffprobe.texi','https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/fftools/ffprobe.c']})
frames=sorted(set([0]+[min(s['frames']-1,__import__('math').ceil((s['actions'][x['id']]['start']+.8)*30)) for x in c['actions']]+[s['frames']-1]))
if 'png' not in names:raise RuntimeError('Actual PNG encoder unavailable; movie is preserved and decoded, encoded-pixel review remains pending; no automatic render')
filter='select='+ '+'.join('eq(n\\,'+str(f)+')' for f in frames)
run(['ffmpeg','-nostdin','-v','error','-i',str(movie),'-map','0:v:0','-an','-vf',filter,'-vsync','vfr','-c:v','png',str(O/'encoded-%02d.png')],'extract-actual-encoded-checkpoints')
encoded=[]
for i,f in enumerate(frames):
 n='encoded-%02d.png'%(i+1);p=O/n
 if not p.is_file() or p.read_bytes()[:8]!=b'\x89PNG\r\n\x1a\n':raise RuntimeError('Actual encoded checkpoint missing/invalid')
 encoded.append({'frame':f,'file':n,'sha256':sha(p)})
if sha(movie)!=q['sourceFiles'][q['movie']] or sha(visual)!=q['sourceFiles']['visual.mp4']:raise RuntimeError('Existing movie changed during read-only rescue')
save('encoded-checkpoints.en.json',encoded)
save('render.en.json',{'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'step':s['step'],'sectionID':s['sectionID'],'contractKind':c['kind'],'contractSHA256':sha(P/'contracts.json'),'videoSHA256':sha(movie),'visualSHA256':sha(visual),'sourceAudioSHA256':s['audio']['sha256'],'sourceAudioFrames':s['audioFrames'],'frames':s['frames'],'durationSeconds':s['durationSeconds'],'fullLessonRendered':False,'humanPlaybackVerified':False,'timing':'Unchanged exact saved source timing; no estimate, scaling or speech stretching','selectedImageSHA256':s['image'].get('sha256'),'encodedCheckpoints':len(encoded),'rescueOnly':True,'sourceEncodedRun':m['sourceRun'],'verificationMethod':'All-stream ffprobe decoded frame count with strict stderr; PNGs extracted from preserved actual encoded movie'})
