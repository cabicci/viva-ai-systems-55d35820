"""Static regression: finalize-one control checkout contract."""
from __future__ import annotations

import re
import unittest
from pathlib import Path

WORKFLOW = (
    Path(__file__).resolve().parents[2] / "workflows" / "video-production-batch.yml"
)
WORKFLOW_TEXT = WORKFLOW.read_text(encoding="utf-8")


def _job_block(text: str, job_name: str, *, end_markers: tuple[str, ...]) -> str:
    start = text.index(f"  {job_name}:")
    end = len(text)
    for marker in end_markers:
        pos = text.find(marker, start + 1)
        if pos != -1:
            end = min(end, pos)
    return text[start:end]


def _finalize_one_block(text: str) -> str:
    return _job_block(text, "finalize_one", end_markers=("\n  produce_a:", "\n  recovery_plan:"))


def _produce_block(text: str, job_name: str) -> str:
    if job_name == "produce_a":
        end_markers = ("\n  produce_b:",)
    else:
        end_markers = ("\n  report:", "\n  recover_cells:")
    return _job_block(text, job_name, end_markers=end_markers)


def _report_block(text: str) -> str:
    start = text.index("  report:")
    return text[start:]


class FinalizeOneWorkflowCheckoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.block = _finalize_one_block(WORKFLOW_TEXT)

    def test_control_checkout_uses_dispatched_github_sha(self):
        self.assertIn("Check out dispatched workflow control scripts", self.block)
        self.assertRegex(
            self.block,
            r"Check out dispatched workflow control scripts[\s\S]*?ref: \$\{\{ github\.sha \}\}",
        )

    def test_control_workspace_not_overwritten_by_source_sha(self):
        # Primary checkout must not bind workspace root to SOURCE_SHA.
        primary = self.block.split("Check out immutable production SOURCE_SHA")[0]
        self.assertNotRegex(primary, r"ref: \$\{\{ env\.SOURCE_SHA \}\}")

    def test_source_sha_isolated_read_only_path(self):
        self.assertIn("path: source-baseline", self.block)
        self.assertRegex(
            self.block,
            r"Check out immutable production SOURCE_SHA[\s\S]*?ref: \$\{\{ env\.SOURCE_SHA \}\}",
        )

    def test_required_control_scripts_exist_step(self):
        for path in (
            ".github/scripts/verify_finalize_one_pins.py",
            ".github/scripts/finalize_cell_cli.py",
            ".github/scripts/check_finalized_receipt.py",
            ".github/scripts/collect_finalization_cli.py",
            ".github/scripts/video_finalize/finalize_cell.py",
        ):
            self.assertIn(path, self.block)

    def test_pinned_source_sha_fail_closed(self):
        self.assertIn('test "$SOURCE_SHA" = "6cfd019d315ec3f5a30ffc83bd551f4deb52385c"', self.block)

    def test_accepted_artifact_pins_unchanged(self):
        self.assertIn('WORKFLOW_RUN_ID: "29296309474"', self.block)
        self.assertIn('ARTIFACT_ID: "8296996512"', self.block)
        self.assertIn(
            'ARTIFACT_DIGEST: "sha256:3dd0f69515d9fa8a551518c0d42395623d3d00202355817f0d434ec68bb16175"',
            self.block,
        )
        self.assertIn("COMPOSITE_KEY: analyst-m3-l2-ai-summarization__en", self.block)

    def test_finalize_one_retains_source_sha_not_full_300_pin(self):
        self.assertNotIn("FULL_300_SOURCE_SHA", self.block)
        self.assertRegex(
            self.block,
            r"Check out immutable production SOURCE_SHA[\s\S]*?ref: \$\{\{ env\.SOURCE_SHA \}\}",
        )


