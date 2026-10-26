from batch_common import *
import shutil
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'render-first38-en';T.mkdir(exist_ok=False)
M=json.loads((B/'render-first38-ar/request.json').read_text(encoding='utf8'));v=json.loads((R/'production/FATE2-S01-voice38-v1/artifacts/fate-v2-full38-original-S01-01-en/verification.json').read_text(encoding='utf8'));c=json.loads((B/'media-s01-voice38/request.json').read_text(encoding='utf8'));c=next(x for x in c['segments'] if x['id']=='S01-01-en')
M['id']='fate-v2-first38-en-sync-sample-v1';M['scene'].update(id='FateV2S01EnglishSample',locale='en',title='What does a sample result establish?',audio={'run':40254395212,'artifact':'fate-v2-full38-original-S01-01-en','file':'S01-01-en.wav','sha256':v['wavSHA256']},audioFrames=v['frames'],textSHA256=c['textSHA256'],deliverySHA256=c['deliverySHA256'],alignment={'run':0,'artifact':'fate-v2-en-refined-clock38','file':'timing.json','sha256':'Actual validated clock-job output; resolved at runtime, not an invented hash.'})
M['clockRepair']='Two zero-duration ASR word starts after sentence pauses require actual-waveform onset refinement; preserve original ASR and invalid Gemini clocks. No rescaling, no altered speech.'
def put(n,x):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False,indent=2)+'\n')
put('request.json',M)
for n in ['package.json','package-lock.json','render.cjs']:shutil.copyfile(B/'render-first38-ar'/n,T/n)
scene=(B/'render-first38-ar/Scene.tsx').read_text(encoding='utf8').replace('Connect effect and exposure evidence','Effect evidence + exposure evidence')
put('Scene.tsx',scene)
prepare=(B/'render-first38-ar/prepare.py').read_text(encoding='utf8').replace("timing=get(C['alignment'],'timing');", "alignmentRef=dict(C['alignment']);alignmentRef.update(run=int(os.environ['GITHUB_RUN_ID']),sha256=os.environ['EXPECTED_TIMING_SHA256']);assert re.fullmatch('[0-9a-f]{64}',alignmentRef['sha256']);timing=get(alignmentRef,'timing');")
put('prepare.py',prepare)
put('refine_clock.py','''from pathlib import Path
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
(O/'timing.json').write_text(json.dumps(t,ensure_ascii=False,indent=2)+'\\n');(O/'refinements.en.json').write_text(json.dumps({'sourceAudioSHA256':sha(source.read_bytes()),'durationSeconds':duration,'refinements':refinements,'newSpeechCalls':0,'noTimeScaling':True},indent=2)+'\\n')
V.update(timingProblems=problems,readyForRenderReview=not problems,method=t['method'],previousInvalidClockPreserved='previous/timing.json');(O/'verification.json').write_text(json.dumps(V,indent=2)+'\\n')
assert not problems
h=sha((O/'timing.json').read_bytes())
with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('timing_sha256='+h+'\\n')
print(json.dumps({'timingSHA256':h,'refinements':refinements,'durationSeconds':duration}))
''')
pkg=T.relative_to(W).as_posix();h=hashlib.sha256((T/'request.json').read_bytes()).hexdigest()
wf=f'''name: Fate v2 first English3.8 synchronized sample
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{pkg}/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: {pkg}
  EXPECTED_REQUEST_SHA256: {h}
  GH_TOKEN: ${{{{ github.token }}}}
jobs:
  clock:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 8
    outputs:
      timing_sha256: ${{{{ steps.clock.outputs.timing_sha256 }}}}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Refine only unresolved word onsets from actual waveform
        id: clock
        run: python "$PACKAGE/refine_clock.py"
      - name: Preserve original clocks and actual refinement
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-en-refined-clock38
          path: ${{{{ env.PACKAGE }}}}/clock-output/
          retention-days: 30
  sample:
    needs: clock
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    env:
      EXPECTED_TIMING_SHA256: ${{{{ needs.clock.outputs.timing_sha256 }}}}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify exact originals and actual validated cue identity
        run: python "$PACKAGE/prepare.py"
      - name: Install pinned existing renderer dependencies
        working-directory: {pkg}
        run: npm ci --no-audit --no-fund
      - name: Render explanatory checkpoints
        run: node "$PACKAGE/render.cjs" stills
      - name: Deliver each visible checkpoint immediately
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-en-sync38-stills
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Render only bounded English sample
        run: |
          command -v ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y ffmpeg)
          node "$PACKAGE/render.cjs" video
      - name: Deliver completed sample immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-en-sync38-sample
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-render-first38-en.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
save('media-plan/FATE2-S01/en-sync-render-request.en.json',M)
print('Prepared English sample with actual waveform refinement, no timing rescale, no speech generation.')
