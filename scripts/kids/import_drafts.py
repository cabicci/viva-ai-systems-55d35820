"""Import Kids editorial drafts as inert review data, never public assets.

Usage: python scripts/kids/import_drafts.py PATH_TO_PILOT_EXPERIMENT PRIVATE_OUTPUT_DIRECTORY
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

SOURCE = Path(sys.argv[1]).resolve()
DEST = Path(sys.argv[2]).resolve()
REPO = Path(__file__).resolve().parents[2]
if DEST == REPO or REPO in DEST.parents:
    raise ValueError("Kids editorial drafts must live outside the public repository")
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")
records = []

def add(level, lesson, locale, raw, source, expected=None):
    source_hash = hashlib.sha256(raw).hexdigest()
    if expected and source_hash != expected:
        raise ValueError(f"Manifest mismatch: {source}")
    parsed = json.loads(raw)
    if parsed.get("locale") not in (None, locale):
        raise ValueError(f"Locale mismatch: {source}")
    parsed["locale"] = locale
    data = (json.dumps(parsed, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    target = DEST / f"level-{level}" / f"lesson-{lesson:02}" / f"{locale}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    records.append({"level": level, "lesson": lesson, "locale": locale,
                    "path": target.relative_to(DEST).as_posix(),
                    "sourcePath": source.relative_to(SOURCE).as_posix(),
                    "sourceSha256": source_hash,
                    "sha256": hashlib.sha256(data).hexdigest(),
                    "status": "human-review-pending"})

pilot = SOURCE / "content"
for locale in LOCALES:
    source = pilot / f"{locale}.json"
    add(1, 1, locale, source.read_bytes(), source)
second_source = SOURCE / "curriculum/lesson-02-editorial.json"
second = json.loads(second_source.read_text(encoding="utf-8"))
for locale in LOCALES:
    raw = json.dumps(second["locales"][locale], ensure_ascii=False).encode("utf-8")
    add(1, 2, locale, raw, second_source)
for level in (1, 2, 3):
    for lesson in range(3 if level == 1 else 1, 13):
        folder = SOURCE / f"curriculum/level-{level}/lesson-{lesson:02}"
        manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
        for locale in LOCALES:
            source = folder / f"{locale}.json"
            add(level, lesson, locale, source.read_bytes(), source,
                manifest["locales"][locale]["sha256"])
assert len(records) == 144
manifest = {
    "schemaVersion": 1,
    "status": "draft-not-approved-or-published",
    "sourceBranch": "feature/masaarat-kids-levels-2-3",
    "sourceCommit": subprocess.check_output(
        ["git", "-C", str(SOURCE), "rev-parse", "HEAD"], text=True
    ).strip(),
    "levels": 3,
    "lessons": 36,
    "locales": list(LOCALES),
    "packages": records,
}
(DEST / "manifest.json").write_bytes(
    (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
)
print(f"Imported {len(records)} editorial drafts; publication remains blocked.")
