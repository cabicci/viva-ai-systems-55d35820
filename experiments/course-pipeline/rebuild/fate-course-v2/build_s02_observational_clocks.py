from pathlib import Path
import json,hashlib,sys
R=Path(sys.argv[1]);B=Path(__file__).parent;W=B.parents[3];O=B/'s02-clocks-v1';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
parts=[]
for c in load(B/'funded-s02-v2/request.json')['segments']:
 d=R/'production/funded-s02-v2/artifacts'/('fate-v2-funded-original-'+c['id']);v=load(d/'verification.json');f=d/(c['id']+'.wav');assert sha(f)==v['wavSHA256'];parts.append(dict(c,audio={'run':40291770716,'artifact':d.name,'file':f.name,'sha256':sha(f)}))
m={'id':'fate-v2-s02-observational-clocks-v1','newProviderCalls':0,'parts':parts};text(O/'request.json',json.dumps(m,ensure_ascii=False,indent=2)+'\n');text(O/'clock.py',(B/'observational_clock38.py').read_text(encoding='utf8'))
w='''name: Fate v2 S02 actual-audio observational clocks, no provider calls
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [experiments/course-pipeline/rebuild/fate-course-v2/s02-clocks-v1/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: experiments/course-pipeline/rebuild/fate-course-v2/s02-clocks-v1
  EXPECTED_REQUEST_SHA256: HASH
  GH_TOKEN: ${{ github.token }}
jobs:
  clock:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 8
    strategy:
      fail-fast: false
      max-parallel: 5
      matrix:
        part: PARTS
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - run: python -m pip install faster-whisper==1.2.1
      - name: Measure actual recording and derive observational clock
        run: python "$PACKAGE/clock.py" "${{ matrix.part }}"
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: fate-v2-actual-clock-${{ matrix.part }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''.replace('HASH',sha(O/'request.json')).replace('PARTS',json.dumps([p['id'] for p in parts]));text(W/'.github/workflows/fate-v2-s02-clocks.yml',w);compile((O/'clock.py').read_text(encoding='utf8'),'clock.py','exec');print(json.dumps({'parts':len(parts),'providerCalls':0,'requestSHA256':sha(O/'request.json')}))
