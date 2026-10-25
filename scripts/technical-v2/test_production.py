import importlib.util,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('production',Path(__file__).with_name('production.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ProductionGuards(unittest.TestCase):
 def test_exact_scope(self):
  rows=m.baseline();self.assertEqual(len(rows),320);self.assertEqual(len({r['lesson_id'] for r in rows}),80)
  self.assertEqual(len({r['video_guid'] for r in rows}),320)
  for row in rows:self.assertIn(row['locale'],m.LOCALES)
 def test_no_fallback(self):
  with self.assertRaises(ValueError):m.cell('M01-L01','ar')
  with self.assertRaises(ValueError):m.cell('intro-m1-l1','ar-EG')
 def test_numbers_and_identifier(self):
  self.assertEqual(m.egyptian_number(564),'خمسمية وأربعة وستين')
  self.assertEqual(m.egyptian_number(600),'ستّمية')
  value=m.spoken_egyptian('560 − 12.5 − 12.5 = 535 مم، M04-L02 وA1')
  self.assertIn('اتناشر فاصلة خمسة',value);self.assertIn('خمسمية وخمسة وتلاتين',value)
  self.assertIn('M04-L02',value);self.assertIn('A1',value);self.assertNotIn('مم',value)
 def test_pilot_locales(self):
  for locale in m.LOCALES:
   _,scenes=m.scenes_for('M04-L02',locale);self.assertEqual(len(scenes),7)
   self.assertIn('273',scenes[4]['formula'])
if __name__=='__main__':unittest.main()
