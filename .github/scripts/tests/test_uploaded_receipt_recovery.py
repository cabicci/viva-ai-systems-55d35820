"""Focused tests for recover-uploaded-receipts (receipt-only, no upload)."""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import tempfile
import unittest
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(HERE))

from video_finalize.artifact_contract import (  # noqa: E402
    REQUIRED_FILES,
    compute_bundle_digest,
)
from video_finalize.bunny_client import BunnyClient  # noqa: E402
from video_finalize.constants import (  # noqa: E402
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    BATCH_ID,
    FULL_300_SOURCE_SHA_PIN,
    SOURCE_SHA_PIN,
    receipt_relpath,
    result_branch_name,
)
from video_finalize.git_result_branch import ResultBranchRepo  # noqa: E402
from video_finalize.receipt import build_receipt  # noqa: E402
from video_finalize.receipt_recovery import (  # noqa: E402
    RecoveryContext,
    RecoveryOutcome,
    recover_uploaded_receipt,
)
from video_finalize.recovery_plan import (  # noqa: E402
    EXPECTED_ARTIFACTS,
    EXPECTED_FINALIZED,
    EXPECTED_OVERLAP,
    EXPECTED_RECOVERY,
    EXPECTED_REGENERATION,
    RECOVERY_SOURCE_SHA,
    RECOVERY_WORKFLOW_RUN_ID,
    RecoveryPlanError,
    build_recovery_plan,
    load_authoritative_logical_keys,
    parse_artifact_name,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = HERE.parents[0] / "workflows" / "video-production-batch.yml"


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _guid(i: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"recover-{i}"))


def _make_bundle(
    root: Path,
    *,
    logical_key: str,
    lesson_id: str,
    locale: str,
    source_sha: str = RECOVERY_SOURCE_SHA,
    video: bytes | None = None,
) -> dict:
    root.mkdir(parents=True, exist_ok=True)
    video = video or (b"FAKE_MP4_" + logical_key.encode() + b"X" * 200)
    captions = f"WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n{logical_key}\n".encode()
    video_sha = _sha(video)
    captions_sha = _sha(captions)
    (root / "video.mp4").write_bytes(video)
    (root / "audio.mp3").write_bytes(b"FAKE_MP3_" + b"Y" * 100)
    (root / "captions.vtt").write_bytes(captions)
    (root / "pipeline.log").write_bytes(b"ok\n")
    status = {
        "runMode": "full-300",
        "lessonId": lesson_id,
        "locale": locale,
        "logicalKey": logical_key,
        "compositeKey": logical_key,
        "sourceSha": source_sha,
        "videoChecksum": video_sha,
        "captionsChecksum": captions_sha,
        "outputStatus": "validated",
        "batchId": BATCH_ID,
    }
    validation = {
        "ok": True,
        "hasAudio": True,
        "hasVideo": True,
        "hasCaptions": True,
        "durationSeconds": 12.0,
    }
    (root / "status.json").write_text(json.dumps(status), encoding="utf-8")
    (root / "validation.json").write_text(json.dumps(validation), encoding="utf-8")
    return {
        "video_sha": video_sha,
        "captions_sha": captions_sha,
        "digest": compute_bundle_digest(root),
        "video": video,
    }


class MockBunnyStore:
    def __init__(self) -> None:
        self.videos: dict[str, dict] = {}
        self.creates = 0
        self.uploads = 0

    def seed(self, *, title: str, guid: str, original_hash: str | None) -> None:
        self.videos[guid] = {
            "guid": guid,
            "title": title,
            "originalHash": original_hash,
        }

    def handler(self, method, url, body, headers):
        if method == "GET" and "/videos?" in url:
            items = list(self.videos.values())
            return 200, json.dumps(
                {
                    "items": items,
                    "currentPage": 1,
                    "itemsPerPage": 100,
                    "totalItems": len(items),
                    "totalPages": 1,
                }
            ).encode()
        if method == "GET":
            guid = url.rstrip("/").split("/")[-1]
            if guid not in self.videos:
                return 404, b"{}"
            return 200, json.dumps(self.videos[guid]).encode()
        if method == "POST":
            self.creates += 1
            raise AssertionError("Bunny create must be unreachable in recovery")
        if method == "PUT":
            self.uploads += 1
            raise AssertionError("Bunny upload must be unreachable in recovery")
        raise AssertionError(f"unexpected Bunny call {method} {url}")


