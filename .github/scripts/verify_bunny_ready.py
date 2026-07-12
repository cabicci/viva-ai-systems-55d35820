#!/usr/bin/env python3
"""Bounded verification that a Bunny Stream video is playable/ready.

Bunny video status codes (per docs):
  0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished (playable),
  5 Error, 6 UploadFailed, 7 JitSegmenting, 8 JitPlaylistsCreated.

Exits 0 only when status == 4. Exits non-zero on 5/6 (hard fail) or on
exceeding the polling budget.

Env:
  GUID                    Bunny video GUID
  BUNNY_STREAM_API_KEY
  BUNNY_STREAM_LIBRARY_ID
  MAX_ATTEMPTS            optional, default 20
  SLEEP_SECONDS           optional, default 15
"""
from __future__ import annotations
import json
import os
import sys
import time
import urllib.request
import urllib.error

GUID = os.environ["GUID"]
API_KEY = os.environ["BUNNY_STREAM_API_KEY"]
LIBRARY_ID = os.environ["BUNNY_STREAM_LIBRARY_ID"]
MAX_ATTEMPTS = int(os.environ.get("MAX_ATTEMPTS", "20"))
SLEEP_SECONDS = int(os.environ.get("SLEEP_SECONDS", "15"))

URL = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{GUID}"
TERMINAL_FAIL = {5, 6}
READY = 4


def fetch() -> dict:
    req = urllib.request.Request(URL, method="GET")
    req.add_header("AccessKey", API_KEY)
    req.add_header("accept", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main() -> int:
    for i in range(1, MAX_ATTEMPTS + 1):
        try:
            meta = fetch()
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="ignore")
            sys.stderr.write(f"[bunny-verify] HTTP {e.code}: {body}\n")
            if e.code == 404:
                return 10
            time.sleep(SLEEP_SECONDS)
            continue
        status = meta.get("status")
        length = meta.get("length")
        print(f"[bunny-verify] attempt={i} status={status} length={length} available={meta.get('availableResolutions')}")
        if status == READY and (length or 0) > 0:
            playback = f"https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{GUID}?autoplay=false&preload=true"
            print(f"::notice::bunny_ready guid={GUID} status={status} length={length}")
            print(f"::notice::playback_url={playback}")
            return 0
        if status in TERMINAL_FAIL:
            sys.stderr.write(f"::error::Bunny reported terminal failure status={status} for {GUID}\n")
            return 11
        time.sleep(SLEEP_SECONDS)
    sys.stderr.write(
        f"::error::Bunny video {GUID} did not reach ready state within "
        f"{MAX_ATTEMPTS * SLEEP_SECONDS}s (bounded budget).\n"
    )
    return 12


if __name__ == "__main__":
    raise SystemExit(main())
