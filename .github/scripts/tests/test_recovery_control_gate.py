"""Focused tests for construct-aware recovery control gate."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

from recovery_control_gate import (  # noqa: E402
    inspect_python_source,
    inspect_recovery_entrypoint,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
RECOVERY_CLI = REPO_ROOT / ".github/scripts/recover_uploaded_receipt_cli.py"
WORKFLOW = REPO_ROOT / ".github/workflows/video-production-batch.yml"


def _violations(source: str, name: str = "fixture.py") -> list[str]:
    return [v.reason for v in inspect_python_source(Path(name), source)]


def _fails(source: str, needle: str) -> None:
    reasons = _violations(source)
    assert any(needle in r for r in reasons), f"expected {needle!r} in {reasons}"


class RecoveryControlGateTests(unittest.TestCase):
    def test_real_recovery_entrypoint_passes(self) -> None:
        self.assertEqual(inspect_recovery_entrypoint(REPO_ROOT), [])

    def test_defensive_create_video_none_passes(self) -> None:
        src = "class C:\n    pass\n\nc = C()\nc.create_video = None\n"
        self.assertEqual(_violations(src), [])

    def test_real_import_fails(self) -> None:
        _fails("from bunny_client import create_video\n", "forbidden import-from")

    def test_aliased_import_fails(self) -> None:
        _fails("from bunny_client import create_video as cv\n", "forbidden import-from")

    def test_direct_call_fails(self) -> None:
        _fails("create_video('x')\n", "forbidden direct call")

    def test_attribute_call_fails(self) -> None:
        _fails("bunny.create_video('x')\n", "forbidden attribute call")

    def test_executable_reference_assignment_fails(self) -> None:
        _fails("reference = bunny.create_video\n", "forbidden executable attribute reference")

    def test_dynamic_getattr_fails(self) -> None:
        _fails('getattr(bunny, "create_video")\n', "forbidden dynamic access")

    def test_non_none_assignment_fails(self) -> None:
        _fails("bunny.create_video = replacement\n", "non-None")

    def test_lambda_assignment_fails(self) -> None:
        _fails("bunny.create_video = lambda *args: None\n", "non-None")

    def test_upload_mp4_import_fails(self) -> None:
        _fails("from bunny_client import upload_mp4\n", "forbidden import-from")

    def test_upload_mp4_reference_fails(self) -> None:
        _fails("reference = bunny.upload_mp4\n", "forbidden executable attribute reference")

    def test_upload_mp4_attribute_call_fails(self) -> None:
        _fails("bunny.upload_mp4('x')\n", "forbidden attribute call")

    def test_upload_mp4_none_passes(self) -> None:
        self.assertEqual(_violations("bunny.upload_mp4 = None\n"), [])

    def test_promote_import_fails(self) -> None:
        _fails(
            "from promote_finalized_mappings_cli import promote_finalized_mappings\n",
            "promote_finalized_mappings",
        )

    def test_build_lesson_executable_fails(self) -> None:
        _fails(
            'import subprocess\nsubprocess.run(["python3", "remotion/scripts/build-lesson.py"])\n',
            "build-lesson.py",
        )

    def test_gemini_env_subscript_fails(self) -> None:
        _fails('import os\nos.environ["GEMINI_API_KEY"]\n', "forbidden lexical subscript")

    def test_parse_error_fails_closed(self) -> None:
        reasons = _violations("def broken(:\n", "broken.py")
        self.assertTrue(any("parse error" in r for r in reasons))

    def test_ambiguous_getattr_fails_closed(self) -> None:
        _fails("getattr(bunny, marker)\n", "ambiguous dynamic access")

    def test_harmless_comment_and_string_pass(self) -> None:
        src = (
            "# create_video is denied\n"
            "MSG = 'create_video'\n"
            "NOTE = 'GEMINI_API_KEY'\n"
            "raise SystemExit(f\"forbidden marker {'create_video'!r}\")\n"
        )
        self.assertEqual(_violations(src), [])

    def test_dynamic_import_forbidden_name_fails(self) -> None:
        _fails('import importlib\nimportlib.import_module("create_video")\n', "forbidden dynamic access")

    def test_workflow_uses_ast_gate_not_substring_scan(self) -> None:
        text = WORKFLOW.read_text(encoding="utf-8")
        recover = text.split("  recover_cells:")[1].split("  preflight_one:")[0]
        self.assertIn("recovery_control_gate.py", recover)
        self.assertNotIn("if marker in text:", recover)
        self.assertNotIn('"create_video",', recover)

    def test_recovery_cli_exists(self) -> None:
        self.assertTrue(RECOVERY_CLI.is_file())


if __name__ == "__main__":
    unittest.main()
