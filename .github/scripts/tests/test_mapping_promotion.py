"""Focused tests for finalized receipt registry promotion."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
import unittest
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(HERE))

from video_finalize.constants import (  # noqa: E402
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    ACCEPTED_CARRY_FORWARD_PROTECTED_FIELDS,
    BATCH_ID,
    FULL_300_SOURCE_SHA_PIN,
    SOURCE_SHA_PIN,
    receipt_relpath,
)
from video_finalize.mapping_promotion import (  # noqa: E402
    REGISTRY_REL_PATH,
    MappingPromotionError,
    apply_promotions_to_registry,
    build_promotion_plan,
    push_registry_updates,
    validate_receipt_for_promotion,
    _run_git,
)
from video_finalize.receipt import build_receipt  # noqa: E402

ACCEPTED_OLD_GUID = "7a08de3d-6997-412e-834e-54906b65896f"
ACCEPTED_NEW_GUID = "4cb048b2-5a26-4427-b4d9-0efd58261088"
PLAIN_ANALYST_GUID = "6ba711c7-f54f-4062-8900-a3a9decff925"


def _fixture_registry() -> str:
    return f"""/**
 * Bunny Stream video registry.
 */
export const BUNNY_LIBRARY_ID = "670679";

export const BUNNY_VIDEO_GUIDS: Record<string, string> = {{
  "analyst-m3-l2-ai-summarization": "{PLAIN_ANALYST_GUID}",
  "analyst-m3-l2-ai-summarization__en": "{ACCEPTED_OLD_GUID}",
  "intro-m1-l4-ai-can-cannot": "legacy-intro-guid",
  "intro-m1-l4-ai-can-cannot__en": "legacy-intro-en-guid",
}};

