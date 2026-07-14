"""cli_build_plan.py — build a deterministic 300-cell v2 plan.

Reads the authoritative locale lesson packages from the repo layout
``src/lib/locale-lessons/{locale}/lessons/*.json`` and produces a plan JSON
consumed by the workflow's matrix jobs. May be overridden with
``--lessons-json`` for tests.

Emits compact GitHub matrix JSON via the plan file itself; the workflow shells
out to ``jq`` to project ``matrix_a`` and ``matrix_b``.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from video_v2.constants import LOCALE_COUNTS  # noqa: E402
from video_v2.matrix_plan import build_plan, plan_digest  # noqa: E402


def _scan_lessons(root: Path, locale: str) -> list[str]:
    d = root / "src" / "lib" / "locale-lessons" / locale / "lessons"
    if not d.is_dir():
        return []
    return sorted(p.stem for p in d.glob("*.json"))


def _load_lessons_json(path: Path) -> dict[str, list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {k: list(v) for k, v in data.items()}


def build(source_sha: str, lessons: dict[str, list[str]]) -> dict:
    return build_plan(
        en_lessons=lessons.get("en", []),
        ar_msa_lessons=lessons.get("ar-MSA", []),
        ar_gulf_lessons=lessons.get("ar-Gulf", []),
        source_sha=source_sha,
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-sha", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--repo-root", default=".")
    ap.add_argument("--lessons-json", default=None,
                    help="Optional override JSON with keys en/ar-MSA/ar-Gulf → [lessonId,...]")
    args = ap.parse_args(argv)

    if args.lessons_json:
        lessons = _load_lessons_json(Path(args.lessons_json))
    else:
        root = Path(args.repo_root)
        lessons = {
            "en": _scan_lessons(root, "en"),
            "ar-MSA": _scan_lessons(root, "ar-MSA"),
            "ar-Gulf": _scan_lessons(root, "ar-Gulf"),
        }

    for locale, want in LOCALE_COUNTS.items():
        if locale == "ar-EG":
            continue
        got = len(lessons.get(locale, []))
        if got != want:
            print(f"::error::locale {locale} has {got} lessons, expected {want}", file=sys.stderr)
            return 2

    plan = build(args.source_sha, lessons)
    plan["planDigest"] = plan_digest(plan)
    Path(args.out).write_text(
        json.dumps(plan, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(f"plan: canary=1 matrix_a={len(plan['matrix_a'])} matrix_b={len(plan['matrix_b'])} "
          f"total=300 digest={plan['planDigest']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
