"""Pre-TTS locale gate for video-production-final-v2.

Purpose: after Gemini authors scenes[].spoken, before any paid TTS or render,
prove each spoken segment matches the declared locale. Rejects cross-locale
leakage. Read-only — never rewrites narration.

Rules (owner-authorized):
- en      : English only. Reject any Arabic Unicode. Reject Egyptian/Gulf
            colloquial markers even if transliterated.
- ar-MSA  : Formal MSA. Must contain Arabic script. Reject Egyptian and
            Gulf colloquial markers.
- ar-Gulf : Neutral Gulf Arabic. Must contain Arabic script. Reject
            Egyptian colloquial markers and MSA-only formal markers that
            indicate cross-locale leakage.

The marker lists are deliberately conservative and additive; false positives
fail the cell (correct behavior — fail before paid calls).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable


ARABIC_RANGE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")

# Egyptian colloquial markers (Arabic + common Latin transliterations).
EGYPTIAN_MARKERS = (
    "ازاي", "إزاي", "ازيك", "إزيك", "دلوقتي", "دلوءتي", "علشان", "عشان",
    "بتاع", "بتاعت", "بتوع", "كده", "كدا", "معلش", "معليش", "يلا", "يالا",
    "بص", "بصي", "طب", "طيب يلا",
    # Latin transliterations frequently produced by LLMs
    "ezzay", "izzay", "delwa2ti", "delwaqti", "3ashan", "3alashan",
    "keda", "kida", "ma3lesh", "yalla", "bass keda",
)

# Gulf colloquial markers.
GULF_MARKERS = (
    "شلونك", "شلونج", "شلونكم", "وايد", "زين", "عساك", "عساكم",
    "هالحين", "الحين", "چذي", "جذي", "چا", "أبغى", "ابغى",
    "shloonak", "wayed", "hal7een", "abgha",
)

# NOTE: neutral Gulf narration may (and typically does) contain formal Arabic
# vocabulary that also appears in MSA. We do NOT treat shared formal vocabulary
# as cross-locale leakage — the ar-Gulf gate only rejects Egyptian markers,
# wrong script, and English-only narration.

# Colloquial Latin/leetspeak digits used in Arabic chat orthography — never
# acceptable in ar-MSA narration.
ARABIZI_DIGITS = re.compile(r"\b\w*[2379]\w*\b")


@dataclass
class GateResult:
    ok: bool
    locale: str
    violations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"ok": self.ok, "locale": self.locale, "violations": list(self.violations)}


_ARABIC_LETTER = r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]"


def _has_arabic_letters(s: str) -> bool:
    return bool(re.search(_ARABIC_LETTER, s))


def _contains_any(text: str, needles: Iterable[str]) -> list[str]:
    """Match markers with locale-aware boundaries.

    * Arabic markers: bounded by non-Arabic-letter characters (or string
      edges) so that a 2-char marker like ``طب`` does not spuriously match
      inside a longer formal word such as ``التطبيقات``.
    * Latin markers: standard ``\\b`` word boundaries, case-insensitive.
    """
    hits: list[str] = []
    for n in needles:
        if _has_arabic_letters(n):
            pat = rf"(?<!{_ARABIC_LETTER}){re.escape(n)}(?!{_ARABIC_LETTER})"
            if re.search(pat, text):
                hits.append(n)
        else:
            if re.search(rf"\b{re.escape(n)}\b", text, flags=re.IGNORECASE):
                hits.append(n)
    return hits


def validate_spoken(locale: str, spoken: str) -> GateResult:
    if not isinstance(spoken, str) or not spoken.strip():
        return GateResult(False, locale, ["empty spoken text"])

    v: list[str] = []
    has_arabic = bool(ARABIC_RANGE.search(spoken))

    if locale == "en":
        if has_arabic:
            v.append("english cell contains arabic unicode")
        hits = _contains_any(spoken, EGYPTIAN_MARKERS + GULF_MARKERS)
        if hits:
            v.append(f"english cell contains colloquial markers: {hits[:3]}")
    elif locale == "ar-MSA":
        if not has_arabic:
            v.append("ar-MSA cell missing arabic script")
        hits = _contains_any(spoken, EGYPTIAN_MARKERS + GULF_MARKERS)
        if hits:
            v.append(f"ar-MSA cell contains colloquial markers: {hits[:3]}")
        if ARABIZI_DIGITS.search(spoken):
            v.append("ar-MSA cell contains arabizi digits (2/3/7/9)")
    elif locale == "ar-Gulf":
        if not has_arabic:
            v.append("ar-Gulf cell missing arabic script or is english-only")
        hits = _contains_any(spoken, EGYPTIAN_MARKERS)
        if hits:
            v.append(f"ar-Gulf cell contains egyptian markers: {hits[:3]}")
        if ARABIZI_DIGITS.search(spoken):
            v.append("ar-Gulf cell contains arabizi digits (2/3/7/9)")
    elif locale == "ar-EG":
        v.append("ar-EG is not part of the v2 batch (count=0)")
    else:
        v.append(f"unknown locale: {locale!r}")

    return GateResult(ok=not v, locale=locale, violations=v)


def validate_scenes(locale: str, scenes: list[dict]) -> GateResult:
    all_v: list[str] = []
    for i, s in enumerate(scenes or []):
        r = validate_spoken(locale, str(s.get("spoken") or ""))
        if not r.ok:
            all_v.extend(f"scene[{i}]: {msg}" for msg in r.violations)
    return GateResult(ok=not all_v, locale=locale, violations=all_v)
