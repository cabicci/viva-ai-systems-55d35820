"""Offline input freeze and workflow materialization; never launches anything."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKFLOW = HERE / 'audio-unit024-r2.yml'
PACKAGE = 'experiments/masaarat-media-review-job/audio-unit024-r2'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

files = ['worker.py', 'request.json', 'request.original-20261022.json', 'request.prior-batch.json', 'prior-candidate-diagnosis.json', 'prior-batch-preservation.json', 'runtime.json',
         'vendor/pipeline-engine.py', 'vendor/course/manifest.json', 'offline_check.py',
         'README.en.md', 'model-evidence.json', 'freeze_package.py', '.gitignore']
freeze = {'schemaVersion': 1, 'sha256': {p: sha(HERE / p) for p in files},
          'maximumTTSCalls': 1, 'maximumBlindAudioReviewCalls': 1, 'maximumASRInvocations': 1,
          'maximumMetadataGETs': 2, 'automaticRetries': 0}
(HERE / 'freeze.json').write_text(json.dumps(freeze, indent=2) + '\n', encoding='utf-8', newline='\n')
request_sha = sha(HERE / 'request.json')
worker_sha = sha(HERE / 'worker.py')
freeze_sha = sha(HERE / 'freeze.json')
lines = [
    'name: S1-01 unit024 r2 deliberate one-unit repair',
    'on:', '  workflow_dispatch:', '  push:',
    '    branches: [work/soil-s101-unit024-r2-20261022]',
    '    paths: [' + PACKAGE + '/request.json]',
    'permissions:', '  contents: read',
    'concurrency:', '  group: s101-unit024-r2-' + request_sha, '  cancel-in-progress: false',
    'env:', '  PACKAGE: ' + PACKAGE, '  REQUEST_SHA: ' + request_sha,
    '  WORKER_SHA: ' + worker_sha, '  FREEZE_SHA: ' + freeze_sha,
    "  PYTHONUNBUFFERED: '1'", "  HF_HUB_DISABLE_TELEMETRY: '1'", "  OMP_NUM_THREADS: '2'",
    'jobs:', '  repair:',
    "    if: github.run_attempt == 1 && github.ref == 'refs/heads/work/soil-s101-unit024-r2-20261022'",
    '    runs-on: ubuntu-22.04', '    timeout-minutes: 30', '    steps:',
    '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    '      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065',
    '        with:', "          python-version: '3.11'",
    '      - name: Verify exact frozen request and code offline',
    '        run: |', '          cd "$PACKAGE"', '          python worker.py validate',
    '      - name: Bounded preferred-model metadata preflight, no fallback',
    '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
    '        run: |', '          cd "$PACKAGE"', '          python worker.py preflight',
    '      - name: Install hash-verified Whisper wheel once',
    '        run: |', '          cd "$PACKAGE"',
    '          python -m pip download --no-deps --dest wheels faster-whisper==1.2.1',
    '          python worker.py verify-wheel',
    '          python -m pip install --disable-pip-version-check --report output/pip-install-report.json wheels/faster_whisper-1.2.1-*.whl',
]
for suffix in ['024']:
    uid = 'S1-01-ar-' + suffix
    lines += [
        '      - name: One TTS request ' + uid, '        id: tts' + suffix,
        '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
        '        run: |', '          cd "$PACKAGE"', '          python worker.py produce --unit ' + uid,
        '      - name: Upload audio before review ' + uid, '        id: upload' + suffix,
        '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
        "        if: steps.tts" + suffix + ".outcome == 'success'",
        '        with:', '          name: s101-unit024-r2-repair-' + uid + '-audio',
        '          path: ${{ env.PACKAGE }}/output/' + uid + '/',
        '          if-no-files-found: error', '          retention-days: 30',
        '      - name: Record successful audio transfer ' + uid,
        '        env:', '          AUDIO_ARTIFACT_ID: ${{ steps.upload' + suffix + '.outputs.artifact-id }}',
        '          AUDIO_ARTIFACT_DIGEST: ${{ steps.upload' + suffix + '.outputs.artifact-digest }}',
        '        run: |', '          cd "$PACKAGE"',
        '          python worker.py uploaded --unit ' + uid + ' --artifact-id "$AUDIO_ARTIFACT_ID" --artifact-digest "$AUDIO_ARTIFACT_DIGEST"',
        '      - name: One blind actual-audio Argon review ' + uid, '        continue-on-error: true',
        '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
        '        run: |', '          cd "$PACKAGE"', '          python worker.py blind-review --unit ' + uid,
        '      - name: One actual-audio Whisper transcription ' + uid, '        continue-on-error: true',
        '        run: |', '          cd "$PACKAGE"', '          python worker.py asr --unit ' + uid,
        '      - name: Preserve independent comparison and stop if diagnostics incomplete ' + uid,
        '        run: |', '          cd "$PACKAGE"', '          python worker.py compare --unit ' + uid,
        '      - name: Upload immediate review evidence ' + uid,
        '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
        '        if: always()', '        with:', '          name: s101-unit024-r2-repair-' + uid + '-review',
        '          path: ${{ env.PACKAGE }}/output/' + uid + '/',
        '          if-no-files-found: warn', '          retention-days: 30',
    ]
lines += [
    '      - name: Preserve all partial attempts and input provenance',
    '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
    '        if: always()', '        with:', '          name: s101-unit024-r2-complete-evidence',
    '          retention-days: 30', '          path: |',
    '            ${{ env.PACKAGE }}/output/', '            ${{ env.PACKAGE }}/request.json',
    '            ${{ env.PACKAGE }}/request.original-20261022.json',
    '            ${{ env.PACKAGE }}/request.prior-batch.json',
    '            ${{ env.PACKAGE }}/prior-candidate-diagnosis.json',
    '            ${{ env.PACKAGE }}/runtime.json', '            ${{ env.PACKAGE }}/freeze.json',
    '            ${{ env.PACKAGE }}/model-evidence.json', '            ${{ env.PACKAGE }}/worker.py',
]
WORKFLOW.parent.mkdir(parents=True, exist_ok=True)
WORKFLOW.write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({'requestSha256': request_sha, 'workerSha256': worker_sha, 'freezeSha256': freeze_sha,
                  'workflowSha256': sha(WORKFLOW)}, indent=2))
