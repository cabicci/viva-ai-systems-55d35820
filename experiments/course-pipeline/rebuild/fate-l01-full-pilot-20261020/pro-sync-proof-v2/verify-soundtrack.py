from pathlib import Path
import subprocess,wave,array,json,math,hashlib
R=Path(__file__).parent;Q=R/'proof';data=json.loads((R/'render-data.json').read_text(encoding='utf-8'));scene=data['scenes'][0];source=R/'public'/scene['audio'];decoded=Q/'decoded-soundtrack.wav'
subprocess.run(['ffmpeg','-v','error','-i',str(Q/'L01-pro-sync-sample.mp4'),'-vn','-ac','1','-ar','24000','-c:a','pcm_s16le',str(decoded)],check=True)
def pcm(p):
 with wave.open(str(p),'rb') as f:return array.array('h',f.readframes(f.getnframes()))
a=pcm(source);b=pcm(decoded);indices=list(range(24000,min(len(a),len(b))-24000,240));x=[a[i] for i in indices];xx=sum(v*v for v in x)
def corr(offset):
 y=[b[i+offset] for i in indices];return sum(u*v for u,v in zip(x,y))/math.sqrt(xx*sum(v*v for v in y))
best=max(range(-1024,1025,16),key=corr);best=max(range(best-16,best+17),key=corr);score=corr(best);assert score>.95 and abs(best)/24000<.05,(score,best)
(Q/'soundtrack-verification.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'decodedSHA256':hashlib.sha256(decoded.read_bytes()).hexdigest(),'correlation':score,'offsetSamples':best,'offsetSeconds':best/24000,'method':'Decoded exported AAC compared with exact accepted source PCM, deterministic waveform samples and small delay search. AAC is lossy; byte equality is not asserted.','passed':True},indent=2)+'\n');print(json.dumps({'correlation':score,'offsetSeconds':best/24000}))
