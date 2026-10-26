from pathlib import Path
import json,hashlib,shutil,sys
R=Path(sys.argv[1]);B=Path(__file__).parent;W=B.parents[3];O=B/'funded-s02-v1';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,v):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
fund=load(R/'production/remaining-budget.en.json');assert fund['ceiling']==25 and fund['ownerAnswer']=='اعتمد 25 دولارًا لباقي المسار'
pre=load(B/'s02-preflight-v1/preflight.en.json');approval=R/'production/voice38-proof-v1/owner-acceptance.en.json';shutil.copyfile(approval,O/'method-approval.en.json');shutil.copyfile(R/'production/remaining-budget.en.json',O/'budget-authorization.en.json')
segments=[]
for p in pre['parts']:
 proof=('AR' if p['locale']=='ar-EG' else 'EN')+'-'+p['voice'];f=R/'production/voice38-proof-v1/artifacts'/('fate-v2-voice38-original-'+proof)/(proof+'.wav')
 segments.append(dict(p,semanticID=p['sectionID'],scene=int(p['id'].split('-')[1]),referenceVoice={'run':40253957942,'artifact':'fate-v2-voice38-original-'+proof,'file':f.name,'sha256':sha(f)}))
m={'id':'fate-v2-funded-s02-v1','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':len(segments),'maxAnalysisCalls':len(segments)*2,'maxSpeechOutputTokens':4096,'maxReviewOutputTokens':4096,'methodApprovalSHA256':sha(O/'method-approval.en.json'),'budgetAuthorizationSHA256':sha(O/'budget-authorization.en.json'),'providerReservationUSD':1.75,'remainingPathCeilingUSD':25,'retained':[],'segments':segments}
save(O/'request.json',m)
g=(B/'media-s01-voice38/generate.py').read_text(encoding='utf8')
g=g.replace("M['maxSpeechCalls']==len(M['segments'])==12","M['maxSpeechCalls']==len(M['segments'])==10")
g=g.replace("'maxOutputTokens':8192","'maxOutputTokens':M['maxSpeechOutputTokens']")
g=g.replace("state={'id':sid", "assert M['maxSpeechOutputTokens']==4096 and sha((R/'budget-authorization.en.json').read_bytes())==M['budgetAuthorizationSHA256']\nstate={'id':sid")
g=g.replace("PRESERVED_FOR_NEW_METHOD_LISTENING","ORIGINAL_PRESERVED_METHOD_ALREADY_ACCEPTED_NEW_CLIP_REVIEW_PENDING")
g=g.replace("assert result.get('modelVersion','').startswith(M['model']), 'Unexpected returned model'", "assert result.get('modelVersion')==M['model'], 'Unexpected returned model'\n assert result['candidates'][0].get('finishReason')=='STOP', 'Incomplete generation retained, no retry'")
text(O/'generate.py',g)
a=(B/'media-s01-voice38/audio_review_worker.py').read_text(encoding='utf8').replace("'maxOutputTokens':2048","'maxOutputTokens':4096,'thinkingConfig':{'thinkingBudget':0}")
a=a.replace("res=api(payload);save(ident+'.response.json',res);obj=", "res=api(payload);save(ident+'.response.json',res);assert res['candidates'][0].get('finishReason')=='STOP','Incomplete review JSON is a diagnostic defect';obj=")
needle="state={'schemaVersion':1"
a=a.replace(needle,"referenceVoice=R/'reference-voice.wav'\nassert referenceVoice.exists() and sha(referenceVoice.read_bytes())==M['referenceVoiceSHA256']\n"+needle)
needle="res=api(payload);save(ident+'.response.json',res);assert"
a=a.replace(needle,"if mode=='reference':\n    payload['contents'][0]['parts'][0]['text']+=' The FIRST audio is the only target to transcribe and diagnose. The SECOND audio is an owner-approved same-voice delivery exemplar, unrelated spoken content: compare stable voice/timbre cautiously and flag only a clear audible mismatch, never treat its different words as omissions. No human listening approval may be inferred.'\n    payload['contents'][0]['parts'].append({'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(referenceVoice.read_bytes()).decode()}})\n   "+needle)
text(O/'audio_review_worker.py',a)
review=(B/'media-s01-voice38/review.py').read_text(encoding='utf8')
review=review.replace("m={'locale':", "ref=C['referenceVoice'];dest=R/'reference-download';dest.mkdir();subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(dest)],check=True,capture_output=True);rf=dest/ref['file'];assert hashlib.sha256(rf.read_bytes()).hexdigest()==ref['sha256'];shutil.copyfile(rf,Q/'reference-voice.wav')\nm={'referenceVoiceSHA256':ref['sha256'],'locale':")
review=review[:review.index("summary={'status'")]+'''findings=[];uncertain=[];valid=r.returncode==0
for f in (Q/'output/flash').glob('*.analysis.json'):
 x=json.loads(f.read_text());valid=valid and x['validation']['validForReview'];findings.extend(dict(item,reviewFile=f.name) for item in x.get('findings',[]));uncertain.extend(dict(item,reviewFile=f.name) for item in x.get('uncertainSpans',[]))
status='clear' if valid and not findings and not uncertain else 'needs_adjudication' if valid else 'invalid_diagnostic_hold'
summary={'status':status,'reviewExitCode':r.returncode,'findings':findings,'uncertainSpans':uncertain,'humanListeningApproved':False,'sourceAudioSHA256':v['wavSHA256'],'referenceVoiceSHA256':ref['sha256'],'methodAlreadyOwnerAccepted':True,'limits':'Actual audio machine qualification and same-voice exemplar comparison are not native-accent or human playback certification. No speech regeneration for a display-only defect.'}
(O/'review-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\\n');print(json.dumps({'id':sid,'status':status,'findings':len(findings),'uncertain':len(uncertain)}));raise SystemExit(0 if status=='clear' else 2)
'''
text(O/'review.py',review)
im={'id':'fate-v2-s02-image-v1','imageModel':'gemini-nano-banana-2.1','reviewModel':'gemini-2.5-flash','automaticRetries':0,'maxOutputTokens':8192,'maxGenerationCalls':1,'maxReviewCalls':1,'style':'University-level photorealistic3D-style educational ingredient. Sophisticated material, soft realistic illumination, off-white clean background, restrained teal accents. No cartoon, no people or visible presenters.','scenes':[{'id':'S02-two-bases','title':{'en':'Food mass and body mass are distinct bases'},'meaning':'A food-portion weighing setup and a separate body-weight scale illustrate two different measurement bases, never a measured result or a health threshold.','visualContract':'On the left half, a realistic clean laboratory food balance with blank display beside a glass food dish and peppers; farther behind but clearly separate a minimal clean unoccupied body-weight platform scale with blank display. Keep equipment plausible, no person, no hands, no measuring tank or safe/unsafe line. Do not merge scales or imply either display has a numerical reading. Quiet right40percent for later exact labels and animated dimensional reasoning.'}]}
save(O/'images-request.json',im)
iw=(B/'media-s01/image_worker.py').read_text(encoding='utf8').replace("len(M['scenes'])==3","len(M['scenes'])==1")
iw=iw.replace("'imageSize':'2K'}}}","'imageSize':'2K'},'maxOutputTokens':8192}}")
iw=iw.replace("'responseMimeType':'application/json'}}", "'responseMimeType':'application/json','maxOutputTokens':4096,'thinkingConfig':{'thinkingBudget':0}}}")
text(O/'image_worker.py',iw)
workflow='''name: Fate v2 funded second-step speech and visual originals
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/funded-s02-v1/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-funded-s02-v1
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/funded-s02-v1
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  speech:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    strategy:
      fail-fast: false
      max-parallel: 5
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify live model and preserve complete original
        env:
          EXPECTED_REQUEST_SHA256: REQUESTHASH
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/generate.py" "${{ matrix.part }}"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-funded-original-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - name: Blind, reference and accepted-voice acoustic review
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/review.py" "${{ matrix.part }}"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-funded-review-${{ matrix.part }}
          path: |
            ${{ env.PACKAGE }}/output/review/
            ${{ env.PACKAGE }}/output/review-summary.json
          retention-days: 30
  image:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify live image model and preserve original
        env:
          EXPECTED_REQUEST_SHA256: IMAGEHASH
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/image_worker.py" S02-two-bases generate
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-funded-image-S02-two-bases
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - name: Review actual visible ingredient
        env:
          EXPECTED_REQUEST_SHA256: IMAGEHASH
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/image_worker.py" S02-two-bases review
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-funded-image-review-S02-two-bases
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''
workflow=workflow.replace('PARTS',json.dumps([s['id'] for s in segments])).replace('REQUESTHASH',sha(O/'request.json')).replace('IMAGEHASH',sha(O/'images-request.json'))
text(W/'.github/workflows/fate-v2-funded-s02.yml',workflow)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
fund['allocations'].append({'id':m['id'],'reservationUSD':1.75,'status':'prepared_not_dispatched','speechCalls':10,'analysisCalls':20,'imageCalls':1,'imageReviews':1,'requestSHA256':sha(O/'request.json')});save(R/'production/remaining-budget.en.json',fund)
print(json.dumps({'package':str(O),'speechParts':10,'images':1,'requestSHA256':sha(O/'request.json')}))
