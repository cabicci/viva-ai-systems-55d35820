"""Per-video durable receipt schema for video-production-final-v2."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .constants import (
    BATCH_ID, FORBIDDEN_RECEIPT_KEYS, SCHEMA_VERSION, receipt_relpath,
)

REQUIRED = (
    "schemaVersion", "batchId", "logicalKey", "lessonId", "locale",
    "sourceSha", "workflowRunId", "artifactId", "artifactDigest",
    "videoChecksum", "captionsChecksum", "bunnyGuid", "bunnyIdentityHash",
    "bunnyUploadStatus", "validationStatus", "finalizedAt",
)
ALLOWED_UPLOAD = frozenset({"uploaded", "verified", "reused"})
ALLOWED_VALIDATION = frozenset({"validated", "finalized"})


class ReceiptError(ValueError):
    pass


def build(
    *,
    logical_key: str, lesson_id: str, locale: str, source_sha: str,
    workflow_run_id: str, artifact_id: str, artifact_digest: str,
    video_checksum: str, captions_checksum: str,
    bunny_guid: str, bunny_identity_hash: str,
    bunny_upload_status: str = "verified",
    validation_status: str = "finalized",
) -> dict[str, Any]:
    if bunny_upload_status not in ALLOWED_UPLOAD:
        raise ReceiptError(f"bunnyUploadStatus: {bunny_upload_status!r}")
    if validation_status not in ALLOWED_VALIDATION:
        raise ReceiptError(f"validationStatus: {validation_status!r}")
    if logical_key != f"{lesson_id}__{locale}":
        raise ReceiptError("logicalKey must equal '{lessonId}__{locale}'")
    r = {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": BATCH_ID,
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
        "bunnyIdentityHash": bunny_identity_hash,
        "bunnyUploadStatus": bunny_upload_status,
        "validationStatus": validation_status,
        "finalizedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    validate(r)
    return r


def validate(r: dict[str, Any]) -> None:
    if not isinstance(r, dict):
        raise ReceiptError("receipt must be object")
    for k in REQUIRED:
        if not r.get(k):
            raise ReceiptError(f"missing: {k}")
    extras = set(r) - set(REQUIRED)
    if extras:
        raise ReceiptError(f"unexpected fields: {sorted(extras)}")
    for bad in FORBIDDEN_RECEIPT_KEYS:
        if bad in r:
            raise ReceiptError("secret-like key forbidden")
    blob = json.dumps(r, ensure_ascii=False).lower()
    for needle in ("accesskey", "bearer ", "api_key", "ghp_", "github_pat_"):
        if needle in blob:
            raise ReceiptError("possible secret leakage")
    if r["schemaVersion"] != SCHEMA_VERSION:
        raise ReceiptError("schemaVersion mismatch")


def write(root: Path, receipt: dict[str, Any]) -> Path:
    validate(receipt)
    path = root / receipt_relpath(receipt["logicalKey"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path
