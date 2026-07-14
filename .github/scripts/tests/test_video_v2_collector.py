"""Tests for video_v2.collector — partial success preserved; failures never block."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from video_v2.collector import collect  # noqa: E402
from video_v2.receipt import build, write  # noqa: E402


def _write_receipt(root: Path, lesson_id: str, locale: str, checksum: str = "a" * 64) -> None:
    key = f"{lesson_id}__{locale}"
    r = build(
        logical_key=key, lesson_id=lesson_id, locale=locale, source_sha="abc",
        workflow_run_id="1", artifact_id="2", artifact_digest="sha256:" + "d" * 64,
        video_checksum=checksum, captions_checksum="c" * 64,
        bunny_guid="guid-" + key, bunny_identity_hash="h" * 64,
    )
    write(root, r)


def test_partial_success_preserved(tmp_path: Path):
    _write_receipt(tmp_path, "ok-a", "en")
    _write_receipt(tmp_path, "ok-b", "ar-MSA")
    expected = ["ok-a__en", "ok-b__ar-MSA", "gone__en", "boom__en"]
    report = collect(
        expected_keys=expected,
        receipt_roots=[tmp_path],
        failed_keys=["boom__en"],
    )
    d = report.to_dict()
    assert d["successfulLogicalKeys"] == ["ok-a__en", "ok-b__ar-MSA"]
    assert d["failedLogicalKeys"] == ["boom__en"]
    assert d["missingLogicalKeys"] == ["gone__en"]
    assert set(d["mappingCandidate"].keys()) == {"ok-a__en", "ok-b__ar-MSA"}


def test_conflicting_receipts_flagged(tmp_path: Path):
    root_a = tmp_path / "a"
    root_b = tmp_path / "b"
    root_a.mkdir(); root_b.mkdir()
    _write_receipt(root_a, "clash", "en", checksum="a" * 64)
    _write_receipt(root_b, "clash", "en", checksum="b" * 64)
    report = collect(
        expected_keys=["clash__en"],
        receipt_roots=[root_a, root_b],
    )
    d = report.to_dict()
    assert d["conflictingLogicalKeys"] == ["clash__en"]
    assert "clash__en" not in d["successfulLogicalKeys"]


def test_retry_does_not_regenerate_completed(tmp_path: Path):
    """Simulate: a successful receipt exists from a prior run. A rerun of the
    failed sibling must not touch the completed receipt file."""
    _write_receipt(tmp_path, "done", "en")
    completed_path = tmp_path / "remotion/video-pipeline/results-v2/video-full-300-final-v2/done__en/finalization-receipt.json"
    before = completed_path.read_bytes()

    # Rerun collector after a sibling failure — no writes occur.
    report = collect(
        expected_keys=["done__en", "fail__en"],
        receipt_roots=[tmp_path],
        failed_keys=["fail__en"],
    )
    after = completed_path.read_bytes()
    assert before == after
    assert "done__en" in report.to_dict()["successfulLogicalKeys"]
