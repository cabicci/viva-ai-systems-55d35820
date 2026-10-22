"""Freeze exact one-WAV request and write one fresh-public-branch workflow."""
from pathlib import Path
import hashlib
import json
HERE = Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
IDS = ['S3-17-de-r1-010']
files = ['.gitignore', 'README.en.txt', 'worker.py', 'offline_check.py', 'freeze_package.py', 'request.json', 'runtime.json', 'owner-authority.json', 'expected-criteria.NOT-FOR-MODEL.json', 'prompts/S3-17-de-r1-010.txt', 'provenance/asr-attempt.json', 'provenance/asr-word-timestamps.json', 'provenance/audio-upload-receipt.json', 'provenance/blind-review-attempt.json', 'provenance/blind-review-response.raw.json', 'provenance/complete-archive-de010-audit.json', 'provenance/failed-run-request-unit.json', 'provenance/original-unit-report.json', 'provenance/previous-focused-worker.snapshot.py', 'provenance/reference-comparison.json', 'provenance/tts-attempt.json']
freeze = {'schemaVersion': 1, 'sha256': {name: sha(HERE / name) for name in files},
          'audioHashesInFrozenRequest': True, 'maximumBlindReviews': 1, 'maximumPerWav': 1,
          'maximumMetadataGETCalls': 1, 'ttsCalls': 0, 'asrCalls': 0, 'automaticRetries': 0}
(HERE / 'freeze.json').write_text(json.dumps(freeze, indent=2) + '\n', encoding='utf-8', newline='\n')
pins = {'REQUEST_SHA': sha(HERE / 'request.json'), 'WORKER_SHA': sha(HERE / 'worker.py'), 'FREEZE_SHA': sha(HERE / 'freeze.json')}
lines = ['name: S3-17 one existing DE010 missing diagnostic output', 'on:', '  push:',
         '    branches: [work/soil-s317-de010-existing-audio-review-20261022-r1]',
         '    paths: [s317-de010-existing-audio-review/request.json]', 'permissions:', '  contents: read',
         'concurrency:', '  group: s317-de010-' + pins['REQUEST_SHA'], '  cancel-in-progress: false', 'env:']
lines += ['  ' + k + ': ' + v for k, v in pins.items()]
lines += ["  PYTHONUNBUFFERED: '1'", 'jobs:', '  review:',
          "    if: github.event_name == 'push' && github.event.created == true && github.run_attempt == 1 && github.event.repository.private == false && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s317-de010-existing-audio-review-20261022-r1'",
          '    runs-on: ubuntu-22.04', '    timeout-minutes: 25', '    env:',
          '      REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}',
          '      BRANCH_CREATED: ${{ github.event.created }}', '    steps:',
          '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
          '      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065',
          '        with:', "          python-version: '3.11'",
          '      - name: Verify frozen scope and one exact WAV byte and PCM hashes',
          '        run: python s317-de010-existing-audio-review/worker.py validate',
          '      - name: Verify preferred model availability once without fallback',
          '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
          '        run: python s317-de010-existing-audio-review/worker.py preflight']
for index, unit in enumerate(IDS):
    lines += ['      - name: Transfer exact source WAV before blind review ' + unit,
              '        id: source' + str(index),
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s317-de010-source-' + unit,
              '          path: s317-de010-existing-audio-review/inputs/' + unit + '.wav',
              '          if-no-files-found: error', '          retention-days: 30',
              '      - name: Record prior source artifact receipt ' + unit,
              '        run: >-', '          python s317-de010-existing-audio-review/worker.py uploaded --unit ' + unit,
              '          --artifact-id "${{ steps.source' + str(index) + '.outputs.artifact-id }}"',
              '          --artifact-digest "${{ steps.source' + str(index) + '.outputs.artifact-digest }}"',
              '      - name: One terminal blind review ' + unit,
              '        timeout-minutes: 18', '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
              '        run: python s317-de010-existing-audio-review/worker.py blind-review --unit ' + unit,
              '      - name: Transfer finished raw response or failure evidence ' + unit, '        if: always()',
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s317-de010-result-' + unit,
              '          path: s317-de010-existing-audio-review/output/' + unit + '/',
              '          if-no-files-found: warn', '          retention-days: 30']
lines += ['      - name: Summarize one bounded outcome', '        if: always()',
          '        run: python s317-de010-existing-audio-review/worker.py summarize',
          '      - name: Preserve all evidence and exact request provenance', '        if: always()',
          '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02', '        with:',
          '          name: s317-one-de010-diagnostic-complete', '          retention-days: 30', '          path: |',
          '            s317-de010-existing-audio-review/output/', '            s317-de010-existing-audio-review/request.json',
          '            s317-de010-existing-audio-review/runtime.json', '            s317-de010-existing-audio-review/freeze.json',
          '            s317-de010-existing-audio-review/owner-authority.json', '            s317-de010-existing-audio-review/worker.py',
          '            s317-de010-existing-audio-review/prompts/', '            s317-de010-existing-audio-review/expected-criteria.NOT-FOR-MODEL.json']
workflow = HERE / 's317-de010-existing-audio-review.yml'
workflow.write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({**pins, 'WORKFLOW_SHA': sha(workflow)}, indent=2))
