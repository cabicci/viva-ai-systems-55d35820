import importlib.util,json,sys,tempfile,types,unittest
from pathlib import Path
from unittest.mock import patch
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE))
# Image generation is outside this audio-only unit test.
try: import PIL
except ImportError:
    stub=types.ModuleType('PIL');stub.Image=object();sys.modules['PIL']=stub
spec=importlib.util.spec_from_file_location('full_media',BASE/'production/media.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AudioRepairTest(unittest.TestCase):
    def test_repairs_only_named_segment_keeps_original_and_preserves_words(self):
        lesson={'locale':'en','scenes':[{'id':'s01','narration':'Keep these words.'},{'id':'s02','narration':'Only fix pronunciation.'}]}
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);out=root/'output';folder=out/'en'
            (root/'course').mkdir();(folder/'audio').mkdir(parents=True)
            (root/'course/manifest.json').write_text(json.dumps({'media':{'test':True}}))
            (folder/'receipt.json').write_text(json.dumps({'generated':True}))
            (folder/'audio/s01.wav').write_bytes(b'keep-original')
            (folder/'audio/s02.wav').write_bytes(b'bad-pronunciation')
            calls=[]
            def synth(scene,locale,media,key,path):
                calls.append((scene.copy(),locale));path.write_bytes(b'corrected-pronunciation');return 'generated'
            def produce(locale):
                self.assertFalse(json.loads((folder/'receipt.json').read_text())['generated'])
                (folder/'receipt.json').write_text(json.dumps({'generated':True}))
            with patch.object(m.p,'ROOT',root),patch.object(m.p,'OUT',out),patch.object(m.p,'content',return_value=lesson),patch.object(m.p,'audio_key',side_effect=lambda s,l,media:s['id']),patch.object(m.p,'synthesize',side_effect=synth),patch.object(m.p,'produce',side_effect=produce),patch.object(m,'check_audio',return_value={'passed':True}),patch.dict('os.environ',{'GEMINI_API_KEY':'test-not-a-real-key'}):
                m.repair_audio('en',{'issues':[{'scene':'s02','severity':'critical','reason':'mispronounced word'}]})
                self.assertEqual(calls,[({'id':'s02','narration':'Only fix pronunciation.'},'en')])
                self.assertEqual((folder/'audio/s01.wav').read_bytes(),b'keep-original')
                self.assertEqual(next((folder/'rejected-audio').glob('*.wav')).read_bytes(),b'bad-pronunciation')
                self.assertTrue(json.loads((folder/'receipt.json').read_text())['audioQualityRepairs']['rounds'][0]['repaired'][0]['scriptUnchanged'])
                with self.assertRaisesRegex(AssertionError,'one quality repair'):m.repair_audio('en',{'issues':[{'scene':'s02','severity':'critical'}]})
                self.assertEqual(len(calls),1)
if __name__=='__main__':unittest.main()
