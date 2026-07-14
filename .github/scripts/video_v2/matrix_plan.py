"""Deterministic 300-cell matrix planner for video-production-final-v2.

Input: an ordered list of approved logical keys per locale (produced from the
locale lesson packages by the caller — this module never invents keys).

Output: two matrices of 150 cells each, canary preselected from matrix_a[0].
Deterministic given the same input ordering + source SHA.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from typing import Sequence

from .constants import (
    BATCH_ID, LOCALE_COUNTS, MATRIX_A_SIZE, MATRIX_B_SIZE, TOTAL_KEYS,
)


@dataclass(frozen=True)
class Cell:
    logical_key: str
    lesson_id: str
    locale: str

    def as_json(self) -> dict:
        return asdict(self)


class PlanError(ValueError):
    pass


def _logical_key(lesson_id: str, locale: str) -> str:
    return f"{lesson_id}__{locale}"


def build_plan(
    *,
    en_lessons: Sequence[str],
    ar_msa_lessons: Sequence[str],
    ar_gulf_lessons: Sequence[str],
    source_sha: str,
) -> dict:
    if len(en_lessons) != LOCALE_COUNTS["en"]:
        raise PlanError(f"en count {len(en_lessons)} != {LOCALE_COUNTS['en']}")
    if len(ar_msa_lessons) != LOCALE_COUNTS["ar-MSA"]:
        raise PlanError(f"ar-MSA count {len(ar_msa_lessons)} != {LOCALE_COUNTS['ar-MSA']}")
    if len(ar_gulf_lessons) != LOCALE_COUNTS["ar-Gulf"]:
        raise PlanError(f"ar-Gulf count {len(ar_gulf_lessons)} != {LOCALE_COUNTS['ar-Gulf']}")

    cells: list[Cell] = []
    for lid in en_lessons:
        cells.append(Cell(_logical_key(lid, "en"), lid, "en"))
    for lid in ar_msa_lessons:
        cells.append(Cell(_logical_key(lid, "ar-MSA"), lid, "ar-MSA"))
    for lid in ar_gulf_lessons:
        cells.append(Cell(_logical_key(lid, "ar-Gulf"), lid, "ar-Gulf"))

    keys = [c.logical_key for c in cells]
    if len(keys) != TOTAL_KEYS:
        raise PlanError(f"total cells {len(keys)} != {TOTAL_KEYS}")
    if len(set(keys)) != TOTAL_KEYS:
        dupes = sorted({k for k in keys if keys.count(k) > 1})
        raise PlanError(f"duplicate logical keys: {dupes[:5]}")
    if any(c.locale == "ar-EG" for c in cells):
        raise PlanError("ar-EG must be 0 in v2 batch")

    # Deterministic interleave: sort by (hash(logical_key + source_sha), key)
    def _rank(c: Cell) -> tuple[str, str]:
        h = hashlib.sha256(f"{c.logical_key}|{source_sha}".encode()).hexdigest()
        return (h, c.logical_key)

    ordered = sorted(cells, key=_rank)
    matrix_a = ordered[:MATRIX_A_SIZE]
    matrix_b = ordered[MATRIX_A_SIZE:MATRIX_A_SIZE + MATRIX_B_SIZE]
    if len(matrix_a) != MATRIX_A_SIZE or len(matrix_b) != MATRIX_B_SIZE:
        raise PlanError("matrix split size mismatch")

    canary = matrix_a[0]
    rest_a = matrix_a[1:]  # canary runs standalone first; remaining a-cells wait on canary success

    plan = {
        "batchId": BATCH_ID,
        "sourceSha": source_sha,
        "totals": {"total": TOTAL_KEYS, **LOCALE_COUNTS},
        "canary": canary.as_json(),
        "matrix_a": [c.as_json() for c in rest_a],   # 149
        "matrix_b": [c.as_json() for c in matrix_b], # 150
        "combinedMaxParallel": 4,
    }
    return plan


def plan_digest(plan: dict) -> str:
    blob = json.dumps(plan, sort_keys=True, ensure_ascii=False).encode()
    return "sha256:" + hashlib.sha256(blob).hexdigest()
