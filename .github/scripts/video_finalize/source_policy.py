"""Exact, key-specific sourceSha policy for finalized video receipts.

Two consumers share these pins:

* unresolved planner exclusion — accepts historical full-300 OR repair SHA
  on any finalized receipt (so newly repaired cells leave the unpaid matrix).
* mapping promotion — requires the exact source SHA for each logical key
  (repair SHA only on the three repair cells; full-300 elsewhere).

No generic sourceSha bypass. Unknown / missing / shortened SHAs fail closed.
"""
from __future__ import annotations

from typing import Any

from .constants import FULL_300_SOURCE_SHA_PIN, SOURCE_SHA_PIN

# Immutable production source for the repaired final-three generation path.
REPAIR_SOURCE_SHA_PIN = "71fbe483b931cba91bedb1feadb1941092518890"

# Exact cells generated under REPAIR_SOURCE_SHA_PIN (Run 29688980041).
REPAIR_SOURCE_LOGICAL_KEYS: frozenset[str] = frozenset(
    {
        "creator-m4-repurposing__en",
        "intro-m1-l1-what-is-ai__en",
        "automator-m7-l1-closing-loop__ar-Gulf",
    }
)

# Planner exclusion only: finalized receipts may use either pin.
ACCEPTED_FINALIZED_SOURCE_SHAS: frozenset[str] = frozenset(
    {
        FULL_300_SOURCE_SHA_PIN,
        REPAIR_SOURCE_SHA_PIN,
    }
)

_FULL_SHA_RE_LEN = 40


def is_exact_full_sha(value: Any) -> bool:
    """True only for a 40-char lowercase/hex Git object name (no short/mutable refs)."""
    if not isinstance(value, str):
        return False
    if len(value) != _FULL_SHA_RE_LEN:
        return False
    try:
        int(value, 16)
    except ValueError:
        return False
    return True


def required_promotion_source_sha(logical_key: str) -> str:
    """Exact sourceSha required to promote a finalized receipt for this key.

    Carry-forward is handled separately by mapping_promotion (identity match).
    """
    if logical_key in REPAIR_SOURCE_LOGICAL_KEYS:
        return REPAIR_SOURCE_SHA_PIN
    return FULL_300_SOURCE_SHA_PIN


def validate_promotion_source_sha(
    logical_key: str,
    source_sha: Any,
) -> str | None:
    """Return an error string if source_sha is not allowed for promotion of logical_key.

    Does not implement the carry-forward exception — caller must short-circuit that.
    """
    if source_sha is None or source_sha == "":
        return "sourceSha missing"
    if not is_exact_full_sha(source_sha):
        return "sourceSha malformed or not a full 40-char SHA"
    required = required_promotion_source_sha(logical_key)
    if source_sha != required:
        if logical_key in REPAIR_SOURCE_LOGICAL_KEYS:
            return "sourceSha mismatch for exact repair-source cell"
        if source_sha == REPAIR_SOURCE_SHA_PIN:
            return "repair sourceSha not authorized for this logical key"
        if source_sha == SOURCE_SHA_PIN:
            return "carry-forward sourceSha not authorized for this logical key"
        return "sourceSha mismatch for full-300 production pin"
    return None