def _init_git(path: Path) -> ResultBranchRepo:
    path.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "init"], cwd=path, check=True, capture_output=True)
    subprocess.run(["git", "config", "user.email", "t@example.com"], cwd=path, check=True)
    subprocess.run(["git", "config", "user.name", "t"], cwd=path, check=True)
    remote = path.parent / (path.name + "-remote.git")
    subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
    subprocess.run(["git", "remote", "add", "origin", str(remote)], cwd=path, check=True)
    return ResultBranchRepo(path)


def _ctx(
    tmp: Path,
    *,
    logical_key: str,
    bundle: Path | None,
    store: MockBunnyStore,
    artifact_id: str = "1001",
) -> RecoveryContext:
    lesson_id, locale = logical_key.rsplit("__", 1)
    git = _init_git(tmp / "git")
    bunny = BunnyClient("670679", "k", http=store.handler)
    name = f"full-300-{RECOVERY_SOURCE_SHA}-{locale}-{lesson_id}"
    return RecoveryContext(
        batch_id=BATCH_ID,
        logical_key=logical_key,
        lesson_id=lesson_id,
        locale=locale,
        source_sha=RECOVERY_SOURCE_SHA,
        workflow_run_id=RECOVERY_WORKFLOW_RUN_ID,
        artifact_id=artifact_id,
        artifact_name=name,
        expected_artifact_digest=None,
        production_root=bundle,
        bunny=bunny,
        git=git,
        artifact_already_downloaded=bundle is not None,
    )


def _contractual_sets() -> tuple[list[str], list[dict], set[str]]:
    keys = load_authoritative_logical_keys(REPO_ROOT)
    carry = ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
    non_carry = [k for k in keys if k != carry]
    artifact_keys = non_carry[:268]
    regen = non_carry[268:]
    assert len(artifact_keys) == 268
    assert len(regen) == 31
    assert carry not in artifact_keys
    finalized = set(artifact_keys[:189]) | {carry}
    assert len(finalized) == 190
    artifacts = []
    for i, key in enumerate(sorted(artifact_keys)):
        lesson_id, locale = key.rsplit("__", 1)
        artifacts.append(
            {
                "id": str(10000 + i),
                "name": f"full-300-{RECOVERY_SOURCE_SHA}-{locale}-{lesson_id}",
            }
        )
    return keys, artifacts, finalized


class AuthoritativePlanTests(unittest.TestCase):
    def test_authoritative_300_locale_counts(self):
        keys = load_authoritative_logical_keys(REPO_ROOT)
        self.assertEqual(len(keys), 300)
        self.assertEqual(len(set(keys)), 300)
        self.assertEqual(sum(k.endswith("__en") for k in keys), 100)
        self.assertEqual(sum(k.endswith("__ar-MSA") for k in keys), 100)
        self.assertEqual(sum(k.endswith("__ar-Gulf") for k in keys), 100)
        self.assertEqual(sum("__ar-EG" in k for k in keys), 0)

    def test_contractual_79_recovery_plan(self):
        keys, artifacts, finalized = _contractual_sets()
        plan = build_recovery_plan(
            authoritative_keys=keys,
            artifacts=artifacts,
            finalized_keys=finalized,
        )
        self.assertEqual(len(plan.artifact_keys), EXPECTED_ARTIFACTS)
        self.assertEqual(len(plan.finalized_keys), EXPECTED_FINALIZED)
        self.assertEqual(len(plan.overlap_keys), EXPECTED_OVERLAP)
        self.assertEqual(plan.carry_forward_outside_artifact, [ACCEPTED_CARRY_FORWARD_LOGICAL_KEY])
        self.assertEqual(len(plan.recovery_cells), EXPECTED_RECOVERY)
        self.assertEqual(len(plan.regeneration_keys), EXPECTED_REGENERATION)
        recovery_keys = {c["logicalKey"] for c in plan.recovery_cells}
        self.assertTrue(recovery_keys.isdisjoint(finalized))
        self.assertTrue(recovery_keys.isdisjoint(set(plan.regeneration_keys)))
        self.assertEqual(len(recovery_keys), 79)

    def test_count_mismatch_fails_closed(self):
        keys, artifacts, finalized = _contractual_sets()
        with self.assertRaises(RecoveryPlanError):
            build_recovery_plan(
                authoritative_keys=keys,
                artifacts=artifacts[:-1],
                finalized_keys=finalized,
            )


