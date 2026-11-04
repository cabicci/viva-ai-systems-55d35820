import json, sys, tempfile, unittest, urllib.error
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import media_pipeline as m

class MediaTests(unittest.TestCase):
 def test_single_repair_cannot_retry_or_regenerate_other_segments(self):
  media=m.p.read(m.HERE/'course/manifest.json')['media'];contract=m.p.read(m.HERE/'course/audio-contract.json')
  lesson=m.p.content('ar-EG');chemical=next(s for s in lesson['scenes'] if s['id']=='s101-chemical');other=lesson['scenes'][0]
  new_key=m.p.audio_key(chemical,'ar-EG',media)
  with tempfile.TemporaryDirectory() as td:
   folder=Path(td)/'ar-EG';old=folder/'audio-attempts'/f'old-{m.p.digest(contract)}.json'
   m.p.write(old,{'attempts':[{'attempt':i,'status':'reviewed'} for i in range(4)]});old_bytes=old.read_bytes()
   request={'audioRepair':{'locale':'ar-EG','scene':'s101-chemical','additionalAttempts':1,'previousAttemptCount':4,'previousAudioKey':'old','previousStateSha256':m.sha(old),'newAudioKey':new_key}}
   def generate(scene,loc,settings,key,path):
    self.assertEqual(scene['id'],'s101-chemical');self.assertEqual(settings['maxAttempts'],1);self.assertEqual(settings['transportAttempts'],1)
    path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(b'fake failed audio');return 'generated'
   with patch.object(m,'authorize',return_value=request),patch.object(m,'key_for',return_value='fake'),patch.object(m.p,'OUT',Path(td)),patch.object(m.p,'content',return_value={'scenes':[other,chemical]}),patch.object(m.p,'synthesize',side_effect=generate) as gen,patch.object(m,'review_audio',return_value={'passed':False}),patch.object(m.time,'sleep'):
    with self.assertRaisesRegex(AssertionError,'require review'):m.audio('ar-EG')
    self.assertEqual(gen.call_count,1)
    with self.assertRaisesRegex(AssertionError,'require review'):m.audio('ar-EG')
    self.assertEqual(gen.call_count,1)
   self.assertEqual(old.read_bytes(),old_bytes)
   self.assertEqual(len(list((folder/'audio-history').glob('*.wav'))),1)
 def test_single_transport_attempt_has_no_hidden_retry(self):
  with patch.object(m.p.urllib.request,'urlopen',side_effect=urllib.error.URLError('test transport failure')) as call,patch.object(m.p.time,'sleep'):
   with self.assertRaises(RuntimeError):m.p.request_json('https://example.test','fake',{'data':'test'},max_attempts=1)
   self.assertEqual(call.call_count,1)
 def test_visual_rejection_preserves_budget_and_unaffected_assets(self):
  entry={'sha256':'bad'};state={'accepted':entry,'attempts':[{'attempt':0},{'attempt':1}]}
  feedback={'rejectedSha256':['bad'],'reason':'wrong radio'}
  m.apply_visual_review(state,feedback)
  self.assertNotIn('accepted',state);self.assertEqual(len(state['attempts']),2)
  self.assertEqual(state['manualRejections'][0]['entry'],entry)
  m.apply_visual_review(state,feedback)
  self.assertEqual(len(state['manualRejections']),1)
  good={'accepted':{'sha256':'good'},'attempts':[{'attempt':0}]}
  m.apply_visual_review(good,feedback)
  self.assertIn('accepted',good)
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
