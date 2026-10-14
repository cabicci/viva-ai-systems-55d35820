import json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import media_pipeline as m

class MediaTests(unittest.TestCase):
 def test_source_complete_and_bounded(self):
  self.assertEqual(m.validate()['scenes'],40)
 def test_dropping_a_source_sentence_is_rejected(self):
  original=m.p.content
  def broken(locale):
   data=original(locale);data['scenes'][0]['narration']=data['scenes'][0]['narration'].split('\n\n')[0];data['scenes'][0]['caption']=data['scenes'][0]['narration'];return data
  with patch.object(m.p,'content',side_effect=broken):
   with self.assertRaisesRegex(AssertionError,'dropped'):m.validate()
 def test_audio_quality_keeps_failure_and_requires_each_criterion(self):
  contract=m.p.read(m.HERE/'course/audio-contract.json')
  scene=m.p.content('en')['scenes'][0]
  with tempfile.TemporaryDirectory() as td:
   f=Path(td)/'audio'/'test.wav';f.parent.mkdir();f.write_bytes(b'fake audio test only')
   response={'candidates':[{'content':{'parts':[{'text':json.dumps({'transcript':'incomplete','checks':[{'id':i,'pass':i!='complete','reason':'test'} for i in contract['criteria']]})}]}}]}
   with patch.object(m.p,'request_json',return_value=response):
    q=m.review_audio(f,scene,'en',contract,'fake-key')
    self.assertFalse(q['passed']);self.assertFalse(q['humanListeningReviewed'])
   response['candidates'][0]['content']['parts'][0]['text']=json.dumps({'transcript':'bad','checks':[]})
   f.write_bytes(b'different fake audio')
   with patch.object(m.p,'request_json',return_value=response):
    with self.assertRaises(AssertionError):m.review_audio(f,scene,'en',contract,'fake-key')
 def test_display_labels_do_not_invalidate_audio(self):
  media=m.p.read(m.HERE/'course/manifest.json')['media'];scene=m.p.content('en')['scenes'][0]
  edited={**scene,'labels':['new visual labels'],'title':'New visual title'}
  self.assertEqual(m.p.audio_key(scene,'en',media),m.p.audio_key(edited,'en',media))
 def test_image_failure_is_limited_to_initial_plus_three_repairs(self):
  plan={'model':'fake','assets':[{'id':'bad','subject':'original','scenes':['s101-test'],'role':'video'}]}
  contract={'reviewModel':'fake-review','maxRepairsPerAsset':3}
  original=m.p.read
  def read(path):
   if Path(path).name=='visuals.json':return plan
   if Path(path).name=='visual-contract.json':return contract
   return original(path)
  def generate(plan,asset,key,dest):
   (dest/'bad.png').write_bytes(b'fake-image')
   return {'id':'bad','filename':'bad.png','sha256':m.sha(dest/'bad.png')}
  quality={'passed':False,'checks':[{'id':'required','pass':False,'reason':'missing object'}]}
  with tempfile.TemporaryDirectory() as td,patch.object(m,'authorize'),patch.object(m,'key_for',return_value='fake'),patch.object(m.p,'OUT',Path(td)),patch.object(m.p,'read',side_effect=read),patch.object(m.g,'asset_key',return_value='same'),patch.object(m.g,'generate',side_effect=generate) as gen,patch.object(m.v,'check',return_value=quality):
   with self.assertRaises(AssertionError):m.images()
   self.assertEqual(gen.call_count,4)
   # Resuming an exhausted item cannot quietly buy four more attempts.
   with self.assertRaises(AssertionError):m.images()
   self.assertEqual(gen.call_count,4)

if __name__=='__main__':unittest.main()
