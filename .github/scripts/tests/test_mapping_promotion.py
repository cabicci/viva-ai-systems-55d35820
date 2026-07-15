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


if __name__ == "__main__":
    unittest.main()
