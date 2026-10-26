"""Freeze actual held evidence; prepare Actions-only narrow checks, never synthesis."""
from pathlib import Path
import json,hashlib
B=Path(__file__).parent
R=B.parents[5]/'rebuild-v2'
P=B/'rest-voice-recheck-v1';P.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,x):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
old=json.loads((B/'rest-quality-v1/request.json').read_text(encoding='utf8'))
parts=[]
for c in old['parts']:
 d=R/'production/rest-quality-v1/artifacts'/('fate-v2-rest-review-'+c['id'])
 disp=json.loads((d/'review-disposition.en.json').read_text(encoding='utf8'))
 if disp['status']=='clear':continue
 response=json.loads((d/'reference-response.en.json').read_text(encoding='utf8'))
 obj=json.loads(''.join(p.get('text','') for p in response['candidates'][0]['content']['parts'] if not p.get('thought')))
 special=c['id']=='S11-05-ar-EG'
 if not special:
  assert response['candidates'][0]['finishReason']=='STOP' and response['modelVersion']=='gemini-2.5-flash'
  assert not obj['findings'] and not obj['uncertainties'] and not obj['previousAllegationReview'] and obj['voiceObservation']['comparison']=='not_compared'
  blind=json.loads((d/'blind-analysis.en.json').read_text(encoding='utf8'));assert blind['validation']['validForReview'] and not blind['findings'] and not blind['uncertainties']
 aroot=R/'production/funded-rest-v1/artifacts'/('fate-v2-rest-original-'+c['id']);a=aroot/(c['id']+'.wav');assert sha(a)==disp['sourceAudioSHA256']
 ref=c['referenceVoice'];br=R/'production/voice38-proof-v1/artifacts'/ref['artifact'];assert sha(br/ref['file'])==ref['sha256']
 files=['review-disposition.en.json','blind-analysis.en.json','reference-response.en.json']
 parts.append(dict(c,mode='targeted_adjudication' if special else 'voice_only',audio={'run':40296268513,'artifact':aroot.name,'file':a.name,'sha256':sha(a)},sourceVerificationSHA256=sha(aroot/'verification.json'),referenceVerificationSHA256=sha(br/'verification.json'),priorEvidence=[{'run':40300477367,'artifact':d.name,'file':f,'sha256':sha(d/f)} for f in files],sourceAudioSHA256=sha(a),sourcePCM_SHA256=disp['sourcePCM_SHA256'],durationSeconds=disp['durationSeconds']))
assert len(parts)==14 and sum(c['mode']=='voice_only' for c in parts)==13
req={'id':'fate-v2-rest-voice-recheck-v1','model':'gemini-2.5-flash','newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':15,'reservationUSD':0.70,'reviewCeilingUSD':0.70,'sourceHead':old['sourceHead'],'sourceRun':40296268513,'priorReviewRun':40300477367,'parts':parts,'workerSHA256':sha(P/'worker.py'),'adjudicatorSHA256':sha(P/'adjudicator.py'),'policy':'13 one-call labelled actual-voice comparisons; one separate two-pass adjudication of actual S11-05ar. No speech repair or inferred voice match; retain raw invalid reports. No native/human acceptance.'}
save(P/'request.json',req)
ids=json.dumps([c['id'] for c in parts]);pin=sha(P/'request.json')
wf=f'''name: Fate v2 narrow actual-voice checks and one speech adjudication
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/rest-voice-recheck-v1/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-rest-voice-recheck-v1
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/rest-voice-recheck-v1
  EXPECTED_REQUEST_SHA256: {pin}
  GH_TOKEN: ${{{{ github.token }}}}
  PYTHONUNBUFFERED: '1'
jobs:
  narrow-check:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 12
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        part: {ids}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify originals and review only the unresolved acoustic question
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/worker.py" "${{{{ matrix.part }}}}"
      - name: Preserve each diagnostic immediately including held or invalid checks
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-rest-voice-recheck-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (B.parents[3]/'.github/workflows/fate-v2-rest-voice-recheck.yml').open('w',encoding='utf8',newline='\n') as f:f.write(wf)
save(P/'freeze-pins.en.json',{'requestSHA256':pin,'workerSHA256':sha(P/'worker.py'),'adjudicatorSHA256':sha(P/'adjudicator.py'),'maxPaidCalls':15,'reservationUSD':.70,'parts':len(parts),'noGitMutation':True})
print(json.dumps({'requestSHA256':pin,'parts':len(parts),'calls':15,'reservationUSD':.70}))
