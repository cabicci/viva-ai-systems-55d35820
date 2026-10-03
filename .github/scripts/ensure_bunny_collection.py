#!/usr/bin/env python3
"""Find or create the owner's technical-education Bunny Stream collection."""
from __future__ import annotations
import json
import os
from pathlib import Path
import urllib.parse
import urllib.request

NAME = "مسارات التعليم الفني"


def ensure_collection(request):
    matches = []
    page = 1
    while True:
        data = request("GET", "?" + urllib.parse.urlencode({"search": NAME, "page": page, "itemsPerPage": 100}))
        items = data.get("items") or []
        matches.extend(item for item in items if item.get("name") == NAME)
        if page * data.get("itemsPerPage", 100) >= data.get("totalItems", 0):
            break
        if not items:
            raise RuntimeError("Collection pagination ended before the reported total")
        page += 1
    if len(matches) > 1:
        raise RuntimeError("Multiple collections already have the requested name; no new collection created")
    collection = matches[0] if matches else request("POST", "", {"name": NAME})
    if not collection.get("guid") or collection.get("name") != NAME:
        raise RuntimeError("Bunny did not return the requested collection")
    return str(collection["guid"])


def main():
    library = os.environ["BUNNY_STREAM_LIBRARY_ID"]
    key = os.environ["BUNNY_STREAM_API_KEY"]
    base = f"https://video.bunnycdn.com/library/{library}/collections"

    def request(method, suffix, payload=None):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(base + suffix, data=data, method=method,
            headers={"AccessKey": key, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.loads(response.read())

    guid = ensure_collection(request)
    print(f"Collection ready: {NAME} ({guid})")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with Path(output).open("a") as file:
            file.write(f"collection_id={guid}\n")


if __name__ == "__main__":
    main()
