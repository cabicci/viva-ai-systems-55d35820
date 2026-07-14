"""Run a single standalone cell end-to-end.

Steps (real wiring, no placeholders):
  1. Run:  python3 remotion/scripts/build-lesson.py "$LID" \
             --locale "$LOCALE" --package-path "$LESSON_PACKAGE_PATH"
  2. Validate MP4 + captions VTT and compute sha256 checksums.
  3. Finalize on Bunny (create+upload OR reuse-by-originalHash) and verify
     the top-level originalHash of the resulting GUID.
  4. Build a schema-v1 finalization receipt via video_finalize.receipt.
  5. Commit + push the receipt to the isolated per-cell result branch
     via video_finalize.git_result_branch. Never pushes main.

Idempotency: caller (workflow) is responsible for restoring a previously
pushed receipt (artifact/Bunny recovery) into the working tree before
invocation. If the receipt file already exists with a matching identity
tuple, this script exits 0 as skipped-success.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

# Sibling package import (read-only reuse)
_HERE = Path(__file__).resolve().parent
_SCRIPTS_ROOT = _HERE.parent
if str(_SCRIPTS_ROOT) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_ROOT))

from video_finalize.constants import (  # type: ignore  # noqa: E402
    BATCH_ID,
    receipt_relpath,
    result_branch_name,
)
from video_finalize.receipt import (  # type: ignore  # noqa: E402
    build_receipt,
    identity_tuple,
    load_receipt,
    validate_receipt,
    write_receipt,
)
from video_finalize.git_result_branch import ResultBranchRepo  # type: ignore  # noqa: E402

from video_standalone.artifact import (  # type: ignore  # noqa: E402
    resolve_paths,
    validate_and_checksum,
)
from video_standalone.bunny_ops import finalize_bunny_for_cell  # type: ignore  # noqa: E402


class RunCellError(RuntimeError):
    pass


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _run_build_lesson(
    *, lesson_id: str, locale: str, package_path: str, repo_root: Path,
    subprocess_run=subprocess.run,
) -> None:
    script = repo_root / "remotion" / "scripts" / "build-lesson.py"
    if not script.is_file():
        raise RunCellError(f"missing build script: {script}")
    if not (repo_root / package_path).is_file():
        raise RunCellError(f"missing package path: {package_path}")
    cmd = [
        "python3",
        str(script),
        lesson_id,
        "--locale",
        locale,
        "--package-path",
        str(repo_root / package_path),
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
    lesson_id: str,
    locale: str,
    package_path: str,
    source_sha: str,
    workflow_run_id: str,
    artifact_id: str,
    artifact_digest: str,
    bunny_library_id: str,
    bunny_api_key: str,
    repo_root: Path | None = None,
    # Injection hooks for tests (never used in production path):
    subprocess_run=subprocess.run,
    branch_repo_factory=None,
    http_fn=None,
    skip_build: bool = False,
) -> dict:
    repo_root = repo_root or _repo_root()
    logical_key = f"{lesson_id}__{locale}"
    branch = result_branch_name(BATCH_ID, logical_key)

    # 1) Build (skippable by tests where MP4 is pre-staged)
    if not skip_build:
        _run_build_lesson(
            lesson_id=lesson_id, locale=locale, package_path=package_path,
            repo_root=repo_root, subprocess_run=subprocess_run,
        )

    # 2) Validate + checksum
    paths = resolve_paths(repo_root, lesson_id, locale)
    checksums = validate_and_checksum(paths)
    video_checksum = checksums["videoChecksum"]
    captions_checksum = checksums["captionsChecksum"]

    # Idempotency short-circuit
    prior = _existing_receipt_match(
        repo_root, batch_id=BATCH_ID, logical_key=logical_key,
        source_sha=source_sha, video_checksum=video_checksum,
    )
    if prior is not None:
        print(f"[run_cell] skipped-success (receipt matches identity): {logical_key}")
        return {"status": "skipped-success", "receipt": prior, "branch": branch}

    # 3) Bunny finalize (create+upload OR reuse by top-level originalHash)
    mp4_bytes = paths.mp4.read_bytes()
    bunny = finalize_bunny_for_cell(
        library_id=bunny_library_id,
        api_key=bunny_api_key,
        lesson_id=lesson_id,
        locale=locale,
        mp4_bytes=mp4_bytes,
        video_checksum=video_checksum,
        http=http_fn,
    )

    # 4) Build + write receipt
    receipt = build_receipt(
        batch_id=BATCH_ID,
        logical_key=logical_key,
        lesson_id=lesson_id,
        locale=locale,
        source_sha=source_sha,
        workflow_run_id=workflow_run_id,
        artifact_id=artifact_id,
        artifact_digest=artifact_digest,
        video_checksum=video_checksum,
        captions_checksum=captions_checksum,
        bunny_guid=bunny.guid,
        bunny_upload_status=bunny.upload_status,
        validation_status="finalized",
    )
    validate_receipt(receipt)
    receipt_path = repo_root / receipt_relpath(BATCH_ID, logical_key)
    write_receipt(receipt_path, receipt)

    # 5) Commit + push isolated per-cell result branch
    factory = branch_repo_factory or (lambda root: ResultBranchRepo(repo_dir=root))
    repo = factory(repo_root)
    repo.ensure_orphan_branch(branch)
    repo.commit_paths(
        [receipt_path],
        message=f"chore(video-results): {logical_key} finalized",
    )
    repo.push(branch)

    return {
        "status": "finalized",
        "receipt": receipt,
        "branch": branch,
        "bunny": {"guid": bunny.guid, "status": bunny.upload_status, "title": bunny.title},
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
    ap.add_argument("--package-path", required=True,
                    help="Repo-relative path to the localized package JSON")
    ap.add_argument("--source-sha", default=os.environ.get("GITHUB_SHA") or "")
    ap.add_argument("--workflow-run-id",
                    default=os.environ.get("GITHUB_RUN_ID") or "")
    ap.add_argument("--artifact-id", default=os.environ.get("STANDALONE_ARTIFACT_ID") or "")
    ap.add_argument("--artifact-digest",
                    default=os.environ.get("STANDALONE_ARTIFACT_DIGEST") or "")
    ap.add_argument("--out", default="", help="write result JSON to this path")
    args = ap.parse_args(argv)

    if not args.source_sha or not args.workflow_run_id or not args.artifact_id \
            or not args.artifact_digest:
        raise RunCellError(
            "missing one of --source-sha/--workflow-run-id/--artifact-id/--artifact-digest"
        )

    bunny_library_id = _env_or_die("BUNNY_STREAM_LIBRARY_ID")
    bunny_api_key = _env_or_die("BUNNY_STREAM_API_KEY")

    result = run_cell(
        lesson_id=args.lesson_id,
        locale=args.locale,
        package_path=args.package_path,
        source_sha=args.source_sha,
        workflow_run_id=args.workflow_run_id,
        artifact_id=args.artifact_id,
        artifact_digest=args.artifact_digest,
        bunny_library_id=bunny_library_id,
        bunny_api_key=bunny_api_key,
    )
    payload = json.dumps(result, ensure_ascii=False, indent=2)
    print(payload)
    if args.out:
        Path(args.out).write_text(payload + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RunCellError as e:
        print(f"::error::{e}", file=sys.stderr)
        sys.exit(2)