export function getBunnyEmbedUrl(lessonId: string | undefined): string | undefined {{
  return undefined;
}}
"""


def _finalized_receipt(
    *,
    logical_key: str,
    guid: str,
    source_sha: str = FULL_300_SOURCE_SHA_PIN,
) -> dict:
    lesson_id, locale = logical_key.split("__")
    return build_receipt(
        batch_id=BATCH_ID,
        logical_key=logical_key,
        lesson_id=lesson_id,
        locale=locale,
        source_sha=source_sha,
        workflow_run_id="9001",
        artifact_id="9002",
        artifact_digest="sha256:" + ("a" * 64),
        video_checksum="b" * 64,
        captions_checksum="c" * 64,
        bunny_guid=guid,
        bunny_upload_status="uploaded",
        validation_status="finalized",
        finalized_at="2026-07-15T00:00:00Z",
    )


def _accepted_carry_forward_receipt() -> dict:
    return build_receipt(
        batch_id=ACCEPTED_CARRY_FORWARD_CELL["batchId"],
        logical_key=ACCEPTED_CARRY_FORWARD_CELL["logicalKey"],
        lesson_id=ACCEPTED_CARRY_FORWARD_CELL["lessonId"],
        locale=ACCEPTED_CARRY_FORWARD_CELL["locale"],
        source_sha=ACCEPTED_CARRY_FORWARD_CELL["sourceSha"],
        workflow_run_id=ACCEPTED_CARRY_FORWARD_CELL["workflowRunId"],
        artifact_id=ACCEPTED_CARRY_FORWARD_CELL["artifactId"],
        artifact_digest=ACCEPTED_CARRY_FORWARD_CELL["artifactDigest"],
        video_checksum=ACCEPTED_CARRY_FORWARD_CELL["videoChecksum"],
        captions_checksum=ACCEPTED_CARRY_FORWARD_CELL["captionsChecksum"],
        bunny_guid=ACCEPTED_CARRY_FORWARD_CELL["bunnyGuid"],
        bunny_upload_status="uploaded",
        validation_status="finalized",
        finalized_at="2026-07-15T00:00:00Z",
    )


def _write_receipt(root: Path, logical_key: str, receipt: dict) -> None:
    path = root / receipt_relpath(BATCH_ID, logical_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")


def _guid_for_index(i: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"test-guid-{i}"))


class RegistryPromotionTests(unittest.TestCase):
    def test_adds_missing_composite_mapping(self):
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text, {"builder-m1-l1-what-is-llm__en": _guid_for_index(1)}
        )
        self.assertTrue(result.changed)
        self.assertIn('"builder-m1-l1-what-is-llm__en":', result.text)
        self.assertIn(f'"analyst-m3-l2-ai-summarization": "{PLAIN_ANALYST_GUID}"', result.text)

    def test_replaces_older_composite_guid(self):
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text, {"analyst-m3-l2-ai-summarization__en": ACCEPTED_NEW_GUID}
        )
        self.assertTrue(result.changed)
        self.assertIn(f'"analyst-m3-l2-ai-summarization__en": "{ACCEPTED_NEW_GUID}"', result.text)
        self.assertNotIn(ACCEPTED_OLD_GUID, result.text)

    def test_idempotent_when_mapping_already_matches(self):
        text = _fixture_registry()
        updated = apply_promotions_to_registry(
            text, {"analyst-m3-l2-ai-summarization__en": ACCEPTED_OLD_GUID}
        ).text
        again = apply_promotions_to_registry(
            updated, {"analyst-m3-l2-ai-summarization__en": ACCEPTED_OLD_GUID}
        )
        self.assertFalse(again.changed)

    def test_plain_lesson_id_mappings_remain_unchanged(self):
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text, {"analyst-m3-l2-ai-summarization__en": ACCEPTED_NEW_GUID}
        )
        self.assertIn(f'"analyst-m3-l2-ai-summarization": "{PLAIN_ANALYST_GUID}"', result.text)
        self.assertIn('"intro-m1-l4-ai-can-cannot": "legacy-intro-guid"', result.text)

    def test_runtime_functions_remain_unchanged(self):
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text, {"analyst-m3-l2-ai-summarization__en": ACCEPTED_NEW_GUID}
        )
        self.assertIn("export function getBunnyEmbedUrl", result.text)

    def test_no_unrelated_entry_removed(self):
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text,
            {
                "analyst-m3-l2-ai-summarization__en": ACCEPTED_NEW_GUID,
                "intro-m1-l4-ai-can-cannot__ar-MSA": _guid_for_index(9),
            },
        )
        self.assertIn('"intro-m1-l4-ai-can-cannot__en": "legacy-intro-en-guid"', result.text)


class ReceiptValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.expected = {
            "analyst-m3-l2-ai-summarization__en",
            "builder-m1-l1-what-is-llm__en",
        }

    def test_accepted_carry_forward_replaces_old_guid(self):
        receipt = _accepted_carry_forward_receipt()
        guid, err = validate_receipt_for_promotion(
            receipt,
            logical_key=ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
            expected_logical_keys=self.expected,
            branch_logical_key=ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
        )
        self.assertIsNone(err)
        self.assertEqual(guid, ACCEPTED_NEW_GUID)
        self.assertEqual(receipt["sourceSha"], SOURCE_SHA_PIN)

    def test_wrong_normal_source_sha_fails_closed(self):
        receipt = _finalized_receipt(
            logical_key="builder-m1-l1-what-is-llm__en",
            guid=_guid_for_index(2),
            source_sha=SOURCE_SHA_PIN,
        )
        guid, err = validate_receipt_for_promotion(
            receipt,
            logical_key="builder-m1-l1-what-is-llm__en",
            expected_logical_keys=self.expected,
        )
        self.assertIsNone(guid)
        self.assertIn("sourceSha", err or "")

    def test_malformed_guid_fails_closed(self):
        receipt = _finalized_receipt(
            logical_key="builder-m1-l1-what-is-llm__en",
            guid="not-a-uuid",
        )
        guid, err = validate_receipt_for_promotion(
            receipt,
            logical_key="builder-m1-l1-what-is-llm__en",
            expected_logical_keys=self.expected,
        )
        self.assertIsNone(guid)
        self.assertIn("UUID", err or "")

    def test_ar_eg_composite_receipt_fails_closed(self):
        receipt = _finalized_receipt(
            logical_key="builder-m1-l1-what-is-llm__ar-EG",
            guid=_guid_for_index(3),
        )
        receipt["locale"] = "ar-EG"
        receipt["logicalKey"] = "builder-m1-l1-what-is-llm__ar-EG"
        guid, err = validate_receipt_for_promotion(
            receipt,
            logical_key="builder-m1-l1-what-is-llm__ar-EG",
            expected_logical_keys={"builder-m1-l1-what-is-llm__ar-EG"},
        )
        self.assertIsNone(guid)
        self.assertIn("not promotable", err or "")

    def test_each_accepted_field_mutation_fails_closed(self):
        for field in sorted(ACCEPTED_CARRY_FORWARD_PROTECTED_FIELDS):
            with self.subTest(field=field):
                bad = _accepted_carry_forward_receipt()
                bad[field] = f"mutated-{field}"
                guid, err = validate_receipt_for_promotion(
                    bad,
                    logical_key=ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
                    expected_logical_keys=self.expected | {ACCEPTED_CARRY_FORWARD_LOGICAL_KEY},
                )
                self.assertIsNone(guid)
                self.assertIsNotNone(err)

    def test_incomplete_receipt_fails_closed(self):
        receipt = _finalized_receipt(
            logical_key="builder-m1-l1-what-is-llm__en",
            guid=_guid_for_index(4),
        )
        del receipt["artifactDigest"]
        guid, err = validate_receipt_for_promotion(
            receipt,
            logical_key="builder-m1-l1-what-is-llm__en",
            expected_logical_keys=self.expected,
        )
        self.assertIsNone(guid)
        self.assertIsNotNone(err)


class PromotionPlanTests(unittest.TestCase):
    def _keys(self, n: int) -> list[str]:
        return [f"lesson-{i:03d}__en" for i in range(n)]

    def test_partial_success_promotes_299_before_unresolved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            keys = self._keys(300)
            for i, key in enumerate(keys[:299]):
                repo = root / key
                _write_receipt(repo, key, _finalized_receipt(logical_key=key, guid=_guid_for_index(i)))
            plan = build_promotion_plan(expected_logical_keys=keys, receipt_roots=list(root.iterdir()))
            self.assertEqual(plan.promotable_count, 299)
            self.assertEqual(plan.unresolved_keys(keys), [keys[299]])

    def test_conflicting_receipts_fail_closed_for_key(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            key = "lesson-000__en"
            for parent in ("batch-a", "batch-b"):
                repo = root / parent / key
                _write_receipt(
                    repo,
                    key,
                    _finalized_receipt(logical_key=key, guid=_guid_for_index(10 if parent == "batch-a" else 11)),
                )
            receipt_roots = [root / "batch-a" / key, root / "batch-b" / key]
            plan = build_promotion_plan(expected_logical_keys=[key], receipt_roots=receipt_roots)
            self.assertEqual(plan.ambiguous, [key])
            self.assertNotIn(key, plan.promotable)

    def test_all_300_resolved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            keys = self._keys(300)
            for i, key in enumerate(keys):
                repo = root / key
                if key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
                    _write_receipt(repo, key, _accepted_carry_forward_receipt())
                else:
                    _write_receipt(repo, key, _finalized_receipt(logical_key=key, guid=_guid_for_index(i)))
            plan = build_promotion_plan(expected_logical_keys=keys, receipt_roots=list(root.iterdir()))
            self.assertEqual(plan.promotable_count, 300)
            self.assertEqual(plan.unresolved_keys(keys), [])


class BareRemotePushTests(unittest.TestCase):
    def _init_bare_main(self, base: Path, registry_text: str, commit_message: str = "seed") -> str:
        bare = base / "remote.git"
        work = base / "seed-work"
        work.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "init", "--bare", str(bare)], check=True, capture_output=True)
        subprocess.run(["git", "init"], cwd=work, check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", "t@example.com"], cwd=work, check=True)
        subprocess.run(["git", "config", "user.name", "test"], cwd=work, check=True)
        registry = work / REGISTRY_REL_PATH
        registry.parent.mkdir(parents=True, exist_ok=True)
        registry.write_text(registry_text, encoding="utf-8")
        subprocess.run(["git", "add", REGISTRY_REL_PATH], cwd=work, check=True)
        subprocess.run(["git", "commit", "-m", commit_message], cwd=work, check=True)
        subprocess.run(["git", "branch", "-M", "main"], cwd=work, check=True)
        subprocess.run(["git", "remote", "add", "origin", str(bare)], cwd=work, check=True)
        subprocess.run(["git", "push", "-u", "origin", "main"], cwd=work, check=True)
        subprocess.run(
            ["git", "symbolic-ref", "HEAD", "refs/heads/main"],
            cwd=bare,
            check=True,
            capture_output=True,
        )
        return subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=work, check=True, capture_output=True, text=True
        ).stdout.strip()

    def test_serialized_non_force_push_one_file_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            dispatched = self._init_bare_main(base, _fixture_registry())
            keys = [f"lesson-{i:03d}__en" for i in range(2)]
            roots = []
            for i, key in enumerate(keys):
                repo = base / key
                _write_receipt(repo, key, _finalized_receipt(logical_key=key, guid=_guid_for_index(100 + i)))
                roots.append(repo)
            plan = build_promotion_plan(expected_logical_keys=keys, receipt_roots=roots)
            mapping_repo = base / "mapping-repo"
            mapping_repo.mkdir()
            result = push_registry_updates(
                repo_dir=mapping_repo,
                promotions=plan.promotable,
                remote_url=str(base / "remote.git"),
                dispatched_sha=dispatched,
                commit_message="promote mappings",
            )
            self.assertTrue(result.pushed)
            show = subprocess.run(
                ["git", "show", "--name-only", "--pretty=format:", "HEAD"],
                cwd=mapping_repo,
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()
            self.assertEqual(show, REGISTRY_REL_PATH)

    def test_failed_jobs_rerun_adds_only_final_mapping(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            dispatched = self._init_bare_main(base, _fixture_registry())
            first_keys = [f"lesson-{i:03d}__en" for i in range(2)]
            roots = []
            for i, key in enumerate(first_keys):
                repo = base / key
                _write_receipt(repo, key, _finalized_receipt(logical_key=key, guid=_guid_for_index(200 + i)))
                roots.append(repo)
            plan1 = build_promotion_plan(expected_logical_keys=first_keys, receipt_roots=roots)
            mapping_repo = base / "mapping-repo"
            mapping_repo.mkdir()
            push_registry_updates(
                repo_dir=mapping_repo,
                promotions=plan1.promotable,
                remote_url=str(base / "remote.git"),
                dispatched_sha=dispatched,
                commit_message="promote first",
            )
            first_text = subprocess.run(
                ["git", "show", "HEAD:" + REGISTRY_REL_PATH],
                cwd=mapping_repo,
                check=True,
                capture_output=True,
                text=True,
            ).stdout
            third_key = "lesson-002__en"
            repo3 = base / third_key
            _write_receipt(
                repo3,
                third_key,
                _finalized_receipt(logical_key=third_key, guid=_guid_for_index(203)),
            )
            plan2 = build_promotion_plan(
                expected_logical_keys=first_keys + [third_key],
                receipt_roots=roots + [repo3],
            )
            mapping_repo2 = base / "mapping-repo-2"
            mapping_repo2.mkdir()
            push_registry_updates(
                repo_dir=mapping_repo2,
                promotions=plan2.promotable,
                remote_url=str(base / "remote.git"),
                dispatched_sha=dispatched,
                commit_message="promote rerun",
            )
            second_text = subprocess.run(
                ["git", "show", "HEAD:" + REGISTRY_REL_PATH],
                cwd=mapping_repo2,
                check=True,
                capture_output=True,
                text=True,
            ).stdout
            self.assertIn('"lesson-000__en":', first_text)
            self.assertIn('"lesson-001__en":', first_text)
            self.assertIn('"lesson-002__en":', second_text)
            self.assertIn('"lesson-000__en":', second_text)
            self.assertIn('"lesson-001__en":', second_text)

    def test_bounded_retry_preserves_unrelated_concurrent_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            dispatched = self._init_bare_main(base, _fixture_registry())
            updater = base / "updater"
            subprocess.run(["git", "clone", str(base / "remote.git"), str(updater)], check=True, capture_output=True)
            subprocess.run(["git", "checkout", "main"], cwd=updater, check=True, capture_output=True)
            readme = updater / "README.md"
            readme.write_text("concurrent change\n", encoding="utf-8")
            subprocess.run(["git", "add", "README.md"], cwd=updater, check=True)
            subprocess.run(["git", "commit", "-m", "concurrent"], cwd=updater, check=True)
            subprocess.run(["git", "push", "origin", "main"], cwd=updater, check=True)
            key = "lesson-099__en"
            repo = base / key
            _write_receipt(repo, key, _finalized_receipt(logical_key=key, guid=_guid_for_index(99)))
            plan = build_promotion_plan(expected_logical_keys=[key], receipt_roots=[repo])
            mapping_repo = base / "mapping-repo"
            mapping_repo.mkdir()
            push_attempts = {"count": 0}

            def flaky_git(args: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> None:
                if args and args[0] == "push":
                    push_attempts["count"] += 1
                    if push_attempts["count"] == 1:
                        raise subprocess.CalledProcessError(
                            1,
                            ["git", *args],
                            stderr="! [rejected] (non-fast-forward)",
                        )
                _run_git(args, cwd=cwd, env=env)

            result = push_registry_updates(
                repo_dir=mapping_repo,
                promotions=plan.promotable,
                remote_url=str(base / "remote.git"),
                dispatched_sha=dispatched,
                commit_message="promote with retry",
                max_retries=2,
                run_git=flaky_git,
            )
            self.assertTrue(result.pushed)
            self.assertEqual(result.retries, 1)
            subprocess.run(["git", "fetch", "origin"], cwd=updater, check=True, capture_output=True)
            head_files = subprocess.run(
                ["git", "ls-tree", "-r", "--name-only", "origin/main"],
                cwd=updater,
                check=True,
                capture_output=True,
                text=True,
            ).stdout
            self.assertIn("README.md", head_files)
            self.assertIn(REGISTRY_REL_PATH, head_files)


class ZeroBunnyOperationProof(unittest.TestCase):
    def test_replacement_is_registry_only(self):
        # Registry serializer has no Bunny imports or HTTP references.
        from video_finalize import mapping_promotion as mp

        source = Path(mp.__file__).read_text(encoding="utf-8")
        self.assertNotIn("bunny_client", source)
        self.assertNotIn("requests", source)
        self.assertNotIn("BunnyClient", source)
        text = _fixture_registry()
        result = apply_promotions_to_registry(
            text, {ACCEPTED_CARRY_FORWARD_LOGICAL_KEY: ACCEPTED_NEW_GUID}
        )
        self.assertIn(ACCEPTED_NEW_GUID, result.text)
        self.assertIn(PLAIN_ANALYST_GUID, result.text)


# Exact final-three repair cells (Run 29688980041).
REPAIR_CELLS = (
    ("creator-m4-repurposing__en", "c34060de-ed17-4b2c-9ad7-d53a1d2818c9"),
    ("intro-m1-l1-what-is-ai__en", "de6aa7f5-a863-46e3-86ca-3da9489ae601"),
    ("automator-m7-l1-closing-loop__ar-Gulf", "aa1d9464-c58d-4e8c-a6dc-f29d7b924565"),
)


class RepairSourcePolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from video_finalize.source_policy import (
            REPAIR_SOURCE_LOGICAL_KEYS,
            REPAIR_SOURCE_SHA_PIN,
            required_promotion_source_sha,
        )

        cls.REPAIR_SOURCE_SHA_PIN = REPAIR_SOURCE_SHA_PIN
        cls.REPAIR_SOURCE_LOGICAL_KEYS = REPAIR_SOURCE_LOGICAL_KEYS
        cls.required_promotion_source_sha = staticmethod(required_promotion_source_sha)

    def test_each_exact_repair_receipt_accepted(self):
        expected = {k for k, _ in REPAIR_CELLS}
        for key, guid in REPAIR_CELLS:
            with self.subTest(key=key):
                receipt = _finalized_receipt(
                    logical_key=key,
                    guid=guid,
                    source_sha=self.REPAIR_SOURCE_SHA_PIN,
                )
                receipt["workflowRunId"] = "29688980041"
                got, err = validate_receipt_for_promotion(
                    receipt,
                    logical_key=key,
                    expected_logical_keys=expected,
                    branch_logical_key=key,
                )
                self.assertIsNone(err)
                self.assertEqual(got, guid)

    def test_repair_sha_on_unrelated_future_cell_rejected(self):
        key = "future-m9-l4-synthetic-ops-check__en"
        receipt = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(77),
            source_sha=self.REPAIR_SOURCE_SHA_PIN,
        )
        got, err = validate_receipt_for_promotion(
            receipt,
            logical_key=key,
            expected_logical_keys={key},
        )
        self.assertIsNone(got)
        self.assertIn("repair sourceSha not authorized", err or "")

    def test_unknown_source_sha_rejected(self):
        key = "builder-m1-l1-what-is-llm__en"
        receipt = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(78),
            source_sha="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        )
        got, err = validate_receipt_for_promotion(
            receipt, logical_key=key, expected_logical_keys={key}
        )
        self.assertIsNone(got)
        self.assertIn("sourceSha", err or "")

    def test_missing_source_sha_rejected(self):
        key = "builder-m1-l1-what-is-llm__en"
        receipt = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(79),
        )
        del receipt["sourceSha"]
        # Incomplete schema fails first; also cover empty string path.
        got, err = validate_receipt_for_promotion(
            receipt, logical_key=key, expected_logical_keys={key}
        )
        self.assertIsNone(got)
        self.assertIsNotNone(err)

        receipt2 = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(80),
        )
        receipt2["sourceSha"] = ""
        got2, err2 = validate_receipt_for_promotion(
            receipt2, logical_key=key, expected_logical_keys={key}
        )
        self.assertIsNone(got2)
        self.assertIsNotNone(err2)

    def test_ordinary_full_300_source_still_accepted(self):
        key = "builder-m1-l1-what-is-llm__en"
        receipt = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(81),
            source_sha=FULL_300_SOURCE_SHA_PIN,
        )
        got, err = validate_receipt_for_promotion(
            receipt, logical_key=key, expected_logical_keys={key}
        )
        self.assertIsNone(err)
        self.assertEqual(got, receipt["bunnyGuid"])

    def test_historical_full_300_rejected_for_each_repair_key(self):
        for key, guid in REPAIR_CELLS:
            with self.subTest(key=key):
                receipt = _finalized_receipt(
                    logical_key=key,
                    guid=guid,
                    source_sha=FULL_300_SOURCE_SHA_PIN,
                )
                got, err = validate_receipt_for_promotion(
                    receipt,
                    logical_key=key,
                    expected_logical_keys={k for k, _ in REPAIR_CELLS},
                )
                self.assertIsNone(got)
                self.assertIn("repair-source", err or "")

    def test_carry_forward_unchanged(self):
        receipt = _accepted_carry_forward_receipt()
        got, err = validate_receipt_for_promotion(
            receipt,
            logical_key=ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
            expected_logical_keys={ACCEPTED_CARRY_FORWARD_LOGICAL_KEY},
            branch_logical_key=ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
        )
        self.assertIsNone(err)
        self.assertEqual(got, ACCEPTED_CARRY_FORWARD_CELL["bunnyGuid"])

    def test_carry_forward_source_on_unauthorized_key_rejected(self):
        key = "builder-m1-l1-what-is-llm__en"
        receipt = _finalized_receipt(
            logical_key=key,
            guid=_guid_for_index(82),
            source_sha=SOURCE_SHA_PIN,
        )
        got, err = validate_receipt_for_promotion(
            receipt, logical_key=key, expected_logical_keys={key}
        )
        self.assertIsNone(got)
        self.assertIn("carry-forward sourceSha not authorized", err or "")

    def test_shortened_repair_sha_rejected(self):
        key = REPAIR_CELLS[0][0]
        receipt = _finalized_receipt(
            logical_key=key,
            guid=REPAIR_CELLS[0][1],
            source_sha=self.REPAIR_SOURCE_SHA_PIN[:12],
        )
        got, err = validate_receipt_for_promotion(
            receipt,
            logical_key=key,
            expected_logical_keys={k for k, _ in REPAIR_CELLS},
        )
        self.assertIsNone(got)
        self.assertIn("malformed", err or "")

    def test_policy_not_keyed_only_to_run_id_or_guid(self):
        key = REPAIR_CELLS[0][0]
        # Wrong source but correct run id + GUID must still fail.
        receipt = _finalized_receipt(
            logical_key=key,
            guid=REPAIR_CELLS[0][1],
            source_sha=FULL_300_SOURCE_SHA_PIN,
        )
        receipt["workflowRunId"] = "29688980041"
        got, err = validate_receipt_for_promotion(
            receipt,
            logical_key=key,
            expected_logical_keys={k for k, _ in REPAIR_CELLS},
        )
        self.assertIsNone(got)
        self.assertIsNotNone(err)

    def test_shared_policy_parity_with_planner_pins(self):
        from video_finalize import unresolved_generation_plan as ugp
        from video_finalize import source_policy as sp

        self.assertEqual(ugp.REPAIR_SOURCE_SHA_PIN, sp.REPAIR_SOURCE_SHA_PIN)
        self.assertEqual(ugp.ACCEPTED_FINALIZED_SOURCE_SHAS, sp.ACCEPTED_FINALIZED_SOURCE_SHAS)
        self.assertEqual(
            self.required_promotion_source_sha(REPAIR_CELLS[0][0]),
            sp.REPAIR_SOURCE_SHA_PIN,
        )
        self.assertEqual(
            self.required_promotion_source_sha("builder-m1-l1-what-is-llm__en"),
            FULL_300_SOURCE_SHA_PIN,
        )


def _pre_completion_297_registry_fixture(live_registry_text: str) -> str:
    """Build an isolated 297-entry fixture by removing only the final-three lines.

    The live production registry may already contain 300 mappings; this fixture
    reconstructs the deterministic pre-completion state without mutating disk.
    """
    repair_lines = {
        f'  "{key}": "{guid}",'
        for key, guid in REPAIR_CELLS
    }
    out_lines: list[str] = []
    removed = 0
    for line in live_registry_text.splitlines(keepends=True):
        stripped = line.rstrip("\r\n")
        if stripped in repair_lines:
            removed += 1
            continue
        out_lines.append(line)
    if removed != 3:
        raise AssertionError(
            f"expected to strip exactly 3 final-three lines, removed={removed}"
        )
    return "".join(out_lines)


class FinalThreePromotionSimulationTests(unittest.TestCase):
    """Simulate 297 preserved + exact 3 repair promotions → 300 / 0 unresolved."""

    def test_297_preserved_three_added_idempotent(self):
        from video_finalize.recovery_plan import load_authoritative_logical_keys
        from video_finalize.source_policy import REPAIR_SOURCE_SHA_PIN

        repo_root = Path(__file__).resolve().parents[3]
        auth = load_authoritative_logical_keys(repo_root)
        self.assertEqual(len(auth), 300)
        repair_keys = {k for k, _ in REPAIR_CELLS}
        repair_guids = dict(REPAIR_CELLS)

        registry_path = repo_root / REGISTRY_REL_PATH
        live_registry = registry_path.read_text(encoding="utf-8")
        live_map = dict(
            re.findall(r'^  "([^"]+__[^"]+)": "([^"]+)",\s*$', live_registry, re.M)
        )
        # Live production registry may correctly remain at 300 after completion.
        self.assertEqual(len(live_map), 300)
        for key, guid in REPAIR_CELLS:
            self.assertEqual(live_map.get(key), guid)

        # Isolated deterministic 297-entry pre-completion fixture (temp/out-of-repo).
        fixture_registry = _pre_completion_297_registry_fixture(live_registry)
        existing = re.findall(
            r'^  "([^"]+__[^"]+)": "([^"]+)",\s*$', fixture_registry, re.M
        )
        existing_map = {k: v for k, v in existing}
        self.assertEqual(len(existing_map), 297)
        for k in repair_keys:
            self.assertNotIn(k, existing_map)
        self.assertEqual(len(set(existing_map.values())), 297)

        with tempfile.TemporaryDirectory(dir="E:\\Temp") as tmp:
            root = Path(tmp)
            fixture_path = root / "pre-completion-297-bunny-videos.ts"
            fixture_path.write_text(fixture_registry, encoding="utf-8")
            self.assertEqual(
                fixture_path.read_text(encoding="utf-8"), fixture_registry
            )

            # Write historical full-300 receipts for all non-repair keys.
            for i, key in enumerate(auth):
                if key in repair_keys:
                    continue
                repo = root / key
                if key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
                    _write_receipt(repo, key, _accepted_carry_forward_receipt())
                else:
                    _write_receipt(
                        repo,
                        key,
                        _finalized_receipt(
                            logical_key=key,
                            guid=_guid_for_index(1000 + i),
                            source_sha=FULL_300_SOURCE_SHA_PIN,
                        ),
                    )
            # Write exact repair receipts.
            for key, guid in REPAIR_CELLS:
                receipt = _finalized_receipt(
                    logical_key=key,
                    guid=guid,
                    source_sha=REPAIR_SOURCE_SHA_PIN,
                )
                receipt["workflowRunId"] = "29688980041"
                _write_receipt(root / key, key, receipt)

            plan = build_promotion_plan(
                expected_logical_keys=auth,
                receipt_roots=[p for p in root.iterdir() if p.is_dir()],
            )
            self.assertEqual(plan.promotable_count, 300)
            self.assertEqual(plan.unresolved_keys(auth), [])
            self.assertEqual(plan.rejected, {})
            for key, guid in REPAIR_CELLS:
                self.assertEqual(plan.promotable[key], guid)

            # Apply only the three new mappings onto the isolated 297 fixture.
            first = apply_promotions_to_registry(fixture_registry, repair_guids)
            self.assertTrue(first.changed)
            self.assertEqual(sorted(first.updated_keys), sorted(repair_keys))
            for key, guid in REPAIR_CELLS:
                self.assertIn(f'"{key}": "{guid}"', first.text)

            # Existing 297 composite mappings preserved byte-for-byte as lines.
            for key, guid in existing_map.items():
                self.assertIn(f'"{key}": "{guid}"', first.text)
                self.assertEqual(
                    existing_map[key],
                    dict(
                        re.findall(
                            r'^  "([^"]+__[^"]+)": "([^"]+)",\s*$', first.text, re.M
                        )
                    )[key],
                )

            # Second application idempotent (no text/byte change).
            second = apply_promotions_to_registry(first.text, repair_guids)
            self.assertFalse(second.changed)
            self.assertEqual(second.text, first.text)
            self.assertEqual(
                second.text.encode("utf-8"), first.text.encode("utf-8")
            )

            after = re.findall(r'^  "([^"]+__[^"]+)": "([^"]+)",\s*$', first.text, re.M)
            after_map = {k: v for k, v in after}
            self.assertEqual(len(after_map), 300)
            self.assertEqual(len(set(after_map.values())), 300)
            for key, guid in REPAIR_CELLS:
                self.assertEqual(after_map[key], guid)

            # Live production registry remains unchanged at 300.
            live_after = registry_path.read_text(encoding="utf-8")
            self.assertEqual(live_after, live_registry)
            self.assertEqual(len(live_map), 300)


if __name__ == "__main__":
    unittest.main()
