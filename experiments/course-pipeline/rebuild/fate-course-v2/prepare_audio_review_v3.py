from pathlib import Path
import json,hashlib,datetime
B=Path(__file__).parent;W=B.parents[3];R=W.parent.parent/'rebuild-v2';O=B/'audio-review-v3';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,x):text(p,json.dumps(x,ensure_ascii=False,indent=2)+'\n')
base=load(B/'funded-s02-v2/request.json');parts=[]
# Retain exact valid blind observations even where their non-defect findings require reference adjudication.
plan={'S02-01-ar-EG':(['blind','reference'],[]),'S02-01-en':(['blind','reference'],[]),'S02-02-ar-EG':(['blind','reference'],[]),'S02-02-en':(['blind','reference'],[]),'S02-03-ar-EG':(['reference'],['blind']),'S02-03-en':(['blind','reference'],[]),'S02-04-ar-EG':(['blind','reference'],[]),'S02-04-en':(['reference'],['blind']),'S02-05-ar-EG':(['blind','reference'],[]),'S02-05-en':(['reference'],['blind'])}
for s in base['segments']:
 sid=s['id'];d=R/'production/funded-s02-v2/artifacts'/('fate-v2-funded-original-'+sid);a=d/(sid+'.wav');v=load(d/'verification.json');assert sha(a)==v['wavSHA256']
 review=R/'production/funded-s02-v2/artifacts'/('fate-v2-funded-review-'+sid);checks,retain=plan[sid]
 retained={};allegations=[];prior=[]
 for f in sorted(review.rglob('*.analysis.json')):
  x=load(f);mode='blind' if '-blind.' in f.name else 'reference';prior.append({'run':40291770716,'artifact':review.name,'file':f.relative_to(review).as_posix(),'sha256':sha(f)})
  if mode in retain:
   assert x['validation']['validForReview'];retained[mode]={'run':40291770716,'artifact':review.name,'file':f.relative_to(review).as_posix(),'sha256':sha(f)}
  if 'reference' in checks:
   for n,item in enumerate(x.get('findings',[])):
    allegations.append({'id':mode+'-'+str(n),'sourceFile':f.name,'previousRangeValid':x['validation']['validForReview'],'allegation':item})
 assert set(retained)==set(retain),(sid,retained)
 item=dict(s,audio={'run':40291770716,'artifact':d.name,'file':a.name,'sha256':sha(a)},checks=checks,retainedPasses=retained,previousAllegations=allegations,priorEvidence=prior)
 if sid=='S02-02-ar-EG':item['targetedQuestions']=['Near the hypothetical one-day menu sentence, does the actual sound support قائمة أكل or قيمة أكل, another word, or is it acoustically uncertain? Do not pick an answer solely from the expected script; distinguish ASR spelling confusion from an actual word substitution.']
 parts.append(item)
calls=sum(len(p['checks']) for p in parts);assert calls==17
m={'id':'fate-v2-s02-audio-review-v3','model':'gemini-2.5-flash','newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':calls,'reservationUSD':.8,'reviewCeilingUSD':.8,'sourceRun':40291770716,'fundingRecord':'production/remaining-budget.en.json','repairReason':'Invalid/truncated2.5Flash diagnostics and criterion hallucinations, not damaged speech. Preserve all originals and raw old reports.','parts':parts,'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()};save(O/'request.json',m)
w='''name: Fate v2 S02 bounded audio-review repair, preserve all original speech
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/audio-review-v3/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-s02-audio-review-v3
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/audio-review-v3
  EXPECTED_REQUEST_SHA256: REQUESTHASH
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  review:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 12
    strategy:
      fail-fast: false
      max-parallel: 5
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Reuse valid exact checks, repair only missing or invalid diagnostics
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/review_worker.py" "${{ matrix.part }}"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-audio-review-v3-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''.replace('REQUESTHASH',sha(O/'request.json')).replace('PARTS',json.dumps([p['id'] for p in parts]))
text(W/'.github/workflows/fate-v2-audio-review-v3.yml',w)
compile((O/'review_worker.py').read_text(encoding='utf8'),str(O/'review_worker.py'),'exec')
text(O/'README.en.md','''# Review-only repair and reusable actual-audio reviewer

This package never synthesizes or changes original speech. Its source recordings are pinned to actual run40291770716 with WAV/text/delivery/model/voice identities, and same-voice3.8 owner-approved examples from run40253957942. Seventeen diagnostic calls maximum,0.80USD reservation, no automatic retry. The valid clear S02-05-en blind check is reused; its old reference result and the S02-01-en reference result remain preserved as prior evidence, while two new bounded reference checks explicitly document same-voice observations. Valid blind observations for S02-03-ar/S02-04-en remain preserved while their allegations are separately adjudicated. A missing structured voice observation is never converted into a consistency assertion.

The reusable CLI is `python review_worker.py PART_ID` beside a frozen `request.json` with `model`, `maxAnalysisCalls`, `reservationUSD`, `reviewCeilingUSD`, `parts`, `newSpeechCalls=0`, `newImageCalls=0`, `automaticRetries=0`. Each part supplies `id`, `locale`, `voice`, `spokenText`, `textSHA256`, `deliverySHA256`, `audio` and `referenceVoice` artifact refs (`run/artifact/file/sha256`), `checks` (`blind`, `reference`), `retainedPasses`, `previousAllegations`, optional `targetedQuestions`. New untouched clips use both checks and empty retained/allegation fields. Required env: EXPECTED_REQUEST_SHA256,GITHUB_RUN_ATTEMPT=1,GITHUB_RUN_ID,GITHUB_SHA,GITHUB_REPOSITORY,GH_TOKEN,GEMINI_API_KEY. Secrets remain onActions.

`output/review-disposition.en.json` reports clear, invalid_diagnostic_hold or needs_adjudication, all bound to exact originalWAV/PCM and source hashes. A clear disposition is scoped machine qualification, never native/human listening acceptance. The reviewer rejects incorrect criteria, invented word omissions, normal Egyptian/English variants and ordinary clause pauses as faults. Actual unresolved speech differences remain held, including the targeted Arabicقائمة/قيمة question; no preferred answer is fabricated.
''')
print(json.dumps({'parts':len(parts),'maxCalls':calls,'reservationUSD':.8,'requestSHA256':sha(O/'request.json'),'workerSHA256':sha(O/'review_worker.py')}))
