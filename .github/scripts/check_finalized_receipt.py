#!/usr/bin/env python3
"""Check durable receipt before paid generation.

If a finalized receipt matches batchId+logicalKey+sourceSha, print skip=true.
Does not call Gemini/TTS/Bunny.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.constants import receipt_relpath, result_branch_name  # noqa: E402
from video_finalize.receipt import ReceiptError, validate_receipt  # noqa: E402


def main() -> int:
    batch_id = os.environ["BATCH_ID"]
    logical_key = os.environ["COMPOSITE_KEY"]
    source_sha = os.environ["SOURCE_SHA"]
    results_repo = Path(os.environ.get("RESULTS_REPO", "."))
    rel = receipt_relpath(batch_id, logical_key)
    path = results_repo / rel

    def emit(skip: bool) -> None:
        print(f"skip={'true' if skip else 'false'}")
        if "GITHUB_OUTPUT" in os.environ:
            with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
                f.write(f"skip={'true' if skip else 'false'}\n")

    if not path.is_file():
        emit(False)
        print(f"::notice::no receipt at {rel}; generation proceeds")
        return 0
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
        validate_receipt(receipt)
    except (json.JSONDecodeError, ReceiptError) as e:
        print(f"::error::ambiguous receipt for {logical_key}: {e}")
        return 20

    ok = (
        receipt.get("batchId") == batch_id
        and receipt.get("logicalKey") == logical_key
        and receipt.get("sourceSha") == source_sha
        and receipt.get("validationStatus") in ("validated", "finalized")
        and bool(receipt.get("bunnyGuid"))
    )
    if ok:
        emit(True)
        print(
            f"::notice::skipped-success {logical_key} "
            f"branch={result_branch_name(batch_id, logical_key)}"
        )
        return 0
    print("::error::receipt present but identity does not match; fail closed")
    return 21


if __name__ == "__main__":
    raise SystemExit(main())
