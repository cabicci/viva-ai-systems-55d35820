"""Deterministic, idempotent, presentation-only scene-contract normalizer.

Runs immediately after Gemini generation OR cache load, and BEFORE strict
scene_validator, TTS synthesis, Remotion rendering, Bunny upload, or any
mapping commit.

Guarantees:
  * Never modifies `spoken` or `focus` text.
  * Never invents lesson facts — fills presentation-only fields from
    existing scene text, lesson title, next-lesson title, and locale-safe
    generic labels defined centrally in locale_profiles.presentation_defaults.
  * Assigns a deterministic accent (by scene index) ONLY when the accent
    is missing or not in the allowed set.
  * Never touches `voice` — unsupported voices are left for strict validator.
  * Every already-valid field is preserved byte-equivalent.
  * Idempotent: normalize(normalize(x)) == normalize(x), zero repairs on
    the second pass.

No network, no paid API. Writes evidence at /tmp/<composite>/scene-normalization.json.
"""
from __future__ import annotations
import copy
import json
import os
import re
from typing import Any

try:
    from .locale_profiles import get_profile
    from .scene_validator import ALLOWED_ACCENTS, _visual_field_missing
except ImportError:  # sibling sys.path import
    from locale_profiles import get_profile
    from scene_validator import ALLOWED_ACCENTS, _visual_field_missing


# Deterministic accent rotation (matches the six ALLOWED_ACCENTS).
_ACCENT_CYCLE = ["mint", "lavender", "peach", "yellow", "pink", "mintDeep"]


def _split_sentences(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"[.!?…،؛\n]+", text or "") if p.strip()]


def _truncate(text: str, n: int) -> str:
    text = (text or "").strip()
    return text if len(text) <= n else text[:n].rstrip() + "…"


def _first_words(text: str, n: int) -> str:
    words = (text or "").strip().split()
    return " ".join(words[:n])


def _fill(visual: dict, key: str, value: str, repairs: list, i: int,
          card: str) -> None:
    if _visual_field_missing(visual.get(key)):
        v = (value or "").strip()
        if not v:
            return
        visual[key] = v
        repairs.append({
            "scene_index": i + 1, "card": card,
            "field": f"visual.{key}", "reason": "filled locale-safe default",
        })


def normalize_scenes(
    scenes: Any,
    locale: str | None = None,
    lesson_title: str | None = None,
    next_lesson_title: str | None = None,
) -> tuple[list, list[dict]]:
    """Return (normalized_scenes, repairs)."""
    profile = get_profile(locale)
    defaults = profile.presentation_defaults
    repairs: list[dict] = []
    if not isinstance(scenes, list):
        return scenes, repairs

    out: list = []
    for i, orig in enumerate(scenes):
        if not isinstance(orig, dict):
            out.append(orig)
            continue
        s = copy.deepcopy(orig)

        # ---- accent ----
        acc = s.get("accent")
        if not isinstance(acc, str) or acc not in ALLOWED_ACCENTS:
            new_acc = _ACCENT_CYCLE[i % len(_ACCENT_CYCLE)]
            repairs.append({
                "scene_index": i + 1, "card": s.get("card"),
                "field": "accent",
                "reason": f"invalid/missing → {new_acc!r}",
            })
            s["accent"] = new_acc

        # ---- visual container ----
        if not isinstance(s.get("visual"), dict):
            s["visual"] = {}
            repairs.append({
                "scene_index": i + 1, "card": s.get("card"),
                "field": "visual", "reason": "created empty visual dict",
            })

        card = s.get("card")
        v = s["visual"]
        spoken = s.get("spoken") if isinstance(s.get("spoken"), str) else ""

        if card == "TitleCard":
            _fill(v, "chip", defaults["title_chip"], repairs, i, card)
            _fill(v, "title",
                  (lesson_title or _truncate(spoken, 40) or defaults["title"]),
                  repairs, i, card)
            _fill(v, "highlight",
                  (_first_words(v.get("title", ""), 3) or defaults["highlight"]),
                  repairs, i, card)
            _fill(v, "subtitle",
                  (_truncate(spoken, 120) or defaults["subtitle"]),
                  repairs, i, card)

        elif card == "ConceptCard":
            _fill(v, "tag", defaults["concept_tag"], repairs, i, card)

        elif card == "BulletsCard":
            _fill(v, "title",
                  (_truncate(_split_sentences(spoken)[0] if _split_sentences(spoken) else "", 40)
                   or defaults["bullets_title"]),
                  repairs, i, card)
            bl = v.get("bullets")
            if not isinstance(bl, list) or not any(
                isinstance(b, str) and b.strip() for b in bl
            ):
                parts = _split_sentences(spoken)[:4]
                if not parts:
                    parts = [defaults["default_bullet"]]
                v["bullets"] = parts
                repairs.append({
                    "scene_index": i + 1, "card": card,
                    "field": "visual.bullets",
                    "reason": "derived from spoken text (or locale default)",
                })

        elif card == "ScreenshotCard":
            _fill(v, "eyebrow", defaults["screenshot_eyebrow"],
                  repairs, i, card)

        elif card == "CTACard":
            _fill(v, "eyebrow", defaults["cta_eyebrow"], repairs, i, card)
            _fill(v, "title",
                  (next_lesson_title or defaults["cta_title"]),
                  repairs, i, card)
            _fill(v, "highlight",
                  (_first_words(next_lesson_title or "", 3)
                   or defaults["cta_highlight"]),
                  repairs, i, card)
            _fill(v, "tagline", defaults["cta_tagline"], repairs, i, card)

        out.append(s)
    return out, repairs


def write_normalization_evidence(
    composite_key: str,
    locale: str | None,
    source: str,
    repairs: list[dict],
    scene_count: int,
) -> dict:
    record = {
        "composite_key": composite_key,
        "locale": locale,
        "source": source,
        "scene_count": scene_count,
        "repair_count": len(repairs),
        "repairs": repairs,
    }
    out_dir = f"/tmp/{composite_key}"
    try:
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "scene-normalization.json"), "w") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
    except OSError:
        pass
    return record
