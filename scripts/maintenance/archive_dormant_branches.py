#!/usr/bin/env python3
"""Archive fixed dormant heads before removing names; never merge old app code."""
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import urllib.parse

from cleanup_merged_branches import API, REPO, read_main, write_report, delete_ref, verify_deleted, verify_retained_pull_head
from preserve_production import git, tag_verified, snapshot, deletion_guard, REMOTE

ROOT = Path(__file__).resolve().parents[2]
PLAN = ROOT / 'docs/maintenance/dormant-branches-2026-10-10.json'
DIGEST = '67199156088add2d5e8e341fd4dd0839c667753566f50d8699d326b8d864a985'
BASELINE = 'd74fdc503f80ada0d091c4608e1a0c230111fae4'
PREFIX = 'archive/dormant/2026-10-10/'


def validate(plan):
    if plan.get('repository') != REPO or plan.get('baseline_main') != BASELINE:
        raise ValueError('Wrong repository or baseline')
    targets = plan.get('targets', [])
    keep = plan.get('keep', [])
    if len(targets) != 71 or len(keep) != 5:
        raise ValueError('Unexpected frozen scope')
    names = [t['branch'] for t in targets]
    kept = {t['branch'] for t in keep}
    if len(set(names)) != 71 or set(names) & kept or 'main' not in kept:
        raise ValueError('Duplicate or kept target')
    for t in targets:
        if not re.fullmatch(r'[0-9a-f]{40}', t['sha']) or t['tag'] != PREFIX + t['branch']:
            raise ValueError('Wrong exact head or archive identity')
        git(ROOT, ['check-ref-format', 'refs/heads/' + t['branch']])
        git(ROOT, ['check-ref-format', 'refs/tags/' + t['tag']])
    return targets


def load_plan():
    raw = PLAN.read_bytes()
    if hashlib.sha256(raw).hexdigest() != DIGEST:
        raise ValueError('Plan changed; stop')
    plan = json.loads(raw)
    validate(plan)
    return plan


def merged_maintenance(prs, name, main):
    matches = [p for p in prs if p.get('merged_at') and p.get('merge_commit_sha') == main
               and p.get('state') == 'closed' and p.get('head', {}).get('ref') == name
               and (p.get('head', {}).get('repo') or {}).get('full_name') == REPO
               and p.get('base', {}).get('ref') == 'main'
               and (p.get('base', {}).get('repo') or {}).get('full_name') == REPO]
    if len(matches) != 1:
        return None
    p = matches[0]
    return {'branch': name, 'sha': p['head']['sha'], 'pr': p['number'],
            'recovery_ref': 'refs/pull/' + str(p['number']) + '/head'}


def run():
    if os.environ.get('GITHUB_REPOSITORY') != REPO or os.environ.get('GITHUB_REF') != 'refs/heads/main':
        raise RuntimeError('Run only on authorized main')
    plan = load_plan()
    api = API()
    main = read_main(api)
    if main != os.environ.get('GITHUB_SHA'):
        raise RuntimeError('Main moved before execution')
    baseline = api.get('compare/' + main + '...' + BASELINE)
    if not baseline or baseline['ahead_by'] != 0:
        raise RuntimeError('Reviewed baseline not retained')
    out = ROOT / 'dormant-archive-output'
    out.mkdir(exist_ok=True)
    report = {'repository': REPO, 'baseline_main': BASELINE, 'main_sha': main,
              'status': 'preflight', 'source_tags': [], 'branches': [], 'keep': plan['keep']}
    path = out / 'result.json'
    write_report(path, report)
    workflows = '\n'.join(p.read_text() for p in (ROOT / '.github/workflows').glob('*.y*ml'))
    state = snapshot(api)
    target_names = {t['branch'] for t in plan['targets']}
    preserved = {n: b['commit']['sha'] for n, b in state['branches'].items() if n not in target_names}
    # No mutation until every frozen target passes a complete live preflight.
    for t in plan['targets']:
        reason = deletion_guard(api, t, workflows, state)
        if reason:
            report['status'] = 'stopped before mutation: ' + t['branch'] + ': ' + reason
            write_report(path, report)
            raise RuntimeError('Frozen target no longer dormant; no mutation')
        report['branches'].append({**t, 'result': 'eligible'})
    write_report(out / 'preflight.json', report)
    with tempfile.TemporaryDirectory() as directory:
        git(directory, ['init', '--bare'])
        # First preserve ALL exact object histories through independently verified tags.
        for t in plan['targets']:
            if read_main(api) != main:
                raise RuntimeError('Main moved while archiving')
            branch = api.get('branches/' + urllib.parse.quote(t['branch'], safe=''))
            if not branch or branch['commit']['sha'] != t['sha']:
                raise RuntimeError('Source changed; no deletion')
            git(directory, ['fetch', '--no-tags', REMOTE, t['sha']], api.token)
            tag_verified(directory, t, api.token)
            report['source_tags'].append({**t, 'verified': True})
            write_report(path, report)
        report['status'] = 'archived all; deleting dormant names'
        write_report(path, report)
        for i, row in enumerate(report['branches']):
            if i % 5 == 0:
                state = snapshot(api)
                if read_main(api) != main:
                    raise RuntimeError('Main moved; no further deletion')
            reason = deletion_guard(api, row, workflows, state)
            if reason:
                row['result'] = 'retained: ' + reason
                write_report(path, report)
                continue
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
        name = plan['maintenance_branch']
        prs = api.pages('pulls?state=closed&head=cabicci%3A' + urllib.parse.quote(name, safe='') + '&base=main')
        own = merged_maintenance(prs, name, main)
        if own:
            state = snapshot(api)
            other_workflows = '\n'.join(p.read_text() for p in (ROOT / '.github/workflows').glob('*.y*ml') if p.name != 'archive-dormant-branches.yml')
            reason = deletion_guard(api, own, other_workflows, state)
            if not reason:
                verify_retained_pull_head(own, directory, api.token)
                delete_ref(own, directory, api.token)
                verify_deleted(own, directory, api.token)
                report['branches'].append({**own, 'result': 'deleted and verified'})
                preserved.pop(name, None)
        after = api.pages('branches')
        report['remaining_branches'] = [{'branch': b['name'], 'sha': b['commit']['sha']} for b in after]
        after_heads = {b['name']: b['commit']['sha'] for b in after}
        report['main_unchanged'] = read_main(api) == main
        report['preserved_heads_unchanged'] = all(after_heads.get(n) == s for n, s in preserved.items())
        report['status'] = 'completed' if report['main_unchanged'] and report['preserved_heads_unchanged'] else 'stopped: preserved heads changed externally'
        write_report(path, report)
        if report['status'] != 'completed':
            raise RuntimeError('External head movement; reconcile without overwrite')
    print('Dormant histories preserved:', len(report['source_tags']), '; deleted:', sum(r['result'] == 'deleted and verified' for r in report['branches']))


if __name__ == '__main__':
    run()
