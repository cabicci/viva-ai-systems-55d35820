"""cli_collect.py — final collector for video-production-final-v2.

Runs with ``if: always()`` in the workflow. Preserves per-video receipts even
when siblings fail, produces a mapping-promotion candidate, and exits non-zero
when unresolved cells remain so that GitHub's native "Re-run failed jobs"
button continues to reflect real state.

Never pushes to main; the candidate file is uploaded as an artifact only.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from video_v2.collector import collect  # noqa: E402


def _expected_keys_from_plan(plan_path: Path) -> list[str]:
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    keys = [plan["canary"]["logical_key"]]
    keys.extend(c["logical_key"] for c in plan.get("matrix_a", []))
    keys.extend(c["logical_key"] for c in plan.get("matrix_b", []))
    return keys


def _read_failed_keys(path: Path | None) -> list[str]:
    if not path or not path.is_file():
        return []
    txt = path.read_text(encoding="utf-8").strip()
    if not txt:
        return []
    if txt.startswith("["):
        return list(json.loads(txt))
    return [line.strip() for line in txt.splitlines() if line.strip()]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True, help="Path to plan.json emitted by cli_build_plan.py")
    ap.add_argument("--receipt-root", action="append", default=[],
                    help="Directory containing checked-out result branch(es). May be repeated.")
    ap.add_argument("--failed-keys", default=None,
                    help="Optional file with failed logical keys (JSON array or newline-separated).")
    ap.add_argument("--out", required=True)
    ap.add_argument("--plan-digest", default=None, help="Advisory: expected planDigest.")
    args = ap.parse_args(argv)

    plan_path = Path(args.plan)
    if args.plan_digest:
        try:
            got = json.loads(plan_path.read_text(encoding="utf-8")).get("planDigest")
            if got and got != args.plan_digest:
                print(f"::warning::planDigest mismatch: {got} vs {args.plan_digest}", file=sys.stderr)
        except Exception:
            pass

    expected = _expected_keys_from_plan(plan_path)
    roots = [Path(r) for r in args.receipt_root] or [Path(".")]
    failed = _read_failed_keys(Path(args.failed_keys) if args.failed_keys else None)

    report = collect(
        expected_keys=expected,
        receipt_roots=roots,
        failed_keys=failed,
    )
    d = report.to_dict()
    Path(args.out).write_text(json.dumps(d, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                              encoding="utf-8")

    print(f"collector: successful={len(d['successfulLogicalKeys'])} "
          f"failed={len(d['failedLogicalKeys'])} "
          f"missing={len(d['missingLogicalKeys'])} "
          f"conflicting={len(d['conflictingLogicalKeys'])}")

    # Non-zero exit when unresolved cells remain — this keeps GitHub's native
    # "Re-run failed jobs" workflow-level reflow honest and does NOT delete
    # any successful per-video receipt.
    unresolved = d["failedLogicalKeys"] or d["missingLogicalKeys"] or d["conflictingLogicalKeys"]
    return 1 if unresolved else 0


if __name__ == "__main__":
    raise SystemExit(main())
