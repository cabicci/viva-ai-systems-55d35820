"""Static wiring checks: real runtime files exist; CLI signatures match;
workflow references exact secrets/commands; YAML parses."""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

import yaml  # PyYAML is stdlib-friendly and present via CI setup

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
WF = _ROOT / ".github" / "workflows" / "video-production-standalone-300.yml"
STANDALONE = _ROOT / ".github" / "scripts" / "video_standalone"


def test_yaml_parses_and_has_required_jobs():
    doc = yaml.safe_load(WF.read_text(encoding="utf-8"))
    jobs = doc["jobs"]
    for j in ("guard", "plan", "canary", "matrix_a", "matrix_b", "collect"):
        assert j in jobs, f"missing job: {j}"
    # Canary blocks the two matrices; during the matrix phase the combined
    # cap is matrix_a + matrix_b (canary has already finished). Contract: <=4.
    matrix_par = (
        jobs["matrix_a"]["strategy"]["max-parallel"]
        + jobs["matrix_b"]["strategy"]["max-parallel"]
    )
    assert matrix_par <= 4, matrix_par
    # Canary itself never runs in parallel with the matrices (needs: canary).
    assert jobs["canary"]["strategy"]["max-parallel"] == 1
    for j in ("canary", "matrix_a", "matrix_b"):
        assert jobs[j]["strategy"]["fail-fast"] is False
    assert jobs["collect"]["if"] == "always()"
    # canary blocks the rest
    assert "canary" in jobs["matrix_a"]["needs"]
    assert "canary" in jobs["matrix_b"]["needs"]


def test_workflow_uses_authorized_build_command():
    text = WF.read_text(encoding="utf-8")
    assert "python3 .github/scripts/video_standalone/run_cell.py" in text
    # Real per-cell env has the exact Bunny + Gemini secret names.
    for secret in (
        "BUNNY_STREAM_API_KEY", "BUNNY_STREAM_LIBRARY_ID",
        "GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3",
    ):
        assert secret in text, secret
    # Confirm gate + main-only gate present.
    assert "PROCEED" in text
    assert "refs/heads/main" in text


def test_runtime_targets_exist():
    assert (_ROOT / "remotion" / "scripts" / "build-lesson.py").is_file()
    for p in ("bunny_client.py", "git_result_branch.py", "receipt.py",
              "collector.py", "constants.py"):
        assert (_ROOT / ".github" / "scripts" / "video_finalize" / p).is_file(), p


def test_standalone_modules_compile_and_import():
    for py in STANDALONE.glob("*.py"):
        ast.parse(py.read_text(encoding="utf-8"))
    sys.path.insert(0, str(_ROOT / ".github" / "scripts"))
    import importlib
    for mod in ("video_standalone.plan", "video_standalone.artifact",
                "video_standalone.bunny_ops", "video_standalone.run_cell",
                "video_standalone.collect"):
        importlib.import_module(mod)


def test_no_placeholders_or_deferred_markers():
    forbidden = ("TODO", "FIXME", "XXX", "PLACEHOLDER", "raise NotImplementedError")
    for py in STANDALONE.glob("*.py"):
        text = py.read_text(encoding="utf-8")
        for needle in forbidden:
            assert needle not in text, f"{py.name} contains forbidden marker: {needle}"


def test_no_forbidden_reuse():
    # standalone must not import video_v2 or the other batch workflows
    for py in STANDALONE.glob("*.py"):
        text = py.read_text(encoding="utf-8")
        assert "video_v2" not in text
        assert "video-production-batch" not in text
        assert "video-production-final-v2" not in text


def test_build_lesson_signature_supports_our_flags():
    text = (_ROOT / "remotion" / "scripts" / "build-lesson.py").read_text(encoding="utf-8")
    for flag in ("--locale", "--package-path"):
        assert flag in text, flag


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
