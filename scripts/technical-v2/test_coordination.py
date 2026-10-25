import json,os,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import coordination as c
class CoordinationGuards(unittest.TestCase):
 def test_ack_requires_exact_identity_and_cloud_proof(self):
  r={k:k for k in ('batchId','lessonId','locale','oldGuid','newGuid','sourceHash','videoSha256','audioSha256','backupSha256','backupArtifactId','backupRunId','sourceCommit')}
  good={**r,'status':'linked','cloudReadbackVerified':True};self.assertTrue(c.valid_ack(r,good))
  for key in r:self.assertFalse(c.valid_ack(r,{**good,key:'different'}),key)
  self.assertFalse(c.valid_ack(r,{**good,'cloudReadbackVerified':False}));self.assertFalse(c.valid_ack(r,{**good,'status':'ready'}))
 def test_receipt_lane_scope(self):
  for row,kind in [({'lessonId':'AI-01','locale':'en'},'ready'),({'lessonId':'M01-L01','locale':'ar'},'ready'),({'lessonId':'M01-L01','locale':'en'},'anything')]:
   with self.assertRaises(ValueError):c.receipt_path(row,kind)
 def test_commit_uses_separate_worktree_and_preserves_render_head(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);origin=d/'origin.git';root=d/'root';root.mkdir()
   def git(*a,cwd=root):return subprocess.check_output(['git',*a],cwd=cwd,stderr=subprocess.DEVNULL).decode().strip()
   git('init','--bare',str(origin));git('init');git('config','user.email','test@example.invalid');git('config','user.name','Scoped Test')
   (root/'sentinel').write_text('immutable render source');git('add','sentinel');git('commit','-m','source');git('branch','-M',c.BRANCH);git('remote','add','origin',str(origin));git('push','origin',c.BRANCH)
   before=git('rev-parse','HEAD');r={'lessonId':'M01-L01','locale':'en','newGuid':'test'}
   with patch.object(c,'ROOT',root),patch.dict(os.environ,{'GITHUB_REF':'refs/heads/'+c.BRANCH}):
    c.commit_receipt(r,'ready');c.commit_receipt(r,'ready')
    with self.assertRaises(RuntimeError):c.commit_receipt({**r,'newGuid':'other'},'ready')
   self.assertEqual(git('rev-parse','HEAD'),before);self.assertEqual((root/'sentinel').read_text(),'immutable render source')
   value=json.loads(git('--git-dir',str(origin),'show',c.BRANCH+':'+c.receipt_path(r,'ready')))
   self.assertEqual(value,r)
if __name__=='__main__':unittest.main()
