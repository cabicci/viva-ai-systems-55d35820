#!/usr/bin/env python3
"""Preserve exact source refs and receipts; never invoke media/providers/app writes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.parse
from cleanup_merged_branches import API, REPO, git_auth_env, delete_ref, verify_deleted, read_main, write_report

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / 'docs/production/preservation-plan.json'
DIGEST = '8c9025d8abcf8ec3246cdec994b847b83687f461022b08368e7935ade1082c1f'
PREFIX = 'video-results--video-full-300-localized-v1--'
RECEIPTS = ROOT / 'docs/production/receipts/ai'
REMOTE = 'https://github.com/' + REPO + '.git'


def load_plan():
    data = PLAN.read_bytes()
    if hashlib.sha256(data).hexdigest() != DIGEST:
        raise ValueError('Preservation plan changed; a new review is required')
    return json.loads(data)


def git(directory, args, token=None):
    result = subprocess.run(['git', '-C', str(directory), *args],
        env=git_auth_env(token) if token else None,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
    if result.returncode:
        raise RuntimeError('Git preservation operation failed; transport output withheld')
    return result.stdout


def receipt_paths(branch):
    if not branch.startswith(PREFIX):
        raise ValueError('Outside reviewed receipt namespace')
    key = branch[len(PREFIX):]
    lesson, locale = key.rsplit('__', 1)
    if locale not in ('en', 'ar-MSA', 'ar-Gulf') or '/' in key or '..' in key:
        raise ValueError('Invalid exact receipt identity')
    old = 'remotion/video-pipeline/results/video-full-300-localized-v1/' + key + '/finalization-receipt.json'
    return key, lesson, locale, old, key + '/finalization-receipt.json'


def validate_receipt(raw, branch):
    key, lesson, locale, _, _ = receipt_paths(branch)
    r = json.loads(raw)
    if (r.get('schemaVersion') != 'video-finalization-receipt-v1'
        or r.get('batchId') != 'video-full-300-localized-v1'
        or r.get('logicalKey') != key or r.get('lessonId') != lesson or r.get('locale') != locale
        or r.get('validationStatus') != 'finalized' or r.get('bunnyUploadStatus') != 'uploaded'
        or not r.get('bunnyGuid') or not r.get('videoChecksum') or not r.get('sourceSha')):
        raise ValueError('Receipt not finalized with the exact lesson/locale/upload identity')
    return r


def harvest():
    plan = load_plan()
    api = API()
    if read_main(api) != plan['baseline_main']:
        raise RuntimeError('Main moved before harvesting; stop and reconcile')
    rows = []
    out = ROOT / 'production-preservation-output'
    out.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        git(directory, ['init', '--bare'])
        refs = ['+refs/heads/video-results*:refs/read/video-results*']
        refs += ['+refs/heads/' + s['branch'] + ':refs/read/' + s['branch'] for s in plan['sources'] if s['branch'] != 'video-results']
        git(directory, ['fetch', '--no-tags', REMOTE, *refs], api.token)
        for s in plan['sources']:
            if git(directory, ['rev-parse', 'refs/read/' + s['branch']]).decode().strip() != s['sha']:
                raise RuntimeError('Source branch changed after review')
        for target in plan['receipts']:
            branch, sha = target['branch'], target['sha']
            if git(directory, ['rev-parse', 'refs/read/' + branch]).decode().strip() != sha:
                raise RuntimeError('Receipt branch changed after review')
            key, _, _, old, dest = receipt_paths(branch)
            raw = git(directory, ['show', sha + ':' + old])
            validate_receipt(raw, branch)
            blob = git(directory, ['rev-parse', sha + ':' + old]).decode().strip()
            actual = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
            if actual != blob:
                raise RuntimeError('Original receipt bytes do not match Git blob')
            path = RECEIPTS / dest
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(raw)
            rows.append({**target, 'logicalKey': key, 'path': 'docs/production/receipts/ai/' + dest,
                         'original_path': old, 'blob_sha': blob, 'sha256': hashlib.sha256(raw).hexdigest(),
                         'bytes': len(raw)})
    index = {'repository': REPO, 'baseline_main': plan['baseline_main'], 'receipt_count': len(rows),
             'sources': plan['sources'], 'receipts': rows,
             'scope': 'Exact receipt bytes only; no Bunny reads, generation, uploads, mappings or app changes.'}
    write_report(ROOT / 'docs/production/receipt-index.json', index)
    verify_local()
    write_report(out / 'harvest.json', {'status': 'verified', 'count': len(rows), 'sources_checked': len(plan['sources'])})
    print('Exact receipt harvest verified:', len(rows))


def verify_local():
    plan = load_plan()
    index = json.loads((ROOT / 'docs/production/receipt-index.json').read_text())
    rows = index['receipts']
    expected = {(t['branch'], t['sha']) for t in plan['receipts']}
    if len(rows) != 300 or {(r['branch'], r['sha']) for r in rows} != expected:
        raise ValueError('Incomplete or changed 300-receipt identity coverage')
    if len({r['logicalKey'] for r in rows}) != 300:
        raise ValueError('Duplicate receipt logical keys')
    lessons = json.loads((ROOT / 'src/lib/locale-lessons/en/manifest.json').read_text())['lessonIds']
    if {r['logicalKey'] for r in rows} != {l + '__' + loc for l in lessons for loc in ('en','ar-MSA','ar-Gulf')}:
        raise ValueError('Receipt coverage differs from accepted AI lesson manifest')
    if index['sources'] != plan['sources']:
        raise ValueError('Source preservation index changed')
    for r in rows:
        _, _, _, old, dest = receipt_paths(r['branch'])
        if r['path'] != 'docs/production/receipts/ai/' + dest or r['original_path'] != old:
            raise ValueError('Unexpected receipt archive path')
        raw = (ROOT / r['path']).read_bytes()
        if len(raw) != r['bytes'] or hashlib.sha256(raw).hexdigest() != r['sha256']:
            raise ValueError('Archived receipt bytes changed')
        if hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() != r['blob_sha']:
            raise ValueError('Archived receipt differs from original Git blob')
        validate_receipt(raw, r['branch'])
    print('Archived 300 receipt identities, bytes and Git blob fingerprints verified')


def tag_verified(directory, source, token):
    ref = 'refs/tags/' + source['tag']
    found = git(directory, ['ls-remote', '--refs', REMOTE, ref], token).decode().strip()
    if found and found != source['sha'] + '\t' + ref:
        raise RuntimeError('Archive tag exists at a different head; never overwrite')
    if not found:
        git(directory, ['push', '--porcelain', '--force-with-lease=' + ref + ':', REMOTE, source['sha'] + ':' + ref], token)
    if git(directory, ['ls-remote', '--refs', REMOTE, ref], token).decode().strip() != source['sha'] + '\t' + ref:
        raise RuntimeError('Archive tag was not independently verified')


def snapshot(api):
    branches = {b['name']: b for b in api.pages('branches')}
    pulls = api.pages('pulls?state=open')
    runs = []
    for status in ('queued','in_progress','waiting','pending','requested'):
        runs.extend(api.pages('actions/runs?status=' + status, key='workflow_runs'))
    deployments = api.pages('deployments')
    return {'branches': branches, 'pulls': pulls, 'runs': runs, 'deployments': deployments}


def deletion_guard(api, target, workflows, state):
    name = target['branch']
    encoded = urllib.parse.quote(name, safe='')
    branch = state['branches'].get(name)
    if branch is None:
        return 'already absent'
    if branch['commit']['sha'] != target['sha'] or branch.get('protected'):
        return 'changed or protected head'
    if name in workflows:
        return 'current workflow reference'
    for pr in state['pulls']:
        if (pr.get('head', {}).get('ref') == name or pr.get('base', {}).get('ref') == name):
            return 'open PR dependency'
    if any(r['head_branch'] == name and r['status'] != 'completed' for r in state['runs']):
        return 'unfinished Actions run'
    for d in state['deployments']:
        if d['ref'] != name:
            continue
        statuses = api.get('deployments/' + str(d['id']) + '/statuses?per_page=1')
        if not statuses or statuses[0]['state'] not in ('inactive','failure','error'):
            return 'active or unknown deployment'
    return None


def preserve_cleanup():
    if os.environ.get('GITHUB_REPOSITORY') != REPO or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Archive cleanup is restricted to the reviewed main repository')
    verify_local()
    plan = load_plan()
    api = API()
    main = read_main(api)
    if main != os.environ['GITHUB_SHA']:
        raise RuntimeError('Main moved before archive cleanup')
    # The original 1942-line production batch is retained outside active workflows.
    archived = ROOT / 'docs/production/archive/video-production-batch.yml'
    active = (ROOT / '.github/workflows/video-production-batch.yml').read_text()
    if not archived.is_file() or 'preserve_production.py verify' not in active or 'secrets.' in active:
        raise RuntimeError('Completed AI batch has not been replaced by receipt-only validation')
    workflows = '\n'.join(p.read_text() for p in (ROOT / '.github/workflows').glob('*.y*ml'))
    out = ROOT / 'production-preservation-output'
    out.mkdir(exist_ok=True)
    report = {'repository': REPO, 'main_sha': main, 'source_tags': [], 'branches': [], 'status': 'in progress'}
    path = out / 'result.json'
    write_report(path, report)
    with tempfile.TemporaryDirectory() as directory:
        git(directory, ['init', '--bare'])
        for source in plan['sources']:
            branch = api.get('branches/' + urllib.parse.quote(source['branch'], safe=''))
            if not branch or branch['commit']['sha'] != source['sha']:
                raise RuntimeError('Source head moved; archive cleanup stopped')
            git(directory, ['fetch', '--no-tags', REMOTE, source['sha']], api.token)
            tag_verified(directory, source, api.token)
            report['source_tags'].append({**source, 'verified': True})
            write_report(path, report)
        targets = plan['receipts'] + [s for s in plan['sources'] if s['delete_after_archive']]
        state = snapshot(api)
        preserved = {n:b['commit']['sha'] for n,b in state['branches'].items() if n not in {t['branch'] for t in targets}}
        # Capture all eligibility before deleting. Every operation rechecks its lease/dependencies.
        for target in targets:
            reason = deletion_guard(api, target, workflows, state)
            report['branches'].append({**target, 'result': 'skip: ' + reason if reason else 'eligible'})
        write_report(out / 'plan.json', report)
        for position, row in enumerate(report['branches']):
            if row['result'] != 'eligible':
                continue
            # Bulk collection snapshots avoid hundreds of duplicate PR/Actions/deployment
            # reads; refresh each 10 targets. Atomic head leases and GitHub branch
            # protection remain authoritative for each individual deletion.
            if position % 10 == 0:
                state = snapshot(api)
            if position % 10 == 0 and read_main(api) != main:
                report['status'] = 'stopped: main moved'
                write_report(path, report)
                raise RuntimeError('Main moved; no further deletion')
            reason = deletion_guard(api, row, workflows, state)
            if reason:
                row['result'] = 'skip: ' + reason
                write_report(path, report)
                continue
            if row.get('tag'):
                tag_verified(directory, row, api.token)
            try:
                delete_ref(row, directory, api.token)
                verify_deleted(row, directory, api.token)
                row['result'] = 'deleted and verified'
            except RuntimeError:
                row['result'] = 'rejected or uncertain; stopped without retry'
                report['status'] = 'stopped'
                write_report(path, report)
                raise
            write_report(path, report)
        report['status'] = 'completed'
        report['main_unchanged'] = read_main(api) == main
        if not report['main_unchanged']:
            raise RuntimeError('Main moved during final verification')
        after = api.pages('branches')
        after_heads = {b['name']:b['commit']['sha'] for b in after}
        report['preserved_heads_unchanged'] = all(after_heads.get(n)==s for n,s in preserved.items())
        report['remaining_branches'] = [{'branch':b['name'],'sha':b['commit']['sha']} for b in after]
        if not report['preserved_heads_unchanged']:
            report['status'] = 'completed deletions; unrelated head changed externally'
            write_report(path, report)
            raise RuntimeError('Preserved head changed; reconcile without overwriting')
        write_report(path, report)
    print('Preserved source heads:',len(report['source_tags']),'; deleted and verified:',sum(r['result']=='deleted and verified' for r in report['branches']))


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('mode', choices=['harvest','verify','preserve-cleanup'])
    mode = p.parse_args().mode
    {'harvest':harvest,'verify':verify_local,'preserve-cleanup':preserve_cleanup}[mode]()
