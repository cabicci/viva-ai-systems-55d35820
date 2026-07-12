"""Deterministic scene validator for the video pipeline.

Runs immediately after Gemini script generation OR cache load, and BEFORE
TTS synthesis, Remotion rendering, Bunny upload, or any mapping commit.

Checks:
    * non-empty scenes list
    * card in ALLOWED_CARDS
    * accent in ALLOWED_ACCENTS (mint, lavender, peach, yellow, pink, mintDeep)
    * voice in ALLOWED_VOICES (Charon, Aoede)
    * non-empty spoken text
    * complete visual contract per card type (every required field non-empty)
    * locale-specific script leakage with Arabic token boundaries:
        en      → must contain Latin text and NO Arabic-script leakage
        ar-MSA  → must be Arabic; rejects unambiguous Egyptian AND Gulf dialect markers
        ar-Gulf → must be Arabic; rejects unambiguous Egyptian dialect markers
        legacy Egyptian (locale=None) → no locale content check

No network, no paid API, no filesystem writes (except optional evidence file
under /tmp/<composite>/).
"""
from __future__ import annotations
import re
from typing import Any, Iterable

ALLOWED_CARDS = {
    "TitleCard", "ConceptCard", "BigStatCard", "BulletsCard",
    "CompareCard", "CTACard", "ScreenshotCard",
}
ALLOWED_ACCENTS = {"mint", "lavender", "peach", "yellow", "pink", "mintDeep"}
ALLOWED_VOICES = {"Charon", "Aoede"}

# Card → tuple of visual keys that MUST be present and non-empty.
_REQUIRED_VISUAL: dict[str, tuple[str, ...]] = {
    "TitleCard":      ("chip", "title", "highlight", "subtitle"),
    "ConceptCard":    ("term", "definition", "tag"),
    "BigStatCard":    ("intro", "big", "outro"),
    "BulletsCard":    ("title", "bullets"),
    "CompareCard":    ("title", "left", "right"),
    "ScreenshotCard": ("eyebrow", "title", "caption", "src"),
    "CTACard":        ("eyebrow", "title", "highlight", "tagline"),
}

_ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
_LATIN_RE = re.compile(r"[A-Za-z]")

# Arabic token-boundary helpers: match a marker only when it is NOT
# glued to another Arabic letter on either side, so substrings inside
# legitimate MSA words never trigger a false positive.
_AR_BOUND_L = r"(?<![\u0600-\u06FF])"
_AR_BOUND_R = r"(?![\u0600-\u06FF])"


def _mk_ar_marker(word: str) -> re.Pattern[str]:
    return re.compile(_AR_BOUND_L + word + _AR_BOUND_R)


# Unambiguous Egyptian Cairene markers — rejected in BOTH ar-MSA and ar-Gulf.
# NOTE: `يبقى` was removed — valid MSA verb ("remains").
_STRICT_EGYPTIAN_MARKERS = [
    "إيه", "إزاي", "ازاي", "دلوقتي",
    "عايز", "عاوز", "مفيش",
]
# Colloquial connectors historically classified as Egyptian but ALSO in
# common Gulf delivery. Rejected in ar-MSA only (still colloquial there);
# ALLOWED in ar-Gulf.
_SHARED_COLLOQUIAL_MARKERS = [
    "علشان", "عشان",
]
# Gulf-only markers (rejected in MSA; allowed in ar-Gulf).
# NOTE: `أبي` was removed — collides with valid MSA "my father".
# `أبغى` is retained as the unambiguous Gulf variant.
_GULF_MARKERS = [
    "وش", "ليش", "أبغى", "الحين", "شلون",
]

_STRICT_EGY_PATTERNS = [_mk_ar_marker(w) for w in _STRICT_EGYPTIAN_MARKERS]
_SHARED_COLLOQUIAL_PATTERNS = [_mk_ar_marker(w) for w in _SHARED_COLLOQUIAL_MARKERS]
_GULF_PATTERNS = [_mk_ar_marker(w) for w in _GULF_MARKERS]
# Back-compat aggregate (unused by validator itself; kept for external readers).
_EGY_PATTERNS = _STRICT_EGY_PATTERNS + _SHARED_COLLOQUIAL_PATTERNS


def _walk_strings(value: Any, out: list[str]) -> None:
    if isinstance(value, str):
        out.append(value)
    elif isinstance(value, dict):
        for v in value.values():
            _walk_strings(v, out)
    elif isinstance(value, list):
        for v in value:
            _walk_strings(v, out)


def _learner_text(scene: dict) -> str:
    parts: list[str] = []
    for k in ("spoken", "focus"):
        v = scene.get(k)
        if isinstance(v, str):
            parts.append(v)
    _walk_strings(scene.get("visual") or {}, parts)
    return "\n".join(p for p in parts if p)


