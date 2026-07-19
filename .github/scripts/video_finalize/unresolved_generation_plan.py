"""Deterministic planner for generate-unresolved production mode.

Selects only approved unresolved localized cells:
  authoritative 300 − validated finalized receipts
intersected with the immutable approved allowlist (ordered).
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .constants import (
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    BATCH_ID,
    FULL_300_SOURCE_SHA_PIN,
    SOURCE_SHA_PIN,
    receipt_relpath,
)
from .mapping_promotion import is_valid_uuid
from .receipt import ReceiptError, validate_receipt
from .recovery_plan import load_authoritative_logical_keys

# Immutable production source for the repaired final-three generation path.
# Historical receipts remain accepted under FULL_300_SOURCE_SHA_PIN / carry-forward.
REPAIR_SOURCE_SHA_PIN = "71fbe483b931cba91bedb1feadb1941092518890"
ACCEPTED_FINALIZED_SOURCE_SHAS = frozenset(
    {
        FULL_300_SOURCE_SHA_PIN,
        REPAIR_SOURCE_SHA_PIN,
    }
)

# Immutable approved generation universe (deterministic order).
# Locale order: en → ar-MSA → ar-Gulf; within locale: manifest lesson order.
APPROVED_UNRESOLVED_KEYS: tuple[str, ...] = (
    "builder-m6-l5-iteration__en",
    "business-m1-l2-reactive-vs-proactive__en",
    "creator-m3-l1-hook__en",
    "creator-m3-l2-script-structure__en",
    "creator-m4-repurposing__en",
    "intro-m1-l1-what-is-ai__en",
    "intro-m1-l6-learn-without-fear__en",
    "intro-m1-l7-choose-your-path__en",
    "builder-m10-l1-deploy-domain__ar-MSA",
    "builder-m5-l5-mini-win__ar-MSA",
    "business-m4-l2-reactive-relapse__ar-MSA",
    "analyst-m2-l2-right-question-rule__ar-Gulf",
    "analyst-m5-l1-four-numbers-dashboard__ar-Gulf",
    "automator-m3-l3-filters-routers__ar-Gulf",
    "automator-m3-testing-automation__ar-Gulf",
    "automator-m4-l1-connect-database__ar-Gulf",
    "automator-m4-l2-webhooks-api__ar-Gulf",
    "automator-m5-l1-llm-in-flow__ar-Gulf",
    "automator-m7-l1-closing-loop__ar-Gulf",
    "builder-m10-l1-deploy-domain__ar-Gulf",
    "builder-m2-l1-prompt-layer__ar-Gulf",
    "builder-m5-l4-database-intro__ar-Gulf",
    "builder-m6-l1-idea-to-page__ar-Gulf",
    "builder-m6-l2-wireframe__ar-Gulf",
    "builder-m7-l3-queries__ar-Gulf",
    "builder-m8-l2-rls__ar-Gulf",
    "creator-m3-l2-script-structure__ar-Gulf",
    "creator-m3-l3-cta__ar-Gulf",
    "creator-m4-l1-reality-check__ar-Gulf",
    "intro-m1-l1-what-is-ai__ar-Gulf",
    "intro-m1-l3-setup-your-ai__ar-Gulf",
)

EXPECTED_APPROVED_COUNT = 31
EXPECTED_APPROVED_LOCALES = {"en": 8, "ar-MSA": 3, "ar-Gulf": 20}
EXPECTED_BASELINE_FINALIZED = 269  # authoritative 300 − approved 31
LOCALIZED_LOCALES = frozenset({"en", "ar-MSA", "ar-Gulf"})

VOICE_PROFILES = {
    "ar-MSA": "gemini-ar-msa-formal",
    "ar-Gulf": "gemini-ar-gulf",
    "en": "gemini-en-narrator",
}


class UnresolvedPlanError(ValueError):
    pass


def _receipt_matches_carry_forward(receipt: dict[str, Any]) -> bool:
    return all(
        receipt.get(field) == expected
        for field, expected in ACCEPTED_CARRY_FORWARD_CELL.items()
    )


def validate_receipt_for_unresolved_exclusion(
    receipt: dict[str, Any],
    *,
    logical_key: str,
    expected_logical_keys: set[str],
    branch_logical_key: str | None = None,
) -> tuple[str | None, str | None]:
    """Accept finalized receipts under exact historical + repair source pins only.

    Fail closed for unknown sourceSha values (no generic bypass).
    """
    try:
        validate_receipt(receipt)
    except ReceiptError as e:
        return None, str(e)

    if logical_key not in expected_logical_keys:
        return None, "logical key not in expected manifest"
    if receipt.get("logicalKey") != logical_key:
        return None, "receipt logicalKey mismatch"
    if branch_logical_key is not None and branch_logical_key != logical_key:
        return None, "receipt branch identity mismatch"
    if receipt.get("batchId") != BATCH_ID:
        return None, "batchId mismatch"
    if receipt.get("validationStatus") != "finalized":
        return None, "validationStatus must be finalized"

    locale = str(receipt.get("locale") or "")
    lesson_id = str(receipt.get("lessonId") or "")
    if locale not in LOCALIZED_LOCALES:
        return None, f"locale {locale!r} not promotable"
    if locale == "ar-EG":
        return None, "ar-EG receipt not promotable"
    if f"{lesson_id}__{locale}" != logical_key:
        return None, "lessonId/locale disagree with logical key"

    guid = str(receipt.get("bunnyGuid") or "")
    if not is_valid_uuid(guid):
        return None, "bunnyGuid is not a valid UUID"

    if logical_key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
        if not _receipt_matches_carry_forward(receipt):
            return None, "accepted carry-forward identity mismatch"
        if receipt.get("sourceSha") != SOURCE_SHA_PIN:
            return None, "accepted carry-forward sourceSha mismatch"
    elif receipt.get("sourceSha") not in ACCEPTED_FINALIZED_SOURCE_SHAS:
        return None, "sourceSha not in accepted historical/repair set"

    return guid, None


def _locale_of(logical_key: str) -> str:
    if "__" not in logical_key:
        raise UnresolvedPlanError(f"malformed logical key: {logical_key!r}")
    lesson_id, locale = logical_key.rsplit("__", 1)
    if not lesson_id or not locale:
        raise UnresolvedPlanError(f"malformed logical key: {logical_key!r}")
    if locale == "ar-EG" or locale not in LOCALIZED_LOCALES:
        raise UnresolvedPlanError(f"unsupported locale in key: {logical_key!r}")
    return locale


def assert_approved_universe() -> None:
    keys = APPROVED_UNRESOLVED_KEYS
    if len(keys) != EXPECTED_APPROVED_COUNT:
        raise UnresolvedPlanError(
            f"approved universe count {len(keys)} != {EXPECTED_APPROVED_COUNT}"
        )
    if len(set(keys)) != EXPECTED_APPROVED_COUNT:
        raise UnresolvedPlanError("approved universe keys are not unique")
    dist = Counter(_locale_of(k) for k in keys)
    if dict(dist) != EXPECTED_APPROVED_LOCALES:
        raise UnresolvedPlanError(
            f"approved locale distribution {dict(dist)} != {EXPECTED_APPROVED_LOCALES}"
        )
    if any("__ar-EG" in k for k in keys):
        raise UnresolvedPlanError("ar-EG key in approved universe")


def matrix_cell_for_key(logical_key: str, *, repo_root: Path | None = None) -> dict[str, str]:
    lesson_id, locale = logical_key.rsplit("__", 1)
    package_path = f"src/lib/locale-lessons/{locale}/lessons/{lesson_id}.json"
    if repo_root is not None:
        path = repo_root / package_path
        if not path.is_file():
            raise UnresolvedPlanError(f"missing package: {package_path}")
    return {
        "locale": locale,
        "lessonId": lesson_id,
        "cellId": f"{locale}::{lesson_id}",
        "compositeKey": logical_key,
        "packagePath": package_path,
        "voiceProfileId": VOICE_PROFILES[locale],
    }


def collect_validated_finalized_keys(
    *,
    receipt_roots: list[Path],
    authoritative: set[str],
    batch_id: str = BATCH_ID,
) -> set[str]:
    """Load finalized receipts with canonical schema + promotion validators."""
    finalized: set[str] = set()
    artifact_ids: dict[str, str] = {}
    guids: dict[str, str] = {}

    def _ingest(logical_key: str, path: Path, *, branch_logical_key: str | None) -> None:
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            raise UnresolvedPlanError(
                f"inaccessible or invalid receipt JSON for {logical_key}: {e}"
            ) from e
        try:
            validate_receipt(receipt)
        except ReceiptError as e:
            raise UnresolvedPlanError(f"malformed receipt for {logical_key}: {e}") from e
        guid, err = validate_receipt_for_unresolved_exclusion(
            receipt,
            logical_key=logical_key,
            expected_logical_keys=authoritative,
            branch_logical_key=branch_logical_key,
        )
        if err:
            raise UnresolvedPlanError(
                f"receipt identity/validation failed for {logical_key}: {err}"
            )
        if logical_key in finalized:
            raise UnresolvedPlanError(f"duplicate finalized logical key: {logical_key}")
        aid = str(receipt.get("artifactId") or "")
        if not aid:
            raise UnresolvedPlanError(f"receipt missing artifactId for {logical_key}")
        if aid in artifact_ids and artifact_ids[aid] != logical_key:
            raise UnresolvedPlanError(
                f"duplicate artifactId {aid} for {logical_key} vs {artifact_ids[aid]}"
            )
        artifact_ids[aid] = logical_key
        assert guid is not None
        if guid in guids and guids[guid] != logical_key:
            raise UnresolvedPlanError(
                f"conflicting bunnyGuid {guid} for {logical_key} vs {guids[guid]}"
            )
        guids[guid] = logical_key
        finalized.add(logical_key)

    for root in receipt_roots:
        if not root.is_dir():
            continue
        # Layout A: single tree containing remotion/video-pipeline/results/...
        for key in sorted(authoritative):
            path = root / receipt_relpath(batch_id, key)
            if not path.is_file():
                continue
            if key in finalized:
                raise UnresolvedPlanError(f"duplicate finalized logical key: {key}")
            _ingest(key, path, branch_logical_key=None)

        # Layout B: children named by logical key (workflow fetch layout)
        for child in sorted(root.iterdir()):
            if not child.is_dir():
                continue
            key = child.name
            if key not in authoritative:
                stray = child / receipt_relpath(batch_id, key)
                if stray.is_file():
                    raise UnresolvedPlanError(
                        f"finalized receipt outside authoritative set: {key}"
                    )
                continue
            path = child / receipt_relpath(batch_id, key)
            if not path.is_file():
                continue
            if key in finalized:
                raise UnresolvedPlanError(f"duplicate finalized logical key: {key}")
            _ingest(key, path, branch_logical_key=key)

    return finalized


@dataclass
class UnresolvedGenerationPlan:
    authoritative_keys: list[str]
    finalized_keys: list[str]
    selected_keys: list[str]
    matrix_cells: list[dict[str, str]] = field(default_factory=list)
    empty: bool = False
    notice: str = ""

    @property
    def selected_count(self) -> int:
        return len(self.selected_keys)

    def as_dict(self) -> dict[str, Any]:
        return {
            "selectedCount": self.selected_count,
            "selectedLogicalKeys": list(self.selected_keys),
            "finalizedCount": len(self.finalized_keys),
            "authoritativeCount": len(self.authoritative_keys),
            "approvedCount": EXPECTED_APPROVED_COUNT,
            "empty": self.empty,
            "notice": self.notice,
            "matrix": self.matrix_cells,
            "localeDistribution": dict(
                Counter(k.rsplit("__", 1)[1] for k in self.selected_keys)
            ),
        }


def build_unresolved_generation_plan(
    *,
    authoritative_keys: list[str],
    finalized_keys: set[str],
    repo_root: Path | None = None,
) -> UnresolvedGenerationPlan:
    assert_approved_universe()
    approved = APPROVED_UNRESOLVED_KEYS
    approved_set = set(approved)

    if len(authoritative_keys) != 300 or len(set(authoritative_keys)) != 300:
        raise UnresolvedPlanError("authoritative manifests must yield exactly 300 unique keys")
    auth_set = set(authoritative_keys)
    loc = Counter(k.rsplit("__", 1)[1] for k in authoritative_keys)
    if loc.get("en") != 100 or loc.get("ar-MSA") != 100 or loc.get("ar-Gulf") != 100:
        raise UnresolvedPlanError(f"authoritative locale distribution invalid: {dict(loc)}")
    if any(k.endswith("__ar-EG") for k in authoritative_keys):
        raise UnresolvedPlanError("ar-EG composite key in authoritative set")

    if not approved_set <= auth_set:
        missing = sorted(approved_set - auth_set)
        raise UnresolvedPlanError(
            f"approved keys missing from authoritative set: {missing[:5]}"
        )

    unexpected_finalized = finalized_keys - auth_set
    if unexpected_finalized:
        raise UnresolvedPlanError(
            f"finalized keys outside authoritative set: {sorted(unexpected_finalized)[:5]}"
        )

    permanent = auth_set - approved_set
    if len(permanent) != EXPECTED_BASELINE_FINALIZED:
        raise UnresolvedPlanError(
            f"permanent finalized universe {len(permanent)} != {EXPECTED_BASELINE_FINALIZED}"
        )
    missing_permanent = permanent - finalized_keys
    if missing_permanent:
        raise UnresolvedPlanError(
            "missing original finalized receipt(s): "
            + ", ".join(sorted(missing_permanent)[:8])
        )

    unresolved_auth = auth_set - finalized_keys
    outside = unresolved_auth - approved_set
    if outside:
        raise UnresolvedPlanError(
            "authoritative unresolved key outside approved universe: "
            + ", ".join(sorted(outside)[:8])
        )

    selected = [k for k in approved if k not in finalized_keys]
    # Monotonic subset of approved order
    if not set(selected) <= approved_set:
        raise UnresolvedPlanError("internal selected set escaped approved universe")
    if finalized_keys & set(selected):
        raise UnresolvedPlanError("selected and finalized sets overlap")

    # Baseline initial state: exactly the approved 31 remain unresolved
    if len(finalized_keys) == EXPECTED_BASELINE_FINALIZED:
        if selected != list(approved):
            raise UnresolvedPlanError(
                "initial baseline unresolved set must equal the exact approved 31"
            )

    cells = [matrix_cell_for_key(k, repo_root=repo_root) for k in selected]
    empty = len(selected) == 0
    notice = (
        "zero unresolved approved cells remain; paid production skipped"
        if empty
        else f"selected {len(selected)} unresolved approved cell(s)"
    )
    return UnresolvedGenerationPlan(
        authoritative_keys=list(authoritative_keys),
        finalized_keys=sorted(finalized_keys),
        selected_keys=selected,
        matrix_cells=cells,
        empty=empty,
        notice=notice,
    )


def split_matrix(cells: list[dict[str, str]]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Reuse full-300 150-cell shard contract (harmless for ≤31)."""
    matrix_a = cells[:150]
    matrix_b = cells[150:]
    return matrix_a, matrix_b


def load_plan_from_repo(
    *,
    repo_root: Path,
    receipt_roots: list[Path],
) -> UnresolvedGenerationPlan:
    authoritative = load_authoritative_logical_keys(repo_root)
    # recovery_plan.load_authoritative uses ar-MSA, ar-Gulf, en — same 300 set
    finalized = collect_validated_finalized_keys(
        receipt_roots=receipt_roots,
        authoritative=set(authoritative),
    )
    return build_unresolved_generation_plan(
        authoritative_keys=authoritative,
        finalized_keys=finalized,
        repo_root=repo_root,
    )


# Re-export pins for tests
FULL_300_SOURCE_SHA = FULL_300_SOURCE_SHA_PIN
REPAIR_SOURCE_SHA = REPAIR_SOURCE_SHA_PIN
