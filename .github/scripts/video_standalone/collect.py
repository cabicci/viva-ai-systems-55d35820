"""Always-run collector for the standalone 300 workflow.

Delegates to video_finalize.collector.collect_receipts (read-only).
Given the 300-plan and one-or-more repo checkouts (each holding at most one
cell receipt on its result branch), classifies each logical key as
finalized / failed / missing / ambiguous.

Exit codes:
  0 -> every expected key is finalized
  1 -> any key is failed, missing, or ambiguous (preserves partial success;
       enables GitHub native "Re-run failed jobs")
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_SCRIPTS_ROOT = _HERE.parent
if str(_SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_ROOT))

from video_finalize.collector import collect_receipts  # type: ignore  # noqa: E402
from video_finalize.constants import BATCH_ID  # type: ignore  # noqa: E402

from video_standalone.plan import build_plan  # type: ignore  # noqa: E402


def collect(
    *,
    plan_path: Path,
    receipt_roots: list[Path],
    failed_keys: list[str] | None = None,
    batch_id: str = BATCH_ID,
) -> dict:
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    expected = [c["logical_key"] for c in plan["canary"] + plan["matrix_a"] + plan["matrix_b"]]
    if len(expected) != 300:
        raise RuntimeError(f"plan expected 300 keys, got {len(expected)}")

    report = collect_receipts(
        expected_logical_keys=expected,
        receipt_roots=receipt_roots,
        batch_id=batch_id,
        failed_logical_keys=failed_keys or [],
    )
    return {
        "total_expected": len(expected),
        "finalized": sorted(report.finalized),
        "failed": sorted(report.failed),
        "missing": sorted(report.missing),
        "ambiguous": sorted(report.ambiguous),
        "details": dict(sorted(report.details.items())),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True, help="path to plan JSON from plan.py")
    ap.add_argument(
        "--receipt-root", action="append", default=[],
        help="one or more repo checkouts each containing zero-or-one cell receipts",
    )
    ap.add_argument("--failed-keys", default="", help="comma-separated list of failed keys")
    ap.add_argument("--out", required=True)
    ap.add_argument("--repo-root", default=None,
                    help="if set, additionally rebuilds plan from this repo root and verifies counts")
    args = ap.parse_args(argv)

    if args.repo_root:
        rebuilt = build_plan(Path(args.repo_root))
        if rebuilt["totals"]["total"] != 300:
            raise RuntimeError("re-plan sanity check failed")

    failed = [k for k in (args.failed_keys or "").split(",") if k.strip()]
    report = collect(
        plan_path=Path(args.plan),
        receipt_roots=[Path(r) for r in args.receipt_root],
        failed_keys=failed,
    )
    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(
        {k: len(v) if isinstance(v, list) else v
         for k, v in report.items() if k != "details"}
    ))
    unresolved = len(report["failed"]) + len(report["missing"]) + len(report["ambiguous"])
    return 0 if unresolved == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
