"""Static regression: finalize-one control checkout contract."""
from __future__ import annotations

import re
import unittest
from pathlib import Path

WORKFLOW = (
    Path(__file__).resolve().parents[2] / "workflows" / "video-production-batch.yml"
)


def _finalize_one_block(text: str) -> str:
    start = text.index("  finalize_one:")
    end = text.index("\n  produce_a:", start)
    return text[start:end]


class FinalizeOneWorkflowCheckoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.block = _finalize_one_block(WORKFLOW.read_text(encoding="utf-8"))

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


if __name__ == "__main__":
    unittest.main()
