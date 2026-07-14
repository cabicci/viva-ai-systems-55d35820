"""Tests for video_v2.bunny_identity — never overwrite same-title, reuse-by-hash only."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from video_v2.bunny_identity import compute_identity, find_reusable  # noqa: E402


def _id(**over):
    base = dict(
        batch_id="video-full-300-final-v2",
        logical_key="analyst-m3-l2-ai-summarization__en",
        source_sha="d0b8a1e",
        video_checksum="a" * 64,
        lesson_id="analyst-m3-l2-ai-summarization",
        locale="en",
    )
    base.update(over)
    return compute_identity(**base)


def test_identity_stable():
    a = _id()
    b = _id()
    assert a.identity_hash == b.identity_hash
    assert a.title == "analyst-m3-l2-ai-summarization [en]"


def test_identity_changes_with_checksum():
    a = _id()
    b = _id(video_checksum="b" * 64)
    assert a.identity_hash != b.identity_hash


def test_same_title_different_identity_is_not_reused():
    ident = _id(video_checksum="a" * 64)
    existing = [{
        "guid": "old-guid",
        "title": ident.title,
        "metaTags": {"v2Identity": "0" * 64},  # legacy same-title
    }]
    assert find_reusable(existing, ident) is None


def test_matching_identity_reused():
    ident = _id()
    existing = [{
        "guid": "keep-guid",
        "title": ident.title,
        "metaTags": ident.meta_tags,
    }]
    assert find_reusable(existing, ident)["guid"] == "keep-guid"
