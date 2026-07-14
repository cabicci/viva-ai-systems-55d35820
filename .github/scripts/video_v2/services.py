"""Pluggable service boundary for cli_run_cell.

Real production wiring (documented; imported lazily so tests can substitute
mocks without pulling heavy repo dependencies):

  * ``load_package``         → remotion/scripts/lib/localized_package_adapter
                               (via ``package_to_blocks`` + package JSON loader)
  * ``gemini_script``        → remotion/scripts/lib/script_writer.generate_scenes_cached
                               (existing Gemini narration author — unchanged)
  * ``grounding``            → remotion/scripts/lib/scene_validator (existing
                               package-integrity groundedness validator)
  * ``render_bundle``        → remotion/scripts/lib/gemini_tts + captions_vtt
                               + remotion/scripts/render-lesson.mjs (Remotion)
  * ``validate_six_file``    → .github/scripts/video_finalize/artifact_contract
                               .validate_six_file_bundle  (read-only import)
  * ``bunny_find_by_identity`` / ``bunny_upload`` / ``bunny_verify_checksum``
                             → .github/scripts/video_finalize/bunny_client
                               (read-only import; identity uses v2Identity meta tag)
  * ``fetch_existing_receipt`` / ``commit_receipt``
                             → GitHub Git Data API against
                               ``video-results-v2/<batch>/<logicalKey>`` branch,
                               parent ref = per-cell isolated branch head.

None of the above are executed in this turn — this file only *documents* the
wire-up and provides a default factory that raises unless the caller opts in.
Tests inject a ``Services`` with mocks for every field.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional


@dataclass
class Services:
    # ---- read-only environment ----
    source_sha: Callable[[], str]
    workflow_run_id: Callable[[], str]

    # ---- input side ----
    load_package: Callable[[str, str], dict]  # (lesson_id, locale) -> package dict

    # ---- narration author (Gemini) ----
    gemini_script: Callable[[dict, str, int], list[dict]]  # (package, locale, attempt) -> scenes

    # ---- narration grounding (existing repo validator) ----
    grounding: Callable[[list[dict], dict], list[str]]  # (scenes, package) -> errors

    # ---- render pipeline (TTS + captions + Remotion) ----
    # Must produce a six-file production bundle at ``workdir / "production"``.
    # Returns a dict with keys: root (Path), video_checksum, captions_checksum,
    # artifact_id, artifact_digest.
    render_bundle: Callable[[list[dict], str, Path], dict]

    # ---- artifact contract ----
    validate_six_file: Callable[[Path], None]  # raises on failure

    # ---- Bunny ----
    bunny_find_by_identity: Callable[[str], Optional[dict]]  # (identity_hash) -> {"guid": ...} | None
    bunny_upload: Callable[[Path, dict], dict]               # (root, identity_meta) -> {"guid": ...}
    bunny_verify_checksum: Callable[[str, str], None]        # (guid, expected_video_checksum) -> raises

    # ---- durable receipt commit on isolated v2 result branch ----
    fetch_existing_receipt: Callable[[str], Optional[dict]]  # (logical_key) -> receipt | None
    commit_receipt: Callable[[dict], str]                    # returns commit sha


def default_services() -> Services:  # pragma: no cover - real wiring lives at dispatch time
    """Factory for real production services.

    Intentionally raises here: the cell runner is only meant to be dispatched
    from CI where the repo-local modules are importable. Local unit runs and
    the mocked integration tests construct ``Services`` directly.
    """
    raise RuntimeError(
        "default_services() must not be constructed in a sandbox — dispatch "
        "the workflow so repo-local production modules resolve on PYTHONPATH."
    )


__all__ = ["Services", "default_services"]
