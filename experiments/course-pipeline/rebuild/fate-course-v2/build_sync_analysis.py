from batch_common import *
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'sync-first38';T.mkdir(exist_ok=False)
full=json.loads((B/'media-s01-voice38/request.json').read_text(encoding='utf8'));proof=json.loads((R/'production/voice38-proof-v1/owner-acceptance.en.json').read_text(encoding='utf8'))
M={'id':'fate-v2-s01-sync-first38-v1','speechModel':'gemini-3.8-flash-tts','adjudicationModel':'gemini-2.5-flash','timingModel':'gemini-2.5-flash','automaticRetries':0,'maxAnalysisCalls':4,'newSpeechCalls':0,'ownerCeilingUSD':25,'additionalReservationUSD':0.4,'parts':[]}
for locale in ['ar-EG','en']:
 id='S01-01-'+locale;p=R/'production/FATE2-S01-voice38-v1/artifacts'/('fate-v2-full38-original-'+id);v=json.loads((p/'verification.json').read_text(encoding='utf8'));c=next(x for x in full['segments'] if x['id']==id);ref=next(x for x in proof['files'] if x['id']==('AR-Charon' if locale=='ar-EG' else 'EN-Charon'))
 actions=[{'id':'sample-result','label':{'ar':'نتيجة العيّنة','en':'Sample result'},'meaning':'The actual laboratory finding concerns what was measured in a pepper sample.'},{'id':'exposure','label':{'ar':'التعرّض: طريق وكمّية ومدّة','en':'Exposure: route, amount, duration'},'meaning':'Exposure concerns who encountered the substance and how, how much and how long.'},{'id':'risk-evidence','label':{'ar':'نربط دليل الضرر بدليل التعرّض','en':'Connect effect and exposure evidence'},'meaning':'Risk assessment relates hazard/effect evidence to exposure; no poisoning diagnosis from a pesticide name.'}]
 M['parts'].append(dict(c,model=M['speechModel'],audio={'run':40254395212,'artifact':'fate-v2-full38-original-'+id,'file':id+'.wav','sha256':v['wavSHA256']},durationSeconds=v['durationSeconds'],audioFrames=v['frames'],voiceReference={'run':40253957942,'artifact':'fate-v2-voice38-original-'+ref['id'],'file':ref['id']+'.wav','sha256':ref['wavSHA256']},actions=actions,reviewConcerns=[{'issue':'Complete exact-reference check needed before sync; an initial reviewer response can be truncated by its thinking/output cap. This is a diagnostic gap, not a finding of bad speech.','required':'Judge actual full recording against reference and accepted same-voice sample; no forced MSA ta-marbuta or mandatory qaf.'}]))
def put(n,value):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2)+'\n')
put('request.json',M)
worker=(W/'experiments/course-pipeline/rebuild/fate-L02-L07-bilingual-v1/analysis-L02/worker.py').read_text(encoding='utf8')
worker=worker.replace("'temperature':0,'responseMimeType':'application/json'","'temperature':0,'responseMimeType':'application/json','maxOutputTokens':8192,'thinkingConfig':{'thinkingBudget':0}")
worker=worker.replace("import json,sys,os,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave","import json,sys,os,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave,array,math")
worker=worker.replace("report={'id':sid", """# Reject fraction-normalised or badly truncated cue clocks against actual acoustic support.
with wave.open(str(source),'rb') as af:
 rate=af.getframerate();samples=array.array('h',af.readframes(af.getnframes()))
if sys.byteorder!='little':samples.byteswap()
last=0.0
for i in range(0,len(samples),480):
 block=samples[i:i+480]
 if block and math.sqrt(sum(x*x for x in block)/len(block))>180:last=min(duration,(i+len(block))/rate)
ends=[x.get('end',0) for x in t.get('words',[]) if isinstance(x.get('end'),(int,float))]
if not ends or max(ends)<last-2:problems.append('word clock ends before measured voiced support')
save('acoustic-clock-check.json',{'measuredDuration':duration,'lastAboveThresholdWindowEnd':last,'thresholdRMS':180,'windowFrames':480,'wordClockEnd':max(ends) if ends else None,'limits':'Energy check rejects obvious normalised clocks; it is not phoneme alignment.'})
report={'id':sid""")
put('worker.py',worker)
sha=hashlib.sha256((T/'request.json').read_bytes()).hexdigest();pkg=T.relative_to(W).as_posix()
wf=f'''name: Fate v2 first3.8 acoustic review and timing
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{pkg}/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: {pkg}
  EXPECTED_REQUEST_SHA256: {sha}
  GH_TOKEN: ${{{{ github.token }}}}
jobs:
  acoustic:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 12
    strategy:
      fail-fast: false
      max-parallel: 2
      matrix:
        part: [S01-01-ar-EG, S01-01-en]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Review exact original and derive actual acoustic word/action cues
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/worker.py" request "${{{{ matrix.part }}}}"
      - name: Receive each validated result immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-sync38-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-sync-first38.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
save('media-plan/FATE2-S01/sync-first38-request.en.json',M)
print('Prepared two exact-recording sample analyses: four bounded calls, zero new speech, acoustic clock validation.')
