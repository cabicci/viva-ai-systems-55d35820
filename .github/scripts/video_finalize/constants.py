"""Deterministic incremental Bunny finalization constants and paths.

Branch ownership:
  video-results/{batchId}/{logicalKey}

Receipt path (inside that branch):
  remotion/video-pipeline/results/{batchId}/{logicalKey}/finalization-receipt.json

Captions remain artifact-only (Bunny caption-track upload deferred).
"""
from __future__ import annotations

BATCH_ID = "video-full-300-localized-v1"
SOURCE_SHA_PIN = "6cfd019d315ec3f5a30ffc83bd551f4deb52385c"
SCHEMA_VERSION = "video-finalization-receipt-v1"

RESULT_ROOT = "remotion/video-pipeline/results"

# Pinned accepted finalize-one artifact (read-only; never regenerated here).
FINALIZE_ONE_PIN = {
    "workflowRunId": "29296309474",
    "artifactId": "8296996512",
    "artifactDigest": "sha256:3dd0f69515d9fa8a551518c0d42395623d3d00202355817f0d434ec68bb16175",
    "logicalKey": "analyst-m3-l2-ai-summarization__en",
    "lessonId": "analyst-m3-l2-ai-summarization",
    "locale": "en",
    "sourceSha": SOURCE_SHA_PIN,
    "batchId": BATCH_ID,
}


def result_branch_name(batch_id: str, logical_key: str) -> str:
    if not batch_id or not logical_key:
        raise ValueError("batch_id and logical_key required")
    if "/" in logical_key or ".." in logical_key:
        raise ValueError(f"invalid logical_key: {logical_key!r}")
    return f"video-results/{batch_id}/{logical_key}"


def receipt_relpath(batch_id: str, logical_key: str) -> str:
    return f"{RESULT_ROOT}/{batch_id}/{logical_key}/finalization-receipt.json"


def reconciliation_relpath(batch_id: str, logical_key: str) -> str:
    return f"{RESULT_ROOT}/{batch_id}/{logical_key}/reconciliation-report.json"


def bunny_title(lesson_id: str, locale: str) -> str:
    """Title convention matching upload_bunny_locale.py."""
    return f"{lesson_id} [{locale}]"


FORBIDDEN_RECEIPT_KEYS = frozenset(
    {
        "apiKey",
        "api_key",
        "accessKey",
        "AccessKey",
        "authorization",
        "Authorization",
        "token",
        "secret",
        "Bearer",
        "signedUrl",
        "signed_url",
        "uploadUrl",
        "upload_url",
        "BUNNY_STREAM_API_KEY",
        "GITHUB_TOKEN",
    }
)
