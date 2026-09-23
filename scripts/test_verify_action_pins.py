"""Focused coverage for YAML extraction and immutable action validation."""

import unittest

import yaml

from verify_action_pins import validate_document


SHA = "11d5960a326750d5838078e36cf38b85af677262"


class WorkflowPinsTests(unittest.TestCase):
    def test_accepts_block_flow_and_reusable_workflow_sha(self):
        document = yaml.safe_load(f"""
jobs:
  build:
    steps:
      - uses: actions/checkout@{SHA}
      - {{uses: actions/checkout@{SHA}}}
      - uses: ./local-action
  reuse:
    uses: owner/repo/.github/workflows/ci.yml@{SHA}
""")
        count, errors = validate_document(document, "fixture.yml")
        self.assertEqual(count, 3)
        self.assertEqual(errors, [])

    def test_rejects_mutable_tag_in_flow_mapping(self):
        document = yaml.safe_load("jobs: {build: {steps: [{uses: actions/checkout@v4}]}}")
        count, errors = validate_document(document, "fixture.yml")
        self.assertEqual(count, 1)
        self.assertEqual(errors, ["fixture.yml: 'actions/checkout@v4'"])

    def test_rejects_unpinned_reusable_workflow(self):
        document = yaml.safe_load("jobs: {reuse: {uses: owner/repo/.github/workflows/ci.yml@main}}")
        _, errors = validate_document(document, "fixture.yml")
        self.assertEqual(len(errors), 1)


if __name__ == "__main__":
    unittest.main()
