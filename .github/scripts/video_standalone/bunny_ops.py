"""Bunny finalize operations for one standalone cell.

Reuses .github/scripts/video_finalize/bunny_client.py (read-only).

Behavior for a single (lesson_id, locale, videoChecksum) cell:
  1. Recover: list by exact title + exact top-level originalHash match.
     - 0 candidates -> create + upload; then GET; verify originalHash.
     - 1 candidate  -> reuse GUID (commit-only recovery); GET; verify originalHash.
     - >1 or ambiguous -> raise (fail closed; matches CONTRACT.md).
  2. Never delete/replace a finalized identity.
"""
from __future__ import annotations

import importlib.util
import sys
from dataclasses import dataclass
from pathlib import Path


def _load_video_finalize():
    """Import the sibling video_finalize package without editing it."""
    here = Path(__file__).resolve().parent  # .../.github/scripts/video_standalone
    scripts_root = here.parent  # .../.github/scripts
    if str(scripts_root) not in sys.path:
        sys.path.insert(0, str(scripts_root))
    from video_finalize.bunny_client import BunnyClient  # type: ignore
    from video_finalize.constants import bunny_title  # type: ignore
    return BunnyClient, bunny_title


@dataclass
class BunnyResult:
    guid: str
    upload_status: str  # 'uploaded' | 'verified'
    title: str


def finalize_bunny_for_cell(
    *,
    library_id: str,
    api_key: str,
    lesson_id: str,
    locale: str,
    mp4_bytes: bytes,
    video_checksum: str,
    http=None,
) -> BunnyResult:
    if not library_id or not api_key:
        raise RuntimeError("missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_API_KEY")

    BunnyClient, bunny_title = _load_video_finalize()
    title = bunny_title(lesson_id, locale)
    client = BunnyClient(library_id=library_id, api_key=api_key, http=http)

    matches, reconciliation = client.find_by_title_and_hash(title, video_checksum)
    if reconciliation is not None:
        raise RuntimeError(f"bunny recovery ambiguous: {reconciliation}")

    if matches:
        guid = str(matches[0]["guid"])
        video = client.get_video(guid)
        problem = client.verify_top_level_original_hash(video, video_checksum)
        if problem is not None:
            raise RuntimeError(f"bunny verify mismatch on reuse: {problem}")
        return BunnyResult(guid=guid, upload_status="verified", title=title)

    guid = client.create_video(title)
    client.upload_mp4(guid, mp4_bytes)
    video = client.get_video(guid)
    problem = client.verify_top_level_original_hash(video, video_checksum)
    if problem is not None:
        raise RuntimeError(f"bunny verify mismatch after upload: {problem}")
    return BunnyResult(guid=guid, upload_status="uploaded", title=title)
