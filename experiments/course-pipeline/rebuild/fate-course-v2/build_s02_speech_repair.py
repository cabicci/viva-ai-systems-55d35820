from pathlib import Path
import json,hashlib,shutil,datetime
B=Path(__file__).parent;W=B.parents[3];R=W.parent.parent/'rebuild-v2';O=B/'s02-speech-repair-v1';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
proposal=load(B/'audio-review-v3/s02-repair-proposal.en.json');assert proposal['voice']=='Kore' and proposal['newTextSHA256']=='43f1d756ab71cc82ff480caf5b9d1e4e075a6a428331fb83b3e686fe13c4701f'
L=R/'lessons/FATE2-S02/lesson.public.json';assert sha(L)=='3523308853b56ec0b878e5899940b2e97b17f420b23ba4f44f5522e1cb30be2f'
old=load(B/'funded-s02-v2/request.json');source=next(c for c in old['segments'] if c['id']=='S02-02-ar-EG');assert source['textSHA256']==proposal['originalTextSHA256']
draft_file=R/'media-plan/FATE2-S02/spoken-draft.en.json';script=R/'media-plan/FATE2-S02/script.ar.md';draft=load(draft_file);part=next(c for c in draft['parts'] if c['sectionID']=='equation' and c['locale']=='ar-EG');assert part['textSHA256']==source['textSHA256'] and part['spokenText']==source['spokenText']
old_wav=R/'production/funded-s02-v2/artifacts/fate-v2-funded-original-S02-02-ar-EG/S02-02-ar-EG.wav';assert sha(old_wav)==proposal['sourceAudio']['sha256']
before={p.relative_to(R).as_posix():sha(p) for p in [draft_file,script]};H=R/'history/before-S02-02-ar-speech-repair';H.mkdir(exist_ok=False)
for p in [draft_file,script]:dest=H/p.relative_to(R);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
part['spokenText']=proposal['newSpokenText'];part['textSHA256']=proposal['newTextSHA256'];draft['updatedUTC']=now;draft['status']='one_source_bound_spoken_repair_waiting_actual_audio';save(draft_file,draft)
s=script.read_text(encoding='utf8');assert s.count(source['spokenText'])==1;text(script,s.replace(source['spokenText'],proposal['newSpokenText']))
for n in ['method-approval.en.json','budget-authorization.en.json']:
 f=B/'funded-s02-v2'/n;text(O/n,f.read_text(encoding='utf8'))
