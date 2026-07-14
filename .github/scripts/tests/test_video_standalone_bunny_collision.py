"""Bunny former-pilot collision regression test.

Fixture (authorized in the workstream brief):
  title:        analyst-m3-l2-ai-summarization [en]
  old GUID:     7a08de3d-6997-412e-834e-54906b65896f
  old hash:     6dfcf6aa0e57fa62ea1c2bc7fbe4119b900b152b70841c7d7b702126d0006c64
  accepted:     78afdba76a01a1d78297756c01c383c2527105a4854bb4a13af9a7169d70acf4

Enforced rules:
  - Search all exact-title candidates.
  - Exactly one exact-hash match -> reuse.
  - >1 exact-hash matches -> fail closed.
  - Any missing/null/empty/malformed originalHash on any relevant candidate -> fail closed.
  - Zero exact-hash matches while all same-title candidates carry valid nonmatching
    hashes -> create ONE new distinct video; older ones preserved (never deleted).
  - After upload, GET the new GUID and require top-level originalHash == accepted.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone.bunny_ops import (  # type: ignore
    BunnyReconciliationError, reconcile_and_finalize,
)


LID = "analyst-m3-l2-ai-summarization"
LOC = "en"
TITLE = f"{LID} [{LOC}]"
OLD_GUID = "7a08de3d-6997-412e-834e-54906b65896f"
OLD_HASH = "6dfcf6aa0e57fa62ea1c2bc7fbe4119b900b152b70841c7d7b702126d0006c64"
ACCEPTED = "78afdba76a01a1d78297756c01c383c2527105a4854bb4a13af9a7169d70acf4"


def _http(items, upload_ok=True, new_guid="NEW-GUID", new_hash=None,
          preserved_marker=None):
    """Return an http closure. `preserved_marker` is a mutable dict updated
    with delete/replace observations (there must be none)."""
    def http(method, url, body, headers):
        if preserved_marker is not None:
            if method == "DELETE":
                preserved_marker["deletes"] = preserved_marker.get("deletes", 0) + 1
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": items}).encode()
        if method == "POST":
            return (200 if upload_ok else 500,
                    json.dumps({"guid": new_guid}).encode())
        if method == "PUT":
            return 200, b"{}"
        if method == "GET":
            # Get-by-guid — return the hash for the new guid.
            return 200, json.dumps(
                {"guid": new_guid, "originalHash": new_hash or ACCEPTED}
            ).encode()
        raise AssertionError(method)
    return http


# ---------- REGRESSION FIXTURE ----------

def test_regression_former_pilot_creates_new_preserves_old():
    """Old title-matching video (OLD_GUID/OLD_HASH) must be preserved; the
    accepted checksum has zero matches, so exactly one NEW distinct video
    is created and its GUID differs from the preserved GUID."""
    items = [{"guid": OLD_GUID, "title": TITLE, "originalHash": OLD_HASH}]
    marker: dict = {}
    http = _http(items, new_guid="NEW-GUID-1", new_hash=ACCEPTED,
                 preserved_marker=marker)
    out = reconcile_and_finalize(
        library_id="lib", api_key="k",
        lesson_id=LID, locale=LOC,
        mp4_bytes=b"\x00" * 200_000, video_checksum=ACCEPTED, http=http,
    )
    assert out.guid == "NEW-GUID-1"
    assert out.upload_status == "uploaded"
    assert out.title == TITLE
    # Old video preserved:
    assert OLD_GUID in out.preserved_prior_guids
    assert out.guid not in out.preserved_prior_guids
    # No delete/replace attempted:
    assert marker.get("deletes", 0) == 0


def test_reuse_when_exact_hash_matches_once():
    items = [{"guid": "REUSE-GUID", "title": TITLE, "originalHash": ACCEPTED}]
    http = _http(items, new_guid="SHOULD-NOT-USE", new_hash=ACCEPTED)
    out = reconcile_and_finalize(
        library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
        mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
    )
    assert out.upload_status == "verified"
    assert out.guid == "REUSE-GUID"


def test_multiple_exact_hash_matches_fail_closed():
    items = [
        {"guid": "G1", "title": TITLE, "originalHash": ACCEPTED},
        {"guid": "G2", "title": TITLE, "originalHash": ACCEPTED},
    ]
    http = _http(items)
    try:
        reconcile_and_finalize(
            library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
            mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
        )
    except BunnyReconciliationError as e:
        assert e.evidence["reason"] == "multiple-bunny-identities"
        assert set(e.evidence["guids"]) == {"G1", "G2"}
        return
    raise AssertionError("expected fail-closed on multiple exact-hash")


def test_malformed_originalhash_fails_closed():
    items = [{"guid": "BAD", "title": TITLE, "originalHash": "not-a-hash"}]
    http = _http(items)
    try:
        reconcile_and_finalize(
            library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
            mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
        )
    except BunnyReconciliationError as e:
        assert e.evidence["reason"] == "bunny-originalHash-invalid"
        assert any(p["issue"] == "malformed-originalHash" for p in e.evidence["problems"])
        return
    raise AssertionError("expected fail-closed on malformed hash")


def test_missing_or_null_originalhash_fails_closed():
    for it in ({"guid": "G", "title": TITLE},
               {"guid": "G", "title": TITLE, "originalHash": None},
               {"guid": "G", "title": TITLE, "originalHash": ""}):
        http = _http([it])
        try:
            reconcile_and_finalize(
                library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
                mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
            )
        except BunnyReconciliationError as e:
            assert e.evidence["reason"] == "bunny-originalHash-invalid"
            continue
        raise AssertionError("expected fail-closed for missing/null/empty")


def test_meta_originalhash_is_rejected():
    items = [{"guid": "G", "title": TITLE,
              "meta": {"originalHash": ACCEPTED}}]
    http = _http(items)
    try:
        reconcile_and_finalize(
            library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
            mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
        )
    except BunnyReconciliationError as e:
        assert e.evidence["reason"] == "bunny-originalHash-invalid"
        assert any(p["issue"] == "meta-originalHash-rejected"
                   for p in e.evidence["problems"])
        return
    raise AssertionError("meta.originalHash must be rejected")


def test_new_guid_verified_after_upload():
    """After upload, GET must show top-level originalHash == accepted."""
    items = [{"guid": OLD_GUID, "title": TITLE, "originalHash": OLD_HASH}]
    # Simulate Bunny returning the WRONG hash on the new video:
    http = _http(items, new_guid="NEW-BAD", new_hash="a" * 64)
    try:
        reconcile_and_finalize(
            library_id="lib", api_key="k", lesson_id=LID, locale=LOC,
            mp4_bytes=b"x", video_checksum=ACCEPTED, http=http,
        )
    except BunnyReconciliationError as e:
        assert e.evidence["reason"] == "bunny-get-originalHash-mismatch-after-upload"
        return
    raise AssertionError("expected post-upload verify to fail closed")


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
