import copy
import json
import tempfile
import shutil
import unittest
from pathlib import Path
from unittest.mock import patch
import preserve_production as p


class PreservationTests(unittest.TestCase):
    def setUp(self):
        self.branch = p.PREFIX + 'lesson-1__en'
        self.receipt = {'schemaVersion':'video-finalization-receipt-v1','batchId':'video-full-300-localized-v1',
            'logicalKey':'lesson-1__en','lessonId':'lesson-1','locale':'en','validationStatus':'finalized',
            'bunnyUploadStatus':'uploaded','bunnyGuid':'guid','videoChecksum':'hash','sourceSha':'source'}
        self.target = {'branch':self.branch,'sha':'a'*40}
        self.state = {'branches':{self.branch:{'commit':{'sha':'a'*40},'protected':False}},'pulls':[],'runs':[],'deployments':[]}

    def test_exact_identity_accepted(self):
        self.assertEqual(p.validate_receipt(json.dumps(self.receipt),self.branch),self.receipt)

    def test_wrong_identities_or_missing_delivery_rejected(self):
        for field, value in [('lessonId','wrong'),('locale','ar-EG'),('logicalKey','other__en'),
                             ('batchId','other'),('validationStatus','pending'),('bunnyUploadStatus','pending'),
                             ('bunnyGuid',''),('videoChecksum',''),('sourceSha','')]:
            with self.subTest(field=field):
                r={**self.receipt,field:value}
                with self.assertRaises(ValueError):p.validate_receipt(json.dumps(r),self.branch)

    def test_namespace_and_paths_are_bounded(self):
        for branch in ['main',p.PREFIX+'../x__en',p.PREFIX+'lesson__ar-EG',p.PREFIX+'x/y__en']:
            with self.subTest(branch=branch):
                with self.assertRaises(ValueError):p.receipt_paths(branch)

    def test_archive_tag_is_never_overwritten(self):
        s={'sha':'a'*40,'tag':'archive/source'}
        with patch.object(p,'git',return_value=b'bbbb\trefs/tags/archive/source') as git:
            with self.assertRaises(RuntimeError):p.tag_verified('tmp',s,'synthetic')
            self.assertEqual(git.call_count,1)

    def test_matching_tag_is_verified_without_push(self):
        s={'sha':'a'*40,'tag':'archive/source'}
        with patch.object(p,'git',return_value=('a'*40+'\trefs/tags/archive/source').encode()) as git:
            p.tag_verified('tmp',s,'synthetic')
            self.assertEqual(git.call_count,2)
            self.assertTrue(all(c.args[1][0]=='ls-remote' for c in git.call_args_list))

    def test_new_tag_uses_absent_ref_lease(self):
        s={'sha':'a'*40,'tag':'archive/source'}
        with patch.object(p,'git',side_effect=[b'',b'',('a'*40+'\trefs/tags/archive/source').encode()]) as git:
            p.tag_verified('tmp',s,'synthetic')
            self.assertIn('--force-with-lease=refs/tags/archive/source:',git.call_args_list[1].args[1])

    def test_guard_eligible_only_exact_unprotected_head(self):
        self.assertIsNone(p.deletion_guard(None,self.target,'',self.state))
        for changed in [{'commit':{'sha':'b'*40},'protected':False},{'commit':{'sha':'a'*40},'protected':True}]:
            state=copy.deepcopy(self.state);state['branches'][self.branch]=changed
            self.assertEqual(p.deletion_guard(None,self.target,'',state),'changed or protected head')

    def test_guard_open_pr_head_and_base(self):
        for side in ['head','base']:
            state=copy.deepcopy(self.state);state['pulls']=[{side:{'ref':self.branch}}]
            self.assertEqual(p.deletion_guard(None,self.target,'',state),'open PR dependency')

    def test_guard_unfinished_runs_and_workflow_dependency(self):
        state=copy.deepcopy(self.state);state['runs']=[{'head_branch':self.branch,'status':'queued'}]
        self.assertEqual(p.deletion_guard(None,self.target,'',state),'unfinished Actions run')
        self.assertEqual(p.deletion_guard(None,self.target,self.branch,self.state),'current workflow reference')

    def test_guard_active_or_unknown_deployment(self):
        from unittest.mock import Mock
        state=copy.deepcopy(self.state);state['deployments']=[{'ref':self.branch,'id':1}]
        for statuses in [[],[{'state':'success'}]]:
            self.assertEqual(p.deletion_guard(Mock(get=lambda _:statuses),self.target,'',state),'active or unknown deployment')

    def test_guard_already_absent_is_not_deleted(self):
        state={**self.state,'branches':{}}
        self.assertEqual(p.deletion_guard(None,self.target,'',state),'already absent')

    def test_manifest_digest_binds_all_names_heads_and_tags(self):
        plan=p.load_plan()
        self.assertEqual(len(plan['receipts']),300)
        self.assertEqual(len(plan['sources']),9)
        self.assertFalse(next(s for s in plan['sources'] if s['branch']=='work/masaarat-academic-20261005')['delete_after_archive'])
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'plan.json';path.write_text(json.dumps({**plan,'receipts':plan['receipts'][:-1]}))
            with patch.object(p,'PLAN',path):
                with self.assertRaises(ValueError):p.load_plan()

    def test_archive_detects_missing_corrupt_duplicate_and_changed_source(self):
        if not (p.ROOT/'docs/production/receipt-index.json').exists():
            self.skipTest('Harvest has not completed')
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            shutil.copytree(p.ROOT/'docs/production',root/'docs/production')
            manifest=root/'src/lib/locale-lessons/en/manifest.json';manifest.parent.mkdir(parents=True)
            shutil.copy2(p.ROOT/'src/lib/locale-lessons/en/manifest.json',manifest)
            index=root/'docs/production/receipt-index.json';original=index.read_bytes();data=json.loads(original)
            receipt=root/data['receipts'][0]['path'];raw=receipt.read_bytes()
            with patch.object(p,'ROOT',root):
                receipt.unlink()
                with self.assertRaises(FileNotFoundError):p.verify_local()
                receipt.write_bytes(raw+b' ')
                with self.assertRaises(ValueError):p.verify_local()
                receipt.write_bytes(raw)
                data['receipts'][1]=data['receipts'][0];index.write_text(json.dumps(data))
                with self.assertRaises(ValueError):p.verify_local()
                data=json.loads(original);data['sources'][0]['sha']='b'*40;index.write_text(json.dumps(data))
                with self.assertRaises(ValueError):p.verify_local()


if __name__=='__main__':unittest.main()
