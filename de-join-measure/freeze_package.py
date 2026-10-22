from pathlib import Path
import ast,hashlib,json
P=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
tree=ast.parse((P/'worker.py').read_text('utf-8'));frozen=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='FROZEN' for t in n.targets))
(P/'freeze.json').write_text(json.dumps({'schemaVersion':1,'scope':'S1_01_DE_TWO_PICKUP_NUMERIC_GAIN_AND_BOUNDARY_MEASUREMENT_ONLY','sha256':{n:sha(P/n) for n in sorted(frozen)}},indent=2)+'\n',encoding='utf-8')
wf="""name: S1-01 DE join numeric measurement zero provider calls
on:
  push:
    branches: [work/soil-s101-de-join-measure-20261022-r1]
    paths: [de-join-measure/request.json]
permissions:
  contents: read
concurrency:
  group: s101-de-join-measure-REQUEST_VALUE
  cancel-in-progress: false
env:
  PACKAGE: de-join-measure
  REQUEST_SHA: REQUEST_VALUE
  WORKER_SHA: WORKER_VALUE
  FREEZE_SHA: FREEZE_VALUE
  PYTHONUNBUFFERED: '1'
  BRANCH_CREATED: ${{ github.event.created }}
  REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}
jobs:
  measure:
    if: github.run_attempt == 1 && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s101-de-join-measure-20261022-r1' && github.event.created == true && github.event.repository.private == false
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065
        with:
          python-version: '3.11'
      - name: Validate exact immutable inputs and zero-call budget
        run: |
          cd "$PACKAGE"
          python worker.py validate
      - name: One numeric measurement pass, no audio output
        run: |
          cd "$PACKAGE"
          python worker.py measure
      - name: Preserve actual measurements before any gain or cut proposal
        id: measurement
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s101-de-join-numeric-measurements
          path: ${{ env.PACKAGE }}/output/
          if-no-files-found: error
          retention-days: 30
      - name: Bind measurement transfer before deriving numeric proposal
        env:
          ARTIFACT_ID: ${{ steps.measurement.outputs.artifact-id }}
          ARTIFACT_DIGEST: ${{ steps.measurement.outputs.artifact-digest }}
        run: |
          cd "$PACKAGE"
          python worker.py uploaded --artifact-id "$ARTIFACT_ID" --artifact-digest "$ARTIFACT_DIGEST"
      - name: One conditional numeric correction proposal, no gain applied
        run: |
          cd "$PACKAGE"
          python worker.py propose
      - name: Preserve exact original candidates measurements proposal or failure
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: s101-de-join-numeric-complete
          retention-days: 30
          path: |
            ${{ env.PACKAGE }}/output/
            ${{ env.PACKAGE }}/inputs/
            ${{ env.PACKAGE }}/request.json
            ${{ env.PACKAGE }}/worker.py
            ${{ env.PACKAGE }}/freeze.json
            ${{ env.PACKAGE }}/owner-authority.json
            ${{ env.PACKAGE }}/correction-plan.NOT-SELECTED.json
"""
wf=wf.replace('REQUEST_VALUE',sha(P/'request.json')).replace('WORKER_VALUE',sha(P/'worker.py')).replace('FREEZE_VALUE',sha(P/'freeze.json'))
(P/'de-join-measure.yml').write_text(wf,encoding='utf-8',newline='\n');print('Frozen numeric measurement package, no execution')

