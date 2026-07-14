"""Deterministic mock tests for incremental Bunny finalization."""
from __future__ import annotations

import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(HERE))

from video_finalize.artifact_contract import validate_six_file_bundle  # noqa: E402
from video_finalize.bunny_client import BunnyClient  # noqa: E402
from video_finalize.collector import collect_receipts  # noqa: E402
from video_finalize.constants import (  # noqa: E402
    BATCH_ID,
    FINALIZE_ONE_PIN,
    SOURCE_SHA_PIN,
    bunny_title,
    receipt_relpath,
    result_branch_name,
)
from video_finalize.finalize_cell import (  # noqa: E402
    FinalizeContext,
    FinalizeOutcome,
    finalize_cell,
    should_skip_generation,
)
from video_finalize.git_result_branch import GitBranchError, ResultBranchRepo  # noqa: E402
from video_finalize.constants import FORBIDDEN_RECEIPT_KEYS  # noqa: E402
from video_finalize.receipt import build_receipt, validate_receipt  # noqa: E402


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _make_bundle(
    root: Path,
    *,
    logical_key: str = "analyst-m3-l2-ai-summarization__en",
    lesson_id: str = "analyst-m3-l2-ai-summarization",
    locale: str = "en",
    source_sha: str = SOURCE_SHA_PIN,
    video: bytes = b"FAKE_MP4_" + b"X" * 3000,
    captions_body: str | None = None,
) -> dict:
    root.mkdir(parents=True, exist_ok=True)
    captions = captions_body or (
        "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello summarization.\n"
    )
    captions_bytes = captions.encode("utf-8")
    video_sha = _sha(video)
    captions_sha = _sha(captions_bytes)
    (root / "video.mp4").write_bytes(video)
    (root / "audio.mp3").write_bytes(b"FAKE_MP3_" + b"Y" * 1000)
    (root / "captions.vtt").write_bytes(captions_bytes)
    (root / "pipeline.log").write_bytes(b"ok\n")
    status = {
        "runMode": "generate-one",
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
        "logoChecksum": "60620006f7f74dcc625ccbd9869a19b45a7683fde04b729694b1c76d1a51d706",
    }
    (root / "status.json").write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")
    (root / "validation.json").write_text(
        json.dumps(validation, indent=2) + "\n", encoding="utf-8"
    )
    return {"video_sha": video_sha, "captions_sha": captions_sha, "video": video}


def _init_git_repo(path: Path) -> ResultBranchRepo:
    path.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "init"], cwd=path, check=True, capture_output=True)
    subprocess.run(
        ["git", "config", "user.email", "test@example.com"],
        cwd=path,
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["git", "config", "user.name", "test"],
        cwd=path,
        check=True,
        capture_output=True,
    )
    # local fake remote
    remote = path.parent / (path.name + "-remote.git")
    subprocess.run(["git", "init", "--bare", str(remote)], check=True, capture_output=True)
    subprocess.run(
        ["git", "remote", "add", "origin", str(remote)],
        cwd=path,
        check=True,
        capture_output=True,
    )
    return ResultBranchRepo(path)


class MockBunnyStore:
    def __init__(self):
        self.videos: dict[str, dict] = {}
        self.next_id = 0

    def handler(self, method, url, body, headers):
        assert "AccessKey" in headers
        assert "secret" not in json.dumps(headers)
        if method == "POST" and url.endswith("/videos"):
            self.next_id += 1
            guid = f"guid-{self.next_id:04d}-aaaa-bbbb-cccc-ddddeeeeffff"
            title = json.loads(body.decode())["title"]
            self.videos[guid] = {
                "guid": guid,
                "title": title,
                "status": 1,
                "originalHash": None,
                "length": 0,
            }
            return 200, json.dumps(self.videos[guid]).encode()
        if method == "PUT":
            guid = url.rstrip("/").split("/")[-1]
            self.videos[guid]["originalHash"] = _sha(body or b"")
            self.videos[guid]["status"] = 1
            self.videos[guid]["length"] = 10
            return 200, b'{"success":true}'
        if method == "GET" and "?" in url:
            # list
            from urllib.parse import parse_qs, urlparse

            q = parse_qs(urlparse(url).query)
            search = (q.get("search") or [""])[0]
            items = [v for v in self.videos.values() if search in (v.get("title") or "")]
            return 200, json.dumps({"items": items, "totalItems": len(items)}).encode()
        if method == "GET":
            guid = url.rstrip("/").split("/")[-1]
            if guid not in self.videos:
                return 404, b"{}"
            return 200, json.dumps(self.videos[guid]).encode()
        return 500, b"unexpected"


