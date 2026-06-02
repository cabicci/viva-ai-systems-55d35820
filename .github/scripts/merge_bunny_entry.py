#!/usr/bin/env python3
"""Re-apply ONLY this lesson's guid into src/lib/bunny-videos.ts on top of the
latest origin tree. Reads the guid from the stashed copy passed as argv[1].

Env: LID
"""
from __future__ import annotations
import os, re, sys

LID = os.environ["LID"]
STASH = sys.argv[1]
TARGET = "src/lib/bunny-videos.ts"

stash_src = open(STASH).read()
m = re.search(rf'"{re.escape(LID)}"\s*:\s*"([^"]+)"', stash_src)
if not m:
    sys.stderr.write(f"[merge_bunny] no entry for {LID} in stash {STASH}\n")
    sys.exit(1)
guid = m.group(1)

src = open(TARGET).read()
entry = f'  "{LID}": "{guid}",'
pat = re.compile(rf'^(\s*)"{re.escape(LID)}":\s*"([^"]+)",\s*$', re.MULTILINE)
if pat.search(src):
    src = pat.sub(entry, src, count=1)
else:
    block_re = re.compile(
        r'(export const BUNNY_VIDEO_GUIDS:\s*Record<string,\s*string>\s*=\s*\{)([\s\S]*?)(\n\};)'
    )
    bm = block_re.search(src)
    if not bm:
        sys.stderr.write("Could not locate BUNNY_VIDEO_GUIDS block\n")
        sys.exit(1)
    head, body, tail = bm.group(1), bm.group(2), bm.group(3)
    lines = [ln for ln in body.split("\n") if ln.strip()]
    entry_re = re.compile(r'^\s*"([^"]+)":\s*"[^"]+",\s*$')
    kv, other = [], []
    for ln in lines:
        mm = entry_re.match(ln)
        (kv if mm else other).append((mm.group(1), ln) if mm else ln)
    kv.append((LID, entry))
    kv.sort(key=lambda x: x[0])
    new_body = "\n" + "\n".join([*other, *(ln for _, ln in kv)]) + "\n"
    src = src[:bm.start()] + head + new_body + tail + src[bm.end():]

open(TARGET, "w").write(src)
print(f"[merge_bunny] applied {LID} -> {guid}")
