"""Prepare seven-scene scripts for Kids Levels 2 and 3."""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")
source = {}
for level in (2, 3):
    for number in range(1, 13):
        folder = BASE / "curriculum" / f"level-{level}" / f"lesson-{number:02}"
        manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
        assert manifest["status"] == "editorial-draft-structural-checks-pass"
        for locale in LOCALES:
            data = json.loads((folder / (locale + ".json")).read_text(encoding="utf-8"))
            assert len(data["scenes"]) == 7
            source[f"{level}/{number:02}/{locale}"] = {
                "level": level, "lesson": number, "locale": locale, "title": data["title"],
                "scenes": [{k: scene[k] for k in ("id", "title", "display", "narration")}
                           for scene in data["scenes"]]}
(BASE / "content/advanced-video.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Prepared {len(source)} seven-scene localized video scripts.")
