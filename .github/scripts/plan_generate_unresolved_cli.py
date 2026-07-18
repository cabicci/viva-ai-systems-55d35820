#!/usr/bin/env python3
"""CLI: plan generate-unresolved matrix (fail-closed)."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.unresolved_generation_plan import (  # noqa: E402
    UnresolvedPlanError,
    load_plan_from_repo,
    split_matrix,
)


def main() -> int:
    repo_root = Path(os.environ.get("REPO_ROOT", ".")).resolve()
    fetch_dir = Path(os.environ.get("RESULTS_FETCH_DIR", "/tmp/result-branches"))
    receipt_roots: list[Path] = []
    if fetch_dir.is_dir():
        receipt_roots.append(fetch_dir)

    try:
        plan = load_plan_from_repo(repo_root=repo_root, receipt_roots=receipt_roots)
        matrix_a, matrix_b = split_matrix(plan.matrix_cells)
    except UnresolvedPlanError as e:
        print(f"::error::{e}", file=sys.stderr)
        return 1

    payload = plan.as_dict()
    payload["matrix_a"] = matrix_a
    payload["matrix_b"] = matrix_b
    payload["count_a"] = len(matrix_a)
    payload["count_b"] = len(matrix_b)
    payload["total_count"] = plan.selected_count
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))

    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a", encoding="utf-8") as f:
            f.write(
                "matrix_a="
                + json.dumps(matrix_a, separators=(",", ":"))
                + "\n"
            )
            f.write(
                "matrix_b="
                + json.dumps(matrix_b, separators=(",", ":"))
                + "\n"
            )
            f.write(f"count_a={len(matrix_a)}\n")
            f.write(f"count_b={len(matrix_b)}\n")
            f.write(f"total_count={plan.selected_count}\n")
            f.write(f"empty={'true' if plan.empty else 'false'}\n")

    if plan.empty:
        print(f"::notice::{plan.notice}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
