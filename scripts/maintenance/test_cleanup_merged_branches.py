"""Offline tests; temporary repositories only, never a network request."""
import copy
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from cleanup_merged_branches import API, MANIFEST, REPO, delete_ref, eligibility, read_main, validate_manifest, verify_deleted
import cleanup_merged_branches as cleanup


class RepositoryEndpoint(unittest.TestCase):
    def test_repository_metadata_uses_canonical_endpoint(self):
        calls = []
        base = 'https://api.github.com/repos/' + REPO
        def response(request, timeout):
            calls.append(request.full_url)
            if request.full_url == base:
                return io.BytesIO(b'{"default_branch":"main"}')
            if request.full_url == base + '/git/ref/heads/main':
                return io.BytesIO(json.dumps({'object': {'sha': 'a' * 40}}).encode())
            raise AssertionError('Unexpected endpoint: ' + request.full_url)
        with patch.dict(os.environ, {'GH_TOKEN': 'offline-test'}), \
             patch('urllib.request.urlopen', side_effect=response):
            self.assertEqual(read_main(API()), 'a' * 40)
        self.assertEqual(calls, [base, base + '/git/ref/heads/main'])

    def test_unavailable_repository_is_not_misreported_as_branch_change(self):
        with self.assertRaisesRegex(RuntimeError, 'Repository metadata unavailable'):
            read_main(type('MissingAPI', (), {'get': lambda self, path: None})())


class FakeAPI:
    def __init__(self, *, changed=False, protected=False, ahead=0, prs=False,
                 running=False, deployed=False):
        self.changed, self.protected, self.ahead = changed, protected, ahead
        self.prs, self.running, self.deployed = prs, running, deployed

    def get(self, path):
        if path.startswith('branches/'):
            return {'protected': self.protected,
                    'commit': {'sha': 'b' * 40 if self.changed else 'a' * 40}}
        if path.startswith('compare/'):
            return {'ahead_by': self.ahead}
        if path.startswith('deployments/'):
            return [{'state': 'success'}]
        raise AssertionError(path)

    def pages(self, path, key=None):
        if path.startswith('pulls?'):
            return [{}] if self.prs else []
        if path.startswith('actions/runs?'):
            return [{'status': 'in_progress'}] if self.running else []
        if path.startswith('deployments?'):
            return [{'id': 1}] if self.deployed else []
        raise AssertionError(path)


class SafetyChecks(unittest.TestCase):
    target = {'branch': 'fix/example', 'sha': 'a' * 40}

    def test_exact_manifest_valid(self):
        self.assertEqual(len(validate_manifest(json.loads(MANIFEST.read_text()))), 104)

    def test_forbidden_or_duplicate_manifest_fails(self):
        original = json.loads(MANIFEST.read_text())
        for name in ['main', 'lovable-sync-123', 'fix/video-result', 'fix/../main']:
            changed = copy.deepcopy(original)
            changed['targets'][0]['branch'] = name
            with self.assertRaises((ValueError, subprocess.CalledProcessError)):
                validate_manifest(changed)
        changed = copy.deepcopy(original)
        changed['targets'][1] = changed['targets'][0]
        with self.assertRaises(ValueError):
            validate_manifest(changed)

    def test_only_fully_merged_idle_branch_passes(self):
        self.assertIsNone(eligibility(FakeAPI(), self.target, 'c' * 40, ''))

    def test_new_commit_is_kept(self):
        self.assertEqual(eligibility(FakeAPI(changed=True), self.target, 'c' * 40, ''),
                         'head changed since review')

    def test_unmerged_protected_or_in_use_is_kept(self):
        cases = [({'protected': True}, 'protected branch'),
                 ({'ahead': 1}, 'not fully merged into current main'),
                 ({'prs': True}, 'open pull request dependency'),
                 ({'running': True}, 'unfinished workflow run'),
                 ({'deployed': True}, 'active or unresolved deployment')]
        for options, reason in cases:
            with self.subTest(options=options):
                self.assertEqual(eligibility(FakeAPI(**options), self.target, 'c' * 40, ''), reason)

    def test_workflow_reference_is_kept(self):
        self.assertEqual(eligibility(FakeAPI(), self.target, 'c' * 40, 'ref: fix/example'),
                         'referenced by a current workflow')


