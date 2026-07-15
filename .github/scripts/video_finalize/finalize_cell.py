"""Cell finalization + deterministic recovery orchestration (mockable)."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from .artifact_contract import (
    ArtifactError,
    assert_identity,
    resolve_production_root,
    validate_six_file_bundle,
)
from .bunny_client import BunnyClient
from .constants import (
    bunny_title,
    receipt_relpath,
    reconciliation_relpath,
    result_branch_name,
)
from .git_result_branch import GitBranchError, ResultBranchRepo
from .receipt import (
    ReceiptError,
    build_receipt,
    load_receipt,
    receipts_match_identity,
    validate_receipt,
    write_receipt,
)


class FinalizeOutcome(str, Enum):
    SKIPPED_SUCCESS = "skipped-success"
    FINALIZED = "finalized"
    COMMIT_ONLY_RECOVERED = "commit-only-recovered"
    AMBIGUOUS = "ambiguous"
    FAILED = "failed"


@dataclass
class FinalizeResult:
    outcome: FinalizeOutcome
    receipt: dict[str, Any] | None = None
    reconciliation: dict[str, Any] | None = None
    message: str = ""
    bunny_create_calls: int = 0
    bunny_upload_calls: int = 0
    commits: int = 0
    pushes: int = 0


@dataclass
class FinalizeContext:
    batch_id: str
    logical_key: str
    lesson_id: str
    locale: str
    source_sha: str
    workflow_run_id: str
    artifact_id: str
    artifact_digest: str
    production_root: Path
    bunny: BunnyClient
    git: ResultBranchRepo
    allow_bunny_upload: bool = True
    allow_gemini: bool = False  # finalization never generates
    allow_tts: bool = False
    allow_render: bool = False


def _read_existing_receipt(git: ResultBranchRepo, batch_id: str, logical_key: str):
    rel = receipt_relpath(batch_id, logical_key)
    data = git.read_file(rel)
    if data is None:
        return None
    receipt = json.loads(data.decode("utf-8"))
    validate_receipt(receipt)
    return receipt


def write_reconciliation(path: Path, report: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def inspect_state(
    ctx: FinalizeContext,
    *,
    video_checksum: str,
) -> tuple[str, dict[str, Any] | None, dict[str, Any] | None]:
    """Return (state, receipt_or_none, reconciliation_or_none).

    States: matching-receipt | upload-pending-commit | needs-upload | ambiguous
    """
    branch = result_branch_name(ctx.batch_id, ctx.logical_key)
    if branch == "main":
        raise GitBranchError("cell cannot target main")

    existing = None
    try:
        existing = _read_existing_receipt(ctx.git, ctx.batch_id, ctx.logical_key)
    except ReceiptError as e:
        report = {
            "reason": "invalid-receipt-on-branch",
            "error": str(e),
            "logicalKey": ctx.logical_key,
            "batchId": ctx.batch_id,
        }
        return "ambiguous", None, report

    if existing is not None:
        if receipts_match_identity(
            existing,
            batch_id=ctx.batch_id,
            logical_key=ctx.logical_key,
            source_sha=ctx.source_sha,
            video_checksum=video_checksum,
        ):
            if (
                existing.get("lessonId") != ctx.lesson_id
                or existing.get("locale") != ctx.locale
            ):
                return "ambiguous", existing, {
                    "reason": "receipt-lesson-locale-mismatch",
                    "receipt": {
                        k: existing[k]
                        for k in ("lessonId", "locale", "bunnyGuid")
                    },
                }
            return "matching-receipt", existing, None
        return "ambiguous", existing, {
            "reason": "receipt-identity-conflict",
            "expected": {
                "batchId": ctx.batch_id,
                "logicalKey": ctx.logical_key,
                "sourceSha": ctx.source_sha,
                "videoChecksum": video_checksum,
            },
            "found": {
                "batchId": existing.get("batchId"),
                "logicalKey": existing.get("logicalKey"),
                "sourceSha": existing.get("sourceSha"),
                "videoChecksum": existing.get("videoChecksum"),
                "bunnyGuid": existing.get("bunnyGuid"),
            },
        }

    # No receipt: attempt durable Bunny recovery via official list+hash.
    title = bunny_title(ctx.lesson_id, ctx.locale)
    matches, recon = ctx.bunny.find_by_title_and_hash(title, video_checksum)
    if recon is not None:
        return "ambiguous", None, recon
    if len(matches) == 1:
        return "upload-pending-commit", None, {
            "recoveredGuid": matches[0]["guid"],
            "title": title,
        }
    return "needs-upload", None, None


def finalize_cell(ctx: FinalizeContext) -> FinalizeResult:
    if ctx.allow_gemini or ctx.allow_tts or ctx.allow_render:
        return FinalizeResult(
            outcome=FinalizeOutcome.FAILED,
            message="finalization must not enable Gemini/TTS/render",
        )

    creates0 = len(ctx.bunny.log.creates)
    uploads0 = len(ctx.bunny.log.uploads)
    commits0 = len(ctx.git.log.commits)
    pushes0 = len(ctx.git.log.pushes)

    try:
        meta = validate_six_file_bundle(ctx.production_root)
        assert_identity(
            meta,
            logical_key=ctx.logical_key,
            lesson_id=ctx.lesson_id,
            locale=ctx.locale,
            source_sha=ctx.source_sha,
        )
    except (ArtifactError, ReceiptError) as e:
        return FinalizeResult(outcome=FinalizeOutcome.FAILED, message=str(e))

    video_checksum = meta["videoChecksum"]
    captions_checksum = meta["captionsChecksum"]
    branch = result_branch_name(ctx.batch_id, ctx.logical_key)

    try:
        ctx.git.ensure_orphan_branch(branch)
        state, existing, recon = inspect_state(ctx, video_checksum=video_checksum)
    except (GitBranchError, ReceiptError, RuntimeError) as e:
        return FinalizeResult(outcome=FinalizeOutcome.FAILED, message=str(e))

    if state == "ambiguous":
        rel = reconciliation_relpath(ctx.batch_id, ctx.logical_key)
        write_reconciliation(ctx.git.repo_dir / rel, recon or {})
        return FinalizeResult(
            outcome=FinalizeOutcome.AMBIGUOUS,
            reconciliation=recon,
            message="ambiguous Bunny/receipt state; fail closed",
            bunny_create_calls=0,
            bunny_upload_calls=0,
        )

    if state == "matching-receipt":
        return FinalizeResult(
            outcome=FinalizeOutcome.SKIPPED_SUCCESS,
            receipt=existing,
            message="matching finalized receipt; skipped-success",
            bunny_create_calls=0,
            bunny_upload_calls=0,
            commits=0,
            pushes=0,
        )

    guid: str | None = None
    outcome = FinalizeOutcome.FINALIZED

    if state == "upload-pending-commit":
        guid = str((recon or {}).get("recoveredGuid"))
        # Prove existence + exact top-level originalHash via official GET (no polling).
        try:
            video = ctx.bunny.get_video(guid)
            get_recon = ctx.bunny.verify_top_level_original_hash(video, video_checksum)
            if get_recon is not None:
                rel = reconciliation_relpath(ctx.batch_id, ctx.logical_key)
                write_reconciliation(ctx.git.repo_dir / rel, get_recon)
                return FinalizeResult(
                    outcome=FinalizeOutcome.AMBIGUOUS,
                    reconciliation=get_recon,
                    message="recovered GUID originalHash proof failed; fail closed",
                    bunny_create_calls=0,
                    bunny_upload_calls=0,
                )
        except Exception as e:
            return FinalizeResult(
                outcome=FinalizeOutcome.FAILED,
                message=f"recovered GUID not fetchable: {e}",
            )
        outcome = FinalizeOutcome.COMMIT_ONLY_RECOVERED
    else:
        if not ctx.allow_bunny_upload:
            return FinalizeResult(
                outcome=FinalizeOutcome.FAILED,
                message="Bunny upload required but disabled",
            )
        title = bunny_title(ctx.lesson_id, ctx.locale)
        # Re-check for races before create.
        matches, recon = ctx.bunny.find_by_title_and_hash(title, video_checksum)
        if recon is not None:
            rel = reconciliation_relpath(ctx.batch_id, ctx.logical_key)
            write_reconciliation(ctx.git.repo_dir / rel, recon)
            return FinalizeResult(
                outcome=FinalizeOutcome.AMBIGUOUS,
                reconciliation=recon,
                message="ambiguous Bunny identity before upload; fail closed",
                bunny_create_calls=0,
                bunny_upload_calls=0,
            )
        if len(matches) == 1:
            guid = str(matches[0]["guid"])
            try:
                video = ctx.bunny.get_video(guid)
                get_recon = ctx.bunny.verify_top_level_original_hash(
                    video, video_checksum
                )
                if get_recon is not None:
                    rel = reconciliation_relpath(ctx.batch_id, ctx.logical_key)
                    write_reconciliation(ctx.git.repo_dir / rel, get_recon)
                    return FinalizeResult(
                        outcome=FinalizeOutcome.AMBIGUOUS,
                        reconciliation=get_recon,
                        message="pre-upload match GUID hash proof failed; fail closed",
                        bunny_create_calls=0,
                        bunny_upload_calls=0,
                    )
            except Exception as e:
                return FinalizeResult(
                    outcome=FinalizeOutcome.FAILED,
                    message=f"pre-upload match GUID not fetchable: {e}",
                )
            outcome = FinalizeOutcome.COMMIT_ONLY_RECOVERED
        else:
            guid = ctx.bunny.create_video(title)
            mp4_bytes = (ctx.production_root / "video.mp4").read_bytes()
            ctx.bunny.upload_mp4(guid, mp4_bytes)
            try:
                video = ctx.bunny.get_video(guid)
                get_recon = ctx.bunny.verify_top_level_original_hash(
                    video, video_checksum
                )
                if get_recon is not None:
                    rel = reconciliation_relpath(ctx.batch_id, ctx.logical_key)
                    write_reconciliation(ctx.git.repo_dir / rel, get_recon)
                    return FinalizeResult(
                        outcome=FinalizeOutcome.AMBIGUOUS,
                        reconciliation=get_recon,
                        message="post-upload hash proof failed; no receipt",
                        bunny_create_calls=len(ctx.bunny.log.creates) - creates0,
                        bunny_upload_calls=len(ctx.bunny.log.uploads) - uploads0,
                    )
            except Exception as e:
                return FinalizeResult(
                    outcome=FinalizeOutcome.FAILED,
                    message=f"post-upload GET failed: {e}",
                    bunny_create_calls=len(ctx.bunny.log.creates) - creates0,
                    bunny_upload_calls=len(ctx.bunny.log.uploads) - uploads0,
                )

    receipt = build_receipt(
        batch_id=ctx.batch_id,
        logical_key=ctx.logical_key,
        lesson_id=ctx.lesson_id,
        locale=ctx.locale,
        source_sha=ctx.source_sha,
        workflow_run_id=ctx.workflow_run_id,
        artifact_id=ctx.artifact_id,
        artifact_digest=ctx.artifact_digest,
        video_checksum=video_checksum,
        captions_checksum=captions_checksum,
        bunny_guid=guid,
        bunny_upload_status="uploaded",
        validation_status="finalized",
    )
    rel = receipt_relpath(ctx.batch_id, ctx.logical_key)
    out = ctx.git.repo_dir / rel
    write_receipt(out, receipt)
    try:
        ctx.git.commit_paths(
            [out],
            f"video(final): {ctx.logical_key} bunny={guid[:8]}",
        )
        ctx.git.push(branch)
    except GitBranchError as e:
        return FinalizeResult(
            outcome=FinalizeOutcome.FAILED,
            receipt=receipt,
            message=f"receipt commit/push failed after Bunny identity {guid}: {e}",
            bunny_create_calls=len(ctx.bunny.log.creates) - creates0,
            bunny_upload_calls=len(ctx.bunny.log.uploads) - uploads0,
        )

    return FinalizeResult(
        outcome=outcome,
        receipt=receipt,
        message="finalized",
        bunny_create_calls=len(ctx.bunny.log.creates) - creates0,
        bunny_upload_calls=len(ctx.bunny.log.uploads) - uploads0,
        commits=len(ctx.git.log.commits) - commits0,
        pushes=len(ctx.git.log.pushes) - pushes0,
    )


def should_skip_generation(
    git: ResultBranchRepo,
    *,
    batch_id: str,
    logical_key: str,
    source_sha: str,
    video_checksum: str | None = None,
) -> bool:
    """True when a finalized receipt matches batch/logical/sourceSha.

    When video_checksum is provided, also require checksum match (strict).
    """
    try:
        existing = _read_existing_receipt(git, batch_id, logical_key)
    except ReceiptError:
        return False
    if existing is None:
        return False
    if (
        existing.get("batchId") != batch_id
        or existing.get("logicalKey") != logical_key
        or existing.get("sourceSha") != source_sha
        or existing.get("validationStatus") not in ("validated", "finalized")
        or not existing.get("bunnyGuid")
    ):
        return False
    if video_checksum and existing.get("videoChecksum") != video_checksum:
        return False
    return True
