from pathlib import Path
import ast,hashlib,json
P=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
tree=ast.parse((P/'worker.py').read_text('utf-8'));frozen=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FROZEN' for t in n.targets))
(P/'freeze.json').write_text(json.dumps({'schemaVersion':1,'scope':'S1_01_TWO_FULL_SCENE_JOIN_AUDITION_PREVIEWS_ONLY','sha256':{n:sha(P/n) for n in sorted(frozen)}},indent=2)+'\n',encoding='utf-8')
wf="""name: S1-01 two full-scene join audition previews zero TTS
on:
  push:
    branches: [work/soil-s101-repair-join-audition-20261022-r1]
    paths: [join-audition/request.json]
permissions:
  contents: read
concurrency:
  group: s101-join-audition-REQUEST_VALUE
  cancel-in-progress: false
env:
  PACKAGE: join-audition
  REQUEST_SHA: REQUEST_VALUE
  WORKER_SHA: WORKER_VALUE
  FREEZE_SHA: FREEZE_VALUE
  PYTHONUNBUFFERED: '1'
  HF_HUB_DISABLE_TELEMETRY: '1'
  OMP_NUM_THREADS: '2'
  BRANCH_CREATED: ${{ github.event.created }}
  REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}
jobs:
  audition:
    if: github.run_attempt == 1 && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s101-repair-join-audition-20261022-r1' && github.event.created == true && github.event.repository.private == false
    runs-on: ubuntu-22.04
    timeout-minutes: 100
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065
        with:
          python-version: '3.11'
      - name: Verify frozen exact inputs and unresolved boundary hypotheses
        run: |
          cd "$PACKAGE"
          python worker.py validate
      - name: Install verified Whisper runtime before any paid review
        run: |
          cd "$PACKAGE"
          python -m pip download --no-deps --dest wheels faster-whisper==1.2.1
          python worker.py verify-wheel
          python -m pip install --disable-pip-version-check --report output/pip-install-report.json wheels/faster_whisper-1.2.1-*.whl
      - name: One exact Argon metadata GET no fallback
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          cd "$PACKAGE"
          python worker.py preflight
"""
wf=wf.replace('REQUEST_VALUE',sha(P/'request.json')).replace('WORKER_VALUE',sha(P/'worker.py')).replace('FREEZE_VALUE',sha(P/'freeze.json'))
for i,uid in enumerate(['en-s101-checklist','de-s101-limits'],1):
    wf+=f"""      - name: Assemble byte-exact audition preview {uid}
        run: |
          cd "$PACKAGE"
          python worker.py assemble --unit {uid}
      - name: Upload completed audition before join review {uid}
        id: upload{i}
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s101-join-{uid}-audio
          path: ${{{{ env.PACKAGE }}}}/output/{uid}/
          if-no-files-found: error
          retention-days: 30
      - name: Bind exact successful audition transfer {uid}
        env:
          AUDIO_ARTIFACT_ID: ${{{{ steps.upload{i}.outputs.artifact-id }}}}
          AUDIO_ARTIFACT_DIGEST: ${{{{ steps.upload{i}.outputs.artifact-digest }}}}
        run: |
          cd "$PACKAGE"
          python worker.py uploaded --unit {uid} --artifact-id "$AUDIO_ARTIFACT_ID" --artifact-digest "$AUDIO_ARTIFACT_DIGEST"
      - name: One actual joined-context Argon high review {uid}
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: |
          cd "$PACKAGE"
          python worker.py blind-review --unit {uid}
      - name: One actual audition ASR and source comparison {uid}
        run: |
          cd "$PACKAGE"
          python worker.py asr --unit {uid}
          python worker.py compare --unit {uid}
      - name: Preserve finished or failed join diagnostics {uid}
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s101-join-{uid}-review
          path: ${{{{ env.PACKAGE }}}}/output/{uid}/
          if-no-files-found: warn
          retention-days: 30
"""
wf+='''      - name: Verify both finite diagnostic outcomes without adopting audio
        run: |
          cd "$PACKAGE"
          python worker.py summarize
      - name: Preserve original candidate failed and exact-input evidence
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s101-two-join-auditions-complete
          retention-days: 30
          path: |
            ${{ env.PACKAGE }}/output/
            ${{ env.PACKAGE }}/inputs/
            ${{ env.PACKAGE }}/request.json
            ${{ env.PACKAGE }}/worker.py
            ${{ env.PACKAGE }}/runtime.json
            ${{ env.PACKAGE }}/freeze.json
            ${{ env.PACKAGE }}/owner-authority.json
            ${{ env.PACKAGE }}/boundary-proposals.NOT-APPROVED.json
            ${{ env.PACKAGE }}/remaining-uncertainty-proposal.json
'''
(P/'join-audition.yml').write_text(wf,encoding='utf-8',newline='\n')
print('Audition workflow frozen, no execution')

