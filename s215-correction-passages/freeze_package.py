from pathlib import Path
import ast,hashlib,json
P=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
tree=ast.parse((P/'worker.py').read_text('utf-8'))
frozen=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FROZEN' for t in n.targets))
write(P/'freeze.json',{'schemaVersion':1,'scope':'S2_15_THREE_ARABIC_COHERENT_PASSAGE_CORRECTIONS_ONLY','sha256':{n:sha(P/n) for n in sorted(frozen)}})
request=json.loads((P/'request.json').read_text('utf-8'))
branch='work/soil-s215-correction-passages-20261022-r1';package='s215-correction-passages'
wf="""name: S2-15 three bounded Arabic coherent passage corrections
on:
  push:
    branches: [BRANCH]
    paths: [s215-correction-passages/request.json]
permissions:
  contents: read
concurrency:
  group: s215-correction-passages-REQUEST
  cancel-in-progress: false
env:
  PACKAGE: s215-correction-passages
  REQUEST_SHA: REQUEST
  WORKER_SHA: WORKER
  FREEZE_SHA: FREEZE
  PYTHONUNBUFFERED: '1'
  HF_HUB_DISABLE_TELEMETRY: '1'
  OMP_NUM_THREADS: '2'
  BRANCH_CREATED: ${{ github.event.created }}
  REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}
jobs:
  repair:
    if: github.run_attempt == 1 && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/BRANCH' && github.event.created == true && github.event.repository.private == false && github.repository_id == '1272666418' && github.event.before == '0000000000000000000000000000000000000000'
    runs-on: ubuntu-22.04
    timeout-minutes: 100
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
        with:
          persist-credentials: false
      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065
        with:
          python-version: '3.11'
      - name: Validate exact finite request and preserved original PCM
        run: |
          cd "$PACKAGE"
          python worker.py validate
          python worker.py analyze-originals
      - name: Preserve original WAVs and exact byte identity record
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s215-correction-r1-originals-and-analysis
          path: |
            ${{ env.PACKAGE }}/originals/
            ${{ env.PACKAGE }}/output/original-analysis.json
          if-no-files-found: error
          retention-days: 30
      - name: Verify both exact preferred models without fallback
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          cd "$PACKAGE"
          python worker.py preflight
      - name: Install hash-verified Whisper before any generation
        run: |
          cd "$PACKAGE"
          python -m pip download --no-deps --dest wheels faster-whisper==1.2.1
          python worker.py verify-wheel
          python -m pip install --disable-pip-version-check --report output/pip-install-report.json wheels/faster_whisper-1.2.1-*.whl
          python worker.py prepare-asr-runtime
"""
wf=wf.replace('BRANCH',branch).replace('REQUEST',sha(P/'request.json')).replace('WORKER',sha(P/'worker.py')).replace('FREEZE',sha(P/'freeze.json'))
# Restore environment variable names after placeholder values are substituted.
wf=wf.replace(sha(P/'request.json')+'_SHA:','REQUEST_SHA:').replace(sha(P/'worker.py')+'_SHA:','WORKER_SHA:').replace(sha(P/'freeze.json')+'_SHA:','FREEZE_SHA:').replace(branch+'_CREATED:','BRANCH_CREATED:')
for i,u in enumerate(request['units']):
    uid=u['id'];n=str(i+1)
    wf+=f"""      - name: One TTS candidate {uid}
        id: tts{n}
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: |
          cd "$PACKAGE"
          python worker.py produce --unit {uid}
      - name: Upload completed candidate before diagnostics {uid}
        id: upload{n}
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s215-correction-r1-{uid}-audio
          path: ${{{{ env.PACKAGE }}}}/output/{uid}/
          if-no-files-found: error
          retention-days: 30
      - name: Record exact upload {uid}
        env:
          AUDIO_ARTIFACT_ID: ${{{{ steps.upload{n}.outputs.artifact-id }}}}
          AUDIO_ARTIFACT_DIGEST: ${{{{ steps.upload{n}.outputs.artifact-digest }}}}
        run: |
          cd "$PACKAGE"
          python worker.py uploaded --unit {uid} --artifact-id "$AUDIO_ARTIFACT_ID" --artifact-digest "$AUDIO_ARTIFACT_DIGEST"
      - name: One blind new-original voice comparison {uid}
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: |
          cd "$PACKAGE"
          python worker.py blind-review --unit {uid}
      - name: One actual-audio ASR then source comparison {uid}
        run: |
          cd "$PACKAGE"
          python worker.py asr --unit {uid}
          python worker.py compare --unit {uid}
      - name: Preserve finished or failed diagnostics {uid}
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s215-correction-r1-{uid}-review
          path: ${{{{ env.PACKAGE }}}}/output/{uid}/
          if-no-files-found: warn
          retention-days: 30
"""
wf+='''      - name: Verify terminal finite budget and unapproved integration status
        run: |
          cd "$PACKAGE"
          python worker.py summarize
      - name: Preserve entire bounded attempt evidence
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s215-correction-r1-complete-evidence
          retention-days: 30
          path: |
            ${{ env.PACKAGE }}/output/
            ${{ env.PACKAGE }}/request.json
            ${{ env.PACKAGE }}/worker.py
            ${{ env.PACKAGE }}/freeze.json
            ${{ env.PACKAGE }}/runtime.json
            ${{ env.PACKAGE }}/owner-authority.json
            ${{ env.PACKAGE }}/expected-criteria.NOT-FOR-MODEL.json
            ${{ env.PACKAGE }}/cumulative-attempt-ledger.json
            ${{ env.PACKAGE }}/cache-live-audit.json
            ${{ env.PACKAGE }}/provenance/
            ${{ env.PACKAGE }}/vendor/
'''
(P/'s215-correction-passages.yml').write_text(wf,encoding='utf-8',newline='\n')
print('Frozen inventory and workflow generated; no execution')


