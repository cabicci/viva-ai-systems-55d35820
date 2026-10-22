"""Freeze exact six-WAV request and write one fresh-public-branch workflow."""
from pathlib import Path
import hashlib
import json
HERE = Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
IDS = ['en-s101-checklist', 'de-s101-limits', 'it-s101-example-gloves', 'it-s101-checklist', 'de-s101-chemical', 'de-s101-checklist']
files = ['worker.py', 'offline_check.py', 'freeze_package.py', 'request.json', 'runtime.json', 'owner-authority.json',
         'expected-criteria.NOT-FOR-MODEL.json', 'README.en.txt', '.gitignore', 'provenance/existing-audio-repair-worker.snapshot.py']
files += ['remaining-blockers.json', 'provenance/de-s101-checklist-audio-upload-receipt.json', 'provenance/de-s101-checklist-blind-review-attempt.json', 'provenance/de-s101-checklist-blind-review-response.raw.json', 'provenance/de-s101-checklist-blind-review.json', 'provenance/de-s101-chemical-audio-upload-receipt.json', 'provenance/de-s101-chemical-blind-review-attempt.json', 'provenance/de-s101-chemical-blind-review-response.raw.json', 'provenance/de-s101-chemical-blind-review.json', 'provenance/it-s101-checklist-audio-upload-receipt.json', 'provenance/it-s101-checklist-blind-review-attempt.json', 'provenance/it-s101-checklist-blind-review-response.raw.json', 'provenance/it-s101-checklist-blind-review.json', 'provenance/r1-receipt.snapshot.json', 'provenance/r1-request.snapshot.json', 'provenance/r1-summary.snapshot.json', 'provenance/r1-worker.snapshot.py']
files += [f'prompts/{i}.txt' for i in IDS]
freeze = {'schemaVersion': 1, 'sha256': {name: sha(HERE / name) for name in files},
          'audioHashesInFrozenRequest': True, 'maximumBlindReviews': 6, 'maximumPerWav': 1,
          'maximumMetadataGETCalls': 1, 'ttsCalls': 0, 'asrCalls': 0, 'automaticRetries': 0}
(HERE / 'freeze.json').write_text(json.dumps(freeze, indent=2) + '\n', encoding='utf-8', newline='\n')
pins = {'REQUEST_SHA': sha(HERE / 'request.json'), 'WORKER_SHA': sha(HERE / 'worker.py'), 'FREEZE_SHA': sha(HERE / 'freeze.json')}
lines = ['name: S1-01 six focused existing WAV diagnostics', 'on:', '  push:',
         '    branches: [work/soil-s101-locale-focused-review-20261022-r2]',
         '    paths: [locale-focused-review/request.json]', 'permissions:', '  contents: read',
         'concurrency:', '  group: s101-locale-focused-' + pins['REQUEST_SHA'], '  cancel-in-progress: false', 'env:']
lines += ['  ' + k + ': ' + v for k, v in pins.items()]
lines += ["  PYTHONUNBUFFERED: '1'", 'jobs:', '  review:',
          "    if: github.event_name == 'push' && github.event.created == true && github.run_attempt == 1 && github.event.repository.private == false && github.repository == 'cabicci/viva-ai-systems-55d35820' && github.ref == 'refs/heads/work/soil-s101-locale-focused-review-20261022-r2'",
          '    runs-on: ubuntu-22.04', '    timeout-minutes: 125', '    env:',
          '      REPOSITORY_IS_PRIVATE: ${{ github.event.repository.private }}',
          '      BRANCH_CREATED: ${{ github.event.created }}', '    steps:',
          '      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
          '      - uses: actions/setup-python@a26af69be951a213d495a4c3e4e4022e16d87065',
          '        with:', "          python-version: '3.11'",
          '      - name: Verify frozen scope and all six exact WAV byte and PCM hashes',
          '        run: python locale-focused-review/worker.py validate',
          '      - name: Verify preferred model availability once without fallback',
          '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
          '        run: python locale-focused-review/worker.py preflight']
for index, unit in enumerate(IDS):
    lines += ['      - name: Transfer exact source WAV before blind review ' + unit,
              '        id: source' + str(index),
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s101-focused-source-' + unit,
              '          path: locale-focused-review/inputs/' + unit + '.wav',
              '          if-no-files-found: error', '          retention-days: 30',
              '      - name: Record prior source artifact receipt ' + unit,
              '        run: >-', '          python locale-focused-review/worker.py uploaded --unit ' + unit,
              '          --artifact-id "${{ steps.source' + str(index) + '.outputs.artifact-id }}"',
              '          --artifact-digest "${{ steps.source' + str(index) + '.outputs.artifact-digest }}"',
              '      - name: One terminal blind review ' + unit,
              '        timeout-minutes: 18', '        env:', '          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}',
              '        run: python locale-focused-review/worker.py blind-review --unit ' + unit,
              '      - name: Transfer finished raw response or failure evidence ' + unit, '        if: always()',
              '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
              '        with:', '          name: s101-focused-result-' + unit,
              '          path: locale-focused-review/output/' + unit + '/',
              '          if-no-files-found: warn', '          retention-days: 30']
lines += ['      - name: Summarize six bounded outcomes', '        if: always()',
          '        run: python locale-focused-review/worker.py summarize',
          '      - name: Preserve all evidence and exact request provenance', '        if: always()',
          '        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02', '        with:',
          '          name: s101-six-focused-wav-diagnostics-complete', '          retention-days: 30', '          path: |',
          '            locale-focused-review/output/', '            locale-focused-review/request.json',
          '            locale-focused-review/runtime.json', '            locale-focused-review/freeze.json',
          '            locale-focused-review/owner-authority.json', '            locale-focused-review/worker.py',
          '            locale-focused-review/prompts/', '            locale-focused-review/expected-criteria.NOT-FOR-MODEL.json']
workflow = HERE / 's101-locale-focused-review.yml'
workflow.write_text('\n'.join(lines) + '\n', encoding='utf-8', newline='\n')
print(json.dumps({**pins, 'WORKFLOW_SHA': sha(workflow)}, indent=2))
