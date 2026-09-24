"""Restore cached editorial drafts and receipts from a GitHub Actions artifact download."""
import argparse
import json
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")

parser = argparse.ArgumentParser()
parser.add_argument("artifacts", type=Path)
args = parser.parse_args()
found = set()
for artifact in args.artifacts.glob("kids-advanced-editorial-l*-*-*"):
    for source in artifact.glob("level-*/lesson-*"):
        level, lesson = source.parent.name, source.name
        if level not in ("level-2", "level-3"):
            continue
        assert 1 <= int(lesson.split("-")[-1]) <= 12
        target = BASE / "curriculum" / level / lesson
        target.mkdir(parents=True, exist_ok=True)
        for locale in LOCALES:
            for suffix in (".json", ".receipt.json"):
                name = locale + suffix
                assert (source / name).exists(), f"Missing {source / name}"
                json.loads((source / name).read_text(encoding="utf-8"))
                shutil.copy2(source / name, target / name)
        found.add((level, lesson))
print(f"Restored {len(found)} complete four-locale draft sets")