# Root execution correction: finish every independent audio/upload before diagnostics.
import copy,yaml
wfpath=P/'s215-correction-passages.yml'
document=yaml.safe_load(wfpath.read_text('utf-8'))
if True in document:document['on']=document.pop(True)
oldsteps=document['jobs']['repair']['steps'];head=oldsteps[:6]
for index,identity in [(2,'validate'),(3,'originals'),(4,'preflight'),(5,'runtime')]:head[index]['id']=identity
audio=[];diagnostics=[]
shared="always() && steps.validate.outcome == 'success' && steps.originals.outcome == 'success' && steps.preflight.outcome == 'success' && steps.runtime.outcome == 'success'"
for i,u in enumerate(request['units'],1):
    n=str(i);uid=u['id']
    t=copy.deepcopy(next(s for s in oldsteps if 'worker.py produce --unit '+uid in s.get('run','')))
    up=copy.deepcopy(next(s for s in oldsteps if s.get('with',{}).get('name')=='s215-correction-r1-'+uid+'-audio'))
    rec=copy.deepcopy(next(s for s in oldsteps if 'worker.py uploaded --unit '+uid in s.get('run','')))
    t.update({'if':shared,'continue-on-error':True});up.update({'if':"always() && steps.tts"+n+".outcome == 'success'",'continue-on-error':True})
    rec.update({'id':'receipt'+n,'if':"always() && steps.tts"+n+".outcome == 'success' && steps.upload"+n+".outcome == 'success'",'continue-on-error':True})
    audio.extend([t,up,rec])
    ready="always() && steps.tts"+n+".outcome == 'success' && steps.upload"+n+".outcome == 'success' && steps.receipt"+n+".outcome == 'success'"
    review=copy.deepcopy(next(s for s in oldsteps if 'worker.py blind-review --unit '+uid in s.get('run','')))
    review.update({'id':'review'+n,'if':ready,'continue-on-error':True})
    asr={'name':'One independent unprompted Arabic word ASR '+uid,'id':'asr'+n,'if':ready,'continue-on-error':True,'run':'cd "$PACKAGE"\npython worker.py asr --unit '+uid+'\n'}
    compare={'name':'Preserve offline source comparison and partial errors '+uid,'id':'compare'+n,'if':ready,'continue-on-error':True,'run':'cd "$PACKAGE"\npython worker.py compare --unit '+uid+'\n'}
    save=copy.deepcopy(next(s for s in oldsteps if s.get('with',{}).get('name')=='s215-correction-r1-'+uid+'-review'))
    diagnostics.extend([review,asr,compare,save])
summary=copy.deepcopy(next(s for s in oldsteps if 'python worker.py summarize' in s.get('run','')));summary['if']='always()';summary['name']='Summarize all outcomes and fail if any diagnostics are incomplete'
complete=copy.deepcopy(oldsteps[-1]);complete['with']['path']='\n'.join(['${{ env.PACKAGE }}/output/']+['${{ env.PACKAGE }}/'+n for n in frozen]+['${{ env.PACKAGE }}/freeze.json','${{ env.PACKAGE }}/s215-correction-passages.yml'])
document['jobs']['repair']['steps']=head+audio+diagnostics+[summary,complete]
document['name']='S2-15 three Arabic coherent corrections with isolated diagnostics'
wfpath.write_text(yaml.safe_dump(document,sort_keys=False,allow_unicode=True,width=120),encoding='utf-8')
print('All3 TTS and immediate uploads precede every isolated review/ASR; partial evidence summary cannot auto-pass')

