"""Fail-closed production-result staging for workflow artifact contract."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .captions_vtt import validate_webvtt_file


REQUIRED_PRODUCTION_FILES = (
    "video.mp4",
    "audio.mp3",
    "captions.vtt",
    "status.json",
    "validation.json",
    "pipeline.log",
)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_captions(captions: Path) -> str:
    validate_webvtt_file(captions)
    return sha256_file(captions)


def build_status_and_validation(
    *,
    status_fields: dict,
    video_sha: str,
    captions_sha: str,
    has_audio: bool,
    duration_seconds: float,
    logo_sha: str,
) -> tuple[dict, dict]:
    if not video_sha:
        raise ValueError("missing video checksum")
    if not captions_sha:
        raise ValueError("missing captions checksum")
    if not has_audio:
        raise ValueError("missing audio master")
    if duration_seconds <= 0:
        raise ValueError("invalid media duration")

    status = {
        **status_fields,
        "outputStatus": "validated",
        "videoChecksum": video_sha,
        "captionsChecksum": captions_sha,
    }
    validation = {
        "ok": True,
        "hasAudio": True,
        "hasVideo": True,
        "hasCaptions": True,
        "durationSeconds": duration_seconds,
        "logoChecksum": logo_sha,
    }
    return status, validation


def stage_production_result(
    *,
    out_dir: Path,
    mp4: Path,
    captions: Path,
    audio: Path,
    status_fields: dict,
    duration_seconds: float,
    logo_sha: str,
    log_paths: list[Path],
) -> tuple[dict, dict]:
    if not mp4.is_file():
        raise FileNotFoundError(f"missing video: {mp4}")
    if not audio.is_file():
        raise FileNotFoundError(f"missing audio: {audio}")

    out_dir.mkdir(parents=True, exist_ok=True)
    video_sha = sha256_file(mp4)
    captions_sha = require_captions(captions)

    status, validation = build_status_and_validation(
        status_fields=status_fields,
        video_sha=video_sha,
        captions_sha=captions_sha,
        has_audio=True,
        duration_seconds=duration_seconds,
        logo_sha=logo_sha,
    )

    (out_dir / "status.json").write_text(
        json.dumps(status, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out_dir / "validation.json").write_text(
        json.dumps(validation, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out_dir / "captions.vtt").write_bytes(captions.read_bytes())
    (out_dir / "audio.mp3").write_bytes(audio.read_bytes())
    (out_dir / "video.mp4").write_bytes(mp4.read_bytes())

    log_chunks: list[str] = []
    for log_path in log_paths:
        if log_path.is_file():
            log_chunks.append(f"===== {log_path.name} =====\n")
            log_chunks.append(log_path.read_text(encoding="utf-8", errors="replace"))
            log_chunks.append("\n")
    (out_dir / "pipeline.log").write_text(
        "".join(log_chunks) if log_chunks else "pipeline.log: no auxiliary logs captured\n",
        encoding="utf-8",
    )

    missing = [name for name in REQUIRED_PRODUCTION_FILES if not (out_dir / name).is_file()]
    if missing:
        raise RuntimeError(f"production-result incomplete: {missing}")

    staged_captions_sha = sha256_file(out_dir / "captions.vtt")
    if staged_captions_sha != captions_sha:
        raise RuntimeError("staged captions checksum mismatch")

    return status, validation
