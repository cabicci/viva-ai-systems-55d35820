"""cli_run_cell.py — per-video orchestrator with checkpoint-driven resume.

Execution order (any stage may resume from its durable checkpoint):

  1. Existing durable receipt lookup                 → skip everything if match.
  2. Load approved localized package.
  3. Narration: ≤2 Gemini attempts, locale-gated + grounded.
     Fails the cell BEFORE any TTS/render/Bunny/mapping if both attempts fail.
  4. Render bundle (TTS + captions + Remotion) → six-file artifact.
  5. Validate six-file artifact contract.
  6. Compute deterministic v2 Bunny identity.
  7. Look up Bunny by identity; if match, reuse; otherwise upload.
  8. Verify Bunny checksum matches expected video checksum.
  9. Build receipt and commit to the cell's isolated v2 result branch.

Dependency-injected via ``Services``; real production wiring is documented in
``video_v2.services``.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from video_v2.bunny_identity import compute_identity  # noqa: E402
from video_v2.checkpoint import CheckpointStore  # noqa: E402
from video_v2.constants import BATCH_ID  # noqa: E402
from video_v2.narration_validate import validate_narration  # noqa: E402
from video_v2.receipt import build as build_receipt, write as write_receipt  # noqa: E402
from video_v2.services import Services  # noqa: E402


class CellError(RuntimeError):
    pass


def run_cell(cell: dict, services: Services, workdir: Path, *, mode: str = "batch") -> dict:
    logical_key = cell["logical_key"]
    lesson_id = cell["lesson_id"]
    locale = cell["locale"]
    workdir.mkdir(parents=True, exist_ok=True)
    ckpt = CheckpointStore(workdir)

    # --- 1. Existing durable receipt: skip everything ---------------------
    existing = services.fetch_existing_receipt(logical_key)
    if existing:
        ckpt.save("receipt", {"receipt": existing, "recovered": True})
        return existing

    # --- 2. Package ------------------------------------------------------
    package = services.load_package(lesson_id, locale)

    # --- 3. Narration (resume from checkpoint if present) ----------------
    narration = ckpt.load("narration")
    if narration and narration.get("scenes"):
        scenes = narration["scenes"]
    else:
        nr = validate_narration(
            package=package,
            locale=locale,
            script_fn=services.gemini_script,
            grounding_fn=services.grounding,
        )
        if not nr.ok:
            raise CellError(f"narration failed after {nr.attempts} attempts: {nr.to_dict()}")
        scenes = nr.scenes or []
        ckpt.save("narration", {"scenes": scenes, "attempts": nr.attempts})

    # --- 4-5. Artifact (bundle + six-file validation) --------------------
    artifact = ckpt.load("artifact")
    if artifact and Path(artifact.get("root", "")).is_dir():
        root = Path(artifact["root"])
        video_checksum = artifact["video_checksum"]
        captions_checksum = artifact["captions_checksum"]
        artifact_id = artifact["artifact_id"]
        artifact_digest = artifact["artifact_digest"]
    else:
        rendered = services.render_bundle(scenes, locale, workdir)
        root = Path(rendered["root"])
        services.validate_six_file(root)
        video_checksum = rendered["video_checksum"]
        captions_checksum = rendered["captions_checksum"]
        artifact_id = rendered["artifact_id"]
        artifact_digest = rendered["artifact_digest"]
        ckpt.save("artifact", {
            "root": str(root),
            "video_checksum": video_checksum,
            "captions_checksum": captions_checksum,
            "artifact_id": artifact_id,
            "artifact_digest": artifact_digest,
        })

    # --- 6. Deterministic v2 Bunny identity ------------------------------
    identity = compute_identity(
        batch_id=BATCH_ID,
        logical_key=logical_key,
        source_sha=services.source_sha(),
        video_checksum=video_checksum,
        lesson_id=lesson_id,
        locale=locale,
    )

    # --- 7-8. Bunny recover-or-upload; verify ----------------------------
    bunny = ckpt.load("bunny")
    if bunny and bunny.get("identity_hash") == identity.identity_hash and bunny.get("guid"):
        guid = bunny["guid"]
        upload_status = bunny.get("upload_status", "reused")
    else:
        found = services.bunny_find_by_identity(identity.identity_hash)
        if found and found.get("guid"):
            guid = found["guid"]
            upload_status = "reused"
        else:
            up = services.bunny_upload(root, identity.meta_tags)
            guid = up["guid"]
            upload_status = "uploaded"
        services.bunny_verify_checksum(guid, video_checksum)
        ckpt.save("bunny", {
            "guid": guid,
            "identity_hash": identity.identity_hash,
            "upload_status": upload_status if upload_status == "reused" else "verified",
        })
        upload_status = "reused" if upload_status == "reused" else "verified"

    # --- 9. Durable receipt commit ---------------------------------------
    receipt = build_receipt(
        logical_key=logical_key,
        lesson_id=lesson_id,
        locale=locale,
        source_sha=services.source_sha(),
        workflow_run_id=services.workflow_run_id(),
        artifact_id=artifact_id,
        artifact_digest=artifact_digest,
        video_checksum=video_checksum,
        captions_checksum=captions_checksum,
        bunny_guid=guid,
        bunny_identity_hash=identity.identity_hash,
        bunny_upload_status=upload_status,
        validation_status="finalized",
    )
    services.commit_receipt(receipt)
    ckpt.save("receipt", {"receipt": receipt, "recovered": False})
    return receipt


def _cli_main(argv: list[str] | None = None) -> int:  # pragma: no cover - dispatch only
    ap = argparse.ArgumentParser()
    ap.add_argument("--cell", required=True, help="JSON of a plan cell")
    ap.add_argument("--mode", default="batch")
    ap.add_argument("--workdir", default="/tmp/video-v2-cell")
    args = ap.parse_args(argv)
    from video_v2.services import default_services
    cell = json.loads(args.cell)
    receipt = run_cell(cell, default_services(), Path(args.workdir), mode=args.mode)
    print(json.dumps(receipt, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli_main())
