#!/usr/bin/env python3
"""Deterministic no-network 300-cell localized video integrity report.

Validates exactly:
  100 ar-MSA + 100 ar-Gulf + 100 en = 300 cells

Writes remotion/reports/localized-video-integrity-300.json
Exits non-zero unless totals match and failed cells = 0.

No TTS, no Gemini, no network.
"""
from __future__ import annotations
import json
import sys
from collections import Counter
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(SCRIPT_DIR))

from lib.integrity_locale_policy import LOCALIZED_PRESENTATION_LOCALES  # noqa: E402
from lib.integrity_scenes_from_package import integrity_scenes_from_package  # noqa: E402
from lib.integrity_validator import validate_localized_scene_integrity  # noqa: E402
from lib.localized_package_adapter import load_package  # noqa: E402

REPORT_PATH = REPO_ROOT / "remotion" / "reports" / "localized-video-integrity-300.json"
LOCALES = list(LOCALIZED_PRESENTATION_LOCALES)
EXPECTED_PER_LOCALE = 100
EXPECTED_TOTAL = 300


def _lesson_ids_for_locale(locale: str) -> list[str]:
    lessons_dir = REPO_ROOT / "src" / "lib" / "locale-lessons" / locale / "lessons"
    ids = sorted(p.stem for p in lessons_dir.glob("*.json"))
    return ids


def _validate_cell(locale: str, lesson_id: str) -> dict:
    package_path = (
        REPO_ROOT / "src" / "lib" / "locale-lessons" / locale / "lessons" / f"{lesson_id}.json"
    )
    cell: dict = {
        "lessonId": lesson_id,
        "locale": locale,
        "packagePath": str(package_path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "sourcePackageLocale": None,
        "sceneCount": 0,
        "resolvedPresentationLocale": None,
        "status": "fail",
        "issues": [],
        "generationError": None,
    }
    try:
        pkg, _sha, _fp = load_package(package_path)
        cell["sourcePackageLocale"] = pkg.get("locale")
        scenes = integrity_scenes_from_package(pkg, expected_locale=locale)
        result = validate_localized_scene_integrity(
            lesson_id=lesson_id,
            source_package_locale=locale,
            scenes=scenes,
            renderer_locale=locale,
        )
        cell["sceneCount"] = result.sceneCount
        cell["resolvedPresentationLocale"] = result.resolvedPresentationLocale
        cell["issues"] = [i.to_dict() for i in result.issues]
        cell["status"] = "pass" if result.ok else "fail"
    except Exception as exc:  # noqa: BLE001 — report must capture all cell errors
        cell["generationError"] = f"{type(exc).__name__}: {exc}"
        cell["status"] = "fail"
        cell["issues"] = [{
            "lessonId": lesson_id,
            "sourcePackageLocale": cell["sourcePackageLocale"],
            "declaredSceneLocale": None,
            "sceneIndex": -1,
            "cardType": "",
            "fieldPath": "generation",
            "ruleId": "GENERATION_ERROR",
            "offending": "",
            "message": cell["generationError"],
        }]
    return cell


def build_report() -> dict:
    cells: list[dict] = []
    for locale in LOCALES:
        lesson_ids = _lesson_ids_for_locale(locale)
        for lesson_id in lesson_ids:
            cells.append(_validate_cell(locale, lesson_id))

    locale_totals = {loc: sum(1 for c in cells if c["locale"] == loc) for loc in LOCALES}
    passed = sum(1 for c in cells if c["status"] == "pass")
    failed = sum(1 for c in cells if c["status"] == "fail")
    rule_totals: Counter[str] = Counter()
    generation_errors = 0
    for c in cells:
        if c.get("generationError"):
            generation_errors += 1
        for issue in c.get("issues") or []:
            rule_totals[issue.get("ruleId") or "UNKNOWN"] += 1

    return {
        "schemaVersion": 1,
        "totalCells": len(cells),
        "localeTotals": locale_totals,
        "passedCells": passed,
        "failedCells": failed,
        "ruleFailureTotals": dict(sorted(rule_totals.items())),
        "generationOrValidationErrors": generation_errors,
        "cells": cells,
    }


def report_is_complete(report: dict) -> bool:
    totals = report.get("localeTotals") or {}
    return (
        report.get("totalCells") == EXPECTED_TOTAL
        and totals.get("ar-MSA") == EXPECTED_PER_LOCALE
        and totals.get("ar-Gulf") == EXPECTED_PER_LOCALE
        and totals.get("en") == EXPECTED_PER_LOCALE
        and report.get("failedCells") == 0
    )


def main() -> int:
    report = build_report()
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Deterministic JSON: sorted keys, stable separators, UTF-8, trailing newline.
    payload = json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    REPORT_PATH.write_text(payload, encoding="utf-8")
    print(f"Wrote {REPORT_PATH.relative_to(REPO_ROOT)} "
          f"total={report['totalCells']} passed={report['passedCells']} "
          f"failed={report['failedCells']}")
    if not report_is_complete(report):
        print(
            f"::error::integrity-300 incomplete or failing: "
            f"total={report['totalCells']} localeTotals={report['localeTotals']} "
            f"failed={report['failedCells']}",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
