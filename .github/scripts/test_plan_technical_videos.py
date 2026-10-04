"""Production scheduling gates; no provider calls or secret access."""
import contextlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import plan_technical_videos as planner


class PlanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.docs = self.root / "docs/experiments/technical-education"
        self.docs.mkdir(parents=True)
        (self.root / "src/lib").mkdir(parents=True)
        self.ids = ["technical-m01-l01"]
        package = self.root / "src/lib/technical-education/lessons"
        package.mkdir(parents=True)
        for locale in planner.LOCALES:
            (package / f"M01-L01__{locale}.json").write_text("{}")
        self.save({})

    def tearDown(self):
        self.temp.cleanup()

    def save(self, revisions):
        (self.docs / "video-production-reviewed.json").write_text(json.dumps({"lesson_ids": self.ids}))
        (self.docs / "video-revisions.json").write_text(json.dumps(revisions))
        (self.root / "src/lib/bunny-videos.ts").write_text("\n".join(
            f'"technical-m01-l01__{locale}": "00000000-0000-0000-0000-000000000001",'
            for locale in planner.LOCALES))

    def plan(self, ready=True, force=False):
        with patch.object(planner.builder, "fingerprint", return_value="reviewed-revision"):
            return planner.plan(self.root, lambda _: ready, force)

    def test_ready_exact_revision_is_reused(self):
        self.save({f"technical-m01-l01__{locale}": "reviewed-revision" for locale in planner.LOCALES})
        self.assertEqual(self.plan(), [])

    def test_changed_revision_or_unready_video_is_planned(self):
        self.save({f"technical-m01-l01__{locale}": "old" for locale in planner.LOCALES})
        self.assertEqual(len(self.plan()), 4)
        self.save({f"technical-m01-l01__{locale}": "reviewed-revision" for locale in planner.LOCALES})
        self.assertEqual(len(self.plan(ready=False)), 4)

    def test_force_is_explicit(self):
        self.save({f"technical-m01-l01__{locale}": "reviewed-revision" for locale in planner.LOCALES})
        self.assertEqual(len(self.plan(force=True)), 4)

    def test_missing_reviewed_package_blocks_approval(self):
        (self.root / "src/lib/technical-education/lessons/M01-L01__en.json").unlink()
        with self.assertRaisesRegex(ValueError, "Reviewed lesson package is missing"):
            self.plan()

    def test_no_approved_lessons_means_no_production(self):
        self.ids = []
        self.save({})
        self.assertEqual(self.plan(), [])

    def test_full_journey_is_bounded_and_remainder_is_visible(self):
        cells = [{"lesson_id": f"lesson-{i}", "locale": "en"} for i in range(320)]
        output = self.root / "github-output"
        with patch.object(planner, "plan", return_value=cells), patch.dict(os.environ, {"GITHUB_OUTPUT": str(output)}), contextlib.redirect_stdout(io.StringIO()) as log:
            planner.main()
        fields = dict(line.split("=", 1) for line in output.read_text().splitlines())
        self.assertEqual(len(json.loads(fields["matrix"])["include"]), 200)
        self.assertEqual(fields["deferred_count"], "120")
        self.assertIn("120 cells remain", log.getvalue())


if __name__ == "__main__":
    unittest.main()
