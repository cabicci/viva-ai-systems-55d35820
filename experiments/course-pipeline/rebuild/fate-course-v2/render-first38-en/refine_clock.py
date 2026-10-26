from pathlib import Path
import json,os,subprocess,hashlib,wave,array,math,re,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());O=R/'clock-output';O.mkdir(exist_ok=False);sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'] and M['sampleAuthorized'] and not M['fullLessonRenderAllowed']
prev=O/'previous';prev.mkdir();subprocess.run(['gh','run','download','40255276594','--repo',os.environ['GITHUB_REPOSITORY'],'--name','fate-v2-english-clock38','--dir',str(prev)],check=True,capture_output=True)
V=json.loads((prev/'verification.json').read_text());t=json.loads((prev/'timing.json').read_text());source=prev/'original/S01-01-en.wav';assert sha(source.read_bytes())==M['scene']['audio']['sha256']==V['audioSHA256'];assert t['referenceAgreement']>=.99 and V['reviewStatus']=='clear'
with wave.open(str(source),'rb') as f:
 rate=f.getframerate();assert (rate,f.getnchannels(),f.getsampwidth())==(24000,1,2);samples=array.array('h',f.readframes(f.getnframes()));duration=f.getnframes()/rate
if __import__('sys').byteorder!='little':samples.byteswap()
words=t['words'];refinements=[];win=240;threshold=180
for i,w in enumerate(words):
 if w['start']!=w['end']:continue
 assert i>0 and i+1<len(words)
 a=words[i-1]['end'];b=words[i+1]['start'];assert b==w['end'] and .2<b-a<2.5
 blocks=[]
 for frame in range(round(a*rate),round(b*rate),win):
  chunk=samples[frame:min(frame+win,round(b*rate))];rms=math.sqrt(sum(x*x for x in chunk)/len(chunk));blocks.append((frame/rate,(frame+len(chunk))/rate,rms))
 quiet=[];start=None
 for j,(x,y,rms) in enumerate(blocks+[(b,b,999999)]):
  if rms<threshold and start is None:start=j
  if rms>=threshold and start is not None:
   q0=blocks[start][0];q1=x
   if q1-q0>=.12 and b-q1>=.08:quiet.append((q0,q1))
   start=None
 assert quiet,'No defensible sentence-pause onset; do not invent timing'
 q0,onset=max(quiet,key=lambda q:q[1]-q[0]);assert a<=onset<b
 voiced=[z for x,y,z in blocks if x>=onset and y<=b];assert voiced and max(voiced)>threshold*2
 refinements.append({'word':w['word'],'originalZeroStart':w['start'],'originalZeroEnd':w['end'],'refinedStart':onset,'retainedNextWordBoundaryEnd':b,'actualQuietInterval':[q0,onset],'RMSthreshold':threshold,'windowFrames':win,'method':'Onset after measured inter-sentence quiet interval in actual WAV; end remains adjacent ASR boundary. Approximate, not phoneme alignment.'})
 w['start']=onset;w['onsetMethod']='actual-waveform-sentence-onset';w['onsetWindowSeconds']=win/rate
assert len(refinements)==2
problems=[];prevStart=-1
for w in words:
 if not 0<=w['start']<w['end']<=duration+.05 or w['start']<prevStart-.05:problems.append('unresolved word interval')
 prevStart=w['start']
tokens=[re.sub('[^a-z0-9]','',w['word'].lower()) for w in words]
for action in t['actions']:
 if action['id']=='exposure':
  i=tokens.index('exposure');action['start']=words[i]['start'];action['uncertaintySeconds']=.5
captions=[]
for i in range(0,len(words),9):
 c=words[i:i+9];captions.append({'text':' '.join(w['word'] for w in c),'start':c[0]['start'],'end':c[-1]['end']})
t.update(words=words,captions=captions,issues=problems,method='Actual-WAV faster-whisper word timestamps plus measured waveform onset refinement for two sentence-initial zero intervals; no clock scaling or text-duration estimates.')
(O/'timing.json').write_text(json.dumps(t,ensure_ascii=False,indent=2)+'\n');(O/'refinements.en.json').write_text(json.dumps({'sourceAudioSHA256':sha(source.read_bytes()),'durationSeconds':duration,'refinements':refinements,'newSpeechCalls':0,'noTimeScaling':True},indent=2)+'\n')
V.update(timingProblems=problems,readyForRenderReview=not problems,method=t['method'],previousInvalidClockPreserved='previous/timing.json');(O/'verification.json').write_text(json.dumps(V,indent=2)+'\n')
assert not problems
h=sha((O/'timing.json').read_bytes())
with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('timing_sha256='+h+'\n')
print(json.dumps({'timingSHA256':h,'refinements':refinements,'durationSeconds':duration}))
