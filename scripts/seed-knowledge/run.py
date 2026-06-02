#!/usr/bin/env python3
"""
Seed knowledge_chunks with text extracted from every lesson file
in src/components/intro/lessons/. Uses OpenAI text-embedding-3-small
(1536 dims) to match what assistant-runtime expects.

Idempotent: wipes existing chunks for each lesson_id before reinserting.
"""

import os, re, sys, json, time, hashlib
from pathlib import Path
import requests
import psycopg

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "src/components/intro/lessons"
INDEX_FILE = LESSONS_DIR / "index.ts"

# In the sandbox, EMBEDDING_API_KEY env contains only the literal name, not the value.
# Prefer OPENAI_API_KEY which holds the real secret.
EMBED_KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMBEDDING_API_KEY")
if not EMBED_KEY:
    sys.exit("Missing EMBEDDING_API_KEY / OPENAI_API_KEY")
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536

# 1. Parse the lesson registry to get slug -> import name mapping
def load_registry():
    txt = INDEX_FILE.read_text(encoding="utf-8")
    # find the INTRO_LESSON_CONTENT block
    m = re.search(r"INTRO_LESSON_CONTENT[^{]*\{(.*?)\n\}", txt, re.S)
    if not m:
        sys.exit("Cannot parse INTRO_LESSON_CONTENT")
    body = m.group(1)
    slug_to_const = {}
    for line in body.splitlines():
        m2 = re.match(r'\s*"([^"]+)"\s*:\s*([A-Z0-9_]+)\s*,?', line)
        if m2:
            slug_to_const[m2.group(1)] = m2.group(2)
    # const -> source file: parse imports
    const_to_file = {}
    for m3 in re.finditer(r'import\s*\{\s*([A-Z0-9_]+)\s*\}\s*from\s*"\./([^"]+)"', txt):
        const_to_file[m3.group(1)] = m3.group(2)
    out = {}
    for slug, const in slug_to_const.items():
        f = const_to_file.get(const)
        if not f:
            print(f"!! no file for {slug} ({const})", file=sys.stderr)
            continue
        path = LESSONS_DIR / f"{f}.ts"
        if not path.exists():
            print(f"!! file missing: {path}", file=sys.stderr)
            continue
        out[slug] = path
    return out

# 2. Extract human-readable strings (Arabic text + meaningful English)
STRING_RE = re.compile(
    r'"((?:\\.|[^"\\])*)"|\'((?:\\.|[^\'\\])*)\'|`((?:\\.|[^`\\])*)`',
    re.S,
)
# Skip these technical/UI tokens
SKIP_VALUES = {
    "paragraphs","comparison","quote","flow","mission","checklist","numberedList",
    "rule","video","lessonVideo","caseStudy","executionTask","toolBlock","warning",
    "screenshot","concepts","diagram","quiz","primary","accent","neutral","default",
    "HERO","CTA","title","subtitle","caption","alt","label","eyebrow","tone","icon",
    "block","kind","term","meaning","items","statement","steps","src",
}

def extract_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8")
    # strip imports + single-line comments + block comments
    raw = re.sub(r"^import .*?;\s*$", "", raw, flags=re.M)
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    raw = re.sub(r"//[^\n]*", "", raw)
    pieces = []
    seen = set()
    for m in STRING_RE.finditer(raw):
        s = next((g for g in m.groups() if g is not None), "")
        s = s.replace("\\n", " ").replace("\\t", " ").strip()
        s = re.sub(r"\s+", " ", s)
        if not s or len(s) < 3:
            continue
        if s in SKIP_VALUES:
            continue
        # skip pure-ASCII single-word identifiers
        if re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,30}", s) and len(s) < 25:
            continue
        if s in seen:
            continue
        seen.add(s)
        pieces.append(s)
    return "\n".join(pieces)

