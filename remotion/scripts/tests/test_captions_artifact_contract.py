"""No-network regression: captions artifact contract for generate-one/full-300."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = REPO_ROOT / "remotion" / "scripts"
sys.path.insert(0, str(SCRIPTS))

from lib.captions_vtt import (  # noqa: E402
    GAP_SECONDS,
    default_captions_path,
    parse_webvtt_cues,
    scenes_to_webvtt,
    validate_webvtt_file,
    write_captions_vtt,
)
from lib.production_artifact import (  # noqa: E402
    REQUIRED_PRODUCTION_FILES,
    build_status_and_validation,
    require_captions,
    sha256_file,
    stage_production_result,
)


FIXTURE_SCENES = [
    {
        "card": "TitleCard",
        "spoken": "Welcome to AI Summarization.",
        "focus": "summarization",
    },
    {
        "card": "BulletsCard",
        "spoken": "A useful summary needs a clear question and context.",
        "focus": "context",
    },
]

FIXTURE_DURATIONS = [4.2, 5.8]


class CaptionsVttTests(unittest.TestCase):
    def test_default_output_path_matches_workflow_contract(self):
        work_id = "analyst-m3-l2-ai-summarization__en"
        self.assertEqual(
            default_captions_path(work_id),
            "/tmp/analyst-m3-l2-ai-summarization__en/captions.vtt",
        )

    def test_scenes_to_webvtt_has_header_and_non_empty_cues(self):
        body = scenes_to_webvtt(FIXTURE_SCENES, FIXTURE_DURATIONS)
        self.assertTrue(body.startswith("WEBVTT\n"))
        self.assertIn("Welcome to AI Summarization.", body)
        self.assertIn("clear question and context", body)
        cues = parse_webvtt_cues_from_text(body)
        self.assertEqual(len(cues), 2)
        self.assertGreater(cues[0][1], cues[0][0])
        self.assertGreater(cues[1][0], cues[0][1])

    def test_cue_text_matches_authoritative_spoken_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            work_id = "lesson__en"
            path = write_captions_vtt(work_id, FIXTURE_SCENES, FIXTURE_DURATIONS,
                                      path=str(Path(tmp) / "captions.vtt"))
            cues = parse_webvtt_cues(path)
            self.assertEqual(cues[0][2], FIXTURE_SCENES[0]["spoken"])
            self.assertEqual(cues[1][2], FIXTURE_SCENES[1]["spoken"])

    def test_timestamps_include_tts_gap_between_segments(self):
        body = scenes_to_webvtt(FIXTURE_SCENES, FIXTURE_DURATIONS)
        cues = parse_webvtt_cues_from_text(body)
        self.assertAlmostEqual(cues[0][0], 0.0)
        self.assertAlmostEqual(cues[0][1], FIXTURE_DURATIONS[0])
        self.assertAlmostEqual(
            cues[1][0],
            FIXTURE_DURATIONS[0] + GAP_SECONDS,
        )

    def test_write_captions_vtt_creates_non_empty_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "captions.vtt"
            write_captions_vtt("cell__en", FIXTURE_SCENES, FIXTURE_DURATIONS, path=str(out))
            self.assertTrue(out.is_file())
            self.assertGreater(out.stat().st_size, 0)
            validate_webvtt_file(out)

    def test_validate_webvtt_file_rejects_missing_file(self):
        with self.assertRaises(FileNotFoundError):
            validate_webvtt_file("/tmp/does-not-exist/captions.vtt")

    def test_validate_webvtt_file_rejects_invalid_header(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.vtt"
            bad.write_text("NOTVTT\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                validate_webvtt_file(bad)

    def test_scene_duration_mismatch_fails(self):
        with self.assertRaises(ValueError):
            scenes_to_webvtt(FIXTURE_SCENES, [1.0])


def parse_webvtt_cues_from_text(body: str) -> list[tuple[float, float, str]]:
    with tempfile.NamedTemporaryFile("w", suffix=".vtt", delete=False, encoding="utf-8") as f:
        f.write(body)
        path = Path(f.name)
    try:
        return parse_webvtt_cues(path)
    finally:
        path.unlink(missing_ok=True)


class ProductionArtifactTests(unittest.TestCase):
    def _fixture_bundle(self, tmp: Path, *, include_captions: bool = True):
        mp4 = tmp / "video.mp4"
        audio = tmp / "audio.mp3"
        captions = tmp / "captions.vtt"
        mp4.write_bytes(b"FAKE_MP4_BYTES" * 20000)
        audio.write_bytes(b"FAKE_MP3_BYTES" * 1000)
        if include_captions:
            write_captions_vtt(
                "cell__en",
                FIXTURE_SCENES,
                FIXTURE_DURATIONS,
                path=str(captions),
            )
        return mp4, audio, captions

    def test_require_captions_returns_checksum(self):
        with tempfile.TemporaryDirectory() as tmp:
            _, _, captions = self._fixture_bundle(Path(tmp))
            digest = require_captions(captions)
            self.assertEqual(digest, sha256_file(captions))

    def test_build_status_and_validation_requires_caption_checksum(self):
        with self.assertRaises(ValueError):
            build_status_and_validation(
                status_fields={"lessonId": "x"},
                video_sha="abc",
                captions_sha="",
                has_audio=True,
                duration_seconds=10.0,
                logo_sha="logo",
            )

    def test_stage_production_result_writes_six_file_bundle(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mp4, audio, captions = self._fixture_bundle(root)
            out_dir = root / "production-result"
            status, validation = stage_production_result(
                out_dir=out_dir,
                mp4=mp4,
                captions=captions,
                audio=audio,
                status_fields={
                    "runMode": "generate-one",
                    "lessonId": "analyst-m3-l2-ai-summarization",
                    "locale": "en",
                    "compositeKey": "analyst-m3-l2-ai-summarization__en",
                },
                duration_seconds=147.859,
                logo_sha="60620006f7f74dcc625ccbd9869a19b45a7683fde04b729694b1c76d1a51d706",
                log_paths=[],
            )
            for name in REQUIRED_PRODUCTION_FILES:
                self.assertTrue((out_dir / name).is_file(), name)
            self.assertTrue(validation["hasCaptions"])
            self.assertTrue(validation["ok"])
            self.assertTrue(status["captionsChecksum"])
            self.assertEqual(
                status["captionsChecksum"],
                sha256_file(out_dir / "captions.vtt"),
            )

    def test_stage_production_result_fails_without_captions(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mp4, audio, captions = self._fixture_bundle(root, include_captions=False)
            with self.assertRaises(FileNotFoundError):
                stage_production_result(
                    out_dir=root / "production-result",
                    mp4=mp4,
                    captions=captions,
                    audio=audio,
                    status_fields={"lessonId": "x"},
                    duration_seconds=10.0,
                    logo_sha="logo",
                    log_paths=[],
                )

    def test_validation_json_has_captions_true_after_staging(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mp4, audio, captions = self._fixture_bundle(root)
            out_dir = root / "production-result"
            stage_production_result(
                out_dir=out_dir,
                mp4=mp4,
                captions=captions,
                audio=audio,
                status_fields={"lessonId": "x", "locale": "en"},
                duration_seconds=12.5,
                logo_sha="logo",
                log_paths=[],
            )
            validation = json.loads((out_dir / "validation.json").read_text(encoding="utf-8"))
            status = json.loads((out_dir / "status.json").read_text(encoding="utf-8"))
            self.assertTrue(validation["hasCaptions"])
            self.assertTrue(status["captionsChecksum"])


class BuildLessonCaptionsIntegrationTests(unittest.TestCase):
    def test_build_lesson_imports_caption_writer(self):
        text = (SCRIPTS / "build-lesson.py").read_text(encoding="utf-8")
        self.assertIn("from lib.captions_vtt import write_captions_vtt", text)
        self.assertIn("write_captions_vtt(composite, scenes, durations)", text)


if __name__ == "__main__":
    unittest.main()
