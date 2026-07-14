"""Read-only collector for per-video finalization receipts."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .constants import BATCH_ID, receipt_relpath
from .receipt import ReceiptError, validate_receipt


@dataclass
class CollectorReport:
    finalized: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    ambiguous: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "finalizedLogicalKeys": sorted(self.finalized),
            "failedLogicalKeys": sorted(self.failed),
            "missingLogicalKeys": sorted(self.missing),
            "ambiguousLogicalKeys": sorted(self.ambiguous),
            "details": self.details,
        }


def collect_receipts(
    *,
    expected_logical_keys: list[str],
    receipt_roots: list[Path],
    batch_id: str = BATCH_ID,
    failed_logical_keys: list[str] | None = None,
) -> CollectorReport:
    """Scan filesystem checkouts of result branches (read-only).

    receipt_roots: list of repo roots each containing at most one cell receipt
    at remotion/video-pipeline/results/{batch}/{logical}/finalization-receipt.json
    """
    failed = list(failed_logical_keys or [])
    report = CollectorReport(failed=sorted(set(failed)))
    seen: dict[str, list[dict[str, Any]]] = {}

    for root in receipt_roots:
        for key in expected_logical_keys:
            path = root / receipt_relpath(batch_id, key)
            if not path.is_file():
                continue
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                validate_receipt(data)
            except (json.JSONDecodeError, ReceiptError) as e:
                report.ambiguous.append(key)
                report.details[key] = {"error": str(e), "path": str(path)}
                continue
            if data.get("logicalKey") != key:
                report.ambiguous.append(key)
                report.details[key] = {"error": "logicalKey path mismatch"}
                continue
            seen.setdefault(key, []).append(data)

    for key in expected_logical_keys:
        receipts = seen.get(key) or []
        if not receipts:
            if key not in report.failed:
                report.missing.append(key)
            continue
        if len(receipts) > 1:
            guids = {r.get("bunnyGuid") for r in receipts}
            checksums = {r.get("videoChecksum") for r in receipts}
            if len(guids) > 1 or len(checksums) > 1:
                report.ambiguous.append(key)
                report.details[key] = {
                    "error": "conflicting-receipts",
                    "guids": sorted(g for g in guids if g),
                }
                continue
        # de-dupe identical
        report.finalized.append(key)

    # deterministic unique + sorted
    report.finalized = sorted(set(report.finalized) - set(report.ambiguous))
    report.missing = sorted(set(report.missing) - set(report.finalized) - set(report.failed) - set(report.ambiguous))
    report.ambiguous = sorted(set(report.ambiguous))
    report.failed = sorted(set(report.failed) - set(report.finalized))
    return report
