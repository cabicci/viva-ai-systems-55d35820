#!/usr/bin/env python3
"""Ping each GEMINI_API_KEY* env var with a tiny request and report status.

Usage: python3 remotion/scripts/diag-keys.py

Tells you instantly which keys are alive, 429-throttled, or 403-revoked,
so you can decide whether to keep restricting to GEMINI_API_KEY_4."""
from __future__ import annotations
import json
import os
import time
import urllib.request
import urllib.error

MODEL = "gemini-2.5-flash"
URL_TPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent?key={key}"
)


def ping(name: str, key: str) -> str:
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": "hi"}]}],
        "generationConfig": {"maxOutputTokens": 4, "temperature": 0},
    }).encode()
    req = urllib.request.Request(
        URL_TPL.format(model=MODEL, key=key),
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            r.read()
        return f"OK   ({time.time()-t0:.2f}s)"
    except urllib.error.HTTPError as e:
        snippet = e.read().decode()[:140].replace("\n", " ")
        return f"HTTP {e.code} ({time.time()-t0:.2f}s) :: {snippet}"
    except Exception as e:
        return f"ERR  ({time.time()-t0:.2f}s) :: {e}"


def main() -> int:
    names = ["GEMINI_API_KEY"] + [f"GEMINI_API_KEY_{i}" for i in range(2, 10)]
    found = [(n, os.environ.get(n)) for n in names]
    found = [(n, k) for n, k in found if k]
    if not found:
        print("No GEMINI_API_KEY* env vars set.")
        return 1
    print(f"Pinging {len(found)} key(s) with model={MODEL}\n")
    for name, key in found:
        masked = key[:6] + "…" + key[-4:]
        print(f"{name:22} {masked:14} -> {ping(name, key)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())