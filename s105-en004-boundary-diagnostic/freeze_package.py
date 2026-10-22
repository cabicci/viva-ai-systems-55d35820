from pathlib import Path
import ast,hashlib,json,os
P=Path(__file__).resolve().parent
if os.name=='nt':P=Path(chr(92)*2+'?'+chr(92)+str(P).removeprefix(chr(92)*2+'?'+chr(92)))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();tree=ast.parse((P/'worker.py').read_text('utf-8'));names=next(ast.literal_eval(n.value)for n in tree.body if isinstance(n,ast.Assign)and any(isinstance(x,ast.Name)and x.id=='FROZEN'for x in n.targets));(P/'freeze.json').write_text(json.dumps({'scope':'S105_EN004_ONE_EXISTING_CONTEXT_BOUNDARY_DIAGNOSTIC_ONLY','sha256':{n:sha(P/n)for n in sorted(names)}},indent=2)+'\n',encoding='utf-8')
s="""name: S105 EN004 one original context boundary diagnostic
on:
  push:
    branches: [work/soil-s105-en004-boundary-diagnostic-20261022-r1]
    paths: [s105-en004-boundary-diagnostic/request.json]
permissions:
  contents: read
concurrency:
  group: s105-en004-boundary-REQ
  cancel-in-progress: false
env:
  PACKAGE: s105-en004-boundary-diagnostic
  REQUEST_SHA: REQ
  WORKER_SHA: WORK
  FREEZE_SHA: FREEZE
  BRANCH_CREATED: ${{ github.event.created }}
  REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}
jobs:
  review:
    if: github.run_attempt == 1 && github.repository_id == '1272666418' && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s105-en004-boundary-diagnostic-20261022-r1' && github.event.created == true && github.event.before == '0000000000000000000000000000000000000000' && github.event.repository.private == false
    runs-on: ubuntu-22.04
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
        with:
          persist-credentials: false
      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065
        with:
          python-version: '3.11'
      - name: Verify freeze and derive exact original PCM context
        run: |
          cd "$PACKAGE"
          python worker.py validate
          python worker.py prepare
      - name: Preserve exact context before review
        id: context
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s105-en004-boundary-r1-context
          retention-days: 30
          if-no-files-found: error
          path: |
            ${{ env.PACKAGE }}/output/context.wav
            ${{ env.PACKAGE }}/output/context-proof.json
      - name: Record exact context upload
        env:
          AID: ${{ steps.context.outputs.artifact-id }}
          DIGEST: ${{ steps.context.outputs.artifact-digest }}
        run: |
          cd "$PACKAGE"
          python worker.py uploaded --artifact-id "$AID" --artifact-digest "$DIGEST"
      - name: One actual context utterance boundary review
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          cd "$PACKAGE"
          python worker.py review
      - name: Fail if missing or invalid diagnostic, preserve uncertainty
        if: always()
        run: |
          cd "$PACKAGE"
          python worker.py summarize
      - name: Preserve all raw/parsed/failed records and exact frozen inputs
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s105-en004-boundary-r1-complete-evidence
          retention-days: 30
          if-no-files-found: error
          path: |
            ${{ env.PACKAGE }}/
            .github/workflows/s105-en004-boundary-diagnostic.yml
"""
s=s.replace('REQ',sha(P/'request.json')).replace('WORK',sha(P/'worker.py')).replace('FREEZE',sha(P/'freeze.json')).replace(sha(P/'request.json')+'UEST_SHA:','REQUEST_SHA:').replace(sha(P/'worker.py')+'ER_SHA:','WORKER_SHA:').replace(sha(P/'freeze.json')+'_SHA:','FREEZE_SHA:')
# Exact variable identifiers, no accidental placeholder replacement survives.
s=s.replace(sha(P/'request.json')+'_SHA:','REQUEST_SHA:').replace(sha(P/'worker.py')+'_SHA:','WORKER_SHA:')
(P/'s105-en004-boundary-diagnostic.yml').write_text(s,encoding='utf-8');print('Focused boundary freeze/workflow prepared; no calls')
