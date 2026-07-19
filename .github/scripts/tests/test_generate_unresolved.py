"""Focused tests for generate-unresolved planner and workflow wiring."""
from __future__ import annotations

import hashlib
import json
import re
import tempfile
import unittest
import uuid
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parents[1]
import sys

sys.path.insert(0, str(HERE))

from video_finalize.constants import (  # noqa: E402
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    BATCH_ID,
    FULL_300_SOURCE_SHA_PIN,
    SOURCE_SHA_PIN,
    receipt_relpath,
)
from video_finalize.receipt import build_receipt  # noqa: E402
from video_finalize.recovery_plan import load_authoritative_logical_keys  # noqa: E402
from video_finalize.unresolved_generation_plan import (  # noqa: E402
    APPROVED_UNRESOLVED_KEYS,
    EXPECTED_APPROVED_COUNT,
    EXPECTED_APPROVED_LOCALES,
    EXPECTED_BASELINE_FINALIZED,
    REPAIR_SOURCE_SHA_PIN,
    UnresolvedPlanError,
    assert_approved_universe,
    build_unresolved_generation_plan,
    collect_validated_finalized_keys,
    split_matrix,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = HERE.parents[0] / "workflows" / "video-production-batch.yml"


def _guid(seed: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, seed))


def _write_receipt(
    root: Path,
    logical_key: str,
    *,
    artifact_id: str,
    guid: str,
    source_sha: str = FULL_300_SOURCE_SHA_PIN,
) -> None:
    lesson_id, locale = logical_key.rsplit("__", 1)
    if logical_key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
        receipt = dict(ACCEPTED_CARRY_FORWARD_CELL)
        receipt["schemaVersion"] = "video-finalization-receipt-v1"
        receipt["bunnyUploadStatus"] = "verified"
        receipt["finalizedAt"] = "2026-01-01T00:00:00Z"
    else:
        receipt = build_receipt(
            batch_id=BATCH_ID,
            logical_key=logical_key,
            lesson_id=lesson_id,
            locale=locale,
            source_sha=source_sha,
            workflow_run_id="29407852029",
            artifact_id=artifact_id,
            artifact_digest="sha256:" + hashlib.sha256(logical_key.encode()).hexdigest(),
            video_checksum=hashlib.sha256((logical_key + "-v").encode()).hexdigest(),
            captions_checksum=hashlib.sha256((logical_key + "-c").encode()).hexdigest(),
            bunny_guid=guid,
            bunny_upload_status="verified",
            validation_status="finalized",
        )
    path = root / logical_key / receipt_relpath(BATCH_ID, logical_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, indent=2), encoding="utf-8")


def _baseline_finalized_roots(auth: list[str]) -> tuple[Path, set[str]]:
    """Create receipt roots for exactly the permanent 269 (auth − approved)."""
    approved = set(APPROVED_UNRESOLVED_KEYS)
    permanent = [k for k in auth if k not in approved]
    assert len(permanent) == EXPECTED_BASELINE_FINALIZED
    tmp = Path(tempfile.mkdtemp(prefix="unresolved-plan-"))
    for i, key in enumerate(permanent):
        if key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
            _write_receipt(tmp, key, artifact_id="8296996512", guid=ACCEPTED_CARRY_FORWARD_CELL["bunnyGuid"])
        else:
            _write_receipt(tmp, key, artifact_id=str(9000000000 + i), guid=_guid(f"fin-{key}"))
    return tmp, set(permanent)


class ApprovedUniverseTests(unittest.TestCase):
    def test_approved_count_and_uniqueness(self):
        assert_approved_universe()
        self.assertEqual(len(APPROVED_UNRESOLVED_KEYS), EXPECTED_APPROVED_COUNT)
        self.assertEqual(len(set(APPROVED_UNRESOLVED_KEYS)), EXPECTED_APPROVED_COUNT)

    def test_approved_locale_distribution(self):
        from collections import Counter

        dist = Counter(k.rsplit("__", 1)[1] for k in APPROVED_UNRESOLVED_KEYS)
        self.assertEqual(dict(dist), EXPECTED_APPROVED_LOCALES)
        self.assertEqual(dist.get("ar-EG", 0), 0)


class AuthoritativeManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.auth = load_authoritative_logical_keys(REPO_ROOT)

    def test_authoritative_300(self):
        self.assertEqual(len(self.auth), 300)
        self.assertEqual(len(set(self.auth)), 300)
        from collections import Counter

        dist = Counter(k.rsplit("__", 1)[1] for k in self.auth)
        self.assertEqual(dist["en"], 100)
        self.assertEqual(dist["ar-MSA"], 100)
        self.assertEqual(dist["ar-Gulf"], 100)
        self.assertEqual(dist.get("ar-EG", 0), 0)

    def test_approved_subset_of_authoritative(self):
        self.assertTrue(set(APPROVED_UNRESOLVED_KEYS) <= set(self.auth))


class PlannerBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.auth = load_authoritative_logical_keys(REPO_ROOT)

    def test_initial_exact_31_and_excludes_269(self):
        root, permanent = _baseline_finalized_roots(self.auth)
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        self.assertEqual(len(finalized), 269)
        self.assertEqual(finalized, permanent)
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth,
            finalized_keys=finalized,
            repo_root=REPO_ROOT,
        )
        self.assertEqual(plan.selected_keys, list(APPROVED_UNRESOLVED_KEYS))
        self.assertEqual(plan.selected_count, 31)
        self.assertFalse(set(plan.selected_keys) & finalized)
        self.assertEqual(
            [c["compositeKey"] for c in plan.matrix_cells],
            list(APPROVED_UNRESOLVED_KEYS),
        )
        from collections import Counter

        self.assertEqual(
            dict(Counter(k.rsplit("__", 1)[1] for k in plan.selected_keys)),
            EXPECTED_APPROVED_LOCALES,
        )

    def test_partial_retry_removes_newly_finalized(self):
        root, permanent = _baseline_finalized_roots(self.auth)
        newly = APPROVED_UNRESOLVED_KEYS[:3]
        for i, key in enumerate(newly):
            _write_receipt(root, key, artifact_id=str(8000000000 + i), guid=_guid(f"new-{key}"))
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        self.assertEqual(len(finalized), 272)
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        expected = list(APPROVED_UNRESOLVED_KEYS[3:])
        self.assertEqual(plan.selected_keys, expected)
        self.assertEqual(plan.selected_count, 28)
        for key in newly:
            self.assertNotIn(key, plan.selected_keys)

    def test_monotonic_multiple_retries(self):
        root, _ = _baseline_finalized_roots(self.auth)
        prev = list(APPROVED_UNRESOLVED_KEYS)
        for n in (1, 5, 12, 31):
            for i, key in enumerate(APPROVED_UNRESOLVED_KEYS[:n]):
                path = root / key / receipt_relpath(BATCH_ID, key)
                if not path.is_file():
                    _write_receipt(
                        root, key, artifact_id=str(7000000000 + i), guid=_guid(f"m-{key}")
                    )
            finalized = collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )
            plan = build_unresolved_generation_plan(
                authoritative_keys=self.auth,
                finalized_keys=finalized,
                repo_root=REPO_ROOT,
            )
            self.assertEqual(plan.selected_keys, list(APPROVED_UNRESOLVED_KEYS[n:]))
            self.assertTrue(set(plan.selected_keys) <= set(prev))
            self.assertLessEqual(len(plan.selected_keys), len(prev))
            prev = plan.selected_keys

    def test_empty_retry(self):
        root, _ = _baseline_finalized_roots(self.auth)
        for i, key in enumerate(APPROVED_UNRESOLVED_KEYS):
            _write_receipt(root, key, artifact_id=str(6000000000 + i), guid=_guid(f"e-{key}"))
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertTrue(plan.empty)
        self.assertEqual(plan.selected_keys, [])
        self.assertEqual(plan.matrix_cells, [])
        matrix_a, matrix_b = split_matrix(plan.matrix_cells)
        self.assertEqual(matrix_a, [])
        self.assertEqual(matrix_b, [])

    def test_finalized_cannot_reenter(self):
        root, permanent = _baseline_finalized_roots(self.auth)
        key = APPROVED_UNRESOLVED_KEYS[0]
        _write_receipt(root, key, artifact_id="6100000001", guid=_guid(f"reenter-{key}"))
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertNotIn(key, plan.selected_keys)
        self.assertIn(key, finalized)
        self.assertTrue(permanent <= finalized)

    def test_unresolved_outside_approved_fails(self):
        root, permanent = _baseline_finalized_roots(self.auth)
        # Drop one permanent receipt → authoritative unresolved escapes approved set
        victim = next(iter(permanent - {ACCEPTED_CARRY_FORWARD_LOGICAL_KEY}))
        import shutil

        shutil.rmtree(root / victim)
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        with self.assertRaises(UnresolvedPlanError) as ctx:
            build_unresolved_generation_plan(
                authoritative_keys=self.auth,
                finalized_keys=finalized,
                repo_root=REPO_ROOT,
            )
        self.assertIn("missing original finalized", str(ctx.exception))

    def test_missing_original_finalized_fails(self):
        # Same as above — explicit name
        self.test_unresolved_outside_approved_fails()

    def test_invalid_receipt_fails(self):
        root, _ = _baseline_finalized_roots(self.auth)
        key = next(k for k in self.auth if k not in APPROVED_UNRESOLVED_KEYS)
        path = root / key / receipt_relpath(BATCH_ID, key)
        path.write_text("{not-json", encoding="utf-8")
        with self.assertRaises(UnresolvedPlanError):
            collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )

    def test_conflicting_identity_fails(self):
        root, _ = _baseline_finalized_roots(self.auth)
        key = next(
            k
            for k in self.auth
            if k not in APPROVED_UNRESOLVED_KEYS and k != ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
        )
        path = root / key / receipt_relpath(BATCH_ID, key)
        receipt = json.loads(path.read_text(encoding="utf-8"))
        receipt["logicalKey"] = "tampered__en"
        path.write_text(json.dumps(receipt), encoding="utf-8")
        with self.assertRaises(UnresolvedPlanError):
            collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )

    def test_duplicate_logical_key_fails(self):
        root, _ = _baseline_finalized_roots(self.auth)
        key = next(
            k
            for k in self.auth
            if k not in APPROVED_UNRESOLVED_KEYS and k != ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
        )
        # Second root with same key
        root2 = Path(tempfile.mkdtemp(prefix="unresolved-dup-"))
        _write_receipt(root2, key, artifact_id="9999999999", guid=_guid("dup-other"))
        with self.assertRaises(UnresolvedPlanError) as ctx:
            collect_validated_finalized_keys(
                receipt_roots=[root, root2], authoritative=set(self.auth)
            )
        self.assertIn("duplicate finalized logical key", str(ctx.exception))

    def test_duplicate_artifact_id_fails(self):
        root, _ = _baseline_finalized_roots(self.auth)
        keys = [
            k
            for k in self.auth
            if k not in APPROVED_UNRESOLVED_KEYS and k != ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
        ][:2]
        for key in keys:
            path = root / key / receipt_relpath(BATCH_ID, key)
            receipt = json.loads(path.read_text(encoding="utf-8"))
            receipt["artifactId"] = "duplicate-artifact"
            # keep unique checksums/guids
            path.write_text(json.dumps(receipt), encoding="utf-8")
        with self.assertRaises(UnresolvedPlanError) as ctx:
            collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )
        self.assertIn("duplicate artifactId", str(ctx.exception))

    def test_conflicting_bunny_guid_fails(self):
        root, _ = _baseline_finalized_roots(self.auth)
        keys = [
            k
            for k in self.auth
            if k not in APPROVED_UNRESOLVED_KEYS and k != ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
        ][:2]
        shared = _guid("shared-guid")
        for key in keys:
            path = root / key / receipt_relpath(BATCH_ID, key)
            receipt = json.loads(path.read_text(encoding="utf-8"))
            receipt["bunnyGuid"] = shared
            path.write_text(json.dumps(receipt), encoding="utf-8")
        with self.assertRaises(UnresolvedPlanError) as ctx:
            collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )
        self.assertIn("conflicting bunnyGuid", str(ctx.exception))

    def test_final_three_297_excludes_exact_remaining_set(self):
        """Current production state: 297 finalized → exact 3 unresolved remain."""
        root, _ = _baseline_finalized_roots(self.auth)
        remaining = {
            "automator-m7-l1-closing-loop__ar-Gulf",
            "intro-m1-l1-what-is-ai__en",
            "creator-m4-repurposing__en",
        }
        self.assertTrue(remaining <= set(APPROVED_UNRESOLVED_KEYS))
        for i, key in enumerate(APPROVED_UNRESOLVED_KEYS):
            if key in remaining:
                continue
            _write_receipt(
                root, key, artifact_id=str(5100000000 + i), guid=_guid(f"297-{key}")
            )
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        self.assertEqual(len(finalized), 297)
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertEqual(set(plan.selected_keys), remaining)
        self.assertEqual(plan.selected_count, 3)
        # Preserve canonical approved-universe order (not display order).
        expected_order = [k for k in APPROVED_UNRESOLVED_KEYS if k in remaining]
        self.assertEqual(plan.selected_keys, expected_order)
        self.assertFalse(set(plan.selected_keys) & finalized)
        self.assertNotIn("ar-EG", json.dumps(plan.selected_keys))

    def test_repair_source_receipts_accepted_for_retry(self):
        root, _ = _baseline_finalized_roots(self.auth)
        remaining = [
            k
            for k in APPROVED_UNRESOLVED_KEYS
            if k
            in {
                "automator-m7-l1-closing-loop__ar-Gulf",
                "intro-m1-l1-what-is-ai__en",
                "creator-m4-repurposing__en",
            }
        ]
        for i, key in enumerate(APPROVED_UNRESOLVED_KEYS):
            if key in remaining:
                continue
            _write_receipt(
                root, key, artifact_id=str(5200000000 + i), guid=_guid(f"hist-{key}")
            )
        # Finalize first remaining cell under REPAIR_SOURCE_SHA
        _write_receipt(
            root,
            remaining[0],
            artifact_id="5300000001",
            guid=_guid(f"repair-{remaining[0]}"),
            source_sha=REPAIR_SOURCE_SHA_PIN,
        )
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        self.assertEqual(len(finalized), 298)
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertEqual(plan.selected_keys, remaining[1:])
        self.assertEqual(plan.selected_count, 2)

        _write_receipt(
            root,
            remaining[1],
            artifact_id="5300000002",
            guid=_guid(f"repair-{remaining[1]}"),
            source_sha=REPAIR_SOURCE_SHA_PIN,
        )
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertEqual(plan.selected_keys, remaining[2:])
        self.assertEqual(plan.selected_count, 1)

        _write_receipt(
            root,
            remaining[2],
            artifact_id="5300000003",
            guid=_guid(f"repair-{remaining[2]}"),
            source_sha=REPAIR_SOURCE_SHA_PIN,
        )
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        plan = build_unresolved_generation_plan(
            authoritative_keys=self.auth, finalized_keys=finalized, repo_root=REPO_ROOT
        )
        self.assertTrue(plan.empty)
        self.assertEqual(plan.selected_keys, [])

    def test_unknown_source_sha_fails_closed(self):
        root, _ = _baseline_finalized_roots(self.auth)
        key = APPROVED_UNRESOLVED_KEYS[0]
        _write_receipt(
            root,
            key,
            artifact_id="5400000001",
            guid=_guid("unknown-src"),
            source_sha="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
        )
        with self.assertRaises(UnresolvedPlanError) as ctx:
            collect_validated_finalized_keys(
                receipt_roots=[root], authoritative=set(self.auth)
            )
        self.assertIn("sourceSha not in accepted historical/repair set", str(ctx.exception))

    def test_historical_full_300_source_still_accepted(self):
        root, permanent = _baseline_finalized_roots(self.auth)
        finalized = collect_validated_finalized_keys(
            receipt_roots=[root], authoritative=set(self.auth)
        )
        self.assertEqual(finalized, permanent)
        sample = next(
            k for k in permanent if k != ACCEPTED_CARRY_FORWARD_LOGICAL_KEY
        )
        receipt = json.loads(
            (root / sample / receipt_relpath(BATCH_ID, sample)).read_text(encoding="utf-8")
        )
        self.assertEqual(receipt["sourceSha"], FULL_300_SOURCE_SHA_PIN)

    def test_manifest_drift_fails(self):
        with self.assertRaises(UnresolvedPlanError):
            build_unresolved_generation_plan(
                authoritative_keys=self.auth[:-1],
                finalized_keys=set(),
                repo_root=REPO_ROOT,
            )

    def test_ar_eg_fails(self):
        bad = list(self.auth) + ["x__ar-EG"]
        with self.assertRaises(UnresolvedPlanError):
            build_unresolved_generation_plan(
                authoritative_keys=bad,
                finalized_keys=set(bad) - set(APPROVED_UNRESOLVED_KEYS),
                repo_root=REPO_ROOT,
            )

    def test_malformed_logical_key_in_approved_caught(self):
        with self.assertRaises(UnresolvedPlanError):
            _locale_of = __import__(
                "video_finalize.unresolved_generation_plan", fromlist=["_locale_of"]
            )._locale_of
            _locale_of("not-a-key")


class WorkflowStaticGenerateUnresolvedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW.read_text(encoding="utf-8")
        cls.doc = yaml.safe_load(cls.text)

    def test_mode_and_default(self):
        self.assertIn("default: preflight-one", self.text)
        self.assertIn("- generate-unresolved", self.text)
        for mode in (
            "preflight-one",
            "generate-one",
            "finalize-one",
            "full-300",
            "recover-uploaded-receipts",
            "generate-unresolved",
        ):
            self.assertIn(f"- {mode}", self.text)

    def test_no_automatic_triggers(self):
        on_block = self.text.split("on:")[1].split("jobs:")[0]
        self.assertIn("workflow_dispatch:", on_block)
        self.assertNotIn("schedule:", on_block)
        self.assertNotIn("pull_request:", on_block)
        self.assertNotRegex(on_block, r"(?m)^\s*push:\s*$")

    def test_unresolved_fail_fast_and_max_parallel(self):
        produce_a = self.text.split("  produce_a:")[1].split("  produce_b:")[0]
        self.assertIn("fail-fast: false", produce_a)
        self.assertIn("max-parallel: 2", produce_a)
        self.assertIn("generate-unresolved", produce_a)
        produce_b = self.text.split("  produce_b:")[1].split("  report:")[0]
        self.assertIn("fail-fast: false", produce_b)
        self.assertIn("max-parallel: 2", produce_b)

    def test_full_300_selection_unchanged(self):
        self.assertIn("matrix_a = filtered[:150]", self.text)
        self.assertIn("matrix_b = filtered[150:]", self.text)
        self.assertIn("assert len(approved) == 300", self.text)

    def test_production_command_preserved(self):
        self.assertIn(
            'python3 remotion/scripts/build-lesson.py "$LID" \\\n'
            '            --locale "$LOCALE" \\\n'
            '            --package-path "$LESSON_PACKAGE_PATH" \\\n'
            "            --force-script",
            self.text,
        )

    def test_source_pins_preserved(self):
        self.assertIn(
            "FULL_300_SOURCE_SHA: 69ba815e256d6f46382c9f0fa901bb3fea88c85b", self.text
        )
        self.assertIn(
            "SOURCE_SHA: 6cfd019d315ec3f5a30ffc83bd551f4deb52385c", self.text
        )
        self.assertIn(
            "REPAIR_SOURCE_SHA: 71fbe483b931cba91bedb1feadb1941092518890", self.text
        )
        self.assertIn(
            "needs.plan.outputs.run_mode == 'generate-unresolved' && '71fbe483b931cba91bedb1feadb1941092518890' || '69ba815e256d6f46382c9f0fa901bb3fea88c85b'",
            self.text,
        )

    def test_artifact_and_finalization_path_preserved(self):
        self.assertIn("finalize_cell_cli.py", self.text)
        self.assertIn("production-result", self.text)
        self.assertIn("video-results--${BATCH_ID}--${COMPOSITE_KEY}", self.text)
        self.assertIn("plan_generate_unresolved_cli.py", self.text)

    def test_mapping_promotion_separate(self):
        self.assertIn("promote_finalized_mappings_cli.py", self.text)
        unresolved = self.text.split("  unresolved_plan:")[1].split("  recover_cells:")[0]
        self.assertNotIn("promote_finalized_mappings", unresolved)
        self.assertNotIn("build-lesson.py", unresolved)

    def test_yaml_parses(self):
        self.assertIsInstance(self.doc, dict)
        self.assertIn("jobs", self.doc)
        # PyYAML may parse bare `on:` as boolean True (YAML 1.1).
        on = self.doc.get("on", self.doc.get(True))
        self.assertIsInstance(on, dict)
        modes = on["workflow_dispatch"]["inputs"]["run_mode"]["options"]
        self.assertIn("generate-unresolved", modes)
        self.assertEqual(
            on["workflow_dispatch"]["inputs"]["run_mode"]["default"],
            "preflight-one",
        )


if __name__ == "__main__":
    unittest.main()