# 3. Chunk
def chunk_text(text: str, size=600, overlap=80):
    paras = [p.strip() for p in text.split("\n") if p.strip()]
    chunks, cur = [], ""
    for p in paras:
        if len(cur) + len(p) + 1 <= size:
            cur = (cur + "\n" + p).strip()
        else:
            if cur:
                chunks.append(cur)
            if len(p) <= size:
                # start new with overlap from previous
                tail = cur[-overlap:] if cur else ""
                cur = (tail + "\n" + p).strip() if tail else p
            else:
                # long paragraph — hard split
                for i in range(0, len(p), size - overlap):
                    chunks.append(p[i:i + size])
                cur = ""
    if cur:
        chunks.append(cur)
    return chunks

# 4. Derive path_id / module_id / title
def derive_meta(slug: str, text: str):
    if slug.startswith(("builder-","creator-","automator-","analyst-","business-")):
        path_id = slug.split("-",1)[0]
        m = re.match(r"([a-z]+-m\d+)", slug)
        module_id = m.group(1) if m else None
    else:
        path_id = "intro"
        module_id = None
    # title = first short Arabic/meaningful line
    title = None
    for line in text.split("\n"):
        line = line.strip()
        if 5 <= len(line) <= 80 and any(c >= '\u0600' for c in line):
            title = line
            break
    if not title:
        title = slug
    return path_id, module_id, title

# 5. Embedding batch
def embed_batch(texts):
    r = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {EMBED_KEY}",
            "Content-Type": "application/json",
        },
        json={"model": EMBED_MODEL, "input": texts},
        timeout=120,
    )
    if not r.ok:
        raise RuntimeError(f"embed failed {r.status_code}: {r.text[:300]}")
    return [d["embedding"] for d in r.json()["data"]]

# 6. Main
def main():
    dsn = os.environ.get("SUPABASE_DB_URL")
    pg = psycopg.connect(dsn, autocommit=True) if dsn else psycopg.connect(autocommit=True)
    cur = pg.cursor()
    registry = load_registry()
    print(f"Lessons in registry: {len(registry)}")

    # Wipe per-lesson before insert (idempotent re-runs)
    try:
        cur.execute("DELETE FROM knowledge_chunks")
        print("Wiped existing knowledge_chunks")
    except Exception as e:
        print(f"Skipping wipe ({e}); will rely on prior migration to have cleared rows")

    total_chunks = 0
    skipped = []
    for slug, path in sorted(registry.items()):
        text = extract_text(path)
        if len(text) < 50:
            skipped.append(slug)
            print(f"-- {slug}: too little text ({len(text)} chars)")
            continue
        path_id, module_id, title = derive_meta(slug, text)
        chunks = chunk_text(text)
        if not chunks:
            skipped.append(slug)
            continue
        # embed in batches of 64
        embs = []
        for i in range(0, len(chunks), 64):
            batch = chunks[i:i+64]
            embs.extend(embed_batch(batch))
        rows = []
        for idx, (c, e) in enumerate(zip(chunks, embs)):
            src_id = f"{slug}#chunk:{idx}"
            vec = "[" + ",".join(f"{x:.7f}" for x in e) + "]"
            rows.append((src_id, "lesson", slug, path_id, module_id, slug, title, c, vec))
        cur.executemany(
            """INSERT INTO knowledge_chunks
               (source_id, source_type, lesson_id, path_id, module_id, title, content, embedding, metadata)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s::extensions.vector,'{}'::jsonb)""",
            [(r[0], r[1], r[2], r[3], r[4], r[6], r[7], r[8]) for r in rows],
        )
        total_chunks += len(rows)
        print(f"OK {slug}  path={path_id} module={module_id}  chunks={len(rows)}")
        time.sleep(0.1)

    print(f"\nDone. {total_chunks} chunks across {len(registry)-len(skipped)} lessons. Skipped: {skipped}")
    cur.close()
    pg.close()

if __name__ == "__main__":
    main()