"""No-network regression: build-lesson.py CLI must load integrity imports safely.

Mirrors GitHub Actions standalone execution:
  python3 remotion/scripts/build-lesson.py "$LID" \\
    --locale "$LOCALE" \\
    --package-path "$LESSON_PACKAGE_PATH" \\
    --validate-source-only
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = REPO_ROOT / "remotion" / "scripts"
BUILD_LESSON = SCRIPTS / "build-lesson.py"
PILOT_LID = "analyst-m3-l2-ai-summarization"
PILOT_LOCALE = "en"
PILOT_PACKAGE = (
    REPO_ROOT
    / "src/lib/locale-lessons/en/lessons/analyst-m3-l2-ai-summarization.json"
)


def _fcntl_stub_dir() -> str:
    """fcntl is Linux-only; stub it for Windows subprocess parity."""
    tmp = tempfile.mkdtemp(prefix="build-lesson-fcntl-")
    Path(tmp, "fcntl.py").write_text(
        "LOCK_EX = LOCK_SH = LOCK_UN = 1\n"
        "def flock(*_args, **_kwargs):\n"
        "    return None\n",
        encoding="utf-8",
    )
    return tmp


class BuildLessonCliIntegrityImportTests(unittest.TestCase):
    def test_validate_source_only_subprocess_loads_integrity_chain(self):
        self.assertTrue(PILOT_PACKAGE.is_file(), f"missing pilot package: {PILOT_PACKAGE}")

        env = os.environ.copy()
        stub = _fcntl_stub_dir()
        env["PYTHONPATH"] = stub + os.pathsep + env.get("PYTHONPATH", "")

        proc = subprocess.run(
            [
                sys.executable,
                str(BUILD_LESSON),
                PILOT_LID,
                "--locale",
                PILOT_LOCALE,
                "--package-path",
                str(PILOT_PACKAGE.relative_to(REPO_ROOT)).replace("\\", "/"),
                "--validate-source-only",
            ],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
        )

        combined = (proc.stdout or "") + (proc.stderr or "")
        self.assertNotIn(
            "attempted relative import with no known parent package",
            combined,
            msg=combined,
        )
        self.assertEqual(
            proc.returncode,
            0,
            msg=combined,
        )
        self.assertIn("[validate-source-only] no paid API calls made; stopping.", combined)

    def test_build_lesson_uses_package_integrity_import(self):
        text = BUILD_LESSON.read_text(encoding="utf-8")
        self.assertIn("sys.path.insert(0, HERE)", text)
        self.assertIn(
            "from lib.integrity_validator import",
            text,
        )
        self.assertNotIn("from integrity_validator import", text)

    def test_integrity_chain_imports_via_package_path(self):
        env = os.environ.copy()
        stub = _fcntl_stub_dir()
        env["PYTHONPATH"] = stub + os.pathsep + env.get("PYTHONPATH", "")
        proc = subprocess.run(
            [
                sys.executable,
                "-c",
                (
                    "import os, sys; "
                    "here = os.path.join(os.getcwd(), 'remotion/scripts'); "
                    "sys.path.insert(0, here); "
                    "from lib.integrity_validator import assert_localized_scene_integrity; "
                    "from lib.integrity_scenes_from_package import integrity_scenes_from_package; "
                    "from lib.integrity_locale_policy import LOCALIZED_PRESENTATION_LOCALES; "
                    "print('CHAIN_OK', len(LOCALIZED_PRESENTATION_LOCALES))"
                ),
            ],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            timeout=60,
        )
        combined = (proc.stdout or "") + (proc.stderr or "")
        self.assertEqual(proc.returncode, 0, msg=combined)
        self.assertIn("CHAIN_OK 3", combined)
        self.assertNotIn(
            "attempted relative import with no known parent package",
            combined,
            msg=combined,
        )


if __name__ == "__main__":
    unittest.main()
