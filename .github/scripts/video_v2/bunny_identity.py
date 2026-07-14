"""Deterministic Bunny identity for video-production-final-v2.

Contract:
- Title is human-readable ("<lessonId> [<locale>]") — collisions with legacy
  same-title videos are EXPECTED and MUST NOT be treated as identity.
- Identity is proven by `metaTags.v2Identity` = sha256(batchId|logicalKey|sourceSha|videoChecksum).
- Uploader must NEVER overwrite or delete a same-title video; a new distinct
  video is always created and identity is verified by metaTags after upload.
- Reuse-detection: only a Bunny video whose metaTags.v2Identity matches
  exactly may be reused (idempotent retry).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True)
class BunnyIdentity:
    title: str
    identity_hash: str  # sha256 hex
    meta_tags: dict

    def matches(self, other_meta: dict | None) -> bool:
        if not isinstance(other_meta, dict):
            return False
        return str(other_meta.get("v2Identity") or "").lower() == self.identity_hash.lower()


def compute_identity(
    *,
    batch_id: str,
    logical_key: str,
    source_sha: str,
    video_checksum: str,
    lesson_id: str,
    locale: str,
) -> BunnyIdentity:
    for name, val in (
        ("batch_id", batch_id), ("logical_key", logical_key),
        ("source_sha", source_sha), ("video_checksum", video_checksum),
        ("lesson_id", lesson_id), ("locale", locale),
    ):
        if not val or not isinstance(val, str):
            raise ValueError(f"identity component required: {name}")
    payload = f"{batch_id}|{logical_key}|{source_sha}|{video_checksum}"
    h = hashlib.sha256(payload.encode()).hexdigest()
    return BunnyIdentity(
        title=f"{lesson_id} [{locale}]",
        identity_hash=h,
        meta_tags={
            "v2Identity": h,
            "batchId": batch_id,
            "logicalKey": logical_key,
            "sourceSha": source_sha,
            "videoChecksum": video_checksum,
            "lessonId": lesson_id,
            "locale": locale,
        },
    )


def find_reusable(existing_videos: list[dict], identity: BunnyIdentity) -> dict | None:
    """Return an existing Bunny video whose metaTags.v2Identity matches, else None.

    Same-title videos WITHOUT matching identity are ignored (never overwritten).
    """
    for v in existing_videos or []:
        if identity.matches(v.get("metaTags") or v.get("meta_tags")):
            return v
    return None