class ArtifactParserTests(unittest.TestCase):
    def test_parses_en_ar_msa_ar_gulf(self):
        for locale, lesson in (
            ("en", "analyst-m3-l2-ai-summarization"),
            ("ar-MSA", "intro-m1-l4-ai-can-cannot"),
            ("ar-Gulf", "builder-m1-l1-what-is-llm"),
        ):
            name = f"full-300-{RECOVERY_SOURCE_SHA}-{locale}-{lesson}"
            loc, lid, key = parse_artifact_name(name)
            self.assertEqual(loc, locale)
            self.assertEqual(lid, lesson)
            self.assertEqual(key, f"{lesson}__{locale}")

    def test_rejects_wrong_sha_ar_eg_malformed(self):
        with self.assertRaises(RecoveryPlanError):
            parse_artifact_name(f"full-300-{SOURCE_SHA_PIN}-en-x")
        with self.assertRaises(RecoveryPlanError):
            parse_artifact_name(f"full-300-{RECOVERY_SOURCE_SHA}-ar-EG-x")
        with self.assertRaises(RecoveryPlanError):
            parse_artifact_name("not-an-artifact")

    def test_rejects_duplicate_id_and_key(self):
        keys = load_authoritative_logical_keys(REPO_ROOT)[:3]
        arts = []
        for i, key in enumerate(keys):
            lid, loc = key.rsplit("__", 1)
            arts.append({"id": "1", "name": f"full-300-{RECOVERY_SOURCE_SHA}-{loc}-{lid}"})
        with self.assertRaises(RecoveryPlanError):
            build_recovery_plan(
                authoritative_keys=load_authoritative_logical_keys(REPO_ROOT),
                artifacts=arts,
                finalized_keys=set(),
            )


class ExistingReceiptSkipTests(unittest.TestCase):
    def test_valid_receipt_skips_before_external_io(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            store = MockBunnyStore()
            ctx = _ctx(root, logical_key=key, bundle=None, store=store)
            branch = result_branch_name(BATCH_ID, key)
            ctx.git.ensure_orphan_branch(branch)
            receipt = build_receipt(
                batch_id=BATCH_ID,
                logical_key=key,
                lesson_id=lid,
                locale=loc,
                source_sha=RECOVERY_SOURCE_SHA,
                workflow_run_id=RECOVERY_WORKFLOW_RUN_ID,
                artifact_id="1",
                artifact_digest="sha256:" + "a" * 64,
                video_checksum="b" * 64,
                captions_checksum="c" * 64,
                bunny_guid=_guid(1),
                bunny_upload_status="uploaded",
            )
            path = ctx.git.repo_dir / receipt_relpath(BATCH_ID, key)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(receipt), encoding="utf-8")
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.SKIPPED_SUCCESS)
            self.assertEqual(result.log.artifact_downloads, 0)
            self.assertEqual(result.log.bunny_searches, 0)
            self.assertEqual(result.log.bunny_gets, 0)
            self.assertEqual(result.log.commits, 0)
            self.assertEqual(result.log.pushes, 0)
            self.assertEqual(store.creates, 0)
            self.assertEqual(store.uploads, 0)

    def test_malformed_receipt_fails_before_download(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            store = MockBunnyStore()
            ctx = _ctx(root, logical_key=key, bundle=None, store=store)
            branch = result_branch_name(BATCH_ID, key)
            ctx.git.ensure_orphan_branch(branch)
            path = ctx.git.repo_dir / receipt_relpath(BATCH_ID, key)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("{bad", encoding="utf-8")
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.AMBIGUOUS)
            self.assertEqual(result.log.bunny_searches, 0)


