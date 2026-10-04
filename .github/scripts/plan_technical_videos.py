#!/usr/bin/env python3
"""Plan only reviewed, missing/revised technical media in the existing workflow."""
from __future__ import annotations
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("technical_video_builder", ROOT / "remotion/scripts/build-technical-lesson.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")
MAX_BATCH = 200  # Below GitHub's 256-job matrix limit; later checkpoints drain the remainder.


def is_ready(guid):
    if not re.fullmatch(r"[0-9a-fA-F-]{36}", guid):
        return False
    library = os.environ["BUNNY_STREAM_LIBRARY_ID"]
    request = urllib.request.Request(f"https://video.bunnycdn.com/library/{library}/videos/{guid}",
        headers={"AccessKey": os.environ["BUNNY_STREAM_API_KEY"], "accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            meta = json.loads(response.read())
        return meta.get("status") == 4 and (meta.get("length") or 0) > 0
    except Exception:
        # Unverified media must remain in the precheck/retry plan.
        return False


def plan(root=ROOT, ready=is_ready, force=False):
    approval = json.loads((root / "docs/experiments/technical-education/video-production-reviewed.json").read_text())
    revisions = json.loads((root / "docs/experiments/technical-education/video-revisions.json").read_text())
    mappings = dict(re.findall(r'"([^"\n]+)":\s*"([0-9a-fA-F-]{36})"', (root / "src/lib/bunny-videos.ts").read_text()))
    matrix = []
    for lesson_id in approval["lesson_ids"]:
        for locale in LOCALES:
            key = f"{lesson_id}__{locale}"
            if lesson_id != "furniture-m1-cut-list":
                package = root / f"src/lib/technical-education/lessons/{lesson_id.removeprefix('technical-').upper()}__{locale}.json"
                if not package.exists():
                    raise ValueError(f"Reviewed lesson package is missing: {key}")
            expected = builder.fingerprint(lesson_id, locale)
            if not force and revisions.get(key) == expected and key in mappings and ready(mappings[key]):
                continue
            matrix.append({"lesson_id": lesson_id, "locale": locale})
    return matrix


def main():
    result = plan(force=os.environ.get("FORCE", "false").lower() == "true")
    batch, deferred = result[:MAX_BATCH], result[MAX_BATCH:]
    payload = json.dumps({"include": batch}, separators=(",", ":"))
    if path := os.environ.get("GITHUB_OUTPUT"):
        with open(path, "a") as output:
            output.write(f"matrix={payload}\ncount={len(batch)}\ndeferred_count={len(deferred)}\n")
    print(f"Reviewed technical media requiring production: {len(result)}")
    if deferred:
        print(f"::notice::{len(deferred)} cells remain for the next reviewed production checkpoint")
    print(payload)


if __name__ == "__main__":
    main()
