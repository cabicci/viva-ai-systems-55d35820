"""Plan tests: 300 unique keys, en=100 ar-MSA=100 ar-Gulf=100 ar-EG=0,
pinned canary = analyst-m3-l2-ai-summarization__en, matrix_a=149, matrix_b=150."""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone.plan import (  # type: ignore
    CANARY_LOGICAL_KEY, PlanError, build_plan, discover_cells, validate_counts,
)


def _tree(root: Path, per_locale: dict[str, int], include_canary=True) -> Path:
    base = root / "src" / "lib" / "locale-lessons"
    for loc, n in per_locale.items():
        (base / loc / "lessons").mkdir(parents=True, exist_ok=True)
        start = 0
        if loc == "en" and include_canary:
            lid = "analyst-m3-l2-ai-summarization"
            (base / loc / "lessons" / f"{lid}.json").write_text(
                json.dumps({"lessonId": lid, "locale": loc}), encoding="utf-8"
            )
            start = 1
        for i in range(start, n):
            lid = f"lesson-{i:03d}"
            (base / loc / "lessons" / f"{lid}.json").write_text(
                json.dumps({"lessonId": lid, "locale": loc}), encoding="utf-8"
            )
    return root


def test_repo_real_pinned_canary_and_split():
    plan = build_plan(_ROOT)
    assert plan["totals"] == {"total": 300, "canary": 1, "matrix_a": 149, "matrix_b": 150}
    assert plan["counts"] == {"en": 100, "ar-MSA": 100, "ar-Gulf": 100}
    assert plan["canary"][0]["logical_key"] == CANARY_LOGICAL_KEY
    assert plan["canary"][0]["lesson_id"] == "analyst-m3-l2-ai-summarization"
    assert plan["canary"][0]["locale"] == "en"
    keys = [c["logical_key"] for c in plan["canary"] + plan["matrix_a"] + plan["matrix_b"]]
    assert len(keys) == 300 and len(set(keys)) == 300
    # Canary must not appear in either matrix:
    assert CANARY_LOGICAL_KEY not in {c["logical_key"] for c in plan["matrix_a"]}
    assert CANARY_LOGICAL_KEY not in {c["logical_key"] for c in plan["matrix_b"]}


def test_missing_pinned_canary_fails():
    with tempfile.TemporaryDirectory() as td:
        root = _tree(Path(td), {"en": 100, "ar-MSA": 100, "ar-Gulf": 100},
                     include_canary=False)
        try:
            build_plan(root)
        except PlanError as e:
            assert "pinned canary" in str(e)
            return
        raise AssertionError("expected missing pinned canary error")


def test_reject_forbidden_ar_eg():
    with tempfile.TemporaryDirectory() as td:
        root = _tree(Path(td), {"en": 100, "ar-MSA": 100, "ar-Gulf": 100})
        (root / "src/lib/locale-lessons/ar-EG/lessons").mkdir(parents=True)
        (root / "src/lib/locale-lessons/ar-EG/lessons/x.json").write_text("{}", encoding="utf-8")
        try:
            build_plan(root)
        except PlanError as e:
            assert "ar-EG" in str(e)
            return
        raise AssertionError("expected ar-EG rejection")


def test_reject_wrong_counts():
    with tempfile.TemporaryDirectory() as td:
        root = _tree(Path(td), {"en": 99, "ar-MSA": 100, "ar-Gulf": 100})
        try:
            build_plan(root)
        except PlanError as e:
            assert "en" in str(e)
            return
        raise AssertionError("expected count rejection")


def test_all_package_paths_exist_in_real_repo():
    plan = build_plan(_ROOT)
    for cell in plan["canary"] + plan["matrix_a"] + plan["matrix_b"]:
        assert (_ROOT / cell["package_path"]).is_file(), cell["package_path"]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
