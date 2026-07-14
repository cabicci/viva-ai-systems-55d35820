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

# Very-formal MSA-only markers that would be out-of-place in Gulf narration.
MSA_ONLY_MARKERS = (
    "إذاً بناءً على ما تقدم", "وعليه فإنه", "لا سيما", "ومن ثم فإن",
)

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


def _contains_any(text: str, needles: Iterable[str]) -> list[str]:
    t = text.lower()
    return [n for n in needles if n.lower() in t]


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
            v.append("ar-Gulf cell missing arabic script")
        hits = _contains_any(spoken, EGYPTIAN_MARKERS)
        if hits:
            v.append(f"ar-Gulf cell contains egyptian markers: {hits[:3]}")
        hits_msa = _contains_any(spoken, MSA_ONLY_MARKERS)
        if hits_msa:
            v.append(f"ar-Gulf cell contains msa-only formal markers: {hits_msa[:2]}")
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
