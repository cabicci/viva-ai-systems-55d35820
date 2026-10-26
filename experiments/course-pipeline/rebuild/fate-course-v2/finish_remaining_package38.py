from batch_common import *
import shutil,ast
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'remaining-scenes38';M=json.loads((T/'request.json').read_text(encoding='utf8'))
def put(n,x):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(x)
put('prepare.py',(B/'remaining_timing_worker.template.py').read_text(encoding='utf8'));put('Scene.tsx',(B/'remaining_scene.template.tsx').read_text(encoding='utf8'))
put('render.cjs',(B/'render-first38-ar/render.cjs').read_text(encoding='utf8').replace("entryPoint:path.join(R,'Scene.tsx')","entryPoint:path.join(R,'Scene.tsx')"))
ast.parse((T/'prepare.py').read_text(encoding='utf8'))
pkg=T.relative_to(W).as_posix();h=hashlib.sha256((T/'request.json').read_bytes()).hexdigest()
wf=f'''name: Fate v2 remaining bilingual first-step scenes, preserve3.8 originals
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
  scene:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 25
    strategy:
      fail-fast: false
      max-parallel: 4
      matrix:
        part: {json.dumps([p['id'] for p in M['parts']])}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Install pinned actual-audio clock implementation
        run: python -m pip install faster-whisper==1.2.1
      - name: Verify originals, derive actual clocks and map semantic indices
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/prepare.py" "${{{{ matrix.part }}}}"
      - name: Deliver each timing/diagnostic receipt before rendering
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-scene38-clock-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Install pinned existing renderer
        working-directory: {pkg}
        run: npm ci --no-audit --no-fund
      - name: Render explanatory checkpoints
        run: node "$PACKAGE/render.cjs" stills
      - name: Deliver checkpoint frames immediately
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-scene38-stills-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Render and decode-verify this single scene
        run: |
          command -v ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y ffmpeg)
          node "$PACKAGE/render.cjs" video
      - name: Deliver each finished scene without waiting for the batch
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-scene38-video-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-remaining-scenes38.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
print('Prepared10 source-specific scene jobs with actual-ASR clocks and index-only semantic mapping. Each stage publishes immediately; no TTS/image calls.')
