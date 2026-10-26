import unittest,copy
from selection_contract import step_id,relative_file,artifact_ref,review_gate,scene_bindings
class ContractTests(unittest.TestCase):
 def setUp(self):
  h='a'*64;self.part={'audio':{'sha256':h},'textSHA256':'b'*64,'deliverySHA256':'c'*64,'voice':'Charon','selectedVideo':{'sha256':'d'*64}}
  self.gate={'status':'clear','diagnosticStatus':'clear','sourceAudioSHA256':h,'textSHA256':'b'*64,'deliverySHA256':'c'*64,'voice':'Charon','model':'gemini-3.8-flash-tts','sourcePCM_SHA256':'e'*64,'voiceObservation':{'comparison':'consistent'},'methodAlreadyOwnerAccepted':True,'findings':[],'uncertainties':[],'previousUnresolved':[],'failures':[]}
  self.timing={'audio':{'sha256':h},'textSHA256':'b'*64,'deliverySHA256':'c'*64,'audioFrames':24000,'frames':30,'captions':[{'text':'Actual caption','start':.01,'end':.8}],'actions':{'a':{'start':.1,'end':.9}}};self.render={'sourceAudioSHA256':h,'sourceAudioFrames':24000,'frames':30,'videoSHA256':'d'*64}
 def test_commissioned_steps_only(self):
  self.assertEqual(step_id('S02'),'FATE2-S02');self.assertEqual(step_id('FATE2-S11'),'FATE2-S11')
  for bad in ['S01','S12','../S02','FATE2-S00']:
   with self.assertRaises(ValueError):step_id(bad)
 def test_portable_containment(self):
  self.assertEqual(str(relative_file('output/file.json')),'output/file.json')
  for bad in ['../private.json','/root/a','C:/key','a\\b','']:
   with self.assertRaises(ValueError):relative_file(bad)
 def test_actual_run_reference(self):
  self.assertEqual(artifact_ref({'run':123,'artifact':'actual-scene','file':'output.json','sha256':'a'*64})['run'],123)
  for bad in [True,0,-2,'123']:
   with self.assertRaises(ValueError):artifact_ref({'run':bad,'artifact':'actual','file':'output.json','sha256':'a'*64})
 def test_qualified_audio_exact_pcm(self):self.assertTrue(review_gate(self.gate,self.part,'e'*64))
 def test_held_audio_never_assembles(self):
  for key,value in [('status','hold'),('diagnosticStatus','invalid_diagnostic_hold'),('model','gemini-2.5-pro-preview-tts'),('voice','Kore'),('sourceAudioSHA256','f'*64),('textSHA256','f'*64),('deliverySHA256','f'*64),('methodAlreadyOwnerAccepted',False),('findings',[{'real':'issue'}]),('uncertainties',[{'open':'question'}])]:
   g=copy.deepcopy(self.gate);g[key]=value
   with self.assertRaises(ValueError):review_gate(g,self.part,'e'*64)
  for state in ['uncertain','clear_mismatch','not_compared']:
   g=copy.deepcopy(self.gate);g['voiceObservation']['comparison']=state
   with self.assertRaises(ValueError):review_gate(g,self.part,'e'*64)
  with self.assertRaises(ValueError):review_gate(self.gate,self.part,'f'*64)
 def test_actual_clock_binding(self):self.assertTrue(scene_bindings(self.part,self.timing,self.render))
 def test_crop_or_extra_gap_refused(self):
  for samples in [24001,23200,0]:
   t=copy.deepcopy(self.timing);r=copy.deepcopy(self.render);t['audioFrames']=r['sourceAudioFrames']=samples
   with self.assertRaises(ValueError):scene_bindings(self.part,t,r)
  t=copy.deepcopy(self.timing);r=copy.deepcopy(self.render);t['audioFrames']=r['sourceAudioFrames']=23999;self.assertTrue(scene_bindings(self.part,t,r))
 def test_stale_render_refused(self):
  r=copy.deepcopy(self.render);r['videoSHA256']='f'*64
  with self.assertRaises(ValueError):scene_bindings(self.part,self.timing,r)
 def test_invalid_or_invented_clock_refused(self):
  for bad in [{'start':.2,'end':2.0},{'start':.2,'end':.2},{'start':-.1,'end':.5}]:
   t=copy.deepcopy(self.timing);t['actions']['a']=bad
   with self.assertRaises(ValueError):scene_bindings(self.part,t,self.render)
  t=copy.deepcopy(self.timing);t['captions'].append({'text':'Overlap','start':.2,'end':.9})
  with self.assertRaises(ValueError):scene_bindings(self.part,t,self.render)
if __name__=='__main__':unittest.main()
