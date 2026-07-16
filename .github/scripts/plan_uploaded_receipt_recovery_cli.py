"""CLI: plan recover-uploaded-receipts matrix (fail-closed counts)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.constants import BATCH_ID, receipt_relpath  # noqa: E402
from video_finalize.receipt import ReceiptError, validate_receipt  # noqa: E402
from video_finalize.recovery_plan import (  # noqa: E402
    RECOVERY_WORKFLOW_RUN_ID,
    RecoveryPlanError,
    build_recovery_plan,
    load_authoritative_logical_keys,
)


def _load_artifacts() -> list[dict]:
    raw = os.environ.get("RECOVERY_ARTIFACTS_JSON")
    if raw:
        return json.loads(raw)
    path = os.environ.get("RECOVERY_ARTIFACTS_PATH")
    if path:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    raise RecoveryPlanError("RECOVERY_ARTIFACTS_JSON or RECOVERY_ARTIFACTS_PATH required")


def _collect_finalized(fetch_dir: Path, authoritative: set[str]) -> set[str]:
    finalized: set[str] = set()
    if not fetch_dir.is_dir():
        return finalized
    for child in sorted(fetch_dir.iterdir()):
        if not child.is_dir():
            continue
        key = child.name
        if key not in authoritative:
            continue
        path = child / receipt_relpath(BATCH_ID, key)
        if not path.is_file():
            continue
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
            validate_receipt(receipt)
        except (json.JSONDecodeError, ReceiptError) as e:
            raise RecoveryPlanError(f"invalid receipt for {key}: {e}") from e
        if receipt.get("logicalKey") != key:
            raise RecoveryPlanError(f"receipt logicalKey mismatch for {key}")
        if receipt.get("batchId") != BATCH_ID:
            raise RecoveryPlanError(f"receipt batchId mismatch for {key}")
        if receipt.get("validationStatus") != "finalized":
            raise RecoveryPlanError(f"receipt not finalized for {key}")
        if not receipt.get("bunnyGuid"):
            raise RecoveryPlanError(f"receipt missing bunnyGuid for {key}")
        if key in finalized:
            raise RecoveryPlanError(f"duplicate finalized receipt for {key}")
        finalized.add(key)
    return finalized


def main() -> int:
    repo_root = Path(os.environ.get("REPO_ROOT", ".")).resolve()
    fetch_dir = Path(os.environ.get("RESULTS_FETCH_DIR", "/tmp/result-branches"))
    try:
        authoritative = load_authoritative_logical_keys(repo_root)
        artifacts = _load_artifacts()
        finalized = _collect_finalized(fetch_dir, set(authoritative))
        plan = build_recovery_plan(
            authoritative_keys=authoritative,
            artifacts=artifacts,
            finalized_keys=finalized,
            workflow_run_id=os.environ.get(
                "RECOVERY_WORKFLOW_RUN_ID", RECOVERY_WORKFLOW_RUN_ID
            ),
        )
    except RecoveryPlanError as e:
        print(f"::error::{e}")
        return 20

    payload = plan.as_dict()
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))
    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a", encoding="utf-8") as f:
            f.write(
                "recovery_matrix="
                + json.dumps(payload["recoveryMatrix"], separators=(",", ":"))
                + "\n"
            )
            f.write(f"recovery_count={payload['recoveryCount']}\n")
            f.write(f"regeneration_count={payload['regenerationCount']}\n")
            f.write(f"artifact_count={payload['artifactCount']}\n")
            f.write(f"finalized_count={payload['finalizedCount']}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