class SuccessfulRecoveryTests(unittest.TestCase):
    def test_exact_match_recovers_one_receipt(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            meta = _make_bundle(bundle, logical_key=key, lesson_id=lid, locale=loc)
            store = MockBunnyStore()
            store.seed(
                title=f"{lid} [{loc}]",
                guid=_guid(9),
                original_hash=meta["video_sha"],
            )
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.RECOVERED)
            self.assertEqual(result.log.bunny_creates, 0)
            self.assertEqual(result.log.bunny_uploads, 0)
            self.assertEqual(result.log.bunny_searches, 1)
            self.assertEqual(result.log.bunny_gets, 1)
            self.assertEqual(result.log.commits, 1)
            self.assertEqual(result.log.pushes, 1)
            self.assertEqual(result.receipt["workflowRunId"], RECOVERY_WORKFLOW_RUN_ID)
            self.assertEqual(result.receipt["sourceSha"], RECOVERY_SOURCE_SHA)
            self.assertEqual(store.creates, 0)
            self.assertEqual(store.uploads, 0)


class BunnyFailureTests(unittest.TestCase):
    def _run(self, *, hash_value, seed_extra=None, seed_hash="__USE_HASH_VALUE__"):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            meta = _make_bundle(bundle, logical_key=key, lesson_id=lid, locale=loc)
            store = MockBunnyStore()
            if seed_hash == "__USE_HASH_VALUE__":
                oh = hash_value
            else:
                oh = seed_hash
            store.seed(title=f"{lid} [{loc}]", guid=_guid(1), original_hash=oh)
            if seed_extra:
                store.seed(title=f"{lid} [{loc}]", guid=_guid(2), original_hash=seed_extra)
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertIn(result.outcome, (RecoveryOutcome.AMBIGUOUS, RecoveryOutcome.FAILED))
            self.assertIsNone(result.receipt)
            self.assertEqual(result.log.commits, 0)
            self.assertEqual(result.log.pushes, 0)
            self.assertEqual(result.log.bunny_creates, 0)
            self.assertEqual(result.log.bunny_uploads, 0)
            self.assertEqual(store.creates, 0)
            self.assertEqual(store.uploads, 0)
            return result

    def test_zero_matches(self):
        self._run(hash_value="d" * 64, seed_hash="e" * 64)

    def test_multiple_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            meta = _make_bundle(bundle, logical_key=key, lesson_id=lid, locale=loc)
            store = MockBunnyStore()
            store.seed(title=f"{lid} [{loc}]", guid=_guid(1), original_hash=meta["video_sha"])
            store.seed(title=f"{lid} [{loc}]", guid=_guid(2), original_hash=meta["video_sha"])
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.AMBIGUOUS)
            self.assertEqual(result.log.commits, 0)

    def test_missing_null_empty_nonstring_malformed(self):
        cases = [
            ("missing", None),  # will set missing via pop
        ]
        # missing
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            meta = _make_bundle(bundle, logical_key=key, lesson_id=lid, locale=loc)
            store = MockBunnyStore()
            store.videos[_guid(1)] = {"guid": _guid(1), "title": f"{lid} [{loc}]"}
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.AMBIGUOUS)
            self.assertEqual(result.log.commits, 0)
        for bad in ("", 12345, "not-a-hash"):
            with self.subTest(bad=bad):
                self._run(hash_value=meta["video_sha"], seed_hash=bad)
        with self.subTest(bad="null"):
            self._run(hash_value=meta["video_sha"], seed_hash=None)