class RealGitLease(unittest.TestCase):
    def test_atomic_deletion_preserves_concurrent_change(self):
        with tempfile.TemporaryDirectory() as root:
            source, remote = str(Path(root) / 'source'), str(Path(root) / 'remote')
            for directory in [source, remote]:
                subprocess.run(['git', 'init', '--bare', directory], check=True, capture_output=True)
            env = dict(os.environ, GIT_AUTHOR_NAME='Offline test', GIT_COMMITTER_NAME='Offline test',
                       GIT_AUTHOR_EMAIL='test@example.invalid', GIT_COMMITTER_EMAIL='test@example.invalid')
            def git(*args, input=None):
                return subprocess.run(['git', '-C', remote, *args], input=input, text=True,
                                      check=True, capture_output=True, env=env).stdout.strip()
            tree = git('mktree', input='')
            old = git('commit-tree', tree, '-m', 'reviewed')
            new = git('commit-tree', tree, '-p', old, '-m', 'concurrent change')
            git('update-ref', 'refs/heads/fix/example', new)
            with self.assertRaisesRegex(RuntimeError, 'still exists'):
                verify_deleted({'branch': 'fix/example'}, source, 'offline-test', remote)
            with self.assertRaises(RuntimeError):
                delete_ref({'branch': 'fix/example', 'sha': old}, source, 'offline-test', remote)
            self.assertEqual(git('rev-parse', 'refs/heads/fix/example'), new)
            delete_ref({'branch': 'fix/example', 'sha': new}, source, 'offline-test', remote)
            verify_deleted({'branch': 'fix/example'}, source, 'offline-test', remote)
            self.assertEqual(git('for-each-ref', '--format=%(refname)', 'refs/heads/fix/example'), '')

    def test_transport_failure_is_never_treated_as_absence(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(RuntimeError, 'absence check failed'):
                verify_deleted({'branch': 'fix/example'}, directory, 'offline-test', directory + '/missing.git')


class FullWorkflow(unittest.TestCase):
    def test_plan_and_apply_all_targets_with_real_git_and_saved_results(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            remote = str(root / 'remote.git')
            subprocess.run(['git', 'init', '--bare', remote], check=True, capture_output=True)
            env = dict(os.environ, GIT_AUTHOR_NAME='Offline test', GIT_COMMITTER_NAME='Offline test',
                       GIT_AUTHOR_EMAIL='test@example.invalid', GIT_COMMITTER_EMAIL='test@example.invalid')
            def git(*args, input=None, check=True):
                return subprocess.run(['git', '-C', remote, *args], input=input, text=True,
                                      check=check, capture_output=True, env=env)
            tree = git('mktree', input='').stdout.strip()
            sha = git('commit-tree', tree, '-m', 'baseline').stdout.strip()
            targets = [{'branch': 'fix/offline-' + str(i), 'sha': sha} for i in range(104)]
            for target in targets[1:]:
                git('update-ref', 'refs/heads/' + target['branch'], sha)
            git('update-ref', 'refs/heads/main', sha)
            manifest = root / 'manifest.json'
            manifest.write_text(json.dumps({'repository': REPO, 'baseline_main': sha, 'targets': targets}))
            (root / '.github/workflows').mkdir(parents=True)
            class OfflineAPI:
                token = 'offline-test'
                def get(self, path):
                    if path == '':
                        return {'default_branch': 'main'}
                    if path == 'git/ref/heads/main':
                        return {'object': {'sha': sha}}
                    if path.startswith('compare/'):
                        return {'ahead_by': 0}
                    if path.startswith('branches/'):
                        name = cleanup.urllib.parse.unquote(path[len('branches/'):])
                        result = git('show-ref', '--verify', '--hash', 'refs/heads/' + name, check=False)
                        if result.returncode:
                            return None
                        return {'protected': name == 'fix/offline-1',
                                'commit': {'sha': result.stdout.strip()}}
                    raise AssertionError('Unexpected API read: ' + path)
                def pages(self, path, key=None):
                    return []
            real_delete, real_verify = delete_ref, verify_deleted
            with patch.object(cleanup, 'ROOT', root), patch.object(cleanup, 'MANIFEST', manifest), \
                 patch.object(cleanup, 'API', OfflineAPI), \
                 patch.object(cleanup, 'delete_ref', side_effect=lambda t, d, k: real_delete(t, d, k, remote)), \
                 patch.object(cleanup, 'verify_deleted', side_effect=lambda t, d, k: real_verify(t, d, k, remote)), \
                 patch('builtins.print'), \
                 patch.dict(os.environ, {'GITHUB_REPOSITORY': REPO, 'GITHUB_REF': 'refs/heads/main',
                                         'CONFIRMATION': 'DELETE MERGED BRANCHES'}):
                cleanup.run('plan')
                self.assertEqual(len(git('for-each-ref', '--format=%(refname)', 'refs/heads/fix/').stdout.splitlines()), 103)
                plan = json.loads((root / 'branch-cleanup-output/plan.json').read_text())
                self.assertEqual(len(plan['branches']), 104)
                self.assertEqual(plan['branches'][0]['result'], 'skip: already absent')
                self.assertEqual(plan['branches'][1]['result'], 'skip: protected branch')
                cleanup.run('apply')
            result = json.loads((root / 'branch-cleanup-output/result.json').read_text())
            self.assertEqual(len(result['branches']), 102)
            self.assertTrue(all(r['result'] == 'deleted and verified' and r['delete_transport_succeeded']
                                for r in result['branches']))
            self.assertEqual(git('for-each-ref', '--format=%(refname)', 'refs/heads/fix/').stdout.strip(),
                             'refs/heads/fix/offline-1')
            self.assertEqual(git('rev-parse', 'refs/heads/main').stdout.strip(), sha)


if __name__ == '__main__':
    unittest.main()