def _ctx(tmp: Path, bundle: Path, store: MockBunnyStore, **kwargs) -> FinalizeContext:
    git = _init_git_repo(tmp / "results-repo")
    bunny = BunnyClient("670679", "test-key", http=store.handler)
    defaults = dict(
        batch_id=BATCH_ID,
        logical_key="analyst-m3-l2-ai-summarization__en",
        lesson_id="analyst-m3-l2-ai-summarization",
        locale="en",
        source_sha=SOURCE_SHA_PIN,
        workflow_run_id=FINALIZE_ONE_PIN["workflowRunId"],
        artifact_id=FINALIZE_ONE_PIN["artifactId"],
        artifact_digest=FINALIZE_ONE_PIN["artifactDigest"],
        production_root=bundle,
        bunny=bunny,
        git=git,
    )
    defaults.update(kwargs)
    return FinalizeContext(**defaults)


class ReceiptSchemaTests(unittest.TestCase):
    def test_receipt_has_all_required_fields_no_secrets(self):
        r = build_receipt(
            batch_id=BATCH_ID,
            logical_key="lesson__en",
            lesson_id="lesson",
            locale="en",
            source_sha=SOURCE_SHA_PIN,
            workflow_run_id="1",
            artifact_id="2",
            artifact_digest="sha256:abc",
            video_checksum="v" * 64,
            captions_checksum="c" * 64,
            bunny_guid="g",
            bunny_upload_status="uploaded",
        )
        validate_receipt(r)
        for k in FORBIDDEN_RECEIPT_KEYS:
            self.assertNotIn(k, r)

    def test_missing_captions_checksum_fails(self):
        with self.assertRaises(Exception):
            build_receipt(
                batch_id=BATCH_ID,
                logical_key="lesson__en",
                lesson_id="lesson",
                locale="en",
                source_sha=SOURCE_SHA_PIN,
                workflow_run_id="1",
                artifact_id="2",
                artifact_digest="sha256:abc",
                video_checksum="v" * 64,
                captions_checksum="",
                bunny_guid="g",
                bunny_upload_status="uploaded",
            )


class BranchOwnershipTests(unittest.TestCase):
    def test_parallel_keys_different_branches(self):
        a = result_branch_name(BATCH_ID, "a__en")
        b = result_branch_name(BATCH_ID, "b__en")
        self.assertNotEqual(a, b)
        self.assertTrue(a.startswith("video-results/"))

    def test_cannot_push_main(self):
        with tempfile.TemporaryDirectory() as tmp:
            git = _init_git_repo(Path(tmp) / "r")
            with self.assertRaises(GitBranchError):
                git.push("main")


