import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import generate_visuals as visuals
import visual_quality as quality
from PIL import Image

class VisualCacheTest(unittest.TestCase):
    def test_quality_response_shape_is_validated(self):
        checks=[{'id':'clean','pass':True,'reason':'empty probe'}]
        self.assertEqual(quality.normalize_checks(checks,{'clean'})['checks'],checks)
        with self.assertRaises(AssertionError): quality.normalize_checks({'checks':[]},{'clean'})
        with self.assertRaises(AssertionError): quality.normalize_checks([{'id':'clean','pass':'yes'}],{'clean'})
    def test_existing_image_is_reused_without_a_paid_request(self):
        plan=visuals.p.read(ROOT/'course/visuals.json')
        asset=plan['assets'][0]
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            (folder/'cache').mkdir()
            Image.new('RGB',(1600,900)).save(folder/'cache'/f'{visuals.asset_key(plan,asset)}.png')
            with patch.object(visuals.p,'request_json',side_effect=AssertionError('paid request forbidden')):
                result=visuals.generate(plan,asset,None,folder)
            self.assertEqual(result['status'],'reused')
            self.assertTrue((folder/result['filename']).exists())

    def test_style_change_invalidates_asset_but_scene_mapping_does_not(self):
        plan=visuals.p.read(ROOT/'course/visuals.json')
        asset=plan['assets'][0]
        before=visuals.asset_key(plan,asset)
        self.assertEqual(before,visuals.asset_key(plan,{**asset,'scenes':['different-scene']}))
        self.assertNotEqual(before,visuals.asset_key({**plan,'style':plan['style']+' More stylized.'},asset))

if __name__=='__main__': unittest.main()