class BundleValidationTests(unittest.TestCase):
    def test_missing_file_fails_before_bunny(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            _make_bundle(bundle, logical_key=key, lesson_id=lid, locale=loc)
            (bundle / "video.mp4").unlink()
            store = MockBunnyStore()
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.FAILED)
            self.assertEqual(result.log.bunny_searches, 0)
            self.assertIn("before Bunny", result.message)

    def test_wrong_source_sha_fails_before_bunny(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "builder-m1-l1-what-is-llm__en"
            lid, loc = key.rsplit("__", 1)
            bundle = root / "prod"
            _make_bundle(
                bundle, logical_key=key, lesson_id=lid, locale=loc, source_sha=SOURCE_SHA_PIN
            )
            store = MockBunnyStore()
            ctx = _ctx(root, logical_key=key, bundle=bundle, store=store)
            result = recover_uploaded_receipt(ctx)
            self.assertEqual(result.outcome, RecoveryOutcome.FAILED)
            self.assertEqual(result.log.bunny_searches, 0)

    def test_existing_six_file_contract_uses_pipeline_log(self):
        self.assertEqual(
            REQUIRED_FILES,
            (
                "video.mp4",
                "audio.mp3",
                "captions.vtt",
                "status.json",
                "validation.json",
                "pipeline.log",
            ),
        )


class ReachabilityAndBranchTests(unittest.TestCase):
    def test_recovery_source_has_no_forbidden_markers(self):
        recovery_py = (HERE / "video_finalize" / "receipt_recovery.py").read_text(encoding="utf-8")
        cli_py = (HERE / "recover_uploaded_receipt_cli.py").read_text(encoding="utf-8")
        self.assertNotIn("create_video(", recovery_py)
        self.assertNotIn("upload_mp4(", recovery_py)
        self.assertNotIn("wait_for_post_upload_original_hash(", recovery_py)
        self.assertNotIn("build-lesson.py", recovery_py)
        self.assertNotIn("build-lesson.py", cli_py)
        self.assertNotIn("GEMINI_API_KEY", recovery_py)
        self.assertNotIn("GEMINI_API_KEY", cli_py)
        self.assertNotIn("promote_finalized_mappings", recovery_py)
        self.assertNotIn("promote_finalized_mappings", cli_py)
        self.assertNotIn("bunny-videos.ts", recovery_py)

    def test_flat_branches_distinct_for_79(self):
        keys, artifacts, finalized = _contractual_sets()
        plan = build_recovery_plan(
            authoritative_keys=keys, artifacts=artifacts, finalized_keys=finalized
        )
        branches = [
            result_branch_name(BATCH_ID, c["logicalKey"]) for c in plan.recovery_cells
        ]
        self.assertEqual(len(branches), 79)
        self.assertEqual(len(set(branches)), 79)
        self.assertTrue(all(b.startswith("video-results--") for b in branches))
        self.assertNotIn("main", branches)


class WorkflowStaticRecoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW.read_text(encoding="utf-8")

    def test_default_and_modes_preserved(self):
        self.assertIn("default: preflight-one", self.text)
        for mode in ("preflight-one", "generate-one", "finalize-one", "full-300"):
            self.assertIn(f"- {mode}", self.text)
        self.assertIn("- recover-uploaded-receipts", self.text)
        self.assertIn("- generate-unresolved", self.text)
        self.assertIn(
            "FULL_300_SOURCE_SHA: 69ba815e256d6f46382c9f0fa901bb3fea88c85b", self.text
        )
        on_block = self.text.split("on:")[1].split("jobs:")[0]
        self.assertIn("workflow_dispatch:", on_block)
        self.assertNotIn("schedule:", on_block)
        self.assertNotIn("pull_request:", on_block)
        self.assertNotRegex(on_block, r"(?m)^\s*push:\s*$")

    def test_recovery_job_isolation(self):
        self.assertIn("recover_cells:", self.text)
        self.assertIn("max-parallel: 4", self.text)
        self.assertIn("plan_uploaded_receipt_recovery_cli.py", self.text)
        self.assertIn("recover_uploaded_receipt_cli.py", self.text)
        self.assertIn("29407852029", self.text)
        recover = self.text.split("  recover_cells:")[1].split("  preflight_one:")[0]
        self.assertNotIn("build-lesson.py", recover)
        self.assertNotIn("GEMINI_API_KEY", recover)
        self.assertNotIn("promote_finalized_mappings", recover)

    def test_full_300_matrix_unchanged(self):
        self.assertIn("matrix_a = filtered[:150]", self.text)
        self.assertIn("matrix_b = filtered[150:]", self.text)
        self.assertIn("fail-fast: false", self.text)


if __name__ == "__main__":
    unittest.main()
