#!/usr/bin/env python3
"""Promote validated finalized receipts into the canonical bunny registry."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.mapping_promotion import (  # noqa: E402
    REGISTRY_REL_PATH,
    MappingPromotionError,
    apply_promotions_to_registry,
    build_promotion_plan,
    push_registry_updates,
)


def main() -> int:
    batch_id = os.environ["BATCH_ID"]
    expected = json.loads(os.environ["EXPECTED_LOGICAL_KEYS_JSON"])
    fetch_dir = Path(os.environ.get("RESULTS_FETCH_DIR", "/tmp/result-branches"))
    registry_path = Path(os.environ.get("REGISTRY_PATH", REGISTRY_REL_PATH))
    mapping_repo = os.environ.get("MAPPING_REPO")
    remote_url = os.environ.get("MAPPING_REMOTE_URL", "")
    dispatched_sha = os.environ.get("DISPATCHED_SHA", "")
    push_to_main = os.environ.get("PUSH_TO_MAIN", "false").lower() == "true"

    receipt_roots: list[Path] = []
    if fetch_dir.is_dir():
        for child in sorted(fetch_dir.iterdir()):
            if child.is_dir():
                receipt_roots.append(child)

    plan = build_promotion_plan(
        expected_logical_keys=expected,
        receipt_roots=receipt_roots,
        batch_id=batch_id,
    )
    payload = plan.as_dict()
    payload["allResolved"] = len(plan.unresolved_keys(expected)) == 0
    payload["unresolvedLogicalKeys"] = plan.unresolved_keys(expected)
    print(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True))

    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"promotable_count={plan.promotable_count}\n")
            f.write(
                "all_resolved="
                + ("true" if payload["allResolved"] else "false")
                + "\n"
            )
            f.write(
                "unresolved_keys="
                + ",".join(payload["unresolvedLogicalKeys"])
                + "\n"
            )

    if plan.promotable and registry_path.is_file() and not push_to_main:
        original = registry_path.read_text(encoding="utf-8")
        apply_result = apply_promotions_to_registry(original, plan.promotable)
        if apply_result.changed:
            registry_path.write_text(apply_result.text, encoding="utf-8")
            payload["registryUpdated"] = True
            payload["updatedRegistryKeys"] = apply_result.updated_keys
        else:
            payload["registryUpdated"] = False

    if push_to_main and plan.promotable:
        if not mapping_repo or not remote_url or not dispatched_sha:
            print("::error::PUSH_TO_MAIN requires MAPPING_REPO, MAPPING_REMOTE_URL, DISPATCHED_SHA")
            return 40
        try:
            push_result = push_registry_updates(
                repo_dir=Path(mapping_repo),
                promotions=plan.promotable,
                registry_rel_path=REGISTRY_REL_PATH,
                remote_url=remote_url,
                dispatched_sha=dispatched_sha,
                commit_message=os.environ.get(
                    "MAPPING_COMMIT_MESSAGE",
                    "chore(video): promote finalized localized mappings",
                ),
            )
            print(
                json.dumps(
                    {
                        "push": {
                            "pushed": push_result.pushed,
                            "commitSha": push_result.commit_sha,
                            "retries": push_result.retries,
                            "message": push_result.message,
                        }
                    },
                    indent=2,
                )
            )
        except MappingPromotionError as e:
            print(f"::error::{e}")
            return 41

    if not payload["allResolved"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
