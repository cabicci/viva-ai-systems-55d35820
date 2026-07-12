"""Fail-closed locale integrity policy for localized video presentation.

Localized presentation locales: ar-MSA, ar-Gulf, en.
Legacy Egyptian (locale=None / ar-EG) is locale-undefined and is NOT stamped;
legacy validation is skipped so output remains byte/behavior equivalent.

Egyptian marker policy (reviewed):
  Fail ar-MSA / ar-Gulf only on high-confidence Egyptian-only markers with
  Arabic token-boundary matching. Do NOT fail on ambiguous shared Arabic
  alone (مش، ليه، أنت، إنت، كمان، خلاص, …).

Rationale: shared colloquial forms appear in Gulf and MSA instructional copy;
rejecting them produces false positives and blocks valid localized packages.
High-confidence Egyptian-only forms below are dialect-specific enough to
treat as integrity failures for MSA/Gulf delivery.
"""
from __future__ import annotations
import re
from typing import Final

LOCALIZED_PRESENTATION_LOCALES: Final[tuple[str, ...]] = (
    "ar-MSA",
    "ar-Gulf",
    "en",
)

# Arabic Unicode including presentation forms (main + supplements).
ARABIC_UNICODE_RE = re.compile(
    r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]"
)

_AR_BOUND_L = r"(?<![\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF])"
_AR_BOUND_R = r"(?![\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF])"


def _mk_ar_marker(word: str) -> re.Pattern[str]:
    return re.compile(_AR_BOUND_L + re.escape(word) + _AR_BOUND_R)


# High-confidence Egyptian-only markers (boundary-aware).
# Documented for integrity gate — do not expand without review.
HIGH_CONFIDENCE_EGYPTIAN_MARKERS: Final[tuple[str, ...]] = (
    "إحنا",
    "عايز",
    "عاوز",
    "دلوقتي",
    "أوي",
    "مفيش",
    "مافيش",
    "بتاع",
    "بتاعة",
    "بتوع",
    "مش هت",
    "هتعمل",
    "هتقدر",
)

# Ambiguous shared Arabic — must NOT fail alone.
AMBIGUOUS_SHARED_ARABIC_ALLOWED: Final[tuple[str, ...]] = (
    "مش",
    "ليه",
    "أنت",
    "إنت",
    "كمان",
    "خلاص",
)

HIGH_CONFIDENCE_EGYPTIAN_PATTERNS: Final[tuple[re.Pattern[str], ...]] = tuple(
    _mk_ar_marker(w) for w in HIGH_CONFIDENCE_EGYPTIAN_MARKERS
)

# Mirrors remotion/src/lesson-cards/presentationChrome.ts (byte-frozen legacy).
PRESENTATION_CHROME: Final[dict[str, dict[str, str]]] = {
    "conceptBadge": {
        "legacy": "مصطلح",
        "ar-MSA": "مصطلح",
        "ar-Gulf": "مصطلح",
        "en": "Term",
    },
    "brandTagline": {
        "legacy": "رحلتك تبدأ من هنا",
        "ar-MSA": "رحلتك تبدأ من هنا",
        "ar-Gulf": "رحلتك تبدأ من هنا",
        "en": "Your journey starts here",
    },
}


def resolve_presentation_chrome(
    key: str,
    locale: str | None,
) -> str:
    """Resolve chrome for locale. None / ar-EG → legacy (unchanged wording)."""
    entry = PRESENTATION_CHROME[key]
    if locale == "en":
        return entry["en"]
    if locale == "ar-MSA":
        return entry["ar-MSA"]
    if locale == "ar-Gulf":
        return entry["ar-Gulf"]
    return entry["legacy"]


def find_arabic_unicode(text: str) -> str | None:
    m = ARABIC_UNICODE_RE.search(text or "")
    return m.group(0) if m else None


def find_egyptian_marker_hits(text: str) -> list[str]:
    hits: list[str] = []
    for word, pat in zip(
        HIGH_CONFIDENCE_EGYPTIAN_MARKERS,
        HIGH_CONFIDENCE_EGYPTIAN_PATTERNS,
        strict=True,
    ):
        if pat.search(text or ""):
            hits.append(word)
    return hits
