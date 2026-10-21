from pathlib import Path
import subprocess,wave,array,json,math,hashlib,sys
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf-8'));full=sys.argv[1]=='full';Q=R/('final' if full else 'output');scene=None if full else json.loads((R/'render-data.json').read_text(encoding='utf-8'))['scenes'][0];source=R/'public'/(M['source']['file'] if full else scene['audio']);video=Q/('L01-ar.mp4' if full else scene['id']+'.mp4');decoded=Q/'decoded-soundtrack.wav'
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-vn','-ac','1','-ar','24000','-c:a','pcm_s16le',str(decoded)],check=True)
def pcm(p):
 with wave.open(str(p),'rb') as f:return array.array('h',f.readframes(f.getnframes()))
a=pcm(source);b=pcm(decoded);indices=list(range(24000,min(len(a),len(b))-24000,480));x=[a[i] for i in indices];xx=sum(v*v for v in x)
def corr(offset):
 y=[b[i+offset] for i in indices];return sum(u*v for u,v in zip(x,y))/math.sqrt(xx*sum(v*v for v in y))
best=max(range(-1200,1201,16),key=corr);best=max(range(best-16,best+17),key=corr);score=corr(best);assert score>.95 and abs(best)/24000<.05,(score,best)
checks=[]
if full:
 for c in M['scenes']:
  ix=list(range(c['globalStartFrame']+24000,c['globalEndFrame']-24000,240));xx2=sum(a[i]*a[i] for i in ix);yy=sum(b[i+best]*b[i+best] for i in ix);sc=sum(a[i]*b[i+best] for i in ix)/math.sqrt(xx2*yy);assert sc>.95;checks.append({'id':c['id'],'correlation':sc})
(Q/'soundtrack-verification.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'decodedSHA256':hashlib.sha256(decoded.read_bytes()).hexdigest(),'correlation':score,'offsetSamples':best,'offsetSeconds':best/24000,'perSceneWindows':checks,'method':'Decoded exported AAC compared with approved PCM using deterministic waveform samples and bounded delay search. Lossy AAC is not byte-identical to WAV.','passed':True},indent=2));print(json.dumps({'correlation':score,'offsetSeconds':best/24000}))
