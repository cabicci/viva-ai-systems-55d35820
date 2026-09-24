#!/usr/bin/env python3
"""Read-only inventory audit: return only a general completion status publicly."""
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

LIBRARY = "761387"
BASE = f"https://video.bunnycdn.com/library/{LIBRARY}/videos"
GUID = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
SHA = re.compile(r"^[0-9a-f]{64}$")


def get_json(url, key):
    request = urllib.request.Request(url, headers={"AccessKey": key, "Accept": "application/json"},
                                     method="GET")
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.load(response)
    except (urllib.error.URLError, ValueError):
        raise RuntimeError("Bunny read failed; audit incomplete") from None


def get_library_index(key):
    videos, page, total = [], 1, None
    while page <= 1000:
        url = f"{BASE}?{urllib.parse.urlencode({'page': page, 'itemsPerPage': 100})}"
        result = get_json(url, key)
        if not isinstance(result, dict) or not isinstance(result.get("items"), list):
            raise RuntimeError("Bunny list response incomplete")
        current = result.get("totalItems")
        if not isinstance(current, int) or current < 0 or (total is not None and total != current):
            raise RuntimeError("Bunny list changed during audit")
        if result.get("currentPage", page) != page:
            raise RuntimeError("Bunny pagination mismatch")
        total = current
        videos.extend(result["items"])
        if len(videos) >= total:
            if len(videos) != total:
                raise RuntimeError("Bunny pagination count mismatch")
            return videos
        if not result["items"]:
            raise RuntimeError("Bunny pagination ended early")
        page += 1
    raise RuntimeError("Bunny pagination exceeds safety limit")


def inventory_entries(path):
    manifest = json.loads(Path(path).read_text(encoding="utf-8"))
    entries = manifest.get("entries")
    if str(manifest.get("libraryId")) != LIBRARY or not isinstance(entries, list) or len(entries) != 144:
        raise RuntimeError("Kids manifest must contain 144 entries in library 761387")
    keys = [(entry["lessonId"], entry["locale"]) for entry in entries]
    if len(set(keys)) != 144 or any(not SHA.fullmatch(entry["sha256"]) for entry in entries):
        raise RuntimeError("Kids manifest has duplicate keys or invalid hashes")
    if set(keys) != {(f"kids-l{level}-{lesson:02d}", locale)
                     for level in range(1, 4) for lesson in range(1, 13)
                     for locale in ("ar-EG", "ar-MSA", "ar-Gulf", "en")}:
        raise RuntimeError("Kids manifest does not cover all three levels and four locales")
    return entries


def summarize(entries, index, detail):
    by_key = defaultdict(list)
    for video in index:
        if not isinstance(video, dict) or not isinstance(video.get("title"), str):
            raise RuntimeError("Bunny video list contains invalid entry")
        # Never emit titles, GUIDs, hashes, or API response bodies.
        parts = video["title"].split(" ")
        if len(parts) == 4 and parts[0] == "DRAFT":
            by_key[(parts[1], parts[2])].append(video)
    counts = {"expected": len(entries), "exactUniqueTitle": 0, "videoReady": 0,
              "captionReady": 0, "ready": 0, "missing": []}
    for entry in entries:
        key = (entry["lessonId"], entry["locale"])
        candidates = by_key[key]
        expected_title = f"DRAFT {key[0]} {key[1]} {entry['sha256']}"
        if len(candidates) != 1 or candidates[0]["title"] != expected_title:
            counts["missing"].append(f"{key[0]}/{key[1]}")
            continue
        video_id = candidates[0].get("guid")
        if not isinstance(video_id, str) or not GUID.fullmatch(video_id):
            counts["missing"].append(f"{key[0]}/{key[1]}")
            continue
        counts["exactUniqueTitle"] += 1
        video = detail(video_id)
        if not isinstance(video, dict) or video.get("title") != expected_title:
            raise RuntimeError("Bunny detail diverges from inventory title")
        if str(video.get("videoLibraryId")) != LIBRARY:
            raise RuntimeError("Bunny detail library mismatch")
        original_hash = video.get("originalHash")
        digest_ok = not original_hash or original_hash.lower() == entry["sha256"]
        playable = video.get("status") in (3, 4) and int(video.get("storageSize") or 0) > 0
        good_video = digest_ok and playable
        language = "en" if key[1] == "en" else "ar"
        good_caption = any(isinstance(caption, dict)
                           and caption.get("srclang") == language
                           and caption.get("label") == key[1]
                           for caption in (video.get("captions") or []))
        counts["videoReady"] += bool(good_video)
        counts["captionReady"] += bool(good_caption)
        if good_video and good_caption:
            counts["ready"] += 1
        else:
            counts["missing"].append(f"{key[0]}/{key[1]}")
    counts["missing"].sort()
    return counts
def main():
    if os.environ.get("BUNNY_KIDS_STREAM_LIBRARY_ID") != LIBRARY:
        raise RuntimeError("Kids library configuration mismatch")
    key = os.environ.get("BUNNY_KIDS_STREAM_API_KEY")
    if not key:
        raise RuntimeError("Kids Bunny read credential missing")
    entries = inventory_entries("content/kids/media-inventory.json")
    index = get_library_index(key)
    result = summarize(entries, index, lambda video_id: get_json(f"{BASE}/{video_id}", key))
    if result["ready"] != result["expected"]:
        raise RuntimeError("Kids inventory not fully ready")
    print("Kids media audit complete")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, KeyError, TypeError, AttributeError, ValueError):
        # Never print provider-supplied values, response bodies, GUIDs, or credentials.
        raise SystemExit("Kids Bunny audit incomplete; no readiness result") from None
