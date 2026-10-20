import unittest
from assess_scene import classify_alert
class AssessmentTests(unittest.TestCase):
 def f(self,**kw):
  f={'start':1.,'end':2.,'category':'pronunciation','heard':'طماطم','expected':'طماطم','reason':'التباس في صوت المقطع'};f.update(kw);return f
 def test_zero_length_is_held(self):self.assertEqual(classify_alert(self.f(end=1.),10,'طماطم'),'hold_invalid_timing')
 def test_window_edge_is_preserved_as_excluded(self):self.assertEqual(classify_alert(self.f(start=9.5,end=10.,reason='نهاية المقطع'),10,'طماطم'),'excluded_window_edge')
 def test_whole_scene_edge_not_silently_dismissed(self):self.assertEqual(classify_alert(self.f(start=9.5,end=10.,reason='نهاية المقطع'),10,'طماطم',True),'hold_candidate')
 def test_no_forced_msa_case_ending(self):self.assertEqual(classify_alert(self.f(reason='لم ينطق تنوين النصب'),10,'طماطم'),'excluded_msa_case_ending')
 def test_wrong_semantic_correction_held(self):self.assertEqual(classify_alert(self.f(category='substitution',heard='صحي',expected='صحيح'),10,'استنتاج صحي'),'hold_unsupported_proposed_change')
 def test_real_pronunciation_alert_never_autoaccepted(self):self.assertEqual(classify_alert(self.f(),10,'طماطم',True),'hold_candidate')
if __name__=='__main__':unittest.main()