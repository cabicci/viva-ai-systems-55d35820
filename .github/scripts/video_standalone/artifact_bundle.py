"""Deterministic durable artifact bundle for one cell.

Contract (six required files per cell):
  - video.mp4       — final rendered MP4 (public/lessons/intro/<composite>.mp4)
  - audio.mp3       — muxed master audio (/tmp/<composite>/audio/master.mp3)
  - captions.vtt    — /tmp/<composite>/captions.vtt
  - status.json     — per-cell finalization status (success/failure summary)
  - validation.json — computed checksums + validation metadata
  - pipeline.log    — best-effort log of the pipeline run

Deterministic artifact name:
    f"standalone-cell__{source_sha[:12]}__{locale}__{lesson_id}"

The workflow uploads under this exact name after successful six-file
validation, BEFORE Bunny finalization. On GitHub-native "Re-run failed jobs"
the workflow attempts to download the artifact FIRST. If present and
valid, run_cell skips Gemini/TTS/render entirely.
"""
from __future__ import annotations

import hashlib
import json
import shutil
from dataclasses import dataclass
from pathlib import Path


REQUIRED_FILES = ("video.mp4", "audio.mp3", "captions.vtt",
                  "status.json", "validation.json", "pipeline.log")


class ArtifactBundleError(RuntimeError):
    pass


def deterministic_name(source_sha: str, locale: str, lesson_id: str) -> str:
    if not source_sha or len(source_sha) < 12:
        raise ArtifactBundleError("source_sha must be >=12 hex chars")
    if not locale or not lesson_id:
        raise ArtifactBundleError("locale and lesson_id required")
    return f"standalone-cell__{source_sha[:12]}__{locale}__{lesson_id}"


@dataclass
class BundleLayout:
    bundle_dir: Path
    composite: str

    def path(self, name: str) -> Path:
        return self.bundle_dir / name


def _sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while True:
            b = fh.read(chunk)
            if not b:
                break
            h.update(b)
    return h.hexdigest()


def _copy_if_exists(src: Path, dst: Path) -> bool:
    if not src.is_file():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return True


def build_bundle_from_pipeline(
    *,
    bundle_dir: Path,
    repo_root: Path,
    lesson_id: str,
    locale: str,
    source_sha: str,
    pipeline_log_text: str,
    tmp_root: Path | None = None,
) -> BundleLayout:
    """After a successful build-lesson.py run, package the six required files."""
    composite = f"{lesson_id}__{locale}"
    tmp = tmp_root or Path("/tmp")
    bundle_dir.mkdir(parents=True, exist_ok=True)

    src_map = {
        "video.mp4":    repo_root / "public" / "lessons" / "intro" / f"{composite}.mp4",
        "audio.mp3":    tmp / composite / "audio" / "master.mp3",
        "captions.vtt": tmp / composite / "captions.vtt",
    }
    missing = []
    for name, src in src_map.items():
        if not _copy_if_exists(src, bundle_dir / name):
            missing.append(f"{name} <- {src}")
    if missing:
        raise ArtifactBundleError("missing pipeline outputs: " + "; ".join(missing))

    checks = {
        "composite": composite,
        "lessonId": lesson_id,
        "locale": locale,
        "sourceSha": source_sha,
        "videoChecksum":    _sha256_file(bundle_dir / "video.mp4"),
        "audioChecksum":    _sha256_file(bundle_dir / "audio.mp3"),
        "captionsChecksum": _sha256_file(bundle_dir / "captions.vtt"),
        "videoBytes":    (bundle_dir / "video.mp4").stat().st_size,
        "audioBytes":    (bundle_dir / "audio.mp3").stat().st_size,
        "captionsBytes": (bundle_dir / "captions.vtt").stat().st_size,
    }
    (bundle_dir / "validation.json").write_text(
        json.dumps(checks, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (bundle_dir / "status.json").write_text(
        json.dumps({
            "generationStatus": "success",
            "sixFileValidation": "ok",
            "composite": composite,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (bundle_dir / "pipeline.log").write_text(pipeline_log_text or "", encoding="utf-8")

    missing2 = [n for n in REQUIRED_FILES if not (bundle_dir / n).is_file()]
    if missing2:
        raise ArtifactBundleError(f"post-write missing files: {missing2}")
    return BundleLayout(bundle_dir=bundle_dir, composite=composite)


def validate_bundle(
    *, bundle_dir: Path, lesson_id: str, locale: str,
    expected_source_sha: str | None = None,
) -> dict:
    """Validate a restored bundle. Raises ArtifactBundleError on any issue."""
    if not bundle_dir.is_dir():
        raise ArtifactBundleError(f"bundle dir missing: {bundle_dir}")
    for name in REQUIRED_FILES:
        p = bundle_dir / name
        if not p.is_file():
            raise ArtifactBundleError(f"missing required file: {name}")
        if p.stat().st_size == 0:
            raise ArtifactBundleError(f"empty required file: {name}")

    vpath = bundle_dir / "validation.json"
    try:
        v = json.loads(vpath.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ArtifactBundleError(f"validation.json invalid: {e}")

    composite = f"{lesson_id}__{locale}"
    if v.get("composite") != composite:
        raise ArtifactBundleError(
            f"validation composite mismatch: {v.get('composite')} != {composite}"
        )
    if v.get("lessonId") != lesson_id or v.get("locale") != locale:
        raise ArtifactBundleError("validation lessonId/locale mismatch")
    if expected_source_sha is not None and v.get("sourceSha") != expected_source_sha:
        raise ArtifactBundleError(
            f"sourceSha mismatch: bundle={v.get('sourceSha')} expected={expected_source_sha}"
        )

    # Re-verify checksums against the bytes on disk.
    for k, name in (
        ("videoChecksum", "video.mp4"),
        ("audioChecksum", "audio.mp3"),
        ("captionsChecksum", "captions.vtt"),
    ):
        want = v.get(k)
        got = _sha256_file(bundle_dir / name)
        if want != got:
            raise ArtifactBundleError(f"{name} checksum drift: want={want} got={got}")

    return v


def restore_bundle_into_repo(
    *, bundle_dir: Path, repo_root: Path, lesson_id: str, locale: str,
    tmp_root: Path | None = None,
) -> None:
    """Copy validated bundle files back into the pipeline's expected paths so
    run_cell's downstream validation + Bunny upload can reuse them without
    rerunning Gemini/TTS/render."""
    composite = f"{lesson_id}__{locale}"
    tmp = tmp_root or Path("/tmp")

    dst_video = repo_root / "public" / "lessons" / "intro" / f"{composite}.mp4"
    dst_audio = tmp / composite / "audio" / "master.mp3"
    dst_vtt   = tmp / composite / "captions.vtt"
    for src, dst in (
        (bundle_dir / "video.mp4",    dst_video),
        (bundle_dir / "audio.mp3",    dst_audio),
        (bundle_dir / "captions.vtt", dst_vtt),
    ):
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
