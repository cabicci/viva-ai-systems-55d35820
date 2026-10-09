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

from cleanup_merged_branches import API, MANIFEST, REPO, delete_ref, eligibility, read_main, validate_manifest


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
            with self.assertRaises(RuntimeError):
                delete_ref({'branch': 'fix/example', 'sha': old}, source, 'offline-test', remote)
            self.assertEqual(git('rev-parse', 'refs/heads/fix/example'), new)
            delete_ref({'branch': 'fix/example', 'sha': new}, source, 'offline-test', remote)
            self.assertEqual(git('for-each-ref', '--format=%(refname)', 'refs/heads/fix/example'), '')


if __name__ == '__main__':
    unittest.main()
