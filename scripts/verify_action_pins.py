"""Reject mutable GitHub Actions references in parsed workflow YAML."""

from pathlib import Path
import re
import sys

import yaml

WORKFLOWS = Path(__file__).resolve().parent.parent / ".github" / "workflows"
PIN = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*@[0-9a-f]{40}$")


def action_refs(node):
    """Include step actions and reusable workflows, even in flow mappings."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "uses":
                yield value
            else:
                yield from action_refs(value)
    elif isinstance(node, list):
        for value in node:
            yield from action_refs(value)


def validate_document(document, filename):
    failures = []
    checked = 0
    for ref in action_refs(document):
        if isinstance(ref, str) and (ref.startswith("./") or ref.startswith("docker://")):
            continue
        checked += 1
        if not isinstance(ref, str) or not PIN.fullmatch(ref):
            failures.append(f"{filename}: {ref!r}")
    return checked, failures


def main():
    failures = []
    checked = 0
    for workflow in sorted((*WORKFLOWS.glob("*.yml"), *WORKFLOWS.glob("*.yaml"))):
        try:
            document = yaml.safe_load(workflow.read_text(encoding="utf-8"))
        except yaml.YAMLError as error:
            failures.append(f"{workflow.name}: invalid YAML: {error}")
            continue
        count, errors = validate_document(document, workflow.name)
        checked += count
        failures.extend(errors)
    if failures:
        print("Invalid or mutable action references:\n" + "\n".join(failures), file=sys.stderr)
        return 1
    print(f"Verified {checked} immutable action references")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
