"""Deterministic plan for recover-uploaded-receipts mode."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

from .constants import (
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    BATCH_ID,
    FULL_300_SOURCE_SHA_PIN,
    receipt_relpath,
)
from .receipt import ReceiptError, validate_receipt

RECOVERY_WORKFLOW_RUN_ID = "29407852029"
RECOVERY_SOURCE_SHA = FULL_300_SOURCE_SHA_PIN
ARTIFACT_NAME_RE = re.compile(
    rf"^full-300-{RECOVERY_SOURCE_SHA}-(ar-Gulf|ar-MSA|en)-(.+)$"
)

EXPECTED_AUTHORITATIVE = 300
EXPECTED_ARTIFACTS = 268
EXPECTED_FINALIZED = 190
EXPECTED_OVERLAP = 189
EXPECTED_CARRY_FORWARD_OUTSIDE = 1
EXPECTED_RECOVERY = 79
EXPECTED_REGENERATION = 31
EXPECTED_ARTIFACT_ONLY_UNRESOLVED = 0

LOCALIZED_LOCALES = frozenset({"en", "ar-MSA", "ar-Gulf"})


class RecoveryPlanError(ValueError):
    pass


@dataclass
class ParsedArtifact:
    name: str
    artifact_id: str
    locale: str
    lesson_id: str
    logical_key: str
    workflow_run_id: str = RECOVERY_WORKFLOW_RUN_ID
    source_sha: str = RECOVERY_SOURCE_SHA
    batch_id: str = BATCH_ID

    def as_matrix_cell(self) -> dict[str, str]:
        return {
            "batchId": self.batch_id,
            "logicalKey": self.logical_key,
            "lessonId": self.lesson_id,
            "locale": self.locale,
            "sourceSha": self.source_sha,
            "workflowRunId": self.workflow_run_id,
            "artifactId": self.artifact_id,
            "artifactName": self.name,
            "compositeKey": self.logical_key,
            "LID": self.lesson_id,
            "LOCALE": self.locale,
        }


@dataclass
class RecoveryPlan:
    authoritative_keys: list[str]
    artifact_keys: list[str]
    finalized_keys: list[str]
    recovery_cells: list[dict[str, str]]
    regeneration_keys: list[str]
    overlap_keys: list[str]
    carry_forward_outside_artifact: list[str]
    details: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "batchId": BATCH_ID,
            "sourceSha": RECOVERY_SOURCE_SHA,
            "workflowRunId": RECOVERY_WORKFLOW_RUN_ID,
            "authoritativeCount": len(self.authoritative_keys),
            "artifactCount": len(self.artifact_keys),
            "finalizedCount": len(self.finalized_keys),
            "overlapCount": len(self.overlap_keys),
            "carryForwardOutsideArtifactCount": len(self.carry_forward_outside_artifact),
            "recoveryCount": len(self.recovery_cells),
            "regenerationCount": len(self.regeneration_keys),
            "artifactOnlyUnresolvedCount": 0,
            "recoveryMatrix": self.recovery_cells,
            "regenerationKeys": self.regeneration_keys,
            "carryForwardOutsideArtifact": self.carry_forward_outside_artifact,
            "details": self.details,
        }


def load_authoritative_logical_keys(repo_root: Path) -> list[str]:
    locales = ("ar-MSA", "ar-Gulf", "en")
    keys: list[str] = []
    for locale in locales:
        if locale == "ar-EG":
            raise RecoveryPlanError("ar-EG locale forbidden")
        manifest_path = repo_root / "src" / "lib" / "locale-lessons" / locale / "manifest.json"
        if not manifest_path.is_file():
            raise RecoveryPlanError(f"missing manifest: {manifest_path}")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        lesson_ids = manifest.get("lessonIds") or []
        if len(lesson_ids) != 100:
            raise RecoveryPlanError(f"{locale} expected 100 lessons, got {len(lesson_ids)}")
        for lesson_id in lesson_ids:
            key = f"{lesson_id}__{locale}"
            keys.append(key)
    if len(keys) != EXPECTED_AUTHORITATIVE:
        raise RecoveryPlanError(f"authoritative keys {len(keys)} != {EXPECTED_AUTHORITATIVE}")
    if len(set(keys)) != EXPECTED_AUTHORITATIVE:
        raise RecoveryPlanError("authoritative keys are not unique")
    if sum(k.endswith("__en") for k in keys) != 100:
        raise RecoveryPlanError("en count != 100")
    if sum(k.endswith("__ar-MSA") for k in keys) != 100:
        raise RecoveryPlanError("ar-MSA count != 100")
    if sum(k.endswith("__ar-Gulf") for k in keys) != 100:
        raise RecoveryPlanError("ar-Gulf count != 100")
    if any("__ar-EG" in k for k in keys):
        raise RecoveryPlanError("ar-EG composite key present")
    return keys


def parse_artifact_name(name: str) -> tuple[str, str, str]:
    """Return (locale, lesson_id, logical_key)."""
    match = ARTIFACT_NAME_RE.match(name)
    if not match:
        raise RecoveryPlanError(f"malformed or rejected artifact name: {name!r}")
    locale, lesson_id = match.group(1), match.group(2)
    if locale not in LOCALIZED_LOCALES:
        raise RecoveryPlanError(f"unexpected locale: {locale!r}")
    if locale == "ar-EG":
        raise RecoveryPlanError("ar-EG artifact rejected")
    if not lesson_id or "/" in lesson_id or "\\" in lesson_id:
        raise RecoveryPlanError(f"invalid lessonId in artifact name: {lesson_id!r}")
    logical_key = f"{lesson_id}__{locale}"
    return locale, lesson_id, logical_key


def index_artifacts(
    artifacts: Iterable[dict[str, Any]],
    *,
    authoritative: set[str],
    workflow_run_id: str = RECOVERY_WORKFLOW_RUN_ID,
) -> dict[str, ParsedArtifact]:
    by_key: dict[str, ParsedArtifact] = {}
    seen_ids: set[str] = set()
    for item in artifacts:
        name = str(item.get("name") or "")
        artifact_id = str(item.get("id") or item.get("artifactId") or "")
        if not artifact_id:
            raise RecoveryPlanError(f"missing immutable artifact id for {name!r}")
        if artifact_id in seen_ids:
            raise RecoveryPlanError(f"duplicate artifact id: {artifact_id}")
        seen_ids.add(artifact_id)
        locale, lesson_id, logical_key = parse_artifact_name(name)
        if logical_key not in authoritative:
            raise RecoveryPlanError(f"unexpected authoritative key: {logical_key}")
        if logical_key in by_key:
            raise RecoveryPlanError(f"duplicate artifact logical key: {logical_key}")
        by_key[logical_key] = ParsedArtifact(
            name=name,
            artifact_id=artifact_id,
            locale=locale,
            lesson_id=lesson_id,
            logical_key=logical_key,
            workflow_run_id=workflow_run_id,
        )
    return by_key


def collect_finalized_logical_keys(
    *,
    receipt_roots: list[Path],
    authoritative: set[str],
    batch_id: str = BATCH_ID,
) -> set[str]:
    finalized: set[str] = set()
    for root in receipt_roots:
        for key in authoritative:
            path = root / receipt_relpath(batch_id, key)
            if not path.is_file():
                # Also allow root named after logical key with receipt inside
                continue
            try:
                receipt = json.loads(path.read_text(encoding="utf-8"))
                validate_receipt(receipt)
            except (json.JSONDecodeError, ReceiptError) as e:
                raise RecoveryPlanError(f"invalid receipt for {key}: {e}") from e
            if receipt.get("logicalKey") != key:
                raise RecoveryPlanError(f"receipt logicalKey mismatch for {key}")
            if receipt.get("batchId") != batch_id:
                raise RecoveryPlanError(f"receipt batchId mismatch for {key}")
            if receipt.get("validationStatus") != "finalized":
                raise RecoveryPlanError(f"receipt not finalized for {key}")
            if not receipt.get("bunnyGuid"):
                raise RecoveryPlanError(f"receipt missing bunnyGuid for {key}")
            if key in finalized:
                raise RecoveryPlanError(f"duplicate finalized receipt for {key}")
            finalized.add(key)

        # Support layout: receipt_roots children named by logical key
        if root.name in authoritative:
            path = root / receipt_relpath(batch_id, root.name)
            if path.is_file() and root.name not in finalized:
                try:
                    receipt = json.loads(path.read_text(encoding="utf-8"))
                    validate_receipt(receipt)
                except (json.JSONDecodeError, ReceiptError) as e:
                    raise RecoveryPlanError(f"invalid receipt for {root.name}: {e}") from e
                if receipt.get("logicalKey") != root.name:
                    raise RecoveryPlanError(f"receipt logicalKey mismatch for {root.name}")
                if receipt.get("validationStatus") != "finalized":
                    raise RecoveryPlanError(f"receipt not finalized for {root.name}")
                finalized.add(root.name)
    return finalized


def build_recovery_plan(
    *,
    authoritative_keys: list[str],
    artifacts: Iterable[dict[str, Any]],
    finalized_keys: Iterable[str],
    workflow_run_id: str = RECOVERY_WORKFLOW_RUN_ID,
) -> RecoveryPlan:
    auth_set = set(authoritative_keys)
    if len(authoritative_keys) != EXPECTED_AUTHORITATIVE or len(auth_set) != EXPECTED_AUTHORITATIVE:
        raise RecoveryPlanError("authoritative set invalid")

    artifact_index = index_artifacts(
        artifacts, authoritative=auth_set, workflow_run_id=workflow_run_id
    )
    artifact_keys = sorted(artifact_index)
    finalized = set(finalized_keys)
    unexpected_finalized = finalized - auth_set
    if unexpected_finalized:
        raise RecoveryPlanError(f"finalized keys outside authoritative set: {sorted(unexpected_finalized)[:5]}")

    overlap = sorted(set(artifact_keys) & finalized)
    carry_outside = sorted(finalized - set(artifact_keys))
    recovery_keys = sorted(set(artifact_keys) - finalized)
    regeneration = sorted(auth_set - (set(artifact_keys) | finalized))
    artifact_only = sorted(set(artifact_keys) - finalized - set(recovery_keys))
    # recovery_keys == artifact - finalized, so artifact_only unresolved should be empty
    if artifact_only:
        raise RecoveryPlanError("internal artifact-only unresolved inconsistency")

    if len(artifact_keys) != EXPECTED_ARTIFACTS:
        raise RecoveryPlanError(f"artifacts {len(artifact_keys)} != {EXPECTED_ARTIFACTS}")
    if len(finalized) != EXPECTED_FINALIZED:
        raise RecoveryPlanError(f"finalized {len(finalized)} != {EXPECTED_FINALIZED}")
    if len(overlap) != EXPECTED_OVERLAP:
        raise RecoveryPlanError(f"overlap {len(overlap)} != {EXPECTED_OVERLAP}")
    if len(carry_outside) != EXPECTED_CARRY_FORWARD_OUTSIDE:
        raise RecoveryPlanError(
            f"carry-forward outside artifacts {len(carry_outside)} != {EXPECTED_CARRY_FORWARD_OUTSIDE}"
        )
    if carry_outside != [ACCEPTED_CARRY_FORWARD_LOGICAL_KEY]:
        raise RecoveryPlanError(
            f"carry-forward outside artifacts must be exactly "
            f"[{ACCEPTED_CARRY_FORWARD_LOGICAL_KEY}], got {carry_outside}"
        )
    if len(recovery_keys) != EXPECTED_RECOVERY:
        raise RecoveryPlanError(f"recovery {len(recovery_keys)} != {EXPECTED_RECOVERY}")
    if len(regeneration) != EXPECTED_REGENERATION:
        raise RecoveryPlanError(f"regeneration {len(regeneration)} != {EXPECTED_REGENERATION}")
    if EXPECTED_ARTIFACT_ONLY_UNRESOLVED != 0:
        raise RecoveryPlanError("artifact-only unresolved contract violated")

    # Exclusion proofs
    if set(recovery_keys) & finalized:
        raise RecoveryPlanError("recovery set intersects finalized receipts")
    if set(recovery_keys) & set(regeneration):
        raise RecoveryPlanError("recovery set intersects regeneration")
    if finalized & set(regeneration):
        raise RecoveryPlanError("finalized intersects regeneration")

    cells = [artifact_index[k].as_matrix_cell() for k in recovery_keys]
    if len({c["logicalKey"] for c in cells}) != EXPECTED_RECOVERY:
        raise RecoveryPlanError("recovery matrix has duplicate logical keys")
    if any(c["locale"] == "ar-EG" for c in cells):
        raise RecoveryPlanError("ar-EG in recovery matrix")

    return RecoveryPlan(
        authoritative_keys=list(authoritative_keys),
        artifact_keys=artifact_keys,
        finalized_keys=sorted(finalized),
        recovery_cells=cells,
        regeneration_keys=regeneration,
        overlap_keys=overlap,
        carry_forward_outside_artifact=carry_outside,
    )
