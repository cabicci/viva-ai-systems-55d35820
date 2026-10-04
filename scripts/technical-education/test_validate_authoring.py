import copy
import importlib.util
import json
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location('authoring', HERE / 'validate-authoring.py')
authoring = importlib.util.module_from_spec(spec)
spec.loader.exec_module(authoring)


class AuthoringGate(unittest.TestCase):
    def setUp(self):
        self.pkg = json.loads((ROOT / 'src/lib/technical-education/lessons/M01-L01__en.json').read_text())

    def errors(self, pkg):
        return authoring.validate_package(pkg, 'M01-L01', 'en')

    def test_accepted_baseline(self):
        self.assertEqual(self.errors(self.pkg), [])
        report = authoring.audit(ROOT)
        self.assertEqual(report['errors'], [])
        self.assertEqual(report['new_authored_lesson_count'], 0)
        self.assertEqual(report['missing_lesson_count'], 75)

    def test_outline_cannot_pass_as_lesson(self):
        self.assertTrue(self.errors({'id': 'M01-L01', 'locale': 'en', 'title': 'Outline'}))

    def test_locale_fallback_cannot_pass(self):
        self.pkg['locale'] = 'ar-EG'
        self.assertIn('locale identity mismatch', self.errors(self.pkg))

    def test_reused_illustration_cannot_pass(self):
        self.pkg['sections'][1]['diagram'] = self.pkg['sections'][0]['diagram']
        self.assertIn('repeated explanation illustration', self.errors(self.pkg))

    def test_source_footer_cannot_pass(self):
        self.pkg['intro'] += ' Metwood source_pdf_pages: 17'
        self.assertIn('learner source leakage', self.errors(self.pkg))

    def test_corrupt_answer_cannot_pass(self):
        self.pkg['quiz'][0]['correct'] = 8
        self.assertIn('answer index invalid', self.errors(self.pkg))

    def test_missing_explanation_target_cannot_pass(self):
        self.pkg['faq'][0]['sectionId'] = 'missing'
        self.assertIn('FAQ targets absent section', self.errors(self.pkg))

    def test_adaptation_can_repeat_a_fact_without_drift(self):
        original = copy.deepcopy(self.pkg)
        self.pkg['intro'] += ' Example 1200 mm.'
        original['intro'] += ' Example 1200 mm; repeat 1200 mm.'
        self.assertEqual(authoring.canonical_structure(self.pkg), authoring.canonical_structure(original))
        original['intro'] += ' Another fact 1194 mm.'
        self.assertNotEqual(authoring.canonical_structure(self.pkg), authoring.canonical_structure(original))

    def test_incomplete_journey_is_not_marked_complete(self):
        report = authoring.audit(ROOT, complete=True)
        self.assertEqual(report['gate'], 'fail')
        self.assertIn('completion denied: 75 lessons remain unauthored', report['errors'])


if __name__ == '__main__':
    unittest.main()
