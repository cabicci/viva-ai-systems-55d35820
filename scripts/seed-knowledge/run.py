#!/usr/bin/env python3
"""
Seed knowledge_chunks from frozen learner curriculum (PATHS ∩ INTRO_LESSON_CONTENT).

Scope: exactly 100 learner slugs per CURRICULUM_FREEZE_CONTRACT.md.
Excludes 4 archived Business lessons from registry.

Safety defaults (no DB / no API unless explicitly enabled):
  DRY_RUN=true
  REQUIRE_CONFIRM_SEED=true
  CONFIRM_SEED_100_LESSONS must be true for DELETE/INSERT
  MAX_EMBEDDING_REQUESTS=150

Run dry validation only:
  python scripts/seed-knowledge/run.py

Paid seed (after review):
  DRY_RUN=false REQUIRE_CONFIRM_SEED=true CONFIRM_SEED_100_LESSONS=true \\
    OPENAI_API_KEY=... SUPABASE_DB_URL=... python scripts/seed-knowledge/run.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSONS_DIR = ROOT / "src/components/intro/lessons"
INDEX_FILE = LESSONS_DIR / "index.ts"
CURRICULUM_FILE = ROOT / "src/lib/curriculum-data.ts"

# Keep in sync with src/lib/archived-lessons.ts ARCHIVED_LESSON_IDS
ARCHIVED_BUSINESS_SLUGS = frozenset({
    "business-m1-l3-ai-thinking-partner",
    "business-m2-l4-pricing-cash-flow",
    "business-m3-l4-hiring-onboarding",
    "business-m4-l5-business-os-dashboard",
})

EXPECTED_LEARNER_COUNT = 100
PATH_IDS = ("intro", "business", "creator", "analyst", "automator", "builder")
EXPECTED_PATH_COUNTS = {
    "intro": 7,
    "business": 13,
    "creator": 19,
    "analyst": 14,
    "automator": 18,
    "builder": 29,
}
EMBED_BATCH_SIZE = 64
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536
EXTRACTION_MODE = "regex/string-scrape (not structured INTRO_LESSON_CONTENT blocks)"

# --- env guards ---
def env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


DRY_RUN = env_bool("DRY_RUN", True)
REQUIRE_CONFIRM_SEED = env_bool("REQUIRE_CONFIRM_SEED", True)
CONFIRM_SEED_100 = env_bool("CONFIRM_SEED_100_LESSONS", False)
MAX_EMBEDDING_REQUESTS = int(os.environ.get("MAX_EMBEDDING_REQUESTS", "150"))


def fail(msg: str) -> None:
    print(f"ABORT: {msg}", file=sys.stderr)
    sys.exit(1)


# 1. Registry: slug -> lesson file path
def load_registry() -> dict[str, Path]:
    txt = INDEX_FILE.read_text(encoding="utf-8")
    m = re.search(r"INTRO_LESSON_CONTENT[^{]*\{(.*?)\n\}", txt, re.S)
    if not m:
        fail("Cannot parse INTRO_LESSON_CONTENT from index.ts")
    body = m.group(1)
    slug_to_const: dict[str, str] = {}
    for line in body.splitlines():
        m2 = re.match(r'\s*"([^"]+)"\s*:\s*([A-Z0-9_]+)\s*,?', line)
        if m2:
            slug_to_const[m2.group(1)] = m2.group(2)
    const_to_file: dict[str, str] = {}
    for m3 in re.finditer(r'import\s*\{\s*([A-Z0-9_]+)\s*\}\s*from\s*"\./([^"]+)"', txt):
        const_to_file[m3.group(1)] = m3.group(2)
    out: dict[str, Path] = {}
    for slug, const in slug_to_const.items():
        f = const_to_file.get(const)
        if not f:
            print(f"WARN: no import file for registry slug {slug} ({const})", file=sys.stderr)
            continue
        path = LESSONS_DIR / f"{f}.ts"
        if not path.exists():
            print(f"WARN: missing file for {slug}: {path}", file=sys.stderr)
            continue
        out[slug] = path
    return out


# 2. Learner slugs from PATHS (available lessons only)
_SHIPPED_RE = re.compile(
    r"(?:builderShipped|automatorShipped|analystShipped|businessShipped|shippedLesson)"
    r'\(\s*\d+\s*,\s*"([^"]+)"',
)
# Creator/intro lessons use multiline lesson(..., "available", ...) blocks.
_AVAILABLE_LESSON_RE = re.compile(
    r'lesson\(\s*\d+\s*,\s*"([^"]+)"[\s\S]*?"available"',
)


def load_learner_slugs() -> set[str]:
    txt = CURRICULUM_FILE.read_text(encoding="utf-8")
    slugs: set[str] = set()
    slugs.update(_SHIPPED_RE.findall(txt))
    slugs.update(_AVAILABLE_LESSON_RE.findall(txt))
    if not slugs:
        fail("Cannot parse learner slugs from curriculum-data.ts PATHS")
    return slugs


def compute_seed_scope(registry: dict[str, Path], learner_slugs: set[str]) -> list[str]:
    planned = sorted(learner_slugs & registry.keys())
    archived_hit = [s for s in planned if s in ARCHIVED_BUSINESS_SLUGS]
    if archived_hit:
        fail(f"Archived Business slugs must not be seeded: {archived_hit}")
    if len(planned) != EXPECTED_LEARNER_COUNT:
        fail(
            f"Planned seed count is {len(planned)}, expected exactly "
            f"{EXPECTED_LEARNER_COUNT} (PATHS ∩ registry, archived excluded)"
        )
    missing = [s for s in planned if s not in registry or not registry[s].exists()]
    if missing:
        fail(f"Allowed learner slugs missing content files: {missing}")
    return planned


# 3. Extraction (regex/string — unchanged for this step)
STRING_RE = re.compile(
    r'"((?:\\.|[^"\\])*)"|\'((?:\\.|[^\'\\])*)\'|`((?:\\.|[^`\\])*)`',
    re.S,
)
SKIP_VALUES = {
    "paragraphs", "comparison", "quote", "flow", "mission", "checklist", "numberedList",
    "rule", "video", "lessonVideo", "caseStudy", "executionTask", "toolBlock", "warning",
    "screenshot", "concepts", "diagram", "quiz", "primary", "accent", "neutral", "default",
    "HERO", "CTA", "title", "subtitle", "caption", "alt", "label", "eyebrow", "tone", "icon",
    "block", "kind", "term", "meaning", "items", "statement", "steps", "src",
}


def extract_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8")
    raw = re.sub(r"^import .*?;\s*$", "", raw, flags=re.M)
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    raw = re.sub(r"//[^\n]*", "", raw)
    pieces: list[str] = []
    seen: set[str] = set()
    for m in STRING_RE.finditer(raw):
        s = next((g for g in m.groups() if g is not None), "")
        s = s.replace("\\n", " ").replace("\\t", " ").strip()
        s = re.sub(r"\s+", " ", s)
        if not s or len(s) < 3:
            continue
        if s in SKIP_VALUES:
            continue
        if re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,30}", s) and len(s) < 25:
            continue
        if s in seen:
            continue
        seen.add(s)
        pieces.append(s)
    return "\n".join(pieces)


def chunk_text(text: str, size: int = 600, overlap: int = 80) -> list[str]:
    paras = [p.strip() for p in text.split("\n") if p.strip()]
    chunks: list[str] = []
    cur = ""
    for p in paras:
        if len(cur) + len(p) + 1 <= size:
            cur = (cur + "\n" + p).strip()
        else:
            if cur:
                chunks.append(cur)
            if len(p) <= size:
                tail = cur[-overlap:] if cur else ""
                cur = (tail + "\n" + p).strip() if tail else p
            else:
                for i in range(0, len(p), size - overlap):
                    chunks.append(p[i : i + size])
                cur = ""
    if cur:
        chunks.append(cur)
    return chunks


def path_id_from_slug(slug: str) -> str:
    if slug.startswith(("builder-", "creator-", "automator-", "analyst-", "business-")):
        return slug.split("-", 1)[0]
    return "intro"


def planned_seed_counts_by_path(planned_slugs: list[str]) -> dict[str, int]:
    counts = {path_id: 0 for path_id in PATH_IDS}
    for slug in planned_slugs:
        path_id = path_id_from_slug(slug)
        if path_id not in counts:
            fail(f"Unexpected path_id for slug {slug}: {path_id}")
        counts[path_id] += 1
    return counts


def derive_meta(slug: str, text: str) -> tuple[str, str | None, str]:
    path_id = path_id_from_slug(slug)
    if path_id != "intro":
        m = re.match(r"([a-z]+-m\d+)", slug)
        module_id = m.group(1) if m else None
    else:
        module_id = None
    title = slug
    for line in text.split("\n"):
        line = line.strip()
        if 5 <= len(line) <= 80 and any(c >= "\u0600" for c in line):
            title = line
            break
    return path_id, module_id, title


def estimate_embedding_requests(total_chunks: int) -> int:
    if total_chunks == 0:
        return 0
    return (total_chunks + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE


def build_seed_plan(registry: dict[str, Path], planned_slugs: list[str]) -> dict:
    per_lesson: list[dict] = []
    total_chunks = 0
    too_short: list[str] = []
    for slug in planned_slugs:
        text = extract_text(registry[slug])
        if len(text) < 50:
            too_short.append(slug)
            continue
        chunks = chunk_text(text)
        if not chunks:
            too_short.append(slug)
            continue
        path_id, module_id, title = derive_meta(slug, text)
        per_lesson.append({
            "slug": slug,
            "path_id": path_id,
            "module_id": module_id,
            "title": title,
            "chunk_count": len(chunks),
            "text_chars": len(text),
        })
        total_chunks += len(chunks)
    if too_short:
        fail(f"Allowed learner slugs with insufficient extractable text: {too_short}")
    embed_requests = estimate_embedding_requests(total_chunks)
    return {
        "planned_slugs": planned_slugs,
        "lesson_count": len(per_lesson),
        "total_chunks": total_chunks,
        "estimated_embedding_requests": embed_requests,
        "per_lesson": per_lesson,
    }


def print_dry_run_report(
    registry: dict[str, Path],
    learner_slugs: set[str],
    planned_slugs: list[str],
    plan: dict,
) -> None:
    archived_in_registry = sorted(ARCHIVED_BUSINESS_SLUGS & registry.keys())
    counts_by_path = planned_seed_counts_by_path(planned_slugs)
    total_from_path_counts = sum(counts_by_path.values())
    slug_count = len(planned_slugs)
    if total_from_path_counts != slug_count:
        fail(
            f"planned_seed_total_from_path_counts ({total_from_path_counts}) "
            f"!= planned_seed_slugs_count ({slug_count})"
        )
    if counts_by_path != EXPECTED_PATH_COUNTS:
        fail(
            f"planned_seed_counts_by_path mismatch: expected {EXPECTED_PATH_COUNTS}, "
            f"got {counts_by_path}"
        )
    report = {
        "dry_run": DRY_RUN,
        "db_writes_disabled": DRY_RUN or not CONFIRM_SEED_100,
        "api_calls_disabled": DRY_RUN,
        "extraction_mode": EXTRACTION_MODE,
        "total_registry_slugs": len(registry),
        "total_learner_slugs_paths": len(learner_slugs),
        "archived_excluded_slugs": sorted(ARCHIVED_BUSINESS_SLUGS),
        "archived_in_registry_not_on_path": archived_in_registry,
        "planned_seed_counts_by_path": counts_by_path,
        "planned_seed_total_from_path_counts": total_from_path_counts,
        "planned_seed_slugs_count": slug_count,
        "planned_seed_slugs": planned_slugs,
        "missing_content_slugs": [],
        "total_chunks": plan["total_chunks"],
        "estimated_embedding_requests": plan["estimated_embedding_requests"],
        "max_embedding_requests": MAX_EMBEDDING_REQUESTS,
        "require_confirm_seed": REQUIRE_CONFIRM_SEED,
        "confirm_seed_100_lessons": CONFIRM_SEED_100,
    }
    print("=== Assistant P0 seed dry-run report ===")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nPlanned seed lesson count: {len(planned_slugs)}")
    print(f"Estimated embedding API requests: {plan['estimated_embedding_requests']} (batch size {EMBED_BATCH_SIZE})")
    print(f"Extraction: {EXTRACTION_MODE}")
    if plan["estimated_embedding_requests"] > MAX_EMBEDDING_REQUESTS:
        fail(
            f"Estimated embedding requests ({plan['estimated_embedding_requests']}) "
            f"exceed MAX_EMBEDDING_REQUESTS ({MAX_EMBEDDING_REQUESTS})"
        )


def assert_paid_run_allowed(plan: dict) -> None:
    if DRY_RUN:
        print("DRY_RUN=true — skipping DB and OpenAI calls.")
        return
    if REQUIRE_CONFIRM_SEED and not CONFIRM_SEED_100:
        fail(
            "Paid run blocked: set CONFIRM_SEED_100_LESSONS=true to authorize "
            "scoped DELETE/INSERT for exactly 100 learner lessons"
        )
    embed_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMBEDDING_API_KEY")
    if not embed_key:
        fail("Paid run blocked: missing OPENAI_API_KEY / EMBEDDING_API_KEY")
    dsn = os.environ.get("SUPABASE_DB_URL")
    if not dsn:
        fail("Paid run blocked: missing SUPABASE_DB_URL")
    if plan["estimated_embedding_requests"] > MAX_EMBEDDING_REQUESTS:
        fail(
            f"Estimated embedding requests ({plan['estimated_embedding_requests']}) "
            f"exceed MAX_EMBEDDING_REQUESTS ({MAX_EMBEDDING_REQUESTS})"
        )
    print(
        "PAID RUN CONFIRMED: embeddings + scoped DB writes for "
        f"{plan['lesson_count']} lessons / {plan['total_chunks']} chunks / "
        f"{plan['estimated_embedding_requests']} embedding requests."
    )


def run_paid_seed(registry: dict[str, Path], plan: dict) -> None:
    import requests
    import psycopg

    embed_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMBEDDING_API_KEY")
    dsn = os.environ.get("SUPABASE_DB_URL")
    assert embed_key and dsn

    planned_slugs = plan["planned_slugs"]

    pg = psycopg.connect(dsn, autocommit=True)
    cur = pg.cursor()

    # Scoped delete: lesson chunks for allowed slugs only (by lesson_id)
    placeholders = ",".join(["%s"] * len(planned_slugs))
    cur.execute(
        f"""
        DELETE FROM knowledge_chunks
        WHERE source_type = 'lesson'
          AND lesson_id IN ({placeholders})
        """,
        planned_slugs,
    )
    deleted = cur.rowcount
    print(f"Scoped DELETE: removed {deleted} rows (source_type=lesson, lesson_id in 100 slugs)")

    total_chunks = 0
    embed_requests = 0

    def embed_batch(texts: list[str]) -> list[list[float]]:
        nonlocal embed_requests
        if embed_requests >= MAX_EMBEDDING_REQUESTS:
            fail(f"MAX_EMBEDDING_REQUESTS ({MAX_EMBEDDING_REQUESTS}) reached — stopping")
        embed_requests += 1
        r = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {embed_key}",
                "Content-Type": "application/json",
            },
            json={"model": EMBED_MODEL, "input": texts},
            timeout=120,
        )
        if not r.ok:
            fail(f"embed failed {r.status_code}: {r.text[:300]}")
        return [d["embedding"] for d in r.json()["data"]]

    for entry in plan["per_lesson"]:
        slug = entry["slug"]
        path = registry[slug]
        text = extract_text(path)
        path_id, module_id, title = derive_meta(slug, text)
        chunks = chunk_text(text)
        embs: list[list[float]] = []
        for i in range(0, len(chunks), EMBED_BATCH_SIZE):
            batch = chunks[i : i + EMBED_BATCH_SIZE]
            embs.extend(embed_batch(batch))
        rows = []
        for idx, (c, e) in enumerate(zip(chunks, embs)):
            src_id = f"{slug}#chunk:{idx}"
            vec = "[" + ",".join(f"{x:.7f}" for x in e) + "]"
            rows.append((src_id, "lesson", slug, path_id, module_id, title, c, vec))
        cur.executemany(
            """INSERT INTO knowledge_chunks
               (source_id, source_type, lesson_id, path_id, module_id, title, content, embedding, metadata)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s::extensions.vector,'{}'::jsonb)""",
            rows,
        )
        total_chunks += len(rows)
        print(f"OK {slug} path={path_id} module={module_id} chunks={len(rows)}")
        time.sleep(0.1)

    print(f"\nDone. {total_chunks} chunks across {len(plan['per_lesson'])} lessons.")
    print(f"Embedding API requests used: {embed_requests}")
    cur.close()
    pg.close()


def main() -> None:
    registry = load_registry()
    learner_slugs = load_learner_slugs()
    planned_slugs = compute_seed_scope(registry, learner_slugs)
    plan = build_seed_plan(registry, planned_slugs)
    print_dry_run_report(registry, learner_slugs, planned_slugs, plan)
    assert_paid_run_allowed(plan)
    if not DRY_RUN:
        run_paid_seed(registry, plan)


if __name__ == "__main__":
    main()
