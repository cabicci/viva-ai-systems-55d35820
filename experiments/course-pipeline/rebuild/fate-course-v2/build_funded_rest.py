from pathlib import Path
import json,hashlib,shutil,sys,re,datetime
R=Path(sys.argv[1]).resolve();B=Path(__file__).parent;W=B.parents[3];O=B/'funded-rest-v1';O.mkdir(exist_ok=False);now=datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
fund=load(R/'production/remaining-budget.en.json');assert fund['ceiling']==25 and fund['ownerAnswer']=='اعتمد 25 دولارًا لباقي المسار'
H=R/'history/before-remaining-dispatch-readout';H.mkdir(exist_ok=False)
seed=load(B/'funded-s02-v2/request.json');delivery={p['locale']:p['delivery'] for p in seed['segments']};segments=[];source_records=[]
for i in range(3,12):
 d=R/f'media-plan/FATE2-S{i:02}';draft=load(d/'spoken-draft.en.json');L=R/f'lessons/FATE2-S{i:02}/lesson.public.json';lesson=load(L);before={}
 for n in ['spoken-draft.en.json','script.ar.md','script.en.md']:
  p=d/n;q=H/p.relative_to(R);q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q);before[n]=sha(p)
 for p in draft['parts']:
  assert p['sourceLessonSHA256']==sha(L)
  assert p['textSHA256']==hashlib.sha256(p['spokenText'].encode()).hexdigest()
  s=p['spokenText']
  if p['locale']=='ar-EG':
   s=s.replace('tolerances','حدود المتبقّيات المسموح بيها').replace('MRL','إم آر إل').replace('blank','بلانك').replace('التراكم الحيوي bioaccumulation','التراكم الحيوي').replace('التركيز الحيوي bioconcentration','التركيز الحيوي').replace('التضخّم الحيوي biomagnification','التضخّم الحيوي').replace('حذف حرف m','حذف بادئة مِلِّي')
   if i==10 and p['sectionID']=='firstorder':
    s='نفترض نموذجًا بسيطًا: معدّل نقص كمّية الأصل متناسب مع الكمّية الباقية، ومعامل النقص ثابت، ومن غير مصدر جديد. تركيز المادّة عند الزمن المطلوب بيساوي تركيز البداية مضروبًا في الدالّة الأسيّة لسالب معامل النقص مضروبًا في الزمن. وتحت النموذج ده، عمر النصف بيساوي اللوغاريتم الطبيعي لاتنين مقسومًا على معامل النقص. لازم أساس الزمن يتوافق: لو المعامل على اليوم، نستخدم الزمن بالأيّام. بعد كلّ عمر نصف، يتبقّى نصّ الموجود وقتها؛ مش بنشيل كمّية ثابتة كلّ مرّة. مرجع إي بي إيه بيوضّح إنّ منحنيات التحوّل الفعليّة ممكن ما تتبعش منحنى أسي واحد. ودي تي خمسين، بمعنى الزمن للوصول لنصّ البداية، مش بالضرورة عمر نصف ثابت لكلّ أجزاء منحنى غير أسي. هنا بنحلّ النموذج اللي افترضناه؛ مش بنقول إنّنا عملنا ملاءمة لبيانات فعليّة.'
   assert not re.search(r'[A-Za-z]',s),(p['id'],'Unreviewed Latin speech token')
  p['spokenText']=s;p['textSHA256']=hashlib.sha256(s.encode()).hexdigest()
 draft['status']='exact_spoken_readout_checked_frozen_for_funded_originals';draft['updatedUTC']=now
 save(d/'spoken-draft.en.json',draft)
 for locale,code in [('ar-EG','ar'),('en','en')]:
  lane=[p for p in draft['parts'] if p['locale']==locale]
  text(d/f'script.{code}.md','# '+lesson[code]['title']+'\n\n'+'\n\n'.join('## '+p['voice']+' · '+p['sectionID']+'\n\n'+p['spokenText'] for p in lane)+'\n')
  for n,p in enumerate(lane,1):
   assert p['voice']==('Charon' if n%2 else 'Kore')
   proof=('AR' if locale=='ar-EG' else 'EN')+'-'+p['voice'];f=R/'production/voice38-proof-v1/artifacts'/('fate-v2-voice38-original-'+proof)/(proof+'.wav')
   segments.append(dict(p,id=f'S{i:02}-{n:02}-'+locale,step=f'FATE2-S{i:02}',scene=n,semanticID=p['sectionID'],delivery=delivery[locale],deliverySHA256=hashlib.sha256(delivery[locale].encode()).hexdigest(),referenceVoice={'run':40253957942,'artifact':'fate-v2-voice38-original-'+proof,'file':f.name,'sha256':sha(f)}))
 source_records.append({'step':f'FATE2-S{i:02}','sourceLessonSHA256':sha(L),'beforeSpokenHashes':before,'selectedSpokenSHA256':sha(d/'spoken-draft.en.json'),'parts':len(draft['parts'])})
