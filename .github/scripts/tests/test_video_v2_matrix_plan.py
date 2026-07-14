"""Tests for video_v2.matrix_plan — proves 300 keys, ar-EG=0, split sizes."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from video_v2.matrix_plan import build_plan, PlanError  # noqa: E402


def _lessons(prefix: str, n: int) -> list[str]:
    return [f"{prefix}-l{i:03d}" for i in range(n)]


def test_builds_300_with_split():
    plan = build_plan(
        en_lessons=_lessons("en", 100),
        ar_msa_lessons=_lessons("msa", 100),
        ar_gulf_lessons=_lessons("gulf", 100),
        source_sha="deadbeef",
    )
    keys = (
        [plan["canary"]["logical_key"]]
        + [c["logical_key"] for c in plan["matrix_a"]]
        + [c["logical_key"] for c in plan["matrix_b"]]
    )
    assert len(keys) == 300
    assert len(set(keys)) == 300
    assert plan["totals"]["ar-EG"] == 0
    assert len(plan["matrix_a"]) == 149
    assert len(plan["matrix_b"]) == 150
    assert plan["combinedMaxParallel"] == 4


def test_rejects_wrong_counts():
    with pytest.raises(PlanError):
        build_plan(
            en_lessons=_lessons("en", 99),
            ar_msa_lessons=_lessons("msa", 100),
            ar_gulf_lessons=_lessons("gulf", 100),
            source_sha="x",
        )


def test_deterministic_for_same_sha():
    kwargs = dict(
        en_lessons=_lessons("en", 100),
        ar_msa_lessons=_lessons("msa", 100),
        ar_gulf_lessons=_lessons("gulf", 100),
        source_sha="abc",
    )
    a = build_plan(**kwargs)
    b = build_plan(**kwargs)
    assert a == b
