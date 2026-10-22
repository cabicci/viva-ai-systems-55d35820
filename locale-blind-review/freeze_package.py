"""Freeze exact four-WAV request and write one fresh-public-branch workflow."""
from pathlib import Path
import hashlib
import json
HERE = Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
IDS = ['it-s101-checklist', 'de-s101-checklist', 'de-s101-chemical', 'de-s101-communication']
files = ['worker.py', 'offline_check.py', 'freeze_package.py', 'request.json', 'runtime.json', 'owner-authority.json',
         'expected-criteria.NOT-FOR-MODEL.json', 'README.en.txt', '.gitignore', 'provenance/existing-audio-repair-worker.snapshot.py']
files += [f'prompts/{i}.txt' for i in IDS]
freeze = {'schemaVersion': 1, 'sha256': {name: sha(HERE / name) for name in files},
          'audioHashesInFrozenRequest': True, 'maximumBlindReviews': 4, 'maximumPerWav': 1,
          'maximumMetadataGETCalls': 1, 'ttsCalls': 0, 'asrCalls': 0, 'automaticRetries': 0}
(HERE / 'freeze.json').write_text(json.dumps(freeze, indent=2) + '\n', encoding='utf-8', newline='\n')
pins = {'REQUEST_SHA': sha(HERE / 'request.json'), 'WORKER_SHA': sha(HERE / 'worker.py'), 'FREEZE_SHA': sha(HERE / 'freeze.json')}
lines = ['name: S1-01 four existing WAV blind diagnostics', 'on:', '  push:',
         '    branches: [work/soil-s101-locale-blind-review-20261022]',
         '    paths: [locale-blind-review/request.json]', 'permissions:', '  contents: read',
         'concurrency:', '  group: s101-locale-blind-' + pins['REQUEST_SHA'], '  cancel-in-progress: false', 'env:']
lines += ['  ' + k + ': ' + v for k, v in pins.items()]
lines += ["  PYTHONUNBUFFERED: '1'", 'jobs:', '  review:',
          "    if: github.event_name == 'push' && github.event.created == true && github.run_attempt == 1 && github.event.repository.private == false && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s101-locale-blind-review-20261022'",
          '    runs-on: ubuntu-22.04', '    timeout-minutes: 85', '    env:',
          '      REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}',
          '      BRANCH_CREATED: ${{ github.event.created }}', '    steps:',
          '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
          '      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065',
          '        with:', "          python-version: '3.11'",
          '      - name: Verify frozen scope and all four exact WAV byte and PCM hashes',
          '        run: python locale-blind-review/worker.py validate',
          '      - name: Verify preferred model availability once without fallback',
          '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
          '        run: python locale-blind-review/worker.py preflight']
for index, unit in enumerate(IDS):
    lines += ['      - name: Transfer exact source WAV before blind review ' + unit,
              '        id: source' + str(index),
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s101-blind-source-' + unit,
              '          path: locale-blind-review/inputs/' + unit + '.wav',
              '          if-no-files-found: error', '          retention-days: 30',
              '      - name: Record prior source artifact receipt ' + unit,
              '        run: >-', '          python locale-blind-review/worker.py uploaded --unit ' + unit,
              '          --artifact-id "${{ steps.source' + str(index) + '.outputs.artifact-id }}"',
              '          --artifact-digest "${{ steps.source' + str(index) + '.outputs.artifact-digest }}"',
              '      - name: One terminal blind review ' + unit, '        continue-on-error: true',
              '        timeout-minutes: 18', '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
              '        run: python locale-blind-review/worker.py blind-review --unit ' + unit,
              '      - name: Transfer finished raw response or failure evidence ' + unit, '        if: always()',
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s101-blind-result-' + unit,
              '          path: locale-blind-review/output/' + unit + '/',
              '          if-no-files-found: warn', '          retention-days: 30']
lines += ['      - name: Summarize four bounded outcomes', '        if: always()',
          '        run: python locale-blind-review/worker.py summarize',
          '      - name: Preserve all evidence and exact request provenance', '        if: always()',
          '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02', '        with:',
          '          name: s101-four-existing-wav-blind-complete', '          retention-days: 30', '          path: |',
          '            locale-blind-review/output/', '            locale-blind-review/request.json',
          '            locale-blind-review/runtime.json', '            locale-blind-review/freeze.json',
          '            locale-blind-review/owner-authority.json', '            locale-blind-review/worker.py',
          '            locale-blind-review/prompts/', '            locale-blind-review/expected-criteria.NOT-FOR-MODEL.json']
workflow = HERE / 's101-locale-blind-review.yml'
workflow.write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({**pins, 'WORKFLOW_SHA': sha(workflow)}, indent=2))
