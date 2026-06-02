#!/usr/bin/env python3
"""Upload a built lesson MP4 to Bunny Stream and update src/lib/bunny-videos.ts.

Env:
  LID                       Lesson id (e.g. intro-m1-l3-setup-your-ai)
  BUNNY_STREAM_API_KEY      Bunny Stream API access key
  BUNNY_STREAM_LIBRARY_ID   Bunny Stream library id (numeric)
"""
from __future__ import annotations
import os
import re
import sys
import json
import urllib.request
import urllib.error

LID = os.environ["LID"]
API_KEY = os.environ["BUNNY_STREAM_API_KEY"]
LIBRARY_ID = os.environ["BUNNY_STREAM_LIBRARY_ID"]

MP4_PATH = f"public/lessons/intro/{LID}.mp4"
REGISTRY_PATH = "src/lib/bunny-videos.ts"
CURRICULUM_PATH = "src/lib/curriculum-data.ts"
BASE = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos"
GUID_OUT = f"/tmp/bunny-guid-{LID}.txt"


def lookup_title(lid: str) -> str:
    try:
        src = open(CURRICULUM_PATH).read()
    except FileNotFoundError:
        return lid
    m = re.search(rf'"{re.escape(lid)}"\s*,\s*"([^"]+)"', src)
    return m.group(1) if m else lid


def _req(method: str, url: str, *, body: bytes | None = None, ctype: str | None = None) -> bytes:
    req = urllib.request.Request(url, method=method, data=body)
    req.add_header("AccessKey", API_KEY)
    req.add_header("accept", "application/json")
    if ctype:
        req.add_header("content-type", ctype)
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP {e.code} {method} {url}: {e.read().decode(errors='ignore')}\n")
        raise


def create_video(title: str) -> str:
    payload = json.dumps({"title": title}).encode()
    raw = _req("POST", BASE, body=payload, ctype="application/json")
    data = json.loads(raw.decode())
    guid = data.get("guid")
    if not guid:
        raise RuntimeError(f"No guid in create response: {data}")
    return guid


def upload_mp4(guid: str, mp4_path: str) -> None:
    with open(mp4_path, "rb") as f:
        data = f.read()
    _req("PUT", f"{BASE}/{guid}", body=data, ctype="application/octet-stream")


def delete_video(guid: str) -> None:
    try:
        _req("DELETE", f"{BASE}/{guid}")
    except Exception as e:
        sys.stderr.write(f"(warn) failed to delete old bunny video {guid}: {e}\n")


def update_registry(lid: str, guid: str) -> str | None:
    """Insert/replace the `"<lid>": "<guid>",` entry in BUNNY_VIDEO_GUIDS.
    Returns the previous guid if it was replaced, else None.
    """
    src = open(REGISTRY_PATH).read()
    entry = f'  "{lid}": "{guid}",'
    pattern = re.compile(rf'^(\s*)"{re.escape(lid)}":\s*"([^"]+)",\s*$', re.MULTILINE)
    m = pattern.search(src)
    prev: str | None = None
    if m:
        prev = m.group(2)
        if prev == guid:
            return None
        src = pattern.sub(entry, src, count=1)
    else:
        # Insert alphabetically inside `export const BUNNY_VIDEO_GUIDS: Record<string, string> = { ... };`
        block_re = re.compile(
            r'(export const BUNNY_VIDEO_GUIDS:\s*Record<string,\s*string>\s*=\s*\{)([\s\S]*?)(\n\};)'
        )
        bm = block_re.search(src)
        if not bm:
            raise RuntimeError("Could not locate BUNNY_VIDEO_GUIDS block in registry")
        head, body, tail = bm.group(1), bm.group(2), bm.group(3)
        lines = [ln for ln in body.split("\n") if ln.strip()]
        # Keep any leading/inline comments untouched; sort only entry lines.
        entry_re = re.compile(r'^\s*"([^"]+)":\s*"[^"]+",\s*$')
        kv_lines: list[tuple[str, str]] = []
        other_lines: list[str] = []
        for ln in lines:
            mm = entry_re.match(ln)
            if mm:
                kv_lines.append((mm.group(1), ln))
            else:
                other_lines.append(ln)
        kv_lines.append((lid, entry))
        kv_lines.sort(key=lambda kv: kv[0])
        new_body = "\n" + "\n".join([*other_lines, *(ln for _, ln in kv_lines)]) + "\n"
        src = src[: bm.start()] + head + new_body + tail + src[bm.end():]
    open(REGISTRY_PATH, "w").write(src)
    return prev


def main() -> int:
    # If we already uploaded in a previous step of the same job, reuse the guid
    # and just (re-)apply the registry entry. This makes the script idempotent
    # across retries.
    if os.path.isfile(GUID_OUT):
        guid = open(GUID_OUT).read().strip()
        if guid:
            print(f"[bunny] reusing existing guid {guid} from {GUID_OUT}", flush=True)
            update_registry(LID, guid)
            return 0
    if not os.path.isfile(MP4_PATH):
        sys.stderr.write(f"MP4 not found at {MP4_PATH}\n")
        return 1
    title = lookup_title(LID)
    print(f"[bunny] creating video for {LID} (title: {title!r})", flush=True)
    guid = create_video(title)
    print(f"[bunny] created guid={guid}, uploading {MP4_PATH} ...", flush=True)
    try:
        upload_mp4(guid, MP4_PATH)
    except Exception:
        # If upload fails, clean up the empty video shell.
        delete_video(guid)
        raise
    print(f"[bunny] upload complete; updating {REGISTRY_PATH}", flush=True)
    prev = update_registry(LID, guid)
    if prev and prev != guid:
        print(f"[bunny] replaced previous guid {prev} for {LID}; deleting old video", flush=True)
        delete_video(prev)
    with open(GUID_OUT, "w") as f:
        f.write(guid)
    print(f"[bunny] done: {LID} -> {guid}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())