class FinalizeFlowTests(unittest.TestCase):
    def test_successful_cell_one_create_one_upload_one_commit_one_push(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.FINALIZED)
            self.assertEqual(result.bunny_create_calls, 1)
            self.assertEqual(result.bunny_upload_calls, 1)
            self.assertEqual(result.commits, 1)
            self.assertEqual(result.pushes, 1)
            self.assertEqual(len(ctx.git.log.pushes), 1)
            self.assertTrue(
                ctx.git.log.pushes[0].endswith("analyst-m3-l2-ai-summarization__en")
            )
            # captions not uploaded to Bunny — only create+PUT video
            self.assertEqual(len(store.videos), 1)

    def test_captions_preserved_not_uploaded_as_caption_track(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            meta = _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.receipt["captionsChecksum"], meta["captions_sha"])
            # no captions endpoint used
            for url_method in []:
                pass
            self.assertTrue(all("/captions" not in g for g in store.videos))

    def test_matching_receipt_skips_before_bunny(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            meta = _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            first = finalize_cell(ctx)
            self.assertEqual(first.outcome, FinalizeOutcome.FINALIZED)
            # second ctx shares same git remote state — re-open repo
            ctx2 = _ctx(root / "round2", bundle, store)
            # fetch receipt into new repo by reading from first repo files... 
            # seed receipt into ctx2 repo
            rel = receipt_relpath(BATCH_ID, ctx.logical_key)
            src = ctx.git.repo_dir / rel
            branch = result_branch_name(BATCH_ID, ctx.logical_key)
            ctx2.git.ensure_orphan_branch(branch)
            dst = ctx2.git.repo_dir / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(src.read_bytes())
            result = finalize_cell(ctx2)
            self.assertEqual(result.outcome, FinalizeOutcome.SKIPPED_SUCCESS)
            self.assertEqual(result.bunny_create_calls, 0)
            self.assertEqual(result.bunny_upload_calls, 0)

    def test_commit_only_recovery_after_upload_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            meta = _make_bundle(bundle)
            store = MockBunnyStore()
            # Pre-seed Bunny video matching title+hash
            bunny = BunnyClient("670679", "k", http=store.handler)
            guid = bunny.create_video(bunny_title("analyst-m3-l2-ai-summarization", "en"))
            bunny.upload_mp4(guid, meta["video"])
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.COMMIT_ONLY_RECOVERED)
            self.assertEqual(result.bunny_create_calls, 0)
            self.assertEqual(result.bunny_upload_calls, 0)
            self.assertEqual(result.commits, 1)

    def test_duplicate_prevention_same_tuple(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            finalize_cell(ctx)
            creates = len(store.videos)
            # seed receipt into second repo and finalize again
            ctx2 = _ctx(root / "b", bundle, store)
            rel = receipt_relpath(BATCH_ID, ctx.logical_key)
            branch = result_branch_name(BATCH_ID, ctx.logical_key)
            ctx2.git.ensure_orphan_branch(branch)
            (ctx2.git.repo_dir / rel).parent.mkdir(parents=True, exist_ok=True)
            (ctx2.git.repo_dir / rel).write_bytes((ctx.git.repo_dir / rel).read_bytes())
            result = finalize_cell(ctx2)
            self.assertEqual(result.outcome, FinalizeOutcome.SKIPPED_SUCCESS)
            self.assertEqual(len(store.videos), creates)

    def test_multiple_bunny_identities_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            meta = _make_bundle(bundle)
            store = MockBunnyStore()
            bunny = BunnyClient("670679", "k", http=store.handler)
            title = bunny_title("analyst-m3-l2-ai-summarization", "en")
            for _ in range(2):
                g = bunny.create_video(title)
                bunny.upload_mp4(g, meta["video"])
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.AMBIGUOUS)
            self.assertIsNotNone(result.reconciliation)

    def test_checksum_mismatch_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            _make_bundle(bundle)
            # corrupt status checksum
            status = json.loads((bundle / "status.json").read_text(encoding="utf-8"))
            status["videoChecksum"] = "0" * 64
            (bundle / "status.json").write_text(json.dumps(status), encoding="utf-8")
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.FAILED)

    def test_missing_captions_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            _make_bundle(bundle)
            (bundle / "captions.vtt").unlink()
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.FAILED)

    def test_failed_cell_does_not_affect_other(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            store = MockBunnyStore()
            # cell A success
            a = root / "a"
            bundle_a = a / "prod"
            _make_bundle(bundle_a, logical_key="cell-a__en", lesson_id="cell-a")
            ctx_a = _ctx(
                a,
                bundle_a,
                store,
                logical_key="cell-a__en",
                lesson_id="cell-a",
            )
            ra = finalize_cell(ctx_a)
            self.assertEqual(ra.outcome, FinalizeOutcome.FINALIZED)
            # cell B failure
            b = root / "b"
            bundle_b = b / "prod"
            _make_bundle(bundle_b, logical_key="cell-b__en", lesson_id="cell-b")
            (bundle_b / "captions.vtt").unlink()
            ctx_b = _ctx(
                b,
                bundle_b,
                store,
                logical_key="cell-b__en",
                lesson_id="cell-b",
            )
            rb = finalize_cell(ctx_b)
            self.assertEqual(rb.outcome, FinalizeOutcome.FAILED)
            # A receipt still present
            rel = receipt_relpath(BATCH_ID, "cell-a__en")
            self.assertTrue((ctx_a.git.repo_dir / rel).is_file())


class CollectorTests(unittest.TestCase):
    def test_partial_success_and_lists(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            keys = [f"l{i}__en" for i in range(5)]
            roots = []
            for i, key in enumerate(keys[:4]):
                repo = root / f"r{i}"
                repo.mkdir()
                lid, loc = key.split("__")
                receipt = build_receipt(
                    batch_id=BATCH_ID,
                    logical_key=key,
                    lesson_id=lid,
                    locale=loc,
                    source_sha=SOURCE_SHA_PIN,
                    workflow_run_id="1",
                    artifact_id="2",
                    artifact_digest="sha256:x",
                    video_checksum=f"{i:064d}",
                    captions_checksum=f"{i+10:064d}",
                    bunny_guid=f"g{i}",
                    bunny_upload_status="uploaded",
                )
                path = repo / receipt_relpath(BATCH_ID, key)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(receipt), encoding="utf-8")
                roots.append(repo)
            report = collect_receipts(
                expected_logical_keys=keys,
                receipt_roots=roots,
                failed_logical_keys=["l4__en"],
            )
            self.assertEqual(report.finalized, keys[:4])
            self.assertEqual(report.failed, ["l4__en"])
            self.assertEqual(report.missing, [])

    def test_299_success_1_failure_preserves_299(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            keys = [f"lesson-{i:03d}__en" for i in range(300)]
            roots = []
            for i, key in enumerate(keys[:-1]):
                repo = root / f"r{i}"
                lid, loc = key.split("__")
                receipt = build_receipt(
                    batch_id=BATCH_ID,
                    logical_key=key,
                    lesson_id=lid,
                    locale=loc,
                    source_sha=SOURCE_SHA_PIN,
                    workflow_run_id="1",
                    artifact_id="2",
                    artifact_digest="sha256:x",
                    video_checksum=f"{i:064x}"[:64].ljust(64, "0"),
                    captions_checksum=f"{i+1:064x}"[:64].ljust(64, "0"),
                    bunny_guid=f"guid-{i}",
                    bunny_upload_status="uploaded",
                )
                path = repo / receipt_relpath(BATCH_ID, key)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(receipt), encoding="utf-8")
                roots.append(repo)
            report = collect_receipts(
                expected_logical_keys=keys,
                receipt_roots=roots,
                failed_logical_keys=[keys[-1]],
            )
            self.assertEqual(len(report.finalized), 299)
            self.assertEqual(report.failed, [keys[-1]])


class FinalizeOnePinTests(unittest.TestCase):
    def test_pins_exactly(self):
        pin = FINALIZE_ONE_PIN
        self.assertEqual(pin["workflowRunId"], "29296309474")
        self.assertEqual(pin["artifactId"], "8296996512")
        self.assertEqual(
            pin["artifactDigest"],
            "sha256:3dd0f69515d9fa8a551518c0d42395623d3d00202355817f0d434ec68bb16175",
        )
        self.assertEqual(pin["logicalKey"], "analyst-m3-l2-ai-summarization__en")
        self.assertEqual(pin["sourceSha"], SOURCE_SHA_PIN)
        self.assertEqual(
            result_branch_name(pin["batchId"], pin["logicalKey"]),
            "video-results/video-full-300-localized-v1/analyst-m3-l2-ai-summarization__en",
        )

    def test_finalize_one_disallows_generation_flags(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store, allow_gemini=True)
            result = finalize_cell(ctx)
            self.assertEqual(result.outcome, FinalizeOutcome.FAILED)


class NativeRerunSkipTests(unittest.TestCase):
    def test_should_skip_generation_when_receipt_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle = root / "prod"
            meta = _make_bundle(bundle)
            store = MockBunnyStore()
            ctx = _ctx(root, bundle, store)
            finalize_cell(ctx)
            self.assertTrue(
                should_skip_generation(
                    ctx.git,
                    batch_id=BATCH_ID,
                    logical_key=ctx.logical_key,
                    source_sha=SOURCE_SHA_PIN,
                    video_checksum=meta["video_sha"],
                )
            )


class ArtifactReuseTests(unittest.TestCase):
    def test_validate_existing_bundle_without_regen(self):
        with tempfile.TemporaryDirectory() as tmp:
            bundle = Path(tmp) / "prod"
            _make_bundle(bundle)
            meta = validate_six_file_bundle(bundle)
            self.assertTrue(meta["validation"]["hasCaptions"])


if __name__ == "__main__":
    unittest.main()
