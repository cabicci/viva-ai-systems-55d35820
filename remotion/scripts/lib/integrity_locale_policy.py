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

# Gulf colloquial markers rejected in ar-MSA only (boundary-aware).
GULF_COLLOQUIAL_MARKERS: Final[tuple[str, ...]] = (
    "وش",
    "ليش",
    "أبغى",
    "الحين",
    "شلون",
)

GULF_COLLOQUIAL_PATTERNS: Final[tuple[re.Pattern[str], ...]] = tuple(
    _mk_ar_marker(w) for w in GULF_COLLOQUIAL_MARKERS
)

# English learner-facing Arabizi / dialect transliterations (token-bounded).
EN_TRANSLITERATION_MARKERS: Final[tuple[str, ...]] = (
    "ezzay",
    "ezay",
    "delwa2ty",
    "3alashan",
    "yalla",
    "shlon",
    "shloon",
    "wayed",
    "waid",
)

# Shared Arabizi/transliteration markers rejected in ar-MSA and ar-Gulf.
ARABIZI_MARKERS: Final[tuple[str, ...]] = EN_TRANSLITERATION_MARKERS

_LATIN_TOKEN_RE = re.compile(r"[A-Za-z0-9]+")

# Technical English tokens allowed without breaking Arabic dominance checks.
_TECHNICAL_ALLOWLIST: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"^GPT-?\d+$", re.IGNORECASE),
    re.compile(r"^v\d+(?:\.\d+)?$", re.IGNORECASE),
    re.compile(r"^API$", re.IGNORECASE),
    re.compile(r"^AI$", re.IGNORECASE),
    re.compile(r"^ChatGPT$", re.IGNORECASE),
    re.compile(r"^OpenAI$", re.IGNORECASE),
)

_EN_TRANSLITERATION_PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = tuple(
    (
        marker,
        re.compile(
            r"(?<![A-Za-z0-9])"
            + re.escape(marker)
            + r"(?![A-Za-z0-9])",
            re.IGNORECASE,
        ),
    )
    for marker in EN_TRANSLITERATION_MARKERS
)

_ARABIZI_PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = _EN_TRANSLITERATION_PATTERNS

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


def find_gulf_colloquial_hits(text: str) -> list[str]:
    hits: list[str] = []
    for word, pat in zip(
        GULF_COLLOQUIAL_MARKERS,
        GULF_COLLOQUIAL_PATTERNS,
        strict=True,
    ):
        if pat.search(text or ""):
            hits.append(word)
    return hits


def find_en_transliteration_hits(text: str) -> list[str]:
    hits: list[str] = []
    for marker, pat in _EN_TRANSLITERATION_PATTERNS:
        if pat.search(text or ""):
            hits.append(marker)
    return hits


def find_arabizi_hits(text: str) -> list[str]:
    hits: list[str] = []
    for marker, pat in _ARABIZI_PATTERNS:
        if pat.search(text or ""):
            hits.append(marker)
    return hits


def is_allowed_technical_token(token: str) -> bool:
    return any(p.match(token) for p in _TECHNICAL_ALLOWLIST)


def _latin_letters_excluding_technical(text: str) -> int:
    count = 0
    for token in _LATIN_TOKEN_RE.findall(text or ""):
        if is_allowed_technical_token(token):
            continue
        count += sum(1 for ch in token if ch.isalpha())
    return count


def arabic_script_dominant(text: str) -> bool:
    """True when Arabic script letters dominate Latin letters (technical terms excluded)."""
    arabic = len(ARABIC_UNICODE_RE.findall(text or ""))
    latin = _latin_letters_excluding_technical(text or "")
    if arabic == 0:
        return False
    return arabic > latin
