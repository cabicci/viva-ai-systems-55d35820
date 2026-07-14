"""Deterministic 300-cell plan builder for the standalone workflow.

Rules (contract):
  - Discover locale packages under src/lib/locale-lessons/{locale}/lessons/*.json
  - Required locales: en=100, ar-MSA=100, ar-Gulf=100, ar-EG=0
  - Total unique logical keys = 300
  - logical_key = f"{lessonId}__{locale}"
  - Canary is PINNED explicitly (not alphabetical): analyst-m3-l2-ai-summarization__en
  - Remaining 299 cells are split: matrix_a=149, matrix_b=150 (deterministic order).
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

REQUIRED_COUNTS = {"en": 100, "ar-MSA": 100, "ar-Gulf": 100}
FORBIDDEN_LOCALES = {"ar-EG"}
EXPECTED_TOTAL = 300
MATRIX_A_COUNT = 149
MATRIX_B_COUNT = 150

CANARY_LOGICAL_KEY = "analyst-m3-l2-ai-summarization__en"
CANARY_LESSON_ID = "analyst-m3-l2-ai-summarization"
CANARY_LOCALE = "en"


@dataclass(frozen=True)
class Cell:
    logical_key: str
    lesson_id: str
    locale: str
    package_path: str

    def to_dict(self) -> dict:
        return asdict(self)


class PlanError(RuntimeError):
    pass


def discover_cells(repo_root: Path) -> list[Cell]:
    base = repo_root / "src" / "lib" / "locale-lessons"
    if not base.is_dir():
        raise PlanError(f"locale-lessons dir missing: {base}")

    cells: list[Cell] = []
    seen_keys: set[str] = set()

    for locale in sorted(REQUIRED_COUNTS.keys()):
        loc_dir = base / locale / "lessons"
        if not loc_dir.is_dir():
            raise PlanError(f"required locale dir missing: {loc_dir}")
        files = sorted(p for p in loc_dir.iterdir() if p.suffix == ".json")
        for p in files:
            lesson_id = p.stem
            key = f"{lesson_id}__{locale}"
            if key in seen_keys:
                raise PlanError(f"duplicate logical key: {key}")
            seen_keys.add(key)
            cells.append(
                Cell(
                    logical_key=key,
                    lesson_id=lesson_id,
                    locale=locale,
                    package_path=str(p.relative_to(repo_root)),
                )
            )

    for locale in FORBIDDEN_LOCALES:
        forbidden = base / locale
        if forbidden.exists():
            entries = list(forbidden.rglob("*.json"))
            if entries:
                raise PlanError(f"forbidden locale has assets: {locale}")

    return cells


def validate_counts(cells: list[Cell]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for c in cells:
        counts[c.locale] = counts.get(c.locale, 0) + 1
    for loc, expected in REQUIRED_COUNTS.items():
        got = counts.get(loc, 0)
        if got != expected:
            raise PlanError(f"locale {loc}: expected {expected} cells, got {got}")
    for loc in FORBIDDEN_LOCALES:
        if counts.get(loc, 0) != 0:
            raise PlanError(f"forbidden locale {loc} present with {counts[loc]}")
    if len(cells) != EXPECTED_TOTAL:
        raise PlanError(f"total cells: expected {EXPECTED_TOTAL}, got {len(cells)}")
    if len({c.logical_key for c in cells}) != EXPECTED_TOTAL:
        raise PlanError("logical keys not unique")
    return counts


def build_plan(repo_root: Path) -> dict:
    cells = discover_cells(repo_root)
    validate_counts(cells)
    by_key = {c.logical_key: c for c in cells}

    if CANARY_LOGICAL_KEY not in by_key:
        raise PlanError(f"pinned canary missing from discovered cells: {CANARY_LOGICAL_KEY}")
    canary_cell = by_key[CANARY_LOGICAL_KEY]
    if canary_cell.lesson_id != CANARY_LESSON_ID or canary_cell.locale != CANARY_LOCALE:
        raise PlanError("pinned canary lesson_id/locale mismatch")

    # Remaining 299 cells in deterministic (locale, lesson_id) order.
    remaining = sorted(
        (c for c in cells if c.logical_key != CANARY_LOGICAL_KEY),
        key=lambda c: (c.locale, c.lesson_id),
    )
    if len(remaining) != EXPECTED_TOTAL - 1:
        raise PlanError(f"remaining cells wrong: {len(remaining)}")
    matrix_a = remaining[:MATRIX_A_COUNT]
    matrix_b = remaining[MATRIX_A_COUNT : MATRIX_A_COUNT + MATRIX_B_COUNT]
    if len(matrix_a) != MATRIX_A_COUNT:
        raise PlanError(f"matrix_a count wrong: {len(matrix_a)}")
    if len(matrix_b) != MATRIX_B_COUNT:
        raise PlanError(f"matrix_b count wrong: {len(matrix_b)}")

    return {
        "counts": validate_counts(cells),
        "totals": {
            "total": len(cells),
            "canary": 1,
            "matrix_a": len(matrix_a),
            "matrix_b": len(matrix_b),
        },
        "canary": [canary_cell.to_dict()],
        "matrix_a": [c.to_dict() for c in matrix_a],
        "matrix_b": [c.to_dict() for c in matrix_b],
    }


def _repo_root_from_here() -> Path:
    return Path(__file__).resolve().parents[3]


def main(argv: list[str] | None = None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="Build standalone 300 plan")
    ap.add_argument("--repo-root", default=str(_repo_root_from_here()))
    ap.add_argument("--out", required=True, help="write plan JSON to this path")
    ap.add_argument("--emit-github-output", action="store_true")
    args = ap.parse_args(argv)

    plan = build_plan(Path(args.repo_root))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.emit_github_output:
        gho = os.environ.get("GITHUB_OUTPUT")
        if not gho:
            raise PlanError("--emit-github-output set but GITHUB_OUTPUT env is missing")
        with open(gho, "a", encoding="utf-8") as fh:
            fh.write("canary=" + json.dumps(plan["canary"]) + "\n")
            fh.write("matrix_a=" + json.dumps(plan["matrix_a"]) + "\n")
            fh.write("matrix_b=" + json.dumps(plan["matrix_b"]) + "\n")
            fh.write("totals=" + json.dumps(plan["totals"]) + "\n")

    print(json.dumps(plan["totals"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
