import unittest
from archive_dormant_branches import load_plan, validate, merged_maintenance, REPO, BASELINE


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.plan = load_plan()

    def test_frozen_scope(self):
        self.assertEqual(len(validate(self.plan)), 71)
        self.assertEqual({x['branch'] for x in self.plan['keep']}, {'main', 'work/masaarat-academic-20261005', 'work/masaarat-twilio-communications-20261008', 'feat/c01-contact-automation-prep-20260924', 'launch/c01-stripe-live-isolation'})

    def test_kept_target_rejected(self):
        self.plan['targets'][0]['branch'] = 'main'
        with self.assertRaises(ValueError): validate(self.plan)

    def test_changed_tag_rejected(self):
        self.plan['targets'][0]['tag'] = 'archive/wrong'
        with self.assertRaises(ValueError): validate(self.plan)

    def test_invalid_sha_rejected(self):
        self.plan['targets'][0]['sha'] = 'main'
        with self.assertRaises(ValueError): validate(self.plan)

    def test_duplicate_target_rejected(self):
        self.plan['targets'][1] = self.plan['targets'][0]
        with self.assertRaises(ValueError): validate(self.plan)

    def test_wrong_baseline_rejected(self):
        self.plan['baseline_main'] = '0' * 40
        with self.assertRaises(ValueError): validate(self.plan)

    def test_maintenance_requires_exact_merged_pr(self):
        p = {'number': 174, 'merged_at': 'now', 'state': 'closed', 'merge_commit_sha': BASELINE,
             'head': {'ref': 'test', 'sha': '1' * 40, 'repo': {'full_name': REPO}},
             'base': {'ref': 'main', 'repo': {'full_name': REPO}}}
        self.assertEqual(merged_maintenance([p], 'test', BASELINE)['recovery_ref'], 'refs/pull/174/head')
        p['state'] = 'open'
        self.assertIsNone(merged_maintenance([p], 'test', BASELINE))

    def test_fork_or_duplicate_pr_rejected(self):
        p = {'number': 174, 'merged_at': 'now', 'state': 'closed', 'merge_commit_sha': BASELINE,
             'head': {'ref': 'test', 'sha': '1' * 40, 'repo': {'full_name': 'other/repo'}},
             'base': {'ref': 'main', 'repo': {'full_name': REPO}}}
        self.assertIsNone(merged_maintenance([p], 'test', BASELINE))
        p['head']['repo']['full_name'] = REPO
        self.assertIsNone(merged_maintenance([p, p], 'test', BASELINE))


if __name__ == '__main__': unittest.main()
