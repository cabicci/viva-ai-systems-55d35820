import copy
import unittest
from media_plan import digest, package
from media_registry import checked_media, key


class MediaRegistryTests(unittest.TestCase):
    def setUp(self):
        self.data = package('AC-BUS-M01-L02', 'en')
        guid = '11111111-1111-4111-8111-111111111111'
        self.entry = {'lessonId': self.data['id'], 'locale': 'en',
            'sourceSha256': digest(self.data), 'playbackReady': True, 'videoId': guid,
            'durationSeconds': 100,
            'embedUrl': f'https://iframe.mediadelivery.net/embed/1/{guid}?autoplay=false&preload=false'}

    def check(self, entry):
        return checked_media(self.data, {key(self.data['id'], 'en'): entry})

    def test_wrong_lesson_locale_and_stale_source_are_rejected(self):
        for field, value in [('lessonId', 'other'), ('locale', 'ar-EG'), ('sourceSha256', 'old')]:
            entry = dict(self.entry, **{field: value})
            with self.assertRaises(ValueError):
                self.check(entry)

    def test_unready_missing_and_autoplay_are_not_attached(self):
        self.assertIsNone(checked_media(self.data, {}))
        self.assertIsNone(self.check(dict(self.entry, playbackReady=False)))
        with self.assertRaises(ValueError):
            self.check(dict(self.entry, embedUrl=self.entry['embedUrl'].replace('autoplay=false','autoplay=true')))
        self.assertEqual(self.check(self.entry)['videoId'], self.entry['videoId'])


if __name__ == '__main__':
    unittest.main()
