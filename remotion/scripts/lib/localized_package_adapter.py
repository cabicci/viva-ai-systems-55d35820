"""Convert a localized lesson package (src/lib/locale-lessons/<locale>/lessons/<lid>.json)
into the `blocks` shape consumed by script_writer.generate_scenes_cached.

Deterministic — no LLM, no translation, no fallback to another locale.
Everything the script writer sees comes from the localized package for the
exact (lesson_id, locale) pair.

The output mirrors the block shapes produced by lesson-loader.mjs for legacy
TypeScript lessons:

  { kind: "paragraphs", eyebrow: "HERO", title, body }
  { kind: "paragraphs", title, body, bullets? }
  { kind: "concepts", items: [{ term, definition, tag? }] }
  { kind: "comparison", title, left: {label, body}, right: {label, body} }
  { kind: "quiz", ... }   ← only if the package actually declares a quiz section
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path
from typing import Any


GLOSSARY_ROLES = {"glossary", "vocabulary", "terms"}
COMPARE_ROLES = {"compare", "comparison", "contrast"}
QUIZ_ROLES = {"quiz", "check", "assessment"}


def _clean_markdown(text: str) -> str:
    """Strip markdown bold/italic markers; keep the words. Idempotent."""
    if not text:
        return ""
    out = text
    out = re.sub(r"\*\*(.+?)\*\*", r"\1", out)
    out = re.sub(r"__([^_]+)__", r"\1", out)
    out = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"\1", out)
    return out.strip()


def _paragraph_body(section: dict[str, Any]) -> str:
    md = section.get("contentMarkdown") or ""
    md = re.sub(r"^\|.*\|$", "", md, flags=re.MULTILINE)  # drop table lines
    md = re.sub(r"\n{2,}", "\n", md).strip()
    return _clean_markdown(md)


def _bullets(section: dict[str, Any]) -> list[str]:
    raw = section.get("bullets") or []
    out: list[str] = []
    for b in raw:
        cleaned = _clean_markdown(b or "").strip(" -•\t")
        if cleaned:
            out.append(cleaned)
    return out


def _tables_to_concepts(section: dict[str, Any]) -> list[dict[str, str]]:
    """A 2-3 column table (term | meaning [| example]) → concept items."""
    items: list[dict[str, str]] = []
    for table in section.get("tables") or []:
        headers = [h.strip() for h in (table.get("headers") or [])]
        rows = table.get("rows") or []
        if len(headers) < 2:
            continue
        for row in rows:
            if len(row) < 2:
                continue
            term = _clean_markdown(str(row[0]))
            definition = _clean_markdown(str(row[1]))
            tag = _clean_markdown(str(row[2])) if len(row) >= 3 else ""
            if term and definition:
                items.append({"term": term, "definition": definition, "tag": tag})
    return items


def _tables_to_comparison(section: dict[str, Any]) -> dict[str, Any] | None:
    """A 2-column table with exactly 2 rows → CompareCard shape."""
    for table in section.get("tables") or []:
        headers = [h.strip() for h in (table.get("headers") or [])]
        rows = table.get("rows") or []
        if len(headers) == 2 and len(rows) == 2:
            return {
                "kind": "comparison",
                "title": _clean_markdown(section.get("subtitle") or section.get("heading") or ""),
                "left":  {"label": _clean_markdown(str(rows[0][0])), "body": _clean_markdown(str(rows[0][1]))},
                "right": {"label": _clean_markdown(str(rows[1][0])), "body": _clean_markdown(str(rows[1][1]))},
            }
    return None


def package_to_blocks(pkg: dict[str, Any]) -> list[dict[str, Any]]:
    """Deterministic conversion of a localized package to script_writer blocks."""
    blocks: list[dict[str, Any]] = []
    title = _clean_markdown(pkg.get("title") or pkg.get("titleEn") or pkg.get("lessonId") or "")
    summary = _clean_markdown(pkg.get("summary") or "")

    sections = pkg.get("sections") or []
    if not sections:
        raise ValueError("Localized package has no sections — nothing to narrate.")

    first = sections[0]
    hero_body = _paragraph_body(first) or summary or title
    blocks.append({
        "kind": "paragraphs",
        "eyebrow": "HERO",
        "title": title,
        "body": hero_body,
        "bullets": _bullets(first),
    })

    for sec in sections[1:]:
        role = (sec.get("role") or "").strip().lower()
        heading = _clean_markdown(sec.get("subtitle") or sec.get("heading") or "")
        body = _paragraph_body(sec)
        bullets = _bullets(sec)

        if role in QUIZ_ROLES:
            blocks.append({
                "kind": "quiz",
                "title": heading or "Check yourself",
                "body": body,
                "bullets": bullets,
            })
            continue

        if role in GLOSSARY_ROLES:
            items = _tables_to_concepts(sec)
            if items:
                blocks.append({"kind": "concepts", "title": heading, "items": items})
                continue

        cmp_block = _tables_to_comparison(sec) if role in COMPARE_ROLES else None
        if cmp_block:
            blocks.append(cmp_block)
            continue

        blocks.append({
            "kind": "paragraphs",
            "title": heading,
            "body": body,
            "bullets": bullets,
        })
    return blocks


def load_package(package_path: str | Path) -> tuple[dict[str, Any], str, str]:
    """Return (package_dict, package_sha256, content_fingerprint_sha256)."""
    p = Path(package_path)
    raw = p.read_bytes()
    package_sha256 = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw.decode("utf-8"))
    content_fp = hashlib.sha256(
        json.dumps(data.get("sections") or [], ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return data, package_sha256, content_fp


def resolve_next_lesson_title(pkg: dict[str, Any], locale: str, repo_root: Path) -> tuple[str | None, str | None]:
    """Look up the next lesson's title inside the SAME locale package tree.
    Never falls back to another locale. Returns (next_id, next_title)."""
    next_id = pkg.get("nextLessonId")
    if not next_id:
        return None, None
    candidate = repo_root / "src/lib/locale-lessons" / locale / "lessons" / f"{next_id}.json"
    if not candidate.is_file():
        return next_id, None
    try:
        nxt = json.loads(candidate.read_text(encoding="utf-8"))
        return next_id, _clean_markdown(nxt.get("title") or nxt.get("titleEn") or "") or None
    except Exception:
        return next_id, None
