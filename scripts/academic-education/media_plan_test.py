import copy
import tempfile
import unittest
from pathlib import Path
from media_plan import LOCALES, PILOT, make_plan, package, pieces, plain, prepare


class MediaPreparationTests(unittest.TestCase):
    def test_every_remaining_lesson_has_one_exact_locale_plan(self):
        with tempfile.TemporaryDirectory() as folder:
            result = prepare(Path(folder))
            pairs = {(row['lessonId'], row['locale']) for row in result['entries']}
            self.assertEqual(len(pairs), 156)
            self.assertFalse(any(lesson == PILOT for lesson, _ in pairs))
            for locale in LOCALES:
                self.assertEqual(sum(loc == locale for _, loc in pairs), 39)
            self.assertFalse(result['mediaProductionStarted'])

    def test_narration_does_not_consume_assessment_secrets(self):
        data = copy.deepcopy(package('AC-BUS-M01-L02', 'en'))
        before = make_plan(data)['scenes']
        data['quiz'] = [{'correct': 'SENTINEL_SECRET', 'explanation': 'SENTINEL_SECRET'}]
        data['assignment']['criteria'] = ['SENTINEL_SECRET']
        self.assertEqual(before, make_plan(data)['scenes'])

    def test_split_preserves_words_and_numbers(self):
        text = '**Revenue:** 1,500 − 900 = 600. قيمة ١٥٠ × ٢٠ = ٣٠٠٠. ' * 40
        self.assertEqual(' '.join(pieces(text)), plain(text))
        self.assertTrue(all(len(part) <= 420 for part in pieces(text)))

    def test_source_revision_changes_identity(self):
        data = copy.deepcopy(package('AC-BUS-M01-L02', 'ar-EG'))
        before = make_plan(data)
        data['sections'][0]['text'] += ' توضيح جديد.'
        self.assertNotEqual(before['sourceSha256'], make_plan(data)['sourceSha256'])

    def test_short_sentences_stay_together(self):
        self.assertEqual(pieces('First sentence. Second sentence.', 20),
                         ['First sentence.', 'Second sentence.'])

    def test_pilot_and_missing_locale_have_no_fallback(self):
        for lesson, locale in [(PILOT, 'ar-EG'), ('AC-BUS-M01-L02', 'fr'), ('missing', 'en')]:
            with self.assertRaises(ValueError):
                package(lesson, locale)


if __name__ == '__main__':
    unittest.main()