assert len(segments)==92 and len({p['id'] for p in segments})==92
for n in ['method-approval.en.json','budget-authorization.en.json']:
 source=B/'funded-s02-v2'/n if n=='method-approval.en.json' else R/'production/remaining-budget.en.json';text(O/n,source.read_text(encoding='utf8'))
m={'id':'fate-v2-funded-rest-v1','scope':'Steps03–11 ArabicEgyptian andEnglish originals only; no rendering or acoustic acceptance from generation.','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':92,'maxSpeechOutputTokens':4096,'maxAnalysisCalls':0,'retained':[],'segments':segments,'methodApprovalSHA256':sha(O/'method-approval.en.json'),'budgetAuthorizationSHA256':sha(O/'budget-authorization.en.json'),'remainingPathCeilingUSD':25,'providerReservationUSD':5.7,'reviewState':'Separate corrected diagnostic worker will inspect actual preserved recordings; generation success is not pronunciation acceptance.'};save(O/'request.json',m)
g=(B/'funded-s02-v2/generate.py').read_text(encoding='utf8').replace("M['maxSpeechCalls']==len(M['segments'])==10","M['maxSpeechCalls']==len(M['segments'])==92");text(O/'generate.py',g)
specs=[
('S03-evidence-dossier','Evidence dossier for distinct assessment and standard-setting questions','Blank evidence pages and specimen context illustrate information to review, not an adopted standard or official decision.','A sophisticated photorealistic3D-style laboratory review desk on the left half: several clean open binders with completely blank unruled pages, two transparent unlabelled sample containers, a magnifying glass, and a small plain produce tray. No people, seals, stamps, flags, official logos, visible handwriting or text. Objects should be distinct and plausible. Restrained spacious right40percent for later editable role/evidence routes. Not a depiction of any actual agency office or document.'),
('S04-field-stream-context','Environmental source, medium and receptor context','A field beside a watercourse motivates a testable exposure model, without showing measured transport or injury.','An elegant realistic3D landscape cutaway concentrated on the left60percent: cultivated soil, shallow clear stream, healthy riparian plants and a plausible small larval aquatic habitat. No visible chemical plume, pollution colour, diseased organism, dead fish, arrows, falling pesticide droplets or quantified route. Calm natural environmental lighting. The stream and field are visually separate contexts, with room for later conditional source/pathway/evidence overlays. This conceptual setting does not prove causality.'),
('S05-water-analysis-bench','Water analytical report and measurement limits','A clean sampling and analysis setting illustrates analyte/matrix/method context; LOD,LOQ and censoring are later editable explanations.','Photorealistic3D-style clean analytical bench, subject arranged on left half: clear empty sample bottles, unlabelled capped vials, a plausible micropipette resting safely, a blank clipboard without even faux writing, and an abstract modern instrument with an unlit blank display. No calibration values, chemical colours, molecular imagery or experiment outcome. Distinct glassware silhouettes, no impossible or merged vessels. Quiet right40percent for editable report values and number-line animation.'),
('S06-organism-mass-balance','Organism mass versus chemical concentration','One healthy organism illustrates a mass-balance question; quantities and hypothetical growth are added separately, not inferred from the picture.','One detailed scientifically plausible healthy freshwater fish in side profile suspended naturally in clear shallow water, left-centred with a softly lit neutral aquatic background. No second comparison fish, no deformity, feeding arrow, toxin specks, concentration map, human, numbers or anatomical labels. Include a little aquatic vegetation near the lower left but leave right45percent open. The fish is a qualitative illustration only, not a measured species growth trial or a percentage-retention diagram.'),
('S07-aqueous-uptake-chamber','Aquatic uptake and elimination model context','A simple aqueous setting motivates kinetic fluxes; no measured concentration or full experimental protocol is implied.','Photorealistic3D-style small clean glass aquatic tank on the left side with one healthy small freshwater fish and clear water. A simple plausible inlet and outlet may be visible externally but no dimension markings, flow arrows, numerical displays, toxic glow, dietary food or visible chemical particles. Clearly separate tank walls and water surface; avoid duplicated fins or impossible tubing. Uncluttered right40percent supports editable rate coefficients and flux diagrams. This is a conceptual context, not an OECD-compliant apparatus claim.'),
('S08-organism-endpoint-context','Organism identity and endpoint context','Healthy aquatic and terrestrial subjects show why species and endpoint must be stated; no LC50 result or harm percentage is pictured.','Sophisticated naturalistic3D educational still life on the left60percent, with a healthy freshwater snail on a small submerged rock in a shallow clear glass habitat, and a separate healthy small seedling rooted in a compact soil sample beside it. Distinct contained aquatic and soil contexts, plausible snail anatomy and plant form. No dead organisms, exposure dosing, biological test results, numerical counts, mortality indicators, labels or molecular structures. Right40percent calm and empty for later editable endpoint/comparison cards. These are illustrative organisms only, not the complete source taxonomy or an experiment.'),
('S09-soil-water-air','Environmental phases and substance properties','Soil,water and air suggest possible partitioning and movement questions; no property value or causal pathway is encoded.','Photorealistic3D-style environmental material study, left60percent: a compact soil cutaway with visible realistic pores, a shallow clear water pool adjacent to its lower edge, exposed clean air above and a healthy small plant. Neutral off-white museum background with natural restrained colours. No arrows, motion trails, vapour clouds, coloured dissolved chemicals, fabricated molecules, numeric scales, text or labels. Keep materials physically plausible and the right40percent quiet for later property axes and editable unit conversions. Do not imply a measured distribution or calibrated phase volume.'),
('S10-transformation-conditions','Conditions affecting transformation','Light,water and soil contexts illustrate possible conditions; disappearance of chemical or mineralisation is not visually asserted.','A high-quality realistic3D-style close environmental still life on left60percent: a healthy leaf above moist textured soil beside a small clear water surface, gently lit by natural angled sunlight. Fine realistic material detail and soft shadows. No luminous chemical particles, atomic symbols, bonds, arrows, decomposed leaf, evaporating substance cloud or measured decay. Quiet neutral right40percent for editable first-order curve and condition labels. This conceptual ingredient does not establish a chemical transformation mechanism or rate.'),
('S11-leaf-impact-surface','Leaf surface for independent droplet animation','An uncoated leaf provides a material surface; transport,contact,retention,rebound and uptake remain separate animated claims.','Photorealistic macro3D-style healthy green leaf spanning the left55percent diagonally and showing a clear gently sloped upper surface with plausible waxy cuticle and fine natural venation. The impact region should be visually clear and unobstructed. NO droplets, spray, arrows, surface film, particle trails, embedded chemical markers, holes, injury, text or numbers. Leave the right45percent softly neutral and uncluttered. Later independent editable droplet geometry will show schematic contact and retention; the image must not pre-decide uptake, loss fractions or biological effect.')]
im={'id':'fate-v2-remaining-image-originals-v1','imageModel':'gemini-nano-banana-2.1','reviewModel':'gemini-2.5-flash','automaticRetries':0,'maxOutputTokens':7680,'maxGenerationCalls':9,'maxReviewCalls':0,'style':'University-level, sophisticated photorealistic3D-style educational ingredient. Accurate materials, realistic illumination and anatomy/equipment where present, off-white quiet surroundings, restrained Masaarat teal accents. No cartoon, visible presenters, brand marks, charts, diagrams or written panels.','scenes':[{'id':id,'title':{'en':title},'meaning':meaning,'visualContract':contract} for id,title,meaning,contract in specs]};save(O/'images-request.json',im)
iw=(B/'funded-s02-v1/image_worker.py').read_text(encoding='utf8').replace("len(M['scenes'])==1","len(M['scenes'])==9").replace("'maxOutputTokens':8192","'maxOutputTokens':7680")
iw=iw.replace("model=M['imageModel'] if mode=='generate' else M['reviewModel'];", "assert mode=='generate', 'Generation-only package; actual-image review is separate and must bind the received hash'\nmodel=M['imageModel'] if mode=='generate' else M['reviewModel'];")
iw=iw.replace("save('provider-metadata.json',{k:v for k,v in res.items() if k!='candidates'})", "save('provider-metadata.json',{k:v for k,v in res.items() if k!='candidates'})\n  assert res.get('modelVersion')==M['imageModel'],'Unexpected returned image model; no substitution'")
text(O/'image_worker.py',iw)
prompt_suffix='\nCreate only a realistic, sophisticated material/subject illustration for this scene. Objects spaced clearly with room for later overlays. Never use panels of written text. No text, no letters, no numbers, no captions, no logos, no arrows, no faux writing. Do not depict molecular structures or invented experimental results. Keep the right35percent restrained and uncluttered for editable explanation. Make subject scientifically plausible, distinctive and directly relevant; this is a conceptual illustration, not photographic evidence.'
image_bytes=sum(len((im['style']+'\nEducational scene: '+c['title']['en']+'\nScientific meaning: '+c['meaning']+'\nFull scene contract for context (ALL writing, diagrams, arrows, charts, mathematical marks and motion will be separate editable overlays; do NOT bake any into the image): '+c['visualContract']+prompt_suffix).encode()) for c in im['scenes'])
tts_bytes=sum(len(p['spokenText'].encode())+len(p['delivery'].encode()) for p in segments)
bound=(tts_bytes+1024*len(segments))*.5/1e6 + 92*4096*9/1e6 + (image_bytes+1024*9)*1.5/1e6 + 9*7680*30/1e6
assert bound<5.7,bound
workflow='''name: Fate v2 remaining bilingual original speech and illustration ingredients
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/funded-rest-v1/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: fate-v2-funded-rest-v1
  cancel-in-progress: false
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/funded-rest-v1
  PYTHONUNBUFFERED: '1'
jobs:
  speech:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 6
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify live model and preserve complete original speech
        env:
          EXPECTED_REQUEST_SHA256: REQUESTHASH
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/generate.py" "${{ matrix.part }}"
      - name: Deliver each original immediately before separate acoustic review
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-rest-original-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
  image:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 8
    strategy:
      fail-fast: false
      max-parallel: 3
      matrix:
        ingredient: IMAGES
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify live image model and preserve one original ingredient
        env:
          EXPECTED_REQUEST_SHA256: IMAGEHASH
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/image_worker.py" "${{ matrix.ingredient }}" generate
      - name: Deliver each original ingredient immediately for actual-pixel review
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-rest-image-${{ matrix.ingredient }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''
workflow=workflow.replace('PARTS',json.dumps([s['id'] for s in segments])).replace('IMAGES',json.dumps([s['id'] for s in im['scenes']])).replace('REQUESTHASH',sha(O/'request.json')).replace('IMAGEHASH',sha(O/'images-request.json'));text(W/'.github/workflows/fate-v2-funded-rest.yml',workflow)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
assert sha(O/'method-approval.en.json')==m['methodApprovalSHA256'] and sha(O/'budget-authorization.en.json')==m['budgetAuthorizationSHA256']
assert b'\r\n' not in (O/'method-approval.en.json').read_bytes() and b'\r\n' not in (O/'budget-authorization.en.json').read_bytes()
save(R/'media-plan/remaining-dispatch-review.en.json',{'utc':now,'reviewer':'Narration helper, source-bound script/identifier checks; not native listening or independent subject accreditation.','scope':'92new speech originals and9new text-free conceptual ingredients for steps03–11; no actual media generated by this preparation.','remainingPathCeilingUSD':25,'generationReservationUSD':5.7,'conservativeGenerationTokenBoundUSD':bound,'boundMethod':'Output caps use current standard rates: speech4096×9USD/M; image7680×30USD/M worst output modality. PromptUTF8bytes plus1024control-token allowance per request priced as input; conservative token estimate, not invoice or account-wide enforcement. Separate review/timing/render budget remains root-controlled.','sourceRecords':source_records,'localizedSpeechRepairs':['S03tolerances and MRL readouts made natural in Arabic, retaining framework and role scope.','S05blank readout renderedArabicphonetic without changing analytical interpretation.','S06English term repeats removed only where the exact Arabic definition already immediately precedes them.','S09m unit-prefix cue spoken as milliprefix, same1000foldmeaning.','S10rate/time symbols expressed verbally with inverse-time consistency and original model assumptions.'],'privateAnswersAndSourcePDFChanged':False,'imagesStatus':'Prompted only; actual pixels require review before any use. Conceptual3D-style raster ingredient is not nativegeometry or measured evidence.','speechStatus':'Not yet generated; blind/reference acoustic review and actual timings remain downstream.','files':{'requestSHA256':sha(O/'request.json'),'imageRequestSHA256':sha(O/'images-request.json'),'methodApprovalSHA256':sha(O/'method-approval.en.json'),'budgetAuthorizationSHA256':sha(O/'budget-authorization.en.json')},'handoff':'Root must inspect staged Git blob pins before committing/pushing. No Git mutations or dispatch performed by this helper.'})
print(json.dumps({'package':str(O),'speechParts':len(segments),'imageCalls':len(specs),'generationReservationUSD':5.7,'computedBoundUSD':bound,'requestSHA256':sha(O/'request.json'),'imageRequestSHA256':sha(O/'images-request.json')}))
