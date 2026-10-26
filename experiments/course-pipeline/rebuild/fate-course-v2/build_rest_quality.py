from pathlib import Path
import json,hashlib,sys
B=Path(__file__).parent;W=B.parents[3];R=W.parent.parent/'rebuild-v2';O=B/'rest-quality-v1';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
source=B/'funded-rest-v1/request.json';generation=load(source);assert len(generation['segments'])==92 and int(sys.argv[1])==40296268513
text(O/'generation-request.json',source.read_text(encoding='utf8'))
parts=[dict(c,checks=['blind','reference'],retainedPasses={},previousAllegations=[],priorEvidence=[]) for c in generation['segments']]
m={'id':'fate-v2-rest-quality-v1','model':'gemini-2.5-flash','newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':184,'reservationUSD':6,'reviewCeilingUSD':6,'sourceRun':int(sys.argv[1]),'sourceHead':'0626cbddf3b334687994f7f8b1e8cea84928d405','sourceArtifactPrefix':'fate-v2-rest-original-','sourceGenerationRequestSHA256':sha(O/'generation-request.json'),'fundingRecord':'production/remaining-budget.en.json','parts':parts,'policy':'Actual originals first. Two bounded strict-schema audio checks per clip; exact same-voice exemplar. CPU ASR clocks are observational only and may run while a clip is held; no render acceptance follows from clock presence.'};save(O/'request.json',m)
core=(B/'audio-review-v3/review_worker.py').read_text(encoding='utf8')
core=core.replace("R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));", "R=Path(__file__).parent;request_file=R/os.environ.get('REVIEW_REQUEST_FILE','request.json');M=json.loads(request_file.read_text(encoding='utf8'));")
core=core.replace("O.mkdir(exist_ok=False)","O.mkdir(exist_ok=True);assert not (O/'attempt.en.json').exists()")
core=core.replace("sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256']","sha(request_file)==os.environ['EXPECTED_REQUEST_SHA256']")
core=core.replace("def get(ref):\n key=", "def get(ref):\n if ref.get('localFile'):\n  f=(R/ref['localFile']).resolve();assert R.resolve() in f.parents and f.is_file() and sha(f)==ref['sha256'];return f\n key=")
text(O/'review_worker.py',core)
prepare='''from pathlib import Path
import os,sys,json,hashlib,subprocess,wave,time,datetime
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(c for c in M['parts'] if c['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and sha(R/'generation-request.json')==M['sourceGenerationRequestSHA256']
assert M['newSpeechCalls']==M['newImageCalls']==0 and M['maxAnalysisCalls']==2*len(M['parts'])==184 and M['reservationUSD']==M['reviewCeilingUSD']==6
source=json.loads((R/'generation-request.json').read_text(encoding='utf8'));expected=next(c for c in source['segments'] if c['id']==C['id']);assert all(C[k]==expected[k] for k in ['spokenText','textSHA256','deliverySHA256','voice','locale','referenceVoice'])
assert hashlib.sha256(C['spokenText'].encode()).hexdigest()==C['textSHA256']
run=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/actions/runs/'+str(M['sourceRun'])]));assert run['head_sha']==M['sourceHead']
state={'id':C['id'],'sourceRun':M['sourceRun'],'sourceHead':M['sourceHead'],'status':'WAITING_FOR_ORIGINAL_ARTIFACT','providerCalls':0,'downloadAttempts':[],'startedUTC':now()};save(O/'preparation.en.json',state)
artifact=M['sourceArtifactPrefix']+C['id'];source_dir=None
for i in range(20):
 d=R/'downloads'/('source-attempt-'+str(i));d.mkdir(parents=True)
 r=subprocess.run(['gh','run','download',str(M['sourceRun']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',artifact,'--dir',str(d)],capture_output=True)
 state['downloadAttempts'].append({'attempt':i+1,'status':'received' if r.returncode==0 else 'not_available_or_read_failed','utc':now()});save(O/'preparation.en.json',state)
 if r.returncode==0:source_dir=d;break
 time.sleep(30)
assert source_dir is not None,'Original artifact unavailable within bounded read-only waiting window; no provider request made'
a=source_dir/(C['id']+'.wav');v=json.loads((source_dir/'verification.json').read_text());attempt=json.loads((source_dir/'attempt.json').read_text());assert str(attempt['runID'])==str(M['sourceRun']) and attempt['commit']==M['sourceHead']
assert sha(a)==v['wavSHA256'] and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts' and v['voice']==C['voice'] and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256']
with wave.open(str(a),'rb') as w:assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(1,2,24000);assert w.getnframes()==v['frames'];pcm=w.readframes(w.getnframes())
assert hashlib.sha256(pcm).hexdigest()==v['pcmSHA256']
ref={'run':M['sourceRun'],'artifact':artifact,'file':a.name,'sha256':sha(a),'localFile':a.relative_to(R).as_posix()};part=dict(C,audio=ref)
review={'id':M['id']+'-'+C['id'],'model':M['model'],'newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':2,'reservationUSD':M['reservationUSD'],'reviewCeilingUSD':M['reviewCeilingUSD'],'artifactPrefix':'fate-v2-rest-review-','parts':[part]};save(R/'runtime-review-request.json',review)
clock={'id':M['id']+'-clock-'+C['id'],'newProviderCalls':0,'parts':[part]};save(R/'clock-request.json',clock)
state.update(status='EXACT_ORIGINAL_VERIFIED_BEFORE_ANY_ANALYSIS',wavSHA256=sha(a),pcmSHA256=v['pcmSHA256'],sourceAudioFrames=v['frames'],durationSeconds=v['durationSeconds'],runtimeReviewSHA256=sha(R/'runtime-review-request.json'),clockRequestSHA256=sha(R/'clock-request.json'),finishedUTC=now());save(O/'preparation.en.json',state)
print(json.dumps({'id':C['id'],'status':state['status'],'seconds':v['durationSeconds']}))
'''
text(O/'prepare.py',prepare)
text(O/'run_review.py', '''from pathlib import Path
import os,sys,subprocess,hashlib
R=Path(__file__).parent;f=R/'runtime-review-request.json';env=dict(os.environ,REVIEW_REQUEST_FILE=f.name,EXPECTED_REQUEST_SHA256=hashlib.sha256(f.read_bytes()).hexdigest());raise SystemExit(subprocess.run([sys.executable,str(R/'review_worker.py'),sys.argv[1]],env=env).returncode)
''')
clock=(B/'observational_clock38.py').read_text(encoding='utf8').replace("R/'request.json'","R/'clock-request.json'").replace("O=R/'output'","O=R/'clock-output'")
start=clock.index("ref=C['audio'];D=");end=clock.index("v=json.loads",start)
clock=clock[:start]+"ref=C['audio'];source=(R/ref['localFile']).resolve();assert R.resolve() in source.parents and sha(source)==ref['sha256'];D=source.parent\n"+clock[end:]
text(O/'observational_clock38.py',clock)
text(O/'run_clock.py','''from pathlib import Path
import os,sys,subprocess,hashlib
R=Path(__file__).parent;f=R/'clock-request.json';env=dict(os.environ,EXPECTED_REQUEST_SHA256=hashlib.sha256(f.read_bytes()).hexdigest());raise SystemExit(subprocess.run([sys.executable,str(R/'observational_clock38.py'),sys.argv[1]],env=env).returncode)
''')
workflow='''name: Fate v2 remaining actual-audio reviews and observational clocks, no synthesis
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/rest-quality-v1/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-rest-quality-v1
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/rest-quality-v1
  EXPECTED_REQUEST_SHA256: REQUESTHASH
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  quality:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 18
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - id: prepare
        name: Receive and bind exact verified original before analysis
        run: python "$PACKAGE/prepare.py" "${{ matrix.part }}"
      - name: Bounded actual blind and source-reference acoustic review
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/run_review.py" "${{ matrix.part }}"
      - name: Retain each diagnostic disposition immediately
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-rest-review-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - name: Install pinned observational clock implementation
        if: always() && steps.prepare.outcome == 'success'
        run: python -m pip install faster-whisper==1.2.1
      - name: Derive observational ASR clock without provider calls
        if: always() && steps.prepare.outcome == 'success'
        run: python "$PACKAGE/run_clock.py" "${{ matrix.part }}"
      - name: Retain each actual clock separately, including held clips
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-rest-clock-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/clock-output/
          retention-days: 30
'''.replace('REQUESTHASH',sha(O/'request.json')).replace('PARTS',json.dumps([p['id'] for p in parts]))
text(W/'.github/workflows/fate-v2-rest-quality.yml',workflow)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
text(O/'README.en.md','''# Remaining actual-audio quality and clock package

Original generation source run40296268513, exact source commit and frozen generation-requestSHA are verified before accepting an artifact. Every originalWAV/PCM/text/delivery/model/voice/frame identity is verified before any paid review. Runtime requests retain the actual source hashes before analysis, so a file name or unfinished generation is not acceptance.

Two bounded strict-schema Gemini2.5Flash checks per92clips,184maximum,8192outputtokens/thinking0;6USD stage reservation from the remaining25USD owner ceiling. No synthesis, image generation, provider fallback or blind retry. Original-availability waits are bounded read-only artifact retrieval only. Reference checks compare actual same-voice accepted3.8 examples; missing structured comparison stays uncertain, never inferred consistent.

The actual-audio reviewer returns per-clip clear/hold, exact identities, raw responses and limits. CPU faster-whisper1.2.1 uses pinned small/small.en model revisions to derive observational word intervals and waveform-supported pause refinements. A held clip may have a clock, but clock presence never passes the audio/render gate. Later speech changes invalidate its exact clock. No text-length timing or rescaling is used. Artifacts are published separately per clip immediately after review and clock stages.
''')
print(json.dumps({'parts':len(parts),'maxAnalysisCalls':184,'reservationUSD':6,'requestSHA256':sha(O/'request.json'),'workerSHA256':sha(O/'review_worker.py')}))
