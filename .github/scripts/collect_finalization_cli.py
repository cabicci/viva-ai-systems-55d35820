#!/usr/bin/env python3
"""Read-only collector CLI for full-300 finalization inventory."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.collector import collect_receipts  # noqa: E402


def main() -> int:
    batch_id = os.environ["BATCH_ID"]
    expected = json.loads(os.environ["EXPECTED_LOGICAL_KEYS_JSON"])
    failed = json.loads(os.environ.get("FAILED_LOGICAL_KEYS_JSON", "[]"))
    fetch_dir = Path(os.environ.get("RESULTS_FETCH_DIR", "/tmp/result-branches"))
    receipt_roots: list[Path] = []
    if fetch_dir.is_dir():
        for child in sorted(fetch_dir.iterdir()):
            if child.is_dir():
                receipt_roots.append(child)

    report = collect_receipts(
        expected_logical_keys=expected,
        receipt_roots=receipt_roots,
        batch_id=batch_id,
        failed_logical_keys=failed,
    )
    payload = report.as_dict()
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a", encoding="utf-8") as f:
            f.write("finalized_keys=" + ",".join(payload["finalizedLogicalKeys"]) + "\n")
            f.write("failed_keys=" + ",".join(payload["failedLogicalKeys"]) + "\n")
            f.write("missing_keys=" + ",".join(payload["missingLogicalKeys"]) + "\n")
            f.write("ambiguous_keys=" + ",".join(payload["ambiguousLogicalKeys"]) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
