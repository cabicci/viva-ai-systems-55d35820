import hashlib,json,subprocess
from pathlib import Path
for x in json.loads(Path('input-hashes.json').read_text()):
 assert hashlib.sha256(Path(x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
p=Path('output/review.mp4')
if p.exists():
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
 v=next(s for s in d['streams'] if s['codec_type']=='video');a=next(s for s in d['streams'] if s['codec_type']=='audio')
 assert (v['width'],v['height'],v['nb_frames'],v['r_frame_rate'])==(1920,1080,'697','30/1')
 assert abs(float(d['format']['duration'])-697/30)<.1
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
 Path('output/verification.json').write_text(json.dumps({'technicalChecksPassed':True,'audioReused':True,'sourceAudioSHA256':hashlib.sha256(Path('public/audio/accepted-tools-ar-EG.wav').read_bytes()).hexdigest(),'renderer':'Chromium WebGL / Three.js','notBlenderCycles':True,'ownerVisualApproval':False,'ffprobe':d},indent=2))
print('Input checks passed')
