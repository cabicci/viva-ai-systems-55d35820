import unittest,copy
from gate import evaluate
class GateTests(unittest.TestCase):
 def setUp(self):
  self.row={'id':'L01-S01','audioSHA256':'a','scriptSHA256':'s','deliverySHA256':'d','model':'tts','voice':'Kore','automatedComplete':True,'expectedCalls':4,'successfulCalls':4,'unresolvedFindingIds':[],'ownerRejected':False,'listeningApproval':{'status':'accepted','audioSHA256':'a','evidence':'TEST FIXTURE ONLY'}}
  self.report={'schemaVersion':1,'locale':'ar','scenes':[self.row]}
 def call(self):return evaluate(self.report,'L01-S01','a','s','d','tts','Kore')
 def test_matching_approved_fixture(self):self.assertTrue(self.call()['allowed'])
 def test_changed_recording_rejects_old_approval(self):self.row['audioSHA256']='new';self.assertFalse(self.call()['allowed'])
 def test_changed_script(self):self.row['scriptSHA256']='changed';self.assertFalse(self.call()['allowed'])
 def test_changed_delivery(self):self.row['deliverySHA256']='changed';self.assertFalse(self.call()['allowed'])
 def test_voice_substitution(self):self.row['voice']='Charon';self.assertFalse(self.call()['allowed'])
 def test_timeout_coverage(self):self.row['successfulCalls']=3;self.assertFalse(self.call()['allowed'])
 def test_owner_rejection_overrides_machine(self):self.row['ownerRejected']=True;self.assertFalse(self.call()['allowed'])
 def test_unresolved_finding(self):self.row['unresolvedFindingIds']=['pronunciation-1'];self.assertFalse(self.call()['allowed'])
 def test_unheard_audio_not_accepted(self):self.row['listeningApproval']={};self.assertFalse(self.call()['allowed'])
 def test_missing_scene(self):self.report['scenes']=[];self.assertFalse(self.call()['allowed'])
 def test_incomplete_review(self):self.row['automatedComplete']=False;self.assertFalse(self.call()['allowed'])
 def test_approval_of_other_audio(self):self.row['listeningApproval']['audioSHA256']='different';self.assertFalse(self.call()['allowed'])
if __name__=='__main__':unittest.main(verbosity=2)