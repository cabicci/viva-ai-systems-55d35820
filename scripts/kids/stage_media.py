#!/usr/bin/env python3
"""Stage exactly one reviewed-source Kids video in its isolated Bunny library."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

LIBRARY_ID = "761387"
BASE = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos"


def api(method: str, url: str, key: str, payload: bytes | None = None,
        content_type: str | None = None) -> dict:
    request = urllib.request.Request(url, data=payload, method=method)
    request.add_header("AccessKey", key)
    request.add_header("Accept", "application/json")
    if content_type:
        request.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Bunny {method} failed: HTTP {error.code}") from None

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=Path, default=Path("content/kids/media-inventory.json"))
    parser.add_argument("--media-root", type=Path, required=True)
    parser.add_argument("--lesson", required=True)
    parser.add_argument("--locale", required=True)
    parser.add_argument("--receipt", type=Path)
    parser.add_argument("--stage", action="store_true", help="Create/upload one draft video")
    args = parser.parse_args()
    inventory = json.loads(args.inventory.read_text(encoding="utf-8"))
    if str(inventory.get("libraryId")) != LIBRARY_ID:
        raise SystemExit("Kids inventory library mismatch")
    matched = [entry for entry in inventory["entries"]
               if entry["lessonId"] == args.lesson and entry["locale"] == args.locale]
    if len(matched) != 1:
        raise SystemExit("Expected exactly one Kids lesson/locale")
    entry = matched[0]
    root = args.media_root.resolve()
    source = (root / entry["source"]).resolve()
    if not source.is_relative_to(root) or not source.is_file():
        raise SystemExit("Kids media source missing or outside media root")

    with source.open("rb") as file:
        digest = hashlib.file_digest(file, "sha256").hexdigest()
    if digest != entry["sha256"] or source.stat().st_size != entry["bytes"]:
        raise SystemExit("Kids media checksum or size mismatch")
    print(f"Verified {args.lesson}/{args.locale}: SHA-256 and byte count")
    if not args.stage:
        return
    if not args.receipt:
        raise SystemExit("--receipt is required for staging")
    if os.getenv("BUNNY_KIDS_STREAM_LIBRARY_ID") != LIBRARY_ID:
        raise SystemExit("Kids Bunny library ID missing or mismatched")
    key = os.getenv("BUNNY_KIDS_STREAM_API_KEY", "")
    if not key:
        raise SystemExit("Kids Bunny API key missing")
    title = f"DRAFT {args.lesson} {args.locale} {digest[:16]}"
    search = urllib.parse.urlencode({"search": title, "itemsPerPage": 100})
    listing = api("GET", f"{BASE}?{search}", key)
    matches = [video for video in listing.get("items", []) if video.get("title") == title]
    if len(matches) > 1:
        raise SystemExit("Duplicate Bunny titles; resolve before staging")

    if matches:
        video = matches[0]
        guid = video["guid"]
        if str(video.get("videoLibraryId")) != LIBRARY_ID:
            raise SystemExit("Existing video library mismatch")
        if video.get("hasOriginal") or int(video.get("storageSize") or 0) > 0:
            state = "already-staged"
        else:
            state = "resumed-upload"
    else:
        video = api("POST", BASE, key, json.dumps({"title": title}).encode(), "application/json")
        if str(video.get("videoLibraryId")) != LIBRARY_ID or not video.get("guid"):
            raise SystemExit("Created video did not match Kids library")
        guid = video["guid"]
        state = "new-upload"
    if state != "already-staged":
        api("PUT", f"{BASE}/{guid}", key, source.read_bytes(), "application/octet-stream")
    metadata = api("GET", f"{BASE}/{guid}", key)
    if str(metadata.get("videoLibraryId")) != LIBRARY_ID:
        raise SystemExit("Staged video library mismatch")
    receipt = {"lessonId": args.lesson, "locale": args.locale, "libraryId": int(LIBRARY_ID),
               "guid": guid, "sha256": digest, "bytes": entry["bytes"],
               "stageState": state, "bunnyStatus": metadata.get("status"),
               "contentApproved": False}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(f"Kids draft media {state}; receipt saved; playback remains gated")


if __name__ == "__main__":
    main()
