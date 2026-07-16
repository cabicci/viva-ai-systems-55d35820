"""CLI: recover one uploaded cell receipt without Bunny create/upload."""
from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.artifact_contract import resolve_production_root  # noqa: E402
from video_finalize.bunny_client import BunnyClient  # noqa: E402
from video_finalize.git_result_branch import ResultBranchRepo  # noqa: E402
from video_finalize.receipt_recovery import (  # noqa: E402
    RecoveryContext,
    RecoveryOutcome,
    recover_uploaded_receipt,
)
from video_finalize.recovery_plan import (  # noqa: E402
    RECOVERY_SOURCE_SHA,
    RECOVERY_WORKFLOW_RUN_ID,
)


def main() -> int:
    # Hard pin — refuse wrong run/source before any work.
    workflow_run_id = os.environ["WORKFLOW_RUN_ID"]
    source_sha = os.environ["SOURCE_SHA"]
    if workflow_run_id != RECOVERY_WORKFLOW_RUN_ID:
        print(f"::error::WORKFLOW_RUN_ID must be {RECOVERY_WORKFLOW_RUN_ID}")
        return 40
    if source_sha != RECOVERY_SOURCE_SHA:
        print(f"::error::SOURCE_SHA must be {RECOVERY_SOURCE_SHA}")
        return 40

    production = None
    if os.environ.get("PRODUCTION_ROOT"):
        production = resolve_production_root(Path(os.environ["PRODUCTION_ROOT"]))

    bunny = BunnyClient(
        library_id=os.environ["BUNNY_STREAM_LIBRARY_ID"],
        api_key=os.environ["BUNNY_STREAM_API_KEY"],
    )
    # Structural guard: recovery CLI never calls mutation APIs.
    bunny.create_video = None  # type: ignore[method-assign]
    bunny.upload_mp4 = None  # type: ignore[method-assign]
    bunny.wait_for_post_upload_original_hash = None  # type: ignore[method-assign]

    git = ResultBranchRepo(Path(os.environ["RESULTS_REPO"]))
    ctx = RecoveryContext(
        batch_id=os.environ["BATCH_ID"],
        logical_key=os.environ["COMPOSITE_KEY"],
        lesson_id=os.environ["LID"],
        locale=os.environ["LOCALE"],
        source_sha=source_sha,
        workflow_run_id=workflow_run_id,
        artifact_id=os.environ["ARTIFACT_ID"],
        artifact_name=os.environ["ARTIFACT_NAME"],
        expected_artifact_digest=os.environ.get("ARTIFACT_DIGEST") or None,
        production_root=production,
        bunny=bunny,
        git=git,
        artifact_already_downloaded=bool(production),
    )
    result = recover_uploaded_receipt(ctx)
    print(
        f"::notice::recovery outcome={result.outcome.value} msg={result.message} "
        f"searches={result.log.bunny_searches} gets={result.log.bunny_gets} "
        f"creates={result.log.bunny_creates} uploads={result.log.bunny_uploads} "
        f"commits={result.log.commits} pushes={result.log.pushes}"
    )
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
            if result.outcome == RecoveryOutcome.SKIPPED_SUCCESS:
                f.write("skip=true\n")
            else:
                f.write("skip=false\n")
            f.write(f"outcome={result.outcome.value}\n")
    if result.outcome in (
        RecoveryOutcome.SKIPPED_SUCCESS,
        RecoveryOutcome.RECOVERED,
        RecoveryOutcome.PENDING_ARTIFACT,
    ):
        return 0
    if result.outcome == RecoveryOutcome.AMBIGUOUS:
        return 30
    return 31


if __name__ == "__main__":
    raise SystemExit(main())