class Full300ProductionPinWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW_TEXT
        cls.produce_a = _produce_block(WORKFLOW_TEXT, "produce_a")
        cls.produce_b = _produce_block(WORKFLOW_TEXT, "produce_b")
        cls.report = _report_block(WORKFLOW_TEXT)

    def test_global_pins_declared(self):
        self.assertIn("SOURCE_SHA: 6cfd019d315ec3f5a30ffc83bd551f4deb52385c", self.text)
        self.assertIn(
            "FULL_300_SOURCE_SHA: 69ba815e256d6f46382c9f0fa901bb3fea88c85b",
            self.text,
        )
        self.assertIn(
            "REPAIR_SOURCE_SHA: 71fbe483b931cba91bedb1feadb1941092518890",
            self.text,
        )

    def test_produce_jobs_checkout_and_verify_full_300_pin(self):
        for block in (self.produce_a, self.produce_b):
            with self.subTest(job=block.split(":")[0].strip()):
                self.assertIn("Check out immutable production source baseline", block)
                self.assertIn(
                    "needs.plan.outputs.run_mode == 'generate-unresolved' && '71fbe483b931cba91bedb1feadb1941092518890' || '69ba815e256d6f46382c9f0fa901bb3fea88c85b'",
                    block,
                )
                self.assertIn("Verify pinned production source SHA", block)
                self.assertIn(
                    'test "$FULL_300_SOURCE_SHA" = "69ba815e256d6f46382c9f0fa901bb3fea88c85b"',
                    block,
                )
                self.assertIn(
                    'test "$REPAIR_SOURCE_SHA" = "71fbe483b931cba91bedb1feadb1941092518890"',
                    block,
                )
                self.assertIn('test "$(git rev-parse HEAD)" = "$EXPECTED"', block)
                self.assertIn(
                    "SOURCE_SHA: ${{ needs.plan.outputs.run_mode == 'generate-unresolved' && '71fbe483b931cba91bedb1feadb1941092518890' || '69ba815e256d6f46382c9f0fa901bb3fea88c85b' }}",
                    block,
                )
                self.assertIn(
                    "PRODUCTION_SOURCE_SHA: ${{ needs.plan.outputs.run_mode == 'generate-unresolved' && '71fbe483b931cba91bedb1feadb1941092518890' || '69ba815e256d6f46382c9f0fa901bb3fea88c85b' }}",
                    block,
                )

    def test_collect_report_checkout_and_verify_full_300_pin(self):
        self.assertRegex(
            self.report,
            r"Check out immutable production source baseline[\s\S]*?"
            r"ref: \$\{\{ env\.FULL_300_SOURCE_SHA \}\}",
        )
        self.assertIn("Verify pinned full-300 production source SHA", self.report)
        self.assertIn("source_sha=${{ env.FULL_300_SOURCE_SHA }}", self.report)
        self.assertIn("source_sha=${{ env.REPAIR_SOURCE_SHA }}", self.report)
        self.assertIn(
            "pattern: full-300-${{ needs.plan.outputs.run_mode == 'generate-unresolved' && '71fbe483b931cba91bedb1feadb1941092518890' || '69ba815e256d6f46382c9f0fa901bb3fea88c85b' }}-*",
            self.report,
        )

    def test_receipt_guard_before_paid_steps(self):
        for block in (self.produce_a, self.produce_b):
            with self.subTest(job=block.split(":")[0].strip()):
                skip_pos = block.index("Skip paid generation when durable finalized receipt matches")
                gemini_pos = block.index("Generate localized video (Gemini script")
                self.assertLess(skip_pos, gemini_pos)
                self.assertIn("if: steps.receipt_skip.outputs.skip != 'true'", block)

    def test_production_generation_command_unchanged(self):
        expected = (
            'python3 remotion/scripts/build-lesson.py "$LID" \\\n'
            "            --locale \"$LOCALE\" \\\n"
            "            --package-path \"$LESSON_PACKAGE_PATH\" \\\n"
            "            --force-script"
        )
        self.assertEqual(self.produce_a.count(expected), 1)
        self.assertEqual(self.produce_b.count(expected), 1)

    def test_matrix_invariants_in_plan(self):
        self.assertIn("assert len(approved) == 300", self.text)
        self.assertIn('max-parallel: 2', self.produce_a)
        self.assertIn("fail-fast: false", self.produce_a)


class ReportMappingPromotionWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.text = WORKFLOW_TEXT
        cls.report = _report_block(WORKFLOW_TEXT)
        cls.produce_a = _produce_block(WORKFLOW_TEXT, "produce_a")

    def test_report_remains_always(self):
        self.assertIn("always()", self.report)
        self.assertIn("needs.plan.outputs.run_mode == 'full-300'", self.report)
        self.assertIn(
            "needs.plan.outputs.run_mode == 'generate-unresolved'", self.report
        )

    def test_only_report_writes_canonical_registry(self):
        self.assertIn("permissions:\n      contents: write", self.report)
        self.assertIn("Promote validated finalized receipts to canonical registry", self.report)
        self.assertIn("PUSH_TO_MAIN: \"true\"", self.report)
        self.assertIn("promote_finalized_mappings_cli.py", self.report)
        self.assertNotIn("PUSH_TO_MAIN", self.produce_a)

    def test_dispatched_sha_control_checkout_verified(self):
        self.assertIn("path: control-code", self.report)
        self.assertIn("ref: ${{ github.sha }}", self.report)
        self.assertIn('test "$(git -C control-code rev-parse HEAD)" = "${{ github.sha }}"', self.report)

    def test_mapping_promotion_before_unresolved_failure(self):
        promote_pos = self.report.index("Promote validated finalized receipts to canonical registry")
        fail_pos = self.report.index("Fail when unresolved cells remain after registry promotion")
        self.assertLess(promote_pos, fail_pos)

    def test_full_300_source_sha_unchanged(self):
        self.assertIn(
            "FULL_300_SOURCE_SHA: 69ba815e256d6f46382c9f0fa901bb3fea88c85b",
            self.text,
        )
        self.assertIn('test "$FULL_300_SOURCE_SHA" = "69ba815e256d6f46382c9f0fa901bb3fea88c85b"', self.report)

    def test_no_automatic_workflow_trigger_added(self):
        self.assertIn("workflow_dispatch:", self.text)
        self.assertNotIn("schedule:", self.text)
        self.assertNotIn("push:", self.text.split("on:")[1].split("jobs:")[0])

    def test_matrix_and_parallel_invariants(self):
        self.assertIn("matrix_a = filtered[:150]", self.text)
        self.assertIn("matrix_b = filtered[150:]", self.text)
        self.assertIn('max-parallel: 2', self.produce_a)
        self.assertIn("fail-fast: false", self.produce_a)


if __name__ == "__main__":
    unittest.main()
