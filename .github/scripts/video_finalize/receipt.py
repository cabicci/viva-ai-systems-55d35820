"""Immutable per-video finalization receipt schema and validation."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .constants import (
    FORBIDDEN_RECEIPT_KEYS,
    SCHEMA_VERSION,
    receipt_relpath,
)

REQUIRED_FIELDS = (
    "schemaVersion",
    "batchId",
    "logicalKey",
    "lessonId",
    "locale",
    "sourceSha",
    "workflowRunId",
    "artifactId",
    "artifactDigest",
    "videoChecksum",
    "captionsChecksum",
    "bunnyGuid",
    "bunnyUploadStatus",
    "validationStatus",
    "finalizedAt",
)

ALLOWED_UPLOAD_STATUS = frozenset({"uploaded", "verified"})
ALLOWED_VALIDATION_STATUS = frozenset({"validated", "finalized"})


class ReceiptError(ValueError):
    pass


def identity_tuple(receipt: dict[str, Any]) -> tuple[str, str, str, str]:
    return (
        str(receipt.get("batchId") or ""),
        str(receipt.get("logicalKey") or ""),
        str(receipt.get("sourceSha") or ""),
        str(receipt.get("videoChecksum") or ""),
    )


def build_receipt(
    *,
    batch_id: str,
    logical_key: str,
    lesson_id: str,
    locale: str,
    source_sha: str,
    workflow_run_id: str,
    artifact_id: str,
    artifact_digest: str,
    video_checksum: str,
    captions_checksum: str,
    bunny_guid: str,
    bunny_upload_status: str,
    validation_status: str = "finalized",
    finalized_at: str | None = None,
) -> dict[str, Any]:
    if bunny_upload_status not in ALLOWED_UPLOAD_STATUS:
        raise ReceiptError(f"invalid bunnyUploadStatus: {bunny_upload_status!r}")
    if validation_status not in ALLOWED_VALIDATION_STATUS:
        raise ReceiptError(f"invalid validationStatus: {validation_status!r}")
    if not captions_checksum:
        raise ReceiptError("captionsChecksum required (captions remain mandatory)")
    if not video_checksum:
        raise ReceiptError("videoChecksum required")
    if not bunny_guid:
        raise ReceiptError("bunnyGuid required")

    receipt = {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": batch_id,
        "logicalKey": logical_key,
        "lessonId": lesson_id,
        "locale": locale,
        "sourceSha": source_sha,
        "workflowRunId": str(workflow_run_id),
        "artifactId": str(artifact_id),
        "artifactDigest": artifact_digest,
        "videoChecksum": video_checksum,
        "captionsChecksum": captions_checksum,
        "bunnyGuid": bunny_guid,
        "bunnyUploadStatus": bunny_upload_status,
        "validationStatus": validation_status,
        "finalizedAt": finalized_at
        or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    validate_receipt(receipt)
    return receipt


def validate_receipt(receipt: dict[str, Any]) -> None:
    if not isinstance(receipt, dict):
        raise ReceiptError("receipt must be an object")
    for key in REQUIRED_FIELDS:
        if key not in receipt or receipt[key] in (None, ""):
            raise ReceiptError(f"missing required field: {key}")
    extras = set(receipt) - set(REQUIRED_FIELDS)
    if extras:
        raise ReceiptError(f"unexpected receipt fields: {sorted(extras)}")
    for bad in FORBIDDEN_RECEIPT_KEYS:
        if bad in receipt:
            raise ReceiptError("secret-like key forbidden in receipt")
    blob = json.dumps(receipt, ensure_ascii=False)
    lowered = blob.lower()
    for needle in ("accesskey", "bearer ", "api_key", "ghp_", "github_pat_"):
        if needle in lowered:
            raise ReceiptError("possible secret leakage in receipt values")
    if receipt["schemaVersion"] != SCHEMA_VERSION:
        raise ReceiptError(f"unsupported schemaVersion: {receipt['schemaVersion']!r}")
    if receipt["bunnyUploadStatus"] not in ALLOWED_UPLOAD_STATUS:
        raise ReceiptError("invalid bunnyUploadStatus")
    if receipt["validationStatus"] not in ALLOWED_VALIDATION_STATUS:
        raise ReceiptError("invalid validationStatus")
    expected_key = f'{receipt["lessonId"]}__{receipt["locale"]}'
    if receipt["logicalKey"] != expected_key:
        raise ReceiptError(
            f"logicalKey mismatch: {receipt['logicalKey']!r} != {expected_key!r}"
        )


def receipts_match_identity(
    a: dict[str, Any],
    *,
    batch_id: str,
    logical_key: str,
    source_sha: str,
    video_checksum: str,
) -> bool:
    validate_receipt(a)
    return identity_tuple(a) == (batch_id, logical_key, source_sha, video_checksum)


def write_receipt(path: Path, receipt: dict[str, Any]) -> None:
    validate_receipt(receipt)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def load_receipt(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    validate_receipt(data)
    return data


def receipt_path_for(root: Path, batch_id: str, logical_key: str) -> Path:
    return root / receipt_relpath(batch_id, logical_key)
