"""Check all older Kids draft packages and record reviewable manifests."""
import hashlib
import importlib.util
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("kids_editorial", Path(__file__).with_name("generate-editorial.py"))
core = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(core)
counts = {"lessons": 0, "packages": 0, "quizItems": 0, "scenes": 0, "editorialStatus": "draft awaiting human fact and language review"}
for level in (2, 3):
    for number in range(1, 13):
        slug = f"{number:02}"
        folder = BASE / "curriculum" / f"level-{level}" / f"lesson-{slug}"
        manifest = {"lessonId": f"kids-l{level}-{slug}", "level": f"level-{level}",
                    "ageBand": "12–14" if level == 2 else "14–16",
                    "status": "editorial-draft-structural-checks-pass",
                    "mediaStatus": "not-produced", "humanEditorialApproval": "pending",
                    "automatedSemanticReview": "unresolved; see automated-review.json", "locales": {}}
        for locale in core.LOCALES:
            path = folder / (locale + ".json")
            data = json.loads(path.read_text(encoding="utf-8"))
            words = core.validate(data, locale)
            assert len(data["scenes"]) == 7 and len(data["quiz"]) >= 3
            assert len(data["imageBrief"]["labels"]) >= 3
            assert all(q["source"] in ("concept", "example", "check") for q in data["quiz"])
            manifest["locales"][locale] = {"path": path.name,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "narrationWords": words}
            counts["packages"] += 1
            counts["quizItems"] += len(data["quiz"])
            counts["scenes"] += len(data["scenes"])
        (folder / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        counts["lessons"] += 1
print(json.dumps(counts))
