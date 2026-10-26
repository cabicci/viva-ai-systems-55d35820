from pathlib import Path
import json,hashlib,shutil,sys
R=Path(sys.argv[1]);B=Path(__file__).parent;W=B.parents[3];O=B/'s02-scenes-v1';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def ref(run,d,file):return {'run':run,'artifact':d.name,'file':file,'sha256':sha(d/file)}
for n in ['Scene.tsx','render.cjs','contracts.json','package.json','package-lock.json']:text(O/n,(B/'fate-rest-renderer'/n).read_text(encoding='utf8'))
code=(O/'render.cjs').read_text(encoding='utf8');needle=" if(!s.audio?.sha256";assert needle in code;code=code.replace(needle," if(s.audioGate?.status!=='clear'||s.audioGate.sourceAudioSHA256!==s.audio?.sha256)throw Error('Exact actual-audio qualification required');\n"+needle);text(O/'render.cjs',code)
text(O/'prepare.py',(B/'semantic_scene_prepare38.py').read_text(encoding='utf8'))
contracts=load(O/'contracts.json')['scenes'];draft=load(R/'media-plan/FATE2-S02/spoken-draft.en.json');parts=[];held=[]
imageDir=R/'production/funded-s02-v1/artifacts/fate-v2-funded-image-S02-two-bases';image=load(imageDir/'image.json');assert image['sha256']=='fbf1e19750a234445d2ea98d22baedf85fa31ad271951e6b16ec27df8242f731'
for c in load(B/'funded-s02-v2/request.json')['segments']:
 sid=c['id'];rd=R/'production/audio-review-v3/artifacts'/('fate-v2-audio-review-v3-'+sid);gate=load(rd/'review-disposition.en.json')
 if gate['status']!='clear':held.append(sid);continue
 ad=R/'production/funded-s02-v2/artifacts'/('fate-v2-funded-original-'+sid);v=load(ad/'verification.json');cd=R/'production/s02-clocks-v1/artifacts'/('fate-v2-actual-clock-'+sid);cl=load(cd/'actual-word-clock.en.json');actual=next(p for p in draft['parts'] if p['locale']==c['locale'] and p['sectionID']==c['semanticID']);assert actual['textSHA256']==c['textSHA256']==gate['textSHA256'] and gate['sourceAudioSHA256']==v['wavSHA256']==cl['sourceAudioSHA256']
 contract=next(p for p in contracts if p['step']=='FATE2-S02' and p['sectionID']==c['semanticID'])
 parts.append(dict(c,step='FATE2-S02',sectionID=c['semanticID'],sceneIndex=c['scene'],title=contract['title'],actions=contract['actions'],audio=ref(40291770716,ad,sid+'.wav'),review=ref(40296268492,rd,'review-disposition.en.json'),clock=ref(40296268179,cd,'actual-word-clock.en.json'),image=ref(40291143105,imageDir,image['file']),imageReview={'status':'usable','imageSHA256':image['sha256'],'review':'Author assistant inspected actual image: distinct blank food-balance and unoccupied body-weight scale, no baked values/text; qualitative background only, no measurement evidence.'}))
assert len(parts)==9 and held==['S02-02-ar-EG']
m={'id':'fate-v2-s02-nine-clear-scenes-v1','speechModel':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','newSpeechCalls':0,'newImageCalls':0,'maxSemanticCalls':len(parts),'providerReservationUSD':.28,'contractsSHA256':sha(O/'contracts.json'),'brandAssets':load(B/'remaining-scenes38/request.json')['brandAssets'],'parts':parts,'heldNotRendered':held,'audioPolicy':'Only exact clear actual-audio gates; original accepted method/voices preserved. No speech regeneration for visual correction.'};save(O/'request.json',m)
w='''name: Fate v2 S02 nine qualified synchronized scenes, retain originals
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/s02-scenes-v1/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/s02-scenes-v1
  EXPECTED_REQUEST_SHA256: HASH
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  scene:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 25
    strategy:
      fail-fast: false
      max-parallel: 3
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify audio gate and actual clock, bind explanatory actions
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: python "$PACKAGE/prepare.py" "${{ matrix.part }}"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-s02-clock-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - name: Install pinned renderer
        working-directory: experiments/course-pipeline/rebuild/fate-course-v2/s02-scenes-v1
        run: npm ci --no-audit --no-fund
      - name: Render meaningful action checkpoints
        run: node "$PACKAGE/render.cjs" stills
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-s02-stills-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
      - name: Render single scene and decode actual video checkpoints
        run: |
          command -v ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y ffmpeg)
          node "$PACKAGE/render.cjs" video
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-s02-video-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''.replace('HASH',sha(O/'request.json')).replace('PARTS',json.dumps([p['id'] for p in parts]));text(W/'.github/workflows/fate-v2-s02-scenes.yml',w);compile((O/'prepare.py').read_text(encoding='utf8'),'prepare.py','exec');print(json.dumps({'qualifiedScenes':len(parts),'held':held,'requestSHA256':sha(O/'request.json')}))
