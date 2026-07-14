"""Collector tests: partial success is preserved; unresolved -> exit 1."""
from __future__ import annotations

import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone.collect import collect  # type: ignore
from video_finalize.constants import BATCH_ID, receipt_relpath  # type: ignore
from video_finalize.receipt import build_receipt, write_receipt  # type: ignore


def _write_receipt(root: Path, key: str, lid: str, locale: str, ck: str):
    r = build_receipt(
        batch_id=BATCH_ID, logical_key=key,
        lesson_id=lid, locale=locale,
        source_sha="src", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d",
        video_checksum=ck, captions_checksum="c" * 64,
        bunny_guid="g", bunny_upload_status="verified",
    )
    write_receipt(root / receipt_relpath(BATCH_ID, key), r)


def _mini_plan(tmp: Path) -> Path:
    plan = {
        "totals": {"total": 300, "canary": 1, "matrix_a": 149, "matrix_b": 150},
        "counts": {"en": 100, "ar-MSA": 100, "ar-Gulf": 100},
        "canary": [{"logical_key": "lesson-000__ar-Gulf", "lesson_id": "lesson-000",
                    "locale": "ar-Gulf", "package_path": "x"}],
        "matrix_a": [{"logical_key": f"lesson-{i:03d}__ar-MSA", "lesson_id": f"lesson-{i:03d}",
                      "locale": "ar-MSA", "package_path": "x"} for i in range(149)],
        "matrix_b": [{"logical_key": f"lesson-{i:03d}__en", "lesson_id": f"lesson-{i:03d}",
                      "locale": "en", "package_path": "x"} for i in range(150)],
    }
    p = tmp / "plan.json"
    p.write_text(json.dumps(plan))
    return p


def test_partial_success_preserved(tmp_path):
    plan = _mini_plan(tmp_path)
    root = tmp_path / "root1"
    root.mkdir()
    _write_receipt(root, "lesson-000__ar-Gulf", "lesson-000", "ar-Gulf", "a" * 64)
    _write_receipt(root, "lesson-000__ar-MSA", "lesson-000", "ar-MSA", "b" * 64)
    rep = collect(plan_path=plan, receipt_roots=[root], failed_keys=["lesson-001__ar-MSA"])
    assert rep["total_expected"] == 300
    assert "lesson-000__ar-Gulf" in rep["finalized"]
    assert "lesson-000__ar-MSA" in rep["finalized"]
    assert "lesson-001__ar-MSA" in rep["failed"]
    assert len(rep["missing"]) == 300 - 2 - 1


def test_all_finalized_exit_zero_semantics(tmp_path):
    plan = _mini_plan(tmp_path)
    root = tmp_path / "root2"
    root.mkdir()
    for cell in json.loads(plan.read_text())["canary"] + \
                json.loads(plan.read_text())["matrix_a"] + \
                json.loads(plan.read_text())["matrix_b"]:
        _write_receipt(root, cell["logical_key"], cell["lesson_id"], cell["locale"], "c" * 64)
    rep = collect(plan_path=plan, receipt_roots=[root])
    assert len(rep["finalized"]) == 300
    assert rep["failed"] == [] and rep["missing"] == [] and rep["ambiguous"] == []


if __name__ == "__main__":
    import tempfile
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            with tempfile.TemporaryDirectory() as td:
                fn(Path(td))
            print("ok", name)
