#!/usr/bin/env python3
"""Delete only reviewed, unchanged, fully merged branch refs. No dependencies."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / 'docs/maintenance/branch-cleanup-2026-10-10.json'
BATCH2_MANIFEST = ROOT / 'docs/maintenance/branch-cleanup-2026-10-10-batch2.json'
BATCH2_DIGEST = 'ec6cf3a752651c4813889bfb02199fea94dc07422325284b441495043e400e9e'
REPO = 'cabicci/viva-ai-systems-55d35820'
SHA = re.compile(r'^[0-9a-f]{40}$')
ALLOWED = re.compile(r'^(fix|feat|feature|integrate|integration|style|docs|chore|codex|work)/')
RESERVED = re.compile(r'video|visual|rag|snapshot|checkpoint|artifact|preserve|recovery', re.I)


class API:
    def __init__(self):
        self.token = os.environ['GH_TOKEN']

    def get(self, path):
        url = 'https://api.github.com/repos/' + REPO
        if path:
            url += '/' + path
        request = urllib.request.Request(
            url,
            headers={'Authorization': 'Bearer ' + self.token,
                     'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2022-11-28'})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            raise RuntimeError('GitHub read failed with HTTP ' + str(error.code)) from None

    def pages(self, path, key=None):
        records = []
        separator = '&' if '?' in path else '?'
        for page in range(1, 101):
            result = self.get(path + separator + 'per_page=100&page=' + str(page))
            if result is None:
                raise RuntimeError('Required GitHub collection is unavailable')
            batch = result[key] if key else result
            records.extend(batch)
            if len(batch) < 100:
                return records
        raise RuntimeError('Collection exceeded safety pagination bound')


def validate_manifest(manifest):
    if manifest.get('repository') != REPO or not SHA.fullmatch(manifest.get('baseline_main', '')):
        raise ValueError('Unexpected repository or baseline')
    targets = manifest.get('targets', [])
    if manifest.get('review_batch') == '2026-10-10-112':
        digest = hashlib.sha256(json.dumps(targets, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        if (manifest['baseline_main'] != 'e989902e4e70025d0d6c96b36b38d71ccc5e527e'
                or len(targets) != 112 or digest != BATCH2_DIGEST):
            raise ValueError('Expected the exact 112 reviewed names, SHAs and merge proofs')
        for target in targets:
            subprocess.run(['git', 'check-ref-format', 'refs/heads/' + target['branch']], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return targets
    if 'review_batch' in manifest:
        raise ValueError('Unknown review batch')
    if len(targets) != 104 or len({t['branch'] for t in targets}) != 104:
        raise ValueError('Expected the exact 104-branch review scope')
    for target in targets:
        name = target['branch']
        if (set(target) != {'branch', 'sha'} or not ALLOWED.match(name)
                or RESERVED.search(name) or not SHA.fullmatch(target['sha'])):
            raise ValueError('Invalid or reserved target')
        subprocess.run(['git', 'check-ref-format', 'refs/heads/' + name], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return targets


def read_main(api):
    repository = api.get('')
    if not repository:
        raise RuntimeError('Repository metadata unavailable')
    if repository['default_branch'] != 'main':
        raise RuntimeError('Default branch changed')
    main = api.get('git/ref/heads/main')
    if not main:
        raise RuntimeError('Main ref unavailable')
    return main['object']['sha']


def eligibility(api, target, main, workflow_text):
    name, expected = target['branch'], target['sha']
    encoded = urllib.parse.quote(name, safe='')
    branch = api.get('branches/' + encoded)
    if branch is None:
        return 'already absent'
    if branch.get('protected'):
        return 'protected branch'
    if branch['commit']['sha'] != expected:
        return 'head changed since review'
    if name in workflow_text:
        return 'referenced by a current workflow'
    for query in ('head=' + urllib.parse.quote('cabicci:' + name, safe=''),
                  'base=' + encoded):
        if api.pages('pulls?state=open&' + query):
            return 'open pull request dependency'
    runs = api.pages('actions/runs?branch=' + encoded, key='workflow_runs')
    if any(run['status'] != 'completed' for run in runs):
        return 'unfinished workflow run'
    for deployment in api.pages('deployments?ref=' + encoded):
        statuses = api.get('deployments/' + str(deployment['id']) + '/statuses?per_page=1')
        if not statuses or statuses[0]['state'] not in ('inactive', 'failure', 'error'):
            return 'active or unresolved deployment'
    preserved = expected
    if target.get('proof') == 'merged_pr':
        pr = api.get('pulls/' + str(target['pr']))
        if (not pr or not pr.get('merged') or not pr.get('merged_at') or pr.get('state') != 'closed'
                or pr.get('head', {}).get('sha') != expected
                or pr.get('head', {}).get('ref') != name
                or (pr.get('head', {}).get('repo') or {}).get('full_name') != REPO
                or pr.get('base', {}).get('ref') != 'main'
                or (pr.get('base', {}).get('repo') or {}).get('full_name') != REPO
                or pr.get('merge_commit_sha') != target['merge_sha']):
            return 'merged PR proof changed or unavailable'
        preserved = target['merge_sha']
    comparison = api.get('compare/' + main + '...' + preserved)
    if not comparison or comparison.get('ahead_by') != 0:
        return 'not fully merged into current main'
    return None


def git_auth_env(token):
    env = os.environ.copy()
    env['GIT_TERMINAL_PROMPT'] = '0'
    env['GIT_CONFIG_COUNT'] = '1'
    env['GIT_CONFIG_KEY_0'] = 'http.https://github.com/.extraheader'
    env['GIT_CONFIG_VALUE_0'] = 'AUTHORIZATION: basic ' + base64.b64encode(
        ('x-access-token:' + token).encode()).decode()
    return env


def delete_ref(target, directory, token, remote='https://github.com/' + REPO + '.git'):
    # Git's explicit lease atomically rejects a branch whose SHA changed.
    ref = 'refs/heads/' + target['branch']
    result = subprocess.run(
        ['git', '-C', directory, 'push', '--porcelain',
         '--force-with-lease=' + ref + ':' + target['sha'],
         remote, ':' + ref],
        env=git_auth_env(token), text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    if result.returncode:
        # Do not print Git transport output or retry an uncertain mutation.
        raise RuntimeError('Deletion rejected or uncertain; no automatic retry')


def verify_deleted(target, directory, token, remote='https://github.com/' + REPO + '.git'):
    # Query the authoritative Git transport instead of the REST readback.
    ref = 'refs/heads/' + target['branch']
    result = subprocess.run(
        ['git', '-C', directory, 'ls-remote', '--exit-code', '--refs', remote, ref],
        env=git_auth_env(token), text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    if result.returncode == 2 and not result.stdout.strip():
        return
    if result.returncode == 0:
        raise RuntimeError('Branch still exists or was recreated; no automatic retry')
    raise RuntimeError('Git absence check failed; no automatic retry')


def verify_retained_pull_head(target, directory, token, remote='https://github.com/' + REPO + '.git'):
    # Squash heads are retained through GitHub's pull ref, not ancestry in main.
    ref = 'refs/pull/' + str(target['pr']) + '/head'
    result = subprocess.run(
        ['git', '-C', directory, 'ls-remote', '--exit-code', '--refs', remote, ref],
        env=git_auth_env(token), text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    if result.returncode or result.stdout.strip() != target['sha'] + '\t' + ref:
        raise RuntimeError('Reviewed pull head is not independently retained; stopping')


def write_report(path, report):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(report, indent=2) + '\n')
    temporary.replace(path)


def run(mode, batch='original-104'):
    if batch not in ('original-104', 'reviewed-112'):
        raise ValueError('Unknown review batch')
    manifest_path = BATCH2_MANIFEST if batch == 'reviewed-112' else MANIFEST
    manifest = json.loads(manifest_path.read_text())
    if (batch == 'reviewed-112') != (manifest.get('review_batch') == '2026-10-10-112'):
        raise ValueError('Requested batch does not match the reviewed manifest')
    targets = validate_manifest(manifest)
    if os.environ.get('GITHUB_REPOSITORY') != REPO:
        raise RuntimeError('This command runs only in the reviewed repository')
    if os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Dispatch this workflow from main only')
    api = API()
    main = read_main(api)
    baseline = api.get('compare/' + main + '...' + manifest['baseline_main'])
    if not baseline or baseline.get('ahead_by') != 0:
        raise RuntimeError('Reviewed baseline is no longer preserved by main')
    workflow_text = '\n'.join(p.read_text() for p in (ROOT / '.github/workflows').glob('*.y*ml'))
    output = ROOT / 'branch-cleanup-output'
    output.mkdir(exist_ok=True)
    report_path = output / ('plan.json' if mode == 'plan' else 'result.json')
    report = {'repository': REPO, 'main_sha': main, 'mode': mode, 'batch': batch, 'branches': []}
    if mode == 'apply':
        if os.environ.get('CONFIRMATION') != 'DELETE MERGED BRANCHES':
            raise RuntimeError('Missing deletion confirmation')
        plan = json.loads((output / 'plan.json').read_text())
        if plan['main_sha'] != main or plan['repository'] != REPO or plan.get('batch') != batch:
            raise RuntimeError('Main or reviewed batch changed after the saved preflight')
        eligible = {row['branch'] for row in plan['branches'] if row['result'] == 'eligible'}
        targets = [t for t in targets if t['branch'] in eligible]
    write_report(report_path, report)
    with tempfile.TemporaryDirectory() as directory:
        subprocess.run(['git', 'init', '--bare', directory], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for target in targets:
            row = dict(target)
            try:
                if read_main(api) != main:
                    raise RuntimeError('Main changed during execution; stopping')
                reason = eligibility(api, target, main, workflow_text)
                row['result'] = 'skip: ' + reason if reason else 'eligible'
                if not reason and target.get('proof') == 'merged_pr':
                    verify_retained_pull_head(target, directory, api.token)
                    row['recovery_ref'] = 'refs/pull/' + str(target['pr']) + '/head'
                    row['recovery_ref_verified'] = True
                if mode == 'apply' and not reason:
                    delete_ref(target, directory, api.token)
                    row['delete_transport_succeeded'] = True
                    row['result'] = 'deleted; verifying absence'
                    write_report(report_path, dict(report, branches=report['branches'] + [row]))
                    verify_deleted(target, directory, api.token)
                    row['result'] = 'deleted and verified'
            except Exception as error:
                row['result'] = 'STOP: ' + str(error)
                report['branches'].append(row)
                write_report(report_path, report)
                raise
            report['branches'].append(row)
            write_report(report_path, report)
            print(target['branch'] + ': ' + row['result'])
    counts = {}
    for row in report['branches']:
        counts[row['result']] = counts.get(row['result'], 0) + 1
    report['counts'] = counts
    write_report(report_path, report)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
            summary.write('\n### Branch cleanup: ' + mode + '\n\n')
            for status, count in counts.items():
                summary.write('- ' + status + ': ' + str(count) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['plan', 'apply'])
    parser.add_argument('--batch', choices=['original-104', 'reviewed-112'], default='original-104')
    args = parser.parse_args()
    run(args.mode, args.batch)
