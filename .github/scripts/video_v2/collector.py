"""Final collector for video-production-final-v2.

Runs with `if: always()`. Preserves every successful per-video receipt even
when other cells fail. Produces a mapping-promotion candidate JSON that a
separate manual step may consume. Never pushes to main.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .constants import BATCH_ID, receipt_relpath
from .receipt import validate, ReceiptError


@dataclass
class CollectorReport:
    batchId: str = BATCH_ID
    successful: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    conflicting: list[str] = field(default_factory=list)
    mappingCandidate: dict[str, dict[str, str]] = field(default_factory=dict)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "batchId": self.batchId,
            "successfulLogicalKeys": sorted(self.successful),
            "failedLogicalKeys": sorted(self.failed),
            "missingLogicalKeys": sorted(self.missing),
            "conflictingLogicalKeys": sorted(self.conflicting),
            "mappingCandidate": self.mappingCandidate,
            "details": self.details,
        }


def collect(
    *,
    expected_keys: list[str],
    receipt_roots: list[Path],
    failed_keys: list[str] | None = None,
) -> CollectorReport:
    report = CollectorReport(failed=sorted(set(failed_keys or [])))
    seen: dict[str, list[dict]] = {}

    for root in receipt_roots:
        for key in expected_keys:
            p = root / receipt_relpath(key)
            if not p.is_file():
                continue
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                validate(data)
            except (json.JSONDecodeError, ReceiptError) as e:
                report.conflicting.append(key)
                report.details[key] = {"error": str(e), "path": str(p)}
                continue
            if data.get("logicalKey") != key:
                report.conflicting.append(key)
                report.details[key] = {"error": "logicalKey path mismatch"}
                continue
            seen.setdefault(key, []).append(data)

    for key in expected_keys:
        rs = seen.get(key) or []
        if not rs:
            if key not in report.failed:
                report.missing.append(key)
            continue
        guids = {r.get("bunnyGuid") for r in rs}
        checksums = {r.get("videoChecksum") for r in rs}
        identities = {r.get("bunnyIdentityHash") for r in rs}
        if len(guids) > 1 or len(checksums) > 1 or len(identities) > 1:
            report.conflicting.append(key)
            report.details[key] = {
                "error": "conflicting-receipts",
                "guids": sorted(g for g in guids if g),
            }
            continue
        r = rs[0]
        report.successful.append(key)
        report.mappingCandidate[key] = {
            "bunnyGuid": r["bunnyGuid"],
            "videoChecksum": r["videoChecksum"],
            "captionsChecksum": r["captionsChecksum"],
            "sourceSha": r["sourceSha"],
        }

    report.successful = sorted(set(report.successful) - set(report.conflicting))
    report.missing = sorted(
        set(report.missing) - set(report.successful) - set(report.failed) - set(report.conflicting)
    )
    report.conflicting = sorted(set(report.conflicting))
    report.failed = sorted(set(report.failed) - set(report.successful))
    return report
