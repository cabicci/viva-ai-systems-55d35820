"""Standalone Bunny reconciliation policy (former-pilot collision safe).

This layer sits ON TOP of the read-only video_finalize.bunny_client and
enforces the strict standalone rules explicitly required by the workstream:

  - Search ALL exact-title candidates.
  - Any candidate with missing/null/empty/malformed top-level originalHash
    is a HARD FAIL (fail closed, structured evidence).
  - Exactly one candidate with an exact-hash match on the accepted video
    checksum -> reuse that GUID.
  - Multiple exact-hash matches -> FAIL closed.
  - Zero exact-hash matches while every same-title candidate carries a
    valid nonmatching originalHash -> CREATE ONE new distinct Bunny video.
    Older same-title videos are neither replaced nor deleted.
  - After upload, GET the new GUID and require its top-level originalHash
    to equal the accepted checksum before committing any receipt.

No polling loops, no delete/replace, no reliance on Bunny meta.originalHash.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


_HERE = Path(__file__).resolve().parent
_SCRIPTS_ROOT = _HERE.parent
if str(_SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_ROOT))

from video_finalize.bunny_client import BunnyClient  # type: ignore  # noqa: E402
from video_finalize.constants import bunny_title  # type: ignore  # noqa: E402


SHA256_HEX_RE = re.compile(r"^[a-f0-9]{64}$")


class BunnyReconciliationError(RuntimeError):
    def __init__(self, evidence: dict):
        super().__init__(evidence.get("reason", "bunny-reconciliation-failed"))
        self.evidence = evidence


@dataclass
class BunnyOutcome:
    guid: str
    upload_status: str  # 'uploaded' | 'verified'
    title: str
    same_title_candidates_inspected: int
    preserved_prior_guids: list[str] = field(default_factory=list)


def _read_hash(item: dict[str, Any]) -> tuple[str | None, str | None]:
    """Return (normalized_lowercase_hash, problem_code). Only top-level accepted."""
    if "originalHash" not in item:
        if isinstance(item.get("meta"), dict) and "originalHash" in item["meta"]:
            return None, "meta-originalHash-rejected"
        return None, "missing-originalHash"
    raw = item["originalHash"]
    if raw is None:
        return None, "null-originalHash"
    if raw == "":
        return None, "empty-originalHash"
    if not isinstance(raw, str):
        return None, "non-string-originalHash"
    normalized = raw.lower()
    if not SHA256_HEX_RE.match(normalized):
        return None, "malformed-originalHash"
    return normalized, None


def _same_title_candidates(client: BunnyClient, title: str) -> list[dict[str, Any]]:
    items = client.list_videos_search(title)
    return [it for it in items if it.get("title") == title]


def reconcile_and_finalize(
    *,
    library_id: str,
    api_key: str,
    lesson_id: str,
    locale: str,
    mp4_bytes: bytes,
    video_checksum: str,
    http=None,
) -> BunnyOutcome:
    if not library_id or not api_key:
        raise BunnyReconciliationError({
            "reason": "missing-bunny-credentials",
        })
    expected = video_checksum.lower()
    if not SHA256_HEX_RE.match(expected):
        raise BunnyReconciliationError({
            "reason": "invalid-accepted-checksum",
            "videoChecksum": video_checksum,
        })

    title = bunny_title(lesson_id, locale)
    client = BunnyClient(library_id=library_id, api_key=api_key, http=http)
    candidates = _same_title_candidates(client, title)

    exact_matches: list[dict[str, Any]] = []
    valid_nonmatching: list[dict[str, Any]] = []
    problems: list[dict[str, Any]] = []

    for item in candidates:
        h, problem = _read_hash(item)
        if problem is not None:
            problems.append({"guid": item.get("guid"), "issue": problem})
            continue
        if h == expected:
            exact_matches.append(item)
        else:
            valid_nonmatching.append(item)

    if problems:
        raise BunnyReconciliationError({
            "reason": "bunny-originalHash-invalid",
            "title": title,
            "problems": problems,
            "candidateCount": len(candidates),
        })

    if len(exact_matches) > 1:
        raise BunnyReconciliationError({
            "reason": "multiple-bunny-identities",
            "title": title,
            "videoChecksum": expected,
            "guids": [m.get("guid") for m in exact_matches],
        })

    preserved = [str(m.get("guid")) for m in valid_nonmatching if m.get("guid")]

    if len(exact_matches) == 1:
        guid = str(exact_matches[0]["guid"])
        video = client.get_video(guid)
        h, problem = _read_hash(video)
        if problem is not None or h != expected:
            raise BunnyReconciliationError({
                "reason": "bunny-get-originalHash-mismatch-on-reuse",
                "guid": guid,
                "issue": problem or "hash-drift",
            })
        return BunnyOutcome(
            guid=guid, upload_status="verified", title=title,
            same_title_candidates_inspected=len(candidates),
            preserved_prior_guids=preserved,
        )

    # Zero exact-hash matches. All other same-title candidates carry valid,
    # nonmatching hashes. Create one NEW distinct Bunny video.
    new_guid = client.create_video(title)
    if new_guid in preserved:
        raise BunnyReconciliationError({
            "reason": "created-guid-collides-with-preserved",
            "guid": new_guid,
        })
    client.upload_mp4(new_guid, mp4_bytes)
    video = client.get_video(new_guid)
    h, problem = _read_hash(video)
    if problem is not None or h != expected:
        raise BunnyReconciliationError({
            "reason": "bunny-get-originalHash-mismatch-after-upload",
            "guid": new_guid,
            "issue": problem or "hash-drift",
            "expected": expected,
        })
    return BunnyOutcome(
        guid=new_guid, upload_status="uploaded", title=title,
        same_title_candidates_inspected=len(candidates),
        preserved_prior_guids=preserved,
    )


# Backwards-compatible thin wrapper used by run_cell.py (old signature).
def finalize_bunny_for_cell(
    *, library_id: str, api_key: str, lesson_id: str, locale: str,
    mp4_bytes: bytes, video_checksum: str, http=None,
):
    outcome = reconcile_and_finalize(
        library_id=library_id, api_key=api_key,
        lesson_id=lesson_id, locale=locale,
        mp4_bytes=mp4_bytes, video_checksum=video_checksum, http=http,
    )
    return outcome
