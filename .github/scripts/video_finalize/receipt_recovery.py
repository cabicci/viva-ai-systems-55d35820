"""Isolated receipt-only recovery for already-uploaded Bunny videos.

Reachability constraints (enforced by design + static tests):
- No Gemini / TTS / Remotion / lesson-builder / render
- No Bunny create / upload / replace / overwrite / delete
- No mapping promotion / registry edits
- No post-upload readiness polling
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

from .artifact_contract import (
    ArtifactError,
    assert_identity,
    compute_bundle_digest,
    sha256_file,
    validate_six_file_bundle,
)
from .bunny_client import BunnyClient
from .constants import bunny_title, receipt_relpath, result_branch_name
from .git_result_branch import GitBranchError, ResultBranchRepo
from .receipt import (
    ReceiptError,
    build_receipt,
    validate_receipt,
    write_receipt,
)
from .recovery_plan import RECOVERY_SOURCE_SHA, RECOVERY_WORKFLOW_RUN_ID


class RecoveryOutcome(str, Enum):
    SKIPPED_SUCCESS = "skipped-success"
    PENDING_ARTIFACT = "pending-artifact"
    RECOVERED = "recovered"
    FAILED = "failed"
    AMBIGUOUS = "ambiguous"


@dataclass
class RecoveryCallLog:
    artifact_downloads: int = 0
    bunny_searches: int = 0
    bunny_gets: int = 0
    bunny_creates: int = 0
    bunny_uploads: int = 0
    commits: int = 0
    pushes: int = 0


@dataclass
class RecoveryContext:
    batch_id: str
    logical_key: str
    lesson_id: str
    locale: str
    source_sha: str
    workflow_run_id: str
    artifact_id: str
    artifact_name: str
    expected_artifact_digest: str | None
    production_root: Path | None
    bunny: BunnyClient
    git: ResultBranchRepo
    artifact_already_downloaded: bool = False


@dataclass
class RecoveryResult:
    outcome: RecoveryOutcome
    receipt: dict[str, Any] | None = None
    message: str = ""
    reconciliation: dict[str, Any] | None = None
    log: RecoveryCallLog = field(default_factory=RecoveryCallLog)


def _read_existing_receipt(git: ResultBranchRepo, batch_id: str, logical_key: str) -> dict[str, Any] | None:
    rel = receipt_relpath(batch_id, logical_key)
    data = git.read_file(rel)
    if data is None:
        return None
    try:
        receipt = json.loads(data.decode("utf-8"))
        validate_receipt(receipt)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise ReceiptError(f"invalid receipt json: {e}") from e
    return receipt


def existing_receipt_allows_skip(
    receipt: dict[str, Any],
    *,
    batch_id: str,
    logical_key: str,
    lesson_id: str,
    locale: str,
) -> bool:
    return (
        receipt.get("batchId") == batch_id
        and receipt.get("logicalKey") == logical_key
        and receipt.get("lessonId") == lesson_id
        and receipt.get("locale") == locale
        and receipt.get("validationStatus") == "finalized"
        and bool(receipt.get("bunnyGuid"))
        and bool(receipt.get("videoChecksum"))
        and bool(receipt.get("captionsChecksum"))
    )


def check_existing_receipt_before_external_io(ctx: RecoveryContext) -> RecoveryResult | None:
    """Return skip/fail result before artifact download or Bunny access."""
    branch = result_branch_name(ctx.batch_id, ctx.logical_key)
    if branch == "main":
        return RecoveryResult(outcome=RecoveryOutcome.FAILED, message="cell cannot target main")
    try:
        ctx.git.ensure_orphan_branch(branch)
        existing = _read_existing_receipt(ctx.git, ctx.batch_id, ctx.logical_key)
    except ReceiptError as e:
        return RecoveryResult(
            outcome=RecoveryOutcome.AMBIGUOUS,
            message=f"malformed existing receipt; fail closed: {e}",
            reconciliation={"reason": "invalid-receipt-on-branch", "error": str(e)},
        )
    except GitBranchError as e:
        return RecoveryResult(outcome=RecoveryOutcome.FAILED, message=str(e))

    if existing is None:
        return None
    if existing_receipt_allows_skip(
        existing,
        batch_id=ctx.batch_id,
        logical_key=ctx.logical_key,
        lesson_id=ctx.lesson_id,
        locale=ctx.locale,
    ):
        return RecoveryResult(
            outcome=RecoveryOutcome.SKIPPED_SUCCESS,
            receipt=existing,
            message="valid finalized receipt present; skipped before artifact/Bunny",
        )
    return RecoveryResult(
        outcome=RecoveryOutcome.AMBIGUOUS,
        receipt=existing,
        message="existing receipt identity conflict; refuse overwrite",
        reconciliation={
            "reason": "receipt-identity-conflict",
            "logicalKey": ctx.logical_key,
        },
    )


def validate_recovery_artifact(ctx: RecoveryContext) -> dict[str, Any]:
    if ctx.production_root is None or not ctx.production_root.exists():
        raise ArtifactError("production_root missing")
    if ctx.workflow_run_id != RECOVERY_WORKFLOW_RUN_ID:
        raise ArtifactError(
            f"workflowRunId mismatch: {ctx.workflow_run_id!r} != {RECOVERY_WORKFLOW_RUN_ID!r}"
        )
    if ctx.source_sha != RECOVERY_SOURCE_SHA:
        raise ArtifactError(f"sourceSha mismatch: {ctx.source_sha!r} != {RECOVERY_SOURCE_SHA!r}")
    if not ctx.artifact_id:
        raise ArtifactError("artifactId required")
    if not ctx.artifact_name:
        raise ArtifactError("artifactName required")

    meta = validate_six_file_bundle(ctx.production_root)
    assert_identity(
        meta,
        logical_key=ctx.logical_key,
        lesson_id=ctx.lesson_id,
        locale=ctx.locale,
        source_sha=ctx.source_sha,
    )
    status = meta["status"]
    if status.get("batchId") not in (None, ctx.batch_id):
        raise ArtifactError(f"status.batchId mismatch: {status.get('batchId')!r}")

    digest = compute_bundle_digest(ctx.production_root)
    if ctx.expected_artifact_digest and ctx.expected_artifact_digest != digest:
        raise ArtifactError(
            f"bundle digest mismatch: {digest} != {ctx.expected_artifact_digest}"
        )
    video_sha = sha256_file(ctx.production_root / "video.mp4")
    captions_sha = sha256_file(ctx.production_root / "captions.vtt")
    if video_sha != meta["videoChecksum"]:
        raise ArtifactError("recomputed video checksum mismatch")
    if captions_sha != meta["captionsChecksum"]:
        raise ArtifactError("recomputed captions checksum mismatch")

    # captions language: locale string must appear consistent with status locale
    if status.get("locale") != ctx.locale:
        raise ArtifactError("captions/status locale mismatch")

    meta["artifactDigest"] = digest
    meta["videoChecksum"] = video_sha
    meta["captionsChecksum"] = captions_sha
    return meta


def prove_bunny_identity(
    ctx: RecoveryContext, *, video_checksum: str, log: RecoveryCallLog
) -> tuple[str | None, dict[str, Any] | None]:
    """Return (guid, reconciliation). Never creates/uploads."""
    title = bunny_title(ctx.lesson_id, ctx.locale)
    log.bunny_searches += 1
    matches, recon = ctx.bunny.find_by_title_and_hash(title, video_checksum)
    if recon is not None:
        return None, recon
    if len(matches) == 0:
        return None, {
            "reason": "zero-bunny-matches",
            "title": title,
            "videoChecksum": video_checksum.lower(),
        }
    if len(matches) != 1:
        return None, {
            "reason": "multiple-bunny-identities",
            "title": title,
            "guids": [m.get("guid") for m in matches],
        }
    guid = str(matches[0].get("guid") or "")
    if not guid:
        return None, {"reason": "match-missing-guid", "title": title}
    log.bunny_gets += 1
    video = ctx.bunny.get_video(guid)
    get_recon = ctx.bunny.verify_top_level_original_hash(video, video_checksum)
    if get_recon is not None:
        return None, get_recon
    return guid, None


def recover_uploaded_receipt(ctx: RecoveryContext) -> RecoveryResult:
    """Receipt-only recovery. Structurally cannot create/upload Bunny videos."""
    log = RecoveryCallLog()
    if ctx.artifact_already_downloaded:
        log.artifact_downloads = 1

    early = check_existing_receipt_before_external_io(ctx)
    if early is not None:
        early.log = log
        return early

    if ctx.production_root is None:
        return RecoveryResult(
            outcome=RecoveryOutcome.PENDING_ARTIFACT,
            message="no existing receipt; artifact download required",
            log=log,
        )

    try:
        meta = validate_recovery_artifact(ctx)
    except (ArtifactError, ReceiptError, json.JSONDecodeError) as e:
        return RecoveryResult(
            outcome=RecoveryOutcome.FAILED,
            message=f"artifact validation failed before Bunny: {e}",
            log=log,
        )

    try:
        guid, recon = prove_bunny_identity(
            ctx, video_checksum=meta["videoChecksum"], log=log
        )
    except Exception as e:
        return RecoveryResult(
            outcome=RecoveryOutcome.FAILED,
            message=f"Bunny identity proof failed: {e}",
            log=log,
        )

    if guid is None:
        return RecoveryResult(
            outcome=RecoveryOutcome.AMBIGUOUS,
            message="Bunny identity proof failed closed",
            reconciliation=recon,
            log=log,
        )

    # Re-check receipt after proof — still refuse overwrite.
    early2 = check_existing_receipt_before_external_io(ctx)
    if early2 is not None and early2.outcome != RecoveryOutcome.SKIPPED_SUCCESS:
        early2.log = log
        return early2
    if early2 is not None and early2.outcome == RecoveryOutcome.SKIPPED_SUCCESS:
        early2.log = log
        return early2

    receipt = build_receipt(
        batch_id=ctx.batch_id,
        logical_key=ctx.logical_key,
        lesson_id=ctx.lesson_id,
        locale=ctx.locale,
        source_sha=ctx.source_sha,
        workflow_run_id=ctx.workflow_run_id,
        artifact_id=ctx.artifact_id,
        artifact_digest=meta["artifactDigest"],
        video_checksum=meta["videoChecksum"],
        captions_checksum=meta["captionsChecksum"],
        bunny_guid=guid,
        bunny_upload_status="uploaded",
        validation_status="finalized",
    )

    branch = result_branch_name(ctx.batch_id, ctx.logical_key)
    rel = receipt_relpath(ctx.batch_id, ctx.logical_key)
    path = ctx.git.repo_dir / rel
    try:
        ctx.git.ensure_orphan_branch(branch)
        if path.is_file():
            return RecoveryResult(
                outcome=RecoveryOutcome.AMBIGUOUS,
                message="receipt appeared before commit; refuse overwrite",
                log=log,
            )
        write_receipt(path, receipt)
        ctx.git.commit_paths([path], f"chore(video): recover receipt {ctx.logical_key}")
        log.commits = 1
        ctx.git.push(branch)
        log.pushes = 1
    except (GitBranchError, ReceiptError) as e:
        return RecoveryResult(
            outcome=RecoveryOutcome.FAILED,
            message=str(e),
            log=log,
        )

    # Structural mutation counters remain zero.
    log.bunny_creates = 0
    log.bunny_uploads = 0
    return RecoveryResult(
        outcome=RecoveryOutcome.RECOVERED,
        receipt=receipt,
        message=f"recovered receipt for {ctx.logical_key} guid={guid}",
        log=log,
    )
