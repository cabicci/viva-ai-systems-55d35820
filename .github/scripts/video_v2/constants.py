"""Deterministic constants and path helpers for video-production-final-v2.

Isolated from video_finalize/* and video-production-batch.yml.
No shared mutable state; safe to import in mocked tests.
"""
from __future__ import annotations

BATCH_ID = "video-full-300-final-v2"
SCHEMA_VERSION = "video-v2-receipt-v1"

# Locale contract (owner-authorized): exactly 300 unique logical keys.
LOCALE_COUNTS = {
    "en": 100,
    "ar-MSA": 100,
    "ar-Gulf": 100,
    "ar-EG": 0,
}
TOTAL_KEYS = 300
MATRIX_A_SIZE = 150
MATRIX_B_SIZE = 150
MAX_PARALLEL_COMBINED = 4  # honored by workflow-level concurrency, split 2+2

MAX_GEMINI_SCRIPT_ATTEMPTS = 2

RESULT_ROOT = "remotion/video-pipeline/results-v2"


def result_branch(logical_key: str) -> str:
    if not logical_key or "/" in logical_key or ".." in logical_key:
        raise ValueError(f"invalid logical_key: {logical_key!r}")
    return f"video-results-v2/{BATCH_ID}/{logical_key}"


def receipt_relpath(logical_key: str) -> str:
    return f"{RESULT_ROOT}/{BATCH_ID}/{logical_key}/finalization-receipt.json"


def reconciliation_relpath(logical_key: str) -> str:
    return f"{RESULT_ROOT}/{BATCH_ID}/{logical_key}/reconciliation-report.json"


FORBIDDEN_RECEIPT_KEYS = frozenset({
    "apiKey", "api_key", "accessKey", "AccessKey",
    "authorization", "Authorization", "token", "secret",
    "Bearer", "signedUrl", "signed_url", "uploadUrl", "upload_url",
    "BUNNY_STREAM_API_KEY", "GITHUB_TOKEN", "GH_PAT", "GH_PAT_NEW",
})
