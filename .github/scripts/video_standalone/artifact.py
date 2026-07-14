"""Artifact validation helpers for the standalone workflow.

Validates the MP4 + VTT captions produced by
    python3 remotion/scripts/build-lesson.py "$LID" --locale "$LOCALE" --package-path ...

Composite key: f"{lesson_id}__{locale}"
  - MP4 path:      public/lessons/intro/{composite}.mp4
  - captions VTT:  /tmp/{composite}/captions.vtt   (per lib/captions_vtt.py)
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path


class ArtifactError(RuntimeError):
    pass


@dataclass
class ArtifactPaths:
    composite: str
    mp4: Path
    captions: Path


def resolve_paths(repo_root: Path, lesson_id: str, locale: str,
                  captions_root: Path | None = None) -> ArtifactPaths:
    composite = f"{lesson_id}__{locale}"
    mp4 = repo_root / "public" / "lessons" / "intro" / f"{composite}.mp4"
    croot = captions_root or Path("/tmp")
    captions = croot / composite / "captions.vtt"
    return ArtifactPaths(composite=composite, mp4=mp4, captions=captions)


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            b = fh.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def validate_and_checksum(paths: ArtifactPaths, *, min_mp4_bytes: int = 32_000) -> dict:
    if not paths.mp4.is_file():
        raise ArtifactError(f"missing MP4 artifact: {paths.mp4}")
    size = paths.mp4.stat().st_size
    if size < min_mp4_bytes:
        raise ArtifactError(f"MP4 suspiciously small ({size} bytes): {paths.mp4}")
    if not paths.captions.is_file():
        raise ArtifactError(f"missing captions VTT: {paths.captions}")
    csize = paths.captions.stat().st_size
    if csize < 16:
        raise ArtifactError(f"captions VTT too small ({csize} bytes)")
    text = paths.captions.read_text(encoding="utf-8", errors="replace")
    if not text.lstrip().startswith("WEBVTT"):
        raise ArtifactError("captions VTT missing WEBVTT header")
    return {
        "composite": paths.composite,
        "mp4Bytes": size,
        "videoChecksum": sha256_file(paths.mp4),
        "captionsChecksum": sha256_file(paths.captions),
    }
