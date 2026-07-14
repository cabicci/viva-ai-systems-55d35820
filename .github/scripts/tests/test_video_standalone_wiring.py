"""Static wiring + workflow / runtime signature checks."""
from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

import yaml

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
WF = _ROOT / ".github" / "workflows" / "video-production-standalone-300.yml"
STANDALONE = _ROOT / ".github" / "scripts" / "video_standalone"


def test_yaml_parses_and_jobs_present():
    doc = yaml.safe_load(WF.read_text(encoding="utf-8"))
    jobs = doc["jobs"]
    for j in ("guard", "plan", "canary", "matrix_a", "matrix_b", "collect"):
        assert j in jobs
    matrix_par = (
        jobs["matrix_a"]["strategy"]["max-parallel"]
        + jobs["matrix_b"]["strategy"]["max-parallel"]
    )
    assert matrix_par <= 4
    assert jobs["canary"]["strategy"]["max-parallel"] == 1
    for j in ("canary", "matrix_a", "matrix_b"):
        assert jobs[j]["strategy"]["fail-fast"] is False
    assert jobs["collect"]["if"] == "always()"
    for j in ("matrix_a", "matrix_b"):
        assert "canary" in jobs[j]["needs"]


def test_workflow_wires_bundle_recovery_and_pinned_canary():
    text = WF.read_text(encoding="utf-8")
    assert "python3 .github/scripts/video_standalone/run_cell.py" in text
    for secret in (
        "BUNNY_STREAM_API_KEY", "BUNNY_STREAM_LIBRARY_ID",
        "GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3",
    ):
        assert secret in text
    assert "PROCEED" in text
    assert "refs/heads/main" in text
    # Deterministic bundle name, artifact upload/download wired:
    assert "DETERMINISTIC_ARTIFACT_NAME: standalone-cell__" in text
    assert "actions/download-artifact@v4" in text
    assert "actions/upload-artifact@v4" in text
    assert "--bundle-in-dir" in text and "--bundle-out-dir" in text
    # Canary pinned label:
    assert "analyst-m3-l2-ai-summarization__en" in text


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
    for mod in (
        "video_standalone.plan", "video_standalone.artifact",
        "video_standalone.artifact_bundle", "video_standalone.locale_gate",
        "video_standalone.narration_orchestrator",
        "video_standalone.bunny_ops", "video_standalone.run_cell",
        "video_standalone.collect",
    ):
        importlib.import_module(mod)


def test_no_placeholders_or_deferred_markers():
    forbidden = ("TODO", "FIXME", "XXX", "PLACEHOLDER", "raise NotImplementedError")
    for py in STANDALONE.glob("*.py"):
        text = py.read_text(encoding="utf-8")
        for needle in forbidden:
            assert needle not in text, f"{py.name}: forbidden marker {needle}"


def test_no_forbidden_reuse():
    for py in STANDALONE.glob("*.py"):
        text = py.read_text(encoding="utf-8")
        assert "import video_v2" not in text
        assert "from video_v2" not in text
        assert "video-production-batch" not in text
        assert "video-production-final-v2" not in text


def test_build_lesson_signature_supports_our_flags():
    text = (_ROOT / "remotion" / "scripts" / "build-lesson.py").read_text(encoding="utf-8")
    for flag in ("--locale", "--package-path", "--preview-only", "--force-script"):
        assert flag in text


def test_bunny_client_signature_still_matches_our_usage():
    """Our bunny_ops calls list_videos_search / create_video / upload_mp4 /
    get_video on video_finalize.bunny_client.BunnyClient."""
    src = (_ROOT / ".github" / "scripts" / "video_finalize" / "bunny_client.py").read_text()
    for sig in (
        "def list_videos_search",
        "def create_video",
        "def upload_mp4",
        "def get_video",
    ):
        assert sig in src


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
