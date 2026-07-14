#!/usr/bin/env python3
"""Finalize one cell from a validated production-result directory.

Mock-friendly: set BUNNY_HTTP_MOCK=1 and provide a JSON mock protocol file, or
inject via unit tests by importing finalize_cell.

Env (real workflow):
  BATCH_ID, COMPOSITE_KEY, LID, LOCALE, SOURCE_SHA
  WORKFLOW_RUN_ID, ARTIFACT_ID, ARTIFACT_DIGEST
  PRODUCTION_ROOT  path containing the six-file bundle
  RESULTS_REPO     git repo used for isolated result branch
  BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.artifact_contract import resolve_production_root  # noqa: E402
from video_finalize.bunny_client import BunnyClient  # noqa: E402
from video_finalize.finalize_cell import FinalizeContext, FinalizeOutcome, finalize_cell  # noqa: E402
from video_finalize.git_result_branch import ResultBranchRepo  # noqa: E402


def main() -> int:
    production = resolve_production_root(Path(os.environ["PRODUCTION_ROOT"]))
    bunny = BunnyClient(
        library_id=os.environ["BUNNY_STREAM_LIBRARY_ID"],
        api_key=os.environ["BUNNY_STREAM_API_KEY"],
    )
    git = ResultBranchRepo(Path(os.environ["RESULTS_REPO"]))
    ctx = FinalizeContext(
        batch_id=os.environ["BATCH_ID"],
        logical_key=os.environ["COMPOSITE_KEY"],
        lesson_id=os.environ["LID"],
        locale=os.environ["LOCALE"],
        source_sha=os.environ["SOURCE_SHA"],
        workflow_run_id=os.environ["WORKFLOW_RUN_ID"],
        artifact_id=os.environ["ARTIFACT_ID"],
        artifact_digest=os.environ["ARTIFACT_DIGEST"],
        production_root=production,
        bunny=bunny,
        git=git,
        allow_bunny_upload=True,
        allow_gemini=False,
        allow_tts=False,
        allow_render=False,
    )
    result = finalize_cell(ctx)
    print(f"::notice::finalize outcome={result.outcome.value} msg={result.message}")
    if result.outcome == FinalizeOutcome.AMBIGUOUS:
        return 30
    if result.outcome == FinalizeOutcome.FAILED:
        return 31
    # skipped-success / finalized / commit-only-recovered are success.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
