#!/usr/bin/env python3
"""Validate finalize-one pinned identity before any external write."""
from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.constants import FINALIZE_ONE_PIN, result_branch_name  # noqa: E402


def main() -> int:
    pin = FINALIZE_ONE_PIN
    checks = {
        "WORKFLOW_RUN_ID": pin["workflowRunId"],
        "ARTIFACT_ID": pin["artifactId"],
        "ARTIFACT_DIGEST": pin["artifactDigest"],
        "COMPOSITE_KEY": pin["logicalKey"],
        "LID": pin["lessonId"],
        "LOCALE": pin["locale"],
        "SOURCE_SHA": pin["sourceSha"],
        "BATCH_ID": pin["batchId"],
    }
    for env_key, expected in checks.items():
        got = os.environ.get(env_key, "")
        if got != expected:
            print(f"::error::finalize-one pin mismatch {env_key}: {got!r} != {expected!r}")
            return 40
    expected_branch = result_branch_name(pin["batchId"], pin["logicalKey"])
    if expected_branch != (
        "video-results--video-full-300-localized-v1--analyst-m3-l2-ai-summarization__en"
    ):
        print("::error::unexpected result branch naming")
        return 41
    print(f"::notice::finalize-one pins verified branch={expected_branch}")
    print(f"expected_branch={expected_branch}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
