"""Deterministic, idempotent, presentation-only scene-contract normalizer.

Runs immediately after Gemini generation OR cache load, and BEFORE strict
scene_validator, TTS synthesis, Remotion rendering, Bunny upload, or any
mapping commit.

Guarantees:
  * Never modifies `spoken` or `focus` text.
  * Never invents lesson facts — fills presentation-only fields from
    existing scene text, lesson title, next-lesson title, and locale-safe
    generic labels defined centrally in locale_profiles.presentation_defaults.
  * Locale-aware only (en / ar-MSA / ar-Gulf): ScreenshotCard with
    missing/empty visual.src is deterministically rewritten to a
    BulletsCard before strict validation (no invented image URL, no LLM).
  * Legacy Egyptian (locale=None): no ScreenshotCard→BulletsCard conversion.
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

# Locale-aware modes that may convert ScreenshotCard→BulletsCard.
# Legacy Egyptian (locale=None) must never convert or invent URLs.
_LOCALE_AWARE = frozenset({"en", "ar-MSA", "ar-Gulf"})


def _split_sentences(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"[.!?…،؛\n]+", text or "") if p.strip()]


def _str_field(visual: dict, key: str) -> str:
    val = visual.get(key)
    return val.strip() if isinstance(val, str) else ""


def _screenshot_to_bullets(
    visual: dict,
    spoken: str,
    lesson_title: str | None,
    next_lesson_title: str | None,
    defaults: dict,
    fallback_labels: dict,
) -> dict:
    """Build a BulletsCard visual from ScreenshotCard fields + locale defaults.

    Never invents an image URL. Text comes only from existing visual fields,
    spoken text, lesson/next titles, and locale presentation defaults.
    """
    fb_title = fallback_labels.get("default_title") or defaults.get("bullets_title") or ""
    fb_bullet = fallback_labels.get("default_bullet") or defaults.get("default_bullet") or ""
    spoken_parts = _split_sentences(spoken)

    title = (
        _str_field(visual, "title")
        or _str_field(visual, "eyebrow")
        or (lesson_title or "").strip()
        or (spoken_parts[0] if spoken_parts else "")
        or (next_lesson_title or "").strip()
        or defaults.get("bullets_title", "")
        or fb_title
    )
    title = _truncate(title, 40) if title else fb_title

    caption = _str_field(visual, "caption")
    parts = _split_sentences(caption)[:4]
    if not parts:
        parts = spoken_parts[:4]
    if not parts:
        for key in ("title", "eyebrow"):
            t = _str_field(visual, key)
            if t:
                parts = [t]
                break
    if not parts:
        for candidate in (
            (lesson_title or "").strip(),
            (next_lesson_title or "").strip(),
            defaults.get("default_bullet", ""),
            fb_bullet,
        ):
            if candidate:
                parts = [candidate]
                break
    if not parts:
        parts = [fb_bullet or title or "…"]

    if not title:
        title = defaults.get("bullets_title") or fb_title or parts[0]

    return {"title": title, "bullets": parts[:4]}


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


# ---------------------------------------------------------------------------
# Schema-aware CompareCard / ScreenshotCard repairs (deterministic, no LLM).
# Precedence (same-locale only):
#   1) existing side-local / visual field values
#   2) structured alternate visual comparison content already present
#   3) two unambiguous ordered comparison clauses in scene narration
# Derived text is always a direct excerpt/reuse of existing same-locale text.
# Fail closed: leave incomplete fields untouched so scene_validator rejects.
# ---------------------------------------------------------------------------

# Ordered separators for narration comparison clauses (longer / more specific first).
_COMPARE_SEPARATORS = (
    " versus ",
    " compared to ",
    " compared with ",
    " as opposed to ",
    " rather than ",
    " بدلًا من ",
    " بدلا من ",
    " مقابل ",
    " بينما ",
    " في حين ",
    " أما ",
    " vs. ",
    " vs ",
    " VS ",
    " ضد ",
)


def _nonempty_str(val: Any) -> str:
    return val.strip() if isinstance(val, str) and val.strip() else ""


def _label_from_body(body: str) -> str:
    """Concise deterministic excerpt from existing side body — not authored prose."""
    excerpt = _first_words(body, 4)
    return _truncate(excerpt, 40) if excerpt else ""


def _side_dict_from_string(text: str) -> dict[str, str] | None:
    body = _nonempty_str(text)
    if not body:
        return None
    label = _label_from_body(body)
    if not label:
        return None
    return {"label": label, "body": body}


def _coerce_compare_side(raw: Any) -> dict[str, str] | None:
    """Normalize a side value into {label, body} using only side-local content.

    Accepts:
      - already-valid {label, body}
      - partial dict with label and/or body (and optional alternate keys)
      - non-empty string (preserved as body; label derived from that body)
    Returns None when a meaningful complete side cannot be derived.
    """
    if isinstance(raw, str):
        return _side_dict_from_string(raw)
    if not isinstance(raw, dict):
        return None

    label = _nonempty_str(raw.get("label"))
    body = _nonempty_str(raw.get("body"))
    # Alternate side-local fields some generators emit.
    if not label:
        for key in ("heading", "title", "name", "header"):
            label = _nonempty_str(raw.get(key))
            if label:
                break
    if not body:
        for key in ("text", "content", "description", "detail", "value"):
            body = _nonempty_str(raw.get(key))
            if body:
                break

    if label and body:
        return {"label": label, "body": body}
    if body and not label:
        derived = _label_from_body(body)
        if derived:
            return {"label": derived, "body": body}
        return None
    if label and not body:
        # Label alone is not enough to invent a body — fail closed unless
        # an alternate side-local string already supplied body above.
        return None
    return None


def _split_comparison_clauses(spoken: str) -> tuple[str, str] | None:
    """Return two ordered non-empty clauses when narration clearly compares two sides."""
    text = (spoken or "").strip()
    if not text:
        return None
    lower = text
    for sep in _COMPARE_SEPARATORS:
        # Case-insensitive match for Latin separators; Arabic kept exact.
        idx = -1
        if sep.strip().isascii():
            idx = lower.lower().find(sep.lower())
            if idx >= 0:
                left = text[:idx].strip(" \t,;:-–—")
                right = text[idx + len(sep):].strip(" \t,;:-–—")
                if left and right and left != right:
                    return left, right
        else:
            idx = text.find(sep)
            if idx >= 0:
                left = text[:idx].strip(" \t,;:-–—")
                right = text[idx + len(sep):].strip(" \t,;:-–—")
                if left and right and left != right:
                    return left, right
    return None


def _repair_compare_card(
    visual: dict,
    spoken: str,
    repairs: list,
    i: int,
) -> None:
    """Fill missing CompareCard side structure from existing same-locale content only."""
    if _visual_field_missing(visual.get("title")):
        # Prefer existing title-like fields, then first narration sentence.
        title = (
            _nonempty_str(visual.get("heading"))
            or _nonempty_str(visual.get("name"))
            or (_split_sentences(spoken)[0] if _split_sentences(spoken) else "")
        )
        if title:
            visual["title"] = _truncate(title, 60)
            repairs.append({
                "scene_index": i + 1, "card": "CompareCard",
                "field": "visual.title",
                "reason": "derived from existing visual/narration text",
            })

    left_raw = visual.get("left")
    right_raw = visual.get("right")
    left = _coerce_compare_side(left_raw)
    right = _coerce_compare_side(right_raw)

    if left is None or right is None:
        clauses = _split_comparison_clauses(spoken)
        if clauses:
            if left is None:
                left = _side_dict_from_string(clauses[0])
            if right is None:
                right = _side_dict_from_string(clauses[1])

    if left is None or right is None:
        return

    # Do not silently invent identical sides unless the source already matched.
    if left == right:
        sources_identical = False
        if isinstance(left_raw, str) and isinstance(right_raw, str):
            sources_identical = _nonempty_str(left_raw) == _nonempty_str(right_raw)
        elif isinstance(left_raw, dict) and isinstance(right_raw, dict):
            sources_identical = (
                _nonempty_str(left_raw.get("label")) == _nonempty_str(right_raw.get("label"))
                and _nonempty_str(left_raw.get("body")) == _nonempty_str(right_raw.get("body"))
                and (
                    _nonempty_str(left_raw.get("label"))
                    or _nonempty_str(left_raw.get("body"))
                )
            )
        if not sources_identical:
            return

    if left is not None and not _side_is_complete(left_raw):
        visual["left"] = left
        repairs.append({
            "scene_index": i + 1, "card": "CompareCard",
            "field": "visual.left",
            "reason": "completed from side-local or narration comparison text",
        })
    if right is not None and not _side_is_complete(right_raw):
        visual["right"] = right
        repairs.append({
            "scene_index": i + 1, "card": "CompareCard",
            "field": "visual.right",
            "reason": "completed from side-local or narration comparison text",
        })


def _side_is_complete(raw: Any) -> bool:
    if not isinstance(raw, dict):
        return False
    return (
        not _visual_field_missing(raw.get("label"))
        and not _visual_field_missing(raw.get("body"))
    )


def _repair_screenshot_title(
    visual: dict,
    spoken: str,
    repairs: list,
    i: int,
) -> None:
    """Fill missing ScreenshotCard title from existing same-locale content only.

    Precedence: title-like visual field → caption → eyebrow → narration excerpt.
    Never invents a description; never alters visual.src.
    """
    if not _visual_field_missing(visual.get("title")):
        return
    title = (
        _nonempty_str(visual.get("heading"))
        or _nonempty_str(visual.get("name"))
        or _nonempty_str(visual.get("caption"))
        or _nonempty_str(visual.get("eyebrow"))
        or (_split_sentences(spoken)[0] if _split_sentences(spoken) else "")
    )
    title = _truncate(title, 60) if title else ""
    if not title:
        return
    visual["title"] = title
    repairs.append({
        "scene_index": i + 1, "card": "ScreenshotCard",
        "field": "visual.title",
        "reason": "derived from existing caption/eyebrow/narration text",
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

        elif card == "CompareCard":
            _repair_compare_card(v, spoken, repairs, i)

        elif card == "ScreenshotCard":
            # Locale-aware only: missing/empty src → deterministic BulletsCard.
            # Legacy Egyptian (locale=None) must remain byte-equivalent — no
            # conversion, no invented URL, no card rewrite.
            if locale in _LOCALE_AWARE and _visual_field_missing(v.get("src")):
                s["card"] = "BulletsCard"
                s["visual"] = _screenshot_to_bullets(
                    v, spoken, lesson_title, next_lesson_title,
                    defaults, profile.fallback_bullets_labels,
                )
                repairs.append({
                    "scene_index": i + 1,
                    "card": "ScreenshotCard→BulletsCard",
                    "field": "visual.src",
                    "reason": (
                        "missing/empty ScreenshotCard src — "
                        "converted to BulletsCard"
                    ),
                })
            else:
                _repair_screenshot_title(v, spoken, repairs, i)
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
