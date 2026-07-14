"""Six-file production artifact validation for finalization."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REQUIRED_FILES = (
    "video.mp4",
    "audio.mp3",
    "captions.vtt",
    "status.json",
    "validation.json",
    "pipeline.log",
)


class ArtifactError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def resolve_production_root(extract_root: Path) -> Path:
    """Accept either production-result/ nested or flat layout."""
    nested = extract_root / "production-result"
    if nested.is_dir() and (nested / "video.mp4").is_file():
        return nested
    if (extract_root / "video.mp4").is_file():
        return extract_root
    raise ArtifactError("production-result bundle not found")


def compute_bundle_digest(root: Path) -> str:
    """Deterministic digest of the six-file production bundle."""
    parts = [sha256_file(root / name) for name in REQUIRED_FILES]
    combined = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return f"sha256:{combined}"


def validate_six_file_bundle(root: Path) -> dict[str, Any]:
    missing = [n for n in REQUIRED_FILES if not (root / n).is_file()]
    if missing:
        raise ArtifactError(f"missing production files: {missing}")
    for name in REQUIRED_FILES:
        if (root / name).stat().st_size <= 0:
            raise ArtifactError(f"empty production file: {name}")

    status = json.loads((root / "status.json").read_text(encoding="utf-8"))
    validation = json.loads((root / "validation.json").read_text(encoding="utf-8"))

    if validation.get("ok") is not True:
        raise ArtifactError("validation.json.ok must be true")
    if validation.get("hasCaptions") is not True:
        raise ArtifactError("validation.json.hasCaptions must be true")
    if validation.get("hasVideo") is not True:
        raise ArtifactError("validation.json.hasVideo must be true")
    if validation.get("hasAudio") is not True:
        raise ArtifactError("validation.json.hasAudio must be true")

    video_sha = sha256_file(root / "video.mp4")
    captions_sha = sha256_file(root / "captions.vtt")
    if not status.get("videoChecksum"):
        raise ArtifactError("status.json.videoChecksum missing")
    if not status.get("captionsChecksum"):
        raise ArtifactError("status.json.captionsChecksum missing")
    if status["videoChecksum"] != video_sha:
        raise ArtifactError("videoChecksum mismatch vs video.mp4")
    if status["captionsChecksum"] != captions_sha:
        raise ArtifactError("captionsChecksum mismatch vs captions.vtt")

    captions = (root / "captions.vtt").read_text(encoding="utf-8")
    if not captions.lstrip().startswith("WEBVTT"):
        raise ArtifactError("captions.vtt missing WEBVTT header")
    if "-->" not in captions:
        raise ArtifactError("captions.vtt has no cues")

    return {
        "status": status,
        "validation": validation,
        "videoChecksum": video_sha,
        "captionsChecksum": captions_sha,
        "root": root,
    }


def assert_identity(
    meta: dict[str, Any],
    *,
    logical_key: str,
    lesson_id: str,
    locale: str,
    source_sha: str,
) -> None:
    status = meta["status"]
    for field, expected in (
        ("logicalKey", logical_key),
        ("compositeKey", logical_key),
        ("lessonId", lesson_id),
        ("locale", locale),
        ("sourceSha", source_sha),
    ):
        got = status.get(field)
        if field == "compositeKey" and got is None:
            # some full-300 status omit compositeKey; logicalKey or lesson+locale OK
            continue
        if field == "logicalKey" and got is None:
            composite = status.get("compositeKey")
            if composite == logical_key:
                continue
            if (
                status.get("lessonId") == lesson_id
                and status.get("locale") == locale
            ):
                continue
            raise ArtifactError("logicalKey missing/mismatch in status.json")
        if got is not None and got != expected:
            raise ArtifactError(f"status.{field} mismatch: {got!r} != {expected!r}")
