"""Run a single standalone cell end-to-end with:

  0. Skip-success short-circuit: matching on-disk receipt with identical
     identity tuple -> return immediately (no Gemini, no TTS, no render,
     no Bunny, no git). Never modifies any other cell's receipt.

  1. Durable artifact recovery: if a previously validated six-file bundle
     is available (workflow pre-populates it under --bundle-in-dir on
     Re-run failed jobs), validate it and restore its files into the
     pipeline paths, skipping Gemini/TTS/render.

  2. Otherwise: locale narration gate with up to 2 Gemini attempts BEFORE
     TTS/render. Failure raises pre-paid-call.

  3. Full build (build-lesson.py; reuses the accepted script cache so TTS
     and captions consume the exact accepted scenes[].spoken).

  4. Six-file validation and bundle packaging under --bundle-out-dir.

  5. Bunny reconciliation (fail-closed, former-pilot collision safe).

  6. Receipt built, written, and committed+pushed to the isolated per-cell
     result branch. Never targets main. Never affects other cells.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_SCRIPTS_ROOT = _HERE.parent
if str(_SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_ROOT))

from video_finalize.constants import (  # type: ignore  # noqa: E402
    BATCH_ID, receipt_relpath, result_branch_name,
)
from video_finalize.receipt import (  # type: ignore  # noqa: E402
    build_receipt, identity_tuple, load_receipt, validate_receipt, write_receipt,
)
from video_finalize.git_result_branch import ResultBranchRepo  # type: ignore  # noqa: E402

from video_standalone.artifact import resolve_paths, validate_and_checksum  # type: ignore  # noqa: E402
from video_standalone.artifact_bundle import (  # type: ignore  # noqa: E402
    ArtifactBundleError, build_bundle_from_pipeline,
    deterministic_name, restore_bundle_into_repo, validate_bundle,
)
from video_standalone.bunny_ops import (  # type: ignore  # noqa: E402
    BunnyReconciliationError, reconcile_and_finalize,
)
from video_standalone.narration_orchestrator import (  # type: ignore  # noqa: E402
    NarrationGateFailure, run_narration_gate,
)


class RunCellError(RuntimeError):
    pass


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _run_full_build(
    *, lesson_id: str, locale: str, package_path: str, repo_root: Path,
    subprocess_run=subprocess.run,
) -> None:
    """Run the authorized build command:
        python3 remotion/scripts/build-lesson.py "$LID" \
          --locale "$LOCALE" --package-path "$LESSON_PACKAGE_PATH"
    The accepted script.json is already on disk from the narration gate,
    so TTS + captions consume the exact accepted scenes[].spoken text."""
    script = repo_root / "remotion" / "scripts" / "build-lesson.py"
    if not script.is_file():
        raise RunCellError(f"missing build script: {script}")
    if not (repo_root / package_path).is_file():
        raise RunCellError(f"missing package path: {package_path}")
    cmd = [
        "python3", str(script), lesson_id,
        "--locale", locale,
        "--package-path", str(repo_root / package_path),
    ]
    print(f"[run_cell] $ {' '.join(cmd)}", flush=True)
    proc = subprocess_run(cmd, cwd=repo_root, check=False)
    if proc.returncode != 0:
        raise RunCellError(f"build-lesson.py failed rc={proc.returncode}")


def _existing_receipt_match(
    repo_root: Path, *, batch_id: str, logical_key: str,
    source_sha: str, video_checksum: str,
) -> dict | None:
    path = repo_root / receipt_relpath(batch_id, logical_key)
    if not path.is_file():
        return None
    data = load_receipt(path)
    if identity_tuple(data) == (batch_id, logical_key, source_sha, video_checksum):
        return data
    return None


def run_cell(
    *,
    lesson_id: str, locale: str, package_path: str,
    source_sha: str, workflow_run_id: str,
    artifact_id: str, artifact_digest: str,
    bunny_library_id: str, bunny_api_key: str,
    bundle_in_dir: Path | None = None,
    bundle_out_dir: Path | None = None,
    repo_root: Path | None = None,
    # Test-only injection hooks:
    subprocess_run=subprocess.run,
    branch_repo_factory=None,
    http_fn=None,
    skip_build: bool = False,
    skip_narration_gate: bool = False,
) -> dict:
    repo_root = repo_root or _repo_root()
    logical_key = f"{lesson_id}__{locale}"
    branch = result_branch_name(BATCH_ID, logical_key)

    # 1) Durable artifact recovery (Re-run failed jobs path).
    recovered_from_bundle = False
    if bundle_in_dir is not None and (bundle_in_dir / "validation.json").is_file():
        try:
            validate_bundle(
                bundle_dir=bundle_in_dir, lesson_id=lesson_id, locale=locale,
                expected_source_sha=source_sha,
            )
            restore_bundle_into_repo(
                bundle_dir=bundle_in_dir, repo_root=repo_root,
                lesson_id=lesson_id, locale=locale,
            )
            recovered_from_bundle = True
            print(f"[run_cell] artifact recovery: bundle valid, skipping Gemini/TTS/render")
        except ArtifactBundleError as e:
            print(f"[run_cell] artifact recovery: bundle invalid ({e}); will regenerate")

    if not skip_build and not recovered_from_bundle:
        # 2) Locale narration gate (up to 2 Gemini attempts, pre-paid-call boundary).
        if not skip_narration_gate:
            run_narration_gate(
                lesson_id=lesson_id, locale=locale, package_path=package_path,
                repo_root=repo_root, subprocess_run=subprocess_run,
            )
        # 3) Full build (reuses the accepted cached script).
        _run_full_build(
            lesson_id=lesson_id, locale=locale, package_path=package_path,
            repo_root=repo_root, subprocess_run=subprocess_run,
        )

    # 4) Six-file validation + optional bundle write BEFORE Bunny.
    paths = resolve_paths(repo_root, lesson_id, locale)
    checksums = validate_and_checksum(paths)
    video_checksum = checksums["videoChecksum"]
    captions_checksum = checksums["captionsChecksum"]

    if bundle_out_dir is not None and not recovered_from_bundle:
        build_bundle_from_pipeline(
            bundle_dir=bundle_out_dir, repo_root=repo_root,
            lesson_id=lesson_id, locale=locale, source_sha=source_sha,
            pipeline_log_text=f"cell {logical_key} run={workflow_run_id}",
        )

    # 0) Idempotency: matching receipt short-circuit (no Bunny, no git).
    prior = _existing_receipt_match(
        repo_root, batch_id=BATCH_ID, logical_key=logical_key,
        source_sha=source_sha, video_checksum=video_checksum,
    )
    if prior is not None:
        print(f"[run_cell] skipped-success (receipt matches identity): {logical_key}")
        return {"status": "skipped-success", "receipt": prior, "branch": branch}

    # 5) Bunny reconciliation + upload/verify (fail closed on any ambiguity).
    mp4_bytes = paths.mp4.read_bytes()
    outcome = reconcile_and_finalize(
        library_id=bunny_library_id, api_key=bunny_api_key,
        lesson_id=lesson_id, locale=locale,
        mp4_bytes=mp4_bytes, video_checksum=video_checksum, http=http_fn,
    )

    # 6) Receipt + isolated per-cell result branch commit+push.
    receipt = build_receipt(
        batch_id=BATCH_ID, logical_key=logical_key,
        lesson_id=lesson_id, locale=locale,
        source_sha=source_sha, workflow_run_id=workflow_run_id,
        artifact_id=artifact_id, artifact_digest=artifact_digest,
        video_checksum=video_checksum, captions_checksum=captions_checksum,
        bunny_guid=outcome.guid, bunny_upload_status=outcome.upload_status,
        validation_status="finalized",
    )
    validate_receipt(receipt)
    receipt_path = repo_root / receipt_relpath(BATCH_ID, logical_key)
    write_receipt(receipt_path, receipt)

    factory = branch_repo_factory or (lambda root: ResultBranchRepo(repo_dir=root))
    repo = factory(repo_root)
    repo.ensure_orphan_branch(branch)
    repo.commit_paths([receipt_path],
                      message=f"chore(video-results): {logical_key} finalized")
    repo.push(branch)

    return {
        "status": "finalized",
        "receipt": receipt,
        "branch": branch,
        "recoveredFromBundle": recovered_from_bundle,
        "bunny": {
            "guid": outcome.guid,
            "status": outcome.upload_status,
            "title": outcome.title,
            "sameTitleCandidatesInspected": outcome.same_title_candidates_inspected,
            "preservedPriorGuids": outcome.preserved_prior_guids,
        },
    }


def _env_or_die(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RunCellError(f"missing required env: {name}")
    return val


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Run one standalone 300-plan cell")
    ap.add_argument("--lesson-id", required=True)
    ap.add_argument("--locale", required=True)
    ap.add_argument("--package-path", required=True)
    ap.add_argument("--source-sha", default=os.environ.get("GITHUB_SHA") or "")
    ap.add_argument("--workflow-run-id", default=os.environ.get("GITHUB_RUN_ID") or "")
    ap.add_argument("--artifact-id", default=os.environ.get("STANDALONE_ARTIFACT_ID") or "")
    ap.add_argument("--artifact-digest",
                    default=os.environ.get("STANDALONE_ARTIFACT_DIGEST") or "")
    ap.add_argument("--bundle-in-dir", default="",
                    help="restored-artifact dir for Re-run failed jobs recovery")
    ap.add_argument("--bundle-out-dir", default="",
                    help="write validated six-file bundle here BEFORE Bunny call")
    ap.add_argument("--out", default="")
    args = ap.parse_args(argv)

    if not args.source_sha or not args.workflow_run_id or not args.artifact_id \
            or not args.artifact_digest:
        raise RunCellError(
            "missing one of --source-sha/--workflow-run-id/--artifact-id/--artifact-digest"
        )

    bunny_library_id = _env_or_die("BUNNY_STREAM_LIBRARY_ID")
    bunny_api_key = _env_or_die("BUNNY_STREAM_API_KEY")

    result = run_cell(
        lesson_id=args.lesson_id, locale=args.locale, package_path=args.package_path,
        source_sha=args.source_sha, workflow_run_id=args.workflow_run_id,
        artifact_id=args.artifact_id, artifact_digest=args.artifact_digest,
        bunny_library_id=bunny_library_id, bunny_api_key=bunny_api_key,
        bundle_in_dir=Path(args.bundle_in_dir) if args.bundle_in_dir else None,
        bundle_out_dir=Path(args.bundle_out_dir) if args.bundle_out_dir else None,
    )
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    print(payload)
    if args.out:
        Path(args.out).write_text(payload + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RunCellError, NarrationGateFailure, BunnyReconciliationError) as e:
        print(f"::error::{type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(2)