def _find_marker_hits(text: str, patterns: Iterable[re.Pattern[str]]) -> list[str]:
    hits: list[str] = []
    for pat in patterns:
        if pat.search(text):
            hits.append(pat.pattern)
    return hits


def _visual_field_missing(val: Any) -> bool:
    if val is None:
        return True
    if isinstance(val, str) and not val.strip():
        return True
    if isinstance(val, (list, dict)) and not val:
        return True
    return False


def validate_scenes(scenes: Any, locale: str | None = None) -> list[str]:
    """Return list of violations. Empty list = accepted. Never raises."""
    errors: list[str] = []
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes list is empty or not a list")
        return errors

    for i, s in enumerate(scenes, 1):
        if not isinstance(s, dict):
            errors.append(f"Scene {i}: not an object")
            continue

        card = s.get("card")
        if card not in ALLOWED_CARDS:
            errors.append(f"Scene {i}: unsupported card {card!r}")

        accent = s.get("accent")
        if accent is None or (isinstance(accent, str) and not accent.strip()):
            errors.append(f"Scene {i}: accent is missing/empty")
        elif accent not in ALLOWED_ACCENTS:
            errors.append(
                f"Scene {i}: accent {accent!r} not in {sorted(ALLOWED_ACCENTS)}"
            )

        voice = s.get("voice")
        if voice not in ALLOWED_VOICES:
            errors.append(
                f"Scene {i}: voice {voice!r} not in {sorted(ALLOWED_VOICES)}"
            )

        spoken = s.get("spoken")
        if not isinstance(spoken, str) or not spoken.strip():
            errors.append(f"Scene {i}: spoken text is empty")

        visual = s.get("visual")
        if not isinstance(visual, dict) or not visual:
            errors.append(f"Scene {i}: visual is missing or empty")
        elif isinstance(card, str) and card in _REQUIRED_VISUAL:
            for key in _REQUIRED_VISUAL[card]:
                if _visual_field_missing(visual.get(key)):
                    errors.append(
                        f"Scene {i} [{card}]: visual.{key} missing/empty"
                    )
            if card == "CompareCard":
                for side in ("left", "right"):
                    sv = visual.get(side)
                    if not isinstance(sv, dict) \
                       or _visual_field_missing(sv.get("label")) \
                       or _visual_field_missing(sv.get("body")):
                        errors.append(
                            f"Scene {i} [CompareCard]: visual.{side} needs label+body"
                        )
            if card == "BulletsCard":
                bl = visual.get("bullets")
                if not isinstance(bl, list) or not any(
                    isinstance(b, str) and b.strip() for b in bl
                ):
                    errors.append(
                        f"Scene {i} [BulletsCard]: bullets must be non-empty list"
                    )

        text = _learner_text(s)
        if locale == "en":
            if _ARABIC_RE.search(text):
                sample = _ARABIC_RE.search(text).group(0)
                errors.append(
                    f"Scene {i} [en]: Arabic-script leakage detected ({sample!r})"
                )
            if not _LATIN_RE.search(text):
                errors.append(f"Scene {i} [en]: no Latin/English text detected")
        elif locale == "ar-MSA":
            if text and not _ARABIC_RE.search(text):
                errors.append(f"Scene {i} [ar-MSA]: no Arabic text detected")
            hits = _find_marker_hits(text, _EGY_PATTERNS + _GULF_PATTERNS)
            if hits:
                errors.append(
                    f"Scene {i} [ar-MSA]: dialect markers not allowed in MSA: {hits}"
                )
        elif locale == "ar-Gulf":
            if text and not _ARABIC_RE.search(text):
                errors.append(f"Scene {i} [ar-Gulf]: no Arabic text detected")
            hits = _find_marker_hits(text, _EGY_PATTERNS)
            if hits:
                errors.append(
                    f"Scene {i} [ar-Gulf]: Egyptian dialect markers not allowed: {hits}"
                )
        # locale is None (legacy Egyptian) → no locale content check.
    return errors


def write_locale_validation_evidence(
    scenes: Any,
    locale: str | None,
    composite_key: str,
    source: str,
) -> dict:
    """Write /tmp/<composite>/locale-validation.json and return the record.
    `source` describes where scenes came from: 'gemini' | 'cache'."""
    import json
    import os
    violations = validate_scenes(scenes, locale=locale)
    record = {
        "composite_key": composite_key,
        "locale": locale,
        "source": source,
        "scene_count": len(scenes) if isinstance(scenes, list) else 0,
        "ok": not violations,
        "violations": violations,
    }
    out_dir = f"/tmp/{composite_key}"
    try:
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, "locale-validation.json"), "w") as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
    except OSError:
        pass
    return record