c=dict(source,id='S02-02-ar-EG-r1',originalPartID=source['id'],spokenText=proposal['newSpokenText'],textSHA256=proposal['newTextSHA256'],sourceRepair='One full coherent passage; avoid misleading قائمة/قيمة real substitution, not isolated word generation.')
c['requestFingerprintSHA256']=hashlib.sha256(json.dumps({'model':'gemini-3.8-flash-tts','voice':c['voice'],'locale':c['locale'],'spokenText':c['spokenText'],'delivery':c['delivery']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
m={'id':'fate-v2-s02-speech-repair-v1','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':1,'maxSpeechOutputTokens':4096,'maxAnalysisCalls':2,'providerReservationUSD':.20,'remainingPathCeilingUSD':25,'methodApprovalSHA256':sha(O/'method-approval.en.json'),'budgetAuthorizationSHA256':sha(O/'budget-authorization.en.json'),'retained':[],'segments':[c],'supersededAudio':proposal['sourceAudio'],'repairEvidence':proposal['actualReviewEvidence'],'authorizedScope':'One fullS02equationArabicKore passage, two actual-audio checks and one observational CPUclock; other9originals/clocks unchanged.'};save(O/'request.json',m)
g=(B/'funded-s02-v2/generate.py').read_text(encoding='utf8').replace("M['maxSpeechCalls']==len(M['segments'])==10","M['maxSpeechCalls']==len(M['segments'])==1");text(O/'generate.py',g)
core=(B/'rest-quality-v1/review_worker.py').read_text(encoding='utf8').replace("O=R/'output'","O=R/'review-output'")
text(O/'review_worker.py',core)
clock=(B/'rest-quality-v1/observational_clock38.py').read_text(encoding='utf8');text(O/'observational_clock38.py',clock)
prepare='''from pathlib import Path
import os,json,sys,hashlib,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=M['segments'][0];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and len(M['segments'])==M['maxSpeechCalls']==1
source=R/'output'/(C['id']+'.wav');v=json.loads((source.parent/'verification.json').read_text());assert sha(source)==v['wavSHA256'] and v['textSHA256']==C['textSHA256'] and v['deliverySHA256']==C['deliverySHA256'] and v['voice']=='Kore' and v['model']==v['returnedModelVersion']=='gemini-3.8-flash-tts'
with wave.open(str(source),'rb') as f:assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);assert f.getnframes()==v['frames']
ref={'run':int(os.environ['GITHUB_RUN_ID']),'artifact':'fate-v2-s02-repair-original-'+C['id'],'file':source.name,'sha256':sha(source),'localFile':source.relative_to(R).as_posix()};part=dict(C,audio=ref,checks=['blind','reference'],retainedPasses={},previousAllegations=[],priorEvidence=M['repairEvidence'])
review={'id':M['id']+'-review','model':M['analysisModel'],'newSpeechCalls':0,'newImageCalls':0,'automaticRetries':0,'maxAnalysisCalls':2,'reservationUSD':.20,'reviewCeilingUSD':.20,'artifactPrefix':'fate-v2-s02-repair-review-','parts':[part]}
clock={'id':M['id']+'-clock','newProviderCalls':0,'parts':[part]}
for n,x in [('runtime-review-request.json',review),('clock-request.json',clock)]: (R/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
(R/'output/quality-binding.en.json').write_text(json.dumps({'audio':ref,'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'reviewRequestSHA256':sha(R/'runtime-review-request.json'),'clockRequestSHA256':sha(R/'clock-request.json')},indent=2))
''';text(O/'prepare_quality.py',prepare)
for n in ['run_review.py','run_clock.py']:text(O/n,(B/'rest-quality-v1'/n).read_text(encoding='utf8'))
workflow='''name: Fate v2 one coherent S02 Arabic speech repair, preserve other9originals
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/s02-speech-repair-v1/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-s02-speech-repair-v1
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/s02-speech-repair-v1
  EXPECTED_REQUEST_SHA256: REQUESTHASH
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  repair:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - id: generate
        name: Preserve exactly one complete coherent Kore passage
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/generate.py" S02-02-ar-EG-r1
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-s02-repair-original-S02-02-ar-EG-r1
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - id: prepare
        name: Bind new original to review and clock requests
        run: python "$PACKAGE/prepare_quality.py"
      - name: Two bounded actual-audio checks with accepted Kore exemplar
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/run_review.py" S02-02-ar-EG-r1
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-s02-repair-review-S02-02-ar-EG-r1
          path: ${{ env.PACKAGE }}/review-output/
          retention-days: 30
      - name: Install pinned observational clock implementation
        if: always() && steps.prepare.outcome == 'success'
        run: python -m pip install faster-whisper==1.2.1
      - name: Derive only this changed passage clock
        if: always() && steps.prepare.outcome == 'success'
        run: python "$PACKAGE/run_clock.py" S02-02-ar-EG-r1
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-s02-repair-clock-S02-02-ar-EG-r1
          path: ${{ env.PACKAGE }}/clock-output/
          retention-days: 30
'''.replace('REQUESTHASH',sha(O/'request.json'))
text(W/'.github/workflows/fate-v2-s02-speech-repair.yml',workflow)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
save(R/'media-plan/FATE2-S02/S02-02-ar-speech-repair.en.json',{'utc':now,'scope':m['authorizedScope'],'proposal':'Worktrees/actor-0c0df2131ade371ac908/experiments/course-pipeline/rebuild/fate-course-v2/audio-review-v3/s02-repair-proposal.en.json','before':before,'after':{p.relative_to(R).as_posix():sha(p) for p in [draft_file,script]},'oldAudioPreserved':proposal['sourceAudio'],'newTextSHA256':c['textSHA256'],'voice':c['voice'],'model':m['model'],'newAudioStatus':'not_generated_yet','writtenLessonSHA256Unchanged':sha(L),'other9AudioAndClocks':'preserved, their exact reviewed identities remain unchanged','clockPolicy':'Only oldS02-02ar clock is stale for a new repaired recording; derive a new actual clock after generation.','newProviderReservationUSD':.20,'rootDispatchRequired':True})
print(json.dumps({'requestSHA256':sha(O/'request.json'),'newTextSHA256':c['textSHA256'],'voice':c['voice'],'parts':1,'checks':2,'sourceLessonUnchanged':True}))
