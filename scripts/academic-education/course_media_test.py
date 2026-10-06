import math
import unittest
from course_media import frame_durations, production_plan, reusable


class CourseMediaTests(unittest.TestCase):
    def test_long_timeline_has_no_per_scene_rounding_drift(self):
        durations = [1.011, 2.099, 3.017] * 100
        frames = frame_durations(durations)
        expected = sum(durations) + .5 * (len(durations)-1)
        self.assertLessEqual(abs(sum(frames)/30 - expected), 1/60)

    def test_existing_failed_upload_cannot_trigger_duplicate_generation(self):
        for status in [0, 5, 6]:
            with self.assertRaises(ValueError):
                reusable({'status': status})
        for status in [1, 2, 3, 4, 7, 8]:
            self.assertTrue(reusable({'status': status}))
        self.assertFalse(reusable(None))

    def test_invalid_durations_rejected_before_render(self):
        for duration in [-1, 0, math.inf, math.nan]:
            with self.assertRaises(ValueError):
                frame_durations([duration])

    def test_pilot_and_unrequested_identity_rejected(self):
        for lesson, locale in [('AC-BUS-M01-L01', 'en'), ('other', 'ar-EG')]:
            with self.assertRaises(ValueError):
                production_plan(lesson, locale)


if __name__ == '__main__':
    unittest.main()
