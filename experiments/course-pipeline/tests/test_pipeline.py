import copy
import http.client
import io
import json
import re
import importlib.util
from pathlib import Path
import tempfile
import unittest
import wave
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('course_pipeline', Path(__file__).resolve().parents[1] / 'pipeline.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class PipelineTest(unittest.TestCase):
    def test_incomplete_provider_transport_retries_without_accepting_partial_data(self):
        failures=[http.client.IncompleteRead(b'{'),http.client.IncompleteRead(b'{}'),io.BytesIO(b'{"complete":true}')]
        with patch.object(p.urllib.request,'urlopen',side_effect=failures) as request,patch.object(p.time,'sleep'):
            self.assertEqual(p.request_json('https://example.invalid','test-key',{'example':True}),{'complete':True})
            self.assertEqual(request.call_count,3)
    def test_complete_locale_packages(self):
        self.assertEqual(p.validate()['scenes'],32)

    def test_engine_identity_uses_portable_paths(self):
        with patch.object(p,'digest',side_effect=lambda value: value):
            hashes=p.engine_hash()
        self.assertIn('course/visuals.json',hashes)
        self.assertIn('course/visual-contract.json',hashes)
        self.assertFalse(any('\\' in key for key in hashes))

    def test_course_brand_matches_platform_tokens(self):
        platform=(p.REPO/'src/styles.css').read_text(encoding='utf-8')
        module=(p.ROOT/'src/brand.ts').read_text(encoding='utf-8')
        palette=json.loads(module[module.index('{'):module.rindex('}')+1])
        stylesheet=(p.ROOT/'src/platform-brand.css').read_text(encoding='utf-8')
        for name,value in palette.items():
            self.assertEqual(re.search(r'--'+name+r': ([^;]+);',platform).group(1),value)
            self.assertIn('--'+name+':'+value+';',stylesheet)
        self.assertIn('Tajawal',(p.ROOT/'src/style.css').read_text(encoding='utf-8'))
        ai_theme=(p.REPO/'remotion/src/theme.ts').read_text(encoding='utf-8')
        renderer=(p.REPO/'remotion/src/course-pipeline/index.tsx').read_text(encoding='utf-8')
        self.assertIn('@remotion/google-fonts/Cairo',ai_theme)
        self.assertIn("const font='Cairo, sans-serif'",renderer)

    def test_visual_edit_does_not_regenerate_paid_audio(self):
        scene=p.content('en')['scenes'][0]
        media=p.read(p.ROOT/'course/manifest.json')['media']
        changed=copy.deepcopy(scene)
        changed['title']='A different display heading'
        self.assertEqual(p.audio_key(scene,'en',media),p.audio_key(changed,'en',media))
        changed['narration']+=' A new spoken sentence.'
        self.assertNotEqual(p.audio_key(scene,'en',media),p.audio_key(changed,'en',media))
        self.assertNotEqual(p.audio_key(scene,'en',media),p.audio_key(scene,'de',media))

    def test_existing_audio_is_reused_without_provider(self):
        with tempfile.TemporaryDirectory() as temp:
            file=Path(temp)/'cached.wav'
            with wave.open(str(file),'wb') as wav:
                wav.setparams((1,2,24000,0,'NONE','not compressed'))
                wav.writeframes(bytes(48000))
            with patch.object(p,'request_json',side_effect=AssertionError('paid call forbidden')):
                self.assertEqual(p.synthesize({},'en',{},None,file),'reused')

    def test_frame_padding_keeps_scene_audio_in_sync(self):
        lesson=copy.deepcopy(p.content('en'))
        lesson['scenes']=lesson['scenes'][:2]
        media=p.read(p.ROOT/'course/manifest.json')['media']
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            (folder/'audio').mkdir()
            for scene in lesson['scenes']:
                with wave.open(str(folder/'audio'/(p.audio_key(scene,'en',media)+'.wav')),'wb') as wav:
                    wav.setparams((1,2,24000,0,'NONE','not compressed'))
                    wav.writeframes(bytes(48014))
            props=p.assemble(lesson,media,folder)
            with wave.open(str(folder/'master.wav'),'rb') as wav:
                self.assertEqual(wav.getnframes(),props['durationInFrames']*800)
            self.assertEqual(props['scenes'][1]['startFrame'],props['scenes'][0]['durationInFrames'])
            self.assertTrue((folder/'captions.vtt').read_text().startswith('WEBVTT'))

    def test_unapproved_content_stops_before_network(self):
        original=p.read
        with patch.object(p,'read',wraps=p.read) as read:
            def fake(path):
                if str(path).endswith('pilot-request.json'):
                    return {'snapshot':{'wrong':'content'}}
                return original(path)
            read.side_effect=fake
            with patch.object(p,'request_json',side_effect=AssertionError('network forbidden')):
                with self.assertRaisesRegex(AssertionError,'snapshot|source/renderer'):
                    p.produce('en')

    def test_reusable_package_respects_its_own_locale_and_mode(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            manifest=p.read(p.ROOT/'course/manifest.json')
            manifest.update({'courseId':'ACADEMIC-EXAMPLE','lessonId':'ACADEMIC-01','locales':['en'],'mode':'academic'})
            data=copy.deepcopy(p.content('en'))
            data['lessonId']='ACADEMIC-01'
            data['scenes']=data['scenes'][:2]
            data['checklist']=[]
            p.write(root/'course/manifest.json',manifest)
            p.write(root/'course/en.json',data)
            with patch.object(p,'ROOT',root),patch.object(p,'LOCALES',('en',)):
                self.assertEqual(p.validate()['scenes'],2)
                self.assertEqual(p.validate()['locales'],['en'])

if __name__=='__main__': unittest.main()
