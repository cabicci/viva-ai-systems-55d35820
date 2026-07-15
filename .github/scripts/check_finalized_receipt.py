#!/usr/bin/env python3
"""Check durable receipt before paid generation.

If a finalized receipt matches batchId+logicalKey+production sourceSha, print skip=true.
For the single accepted finalize-one cell under the full-300 production pin, a byte-exact
carry-forward receipt (sourceSha remains the finalize-one artifact pin) may skip.
Does not call Gemini/TTS/Bunny.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Literal

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from video_finalize.constants import (  # noqa: E402
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    ACCEPTED_CARRY_FORWARD_PROTECTED_FIELDS,
    FULL_300_SOURCE_SHA_PIN,
    receipt_relpath,
    result_branch_name,
)
from video_finalize.receipt import ReceiptError, validate_receipt  # noqa: E402

ReceiptAction = Literal["skip", "proceed", "fail"]


def _receipt_matches_carry_forward(receipt: dict) -> bool:
    return all(receipt.get(field) == expected for field, expected in ACCEPTED_CARRY_FORWARD_CELL.items())


def evaluate_finalized_receipt(
    *,
    batch_id: str,
    logical_key: str,
    production_source_sha: str,
    receipt: dict | None,
    receipt_error: str | None = None,
) -> tuple[ReceiptAction, bool, str, int]:
    """Return (action, carried_forward, message, exit_code)."""
    if logical_key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
        if production_source_sha != FULL_300_SOURCE_SHA_PIN:
            return (
                "fail",
                False,
                "accepted logical key requires full-300 production source pin",
                24,
            )
        if receipt_error:
            return (
                "fail",
                False,
                f"accepted carry-forward receipt invalid: {receipt_error}",
                20,
            )
        if receipt is None:
            return ("fail", False, "accepted carry-forward receipt missing", 22)
        if not _receipt_matches_carry_forward(receipt):
            return (
                "fail",
                False,
                "accepted carry-forward receipt identity mismatch",
                23,
            )
        return (
            "skip",
            True,
            "accepted-carried-forward-completed-cell",
            0,
        )

    if receipt is None:
        return ("proceed", False, "no receipt; generation proceeds", 0)
    if receipt_error:
        return ("fail", False, f"ambiguous receipt for {logical_key}: {receipt_error}", 20)

    ok = (
        receipt.get("batchId") == batch_id
        and receipt.get("logicalKey") == logical_key
        and receipt.get("sourceSha") == production_source_sha
        and receipt.get("validationStatus") in ("validated", "finalized")
        and bool(receipt.get("bunnyGuid"))
    )
    if ok:
        return ("skip", False, "skipped-success", 0)
    return ("fail", False, "receipt present but identity does not match; fail closed", 21)


def main() -> int:
    batch_id = os.environ["BATCH_ID"]
    logical_key = os.environ["COMPOSITE_KEY"]
    production_source_sha = os.environ.get("PRODUCTION_SOURCE_SHA", os.environ["SOURCE_SHA"])
    results_repo = Path(os.environ.get("RESULTS_REPO", "."))
    rel = receipt_relpath(batch_id, logical_key)
    path = results_repo / rel

    receipt: dict | None = None
    receipt_error: str | None = None
    if path.is_file():
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
            validate_receipt(receipt)
        except (json.JSONDecodeError, ReceiptError) as e:
            receipt = None
            receipt_error = str(e)

    action, carried_forward, message, exit_code = evaluate_finalized_receipt(
        batch_id=batch_id,
        logical_key=logical_key,
        production_source_sha=production_source_sha,
        receipt=receipt,
        receipt_error=receipt_error,
    )

    def emit(skip: bool, *, carried: bool) -> None:
        skip_s = "true" if skip else "false"
        print(f"skip={skip_s}")
        if carried:
            print("carried_forward=accepted")
        if "GITHUB_OUTPUT" in os.environ:
            with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
                f.write(f"skip={skip_s}\n")
                f.write(f"carried_forward={'true' if carried else 'false'}\n")

    if action == "proceed":
        emit(False, carried=False)
        print(f"::notice::{message} at {rel}")
        return exit_code
    if action == "skip":
        emit(True, carried=carried_forward)
        branch = result_branch_name(batch_id, logical_key)
        if carried_forward:
            print(
                f"::notice::{message} {logical_key} branch={branch} "
                f"receipt_source_sha={ACCEPTED_CARRY_FORWARD_CELL['sourceSha']}"
            )
        else:
            print(f"::notice::{message} {logical_key} branch={branch}")
        return exit_code

    print(f"::error::{message}")
    if logical_key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
        protected = ", ".join(sorted(ACCEPTED_CARRY_FORWARD_PROTECTED_FIELDS))
        print(f"::error::required protected fields: {protected}")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
