import importlib.util,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'production'))
import lesson_art as art
import media_current as media
import pipeline as p

class IndependentArtTest(unittest.TestCase):
    def test_all_teaching_lessons_have_distinct_art_with_no_video_alias(self):
        mapping=p.read(BASE/'production/lesson-illustrations.json')
        lessons=p.read(BASE/'planning/curriculum-map.json')['lessons']
        self.assertEqual(set(mapping),{s['id'] for s in lessons if s['type']=='lesson'})
        prompts=[]
        for lid in mapping:
            plan,contract=art.plans(lid)
            self.assertEqual(len(plan['assets']),3)
            self.assertEqual(plan['purpose'],'written-lesson-only')
            self.assertEqual(contract['maxRepairsPerAsset'],1)
            self.assertTrue(all('lesson-art-' in a['id'] and len(a['scenes'])==1 for a in plan['assets']))
            prompts.extend(a['subject'] for a in plan['assets'])
        self.assertEqual(len(set(prompts)),90)

    def test_delivered_video_must_match_current_speech_and_visible_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);folder=root/'output/en';folder.mkdir(parents=True);(root/'course').mkdir()
            scene={'id':'s01','title':'Current title','lead':'Current lead','labels':['a','b','c'],'narration':'Current words'}
            lesson={'scenes':[scene]};manifest={'media':{'voice':'test','model':'test'}}
            def save(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value))
            save(root/'course/en.json',lesson);save(root/'course/manifest.json',manifest)
            save(root/'course/visuals.json',{});save(root/'course/visual-contract.json',{})
            save(root/'output/visuals/receipt.json',{'qualityPassed':True,'planHash':p.digest({}),'qualityContractHash':p.digest({}),'assets':[]})
            (folder/'lesson.mp4').write_bytes(b'video');(folder/'master.wav').write_bytes(b'audio')
            import hashlib
            receipt={'generated':True,'automatedAudioReview':{'passed':True,'audioHash':hashlib.sha256(b'audio').hexdigest()},'audio':[{'scene':'s01','key':'current'}],'visualAssetHashes':{},'verification':{'sha256':hashlib.sha256(b'video').hexdigest()}}
            save(folder/'receipt.json',receipt);save(folder/'props.json',{'scenes':[scene]})
            with patch.object(media.p,'audio_key',return_value='current'):
                self.assertTrue(media.current(root,'en'))
                changed=dict(scene,title='Stale title');save(folder/'props.json',{'scenes':[changed]})
                self.assertFalse(media.current(root,'en'))
                save(folder/'props.json',{'scenes':[scene]});receipt['audio'][0]['key']='outdated-speech';save(folder/'receipt.json',receipt)
                self.assertFalse(media.current(root,'en'))

if __name__=='__main__':unittest.main()
