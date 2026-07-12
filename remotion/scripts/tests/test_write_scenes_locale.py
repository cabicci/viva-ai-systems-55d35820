"""Offline tests: write_scenes_module locale stamping contract.
No network. Mocks fcntl so build-lesson imports on Windows.

Run:  python -m unittest remotion.scripts.tests.test_write_scenes_locale -v
  or:  python -m unittest discover -s remotion/scripts/tests -p 'test_write_scenes_locale.py' -v
"""
from __future__ import annotations
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.abspath(os.path.join(HERE, ".."))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "../../.."))


def _load_build_lesson():
    # build-lesson imports fcntl (Linux flock); stub on Windows / CI hosts without it.
    sys.modules.setdefault("fcntl", MagicMock())
    lib = os.path.join(SCRIPTS, "lib")
    if lib not in sys.path:
        sys.path.insert(0, lib)
    path = os.path.join(SCRIPTS, "build-lesson.py")
    spec = importlib.util.spec_from_file_location("build_lesson_mod", path)
    mod = importlib.util.module_from_spec(spec)
    # Point REPO_ROOT at a temp tree after load by patching — load first.
    spec.loader.exec_module(mod)
    return mod


def _parse_scenes_json(body: str):
    marker = "export const SCENES: SceneData[] = "
    start = body.index(marker) + len(marker)
    end = body.index(" as SceneData[];", start)
    return json.loads(body[start:end])


class WriteScenesLocaleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bl = _load_build_lesson()

    def _scenes(self):
        return [
            {
                "card": "ConceptCard",
                "accent": "lavender",
                "visual": {
                    "term": "AI",
                    "definition": "Artificial intelligence.",
                    "tag": "concept",
                },
            }
        ]

    def test_legacy_omits_locale_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.bl.REPO_ROOT = tmp
            os.makedirs(os.path.join(tmp, "remotion/public"), exist_ok=True)
            self.bl.write_scenes_module("legacy-lesson", self._scenes(), [90])
            path = os.path.join(tmp, "remotion/src/lessons-generated/legacy-lesson.gen.ts")
            with open(path, encoding="utf-8") as f:
                body = f.read()
            self.assertNotIn('"locale"', body)
            self.assertNotIn("export const LOCALE", body)
            scenes = _parse_scenes_json(body)
            self.assertNotIn("locale", scenes[0])

    def test_localized_en_stamps_locale_on_scenes_and_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.bl.REPO_ROOT = tmp
            os.makedirs(os.path.join(tmp, "remotion/public"), exist_ok=True)
            self.bl.write_scenes_module(
                "intro-m1-l1-what-is-ai--en", self._scenes(), [90], locale="en",
            )
            path = os.path.join(
                tmp, "remotion/src/lessons-generated/intro-m1-l1-what-is-ai--en.gen.ts",
            )
            with open(path, encoding="utf-8") as f:
                body = f.read()
            self.assertIn('export const LOCALE = "en" as const;', body)
            scenes = _parse_scenes_json(body)
            self.assertEqual(scenes[0]["locale"], "en")

    def test_arabic_locales_stamp_locale(self):
        for locale in ("ar-MSA", "ar-Gulf"):
            with tempfile.TemporaryDirectory() as tmp:
                self.bl.REPO_ROOT = tmp
                os.makedirs(os.path.join(tmp, "remotion/public"), exist_ok=True)
                self.bl.write_scenes_module(
                    f"lesson--{locale}", self._scenes(), [60], locale=locale,
                )
                path = os.path.join(
                    tmp, f"remotion/src/lessons-generated/lesson--{locale}.gen.ts",
                )
                with open(path, encoding="utf-8") as f:
                    body = f.read()
                self.assertIn(f'export const LOCALE = "{locale}" as const;', body)
                scenes = _parse_scenes_json(body)
                self.assertEqual(scenes[0]["locale"], locale)


if __name__ == "__main__":
    unittest.main()
